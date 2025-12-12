import { NextRequest, NextResponse } from "next/server";
import { headers } from 'next/headers';
import { verifyIdentityToken } from '@/utils/tokenVerification';
import client from "@/lib/mongodb";
import { User } from "@/interfaces";

// NOTE: This route is not using Edge runtime because verifyIdentityToken uses Node.js APIs.
// We should add `export const runtime = 'nodejs';` if we weren't using the server-only package.

export async function GET(_request: NextRequest, { params }: { params: Promise<{ _id: string }> }) {
    const targetUserId = (await params)._id;

    if (!targetUserId) {
        return NextResponse.json({ error: "User ID is required" }, { status: 400 });
    }

    let requestingUserId: string | null = null;

    // Try to get the logged-in user's ID from the token
    const authorizationHeader = (await headers()).get('authorization');
    if (authorizationHeader && authorizationHeader.startsWith('Bearer ')) {
        const token = authorizationHeader.split(' ')[1];
        try {
            const verifiedToken = await verifyIdentityToken(token);
            requestingUserId = verifiedToken.sub; // 'sub' usually holds the user ID (Privy DID)
        } catch (_error) {
            // Token is invalid or expired, treat as a public request
            console.log("Invalid token received for a profile view, proceeding as public.");
        }
    }

    const db = client.db("going");
    let user;

    try {

        // If the requester is viewing their own profile, return all data
        if (requestingUserId && requestingUserId === targetUserId) {
            user = await db.collection<User>("users").findOne({ _id: targetUserId });
        } else {
            // Otherwise, return only public data using a projection
            const publicProjection = {
                fullName: 1,
                avatar: 1,
                joined: 1,
                location: 1,
                bio: 1,
                isSeller: 1,
            };
            user = await db.collection<User>("users").findOne(
                { _id: targetUserId },
                { projection: publicProjection }
            );
        }

        if (!user) {
            return NextResponse.json({ error: "User not found" }, { status: 404 });
        }

        // Ensure _id is a string for client-side consistency
        return NextResponse.json({ ...user, _id: user._id.toString() }, { status: 200 });

    } catch (error) {
        console.error("Error fetching user:", error);
        return NextResponse.json({ error: "Failed to fetch user data." }, { status: 500 });
    }
}