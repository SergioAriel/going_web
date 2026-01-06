'use server'

import { Address, CartItem, GoingNetworkShipment, SelfDeliveryShipment, Shipment, GeocodedAddress, ShipmentInDb } from '@/interfaces'
import client from "../mongodb";
import { decryptObject, encryptObject } from '../encryption';
import { ObjectId } from 'mongodb';
import { getOsrmDistance } from '@/lib/osrm';

type Buyer = {
    walletAddress: string;
    _id?: string;
    address: Address;
    email?: string;
    phone?: string;
};

import { ensureGeocodedAndIndexed } from '../geolocation';
import { Resend } from 'resend';

const resend = new Resend(process.env.RESEND_API_KEY);

// Helper to convert a Shipment to a ShipmentInDb (with encrypted delivery address)
const toShipmentInDb = (shipment: Shipment): Omit<ShipmentInDb, '_id'> => {
    const { deliveryAddress, ...rest } = shipment;
    const encryptedDeliveryAddress = encryptObject(deliveryAddress);
    return {
        ...rest,
        encryptedDeliveryAddress,
    };
};

// Helper to convert a ShipmentInDb to a Shipment for the client (with decrypted delivery address)
const toAppShipment = (shipmentInDb: ShipmentInDb): Shipment => {
    const { encryptedDeliveryAddress, ...rest } = shipmentInDb;
    const deliveryAddress = decryptObject(encryptedDeliveryAddress);
    return { ...rest, _id: rest._id.toString(), deliveryAddress } as Shipment;
};

// Pricing Constants (Must match frontend for consistency, but backend is source of truth)
import { getPricingForAddress } from '@/lib/pricing/service';
import { getCurrencies } from "./cryptocurrencies";

// ... (previous imports)

// REMOVED HARDCODED PRICING CONSTANT

// Helper to send QR Code Email
const sendQrCodeEmail = async (shipmentId: string, recipientEmail: string) => {
    if (!recipientEmail || recipientEmail.includes('example.com')) return;

    // Fallback to localhost if env var is missing (common in dev)
    const baseUrl = process.env.NEXT_PUBLIC_BASE_URL || 'http://localhost:3000';
    const trackingUrl = `${baseUrl}/tracking/${shipmentId}`;

    // FALLBACK: If no credentials, log to console for development
    if (!process.env.GMAIL_USER || !process.env.GMAIL_APP_PASSWORD) {
        console.log('⚠️  EMAIL CREDENTIALS MISSING - SIMULATING EMAIL SEND ⚠️');
        console.log(`To: ${recipientEmail}`);
        console.log(`Subject: Tu envío de Going está en camino 🚚`);
        console.log(`Tracking Link: ${trackingUrl}`);
        console.log('---------------------------------------------------------');
        return; // Return early, success implied
    }

    try {
        const nodemailer = await import('nodemailer');
        // Import React Email related utilities dynamically to avoid build issues if not used elsewhere
        const { render } = await import('@react-email/render');
        const { ShipmentNotification } = await import('../../emails/ShipmentNotification');

        const emailHtml = await render(
            ShipmentNotification({
                shipmentId,
                trackingUrl,
                baseUrl
            })
        );

        const transporter = nodemailer.createTransport({
            service: 'gmail',
            auth: {
                user: process.env.GMAIL_USER,
                pass: process.env.GMAIL_APP_PASSWORD,
            },
        });

        const info = await transporter.sendMail({
            from: `"Going App" <${process.env.GMAIL_USER}>`,
            to: recipientEmail,
            subject: 'Tu envío de Going está en camino 🚚',
            html: emailHtml,
        });

        console.log('Message sent: %s', info.messageId);
    } catch (error) {
        console.error("Failed to send QR email:", error);
        // Fallback log on error
        console.log('⚠️  EMAIL SEND FAILED - SIMULATING INSTEAD ⚠️');
        console.log(`To: ${recipientEmail}`);
        console.log(`Tracking Link: ${trackingUrl}`);
    }
};

import { latLngToCell } from "h3-js";

// Helper to generate Short Code (e.g., "AF-49")
const generateShortCode = () => {
    const letters = "ABCDEFGHIJKLMNOPQRSTUVWXYZ";
    const numbers = "0123456789";
    const l1 = letters.charAt(Math.floor(Math.random() * letters.length));
    const l2 = letters.charAt(Math.floor(Math.random() * letters.length));
    const n1 = numbers.charAt(Math.floor(Math.random() * numbers.length));
    const n2 = numbers.charAt(Math.floor(Math.random() * numbers.length));
    return `${l1}${l2}-${n1}${n2}`;
};

