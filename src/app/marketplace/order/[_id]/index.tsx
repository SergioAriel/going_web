'use client'

import { useEffect, useState } from "react";
import { useParams } from "next/navigation";
import { Order, Shipment } from "@/interfaces";
import { getOrder } from "@/lib/ServerActions/orders";
import { getShipments, updateShipment } from "@/lib/ServerActions/shipments";
import { useUser } from "@/context/UserContext";
import { ShipmentCard } from "@/components/shipments/ShipmentCard";
import { QRCodeSVG } from "qrcode.react";

import { useAlert } from "@/context/AlertContext";

const statusOrder: Record<string, number> = {
    'pending': 1, 'ready_to_ship': 2, 'in_transit': 3, 'shipped_by_seller': 4,
    'shipped': 5, 'delivered': 6, 'completed': 7, 'cancelled': 8,
};

interface OrderDetailPageProps {
    id?: string;
    isSellerView?: boolean;
}

const OrderDetailPage = ({ id, isSellerView = false }: OrderDetailPageProps) => {
    const params = useParams();
    const { userData } = useUser();
    // Use the passed prop id, or fallback to params._id
    const _id = id || (params?._id as string);

    const [order, setOrder] = useState<Order | null>(null);
    const [shipments, setShipments] = useState<Shipment[]>([]);
    const [loading, setLoading] = useState(true);
    const [showQR, setShowQR] = useState<string | null>(null);

    const { handleAlert } = useAlert();

    useEffect(() => {
        if (!_id) return;
        (async () => {
            setLoading(true);
            const orderData = await getOrder(_id);
            setOrder(orderData);

            if (orderData) {
                const shipmentData = await getShipments({ orderId: _id });
                shipmentData.sort((a, b) => (statusOrder[a.status] || 99) - (statusOrder[b.status] || 99));
                setShipments(shipmentData);
            }
            setLoading(false);
        })();
    }, [_id]);

    const handleShowQR = (shipmentId: string) => {
        setShowQR(shipmentId);
    };



    if (loading) {
        return <div className="p-6">Loading order details...</div>;
    }

    if (!order) {
        return <div className="p-6">Order not found.</div>;
    }

    if (!order) {
        return <div className="p-6">Order not found.</div>;
    }

    // We now use the explicit prop passed from the page context
    const showSellerControls = isSellerView;
    const showBuyerControls = !isSellerView;

    return (
        <div className="min-h-screen bg-gray-50 dark:bg-gray-900 py-8">
            <div className="container mx-auto px-4">
                {showQR && (
                    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4" onClick={() => setShowQR(null)}>
                        <div className="bg-white p-6 rounded-xl shadow-2xl flex flex-col items-center max-w-sm w-full" onClick={(e) => e.stopPropagation()}>
                            <h3 className="text-lg font-bold mb-4 text-gray-900">Scan this QR Code</h3>
                            <div className="bg-white p-2 rounded">
                                <QRCodeSVG value={showQR} size={256} />
                            </div>
                            <p className="mt-4 text-sm text-center text-gray-500">
                                {showSellerControls ? "Show to Driver for Pickup" : "Show to Driver for Delivery"}
                            </p>
                            <button
                                onClick={() => setShowQR(null)}
                                className="mt-6 w-full py-2 bg-gray-200 hover:bg-gray-300 text-gray-800 rounded-lg font-medium"
                            >
                                Close
                            </button>
                        </div>
                    </div>
                )}


                <div className="max-w-4xl mx-auto">
                    <div className="bg-white dark:bg-gray-800 shadow-lg rounded-lg p-6 mb-8">
                        <h1 className="text-2xl font-bold text-gray-900 dark:text-white">Order Details</h1>
                        <p className="text-gray-500 dark:text-gray-400">Order ID: {order._id?.toString()}</p>
                        <p className="text-gray-500 dark:text-gray-400">Date: {new Date(order.date).toLocaleDateString()}</p>
                        <p className="text-gray-500 dark:text-gray-400">Status: <span className="font-medium text-primary">{order.status}</span></p>

                        {/* DEBUG: View Mode Indicator (Removable later) */}
                        <div className="mt-2 inline-block px-2 py-1 bg-gray-200 dark:bg-gray-700 rounded text-xs text-gray-600 dark:text-gray-300">
                            View: {showSellerControls ? "Seller (Management)" : "Buyer (Tracking)"}
                        </div>
                    </div>

                    <div className="flex justify-between items-center mb-6">
                        <h2 className="text-xl font-semibold text-gray-900 dark:text-white">Shipments for this Order</h2>

                    </div>
                    <div className="space-y-4">
                        {shipments.length === 0 ? (
                            <div className="text-center py-12 bg-white dark:bg-gray-800 rounded-lg shadow-sm border border-gray-200 dark:border-gray-700">
                                <p className="text-gray-500 dark:text-gray-400 font-medium">No shipments generated yet.</p>
                                {order.status === 'payment_pending' && (
                                    <p className="text-sm text-yellow-600 mt-2">
                                        This order is pending payment processing. Shipments will be created once payment is confirmed.
                                    </p>
                                )}
                            </div>
                        ) : (
                            shipments.map(shipment => (
                                <ShipmentCard
                                    key={shipment._id.toString()}
                                    shipment={shipment}
                                    isSeller={showSellerControls}
                                    // Logic Update for Dual QR:
                                    // 1. Seller: Shows QR if status is 'ready_to_ship' (Pickup Verification)
                                    // 2. Buyer: Shows QR if status is 'in_transit' or 'out_for_delivery' (Delivery Verification)
                                    onShowQR={(shipmentId) => {
                                        const s = shipments.find(sh => sh._id.toString() === shipmentId);
                                        if (!s) return;

                                        // Seller Logic
                                        if (showSellerControls && s.status === 'ready_to_ship') {
                                            handleShowQR(shipmentId);
                                        }
                                        // Buyer Logic
                                        else if (showBuyerControls && ['in_transit', 'out_for_delivery', 'ready_to_ship', 'pending'].includes(s.status)) {
                                            // Buyer can see it anytime active really, but strictly needed for delivery
                                            handleShowQR(shipmentId);
                                        }
                                    }}
                                />
                            ))
                        )}
                    </div>
                </div>
            </div>
        </div>

    );
};

export default OrderDetailPage;
