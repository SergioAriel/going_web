
import Image from 'next/image';
import Link from 'next/link';

const CorporateHeader = () => (
  <header className="bg-white dark:bg-gray-900 p-4 shadow-md sticky top-0 z-50">
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
      </Link>      <div>
        <Link href="/logistics" className="text-gray-600 dark:text-gray-300 hover:text-primary px-4">Logistics</Link>
        <Link href="/marketplace" className="text-gray-600 dark:text-gray-300 hover:text-primary px-4">Marketplace</Link>
        <Link href="/contact" className="text-gray-600 dark:text-gray-300 hover:text-primary px-4">Contact</Link>
      </div>
    </nav>
  </header>
);

export default CorporateHeader;
