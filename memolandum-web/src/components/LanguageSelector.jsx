"use client";

import React from "react";
import { gameManifest } from "../config/manifest";

export default function LanguageSelector({ activeLangId, onSelectLang }) {
  return (
    <div className="w-full flex gap-4 overflow-x-auto pb-4 custom-scrollbar">
      {gameManifest.languages.map((lang) => (
        <button
          key={lang.id}
          onClick={() => onSelectLang(lang.id)}
          className={`
            relative px-6 py-4 rounded-xl min-w-[200px] text-left transition-all duration-300 ease-out flex-shrink-0
            ${
              activeLangId === lang.id
                ? "bg-primary-500/20 border-2 border-primary-500 shadow-[0_0_20px_rgba(6,182,212,0.3)] scale-105"
                : "bg-dark-800/80 border-2 border-dark-800 hover:border-primary-500/50 hover:bg-dark-800 hover:scale-105"
            }
          `}
        >
          {/* Neon Glow Efekti (Sadece seçiliyken) */}
          {activeLangId === lang.id && (
            <div className="absolute inset-0 bg-primary-500/10 rounded-xl animate-pulse pointer-events-none" />
          )}

          <div className="relative z-10 flex flex-col gap-1">
            <span className={`text-xs font-mono tracking-widest uppercase ${activeLangId === lang.id ? "text-primary-500" : "text-gray-500"}`}>
              Protocol
            </span>
            <span className={`text-lg font-bold ${activeLangId === lang.id ? "text-white" : "text-gray-400"}`}>
              {lang.name}
            </span>
          </div>
        </button>
      ))}
    </div>
  );
}
