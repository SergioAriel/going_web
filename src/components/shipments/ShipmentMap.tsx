'use client';

import { MapContainer, TileLayer, Marker, Popup, Polyline } from 'react-leaflet';
import L, { LatLngExpression } from 'leaflet';
import 'leaflet/dist/leaflet.css';
import { useEffect } from 'react';

// Custom Icons to avoid default icon issues
const pickupIcon = new L.Icon({
  iconUrl: 'https://raw.githubusercontent.com/pointhi/leaflet-color-markers/master/img/marker-icon-2x-blue.png',
  shadowUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.7.1/images/marker-shadow.png',
  iconSize: [25, 41],
  iconAnchor: [12, 41],
  popupAnchor: [1, -34],
  shadowSize: [41, 41]
});

const deliveryIcon = new L.Icon({
  iconUrl: 'https://raw.githubusercontent.com/pointhi/leaflet-color-markers/master/img/marker-icon-2x-red.png',
  shadowUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.7.1/images/marker-shadow.png',
  iconSize: [25, 41],
  iconAnchor: [12, 41],
  popupAnchor: [1, -34],
  shadowSize: [41, 41]
});

interface ShipmentMapProps {
  pickupCoords: LatLngExpression;
  deliveryCoords: LatLngExpression;
  pickupAddress: string;
  deliveryAddress: string;
  route?: LatLngExpression[];
  driverLocation?: LatLngExpression;
}

const ShipmentMap = ({ pickupCoords, deliveryCoords, pickupAddress, deliveryAddress, route, driverLocation }: ShipmentMapProps) => {
  // Fallback straight line if no route is provided
  const straightLine: LatLngExpression[] = [pickupCoords, deliveryCoords];

  // Determine which polyline to show
  const polylineToShow = route && route.length > 0 ? route : straightLine;

  // Calculate the center point between the two coordinates to center the map
  const pickupLatLng = L.latLng(pickupCoords);
  const deliveryLatLng = L.latLng(deliveryCoords);
  const center: LatLngExpression = [
    (pickupLatLng.lat + deliveryLatLng.lat) / 2,
    (pickupLatLng.lng + deliveryLatLng.lng) / 2,
  ];

  // Custom Icon for Driver (Simple Dot or reusing default with different popup)
  // For now using default marker but we could use a custom car icon
  const driverIcon = new L.Icon({
    iconUrl: 'https://raw.githubusercontent.com/pointhi/leaflet-color-markers/master/img/marker-icon-2x-gold.png',
    shadowUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.7.1/images/marker-shadow.png',
    iconSize: [25, 41],
    iconAnchor: [12, 41],
    popupAnchor: [1, -34],
    shadowSize: [41, 41]
  });

  return (
    <MapContainer
      center={center}
      zoom={9}
      scrollWheelZoom={false}
      style={{ height: '400px', width: '100%', borderRadius: '8px' }}
    >
      <TileLayer
        attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors'
        url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
      />

      {/* Pickup Marker */}
      <Marker position={pickupCoords} icon={pickupIcon}>
        <Popup>
          <strong>Pickup:</strong><br />{pickupAddress}
        </Popup>
      </Marker>

      {/* Delivery Marker */}
      <Marker position={deliveryCoords} icon={deliveryIcon}>
        <Popup>
          <strong>Delivery:</strong><br />{deliveryAddress}
        </Popup>
      </Marker>

      {/* Driver Marker */}
      {driverLocation && (
        <Marker position={driverLocation} icon={driverIcon} zIndexOffset={1000}>
          <Popup>
            <strong>Driver</strong><br />On the way
          </Popup>
        </Marker>
      )}

      {/* Route Line */}
      <Polyline pathOptions={{ color: '#14BFFB', weight: 5 }} positions={polylineToShow} />

    </MapContainer>
  );
};

export default ShipmentMap;
