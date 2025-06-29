import { useEffect, useState } from "react";
import { Order } from "@/interfaces";
import { getOrders, updateOrder } from "@/lib/ServerActions/orders";
import { useUser } from "@/context/UserContext";
import { useSolanaWallets } from "@privy-io/react-auth/solana";
import { OrderCard } from "@/components/orders/OrderCard";
import {QRCodeSVG} from "qrcode.react";
import QrScanner from "@/components/orders/QrScanner";
import { useAlert } from "@/context/AlertContext";

export const OrdersTab = () => {
  const { userData } = useUser();
  const [ordersBuyer, setOrderBuyer] = useState<Order[]>([]);
  const [ordersSeller, setOrderSeller] = useState<Order[]>([]);
  const { wallets } = useSolanaWallets();
  const [showQR, setShowQR] = useState<string | null>(null);
  const [showScanner, setShowScanner] = useState<boolean>(false);
  const { handleAlert } = useAlert();


  useEffect(() => {
    (async () => {
      if (userData?._id) {
        const resOrdersBuyer = await getOrders({ sellers: userData._id.toString() });
        setOrderSeller(resOrdersBuyer);
      }

      const connectedWallets = wallets.map(wallet => wallet?.address.toString());
      if (connectedWallets.length > 0 || userData?._id) {
        const query = {
          $or: [
            { 'buyer.walletAddress': { $in: connectedWallets } },
            { 'buyer._id': userData?._id.toString() }
          ]
        };
        const resOrdersSeller = await getOrders(query);
        setOrderBuyer(resOrdersSeller);
      }
    })();
  }, [userData, wallets]);

  const handleShowQR = (orderId: string) => {
    setShowQR(orderId);
  };

  const handleScanSuccess = async (decodedText: string) => {
    try {
      const order = await updateOrder({
        _id: decodedText,
        status: "delivered"
      })
      if (order) {
        handleAlert({
          message: "Order delivered successfully",
          isError: false
        })
      } else {
        handleAlert({
          message: "Error delivering order",
          isError: true
        })
      }
    } catch (error) {
      console.error(error);
    }
  };

  const handleScanFailure = (error: string) => {
    console.warn(`QR error = ${error}`);
  };

  return (
    <div className="p-6">
      {showQR && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50" onClick={() => setShowQR(null)}>
          <div className="bg-white p-4 rounded-lg">
            <QRCodeSVG value={showQR} size={256} />
          </div>
        </div>
      )}
      {showScanner && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white p-4 rounded-lg">
            <QrScanner onScanSuccess={handleScanSuccess} onScanFailure={handleScanFailure} />
            <button onClick={() => setShowScanner(false)} className="mt-4 px-4 py-2 bg-red-500 text-white rounded">
              Close Scanner
            </button>
          </div>
        </div>
      )}
      <div className="grid grid-cols-1 xl:grid-cols-2 gap-6">
        <div>
          <h2 className="text-xl font-semibold text-gray-900 dark:text-white mb-6">My Purchase Orders</h2>
          <div className="space-y-4">
            {ordersBuyer.map((order) => (
              <OrderCard key={order._id.toString()} order={order} isBuyer onShowQR={handleShowQR} />
            ))}
          </div>
        </div>
        {userData?.isSeller && (
          <div>
            <div className="flex justify-between items-center mb-6">
              <h2 className="text-xl font-semibold text-gray-900 dark:text-white">My Sales Orders</h2>
              <button onClick={() => setShowScanner(true)} className="px-4 py-2 bg-primary text-white rounded-lg">
                Scan QR
              </button>
            </div>
            <div className="space-y-4">
              {ordersSeller.map((order) => (
                <OrderCard key={order._id.toString()} order={order} isSeller />
              ))}
            </div>
          </div>
        )}
      </div>
    </div>
  );
};
