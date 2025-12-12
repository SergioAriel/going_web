import { Address, GeocodedAddress } from "@/interfaces";
import * as h3 from "h3-js";

const H3_RESOLUTION = 9;

// --- Custom Error Classes ---

/**
 * Error thrown when a geocoding service cannot find a match for a given address.
 */
export class AddressNotFoundError extends Error {
    constructor(message: string) {
        super(message);
        this.name = 'AddressNotFoundError';
    }
}

/**
 * Error thrown when there is a problem communicating with the geocoding service.
 */
export class GeocodingServiceError extends Error {
    constructor(message: string) {
        super(message);
        this.name = 'GeocodingServiceError';
    }
}

/**
 * Ensures an address is geocoded using the free Nominatim API and has an H3 index.
 * Throws specific errors if geocoding fails.
 * 
 * @param address - The address to be processed.
 * @returns A Promise resolving to a GeocodedAddress.
 * @throws {AddressNotFoundError} If the address cannot be found by the service.
 * @throws {GeocodingServiceError} If the call to the service fails for other reasons (e.g., network).
 */
export const ensureGeocodedAndIndexed = async (address: Address): Promise<GeocodedAddress> => {
    // Optimization: If the address is already complete, return it immediately.
    if (address.lat && address.lon && address.h3Index && address.h3IndexL6 && address.h3IndexL8) {
        return address as GeocodedAddress;
    }

    // If not complete, proceed with geocoding.
    console.log(`Geocoding address with Nominatim: ${address.street}`);

    const params = new URLSearchParams({
        format: 'json',
        limit: '1',
        addressdetails: '1'
    });

    if (address.city && address.country) {
        // Structured query
        params.append('street', address.street);
        params.append('city', address.city);
        if (address.state) params.append('state', address.state);
        if (address.zipCode) params.append('postalcode', address.zipCode);
        params.append('country', address.country);
    } else {
        // Freeform query (best for full address strings)
        params.append('q', address.street);
    }

    const url = `https://nominatim.openstreetmap.org/search?${params.toString()}`;

    try {
        const response = await fetch(url, {
            headers: {
                'User-Agent': 'GoingWebApp/1.0 (Contact: dev@going.app)'
            }
        });

        if (!response.ok) {
            throw new Error(`Nominatim server responded with status: ${response.status}`);
        }

        const data = await response.json();

        if (data && data.length > 0) {
            const location = data[0];
            const lat = parseFloat(location.lat);
            const lon = parseFloat(location.lon);
            const h3Index = h3.latLngToCell(lat, lon, H3_RESOLUTION);
            const h3IndexL6 = h3.latLngToCell(lat, lon, 6);
            const h3IndexL8 = h3.latLngToCell(lat, lon, 8);

            // Extract address details
            const addr = location.address || {};
            const city = addr.city || addr.town || addr.village || addr.municipality || addr.county || address.city || 'Unknown City';
            const state = addr.state || addr.region || address.state || '';
            const country = addr.country || address.country || 'Unknown Country';
            const zipCode = addr.postcode || address.zipCode || '';

            return {
                ...address,
                lat,
                lon,
                h3Index,
                h3IndexL6,
                h3IndexL8,
                city,
                state,
                country,
                zipCode
            };
        } else {
            // The service responded successfully but found no results.
            throw new AddressNotFoundError(`Address not found: ${address.street}, ${address.city}`);
        }
    } catch (error) {
        // Re-throw network errors or our custom errors with more context.
        if (error instanceof AddressNotFoundError) {
            throw error; // Re-throw the specific error if it's already the right type
        }
        const err = error as Error;
        throw new GeocodingServiceError(`Nominatim API call failed: ${err.message}`);
    }
};