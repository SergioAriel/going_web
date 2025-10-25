'use client';

import { Suspense, useEffect, useState } from "react";
import Image from "next/image";
import {
  UserIcon,
  ShoppingBagIcon,
  CreditCardIcon,
  TruckIcon,
  ArrowRightStartOnRectangleIcon,
  ArrowLeftEndOnRectangleIcon,
  CogIcon,
  CubeIcon,
  HomeIcon
} from "@heroicons/react/24/outline";
import { useLogin, useLogout, usePrivy } from "@privy-io/react-auth";
import { useRouter, useSearchParams } from "next/navigation";
import { AccountTab } from "./AccountTab";
import { OrdersTab } from "./OrdersTab";
import { WishlistTab } from "./WishlistTab";
import { PaymentTab } from "./PaymentTab";
import { AddressesTab } from "./AddressesTab";
import { NotificationsTab } from "./NotificationsTab";
import { SettingsTab } from "./SettingsTab";
import { SellingTab } from "./SellingTab";
import { ShipmentsTab } from "./ShipmentsTab";
import { useUser } from "@/context/UserContext";

const baseTabs = [
  { id: "account", name: "My Account", icon: UserIcon },
  { id: "orders", name: "My Orders", icon: ShoppingBagIcon },
  { id: "addresses", name: "My Addresses", icon: HomeIcon },
  { id: "payment", name: "Wallets", icon: CreditCardIcon },
  { id: "selling", name: "Selling", icon: CubeIcon },
  { id: "settings", name: "Settings", icon: CogIcon },
];

const sellerTabs = [
  { id: "shipments", name: "Shipments", icon: TruckIcon },
];

