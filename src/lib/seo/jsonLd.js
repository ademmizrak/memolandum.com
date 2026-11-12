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
  FAQ_ITEMS_AR,
  FAQ_ITEMS_PT,
  OG_IMAGE,
  PRODUCT_COUNTS,
  STUDY_LANGUAGE_NAMES,
} from "../seo/siteConfig";

const { arcadeGames, languagePathways, studyLanguages, translateLanguages, glossaryConcepts, glossaryCategories } =
  PRODUCT_COUNTS;

/* ── Organization (EducationalOrganization & Brand — Google Gemini / Knowledge Graph) ── */
export function buildOrganizationJsonLd() {
  return {
    "@context": "https://schema.org",
    "@type": ["EducationalOrganization", "Organization", "Brand"],
    "@id": `${SITE_URL}/#organization`,
    name: SITE_NAME,
    slogan: "Oyna, Ezberle · Play & Memorize · العب واحفظ · Jogue e Memorize",
    alternateName: [
      "Memolandum",
      "Memolandum Kelime Oyunu",
      "Memolandum Vocabulary Game",
      "Memolandum EdTech",
      "Memolandum Anlık Çeviri",
      "Memolandum KPSS Sözlük",
      "Memolandum Deneme Quizleri (2–8. Sınıf & LGS)",
      "Memolandum — العب واحفظ (تعلّم اللغات بالألعاب)",
      "Memolandum — إتقان الإنجليزية خطوة بخطوة",
      "Memolandum — Jogue e Memorize (Jogos de Vocabulário)",
      "Memolandum — Curso de Inglês do Zero (Explicado em Português)",
    ],
    url: SITE_URL,
    logo: {
      "@type": "ImageObject",
      url: `${SITE_URL}/logo.png`,
      width: 512,
      height: 512,
    },
    image: OG_IMAGE,
    description:
      `Memolandum, ${languagePathways} dil yolunda (/learn) Ebbinghaus aralıklı tekrar (Spaced Repetition / SM-2), active recall ve dual coding yöntemlerini ${arcadeGames} arcade oyun kabuğuyla (Retro Shooter, OrbitLex, Star Cards, Word Board vb.) birleştiren ücretsiz küresel kelime ezberleme platformudur. 1–12. sınıf MEB İngilizce müfredatı, 2–8. sınıf 100 soruluk havuzdan 20 soruluk rastgele yazılı & LGS deneme quizleri (/quiz), Öğretmen Sınıf Masası (/schools), Veli Başarı Karnesi (/veli-rehberi), KPSS akademik sözlük (~${glossaryConcepts} kavram) ve Gemini Anlık Çeviri dahildir.`,
    foundingLocation: {
      "@type": "Place",
      name: "Ankara, Türkiye",
      addressCountry: "TR",
    },
    contactPoint: {
      "@type": "ContactPoint",
      email: "info@memolandum.com",
      contactType: "customer support",
      availableLanguage: ["Turkish", "English", "Arabic", "Portuguese", "Portuguese (Brazil)"],
    },
    areaServed: [
      "TR", "IQ", "SA", "EG", "AE", "KW", "QA", "JO", "MA", "DZ", "TN",
      "BR", "PT", "MX", "CO", "AR", "ID", "VN", "PL", "US", "GB", "DE", "KR", "JP", "Global",
    ],
    sameAs: [
      "https://www.youtube.com/@memolandum",
      "https://www.instagram.com/memolandum",
      "https://www.linkedin.com/company/memolandum",
      "https://kreosus.com/httpsmemolandumcom/about",
      "https://github.com/ademmizrak/memolandum.com",
    ],
    knowsAbout: [
      "Spaced Repetition",
      "Ebbinghaus Forgetting Curve",
      "SM-2 Memory Algorithm",
      "Active Recall",
      "Dual Coding Theory",
      "Flow Theory",
      "Gamified Learning",
      "Vocabulary Acquisition",
      "Language Learning",
      "IELTS & TOEFL Academic Vocabulary",
      "YDS & YKS English Preparation",
      "LGS & Grades 1-12 English Curriculum",
      "Grades 2-8 & LGS English Practice Quizzes (20 Random Questions from 100-Question Pools)",
      "KPSS Exam Preparation",
      "Instant AI Translation",
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
      "Memolandum تعلم المفردات بالألعاب",
      "Memolandum aprender vocabulário jogando",
      "Memolandum aprender inglês jogando grátis",
    ],
    url: `${SITE_URL}/`,
    inLanguage: ["tr", "en", "ar", "pt", "pt-BR"],
    description: DEFAULT_DESCRIPTION,
    publisher: { "@id": `${SITE_URL}/#organization` },
    potentialAction: {
      "@type": "SearchAction",
      target: `${SITE_URL}/sozluk/?q={search_term_string}`,
      "query-input": "required name=search_term_string",
    },
  };
}

