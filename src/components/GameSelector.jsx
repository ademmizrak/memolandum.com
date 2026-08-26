"use client";

import React from "react";
import { useT } from "../lib/i18n/LocaleProvider";

const GAMES = [
  { 
    id: 'shooter', 
    categoryLabel: 'SPACE SHOOTER', 
    name: 'Retro Shooter', 
    desc: 'Meteordaki kelimeleri vurarak eşle.',
    colors: { text: 'text-cyan-400', border: 'border-cyan-400', shadow: 'shadow-[0_0_15px_rgba(34,211,238,0.4)]', bg: 'bg-cyan-400' },
    iconSvg: (
      <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="w-full h-full drop-shadow-[0_0_10px_rgba(6,182,212,0.8)]">
        <path d="M12 2S8 7 8 12c0 3 2 4 4 6 2-2 4-3 4-6 0-5-4-10-4-10z" fill="rgba(6,182,212,0.2)" stroke="#06b6d4" />
        <path d="M8 12H4l2 3h2v-3z" fill="#0891b2" />
        <path d="M16 12h4l-2 3h-2v-3z" fill="#0891b2" />
        <path d="M12 18v4M10 19v2M14 19v2" stroke="#f97316" strokeWidth="2.5" />
      </svg>
    )
  },
  { 
    id: 'breakout', 
    categoryLabel: 'BRICK BREAKER', 
    name: 'Breakout DX-Ball', 
    desc: 'Tuğlaları kırarak kelimeleri eşle.',
    colors: { text: 'text-pink-500', border: 'border-pink-500', shadow: 'shadow-[0_0_15px_rgba(236,72,153,0.4)]', bg: 'bg-pink-500' },
    iconSvg: (
      <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="w-full h-full drop-shadow-[0_0_10px_rgba(236,72,153,0.8)]">
        <rect x="2" y="3" width="6" height="3" rx="1" fill="#db2777" stroke="#ec4899" />
        <rect x="9" y="3" width="6" height="3" rx="1" fill="none" stroke="#ec4899" opacity="0.4" />
        <rect x="16" y="3" width="6" height="3" rx="1" fill="#db2777" stroke="#ec4899" />
        <rect x="4" y="7" width="7" height="3" rx="1" fill="#db2777" stroke="#ec4899" />
        <rect x="13" y="7" width="7" height="3" rx="1" fill="#db2777" stroke="#ec4899" />
        <circle cx="10" cy="12" r="2" fill="#f43f5e" stroke="#f43f5e" />
        <rect x="6" y="18" width="12" height="3" rx="1.5" fill="#db2777" stroke="#ec4899" />
      </svg>
    )
  },
  { 
    id: 'highway', 
    categoryLabel: 'LANE RACER', 
    name: 'Highway Survivor', 
    desc: 'Siber şeritlerde doğru şeride sür.',
    colors: { text: 'text-yellow-400', border: 'border-yellow-400', shadow: 'shadow-[0_0_15px_rgba(250,204,21,0.4)]', bg: 'bg-yellow-400' },
    iconSvg: (
      <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="w-full h-full drop-shadow-[0_0_10px_rgba(250,204,21,0.8)]">
        <path d="M4 21L10 3M20 21L14 3" stroke="#eab308" />
        <path d="M12 20v-3M12 14v-2M12 9V8" stroke="#fef08a" strokeWidth="1.5" />
        <rect x="9" y="13" width="6" height="5" rx="1" fill="rgba(234,179,8,0.2)" stroke="#eab308" />
        <circle cx="10.5" cy="18" r="1" fill="#eab308" />
        <circle cx="13.5" cy="18" r="1" fill="#eab308" />
      </svg>
    )
  },
  { 
    id: 'invaders', 
    categoryLabel: 'NEON SHMUP', 
    name: 'Siberian Invaders', 
    desc: 'Uzay istilacılarını formasyonla vur.',
    colors: { text: 'text-purple-500', border: 'border-purple-500', shadow: 'shadow-[0_0_15px_rgba(168,85,247,0.4)]', bg: 'bg-purple-500' },
    iconSvg: (
      <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="w-full h-full drop-shadow-[0_0_10px_rgba(168,85,247,0.8)]">
        <path d="M4 8h2v2H4V8zm4 0h8V6H8v2zm10 0h2v2h-2V8zm-2 4h2v-2h-2v2zm-10 0H4v-2h2v2zm10 2v2H6v-2h12zm2 2v2h-2v-2h2zM4 16v2h2v-2H4zm6 4h4v-2h-4v2z" fill="rgba(168,85,247,0.2)" stroke="#a855f7" />
        <circle cx="9" cy="10" r="1" fill="#c084fc" />
        <circle cx="15" cy="10" r="1" fill="#c084fc" />
      </svg>
    )
  },
  { 
    id: 'wordascent', 
    categoryLabel: 'VERTICAL CLIMBER', 
    name: 'The Word Ascent', 
    desc: 'Platformlarda zıplayarak tırman.',
    colors: { text: 'text-emerald-500', border: 'border-emerald-500', shadow: 'shadow-[0_0_15px_rgba(16,185,129,0.4)]', bg: 'bg-emerald-500' },
    iconSvg: (
      <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="w-full h-full drop-shadow-[0_0_10px_rgba(16,185,129,0.8)]">
        <line x1="3" y1="19" x2="9" y2="19" stroke="#10b981" strokeWidth="2.5" />
        <line x1="8" y1="14" x2="14" y2="14" stroke="#10b981" strokeWidth="2.5" />
        <line x1="13" y1="9" x2="19" y2="9" stroke="#10b981" strokeWidth="2.5" />
        <path d="M6 19c1-4 2-5 4-5s2-4 3-5" stroke="#34d399" strokeDasharray="2,2" />
        <path d="M19 4l1 2 2 1-2 1-1 2-1-2-2-1 2-1z" fill="#34d399" />
      </svg>
    )
  },
  { 
    id: 'worddrop', 
    categoryLabel: 'DIKEY TETRIS', 
    name: 'Reverse Word Drop', 
    desc: 'Blokları Tetris gibi yerleştir.',
    colors: { text: 'text-rose-500', border: 'border-rose-500', shadow: 'shadow-[0_0_15px_rgba(244,63,94,0.4)]', bg: 'bg-rose-500' },
    iconSvg: (
      <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="w-full h-full drop-shadow-[0_0_10px_rgba(244,63,94,0.8)]">
        <rect x="2" y="17" width="5" height="5" rx="1" fill="#f43f5e" stroke="#fb7185" />
        <rect x="7" y="17" width="5" height="5" rx="1" fill="#f43f5e" stroke="#fb7185" />
        <rect x="12" y="12" width="5" height="5" rx="1" fill="#f43f5e" stroke="#fb7185" />
        <rect x="12" y="17" width="5" height="5" rx="1" fill="#f43f5e" stroke="#fb7185" />
        <rect x="7" y="4" width="5" height="5" rx="1" fill="rgba(244,63,94,0.3)" stroke="#fb7185" className="animate-bounce" />
        <rect x="7" y="9" width="5" height="5" rx="1" fill="rgba(244,63,94,0.3)" stroke="#fb7185" className="animate-bounce" />
      </svg>
    )
  },
  { 
    id: 'quiz', 
    categoryLabel: 'MEMOLANDUM QUIZ', 
    name: 'Retro Quiz', 
    desc: 'Kelimeleri çoktan seçmeli sorularla patlat.',
    colors: { text: 'text-amber-400', border: 'border-amber-400', shadow: 'shadow-[0_0_15px_rgba(245,158,11,0.4)]', bg: 'bg-amber-500' },
    iconSvg: (
      <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="w-full h-full drop-shadow-[0_0_10px_rgba(245,158,11,0.8)]">
        <path d="M9.09 9a3 3 0 0 1 5.83 1c0 2-3 3-3 3" stroke="#f59e0b" strokeWidth="2.5" />
        <circle cx="12" cy="17" r="1.25" fill="#f59e0b" />
        <rect x="2" y="2" width="6" height="4" rx="1" fill="none" stroke="#f59e0b" opacity="0.5" />
        <path d="M4 5.5l1-3 1 3M3.5 4.5h3" stroke="#f59e0b" strokeWidth="1" />
        <rect x="16" y="18" width="6" height="4" rx="1" fill="rgba(245,158,11,0.2)" stroke="#f59e0b" />
        <path d="M18 19.5c.5-.5 1-.2 1 .2s-.5.8-1 .2" stroke="#f59e0b" strokeWidth="1" />
      </svg>
    )
  },
  {
    id: 'lexicon',
    categoryLabel: 'TOKEN ARCADE',
    name: 'Lexicon Tokens',
    desc: 'Tek elle kart çevir: kelime, okunuş, ses, anlam.',
    colors: { text: 'text-lime-400', border: 'border-lime-400', shadow: 'shadow-[0_0_15px_rgba(163,230,53,0.4)]', bg: 'bg-lime-400' },
    iconSvg: (
      <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="w-full h-full drop-shadow-[0_0_10px_rgba(163,230,53,0.8)]">
        <rect x="6" y="7" width="14" height="14" rx="2" fill="none" stroke="#84cc16" opacity="0.3" transform="rotate(-5 13 14)" />
        <rect x="5" y="6" width="14" height="14" rx="2" fill="none" stroke="#84cc16" opacity="0.5" transform="rotate(5 12 13)" />
        <rect x="4" y="5" width="14" height="14" rx="2" fill="rgba(132,204,22,0.2)" stroke="#84cc16" />
        <line x1="7" y1="9" x2="15" y2="9" stroke="#a3e635" strokeWidth="2" />
        <line x1="7" y1="12" x2="12" y2="12" stroke="#a3e635" />
        <line x1="7" y1="15" x2="10" y2="15" stroke="#a3e635" />
      </svg>
    )
  },
  { 
    id: 'hangman', 
    categoryLabel: 'WORD GUESSING', 
    name: 'Retro Hangman', 
    desc: 'Gizli kelimeyi harf harf tahmin et.',
    colors: { text: 'text-amber-400', border: 'border-amber-400', shadow: 'shadow-[0_0_15px_rgba(245,158,11,0.4)]', bg: 'bg-amber-500' },
    iconSvg: (
      <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="w-full h-full drop-shadow-[0_0_10px_rgba(245,158,11,0.8)]">
        <path d="M4 21h10M6 21V3h8v3" stroke="#f59e0b" strokeWidth="2.5" />
        <line x1="14" y1="6" x2="14" y2="9" stroke="#d97706" />
        <circle cx="14" cy="11.5" r="2.5" fill="rgba(245,158,11,0.2)" stroke="#f59e0b" />
        <path d="M14 14v4M12 15h4M13 21l1-3 1 3" stroke="#f59e0b" />
      </svg>
    )
  },
  { 
    id: 'word-snake', 
    categoryLabel: 'RETRO SNAKE', 
    name: 'Retro Yılan', 
    desc: 'Kelimeleri harf harf yiyerek topla.',
    colors: { text: 'text-emerald-400', border: 'border-emerald-400', shadow: 'shadow-[0_0_15px_rgba(16,185,129,0.4)]', bg: 'bg-emerald-500' },
    iconSvg: (
      <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="w-full h-full drop-shadow-[0_0_10px_rgba(16,185,129,0.8)]">
        <path d="M4 18h6V12H4V6h14v4" stroke="#10b981" strokeWidth="3" strokeLinecap="round" fill="none" />
        <path d="M18 10h3" stroke="#ef4444" strokeWidth="1.5" />
        <circle cx="18" cy="15" r="2" fill="#34d399" stroke="#10b981" />
        <path d="M18 12.5v1.5" stroke="#ef4444" />
      </svg>
    )
  },
];