const ProfileContent = () => {
  const { ready, authenticated } = usePrivy()
  const { userData } = useUser()

  const { login } = useLogin()
  const { logout } = useLogout()
  
  const router = useRouter()
  const searchParams = useSearchParams()
  const tabParams = searchParams.get('tab')

  const [activeTab, setActiveTab] = useState(tabParams || "account");

  const displayedTabs = userData?.isSeller ? [...baseTabs, ...sellerTabs] : baseTabs;

  useEffect(() => {
    if (!ready || !authenticated) {
      setActiveTab("settings")
      return
    } else {
      setActiveTab(tabParams || "account")
    }
    if (tabParams) {
      const tab = displayedTabs.find((tab) => tab.id === tabParams);
      if (tab) {
        setActiveTab(tab.id);
        router.replace(`/profile`);
      }
    }
  }, [tabParams, ready, authenticated, displayedTabs, router]);

  const renderTabContent = () => {
    const tabsContent = {
      account: <AccountTab />,
      orders: <OrdersTab />,
      wishlist: <WishlistTab />,
      payment: <PaymentTab />,
      addresses: <AddressesTab />,
      notifications: <NotificationsTab />,
      selling: <SellingTab />,
      shipments: <ShipmentsTab />,
      settings: <SettingsTab />,
    };
    
    if (!tabsContent[activeTab as keyof typeof tabsContent]) {
      return <AccountTab />;
    }

    return tabsContent[activeTab as keyof typeof tabsContent]
  };


  const handlerLogin = async () => {
    try {
      await login();
    } catch (error) {
      console.error("Login failed:", error);
    }
  }

  return (
    <div className="bg-gray-50 dark:bg-gray-900 min-h-screen py-10">
      <div className="container mx-auto px-4">
        <h1 className="text-3xl font-bold text-gray-900 dark:text-white mb-8">My Profile</h1>

        <div className="flex flex-col md:flex-row gap-8">
          {/* Navigation Sidebar */}
          <div className="md:w-1/4">
            <div className="bg-white dark:bg-gray-800 rounded-lg shadow-md p-6">
              <div className="flex flex-wrap items-center w-full mb-6">
                <div className="h-16 w-16 rounded-full">
                  <Image
                    src={userData.avatar || "/logo.png"}
                    alt={userData.fullName || "User"}
                    width={100}
                    height={100}
                    className="object-cover rounded-full"
                  />
                </div>
                <div className="w-full mt-2 md:mt-0 md:ml-3">
                  <h2 className="text-lg font-semibold text-gray-900 dark:text-white truncate">{userData.fullName || "New User"}</h2>
                  <p className="w-full text-sm text-gray-600 dark:text-gray-400 overflow-hidden text-ellipsis">{userData.email}</p>
                </div>
              </div>

              <div className="space-y-1">
                {
                  displayedTabs.map((tab) => (
                      <button
                        key={tab.id}
                        onClick={() => setActiveTab(tab.id)}
                        disabled={!authenticated && tab.id !== 'settings'}
                        className={
                          `w-full flex items-center space-x-3 px-4 py-3 rounded-lg text-left transition-colors disabled:opacity-50 disabled:cursor-not-allowed 
                          ${activeTab === tab.id ? "bg-primary text-white" : "text-gray-700 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-700"}
                        `
                        }
                      >
                        <tab.icon className="h-5 w-5" />
                        <span>{tab.name}</span>
                      </button>
                  ))
                }
                {/* Logout Button */}
                {
                  !authenticated ?
                    <button
                      className="cursor-pointer w-full flex items-center space-x-3 px-4 py-3 rounded-lg text-left text-gray-700 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-700 transition-colors"
                      onClick={handlerLogin}
                    >
                      <ArrowLeftEndOnRectangleIcon className="h-5 w-5" />
                      <span>Log In</span>
                    </button>
                    :
                    <button
                      className="cursor-pointer w-full flex items-center space-x-3 px-4 py-3 rounded-lg text-left text-gray-700 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-700 transition-colors"
                      onClick={() => logout()}
                    >
                      <ArrowRightStartOnRectangleIcon className="h-5 w-5" />
                      <span>Log Out</span>
                    </button>
                }
              </div>
            </div>
          </div>

          {/* Main Content */}
          <div className="md:w-3/4">
            <div className="bg-white dark:bg-gray-800 rounded-lg shadow-md p-6">
              {renderTabContent()}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

// Define a simple loading fallback component
function ProfilePageLoading() {
  return (
    <div className="bg-gray-50 dark:bg-gray-900 min-h-screen py-10">
      <div className="container mx-auto px-4">
        <h1 className="text-3xl font-bold text-gray-900 dark:text-white mb-8">My Profile</h1>
        <div className="flex flex-col md:flex-row gap-8">
          {/* Skeleton for Sidebar */}
          <div className="md:w-1/4">
            <div className="bg-white dark:bg-gray-800 rounded-lg shadow-md p-6 animate-pulse">
              <div className="flex items-center space-x-3 mb-6">
                <div className="h-16 w-16 rounded-full bg-gray-300 dark:bg-gray-700"></div>
                <div className="flex-1 space-y-2">
                  <div className="h-4 bg-gray-300 dark:bg-gray-700 rounded w-3/4"></div>
                  <div className="h-4 bg-gray-300 dark:bg-gray-700 rounded w-1/2"></div>
                </div>
              </div>
              <div className="space-y-2">
                <div className="h-10 bg-gray-300 dark:bg-gray-700 rounded"></div>
                <div className="h-10 bg-gray-300 dark:bg-gray-700 rounded"></div>
                <div className="h-10 bg-gray-300 dark:bg-gray-700 rounded"></div>
              </div>
            </div>
          </div>
          {/* Skeleton for Main Content */}
          <div className="md:w-3/4">
            <div className="bg-white dark:bg-gray-800 rounded-lg shadow-md p-6 animate-pulse">
              <div className="h-6 bg-gray-300 dark:bg-gray-700 rounded w-1/4 mb-4"></div>
              <div className="space-y-4">
                <div className="h-10 bg-gray-300 dark:bg-gray-700 rounded"></div>
                <div className="h-10 bg-gray-300 dark:bg-gray-700 rounded"></div>
                <div className="h-10 bg-gray-300 dark:bg-gray-700 rounded w-1/2"></div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

// The main page component that uses Suspense
export default function ProfilePageWrapper() {
  return (
    // Wrap the component that uses useSearchParams in Suspense
    <Suspense fallback={<ProfilePageLoading />}>
      <ProfileContent />
    </Suspense>
  );
}