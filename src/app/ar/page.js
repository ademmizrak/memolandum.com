import HomeClient from "../HomeClient";
import HomeSeo from "../../components/seo/HomeSeo";
import { LocaleProvider } from "../../lib/i18n/LocaleProvider";
import {
  KEYWORDS,
  OG_IMAGE,
  SITE_NAME,
  SITE_URL,
  absoluteUrl,
} from "../../lib/seo/siteConfig";

const AR_TITLE =
  "Memolandum — إتقان الإنجليزية خطوة بخطوة (دروس فيديو بالعربية) و16 لعبة أركيد مجانية";
const AR_DESC =
  "منصة مجانية 100% وخالية من الإعلانات لتعلّم الإنجليزية من الصفر بالشرح العربي (إتقان الإنجليزية خطوة بخطوة @memolandum) وحفظ الكلمات عبر 16 لعبة أركيد تفاعلية ونظام التكرار المتباعد (SM-2) في 23 مساراً لغوياً والصفوف 1–12.";

const AR_COURSE_VIDEO_JSON_LD = [
  {
    "@context": "https://schema.org",
    "@type": "Course",
    "@id": `${SITE_URL}/ar/#ar-en-video-course`,
    name: "إتقان الإنجليزية خطوة بخطوة (دروس فيديو بالعربية) + 16 لعبة أركيد — Memolandum",
    description:
      "كورس مجاني لتعلّم قواعد ومفردات اللغة الإنجليزية خطوة بخطوة بالشرح العربي المبسط على يوتيوب (@memolandum) مع تطبيق فوري في 16 لعبة أركيد تفاعلية ونظام التكرار المتباعد (Memolandum Pulse / SM-2).",
    url: `${SITE_URL}/ar/`,
    inLanguage: ["ar", "en"],
    isAccessibleForFree: true,
    provider: {
      "@type": "Organization",
      name: SITE_NAME,
      url: SITE_URL,
      sameAs: ["https://www.youtube.com/@memolandum"],
    },
    hasCourseInstance: [
      {
        "@type": "CourseInstance",
        name: "دروس الفيديو: إتقان الإنجليزية خطوة بخطوة (بالشرح العربي)",
        courseMode: "online",
        url: `${SITE_URL}/videos/?playlist=ar-en`,
      },
      {
        "@type": "CourseInstance",
        name: "المسار التفاعلي: العربية → الإنجليزية (16 لعبة أركيد)",
        courseMode: "online",
        url: `${SITE_URL}/learn/ar-en/`,
      },
    ],
  },
  {
    "@context": "https://schema.org",
    "@type": "VideoObject",
    "@id": `${SITE_URL}/ar/#featured-video-ar-en`,
    name: "شرح أدوات التنكير A و An بالتفصيل + اختبار قصير | إتقان الإنجليزية خطوة بخطوة",
    description:
      "شرح مبسط ومفصل لقاعدة أدوات التنكير (A و An) في اللغة الإنجليزية بالاعتماد على الصوت الساكن والمتحرك مع أمثلة عملية واختبار قصير باللغة العربية.",
    thumbnailUrl: ["https://i.ytimg.com/vi/qO9gvJyQwtY/hqdefault.jpg"],
    uploadDate: "2026-10-26T12:58:52Z",
    contentUrl: "https://www.youtube.com/watch?v=qO9gvJyQwtY&list=PLYtLXOnKlTVo",
    embedUrl: "https://www.youtube.com/embed/qO9gvJyQwtY",
    inLanguage: "ar",
    isFamilyFriendly: true,
    publisher: {
      "@type": "Organization",
      name: SITE_NAME,
      logo: {
        "@type": "ImageObject",
        url: `${SITE_URL}/logo.png`,
        width: 512,
        height: 512,
      },
    },
  },
];

export const metadata = {
  title: AR_TITLE,
  description: AR_DESC,
  keywords: KEYWORDS,
  alternates: {
    canonical: absoluteUrl("/ar/"),
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
    title: AR_TITLE,
    description: AR_DESC,
    url: absoluteUrl("/ar/"),
    type: "website",
    locale: "ar_SA",
    alternateLocale: ["tr_TR", "en_US", "pt_BR"],
    images: [{ url: OG_IMAGE, width: 1200, height: 630, alt: "Memolandum AR — إتقان الإنجليزية خطوة بخطوة" }],
  },
  twitter: {
    card: "summary_large_image",
    title: AR_TITLE,
    description: AR_DESC,
    images: [OG_IMAGE],
  },
};

export default function ArabicHomePage() {
  return (
    <LocaleProvider initialLocale="ar">
      <div dir="rtl" lang="ar">
        <script
          type="application/ld+json"
          dangerouslySetInnerHTML={{ __html: JSON.stringify(AR_COURSE_VIDEO_JSON_LD) }}
        />
        <HomeClient />
        <HomeSeo forcedLocale="ar" />
      </div>
    </LocaleProvider>
  );
}
