import AboutClient from "./AboutClient";
import { absoluteUrl, OG_IMAGE, SITE_URL, SITE_NAME } from "../../lib/seo/siteConfig";

/* ── Page Metadata ──────────────────────────────────────────────────── */
export const metadata = {
  title:
    "Memolandum — Bilim, Vizyon & AI Branş Öğretmenleri | About",
  description:
    "Bilimsel temeller + ürün yolu: 23 dil yolu, KPSS, Gemini Anlık Çeviri bugün canlı. Sonraki katman: AI branş öğretmenleri (dil, KPSS, akademik) — kişisel lexikon + adaptive öğrenme.",
  keywords: [
    // TR
    "kelime ezberleme bilimi",
    "spaced repetition nedir",
    "active recall nedir",
    "aralıklı tekrar yöntemi",
    "ebbinghaus unutma eğrisi",
    "çift kodlama teorisi",
    "flow teorisi öğrenme",
    "implicit learning türkçe",
    "bilimsel kelime ezberleme",
    "memolandum hakkında",
    "KPSS kelime ezberleme bilimi",
    "anlık çeviri öğrenme",
    "AI branş öğretmeni",
    "memolandum roadmap",
    // EN
    "spaced repetition vocabulary science",
    "active recall language learning",
    "dual coding theory",
    "flow theory vocabulary",
    "ebbinghaus forgetting curve app",
    "implicit learning vocabulary acquisition",
    "vocabulary memorization neuroscience",
    "about memolandum",
    "memory science language learning",
    "cognitive vocabulary training",
    "23 language pathways",
    "KPSS glossary science",
    "AI branch teachers Gemini",
    "adaptive learning roadmap",
  ],
  alternates: {
    canonical: absoluteUrl("/about"),
    languages: {
      tr: absoluteUrl("/about"),
      en: `${SITE_URL}/about/?lang=en`,
      "x-default": absoluteUrl("/about"),
    },
  },
  openGraph: {
    title:
      "Memolandum — Bilimsel Temeller | 23 Dil · KPSS · Anlık Çeviri",
    description:
      "Ebbinghaus (1885), Allan Paivio (1971), Csikszentmihalyi (Flow), Roediger & Karpicke (2006) — 23 dil yolunda kelime ezberleme bilimi. KPSS sözlük & Gemini Instant Translation.",
    url: absoluteUrl("/about"),
    images: [
      {
        url: OG_IMAGE,
        width: 1200,
        height: 630,
        alt: "Memolandum Scientific Foundations — Spaced Repetition & Active Recall",
      },
    ],
    locale: "tr_TR",
    alternateLocale: ["en_US"],
    type: "article",
    siteName: SITE_NAME,
  },
  twitter: {
    card: "summary_large_image",
    title: "The Science Behind Memolandum — 23 Pathways · KPSS · Instant Translation",
    description:
      "Spaced repetition, active recall, dual coding & flow theory — proven memory science in arcade games. 23 language pathways, KPSS glossary, Instant Translation.",
    images: [OG_IMAGE],
  },
};

/* ── JSON-LD: AboutPage ──────────────────────────────────────────────── */
const aboutJsonLd = {
  "@context": "https://schema.org",
  "@type": "AboutPage",
  "@id": `${SITE_URL}/about/#aboutpage`,
  name: "Memolandum — Bilimsel Temeller / Scientific Foundations",
  url: absoluteUrl("/about"),
  inLanguage: ["tr", "en"],
  description:
    "Scientific foundations of Memolandum: 23 language pathways, KPSS academic glossary, Instant Translation (Anlık Çeviri), spaced repetition, active recall, dual coding, and flow theory.",
  isPartOf: {
    "@type": "WebSite",
    name: SITE_NAME,
    url: `${SITE_URL}/`,
  },
  publisher: {
    "@type": "Organization",
    name: "Memolandum Team",
    url: SITE_URL,
  },
  mainEntity: {
    "@type": "EducationalOrganization",
    name: SITE_NAME,
    description:
      "Free arcade vocabulary platform with 23 language pathways, KPSS & academic glossary (~4,000 concepts), and Gemini Instant Translation in 14 languages. UI in Turkish and English.",
    url: `${SITE_URL}/`,
    sameAs: [`${SITE_URL}/about/`],
  },
  mentions: [
    {
      "@type": "Person",
      name: "Hermann Ebbinghaus",
      description: "Psychologist who discovered the Forgetting Curve (1885)",
    },
    {
      "@type": "Person",
      name: "Allan Paivio",
      description: "Developed Dual-Coding Theory (1971)",
    },
    {
      "@type": "Person",
      name: "Mihaly Csikszentmihalyi",
      description: "Formulated Flow Theory",
    },
    {
      "@type": "Person",
      name: "Arthur Reber",
      description: "Discovered Implicit Learning (1967)",
    },
    {
      "@type": "Person",
      name: "Henry Roediger",
      description: "Co-authored the Testing Effect study (Science, 2006)",
    },
    {
      "@type": "Person",
      name: "Jeffrey Karpicke",
      description: "Co-authored the Testing Effect study (Science, 2006)",
    },
  ],
};

