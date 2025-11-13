'use client';

import { Shipment } from '@/interfaces';
import ShipmentListItem from './ShipmentListItem';

const ShipmentList = ({ shipments }: { shipments: Shipment[] }) => {
  if (shipments.length === 0) {
    return (
      <div className="text-center py-10">
        <p className="text-gray-400">You have no active shipments.</p>
      </div>
    );
  }

  return (
    <div>
      {shipments.map((shipment) => (
        <ShipmentListItem key={shipment._id} shipment={shipment} />
      ))}
    </div>
  );
};

export default ShipmentList;
