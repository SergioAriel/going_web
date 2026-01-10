'use client';

import { useEffect, useState } from 'react';
import dynamic from 'next/dynamic';
import { useParams } from 'next/navigation';
import { getShipment } from '@/lib/ServerActions/shipments';
import QRCode from 'react-qr-code';
import toast from 'react-hot-toast';
import { ChevronDownIcon, ChevronUpIcon, QrCodeIcon } from '@heroicons/react/24/outline';
import PublicLogisticsHeader from '@/components/layoutLogistics/PublicLogisticsHeader';

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
    const [isQrOpen, setIsQrOpen] = useState(false); // Default closed on mobile

    useEffect(() => {
        // Auto-open QR on Desktop
        if (typeof window !== 'undefined' && window.innerWidth >= 1024) {
            setIsQrOpen(true);
        }
    }, []);

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

            <PublicLogisticsHeader />

            {/* Content */}

            <div className="max-w-7xl mx-auto px-4 py-6 w-full grid grid-cols-1 lg:grid-cols-3 gap-6 min-h-[calc(100vh-5rem)]">

                {/* Left Column: Map (Takes priority/size) */}
                <div className="lg:col-span-2 flex flex-col">
                    <div className="bg-white rounded-2xl shadow-sm border border-slate-100 overflow-hidden flex-grow relative h-[500px] lg:h-auto">
                        <div className="absolute top-4 left-4 z-10 bg-white/90 backdrop-blur px-3 py-1 rounded-full text-xs font-medium shadow-sm text-slate-600 border border-slate-200">
                            Mapa en tiempo real
                        </div>
                        <div className="w-full h-full">
                            <ShipmentMap
                                pickupCoords={[shipment.pickupAddress?.lat || 0, shipment.pickupAddress?.lon || 0]}
                                deliveryCoords={[shipment.deliveryAddress?.lat || 0, shipment.deliveryAddress?.lon || 0]}
                                pickupAddress={shipment.pickupAddress?.fullName || 'Punto de Retiro'}
                                deliveryAddress={shipment.deliveryAddress?.fullName || 'Punto de Entrega'}
                            />
                        </div>
                    </div>
                </div>

                {/* Right Column: Details & QR */}
                <div className="lg:col-span-1 space-y-6 flex flex-col h-full">

                    {/* QR Code Section - Collapsible on Mobile, Fixed on Desktop */}
                    <div className="bg-white rounded-2xl shadow-sm border border-slate-100 overflow-hidden">
                        <div
                            className="p-4 border-b border-slate-50 flex justify-between items-center cursor-pointer lg:cursor-default"
                            onClick={() => window.innerWidth < 1024 && setIsQrOpen(!isQrOpen)}
                        >
                            <h2 className="text-lg font-bold text-slate-800 flex items-center gap-2">
                                <QrCodeIcon className="w-5 h-5 text-slate-400" />
                                Código de Entrega
                            </h2>
                            <button className="lg:hidden text-slate-400">
                                {isQrOpen ? <ChevronUpIcon className="w-5 h-5" /> : <ChevronDownIcon className="w-5 h-5" />}
                            </button>
                        </div>

                        <div className={`p-6 flex flex-col items-center text-center transition-all duration-300 ${isQrOpen ? 'block' : 'hidden lg:flex'}`}>
                            <p className="text-sm text-slate-500 mb-6">Muestra este código al repartidor para recibir tu paquete.</p>
                            <div className="p-3 bg-white rounded-xl border-2 border-slate-100 shadow-inner">
                                <QRCode
                                    value={shipment._id}
                                    size={200}
                                    style={{ height: "auto", maxWidth: "100%", width: "100%" }}
                                    viewBox={`0 0 256 256`}
                                    fgColor="#1e293b"
                                />
                            </div>
                            <p className="mt-4 text-xs font-mono text-slate-400 select-all bg-slate-50 px-2 py-1 rounded">ID: {shipment._id}</p>
                        </div>
                    </div>

                    {/* Status Timeline */}
                    <div className="bg-white rounded-2xl shadow-sm border border-slate-100 p-6 flex-grow lg:flex-grow-0">
                        <h3 className="font-semibold text-slate-800 mb-4 flex items-center gap-2">
                            Estado del Envío
                        </h3>
                        <div className="space-y-6 relative before:absolute before:left-2.5 before:top-2 before:bottom-2 before:w-0.5 before:bg-slate-100">

                            <div className="relative pl-10">
                                <div className={`absolute left-0 top-1 w-5 h-5 rounded-full border-4 ${shipment.status !== 'pending' && shipment.status !== 'payment_pending' ? 'bg-indigo-600 border-indigo-100' : 'bg-white border-indigo-600'} shadow-sm`}></div>
                                <p className="text-sm font-bold text-slate-900">Creado</p>
                                <p className="text-xs text-slate-500 mt-0.5">El envío ha sido registrado correctamente.</p>
                            </div>

                            <div className="relative pl-10">
                                <div className={`absolute left-0 top-1 w-5 h-5 rounded-full border-4 ${['in_transit', 'delivered'].includes(shipment.status) ? 'bg-indigo-600 border-indigo-100' : 'bg-white border-slate-200'} shadow-sm`}></div>
                                <p className={`text-sm font-bold ${['in_transit', 'delivered'].includes(shipment.status) ? 'text-slate-900' : 'text-slate-400'}`}>En Tránsito</p>
                                <p className="text-xs text-slate-400 mt-0.5">El repartidor tiene tu paquete.</p>
                            </div>

                            <div className="relative pl-10">
                                <div className={`absolute left-0 top-1 w-5 h-5 rounded-full border-4 ${shipment.status === 'delivered' ? 'bg-green-500 border-green-100' : 'bg-white border-slate-200'} shadow-sm`}></div>
                                <p className={`text-sm font-bold ${shipment.status === 'delivered' ? 'text-slate-900' : 'text-slate-400'}`}>Entregado</p>
                                <p className="text-xs text-slate-400 mt-0.5">Paquete entregado con éxito.</p>
                            </div>
                        </div>
                    </div>

                    {/* Share Buttons */}
                    <div className="grid grid-cols-2 gap-3 mt-auto">
                        <button
                            onClick={handleWhatsAppShare}
                            className="flex items-center justify-center gap-2 py-3 px-4 bg-[#25D366] hover:bg-[#20bd5a] text-white rounded-xl font-bold transition-all shadow-sm hover:shadow active:scale-95"
                        >
                            <svg viewBox="0 0 24 24" fill="currentColor" className="w-5 h-5"><path d="M12.031 6.172c-3.181 0-5.767 2.586-5.768 5.766-.001 1.298.38 2.27 1.019 3.287l-.582 2.128 2.182-.573c.978.58 1.913.928 3.145.929 3.178 0 5.767-2.587 5.768-5.766.001-3.187-2.575-5.77-5.764-5.771zm3.392 8.244c-.144.405-.837.774-1.17.824-.299.045-.677.063-2.846-.828-.927-.382-1.633-1.072-2.327-1.928-.271-.334-.482-.705-.486-1.129-.005-.38.169-.649.33-.808.147-.144.351-.304.53-.306.179-.002.261.025.376.299.134.319.462 1.134.502 1.216.059.122.028.261-.06.402-.07.113-.133.197-.246.31-.097.098-.201.21-.082.416.326.565 1.488 1.996 2.583 2.502.226.105.417.067.575-.101.144-.153.627-.729.794-.979.135-.202.346-.168.618-.063.272.105 1.714.808 2.01.954.296.146.495.216.565.337.071.121.071.701-.073 1.106z" /></svg>
                            <span>WhatsApp</span>
                        </button>
                        <button
                            onClick={handleShare}
                            className="flex items-center justify-center gap-2 py-3 px-4 bg-white border border-slate-200 hover:bg-slate-50 text-slate-700 rounded-xl font-bold transition-all shadow-sm hover:shadow active:scale-95"
                        >
                            <span>Copiar Link</span>
                        </button>
                    </div>

                </div>

            </div>
        </main>
    );
}