/* ── JSON-LD: FAQPage — About sayfasına özel ─────────────────────────── */
const aboutFaqJsonLd = {
  "@context": "https://schema.org",
  "@type": "FAQPage",
  "@id": `${SITE_URL}/about/#faq`,
  inLanguage: ["tr", "en"],
  mainEntity: [
    {
      "@type": "Question",
      name: "Memolandum hangi bilimsel yöntemleri kullanır?",
      acceptedAnswer: {
        "@type": "Answer",
        text: "Memolandum; örtük öğrenme (Arthur Reber, 1967), aralıklı tekrar — Ebbinghaus unutma eğrisi (1885), çift kodlama teorisi (Allan Paivio, 1971), flow teorisi (Mihaly Csikszentmihalyi), aktif hatırlama (Roediger & Karpicke, Science, 2006) ve bilişsel ağ güçlendirme (Anderson & Reder) yöntemlerini doğrudan arcade oyun mekaniğine entegre eder.",
      },
    },
    {
      "@type": "Question",
      name: "Spaced repetition (aralıklı tekrar) nedir?",
      acceptedAnswer: {
        "@type": "Answer",
        text: "Hermann Ebbinghaus'un 1885'te keşfettiği Unutma Eğrisi'ne karşı geliştirilen bilimsel tekrarlama yöntemidir. Memolandum algoritmaları bir kelimeyi unutmak üzere olduğunuz kritik anda tekrar karşınıza çıkarır ve kelimeleri kısa süreli bellekten kalıcı hafızaya taşır.",
      },
    },
    {
      "@type": "Question",
      name: "Active recall nedir ve nasıl çalışır?",
      acceptedAnswer: {
        "@type": "Answer",
        text: "Roediger ve Karpicke'nin 2006'da Science dergisinde yayımladığı araştırma, bilgiyi aktif olarak geri çağırmanın pasif okumaya göre %50 daha kalıcı öğrenme sağladığını kanıtladı. Memolandum'un arcade oyunları bu mekanizmayı doğrudan uygular.",
      },
    },
    {
      "@type": "Question",
      name: "What science is behind Memolandum?",
      acceptedAnswer: {
        "@type": "Answer",
        text: "Memolandum is built on six cognitive science pillars: implicit learning (Arthur Reber, 1967), spaced repetition based on Ebbinghaus Forgetting Curve (1885), dual coding theory (Allan Paivio, 1971), flow theory and gamification (Mihaly Csikszentmihalyi), active recall — the testing effect (Roediger & Karpicke, Science, 2006), and cognitive network building versus AI translator dependency (Anderson & Reder).",
      },
    },
    {
      "@type": "Question",
      name: "What is implicit learning in vocabulary memorization?",
      acceptedAnswer: {
        "@type": "Answer",
        text: "Implicit (cognitive) learning, discovered by Arthur Reber in 1967, is the brain's ability to internalize language patterns without conscious awareness. Memolandum's game engines present target vocabulary in the peripheral visual field during gameplay, enabling this subconscious encoding while the player focuses on the game objective.",
      },
    },
    {
      "@type": "Question",
      name: "Is Memolandum better than Anki or Quizlet for vocabulary?",
      acceptedAnswer: {
        "@type": "Answer",
        text: "Memolandum combines spaced repetition (like Anki) with active recall in an arcade game format — making the review process engaging rather than tedious. Unlike Quizlet's flashcard model, Memolandum embeds vocabulary directly into real-time game mechanics for deeper cognitive encoding. It also adds Gemini AI instant translation and a personal word vault.",
      },
    },
  ],
};

/* ── Page Component ──────────────────────────────────────────────────── */
export default function AboutPage() {
  return (
    <>
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(aboutJsonLd) }}
      />
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(aboutFaqJsonLd) }}
      />
      <AboutClient />
    </>
  );
}
