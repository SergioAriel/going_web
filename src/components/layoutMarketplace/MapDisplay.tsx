'use client';

import { APIProvider, Map, AdvancedMarker, Pin } from '@vis.gl/react-google-maps';

interface MapDisplayProps {
    lat: number;
    lng: number;
}

const MapDisplay = ({ lat, lng }: MapDisplayProps) => {
    const position = { lat, lng };

    return (
        <APIProvider apiKey={process.env.NEXT_PUBLIC_GOOGLE_MAPS_API_KEY || ""}>
            <div style={{ height: '400px', width: '100%' }}>
                <Map
                    defaultCenter={position}
                    defaultZoom={13}
                    mapId="DEMO_MAP_ID"
                    fullscreenControl={false}
                >
                    <AdvancedMarker position={position}>
                        <Pin background={'#FBBC04'} glyphColor={'#000'} borderColor={'#000'} />
                    </AdvancedMarker>
                </Map>
            </div>
        </APIProvider>
    );
};

export default MapDisplay;
