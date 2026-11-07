import { getLocales } from 'expo-localization';
import { createInstance } from 'i18next';
import { initReactI18next } from 'react-i18next';

import { defaultLanguage, namespaces, resources, supportedLanguages } from './resources';
import type { SupportedLanguage } from './resources';

export function detectLanguage(): SupportedLanguage {
  const code = getLocales()[0]?.languageCode;
  return supportedLanguages.find((l) => l === code) ?? defaultLanguage;
}

const i18n = createInstance();

void i18n.use(initReactI18next).init({
  resources,
  lng: detectLanguage(),
  fallbackLng: defaultLanguage,
  ns: namespaces,
  defaultNS: 'common',
  interpolation: { escapeValue: false },
  react: { useSuspense: false },
});

export default i18n;
