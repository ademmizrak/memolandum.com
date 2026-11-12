import {
  absoluteUrl,
  OG_IMAGE,
  PAGE_SEO,
  SITE_NAME,
  SITE_URL,
} from "@/lib/seo/siteConfig";
import React from "react";
import Link from "next/link";
import Header from "@/components/Header";
import GlossaryHero from "@/components/glossary/GlossaryHero";
import PlayGlossaryButton from "@/components/glossary/PlayGlossaryButton";
import { getAllCategories, loadGlossaryData, getConceptsByCategory, toLightweightConcept } from "@/lib/glossary";

const meta = PAGE_SEO.sozluk;

export const metadata = {
  title: { absolute: meta.title },
  description: meta.description,
  keywords: meta.keywords,
  alternates: {
    canonical: absoluteUrl("/sozluk/"),
  },
  openGraph: {
    title: meta.title,
    description: meta.description,
    url: absoluteUrl("/sozluk/"),
    images: [
      {
        url: OG_IMAGE,
        width: 1200,
        height: 630,
        alt: "Memolandum KPSS & Akademik Sözlük",
      },
    ],
    locale: "tr_TR",
    alternateLocale: ["en_US", "ar_SA", "pt_BR"],
    type: "website",
    siteName: SITE_NAME,
  },
  twitter: {
    card: "summary_large_image",
    title: "KPSS & Academic Glossary | 4,000 Concepts — Memolandum",
    description: meta.description,
    images: [OG_IMAGE],
  },
  robots: { index: true, follow: true },
};

