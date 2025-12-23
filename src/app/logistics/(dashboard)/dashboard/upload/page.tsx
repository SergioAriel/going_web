'use client';

import React from 'react';
import Link from 'next/link';
import BusinessShipmentUpload from '@/components/business/BusinessShipmentUpload';
import { ArrowLeftIcon } from '@heroicons/react/24/outline';

export default function UploadPage() {
    return (
        <div className="p-6 sm:p-10">
            <div className="mb-8 flex items-center gap-4">
                <Link href="/logistics/dashboard" className="text-gray-400 hover:text-white transition">
                    <ArrowLeftIcon className="h-6 w-6" />
                </Link>
                <h1 className="text-3xl font-bold tracking-tight text-white">
                    New Shipment Upload
                </h1>
            </div>

            <div className="bg-white rounded-lg shadow-lg overflow-hidden">
                <BusinessShipmentUpload />
            </div>
        </div>
    );
}
