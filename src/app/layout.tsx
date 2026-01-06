import type { Metadata } from "next";
// import { Geist, Geist_Mono } from "next/font/google";
import "./globals.css";
import "leaflet/dist/leaflet.css";
import client from "@/lib/mongodb";
import { GlobalProviders } from '@/providers/GlobalProviders';
import { SocketProvider } from "@/context/SocketContext";
import ConsoleSuppressor from "@/components/ConsoleSuppressor";


const geistSans = {
  variable: "font-sans",
};

const geistMono = {
  variable: "font-mono",
};

export const metadata: Metadata = {
  title: "GOING",
  description: "Experience the future of commerce with GOING.",
  icons: {
    icon: ['/favicon.ico']
  },
  openGraph: {
    title: 'GOING',
    description: 'Experience the future of commerce with GOING.',
    url: 'https://going-taupe.vercel.app/',
    siteName: 'GOING',
    images: [
      {
        url: 'https://going-taupe.vercel.app/logo.png',
        width: 800,
        height: 600,
        alt: 'GOING Logo'
      }
    ],
    locale: 'es_ES',
    type: 'website',
  },
  twitter: {
    card: "summary",
    title: "GOING — The Decentralized Marketplace",
    description: "Experience the future of commerce with GOING. Try the live demo now.",
    images: [{
      url: "https://going-taupe.vercel.app/logo.png",
      width: 800,
      height: 600,
      alt: 'GOING Logo'
    }],
    site: "@GOING",
    creator: "@GOING"
  }
};

export default async function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {


  client.db(process.env.MONGODB_DB); // Intenta acceder a la base de datos


  return (
    <html lang="en">
      <body
        className={`${geistSans.variable} ${geistMono.variable} antialiased min-h-screen flex flex-col`}
      >
        <GlobalProviders>
          <SocketProvider>
            {children}
          </SocketProvider>
        </GlobalProviders>
      </body>
    </html >
  );
}
