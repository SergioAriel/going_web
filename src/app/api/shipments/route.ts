'use server';

import { NextRequest, NextResponse } from 'next/server';
import client from "@/lib/mongodb";
import { ObjectId } from 'mongodb';

export async function GET(request: NextRequest) {
  try {
    const driverId = request.nextUrl.searchParams.get('driverId');
    if (!driverId) {
      return NextResponse.json({ message: 'driverId is required' }, { status: 400 });
    }

    const db = client.db("going");
    const shipments = await db.collection('shipments').find({ driverId: driverId }).toArray();
    
    return NextResponse.json(shipments);
  } catch (error) {
    console.error('Failed to fetch shipments:', error);
    return NextResponse.json({ message: 'Internal Server Error' }, { status: 500 });
  }
}