
const { MongoClient } = require('mongodb');
require('dotenv').config({ path: '.env.local' });

const MONGODB_URI = process.env.MONGODB_URI;

if (!MONGODB_URI) {
    console.error('Please define the MONGODB_URI environment variable inside .env.local');
    process.exit(1);
}

const INITIAL_PRICING_RULES = [
    {
        country: 'AR',
        currency: 'ARS',
        vehicles: {
            motorcycle: {
                baseFee: 2100, // Adjusted to be < Van Small ($2700)
                baseDistanceKm: 3,
                costPerKm: 500, // Slightly lower per km
                baseWeightKg: 5,
                costPerKg: 100
            },
            van: {
                baseFeeSmall: 2700,   // "Paquete comun" (Mercado Libre Benchmark)
                baseFeeMedium: 3300,  // "Mediano"
                baseFeeLarge: 5500,   // "Diferenciados/Pesados"
                baseDistanceKm: 10,
                costPerKm: 900,
                baseWeightKg: 50,
                costPerKg: 150
            }
        },
        effectiveDate: new Date(),
        description: 'Standard Argentina Pricing (Jan 2026)'
    },
    {
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
        effectiveDate: new Date(),
        description: 'Standard US/Global Pricing'
    }
];

async function seed() {
    console.log('Connecting to MongoDB...');
    const client = new MongoClient(MONGODB_URI);

    try {
        await client.connect();
        const db = client.db('going');
        const collection = db.collection('pricing_rules');

        console.log('Clearing existing rules...');
        await collection.deleteMany({});

        console.log('Inserting initial rules...');
        await collection.insertMany(INITIAL_PRICING_RULES);

        console.log('✅ Pricing Rules Seeded Successfully:');
        INITIAL_PRICING_RULES.forEach(r => console.log(`- ${r.country}: ${r.currency} ${r.baseFee} Base`));

    } catch (error) {
        console.error('Error seeding pricing:', error);
    } finally {
        await client.close();
    }
}

seed();
