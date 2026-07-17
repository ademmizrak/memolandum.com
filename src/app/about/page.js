import AboutClient from "./AboutClient";
import { absoluteUrl, OG_IMAGE, SITE_URL, SITE_NAME } from "../../lib/seo/siteConfig";

/* ── Page Metadata ──────────────────────────────────────────────────── */
export const metadata = {
  title:
    "Memolandum'un Bilimsel Temelleri | Spaced Repetition, Active Recall & Vocabulary Science",
  description:
    "Memolandum'da kelime ezberleme nasıl çalışır? Ebbinghaus unutma eğrisi, Allan Paivio'nun çift kodlama teorisi, Csikszentmihalyi'nin flow teorisi ve Roediger & Karpicke active recall araştırması — 8 dilde anlatım.",
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
  ],
  alternates: {
    canonical: absoluteUrl("/about"),
    languages: {
      "tr": absoluteUrl("/about"),
      "en": `${SITE_URL}/about/?lang=en`,
      "de": `${SITE_URL}/about/?lang=de`,
      "fr": `${SITE_URL}/about/?lang=fr`,
      "es": `${SITE_URL}/about/?lang=es`,
      "ja": `${SITE_URL}/about/?lang=ja`,
      "zh": `${SITE_URL}/about/?lang=zh`,
      "ar": `${SITE_URL}/about/?lang=ar`,
      "x-default": absoluteUrl("/about"),
    },
  },
  openGraph: {
    title:
      "Memolandum — Bilimsel Temeller | Spaced Repetition, Active Recall, Dual Coding",
    description:
      "Ebbinghaus (1885), Allan Paivio (1971), Csikszentmihalyi (Flow), Roediger & Karpicke (2006) araştırmaları — 8 dilde açıklanan kelime ezberleme bilimi. Cognitive vocabulary training, memory science, gamified learning.",
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
    alternateLocale: ["en_US", "de_DE", "fr_FR", "es_ES", "ja_JP", "zh_CN", "ar_SA"],
    type: "article",
    siteName: SITE_NAME,
  },
  twitter: {
    card: "summary_large_image",
    title: "The Science Behind Memolandum — Vocabulary Learning Neuroscience",
    description:
      "Spaced repetition, active recall, dual coding & flow theory — proven memory science embedded in arcade games. Available in 8 languages.",
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
  inLanguage: ["tr", "en", "de", "fr", "es", "ja", "zh", "ar"],
  description:
    "Scientific foundations of Memolandum vocabulary learning platform: implicit learning (Reber, 1967), Ebbinghaus Forgetting Curve (1885), Dual Coding Theory (Paivio, 1971), Flow Theory (Csikszentmihalyi), Active Recall (Roediger & Karpicke, 2006), and cognitive network training versus AI dependency (Anderson & Reder).",
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
      "Free arcade vocabulary learning platform using spaced repetition, active recall, dual coding theory, and Gemini AI translation. Supports 13+ language pairs. Available in Turkish, English, German, French, Spanish, Japanese, Chinese, and Arabic.",
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
