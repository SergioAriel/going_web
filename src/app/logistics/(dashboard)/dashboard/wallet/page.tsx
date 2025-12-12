'use client';

import React, { useState, useEffect } from 'react';
import { usePrivy } from '@privy-io/react-auth';
import { useSolanaWallets } from '@privy-io/react-auth/solana';
import { Connection, PublicKey, clusterApiUrl, LAMPORTS_PER_SOL } from '@solana/web3.js';
import { getAssociatedTokenAddress, getAccount, TokenAccountNotFoundError, TokenInvalidAccountOwnerError } from '@solana/spl-token';
import { ClipboardDocumentIcon, ArrowTopRightOnSquareIcon, CurrencyDollarIcon, BeakerIcon } from '@heroicons/react/24/outline';
import toast from 'react-hot-toast';
import { claimTestTokens } from '@/lib/ServerActions/wallet';

// Custom Devnet Token Mint (Going Test Token)
const USDC_MINT_ADDRESS = new PublicKey("8n1XjGgyatujGrxri8c7LDgqquWwjE4PeLgJ835tAxPw");

export default function WalletPage() {
    const { user, authenticated } = usePrivy();
    const { wallets } = useSolanaWallets();
    const [balance, setBalance] = useState<number>(0);
    const [usdcBalance, setUsdcBalance] = useState<number>(0);
    const [isLoading, setIsLoading] = useState(true);
    const [isClaiming, setIsClaiming] = useState(false);
    const [solanaPrice, setSolanaPrice] = useState<number>(0);

    // Get the primary wallet (usually the first one or the embedded one)
    const wallet = wallets[0];

    const fetchBalance = async () => {
        if (wallet?.address) {
            try {
                // Connect to Devnet (or Mainnet based on env)
                const connection = new Connection(clusterApiUrl('devnet'), 'confirmed');
                const publicKey = new PublicKey(wallet.address);

                // 1. Fetch SOL Balance
                const bal = await connection.getBalance(publicKey);
                setBalance(bal / LAMPORTS_PER_SOL);

                // 2. Fetch USDC Balance
                const associatedTokenAddress = await getAssociatedTokenAddress(
                    USDC_MINT_ADDRESS,
                    publicKey
                );

                try {
                    const account = await getAccount(connection, associatedTokenAddress);
                    setUsdcBalance(Number(account.amount) / 1_000_000);
                } catch (e: any) {
                    // Ignore metadata errors
                    console.warn("Error fetching USDC balance:", e);
                    if (e instanceof TokenAccountNotFoundError || e instanceof TokenInvalidAccountOwnerError) {
                        setUsdcBalance(0);
                    }
                }

            } catch (error) {
                console.error("Error fetching balance:", error);
            }
        }
        setIsLoading(false);
    };

    useEffect(() => {
        const fetchSolPrice = async () => {
            try {
                const response = await fetch('https://api.coingecko.com/api/v3/simple/price?ids=solana&vs_currencies=usd');
                const data = await response.json();
                setSolanaPrice(data.solana.usd);
            } catch (e) {
                console.error("Error fetching SOL price", e);
            }
        }

        if (authenticated && wallet) {
            fetchBalance();
            fetchSolPrice();
        } else if (authenticated && !wallet) {
            setIsLoading(false);
        }
    }, [wallet, authenticated]);

    const handleCopyAddress = () => {
        if (wallet?.address) {
            navigator.clipboard.writeText(wallet.address);
            toast.success("Address copied to clipboard!");
        }
    };

    const handleFundWallet = async () => {
        if (wallet?.walletClientType === 'privy') {
            // @ts-ignore
            if (user?.wallet?.fund) {
                // @ts-ignore
                await user.wallet.fund();
            } else {
                window.open("https://faucet.solana.com/", "_blank");
            }
        } else {
            toast("Please use your wallet extension to add funds.", { icon: '👛' });
        }
    };

    const handleClaimTestTokens = async () => {
        if (!wallet?.address) return;
        setIsClaiming(true);
        try {
            const result = await claimTestTokens(wallet.address);
            if (result.success) {
                toast.success(
                    <div>
                        Successfully claimed 1000 Test USDC!
                        <a
                            href={`https://solscan.io/tx/${result.signature}?cluster=devnet`}
                            target="_blank"
                            rel="noreferrer"
                            className="block mt-2 underline text-sm"
                        >
                            View on Solscan
                        </a>
                    </div>,
                    { duration: 5000 }
                );
                await fetchBalance(); // Refresh balance
            } else {
                toast.error("Failed to claim tokens: " + result.error);
            }
        } catch (e) {
            console.error(e);
            toast.error("Error claiming tokens.");
        } finally {
            setIsClaiming(false);
        }
    };

    if (isLoading) {
        return <div className="p-8 text-center">Loading wallet...</div>;
    }

    if (!wallet) {
        return (
            <div className="max-w-4xl mx-auto p-6 text-center">
                <h1 className="text-3xl font-bold mb-4">No Wallet Connected</h1>
                <p>Please connect a Solana wallet to view your balance.</p>
            </div>
        )
    }

    return (
        <div className="max-w-4xl mx-auto p-6">
            <h1 className="text-3xl font-bold mb-8 text-gray-900">My Wallet</h1>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                {/* Balance Card */}
                <div className="bg-black text-white rounded-xl p-8 shadow-lg relative overflow-hidden">
                    <div className="absolute top-0 right-0 p-4 opacity-10">
                        <svg className="w-32 h-32" fill="currentColor" viewBox="0 0 24 24"><path d="M12 2C6.48 2 2 6.48 2 12s4.48 10 10 10 10-4.48 10-10S17.52 2 12 2zm0 18c-4.41 0-8-3.59-8-8s3.59-8 8-8 8 3.59 8 8-3.59 8-8 8zm.31-8.86c-1.77-.45-2.34-.94-2.34-1.67 0-.84.79-1.43 2.1-1.43 1.38 0 1.9.66 1.94 1.64h1.71c-.05-1.34-.87-2.57-2.49-2.97V5H10.9v1.69c-1.51.32-2.72 1.3-2.72 2.81 0 1.79 1.49 2.69 3.66 3.21 1.95.46 2.34 1.15 2.34 1.87 0 .53-.39 1.39-2.1 1.39-1.6 0-2.23-.72-2.32-1.64H8.04c.1 1.7 1.36 2.66 2.86 2.97V19h2.34v-1.67c1.52-.29 2.72-1.16 2.73-2.77-.01-2.2-1.9-2.96-3.66-3.42z" /></svg>
                    </div>

                    <p className="text-gray-400 text-sm uppercase tracking-wider mb-2">Total Balance</p>
                    <div className="flex justify-between items-end mb-2">
                        <h2 className="text-5xl font-bold">{usdcBalance.toFixed(2)} USDC (Test)</h2>
                        <button
                            onClick={() => { setIsLoading(true); fetchBalance(); }}
                            className="text-xs bg-gray-800 hover:bg-gray-700 px-2 py-1 rounded text-gray-300 transition"
                        >
                            ↻ Refresh
                        </button>
                    </div>
                    <p className="text-gray-500 text-sm mb-6">SOL Balance: {balance.toFixed(4)} SOL (≈ ${(balance * solanaPrice).toFixed(2)})</p>

                    <div className="flex items-center space-x-2 bg-gray-800 rounded-lg p-2 mb-6 w-fit">
                        <span className="text-xs text-gray-400 font-mono truncate max-w-[150px]">{wallet.address}</span>
                        <button onClick={handleCopyAddress} className="text-gray-400 hover:text-white transition">
                            <ClipboardDocumentIcon className="w-4 h-4" />
                        </button>
                    </div>

                    <div className="flex gap-3">
                        <button
                            onClick={handleFundWallet}
                            className="flex-1 bg-white text-black font-bold py-3 px-4 rounded-lg hover:bg-gray-100 transition flex items-center justify-center"
                        >
                            <ArrowTopRightOnSquareIcon className="w-5 h-5 mr-2" />
                            Fund SOL
                        </button>
                        <button
                            onClick={handleClaimTestTokens}
                            disabled={isClaiming}
                            className="flex-1 bg-blue-600 text-white font-bold py-3 px-4 rounded-lg hover:bg-blue-700 transition flex items-center justify-center disabled:opacity-50"
                        >
                            <BeakerIcon className="w-5 h-5 mr-2" />
                            {isClaiming ? 'Claiming...' : 'Get 1000 Test USDC'}
                        </button>
                    </div>
                </div>

                {/* Recent Transactions (Mock for now, could fetch from Solscan) */}
                <div className="bg-white rounded-xl p-6 shadow-lg border border-gray-100">
                    <h3 className="text-lg font-bold mb-4 text-gray-800">Recent Transactions</h3>
                    <div className="space-y-4">
                        <div className="flex justify-between items-center border-b pb-2">
                            <div>
                                <p className="font-medium">System</p>
                                <p className="text-xs text-gray-500">Live on Solana Devnet</p>
                            </div>
                            <span className="text-green-600 font-bold">Active</span>
                        </div>
                        <p className="text-center text-gray-400 text-sm mt-4">Transaction history coming soon.</p>
                    </div>
                </div>
            </div>
        </div>
    );
}