// Helper to generate Delivery Token (PIN)
const generateDeliveryToken = () => {
    return Math.floor(1000 + Math.random() * 9000).toString(); // 1000-9999
};

// Helper functions (placeholder if needed, or already defined)

export const createDirectShipments = async (shipmentsData: any[], userId: string, transactionSignature: string, fullPickupAddress: Address) => {
    const db = client.db("going");
    const createdShipments: GoingNetworkShipment[] = [];

    for (const data of shipmentsData) {
        // Validation: Ensure we have coordinates. 
        // If "Calculate Costs" was skipped in frontend, these might be missing.
        if (!data.deliveryLat || !data.deliveryLon || isNaN(data.deliveryLat) || isNaN(data.deliveryLon)) {
            throw new Error(`Missing coordinates for address: ${data.deliveryAddress || 'Unknown'}. Please calculate costs first.`);
        }

        // 1. Calculate Real Distance with OSRM
        const distanceKm = await getOsrmDistance(
            { lat: fullPickupAddress.lat!, lon: fullPickupAddress.lon! },
            { lat: data.deliveryLat, lon: data.deliveryLon }
        );

        // 2. Determine Pricing Rule based on Pickup Address (Async DB call)
        const pricingRule = await getPricingForAddress(fullPickupAddress as any);

        // Determine Vehicle Tier (Moto vs Van) based on dimensions
        const isVan = data.weight > 15 || data.volume > 0.1; // 15kg or 100L limit for Moto
        let ruleBaseFee = 0;
        let ruleBaseDist = 0;
        let ruleCostKm = 0;
        let ruleBaseWeight = 0;
        let ruleCostKg = 0;

        if (isVan) {
            const v = pricingRule.vehicles.van;
            ruleBaseDist = v.baseDistanceKm;
            ruleCostKm = v.costPerKm;
            ruleBaseWeight = v.baseWeightKg;
            ruleCostKg = v.costPerKg;

            // Select Van Tier (Small / Medium / Large)
            if (data.weight > 200 || data.volume > 1.5) {
                ruleBaseFee = v.baseFeeLarge; // Heavy
            } else if (data.weight > 50 || data.volume > 0.5) {
                ruleBaseFee = v.baseFeeMedium; // Medium
            } else {
                ruleBaseFee = v.baseFeeSmall; // Common (Kangoo)
            }
        } else {
            const m = pricingRule.vehicles.motorcycle;
            ruleBaseFee = m.baseFee;
            ruleBaseDist = m.baseDistanceKm;
            ruleCostKm = m.costPerKm;
            ruleBaseWeight = m.baseWeightKg;
            ruleCostKg = m.costPerKg;
        }

        // 3. Calculate Final Price
        let distCost = 0;
        if (distanceKm > ruleBaseDist) {
            distCost = (distanceKm - ruleBaseDist) * ruleCostKm;
        }

        let weightCost = 0;
        if (data.weight > ruleBaseWeight) {
            weightCost = (data.weight - ruleBaseWeight) * ruleCostKg;
        }

        const finalPrice = ruleBaseFee + distCost + weightCost;

        // FUTURE: Store currency in the shipment object too


        // 3. Calculate H3 Indices for Delivery
        const deliveryH3 = latLngToCell(data.deliveryLat, data.deliveryLon, 9);
        const deliveryH3L6 = latLngToCell(data.deliveryLat, data.deliveryLon, 6);
        const deliveryH3L8 = latLngToCell(data.deliveryLat, data.deliveryLon, 8);

        // Calculate Package Count based on data (Business Manual Entry usually is 1 package unless specified)
        const packageCount = data.packageCount || 1;
        const shortCode = generateShortCode();
        const deliveryToken = generateDeliveryToken();

        // 4. Create Shipment Object
        const shipment: GoingNetworkShipment = {
            orderId: `ORD-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`,
            sellerId: userId,
            buyerId: 'DIRECT_CUSTOMER',
            shippingType: 'going_network',
            deliveryAddress: {
                ...(data.deliveryAddressObj || {}),
                street: data.deliveryAddressObj?.street || data.deliveryAddress,
                city: data.deliveryAddressObj?.city || 'Unknown',
                country: data.deliveryAddressObj?.country || 'Unknown',
                lat: data.deliveryLat,
                lon: data.deliveryLon,
                h3Index: deliveryH3,
                h3IndexL6: deliveryH3L6,
                h3IndexL8: deliveryH3L8,
                fullName: data.recipientName || data.deliveryAddressObj?.fullName || 'Direct Customer',
                state: data.deliveryAddressObj?.state || '',
                zipCode: data.deliveryAddressObj?.zipCode || ''
            },
            pickupAddress: fullPickupAddress as GeocodedAddress,
            recipientEmail: data.recipientEmail || data.contactEmail || 'user@example.com',
            items: [{
                _id: new ObjectId().toString(),
                name: data.description || 'Paquete General', // Use provided description or default
                quantity: 1,
                weight_kg: data.weight,
                volume_m3: data.volume,
                price: 0,
                mainImage: '',
                addressWallet: '',
                currency: 'USD',
                seller: userId,
                shippingType: 'going_network',
                pickupAddress: fullPickupAddress as GeocodedAddress
            }],
            createdAt: new Date(),
            updatedAt: new Date(),
            status: 'ready_to_ship',
            price: finalPrice,
            // @ts-ignore - Adding transactionSignature dynamically if interface doesn't support it yet
            transactionSignature: transactionSignature,
            shortCode,
            packageCount,
            deliveryToken
        };

        createdShipments.push(shipment);

        // REMOVED duplicate sendQrCodeEmail call to prevent double sending.
        // The email is sent after the loop once the DB ID is generated.
    }

    if (createdShipments.length > 0) {
        const shipmentsToInsert = createdShipments.map(s => toShipmentInDb(s as unknown as Shipment));
        const result = await db.collection("shipments").insertMany(shipmentsToInsert);

        // Populate IDs back to createdShipments for the return value
        Object.keys(result.insertedIds).forEach((index: any) => {
            // @ts-ignore
            if (createdShipments[index]) {
                // @ts-ignore
                createdShipments[index]._id = result.insertedIds[index].toString();
            }
        });

        // Send Emails Async
        createdShipments.forEach(s => {
            if (s.recipientEmail) {
                // @ts-ignore
                sendQrCodeEmail(s._id!.toString(), s.recipientEmail).catch(e => console.error(e));
            }
        });
    }

    // Return useful details for the frontend (WhatsApp sharing)
    const baseUrl = process.env.NEXT_PUBLIC_BASE_URL || 'http://localhost:3000';
    const shipmentDetails = createdShipments.map(s => ({
        // @ts-ignore
        id: s._id ? s._id.toString() : 'unknown',
        recipientName: s.deliveryAddress.fullName || 'Cliente',
        recipientEmail: s.recipientEmail,
        trackingUrl: `${baseUrl}/tracking/${(s as any)._id}`
    }));

    return {
        success: true,
        count: createdShipments.length,
        shipments: shipmentDetails
    };
};

