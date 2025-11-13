'use client';

import { Shipment } from '@/interfaces';
import Link from 'next/link';

// A badge component for displaying status
const StatusBadge = ({ status }: { status: string }) => {
  const baseClasses = "px-2 py-1 text-xs font-semibold rounded-full";
  const statusClasses = {
    pending: "bg-yellow-200 text-yellow-800",
    ready_to_ship: "bg-blue-200 text-blue-800",
    in_transit: "bg-indigo-200 text-indigo-800",
    delivered: "bg-green-200 text-green-800",
    cancelled: "bg-red-200 text-red-800",
    default: "bg-gray-200 text-gray-800",
  };
  const classes = statusClasses[status] || statusClasses.default;
  return <span className={`${baseClasses} ${classes}`}>{status.replace(/_/g, ' ').toUpperCase()}</span>;
};

const ShipmentListItem = ({ shipment }: { shipment: Shipment }) => {
  return (
    <div className="bg-gray-800 p-4 rounded-lg shadow-md mb-4 flex justify-between items-center">
      <div>
        <p className="text-sm text-gray-400">ID: {shipment._id}</p>
        <h3 className="text-lg font-bold text-white">
          {shipment.pickupAddress.city} to {shipment.deliveryAddress.city}
        </h3>
        <p className="text-sm text-gray-300">
          Created: {new Date(shipment.createdAt).toLocaleDateString()}
        </p>
      </div>
      <div className="flex items-center space-x-4">
        <StatusBadge status={shipment.status} />
        <Link href={`/logistics/shipments/${shipment._id}`} className="text-primary hover:underline">
          View Details
        </Link>
      </div>
    </div>
  );
};

export default ShipmentListItem;
