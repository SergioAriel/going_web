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
};

import { ensureGeocodedAndIndexed } from '../geolocation';

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
const PRICING = {
    BASE_FEE: 9.00,
    BASE_DISTANCE_KM: 3,
    COST_PER_KM: 0.80,
    BASE_WEIGHT_KG: 5,
    COST_PER_KG: 1.00
};



const calculateHaversineDistance = (lat1: number, lon1: number, lat2: number, lon2: number) => {
    const R = 6371;
    const dLat = (lat2 - lat1) * (Math.PI / 180);
    const dLon = (lon2 - lon1) * (Math.PI / 180);
    const a =
        Math.sin(dLat / 2) * Math.sin(dLat / 2) +
        Math.cos(lat1 * (Math.PI / 180)) * Math.cos(lat2 * (Math.PI / 180)) *
        Math.sin(dLon / 2) * Math.sin(dLon / 2);
    const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
    return R * c;
};

import { latLngToCell } from 'h3-js';

// ... (existing imports)

// ... (existing helper functions)

export const createDirectShipments = async (shipmentsData: any[], userId: string, pickupAddress: Address, transactionSignature?: string) => {
    const db = client.db("going");
    const createdShipments = [];

    // Ensure pickup address has H3 indices (it should, but safety first)
    // If it comes from the DB, it likely has them. If not, we calculate them.
    const pickupH3 = pickupAddress.h3Index || latLngToCell(pickupAddress.lat || 0, pickupAddress.lon || 0, 9);
    const pickupH3L6 = pickupAddress.h3IndexL6 || latLngToCell(pickupAddress.lat || 0, pickupAddress.lon || 0, 6);
    const pickupH3L8 = pickupAddress.h3IndexL8 || latLngToCell(pickupAddress.lat || 0, pickupAddress.lon || 0, 8);

    const fullPickupAddress: GeocodedAddress = {
        ...pickupAddress,
        h3Index: pickupH3,
        h3IndexL6: pickupH3L6,
        h3IndexL8: pickupH3L8
    } as GeocodedAddress;

    for (const data of shipmentsData) {
        // 1. Calculate Real Distance with OSRM
        let distanceKm = 0;
        try {
            distanceKm = await getOsrmDistance(
                { lat: fullPickupAddress.lat, lon: fullPickupAddress.lon },
                { lat: data.deliveryLat, lon: data.deliveryLon }
            );
        } catch (e) {
            // Fallback
            distanceKm = calculateHaversineDistance(fullPickupAddress.lat!, fullPickupAddress.lon!, data.deliveryLat, data.deliveryLon) * 1.3;
        }

        // 2. Calculate Final Price
        let distCost = 0;
        if (distanceKm > PRICING.BASE_DISTANCE_KM) {
            distCost = (distanceKm - PRICING.BASE_DISTANCE_KM) * PRICING.COST_PER_KM;
        }

        let weightCost = 0;
        if (data.weight > PRICING.BASE_WEIGHT_KG) {
            weightCost = (data.weight - PRICING.BASE_WEIGHT_KG) * PRICING.COST_PER_KG;
        }

        const finalPrice = PRICING.BASE_FEE + distCost + weightCost;

        // 3. Calculate H3 Indices for Delivery
        const deliveryH3 = latLngToCell(data.deliveryLat, data.deliveryLon, 9);
        const deliveryH3L6 = latLngToCell(data.deliveryLat, data.deliveryLon, 6);
        const deliveryH3L8 = latLngToCell(data.deliveryLat, data.deliveryLon, 8);

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
            pickupAddress: fullPickupAddress,
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
                pickupAddress: fullPickupAddress
            }],
            createdAt: new Date(),
            updatedAt: new Date(),
            status: 'ready_to_ship',
            price: finalPrice,
            // @ts-ignore - Adding transactionSignature dynamically if interface doesn't support it yet
            transactionSignature: transactionSignature
        };

        createdShipments.push(shipment);
    }

    if (createdShipments.length > 0) {
        const shipmentsToInsert = createdShipments.map(s => toShipmentInDb(s as unknown as Shipment));
        await db.collection("shipments").insertMany(shipmentsToInsert);
    }

    return { success: true, count: createdShipments.length };
};

