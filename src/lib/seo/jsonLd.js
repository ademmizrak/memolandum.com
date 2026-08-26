/**
 * Memolandum JSON-LD Schema Builder
 * Kapsamlı structured data — Google, Bing, AI asistanlar (GEO) için optimize edilmiş
 * 23 dil yolu · KPSS sözlük · Anlık Çeviri
 */
import {
  SITE_URL,
  SITE_NAME,
  DEFAULT_DESCRIPTION,
  FAQ_ITEMS,
  FAQ_ITEMS_EN,
  OG_IMAGE,
  PRODUCT_COUNTS,
  STUDY_LANGUAGE_NAMES,
} from "../seo/siteConfig";

const { arcadeGames, languagePathways, studyLanguages, translateLanguages, glossaryConcepts, glossaryCategories } =
  PRODUCT_COUNTS;

/* ── Organization ──────────────────────────────────────────────────────── */
export function buildOrganizationJsonLd() {
  return {
    "@context": "https://schema.org",
    "@type": "Organization",
    "@id": `${SITE_URL}/#organization`,
    name: SITE_NAME,
    alternateName: [
      "Memolandum Kelime Oyunu",
      "Memolandum Vocabulary Game",
      "Memolandum Anlık Çeviri",
      "Memolandum KPSS Sözlük",
    ],
    url: SITE_URL,
    logo: {
      "@type": "ImageObject",
      url: `${SITE_URL}/favicon.ico`,
      width: 512,
      height: 512,
    },
    image: OG_IMAGE,
    description:
      `Memolandum, ${languagePathways} dil yolunda (/learn) spaced repetition, active recall ve dual coding yöntemlerini arcade oyunlarla birleştiren ücretsiz kelime ezberleme platformudur. KPSS akademik sözlük ve Gemini Anlık Çeviri dahildir. Öğrenme bedava; Anlık Çeviri Premium.`,
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
      "KPSS Exam Preparation",
      "Instant Translation",
      "Multilingual Vocabulary",
      ...STUDY_LANGUAGE_NAMES.en,
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
      "Memolandum Anlık Çeviri",
      "Memolandum KPSS Sözlük",
      "Memolandum spaced repetition",
      "Memolandum vocabulary game",
    ],
    url: `${SITE_URL}/`,
    inLanguage: ["tr", "en"],
    description: DEFAULT_DESCRIPTION,
    publisher: { "@id": `${SITE_URL}/#organization` },
    potentialAction: {
      "@type": "SearchAction",
      target: `${SITE_URL}/sozluk/?q={search_term_string}`,
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
      `Free vocabulary memorization app with ${arcadeGames} arcade games across ${languagePathways} language pathways (${studyLanguages} study languages). KPSS & academic glossary (~${glossaryConcepts} concepts). Gemini Instant Translation in ${translateLanguages} languages. Spaced repetition and Word Vault included.`,
    offers: {
      "@type": "Offer",
      price: "0",
      priceCurrency: "TRY",
      availability: "https://schema.org/InStock",
      description: "Core games, language pathways, KPSS glossary free; Instant Translation has free quota then Premium.",
    },
    featureList: [
      "Spaced Repetition Algorithm (Memolandum Pulse)",
      "Active Recall Arcade Games",
      `${languagePathways} Language Pathways Worldwide`,
      `${studyLanguages} Study Languages`,
      "Gemini Instant Translation Studio (Anlık Çeviri)",
      `${translateLanguages} Instant Translation Target Languages`,
      "KPSS & Academic Glossary",
      `~${glossaryConcepts} Academic Concepts in ${glossaryCategories} Categories`,
      "Personal Word Vault",
      "Multi-language Study Profiles",
      "Leaderboard",
      "Voice Input Translation",
      "A1–Advanced Level Word Sets",
      "YDS / YKS Exam Word Lists",
      "MEB Primary School English (Grades 1–4 Words, 2–4 Sentences)",
      "Word Card Flashcards with Audio",
    ],
    inLanguage: ["tr", "en", "de", "fr", "es", "it", "ru", "pt", "ko", "ja", "zh", "ar", "el"],
    educationalLevel: "Beginner to Advanced, Exam prep, KPSS, MEB Primary (İlkokul)",
    audience: {
      "@type": "Audience",
      audienceType:
        "Language Learners, Students, Exam Candidates, KPSS Candidates, Primary School Students & Parents (MEB)",
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
      `${arcadeGames} arcade vocabulary games (Shooter, Breakout, Highway, Invaders, Word Ascent, Word Drop, Hangman, Word Snake) + Quiz & Lexicon modes — ${languagePathways} language pathways and KPSS academic concepts powered by spaced repetition.`,
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
      targetName:
        "Foreign Language Vocabulary, KPSS Academic Concepts, MEB Primary English (Turkey)",
    },
  };
}

