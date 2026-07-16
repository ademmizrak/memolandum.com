"use client";

import {
  DEFAULT_DESCRIPTION,
  FAQ_ITEMS,
  FAQ_ITEMS_EN,
  SITE_URL,
  absoluteUrl,
} from "../../lib/seo/siteConfig";
import { useLocale } from "../../lib/i18n/LocaleProvider";

/** Botlar ve GEO için tarayıcıda gerçek HTML; UI diline göre metin */
export default function HomeSeo() {
  const { locale, t } = useLocale();
  const faq = locale === "en" ? FAQ_ITEMS_EN : FAQ_ITEMS;

  return (
    <section
      className="seo-geo-block"
      aria-label={locale === "en" ? "About Memolandum" : "Memolandum hakkında"}
      style={{
        maxWidth: "72rem",
        margin: "0 auto",
        padding: "1.5rem 1.5rem 3rem",
        color: "#cbd5e1",
        fontFamily: "system-ui, sans-serif",
        lineHeight: 1.55,
      }}
    >
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
        {locale === "en"
          ? "Learn vocabulary with arcade games, use Gemini-powered instant translation, and track progress with per-language study profiles — free on the web."
          : DEFAULT_DESCRIPTION}
      </p>

      <h2 style={{ fontSize: "1.15rem", fontWeight: 800, color: "#67e8f9", margin: "1.5rem 0 0.75rem" }}>
        {t("seo.whyTitle")}
      </h2>
      <ul style={{ paddingLeft: "1.25rem", marginBottom: "1.25rem" }}>
        <li>{t("seo.why1")}</li>
        <li>{t("seo.why2")}</li>
        <li>{t("seo.why3")}</li>
        <li>{t("seo.why4")}</li>
        <li>{t("seo.why5")}</li>
      </ul>

      <h2 style={{ fontSize: "1.15rem", fontWeight: 800, color: "#67e8f9", margin: "1.5rem 0 0.75rem" }}>
        {t("seo.faqTitle")}
      </h2>
      <div style={{ display: "flex", flexDirection: "column", gap: "1rem" }}>
        {faq.map((item) => (
          <article key={item.question} lang={locale}>
            <h3 style={{ fontSize: "1rem", fontWeight: 700, color: "#e2e8f0", marginBottom: "0.35rem" }}>
              {item.question}
            </h3>
            <p style={{ margin: 0, color: "#94a3b8" }}>{item.answer}</p>
          </article>
        ))}
      </div>

      {/* GEO: her iki dilde de statik ikinci blok — JS kapalı crawler için */}
      <div hidden lang={locale === "en" ? "tr" : "en"}>
        {(locale === "en" ? FAQ_ITEMS : FAQ_ITEMS_EN).map((item) => (
          <div key={`alt-${item.question}`}>
            <h3>{item.question}</h3>
            <p>{item.answer}</p>
          </div>
        ))}
      </div>

      <nav style={{ marginTop: "2rem", fontSize: "0.9rem" }} aria-label={t("seo.linksLabel")}>
        <a href={absoluteUrl("/")} style={{ color: "#22d3ee", marginRight: "1rem" }}>
          {t("seo.linkHome")}
        </a>
        <a href={absoluteUrl("/leaderboard")} style={{ color: "#22d3ee", marginRight: "1rem" }}>
          {t("seo.linkBoard")}
        </a>
        <a href={absoluteUrl("/vocabulary")} style={{ color: "#22d3ee", marginRight: "1rem" }}>
          {t("seo.linkVault")}
        </a>
        <a href={absoluteUrl("/games/shooter")} style={{ color: "#22d3ee", marginRight: "1rem" }}>
          {t("seo.linkShooter")}
        </a>
        <a href={absoluteUrl("/about")} style={{ color: "#22d3ee" }}>
          {t("seo.linkAbout")}
        </a>
      </nav>
      <p style={{ marginTop: "1rem", fontSize: "0.75rem", color: "#64748b" }}>
        Memolandum · {SITE_URL} · UI: TR / EN
      </p>
    </section>
  );
}
