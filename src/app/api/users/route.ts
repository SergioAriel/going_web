import {NextResponse} from "next/server";
import { getUser, updateUser, uploadUser } from "@/lib/ServerActions/users";

export async function GET(request: Request) {
    const { searchParams } = new URL(request.url);
    const id = searchParams.get('id');
    if (id) {
        const user = await getUser(id);
        return NextResponse.json(user);
    }
    return NextResponse.json({ error: "User ID is required" }, { status: 400 });
}

export async function POST(request: Request) {
    const user = await request.json();
    const newUser = await uploadUser(user);
    return NextResponse.json(newUser);
}

export async function PUT(request: Request) {
    const user = await request.json();
    const updatedUser = await updateUser(user);
    return NextResponse.json(updatedUser);
}
