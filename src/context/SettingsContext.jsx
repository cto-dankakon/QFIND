import React, { createContext, useContext, useState } from 'react';

// Available languages
export const LANGUAGES = [
    { code: 'en', label: 'English', flag: '🇬🇧', available: true },
    { code: 'fr', label: 'Français', flag: '🇫🇷', available: false },
    { code: 'he', label: 'עברית', flag: '🇮🇱', available: false },
    { code: 'ru', label: 'Русский', flag: '🇷🇺', available: false },
];

// Distance units
export const DISTANCE_UNITS = [
    { code: 'km', label: 'Kilometers (km)', short: 'km' },
    { code: 'mi', label: 'Miles (mi)', short: 'mi' },
];

// Currencies
export const CURRENCIES = [
    { code: 'ILS', label: 'Israeli Shekel', symbol: '₪', flag: '🇮🇱' },
    { code: 'EUR', label: 'Euro', symbol: '€', flag: '🇪🇺' },
    { code: 'USD', label: 'US Dollar', symbol: '$', flag: '🇺🇸' },
    { code: 'GBP', label: 'British Pound', symbol: '£', flag: '🇬🇧' },
];

const SettingsContext = createContext();

export function SettingsProvider({ children }) {
    const [language, setLanguage] = useState('en');
    const [distanceUnit, setDistanceUnit] = useState('km');
    const [currency, setCurrency] = useState('ILS');

    const getCurrencySymbol = () => {
        return CURRENCIES.find(c => c.code === currency)?.symbol || '₪';
    };

    const getDistanceShort = () => {
        return DISTANCE_UNITS.find(d => d.code === distanceUnit)?.short || 'km';
    };

    return (
        <SettingsContext.Provider
            value={{
                language,
                setLanguage,
                distanceUnit,
                setDistanceUnit,
                currency,
                setCurrency,
                getCurrencySymbol,
                getDistanceShort,
            }}
        >
            {children}
        </SettingsContext.Provider>
    );
}

export function useSettings() {
    const context = useContext(SettingsContext);
    if (!context) {
        throw new Error('useSettings must be used within a SettingsProvider');
    }
    return context;
}
