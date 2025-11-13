'use client';

import { createContext, useContext, useEffect, useState } from "react";
import { useUser } from "./UserContext";
import { getCurrencies } from "@/lib/ServerActions/cryptocurrencies";
import { Currency } from "@/interfaces";

interface CurrenciesContextType {
	listCryptoCurrencies: Currency[];
	userCurrency: {
		currency: string;
		price: number;
	}
}

const CurrenciesContext = createContext<CurrenciesContextType | undefined>(undefined)

export const CurrenciesProvider = ({ children }: { children: React.ReactNode }) => {
	const { userData, loading: isUserLoading } = useUser();
	const [listCryptoCurrencies, setCurrencies] = useState<Currency[]>([])
	
	// Initialize with a safe, default value
	const [userCurrency, setUserCurrency] = useState({
		currency: 'USD', // Default currency
		price: 1 // Default price for USD
	});

	useEffect(() => {
		const initializeCurrencies = async () => {
			const currencies:Currency[] = await getCurrencies();
			setCurrencies(currencies);

			// Only set the user-specific currency once userData is loaded and available
			if (userData && userData.settings.currency) {
				setUserCurrency({
					currency: userData.settings.currency,
					price: currencies.find((currency: Currency) => currency.symbol === userData.settings.currency)?.price || 0
				});
			}
		};

		// Do not run the effect until the user data has been loaded.
		if (!isUserLoading) {
			initializeCurrencies();
		}
	}, [userData, isUserLoading]);

	return (
		<CurrenciesContext.Provider value={{ listCryptoCurrencies, userCurrency }}>
			{children}
		</CurrenciesContext.Provider>
	);
}

export const useCurrencies = () => {
	const context = useContext(CurrenciesContext);
	if (!context) {
		throw new Error("useCurrencies must be used within a CurrenciesProvider");
	}
	return context;
}