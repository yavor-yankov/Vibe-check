import type { Locale } from "./types";
import { DEFAULT_LOCALE } from "./types";
import en from "./en";
import bg from "./bg";
import type { TranslationKey } from "./en";

const dictionaries: Record<Locale, Record<TranslationKey, string>> = { en, bg };

export function getDictionary(locale: Locale): Record<TranslationKey, string> {
  return dictionaries[locale] ?? dictionaries[DEFAULT_LOCALE];
}

export type { TranslationKey };
export { type Locale, LOCALES, DEFAULT_LOCALE, LOCALE_LABELS } from "./types";
