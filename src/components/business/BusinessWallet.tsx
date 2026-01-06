'use client';

import React, { useState, useEffect } from 'react';
import { usePrivy } from '@privy-io/react-auth';
import { useSolanaWallets } from '@privy-io/react-auth/solana';
import { Connection, PublicKey, clusterApiUrl, Transaction, LAMPORTS_PER_SOL } from '@solana/web3.js';
import { getAssociatedTokenAddress, createTransferInstruction, getAccount, TokenAccountNotFoundError, TokenInvalidAccountOwnerError, createAssociatedTokenAccountInstruction } from '@solana/spl-token';
import toast from 'react-hot-toast';
import Link from 'next/link';

import { createDirectShipments } from '@/lib/ServerActions/shipments';
import { Address } from '@/interfaces';

// Custom Devnet Token Mint (Going Test Token)
const USDC_MINT_ADDRESS = new PublicKey("8n1XjGgyatujGrxri8c7LDgqquWwjE4PeLgJ835tAxPw");
// Platform Wallet Address (The destination for funds)
const PLATFORM_WALLET_ADDRESS = new PublicKey("FKcaXhC76Qm1u9EtGQAiE1vtLxCFJaAB3M1PsEpeyXpi");

interface BusinessWalletProps {
    totalCost: number;
    shipmentsData: any[];
    pickupAddress: Address;
    onPaymentSuccess?: (shipments?: any[]) => void;
}

