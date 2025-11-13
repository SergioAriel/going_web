'use client';

import { usePrivy } from '@privy-io/react-auth';
import { useRouter, useParams } from 'next/navigation';
import { useEffect, useState } from 'react';
import { Shipment } from '@/interfaces';
import dynamic from 'next/dynamic';
import { getShipmentRoute } from '@/lib/ServerActions/route';
import { LatLngExpression } from 'leaflet';

// --- MOCK DATA ---
const mockShipments: Shipment[] = [
  {
    _id: 'shipment_1',
    orderId: 'order_A',
    sellerId: 'user_123',
    buyerId: 'user_456',
    shippingType: 'going_network',
    status: 'ready_to_ship',
    deliveryAddress: { name: 'Jane Doe', street: '123 Main St', city: 'Metropolis', state: 'NY', zipCode: '10001', country: 'USA', phone: '555-1234', email: 'jane@example.com', lat: 40.7128, lon: -74.0060 },
    pickupAddress: { name: 'John Smith', street: '456 Oak Ave', city: 'Gotham', state: 'NJ', zipCode: '07001', country: 'USA', phone: '555-5678', email: 'john@example.com', lat: 40.7357, lon: -74.1724 },
    items: [{ _id: 'prod_1', name: 'Vintage T-Shirt', price: 25, quantity: 1, mainImage: '/placeholder.svg', seller: 'user_123', addressWallet: 'abc', currency: 'SOL', shippingType: 'going_network', pickupAddress: { name: 'John Smith', street: '456 Oak Ave', city: 'Gotham', state: 'NJ', zipCode: '07001', country: 'USA', phone: '555-5678', email: 'john@example.com' } }],
    createdAt: new Date('2024-05-20T10:00:00Z'),
    updatedAt: new Date('2024-05-20T12:30:00Z'),
  },
  {
    _id: 'shipment_2',
    orderId: 'order_B',
    sellerId: 'user_123',
    buyerId: 'user_789',
    shippingType: 'going_network',
    status: 'in_transit',
    deliveryAddress: { name: 'Peter Parker', street: '789 Web St', city: 'Queens', state: 'NY', zipCode: '11367', country: 'USA', phone: '555-1111', email: 'pete@example.com', lat: 40.742, lon: -73.8223 },
    pickupAddress: { name: 'John Smith', street: '456 Oak Ave', city: 'Gotham', state: 'NJ', zipCode: '07001', country: 'USA', phone: '555-5678', email: 'john@example.com', lat: 40.7357, lon: -74.1724 },
    items: [{ _id: 'prod_2', name: 'Action Figure', price: 50, quantity: 1, mainImage: '/placeholder.svg', seller: 'user_123', addressWallet: 'abc', currency: 'SOL', shippingType: 'going_network', pickupAddress: { name: 'John Smith', street: '456 Oak Ave', city: 'Gotham', state: 'NJ', zipCode: '07001', country: 'USA', phone: '555-5678', email: 'john@example.com' } }],
    createdAt: new Date('2024-05-19T14:00:00Z'),
    updatedAt: new Date('2024-05-20T09:00:00Z'),
  },
];
// --- END MOCK DATA ---

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
      const foundShipment = mockShipments.find(s => s._id === shipmentId);
      setShipment(foundShipment || null);
      setIsLoading(false);
    }
  }, [ready, authenticated, router, shipmentId]);

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
      <p className="text-sm text-gray-400 mb-8">ID: {shipment._id}</p>

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
                <li key={item._id} className="flex justify-between items-center border-b border-gray-700 py-2">
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
                <p>{shipment.pickupAddress.name}</p>
                <p>{shipment.pickupAddress.street}, {shipment.pickupAddress.city}</p>
              </div>
              <div>
                <h3 className="font-bold">Delivery</h3>
                <p>{shipment.deliveryAddress.name}</p>
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
