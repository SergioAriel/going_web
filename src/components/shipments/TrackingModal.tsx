'use client';

import React, { useEffect, useState } from 'react';
import { io, Socket } from 'socket.io-client';
import { APIProvider, Map, AdvancedMarker, Pin, useMap } from '@vis.gl/react-google-maps';
import { Shipment, GoingNetworkShipment } from '@/interfaces';
import { XMarkIcon } from '@heroicons/react/24/outline';

interface TrackingModalProps {
    shipment: Shipment;
    onClose: () => void;
}

const Polyline = ({ path, options }: { path: google.maps.LatLngLiteral[], options?: google.maps.PolylineOptions }) => {
    const map = useMap();

    useEffect(() => {
        if (!map) return;

        const polyline = new google.maps.Polyline({
            path,
            ...options,
        });

        polyline.setMap(map);

        return () => {
            polyline.setMap(null);
        };
    }, [map, path, options]);

    return null;
};

export default function TrackingModal({ shipment, onClose }: TrackingModalProps) {
    const [socket, setSocket] = useState<Socket | null>(null);
    const [driverLocation, setDriverLocation] = useState<[number, number] | null>(null);
    const [driverStatus, setDriverStatus] = useState<string>('Connecting...');

    // Extract driverId if it exists (only for Going Network shipments)
    const driverId = shipment.shippingType === 'going_network'
        ? (shipment as GoingNetworkShipment).deliveryDetails?.driverId
        : undefined;

    // Initialize Socket
    useEffect(() => {
        // Connect to Socket Server (Engine)
        const socketUrl = process.env.NEXT_PUBLIC_GOING_ENGINE_URL || 'http://localhost:3001';
        const newSocket = io(socketUrl);

        newSocket.on('connect', () => {
            console.log('Connected to Tracking Socket');
            setDriverStatus('Waiting for driver updates...');

            if (driverId) {
                newSocket.emit('track_driver', { driverId });
            }
        });

        newSocket.on('driver_location_changed', (data: { lat: number, lon: number, driverId: string }) => {
            if (data.driverId === driverId) {
                setDriverLocation([data.lat, data.lon]);
                setDriverStatus('Driver moving...');
            }
        });

        setSocket(newSocket);

        return () => {
            newSocket.disconnect();
        };
    }, [driverId]);

    const pickupAddressStr = shipment.pickupAddress.fullName || 'Pickup';
    const deliveryAddressStr = shipment.deliveryAddress.fullName || 'Delivery';

    const pickupPos = { lat: shipment.pickupAddress.lat || 0, lng: shipment.pickupAddress.lon || 0 };
    const deliveryPos = { lat: shipment.deliveryAddress.lat || 0, lng: shipment.deliveryAddress.lon || 0 };
    const driverPos = driverLocation ? { lat: driverLocation[0], lng: driverLocation[1] } : undefined;

    const center = driverPos || {
        lat: (pickupPos.lat + deliveryPos.lat) / 2,
        lng: (pickupPos.lng + deliveryPos.lng) / 2,
    };

    return (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black bg-opacity-50 p-4">
            <div className="bg-white rounded-lg shadow-xl w-full max-w-4xl overflow-hidden relative">
                {/* Header */}
                <div className="p-4 border-b flex justify-between items-center bg-gray-50">
                    <div>
                        <h2 className="text-lg font-bold text-gray-900">Tracking Shipment #{shipment.orderId}</h2>
                        <p className="text-sm text-gray-500">Status: <span className="font-semibold text-blue-600">{shipment.status}</span> | Driver: {driverStatus}</p>
                    </div>
                    <button onClick={onClose} className="text-gray-400 hover:text-gray-600">
                        <XMarkIcon className="h-6 w-6" />
                    </button>
                </div>

                {/* Map */}
                <div className="h-[500px] w-full relative">
                    <APIProvider apiKey={process.env.NEXT_PUBLIC_GOOGLE_MAPS_API_KEY || ""}>
                        <Map
                            defaultCenter={center}
                            defaultZoom={12}
                            mapId="TRACKING_MODAL_MAP"
                            fullscreenControl={false}
                        >
                            {/* Pickup Marker */}
                            <AdvancedMarker position={pickupPos} title={`Pickup: ${pickupAddressStr}`}>
                                <Pin background={'#2E64FE'} glyphColor={'#FFF'} borderColor={'#0040FF'} />
                            </AdvancedMarker>

                            {/* Delivery Marker */}
                            <AdvancedMarker position={deliveryPos} title={`Delivery: ${deliveryAddressStr}`}>
                                <Pin background={'#FE2E2E'} glyphColor={'#FFF'} borderColor={'#FF0000'} />
                            </AdvancedMarker>

                            {/* Driver Marker */}
                            {driverPos && (
                                <AdvancedMarker position={driverPos} zIndex={1000} title="Driver">
                                    <img src="https://cdn-icons-png.flaticon.com/512/758/758669.png" alt="Driver" style={{ width: '35px', height: '35px' }} />
                                </AdvancedMarker>
                            )}

                            {/* Route Line (Straight for now) */}
                            <Polyline path={[pickupPos, deliveryPos]} options={{ strokeColor: 'gray', strokeOpacity: 0.5, strokeWeight: 2, icons: [{ icon: { path: 'M 0,-1 0,1', strokeOpacity: 1, scale: 2 }, offset: '0', repeat: '10px' }] }} />

                            {/* Driver Path (Dynamic) */}
                            {driverPos && (
                                <Polyline path={[driverPos, deliveryPos]} options={{ strokeColor: '#14BFFB', strokeOpacity: 0.8, strokeWeight: 4 }} />
                            )}
                        </Map>
                    </APIProvider>
                </div>
            </div>
        </div>
    );
}
