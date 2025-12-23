import { NextResponse, type NextRequest } from "next/server";
import { getOrders, updateOrder, deleteOrder, createPendingOrder } from "@/lib/ServerActions/orders";
import { headers } from "next/headers";
import { verifyIdentityToken } from "@/utils/tokenVerification";

export const runtime = 'nodejs';

export async function GET() {
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

    if (!identityToken) return NextResponse.json({ error: "Failed to verify identity" }, { status: 500 });

    const _orderData = await request.json();

    const result = await createPendingOrder(_orderData);

    return NextResponse.json({ insertedId: result });
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

    if (!identityToken) return NextResponse.json({ error: "Failed to verify identity" }, { status: 500 });

    const { _id, ...orderData } = await request.json();
    const updatedOrder = await updateOrder(_id, orderData);
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

    if (!identityToken) return NextResponse.json({ error: "Failed to verify identity" }, { status: 500 });

    const { id } = await request.json();
    const deletedOrder = await deleteOrder({ _id: id });
    return NextResponse.json(deletedOrder);
}
