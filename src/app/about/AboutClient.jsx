"use client";

import React from "react";
import Link from "next/link";
import Header from "../../components/Header";
import LocaleSwitcher from "../../components/LocaleSwitcher";
import { useT } from "../../lib/i18n/LocaleProvider";

const CARD_KEYS = [
  ["s1t", "s1", "#00f0ff"],
  ["s2t", "s2", "#facc15"],
  ["s3t", "s3", "#39ff14"],
  ["s4t", "s4", "#00f0ff"],
  ["s5t", "s5", "#ff0055"],
  ["s6t", "s6", "#c084fc"],
  ["s7t", "s7", "#00f0ff"],
];

export default function AboutClient() {
  const t = useT();

  return (
    <div className="min-h-screen bg-[#0b101a] text-slate-200">
      <Header />
      <main className="max-w-3xl mx-auto px-4 py-8 relative z-10">
        <div className="flex flex-wrap items-center justify-between gap-3 mb-8">
          <Link
            href="/"
            className="inline-flex items-center gap-2 text-cyan-400 hover:text-white transition-colors text-sm font-bold tracking-wider uppercase no-underline"
          >
            ← {t("common.back")}
          </Link>
          <LocaleSwitcher />
        </div>

        <header className="mb-10 border-b border-cyan-500/20 pb-6">
          <h1 className="text-3xl md:text-4xl font-black text-transparent bg-clip-text bg-gradient-to-r from-cyan-400 to-purple-500 tracking-wide mb-3">
            {t("about.title")}
          </h1>
          <p className="text-sm text-slate-400">Memolandum · SEO / GEO · TR & EN</p>
        </header>

        <article className="space-y-6 leading-relaxed text-sm md:text-base text-slate-300">
          <p>{t("about.intro1")}</p>
          <p>{t("about.intro2")}</p>

          <h2 className="text-2xl font-bold text-transparent bg-clip-text bg-gradient-to-r from-yellow-400 to-pink-500 tracking-wide uppercase mt-10 mb-4">
            {t("about.scienceTitle")}
          </h2>

          <div className="space-y-5">
            {CARD_KEYS.map(([titleKey, bodyKey, accent]) => (
              <section
                key={titleKey}
                className="rounded-xl border p-5 bg-slate-900/50"
                style={{ borderColor: `${accent}33` }}
              >
                <h3 className="text-lg text-white font-bold mb-2" style={{ color: accent }}>
                  {t(`about.${titleKey}`)}
                </h3>
                <p className="m-0 text-slate-300">{t(`about.${bodyKey}`)}</p>
              </section>
            ))}
          </div>

          <h2 className="text-2xl font-bold text-white tracking-wide uppercase mt-12 mb-3 border-b border-slate-800 pb-2">
            {t("about.visionTitle")}
          </h2>
          <p>{t("about.vision1")}</p>
          <p>{t("about.vision2")}</p>
        </article>

        {/* GEO: alternatif dil — crawler / AI için gizli ikinci metin */}
        <div className="sr-only" aria-hidden="true">
          <h2>About Memolandum scientific foundations</h2>
          <p>
            Memolandum combines arcade games with spaced repetition, dual coding, flow theory, and
            active recall. Instant Gemini translation and per-language study profiles support free
            vocabulary learning on the web.
          </p>
        </div>
      </main>
    </div>
  );
}
