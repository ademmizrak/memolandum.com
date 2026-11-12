"use client";

import React from "react";
import { useGameUiCopy } from "../lib/i18n/gameUiCopy";

/**
 * Faz 2 — Anında İskelet / Yükleme Ekranı (Zero-Blank-Screen Policy):
 * Canvas bileşeni mount olduğu ilk milisaniyede siyah/boş ekran yerine,
 * hafif ve akıcı bir "Seviye Hazırlanıyor..." mikro-animasyonu çizer.
 */
export default function SkeletonLoader({ gameType }) {
  const ui = useGameUiCopy();
  return (
    <div className="w-full h-full absolute inset-0 flex flex-col items-center justify-center bg-[#070b14] z-50 select-none overflow-hidden">
      {/* Hafif neon yörünge halkası */}
      <div className="relative w-24 h-24 mb-6 flex items-center justify-center">
        <div className="absolute inset-0 border-2 border-cyan-500/25 rounded-full" />
        <div className="absolute inset-0 border-2 border-cyan-400 border-t-transparent rounded-full animate-spin" />
        <div className="absolute inset-2 border border-emerald-400/30 rounded-full animate-pulse" />

        {/* Oyun İkonu */}
        <div className="relative z-10 flex items-center justify-center text-4xl animate-bounce">
          {gameType === "shooter" && "🚀"}
          {gameType === "breakout" && "🧱"}
          {gameType === "highway" && "🏎️"}
          {gameType === "invaders" && "👾"}
          {gameType === "wordascent" && "🧗"}
          {gameType === "worddrop" && "📦"}
          {gameType === "lexicon" && "🃏"}
          {gameType === "hangman" && "👤"}
          {gameType === "word-snake" && "🐍"}
          {gameType === "quiz" && "❓"}
          {gameType === "orbitlex" && "🪐"}
          {gameType === "star-cards" && "⭐"}
          {gameType === "word-board" && "🪵"}
          {gameType === "word-card" && "🎴"}
          {!gameType && "🎮"}
        </div>
      </div>

      {/* Çok dilli / evrensel mikro başlık */}
      <h2 className="text-base md:text-lg font-black text-cyan-300 tracking-widest uppercase animate-pulse">
        {ui.preparingLevel}
      </h2>
      <p className="text-xs text-slate-400 mt-1.5 font-mono">
        {ui.fastStartSub}
      </p>

      {/* Akıcı mikro ilerleme çubuğu */}
      <div className="mt-4 w-44 h-1.5 rounded-full bg-slate-800/90 overflow-hidden border border-cyan-500/20">
        <div className="h-full w-2/3 bg-gradient-to-r from-cyan-400 via-emerald-400 to-cyan-300 rounded-full animate-pulse" />
      </div>
    </div>
  );
}
