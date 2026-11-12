import MethodClient from "./MethodClient";
import {
  absoluteUrl,
  OG_IMAGE,
  PAGE_SEO,
  SITE_NAME,
  SITE_URL,
} from "../../lib/seo/siteConfig";

const meta = PAGE_SEO.method;

export const metadata = {
  title: meta.title,
  description: meta.description,
  keywords: meta.keywords,
  alternates: {
    canonical: absoluteUrl("/method"),
    languages: {
      tr: absoluteUrl("/method"),
      en: `${SITE_URL}/method/?lang=en`,
      ar: `${SITE_URL}/method/?lang=ar`,
      pt: `${SITE_URL}/method/?lang=pt`,
      "x-default": absoluteUrl("/method"),
    },
  },
  openGraph: {
    title: "Memolandum Pulse™ — Beynin ritmine uygun kelime öğrenme",
    description:
      "Oyun oynarken doğru kelimeyi doğru anda tekrar ettiren bilimsel yöntem. Spaced repetition + active recall, sade dille.",
    url: absoluteUrl("/method"),
    images: [{ url: OG_IMAGE, width: 1200, height: 630, alt: "Memolandum Pulse" }],
    locale: "tr_TR",
    alternateLocale: ["en_US", "ar_SA", "pt_BR"],
    type: "article",
    siteName: SITE_NAME,
  },
  twitter: {
    card: "summary_large_image",
    title: "Memolandum Pulse™ — How vocabulary sticks while you play",
    description: "Spaced repetition + active recall, explained simply.",
    images: [OG_IMAGE],
  },
  robots: { index: true, follow: true },
};

const articleJsonLd = {
  "@context": "https://schema.org",
  "@type": "Article",
  "@id": `${SITE_URL}/method/#article`,
  headline: "Memolandum Pulse™ — Kelimeleri unutmamak için beynin ritmini takip ediyoruz",
  description: meta.description,
  author: { "@type": "Organization", name: SITE_NAME, url: SITE_URL },
  publisher: { "@type": "Organization", name: SITE_NAME, url: SITE_URL },
  mainEntityOfPage: absoluteUrl("/method"),
  url: absoluteUrl("/method"),
  image: OG_IMAGE,
  inLanguage: ["tr", "en"],
  about: [
    { "@type": "Thing", name: "Spaced repetition" },
    { "@type": "Thing", name: "Active recall" },
    { "@type": "Thing", name: "Ebbinghaus forgetting curve" },
    { "@type": "Thing", name: "Memolandum Pulse" },
  ],
};

const methodFaqJsonLd = {
  "@context": "https://schema.org",
  "@type": "FAQPage",
  "@id": `${SITE_URL}/method/#faq`,
  inLanguage: ["tr", "en"],
  mainEntity: [
    {
      "@type": "Question",
      name: "Memolandum Pulse nedir?",
      acceptedAnswer: {
        "@type": "Answer",
        text: "Memolandum Pulse, aralıklı tekrar ve aktif hatırlamayı arcade oyunlara gömen öğrenme ritmidir. Her kelime için kişisel bir tekrar zamanı tutar: doğru ve hızlıysa aralık uzar, yanlışsa kelime tekrar kuyruğuna alınır.",
      },
    },
    {
      "@type": "Question",
      name: "What is Memolandum Pulse?",
      acceptedAnswer: {
        "@type": "Answer",
        text: "Memolandum Pulse is the spaced-repetition and active-recall rhythm inside the games. It schedules each word so you review it just before you would forget it.",
      },
    },
    {
      "@type": "Question",
      name: "Pulse ile klasik ezber listesi farkı nedir?",
      acceptedAnswer: {
        "@type": "Answer",
        text: "Klasik listeler her kelimeyi aynı sıklıkta gösterir. Pulse zayıf ve vakti gelen kelimeleri öne çıkarır; iyice oturanları seyreltir — daha az sürtünmeyle daha kalıcı öğrenme.",
      },
    },
  ],
};

export default function MethodPage() {
  return (
    <>
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(articleJsonLd) }}
      />
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(methodFaqJsonLd) }}
      />
      <MethodClient />
    </>
  );
}
