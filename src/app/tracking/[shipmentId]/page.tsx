'use client';

import { useEffect, useState } from 'react';
import dynamic from 'next/dynamic';
import { useParams } from 'next/navigation';
import { getShipment } from '@/lib/ServerActions/shipments';
import QRCode from 'react-qr-code';
import toast from 'react-hot-toast';

// Dynamically import map (leaflet needs window)
const ShipmentMap = dynamic(() => import('@/components/shipments/ShipmentMap'), {
    ssr: false,
    loading: () => <div className="h-64 w-full bg-slate-100 animate-pulse rounded-xl" />
});

export default function PublicTrackingPage() {
    const params = useParams();
    const shipmentId = params.shipmentId as string;
    const [shipment, setShipment] = useState<any>(null);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        const fetchShipment = async () => {
            try {
                const data = await getShipment(shipmentId);
                if (data) {
                    setShipment(data);
                }
            } catch (error) {
                console.error("Error fetching shipment:", error);
            } finally {
                setLoading(false);
            }
        };

        if (shipmentId) {
            fetchShipment();
        }
    }, [shipmentId]);

    const handleShare = () => {
        if (typeof navigator !== 'undefined' && navigator.share) {
            navigator.share({
                title: `Seguimiento de Envío - ${shipmentId}`,
                text: `Sigue tu envío aquí:`,
                url: window.location.href,
            }).catch(console.error);
        } else {
            navigator.clipboard.writeText(window.location.href);
            toast.success('Enlace copiado al portapapeles');
        }
    };

    const handleWhatsAppShare = () => {
        const text = `Sigue tu envío y mira tu código QR aquí: ${window.location.href}`;
        const url = `https://wa.me/?text=${encodeURIComponent(text)}`;
        window.open(url, '_blank');
    };

    if (loading) return (
        <div className="min-h-screen flex items-center justify-center bg-slate-50">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-indigo-600"></div>
        </div>
    );

    if (!shipment) return (
        <div className="min-h-screen flex flex-col items-center justify-center bg-slate-50 p-4 font-sans">
            <h1 className="text-2xl font-bold text-slate-800 mb-2">Envío no encontrado</h1>
            <p className="text-slate-500">No pudimos encontrar la información para este envío.</p>
        </div>
    );

    return (
        <main className="min-h-screen bg-slate-50 font-sans pb-12">
            {/* Header */}
            <header className="bg-white border-b border-slate-200 sticky top-0 z-10">
                <div className="max-w-md mx-auto px-4 h-16 flex items-center justify-between">
                    <div className="flex items-center gap-2">
                        <div className="h-8 w-8 bg-indigo-600 rounded-lg flex items-center justify-center">
                            <span className="text-white font-bold text-lg">G</span>
                        </div>
                        <span className="font-bold text-slate-900 text-lg">Going</span>
                    </div>
                    <div className="text-xs font-medium px-2 py-1 bg-slate-100 rounded text-slate-600">
                        {shipment.status === 'delivered' ? 'Entregado' : 'En camino'}
                    </div>
                </div>
            </header>

            <div className="max-w-md mx-auto px-4 py-6 space-y-6">

                {/* QR Code Section - Always visible for picking up */}
                <div className="bg-white rounded-2xl shadow-sm border border-slate-100 p-6 flex flex-col items-center text-center">
                    <h2 className="text-lg font-bold text-slate-800 mb-1">Tu Código de Entrega</h2>
                    <p className="text-sm text-slate-500 mb-6">Muestra este código al repartidor</p>

                    <div className="p-2 bg-white rounded-xl border-2 border-slate-100">
                        <QRCode
                            value={shipment._id}
                            size={180}
                            style={{ height: "auto", maxWidth: "100%", width: "100%" }}
                            viewBox={`0 0 256 256`}
                            fgColor="#1e293b" // slate-800
                        />
                    </div>
                    <p className="mt-4 text-xs font-mono text-slate-400 select-all">ID: {shipment._id}</p>
                </div>

                {/* Map Section */}
                <div className="bg-white rounded-2xl shadow-sm border border-slate-100 overflow-hidden">
                    <div className="p-4 border-b border-slate-50">
                        <h3 className="font-semibold text-slate-800">Ubicación del Envío</h3>
                    </div>
                    <div className="h-64 relative z-0">
                        <ShipmentMap
                            pickupCoords={[shipment.pickupAddress?.lat || 0, shipment.pickupAddress?.lon || 0]}
                            deliveryCoords={[shipment.deliveryAddress?.lat || 0, shipment.deliveryAddress?.lon || 0]}
                            pickupAddress={shipment.pickupAddress?.fullName || 'Punto de Retiro'}
                            deliveryAddress={shipment.deliveryAddress?.fullName || 'Punto de Entrega'}
                        // We can add driver location here later if public socket is enabled
                        />
                    </div>
                </div>

                {/* Status Timeline (Simple) */}
                <div className="bg-white rounded-2xl shadow-sm border border-slate-100 p-6">
                    <h3 className="font-semibold text-slate-800 mb-4">Estado</h3>
                    <div className="space-y-4 relative before:absolute before:left-2 before:top-2 before:bottom-2 before:w-0.5 before:bg-slate-100">

                        <div className="relative pl-8">
                            <div className={`absolute left-0 top-1 w-4 h-4 rounded-full border-2 ${shipment.status !== 'pending' && shipment.status !== 'payment_pending' ? 'bg-indigo-600 border-indigo-600' : 'bg-white border-indigo-600'}`}></div>
                            <p className="text-sm font-medium text-slate-900">Creado</p>
                            <p className="text-xs text-slate-500">El envío ha sido registrado.</p>
                        </div>

                        <div className="relative pl-8">
                            <div className={`absolute left-0 top-1 w-4 h-4 rounded-full border-2 ${shipment.status === 'in_transit' || shipment.status === 'delivered' ? 'bg-indigo-600 border-indigo-600' : 'bg-white border-slate-300'}`}></div>
                            <p className="text-sm font-medium text-slate-900">En Tránsito</p>
                            <p className="text-xs text-slate-500">El repartidor tiene tu paquete.</p>
                        </div>

                        <div className="relative pl-8">
                            <div className={`absolute left-0 top-1 w-4 h-4 rounded-full border-2 ${shipment.status === 'delivered' ? 'bg-indigo-600 border-indigo-600' : 'bg-white border-slate-300'}`}></div>
                            <p className="text-sm font-medium text-slate-900">Entregado</p>
                            <p className="text-xs text-slate-500">Paquete entregado con éxito.</p>
                        </div>
                    </div>
                </div>

                {/* Share Buttons */}
                <div className="grid grid-cols-2 gap-3">
                    <button
                        onClick={handleWhatsAppShare}
                        className="flex items-center justify-center gap-2 py-3 px-4 bg-green-500 hover:bg-green-600 text-white rounded-xl font-medium transition-colors"
                    >
                        <span>WhatsApp</span>
                    </button>
                    <button
                        onClick={handleShare}
                        className="flex items-center justify-center gap-2 py-3 px-4 bg-white border border-slate-200 hover:bg-slate-50 text-slate-700 rounded-xl font-medium transition-colors"
                    >
                        <span>Copiar Link</span>
                    </button>
                </div>

            </div>
        </main>
    );
}
