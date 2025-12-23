'use client';

import { useEffect, useState } from "react";
import { Order } from "@/interfaces";
import { getOrders } from "@/lib/ServerActions/orders";
import { useUser } from "@/context/UserContext";
import { OrderCard } from "@/components/orders/OrderCard";

export const SalesHistoryTab = () => {
  const { userData, loading: isUserLoading } = useUser();
  const [salesOrders, setSalesOrders] = useState<Order[]>([]);

  useEffect(() => {
    if (isUserLoading || !userData?.isSeller) return;

    (async () => {
      const resOrdersSeller = await getOrders({ sellers: userData._id.toString() });
      setSalesOrders(resOrdersSeller);
    })();
  }, [isUserLoading, userData]);

  return (
    <div>
      <h2 className="text-xl font-semibold text-gray-900 dark:text-white mb-6">My Sales History</h2>
      {isUserLoading ? (
        <p>Loading sales...</p>
      ) : salesOrders.length > 0 ? (
        <div className="space-y-4">
          {salesOrders.map((order) => (
            <OrderCard key={order._id?.toString() || Math.random().toString()} order={order} isSeller />
          ))}
        </div>
      ) : (
        <p className="text-gray-500 dark:text-gray-400">You have no sales yet.</p>
      )}
    </div>
  );
};