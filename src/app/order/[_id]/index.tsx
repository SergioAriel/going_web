'use client'

import { useEffect, useState } from "react";
import { useParams } from "next/navigation";
import { Order, Shipment } from "@/interfaces";
import { getOrder } from "@/lib/ServerActions/orders";
import { getShipments, updateShipment } from "@/lib/ServerActions/shipments";
import { useUser } from "@/context/UserContext";
import { ShipmentCard } from "@/components/shipments/ShipmentCard";
import { QRCodeSVG } from "qrcode.react";
import QrScanner from "@/components/orders/QrScanner";
import { useAlert } from "@/context/AlertContext";

const statusOrder: Record<string, number> = {
    'pending': 1, 'ready_to_ship': 2, 'in_transit': 3, 'shipped_by_seller': 4, 
    'shipped': 5, 'delivered': 6, 'completed': 7, 'cancelled': 8,
};

const OrderDetailPage = () => {
    const params = useParams();
    const { userData } = useUser();
    const _id = params._id as string;

    const [order, setOrder] = useState<Order | null>(null);
    const [shipments, setShipments] = useState<Shipment[]>([]);
    const [loading, setLoading] = useState(true);
    const [showQR, setShowQR] = useState<string | null>(null);
    const [showScanner, setShowScanner] = useState<boolean>(false);
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

    const handleScanSuccess = async (decodedText: string) => {
        try {
            const shipmentId = decodedText;
            const shipmentToUpdate = shipments.find(s => s._id && s._id.toString() === shipmentId);

            if (!shipmentToUpdate) {
                handleAlert({ message: "Shipment not found for this order.", isError: true });
                return;
            }

            // 1. Determinar el estado correcto para la llamada a la API
            const newStatusForDb = shipmentToUpdate.shippingType === 'going_network' ? 'delivered' : 'completed';
            
            const updatedShipmentFromDb = await updateShipment(shipmentId, { status: newStatusForDb });

            if (updatedShipmentFromDb) {
                handleAlert({ message: "Shipment status updated successfully", isError: false });
                
                // 2. Actualizar el estado local, aplicando la lógica a nivel del mapeo
                setShipments(prevShipments => {
                    const updatedShipments = prevShipments.map(s => {
                        if (s._id && s._id.toString() === shipmentId) {
                            // Type guard para asegurar el estado correcto
                            if (s.shippingType === 'going_network') {
                                return { ...s, status: 'delivered' };
                            } else if (s.shippingType === 'self_delivery') {
                                return { ...s, status: 'completed' };
                            }
                        }
                        return s;
                    });
                    updatedShipments.sort((a, b) => (statusOrder[a.status] || 99) - (statusOrder[b.status] || 99));
                    // El 'as' es necesario porque TypeScript no puede inferir el tipo del array resultante del map con condicionales
                    return updatedShipments as Shipment[];
                });

                setShowScanner(false);
            } else {
                handleAlert({ message: "Error updating shipment status", isError: true });
            }
        } catch (error) {
            console.error(error);
            handleAlert({ message: "An unexpected error occurred.", isError: true });
        }
    };

    const handleScanFailure = (error: string) => {
        console.warn(`QR error = ${error}`);
        handleAlert({ message: `QR Scan Failed: ${error}`, isError: true });
    };

    if (loading) {
        return <div className="p-6">Loading order details...</div>;
    }

    if (!order) {
        return <div className="p-6">Order not found.</div>;
    }

    const isSellerOfOrder = order.sellers.includes(userData?._id.toString() || '');

    return (
        <div className="p-6">
            {showQR && (
                <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50" onClick={() => setShowQR(null)}>
                    <div className="bg-white p-4 rounded-lg"><QRCodeSVG value={showQR} size={256} /></div>
                </div>
            )}
            {showScanner && (
                <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
                    <div className="bg-white p-4 rounded-lg">
                        <QrScanner onScanSuccess={handleScanSuccess} onScanFailure={handleScanFailure} />
                        <button onClick={() => setShowScanner(false)} className="mt-4 px-4 py-2 bg-red-500 text-white rounded">Close Scanner</button>
                    </div>
                </div>
            )}

            <div className="max-w-4xl mx-auto">
                <div className="bg-white dark:bg-gray-800 shadow-lg rounded-lg p-6 mb-8">
                    <h1 className="text-2xl font-bold text-gray-900 dark:text-white">Order Details</h1>
                    <p className="text-gray-500 dark:text-gray-400">Order ID: {order._id.toString()}</p>
                    <p className="text-gray-500 dark:text-gray-400">Date: {new Date(order.date).toLocaleDateString()}</p>
                    <p className="text-gray-500 dark:text-gray-400">Status: <span className="font-medium text-primary">{order.status}</span></p>
                </div>

                <div className="flex justify-between items-center mb-6">
                    <h2 className="text-xl font-semibold text-gray-900 dark:text-white">Shipments for this Order</h2>
                    {isSellerOfOrder && (
                        <button onClick={() => setShowScanner(true)} className="px-4 py-2 bg-primary text-white rounded-lg">
                            Scan Delivery QR
                        </button>
                    )}
                </div>
                <div className="space-y-4">
                    {shipments.map(shipment => (
                        <ShipmentCard 
                            key={shipment._id.toString()} 
                            shipment={shipment} 
                            isBuyer={!isSellerOfOrder} 
                            isSeller={isSellerOfOrder} 
                            onShowQR={handleShowQR} 
                        />
                    ))}
                </div>
            </div>
        </div>
    );
};

export default OrderDetailPage;
