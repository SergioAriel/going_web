'use server'

import { Address, CartItem, GoingNetworkShipment, SelfDeliveryShipment, Shipment, GeocodedAddress, ShipmentInDb } from '@/interfaces'
import client from "../mongodb";
import { decryptObject, encryptObject } from '../encryption';
import { ObjectId } from 'mongodb';

type Buyer = {
    walletAddress: string;
    _id?: string;
    address: Address;
};

// Helper to ensure an address is geocoded, using defaults as a placeholder.
const ensureGeocoded = (address: Address): GeocodedAddress => {
    if (address.lat && address.lon) {
        return address as GeocodedAddress;
    }
    
    // TODO: This is a temporary fallback. In production, we should either
    // call a real geocoding service here or throw an error if an address
    // reaches this point without coordinates.
    console.warn(`Address for ${address.name} is missing coordinates. Using default values.`);
    return {
        ...address,
        lat: 40.7128, // Default Lat (e.g., New York City)
        lon: -74.0060, // Default Lon (e.g., New York City)
    };
};

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


export const createShipments = async ({ items, orderId, buyer }: { items: CartItem[], orderId: string, buyer: Buyer }) => {
    const db = client.db("going")

    const divisionShipments = Object.groupBy(items, item => `${item.shippingType}-${item.seller}`);

    const cleanShipments: Shipment[] = Object.entries(divisionShipments)
        .map(([key, shipmentItems]) => {
            const [shippingType, sellerId] = key.split("-");

            if (!shipmentItems || shipmentItems.length === 0) {
                return undefined;
            }

            // Ensure addresses are geocoded before creating the shipment.
            const geocodedPickupAddress = ensureGeocoded(shipmentItems[0].pickupAddress);
            const geocodedDeliveryAddress = ensureGeocoded(buyer.address);

            if (shippingType === 'going_network') {
                const shipment: GoingNetworkShipment = {
                    orderId,
                    sellerId,
                    buyerId: buyer._id!,
                    shippingType: 'going_network',
                    deliveryAddress: geocodedDeliveryAddress,
                    pickupAddress: geocodedPickupAddress,
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
                    pickupAddress: geocodedPickupAddress,
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
        return [];
    }

    const shipmentsToInsert = cleanShipments.map(toShipmentInDb);

    const result = await db.collection<Omit<ShipmentInDb, '_id'>>("shipments").insertMany(shipmentsToInsert);

    return result.insertedIds;
}

export const getShipments = async (find = {}): Promise<Shipment[]> => {
    const db = client.db("going");
    const shipmentsInDb = await db.collection<ShipmentInDb>("shipments").find(find).toArray();
    
    return shipmentsInDb.map(toAppShipment);
}

export const getShipment = async (_id: string): Promise<Shipment | null> => {
    if (!_id || !ObjectId.isValid(_id)) {
        return null;
    }
    const db = client.db("going");
    const shipmentInDb = await db.collection<ShipmentInDb>("shipments").findOne({ _id: new ObjectId(_id) });

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