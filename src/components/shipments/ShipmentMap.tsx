'use client';

import { MapContainer, TileLayer, Marker, Popup, Polyline } from 'react-leaflet';
import { LatLngExpression } from 'leaflet';
import 'leaflet/dist/leaflet.css';
import { useEffect } from 'react';

// This is a common workaround for a known issue with react-leaflet and webpack.
// It manually re-imports the default icon assets.
import L from 'leaflet';
delete (L.Icon.Default.prototype as any)._getIconUrl;

L.Icon.Default.mergeOptions({
  iconRetinaUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.7.1/images/marker-icon-2x.png',
  iconUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.7.1/images/marker-icon.png',
  shadowUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.7.1/images/marker-shadow.png',
});


interface ShipmentMapProps {
  pickupCoords: LatLngExpression;
  deliveryCoords: LatLngExpression;
  pickupAddress: string;
  deliveryAddress: string;
  route?: LatLngExpression[]; // Optional property for the calculated route
}

const ShipmentMap = ({ pickupCoords, deliveryCoords, pickupAddress, deliveryAddress, route }: ShipmentMapProps) => {
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
      <Marker position={pickupCoords}>
        <Popup>
          <strong>Pickup:</strong><br />{pickupAddress}
        </Popup>
      </Marker>

      {/* Delivery Marker */}
      <Marker position={deliveryCoords}>
        <Popup>
          <strong>Delivery:</strong><br />{deliveryAddress}
        </Popup>
      </Marker>

      {/* Route Line */}
      <Polyline pathOptions={{ color: '#14BFFB', weight: 5 }} positions={polylineToShow} />

    </MapContainer>
  );
};

export default ShipmentMap;
