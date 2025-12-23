'use server';

import { User } from "@/interfaces";
import client from "../mongodb";
import { FindOneAndUpdateOptions } from "mongodb";

import { ensureGeocodedAndIndexed } from "../geolocation";

export const getUser = async (_id: string): Promise<User | null> => {
    // In this server action, the _id is the privy DID, which is a string, not an ObjectId
    const db = client.db("going");
    const user = await db
        .collection<User>("users")
        .findOne({ _id: _id });
    if (!user) {
        return null;
    }
    return user as User;
}

// Helper to introduce a delay
const delay = (ms: number) => new Promise(resolve => setTimeout(resolve, ms));

export const updateUser = async (_id: string, user: Partial<User>) => {
    const db = client.db("going");
    try {
        // Avoid shadowing the _id argument
        const { _id: _unusedId, ...userData } = user;

        // Handle addresses sequentially to respect API rate limits
        if (userData.addresses && Array.isArray(userData.addresses)) {
            const processedAddresses = [];
            for (const address of userData.addresses) {
                try {
                    // The inner function is now efficient and will skip already-processed addresses
                    const geocodedAddress = await ensureGeocodedAndIndexed(address);
                    processedAddresses.push(geocodedAddress);

                    // Pause for 1 second after each address processing to comply with Nominatim's policy
                    await delay(1000);

                } catch (error) {
                    const err = error as Error;
                    console.error(`Geocoding process failed: ${err.name} - ${err.message}`);

                    if (err.name === 'AddressNotFoundError') {
                        return {
                            status: false,
                            message: err.message,
                            errorType: 'ADDRESS_NOT_FOUND'
                        };
                    } else { // Any other error (e.g., GeocodingServiceError)
                        return {
                            status: false,
                            message: 'The address verification service is currently unavailable. Please try again later.',
                            errorType: 'SERVICE_UNAVAILABLE'
                        };
                    }
                }
            }
            // Assign the fully processed and validated array of addresses
            userData.addresses = processedAddresses;
        } else {
            console.log("No addresses to process or invalid format:", userData.addresses);
        }

        const options: FindOneAndUpdateOptions = { returnDocument: 'after', upsert: true };

        const result = await db.collection<User>("users").findOneAndUpdate(
            { _id: _id }, // User _id is the privy DID string
            { $set: userData },
            options
        );

        return { status: true, user: result };
    } catch (error) {
        console.error("Error updating user:", error);
        const message = error instanceof Error ? error.message : "An unknown error occurred";
        return { status: false, message };
    }
}

export const uploadUser = async (user: User) => {
    console.log("uploading user", user)
    const db = client.db("going");
    try {
        const { _id, ...userData } = user;

        const userToInsert = {
            ...userData,
            _id: _id, // Use the Privy DID string directly as the _id
        };

        const result = await db.collection<User>("users").insertOne(
            userToInsert
        );

        const newUser = {
            ...userToInsert,
            _id: result.insertedId
        }

        console.log("User created in database:", newUser);
        return { status: true, user: newUser };
    } catch (error) {
        console.error("Error uploading user:", error);
        const message = error instanceof Error ? error.message : "An unknown error occurred";
        return { status: false, message };
    }
}

export const getSavedAddresses = async (userId: string) => {
    if (!userId) return [];
    const user = await getUser(userId);
    return user?.addresses || [];
}

export const saveAddress = async (userId: string, address: any) => {
    if (!userId) return { success: false, message: "User ID required" };
    // We reuse updateUser to add the address
    // First get existing addresses
    const user = await getUser(userId);
    const currentAddresses = user?.addresses || [];

    // Check if address already exists (simple check)
    // For now, just add it.
    // Ideally we should use $addToSet but updateUser uses $set.

    // Let's just append and call updateUser
    const newAddresses = [...currentAddresses, address];

    const result = await updateUser(userId, { addresses: newAddresses });
    return { success: result.status };
}