'use client';

import { useEffect, useState, useCallback } from "react";
import Image from "next/image";
import { Shipment } from "@/interfaces";
import { getShipments, requestPickupForShipments } from "@/lib/ServerActions/shipments";
import { useUser } from "@/context/UserContext";
import { useAlert } from "@/context/AlertContext";
import { TruckIcon, ChevronDownIcon } from "@heroicons/react/24/outline";

export const ShipmentsTab = () => {
    const { userData } = useUser();
    const { handleAlert } = useAlert();
    const [shipments, setShipments] = useState<Shipment[]>([]);
    const [selectedShipments, setSelectedShipments] = useState<string[]>([]);
    const [loading, setLoading] = useState(true);
    const [submitting, setSubmitting] = useState(false);
    const [expandedShipmentId, setExpandedShipmentId] = useState<string | null>(null);

    const fetchPendingShipments = useCallback(async () => {
        if (!userData?._id) return;
        setLoading(true);
        try {
            const pendingShipments = await getShipments({
                sellerId: userData._id.toString(),
                status: 'pending',
                shippingType: 'going_network'
            });
            setShipments(pendingShipments);
        } catch (error) {
            console.error("Failed to fetch pending shipments:", error);
            handleAlert({ message: "Failed to load shipments.", isError: true });
        } finally {
            setLoading(false);
        }
    }, [userData?._id, handleAlert]);

    useEffect(() => {
        fetchPendingShipments();
    }, [fetchPendingShipments]);

    const handleCheckboxChange = (shipmentId: string) => {
        setSelectedShipments(prev =>
            prev.includes(shipmentId)
                ? prev.filter(id => id !== shipmentId)
                : [...prev, shipmentId]
        );
    };

    const handleToggleExpand = (shipmentId: string) => {
        setExpandedShipmentId(prev => prev === shipmentId ? null : shipmentId);
    };

    const handleRequestPickup = async () => {
        if (selectedShipments.length === 0) {
            handleAlert({ message: "Please select at least one shipment.", isError: true });
            return;
        }
        setSubmitting(true);
        try {
            const result = await requestPickupForShipments(selectedShipments);
            if (result.status) {
                handleAlert({ message: `${result.modifiedCount} shipments are now ready for pickup!`, isError: false });
                setSelectedShipments([]);
                fetchPendingShipments(); // Refresh the list
            } else {
                throw new Error(result.message || "Failed to request pickup.");
            }
        } catch (error: unknown) {
            console.error("Error requesting pickup:", error);
            let message = "An error occurred.";
            if (error instanceof Error) {
                message = error.message;
            }
            handleAlert({ message, isError: true });
        } finally {
            setSubmitting(false);
        }
    };

    if (loading) {
        return <div>Loading pending shipments...</div>;
    }

    return (
        <div>
            <h2 className="text-xl font-semibold text-gray-900 dark:text-white mb-6">Pending Shipments</h2>
            {shipments.length === 0 ? (
                <div className="text-center py-10 px-4 border-2 border-dashed border-gray-300 dark:border-gray-700 rounded-lg">
                    <TruckIcon className="mx-auto h-12 w-12 text-gray-400" />
                    <h3 className="mt-2 text-sm font-medium text-gray-900 dark:text-white">No pending shipments</h3>
                    <p className="mt-1 text-sm text-gray-500 dark:text-gray-400">New sales from your products will appear here, ready to be shipped.</p>
                </div>
            ) : (
                <div className="space-y-4">
                    <div className="flex justify-end">
                        <button
                            onClick={handleRequestPickup}
                            disabled={selectedShipments.length === 0 || submitting}
                            className="px-6 py-2 bg-primary hover:bg-primary-dark text-white rounded-lg font-medium transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                        >
                            {submitting ? "Submitting..." : `Request Pickup (${selectedShipments.length})`}
                        </button>
                    </div>
                    <div className="border border-gray-200 dark:border-gray-700 rounded-lg overflow-hidden">
                        <ul className="divide-y divide-gray-200 dark:divide-gray-700">
                            {shipments.map(shipment => (
                                <li key={shipment._id.toString()} className="p-4">
                                    <div className="flex items-center space-x-4">
                                        <input
                                            type="checkbox"
                                            className="h-4 w-4 rounded border-gray-300 text-primary focus:ring-primary"
                                            checked={selectedShipments.includes(shipment._id.toString())}
                                            onChange={() => handleCheckboxChange(shipment._id.toString())}
                                        />
                                        <div className="flex-1">
                                            <p className="text-sm font-medium text-gray-900 dark:text-white">Order ID: ...{shipment.orderId.slice(-6)}</p>
                                            <p className="text-sm text-gray-500 dark:text-gray-400">
                                                {shipment.items.length} item(s) to {shipment.deliveryAddress.city}, {shipment.deliveryAddress.state}
                                            </p>
                                        </div>
                                        <button onClick={() => handleToggleExpand(shipment._id.toString())} className="p-2 rounded-full hover:bg-gray-100 dark:hover:bg-gray-700">
                                            <ChevronDownIcon className={`h-5 w-5 text-gray-400 transition-transform ${expandedShipmentId === shipment._id.toString() ? 'rotate-180' : ''}`} />
                                        </button>
                                    </div>
                                    {expandedShipmentId === shipment._id.toString() && (
                                        <div className="mt-4 pt-4 border-t border-gray-200 dark:border-gray-700">
                                            <h4 className="text-sm font-medium text-gray-700 dark:text-gray-300 mb-3 ml-8">Products in this shipment:</h4>
                                            <ul className="space-y-3 ml-8">
                                                {shipment.items.map(item => (
                                                    <li key={item._id.toString()} className="flex items-center text-sm">
                                                        <div className="relative h-10 w-10 rounded-md overflow-hidden mr-3 flex-shrink-0">
                                                            <Image 
                                                                src={item.mainImage || '/imageNotFound.svg'} 
                                                                alt={item.name} 
                                                                fill
                                                                className="object-cover"
                                                            />
                                                        </div>
                                                        <span className="font-medium text-gray-600 dark:text-gray-400">{item.quantity}x</span>
                                                        <span className="ml-2 text-gray-800 dark:text-gray-200">{item.name}</span>
                                                    </li>
                                                ))}
                                            </ul>
                                        </div>
                                    )}
                                </li>
                            ))}
                        </ul>
                    </div>
                </div>
            )}
        </div>
    );
};