import { getUser } from "@/lib/ServerActions/users";
import { NextRequest, NextResponse } from "next/server";

export async function GET(_: NextRequest, { params }: { params: Promise<{ _id: string }> }) {
    const _id = (await params)._id;
    if (!_id) {
        return NextResponse.json({ error: "User ID is required" }, { status: 400 });
    }
    const user = await getUser(_id)
    if (!user) {
        return NextResponse.json({ error: "User not found" }, { status: 404 });
    }

    return NextResponse.json(user, { status: 200 });
}