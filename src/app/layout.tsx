import type { Metadata } from "next";
import { Geist, Geist_Mono } from "next/font/google";
import "./globals.css";
import "leaflet/dist/leaflet.css";
import client from "@/lib/mongodb";
import { GlobalProviders } from '@/providers/GlobalProviders';
import { SocketProvider } from "@/context/SocketContext";
import ConsoleSuppressor from "@/components/ConsoleSuppressor";


const geistSans = Geist({
  variable: "--font-geist-sans",
  subsets: ["latin"],
});

const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
});

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
        <ConsoleSuppressor />
        <GlobalProviders>
          <SocketProvider>
            {children}
          </SocketProvider>
        </GlobalProviders>
      </body>
    </html >
  );
}
