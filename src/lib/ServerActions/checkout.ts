'use server'

import { Address, CartItem } from "@/interfaces";
import { updateOrder } from "./orders";
import { createShipments } from "./shipments";

// completar el checkout luego de la transaccion
type Buyer = {
  walletAddress: string;
  _id?: string;
  address: Address;
  email: string;
  phone: string;
};

interface CheckoutPayload {
  orderId: string;
  signature: string;
  items: CartItem[];
  buyer: Buyer;
}

import { ensureGeocodedAndIndexed } from "../geolocation";

export const CheckoutComplete = async ({ orderId, signature, items, buyer }: CheckoutPayload) => {

  // 1. Ensure we have the definitive geocoded address with H3 indices
  let geocodedBuyer = { ...buyer };
  try {
    const geocodedAddress = await ensureGeocodedAndIndexed(buyer.address);
    geocodedBuyer.address = geocodedAddress;
  } catch (error) {
    console.error("Failed to geocode address during checkout:", error);
    // We proceed, but the address might lack H3 indices.
  }

  // 2. Update the order with the signature AND the definitive address
  // This ensures the Order document has the H3 indices.
  await updateOrder(orderId, {
    signature,
    buyer: geocodedBuyer // Update the whole buyer object to include the geocoded address
  });

  // 3. Create shipments using the geocoded buyer info
  await createShipments({ items, orderId, buyer: geocodedBuyer });

}