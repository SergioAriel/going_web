import { NextRequest, NextResponse } from "next/server";
import { requestPickupForShipments } from "@/lib/ServerActions/shipments";

export async function POST(request: NextRequest) {
    try {
        const { shipmentIds } = await request.json();

        if (!shipmentIds || !Array.isArray(shipmentIds) || shipmentIds.length === 0) {
            return NextResponse.json({ message: "shipmentIds must be a non-empty array." }, { status: 400 });
        }

        const result = await requestPickupForShipments(shipmentIds);

        if (!result.status) {
            return NextResponse.json({ message: result.message || 'Failed to update shipments.' }, { status: 500 });
        }

        return NextResponse.json({ modifiedCount: result.modifiedCount });

    } catch (error) {
        console.error("Error in /api/shipments/request-pickup: ", error);
        return NextResponse.json({ message: "Internal Server Error" }, { status: 500 });
    }
}
