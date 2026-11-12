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

const PT_TITLE =
  "Memolandum — Curso de Inglês do Zero (Explicado em Português) e 16 Jogos Grátis | ENEM";
const PT_DESC =
  "Aprenda inglês do zero com aulas em vídeo explicadas em português (@memolandum) + 16 jogos arcade 100% gratuitos e sem anúncios (Retro Shooter, OrbitLex), repetição espaçada (SM-2), vocabulário ENEM/Vestibular, 23 idiomas e Tradução IA.";

const PT_COURSE_VIDEO_JSON_LD = [
  {
    "@context": "https://schema.org",
    "@type": "Course",
    "@id": `${SITE_URL}/pt/#pt-en-video-course`,
    name: "Curso de Inglês do Zero (Explicado em Português) + 16 Jogos Arcade — Memolandum",
    description:
      "Curso gratuito de inglês passo a passo explicado em português do Brasil no YouTube (@memolandum) integrado a 16 jogos arcade interativos e repetição espaçada (Memolandum Pulse / SM-2).",
    url: `${SITE_URL}/pt/`,
    inLanguage: ["pt-BR", "pt", "en"],
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
        name: "Aulas em Vídeo: Curso de Inglês do Zero (Explicado em Português)",
        courseMode: "online",
        url: `${SITE_URL}/videos/?playlist=pt-en`,
      },
      {
        "@type": "CourseInstance",
        name: "Trilha Interativa Português (Brasil) → Inglês (16 Jogos Arcade)",
        courseMode: "online",
        url: `${SITE_URL}/learn/pt-en/`,
      },
    ],
  },
  {
    "@context": "https://schema.org",
    "@type": "VideoObject",
    "@id": `${SITE_URL}/pt/#featured-video-pt-en`,
    name: "Desmistificando 'A' e 'An' em Inglês: A Regra de Ouro + Quiz Prático! | Curso de Inglês do Zero",
    description:
      "Aprenda quando usar 'A' ou 'An' em inglês com a Regra de Ouro baseada no som (consoante vs. vogal), exemplos práticos do dia a dia e quiz interativo explicado em português do Brasil.",
    thumbnailUrl: ["https://i.ytimg.com/vi/29gI8-yEpYs/hqdefault.jpg"],
    uploadDate: "2026-10-26T14:17:39Z",
    contentUrl: "https://www.youtube.com/watch?v=29gI8-yEpYs&list=PLFty--cqLRvM",
    embedUrl: "https://www.youtube.com/embed/29gI8-yEpYs",
    inLanguage: "pt-BR",
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
  title: PT_TITLE,
  description: PT_DESC,
  keywords: KEYWORDS,
  alternates: {
    canonical: absoluteUrl("/pt/"),
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
    title: PT_TITLE,
    description: PT_DESC,
    url: absoluteUrl("/pt/"),
    type: "website",
    locale: "pt_BR",
    alternateLocale: ["tr_TR", "en_US", "ar_SA"],
    images: [{ url: OG_IMAGE, width: 1200, height: 630, alt: "Memolandum PT-BR — Curso de Inglês do Zero e Jogos" }],
  },
  twitter: {
    card: "summary_large_image",
    title: PT_TITLE,
    description: PT_DESC,
    images: [OG_IMAGE],
  },
};

export default function PortugueseHomePage() {
  return (
    <LocaleProvider initialLocale="pt">
      <div lang="pt-BR">
        <script
          type="application/ld+json"
          dangerouslySetInnerHTML={{ __html: JSON.stringify(PT_COURSE_VIDEO_JSON_LD) }}
        />
        <HomeClient />
        <HomeSeo forcedLocale="pt" />
      </div>
    </LocaleProvider>
  );
}
