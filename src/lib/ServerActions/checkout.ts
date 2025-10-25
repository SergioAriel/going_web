'use server'

import { Address, CartItem } from "@/interfaces";
import { updateOrder } from "./orders";
import { createShipments } from "./shipments";

// completar el checkout luego de la transaccion
type Buyer = {
    walletAddress: string;
    _id?: string;
    address: Address;
};

export const CheckoutComplete = async ({ orderId, signature, items, buyer }: { orderId: string, signature: string, items: CartItem[], buyer: Buyer }) =>{

    // Aquí puedes usar orderId, signature e items para continuar con el proceso de checkout
    await updateOrder(orderId, { signature });

    await createShipments({ items, orderId, buyer});

}