export const createShipments = async ({ items, orderId, buyer }: { items: CartItem[], orderId: string, buyer: Buyer }) => {
    const db = client.db("going")

    try {
        // 1. Geocode the buyer's address once for all shipments
        const geocodedDeliveryAddress = await ensureGeocodedAndIndexed(buyer.address);

        // 2. Group items by Seller + ShippingType + PickupLocation (H3 Index)
        const divisionShipments = Object.groupBy(items, item => {
            if (!item.shippingType || !item.seller || !item.pickupAddress) {
                throw new Error(`Producto '${item.name}' (ID: ${item._id}) tiene datos de logística incompletos (seller, shippingType, o pickupAddress).`);
            }
            // We assume pickupAddress is already geocoded and has h3Index as per business rules
            const h3Index = item.pickupAddress.h3Index || 'unknown';
            return `${item.shippingType}-${item.seller}-${h3Index}`;
        });

        const cleanShipments: Shipment[] = Object.entries(divisionShipments)
            .map(([key, shipmentItems]) => {
                // key is shippingType-sellerId-h3Index
                // We need to extract them carefully if we need them, but we have the items.
                const [shippingType, sellerId] = key.split("-");

                if (!shipmentItems || shipmentItems.length === 0) {
                    return undefined;
                }

                // The pickup address of the first item is representative of the group
                // We cast it to GeocodedAddress because we grouped by H3 index, implying it exists.
                // Ideally, we should validate this.
                const pickupAddress = shipmentItems[0].pickupAddress as GeocodedAddress;

                if (shippingType === 'going_network') {
                    const shipment: GoingNetworkShipment = {
                        orderId,
                        sellerId,
                        buyerId: buyer._id!,
                        shippingType: 'going_network',
                        deliveryAddress: geocodedDeliveryAddress,
                        pickupAddress: pickupAddress,
                        items: shipmentItems,
                        createdAt: new Date(),
                        updatedAt: new Date(),
                        status: 'pending',
                    };
                    return shipment;
                } else if (shippingType === 'self_delivery') {
                    const shipment: SelfDeliveryShipment = {
                        orderId,
                        sellerId,
                        buyerId: buyer._id!,
                        shippingType: 'self_delivery',
                        deliveryAddress: geocodedDeliveryAddress,
                        pickupAddress: pickupAddress,
                        items: shipmentItems,
                        createdAt: new Date(),
                        updatedAt: new Date(),
                        status: 'shipped_by_seller',
                    };
                    return shipment;
                }

                return undefined;
            })
            .filter((shipment): shipment is Shipment => shipment !== undefined);

        if (cleanShipments.length === 0) {
            console.log("No shipments to create after filtering.");
            return [];
        }

        const shipmentsToInsert = cleanShipments.map(toShipmentInDb);

        const result = await db.collection<Omit<ShipmentInDb, '_id'>>("shipments").insertMany(shipmentsToInsert);

        return result.insertedIds;

    } catch (error: any) {
        console.error("Error in createShipments:", error.message);
        // Re-throw the specific error to be caught by the client-side
        throw new Error(error.message || "An unexpected error occurred in createShipments.");
    }
}

export const getShipments = async (find = {}): Promise<Shipment[]> => {
    const db = client.db("going");
    const shipmentsInDb = await db.collection<ShipmentInDb>("shipments").find(find).sort({ createdAt: -1 }).toArray();

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
        { _id: new ObjectId(_id) },
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
        const updatedShipments = [];
        for (const s of shipments) {
            try {
                // Use OSRM
                const distanceKm = await getOsrmDistance(
                    { lat: s.pickupAddressObj.lat, lon: s.pickupAddressObj.lon },
                    { lat: s.deliveryLat, lon: s.deliveryLon }
                );

                // Recalculate Cost
                let distCost = 0;
                if (distanceKm > PRICING.BASE_DISTANCE_KM) {
                    distCost = (distanceKm - PRICING.BASE_DISTANCE_KM) * PRICING.COST_PER_KM;
                }

                let weightCost = 0;
                if (s.weight > PRICING.BASE_WEIGHT_KG) {
                    weightCost = (s.weight - PRICING.BASE_WEIGHT_KG) * PRICING.COST_PER_KG;
                }

                const realCost = PRICING.BASE_FEE + distCost + weightCost;

                updatedShipments.push({
                    ...s,
                    distanceKm: parseFloat(distanceKm.toFixed(2)),
                    estimatedCost: parseFloat(realCost.toFixed(2)),
                    isRealCost: true
                });

                // Add a small delay to be nice to the demo server
                await new Promise(resolve => setTimeout(resolve, 200));

            } catch (e) {
                console.error("OSRM Failed for shipment:", e);
                updatedShipments.push({ ...s, isRealCost: false }); // Keep estimated if failed
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