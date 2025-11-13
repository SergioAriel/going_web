import { ArrowRightIcon, BriefcaseIcon, CurrencyDollarIcon, RocketLaunchIcon, ShieldCheckIcon, TruckIcon } from '@heroicons/react/24/outline';
import Link from 'next/link';

const IconWrapper = ({ children }: { children: React.ReactNode }) => (
  <div className="w-16 h-16 mx-auto mb-6 bg-gradient-primary rounded-full flex items-center justify-center">
    {children}
  </div>
);

export default function DeliveryLandingPage() {
  return (
    <div className="bg-white dark:bg-gray-900 text-gray-900 dark:text-white">
      {/* Hero Section */}
      <section className="relative text-center py-20 lg:py-28 bg-gray-50 dark:bg-gray-800">
        <div className="absolute top-0 left-0 w-full h-full dot-pattern opacity-10"></div>
        <div className="container mx-auto px-4 sm:px-6 lg:px-8 relative z-10">
          <h1 className="text-4xl md:text-6xl font-extrabold mb-4 text-transparent bg-clip-text bg-gradient-brand pb-2">
            Intelligent Logistics for Your City
          </h1>
          <p className="text-lg md:text-xl max-w-3xl mx-auto text-gray-600 dark:text-gray-300 mb-8">
            Optimize your deliveries, reduce costs, and delight your customers with the power of the GOING logistics network.
          </p>
          <div className="flex justify-center gap-4">
            <Link href="/logistics/business" className="btn-primary">
              Register Your Business
            </Link>
            <Link href="/logistics/drive" className="btn-secondary">
              Become a Driver
            </Link>
          </div>
        </div>
      </section>

      {/* How It Works Section */}
      <section className="py-20 lg:py-28">
        <div className="container mx-auto px-4 sm:px-6 lg:px-8">
          <h2 className="text-3xl md:text-4xl font-bold text-center mb-12">
            Deliveries in 3 Simple Steps
          </h2>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-8 text-center">
            <div className="p-6">
              <IconWrapper>
                <RocketLaunchIcon className="h-8 w-8 text-white" />
              </IconWrapper>
              <h3 className="text-xl font-semibold mb-2">1. Request</h3>
              <p className="text-gray-600 dark:text-gray-400">
                Integrate your system or request pickups manually. Our platform receives your orders instantly.
              </p>
            </div>
            <div className="p-6">
              <IconWrapper>
                <TruckIcon className="h-8 w-8 text-white" />
              </IconWrapper>
              <h3 className="text-xl font-semibold mb-2">2. We Pick Up</h3>
              <p className="text-gray-600 dark:text-gray-400">
                Our logistics engine assigns the nearest driver and optimizes the pickup route.
              </p>
            </div>
            <div className="p-6">
              <IconWrapper>
                <ShieldCheckIcon className="h-8 w-8 text-white" />
              </IconWrapper>
              <h3 className="text-xl font-semibold mb-2">3. We Deliver</h3>
              <p className="text-gray-600 dark:text-gray-400">
                Your customers receive their products the same day, with real-time tracking for peace of mind.
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* Benefits Section */}
      <section className="py-20 lg:py-28 bg-gray-50 dark:bg-gray-800">
        <div className="container mx-auto px-4 sm:px-6 lg:px-8">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-16 items-center">
            {/* For Businesses */}
            <div>
              <h2 className="text-3xl md:text-4xl font-bold mb-6">For Your Business</h2>
              <ul className="space-y-4">
                <li className="flex items-start">
                  <BriefcaseIcon className="h-6 w-6 text-primary flex-shrink-0 mr-3 mt-1" />
                  <div>
                    <h4 className="font-semibold">Reduce Operational Costs</h4>
                    <p className="text-gray-600 dark:text-gray-400">Pay only for what you ship, with no fixed fleet or personnel costs.</p>
                  </div>
                </li>
                <li className="flex items-start">
                  <ArrowRightIcon className="h-6 w-6 text-primary flex-shrink-0 mr-3 mt-1" />
                  <div>
                    <h4 className="font-semibold">Expand Your Reach</h4>
                    <p className="text-gray-600 dark:text-gray-400">Reach more customers in your city with fast and reliable deliveries.</p>
                  </div>
                </li>
              </ul>
            </div>
            {/* For Drivers */}
            <div>
              <h2 className="text-3xl md:text-4xl font-bold mb-6">For Drivers</h2>
              <ul className="space-y-4">
                <li className="flex items-start">
                  <CurrencyDollarIcon className="h-6 w-6 text-primary flex-shrink-0 mr-3 mt-1" />
                  <div>
                    <h4 className="font-semibold">Maximize Your Earnings</h4>
                    <p className="text-gray-600 dark:text-gray-400">Receive optimized delivery batches to minimize your time and maximize your income.</p>
                  </div>
                </li>
                <li className="flex items-start">
                  <ArrowRightIcon className="h-6 w-6 text-primary flex-shrink-0 mr-3 mt-1" />
                  <div>
                    <h4 className="font-semibold">Total Flexibility</h4>
                    <p className="text-gray-600 dark:text-gray-400">Drive when you want. Be your own boss and earn income at your own pace.</p>
                  </div>
                </li>
              </ul>
            </div>
          </div>
        </div>
      </section>

      {/* Final CTA Section */}
      <section className="py-20 bg-gradient-brand text-white">
        <div className="container mx-auto px-4 sm:px-6 lg:px-8 text-center">
          <h2 className="text-3xl md:text-4xl font-bold mb-4">Ready to Get Started?</h2>
          <p className="text-lg md:text-xl max-w-3xl mx-auto mb-8">
            Join the urban logistics revolution. Whether you want to grow your business or earn income, GOING is your partner.
          </p>
          <div className="flex justify-center gap-4">
            <Link href="/logistics/business" className="bg-white text-primary font-semibold py-3 px-8 rounded-lg shadow-md hover:bg-gray-200 transition-transform duration-300 transform hover:scale-105">
              I'm a Business
            </Link>
            <Link href="/logistics/drive" className="border-2 border-white text-white font-semibold py-3 px-8 rounded-lg shadow-md hover:bg-white hover:text-primary transition-all duration-300 transform hover:scale-105">
              I'm a Driver
            </Link>
          </div>
        </div>
      </section>
    </div>
  );
}