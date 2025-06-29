import {NextResponse} from "next/server";
import { getOrders, uploadOrder, updateOrder, deleteOrder, getOrder } from "@/lib/ServerActions/orders";

export async function GET(request: Request) {
    const { searchParams } = new URL(request.url);
    const id = searchParams.get('id');
    if (id) {
        const order = await getOrder({ _id: id });
        return NextResponse.json(order);
    }
    const orders = await getOrders();
    return NextResponse.json(orders);
}

export async function POST(request: Request) {
    const order = await request.json();
    const newOrder = await uploadOrder(order);
    return NextResponse.json(newOrder);
}

export async function PUT(request: Request) {
    const order = await request.json();
    const updatedOrder = await updateOrder(order);
    return NextResponse.json(updatedOrder);
}

export async function DELETE(request: Request) {
    const { id } = await request.json();
    const deletedOrder = await deleteOrder({ _id: id });
    return NextResponse.json(deletedOrder);
}