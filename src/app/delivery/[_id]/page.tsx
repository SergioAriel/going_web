'use client';

import { useEffect, useState } from 'react';
import { useParams } from 'next/navigation';
import { useSocket } from '@/context/SocketContext';
import dynamic from 'next/dynamic';

const MapDisplay = dynamic(() => import('@/components/layout/MapDisplay'), { ssr: false });

const DeliveryPage = () => {
    const { _id } = useParams();
    const socket = useSocket();
    const [location, setLocation] = useState({ lat: 40.7128, lng: -74.0060 }); // Initial location (e.g., New York)

    useEffect(() => {
        if (socket && _id) {
            socket.emit('join_order_room', _id);

            const interval = setInterval(() => {
                // Simulate location change
                const newLat = location.lat + (Math.random() - 0.5) * 0.01;
                const newLng = location.lng + (Math.random() - 0.5) * 0.01;
                const newLocation = { lat: newLat, lng: newLng };

                setLocation(newLocation);
                socket.emit('update_location', { orderId: _id, location: newLocation });
            }, 3000); // Update every 3 seconds

            return () => clearInterval(interval);
        }
    }, [socket, _id, location]);

    return (
        <div className="p-8">
            <h1 className="text-2xl font-bold">Delivery Simulation for Order: {_id}</h1>
            <p>Current Location:</p>
            <p>Latitude: {location.lat.toFixed(4)}</p>
            <p>Longitude: {location.lng.toFixed(4)}</p>
            <p className="mt-4 text-sm text-gray-500">This page is simulating a delivery driver&#39;s location updates.</p>
            <div className="mt-6">
                <MapDisplay lat={location.lat} lng={location.lng} />
            </div>
        </div>
    );
};

export default DeliveryPage;
