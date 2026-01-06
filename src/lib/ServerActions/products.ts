'use server'

import { Product, ProductInDb } from "@/interfaces";
import client from "../mongodb";
import { ObjectId, SortDirection } from "mongodb";

export const getOneProduct = async (_id: string) => {
    const db = client.db("going");
    const product = await db
        .collection<ProductInDb>("products")
        .findOne({ _id: new ObjectId(_id) });
    if (!product) throw new Error("Product not found");
    return { ...product, _id: product._id.toString() } as Product;
}

export const getProducts = async (find: any = {}, sort: { [key: string]: SortDirection } = { metacritic: -1 }) => {
    const db = client.db("going");

    // Sanitize _id query: Convert string IDs to ObjectIds
    const query = { ...find };
    console.log("SERVER DEBUG: getProducts incoming find:", JSON.stringify(find));

    try {
        if (query._id) {
            if (typeof query._id === 'string') {
                query._id = new ObjectId(query._id);
            } else if (query._id.$in && Array.isArray(query._id.$in)) {
                query._id.$in = query._id.$in.map((id: string | ObjectId) => {
                    try {
                        return typeof id === 'string' ? new ObjectId(id) : id;
                    } catch (e) {
                        console.error("SERVER DEBUG: Invalid ObjectId encountered:", id);
                        return null;
                    }
                }).filter((id: any) => id !== null); // Removing invalid IDs to prevent crash
            }
        }
    } catch (e) {
        console.error("SERVER DEBUG: Error constructing query:", e);
    }

    const products = await db
        .collection<ProductInDb>("products")
        .find(query)
        .sort(sort)
        .toArray();

    return products.map(product => ({ ...product, _id: product._id.toString() })) as Product[];
}