// ------------------------------------------------------------------
// CREATE REAL SHIPMENTS (From Checkout)
// ------------------------------------------------------------------
export async function createRealShipments(orderId: string, items: CartItem[], buyer: { walletAddress: string, _id: string, address: Address, email: string, phone: string }, shipmentsData: any[]) {
    const db = client.db("going");

    try {
        // 1. Geocode the buyer's address once for all shipments
        const geocodedDeliveryAddress = await ensureGeocodedAndIndexed(buyer.address);

        // 2. Group items by Seller + ShippingType + PickupLocation (H3 Index)
        const divisionShipments = Object.groupBy(items, item => {
            const shippingType = item.shippingType || 'going_network';
            if (!item.seller) throw new Error(`Producto '${item.name}' (ID: ${item._id}) no tiene vendedor asignado.`);

            let pickupAddress = item.pickupAddress;
            if (!pickupAddress) {
                console.warn(`WARN: Product ${item.name} (${item._id}) missing pickupAddress. Using default fallback.`);
                pickupAddress = {
                    street: 'Av. Corrientes 1066', city: 'Buenos Aires', country: 'Argentina',
                    state: 'CABA', zipCode: 'C1043', lat: -34.6037, lon: -58.3816,
                    h3Index: '89c2e317437ffff', h3IndexL6: '86c2e3177ffffff', h3IndexL8: '88c2e31743fffff'
                };
                item.pickupAddress = pickupAddress;
                item.shippingType = shippingType;
            }

            const h3Index = pickupAddress.h3Index || 'unknown';
            return `${shippingType}-${item.seller}-${h3Index}`;
        });

        const cleanShipments: Shipment[] = Object.entries(divisionShipments)
            .map(([key, shipmentItems]) => {
                const [shippingType, sellerId] = key.split("-");
                if (!shipmentItems || shipmentItems.length === 0) return undefined;

                const pickupAddress = shipmentItems[0].pickupAddress as GeocodedAddress;
                const packageCount = shipmentItems.reduce((acc, item) => acc + item.quantity, 0);
                const shortCode = generateShortCode();
                const deliveryToken = generateDeliveryToken();

                if (shippingType === 'going_network') {
                    const shipment: GoingNetworkShipment = {
                        orderId, sellerId, buyerId: buyer._id!, shippingType: 'going_network',
                        deliveryAddress: geocodedDeliveryAddress, pickupAddress: pickupAddress,
                        recipientEmail: buyer.email || 'user@example.com', items: shipmentItems,
                        createdAt: new Date(), updatedAt: new Date(), status: 'pending',
                        shortCode, packageCount, deliveryToken,
                    };
                    if (buyer.email) sendQrCodeEmail(orderId, buyer.email).catch(e => console.error(e));
                    return shipment;
                } else if (shippingType === 'self_delivery') {
                    return {
                        orderId, sellerId, buyerId: buyer._id!, shippingType: 'self_delivery',
                        deliveryAddress: geocodedDeliveryAddress, pickupAddress: pickupAddress,
                        items: shipmentItems, createdAt: new Date(), updatedAt: new Date(),
                        status: 'shipped_by_seller',
                    };
                }
                return undefined;
            })
            .filter((shipment): shipment is Shipment => shipment !== undefined);

        if (cleanShipments.length === 0) return [];

        const shipmentsToInsert = cleanShipments.map(toShipmentInDb);
        const result = await db.collection<Omit<ShipmentInDb, '_id'>>("shipments").insertMany(shipmentsToInsert);
        return Object.values(result.insertedIds).map(id => id.toString());

    } catch (error: any) {
        console.error("Error in createShipments:", error.message);
        throw new Error(error.message || "An unexpected error occurred in createShipments.");
    }
}

