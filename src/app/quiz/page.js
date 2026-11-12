import { Suspense } from "react";
import Header from "@/components/Header";
import QuizHubClient from "@/components/quizzes/QuizHubClient";
import { QUIZ_GRADES_META } from "@/lib/quizzes/gradeQuizEngine";
import {
  absoluteUrl,
  buildPageAlternates,
  OG_IMAGE,
  SITE_NAME,
  SITE_URL,
} from "@/lib/seo/siteConfig";

export const metadata = {
  title: "2–8. Sınıf İngilizce Deneme Quizleri (100 Havuzdan 20 Rastgele Soru) | Memolandum",
  description:
    "2. sınıftan 8. sınıfa (LGS dahil) tüm sınıflar için 100 ayrı sınav sorusu havuzundan rastgele oluşturulan 20 soruluk ücretsiz, hızlı ve eğlenceli İngilizce çoktan seçmeli deneme testleri.",
  keywords: [
    "ingilizce deneme quizi",
    "2. sınıf ingilizce testi",
    "3. sınıf ingilizce testi",
    "4. sınıf ingilizce yazılı soruları",
    "5. sınıf ingilizce 1. yazılı deneme",
    "6. sınıf ingilizce deneme testi",
    "7. sınıf ingilizce yazılı quizi",
    "8. sınıf lgs ingilizce deneme testi",
    "20 soruluk ingilizce kelime testi",
  ],
  alternates: buildPageAlternates("/quiz/"),
  openGraph: {
    title: "2–8. Sınıf İngilizce Deneme Quizleri | Memolandum",
    description:
      "Her sınıf için 100 soruluk müfredat havuzundan 20 soruluk rastgele deneme sınavları. Hemen çöz, anında sınav karneni gör!",
    url: absoluteUrl("/quiz/"),
    images: [{ url: OG_IMAGE, width: 1200, height: 630, alt: "Memolandum Deneme Quizleri" }],
    siteName: SITE_NAME,
    type: "website",
  },
  robots: { index: true, follow: true },
};

export default function QuizHubPage() {
  const jsonLd = {
    "@context": "https://schema.org",
    "@type": "CollectionPage",
    "@id": `${SITE_URL}/quiz/#hub`,
    name: "2–8. Sınıf İngilizce Deneme Quizleri Merkezi",
    url: absoluteUrl("/quiz/"),
    description:
      "2. sınıftan 8. sınıfa kadar her sınıf için 100 soruluk müfredat havuzundan 20 soruluk rastgele çoktan seçmeli İngilizce deneme testleri.",
    numberOfItems: QUIZ_GRADES_META.length,
    hasPart: QUIZ_GRADES_META.map((g) => ({
      "@type": "Quiz",
      name: g.title,
      description: g.subtitle,
      url: absoluteUrl(`/quiz/${g.slug}/`),
    })),
  };

  return (
    <div className="min-h-screen bg-[#070b14] text-slate-200 font-sans pb-24">
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd) }}
      />
      <Header />
      <Suspense
        fallback={
          <main className="max-w-5xl mx-auto px-4 pt-12 text-slate-400">
            Deneme quizleri hazırlanıyor…
          </main>
        }
      >
        <QuizHubClient />
      </Suspense>
    </div>
  );
}
