"use client";

import { useLocale } from "@/components/LocaleProvider";
import { LOCALES, LOCALE_LABELS, type Locale } from "@/lib/i18n/types";

export default function LanguagePicker({ className }: { className?: string }) {
  const { locale, setLocale } = useLocale();

  return (
    <div className={className}>
      <div className="flex items-center gap-1 rounded-lg border border-[color:var(--border)] p-0.5">
        {LOCALES.map((l) => (
          <button
            key={l}
            type="button"
            onClick={() => setLocale(l)}
            className={[
              "px-2.5 py-1 text-xs font-medium rounded-md transition",
              locale === l
                ? "bg-[color:var(--accent)] text-white"
                : "text-[color:var(--muted)] hover:text-[color:var(--foreground)]",
            ].join(" ")}
          >
            {l === "en" ? "EN" : "BG"}
          </button>
        ))}
      </div>
    </div>
  );
}
