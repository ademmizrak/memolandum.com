import {
  absoluteUrl,
  OG_IMAGE,
  PAGE_SEO,
  SITE_NAME,
  SITE_URL,
} from "../../lib/seo/siteConfig";

const meta = PAGE_SEO.vocabulary;

export const metadata = {
  title: meta.title,
  description: meta.description,
  keywords: meta.keywords,
  alternates: {
    canonical: absoluteUrl("/vocabulary"),
    languages: {
      tr: absoluteUrl("/vocabulary"),
      en: `${SITE_URL}/vocabulary/?lang=en`,
      "x-default": absoluteUrl("/vocabulary"),
    },
  },
  openGraph: {
    title: "Kelime Kasası | Memolandum Word Vault",
    description: meta.description,
    url: absoluteUrl("/vocabulary"),
    images: [{ url: OG_IMAGE, width: 1200, height: 630, alt: "Memolandum Kelime Kasası" }],
    locale: "tr_TR",
    alternateLocale: ["en_US"],
    type: "website",
    siteName: SITE_NAME,
  },
  twitter: {
    card: "summary_large_image",
    title: "Word Vault — Spaced Repetition Dictionary | Memolandum",
    description:
      "Track game-learned and AI-saved words with Pulse due reviews. Free personal vocabulary vault.",
    images: [OG_IMAGE],
  },
  robots: { index: true, follow: true },
};

const collectionJsonLd = {
  "@context": "https://schema.org",
  "@type": "CollectionPage",
  "@id": `${SITE_URL}/vocabulary/#collection`,
  name: "Memolandum Kelime Kasası / Word Vault",
  url: absoluteUrl("/vocabulary"),
  description: meta.description,
  inLanguage: ["tr", "en"],
  isPartOf: { "@type": "WebSite", name: SITE_NAME, url: `${SITE_URL}/` },
  about: [
    { "@type": "Thing", name: "Spaced repetition" },
    { "@type": "Thing", name: "Vocabulary learning" },
    { "@type": "Thing", name: "Personal dictionary" },
  ],
  publisher: { "@type": "Organization", name: SITE_NAME, url: SITE_URL },
};

const vaultFaqJsonLd = {
  "@context": "https://schema.org",
  "@type": "FAQPage",
  "@id": `${SITE_URL}/vocabulary/#faq`,
  inLanguage: ["tr", "en"],
  mainEntity: [
    {
      "@type": "Question",
      name: "Kelime Kasası nedir?",
      acceptedAnswer: {
        "@type": "Answer",
        text: "Kelime Kasası, oyunlardan öğrendiğiniz ve AI çeviriden kaydettiğiniz kelimeleri güç seviyesine ve Memolandum Pulse tekrar zamanına göre takip ettiğiniz kişisel sözlüktür.",
      },
    },
    {
      "@type": "Question",
      name: "What is the Memolandum Word Vault?",
      acceptedAnswer: {
        "@type": "Answer",
        text: "The Word Vault is your personal dictionary of words learned in games and saved from AI translation, with strength levels and Pulse due times for spaced review.",
      },
    },
    {
      "@type": "Question",
      name: "Due tekrar ne işe yarar?",
      acceptedAnswer: {
        "@type": "Answer",
        text: "Due liste, bugün tekrar edilmesi gereken kelimeleri getirir. Unutma eğrisine karşı en verimli anda kısa bir tekrar yapmanızı sağlar.",
      },
    },
  ],
};

export default function VocabularyLayout({ children }) {
  return (
    <>
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(collectionJsonLd) }}
      />
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(vaultFaqJsonLd) }}
      />
      {children}
    </>
  );
}
