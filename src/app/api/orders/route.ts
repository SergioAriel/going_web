// app/api/orders/route.ts
import { NextResponse, type NextRequest } from "next/server";
import { getOrders, uploadOrder, updateOrder, deleteOrder, getOrder } from "@/lib/ServerActions/orders";
import { headers } from "next/headers";
import { verifyIdentityToken } from "@/utils/tokenVerification";

export async function GET(request: NextRequest) {
    const { searchParams } = new URL(request.url);
    const id = searchParams.get('id');

    if (id) {
        const order = await getOrder({ _id: id });
        return NextResponse.json(order);
    }

    const orders = await getOrders();
    return NextResponse.json(orders);
}

export async function POST(request: NextRequest) {
    const requestHeaders = await headers();
    const authorizationHeader = requestHeaders.get('authorization')

    if (!authorizationHeader) {
        return NextResponse.json({ message: 'Unauthorized - Missing Authorization header' }, { status: 401 });
    }

    const token = authorizationHeader.split(' ')[1];

    if (!token) {
        return NextResponse.json({ message: 'Unauthorized - Malformed Authorization header' }, { status: 401 });
    }

    const identityToken = await verifyIdentityToken(token);

    if (!identityToken) return NextResponse.json({ error: "Failed to upload images" }, { status: 500 });


    const order = await request.json();
    const newOrder = await uploadOrder(order);
    return NextResponse.json(newOrder);
}

export async function PUT(request: NextRequest) {
    const requestHeaders = await headers();
    const authorizationHeader = requestHeaders.get('authorization')

    if (!authorizationHeader) {
        return NextResponse.json({ message: 'Unauthorized - Missing Authorization header' }, { status: 401 });
    }

    const token = authorizationHeader.split(' ')[1];

    if (!token) {
        return NextResponse.json({ message: 'Unauthorized - Malformed Authorization header' }, { status: 401 });
    }

    const identityToken = await verifyIdentityToken(token);

    if (!identityToken) return NextResponse.json({ error: "Failed to upload images" }, { status: 500 });


    const order = await request.json();
    const updatedOrder = await updateOrder(order);
    return NextResponse.json(updatedOrder);
}

export async function DELETE(request: NextRequest) {
    const requestHeaders = await headers();
    const authorizationHeader = requestHeaders.get('authorization')

    if (!authorizationHeader) {
        return NextResponse.json({ message: 'Unauthorized - Missing Authorization header' }, { status: 401 });
    }

    const token = authorizationHeader.split(' ')[1];

    if (!token) {
        return NextResponse.json({ message: 'Unauthorized - Malformed Authorization header' }, { status: 401 });
    }

    const identityToken = await verifyIdentityToken(token);

    if (!identityToken) return NextResponse.json({ error: "Failed to upload images" }, { status: 500 });


    const { id } = await request.json();
    const deletedOrder = await deleteOrder({ _id: id });
    return NextResponse.json(deletedOrder);
}