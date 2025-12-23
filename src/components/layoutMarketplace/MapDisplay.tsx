'use client';

import { MapContainer, TileLayer, Marker, Popup } from 'react-leaflet';
import 'leaflet/dist/leaflet.css';
import L from 'leaflet';

// Fix for default icon issue with webpack
const icon = L.icon({ iconUrl: "/marker-icon.png", iconSize: [25, 41], iconAnchor: [12, 41] });

interface MapDisplayProps {
    lat: number;
    lng: number;
}

const MapDisplay = ({ lat, lng }: MapDisplayProps) => {
    return (
        <MapContainer center={[lat, lng]} zoom={13} style={{ height: '400px', width: '100%' }}>
            <TileLayer
                url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
                attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors'
            />
            <Marker position={[lat, lng]} icon={icon}>
                <Popup>
                    Current Location
                </Popup>
            </Marker>
        </MapContainer>
    );
};

export default MapDisplay;
