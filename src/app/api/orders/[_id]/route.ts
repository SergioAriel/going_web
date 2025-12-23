import { NextRequest, NextResponse } from 'next/server';
import { getOrder, updateOrder } from '@/lib/ServerActions/orders';

export async function GET(_: NextRequest, { params }: { params: Promise<{ _id: string }> }) {
  try {
    const _id = (await params)._id;

    const order = await getOrder(_id)
    if (!order) {
      return NextResponse.json({ message: 'Order not found' }, { status: 404 });
    }
    return NextResponse.json(order);
  } catch (error) {
    console.error('Failed to fetch order:', error);
    return NextResponse.json({ message: 'Internal Server Error' }, { status: 500 });
  }
}

export async function PATCH(request: NextRequest, { params }: { params: Promise<{ _id: string }> }) {
  try {
    const _id = (await params)._id;
    const orderData = await request.json();

    if (!orderData.status) {
      return NextResponse.json({ message: 'Status is required' }, { status: 400 });
    }

    const result = await updateOrder(_id, orderData);

    if (!result?.status) {
        // The server action returned an error
        return NextResponse.json({ message: result?.message || 'Failed to update order' }, { status: 400 });
    }

    return NextResponse.json({ message: 'Order updated successfully' });
  } catch (error) {
    console.error('Failed to update order:', error);
    return NextResponse.json({ message: 'Internal Server Error' }, { status: 500 });
  }
}
