import { useState, useEffect } from 'react';
import usePlacesAutocomplete, { getGeocode, getLatLng } from 'use-places-autocomplete';
import Script from 'next/script';

interface AddressAutocompleteProps {
    onSelect: (data: {
        address: string;
        lat: number;
        lon: number;
        placeId: string;
        extracted?: {
            street: string;
            number?: string;
            city: string;
            state: string;
            zipCode: string;
            country: string;
        }
    }) => void;
    placeholder?: string;
    defaultValue?: string;
    className?: string;
}

const libraries: ("places")[] = ["places"];

export default function AddressAutocomplete({ onSelect, placeholder = "Search address...", defaultValue = "", className = "" }: AddressAutocompleteProps) {
    const [scriptLoaded, setScriptLoaded] = useState(false);

    const {
        ready,
        value,
        suggestions: { status, data },
        setValue,
        clearSuggestions,
        init
    } = usePlacesAutocomplete({
        requestOptions: {
            /* Define search scope here if needed */
        },
        debounce: 300,
        cache: 86400, // Cache for 24h
        initOnMount: false, // Wait for script
    });

    // Check if script is already loaded (SPA navigation case)
    useEffect(() => {
        if (typeof window !== "undefined" && (window as any).google && (window as any).google.maps && (window as any).google.maps.places) {
            setScriptLoaded(true);
        }
    }, []);

    // Initialize when script is loaded
    useEffect(() => {
        if (scriptLoaded) {
            init();
        }
    }, [scriptLoaded, init]);

    // Handle initial value
    useEffect(() => {
        if (defaultValue) {
            setValue(defaultValue, false);
        }
    }, [defaultValue, setValue]);

    const handleSelect = async (address: string, placeId: string) => {
        setValue(address, false);
        clearSuggestions();

        try {
            const results = await getGeocode({ address });
            const { lat, lng } = await getLatLng(results[0]);

            // Parse Address Components
            const components = results[0].address_components;
            const getComponent = (type: string) => components.find((c: any) => c.types.includes(type))?.long_name || "";

            const streetNumber = getComponent("street_number");
            const route = getComponent("route");
            const city = getComponent("locality") || getComponent("sublocality") || getComponent("administrative_area_level_2");
            const state = getComponent("administrative_area_level_1");
            const zipCode = getComponent("postal_code");
            const country = getComponent("country");

            // Callback to parent
            onSelect({
                address: results[0].formatted_address || address,
                lat,
                lon: lng,
                placeId,
                extracted: {
                    street: route || address, // If no route, fallback to full address? No, keep it clean.
                    number: streetNumber,
                    city,
                    state,
                    zipCode,
                    country
                }
            });
        } catch (error) {
            console.error("Error creating address:", error);
        }
    };

    return (
        <div className={`relative w-full ${className}`}>
            <Script
                src={`https://maps.googleapis.com/maps/api/js?key=${process.env.NEXT_PUBLIC_GOOGLE_MAPS_API_KEY}&libraries=places`}
                strategy="lazyOnload"
                onLoad={() => setScriptLoaded(true)}
            />

            <input
                value={value}
                onChange={(e) => setValue(e.target.value)}
                disabled={!ready}
                className="w-full p-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-transparent disabled:bg-gray-100"
                placeholder={placeholder}
            />

            {status === "OK" && (
                <ul className="absolute z-50 w-full mt-1 bg-white border border-gray-200 rounded-md shadow-lg max-h-60 overflow-auto">
                    {data.map(({ place_id, description }) => (
                        <li
                            key={place_id}
                            onClick={() => handleSelect(description, place_id)}
                            className="px-4 py-2 cursor-pointer hover:bg-blue-50 text-sm text-gray-700"
                        >
                            {description}
                        </li>
                    ))}
                </ul>
            )}
        </div>
    );
}
