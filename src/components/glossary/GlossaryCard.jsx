"use client";

import React from "react";
import Link from "next/link";
import PlayGlossaryButton from "./PlayGlossaryButton";

export default function GlossaryCard({ concept, categoryConcepts = [], showCategoryBadge = false }) {
  const { title, slug, category, categoryName, description, level, word_alt } = concept;

  return (
    <div className="group relative flex flex-col justify-between rounded-2xl border border-white/5 bg-slate-900/30 p-5 sm:p-6 backdrop-blur-sm transition-all duration-300 hover:-translate-y-1 hover:border-cyan-500/20 hover:bg-slate-900/50 hover:shadow-xl hover:shadow-cyan-500/[0.02]">
      {/* Glow highlight */}
      <div className="absolute inset-0 rounded-2xl bg-gradient-to-b from-cyan-500/0 to-cyan-500/0 opacity-0 group-hover:from-cyan-500/[0.02] group-hover:opacity-100 transition-all duration-300 pointer-events-none" />

      <div>
        <div className="flex items-start justify-between gap-3 mb-2">
          <h3 className="font-extrabold text-lg text-slate-100 group-hover:text-cyan-400 transition-colors line-clamp-1">
            <Link href={`/sozluk/${category}/${slug}/`} prefetch={false}>
              {title}
            </Link>
          </h3>
          <span className="shrink-0 text-[10px] font-bold font-mono px-2 py-0.5 rounded border border-cyan-500/20 bg-cyan-500/10 text-cyan-400">
            {level}
          </span>
        </div>

        {word_alt && (
          <p className="text-xs italic text-slate-500 mb-3 line-clamp-1">
            Alternatif: {word_alt}
          </p>
        )}

        <p className="text-slate-400 text-sm leading-relaxed mb-6 line-clamp-3">
          {description}
        </p>
      </div>

      <div className="relative z-10 flex items-center justify-between pt-4 border-t border-white/5">
        <div className="flex items-center gap-2">
          {showCategoryBadge && (
            <span className="text-[10px] font-bold uppercase tracking-wider text-slate-500 bg-white/[0.03] border border-white/5 px-2 py-0.5 rounded">
              {categoryName}
            </span>
          )}
          <Link
            href={`/sozluk/${category}/${slug}/`}
            prefetch={false}
            className="text-xs font-bold text-slate-400 hover:text-white transition-colors"
          >
            İncele →
          </Link>
        </div>

        {/* Action icons for instant gaming */}
        <div className="flex items-center gap-1.5">
          {/* Play with Lexicon */}
          <PlayGlossaryButton
            gameSlug="lexicon"
            currentConcept={concept}
            categoryConcepts={categoryConcepts}
            className="flex h-8 w-8 items-center justify-center rounded-lg border border-lime-400/20 bg-lime-400/5 text-lime-400 hover:bg-lime-400 hover:text-slate-950 transition-all cursor-pointer"
            title="Kelime Kartları ile Çalış"
          >
            <svg xmlns="http://www.w3.org/2000/svg" width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><path d="M4 19.5A2.5 2.5 0 0 1 6.5 17H20"></path><path d="M6.5 2H20v20H6.5A2.5 2.5 0 0 1 4 19.5v-15A2.5 2.5 0 0 1 6.5 2z"></path></svg>
          </PlayGlossaryButton>

          {/* Play with Shooter */}
          <PlayGlossaryButton
            gameSlug="shooter"
            currentConcept={concept}
            categoryConcepts={categoryConcepts}
            className="flex h-8 w-8 items-center justify-center rounded-lg border border-cyan-400/20 bg-cyan-400/5 text-cyan-400 hover:bg-cyan-400 hover:text-slate-950 transition-all cursor-pointer"
            title="Retro Shooter ile Ezberle"
          >
            <svg xmlns="http://www.w3.org/2000/svg" width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><polygon points="5 3 19 12 5 21 5 3"></polygon></svg>
          </PlayGlossaryButton>
        </div>
      </div>
    </div>
  );
}
