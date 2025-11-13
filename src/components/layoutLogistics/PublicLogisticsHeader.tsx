'use client';

import Image from 'next/image';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { usePrivy } from '@privy-io/react-auth';

// This header is for all public-facing pages in the logistics section.
const PublicLogisticsHeader = () => {
  const pathname = usePathname();
  const { login } = usePrivy();

  return (
    <header className="bg-white dark:bg-gray-900 p-4 shadow-md">
      <nav className="container mx-auto flex justify-between items-center">
        <Link href="/logistics" className="flex items-center">
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
          {/* Conditionally hide the "For Business" link if we are already on that page */}
          {!pathname.startsWith('/logistics/business') && (
            <Link href="/logistics/business" className="text-gray-600 dark:text-gray-300 hover:text-primary px-4">For Business</Link>
          )}
          <Link href="/logistics/drive" className="text-gray-600 dark:text-gray-300 hover:text-primary px-4">Drive with Us</Link>
          <Link href="/" className="text-gray-600 dark:text-gray-300 hover:text-primary px-4">Marketplace</Link>
          {pathname !== '/logistics/business' && (
            <button onClick={login} className="bg-primary text-white rounded-md px-4 py-2 hover:bg-primary-dark ml-4">Login</button>
          )}
        </div>
      </nav>
    </header>
  );
};

export default PublicLogisticsHeader;
