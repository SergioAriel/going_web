'use client';

import Link from 'next/link';

const OnboardingPage = () => {
  return (
    <>
      <div className="w-full max-w-2xl text-center">
        <h1 className="text-3xl font-bold tracking-tight text-gray-900 dark:text-white">
          Welcome to GOING Logistics
        </h1>
        <p className="mt-4 text-lg text-gray-600 dark:text-gray-400">
          You're almost there. To access the dashboard, you need to be associated with a company.
        </p>

        <div className="mt-10 grid grid-cols-1 gap-8 md:grid-cols-2">
          {/* Option 1: Create a new company */}
          <Link href="/logistics/business/onboarding/create" className="block p-8 border border-gray-700 rounded-lg hover:bg-gray-800 transition-colors">
            <h2 className="text-xl font-semibold text-white">Create a New Company</h2>
            <p className="mt-2 text-gray-400">
              Set up a new business profile, manage your shipping settings, and start creating shipments.
            </p>
          </Link>

          {/* Option 2: Join an existing company */}
          <Link href="/logistics/business/onboarding/join" className="block p-8 border border-gray-700 rounded-lg hover:bg-gray-800 transition-colors">
            <h2 className="text-xl font-semibold text-white">Join an Existing Company</h2>
            <p className="mt-2 text-gray-400">
              Request to join your team's existing company profile using an invitation code or by searching.
            </p>
          </Link>
        </div>
      </div>
    </>
  );
};

export default OnboardingPage;