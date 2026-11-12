"use client";

import React, { useState } from "react";
import {
  DEFAULT_DESCRIPTION,
  FAQ_ITEMS,
  FAQ_ITEMS_EN,
  FAQ_ITEMS_AR,
  FAQ_ITEMS_PT,
  SITE_URL,
  LEGAL_CONTACT_EMAIL,
  absoluteUrl,
} from "../../lib/seo/siteConfig";
import { buildFaqJsonLd } from "../../lib/seo/jsonLd";
import { useLocale } from "../../lib/i18n/LocaleProvider";
import { translate as tRaw } from "../../lib/i18n";

/** Botlar ve GEO için tarayıcıda gerçek HTML; UI diline göre metin */
export default function HomeSeo({ forcedLocale = null }) {
  const { locale: ctxLocale, ready } = useLocale();
  const locale = !ready && forcedLocale ? forcedLocale : ctxLocale;
  const t = (key, fallback) => tRaw(locale, key) || fallback;
  const isAr = locale === "ar";
  const isPt = locale === "pt";
  const isEn = locale === "en" || isAr || isPt;
  const faq = isAr ? FAQ_ITEMS_AR : isPt ? FAQ_ITEMS_PT : locale === "en" ? FAQ_ITEMS_EN : FAQ_ITEMS;
  const faqJsonLd = buildFaqJsonLd(locale);
  const [legalModal, setLegalModal] = useState(null); // "kvkk" | "sales" | null

  const navLinks = [
    { href: absoluteUrl("/"), label: t("seo.linkHome") },
    {
      href: absoluteUrl("/quiz"),
      label: isEn ? "Grades 2–8 Practice Quizzes (20 Random Qs)" : "2–8. Sınıf Deneme Quizleri (20 Soru)",
    },
    {
      href: absoluteUrl("/quiz/8-sinif"),
      label: isEn ? "8th Grade LGS English Quiz" : "8. Sınıf LGS Deneme Quizi",
    },
    { href: absoluteUrl("/learn"), label: t("seo.linkLearn") },
    {
      href: absoluteUrl("/schools"),
      label: isEn ? "Memolandum for Schools (Teacher Desk)" : "Okullar & Öğretmen Masası",
    },
    {
      href: absoluteUrl("/veli-rehberi"),
      label: isEn ? "1-Min Parent Guide & Report Card" : "1 Dk Veli Rehberi & Karne",
    },
    {
      href: absoluteUrl("/schools/rehber"),
      label: isEn ? "Teacher Security & Privacy Guide" : "Öğretmen Güvenlik Rehberi",
    },
    { href: absoluteUrl("/learn/en-tr/meb-1-sinif-kelimeleri"), label: t("seo.linkMeb") },
    {
      href: absoluteUrl("/videos?playlist=1sınıf"),
      label: t("seo.linkVideos", isEn ? "Study with Video" : "Video ile çalış"),
    },
    {
      href: absoluteUrl("/videos?playlist=pt-en"),
      label: isPt
        ? "🇧🇷 Curso de Inglês do Zero (Vídeo PT-BR)"
        : "🇧🇷 Curso de Inglês do Zero (PT–EN Video)",
    },
    {
      href: absoluteUrl("/videos?playlist=ar-en"),
      label: isAr
        ? "🇸🇦 إتقان الإنجليزية خطوة بخطوة (فيديو)"
        : "🇸🇦 إتقان الإنجليزية خطوة بخطوة (AR–EN Video)",
    },
    {
      href: absoluteUrl("/pt"),
      label: "🇧🇷 Memolandum Brasil (PT-BR)",
    },
    {
      href: absoluteUrl("/ar"),
      label: "🇸🇦 Memolandum العربية (AR)",
    },
    { href: absoluteUrl("/games/word-card"), label: t("seo.linkWordCard") },
    {
      href: absoluteUrl("/games"),
      label: t("seo.linkGames", isEn ? "Games" : "Oyunlar"),
    },
    { href: absoluteUrl("/translate"), label: t("seo.linkTranslate") },
    { href: absoluteUrl("/sozluk"), label: t("seo.linkGlossary") },
    { href: absoluteUrl("/vocabulary"), label: t("seo.linkVault") },
    { href: absoluteUrl("/method"), label: t("seo.linkMethod") },
    { href: absoluteUrl("/leaderboard"), label: t("seo.linkBoard") },
    { href: absoluteUrl("/games/shooter"), label: t("seo.linkShooter") },
    {
      href: "https://www.shopier.com/49186522",
      label: `👑 ${t("seo.linkPremium")}`,
      external: true,
      amber: true,
    },
    {
      href: "https://kreosus.com/httpsmemolandumcom/about",
      label: `💖 Kreosus ${t("nav.support")}`,
      external: true,
    },
    { href: absoluteUrl("/about"), label: t("seo.linkAbout") },
    {
      href: absoluteUrl("/roadmap"),
      label: t("seo.linkRoadmap", isEn ? "Roadmap" : "Yol Haritası"),
    },
    { href: absoluteUrl("/legal/privacy"), label: t("seo.linkPrivacy") },
    { href: absoluteUrl("/legal/terms"), label: t("seo.linkTerms") },
  ];

  return (
    <section
      className="seo-geo-block"
      aria-label={isEn ? "About Memolandum" : "Memolandum hakkında"}
      style={{
        maxWidth: "72rem",
        margin: "0 auto",
        padding: "1.5rem 1.5rem 3rem",
        color: "#cbd5e1",
        fontFamily: "system-ui, sans-serif",
        lineHeight: 1.55,
      }}
    >
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(faqJsonLd) }}
      />

      <h1
        style={{
          fontSize: "1.75rem",
          fontWeight: 900,
          color: "#f8fafc",
          marginBottom: "0.75rem",
          letterSpacing: "0.02em",
        }}
      >
        {t("seo.h1")}
      </h1>
      <p style={{ marginBottom: "1rem", maxWidth: "48rem" }}>
        {isAr
          ? "23 مساراً لغوياً في /learn — 16 لعبة أركيد مجانية + اختبارات تجريبية عشوائية (20 سؤالاً من بنك 100 سؤال) للصفوف 2–8 في /quiz + كورس الفيديو 'إتقان الإنجليزية خطوة بخطوة' (/videos/?playlist=ar-en). منهج اللغة الإنجليزية للصفوف 1–12. القاموس الأكاديمي (~4,000 مفهوم). ترجمة Gemini الفورية بـ 14 لغة. نظام التكرار المتباعد. متاح بواجهة عربية وتركية وإنجليزية وبرتغالية."
          : isPt
            ? "23 trilhas de idiomas em /learn — 16 jogos arcade gratuitos + Simulados de Inglês de 20 questões aleatórias (2º ao 8º ano em /quiz) + Curso de Inglês do Zero (Explicado em Português em /videos/?playlist=pt-en). Currículo de inglês do 1º ao 12º ano e ENEM. Glossário acadêmico (~4.000 conceitos). Tradução Instantânea Gemini em 14 idiomas. Repetição espaçada. Interface em PT / EN / AR / TR."
            : isEn
              ? "23 language pathways at /learn — 16 arcade games free + Grades 2–8 & LGS 20-question random practice quizzes from 100-question curriculum pools (/quiz) + 15 @memolandum YouTube video playlists (including Arabic–English & Brazilian Portuguese–English). Grades 1–12 (Primary, Middle / LGS & High School) English curriculum. KPSS & academic glossary (~4,000 concepts). Gemini Instant Translation in 14 languages. Spaced repetition."
              : DEFAULT_DESCRIPTION}
      </p>

      <h2
        style={{
          fontSize: "1.15rem",
          fontWeight: 800,
          color: "#67e8f9",
          margin: "1.5rem 0 0.75rem",
        }}
      >
        {t("seo.whyTitle")}
      </h2>
      <ul style={{ paddingLeft: "1.25rem", marginBottom: "1.25rem" }}>
        <li>{t("seo.why1")}</li>
        <li>{t("seo.why2")}</li>
        <li>{t("seo.why3")}</li>
        <li>{t("seo.why4")}</li>
        <li>{t("seo.why5")}</li>
      </ul>

      <h2
        style={{
          fontSize: "1.15rem",
          fontWeight: 800,
          color: "#67e8f9",
          margin: "1.5rem 0 0.75rem",
        }}
      >
        {t("seo.faqTitle")}
      </h2>
      <div style={{ display: "flex", flexDirection: "column", gap: "1rem" }}>
        {faq.map((item) => (
          <article key={item.question} lang={locale}>
            <h3
              style={{
                fontSize: "1rem",
                fontWeight: 700,
                color: "#e2e8f0",
                marginBottom: "0.35rem",
              }}
            >
              {item.question}
            </h3>
            <p style={{ margin: 0, color: "#94a3b8" }}>{item.answer}</p>
          </article>
        ))}
      </div>

      {/* GEO: Statik çok dilli bloklar (PT-BR, EN, AR, TR) — JS çalıştırmayan arama motorları ve AI botlar için */}
      <div hidden aria-hidden="true">
        {!isPt && (
          <section lang="pt-BR">
            <h2>Memolandum — Curso de Inglês do Zero (Explicado em Português) e 16 Jogos Arcade Grátis (Brasil · PT-BR)</h2>
            <p>
              Assista gratuitamente ao Curso de Inglês do Zero (Explicado em Português) em /videos/?playlist=pt-en
              (Desmistificando A e An em Inglês: A Regra de Ouro + Quiz Prático) e pratique nas 23 trilhas de idiomas em /learn (/learn/pt-en e /learn/pt-tr) com 16 jogos arcade gratuitos e sem anúncios.
              Currículo de inglês do 1º ao 12º ano (Ensino Fundamental, Médio e preparação para ENEM/Vestibular),
              Mesa do Professor (/schools), Boletim dos Pais (/veli-rehberi) e Tradução Instantânea com IA Gemini.
            </p>
            {FAQ_ITEMS_PT.map((item) => (
              <div key={`pt-${item.question}`}>
                <h3>{item.question}</h3>
                <p>{item.answer}</p>
              </div>
            ))}
          </section>
        )}
        {!isAr && (
          <section lang="ar" dir="rtl">
            <h2>Memolandum — إتقان الإنجليزية خطوة بخطوة (دروس فيديو بالعربية) و16 لعبة أركيد مجانية</h2>
            <p>
              شاهد مجاناً سلسلة دروس الفيديو "إتقان الإنجليزية خطوة بخطوة" بالشرح العربي في /videos/?playlist=ar-en
              (شرح أدوات التنكير A و An بالتفصيل + اختبار قصير) وتدرّب في 23 مساراً لغوياً في /learn (/learn/ar-en و/learn/ar-tr) عبر 16 لعبة أركيد مجانية وخالية من الإعلانات. منهج اللغة الإنجليزية للصفوف 1–12،
              مكتب المعلم (/schools)، بطاقة تقرير ولي الأمر (/veli-rehberi)، وترجمة Gemini الفورية بـ 14 لغة.
            </p>
            {FAQ_ITEMS_AR.map((item) => (
              <div key={`ar-${item.question}`}>
                <h3>{item.question}</h3>
                <p>{item.answer}</p>
              </div>
            ))}
          </section>
        )}
        {locale !== "en" && (
          <section lang="en">
            <h2>Memolandum — Free Vocabulary Arcade Games, Grades 2–8 Practice Quizzes &amp; Spaced Repetition</h2>
            <p>
              23 language pathways at /learn — 16 free arcade games and Grades 2–8 &amp; LGS 20-question random practice quizzes from 100-question pools (/quiz). Grades 1–12 English curriculum,
              Teacher Classroom Desk (/schools), Parent Achievement Report Card (/veli-rehberi),
              KPSS &amp; academic glossary (~4,000 concepts), and Gemini Instant Translation in 14 languages.
            </p>
            {FAQ_ITEMS_EN.map((item) => (
              <div key={`en-${item.question}`}>
                <h3>{item.question}</h3>
                <p>{item.answer}</p>
              </div>
            ))}
          </section>
        )}
      </div>

      {/* Footer Navigation Links with explicit DOM spacing and flex gap */}
      <nav
        className="mt-8 flex flex-wrap items-center gap-x-3 gap-y-2 text-sm"
        aria-label={t("seo.linksLabel")}
      >
        {navLinks.map((item, idx) => (
          <React.Fragment key={item.href}>
            {idx > 0 && (
              <span className="text-slate-600 select-none" aria-hidden>
                {" · "}
              </span>
            )}
            <a
              href={item.href}
              {...(item.external ? { target: "_blank", rel: "noopener noreferrer" } : {})}
              className={
                item.amber
                  ? "text-amber-300 hover:text-amber-200 font-semibold transition-colors"
                  : item.external
                    ? "text-pink-400 hover:text-pink-300 font-semibold transition-colors"
                    : "text-cyan-400 hover:text-cyan-300 transition-colors"
              }
            >
              {item.label}
            </a>
          </React.Fragment>
        ))}
      </nav>

      {/* Legal Compliance (KVKK & Distance Sales) + Official Contact Strip */}
      <div className="mt-5 pt-4 border-t border-slate-800/80 flex flex-wrap items-center gap-x-4 gap-y-2 text-xs text-slate-400">
        <button
          type="button"
          onClick={() => setLegalModal("kvkk")}
          className="text-amber-300 hover:text-amber-200 font-semibold underline underline-offset-4 bg-transparent border-none p-0 cursor-pointer"
        >
          {t("seo.linkKvkk", isEn ? "KVKK & Data Protection Notice" : "KVKK Aydınlatma Metni")}
        </button>{" "}
        <span className="text-slate-600" aria-hidden>
          ·
        </span>{" "}
        <button
          type="button"
          onClick={() => setLegalModal("sales")}
          className="text-amber-300 hover:text-amber-200 font-semibold underline underline-offset-4 bg-transparent border-none p-0 cursor-pointer"
        >
          {t(
            "seo.linkDistanceSales",
            isEn
              ? "Distance Sales & Refund Policy"
              : "Mesafeli Satış & İptal/İade Koşulları"
          )}
        </button>{" "}
        <span className="text-slate-600" aria-hidden>
          ·
        </span>{" "}
        <a
          href={absoluteUrl("/legal/")}
          className="text-slate-400 hover:text-slate-200 transition-colors"
        >
          {t("seo.linkLegal")}
        </a>{" "}
        <span className="text-slate-600" aria-hidden>
          ·
        </span>{" "}
        <span>
          {t("seo.linkContact", isEn ? "Contact" : "İletişim")}:{" "}
          <a
            href={`mailto:${LEGAL_CONTACT_EMAIL}`}
            className="text-cyan-400 hover:text-cyan-300 font-semibold"
          >
            {LEGAL_CONTACT_EMAIL}
          </a>
        </span>
      </div>

      <p style={{ marginTop: "0.75rem", fontSize: "0.75rem", color: "#64748b" }}>
        {isAr
          ? `Memolandum · ${SITE_URL} · 23 مساراً لغوياً · إنجليزية الصفوف 1–8 · قاموس KPSS · ترجمة فورية · الواجهة: TR / EN / AR / PT`
          : isPt
            ? `Memolandum · ${SITE_URL} · 23 trilhas de idiomas · Inglês 1º ao 8º Ano · KPSS · Tradução Instantânea · UI: TR / EN / AR / PT`
            : isEn
              ? `Memolandum · ${SITE_URL} · 23 language pathways · Grades 1–8 English · KPSS · Instant Translation · UI: TR / EN / AR / PT`
              : `Memolandum · ${SITE_URL} · 23 dil yolu · 1–8. Sınıf İngilizce · KPSS · Anlık Çeviri · UI: TR / EN / AR / PT`}
      </p>

      {/* KVKK / Mesafeli Satış Modal */}
      {legalModal && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center bg-slate-950/80 backdrop-blur-sm p-4"
          role="dialog"
          aria-modal="true"
          aria-labelledby="legal-modal-title"
          onClick={() => setLegalModal(null)}
        >
          <div
            className="max-w-2xl w-full rounded-2xl border border-slate-700 bg-slate-900 p-6 text-slate-200 shadow-2xl max-h-[85vh] overflow-y-auto"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="flex items-start justify-between gap-4 border-b border-slate-800 pb-3 mb-4">
              <h3 id="legal-modal-title" className="text-lg font-black text-white m-0">
                {legalModal === "kvkk"
                  ? isEn
                    ? "KVKK & Personal Data Protection Notice"
                    : "6698 Sayılı KVKK Aydınlatma Metni"
                  : isEn
                    ? "Distance Sales Agreement & Cancellation/Refund Policy"
                    : "Mesafeli Satış Sözleşmesi & İptal/İade Koşulları"}
              </h3>
              <button
                type="button"
                onClick={() => setLegalModal(null)}
                className="text-slate-400 hover:text-white font-bold text-lg leading-none px-2 py-1 rounded bg-slate-800 border-none cursor-pointer"
                aria-label={isEn ? "Close" : "Kapat"}
              >
                ×
              </button>
            </div>

            {legalModal === "kvkk" ? (
              <div className="space-y-3 text-xs sm:text-sm text-slate-300 leading-relaxed">
                <p>
                  {isEn
                    ? "Under Law No. 6698 on the Protection of Personal Data (KVKK) and GDPR principles, Memolandum processes only the minimum necessary account data (email, display name), study progress (SM-2 spaced repetition records, Word Vault), and anonymous security telemetry."
                    : "6698 sayılı Kişisel Verilerin Korunması Kanunu (KVKK) kapsamında veri sorumlusu sıfatıyla Memolandum; yalnızca üyelik kimlik bilgileri (e-posta, görünen ad), öğrenme ilerlemesi (SM-2 aralıklı tekrar verileri, Kelime Kasası) ve güvenlik telemetrisini işler."}
                </p>
                <p>
                  {isEn
                    ? "Children & School Mode: Student accounts and classroom PIN flows do not expose personal data publicly, contain zero third-party ad trackers, and are processed strictly for educational progress reporting."
                    : "Çocuk & Okul Güvenliği: Öğrenci profilleri ve sınıf PIN akışları kamuya açık kişisel veri paylaşmaz, üçüncü taraf reklam takipçisi barındırmaz ve yalnızca pedagojik gelişim karnesi üretmek amacıyla işlenir."}
                </p>
                <p>
                  {isEn
                    ? "Your Rights: You may request access, correction, or complete deletion of your account and cloud data at any time from your Profile or by emailing "
                    : "KVKK Madde 11 Kapsamındaki Haklarınız: Hesabınızın ve bulut verilerinizin silinmesini, düzeltilmesini veya bilgi talebinizi dilediğiniz an Profil sayfasından ya da "}
                  <a href={`mailto:${LEGAL_CONTACT_EMAIL}`} className="text-cyan-400 underline">
                    {LEGAL_CONTACT_EMAIL}
                  </a>
                  {isEn ? "." : " adresine e-posta göndererek iletebilirsiniz."}
                </p>
              </div>
            ) : (
              <div className="space-y-3 text-xs sm:text-sm text-slate-300 leading-relaxed">
                <p>
                  {isEn
                    ? "Service Scope & Pricing: Core vocabulary/sentence learning across 23 pathways, 8 arcade games, and the KPSS glossary is 100% free. Memolandum Premium (199 TL / month) provides unlimited Gemini AI Instant Translation (text & voice) after the free trial quota."
                    : "Hizmet Kapsamı ve Ücretlendirme: Memolandum’da 23 dil yolu, 1–8. sınıf okul müfredatı, 8 arcade oyun ve KPSS sözlüğü tamamen ücretsizdir. Memolandum Premium (199 TL / ay), ücretsiz deneme kotası sonrasında sınırsız Gemini AI Anlık Çeviri (metin ve ses) hizmeti sunar."}
                </p>
                <p>
                  {isEn
                    ? "Payment Security: Payments are processed via PCI-DSS compliant hosted checkout providers (Shopier / Stripe). Memolandum never stores credit card numbers."
                    : "Ödeme Güvenliği: Ödemeler PCI-DSS uyumlu güvenli ödeme altyapıları (Shopier / Stripe) üzerinden tahsil edilir; kart bilgileriniz Memolandum sunucularında tutulmaz."}
                </p>
                <p>
                  {isEn
                    ? "Cancellation & Refund Policy: You may cancel your subscription at any time without penalty. For unused digital subscription periods or billing issues within 14 days, contact "
                    : "İptal ve İade Koşulları: Aboneliğinizi dilediğiniz zaman kesintisiz iptal edebilirsiniz. 6502 sayılı Tüketicinin Korunması Hakkında Kanun ve Mesafeli Sözleşmeler Yönetmeliği kapsamında 14 gün içinde yapılan iade/iptal talepleriniz için "}
                  <a href={`mailto:${LEGAL_CONTACT_EMAIL}`} className="text-cyan-400 underline">
                    {LEGAL_CONTACT_EMAIL}
                  </a>
                  {isEn ? " for fast resolution." : " üzerinden bize ulaşabilirsiniz."}
                </p>
              </div>
            )}

            <div className="mt-5 pt-3 border-t border-slate-800 flex items-center justify-between gap-3 text-xs">
              <div className="flex items-center gap-3">
                <a href={absoluteUrl("/legal/privacy")} className="text-cyan-400 hover:underline">
                  {t("seo.linkPrivacy")}
                </a>{" "}
                <a href={absoluteUrl("/legal/terms")} className="text-cyan-400 hover:underline">
                  {t("seo.linkTerms")}
                </a>
              </div>
              <button
                type="button"
                onClick={() => setLegalModal(null)}
                className="px-4 py-1.5 rounded-lg bg-cyan-500 text-slate-950 font-black cursor-pointer border-none"
              >
                {isEn ? "Close" : "Tamam"}
              </button>
            </div>
          </div>
        </div>
      )}
    </section>
  );
}