export const createShipments = async ({ items, orderId, buyer }: { items: CartItem[], orderId: string, buyer: Buyer }) => {
    // Alias to createRealShipments logic but adapting arguments
    // Casting buyer to any to satisfy the inline type definition in createRealShipments which expects phone as mandatory
    return await createRealShipments(orderId, items, buyer as any, []);
};


export const getShipments = async (find: any = {}): Promise<Shipment[]> => {
    const db = client.db("going");
    const query = { ...find };

    try {
        if (query._id) {
            if (typeof query._id === 'string' && ObjectId.isValid(query._id)) {
                query._id = new ObjectId(query._id);
            } else if (query._id.$in && Array.isArray(query._id.$in)) {
                query._id.$in = query._id.$in.map((id: any) => {
                    return (typeof id === 'string' && ObjectId.isValid(id)) ? new ObjectId(id) : id;
                });
            }
        }
    } catch (e) {
        console.error("Error sanitizing getShipments query:", e);
    }

    const shipmentsInDb = await db.collection<ShipmentInDb>("shipments").find(query).sort({ createdAt: -1 }).toArray();
    return shipmentsInDb.map(toAppShipment);
}

export const getShipment = async (_id: string): Promise<Shipment | null> => {
    if (!_id || !ObjectId.isValid(_id)) {
        return null;
    }
    const db = client.db("going");
    const shipmentInDb = await db.collection<ShipmentInDb>("shipments").findOne({ _id: new ObjectId(_id) as any });

    if (!shipmentInDb) {
        return null;
    }

    return toAppShipment(shipmentInDb);
};

