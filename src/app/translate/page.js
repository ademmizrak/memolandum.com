import {
  absoluteUrl,
  OG_IMAGE,
  PAGE_SEO,
  SITE_NAME,
  SITE_URL,
} from "../../lib/seo/siteConfig";
import TranslateStudioClient from "./TranslateStudioClient";

const meta = PAGE_SEO.translate;

export const metadata = {
  title: meta.title,
  description: meta.description,
  keywords: meta.keywords,
  alternates: {
    canonical: absoluteUrl("/translate"),
    languages: {
      tr: absoluteUrl("/translate"),
      en: `${SITE_URL}/translate/?lang=en`,
      "x-default": absoluteUrl("/translate"),
    },
  },
  openGraph: {
    title: "AI Çeviri & Sözlük Stüdyosu — Memolandum",
    description: meta.description,
    url: absoluteUrl("/translate"),
    images: [{ url: OG_IMAGE, width: 1200, height: 630, alt: "Memolandum AI Çeviri" }],
    locale: "tr_TR",
    alternateLocale: ["en_US"],
    type: "website",
    siteName: SITE_NAME,
  },
  twitter: {
    card: "summary_large_image",
    title: "Gemini AI Translation Studio | Memolandum",
    description:
      "Instant text & voice translation in 13+ languages. Listen, then save to your Word Vault.",
    images: [OG_IMAGE],
  },
  robots: { index: true, follow: true },
};

const webAppJsonLd = {
  "@context": "https://schema.org",
  "@type": "WebApplication",
  "@id": `${SITE_URL}/translate/#app`,
  name: "Memolandum AI Çeviri Stüdyosu",
  alternateName: "Memolandum Gemini Translation Studio",
  url: absoluteUrl("/translate"),
  applicationCategory: "EducationalApplication",
  operatingSystem: "Web",
  description: meta.description,
  inLanguage: ["tr", "en"],
  isAccessibleForFree: true,
  offers: {
    "@type": "Offer",
    price: "0",
    priceCurrency: "TRY",
    description: "Free translation quota; Premium for heavy AI use",
  },
  featureList: [
    "Google Gemini AI translation",
    "Text and voice input",
    "Pronunciation / TTS playback",
    "Save translations to Word Vault",
    "13+ language pairs",
  ],
  publisher: { "@type": "Organization", name: SITE_NAME, url: SITE_URL },
};

const translateFaqJsonLd = {
  "@context": "https://schema.org",
  "@type": "FAQPage",
  "@id": `${SITE_URL}/translate/#faq`,
  inLanguage: ["tr", "en"],
  mainEntity: [
    {
      "@type": "Question",
      name: "Memolandum AI çeviri nasıl çalışır?",
      acceptedAnswer: {
        "@type": "Answer",
        text: "Metin yazın veya mikrofonla konuşun; Google Gemini AI hedef dile çeviri üretir. Sonucu sesli dinleyebilir ve Kelime Kasanıza kaydedebilirsiniz.",
      },
    },
    {
      "@type": "Question",
      name: "Is Memolandum translation free?",
      acceptedAnswer: {
        "@type": "Answer",
        text: "Yes. A free AI translation quota is included for everyone. Heavy ongoing use continues with Memolandum Premium; arcade vocabulary games remain free.",
      },
    },
    {
      "@type": "Question",
      name: "Çeviriyi kelime kasasına kaydedebilir miyim?",
      acceptedAnswer: {
        "@type": "Answer",
        text: "Evet. Çeviri stüdyosundan tek tıkla Kelime Kasanıza ekleyebilirsiniz; Pulse tekrar ritmi bu kelimeleri de takip eder.",
      },
    },
  ],
};

export default function TranslatePage() {
  return (
    <>
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(webAppJsonLd) }}
      />
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(translateFaqJsonLd) }}
      />
      <TranslateStudioClient />
    </>
  );
}
