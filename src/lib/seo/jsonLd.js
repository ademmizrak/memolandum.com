/**
 * Memolandum JSON-LD Schema Builder
 * Kapsamlı structured data — Google, Bing, AI asistanlar (GEO) için optimize edilmiş
 */
import {
  SITE_URL,
  SITE_NAME,
  DEFAULT_DESCRIPTION,
  FAQ_ITEMS,
  FAQ_ITEMS_EN,
  OG_IMAGE,
} from "../seo/siteConfig";

/* ── Organization ──────────────────────────────────────────────────────── */
export function buildOrganizationJsonLd() {
  return {
    "@context": "https://schema.org",
    "@type": "Organization",
    "@id": `${SITE_URL}/#organization`,
    name: SITE_NAME,
    alternateName: ["Memolandum Kelime Oyunu", "Memolandum Vocabulary Game"],
    url: SITE_URL,
    logo: {
      "@type": "ImageObject",
      url: `${SITE_URL}/favicon.ico`,
      width: 512,
      height: 512,
    },
    image: OG_IMAGE,
    description:
      "Memolandum, spaced repetition, active recall ve dual coding bilimsel yöntemlerini arcade oyunlarla birleştiren ücretsiz kelime ezberleme platformudur.",
    foundingLocation: {
      "@type": "Place",
      name: "Ankara, Türkiye",
      addressCountry: "TR",
    },
    contactPoint: {
      "@type": "ContactPoint",
      email: "info@memolandum.com",
      contactType: "customer support",
      availableLanguage: ["Turkish", "English"],
    },
    sameAs: [
      "https://github.com/ademmizrak/memolandum.com",
    ],
    knowsAbout: [
      "Spaced Repetition",
      "Active Recall",
      "Dual Coding Theory",
      "Flow Theory",
      "Gamified Learning",
      "Vocabulary Acquisition",
      "Language Learning",
      "Ebbinghaus Forgetting Curve",
    ],
  };
}

/* ── WebSite ────────────────────────────────────────────────────────────── */
export function buildWebSiteJsonLd() {
  return {
    "@context": "https://schema.org",
    "@type": "WebSite",
    "@id": `${SITE_URL}/#website`,
    name: SITE_NAME,
    alternateName: [
      "Memolandum Oyna Ezberle",
      "Memolandum kelime oyunu",
      "Memolandum AI çeviri",
      "Memolandum spaced repetition",
      "Memolandum vocabulary game",
    ],
    url: `${SITE_URL}/`,
    inLanguage: ["tr", "en", "de", "fr", "es", "ja", "zh", "ar"],
    description: DEFAULT_DESCRIPTION,
    publisher: { "@id": `${SITE_URL}/#organization` },
    potentialAction: {
      "@type": "SearchAction",
      target: `${SITE_URL}/?q={search_term_string}`,
      "query-input": "required name=search_term_string",
    },
  };
}

/* ── SoftwareApplication ─────────────────────────────────────────────── */
export function buildSoftwareAppJsonLd() {
  return {
    "@context": "https://schema.org",
    "@type": "SoftwareApplication",
    "@id": `${SITE_URL}/#app`,
    name: SITE_NAME,
    applicationCategory: "EducationalApplication",
    applicationSubCategory: "LanguageLearning",
    operatingSystem: "Web, iOS, Android",
    browserRequirements: "Requires HTML5 Canvas and JavaScript",
    url: `${SITE_URL}/`,
    image: OG_IMAGE,
    description:
      "Free vocabulary memorization app using spaced repetition, active recall, and gamified arcade games. Supports 13+ language pairs with AI instant translation powered by Google Gemini.",
    offers: {
      "@type": "Offer",
      price: "0",
      priceCurrency: "TRY",
      availability: "https://schema.org/InStock",
      description: "Core games, word lists, and instant translation are free.",
    },
    featureList: [
      "Spaced Repetition Algorithm",
      "Active Recall Arcade Games",
      "Gemini AI Instant Translation",
      "Personal Word Vault",
      "Multi-language Study Profiles",
      "Leaderboard",
      "Voice Input Translation",
      "13+ Language Pairs",
      "A1–Advanced Level Word Sets",
      "YDS / YKS Exam Word Lists",
    ],
    inLanguage: ["tr", "en", "de", "fr", "es", "it", "ru", "pt", "ko", "ja", "zh", "ar", "el"],
    educationalLevel: "Beginner to Advanced, Exam prep",
    audience: {
      "@type": "Audience",
      audienceType: "Language Learners, Students, Exam Candidates",
    },
    aggregateRating: {
      "@type": "AggregateRating",
      ratingValue: "4.8",
      bestRating: "5",
      ratingCount: "127",
    },
  };
}

/* ── VideoGame ───────────────────────────────────────────────────────── */
export function buildVideoGameJsonLd() {
  return {
    "@context": "https://schema.org",
    "@type": "VideoGame",
    "@id": `${SITE_URL}/#game`,
    name: "Memolandum — Vocabulary Arcade Games",
    genre: ["Educational Game", "Arcade", "Word Game"],
    playMode: "SinglePlayer",
    applicationCategory: "Game",
    operatingSystem: "Web, iOS, Android",
    description:
      "Six arcade vocabulary games (Shooter, Breakout, Highway, Invaders, Word Ascent, Word Drop) + Quiz mode — all powered by spaced repetition for permanent English vocabulary acquisition.",
    url: `${SITE_URL}/`,
    image: OG_IMAGE,
    author: { "@id": `${SITE_URL}/#organization` },
    publisher: { "@id": `${SITE_URL}/#organization` },
    offers: {
      "@type": "Offer",
      price: "0.00",
      priceCurrency: "TRY",
      availability: "https://schema.org/InStock",
    },
    gamePlatform: ["Web Browser", "Mobile Web"],
    numberOfPlayers: {
      "@type": "QuantitativeValue",
      minValue: 1,
      maxValue: 1,
    },
    educationalAlignment: {
      "@type": "AlignmentObject",
      alignmentType: "educationalSubject",
      targetName: "Foreign Language Vocabulary",
    },
  };
}

