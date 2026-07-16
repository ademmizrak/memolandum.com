"use client";

import React from "react";
import { useLocale } from "../lib/i18n/LocaleProvider";
import { LOCALES, LOCALE_LABELS } from "../lib/i18n/config";

export default function LocaleSwitcher({ compact = false }) {
  const { locale, setLocale, t } = useLocale();

  return (
    <div
      className="locale-switcher inline-flex items-center gap-0.5 rounded-lg border border-white/10 bg-slate-900/60 p-0.5"
      role="group"
      aria-label={t("common.language")}
    >
      {LOCALES.map((code) => {
        const active = code === locale;
        return (
          <button
            key={code}
            type="button"
            onClick={() => setLocale(code)}
            className={`min-w-[36px] px-2 py-1 rounded-md text-[11px] font-black tracking-wider transition-colors ${
              active
                ? "bg-cyan-500/25 text-cyan-200 border border-cyan-400/40"
                : "text-slate-400 hover:text-white border border-transparent"
            }`}
            aria-pressed={active}
            title={LOCALE_LABELS[code]}
          >
            {compact ? LOCALE_LABELS[code] : LOCALE_LABELS[code]}
          </button>
        );
      })}
    </div>
  );
}
