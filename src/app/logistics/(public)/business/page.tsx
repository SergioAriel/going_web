'use client';

import Link from 'next/link';
import { TruckIcon, GlobeAltIcon, CurrencyDollarIcon } from '@heroicons/react/24/outline';
import { usePrivy } from '@privy-io/react-auth';

const HeroButton = () => {
  const { authenticated } = usePrivy();

  if (authenticated) {
    return (
      <Link href="/logistics/dashboard" className="bg-primary px-6 py-3 rounded-md hover:bg-primary-dark transition-colors">
        Go to Dashboard <span aria-hidden="true">&rarr;</span>
      </Link>
    );
  }

  return (
    <Link href="/logistics/business/login" className="bg-primary px-6 py-3 rounded-md hover:bg-primary-dark transition-colors">
      Get started <span aria-hidden="true">&rarr;</span>
    </Link>
  );
};

const BusinessPage = () => {
  const features = [
    {
      name: 'Same-Day Delivery',
      description: 'Leverage our dense network of couriers to offer your customers fast and reliable same-day delivery.',
      icon: TruckIcon,
    },
    {
      name: 'Expand Your Reach',
      description: 'Stop worrying about delivery zones. We handle the logistics so you can focus on selling to a wider audience.',
      icon: GlobeAltIcon,
    },
    {
      name: 'Simple & Transparent Pricing',
      description: 'No hidden fees. Pay a clear price per delivery and let your customers track their order in real-time.',
      icon: CurrencyDollarIcon,
    },
  ];

  return (
    <div className="bg-white dark:bg-gray-900">
      <main>
        {/* Hero Section */}
        <div className="relative isolate overflow-hidden bg-gray-900 py-24 sm:py-32">
          <div
            aria-hidden="true"
            className="hidden sm:absolute sm:-top-10 sm:right-1/2 sm:-z-10 sm:mr-10 sm:block sm:transform-gpu sm:blur-3xl"
          >
            <div
              className="aspect-[1097/845] w-[68.5625rem] bg-gradient-to-tr from-[#14BFFB] to-[#776fff] opacity-20"
              style={{
                clipPath:
                  'polygon(74.1% 44.1%, 100% 61.6%, 97.5% 26.9%, 85.5% 0.1%, 80.7% 2%, 72.5% 32.5%, 60.2% 62.4%, 52.4% 68.1%, 47.5% 58.3%, 45.2% 34.5%, 27.5% 76.7%, 0.1% 64.9%, 17.9% 100%, 27.6% 76.8%, 76.1% 97.7%, 74.1% 44.1%)',
              }}
            />
          </div>
          <div
            aria-hidden="true"
            className="absolute -top-52 left-1/2 -z-10 -translate-x-1/2 transform-gpu blur-3xl sm:top-[-28rem] sm:ml-16 sm:translate-x-0 sm:transform-gpu"
          >
            <div
              className="aspect-[1097/845] w-[68.5625rem] bg-gradient-to-tr from-[#14BFFB] to-[#776fff] opacity-20"
              style={{
                clipPath:
                  'polygon(74.1% 44.1%, 100% 61.6%, 97.5% 26.9%, 85.5% 0.1%, 80.7% 2%, 72.5% 32.5%, 60.2% 62.4%, 52.4% 68.1%, 47.5% 58.3%, 45.2% 34.5%, 27.5% 76.7%, 0.1% 64.9%, 17.9% 100%, 27.6% 76.8%, 76.1% 97.7%, 74.1% 44.1%)',
              }}
            />
          </div>
          <div className="mx-auto max-w-7xl px-6 lg:px-8">
            <div className="mx-auto max-w-2xl lg:mx-0">
              <h2 className="text-4xl font-bold tracking-tight text-white sm:text-6xl">Power your business with the GOING Network</h2>
              <p className="mt-6 text-lg leading-8 text-gray-300">
                Focus on what you do best: creating great products. Let us handle the complexity of same-day delivery.
                Integrate with our network and offer your customers a premium, fast, and reliable shipping experience.
              </p>
            </div>
            <div className="mx-auto mt-16 max-w-2xl lg:mx-0 lg:max-w-none">
              <div className="grid grid-cols-1 gap-x-8 gap-y-6 text-base font-semibold leading-7 text-white sm:grid-cols-2 md:flex lg:gap-x-10">
                <HeroButton />
              </div>
            </div>
          </div>
        </div>

        {/* Features Section */}
        <div className="bg-white dark:bg-gray-900 py-24 sm:py-32">
          <div className="mx-auto max-w-7xl px-6 lg:px-8">
            <div className="mx-auto max-w-2xl lg:text-center">
              <h2 className="text-base font-semibold leading-7 text-primary">Deploy faster</h2>
              <p className="mt-2 text-3xl font-bold tracking-tight text-gray-900 dark:text-white sm:text-4xl">
                Everything you need to scale your logistics
              </p>
              <p className="mt-6 text-lg leading-8 text-gray-600 dark:text-gray-400">
                Our platform provides the tools and infrastructure to streamline your delivery operations.
              </p>
            </div>
            <div className="mx-auto mt-16 max-w-2xl sm:mt-20 lg:mt-24 lg:max-w-4xl">
              <dl className="grid max-w-xl grid-cols-1 gap-x-8 gap-y-10 lg:max-w-none lg:grid-cols-2 lg:gap-y-16">
                {features.map((feature) => (
                  <div key={feature.name} className="relative pl-16">
                    <dt className="text-base font-semibold leading-7 text-gray-900 dark:text-white">
                      <div className="absolute left-0 top-0 flex h-10 w-10 items-center justify-center rounded-lg bg-primary">
                        <feature.icon className="h-6 w-6 text-white" aria-hidden="true" />
                      </div>
                      {feature.name}
                    </dt>
                    <dd className="mt-2 text-base leading-7 text-gray-600 dark:text-gray-400">{feature.description}</dd>
                  </div>
                ))}
              </dl>
            </div>
          </div>
        </div>
      </main>
    </div>
  );
};

export default BusinessPage;