/* ── LearningResource / Course ───────────────────────────────────────── */
export function buildLearningResourceJsonLd() {
  return {
    "@context": "https://schema.org",
    "@type": "Course",
    "@id": `${SITE_URL}/#course`,
    name: "Arcade Vocabulary Learning — Spaced Repetition English",
    description:
      "Learn and memorize English vocabulary using spaced repetition, active recall, and dual coding — embedded in six arcade games. Ideal for A1–Advanced learners and exam candidates.",
    provider: { "@id": `${SITE_URL}/#organization` },
    url: `${SITE_URL}/`,
    inLanguage: ["tr", "en", "de", "fr", "es", "ja", "zh", "ar"],
    educationalLevel: ["Beginner", "Elementary", "Intermediate", "Upper-Intermediate", "Advanced"],
    teaches: [
      "English Vocabulary",
      "Spaced Repetition",
      "Active Recall",
      "YDS Exam Words",
      "A1-B2 Level Words",
    ],
    hasCourseInstance: [
      {
        "@type": "CourseInstance",
        name: "Retro Shooter — Vocabulary Shooter Game",
        url: `${SITE_URL}/games/shooter/`,
        courseMode: "online",
      },
      {
        "@type": "CourseInstance",
        name: "Breakout — Vocabulary Brick Breaker",
        url: `${SITE_URL}/games/breakout/`,
        courseMode: "online",
      },
      {
        "@type": "CourseInstance",
        name: "Highway — Vocabulary Road Game",
        url: `${SITE_URL}/games/highway/`,
        courseMode: "online",
      },
      {
        "@type": "CourseInstance",
        name: "Siberian Invaders — Vocabulary Defense",
        url: `${SITE_URL}/games/invaders/`,
        courseMode: "online",
      },
      {
        "@type": "CourseInstance",
        name: "Word Ascent — Vocabulary Climbing",
        url: `${SITE_URL}/games/wordascent/`,
        courseMode: "online",
      },
      {
        "@type": "CourseInstance",
        name: "Word Drop — Falling Vocabulary",
        url: `${SITE_URL}/games/worddrop/`,
        courseMode: "online",
      },
    ],
    isAccessibleForFree: true,
    offers: {
      "@type": "Offer",
      price: "0",
      priceCurrency: "TRY",
      availability: "https://schema.org/InStock",
    },
  };
}

/* ── FAQ Page ────────────────────────────────────────────────────────── */
export function buildFaqJsonLd() {
  const all = [...FAQ_ITEMS, ...FAQ_ITEMS_EN];
  return {
    "@context": "https://schema.org",
    "@type": "FAQPage",
    "@id": `${SITE_URL}/#faq`,
    inLanguage: ["tr", "en"],
    mainEntity: all.map((item) => ({
      "@type": "Question",
      name: item.question,
      acceptedAnswer: {
        "@type": "Answer",
        text: item.answer,
      },
    })),
  };
}

/* ── ItemList — Site Navigation / Breadcrumb ─────────────────────────── */
export function buildLearningListJsonLd() {
  return {
    "@context": "https://schema.org",
    "@type": "ItemList",
    "@id": `${SITE_URL}/#itemlist`,
    name: "Memolandum — Vocabulary Games & Tools",
    description:
      "Spaced repetition arcade games, AI translation, word vault, and multilingual study profiles.",
    numberOfItems: 7,
    itemListElement: [
      {
        "@type": "ListItem",
        position: 1,
        name: "AI Instant Translation (Gemini)",
        url: `${SITE_URL}/`,
        description: "Voice & text translation powered by Google Gemini; save to word vault.",
      },
      {
        "@type": "ListItem",
        position: 2,
        name: "Kelime Kasası / Word Vault",
        url: `${SITE_URL}/vocabulary/`,
        description: "Personal vocabulary vault with spaced repetition review.",
      },
      {
        "@type": "ListItem",
        position: 3,
        name: "Liderlik Tablosu / Leaderboard",
        url: `${SITE_URL}/leaderboard/`,
      },
      {
        "@type": "ListItem",
        position: 4,
        name: "Retro Shooter — Kelime Nişancısı",
        url: `${SITE_URL}/games/shooter/`,
      },
      {
        "@type": "ListItem",
        position: 5,
        name: "Breakout — Kelime Kırma",
        url: `${SITE_URL}/games/breakout/`,
      },
      {
        "@type": "ListItem",
        position: 6,
        name: "Highway — Kelime Yolu",
        url: `${SITE_URL}/games/highway/`,
      },
      {
        "@type": "ListItem",
        position: 7,
        name: "Bilimsel Temeller / Scientific Foundations",
        url: `${SITE_URL}/about/`,
        description:
          "Spaced repetition, active recall, dual coding, flow theory, implicit learning — the science behind Memolandum.",
      },
    ],
  };
}
