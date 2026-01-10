
/**
 * Library for interacting with Google Maps APIs (Routes, Distance Matrix).
 * Used for cost calculation in the Web App to avoid OSRM dependency in Vercel.
 */

const GOOGLE_MAPS_API_KEY = process.env.NEXT_PUBLIC_GOOGLE_MAPS_API_KEY;

interface Coordinate {
    lat: number;
    lon: number;
}

interface GoogleGeocodeResult {
    lat: number;
    lon: number;
    formattedAddress: string;
    city: string;
    state: string;
    country: string;
    zipCode: string;
    number: string;
    street: string;
}

/**
 * Geocodes an address string using Google Maps Geocoding API.
 */
export async function getGoogleGeocode(address: string): Promise<GoogleGeocodeResult | null> {
    if (!GOOGLE_MAPS_API_KEY) {
        console.error("Missing NEXT_PUBLIC_GOOGLE_MAPS_API_KEY");
        return null; // Fail silently to allow fallback
    }

    const url = `https://maps.googleapis.com/maps/api/geocode/json?address=${encodeURIComponent(address)}&key=${GOOGLE_MAPS_API_KEY}`;

    try {
        const response = await fetch(url, {
            headers: {
                'Referer': process.env.NEXT_PUBLIC_APP_URL || 'http://localhost:3000/'
            }
        });
        const data = await response.json();

        if (data.status === 'OK' && data.results.length > 0) {
            const result = data.results[0];
            const loc = result.geometry.location;

            // Extract address components
            let city = '';
            let state = '';
            let country = '';
            let zipCode = '';
            let number = '';
            let street = '';

            result.address_components.forEach((component: any) => {
                const types = component.types;
                if (types.includes('locality') || types.includes('administrative_area_level_2')) {
                    city = component.long_name;
                }
                if (types.includes('administrative_area_level_1')) {
                    state = component.long_name;
                }
                if (types.includes('country')) {
                    country = component.long_name;
                }
                if (types.includes('postal_code')) {
                    zipCode = component.long_name;
                }
                if (types.includes('street_number')) {
                    number = component.long_name;
                }
                if (types.includes('route')) {
                    street = component.long_name;
                }
            });

            return {
                lat: loc.lat,
                lon: loc.lng,
                formattedAddress: result.formatted_address,
                city,
                state,
                country,
                zipCode,
                number,
                street: street || address // Fallback if route not found
            };
        } else {
            console.warn(`Google Geocoding failed for ${address}: ${data.status}`);
            return null;
        }
    } catch (error) {
        console.error("Error fetching Google Geocode:", error);
        return null;
    }
}

/**
 * Calculates the driving distance between two points using Google Maps Routes API.
 * This is preferred over Distance Matrix for single point-to-point routing as it's more modern and has better pricing/features long term.
 * Fallback to standard HTTP fetch to avoid heavy library dependencies.
 */
export async function getGoogleRouteDistance(origin: Coordinate, destination: Coordinate): Promise<number> {
    if (!GOOGLE_MAPS_API_KEY) {
        console.error("Missing NEXT_PUBLIC_GOOGLE_MAPS_API_KEY");
        throw new Error("Google Maps API Key configuration error.");
    }

    const url = `https://routes.googleapis.com/directions/v2:computeRoutes`;

    const body = {
        origin: {
            location: {
                latLng: {
                    latitude: origin.lat,
                    longitude: origin.lon
                }
            }
        },
        destination: {
            location: {
                latLng: {
                    latitude: destination.lat,
                    longitude: destination.lon
                }
            }
        },
        travelMode: "DRIVE",
        routingPreference: "TRAFFIC_AWARE", // Or TRAFFIC_UNAWARE for lower latency/cost maybe? Traffic aware is better for "Real Cost".
        // Field mask is crucial to only pay for what we need and keep response small.
        // We need distanceMeters.
        // https://developers.google.com/maps/documentation/routes/compute_routes#field_masks
    };

    try {
        const response = await fetch(url, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
                'X-Goog-Api-Key': GOOGLE_MAPS_API_KEY,
                'X-Goog-FieldMask': 'routes.distanceMeters,routes.duration',
                'Referer': process.env.NEXT_PUBLIC_APP_URL || 'http://localhost:3000/'
            },
            body: JSON.stringify(body)
        });

        if (!response.ok) {
            const errorText = await response.text();
            throw new Error(`Google Routes API error: ${response.status} ${errorText}`);
        }

        const data = await response.json();

        if (data.routes && data.routes.length > 0) {
            const distanceMeters = data.routes[0].distanceMeters;
            // Convert to Kilometers as expected by the application logic
            return distanceMeters / 1000;
        } else {
            console.warn("No routes found by Google API");
            return 0;
        }

    } catch (error) {
        console.error("Error fetching Google Route:", error);
        throw error;
    }
}
