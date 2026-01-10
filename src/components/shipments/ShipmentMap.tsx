'use client';

import { APIProvider, Map, AdvancedMarker, Pin, useMap } from '@vis.gl/react-google-maps';
import { useEffect } from 'react';

// Common type from Leaflet usage, keeping it for compatibility
type LatLngTuple = [number, number];

interface ShipmentMapProps {
  pickupCoords: LatLngTuple;
  deliveryCoords: LatLngTuple;
  pickupAddress: string;
  deliveryAddress: string;
  route?: LatLngTuple[];
  driverLocation?: LatLngTuple;
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

const ShipmentMap = ({ pickupCoords, deliveryCoords, pickupAddress, deliveryAddress, route, driverLocation }: ShipmentMapProps) => {

  const pickupPos = { lat: pickupCoords[0], lng: pickupCoords[1] };
  const deliveryPos = { lat: deliveryCoords[0], lng: deliveryCoords[1] };
  const driverPos = driverLocation ? { lat: driverLocation[0], lng: driverLocation[1] } : undefined;

  // Route path conversion or fallback straight line
  const routePath = route && route.length > 0
    ? route.map(p => ({ lat: p[0], lng: p[1] }))
    : [pickupPos, deliveryPos];

  // Center calculation (basic average)
  const center = {
    lat: (pickupPos.lat + deliveryPos.lat) / 2,
    lng: (pickupPos.lng + deliveryPos.lng) / 2
  };

  return (
    <APIProvider apiKey={process.env.NEXT_PUBLIC_GOOGLE_MAPS_API_KEY || ""}>
      <div style={{ height: '400px', width: '100%', borderRadius: '8px', overflow: 'hidden' }}>
        <Map
          defaultCenter={center}
          defaultZoom={9}
          mapId="DEMO_MAP_ID"
          fullscreenControl={false}
        >
          {/* Pickup Marker (Blue) */}
          <AdvancedMarker position={pickupPos} title={`Pickup: ${pickupAddress}`}>
            <Pin background={'#2E64FE'} glyphColor={'#FFF'} borderColor={'#0040FF'} />
          </AdvancedMarker>

          {/* Delivery Marker (Red) */}
          <AdvancedMarker position={deliveryPos} title={`Delivery: ${deliveryAddress}`}>
            <Pin background={'#FE2E2E'} glyphColor={'#FFF'} borderColor={'#FF0000'} />
          </AdvancedMarker>

          {/* Driver Marker (Gold) */}
          {driverPos && (
            <AdvancedMarker position={driverPos} zIndex={1000} title="Driver">
              <Pin background={'#FFD700'} glyphColor={'#000'} borderColor={'#B8860B'} />
            </AdvancedMarker>
          )}

          {/* Route Polyline */}
          <Polyline path={routePath} options={{ strokeColor: '#14BFFB', strokeOpacity: 0.8, strokeWeight: 5 }} />
        </Map>
      </div>
    </APIProvider>
  );
};

export default ShipmentMap;
