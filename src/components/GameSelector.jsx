"use client";

import React from "react";

const GAMES = [
  { 
    id: 'shooter', 
    categoryLabel: 'SPACE SHOOTER', 
    name: 'Retro Shooter', 
    desc: 'Meteordaki kelimeleri vurarak eşle.',
    colors: { text: 'text-cyan-400', border: 'border-cyan-400', shadow: 'shadow-[0_0_15px_rgba(34,211,238,0.4)]', bg: 'bg-cyan-400' },
    iconSvg: (
      <svg viewBox="0 0 24 24" fill="currentColor" stroke="currentColor" strokeWidth="1" className="drop-shadow-[0_0_8px_rgba(34,211,238,0.8)]"><path d="M3 11l19-9-9 19-2-8-8-2z" /></svg>
    )
  },
  { 
    id: 'breakout', 
    categoryLabel: 'BRICK BREAKER', 
    name: 'Breakout DX-Ball', 
    desc: 'Tuğlaları kırarak kelimeleri eşle.',
    colors: { text: 'text-pink-500', border: 'border-pink-500', shadow: 'shadow-[0_0_15px_rgba(236,72,153,0.4)]', bg: 'bg-pink-500' },
    iconSvg: (
      <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" className="drop-shadow-[0_0_8px_rgba(236,72,153,0.8)]"><circle cx="12" cy="7" r="4" fill="currentColor" /><rect x="5" y="16" width="14" height="4" rx="2" fill="currentColor" /></svg>
    )
  },
  { 
    id: 'highway', 
    categoryLabel: 'LANE RACER', 
    name: 'Highway Survivor', 
    desc: 'Siber şeritlerde doğru şeride sür.',
    colors: { text: 'text-yellow-400', border: 'border-yellow-400', shadow: 'shadow-[0_0_15px_rgba(250,204,21,0.4)]', bg: 'bg-yellow-400' },
    iconSvg: (
      <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="drop-shadow-[0_0_8px_rgba(250,204,21,0.8)]"><path d="M4 22l4-18h8l4 18" /><path d="M12 10v4" strokeWidth="3" /><circle cx="8" cy="18" r="1.5" fill="currentColor" /><circle cx="16" cy="18" r="1.5" fill="currentColor" /></svg>
    )
  },
  { 
    id: 'invaders', 
    categoryLabel: 'NEON SHMUP', 
    name: 'Siberian Invaders', 
    desc: 'Uzay istilacılarını formasyonla vur.',
    colors: { text: 'text-purple-500', border: 'border-purple-500', shadow: 'shadow-[0_0_15px_rgba(168,85,247,0.4)]', bg: 'bg-purple-500' },
    iconSvg: (
      <svg viewBox="0 0 24 24" fill="currentColor" stroke="currentColor" strokeWidth="1" strokeLinecap="round" strokeLinejoin="round" className="drop-shadow-[0_0_8px_rgba(168,85,247,0.8)]"><path d="M6 10v-2h2v-2h8v2h2v2h2v4h-2v2h-4v-2h-4v2H8v-2H4v-4h2z" /><path d="M9 10h2v2H9z" fill="black" /><path d="M13 10h2v2h-2z" fill="black" /></svg>
    )
  },
  { 
    id: 'wordascent', 
    categoryLabel: 'VERTICAL CLIMBER', 
    name: 'The Word Ascent', 
    desc: 'Platformlarda zıplayarak tırman.',
    colors: { text: 'text-emerald-500', border: 'border-emerald-500', shadow: 'shadow-[0_0_15px_rgba(16,185,129,0.4)]', bg: 'bg-emerald-500' },
    iconSvg: (
      <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" className="drop-shadow-[0_0_8px_rgba(16,185,129,0.8)]"><path d="M12 22V6" /><path d="M8 10l4-4 4 4" /><path d="M4 14h8" strokeWidth="3" /><path d="M12 18h8" strokeWidth="3" /></svg>
    )
  },
  { 
    id: 'worddrop', 
    categoryLabel: 'DIKEY TETRIS', 
    name: 'Reverse Word Drop', 
    desc: 'Blokları Tetris gibi yerleştir.',
    colors: { text: 'text-rose-500', border: 'border-rose-500', shadow: 'shadow-[0_0_15px_rgba(244,63,94,0.4)]', bg: 'bg-rose-500' },
    iconSvg: (
      <svg viewBox="0 0 24 24" fill="currentColor" stroke="currentColor" strokeWidth="1" strokeLinecap="round" strokeLinejoin="round" className="drop-shadow-[0_0_8px_rgba(244,63,94,0.8)]"><path d="M4 6h16v6h-5v6H9v-6H4V6z" /><path d="M9 12v6" /><path d="M15 12v6" /></svg>
    )
  },
  { 
    id: 'quiz', 
    categoryLabel: 'TRIVIA PROTOCOL', 
    name: 'Retro Quiz', 
    desc: 'Kelimeleri çoktan seçmeli sorularla patlat.',
    colors: { text: 'text-amber-400', border: 'border-amber-400', shadow: 'shadow-[0_0_15px_rgba(245,158,11,0.4)]', bg: 'bg-amber-500' },
    iconSvg: (
      <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" className="drop-shadow-[0_0_8px_rgba(245,158,11,0.8)]"><circle cx="12" cy="12" r="10" /><path d="M9.09 9a3 3 0 0 1 5.83 1c0 2-3 3-3 3" /><line x1="12" y1="17" x2="12.01" y2="17" /></svg>
    )
  },
];

export default function GameSelector({ activeGameId, onSelectGame }) {
  return (
    <div className="w-full animate-in fade-in slide-in-from-bottom-8 duration-700 pb-2">
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5 max-w-5xl mx-auto">
        {GAMES.map((game) => {
          const isActive = activeGameId === game.id;
          return (
            <button
              key={game.id}
              onClick={() => onSelectGame(game.id)}
              className={`group relative flex flex-col p-5 border-2 rounded-2xl transition-all duration-300 bg-dark-900/40 border-dark-700 hover:border-${game.colors.border.split('-')[1]}-500 hover:bg-dark-800 hover:scale-[1.02] hover:${game.colors.shadow}`}
            >
              {/* Top Header Row */}
              <div className="w-full flex justify-between items-start mb-4">
                <span className="text-[10px] font-mono tracking-[0.2em] text-gray-500 uppercase mt-2">
                  {game.categoryLabel}
                </span>
                {/* Colorful Icon Container */}
                <div className={`w-9 h-9 flex items-center justify-center ${game.colors.text} transition-transform duration-300 group-hover:scale-110`}>
                  {game.iconSvg}
                </div>
              </div>
              
              {/* Text Content */}
              <h4 className="text-lg font-black text-white mb-1.5 text-left group-hover:text-gray-100 transition-colors">
                {game.name}
              </h4>
              <p className="text-xs text-gray-400 mb-6 text-left max-w-[200px] leading-relaxed">
                {game.desc}
              </p>
              
              {/* Button Container */}
              <div className="w-full mt-auto">
                <div className={`w-full py-2 rounded-xl text-xs font-black tracking-widest transition-all duration-300 flex items-center justify-center gap-2 bg-dark-800/80 border border-dark-600 text-gray-400 group-hover:${game.colors.bg} group-hover:text-black group-hover:border-transparent group-hover:shadow-lg`}>
                  HEMEN OYNA
                </div>
              </div>
            </button>
          );
        })}
      </div>
    </div>
  );
}
