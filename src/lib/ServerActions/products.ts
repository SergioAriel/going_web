'use server'

import { Product } from "@/interfaces";
import client from "../mongodb";
import { ObjectId, SortDirection } from "mongodb";

export const getOneProduct = async (_id: string) => {
    const db = client.db("going");
    const product = await db
        .collection<Product>("products")
        .findOne({ _id: new ObjectId(_id) });
    if (!product) throw new Error("Product not found");
    return { ...product, _id: product._id.toString() };
}

export const getProducts = async (find = {}, sort: { [key: string]: SortDirection } = { metacritic: -1 }) => {
    console.log("find", find)
    const db = client.db("going");
    const products = await db
        .collection<Product>("products")
        .find(find)
        .sort(sort)
        .limit(10)
        .toArray();
    return products.map(product => ({ ...product, _id: product._id.toString() }));
}