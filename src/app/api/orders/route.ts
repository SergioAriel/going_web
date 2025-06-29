// app/api/orders/route.ts
import { NextResponse, type NextRequest } from "next/server";
import { getOrders, uploadOrder, updateOrder, deleteOrder, getOrder } from "@/lib/ServerActions/orders";

// Obtén la clave secreta de las variables de entorno
// Asegúrate de que API_SECRET_KEY esté definido en tus variables de entorno de Vercel.
const API_SECRET_KEY = process.env.API_SECRET_KEY;

// Función auxiliar para verificar la clave API
function checkApiKey(request: NextRequest): boolean {
    const apiKey = request.headers.get('x-api-key');
    // Es crucial que API_SECRET_KEY exista y no sea undefined.
    // Si no está definida, esto siempre será false (lo cual es seguro pero podría ser un error de config).
    return apiKey === API_SECRET_KEY;
}

export async function GET(request: NextRequest) {
    // GET sigue siendo público, no requiere clave API
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
    // Solo permitir si la clave API es válida
    if (!checkApiKey(request)) {
        return NextResponse.json({ message: 'Unauthorized - Invalid API Key' }, { status: 401 });
    }

    const order = await request.json();
    const newOrder = await uploadOrder(order);
    return NextResponse.json(newOrder);
}

export async function PUT(request: NextRequest) {
    // Solo permitir si la clave API es válida
    if (!checkApiKey(request)) {
        return NextResponse.json({ message: 'Unauthorized - Invalid API Key' }, { status: 401 });
    }

    const order = await request.json();
    const updatedOrder = await updateOrder(order);
    return NextResponse.json(updatedOrder);
}

export async function DELETE(request: NextRequest) {
    // Solo permitir si la clave API es válida
    if (!checkApiKey(request)) {
        return NextResponse.json({ message: 'Unauthorized - Invalid API Key' }, { status: 401 });
    }

    const { id } = await request.json();
    const deletedOrder = await deleteOrder({ _id: id });
    return NextResponse.json(deletedOrder);
}