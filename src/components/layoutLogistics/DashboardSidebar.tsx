'use client';

import { usePrivy } from '@privy-io/react-auth';
import {
  Cog6ToothIcon,
  ChartBarIcon,
  TruckIcon,
  HomeIcon,
  MapPinIcon,
  CreditCardIcon
} from '@heroicons/react/24/solid';
import Link from 'next/link';

const SidebarLink = ({ href, icon: Icon, children }) => (
  <Link href={href} className="flex items-center p-2 text-base font-normal text-gray-300 rounded-lg hover:bg-gray-700 group">
    <Icon className="w-6 h-6 text-gray-400 transition duration-75 group-hover:text-white" />
    <span className="ml-3">{children}</span>
  </Link>
);

const DashboardSidebar = () => {
  const { user } = usePrivy();

  // Attempt to get a displayable name for the user
  const displayName = user?.wallet?.address
    ? `${user.wallet.address.substring(0, 6)}...${user.wallet.address.substring(user.wallet.address.length - 4)}`
    : 'User';

  return (
    <aside className="w-64 flex-shrink-0" aria-label="Sidebar">
      <div className="h-full px-3 py-4 overflow-y-auto bg-gray-800">
        <div className="mb-6">
          <h2 className="text-xl font-semibold text-white">Welcome,</h2>
          <p className="text-sm text-gray-400 break-words">{displayName}</p>
        </div>
        <ul className="space-y-2">
          <li>
            <SidebarLink href="/logistics/dashboard" icon={HomeIcon}>Dashboard</SidebarLink>
          </li>
          <li>
            <SidebarLink href="/logistics/dashboard/addresses" icon={MapPinIcon}>Addresses</SidebarLink>
          </li>
          <li>
            <SidebarLink href="/logistics/dashboard/wallet" icon={CreditCardIcon}>Wallet</SidebarLink>
          </li>
          <li>
            <SidebarLink href="/logistics/shipments" icon={TruckIcon}>Shipments</SidebarLink>
          </li>
          <li>
            <SidebarLink href="/logistics/analytics" icon={ChartBarIcon}>Analytics</SidebarLink>
          </li>
          <li>
            <SidebarLink href="/logistics/settings" icon={Cog6ToothIcon}>Settings</SidebarLink>
          </li>
        </ul>
      </div>
    </aside>
  );
};

export default DashboardSidebar;
