import { NextResponse } from 'next/server';
import { CheckoutComplete } from '@/lib/ServerActions/checkout';
import { CartItem, Address } from '@/interfaces';

type Buyer = {
  walletAddress: string;
  _id?: string;
  address: Address;
  email: string;
  phone: string;
};

// Define the expected structure of the incoming request body
interface CheckoutPayload {
  orderId: string;
  signature: string;
  items: CartItem[];
  buyer: Buyer;
}

export async function POST(request: Request) {
  try {
    const payload: CheckoutPayload = await request.json();

    // Basic validation to ensure the payload has the required fields
    if (!payload.orderId || !payload.signature || !payload.items || !payload.buyer) {
      return NextResponse.json({ success: false, message: 'Incomplete checkout payload.' }, { status: 400 });
    }

    // Directly call the server action with the payload received from the mobile app
    await CheckoutComplete(payload);

    return NextResponse.json({ success: true, message: 'Checkout process initiated successfully.' });

  } catch (_) {
    return NextResponse.json({ success: false, message: `An internal error occurred.` }, { status: 500 });
  }
}
