"use client";

import React, { useState, useMemo } from "react";
import Link from "next/link";
import GlossaryCard from "@/components/glossary/GlossaryCard";
import PlayGlossaryButton from "@/components/glossary/PlayGlossaryButton";

const ALPHABET = [
  "A", "B", "C", "Ç", "D", "E", "F", "G", "H", "I", "İ", "J", "K", "L", 
  "M", "N", "O", "Ö", "P", "R", "S", "Ş", "T", "U", "Ü", "V", "Y", "Z"
];

export default function CategoryClient({ category, concepts = [] }) {
  const [selectedLetter, setSelectedLetter] = useState("TÜMÜ");
  const [searchQuery, setSearchQuery] = useState("");
  const [currentPage, setCurrentPage] = useState(1);
  const itemsPerPage = 24;

  // Filter concepts based on A-Z letter and search query
  const filteredConcepts = useMemo(() => {
    let result = concepts;

    // Apply search query filter
    if (searchQuery.trim()) {
      const q = searchQuery.toLowerCase();
      result = result.filter(
        (c) => 
          c.title.toLowerCase().includes(q) || 
          c.description.toLowerCase().includes(q)
      );
    }

    // Apply letter filter
    if (selectedLetter !== "TÜMÜ") {
      result = result.filter((c) => {
        const firstLetter = c.title.trim().charAt(0).toUpperCase();
        
        // Handle Turkish character edge cases in comparisons
        if (selectedLetter === "I" && firstLetter === "ı") return true;
        if (selectedLetter === "İ" && firstLetter === "i") return true;
        
        return firstLetter === selectedLetter;
      });
    }

    return result;
  }, [concepts, selectedLetter, searchQuery]);

  // Reset page when filter changes
  React.useEffect(() => {
    setCurrentPage(1);
  }, [selectedLetter, searchQuery]);

  // Pagination logic
  const totalPages = Math.ceil(filteredConcepts.length / itemsPerPage);
  const paginatedConcepts = useMemo(() => {
    const startIndex = (currentPage - 1) * itemsPerPage;
    return filteredConcepts.slice(startIndex, startIndex + itemsPerPage);
  }, [filteredConcepts, currentPage]);

  return (
    <div className="min-h-screen bg-[#070b14] text-slate-200 font-sans pb-24">
      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 pt-8 sm:pt-12">
        
        {/* Navigation Breadcrumb */}
        <nav className="flex items-center gap-2 text-xs font-semibold text-slate-500 mb-6">
          <Link href="/" className="hover:text-slate-300 transition-colors">Ana Sayfa</Link>
          <span>/</span>
          <Link href="/sozluk/" className="hover:text-slate-300 transition-colors">Sözlük</Link>
          <span>/</span>
          <span className="text-cyan-400">{category.name}</span>
        </nav>

        {/* Category Header Card */}
        <section className="relative overflow-hidden rounded-3xl border border-white/10 bg-slate-950/40 p-8 sm:p-12 mb-12 backdrop-blur-md">
          <div className="absolute -top-24 -left-24 h-72 w-72 rounded-full bg-cyan-500/5 blur-[80px] pointer-events-none" />
          <div className="absolute -bottom-24 -right-24 h-72 w-72 rounded-full bg-lime-500/5 blur-[80px] pointer-events-none" />

          <div className="relative z-10 flex flex-col md:flex-row md:items-center justify-between gap-8">
            <div className="max-w-2xl">
              <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-semibold bg-cyan-500/10 text-cyan-400 border border-cyan-500/20 mb-4">
                📚 {category.count} Akademik Kavram
              </span>
              <h1 className="text-3xl sm:text-4xl md:text-5xl font-black tracking-tight text-white mb-4">
                {category.name} Sözlüğü
              </h1>
              <p className="text-slate-400 text-sm sm:text-base leading-relaxed">
                {category.desc}
              </p>
            </div>

            {/* Quick Game Actions */}
            <div className="shrink-0 flex flex-col gap-3 bg-white/[0.02] border border-white/5 p-5 rounded-2xl md:min-w-[280px]">
              <span className="text-xs font-extrabold text-slate-400 uppercase tracking-wider block mb-1">
                Kategori Oyun Seviyeleri
              </span>
              
              <PlayGlossaryButton
                gameSlug="academic-shooter"
                concepts={concepts}
                className="w-full flex items-center justify-center gap-2 py-3 px-4 rounded-xl border border-cyan-400/20 bg-cyan-400/10 text-xs font-black text-cyan-300 hover:bg-cyan-400 hover:text-slate-950 transition-all cursor-pointer shadow-lg shadow-cyan-400/5"
              >
                <svg xmlns="http://www.w3.org/2000/svg" width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round"><polygon points="5 3 19 12 5 21 5 3"></polygon></svg>
                Retro Shooter ile Oyna
              </PlayGlossaryButton>

              <PlayGlossaryButton
                gameSlug="academic-lexicon"
                concepts={concepts}
                className="w-full flex items-center justify-center gap-2 py-3 px-4 rounded-xl border border-lime-400/20 bg-lime-400/10 text-xs font-black text-lime-300 hover:bg-lime-400 hover:text-slate-950 transition-all cursor-pointer shadow-lg shadow-lime-400/5"
              >
                <svg xmlns="http://www.w3.org/2000/svg" width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round"><path d="M4 19.5A2.5 2.5 0 0 1 6.5 17H20"></path><path d="M6.5 2H20v20H6.5A2.5 2.5 0 0 1 4 19.5v-15A2.5 2.5 0 0 1 6.5 2z"></path></svg>
                My Lexicon ile Ezberle
              </PlayGlossaryButton>
            </div>
          </div>
        </section>

        {/* Filter Controls (Search + Alphabet Navigation) */}
        <section className="mb-10 flex flex-col gap-6">
          <div className="flex flex-col md:flex-row md:items-center gap-4 justify-between">
            {/* Local Search input */}
            <div className="relative w-full md:max-w-xs">
              <span className="absolute left-3.5 text-slate-500 top-1/2 -translate-y-1/2">
                <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><circle cx="11" cy="11" r="8"></circle><line x1="21" y1="21" x2="16.65" y2="16.65"></line></svg>
              </span>
              <input
                type="text"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                placeholder="Kategori içinde terim ara..."
                className="w-full rounded-xl border border-white/10 bg-slate-900/50 pl-10 pr-4 py-2.5 text-sm text-white placeholder-slate-500 outline-none focus:border-cyan-500/50 transition-all shadow-inner"
              />
            </div>

            {/* Letter summary label */}
            <div className="text-xs font-semibold text-slate-500">
              Kriterlere uyan <strong className="text-cyan-400">{filteredConcepts.length}</strong> kavram bulundu.
            </div>
          </div>

          {/* Alphabet Tabs */}
          <div className="flex flex-wrap items-center gap-1.5 pb-2 border-b border-white/5 overflow-x-auto select-none">
            <button
              onClick={() => setSelectedLetter("TÜMÜ")}
              className={`px-3 py-1.5 rounded-lg text-xs font-bold transition-all cursor-pointer ${
                selectedLetter === "TÜMÜ"
                  ? "bg-cyan-500 text-slate-950 shadow-md"
                  : "bg-white/[0.02] border border-white/5 text-slate-400 hover:text-white"
              }`}
            >
              Tümü
            </button>
            {ALPHABET.map((letter) => (
              <button
                key={letter}
                onClick={() => setSelectedLetter(letter)}
                className={`w-8 h-8 rounded-lg text-xs font-bold transition-all flex items-center justify-center cursor-pointer ${
                  selectedLetter === letter
                    ? "bg-cyan-500 text-slate-950 shadow-md"
                    : "bg-white/[0.02] border border-white/5 text-slate-400 hover:text-white"
                }`}
              >
                {letter}
              </button>
            ))}
          </div>
        </section>

        {/* Concepts Grid */}
        {paginatedConcepts.length > 0 ? (
          <section className="grid gap-6 sm:grid-cols-2 md:grid-cols-3">
            {paginatedConcepts.map((concept) => (
              <GlossaryCard 
                key={concept.id} 
                concept={concept} 
                categoryConcepts={concepts}
              />
            ))}
          </section>
        ) : (
          <div className="text-center py-16 rounded-2xl border border-dashed border-white/10 bg-slate-900/5">
            <p className="text-slate-500 text-sm font-medium">
              Arama kriterlerinize uygun hiçbir kavram bulunamadı.
            </p>
          </div>
        )}

        {/* Pagination buttons */}
        {totalPages > 1 && (
          <nav className="flex justify-center items-center gap-2 mt-12">
            <button
              onClick={() => setCurrentPage((p) => Math.max(1, p - 1))}
              disabled={currentPage === 1}
              className="px-4 py-2 rounded-xl text-xs font-bold border border-white/10 bg-slate-900/50 hover:bg-slate-900 hover:border-cyan-500/20 disabled:opacity-30 transition-all cursor-pointer"
            >
              Önceki
            </button>
            <span className="text-xs font-semibold text-slate-500 px-3">
              Sayfa {currentPage} / {totalPages}
            </span>
            <button
              onClick={() => setCurrentPage((p) => Math.min(totalPages, p + 1))}
              disabled={currentPage === totalPages}
              className="px-4 py-2 rounded-xl text-xs font-bold border border-white/10 bg-slate-900/50 hover:bg-slate-900 hover:border-cyan-500/20 disabled:opacity-30 transition-all cursor-pointer"
            >
              Sonraki
            </button>
          </nav>
        )}
      </main>
    </div>
  );
}
