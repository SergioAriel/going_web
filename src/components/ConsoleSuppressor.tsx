'use client';

import { useEffect } from 'react';

export default function ConsoleSuppressor() {
    useEffect(() => {
        // Save original methods
        const originalError = console.error;
        const originalWarn = console.warn;

        // Override console.error
        console.error = (...args) => {
            if (typeof args[0] === 'string' && args[0].includes('Unable to fetch token metadata')) {
                return; // Suppress this specific error
            }
            originalError.apply(console, args);
        };

        // Override console.warn
        console.warn = (...args) => {
            if (typeof args[0] === 'string' && args[0].includes('Unable to fetch token metadata')) {
                return; // Suppress this specific warning
            }
            originalWarn.apply(console, args);
        };

        // Cleanup not strictly necessary for app-wide suppression, but good practice if component unmounts
        return () => {
            console.error = originalError;
            console.warn = originalWarn;
        };
    }, []);

    return null;
}