/* ── SoftwareApplication / WebApplication (Educational & Game Application) ── */
export function buildSoftwareAppJsonLd() {
  return {
    "@context": "https://schema.org",
    "@type": ["WebApplication", "SoftwareApplication", "MobileApplication"],
    "@id": `${SITE_URL}/#app`,
    name: SITE_NAME,
    applicationCategory: ["EducationalApplication", "GameApplication"],
    applicationSubCategory: "LanguageLearning",
    operatingSystem: "Web, iOS, Android",
    browserRequirements: "Requires HTML5 Canvas and JavaScript",
    url: `${SITE_URL}/`,
    image: OG_IMAGE,
    description:
      `Free vocabulary memorization app with ${arcadeGames} arcade game shells (Retro Shooter, OrbitLex, Star Cards, Word Board, Breakout, Highway, Invaders, Word Ascent, Word Drop, Hangman, Word Snake, Word Card) across ${languagePathways} language pathways (${studyLanguages} study languages). Built on Ebbinghaus Spaced Repetition (SM-2) and Gamified Active Recall. Includes Grades 1–12 MEB curriculum, Grades 2–8 & LGS 20-question random practice quizzes (/quiz/), IELTS/TOEFL/YDS academic sets, KPSS glossary (~${glossaryConcepts} concepts), and Gemini Instant Translation in ${translateLanguages} languages.`,
    offers: {
      "@type": "Offer",
      price: "0",
      priceCurrency: "TRY",
      availability: "https://schema.org/InStock",
      description: "Core games, language pathways, KPSS glossary free; Instant Translation has free quota then Premium.",
    },
    featureList: [
      "Ebbinghaus Spaced Repetition Algorithm (Memolandum Pulse™ / SM-2)",
      "Gamified Active Recall Arcade Games",
      "Grades 2–8 & LGS Multiple-Choice Practice Quizzes — 20 Random Questions from 100-Question Curriculum Pools (/quiz/)",
      "Retro Shooter — Cyberpunk Vocabulary Space Shooter (/games/shooter/)",
      "OrbitLex — Orbital Platformer & Synonym/Antonym Reflex Game (/games/orbitlex/)",
      "Star Trio Cards — 3-Card Illustrated Audio Game (/games/star-cards/)",
      "Wooden Word Board — Garden Mode 8-Card Matching (/games/word-board/)",
      `${languagePathways} Language Pathways Worldwide (/learn/)`,
      `${studyLanguages} Study Languages (EN, TR, AR, PT-BR, DE, FR, ES, IT, RU, KO, JA, ZH, EL)`,
      "Gemini Instant Translation Studio (Anlık Çeviri) in 14 Languages",
      "KPSS & Academic Glossary (~4,000 Concepts in 10 Categories)",
      "Grades 1–12 MEB English Curriculum (57 Playable Units) + IELTS / TOEFL / YDS / ENEM",
      "Memolandum for Schools — Teacher Classroom Desk & 6-Digit Class Code (/schools/)",
      "Zero-PII KVKK Student Nickname & Avatar Shield",
      "Parent Achievement Report Card & Printable Fridge Vocabulary Sheet (/veli-rehberi/)",
      "Dinner-Table 3-Word Family Game with Phonetic Hints & Slow Audio Coach",
      "Smart Mistake Notebook (Akıllı Hata Defteri)",
    ],
    inLanguage: [
      "tr", "en", "ar", "ar-IQ", "ar-SA", "ar-EG", "pt", "pt-BR",
      "de", "fr", "es", "it", "ru", "ko", "ja", "zh", "el", "ota",
    ],
    educationalLevel:
      "Primary School (Grades 1–4), Middle School (Grades 5–8 & LGS), High School (Grades 9–12), YKS/YDT, YDS/YÖKDİL, IELTS, TOEFL, KPSS, ENEM, Adult Language Learning (A1–C2)",
    audience: {
      "@type": "Audience",
      audienceType:
        "Language Learners, Students (Grades 1–12), English Teachers, Parents, IELTS/TOEFL/YDS/ENEM/KPSS Candidates",
    },
    aggregateRating: {
      "@type": "AggregateRating",
      ratingValue: "4.8",
      bestRating: "5",
      worstRating: "1",
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
    name: `Memolandum — Vocabulary Arcade Games (Retro Shooter, OrbitLex & ${arcadeGames} Arcade Shells)`,
    genre: ["Educational Game", "Arcade", "Word Game", "Space Shooter", "Platformer"],
    playMode: "SinglePlayer",
    applicationCategory: ["GameApplication", "EducationalApplication"],
    operatingSystem: "Web, iOS, Android",
    description:
      `${arcadeGames} arcade vocabulary games (Retro Shooter, OrbitLex, Breakout, Highway, Siberian Invaders, Word Ascent, Word Drop, Retro Hangman, Word Snake, Star Trio Cards, Wooden Word Board, Word Card) + Quiz & Lexicon modes — ${languagePathways} language pathways and KPSS academic concepts powered by Ebbinghaus spaced repetition.`,
    url: `${SITE_URL}/games/`,
    image: OG_IMAGE,
    author: { "@id": `${SITE_URL}/#organization` },
    publisher: { "@id": `${SITE_URL}/#organization` },
    offers: {
      "@type": "Offer",
      price: "0.00",
      priceCurrency: "TRY",
      availability: "https://schema.org/InStock",
    },
    gamePlatform: ["Web Browser", "Mobile Web", "Interactive Smartboard"],
    numberOfPlayers: {
      "@type": "QuantitativeValue",
      minValue: 1,
      maxValue: 1,
    },
    educationalAlignment: {
      "@type": "AlignmentObject",
      alignmentType: "educationalSubject",
      targetName:
        "Foreign Language Vocabulary (23 Pathways), Grades 1–12 English, IELTS/TOEFL/YDS/ENEM, KPSS Academic Concepts",
    },
    hasPart: [
      { "@type": ["VideoGame", "LearningResource"], name: "Retro Shooter (Kelime Uzay Nişancısı)", url: `${SITE_URL}/games/shooter/` },
      { "@type": ["VideoGame", "LearningResource"], name: "OrbitLex (Yörünge Platformu & Eş/Zıt Anlamlılar)", url: `${SITE_URL}/games/orbitlex/` },
      { "@type": ["VideoGame", "LearningResource"], name: "Breakout (Kelime Kırma)", url: `${SITE_URL}/games/breakout/` },
      { "@type": ["VideoGame", "LearningResource"], name: "Highway Survivor (Kelime Otoyolu)", url: `${SITE_URL}/games/highway/` },
      { "@type": ["VideoGame", "LearningResource"], name: "Siberian Invaders (Kelime Savunması)", url: `${SITE_URL}/games/invaders/` },
      { "@type": ["VideoGame", "LearningResource"], name: "Word Ascent (Kelime Tırmanışı)", url: `${SITE_URL}/games/wordascent/` },
      { "@type": ["VideoGame", "LearningResource"], name: "Word Drop (Düşen Kelimeler)", url: `${SITE_URL}/games/worddrop/` },
      { "@type": ["VideoGame", "LearningResource"], name: "Retro Hangman (Kelime Tahmin)", url: `${SITE_URL}/games/hangman/` },
      { "@type": ["VideoGame", "LearningResource"], name: "Retro Yılan / Word Snake", url: `${SITE_URL}/games/word-snake/` },
      { "@type": ["VideoGame", "LearningResource"], name: "Star Trio Cards (Yıldız Kartlar)", url: `${SITE_URL}/games/star-cards/` },
      { "@type": ["VideoGame", "LearningResource"], name: "Wooden Word Board (Ahşap Kelime Panosu)", url: `${SITE_URL}/games/word-board/` },
      { "@type": ["VideoGame", "LearningResource"], name: "Word Card (Sesli & Görselli Kelime Kartları)", url: `${SITE_URL}/games/word-card/` },
    ],
  };
}

/* ── LearningResource / Course ───────────────────────────────────────── */
export function buildLearningResourceJsonLd() {
  return {
    "@context": "https://schema.org",
    "@type": ["Course", "LearningResource"],
    "@id": `${SITE_URL}/#course`,
    name: "Arcade Vocabulary Learning — 23 Pathways, Grades 1–12 English & KPSS Glossary",
    description:
      `Learn vocabulary across ${languagePathways} language pathways using Ebbinghaus spaced repetition (SM-2), active recall, and dual coding in ${arcadeGames} arcade game shells (including Retro Shooter and OrbitLex). Includes Grades 1–12 MEB English curriculum, Teacher Classroom management (/schools), Parent Achievement Report Cards (/veli-rehberi), KPSS & academic glossary (~${glossaryConcepts} concepts), and Gemini Instant Translation.`,
    provider: { "@id": `${SITE_URL}/#organization` },
    url: `${SITE_URL}/`,
    inLanguage: [
      "tr", "en", "ar", "ar-IQ", "ar-SA", "ar-EG", "pt", "pt-BR",
      "de", "fr", "es", "it", "ru", "ko", "ja", "zh", "el", "ota",
    ],
    educationalLevel: [
      "Beginner (A1)",
      "Elementary (A2)",
      "Intermediate (B1)",
      "Upper-Intermediate (B2)",
      "Advanced (C1-C2)",
      "Primary School (İlkokul 1–4)",
      "Middle School (Ortaokul 5–8 & LGS)",
      "High School (Lise 9–12)",
      "YDS / YKS / IELTS / TOEFL / ENEM / KPSS",
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
      "Ebbinghaus Spaced Repetition",
      "Active Recall",
      "YDS & IELTS Academic Words",
      "YKS & LGS Exam Words",
      "KPSS Concepts",
      "Primary & Middle School English Vocabulary & Sentences",
      "Instant AI Translation",
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
        name: "OrbitLex — Orbital Platformer & Synonym/Antonym Game",
        url: `${SITE_URL}/games/orbitlex/`,
        courseMode: "online",
      },
      {
        "@type": "CourseInstance",
        name: "Star Trio Cards — 3-Card Audio Vocabulary Game",
        url: `${SITE_URL}/games/star-cards/`,
        courseMode: "online",
      },
      {
        "@type": "CourseInstance",
        name: "Wooden Word Board — Garden Mode Vocabulary Matching",
        url: `${SITE_URL}/games/word-board/`,
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
        name: "Word Card — Grades 1–12 English Flashcards",
        url: `${SITE_URL}/games/word-card/`,
        courseMode: "online",
      },
      {
        "@type": "CourseInstance",
        name: "2–8. Sınıf İngilizce Deneme Quizleri (100 Havuzdan 20 Rastgele Soru)",
        url: `${SITE_URL}/quiz/`,
        courseMode: "online",
      },
      {
        "@type": "CourseInstance",
        name: "8. Sınıf LGS İngilizce Deneme Quizi (100 Soru Havuzu · 20 Soruluk Rastgele Test)",
        url: `${SITE_URL}/quiz/8-sinif/`,
        courseMode: "online",
      },
      {
        "@type": "CourseInstance",
        name: "Memolandum for Schools — Teacher Classroom Desk",
        url: `${SITE_URL}/schools/`,
        courseMode: "online",
      },
      {
        "@type": "CourseInstance",
        name: "Veli Kullanım ve Başarı Karnesi Rehberi",
        url: `${SITE_URL}/veli-rehberi/`,
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
      {
        "@type": "CourseInstance",
        name: "Curso de Inglês do Zero (Explicado em Português) — Brazilian Portuguese to English Video Course",
        url: `${SITE_URL}/videos/?playlist=pt-en`,
        courseMode: "online",
        inLanguage: "pt-BR",
      },
      {
        "@type": "CourseInstance",
        name: "إتقان الإنجليزية خطوة بخطوة — Arabic to English Step-by-Step Video Course",
        url: `${SITE_URL}/videos/?playlist=ar-en`,
        courseMode: "online",
        inLanguage: "ar",
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
export function buildFaqJsonLd(locale = "tr") {
  const isAr = locale === "ar";
  const isPt = locale === "pt";
  const isEn = locale === "en";
  const primary = isAr ? FAQ_ITEMS_AR : isPt ? FAQ_ITEMS_PT : isEn ? FAQ_ITEMS_EN : FAQ_ITEMS;
  const secondary = [
    ...(isPt ? [] : FAQ_ITEMS_PT),
    ...(isAr ? [] : FAQ_ITEMS_AR),
    ...(isEn ? [] : FAQ_ITEMS_EN.slice(0, 3)),
    ...(!isAr && !isPt && !isEn ? [] : FAQ_ITEMS.slice(0, 3)),
  ];
  const items = [...primary, ...secondary];
  return {
    "@context": "https://schema.org",
    "@type": "FAQPage",
    "@id": `${SITE_URL}/#faq`,
    inLanguage: ["tr", "en", "ar", "pt-BR"],
    mainEntity: items.map((item) => ({
      "@type": "Question",
      name: item.question,
      acceptedAnswer: {
        "@type": "Answer",
        text: item.answer,
      },
    })),
  };
}

/* ── ItemList — Site Navigation & Arcade Game Shells ─────────────────── */
export function buildLearningListJsonLd() {
  return {
    "@context": "https://schema.org",
    "@type": "ItemList",
    "@id": `${SITE_URL}/#itemlist`,
    name: `Memolandum — ${arcadeGames} Arcade Vocabulary Games, 23 Language Pathways, Schools, Parent Report Card & Instant Translation`,
    description:
      `${languagePathways} language pathways, ${arcadeGames} arcade game shells (Retro Shooter, OrbitLex, Star Cards, Word Board, etc.), Grades 1–12 MEB curriculum, Teacher Classroom Desk (/schools), Parent Achievement Report Card (/veli-rehberi), KPSS academic glossary, and Gemini Instant Translation.`,
    numberOfItems: 23,
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
        name: "2–8. Sınıf & LGS İngilizce Deneme Quizleri (100 Havuzdan 20 Rastgele Soru)",
        url: `${SITE_URL}/quiz/`,
        description: "2. sınıftan 8. sınıfa (LGS dahil) her sınıf için 100 soruluk müfredat havuzundan anında 20 soruluk rastgele yazılı ve deneme testi.",
      },
      {
        "@type": "ListItem",
        position: 3,
        name: "Okullar & Öğretmen Sınıf Masası / Memolandum for Schools",
        url: `${SITE_URL}/schools/`,
        description: "30-second digital classroom setup, 6-digit class code, 57 MEB/LGS/YDS homework units, zero-PII KVKK student nickname shield.",
      },
      {
        "@type": "ListItem",
        position: 4,
        name: "Veli Kullanım, Karne ve Çocuk Güvenliği Rehberi",
        url: `${SITE_URL}/veli-rehberi/`,
        description: "1-minute parent guide: Achievement Report Card, 3-Word Family Game with phonetic hints & audio, WhatsApp pride templates, 100% ad-free safety.",
      },
      {
        "@type": "ListItem",
        position: 5,
        name: "Öğretmen Güvenlik ve Mahremiyet Rehberi",
        url: `${SITE_URL}/schools/rehber/`,
        description: "Zero-PII classroom privacy, closed-envelope student scores, and smartboard usage guide for teachers.",
      },
      {
        "@type": "ListItem",
        position: 6,
        name: "Anlık Çeviri / Instant Translation Studio (Gemini)",
        url: `${SITE_URL}/translate/`,
        description: `Voice & text instant translation in ${translateLanguages} languages; save to Word Vault.`,
      },
      {
        "@type": "ListItem",
        position: 7,
        name: "KPSS & Akademik Sözlük",
        url: `${SITE_URL}/sozluk/`,
        description: `~${glossaryConcepts} concepts in ${glossaryCategories} categories — KPSS, Medicine, Law, Architecture, Astronomy.`,
      },
      {
        "@type": "ListItem",
        position: 8,
        name: "Kelime Kasası / Word Vault",
        url: `${SITE_URL}/vocabulary/`,
        description: "Personal vocabulary vault with Memolandum Pulse spaced repetition review.",
      },
      {
        "@type": "ListItem",
        position: 9,
        name: "Memolandum Pulse™ — Ebbinghaus Spaced Repetition Method",
        url: `${SITE_URL}/method/`,
        description:
          "How Ebbinghaus spaced repetition and active recall work inside Memolandum arcade games.",
      },
      {
        "@type": "ListItem",
        position: 10,
        name: "Liderlik Tablosu / Leaderboard",
        url: `${SITE_URL}/leaderboard/`,
      },
      {
        "@type": "ListItem",
        position: 11,
        name: "Retro Shooter — Kelime Uzay Nişancısı",
        url: `${SITE_URL}/games/shooter/`,
        description: "Cyberpunk space shooter vocabulary game powered by Ebbinghaus spaced repetition.",
      },
      {
        "@type": "ListItem",
        position: 12,
        name: "OrbitLex — Yörünge Platformu & Eş/Zıt Anlamlılar",
        url: `${SITE_URL}/games/orbitlex/`,
        description: "Orbital arcade platformer for mastering synonyms and antonyms at reflex speed.",
      },
      {
        "@type": "ListItem",
        position: 13,
        name: "Breakout — Kelime Kırma",
        url: `${SITE_URL}/games/breakout/`,
      },
      {
        "@type": "ListItem",
        position: 14,
        name: "Highway Survivor — Kelime Yolu",
        url: `${SITE_URL}/games/highway/`,
      },
      {
        "@type": "ListItem",
        position: 15,
        name: "Siberian Invaders — Kelime Savunması",
        url: `${SITE_URL}/games/invaders/`,
      },
      {
        "@type": "ListItem",
        position: 16,
        name: "Word Ascent & Word Drop — Kelime Tırmanışı & Düşen Kelimeler",
        url: `${SITE_URL}/games/wordascent/`,
      },
      {
        "@type": "ListItem",
        position: 17,
        name: "Retro Hangman & Retro Yılan (Word Snake)",
        url: `${SITE_URL}/games/word-snake/`,
      },
      {
        "@type": "ListItem",
        position: 18,
        name: "Word Card, Star Trio Cards & Ahşap Kelime Panosu (Word Board)",
        url: `${SITE_URL}/games/word-card/`,
      },
      {
        "@type": "ListItem",
        position: 19,
        name: "Eğitici 3D Animasyon Videoları (@memolandum YouTube)",
        url: `${SITE_URL}/videos/`,
      },
      {
        "@type": "ListItem",
        position: 20,
        name: "Bilimsel Temeller / Scientific Foundations",
        url: `${SITE_URL}/about/`,
        description:
          "Spaced repetition, active recall, dual coding, flow theory, implicit learning — the science behind Memolandum.",
      },
      {
        "@type": "ListItem",
        position: 21,
        name: "Premium — Anlık Çeviri Kota",
        url: `${SITE_URL}/premium/`,
      },
      {
        "@type": "ListItem",
        position: 22,
        name: "Privacy Policy & Terms of Service",
        url: `${SITE_URL}/legal/privacy/`,
        description: "How Memolandum processes account, learning, and translation data.",
      },
      {
        "@type": "ListItem",
        position: 23,
        name: "My Lexicon — Kart Destesi",
        url: `${SITE_URL}/my-lexicon/`,
      },
    ],
  };
}

/* ── Unified @graph Knowledge Graph for Google Gemini & AI Overviews ──── */
export function buildKnowledgeGraphJsonLd() {
  const stripContext = (obj) => {
    const copy = { ...obj };
    delete copy["@context"];
    return copy;
  };
  return {
    "@context": "https://schema.org",
    "@graph": [
      stripContext(buildOrganizationJsonLd()),
      stripContext(buildWebSiteJsonLd()),
      stripContext(buildSoftwareAppJsonLd()),
      stripContext(buildVideoGameJsonLd()),
      stripContext(buildLearningResourceJsonLd()),
      stripContext(buildLearningListJsonLd()),
    ],
  };
}

/* ── Schools & Teacher Guide JSON-LD ─────────────────────────────────── */
export function buildSchoolsPageJsonLd() {
  return [
    {
      "@context": "https://schema.org",
      "@type": "BreadcrumbList",
      itemListElement: [
        { "@type": "ListItem", position: 1, name: "Ana Sayfa", item: `${SITE_URL}/` },
        { "@type": "ListItem", position: 2, name: "Okullar & Öğretmen Masası", item: `${SITE_URL}/schools/` },
      ],
    },
    {
      "@context": "https://schema.org",
      "@type": "FAQPage",
      "@id": `${SITE_URL}/schools/#faq`,
      inLanguage: "tr",
      mainEntity: [
        {
          "@type": "Question",
          name: "Memolandum Öğretmen Sınıf Masası ve EBA / ETAP Akıllı Tahta modu nasıl kurulur?",
          acceptedAnswer: {
            "@type": "Answer",
            text: "İngilizce öğretmenleri /schools veya /akilli-tahta sayfasından üyelik gerektirmeden akıllı tahtada tam ekran (Full Screen) kelime oyunlarını başlatabilir veya 30 saniyede ücretsiz sınıf oluşturup 6 haneli sınıf kodunu (MEMO-...) paylaşarak Türkiye Yüzyılı Maarif Modeli 1–12. sınıf MEB üniteleri, LGS, YDS, YÖKDİL ve IELTS listesinden ödev atayabilir.",
          },
        },
        {
          "@type": "Question",
          name: "Öğrencilerin kişisel verileri (KVKK) nasıl korunur?",
          acceptedAnswer: {
            "@type": "Answer",
            text: "Memolandum Sıfır Kişisel Veri (Zero-PII) ilkesiyle çalışır: öğrencilerin gerçek soyadı, TC kimlik numarası, telefonu veya gerçek okul adı zorunlu değildir. Öğrenciler sınıfa rumuz ve avatarla katılır; sınav notları kapalı zarf mimarisiyle yalnızca öğretmene görünür.",
          },
        },
      ],
    },
  ];
}

/* ── Veli Rehberi (/veli-rehberi) JSON-LD ────────────────────────────── */
export function buildParentGuideJsonLd() {
  return [
    {
      "@context": "https://schema.org",
      "@type": "BreadcrumbList",
      itemListElement: [
        { "@type": "ListItem", position: 1, name: "Ana Sayfa", item: `${SITE_URL}/` },
        { "@type": "ListItem", position: 2, name: "Veli Kullanım ve Güven Rehberi", item: `${SITE_URL}/veli-rehberi/` },
      ],
    },
    {
      "@context": "https://schema.org",
      "@type": "FAQPage",
      "@id": `${SITE_URL}/veli-rehberi/#faq`,
      inLanguage: "tr",
      mainEntity: [
        {
          "@type": "Question",
          name: "İngilizce bilmeyen bir veli çocuğuna Memolandum ile nasıl yardımcı olabilir?",
          acceptedAnswer: {
            "@type": "Answer",
            text: "Veli Karnesi içindeki 'Evde 3 Kelime & Mesaj' sekmesi, çocuğunuzun çalıştığı kelimelerden her gün 3 tanesini Türkçe anlamı, Türkçe okunuşu (Örn: Apple → ep-ıl → Elma) ve sesli dinleme (🔊) tuşuyla hazır sunar. Böylece hiç İngilizce bilmeseniz bile akşam yemeğinde 1 dakikalık eğlenceli bir aile oyunu oynayabilirsiniz.",
          },
        },
        {
          "@type": "Question",
          name: "Veli Başarı Karnesi'nde hangi bilgiler yer alır?",
          acceptedAnswer: {
            "@type": "Answer",
            text: "Veli Karnesi'nde çocuğunuzun toplam kelime dağarcığı, kalıcı hafızaya aldığı kelimeler (sesli telaffuzlarıyla), doğruluk oranı (%), son 7 günlük çalışma ritmi ve zorlandığı kelimeleri gösteren Akıllı Hata Defteri yer alır. Karne tek tuşla PNG resim olarak indirilebilir veya WhatsApp'tan paylaşılabilir.",
          },
        },
        {
          "@type": "Question",
          name: "Memolandum çocuklar için güvenli ve ücretsiz mi?",
          acceptedAnswer: {
            "@type": "Answer",
            text: "Evet. Memolandum %100 reklamsızdır, yabancı kişilerle sohbet özelliği içermez, gerçek soyadı veya TC kimlik numarası istemez ve 1–12. sınıf MEB okul müfredatı ile tüm eğitici oyunlar tamamen ücretsizdir.",
          },
        },
      ],
    },
  ];
}
