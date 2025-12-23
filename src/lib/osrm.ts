
interface Coordinate {
    lat: number;
    lon: number;
}

/**
 * Fetches the driving distance between two points using OSRM.
 * @param origin {lat, lon}
 * @param destination {lat, lon}
 * @returns distance in kilometers
 */
export async function getOsrmDistance(origin: Coordinate, destination: Coordinate): Promise<number> {
    const coordsString = `${origin.lon},${origin.lat};${destination.lon},${destination.lat}`;
    const baseUrl = process.env.OSRM_URL || 'http://localhost:5001';
    const osrmUrl = `${baseUrl}/route/v1/driving/${coordsString}?overview=false`;

    const MAX_RETRIES = 3;
    const DELAY_MS = 1000; // 1 second delay between retries

    for (let i = 0; i < MAX_RETRIES; i++) {
        try {
            const response = await fetch(osrmUrl);
            if (!response.ok) {
                if (response.status === 429) { // Too Many Requests
                    throw new Error(`OSRM Rate Limit (429)`);
                }
                throw new Error(`OSRM API error: ${response.status}`);
            }
            const data = await response.json();

            if (data.code !== 'Ok' || !data.routes || data.routes.length === 0) {
                throw new Error("No route found");
            }

            const distanceMeters = data.routes[0].distance;
            return distanceMeters / 1000; // Convert to km

        } catch (error) {
            console.error(`OSRM Attempt ${i + 1} failed:`, error);
            if (i === MAX_RETRIES - 1) throw error; // Throw on last attempt
            await new Promise(resolve => setTimeout(resolve, DELAY_MS * (i + 1))); // Exponential backoff
        }
    }
    throw new Error("OSRM Failed after retries");
}