export const updateShipment = async (_id: string, shipmentData: Partial<Omit<Shipment, '_id'>>) => {
    if (!_id || typeof _id !== 'string' || !ObjectId.isValid(_id)) {
        console.error("updateShipment was called with an invalid _id:", _id);
        return { status: false, message: `Invalid shipment ID or not provided: ${_id}` };
    }

    const db = client.db("going");

    let dataToSet: Partial<Omit<ShipmentInDb, '_id'>> = { ...shipmentData };

    // If the delivery address is being updated, it needs to be encrypted
    if (shipmentData.deliveryAddress) {
        const { deliveryAddress, ...rest } = shipmentData;
        dataToSet = {
            ...rest,
            encryptedDeliveryAddress: encryptObject(deliveryAddress)
        };
    }

    const resultUpdate = await db.collection<ShipmentInDb>("shipments").findOneAndUpdate(
        { _id: new ObjectId(_id) as any },
        { $set: dataToSet },
        { returnDocument: 'after' }
    );

    console.log("Shipment updated in database:", resultUpdate);
    return resultUpdate;
}

export const requestPickupForShipments = async (shipmentIds: string[]) => {
    if (!shipmentIds || shipmentIds.length === 0) {
        return { status: false, message: "No shipment IDs provided." };
    }

    const db = client.db("going");
    try {
        const objectIds = shipmentIds.map(id => new ObjectId(id));

        const result = await db.collection("shipments").updateMany(
            { _id: { $in: objectIds }, status: 'pending' }, // Ensure we only update pending shipments
            { $set: { status: 'ready_to_ship' } }
        );

        console.log(`${result.modifiedCount} shipments updated to 'ready_to_ship'.`);

        if (result.modifiedCount === 0) {
            return { status: false, message: "No pending shipments were found to update." };
        }

        return { status: true, modifiedCount: result.modifiedCount };
    } catch (error) {
        console.error("Error in requestPickupForShipments:", error);
        return { status: false, message: "An unexpected error occurred." };
    }
};

export const cancelShipment = async (shipmentId: string) => {
    if (!shipmentId || !ObjectId.isValid(shipmentId)) {
        return { status: false, message: "Invalid shipment ID." };
    }

    const db = client.db("going");
    try {
        const result = await db.collection("shipments").updateOne(
            { _id: new ObjectId(shipmentId), status: 'ready_to_ship' },
            { $set: { status: 'cancelled' } }
        );

        if (result.modifiedCount === 0) {
            return { status: false, message: "Shipment not found or cannot be cancelled (must be 'ready_to_ship')." };
        }

        console.log(`Shipment ${shipmentId} cancelled.`);
        return { status: true, message: "Shipment cancelled successfully." };
    } catch (error) {
        console.error("Error cancelling shipment:", error);
        return { status: false, message: "An unexpected error occurred." };
    }
};

export const deleteShipment = async (shipmentId: string) => {
    if (!shipmentId || !ObjectId.isValid(shipmentId)) {
        return { status: false, message: "Invalid shipment ID." };
    }

    const db = client.db("going");
    try {
        // Allow deletion if status is 'cancelled' or 'ready_to_ship'
        const result = await db.collection("shipments").deleteOne(
            { _id: new ObjectId(shipmentId), status: { $in: ['cancelled', 'ready_to_ship'] } }
        );

        if (result.deletedCount === 0) {
            return { status: false, message: "Shipment not found or cannot be deleted (must be 'cancelled' or 'ready_to_ship')." };
        }

        console.log(`Shipment ${shipmentId} deleted.`);
        return { status: true, message: "Shipment deleted successfully." };
    } catch (error) {
        console.error("Error deleting shipment:", error);
        return { status: false, message: "An unexpected error occurred." };
    }
};