export default function BusinessWallet({ totalCost, shipmentsData, pickupAddress, onPaymentSuccess }: BusinessWalletProps) {
    const { login, authenticated, user } = usePrivy();
    const { wallets } = useSolanaWallets();
    const [balance, setBalance] = useState(0);
    const [solBalance, setSolBalance] = useState(0);
    const [isProcessing, setIsProcessing] = useState(false);

    const wallet = wallets[0];

    const fetchBalance = async () => {
        if (wallet?.address) {
            try {
                const connection = new Connection(clusterApiUrl('devnet'), 'confirmed');
                const publicKey = new PublicKey(wallet.address);

                // Fetch SOL Balance
                const sol = await connection.getBalance(publicKey);
                setSolBalance(sol / LAMPORTS_PER_SOL);

                // Get Associated Token Account for USDC
                const associatedTokenAddress = await getAssociatedTokenAddress(
                    USDC_MINT_ADDRESS,
                    publicKey
                );

                try {
                    const account = await getAccount(connection, associatedTokenAddress);
                    // Assuming 6 decimals for USDC
                    setBalance(Number(account.amount) / 1_000_000);
                } catch (e: any) {
                    // Ignore TokenAccountNotFoundError, just means 0 balance
                    // Also ignore "Unable to fetch token metadata" if it comes from here
                    console.warn("Error fetching USDC balance (likely 0):", e);
                    setBalance(0);
                }
            } catch (error) {
                console.error("Error connecting to Solana:", error);
                // Don't crash the app
            }
        }
    };

    useEffect(() => {
        if (authenticated && wallet) {
            fetchBalance();
        }
    }, [authenticated, wallet]);

    const handlePay = async () => {
        if (!user?.id || !wallet) {
            console.error("User or wallet missing");
            return;
        }

        if (balance < totalCost) {
            toast.error(`Insufficient USDC balance. Have: ${balance}, Need: ${totalCost}`);
            return;
        }

        setIsProcessing(true);
        try {
            const connection = new Connection(clusterApiUrl('devnet'), 'confirmed');
            const publicKey = new PublicKey(wallet.address);
            const { blockhash } = await connection.getLatestBlockhash();

            // 1. Get Source ATA
            const sourceATA = await getAssociatedTokenAddress(
                USDC_MINT_ADDRESS,
                publicKey
            );

            // 2. Get Destination ATA (Platform)
            const destinationATA = await getAssociatedTokenAddress(
                USDC_MINT_ADDRESS,
                PLATFORM_WALLET_ADDRESS
            );

            // 2.1 Check if Destination ATA exists
            const destinationAccountInfo = await connection.getAccountInfo(destinationATA);

            const transaction = new Transaction();
            transaction.recentBlockhash = blockhash;
            transaction.feePayer = publicKey;

            if (!destinationAccountInfo) {
                console.log("Destination ATA does not exist. Creating it...");
                transaction.add(
                    createAssociatedTokenAccountInstruction(
                        publicKey, // Payer
                        destinationATA,
                        PLATFORM_WALLET_ADDRESS,
                        USDC_MINT_ADDRESS
                    )
                );
            }

            // 3. Add Transfer Instruction
            // Amount in smallest unit (6 decimals for USDC)
            const amount = Math.round(totalCost * 1_000_000);

            transaction.add(
                createTransferInstruction(
                    sourceATA,
                    destinationATA,
                    publicKey,
                    amount
                )
            );

            // 4. Send Transaction
            const signature = await wallet.sendTransaction(transaction, connection);
            await connection.confirmTransaction(signature, 'confirmed');

            // 5. Create Shipments - CORRECTED ORDER: shipmentsData, userId, signature, pickupAddress
            const result = await createDirectShipments(shipmentsData, user.id, signature, pickupAddress);

            if (result.success) {
                toast.success(`Payment of $${totalCost.toFixed(2)} USDC successful!`);
                if (onPaymentSuccess) {
                    onPaymentSuccess(result.shipments);
                }
                // Refresh balance
                await fetchBalance();
            } else {
                toast.error("Failed to create shipments. Please try again.");
            }

        } catch (error) {
            console.error("Payment error:", error);
            toast.error("An error occurred during payment.");
        } finally {
            setIsProcessing(false);
        }
    };

    if (!authenticated) {
        return (
            <button
                onClick={login}
                className="w-full bg-black text-white py-3 rounded-lg font-bold hover:bg-gray-800 transition"
            >
                Connect Wallet to Pay
            </button>
        );
    }

    return (
        <div className="bg-gray-50 p-4 rounded-lg border border-gray-200 mt-4">
            <div className="flex justify-between items-center mb-4">
                <div>
                    <p className="text-sm text-gray-500">Connected Wallet</p>
                    <p className="font-mono text-sm font-bold text-gray-800">
                        {wallet?.address ? `${wallet.address.slice(0, 6)}...${wallet.address.slice(-4)}` : 'No Address'}
                    </p>
                </div>
                <div className="text-right">
                    <p className="text-sm text-gray-500">Available Balance</p>
                    <p className="text-xl font-bold text-green-600">${balance.toFixed(2)} USDC (Test)</p>
                    <p className="text-xs text-gray-400">{solBalance.toFixed(4)} SOL</p>
                </div>
            </div>

            {solBalance < 0.002 && (
                <div className="mb-4 bg-red-50 border-l-4 border-red-400 p-4">
                    <p className="text-sm text-red-700">
                        Warning: Low SOL balance ({solBalance.toFixed(4)}). You need SOL to pay for transaction gas fees.
                    </p>
                </div>
            )}

            {balance < totalCost && (
                <div className="mb-4 bg-yellow-50 border-l-4 border-yellow-400 p-4">
                    <div className="flex">
                        <div className="ml-3">
                            <p className="text-sm text-yellow-700">
                                Insufficient balance. You need ${(totalCost - balance).toFixed(2)} USDC more.
                            </p>
                        </div>
                    </div>
                </div>
            )}

            <div className="flex gap-3">
                <Link
                    href="/logistics/dashboard/wallet"
                    className="flex-1 bg-white border border-gray-300 text-gray-700 py-2 rounded-lg font-semibold hover:bg-gray-50 transition text-center flex items-center justify-center"
                >
                    + Add Funds
                </Link>
                <button
                    onClick={handlePay}
                    disabled={balance < totalCost || isProcessing}
                    className={`flex-1 py-2 rounded-lg font-bold text-white transition ${balance < totalCost || isProcessing
                        ? 'bg-gray-400 cursor-not-allowed'
                        : 'bg-black hover:bg-gray-800'
                        }`}
                >
                    {isProcessing ? 'Processing...' : `Pay $${totalCost.toFixed(2)} USDC`}
                </button>
            </div>
        </div>
    );
}
