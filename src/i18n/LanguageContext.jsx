import React, { createContext, useContext, useState, useEffect, useCallback } from 'react';

// Import all locale files
import en from './en.json';
import de from './de.json';
import es from './es.json';
import zh from './zh.json';
import tr from './tr.json';
import it from './it.json';
import fr from './fr.json';
import ja from './ja.json';
import pt from './pt.json';
import nl from './nl.json';

// Available languages configuration (10 languages)
export const LANGUAGES = {
    en: { name: 'English', flag: '🇺🇸', locale: en },
    de: { name: 'Deutsch', flag: '🇩🇪', locale: de },
    es: { name: 'Español', flag: '🇪🇸', locale: es },
    zh: { name: '中文', flag: '🇨🇳', locale: zh },
    tr: { name: 'Türkçe', flag: '🇹🇷', locale: tr },
    it: { name: 'Italiano', flag: '🇮🇹', locale: it },
    fr: { name: 'Français', flag: '🇫🇷', locale: fr },
    ja: { name: '日本語', flag: '🇯🇵', locale: ja },
    pt: { name: 'Português', flag: '🇧🇷', locale: pt },
    nl: { name: 'Nederlands', flag: '🇳🇱', locale: nl }
};

// Storage key for persisting language preference
const LANGUAGE_STORAGE_KEY = 'volla_language';

// Create the context
const LanguageContext = createContext(null);

/**
 * Get nested value from object using dot notation
 * e.g., getNestedValue(obj, 'common.loading') returns obj.common.loading
 */
const getNestedValue = (obj, path) => {
    return path.split('.').reduce((current, key) => {
        return current && current[key] !== undefined ? current[key] : undefined;
    }, obj);
};

/**
 * Replace template variables in string
 * e.g., "Hello {{name}}" with {name: "World"} becomes "Hello World"
 */
const interpolate = (str, params) => {
    if (!params || typeof str !== 'string') return str;

    return Object.entries(params).reduce((result, [key, value]) => {
        return result.replace(new RegExp(`{{${key}}}`, 'g'), value);
    }, str);
};

/**
 * Language Provider Component
 * Wraps the app and provides translation functionality
 */
export const LanguageProvider = ({ children }) => {
    // Initialize language from localStorage or browser locale
    const [currentLanguage, setCurrentLanguage] = useState(() => {
        // 1. Check localStorage for saved preference
        const saved = localStorage.getItem(LANGUAGE_STORAGE_KEY);
        if (saved && LANGUAGES[saved]) {
            return saved;
        }

        // 2. Try to detect from browser
        const browserLang = navigator.language?.split('-')[0];
        if (browserLang && LANGUAGES[browserLang]) {
            return browserLang;
        }

        // 3. Default to English
        return 'en';
    });

    // Persist language preference
    useEffect(() => {
        localStorage.setItem(LANGUAGE_STORAGE_KEY, currentLanguage);
        // Update HTML lang attribute for accessibility
        document.documentElement.lang = currentLanguage;
    }, [currentLanguage]);

    /**
     * Translation function
     * @param {string} key - The translation key (e.g., 'common.loading')
     * @param {object} params - Optional interpolation parameters
     * @returns {string} - The translated string or the key if not found
     */
    const t = useCallback((key, params = {}) => {
        const locale = LANGUAGES[currentLanguage]?.locale || LANGUAGES.en.locale;

        // Try to get translation from current language
        let translation = getNestedValue(locale, key);

        // Fallback to English if not found
        if (translation === undefined && currentLanguage !== 'en') {
            translation = getNestedValue(LANGUAGES.en.locale, key);
        }

        // If still not found, return the key itself (helps identify missing translations)
        if (translation === undefined) {
            console.warn(`[i18n] Missing translation: ${key}`);
            return key;
        }

        // Apply interpolation if we have a string
        if (typeof translation === 'string') {
            return interpolate(translation, params);
        }

        return translation;
    }, [currentLanguage]);

    /**
     * Change the current language
     * @param {string} langCode - Language code (en, de, es, zh, tr)
     */
    const setLanguage = useCallback((langCode) => {
        if (LANGUAGES[langCode]) {
            setCurrentLanguage(langCode);
        } else {
            console.warn(`[i18n] Unknown language: ${langCode}`);
        }
    }, []);

    /**
     * Get current language info
     */
    const getCurrentLanguageInfo = useCallback(() => {
        return {
            code: currentLanguage,
            name: LANGUAGES[currentLanguage]?.name || 'English',
            flag: LANGUAGES[currentLanguage]?.flag || '🇺🇸'
        };
    }, [currentLanguage]);

    const value = {
        t,
        currentLanguage,
        setLanguage,
        getCurrentLanguageInfo,
        availableLanguages: Object.entries(LANGUAGES).map(([code, info]) => ({
            code,
            name: info.name,
            flag: info.flag
        }))
    };

    return (
        <LanguageContext.Provider value={value}>
            {children}
        </LanguageContext.Provider>
    );
};

/**
 * Custom hook for using translations
 * @returns {object} - { t, currentLanguage, setLanguage, getCurrentLanguageInfo, availableLanguages }
 */
export const useTranslation = () => {
    const context = useContext(LanguageContext);

    if (!context) {
        throw new Error('useTranslation must be used within a LanguageProvider');
    }

    return context;
};

export default LanguageContext;
