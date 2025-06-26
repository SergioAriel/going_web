'use client';

import { useEffect, useState } from 'react';
import { useParams } from 'next/navigation';
import { Order } from '@/interfaces';
import { getOrder, updateOrder } from '@/lib/ServerActions/orders';
import { useUser } from '@/context/UserContext';
import { useSolanaWallets } from '@privy-io/react-auth/solana';
import { CheckCircleIcon, QrCodeIcon, ShoppingCartIcon, UserCircleIcon } from '@heroicons/react/24/outline';

const OrderDetailPage = () => {
  const { _id } = useParams();
  const { userData } = useUser();
  const { wallets } = useSolanaWallets();
  const [order, setOrder] = useState<Order | null>(null);
  const [loading, setLoading] = useState(true);
  const [isBuyer, setIsBuyer] = useState(false);

  useEffect(() => {
    if (typeof _id === 'string') {
      const fetchOrder = async () => {
        setLoading(true);
        const fetchedOrder = await getOrder({ _id });
        setOrder(fetchedOrder);
        setLoading(false);
      };
      fetchOrder();
    }
  }, [_id]);

  useEffect(() => {
    if (order) {
      const connectedWalletAddresses = wallets.map(wallet => wallet.address);
      const isWalletMatch = connectedWalletAddresses.includes(order.buyer.walletAddress);
      const isUserMatch = userData?._id.toString() === order?.buyer?._id?.toString();
      setIsBuyer(isWalletMatch || isUserMatch);
    }
  }, [order, userData, wallets]);

  const handleConfirmReception = async () => {
    if (order) {
      // Here you would integrate with the Solana contract
      alert('Order reception confirmed (simulation). Integrating with Solana contract is the next step.');
      // Optionally update the order status in the database
      await updateOrder({ _id: order._id, status: 'delivered' });
      const updatedOrder = await getOrder({ _id: order._id as string });
      setOrder(updatedOrder);
    }
  };

  if (loading) {
    return <div className="flex justify-center items-center h-screen"><p>Loading order details...</p></div>;
  }

  if (!order) {
    return <div className="flex justify-center items-center h-screen"><p>Order not found.</p></div>;
  }

  const total = order.items.reduce((acc, item) => acc + item.price * item.quantity, 0);

  return (
    <div className="bg-gray-50 dark:bg-gray-900 p-4 sm:p-6 lg:p-8">
      <div className="bg-white dark:bg-gray-800 shadow-lg rounded-lg overflow-hidden">
        <div className="p-6 border-b border-gray-200 dark:border-gray-700">
          <h1 className="text-2xl sm:text-3xl font-bold text-gray-900 dark:text-white">Order Details</h1>
          <p className="text-sm text-gray-500 dark:text-gray-400 mt-1">Order ID: {order._id as string}</p>
        </div>

        <div className="p-6">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {/* Left Column: Items and Total */}
            <div className="space-y-6">
              <div>
                <h2 className="text-lg font-semibold text-gray-800 dark:text-gray-200 mb-3 flex items-center">
                  <ShoppingCartIcon className="h-6 w-6 mr-2" />
                  Items
                </h2>
                <ul className="space-y-4">
                  {order.items.map((item, index) => (
                    <li key={index} className="flex justify-between items-center p-3 bg-gray-50 dark:bg-gray-700 rounded-md">
                      <div>
                        <p className="font-semibold text-gray-900 dark:text-white">{item.name}</p>
                        <p className="text-sm text-gray-600 dark:text-gray-400">Quantity: {item.quantity}</p>
                      </div>
                      <p className="text-md font-medium text-gray-800 dark:text-gray-200">{item.currency} {(item.price * item.quantity).toFixed(2)}</p>
                    </li>
                  ))}
                </ul>
              </div>
              <div className="text-right pt-4 border-t border-gray-200 dark:border-gray-700">
                <p className="text-lg font-bold text-gray-900 dark:text-white">Total: {order.items[0]?.currency} {total.toFixed(2)}</p>
              </div>
            </div>

            {/* Right Column: Status, Buyer Info, and Actions */}
            <div className="space-y-6">
              <div>
                <h2 className="text-lg font-semibold text-gray-800 dark:text-gray-200 mb-3">Status</h2>
                <span className={`inline-flex items-center px-3 py-1 rounded-full text-sm font-medium
                  ${order.status === 'delivered' ? 'bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-300' :
                    order.status === 'in_transit' ? 'bg-blue-100 text-blue-800 dark:bg-blue-900 dark:text-blue-300' :
                    'bg-yellow-100 text-yellow-800 dark:bg-yellow-900 dark:text-yellow-300'}`}>
                  {order.status.replace('_', ' ').toUpperCase()}
                </span>
              </div>

              <div>
                <h2 className="text-lg font-semibold text-gray-800 dark:text-gray-200 mb-3 flex items-center">
                  <UserCircleIcon className="h-6 w-6 mr-2" />
                  Buyer Information
                </h2>
                <div className="text-gray-700 dark:text-gray-300">
                  <p>Name: {order?.decryptedAddress?.fullName}</p>
                  <p>Wallet: {order.buyer.walletAddress}</p>
                </div>
              </div>

              {isBuyer && order.status !== 'delivered' && (
                <div className="p-4 border-t border-gray-200 dark:border-gray-700">
                  <h2 className="text-lg font-semibold text-gray-800 dark:text-gray-200 mb-4">Confirm Reception</h2>
                  <div className="flex flex-col items-center justify-center p-6 bg-gray-50 dark:bg-gray-700 rounded-lg text-center">
                    <div className="mb-4">
                      <p className="text-sm text-gray-600 dark:text-gray-400 mb-2">Scan the QR code from the seller or click the button to confirm you have received your order.</p>
                      <div className="w-32 h-32 bg-gray-200 dark:bg-gray-600 flex items-center justify-center rounded-md mx-auto">
                        <QrCodeIcon className="h-16 w-16 text-gray-400 dark:text-gray-500" />
                      </div>
                      <p className="text-xs text-gray-500 dark:text-gray-400 mt-2">(QR Code from Solana Contract)</p>
                    </div>
                    <button
                      onClick={handleConfirmReception}
                      className="w-full bg-green-500 text-white font-bold py-2 px-4 rounded-lg hover:bg-green-600 transition duration-300 flex items-center justify-center"
                    >
                      <CheckCircleIcon className="h-5 w-5 mr-2" />
                      I Have Received My Order
                    </button>
                  </div>
                </div>
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default OrderDetailPage;