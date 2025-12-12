import { useState } from 'react';
import { Shipment } from '@/interfaces';
import ShipmentListItem from './ShipmentListItem';
import TrackingModal from './TrackingModal';

const ShipmentList = ({ shipments }: { shipments: Shipment[] }) => {
  const [selectedShipment, setSelectedShipment] = useState<Shipment | null>(null);

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
        <ShipmentListItem
          key={shipment._id}
          shipment={shipment}
          onTrack={() => setSelectedShipment(shipment)}
        />
      ))}

      {selectedShipment && (
        <TrackingModal
          shipment={selectedShipment}
          onClose={() => setSelectedShipment(null)}
        />
      )}
    </div>
  );
};

export default ShipmentList;
