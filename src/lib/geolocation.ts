import { Address, GeocodedAddress } from "@/interfaces";
import * as h3 from "h3-js";
import { getGoogleGeocode } from "./googleMaps";

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

    // Optimization: If we have lat/lon (e.g. from Google Places), calculate H3 and return directly.
    if (address.lat && address.lon) {
        const h3Index = h3.latLngToCell(address.lat, address.lon, H3_RESOLUTION);
        const h3IndexL6 = h3.latLngToCell(address.lat, address.lon, 6);
        const h3IndexL8 = h3.latLngToCell(address.lat, address.lon, 8);
        return {
            ...address,
            lat: address.lat,
            lon: address.lon,
            h3Index,
            h3IndexL6,
            h3IndexL8
        } as GeocodedAddress;
    }

    // 1. Try Google Geocoding First (Web Strategy)
    try {
        let addressString = address.street;
        if (address.number && !addressString.includes(address.number)) {
            addressString = `${addressString} ${address.number}`;
        }
        if (address.city) addressString += `, ${address.city}`;
        if (address.country) addressString += `, ${address.country}`;

        console.log(`Geocoding with Google: ${addressString}`);
        const googleResult = await getGoogleGeocode(addressString);

        if (googleResult) {
            const h3Index = h3.latLngToCell(googleResult.lat, googleResult.lon, H3_RESOLUTION);
            const h3IndexL6 = h3.latLngToCell(googleResult.lat, googleResult.lon, 6);
            const h3IndexL8 = h3.latLngToCell(googleResult.lat, googleResult.lon, 8);

            return {
                ...address,
                lat: googleResult.lat,
                lon: googleResult.lon,
                h3Index,
                h3IndexL6,
                h3IndexL8,
                city: googleResult.city || address.city,
                state: googleResult.state || address.state,
                country: googleResult.country || address.country,
                zipCode: googleResult.zipCode || address.zipCode,
                number: googleResult.number || address.number
            } as GeocodedAddress;
        }
    } catch (e) {
        console.warn("Google Geocoding failed, falling back to Nominatim", e);
    }

    // 2. Fallback to Nominatim
    console.log(`Geocoding address with Nominatim (Fallback): ${address.street}`);

    const params = new URLSearchParams({
        format: 'json',
        limit: '1',
        addressdetails: '1'
    });

    if (address.city && address.country) {
        // Structured query
        // Ensure street contains the number if it's separate
        let street = address.street;
        if (address.number && !street.includes(address.number)) {
            street = `${street} ${address.number}`;
        }
        params.append('street', street);

        params.append('city', address.city);
        if (address.state) params.append('state', address.state);
        if (address.zipCode) params.append('postalcode', address.zipCode);
        params.append('country', address.country);
    } else {
        // Freeform query (best for full address strings)
        let q = address.street;
        if (address.number && !q.includes(address.number)) {
            q = `${q} ${address.number}`;
        }
        // Also append city/country if available but not both (partial structured fallback)
        if (address.city) q += `, ${address.city}`;
        if (address.country) q += `, ${address.country}`;

        params.append('q', q);
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
            const number = addr.house_number || address.number || '';
            // If street was just the name, update it? No, keep user's street name preference usually, 
            // but ensuring consistency is good. 
            // However, Nominatim splits road and house_number.

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
                zipCode,
                number // Ensure we persist the verified number
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