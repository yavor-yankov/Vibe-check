"use client";

import { useLocale } from "@/components/LocaleProvider";
import { LOCALES, LOCALE_LABELS, type Locale } from "@/lib/i18n/types";

export default function LanguagePicker({ className, subtle }: { className?: string; subtle?: boolean }) {
  const { locale, setLocale } = useLocale();

  if (subtle) {
    return (
      <div className={className}>
        <div className="flex items-center gap-0">
          {LOCALES.map((l, i) => (
            <span key={l} className="flex items-center">
              {i > 0 && (
                <span className="text-[11px] text-[color:var(--muted)] opacity-40 select-none mx-0.5">/</span>
              )}
              <button
                type="button"
                onClick={() => setLocale(l)}
                className={[
                  "text-[11px] font-medium transition-colors cursor-pointer",
                  locale === l
                    ? "text-[color:var(--foreground)]"
                    : "text-[color:var(--muted)] opacity-50 hover:opacity-80 hover:text-[color:var(--foreground)]",
                ].join(" ")}
              >
                {l.toUpperCase()}
              </button>
            </span>
          ))}
        </div>
      </div>
    );
  }

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
