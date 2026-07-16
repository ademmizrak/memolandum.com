import AboutClient from "./AboutClient";
import { absoluteUrl, OG_IMAGE, SITE_URL } from "../../lib/seo/siteConfig";

export const metadata = {
  title: "Hakkımızda & Bilimsel Temeller / About & Science",
  description:
    "Memolandum'un bilimsel temeli: subliminal öğrenme, aralıklı tekrar, çift kodlama, flow ve aktif hatırlama. The science behind play-to-learn vocabulary — TR & EN.",
  keywords: [
    "memolandum hakkında",
    "bilimsel kelime ezberleme",
    "spaced repetition",
    "active recall",
    "flow theory language learning",
    "about memolandum",
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
    title: "About Memolandum — Scientific Foundations",
    description:
      "Neuroscience-inspired arcade vocabulary learning: spaced repetition, dual coding, flow, active recall. Available in Turkish & English UI.",
    url: absoluteUrl("/about"),
    images: [{ url: OG_IMAGE }],
    locale: "tr_TR",
    alternateLocale: ["en_US"],
    type: "article",
  },
  twitter: {
    card: "summary_large_image",
    title: "About Memolandum — Science of Play & Memorize",
    description:
      "Spaced repetition, dual coding, flow theory, active recall — the science behind Memolandum.",
    images: [OG_IMAGE],
  },
};

const aboutJsonLd = {
  "@context": "https://schema.org",
  "@type": "AboutPage",
  name: "Memolandum — About & Scientific Foundations",
  url: absoluteUrl("/about"),
  inLanguage: ["tr", "en"],
  description:
    "Scientific foundations of Memolandum: subliminal learning, spaced repetition, dual coding, flow theory, active recall, and cognitive training versus AI translator dependency.",
  isPartOf: {
    "@type": "WebSite",
    name: "Memolandum",
    url: `${SITE_URL}/`,
  },
  publisher: {
    "@type": "Organization",
    name: "Memolandum Team",
    url: SITE_URL,
  },
  mainEntity: {
    "@type": "EducationalOrganization",
    name: "Memolandum",
    description:
      "Free arcade vocabulary learning platform with Gemini instant translation and multi-language study profiles.",
    url: `${SITE_URL}/`,
  },
};

const aboutFaqJsonLd = {
  "@context": "https://schema.org",
  "@type": "FAQPage",
  inLanguage: ["tr", "en"],
  mainEntity: [
    {
      "@type": "Question",
      name: "Memolandum hangi bilimsel yaklaşımları kullanır?",
      acceptedAnswer: {
        "@type": "Answer",
        text: "Subliminal/örtük öğrenme, aralıklı tekrar (spaced repetition), çift kodlama, flow teorisi ve aktif hatırlama (active recall).",
      },
    },
    {
      "@type": "Question",
      name: "What science is behind Memolandum?",
      acceptedAnswer: {
        "@type": "Answer",
        text: "Subliminal and implicit learning, spaced repetition, dual coding theory, flow theory, and active recall — embedded in arcade game loops.",
      },
    },
  ],
};

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
