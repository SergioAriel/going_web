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

export const getProducts = async (find = {}, sort: { [key: string]: SortDirection } = { metacritic: -1 }) => {
    const db = client.db("going");
    const products = await db
        .collection<ProductInDb>("products")
        .find(find)
        .sort(sort)
        .limit(10)
        .toArray();
    return products.map(product => ({ ...product, _id: product._id.toString() })) as Product[];
}