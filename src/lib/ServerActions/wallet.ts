'use server';

import { Connection, Keypair, PublicKey, clusterApiUrl, Transaction } from '@solana/web3.js';
import { getAssociatedTokenAddress, createAssociatedTokenAccountInstruction, createMintToInstruction, getAccount, TokenAccountNotFoundError, TokenInvalidAccountOwnerError } from '@solana/spl-token';

// Hardcoded for Demo/Devnet purposes only. NEVER do this in production.
const MINT_SECRET_KEY = Uint8Array.from([109, 198, 225, 164, 179, 253, 64, 121, 122, 168, 50, 67, 81, 98, 175, 206, 198, 170, 50, 159, 141, 37, 25, 177, 135, 148, 124, 250, 250, 147, 213, 206, 56, 158, 142, 140, 132, 221, 148, 209, 147, 26, 120, 97, 94, 188, 222, 23, 52, 139, 105, 1, 108, 43, 216, 243, 73, 117, 69, 32, 70, 166, 49, 201]);
const MINT_ADDRESS = new PublicKey("8n1XjGgyatujGrxri8c7LDgqquWwjE4PeLgJ835tAxPw");

export async function claimTestTokens(userWalletAddress: string) {
    try {
        const connection = new Connection(clusterApiUrl('devnet'), 'confirmed');
        const mintAuthority = Keypair.fromSecretKey(MINT_SECRET_KEY);
        const userPublicKey = new PublicKey(userWalletAddress);

        // 1. Get User's ATA
        const userATA = await getAssociatedTokenAddress(
            MINT_ADDRESS,
            userPublicKey
        );

        const transaction = new Transaction();

        // 2. Check if ATA exists, create if not
        try {
            await getAccount(connection, userATA);
        } catch (error: any) {
            if (error instanceof TokenAccountNotFoundError || error instanceof TokenInvalidAccountOwnerError) {
                console.log("Creating ATA for user...");
                transaction.add(
                    createAssociatedTokenAccountInstruction(
                        mintAuthority.publicKey, // Payer
                        userATA,
                        userPublicKey,
                        MINT_ADDRESS
                    )
                );
            } else {
                throw error;
            }
        }

        // 3. Mint Tokens (1000 Tokens with 6 decimals)
        const amount = 1000 * 1_000_000;
        transaction.add(
            createMintToInstruction(
                MINT_ADDRESS,
                userATA,
                mintAuthority.publicKey,
                amount
            )
        );

        // 4. Send Transaction
        const signature = await connection.sendTransaction(transaction, [mintAuthority]);
        await connection.confirmTransaction(signature, 'confirmed');

        return { success: true, signature };

    } catch (error: any) {
        console.error("Error claiming tokens:", error);
        return { success: false, error: error.message };
    }
}
