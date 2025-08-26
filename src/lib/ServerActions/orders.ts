'use server';

import { AddressForm, Order, OrderWithEncryptedAddress } from "@/interfaces";
import client from "../mongodb";
import { ObjectId } from "mongodb";
import { decryptObject, encryptObject } from "../encryption";



export const uploadOrder = async (order: Order) => {
    const db = client.db("going");

    const encryptedAddress = encryptObject(order.decryptedAddress as AddressForm);

    const newOrderRecord = await db.collection<OrderWithEncryptedAddress>("orders")
        .insertOne({ ...order, encryptedAddress });
    return newOrderRecord.insertedId.toString();
}

export const updateOrder = async (order: Partial<Order> | { _id: string }) => {
    const db = client.db("going"); const { _id, ...orderData } = order;
    const updatedOrder = await db.collection<Order>("orders").updateOne(
        { _id: new ObjectId(_id) },
        { $set: { ...orderData } }
    );
    console.log("Order updated in database:", updatedOrder);
    return { status: true };
}

export const getOrders = async (find = {}) => {
    const db = client.db("going");
    const orders = (await db.collection<OrderWithEncryptedAddress>("orders")
        .find(find)
        .toArray()).map(order => {
            return (
                {
                    ...order, _id: order._id.toString()
                }
            )
        }
        );
    return orders;
}

export const getOrder = async (orderId: string): Promise<Order | null> => {
    const db = client.db("going");
    const order = await db.collection<OrderWithEncryptedAddress>("orders").findOne({ _id: new ObjectId(orderId) });
    if (order) {
        const decryptedAddress = decryptObject(order.encryptedAddress);
        return { ...order, _id: order._id.toString(), decryptedAddress };
    }
    return null;
};

export const deleteOrder = async ({ _id }: { _id: string }) => {
    try {
        const db = client.db("going");
        const result = await db.collection<Order>("orders").deleteOne({ _id: new ObjectId(_id) });
        if (result.deletedCount === 1) {
            console.log(`Order with ID ${_id} deleted successfully.`);
            return { status: true, message: "Order deleted successfully." };
        } else {
            console.log(`Order with ID ${_id} not found.`);
            return { status: false, message: "Order not found." };
        }
    } catch (error) {
        console.error("Error deleting order:", error);
        return { status: false, message: "An error occurred while deleting the order." };
    }
};


