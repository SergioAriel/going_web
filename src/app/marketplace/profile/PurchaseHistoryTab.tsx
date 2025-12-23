'use client'

import { useEffect, useState } from "react";
import { Order } from "@/interfaces";
import { getOrders } from "@/lib/ServerActions/orders";
import { useUser } from "@/context/UserContext";
import { useWallets } from "@privy-io/react-auth";
import { OrderCard } from "@/components/orders/OrderCard";

export const PurchaseHistoryTab = () => {
  const { userData, loading: isUserLoading } = useUser();
  const { wallets } = useWallets();
  const [ordersBuyer, setOrdersBuyer] = useState<Order[]>([]);

  useEffect(() => {
    // Do not fetch until user data is loaded
    if (isUserLoading) return;

    (async () => {
      // Fetch buyer orders based on privy user id or connected wallets
      const privyUserId = userData?._id?.toString();
      const connectedWallets = wallets.map(wallet => wallet.address);

      // Only query if we have at least one identifier
      if (privyUserId || connectedWallets.length > 0) {
        const queryParts = [];
        if (privyUserId) {
          queryParts.push({ 'buyer._id': privyUserId });
        }
        if (connectedWallets.length > 0) {
          queryParts.push({ 'buyer.walletAddress': { $in: connectedWallets } });
        }

        const query = { $or: queryParts };
        const resOrdersBuyer = await getOrders(query);
        setOrdersBuyer(resOrdersBuyer);
      }
    })();
  }, [isUserLoading, userData, wallets]);

  return (
    <div>
      <h2 className="text-xl font-semibold text-gray-900 dark:text-white mb-6">My Purchase History</h2>
      {isUserLoading ? (
        <p>Loading orders...</p>
      ) : ordersBuyer.length > 0 ? (
        <div className="space-y-4">
          {ordersBuyer.map((order) => (
            <OrderCard key={order._id?.toString() || Math.random().toString()} order={order} isBuyer />
          ))}
        </div>
      ) : (
        <p className="text-gray-500 dark:text-gray-400">You haven't made any purchases yet.</p>
      )}
    </div>
  );
};