'use client';

import { usePrivy } from '@privy-io/react-auth';
import { useRouter } from 'next/navigation';
import { useEffect } from 'react';
import { useUser } from '@/context/UserContext';

const LoginPage = () => {
  const router = useRouter();
  const { login, authenticated } = usePrivy();
  const { user: appUser, isLoading } = useUser();

  useEffect(() => {
    // Wait for Privy auth to be ready
    if (authenticated) {
      // If we have the app user loaded
      if (!isLoading && appUser) {
        if (appUser.isLogisticsClient) {
          router.push('/logistics/dashboard');
        } else {
          router.push('/logistics/business/onboarding');
        }
      }
      // Fallback: If authenticated but appUser is taking too long or failed, 
      // we might want to redirect to dashboard anyway and let the dashboard handle the user fetch/check.
      // However, for now, let's just ensure we don't get stuck.
    }
  }, [authenticated, appUser, isLoading, router]);

  return (
    <>
      <div className="w-full max-w-sm text-center">
        <h2 className="text-2xl font-bold leading-9 tracking-tight text-gray-900 dark:text-white">
          Access or Create your Business Account
        </h2>
        <p className="mt-2 text-sm text-gray-600 dark:text-gray-400">
          Connect your wallet to access or create your Business Portal.
        </p>
        <div className="mt-10">
          <button
            onClick={login}
            className="flex w-full justify-center rounded-md bg-primary px-3 py-2 text-sm font-semibold leading-6 text-white shadow-sm hover:bg-primary-dark focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-primary"
          >
            Login / Sign Up
          </button>
        </div>
      </div>
    </>
  );
};

export default LoginPage;