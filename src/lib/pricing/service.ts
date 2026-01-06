
import client from "@/lib/mongodb";
import { Address } from '@/interfaces';

export interface PricingRule {
    _id?: string;
    country: string; // 'AR', 'US'
    city?: string;   // 'CABA', 'CHICAGO' (optional overrides)
    currency: 'USD' | 'ARS';
    vehicles: {
        motorcycle: {
            baseFee: number;
            baseDistanceKm: number;
            costPerKm: number;
            baseWeightKg: number;
            costPerKg: number;
        };
        van: {
            baseFeeSmall: number;
            baseFeeMedium: number;
            baseFeeLarge: number;
            baseDistanceKm: number;
            costPerKm: number;
            baseWeightKg: number;
            costPerKg: number;
        };
    };
    effectiveDate: Date;
}

const FALLBACK_RULES: Record<string, PricingRule> = {
    'AR': {
        country: 'AR',
        currency: 'USD', // Changed to USD to avoid inflated costs in UI
        vehicles: {
            motorcycle: {
                baseFee: 1.80, // Was 1800 ARS, approx 1.80 USD
                baseDistanceKm: 3,
                costPerKm: 0.60, // Was 600 ARS
                baseWeightKg: 5,
                costPerKg: 0.10 // Was 100 ARS
            },
            van: {
                baseFeeSmall: 3.50, // Was 2700-5500 ARS
                baseFeeMedium: 5.00,
                baseFeeLarge: 7.50,
                baseDistanceKm: 10,
                costPerKm: 0.90, // Was 900 ARS
                baseWeightKg: 50,
                costPerKg: 0.25 // Was 150 ARS
            }
        },
        effectiveDate: new Date()
    },
    'US': {
        country: 'US',
        currency: 'USD',
        vehicles: {
            motorcycle: {
                baseFee: 7.00,
                baseDistanceKm: 3,
                costPerKm: 1.50,
                baseWeightKg: 5,
                costPerKg: 1.00
            },
            van: {
                baseFeeSmall: 12.00,
                baseFeeMedium: 15.00,
                baseFeeLarge: 25.00,
                baseDistanceKm: 10,
                costPerKm: 2.50,
                baseWeightKg: 50,
                costPerKg: 2.00
            }
        },
        effectiveDate: new Date()
    }
};

export const getPricingForAddress = async (address: Address): Promise<PricingRule> => {
    try {
        const db = client.db("going");

        // Normalize Country
        // This heuristic can be improved with a proper Country Code library
        let countryCode = 'US';
        const c = (address.country || '').toLowerCase();
        if (c.includes('argentina') || c === 'ar') countryCode = 'AR';

        // Query DB for the specific rule
        // We look for a rule that matches the country and is effectively active
        const rule = await db.collection<PricingRule>("pricing_rules").findOne(
            { country: countryCode },
            { sort: { effectiveDate: -1 } }
        );

        if (rule) {
            return rule;
        }

        console.warn(`No pricing rule found in DB for ${countryCode}, using fallback.`);
        return FALLBACK_RULES[countryCode] || FALLBACK_RULES['US'];

    } catch (error) {
        console.error("Error fetching pricing from DB:", error);
        // Fail safe to US pricing or default
        return FALLBACK_RULES['US'];
    }
};
