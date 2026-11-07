import AsyncStorage from '@react-native-async-storage/async-storage';

import i18n from './index';
import { supportedLanguages, type SupportedLanguage } from './resources';

const STORAGE_KEY = 'fmb.locale';

export function isSupportedLanguage(value: unknown): value is SupportedLanguage {
  return supportedLanguages.some((l) => l === value);
}

/** Switch the UI language immediately and remember it locally. */
export async function setAppLanguage(lang: SupportedLanguage): Promise<void> {
  if (i18n.language !== lang) await i18n.changeLanguage(lang);
  try {
    await AsyncStorage.setItem(STORAGE_KEY, lang);
  } catch {
    // non-fatal: local persistence is a convenience
  }
}

/** Apply the last locally stored language (if any); otherwise the device language stays. */
export async function restoreStoredLanguage(): Promise<void> {
  try {
    const stored = await AsyncStorage.getItem(STORAGE_KEY);
    if (isSupportedLanguage(stored) && stored !== i18n.language) await i18n.changeLanguage(stored);
  } catch {
    // ignore
  }
}
