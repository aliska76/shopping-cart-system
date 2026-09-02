import i18n from 'i18next';
import { initReactI18next } from 'react-i18next';
import en from './locales/en.json';
import he from './locales/he.json';

export const SUPPORTED_LANGUAGES = ['en', 'he'] as const;
export type SupportedLanguage = (typeof SUPPORTED_LANGUAGES)[number];

const LANGUAGE_STORAGE_KEY = 'shopping-cart-system.language';

/**
 * Deliberately no i18next-browser-languagedetector plugin here — the language
 * set is exactly two, and reading/writing one localStorage key plus a manual
 * fallback (see getInitialLanguage below) covers that without pulling in a
 * dependency for it. Same "no framework unless it earns its keep" principle
 * as the backends (no Serilog/Polly there for the same reason).
 */
function getInitialLanguage(): SupportedLanguage {
  const stored = window.localStorage.getItem(LANGUAGE_STORAGE_KEY);
  if (stored === 'en' || stored === 'he') return stored;
  return navigator.language.toLowerCase().startsWith('he') ? 'he' : 'en';
}

export function persistLanguage(language: SupportedLanguage): void {
  window.localStorage.setItem(LANGUAGE_STORAGE_KEY, language);
}

void i18n.use(initReactI18next).init({
  resources: {
    en: { translation: en },
    he: { translation: he },
  },
  lng: getInitialLanguage(),
  fallbackLng: 'en',
  interpolation: { escapeValue: false },
});

export default i18n;
