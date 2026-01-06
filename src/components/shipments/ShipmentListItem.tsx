'use client';

import { useState } from 'react';
import { Shipment } from '@/interfaces';
import Link from 'next/link';
import AddressCorrectionModal from './AddressCorrectionModal';
import { useRouter } from 'next/navigation';

// A badge component for displaying status
const StatusBadge = ({ status }: { status: string }) => {
  const baseClasses = "px-2 py-1 text-xs font-semibold rounded-full";
  const statusClasses: Record<string, string> = {
    pending: "bg-yellow-200 text-yellow-800",
    ready_to_ship: "bg-blue-200 text-blue-800",
    in_transit: "bg-indigo-200 text-indigo-800",
    delivered: "bg-green-200 text-green-800",
    cancelled: "bg-gray-200 text-gray-800",
    failed: "bg-red-600 text-white",
    default: "bg-gray-200 text-gray-800",
  };
  const classes = statusClasses[status] || statusClasses.default;
  return <span className={`${baseClasses} ${classes}`}>{status.replace(/_/g, ' ').toUpperCase()}</span>;
};

const ShipmentListItem = ({ shipment, onTrack }: { shipment: Shipment, onTrack?: () => void }) => {
  const isFailed = shipment.status === 'failed';
  const [isFixModalOpen, setIsFixModalOpen] = useState(false);
  const router = useRouter();

  return (
    <>
      <div className={`bg-gray-800 p-4 rounded-lg shadow-md mb-4 flex justify-between items-center ${isFailed ? 'border-2 border-red-500' : ''}`}>
        <div>
          <p className="text-sm text-gray-400">ID: {shipment._id}</p>
          <h3 className="text-lg font-bold text-white">
            {shipment.pickupAddress.fullName} → {shipment.deliveryAddress.fullName}
          </h3>
          <p className="text-sm text-gray-300">
            {shipment.pickupAddress.street} → {shipment.deliveryAddress.street}
          </p>
          <p className="text-xs text-gray-500 mt-1">
            Created: {new Date(shipment.createdAt).toLocaleDateString()}
          </p>

          {isFailed && (
            <div className="mt-2 text-red-400 text-xs font-bold flex items-center">
              <span>⚠️ {(shipment as any).failureReason || 'System Error: Delivery Failed'}</span>
            </div>
          )}

        </div>
        <div className="flex items-center space-x-4">
          <StatusBadge status={shipment.status} />

          {onTrack && (
            <button
              onClick={onTrack}
              className="text-white bg-blue-600 hover:bg-blue-700 px-3 py-1 rounded text-sm font-medium transition"
            >
              Track
            </button>
          )}

          {isFailed ? (
            <button
              onClick={() => setIsFixModalOpen(true)}
              className="text-red-400 hover:text-red-300 text-sm font-bold underline cursor-pointer"
            >
              Fix Data
            </button>
          ) : (
            <Link href={`/logistics/shipments/${shipment._id}`} className="text-primary hover:underline">
              {shipment.status === 'pending' ? 'Review & Ship' : 'View Details'}
            </Link>
          )}

        </div>
      </div>

      <AddressCorrectionModal
        isOpen={isFixModalOpen}
        onClose={() => setIsFixModalOpen(false)}
        shipmentId={shipment._id}
        currentAddress={shipment.deliveryAddress}
        onSuccess={() => {
          // Ideally refresh the data, using router.refresh() for simple cases
          router.refresh();
        }}
      />
    </>
  );
};

export default ShipmentListItem;
