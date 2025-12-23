'use client';

import React, { useEffect, useState } from 'react';
import { io, Socket } from 'socket.io-client';
import { MapContainer, TileLayer, Marker, Popup, Polyline } from 'react-leaflet';
import L, { LatLngExpression } from 'leaflet';
import 'leaflet/dist/leaflet.css';
import { Shipment, GoingNetworkShipment } from '@/interfaces';
import { XMarkIcon } from '@heroicons/react/24/outline';

// Fix Leaflet Icon issue
delete (L.Icon.Default.prototype as any)._getIconUrl;
L.Icon.Default.mergeOptions({
    iconRetinaUrl: require('leaflet/dist/images/marker-icon-2x.png').default,
    iconUrl: require('leaflet/dist/images/marker-icon.png').default,
    shadowUrl: require('leaflet/dist/images/marker-shadow.png').default,
});

// Custom Driver Icon
const driverIcon = new L.Icon({
    iconUrl: 'https://cdn-icons-png.flaticon.com/512/758/758669.png', // Simple car/driver icon
    iconSize: [35, 35],
    iconAnchor: [17, 35],
    popupAnchor: [0, -35]
});

interface TrackingModalProps {
    shipment: Shipment;
    onClose: () => void;
}

export default function TrackingModal({ shipment, onClose }: TrackingModalProps) {
    const [socket, setSocket] = useState<Socket | null>(null);
    const [driverLocation, setDriverLocation] = useState<LatLngExpression | null>(null);
    const [driverStatus, setDriverStatus] = useState<string>('Connecting...');

    // Extract driverId if it exists (only for Going Network shipments)
    const driverId = shipment.shippingType === 'going_network'
        ? (shipment as GoingNetworkShipment).deliveryDetails?.driverId
        : undefined;

    // Initialize Socket
    useEffect(() => {
        // Connect to Socket Server (Port 4000)
        // Note: In production, use env var. For now, hardcoded to match recent fix.
        const newSocket = io('http://localhost:4000');

        newSocket.on('connect', () => {
            console.log('Connected to Tracking Socket');
            setDriverStatus('Waiting for driver updates...');

            // If we knew the driverId, we could emit a 'subscribe' event.
            // For MVP, we might need to listen to a global broadcast or specific room.
            // However, the engine emits 'newTask' to specific driver sockets.
            // It doesn't currently broadcast driver locations to the web dashboard.

            // WORKAROUND: We need the Engine to emit location updates to a room we can join.
            // Or we poll an API.
            // Let's assume for now we can listen to 'driverLocationUpdate' if we were the driver, 
            // but we are the dashboard.

            // CRITICAL GAP: The Engine currently receives 'driverLocationUpdate' FROM the driver,
            // but it does NOT re-broadcast it to the dashboard.
            // We need to implement a 'subscribeToShipment' or 'subscribeToDriver' event in the Engine.

            // For this step, I will implement the client-side logic assuming the event exists,
            // and then I will update the Engine to support it.

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

    const pickupCoords: LatLngExpression = [shipment.pickupAddress.lat, shipment.pickupAddress.lon];
    const deliveryCoords: LatLngExpression = [shipment.deliveryAddress.lat, shipment.deliveryAddress.lon];

    // Center map on driver if available, else midpoint
    const center: LatLngExpression = driverLocation || [
        (pickupCoords[0] + deliveryCoords[0]) / 2,
        (pickupCoords[1] + deliveryCoords[1]) / 2,
    ];

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
                    <MapContainer
                        center={center}
                        zoom={12}
                        scrollWheelZoom={true}
                        style={{ height: '100%', width: '100%' }}
                    >
                        <TileLayer
                            attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors'
                            url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
                        />

                        {/* Pickup Marker */}
                        <Marker position={pickupCoords}>
                            <Popup><strong>Pickup:</strong> {shipment.pickupAddress.fullName}</Popup>
                        </Marker>

                        {/* Delivery Marker */}
                        <Marker position={deliveryCoords}>
                            <Popup><strong>Delivery:</strong> {shipment.deliveryAddress.fullName}</Popup>
                        </Marker>

                        {/* Driver Marker */}
                        {driverLocation && (
                            <Marker position={driverLocation} icon={driverIcon}>
                                <Popup>Driver Location</Popup>
                            </Marker>
                        )}

                        {/* Route Line (Straight for now) */}
                        <Polyline positions={[pickupCoords, deliveryCoords]} pathOptions={{ color: 'gray', dashArray: '5, 10' }} />

                        {/* Driver Path (Dynamic) */}
                        {driverLocation && (
                            <Polyline positions={[driverLocation, deliveryCoords]} pathOptions={{ color: '#14BFFB', weight: 4 }} />
                        )}

                    </MapContainer>
                </div>
            </div>
        </div>
    );
}
