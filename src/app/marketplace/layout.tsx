'use client';

import Header from "@/components/layoutMarketplace/Header";
import Footer from "@/components/layoutMarketplace/Footer";
import { CartProvider } from "@/context/CartContext";
import { CurrenciesProvider } from "@/context/CurrenciesContext";

export default function MarketplaceLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <CurrenciesProvider>
      <CartProvider>
        <Header />
        <main className="flex-grow">
          {children}
        </main>
        <Footer />
      </CartProvider>
    </CurrenciesProvider>
  );
}