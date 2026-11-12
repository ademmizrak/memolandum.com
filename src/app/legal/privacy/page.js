import LegalDocShell from "../../../components/legal/LegalDocShell";
import { absoluteUrl, OG_IMAGE, SITE_NAME, SITE_URL } from "../../../lib/seo/siteConfig";
import { LEGAL_CONTACT_EMAIL, LEGAL_PATHS, LEGAL_URLS } from "../../../lib/legal/config";

export const metadata = {
  title: "Gizlilik Politikası / Privacy Policy",
  description:
    "Memolandum Privacy Policy — one document for web and Android/iOS: Auth, Firestore, Gemini, Analytics, microphone, account deletion. Contact: info@memolandum.com",
  keywords: [
    "memolandum privacy policy",
    "gizlilik politikası",
    "memolandum kvkk",
    "language learning app privacy",
  ],
  alternates: {
    canonical: absoluteUrl(LEGAL_PATHS.privacy),
  },
  openGraph: {
    title: "Memolandum Privacy Policy",
    description:
      "How Memolandum collects and protects account, learning, and translation data.",
    url: absoluteUrl(LEGAL_PATHS.privacy),
    images: [{ url: OG_IMAGE }],
    siteName: SITE_NAME,
    type: "article",
  },
  twitter: {
    card: "summary",
    title: "Memolandum Privacy Policy",
    description: "Privacy Policy for memolandum.com and Memolandum apps.",
  },
  robots: { index: true, follow: true },
};

const privacyJsonLd = {
  "@context": "https://schema.org",
  "@type": "WebPage",
  "@id": `${LEGAL_URLS.privacy}#webpage`,
  name: "Memolandum Privacy Policy",
  url: LEGAL_URLS.privacy,
  inLanguage: ["tr", "en"],
  description:
    "Privacy Policy describing Memolandum account, learning progress, vault, AI translation, and Firebase processing.",
  isPartOf: {
    "@type": "WebSite",
    name: SITE_NAME,
    url: `${SITE_URL}/`,
  },
  publisher: {
    "@type": "Organization",
    name: "Memolandum",
    url: SITE_URL,
    email: LEGAL_CONTACT_EMAIL,
  },
  dateModified: "2026-07-18",
  speakable: {
    "@type": "SpeakableSpecification",
    cssSelector: ["article h1", "article p"],
  },
};

export default function PrivacyPolicyPage() {
  return (
    <>
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(privacyJsonLd) }}
      />
      <LegalDocShell doc="privacy" />
    </>
  );
}