export default function GameSelector({ activeGameId, onSelectGame }) {
  const t = useT();

  return (
    <div className="w-full animate-in fade-in slide-in-from-bottom-8 duration-700 pb-2">
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5 max-w-5xl mx-auto">
        {GAMES.map((game) => {
          const isActive = activeGameId === game.id;
          
          // Localization bindings with fallback values
          const localizedCategory = t(`games.${game.id}.category`, game.categoryLabel);
          const localizedName = t(`games.${game.id}.name`, game.name);
          const localizedDesc = t(`games.${game.id}.desc`, game.desc);
          const localizedPlayCta = t("common.playNow", "HEMEN OYNA").toUpperCase();

          return (
            <button
              key={game.id}
              onClick={() => onSelectGame(game.id)}
              className={`group relative flex flex-col p-5 border-2 rounded-2xl transition-all duration-300 bg-dark-900/40 border-dark-700 hover:border-${game.colors.border.split('-')[1]}-500 hover:bg-dark-800 hover:scale-[1.02] hover:${game.colors.shadow}`}
            >
              {/* Top Header Row */}
              <div className="w-full flex justify-between items-start mb-4">
                <span className="text-[10px] font-mono tracking-[0.2em] text-gray-500 uppercase mt-2 text-left">
                  {localizedCategory}
                </span>
                
                {/* Colorful Thumbnail Icon Container */}
                <div className={`w-12 h-12 flex items-center justify-center rounded-xl bg-slate-950/80 border border-slate-800/80 p-2.5 ${game.colors.text} transition-transform duration-300 group-hover:scale-110 shadow-inner`}>
                  {game.iconSvg}
                </div>
              </div>
              
              {/* Text Content */}
              <h4 className="text-lg font-black text-white mb-1.5 text-left group-hover:text-gray-100 transition-colors">
                {localizedName}
              </h4>
              <p className="text-xs text-gray-400 mb-6 text-left max-w-[220px] leading-relaxed">
                {localizedDesc}
              </p>
              
              {/* Button Container */}
              <div className="w-full mt-auto">
                <div className={`w-full py-2 rounded-xl text-xs font-black tracking-widest transition-all duration-300 flex items-center justify-center gap-2 bg-dark-800/80 border border-dark-600 text-gray-400 group-hover:${game.colors.bg} group-hover:text-black group-hover:border-transparent group-hover:shadow-lg`}>
                  {localizedPlayCta}
                </div>
              </div>
            </button>
          );
        })}
      </div>
    </div>
  );
}
