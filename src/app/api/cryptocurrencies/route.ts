import {NextResponse} from "next/server";
import { getCurrencies } from "@/lib/ServerActions/cryptocurrencies";

export async function GET() {
    try {
        const currencies = await getCurrencies();
        return NextResponse.json(currencies);
    } catch (_) {
        return NextResponse.json({ error: "Failed to fetch currencies" }, { status: 500 });
    }
}
