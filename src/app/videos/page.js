import { Suspense } from "react";
import VideosClient from "./VideosClient";
import { absoluteUrl, OG_IMAGE, SITE_URL, SITE_NAME } from "../../lib/seo/siteConfig";

const VIDEOS_JSON_LD = {
  "@context": "https://schema.org",
  "@type": "CollectionPage",
  "@id": `${SITE_URL}/videos/#collection`,
  name: "Memolandum Video Dersler & Animasyonlar (1–8. Sınıf, LGS, YDS, Arapça–İngilizce, Portekizce–İngilizce)",
  description:
    "@memolandum resmi YouTube kanalındaki 15 eğitici oynatma listesi: 1–8. Sınıf MEB & LGS, YDS/IELTS, Arapça–İngilizce (إتقان الإنجليزية خطوة بخطوة) ve Brezilya Portekizcesi–İngilizce (Curso de Inglês do Zero Explicado em Português).",
  url: `${SITE_URL}/videos/`,
  inLanguage: ["tr", "en", "ar", "pt-BR"],
  isPartOf: { "@id": `${SITE_URL}/#website` },
  hasPart: [
    {
      "@type": "VideoObject",
      name: "Curso de Inglês do Zero (Explicado em Português): Desmistificando 'A' e 'An' em Inglês",
      description:
        "A Regra de Ouro dos artigos indefinidos A e An em inglês explicada passo a passo em português do Brasil com quiz prático.",
      thumbnailUrl: ["https://i.ytimg.com/vi/29gI8-yEpYs/hqdefault.jpg"],
      uploadDate: "2026-10-26T14:17:39Z",
      contentUrl: "https://www.youtube.com/watch?v=29gI8-yEpYs&list=PLFty--cqLRvM",
      embedUrl: "https://www.youtube.com/embed/29gI8-yEpYs",
      inLanguage: "pt-BR",
    },
    {
      "@type": "VideoObject",
      name: "إتقان الإنجليزية خطوة بخطوة: شرح أدوات التنكير A و An بالتفصيل + اختبار قصير",
      description:
        "شرح تفصيلي مبسط باللغة العربية لأدوات التنكير A و An في اللغة الإنجليزية مع أمثلة عملية واختبار قصير.",
      thumbnailUrl: ["https://i.ytimg.com/vi/qO9gvJyQwtY/hqdefault.jpg"],
      uploadDate: "2026-10-26T12:58:52Z",
      contentUrl: "https://www.youtube.com/watch?v=qO9gvJyQwtY&list=PLYtLXOnKlTVo",
      embedUrl: "https://www.youtube.com/embed/qO9gvJyQwtY",
      inLanguage: "ar",
    },
  ],
};

export const metadata = {
  title:
    "İngilizce Video Dersler (1–8. Sınıf, LGS, YDS, Arapça & Portekizce Anlatım) | Memolandum",
  description:
    "1–8. Sınıf MEB & LGS, YDS/IELTS, Arapça–İngilizce (إتقان الإنجليزية خطوة بخطوة) ve Brezilya Portekizcesi–İngilizce (Curso de Inglês do Zero) konu anlatımı videoları — @memolandum YouTube.",
  keywords: [
    "ingilizce kelime videoları",
    "ingilizce konu anlatımı videoları",
    "arapça anlatımlı ingilizce dersleri",
    "إتقان الإنجليزية خطوة بخطوة",
    "شرح أدوات التنكير a و an بالتفصيل",
    "portekizce anlatımlı ingilizce dersleri",
    "curso de inglês do zero explicado em português",
    "desmistificando a e an em inglês",
    "ingilizce shorts",
    "ilkokul ingilizce",
    "ortaokul ingilizce videoları",
    "1. sınıf ingilizce",
    "2. sınıf ingilizce",
    "3. sınıf ingilizce",
    "4. sınıf ingilizce",
    "5. sınıf ingilizce",
    "6. sınıf ingilizce",
    "7. sınıf ingilizce",
    "8. sınıf lgs ingilizce",
    "yds ingilizce videoları",
    "kelime ezberleme",
    "memolandum videolar",
  ],
  alternates: {
    canonical: absoluteUrl("/videos"),
    languages: {
      tr: absoluteUrl("/videos"),
      "tr-TR": absoluteUrl("/videos"),
      en: `${SITE_URL}/videos/?lang=en`,
      "en-US": `${SITE_URL}/videos/?lang=en`,
      ar: `${SITE_URL}/videos/?playlist=ar-en&lang=ar`,
      "ar-SA": `${SITE_URL}/videos/?playlist=ar-en&lang=ar`,
      "ar-IQ": `${SITE_URL}/videos/?playlist=ar-en&lang=ar`,
      "ar-EG": `${SITE_URL}/videos/?playlist=ar-en&lang=ar`,
      pt: `${SITE_URL}/videos/?playlist=pt-en&lang=pt`,
      "pt-BR": `${SITE_URL}/videos/?playlist=pt-en&lang=pt`,
      "x-default": absoluteUrl("/videos"),
    },
  },
  openGraph: {
    title: "İngilizce Video Dersler & Konu Anlatımları (TR · AR · PT-BR) | Memolandum",
    description:
      "1–8. Sınıf, LGS, YDS, Arapça–İngilizce (إتقان الإنجليزية خطوة بخطوة) ve Brezilya Portekizcesi–İngilizce (Curso de Inglês do Zero) video serileri.",
    url: absoluteUrl("/videos"),
    images: [{ url: OG_IMAGE, width: 1200, height: 630, alt: "Memolandum Videolar" }],
    siteName: SITE_NAME,
    locale: "tr_TR",
    alternateLocale: ["en_US", "ar_SA", "pt_BR"],
    type: "website",
  },
  robots: { index: true, follow: true },
};

export default function VideosPage() {
  return (
    <>
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(VIDEOS_JSON_LD) }}
      />
      <Suspense fallback={
        <div className="min-h-screen bg-[#070b14] flex items-center justify-center">
          <div className="text-cyan-400 animate-pulse text-xl font-mono">YÜKLENİYOR...</div>
        </div>
      }>
        <VideosClient />
      </Suspense>
    </>
  );
}
