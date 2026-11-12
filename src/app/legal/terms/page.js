import LegalDocShell from "../../../components/legal/LegalDocShell";
import { absoluteUrl, OG_IMAGE, SITE_NAME, SITE_URL } from "../../../lib/seo/siteConfig";
import { LEGAL_CONTACT_EMAIL, LEGAL_PATHS, LEGAL_URLS } from "../../../lib/legal/config";

export const metadata = {
  title: "Kullanım Koşulları / Terms of Service",
  description:
    "Memolandum Terms of Service — single agreement for website and Android/iOS apps, including Apple App Store required acknowledgments. Contact: info@memolandum.com",
  keywords: [
    "memolandum terms of service",
    "kullanım koşulları",
    "memolandum terms",
  ],
  alternates: {
    canonical: absoluteUrl(LEGAL_PATHS.terms),
  },
  openGraph: {
    title: "Memolandum Terms of Service",
    description: "Terms governing use of Memolandum learning games and related features.",
    url: absoluteUrl(LEGAL_PATHS.terms),
    images: [{ url: OG_IMAGE }],
    siteName: SITE_NAME,
    type: "article",
  },
  twitter: {
    card: "summary",
    title: "Memolandum Terms of Service",
    description: "Terms of Service for memolandum.com and Memolandum apps.",
  },
  robots: { index: true, follow: true },
};

const termsJsonLd = {
  "@context": "https://schema.org",
  "@type": "WebPage",
  "@id": `${LEGAL_URLS.terms}#webpage`,
  name: "Memolandum Terms of Service",
  url: LEGAL_URLS.terms,
  inLanguage: ["tr", "en"],
  description: "Terms of Service for the Memolandum vocabulary learning platform.",
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
};

export default function TermsOfServicePage() {
  return (
    <>
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(termsJsonLd) }}
      />
      <LegalDocShell doc="terms" />
    </>
  );
}
