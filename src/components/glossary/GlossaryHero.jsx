"use client";

import React, { useState, useEffect, useRef } from "react";
import Link from "next/link";

export default function GlossaryHero({ allConcepts = [] }) {
  const [query, setQuery] = useState("");
  const [results, setResults] = useState([]);
  const [isOpen, setIsOpen] = useState(false);
  const searchRef = useRef(null);

  useEffect(() => {
    if (!query.trim()) {
      setResults([]);
      return;
    }

    const q = query.toLowerCase();
    const filtered = allConcepts
      .filter((c) => 
        c.title.toLowerCase().includes(q) || 
        c.description.toLowerCase().includes(q) ||
        c.categoryName.toLowerCase().includes(q)
      )
      .slice(0, 8); // Limit to top 8 matches

    setResults(filtered);
  }, [query, allConcepts]);

  // Close search results when clicking outside
  useEffect(() => {
    function handleClickOutside(event) {
      if (searchRef.current && !searchRef.current.contains(event.target)) {
        setIsOpen(false);
      }
    }
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  return (
    <section className="relative overflow-hidden rounded-3xl border border-white/10 bg-slate-950/40 p-8 sm:p-12 md:p-16 mb-12 backdrop-blur-md">
      {/* Decorative Gradient Glows */}
      <div className="absolute -top-24 -left-24 h-72 w-72 rounded-full bg-cyan-500/10 blur-[80px] pointer-events-none" />
      <div className="absolute -bottom-24 -right-24 h-72 w-72 rounded-full bg-emerald-500/10 blur-[80px] pointer-events-none" />

      <div className="relative z-10 max-w-2xl mx-auto text-center">
        <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-semibold bg-cyan-500/10 text-cyan-400 border border-cyan-500/20 mb-4 animate-pulse">
          🎯 Pedagojik Akademik Sözlük
        </span>
        <h1 className="text-4xl sm:text-5xl md:text-6xl font-black tracking-tight text-white mb-6 leading-tight">
          Aradığın Bilgiyi <br />
          <span className="bg-gradient-to-r from-cyan-400 via-teal-400 to-emerald-400 bg-clip-text text-transparent">
            Keşfet & Hafızala
          </span>
        </h1>
        <p className="text-slate-400 text-base sm:text-lg leading-relaxed mb-8 max-w-xl mx-auto">
          10 kategori ve 4.000 akademik terim. Ebbinghaus aralıklı tekrar yöntemi ve retro arcade oyunlarımızla bilgiyi kalıcı hafızana işle.
        </p>

        {/* Real-time Search Box */}
        <div ref={searchRef} className="relative w-full max-w-lg mx-auto">
          <div className="relative flex items-center">
            <span className="absolute left-4 text-slate-500">
              <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><circle cx="11" cy="11" r="8"></circle><line x1="21" y1="21" x2="16.65" y2="16.65"></line></svg>
            </span>
            <input
              type="text"
              value={query}
              onChange={(e) => {
                setQuery(e.target.value);
                setIsOpen(true);
              }}
              onFocus={() => setIsOpen(true)}
              placeholder="Terim, kavram veya kategori ara..."
              className="w-full rounded-2xl border border-white/10 bg-slate-900/80 pl-12 pr-10 py-4 text-white placeholder-slate-500 outline-none focus:border-cyan-500/50 focus:ring-2 focus:ring-cyan-500/10 transition-all font-medium text-base shadow-xl"
            />
            {query && (
              <button
                onClick={() => setQuery("")}
                className="absolute right-4 text-slate-500 hover:text-white transition-colors"
              >
                <svg xmlns="http://www.w3.org/2000/svg" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><line x1="18" y1="6" x2="6" y2="18"></line><line x1="6" y1="6" x2="18" y2="18"></line></svg>
              </button>
            )}
          </div>

          {/* Search Dropdown Results */}
          {isOpen && results.length > 0 && (
            <div className="absolute z-50 left-0 right-0 mt-2 rounded-2xl border border-white/10 bg-slate-950/95 p-2 shadow-2xl backdrop-blur-xl max-h-96 overflow-y-auto animate-in fade-in slide-in-from-top-2 duration-200">
              {results.map((c) => (
                <Link
                  key={c.id}
                  href={`/sozluk/${c.category}/${c.slug}/`}
                  onClick={() => setIsOpen(false)}
                  className="flex flex-col items-start gap-1 rounded-xl px-4 py-3 hover:bg-white/[0.04] transition-colors text-left group"
                >
                  <div className="flex items-center justify-between w-full">
                    <span className="font-bold text-slate-100 group-hover:text-cyan-400 transition-colors">
                      {c.title}
                    </span>
                    <span className="text-[10px] font-bold tracking-wider uppercase px-2 py-0.5 rounded bg-white/[0.05] text-slate-400 group-hover:text-slate-200">
                      {c.categoryName}
                    </span>
                  </div>
                  <span className="text-xs text-slate-400 line-clamp-1">
                    {c.description}
                  </span>
                </Link>
              ))}
            </div>
          )}

          {isOpen && query.trim() && results.length === 0 && (
            <div className="absolute z-50 left-0 right-0 mt-2 rounded-2xl border border-white/10 bg-slate-950 p-4 text-center text-sm text-slate-500 shadow-2xl">
              Sonuç bulunamadı. Lütfen başka bir kelime deneyin.
            </div>
          )}
        </div>
      </div>
    </section>
  );
}
