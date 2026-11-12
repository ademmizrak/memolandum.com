import Link from "next/link";
import { notFound } from "next/navigation";
import Header from "@/components/Header";
import GradeQuizRunner from "@/components/quizzes/GradeQuizRunner";
import {
  QUIZ_GRADES_META,
  GRADE_1_META,
  LGS_STRATEGY_CATEGORIES,
  LGS_ALL_MIXED_META,
  resolveQuizGradeMeta,
  getGradeQuestionPool,
} from "@/lib/quizzes/gradeQuizEngine";
import {
  absoluteUrl,
  buildPageAlternates,
  OG_IMAGE,
  SITE_NAME,
  SITE_URL,
} from "@/lib/seo/siteConfig";

export function generateStaticParams() {
  const allGrades = [GRADE_1_META, ...QUIZ_GRADES_META];
  const params = [];
  for (const g of allGrades) {
    params.push({ grade: g.slug });
  }
  params.push({ grade: LGS_ALL_MIXED_META.slug });
  for (const cat of LGS_STRATEGY_CATEGORIES) {
    params.push({ grade: cat.slug });
  }
  return params;
}

export async function generateMetadata({ params }) {
  const { grade } = await params;
  const meta = resolveQuizGradeMeta(grade);
  if (!meta) {
    return { title: "Sınıf Quizi Bulunamadı" };
  }

  const canonicalPath = `/quiz/${meta.slug}/`;
  const poolCount = meta.poolCount || 100;
  return {
    title: `${meta.title} — ${poolCount} Havuzdan 20 Soruluk Rastgele Test`,
    description: `${meta.title}: ${poolCount} ayrı soruluk havuzdan her seferinde rastgele oluşturulan 20 soruluk çoktan seçmeli deneme testi. ${meta.subtitle}. Hemen çöz ve sınav karneni gör!`,
    keywords: meta.isLgsStrategy
      ? [
          "lgs ingilizce deneme quizi",
          "lgs ingilizce soru kökleri",
          "lgs ingilizce çeldirici tuzakları",
          meta.title,
          "8. sınıf lgs 20 soruluk ingilizce test",
          "memolandum lgs quiz",
        ]
      : [
          `${meta.grade}. sınıf ingilizce deneme quizi`,
          `${meta.grade}. sınıf ingilizce 1. yazılı soruları`,
          `${meta.grade}. sınıf ingilizce kelime testi`,
          `${meta.grade}. sınıf 20 soruluk ingilizce test`,
          "memolandum quiz",
        ],
    alternates: buildPageAlternates(canonicalPath),
    openGraph: {
      title: `${meta.title} (20 Soruluk Rastgele Test) | Memolandum`,
      description: `${meta.subtitle} — ${poolCount} soruluk havuzdan 20 soruluk hızlı ve eğlenceli deneme sınavı.`,
      url: absoluteUrl(canonicalPath),
      images: [{ url: OG_IMAGE, width: 1200, height: 630, alt: meta.title }],
      siteName: SITE_NAME,
      type: "website",
    },
    robots: { index: true, follow: true },
  };
}

export default async function GradeQuizPage({ params }) {
  const { grade } = await params;
  const meta = resolveQuizGradeMeta(grade);
  if (!meta) notFound();

  const pool = getGradeQuestionPool(meta.grade);

  const jsonLd = {
    "@context": "https://schema.org",
    "@type": "Quiz",
    "@id": `${SITE_URL}/quiz/${meta.slug}/#quiz`,
    name: meta.title,
    description: `${meta.subtitle}. 100 soruluk müfredat havuzundan 20 soruluk rastgele çoktan seçmeli deneme sınavı.`,
    educationalAlignment: {
      "@type": "AlignmentObject",
      alignmentType: "educationalLevel",
      targetName: `${meta.grade}. Sınıf İngilizce`,
    },
    hasPart: pool.slice(0, 10).map((q) => ({
      "@type": "Question",
      name: q.questionText,
      acceptedAnswer: {
        "@type": "Answer",
        text: q.correctAnswer,
      },
    })),
  };

  return (
    <div className="min-h-screen bg-[#070b14] text-slate-200 font-sans pb-24">
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd) }}
      />
      <Header />

      <main className="max-w-6xl mx-auto px-4 sm:px-6 pt-6">
        {/* Breadcrumb */}
        <nav className="flex flex-wrap items-center gap-2 text-xs font-semibold text-slate-400 mb-5">
          <Link href="/" className="hover:text-white">
            Ana Sayfa
          </Link>
          <span>/</span>
          <Link href="/quiz/" className="hover:text-white">
            2–8. Sınıf Deneme Quizleri
          </Link>
          <span>/</span>
          <span className="text-cyan-400 font-bold">{meta.title}</span>
        </nav>

        {/* İnteraktif 20 Soruluk Rastgele Quiz */}
        <GradeQuizRunner initialGrade={meta.grade} showGradeSwitcher={true} />

        {/* 100 Soruluk Sınıf Havuzu Kelime & Cümle Çalışma Özeti (SEO + Hızlı Tekrar) */}
        <section className="mt-12 max-w-4xl mx-auto rounded-3xl border border-white/10 bg-slate-900/50 p-5 sm:p-7">
          <div className="flex flex-wrap items-center justify-between gap-2 mb-4">
            <div>
              <span className="text-[11px] font-black uppercase tracking-wider text-cyan-400">
                📚 Sınav Hazırlık Çalışma Listesi
              </span>
              <h2 className="text-lg sm:text-xl font-black text-white mt-0.5">
                {meta.isLgsStrategy
                  ? `${meta.title} (${pool.length} Soruluk Havuz Özeti)`
                  : `${meta.grade}. Sınıf 100 Soruluk Sınav Havuzu Kelime & Örnek Cümleleri`}
              </h2>
            </div>
            <Link
              href={`/learn/en-tr/${meta.levelId}/`}
              className="text-xs font-bold text-cyan-400 hover:text-cyan-300 underline"
            >
              Ünite Sayfasına Git →
            </Link>
          </div>

          <p className="text-xs sm:text-sm text-slate-400 mb-5">
            Yukarıdaki deneme testinde her başlatışınızda aşağıdaki{" "}
            <strong className="text-slate-200">{pool.length} soruluk</strong>{" "}
            havuzdan rastgele 20 soru seçilir ve şıklar karıştırılır.
          </p>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5 max-h-[420px] overflow-y-auto pr-1">
            {pool.slice(0, 100).map((item, idx) => (
              <div
                key={item.id}
                className="p-3 rounded-xl bg-slate-950/70 border border-white/5 flex flex-col justify-between gap-1"
              >
                <div className="flex items-center justify-between gap-2">
                  <span className="text-xs font-black text-white">
                    {item.number || idx + 1}. {item.questionText || item.english}
                  </span>
                  <span className="text-xs font-bold text-cyan-300">
                    {item.correctAnswer || item.turkish}
                  </span>
                </div>
                {item.helperText && (
                  <p className="text-[11px] text-amber-200/90">
                    💡 {item.helperText}
                  </p>
                )}
              </div>
            ))}
          </div>
        </section>
      </main>
    </div>
  );
}
