'use client';

import { useEffect, useState } from 'react';
import { useParams, useSearchParams } from 'next/navigation';
import { Order } from '@/interfaces';
import { getOrder, updateOrder } from '@/lib/ServerActions/orders';
import { useSocket } from '@/context/SocketContext';
import dynamic from 'next/dynamic';
import { QrCodeIcon, ShoppingCartIcon, UserCircleIcon } from '@heroicons/react/24/outline';
import QrScanner from '@/components/orders/QrScanner';
import { QRCodeSVG } from 'qrcode.react';

const MapDisplay = dynamic(() => import('@/components/layout/MapDisplay'), { ssr: false });

const OrderDetailPage = () => {
  const { _id } = useParams();
  const socket = useSocket();
  const [deliveryLocation, setDeliveryLocation] = useState<{ lat: number, lng: number } | null>(null);
  const [order, setOrder] = useState<Order | null>(null);
  const [loading, setLoading] = useState(true);
  const [showScanner, setShowScanner] = useState(false);
  const [showSellerQR, setShowSellerQR] = useState(false);
  const searchParams = useSearchParams();
  const conditionUser = searchParams.get('conditionUser');

  useEffect(() => {
    if (socket && _id) {
      socket.emit('join_order_room', _id);
      socket.on('location_updated', (location: { lat: number, lng: number }) => {
        setDeliveryLocation(location);
      });
      return () => {
        socket.off('location_updated');
      };
    }
  }, [socket, _id]);

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

  const handleScanSuccess = async (decodedText: string) => {
    setShowScanner(false);
    if (decodedText !== order?._id.toString()) {
      alert("Error: The scanned QR code does not match this order.");
      return;
    }
    if (socket && order) {
      socket.emit('confirm_delivery', { orderId: order._id });
      await updateOrder({ _id: order._id as string, status: 'delivered' });
      const updatedOrder = await getOrder({ _id: order._id as string });
      setOrder(updatedOrder);
      alert('Order reception confirmed successfully!');
    } else {
      alert('Something went wrong. Please try again.');
    }
  };

  const handleOrderReadyToShip = async () => {
    if (order) {
      await updateOrder({
        _id: order._id as string,
        status: 'ready_to_ship',
      });
      const updatedOrder = await getOrder({ _id: order._id as string });
      setOrder(updatedOrder);
      setShowSellerQR(true);
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
    <div className="bg-gray-50 dark:bg-gray-900 p-4 sm:p-6 lg:p-8 h-screen">
      {showSellerQR && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50" onClick={() => setShowSellerQR(false)}>
          <div className="bg-white p-8 rounded-lg">
            <h2 className="text-2xl font-bold text-center mb-4">Deliver Order</h2>
            <QRCodeSVG value={order?._id.toString() || ''} size={256} />
          </div>
        </div>
      )}

      <div className="bg-white dark:bg-gray-800 shadow-lg rounded-lg overflow-hidden">
        <div className="p-6 border-b border-gray-200 dark:border-gray-700">
          <h1 className="text-2xl sm:text-3xl font-bold text-gray-900 dark:text-white">Order Details</h1>
          <p className="text-sm text-gray-500 dark:text-gray-400 mt-1">Order ID: {order._id as string}</p>
        </div>

        {showScanner ? (
          <div className="p-6">
            <h2 className="text-xl font-semibold text-center mb-4">Scan Delivery QR Code</h2>
            <QrScanner
              onScanSuccess={handleScanSuccess}
              onScanFailure={(error) => console.warn(`QR scan failed: ${error}`)}
            />
            <button onClick={() => setShowScanner(false)} className="mt-4 w-full bg-gray-500 text-white font-bold py-2 px-4 rounded-lg hover:bg-gray-600 transition duration-300">
              Cancel
            </button>
          </div>
        ) : (
          <div className="p-6">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
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
                {deliveryLocation && (
                  <div className="mt-6">
                    <h2 className="text-lg font-semibold text-gray-800 dark:text-gray-200 mb-3">Delivery Location</h2>
                    <MapDisplay lat={deliveryLocation.lat} lng={deliveryLocation.lng} />
                  </div>
                )}
              </div>

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

                {conditionUser === "seller" && order.status === 'ready_to_ship' && (
                  <div className="p-4 border-t border-gray-200 dark:border-gray-700">
                    <h2 className="text-lg font-semibold text-gray-800 dark:text-gray-200 mb-4">Mark as Ready for Pickup</h2>
                    <div className="flex flex-col items-center justify-center p-6 bg-gray-50 dark:bg-gray-700 rounded-lg text-center">
                      <div className="mb-4">
                        <p className="text-sm text-gray-600 dark:text-gray-400 mb-2">Click the button to generate a QR code for the delivery driver to scan.</p>
                      </div>
                      <button
                        onClick={handleOrderReadyToShip}
                        className="w-full bg-blue-500 text-white font-bold py-2 px-4 rounded-lg hover:bg-blue-600 transition duration-300 flex items-center justify-center"
                      >
                        <QrCodeIcon className="h-5 w-5 mr-2" />
                        Generate Pickup QR
                      </button>
                    </div>
                  </div>
                )}

                {conditionUser === "buyer" && order.status === 'in_transit' && (
                  <div className="p-4 border-t border-gray-200 dark:border-gray-700">
                    <h2 className="text-lg font-semibold text-gray-800 dark:text-gray-200 mb-4">Confirm Reception</h2>
                    <div className="flex flex-col items-center justify-center p-6 bg-gray-50 dark:bg-gray-700 rounded-lg text-center">
                      <div className="mb-4">
                        <p className="text-sm text-gray-600 dark:text-gray-400 mb-2">Click the button and scan the QR code from the delivery driver to confirm you have received your order.</p>
                      </div>
                      <button
                        onClick={() => setShowScanner(true)}
                        className="w-full bg-green-500 text-white font-bold py-2 px-4 rounded-lg hover:bg-green-600 transition duration-300 flex items-center justify-center"
                      >
                        <QrCodeIcon className="h-5 w-5 mr-2" />
                        Scan to Confirm Delivery
                      </button>
                    </div>
                  </div>
                )}
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default OrderDetailPage;