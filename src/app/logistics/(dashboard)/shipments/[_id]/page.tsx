'use client';

import { usePrivy } from '@privy-io/react-auth';
import { useRouter, useParams } from 'next/navigation';
import { useEffect, useState } from 'react';
import { Shipment } from '@/interfaces';
import dynamic from 'next/dynamic';
import { getShipmentRoute } from '@/lib/ServerActions/route';
import { LatLngExpression } from 'leaflet';

import { getShipment, cancelShipment, deleteShipment } from '@/lib/ServerActions/shipments';
import toast from 'react-hot-toast';

const ShipmentMap = dynamic(() => import('@/components/shipments/ShipmentMap'), {
  ssr: false,
  loading: () => <div className="h-[400px] w-full bg-gray-700 rounded-lg flex items-center justify-center"><p>Loading map...</p></div>
});

const ShipmentDetailPage = () => {
  const router = useRouter();
  const params = useParams();
  const { ready, authenticated } = usePrivy();

  const [shipment, setShipment] = useState<Shipment | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [route, setRoute] = useState<LatLngExpression[]>([]);

  const shipmentId = params._id as string;

  useEffect(() => {
    if (ready && !authenticated) {
      router.push('/logistics/business/login');
      return;
    }

    if (shipmentId) {
      const fetchShipment = async () => {
        try {
          const data = await getShipment(shipmentId);
          setShipment(data);
        } catch (error) {
          console.error("Error fetching shipment:", error);
        } finally {
          setIsLoading(false);
        }
      };
      fetchShipment();
    }
  }, [ready, authenticated, router, shipmentId]);

  const handleCancel = async () => {
    if (!shipment) return;
    if (!confirm("Are you sure you want to cancel this shipment?")) return;

    const result = await cancelShipment(shipment._id);
    if (result.status) {
      toast.success("Shipment cancelled.");
      // Refresh data
      const updated = await getShipment(shipment._id);
      setShipment(updated);
    } else {
      toast.error(result.message || "Could not cancel shipment.");
    }
  };

  const handleDelete = async () => {
    if (!shipment) return;
    if (!confirm("Are you sure you want to DELETE this shipment? This action cannot be undone.")) return;

    const result = await deleteShipment(shipment._id);
    if (result.status) {
      toast.success("Shipment deleted.");
      router.push('/logistics/dashboard');
    } else {
      toast.error(result.message || "Could not delete shipment.");
    }
  };

  useEffect(() => {
    if (shipment) {
      const fetchRoute = async () => {
        try {
          const waypoints = [
            { lat: shipment.pickupAddress.lat!, lon: shipment.pickupAddress.lon! },
            { lat: shipment.deliveryAddress.lat!, lon: shipment.deliveryAddress.lon! }
          ];
          const osrmRoute = await getShipmentRoute(waypoints);
          setRoute(osrmRoute);
        } catch (error) {
          console.error("Failed to fetch OSRM route:", error);
          // If fetching fails, the map will fall back to a straight line.
        }
      };
      fetchRoute();
    }
  }, [shipment]);

  if (isLoading || !ready || !authenticated) {
    return <div className="p-10 text-white">Loading Shipment...</div>;
  }

  if (!shipment) {
    return <div className="p-10 text-white">Shipment not found.</div>;
  }

  return (
    <div className="p-6 sm:p-10 text-white">
      <h1 className="text-3xl font-bold tracking-tight mb-2">
        Shipment Details
      </h1>
      <div className="flex justify-between items-center mb-8">
        <p className="text-sm text-gray-400">ID: {shipment._id}</p>
        {shipment.status === 'ready_to_ship' && (
          <div className="flex gap-2">
            <button
              onClick={handleCancel}
              className="bg-yellow-500 text-white px-4 py-2 rounded hover:bg-yellow-600 transition font-bold"
            >
              Cancel
            </button>
            <button
              onClick={handleDelete}
              className="bg-red-600 text-white px-4 py-2 rounded hover:bg-red-700 transition font-bold"
            >
              Delete
            </button>
          </div>
        )}
        {shipment.status === 'cancelled' && (
          <button
            onClick={handleDelete}
            className="bg-red-600 text-white px-4 py-2 rounded hover:bg-red-700 transition font-bold"
          >
            Delete Shipment
          </button>
        )}
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">

        <div className="lg:col-span-2 space-y-8">
          <div className="bg-gray-800 p-6 rounded-lg">
            <ShipmentMap
              pickupCoords={[shipment.pickupAddress.lat!, shipment.pickupAddress.lon!]}
              deliveryCoords={[shipment.deliveryAddress.lat!, shipment.deliveryAddress.lon!]}
              pickupAddress={`${shipment.pickupAddress.street}, ${shipment.pickupAddress.city}`}
              deliveryAddress={`${shipment.deliveryAddress.street}, ${shipment.deliveryAddress.city}`}
              route={route}
            />
          </div>

          <div className="bg-gray-800 p-6 rounded-lg">
            <h2 className="text-xl font-semibold mb-4">Items</h2>
            <ul>
              {shipment.items.map(item => (
                <li key={item._id.toString()} className="flex justify-between items-center border-b border-gray-700 py-2">
                  <span>{item.name} (x{item.quantity})</span>
                  <span>{item.price} {item.currency}</span>
                </li>
              ))}
            </ul>
          </div>
        </div>

        <div className="lg:col-span-1 space-y-8">
          <div className="bg-gray-800 p-6 rounded-lg">
            <h2 className="text-xl font-semibold mb-4">Information</h2>
            <div className="space-y-4">
              <p><strong>Status:</strong> {shipment.status.replace(/_/g, ' ')}</p>
              <p><strong>Order ID:</strong> {shipment.orderId}</p>
              <p><strong>Created:</strong> {new Date(shipment.createdAt).toLocaleString()}</p>
              <p><strong>Last Updated:</strong> {new Date(shipment.updatedAt).toLocaleString()}</p>
            </div>
          </div>

          <div className="bg-gray-800 p-6 rounded-lg">
            <h2 className="text-xl font-semibold mb-4">Addresses</h2>
            <div className="space-y-4">
              <div>
                <h3 className="font-bold">Pickup</h3>
                <p>{shipment.pickupAddress.fullName}</p>
                <p>{shipment.pickupAddress.street}, {shipment.pickupAddress.city}</p>
              </div>
              <div>
                <h3 className="font-bold">Delivery</h3>
                <p>{shipment.deliveryAddress.fullName}</p>
                <p>{shipment.deliveryAddress.street}, {shipment.deliveryAddress.city}</p>
              </div>
            </div>
          </div>
        </div>

      </div>
    </div>
  );
};

export default ShipmentDetailPage;
