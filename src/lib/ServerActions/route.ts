'use server';

import { Coordinate } from '@/interfaces';

// OSRM Polyline decoding function
function decodePolyline(encoded: string): [number, number][] {
    if (!encoded) {
        return [];
    }
    let poly = [];
    let index = 0, len = encoded.length;
    let lat = 0, lng = 0;
    while (index < len) {
        let b, shift = 0, result = 0;
        do {
            b = encoded.charCodeAt(index++) - 63;
            result |= (b & 0x1f) << shift;
            shift += 5;
        } while (b >= 0x20);
        const dlat = ((result & 1) ? ~(result >> 1) : (result >> 1));
        lat += dlat;
        shift = 0;
        result = 0;
        do {
            b = encoded.charCodeAt(index++) - 63;
            result |= (b & 0x1f) << shift;
            shift += 5;
        } while (b >= 0x20);
        const dlng = ((result & 1) ? ~(result >> 1) : (result >> 1));
        lng += dlng;
        poly.push([lat / 1e5, lng / 1e5]);
    }
    return poly;
}

/**
 * Server Action to fetch a route from the public OSRM API.
 * @param waypoints An array of Coordinate objects ({ lat, lon }).
 * @returns A promise that resolves to an array of [lat, lon] coordinates for the route polyline.
 */
export async function getShipmentRoute(waypoints: Coordinate[]): Promise<[number, number][]> {
    if (waypoints.length < 2) {
        throw new Error("At least two waypoints are required to calculate a route.");
    }

    const coordsString = waypoints.map(p => `${p.lon},${p.lat}`).join(';');
    const osrmUrl = `http://router.project-osrm.org/route/v1/driving/${coordsString}?overview=full&geometries=polyline`;

    try {
        const response = await fetch(osrmUrl);
        if (!response.ok) {
            console.error(`OSRM API responded with status: ${response.status}`);
            throw new Error(`OSRM API responded with status: ${response.status}`);
        }
        const data = await response.json();

        if (data.code !== 'Ok' || !data.routes || data.routes.length === 0) {
            console.error("No routes found by OSRM:", data.message);
            throw new Error(data.message || "No routes found by OSRM.");
        }

        const geometry = data.routes[0].geometry;
        const decodedRoute = decodePolyline(geometry);
        
        return decodedRoute;

    } catch (error) {
        console.error("Error fetching route from OSRM:", error);
        throw new Error("Failed to fetch route from OSRM.");
    }
}
