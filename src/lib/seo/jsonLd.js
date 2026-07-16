import {
  SITE_URL,
  SITE_NAME,
  DEFAULT_DESCRIPTION,
  FAQ_ITEMS,
  FAQ_ITEMS_EN,
  OG_IMAGE,
} from "../seo/siteConfig";

export function buildFaqJsonLd() {
  const all = [...FAQ_ITEMS, ...FAQ_ITEMS_EN];
  return {
    "@context": "https://schema.org",
    "@type": "FAQPage",
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

export function buildOrganizationJsonLd() {
  return {
    "@context": "https://schema.org",
    "@type": "Organization",
    name: SITE_NAME,
    url: SITE_URL,
    logo: `${SITE_URL}/favicon.ico`,
    description: DEFAULT_DESCRIPTION,
    sameAs: [],
  };
}

export function buildWebSiteJsonLd() {
  return {
    "@context": "https://schema.org",
    "@type": "WebSite",
    name: SITE_NAME,
    alternateName: [
      "Memolandum Oyna Ezberle",
      "Memolandum kelime oyunu",
      "Memolandum AI çeviri",
    ],
    url: `${SITE_URL}/`,
    inLanguage: ["tr", "en"],
    description: DEFAULT_DESCRIPTION,
    potentialAction: {
      "@type": "SearchAction",
      target: `${SITE_URL}/?q={search_term_string}`,
      "query-input": "required name=search_term_string",
    },
  };
}

export function buildSoftwareAppJsonLd() {
  return {
    "@context": "https://schema.org",
    "@type": "SoftwareApplication",
    name: SITE_NAME,
    applicationCategory: "EducationalApplication",
    applicationSubCategory: "LanguageLearning",
    operatingSystem: "Web, iOS, Android",
    browserRequirements: "Requires HTML5 Canvas and JavaScript",
    url: `${SITE_URL}/`,
    image: OG_IMAGE,
    description: DEFAULT_DESCRIPTION,
    offers: {
      "@type": "Offer",
      price: "0",
      priceCurrency: "TRY",
    },
    featureList: [
      "Arcade kelime oyunları",
      "Gemini anlık çeviri",
      "Kelime kasası",
      "Dil bazlı öğrenme profilleri",
      "Liderlik tablosu",
      "Misafir ve üye oyun",
    ],
    inLanguage: ["tr", "en", "de", "ru", "ko", "fr", "es", "pt", "el", "it", "ja", "ar", "zh"],
    educationalLevel: "Beginner to Advanced, Exam prep",
  };
}

export function buildVideoGameJsonLd() {
  return {
    "@context": "https://schema.org",
    "@type": "VideoGame",
    name: SITE_NAME,
    genre: ["Educational Game", "Arcade"],
    playMode: "SinglePlayer",
    applicationCategory: "Game",
    operatingSystem: "Web, iOS, Android",
    description: DEFAULT_DESCRIPTION,
    url: `${SITE_URL}/`,
    image: OG_IMAGE,
    author: { "@type": "Organization", name: "Memolandum Team" },
    offers: {
      "@type": "Offer",
      price: "0.00",
      priceCurrency: "TRY",
    },
    gamePlatform: ["Web Browser", "Mobile Web"],
  };
}

export function buildLearningListJsonLd() {
  return {
    "@context": "https://schema.org",
    "@type": "ItemList",
    name: "Memolandum kelime ve oyun yolları",
    description:
      "Seviye bazlı kelime listeleri ve arcade öğrenme oyunları.",
    itemListElement: [
      {
        "@type": "ListItem",
        position: 1,
        name: "Anlık AI Çeviri",
        url: `${SITE_URL}/`,
        description: "Gemini ile metin ve sesli çeviri; kasaya kaydetme.",
      },
      {
        "@type": "ListItem",
        position: 2,
        name: "Kelime Kasası",
        url: `${SITE_URL}/vocabulary/`,
      },
      {
        "@type": "ListItem",
        position: 3,
        name: "Liderlik",
        url: `${SITE_URL}/leaderboard/`,
      },
      {
        "@type": "ListItem",
        position: 4,
        name: "Retro Shooter",
        url: `${SITE_URL}/games/shooter/`,
      },
      {
        "@type": "ListItem",
        position: 5,
        name: "Breakout",
        url: `${SITE_URL}/games/breakout/`,
      },
      {
        "@type": "ListItem",
        position: 6,
        name: "Dil Profilleri",
        url: `${SITE_URL}/profile/`,
        description: "Aynı hesapta birden fazla dil öğrenme profili.",
      },
      {
        "@type": "ListItem",
        position: 7,
        name: "Hakkımızda / About Science",
        url: `${SITE_URL}/about/`,
        description: "Scientific foundations: spaced repetition, dual coding, flow, active recall.",
      },
    ],
  };
}