export async function calculateRealCosts(shipments: any[]) {
    try {
        // Get Currencies for Conversion (ARS -> USD) - MOVED OUTSIDE LOOP
        const currencies = await getCurrencies();
        const arsRate = currencies.find((c: any) => c.symbol === 'ARS')?.price || 0.001;
        const updatedShipments = [];

        for (const s of shipments) {
            try {
                // Use OSRM
                const distanceKm = await getOsrmDistance(
                    { lat: s.pickupAddressObj.lat, lon: s.pickupAddressObj.lon },
                    { lat: s.deliveryLat, lon: s.deliveryLon }
                );

                // Get Pricing
                const pricingRule = await getPricingForAddress(s.pickupAddressObj);

                // Determine Tier (Moto vs Van)
                const isVan = s.weight > 15 || s.volume > 0.1;
                let ruleBaseFee = 0;
                let ruleBaseDist = 0;
                let ruleCostKm = 0;
                let ruleBaseWeight = 0;
                let ruleCostKg = 0;

                if (isVan) {
                    const v = pricingRule.vehicles.van;
                    ruleBaseDist = v.baseDistanceKm;
                    ruleCostKm = v.costPerKm;
                    ruleBaseWeight = v.baseWeightKg;
                    ruleCostKg = v.costPerKg;

                    if (s.weight > 200 || s.volume > 1.5) {
                        ruleBaseFee = v.baseFeeLarge;
                    } else if (s.weight > 50 || s.volume > 0.5) {
                        ruleBaseFee = v.baseFeeMedium;
                    } else {
                        ruleBaseFee = v.baseFeeSmall;
                    }
                } else {
                    const m = pricingRule.vehicles.motorcycle;
                    ruleBaseFee = m.baseFee;
                    ruleBaseDist = m.baseDistanceKm;
                    ruleCostKm = m.costPerKm;
                    ruleBaseWeight = m.baseWeightKg;
                    ruleCostKg = m.costPerKg;
                }

                // --- CURRENCY NORMALIZATION ---
                let conversionFactor = 1;
                if (pricingRule.currency === 'ARS') {
                    conversionFactor = arsRate;
                }

                ruleBaseFee *= conversionFactor;
                ruleCostKm *= conversionFactor;
                ruleCostKg *= conversionFactor;

                // Recalculate Cost
                let distCost = 0;
                if (distanceKm > ruleBaseDist) {
                    distCost = (distanceKm - ruleBaseDist) * ruleCostKm;
                }

                let weightCost = 0;
                if (s.weight > ruleBaseWeight) {
                    weightCost = (s.weight - ruleBaseWeight) * ruleCostKg;
                }

                const realCost = ruleBaseFee + distCost + weightCost;

                updatedShipments.push({
                    ...s,
                    distanceKm: parseFloat(distanceKm.toFixed(2)),
                    estimatedCost: parseFloat(realCost.toFixed(2)),
                    isRealCost: true
                });

                // Add a small delay
                await new Promise(resolve => setTimeout(resolve, 50));

            } catch (e) {
                console.error("OSRM Failed for shipment:", e);
                updatedShipments.push({ ...s, isRealCost: false });
            }
        }

        const totalCost = updatedShipments.reduce((acc, s) => acc + (s.estimatedCost || 0), 0);
        return { success: true, shipments: updatedShipments, totalCost };

    } catch (error: any) {
        console.error("Error calculating real costs:", error);
        return { success: false, error: error.message };
    }
}

export async function getGeocodedAddress(addressString: string, recipientName: string = 'Manual Entry') {
    try {
        const address: Address = {
            street: addressString,
            city: '',
            country: '',
            state: '',
            zipCode: '',
            fullName: recipientName
        };

        const geocoded = await ensureGeocodedAndIndexed(address);
        return geocoded;
    } catch (error: any) {
        console.error("Geocoding error:", error);
        return null;
    }
}

export const resetShipment = async (shipmentId: string, newAddress: Address): Promise<{ status: boolean; message?: string }> => {
    if (!shipmentId || !ObjectId.isValid(shipmentId)) {
        return { status: false, message: "Invalid shipment ID." };
    }

    const db = client.db("going");
    try {
        // Ensure new address is geocoded/indexed (It should be from Google, but just in case)
        // Since the UI provides lat/lon, ensureGeocodedAndIndexed will just add H3 index quickly.
        const geocodedAddress = await ensureGeocodedAndIndexed(newAddress);

        const encryptedDeliveryAddress = encryptObject(geocodedAddress);

        const result = await db.collection("shipments").updateOne(
            { _id: new ObjectId(shipmentId) },
            {
                $set: {
                    status: 'pending', // Re-queue for processing
                    encryptedDeliveryAddress: encryptedDeliveryAddress
                },
                $unset: { failureReason: "" } // Remove the error message
            }
        );

        if (result.matchedCount === 0) {
            return { status: false, message: "Shipment not found." };
        }

        console.log(`Shipment ${shipmentId} reset with new address.`);
        return { status: true };
    } catch (error) {
        console.error("Error resetting shipment:", error);
        const msg = error instanceof Error ? error.message : "Unknown error";
        return { status: false, message: msg };
    }
};