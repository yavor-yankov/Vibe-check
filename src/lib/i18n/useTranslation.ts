"use client";

import { useCallback } from "react";
import { useLocale } from "@/components/LocaleProvider";
import { getDictionary, type TranslationKey } from "@/lib/i18n";

/**
 * Translation hook. Returns a `t()` function that resolves
 * dictionary keys with optional {{var}} interpolation.
 *
 * Usage:
 *   const { t, locale } = useTranslation();
 *   t("intro.heading")
 *   t("usage.remaining", { count: 2, total: 5 })
 */
export function useTranslation() {
  const { locale } = useLocale();
  const dict = getDictionary(locale);

  const t = useCallback(
    (key: TranslationKey, vars?: Record<string, string | number>): string => {
      let text: string = dict[key] ?? key;
      if (vars) {
        for (const [k, v] of Object.entries(vars)) {
          text = text.replace(new RegExp(`\\{\\{${k}\\}\\}`, "g"), String(v));
        }
      }
      return text;
    },
    [dict]
  );

  return { t, locale };
}
