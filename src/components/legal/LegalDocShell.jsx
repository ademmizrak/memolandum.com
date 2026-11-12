"use client";

import React, { useEffect, useState } from "react";
import Link from "next/link";
import Header from "../Header";
import { useLocale } from "../../lib/i18n/LocaleProvider";
import { LEGAL_CONTACT_EMAIL, LEGAL_LAST_UPDATED, LEGAL_PATHS } from "../../lib/legal/config";
import { getPrivacyDoc } from "../../lib/legal/privacy";
import { getTermsDoc } from "../../lib/legal/terms";

const DOC_LANGS = [
  { code: "tr", label: "TR", name: "Türkçe" },
  { code: "en", label: "EN", name: "English" },
];

/**
 * Legal kabuk — Privacy/Terms geçişi + sayfa içi TR | EN tab (About tarzı).
 * Tab, LocaleProvider ile senkron; SEO için her iki dil de DOM’da (biri görünür).
 */
export default function LegalDocShell({ doc = "privacy" }) {
  const { locale, setLocale, t } = useLocale();
  const [docLang, setDocLang] = useState(locale === "en" ? "en" : "tr");
  const isPrivacy = doc === "privacy";

  useEffect(() => {
    setDocLang(locale === "en" ? "en" : "tr");
  }, [locale]);

  const selectLang = (code) => {
    setDocLang(code);
    setLocale(code);
    try {
      const url = new URL(window.location.href);
      if (code === "en") url.searchParams.set("lang", "en");
      else url.searchParams.delete("lang");
      window.history.replaceState({}, "", url.pathname + url.search + url.hash);
    } catch {
      /* ignore */
    }
  };

  const trDoc = doc === "terms" ? getTermsDoc("tr") : getPrivacyDoc("tr");
  const enDoc = doc === "terms" ? getTermsDoc("en") : getPrivacyDoc("en");

  const navLabel = docLang === "en" ? "Legal documents" : "Yasal belgeler";
  const langTabLabel = docLang === "en" ? "Document language" : "Belge dili";

  return (
    <div className="min-h-screen bg-dark-900 text-slate-200">
      <Header />
      <main className="max-w-3xl mx-auto px-5 py-8 sm:py-12">
        <div className="flex flex-wrap items-center justify-between gap-3 mb-6">
          <Link
            href="/"
            className="text-sm text-cyan-400/90 hover:text-cyan-300 no-underline"
          >
            ← {t("common.back")}
          </Link>
        </div>

        {/* Belge dili — About benzeri tab */}
        <div className="mb-6">
          <p className="text-[11px] font-bold tracking-[0.14em] uppercase text-slate-500 m-0 mb-2 font-mono">
            {langTabLabel}
          </p>
          <div
            className="inline-flex rounded-lg border border-white/10 bg-slate-900/70 p-0.5 gap-0.5"
            role="tablist"
            aria-label={langTabLabel}
          >
            {DOC_LANGS.map((l) => {
              const active = docLang === l.code;
              return (
                <button
                  key={l.code}
                  type="button"
                  role="tab"
                  aria-selected={active}
                  onClick={() => selectLang(l.code)}
                  className={`min-w-[72px] px-3 py-2 rounded-md text-sm font-bold tracking-wide transition-colors ${
                    active
                      ? "bg-cyan-500/20 text-cyan-200 border border-cyan-400/45"
                      : "text-slate-400 hover:text-white border border-transparent"
                  }`}
                >
                  <span className="block leading-none">{l.label}</span>
                  <span
                    className={`block text-[10px] font-medium mt-0.5 ${
                      active ? "text-cyan-400/70" : "text-slate-600"
                    }`}
                  >
                    {l.name}
                  </span>
                </button>
              );
            })}
          </div>
          <p className="text-xs text-slate-600 m-0 mt-2">
            {docLang === "en"
              ? "Same legal document — switch language. TR & EN are equally authoritative."
              : "Aynı hukuki belge — dil değiştirin. TR ve EN eşit derecede bağlayıcıdır."}
          </p>
        </div>

        <nav className="flex flex-wrap gap-2 mb-8 text-sm" aria-label={navLabel}>
          <Link
            href={LEGAL_PATHS.privacy}
            className={`px-3 py-1.5 rounded-md no-underline border ${
              isPrivacy
                ? "border-cyan-400/50 bg-cyan-500/15 text-cyan-200"
                : "border-white/10 text-slate-400 hover:text-white"
            }`}
          >
            {docLang === "en" ? "Privacy Policy" : "Gizlilik Politikası"}
          </Link>
          <Link
            href={LEGAL_PATHS.terms}
            className={`px-3 py-1.5 rounded-md no-underline border ${
              !isPrivacy
                ? "border-cyan-400/50 bg-cyan-500/15 text-cyan-200"
                : "border-white/10 text-slate-400 hover:text-white"
            }`}
          >
            {docLang === "en" ? "Terms of Service" : "Kullanım Koşulları"}
          </Link>
          <Link
            href="/about/"
            className="px-3 py-1.5 rounded-md no-underline border border-white/10 text-slate-400 hover:text-white"
          >
            {docLang === "en" ? "About / Science" : "Hakkında / Bilim"}
          </Link>
        </nav>

        {/* Görünür dil */}
        <LegalArticle
          data={docLang === "en" ? enDoc : trDoc}
          lang={docLang}
          visible
        />

        {/* Diğer dil — SEO/GEO için DOM’da; ekranda gizli */}
        <div className="sr-only" aria-hidden="true">
          <LegalArticle
            data={docLang === "en" ? trDoc : enDoc}
            lang={docLang === "en" ? "tr" : "en"}
            visible={false}
          />
        </div>

        <footer className="mt-12 pt-6 border-t border-white/10 text-xs text-slate-500">
          <p className="m-0 mb-2">
            Memolandum ·{" "}
            <Link href={LEGAL_PATHS.privacy} className="text-cyan-500/80 hover:text-cyan-400">
              {docLang === "en" ? "Privacy" : "Gizlilik"}
            </Link>
            {" · "}
            <Link href={LEGAL_PATHS.terms} className="text-cyan-500/80 hover:text-cyan-400">
              {docLang === "en" ? "Terms" : "Koşullar"}
            </Link>
            {" · "}
            <button
              type="button"
              onClick={() => selectLang(docLang === "en" ? "tr" : "en")}
              className="text-cyan-500/80 hover:text-cyan-400 bg-transparent border-0 p-0 cursor-pointer underline underline-offset-2"
            >
              {docLang === "en" ? "Türkçe metin" : "English text"}
            </button>
          </p>
          <p className="m-0 opacity-80">
            {docLang === "en"
              ? "One document for website and apps (TR/EN tabs). Not a substitute for your own lawyer."
              : "Web ve uygulamalar için tek belge (TR/EN sekmeleri). Kendi avukatınızın yerine geçmez."}
          </p>
        </footer>
      </main>
    </div>
  );
}

function LegalArticle({ data, lang, visible }) {
  return (
    <article lang={lang} {...(visible ? { role: "tabpanel" } : {})}>
      <h1 className="text-3xl sm:text-4xl font-black text-white tracking-tight m-0 mb-2">
        {data.title}
      </h1>
      <p className="text-sm text-slate-500 m-0 mb-6">
        {lang === "en" ? "Last updated" : "Son güncelleme"}: {LEGAL_LAST_UPDATED}
        {" · "}
        <a
          href={`mailto:${LEGAL_CONTACT_EMAIL}`}
          className="text-cyan-400/90 hover:text-cyan-300"
        >
          {LEGAL_CONTACT_EMAIL}
        </a>
      </p>
      <p className="text-slate-300 leading-relaxed mb-8">{data.intro}</p>

      {data.sections.map((section) => (
        <section key={`${lang}-${section.heading}`} className="mb-7">
          <h2 className="text-lg font-bold text-white m-0 mb-2">{section.heading}</h2>
          <p className="m-0 text-slate-300 leading-relaxed whitespace-pre-wrap">
            {section.body}
          </p>
        </section>
      ))}
    </article>
  );
}
