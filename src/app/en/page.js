import HomeClient from "../HomeClient";
import HomeSeo from "../../components/seo/HomeSeo";
import { LocaleProvider } from "../../lib/i18n/LocaleProvider";
import {
  KEYWORDS,
  OG_IMAGE,
  absoluteUrl,
} from "../../lib/seo/siteConfig";

const EN_TITLE =
  "Memolandum — Free Vocabulary Arcade Games & Spaced Repetition | 23 Language Pathways";
const EN_DESC =
  "Master vocabulary across 23 language pathways with 10 free, ad-free arcade games (Retro Shooter, OrbitLex), SM-2 spaced repetition (Memolandum Pulse), Grades 1–12 English curriculum, Classroom Desk (/schools), and Gemini AI Instant Translation.";

export const metadata = {
  title: EN_TITLE,
  description: EN_DESC,
  keywords: KEYWORDS,
  alternates: {
    canonical: absoluteUrl("/en/"),
    languages: {
      tr: absoluteUrl("/"),
      "tr-TR": absoluteUrl("/"),
      en: absoluteUrl("/en/"),
      "en-US": absoluteUrl("/en/"),
      ar: absoluteUrl("/ar/"),
      "ar-SA": absoluteUrl("/ar/"),
      "ar-IQ": absoluteUrl("/ar/"),
      "ar-EG": absoluteUrl("/ar/"),
      pt: absoluteUrl("/pt/"),
      "pt-BR": absoluteUrl("/pt/"),
      "x-default": absoluteUrl("/"),
    },
  },
  openGraph: {
    title: EN_TITLE,
    description: EN_DESC,
    url: absoluteUrl("/en/"),
    type: "website",
    locale: "en_US",
    alternateLocale: ["tr_TR", "ar_SA", "pt_BR"],
    images: [{ url: OG_IMAGE, width: 1200, height: 630, alt: "Memolandum EN" }],
  },
  twitter: {
    card: "summary_large_image",
    title: EN_TITLE,
    description: EN_DESC,
    images: [OG_IMAGE],
  },
};

export default function EnglishHomePage() {
  return (
    <LocaleProvider initialLocale="en">
      <div lang="en">
        <HomeClient />
        <HomeSeo forcedLocale="en" />
      </div>
    </LocaleProvider>
  );
}
