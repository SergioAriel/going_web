import {NextResponse} from "next/server";
import { getProducts, getOneProduct } from "@/lib/ServerActions/products";

export async function GET(request: Request) {
    const { searchParams } = new URL(request.url);
    const _id = searchParams.get('_id');
    const find = searchParams.get('find');
    const sort = searchParams.get('sort');

    if (_id) {
        const product = await getOneProduct(_id);
        return NextResponse.json(product);
    }

    const products = await getProducts(find ? JSON.parse(find) : {}, sort ? JSON.parse(sort) : {});
    console.log(products, sort, find)
    return NextResponse.json(products);
}
