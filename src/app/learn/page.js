import Header from "@/components/Header";
import LearnHubClient from "./LearnHubClient";
import {
  absoluteUrl,
  buildPageAlternates,
  OG_IMAGE,
  SITE_NAME,
  SITE_URL,
} from "@/lib/seo/siteConfig";
import {
  countWords,
  ctaGameUrl,
  getAllPathways,
  loadSampleWords,
} from "@/lib/seo/learnPathways";

export const metadata = {
  title: "23 Dil Yolu — Kelime Ezberleme Landing Sayfaları",
  description:
    "İngilizce, Almanca, Fransızca, İspanyolca, Rusça, Korece, Portekizce, Yunanca, İtalyanca, Japonca, Arapça ve Çince — 23 dil yolunda ücretsiz arcade kelime ezberleme. Seç, oyna, ezberle.",
  keywords: [
    "dil öğrenme yolları",
    "kelime ezberleme",
    "23 dil",
    "vocabulary pathways",
    "memolandum learn",
  ],
  alternates: buildPageAlternates("/learn/"),
  openGraph: {
    title: "23 Dil Yolu | Memolandum Learn",
    description:
      "Her dil çifti için ayrı SEO landing — arcade oyunlara tek tıkla başla.",
    url: absoluteUrl("/learn/"),
    images: [{ url: OG_IMAGE, width: 1200, height: 630, alt: "Memolandum Learn" }],
    siteName: SITE_NAME,
    locale: "tr_TR",
    alternateLocale: ["en_US", "ar_SA", "pt_BR"],
    type: "website",
  },
  robots: { index: true, follow: true },
};

export default function LearnHubPage() {
  const pathways = getAllPathways();
  const items = pathways.map((p) => {
    const wordCount = countWords(p);
    const samples = loadSampleWords(p, 1);
    return {
      slug: p.slug,
      labelTr: p.labelTr,
      labelEn: p.labelEn,
      introTr: p.introTr,
      introEn: p.introEn,
      wordCount,
      sampleWord: samples[0]?.word || "",
      gameHref: ctaGameUrl(p).replace(SITE_URL, ""),
    };
  });

  const hubJsonLd = {
    "@context": "https://schema.org",
    "@type": "CollectionPage",
    "@id": `${SITE_URL}/learn/#hub`,
    name: "Memolandum — 23 Dil Yolu",
    url: absoluteUrl("/learn/"),
    description:
      "23 language pathways for arcade vocabulary learning with spaced repetition.",
    numberOfItems: pathways.length,
    hasPart: pathways.map((p) => ({
      "@type": "Course",
      name: p.labelTr,
      url: absoluteUrl(`/learn/${p.slug}/`),
    })),
  };

  return (
    <div className="min-h-screen bg-[#070b14] text-slate-200 font-sans pb-24">
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(hubJsonLd) }}
      />
      <Header />
      <LearnHubClient items={items} />
    </div>
  );
}
