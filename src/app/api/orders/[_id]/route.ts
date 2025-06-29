import { NextRequest, NextResponse } from 'next/server';

import { ObjectId } from 'mongodb';
import client from '@/lib/mongodb';

export async function GET(_: NextRequest, { params }: { params: Promise<{ _id: string }> }) {
  try {
    const _id = (await params)._id;
    const db = client.db('going');
    const order = await db.collection('orders').findOne({ _id: new ObjectId(_id) });
    if (!order) {
      return NextResponse.json({ message: 'Order not found' }, { status: 404 });
    }
    return NextResponse.json(order);
  } catch (error) {
    console.error('Failed to fetch order:', error);
    return NextResponse.json({ message: 'Internal Server Error' }, { status: 500 });
  }
}

export async function PATCH(request: NextRequest, { params }: { params: { _id: string } }) {
  try {
    const _id = (await params)._id;
    const { status } = await request.json();
    if (!status) {
      return NextResponse.json({ message: 'Status is required' }, { status: 400 });
    }

    const db = client.db('going');
    const result = await db.collection('orders').updateOne(
      { _id: new ObjectId(_id) },
      { $set: { status: status } }
    );

    if (result.modifiedCount === 0) {
      return NextResponse.json({ message: 'Order not found or status not changed' }, { status: 404 });
    }

    return NextResponse.json({ message: 'Order updated successfully' });
  } catch (error) {
    console.error('Failed to update order:', error);
    return NextResponse.json({ message: 'Internal Server Error' }, { status: 500 });
  }
}