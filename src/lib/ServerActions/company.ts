'use server';

import { Company, User } from "@/interfaces";
import client from "../mongodb";
import { ObjectId } from "mongodb";

export type CreateCompanyResponse = {
    success: boolean;
    message: string;
    companyId?: string;
};

export const createCompany = async (
    companyData: Omit<Company, '_id' | 'createdAt' | 'updatedAt' | 'shippingCredits' | 'apiKeys'>,
    userId: string
): Promise<CreateCompanyResponse> => {
    if (!userId || !ObjectId.isValid(userId)) {
        return { success: false, message: "Invalid User ID." };
    }

    const db = client.db("going");
    const session = client.startSession();

    try {
        await session.withTransaction(async () => {
            // 1. Create Company Document
            const newCompany: Company = {
                ...companyData,
                ownerUserId: userId,
                shippingCredits: 0,
                apiKeys: [],
                createdAt: new Date(),
                updatedAt: new Date(),
            };

            const result = await db.collection<Company>("companies").insertOne(newCompany, { session });
            const companyId = result.insertedId.toString();

            // 2. Update User to link to Company
            await db.collection<User>("users").updateOne(
                { _id: userId }, // Assuming user _id is string in User interface, but in DB it might be string (Privy/Auth0) or ObjectId
                // Based on User interface `_id: string`, let's assume it matches.
                {
                    $set: {
                        companyId: companyId,
                        isLogisticsClient: true // Being a company implies logistics client?
                    }
                },
                { session }
            );

            return companyId;
        });

        // Retrieving the ID is tricky with `withTransaction` return values in some driver versions if not careful, 
        // but typically we can get it. For simplicity in this action wrapper:

        // Fetch the company we just created to get the ID back safely or query by owner
        const createdCompany = await db.collection<Company>("companies").findOne({ ownerUserId: userId }, { sort: { createdAt: -1 } });

        if (!createdCompany) {
            throw new Error("Company creation failed transactionally.");
        }

        return { success: true, message: "Company created successfully.", companyId: createdCompany._id?.toString() };

    } catch (error) {
        console.error("Error creating company:", error);
        return { success: false, message: "Failed to create company. Please try again." };
    } finally {
        await session.endSession();
    }
};
