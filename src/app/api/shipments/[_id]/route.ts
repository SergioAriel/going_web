import { NextRequest, NextResponse } from 'next/server';
import client from "@/lib/mongodb";
import { ObjectId } from 'mongodb';

export async function PATCH(request: NextRequest, { params }: { params: { id: string } }) {
  try {
    const { status } = await request.json();
    if (!status) {
      return NextResponse.json({ message: 'Status is required' }, { status: 400 });
    }

    const db = client.db("going");
    const result = await db.collection('shipments').updateOne(
      { _id: new ObjectId(params.id) },
      { $set: { status: status, updatedAt: new Date() } }
    );

    if (result.modifiedCount === 0) {
      return NextResponse.json({ message: 'Shipment not found or status not changed' }, { status: 404 });
    }

    // When the driver picks up the package, a new QR code is generated for the buyer.
    // This logic will be handled on the buyer's side when they confirm delivery.

    return NextResponse.json({ message: 'Shipment updated successfully' });
  } catch (error) {
    console.error('Failed to update shipment:', error);
    return NextResponse.json({ message: 'Internal Server Error' }, { status: 500 });
  }
}
