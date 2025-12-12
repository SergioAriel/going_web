'use client';

import Link from 'next/link';
import { usePrivy } from '@privy-io/react-auth';
import { useRouter } from 'next/navigation';
import { useEffect, useState } from 'react';
// import { useUser } from '@/context/UserContext';
import { getShipments } from '@/lib/ServerActions/shipments';
import { Shipment } from '@/interfaces';
import ShipmentList from '@/components/shipments/ShipmentList';
import { useUser } from '@/context/UserContext';



const DashboardPage = () => {
  const router = useRouter();
  const { ready, authenticated } = usePrivy();
  const { userData: appUser } = useUser();

  const [shipments, setShipments] = useState<Shipment[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  // REAL DATA FETCHING LOGIC
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
      <div className="flex justify-between items-center mb-8">
        <h1 className="text-3xl font-bold tracking-tight text-white">
          Active Shipments
        </h1>
        <Link
          href="/logistics/dashboard/upload"
          className="bg-primary px-4 py-2 rounded-md text-white font-semibold hover:bg-primary-dark transition"
        >
          + New Shipment
        </Link>
      </div>

      {isLoading ? (
        <p className="text-gray-400">Loading shipments...</p>
      ) : (
        <ShipmentList shipments={shipments} />
      )}
    </div>
  );
};

export default DashboardPage;