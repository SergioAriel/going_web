'use server';

import { Order, NewOrderPayload } from "@/interfaces";
import client from "../mongodb";
import { ObjectId } from "mongodb";
// import { decryptObject, encryptObject } from "../encryption";

// Helper para transformar un OrderInDb a un Order para el cliente
// function toAppOrder(orderInDb: Order): Order {
//     const { encryptedAddress, ...rest } = orderInDb;
//     const decryptedAddress = decryptObject(encryptedAddress);
//     return { ...rest, _id: rest._id.toString(), address: decryptedAddress };
// }

import { ensureGeocodedAndIndexed } from "../geolocation";

export const createPendingOrder = async (payload: NewOrderPayload): Promise<string> => {
    const db = client.db("going");

    // Ensure the buyer's address is geocoded and has H3 indices
    try {
        const geocodedAddress = await ensureGeocodedAndIndexed(payload.buyer.address);
        payload.buyer.address = geocodedAddress;
    } catch (error) {
        console.warn("Failed to geocode address during order creation:", error);
        // Proceed with original address if geocoding fails, to avoid blocking order creation?
        // Or fail? The requirement implies we WANT the indices.
        // Given the user's emphasis, we should probably try our best but maybe not block if the service is down?
        // However, for "going_network", it's critical.
        // For now, I'll log it. The checkout process has another chance to fix it.
    }

    const newOrderRecord = await db.collection<NewOrderPayload>("orders").insertOne(payload);

    return newOrderRecord.insertedId.toString();
}

export const updateOrder = async (_id: string, orderData: Partial<Omit<Order, '_id'>>) => {
    if (!_id || typeof _id !== 'string' || !ObjectId.isValid(_id)) {
        console.error("updateOrder fue llamado con un _id inválido:", _id);
        return { status: false, message: `ID de orden inválido o no proporcionado: ${_id}` };
    }

    const db = client.db("going");

    // Cualquier objeto AddressForm que venga en una actualización también debe ser encriptado
    // let dataToSet: Partial<OrderInDb> = { ...orderData };
    // if (orderData.address) {
    //     const { address, ...rest } = orderData;
    //     dataToSet = {
    //         ...rest,
    //         encryptedAddress: encryptObject(address)
    //     };
    // }

    const resultUpdate = await db.collection<Order>("orders").findOneAndUpdate(
        { _id: new ObjectId(_id) },
        { $set: orderData },
        { returnDocument: 'after' }
    );

    console.log("Order updated in database:", resultUpdate);
    return resultUpdate;
}

export const getOrders = async (find = {}): Promise<Order[]> => {
    const db = client.db("going");
    const ordersInDb = await db.collection("orders").find(find).toArray();

    // Convert complex MongoDB objects to plain objects for Client Components
    const plainOrders = ordersInDb.map(order => ({
        ...order,
        _id: order._id.toString(),
        date: new Date(order.date).toISOString(),
        // Also map over items if they contain ObjectIds or other complex types
        items: order.items.map(item => ({
            ...item,
            _id: item._id.toString(), // Assuming item._id is also an ObjectId
        }))
    }));

    return plainOrders as Order[];
}

export const getOrder = async (orderId: string): Promise<Order | null> => {
    if (!ObjectId.isValid(orderId)) return null;
    const db = client.db("going");
    const orderInDb = await db.collection<Order>("orders").findOne({ _id: new ObjectId(orderId) });

    if (orderInDb) {
        // Siempre devolver el modelo de Orden limpio a la aplicación
        return orderInDb;
    }
    return null;
};

export const deleteOrder = async ({ _id }: { _id: string }) => {
    try {
        if (!_id || !ObjectId.isValid(_id)) {
            return { status: false, message: "Invalid Order ID." };
        }
        const db = client.db("going");
        const result = await db.collection<Order>("orders").deleteOne({ _id: new ObjectId(_id) });
        if (result.deletedCount === 1) {
            return { status: true, message: "Order deleted successfully." };
        } else {
            return { status: false, message: "Order not found." };
        }
    } catch (error) {
        console.error("Error deleting order:", error);
        return { status: false, message: "An error occurred while deleting the order." };
    }
};