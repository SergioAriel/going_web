import { useEffect, useState } from "react";
import { Order } from "@/interfaces";
import { getOrders } from "@/lib/ServerActions/orders";
import { useUser as useUserPrivy } from "@privy-io/react-auth";
import { useUser } from "@/context/UserContext";
import { useSolanaWallets } from "@privy-io/react-auth/solana";
import { OrderCard } from "@/components/orders/OrderCard";

export const OrdersTab = () => {
  const { userData } = useUser()
  const { user } = useUserPrivy()
  const [ordersBuyer, setOrderBuyer] = useState<Order[]>([]);
  const [ordersSeller, setOrderSeller] = useState<Order[]>([]);
  const { wallets } = useSolanaWallets();

  useEffect(() => {
    (async () => {
      if (userData?._id) {
        const resOrdersBuyer = await getOrders({ sellers: userData._id.toString() })
        setOrderSeller(resOrdersBuyer)
      }

      const connectedWallets = wallets.map(wallet => wallet?.address.toString());
      if (connectedWallets.length > 0 || userData?._id) {
        const query = {
          $or: [
            { 'buyer.walletAddress': { $in: connectedWallets } },
            { 'buyer._id': userData?._id.toString() }
          ]
        };
        const resOrdersSeller = await getOrders(query)
        setOrderBuyer(resOrdersSeller)
      }
    })()
  }, [userData, wallets])

  console.log(user, wallets, userData)

  return (
    <div className="p-6">
      <div className="grid grid-cols-1 xl:grid-cols-2 gap-6">
        {/* Columna de Órdenes de Compra */}
        <div>
          <h2 className="text-xl font-semibold text-gray-900 dark:text-white mb-6">My Purchase Orders</h2>
          <div className="space-y-4">
            {ordersBuyer.map((order) => (
              <OrderCard key={order._id.toString()} order={order} />
            ))}
          </div>
        </div>

        {/* Columna de Órdenes de Venta (condicional) */}
        {userData?.isSeller && (
          <div>
            <h2 className="text-xl font-semibold text-gray-900 dark:text-white mb-6">My Sales Orders</h2>
            <div className="space-y-4">
              {ordersSeller.map((order) => (
                <OrderCard key={order._id.toString()} order={order} />
              ))}
            </div>
          </div>
        )}
      </div>
    </div>
  );
};