/* ── LearningResource / Course ───────────────────────────────────────── */
export function buildLearningResourceJsonLd() {
  return {
    "@context": "https://schema.org",
    "@type": "Course",
    "@id": `${SITE_URL}/#course`,
    name: "Arcade Vocabulary Learning — 23 Pathways, MEB İlkokul & KPSS Glossary",
    description:
      `Learn vocabulary across ${languagePathways} language pathways using spaced repetition, active recall, and dual coding in ${arcadeGames} arcade games. Includes Turkey MEB primary-school English (grades 1–4 words, grades 2–4 sentences), KPSS & academic glossary (~${glossaryConcepts} concepts), and Gemini Instant Translation.`,
    provider: { "@id": `${SITE_URL}/#organization` },
    url: `${SITE_URL}/`,
    inLanguage: ["tr", "en", "de", "fr", "es", "it", "ru", "pt", "ko", "ja", "zh", "ar", "el"],
    educationalLevel: [
      "Beginner",
      "Elementary",
      "Intermediate",
      "Upper-Intermediate",
      "Advanced",
      "KPSS",
      "MEB Primary School (İlkokul)",
    ],
    teaches: [
      "English Vocabulary",
      "German Vocabulary",
      "French Vocabulary",
      "Spanish Vocabulary",
      "Russian Vocabulary",
      "Korean Vocabulary",
      "Portuguese Vocabulary",
      "Greek Vocabulary",
      "Italian Vocabulary",
      "Japanese Vocabulary",
      "Arabic Vocabulary",
      "Chinese Vocabulary",
      "Spaced Repetition",
      "Active Recall",
      "YDS Exam Words",
      "YKS Exam Words",
      "KPSS Concepts",
      "MEB Primary English Vocabulary",
      "MEB Primary English Sentences",
      "Instant Translation",
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
      {
        "@type": "CourseInstance",
        name: "Retro Hangman — Vocabulary Guessing",
        url: `${SITE_URL}/games/hangman/`,
        courseMode: "online",
      },
      {
        "@type": "CourseInstance",
        name: "Retro Yılan — Vocabulary Snake Game",
        url: `${SITE_URL}/games/word-snake/`,
        courseMode: "online",
      },
      {
        "@type": "CourseInstance",
        name: "Word Card — MEB Primary English Flashcards",
        url: `${SITE_URL}/games/word-card/`,
        courseMode: "online",
      },
      {
        "@type": "CourseInstance",
        name: "MEB İlkokul English — Grades 1–4",
        url: `${SITE_URL}/learn/en-tr/`,
        courseMode: "online",
      },
      {
        "@type": "CourseInstance",
        name: "KPSS & Academic Glossary",
        url: `${SITE_URL}/sozluk/`,
        courseMode: "online",
      },
      {
        "@type": "CourseInstance",
        name: "Gemini Instant Translation Studio",
        url: `${SITE_URL}/translate/`,
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
    name: "Memolandum — Vocabulary Games, KPSS Glossary & Instant Translation",
    description:
      `${languagePathways} language pathways, spaced repetition arcade games, Gemini Instant Translation (Anlık Çeviri), KPSS academic glossary, Word Vault, and Pulse method.`,
    numberOfItems: 14,
    itemListElement: [
      {
        "@type": "ListItem",
        position: 1,
        name: "23 Dil Yolu / Language Pathways",
        url: `${SITE_URL}/learn/`,
        description: `${languagePathways} language pathways with dedicated SEO landing pages and arcade deep-links.`,
      },
      {
        "@type": "ListItem",
        position: 2,
        name: "Anlık Çeviri / Instant Translation Studio (Gemini)",
        url: `${SITE_URL}/translate/`,
        description: `Voice & text instant translation in ${translateLanguages} languages; save to Word Vault.`,
      },
      {
        "@type": "ListItem",
        position: 3,
        name: "KPSS & Akademik Sözlük",
        url: `${SITE_URL}/sozluk/`,
        description: `~${glossaryConcepts} concepts in ${glossaryCategories} categories — KPSS, Medicine, Law, Architecture, Astronomy.`,
      },
      {
        "@type": "ListItem",
        position: 4,
        name: "Kelime Kasası / Word Vault",
        url: `${SITE_URL}/vocabulary/`,
        description: "Personal vocabulary vault with Memolandum Pulse spaced repetition review.",
      },
      {
        "@type": "ListItem",
        position: 5,
        name: "Memolandum Pulse™ — Learning Method",
        url: `${SITE_URL}/method/`,
        description:
          "How spaced repetition and active recall work inside Memolandum arcade games.",
      },
      {
        "@type": "ListItem",
        position: 6,
        name: "Liderlik Tablosu / Leaderboard",
        url: `${SITE_URL}/leaderboard/`,
      },
      {
        "@type": "ListItem",
        position: 7,
        name: "Retro Shooter — Kelime Nişancısı",
        url: `${SITE_URL}/games/shooter/`,
      },
      {
        "@type": "ListItem",
        position: 8,
        name: "Breakout — Kelime Kırma",
        url: `${SITE_URL}/games/breakout/`,
      },
      {
        "@type": "ListItem",
        position: 9,
        name: "Highway — Kelime Yolu",
        url: `${SITE_URL}/games/highway/`,
      },
      {
        "@type": "ListItem",
        position: 10,
        name: "Bilimsel Temeller / Scientific Foundations",
        url: `${SITE_URL}/about/`,
        description:
          "Spaced repetition, active recall, dual coding, flow theory, implicit learning — the science behind Memolandum.",
      },
      {
        "@type": "ListItem",
        position: 11,
        name: "Premium — Anlık Çeviri Kota",
        url: `${SITE_URL}/premium/`,
      },
      {
        "@type": "ListItem",
        position: 12,
        name: "Privacy Policy / Gizlilik Politikası",
        url: `${SITE_URL}/legal/privacy/`,
        description: "How Memolandum processes account, learning, and translation data.",
      },
      {
        "@type": "ListItem",
        position: 13,
        name: "Terms of Service / Kullanım Koşulları",
        url: `${SITE_URL}/legal/terms/`,
      },
      {
        "@type": "ListItem",
        position: 14,
        name: "My Lexicon — Kart Destesi",
        url: `${SITE_URL}/my-lexicon/`,
      },
    ],
  };
}
