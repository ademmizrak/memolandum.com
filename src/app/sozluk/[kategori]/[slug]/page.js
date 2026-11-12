import React from "react";
import Link from "next/link";
import { notFound } from "next/navigation";
import Header from "@/components/Header";
import RelatedConcepts from "@/components/glossary/RelatedConcepts";
import PlayGlossaryButton from "@/components/glossary/PlayGlossaryButton";
import { 
  getCategoryBySlug, 
  getConceptBySlug, 
  getConceptsByCategory, 
  getRelatedConcepts, 
  loadGlossaryData,
  toLightweightConcept,
} from "@/lib/glossary";
import { absoluteUrl } from "@/lib/seo/siteConfig";

// Pre-render static paths for all ~4,000 concepts so every URL returns 200 OK with full SEO HTML & DefinedTerm JSON-LD.
export async function generateStaticParams() {
  const concepts = loadGlossaryData();
  return concepts.map((c) => ({
    kategori: c.category,
    slug: c.slug
  }));
}

// Generate dynamic metadata for the concept
export async function generateMetadata({ params }) {
  const resolvedParams = await params;
  const { kategori: categorySlug, slug: conceptSlug } = resolvedParams;

  const concept = getConceptBySlug(categorySlug, conceptSlug);
  if (!concept) {
    return {
      title: "Kavram Bulunamadı",
      description: "Aradığınız sözlük kavramı bulunamadı."
    };
  }

  const variantMatch = String(conceptSlug || "").match(/-([2-9]|\d{2,})$/);
  const variantLabel = variantMatch ? ` (${variantMatch[1]}. Madde)` : "";
  const title = `${concept.title}${variantLabel} Ne Demek? — ${concept.categoryName} Sözlüğü`;
  const description = `${concept.title} nedir? Tanımı: ${concept.description}. ${concept.categoryName} terimi olan ${concept.title} hakkında detaylı konu anlatımı ve oyunlu ezberleme rehberi.`;
  const url = absoluteUrl(`/sozluk/${categorySlug}/${conceptSlug}/`);

  return {
    title,
    description,
    alternates: {
      canonical: url
    },
    openGraph: {
      title,
      description,
      url,
      type: "article",
      authors: ["Memolandum Team"]
    }
  };
}