export default async function GlossaryHomePage() {
  const categories = getAllCategories();
  const allConcepts = loadGlossaryData().map(toLightweightConcept);

  const glossaryJsonLd = {
    "@context": "https://schema.org",
    "@type": "DefinedTermSet",
    "@id": `${SITE_URL}/sozluk/#glossary`,
    name: "Memolandum KPSS & Akademik Sözlük",
    alternateName: ["KPSS Glossary", "Academic Glossary Memolandum"],
    description: meta.description,
    url: absoluteUrl("/sozluk/"),
    inLanguage: "tr",
    numberOfItems: allConcepts.length,
    hasDefinedTerm: categories.map((cat) => ({
      "@type": "DefinedTerm",
      name: cat.name,
      description: cat.desc,
      url: absoluteUrl(`/sozluk/${cat.slug}/`),
    })),
  };

  // Get 6 featured random concepts for search engine crawling and visual interest
  // Since this is a server component rendered during static generation, it will be a stable set at build time
  const featuredConcepts = [...allConcepts]
    .sort((a, b) => a.title.localeCompare(b.title))
    .slice(100, 106); // Stably grab 6 items from index 100-106

  return (
    <div className="min-h-screen bg-[#070b14] text-slate-200 font-sans pb-24">
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(glossaryJsonLd) }}
      />
      <Header />
      
      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 pt-8 sm:pt-12">
        {/* Glossary Header/Hero section */}
        <GlossaryHero allConcepts={allConcepts} />

        {/* 10 Categories Grid */}
        <section className="mb-16">
          <h2 className="text-2xl font-black text-white tracking-tight mb-8">
            Kategorilere Göre Keşfet
          </h2>
          
          <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
            {categories.map((cat) => {
              // Load 24 concepts for this category to pass to quick-play buttons
              const catConcepts = getConceptsByCategory(cat.slug).slice(0, 24).map(toLightweightConcept);

              return (
                <div 
                  key={cat.slug}
                  className="group relative flex flex-col justify-between rounded-2xl border border-white/5 bg-slate-900/20 p-6 backdrop-blur-sm transition-all duration-300 hover:border-cyan-500/20 hover:bg-slate-900/40 hover:-translate-y-1 hover:shadow-2xl hover:shadow-cyan-500/[0.01]"
                >
                  <div>
                    <div className="flex items-center justify-between mb-4">
                      <span className="text-[10px] font-bold uppercase tracking-wider px-2.5 py-1 rounded-full bg-cyan-500/10 text-cyan-400 border border-cyan-500/10">
                        {cat.count} Kavram
                      </span>
                    </div>

                    <h3 className="text-xl font-bold text-slate-100 group-hover:text-cyan-400 transition-colors mb-3">
                      <Link href={`/sozluk/${cat.slug}/`}>
                        {cat.name}
                      </Link>
                    </h3>

                    <p className="text-slate-400 text-sm leading-relaxed mb-6 line-clamp-3">
                      {cat.desc}
                    </p>
                  </div>

                  <div className="flex flex-col gap-3 pt-4 border-t border-white/5">
                    {/* Action buttons */}
                    <div className="grid grid-cols-2 gap-2">
                      <PlayGlossaryButton
                        gameSlug="academic-shooter"
                        concepts={catConcepts}
                        className="flex items-center justify-center gap-1.5 py-2 px-3 rounded-lg border border-cyan-400/20 bg-cyan-400/5 text-[11px] font-extrabold text-cyan-400 hover:bg-cyan-400 hover:text-slate-950 transition-all cursor-pointer"
                      >
                        <svg xmlns="http://www.w3.org/2000/svg" width="10" height="10" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round"><polygon points="5 3 19 12 5 21 5 3"></polygon></svg>
                        Shooter'da Oyna
                      </PlayGlossaryButton>

                      <PlayGlossaryButton
                        gameSlug="academic-lexicon"
                        concepts={catConcepts}
                        className="flex items-center justify-center gap-1.5 py-2 px-3 rounded-lg border border-lime-400/20 bg-lime-400/5 text-[11px] font-extrabold text-lime-400 hover:bg-lime-400 hover:text-slate-950 transition-all cursor-pointer"
                      >
                        <svg xmlns="http://www.w3.org/2000/svg" width="10" height="10" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round"><path d="M4 19.5A2.5 2.5 0 0 1 6.5 17H20"></path><path d="M6.5 2H20v20H6.5A2.5 2.5 0 0 1 4 19.5v-15A2.5 2.5 0 0 1 6.5 2z"></path></svg>
                        Lexicon'la Çalış
                      </PlayGlossaryButton>
                    </div>

                    <Link 
                      href={`/sozluk/${cat.slug}/`}
                      className="text-center text-xs font-bold text-slate-400 hover:text-white transition-colors py-1.5"
                    >
                      Kavramları İstele →
                    </Link>
                  </div>
                </div>
              );
            })}
          </div>
        </section>

        {/* Featured Random Concepts Section */}
        <section className="mt-16">
          <div className="flex items-center justify-between mb-8">
            <div>
              <h2 className="text-2xl font-black text-white tracking-tight">
                Günün Öne Çıkan Kavramları
              </h2>
              <p className="text-slate-400 text-sm mt-1">
                Her gün yeni akademik terimleri keşfedin ve hafızanıza kaydedin.
              </p>
            </div>
          </div>

          <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
            {featuredConcepts.map((concept) => (
              <div 
                key={concept.id}
                className="group relative flex flex-col justify-between rounded-2xl border border-white/5 bg-slate-900/10 p-6 transition-all duration-300 hover:border-cyan-500/20 hover:bg-slate-900/30"
              >
                <div>
                  <div className="flex items-start justify-between gap-3 mb-2">
                    <h3 className="font-extrabold text-slate-100 group-hover:text-cyan-400 transition-colors line-clamp-1">
                      <Link href={`/sozluk/${concept.category}/${concept.slug}/`}>
                        {concept.title}
                      </Link>
                    </h3>
                    <span className="text-[9px] font-bold uppercase text-slate-400 bg-white/[0.04] px-1.5 py-0.5 rounded">
                      {concept.categoryName}
                    </span>
                  </div>
                  <p className="text-slate-400 text-sm leading-relaxed mb-6 line-clamp-2">
                    {concept.description}
                  </p>
                </div>
                <div className="flex items-center justify-between border-t border-white/5 pt-4">
                  <Link 
                    href={`/sozluk/${concept.category}/${concept.slug}/`}
                    className="text-xs font-bold text-slate-400 hover:text-white transition-colors"
                  >
                    Detayı Gör →
                  </Link>
                  <span className="text-[10px] font-mono text-cyan-400/80 bg-cyan-400/5 px-2 py-0.5 rounded border border-cyan-400/10">
                    {concept.level}
                  </span>
                </div>
              </div>
            ))}
          </div>
        </section>
      </main>
    </div>
  );
}
