"use client";

import React from "react";
import Link from "next/link";
import LearnStartButton from "@/components/learn/LearnStartButton";
import { useLocale } from "@/lib/i18n/LocaleProvider";

export default function LearnHubClient({ items = [] }) {
  const { locale } = useLocale();
  const isEn = locale === "en";
  const isAr = locale === "ar";
  const isPt = locale === "pt";
  const useIntl = isEn || isAr || isPt;

  return (
    <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 pt-8 sm:pt-12">
      <nav className="text-xs text-slate-500 mb-6 flex items-center gap-2" aria-label="Breadcrumb">
        <Link href="/" className="hover:text-cyan-400">
          {isAr ? "الرئيسية" : isPt ? "Início" : isEn ? "Home" : "Ana sayfa"}
        </Link>{" "}
        <span>/</span>{" "}
        <span className="text-slate-300">
          {isAr ? "23 مساراً لغوياً" : isPt ? "23 Trilhas de Idiomas" : isEn ? "23 Language Pathways" : "23 Dil Yolu"}
        </span>
      </nav>

      <header className="mb-12 max-w-3xl">
        <p className="text-[11px] font-bold uppercase tracking-[0.2em] text-cyan-400 mb-3">
          {isAr
            ? "Memolandum Learn · 23 مساراً لغوياً"
            : isPt
              ? "Memolandum Learn · 23 Trilhas de Idiomas"
              : isEn
                ? "Memolandum Learn · 23 Language Pathways"
                : "Memolandum Learn · 23 Dil Yolu"}
        </p>
        <h1 className="text-3xl sm:text-4xl font-black text-white tracking-tight mb-4">
          {isAr
            ? "اختر صفحة اللغة · كلمات وجمل · والعب"
            : isPt
              ? "Escolha a Trilha do Idioma · Palavras e Frases · Jogue"
              : isEn
                ? "Pick a Language Home · Words & Sentences · Play"
                : "Dil Anasayfası Seç · Kelime & Cümle · Oyna"}
        </h1>
        <p className="text-slate-400 text-base leading-relaxed mb-6">
          {isAr ? (
            <>
              لكل زوج لغوي صفحته الخاصة: دراسة المفردات، جمل المحادثة، منهج الصفوف 1–8 للغة
              الإنجليزية، وباقات الاختبارات. اختر المستوى وانتقل مباشرة إلى 8 ألعاب أركيد مجانية.
              التعلّم الأساسي مجاني؛ والقاموس الأكاديمي في{" "}
              <Link href="/sozluk/" className="text-cyan-400 hover:underline">
                /sozluk
              </Link>
              .
            </>
          ) : isPt ? (
            <>
              Cada par de idiomas tem sua própria página: estudo de vocabulário, frases de conversação,
              inglês do 1º ao 8º ano e pacotes de exames. Escolha o nível → abra 8 jogos arcade
              gratuitos. O aprendizado principal é gratuito; glossário acadêmico em{" "}
              <Link href="/sozluk/" className="text-cyan-400 hover:underline">
                /sozluk
              </Link>
              .
            </>
          ) : isEn ? (
            <>
              Each language pair has its own home page: word study, sentence / speaking sets, Grades
              1–8 (Primary &amp; Middle School / LGS) English, and exam packs (YDS·YKS). Pick a
              level → deep-link into 8 free arcade games. Core learning is free; Instant Translation
              quota is clear. KPSS &amp; academic glossary at{" "}
              <Link href="/sozluk/" className="text-cyan-400 hover:underline">
                /sozluk
              </Link>
              .
            </>
          ) : (
            <>
              Her dil çifti kendi anasayfasıdır: kelime çalış, cümle / hızlı konuşma, İngilizce’de
              1–8. Sınıf (İlkokul &amp; Ortaokul / LGS) ve YDS·YKS sınav paketleri. Seviyeyi seç → 8
              ücretsiz arcade oyuna deep-link. Öğrenme ücretsiz; Anlık Çeviri kotası net. KPSS{" "}
              <Link href="/sozluk/" className="text-cyan-400 hover:underline">
                /sozluk
              </Link>
              .
            </>
          )}
        </p>
        <div className="flex flex-wrap items-center gap-3">
          <LearnStartButton
            href="/#basla"
            label={
              isAr ? "ابدأ من القائمة الرئيسية" : isPt ? "Começar pelo menu principal" : isEn ? "Start from main menu" : "Ana menüden başla"
            }
          />{" "}
          <Link
            href="/translate/"
            className="inline-flex items-center rounded-xl border border-white/10 px-5 py-3.5 text-sm font-bold text-slate-300 hover:border-cyan-500/40 hover:text-cyan-300"
          >
            {isAr
              ? "استوديو الترجمة الفورية"
              : isPt
                ? "Estúdio de Tradução Instantânea"
                : isEn
                  ? "Instant Translation Studio"
                  : "Anlık Çeviri Stüdyosu"}
          </Link>
        </div>
      </header>

      <section aria-label={isAr ? "مسارات اللغات" : isPt ? "Trilhas de idiomas" : isEn ? "Language pathways" : "Dil yolları"}>
        <h2 className="text-xl font-black text-white mb-6">
          {isAr ? "23 مساراً لغوياً" : isPt ? "23 Trilhas de Idiomas" : isEn ? "23 Language Pathways" : "23 Dil Yolu"}
        </h2>
        <ul className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {items.map((p) => (
            <li key={p.slug}>
              <article className="h-full flex flex-col rounded-2xl border border-white/5 bg-slate-900/30 p-5 hover:border-cyan-500/25 transition">
                <h3 className="text-lg font-bold text-slate-100 mb-1">
                  <Link href={`/learn/${p.slug}/`} className="hover:text-cyan-400">
                    {useIntl ? p.labelEn : p.labelTr}
                  </Link>
                </h3>
                <p className="text-xs text-slate-500 mb-3 font-mono uppercase tracking-wider">
                  {p.slug.toUpperCase()}
                </p>
                <p className="text-sm text-slate-400 line-clamp-3 mb-4 flex-1">
                  {useIntl ? p.introEn : p.introTr}
                </p>
                {p.wordCount > 0 && (
                  <p className="text-[11px] font-bold text-cyan-500/80 mb-3">
                    {isAr
                      ? `${p.wordCount.toLocaleString("en-US")} كلمة${
                          p.sampleWord ? ` · مثال: ${p.sampleWord}` : ""
                        }`
                      : isPt
                        ? `${p.wordCount.toLocaleString("pt-BR")} palavras${
                            p.sampleWord ? ` · ex.: ${p.sampleWord}` : ""
                          }`
                        : isEn
                          ? `${p.wordCount.toLocaleString("en-US")} words${
                              p.sampleWord ? ` · e.g. ${p.sampleWord}` : ""
                            }`
                          : `${p.wordCount.toLocaleString("tr-TR")} kelime${
                              p.sampleWord ? ` · örn. ${p.sampleWord}` : ""
                            }`}
                  </p>
                )}
                <div className="flex flex-wrap items-center gap-2 pt-3 border-t border-white/5">
                  <Link
                    href={`/learn/${p.slug}/`}
                    className="text-xs font-bold text-cyan-400 hover:underline"
                  >
                    {isAr ? "صفحة اللغة" : isPt ? "Página da Trilha" : isEn ? "Pathway Home" : "Dil Anasayfası"}
                  </Link>
                  <span className="text-slate-600" aria-hidden>
                    {" · "}
                  </span>
                  <Link
                    href={p.gameHref}
                    className="text-xs font-bold text-slate-300 hover:text-cyan-300"
                  >
                    {isAr ? "ابدأ اللعبة" : isPt ? "Iniciar jogo" : isEn ? "Start game" : "Oyuna başla"}
                  </Link>
                </div>
              </article>
            </li>
          ))}
        </ul>
      </section>
    </main>
  );
}
