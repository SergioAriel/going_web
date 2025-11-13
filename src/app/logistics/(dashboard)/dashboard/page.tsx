'use client';

import { usePrivy } from '@privy-io/react-auth';
import { useRouter } from 'next/navigation';
import { useEffect, useState } from 'react';
import { useUser } from '@/context/UserContext';
import { getShipments } from '@/lib/ServerActions/shipments';
import { Shipment } from '@/interfaces';
import ShipmentList from '@/components/shipments/ShipmentList';

// --- MOCK DATA ---
// TODO: Remove this when re-activating real data fetching.
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

const DashboardPage = () => {
  const router = useRouter();
  const { ready, authenticated } = usePrivy();
  const { user: appUser } = useUser();
  
  // For now, we use mock data.
  const [shipments, setShipments] = useState<Shipment[]>(mockShipments);
  const [isLoading, setIsLoading] = useState(false); // Not loading mock data.

  /*
  // REAL DATA FETCHING LOGIC - Temporarily disabled
  useEffect(() => {
    // Once we have the app user, fetch their shipments
    if (appUser?._id) {
      const fetchShipments = async () => {
        try {
          setIsLoading(true);
          const userShipments = await getShipments({ sellerId: appUser._id });
          setShipments(userShipments);
        } catch (error) {
          console.error("Failed to fetch shipments:", error);
        } finally {
          setIsLoading(false);
        }
      };

      fetchShipments();
    }
  }, [appUser]);
  */

  // This effect handles authentication. If Privy is ready and user is not logged in, redirect.
  useEffect(() => {
    if (ready && !authenticated) {
      router.push('/logistics/business/login');
    }
  }, [ready, authenticated, router]);

  // Show a loading screen while Privy is initializing.
  if (!ready) {
    return (
      <div className="p-10 text-white">
        Loading Portal...
      </div>
    );
  }

  // If ready but not authenticated, the useEffect above will handle the redirect.
  if (!authenticated) {
    return <div className="p-10 text-white">Redirecting to login...</div>;
  }

  // If authenticated, render the dashboard.
  return (
    <div className="p-6 sm:p-10">
      <h1 className="text-3xl font-bold tracking-tight text-white mb-8">
        Active Shipments
      </h1>
      
      {isLoading ? (
        <p className="text-gray-400">Loading shipments...</p>
      ) : (
        <ShipmentList shipments={shipments} />
      )}
    </div>
  );
};

export default DashboardPage;