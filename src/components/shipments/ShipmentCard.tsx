'use client'

import { Shipment, SelfDeliveryShipment } from "@/interfaces";
import { ArrowRightIcon, QrCodeIcon } from "@heroicons/react/24/outline";
import Link from "next/link";
import { useState } from "react";
import { updateShipment } from "@/lib/ServerActions/shipments";
import { useAlert } from "@/context/AlertContext";

interface ShipmentCardProps {
  shipment: Shipment;
  isSeller?: boolean;
  onShowQR?: (shipmentId: string) => void;
}

export const ShipmentCard: React.FC<ShipmentCardProps> = ({ shipment, isSeller, onShowQR }) => {
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [confirmedDeliveryDays, setConfirmedDeliveryDays] = useState(0);
  const { handleAlert } = useAlert();

  const handleProcessShipment = async () => {
    if (shipment.shippingType === 'self_delivery') {
      const longestEstimate = Math.max(...shipment.items.map(item => item.estimatedDeliveryDays || 0));
      setConfirmedDeliveryDays(longestEstimate);
      setIsModalOpen(true);
    } else if (shipment.shippingType === 'going_network') {
      const result = await updateShipment(shipment._id.toString(), { status: 'ready_to_ship' });
      if (result?.status) {
        handleAlert({ message: "Shipment is ready for pickup", isError: false });
      } else {
        handleAlert({ message: "Failed to process shipment", isError: true });
      }
    }
  };

  const handleModalSubmit = async () => {
    if (shipment.shippingType === 'self_delivery') {
        const result = await updateShipment(shipment._id.toString(), {
            status: 'completed',
            deliveryDetails: {
                ...(shipment as SelfDeliveryShipment).deliveryDetails,
                status: 'delivered',
                confirmedDeliveryDays: confirmedDeliveryDays,
            }
        });

        if (result?.status) {
            handleAlert({ message: "Self-delivery shipment marked as completed", isError: false });
        } else {
            handleAlert({ message: "Failed to mark shipment as completed", isError: true });
        }
        setIsModalOpen(false);
    }
  };

  return (
    <>
      <div className="border border-gray-200 dark:border-gray-700 rounded-lg overflow-hidden">
        <div className="bg-gray-50 dark:bg-gray-700 px-4 py-3 flex flex-col sm:flex-row sm:justify-between sm:items-center">
          <div className="flex-grow">
            <div className="flex items-center flex-wrap">
              <span className="text-gray-900 dark:text-white font-medium mr-2">Shipment for Order {shipment.orderId}</span>
              <span className="mx-2 text-gray-500 dark:text-gray-400 hidden sm:inline">•</span>
              <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium mt-2 sm:mt-0
                ${shipment.status === "delivered" || shipment.status === "completed"
                  ? "bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-300"
                  : shipment.status === "in_transit"
                    ? "bg-blue-100 text-blue-800 dark:bg-blue-900 dark:text-blue-300"
                    : "bg-yellow-100 text-yellow-800 dark:bg-yellow-900 dark:text-yellow-300"
                }`}
              >
                {shipment.status}
              </span>
            </div>
          </div>
          <div className="mt-2 sm:mt-0 flex items-center">
            {isSeller && onShowQR && (
              <button onClick={() => onShowQR(shipment._id.toString())} className="text-primary hover:text-primary-dark mr-4">
                <QrCodeIcon className="h-6 w-6" />
              </button>
            )}
            <Link href={`/order/${shipment.orderId}?shipmentId=${shipment._id.toString()}`} className="text-primary hover:text-primary-dark flex items-center">
              View Details
              <ArrowRightIcon className="h-4 w-4 ml-1" />
            </Link>
            {isSeller && shipment.status === 'pending' && (
              <button
                onClick={handleProcessShipment}
                className="ml-4 bg-primary hover:bg-primary-dark text-white font-bold py-2 px-4 rounded"
              >
                Process Shipment
              </button>
            )}
          </div>
        </div>
        <div className="p-4">
          <ul className="space-y-3">
            {shipment?.items?.map((item, index) => (
              <li key={index} className="flex flex-col sm:flex-row justify-between items-start sm:items-center text-sm">
                <div className="flex items-center mb-1 sm:mb-0">
                  <span className="font-medium text-gray-900 dark:text-white">{item.quantity}x</span>
                  <span className="ml-2 text-gray-700 dark:text-gray-300">{item.name}</span>
                </div>
                <span className="text-gray-600 dark:text-gray-400">{item.currency} {item.price}</span>
              </li>
            ))}
          </ul>
        </div>
      </div>

      {isModalOpen && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white dark:bg-gray-800 p-6 rounded-lg shadow-xl">
            <h2 className="text-xl font-semibold text-gray-900 dark:text-white mb-4">Confirm Self-Delivery</h2>
            <p className="text-gray-600 dark:text-gray-400 mb-4">
              Please confirm or adjust the estimated delivery days for your package.
            </p>
            <input
              type="number"
              value={confirmedDeliveryDays}
              onChange={(e) => setConfirmedDeliveryDays(parseInt(e.target.value))}
              className="w-full px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-primary focus:border-primary dark:bg-gray-700 dark:text-white"
              placeholder="e.g., 3"
            />
            <div className="mt-6 flex justify-end space-x-4">
              <button onClick={() => setIsModalOpen(false)} className="px-4 py-2 text-gray-700 dark:text-gray-300 rounded-lg hover:bg-gray-100 dark:hover:bg-gray-700">
                Cancel
              </button>
              <button onClick={handleModalSubmit} className="px-4 py-2 bg-primary hover:bg-primary-dark text-white rounded-lg">
                Confirm Shipment
              </button>
            </div>
          </div>
        </div>
      )}
    </>
  );
};