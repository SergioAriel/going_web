'use server'

import { User } from "@/interfaces";
import client from "../mongodb";

export const getUser = async (_id: string): Promise<User> => {
    const db = client.db("going");
    const user = (await db
        .collection<User>("users")
        .findOne<User>({ '_id': _id }));
        if (!user) {
            throw new Error("User not found");
        }
        console.log(user)
    return { ...user, _id: user?._id.toString()}
}

export const updateUser = async (user: Partial<User> | { _id: string }) => {
    const db = client.db("going");
    try {
        const { _id, ...userData } = user;
        const updatedUser = await db.collection<User>("users").updateOne(
            { _id: user._id },
            { $set: { ...userData } }
        );
        console.log("User updated in database:", updatedUser);
        return { status: true };
    } catch (error) {
        return { status: false, error: error };
    }
}

export const uploadUser = async (user: Omit<User, '_id'> & { _id: string }) => {
    console.log("uploading user", user)
    const db = client.db("going");
    try {
        const { _id, ...userData } = user;

        const userToInsert = {
            ...userData,
            _id: _id,
        };

        const newUser = await db.collection<User>("users").insertOne(
            userToInsert
        );
        console.log("User created in database:", newUser);
        return { status: true, user: newUser };
    } catch (error) {
        console.error("Error uploading user:", error);
        return { status: false, error: error };
    }
}