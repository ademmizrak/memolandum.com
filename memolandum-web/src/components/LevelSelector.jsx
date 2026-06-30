"use client";

import React from "react";
import { gameManifest } from "../config/manifest";

export default function LevelSelector({ activeLangId, activeLevelId, onSelectLevel, onPlay }) {
  // Aktif dilin ayarlarını bul
  const langConfig = gameManifest.languages.find((l) => l.id === activeLangId);
  const categories = langConfig ? langConfig.categories : [];

  if (categories.length === 0) {
    return <div className="text-gray-500 italic p-4 bg-dark-800/50 rounded-xl">Bu dil için seviye bulunamadı.</div>;
  }

  return (
    <div className="w-full flex flex-col gap-6">
      <div className="flex items-center justify-between">
        <h2 className="text-xl font-bold text-white flex items-center gap-2">
          <span className="w-2 h-6 bg-secondary-500 rounded-sm"></span>
          SEVİYE SEÇİMİ
        </h2>
      </div>
      
      {/* CSS Grid Yapısı: Mobilde 1 kolon, tablette 2, PC'de 3 kolon */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
        {categories.map((level) => {
          const isSelected = activeLevelId === level.id;
          
          return (
            <button
              key={level.id}
              onClick={() => onSelectLevel(level.id)}
              className={`
                group relative overflow-hidden rounded-xl p-5 text-left transition-all duration-300
                ${isSelected 
                  ? "bg-secondary-500/10 border border-secondary-500 shadow-[0_0_15px_rgba(16,185,129,0.2)]" 
                  : "bg-dark-800/60 border border-dark-800 hover:border-secondary-500/50 hover:bg-dark-800"}
              `}
            >
              {/* Arka plan siber grid deseni */}
              <div className="absolute inset-0 opacity-10 bg-[radial-gradient(ellipse_at_center,_var(--tw-gradient-stops))] from-secondary-500/20 via-transparent to-transparent group-hover:opacity-30 transition-opacity"></div>
              
              <div className="relative z-10 flex justify-between items-center">
                <div className="flex flex-col gap-1">
                  <span className={`text-xs font-mono font-bold tracking-wider ${isSelected ? "text-secondary-500" : "text-gray-500"}`}>
                    SEKTÖR {level.id.toUpperCase()}
                  </span>
                  <span className={`text-lg font-bold ${isSelected ? "text-white" : "text-gray-300"}`}>
                    {level.name}
                  </span>
                </div>
                
                {/* Sağ ok ikonu */}
                <div className={`
                  w-8 h-8 rounded-full flex items-center justify-center transition-all duration-300
                  ${isSelected ? "bg-secondary-500 text-dark-900 shadow-[0_0_10px_rgba(16,185,129,0.5)]" : "bg-dark-900 text-gray-500 group-hover:bg-dark-800 group-hover:text-secondary-500"}
                `}>
                  <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={3} d="M9 5l7 7-7 7" />
                  </svg>
                </div>
              </div>
            </button>
          );
        })}
      </div>
    </div>
  );
}
