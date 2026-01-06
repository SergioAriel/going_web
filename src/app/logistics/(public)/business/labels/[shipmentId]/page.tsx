'use client'

import { useEffect, useState } from "react";
import { useParams, useRouter } from "next/navigation";
import { usePrivy } from "@privy-io/react-auth";
import { QRCodeSVG } from "qrcode.react";
import { Shipment } from "@/interfaces";
import { getShipment, updateShipment } from "@/lib/ServerActions/shipments";
import { useAlert } from "@/context/AlertContext";

export default function LabelPage() {
    const params = useParams();
    const router = useRouter();
    const { handleAlert } = useAlert();
    const { ready, authenticated } = usePrivy();
    const [shipment, setShipment] = useState<Shipment | null>(null);
    const [loading, setLoading] = useState(true);
    const shipmentId = params.shipmentId as string;

    useEffect(() => {
        if (ready && !authenticated) {
            router.push('/logistics/business/login');
            return;
        }
    }, [ready, authenticated, router]);

    useEffect(() => {
        if (!shipmentId || !authenticated) return;
        (async () => {
            const data = await getShipment(shipmentId);
            setShipment(data);
            setLoading(false);
        })();
    }, [shipmentId, authenticated]);

    const handlePrint = () => {
        window.print();
    };

    const handleReadyToShip = async () => {
        if (!shipment) return;

        try {
            const res = await updateShipment(shipment._id, { status: 'ready_to_ship' });
            if (res && res.status) { // Checking if res is truthy and res.status is valid
                handleAlert({ message: "Shipment marked as Ready for Pickup!", isError: false });
                // Optionally redirect back or reload
                setShipment(prev => prev ? ({ ...prev, status: 'ready_to_ship' }) : null);
            } else {
                handleAlert({ message: "Failed to update shipment status.", isError: true });
            }
        } catch (error) {
            handleAlert({ message: "An error occurred.", isError: true });
        }
    };

    if (loading) return <div className="p-8 text-center">Loading label...</div>;
    if (!shipment) return <div className="p-8 text-center text-red-600">Shipment not found.</div>;

    // A6 Size Style (approx 105mm x 148mm)
    return (
        <div className="min-h-screen bg-gray-100 p-8 flex flex-col items-center">
            {/* Screen Controls (Hidden on Print) */}
            <div className="mb-6 flex flex-wrap gap-4 print:hidden justify-center">
                <button
                    onClick={() => router.back()}
                    className="px-4 py-2 bg-gray-600 text-white rounded hover:bg-gray-700 font-medium"
                >
                    Back to Dashboard
                </button>

                {/* Always allow printing */}
                <button
                    onClick={handlePrint}
                    className="px-4 py-2 bg-blue-600 text-white rounded hover:bg-blue-700 font-bold flex items-center"
                >
                    <svg className="w-5 h-5 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 17h2a2 2 0 002-2v-4a2 2 0 00-2-2H5a2 2 0 00-2 2v4a2 2 0 002 2h2m2-4h6a2 2 0 002-2v-4a2 2 0 00-2-2H9a2 2 0 00-2 2v4a2 2 0 002 2zm8-12V5a2 2 0 00-2-2H9a2 2 0 00-2 2v4h10z" /></svg>
                    Print Label (A4)
                </button>

                {/* Status Actions */}
                {shipment.status === 'pending' ? (
                    <button
                        onClick={handleReadyToShip}
                        className="px-4 py-2 bg-green-600 text-white rounded hover:bg-green-700 font-bold shadow-lg transform transition hover:scale-105"
                    >
                        Confirm Ready for Pickup
                    </button>
                ) : (
                    <div className="px-4 py-2 bg-gray-100 text-gray-800 rounded border border-gray-300 font-medium flex items-center">
                        <span className={`w-3 h-3 rounded-full mr-2 ${shipment.status === 'ready_to_ship' ? 'bg-green-500' : 'bg-blue-500'}`}></span>
                        Status: {shipment.status.replace(/_/g, ' ').toUpperCase()}
                    </div>
                )}
            </div>

            {/* Paperless Instructions (Visible only on screen) */}
            <div className="mb-6 w-full max-w-[105mm] bg-yellow-50 border-2 border-yellow-200 p-4 rounded-xl shadow-sm print:hidden">
                <div className="flex items-start">
                    <div className="p-2 bg-yellow-100 rounded-lg mr-3">
                        <svg className="w-6 h-6 text-yellow-700" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" /></svg>
                    </div>
                    <div>
                        <h3 className="text-sm font-bold text-yellow-800 uppercase tracking-wider">No tienes impresora?</h3>
                        <p className="text-sm text-yellow-700 mb-3">Escribe estos dos códigos con un marcador sobre el paquete:</p>
                        <div className="flex gap-4">
                            <div className="bg-white px-3 py-2 rounded border border-yellow-300 shadow-inner">
                                <span className="block text-[10px] text-gray-500 uppercase font-bold">Identificador</span>
                                <span className="text-xl font-mono font-black text-gray-900">{shipment.shortCode || 'N/A'}</span>
                            </div>
                            <div className="bg-white px-3 py-2 rounded border border-yellow-300 shadow-inner">
                                <span className="block text-[10px] text-gray-500 uppercase font-bold">PIN de Recogida</span>
                                <span className="text-xl font-mono font-black text-blue-600 tracking-widest">{shipment.deliveryToken || '----'}</span>
                            </div>
                        </div>
                    </div>
                </div>
            </div>

            {/* Label Container (Formatted for A4 Print) */}
            <div
                className="bg-white text-black shadow-lg overflow-hidden relative print:shadow-none print:m-0 print:border print:border-gray-300"
                style={{
                    width: '105mm',
                    height: '148mm',
                    padding: '5mm',
                    boxSizing: 'border-box',
                    fontFamily: 'system-ui, sans-serif',
                    margin: '0 auto' // Center on page
                }}
            >
                {/* Header: Short Code & Brand */}
                <div className="border-b-4 border-black pb-2 mb-2 flex justify-between items-start">
                    <div>
                        {/* Huge Short Code for Visibility */}
                        <h1 className="text-5xl font-black tracking-tighter" style={{ fontSize: '3rem', lineHeight: '1' }}>
                            {shipment.shortCode || "N/A"}
                        </h1>
                        <p className="text-xs uppercase font-bold mt-1">Going Logistics</p>
                    </div>
                    <div className="text-right">
                        <p className="text-xs font-bold">PKG: 1/{shipment.packageCount || 1}</p>
                        <p className="text-xs">{new Date().toLocaleDateString()}</p>
                    </div>
                </div>

                {/* Delivery Address (Mid Section) */}
                <div className="mb-4">
                    <p className="text-xs uppercase text-gray-500 font-bold">Deliver To:</p>
                    <p className="text-lg font-bold leading-tight truncate-2-lines">
                        {shipment.deliveryAddress.fullName || "Recipient"}
                    </p>
                    <p className="text-sm leading-tight">
                        {shipment.deliveryAddress.street} <br />
                        {shipment.deliveryAddress.city}, {shipment.deliveryAddress.zipCode}
                    </p>
                    {/* Safe Place for Instructions if any */}
                    {shipment.deliveryAddress.instructions && (
                        <div className="mt-1 border border-dashed border-gray-400 p-1 text-xs italic">
                            Note: {shipment.deliveryAddress.instructions}
                        </div>
                    )}
                </div>

                {/* Sender Address (Small) */}
                <div className="mb-2 text-xs text-gray-600 border-t border-gray-200 pt-1">
                    <span className="font-bold">From:</span> {shipment.pickupAddress.street}, {shipment.pickupAddress.city}
                </div>

                {/* Footer: QR Code and Token Warning */}
                <div className="mt-auto flex flex-row items-end justify-between border-t-4 border-black pt-2">
                    <div className="flex-1">
                        {/* QR Code for Driver Scanning */}
                        <QRCodeSVG value={shipment._id} size={90} level={"H"} />
                        {/* Removed confusing partial ID */}
                    </div>

                    <div className="flex-1 text-right pl-2">
                        {/* Token Removed for Security - Only visible in App */}
                        <div className="border-2 border-gray-300 p-2 text-center mb-1 bg-gray-100">
                            <p className="text-[10px] uppercase font-bold text-gray-400">Security</p>
                            <p className="text-sm font-bold text-gray-500">PIN in App</p>
                        </div>
                        <p className="text-[10px] leading-tight text-gray-500">
                            Driver: Scan QR to Pick Up.<br />
                            Customer: Provide PIN to Receive.
                        </p>
                    </div>
                </div>
            </div>

            <style jsx global>{`
                @media print {
                    @page {
                        size: A4;
                        margin: 20mm;
                    }
                    body {
                        background: white;
                    }
                    body * {
                        visibility: hidden;
                    }
                    .min-h-screen > div:last-child,
                    .min-h-screen > div:last-child * {
                        visibility: visible;
                    }
                    .min-h-screen > div:last-child {
                        position: absolute;
                        left: 50%;
                        top: 20mm;
                        transform: translateX(-50%);
                        margin: 0;
                        border: 1px dashed #ccc; /* Guide for cutting */
                    }
                }
            `}</style>
        </div>
    );
}
