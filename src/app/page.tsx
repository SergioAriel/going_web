
import Link from 'next/link';
import { BuildingStorefrontIcon, CubeTransparentIcon, GlobeAltIcon, TruckIcon } from '@heroicons/react/24/outline';
import Image from 'next/image';
import CorporateHeader from '@/components/layoutCorporate/CorporateHeader';
import CorporateFooter from '@/components/layoutCorporate/CorporateFooter';



export default function CorporateLandingPage() {
  return (
    <div className="bg-white dark:bg-gray-900">
      <CorporateHeader />

      {/* Hero Section */}
      <section 
        className="relative h-[60vh] flex items-center justify-center text-white bg-cover bg-center"
        style={{ backgroundImage: "url('/going_hero.png')" }}
      >
        <div className="absolute inset-0 bg-black opacity-40"></div>
        <div className="relative z-10 text-center px-6 sm:px-8">
          <h1 className="text-4xl md:text-6xl font-extrabold mb-4">The Future is on <Image src="/goingLogo.png" alt="Going Ecosystem" width={250} height={150} className="inline-block" /></h1>
          <p className="text-lg md:text-xl max-w-3xl mx-auto text-white/90">
            CONNECTING THE WORLD. DELIVERING THE FUTURE
          </p>
          <p className="text-lg md:text-xl max-w-3xl mx-auto text-white/90">
            ETHICAL AND EFFICIENT WEB3 LOGISTICS
          </p>
        </div>
      </section>

      {/* Products Section */}
      <section className="py-20 lg:py-28">
        <div className="container mx-auto px-4 sm:px-6 lg:px-8">
          <div className="grid md:grid-cols-2 gap-8 items-center">
            {/* Marketplace Card */}
            <div className="bg-gray-50 dark:bg-gray-800 rounded-lg p-8 text-center hover:shadow-xl transition-shadow duration-300">
              <BuildingStorefrontIcon className="h-16 w-16 mx-auto text-primary mb-4" />
              <h2 className="text-3xl font-bold text-gray-900 dark:text-white mb-3">GOING Marketplace</h2>
              <p className="text-gray-600 dark:text-gray-400 mb-6">
                Discover and shop from the best local stores in your city. A curated experience with ultra-fast delivery.
              </p>
              <Link href="/marketplace" className="btn-primary">
                Enter Marketplace
              </Link>
            </div>

            {/* Logistics Card */}
            <div className="bg-gray-50 dark:bg-gray-800 rounded-lg p-8 text-center hover:shadow-xl transition-shadow duration-300">
              <TruckIcon className="h-16 w-16 mx-auto text-primary mb-4" />
              <h2 className="text-3xl font-bold text-gray-900 dark:text-white mb-3">GOING Logistics</h2>
              <p className="text-gray-600 dark:text-gray-400 mb-6">
                Power your business with our same-day delivery network. Manage shipments, reduce costs, and delight your customers.
              </p>
              <Link href="/logistics" className="btn-secondary">
                For Businesses
              </Link>
            </div>
          </div>
        </div>
      </section>

      {/* Core Benefits Section */}
      <section className="py-20 lg:py-28 bg-gray-100 dark:bg-gray-800">
        <div className="container mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center max-w-3xl mx-auto mb-12">
            <h2 className="text-3xl md:text-4xl font-bold text-gray-900 dark:text-white">A Smarter Way to Move Goods</h2>
            <p className="text-gray-600 dark:text-gray-400 mt-4">
              Our ecosystem is built on principles of efficiency, transparency, and local empowerment.
            </p>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-8 text-center">
            <div className="p-6">
              <GlobeAltIcon className="h-12 w-12 mx-auto text-primary mb-4" />
              <h3 className="text-xl font-semibold mb-2 text-white">Local Focus</h3>
              <p className="text-gray-600 dark:text-gray-400">We strengthen local economies by connecting neighborhood businesses with their customers.</p>
            </div>
            <div className="p-6">
              <CubeTransparentIcon className="h-12 w-12 mx-auto text-primary mb-4" />
              <h3 className="text-xl font-semibold mb-2 text-white">Transparent & Efficient</h3>
              <p className="text-gray-600 dark:text-gray-400">Advanced algorithms optimize routes and batches, reducing costs and delivery times for everyone.</p>
            </div>
            <div className="p-6">
              <TruckIcon className="h-12 w-12 mx-auto text-primary mb-4" />
              <h3 className="text-xl font-semibold mb-2 text-white">Decentralized Network</h3>
              <p className="text-gray-600 dark:text-gray-400">Our model empowers a network of independent drivers, creating flexible opportunities.</p>
            </div>
          </div>
        </div>
      </section>

      <CorporateFooter />
    </div>
  );
}
