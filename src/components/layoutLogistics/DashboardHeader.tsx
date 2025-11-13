'use client';

import Image from 'next/image';
import Link from 'next/link';
import { usePrivy } from '@privy-io/react-auth';

// This header is for the authenticated dashboard view of the logistics section.
const DashboardHeader = () => {
  const { logout } = usePrivy();

  return (
    <header className="bg-white dark:bg-gray-800 p-4 shadow-md">
      <nav className="container mx-auto flex justify-between items-center">
        <Link href="/logistics/dashboard" className="flex items-center">
          <div className="w-auto h-12 relative">
            <Image
              src="/logo.png"
              alt="Going Ecosystem"
              width={120}
              height={40}
              style={{ width: "100%", height: "100%" }}
              className=" transition-transform duration-300 hover:scale-105"
            />
          </div>
        </Link>
        <div className="flex items-center">
          <Link href="/logistics/dashboard" className="text-gray-600 dark:text-gray-300 hover:text-primary px-4">Dashboard</Link>
          <Link href="/logistics/billing" className="text-gray-600 dark:text-gray-300 hover:text-primary px-4">Billing</Link>
          <Link href="/logistics/settings" className="text-gray-600 dark:text-gray-300 hover:text-primary px-4">Settings</Link>
          <button onClick={logout} className="text-gray-600 dark:text-gray-300 hover:text-primary px-4">Logout</button>
        </div>
      </nav>
    </header>
  );
};

export default DashboardHeader;