export default async function ConceptDetailPage({ params }) {
  const resolvedParams = await params;
  const { kategori: categorySlug, slug: conceptSlug } = resolvedParams;

  const concept = getConceptBySlug(categorySlug, conceptSlug);
  if (!concept) {
    notFound();
  }

  const category = getCategoryBySlug(categorySlug);
  const rawCategoryConcepts = getConceptsByCategory(categorySlug);
  // Keep only 10 lightweight sibling concepts for game padding to avoid serializing 400 full essays into RSC payload
  const idx = rawCategoryConcepts.findIndex((c) => c.id === concept.id);
  const start = idx >= 0 ? (idx + 1) % Math.max(1, rawCategoryConcepts.length) : 0;
  const paddingPool = [];
  for (let i = 0; i < rawCategoryConcepts.length && paddingPool.length < 10; i++) {
    const item = rawCategoryConcepts[(start + i) % rawCategoryConcepts.length];
    if (item && item.id !== concept.id) {
      paddingPool.push(toLightweightConcept(item));
    }
  }
  const categoryConcepts = paddingPool;
  const relatedConcepts = getRelatedConcepts(concept, 3).map(toLightweightConcept);

  // Schema.org DefinedTerm JSON-LD structure
  const jsonLd = {
    "@context": "https://schema.org",
    "@type": "DefinedTerm",
    "name": concept.title,
    "description": concept.description,
    "termCode": concept.id,
    "inDefinedTermSet": {
      "@type": "DefinedTermSet",
      "name": `${concept.categoryName} Terimleri Sözlüğü | Memolandum`,
      "url": absoluteUrl(`/sozluk/${categorySlug}/`)
    }
  };

  return (
    <div className="min-h-screen bg-[#070b14] text-slate-200 font-sans pb-24">
      {/* JSON-LD Script Injection */}
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd) }}
      />

      <Header />

      <main className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 pt-8 sm:pt-12">
        {/* Navigation Breadcrumbs */}
        <nav className="flex items-center gap-2 text-xs font-semibold text-slate-500 mb-8 select-none">
          <Link href="/" className="hover:text-slate-300 transition-colors">Ana Sayfa</Link>
          <span>/</span>
          <Link href="/sozluk/" className="hover:text-slate-300 transition-colors">Sözlük</Link>
          <span>/</span>
          <Link href={`/sozluk/${categorySlug}/`} className="hover:text-slate-300 transition-colors">{concept.categoryName}</Link>
          <span>/</span>
          <span className="text-cyan-400">{concept.title}</span>
        </nav>

        {/* 2-Column Responsive Layout */}
        <div className="grid gap-8 lg:grid-cols-3">
          
          {/* Main Info Column (Left) */}
          <article className="lg:col-span-2 flex flex-col gap-6">
            <header className="rounded-3xl border border-white/5 bg-slate-900/10 p-6 sm:p-8 relative overflow-hidden">
              <div className="absolute top-0 right-0 w-32 h-32 bg-cyan-500/5 blur-[40px] pointer-events-none rounded-full" />
              
              <div className="flex flex-wrap items-center gap-2 mb-4">
                <Link 
                  href={`/sozluk/${categorySlug}/`}
                  className="text-[10px] font-bold uppercase tracking-wider px-2.5 py-1 rounded-full bg-cyan-500/10 text-cyan-400 border border-cyan-500/20"
                >
                  {concept.categoryName}
                </Link>
                <span className="text-[10px] font-bold font-mono px-2 py-0.5 rounded border border-white/10 bg-white/5 text-slate-400">
                  {concept.level}
                </span>
              </div>

              <h1 className="text-3xl sm:text-4xl md:text-5xl font-black text-white tracking-tight mb-2">
                {concept.title}
              </h1>

              {concept.word_alt && (
                <p className="text-sm italic text-slate-400 mb-4">
                  Eş Anlamlısı / Alternatifi: <strong className="text-slate-300 font-semibold">{concept.word_alt}</strong>
                </p>
              )}

              {/* Translation/Primary definition box */}
              <div className="mt-6 rounded-2xl border border-cyan-500/20 bg-cyan-950/20 p-5 sm:p-6">
                <span className="text-[10px] font-bold font-mono text-cyan-400 uppercase tracking-widest block mb-2">
                  TANIM / AÇIKLAMA
                </span>
                <p className="text-lg sm:text-xl font-extrabold text-slate-100 leading-snug">
                  {concept.description}
                </p>
              </div>
            </header>

            {/* Detailed Context Section */}
            <section className="rounded-3xl border border-white/5 bg-slate-900/10 p-6 sm:p-8">
              <h2 className="text-xl font-bold text-slate-200 mb-4 pb-2 border-b border-white/5">
                Pedagojik ve Akademik Açıklama
              </h2>
              <div className="text-slate-300 text-base leading-relaxed space-y-4 font-medium">
                {concept.content.split("\n\n").map((para, i) => (
                  <p key={i}>{para}</p>
                ))}
              </div>
            </section>
          </article>

          {/* Interactive Gaming Actions Sidebar (Right) */}
          <aside className="flex flex-col gap-6">
            
            {/* Play Actions Box */}
            <div className="rounded-3xl border border-white/10 bg-gradient-to-b from-slate-900/50 to-slate-950 p-6 shadow-2xl relative overflow-hidden">
              <div className="absolute top-0 right-0 w-24 h-24 bg-lime-500/5 blur-[30px] pointer-events-none rounded-full" />
              
              <h2 className="text-lg font-black text-white tracking-tight mb-2">
                Bu Terimi Hafızala
              </h2>
              <p className="text-slate-400 text-xs leading-relaxed mb-6">
                Aşağıdaki arcade oyun kabukları ile <strong>{concept.title}</strong> kavramını eğlenerek ezberleyebilir, hafızanda kalıcı hale getirebilirsin.
              </p>

              <div className="flex flex-col gap-3">
                {/* Shooter button */}
                <PlayGlossaryButton
                  gameSlug="academic-shooter"
                  currentConcept={concept}
                  categoryConcepts={categoryConcepts}
                  className="w-full flex items-center justify-center gap-2.5 py-3.5 px-4 rounded-xl border border-cyan-400/20 bg-cyan-400/10 hover:bg-cyan-400 hover:text-slate-950 text-xs font-black text-cyan-300 transition-all cursor-pointer shadow-lg shadow-cyan-400/5"
                >
                  <svg xmlns="http://www.w3.org/2000/svg" width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round"><polygon points="5 3 19 12 5 21 5 3"></polygon></svg>
                  Retro Shooter ile Ezberle
                </PlayGlossaryButton>

                {/* Lexicon button */}
                <PlayGlossaryButton
                  gameSlug="academic-lexicon"
                  currentConcept={concept}
                  categoryConcepts={categoryConcepts}
                  className="w-full flex items-center justify-center gap-2.5 py-3.5 px-4 rounded-xl border border-lime-400/20 bg-lime-400/10 hover:bg-lime-400 hover:text-slate-950 text-xs font-black text-lime-300 transition-all cursor-pointer shadow-lg shadow-lime-400/5"
                >
                  <svg xmlns="http://www.w3.org/2000/svg" width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round"><path d="M4 19.5A2.5 2.5 0 0 1 6.5 17H20"></path><path d="M6.5 2H20v20H6.5A2.5 2.5 0 0 1 4 19.5v-15A2.5 2.5 0 0 1 6.5 2z"></path></svg>
                  My Lexicon ile Çalış
                </PlayGlossaryButton>
              </div>

              <div className="mt-5 pt-4 border-t border-white/5 text-[10px] text-slate-500 font-medium">
                * Seçtiğin terimin yanında aynı kategoriden 9 rastgele terim daha oyun seviyesine eklenecektir.
              </div>
            </div>

            {/* Scientific Method Box */}
            <div className="rounded-3xl border border-white/5 bg-slate-900/20 p-6">
              <h3 className="text-xs font-bold uppercase tracking-wider text-slate-300 mb-2">
                Bilimsel Hafıza Metodu
              </h3>
              <p className="text-xs text-slate-400 leading-relaxed mb-3">
                Memolandum, Hermann Ebbinghaus'un <strong>unutma eğrisi</strong> araştırmalarını temel alır. Oyunlar sırasında yaptığın doğru ve yanlışlara göre kelimelerin tekrar edilme sıklığı otomatik olarak ayarlanır.
              </p>
              <Link 
                href="/method/"
                className="text-[10px] font-bold text-cyan-400 hover:underline"
              >
                Nasıl çalışır? Detayları oku →
              </Link>
            </div>
          </aside>
        </div>

        {/* Related Concepts Bottom section */}
        <RelatedConcepts 
          relatedConcepts={relatedConcepts} 
          categoryConcepts={categoryConcepts} 
        />
      </main>
    </div>
  );
}
