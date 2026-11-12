"use client";

import React from "react";
import Link from "next/link";
import { PATHWAY_INDEX } from "@/lib/seo/learnPathwayResolve";
import { useT, useLocale } from "@/lib/i18n/LocaleProvider";

const FLAG = {
  en: "🇬🇧",
  de: "🇩🇪",
  fr: "🇫🇷",
  es: "🇪🇸",
  ru: "🇷🇺",
  ko: "🇰🇷",
  pt: "🇧🇷",
  el: "🇬🇷",
  it: "🇮🇹",
  ja: "🇯🇵",
  ar: "🇸🇦",
  zh: "🇨🇳",
};

const LANG_NAME_AR = {
  en: "الإنجليزية",
  de: "الألمانية",
  fr: "الفرنسية",
  es: "الإسبانية",
  ru: "الروسية",
  ko: "الكورية",
  pt: "البرتغالية",
  el: "اليونانية",
  it: "الإيطالية",
  ja: "اليابانية",
  ar: "العربية",
  zh: "الصينية",
};

const LANG_NAME_PT = {
  en: "Inglês",
  de: "Alemão",
  fr: "Francês",
  es: "Espanhol",
  ru: "Russo",
  ko: "Coreano",
  pt: "Português",
  el: "Grego",
  it: "Italiano",
  ja: "Japonês",
  ar: "Árabe",
  zh: "Chinês",
};

export default function PathwayQuickGrid() {
  const t = useT();
  const { locale } = useLocale();
  const isEn = locale === "en";
  const isAr = locale === "ar";
  const isPt = locale === "pt";

  const bySource = PATHWAY_INDEX.reduce((acc, p) => {
    if (!acc[p.sourceCode]) acc[p.sourceCode] = [];
    acc[p.sourceCode].push(p);
    return acc;
  }, {});

  const order = ["en", "de", "fr", "es", "ru", "ko", "pt", "el", "it", "ja", "ar", "zh"];

  return (
    <section
      className="mb-0 flex w-full flex-col rounded-2xl border border-white/10 bg-slate-900/40 p-4 sm:p-5"
      aria-labelledby="pathway-quick-heading"
    >
      <div className="mb-5 flex flex-wrap items-end justify-between gap-3">
        <div>
          <p className="text-[10px] font-bold uppercase tracking-[0.18em] text-cyan-400 mb-1.5">
            {isAr ? "الصفحات الرئيسية للغات" : isPt ? "Centrais de idiomas" : isEn ? "Language homes" : "Dil anasayfaları"}
          </p>
          <h2
            id="pathway-quick-heading"
            className="text-base sm:text-lg font-black text-white tracking-tight"
          >
            {t("home.pathwayGridTitle")}
          </h2>
          <p className="mt-1.5 text-xs sm:text-sm text-slate-400 max-w-2xl">
            {isAr
              ? "افتح الصفحة الرئيسية للغة — كلمات وجمل."
              : isPt
                ? "Abra a trilha do idioma — palavras e frases."
                : isEn
                  ? "Pick a language home — words & sentences."
                  : "Dil anasayfanı aç — kelime & cümle."}
          </p>
        </div>
        <Link
          href="/learn/"
          className="shrink-0 text-xs font-bold text-cyan-400 hover:underline"
        >
          {isAr ? "جميع المسارات الـ 23 ←" : isPt ? "Todas as 23 trilhas →" : isEn ? "All 23 pathways →" : "23 dil yolu →"}
        </Link>
      </div>

      <ul className="grid flex-1 gap-2.5 sm:grid-cols-2">
        {order.map((code) => {
          const paths = bySource[code];
          if (!paths?.length) return null;
          const name = isAr
            ? LANG_NAME_AR[code] || paths[0].sourceNameTr
            : isPt
              ? LANG_NAME_PT[code] || paths[0].sourceNameTr
              : isEn
                ? paths[0].labelEn?.split("→")?.[0]?.replace(/\s*\(BR\)/i, "")?.trim() || paths[0].sourceNameTr
                : paths[0].sourceNameTr;
          return (
            <li
              key={code}
              className="rounded-xl border border-white/8 bg-slate-950/45 p-3.5"
            >
              <div className="mb-2.5 flex items-center gap-2">
                <span className="text-lg" aria-hidden>
                  {FLAG[code] || "🌐"}
                </span>{" "}
                <span className="font-bold text-slate-100 text-sm">{name}</span>
              </div>
              <div className="flex flex-wrap gap-1.5">
                {paths.map((p, idx) => (
                  <React.Fragment key={p.slug}>
                    {idx > 0 ? " " : null}
                    <Link
                      href={`/learn/${p.slug}/`}
                      className="rounded-lg border border-white/10 bg-white/[0.03] px-2.5 py-1.5 text-[11px] font-bold text-slate-300 hover:border-cyan-400/40 hover:text-cyan-200"
                    >
                      → {p.targetCode.toUpperCase()}
                    </Link>
                  </React.Fragment>
                ))}
              </div>
            </li>
          );
        })}
      </ul>
    </section>
  );
}
