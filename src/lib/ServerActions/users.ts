'use server';

import { User, Address } from "@/interfaces";
import client from "../mongodb";
import { FindOneAndUpdateOptions } from "mongodb";

// Placeholder for a real geocoding service
const geocodeAddress = async (address: Address): Promise<{ lat: number; lon: number } | null> => {
    console.log(`GEOCODING (Placeholder): ${address.street}, ${address.city}`);
    return {
        lat: 40.7128, // Dummy Latitude (New York City)
        lon: -74.0060, // Dummy Longitude (New York City)
    };
};

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

export const updateUser = async (_id: string, user: Partial<User>) => {
const db = client.db("going");
    try {
        const { _id, ...userData } = user;

        // Geocode addresses if they are present and lack coordinates
        if (userData.addresses && Array.isArray(userData.addresses)) {
            userData.addresses = await Promise.all(userData.addresses.map(async (address) => {
                if (address && (!address.lat || !address.lon)) {
                    const coords = await geocodeAddress(address);
                    if (coords) {
                        return { ...address, ...coords };
                    }
                }
                return address;
            }));
        }

        const options: FindOneAndUpdateOptions = { returnDocument: 'after' };

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