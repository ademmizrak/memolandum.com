"use client";

import React, { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { gameManifest } from "../config/manifest";
import GameSelector from "./GameSelector";
import { ChevronLeft } from "lucide-react";
import { useMemolandumStore } from "../store/useMemolandumStore";

export default function TabbedNavigator({ initialSlug }) {
  const router = useRouter();
  const { lastPlayedLang, lastPlayedLevel, setLastPlayed } = useMemolandumStore();

  const defaultMainId = gameManifest.mainCategories[0].id;
  const defaultSubId = gameManifest.mainCategories[0].subCategories[0]?.id || "";
  const defaultLevelId = gameManifest.mainCategories[0].subCategories[0]?.levels[0]?.id || "";

  const [activeMainId, setActiveMainId] = useState(() => {
     if (lastPlayedLang) {
       for (const main of gameManifest.mainCategories) {
         if (main.subCategories.find(s => s.id === lastPlayedLang)) {
           return main.id;
         }
       }
     }
     return defaultMainId;
  });
  const [activeSubId, setActiveSubId] = useState(lastPlayedLang || defaultSubId);
  const [activeLevelId, setActiveLevelId] = useState(lastPlayedLevel || defaultLevelId);
  
  const [activeGameId, setActiveGameId] = useState("");
  const [previousMainId, setPreviousMainId] = useState("");



  useEffect(() => {
    if (initialSlug) {
      for (const main of gameManifest.mainCategories) {
        for (const sub of main.subCategories) {
          const level = sub.levels.find(l => l.slug === initialSlug);
          if (level) {
            setActiveMainId(main.id);
            setActiveSubId(sub.id);
            setActiveLevelId(level.id);
            return;
          }
        }
      }
    }
  }, [initialSlug]);

  useEffect(() => {
    if (activeMainId === 'games') return;

    const mainCat = gameManifest.mainCategories.find(c => c.id === activeMainId);
    if (mainCat && mainCat.subCategories.length > 0 && !mainCat.subCategories.find(s => s.id === activeSubId)) {
      const firstSub = mainCat.subCategories[0];
      setActiveSubId(firstSub.id);
      setActiveLevelId(firstSub.levels[0]?.id || "");
    }
  }, [activeMainId]);

  const mainCategoriesWithGames = [
    ...gameManifest.mainCategories,
    { id: 'games', name: 'Oyun Seç' }
  ];

  const [activeLevelMode, setActiveLevelMode] = useState('words'); // 'words' | 'sentences'

  const currentMain = gameManifest.mainCategories.find(c => c.id === activeMainId);
  const currentSub = currentMain?.subCategories.find(c => c.id === activeSubId) || currentMain?.subCategories[0];

  const getDisplayLevels = () => {
    let sourceLevels = currentSub?.levels || [];
    if (activeLevelMode === 'sentences' && currentSub?.sentenceLevels?.length > 0) {
      sourceLevels = currentSub.sentenceLevels;
    }
    return sourceLevels;
  };
  const displayLevels = getDisplayLevels();

  const handleGameOrLevelStart = (newLevelId, newGameId) => {
    let lvl = newLevelId || activeLevelId;
    const gm = newGameId || activeGameId;
    
    if (!lvl) {
      if (lastPlayedLevel && lastPlayedLang) {
        lvl = lastPlayedLevel;
        setActiveSubId(lastPlayedLang);
        setActiveLevelId(lastPlayedLevel);
        
        for (const main of gameManifest.mainCategories) {
          if (main.subCategories.find(s => s.id === lastPlayedLang)) {
            setActiveMainId(main.id);
            break;
          }
        }
      } else {
        lvl = defaultLevelId;
        setActiveMainId(defaultMainId);
        setActiveSubId(defaultSubId);
        setActiveLevelId(defaultLevelId);
      }
    }

    if (lvl && gm) {
      let currentSubId = activeSubId;
      if (!newLevelId && !activeLevelId) {
        currentSubId = lastPlayedLang || defaultSubId;
      }

      setLastPlayed(currentSubId, lvl);

      router.push(`/games/${gm}`);
    } else if (!gm) {
      setActiveMainId('games');
    }
  };

  const formatLevelName = (rawName) => {
    const cleanName = rawName.replace(/^Ita\s+(En|Tr)\s*-\s*/i, '').trim();
    const match = cleanName.match(/(\d{3})\s+(\d{3})/);
    if (!match) {
      return { levelText: cleanName, descText: "" };
    }
    
    const startNum = parseInt(match[1], 10);
    const endNum = parseInt(match[2], 10);
    const diff = endNum - startNum + 1;
    
    let descText = "";
    if (startNum === 1) {
      descText = `En Sık Kullanılan ${diff} Kelime`;
    } else {
      const nth = Math.floor(startNum / diff) + 1;
      let word = `${nth}.`;
      if (nth === 2) word = "İkinci";
      if (nth === 3) word = "Üçüncü";
      if (nth === 4) word = "Dördüncü";
      if (nth === 5) word = "Beşinci";
      if (nth === 6) word = "Altıncı";
      
      descText = `En Sık Kullanılan ${word} ${diff} Kelime`;
    }

    let levelText = cleanName.substring(0, match.index).trim();
    if (levelText.endsWith('-')) levelText = levelText.slice(0, -1).trim();

    return { levelText, descText };
  };

  return (
    <div className="flex flex-col gap-4 w-full max-w-6xl mx-auto">
      
      <div className="gamified-banner-container !min-h-0 !p-6 flex-col gap-4" style={{ background: 'linear-gradient(135deg, #0f172a 0%, #172554 50%, #312e81 100%)' }}>
        <div className="banner-glow-effect"></div>
        <div className="relative z-10 w-full text-center">
          <span className="banner-badge mb-2">🚀 ADIM 1</span>
          <h2 className="text-xl sm:text-2xl font-black text-white mb-2">
            <span className="highlight-text">3 tıklamayla</span> hem oyuna hem ezberlemeye başla!!!
          </h2>
        </div>
        
        <div className="flex flex-wrap items-center justify-center gap-3 sm:gap-6 relative z-10 w-full mt-2">
          {mainCategoriesWithGames.map((main, idx) => (
            <div key={main.id} className="flex items-center gap-3 sm:gap-6">
              {idx > 0 && (
                <div className="hidden sm:flex text-4xl sm:text-5xl font-black text-white/10 select-none">
                  /
                </div>
              )}
              <div className="flex items-center gap-3">
                <span className="text-4xl sm:text-5xl font-black text-cyan-500/40 select-none bg-clip-text bg-gradient-to-br from-cyan-400 to-purple-500 drop-shadow-lg">
                  {idx + 1}
                </span>
                <button
                  onClick={() => setActiveMainId(main.id)}
                  className={`px-6 py-3 rounded-xl font-bold transition-all duration-300 flex items-center gap-2 border-2 ${
                    activeMainId === main.id 
                      ? "bg-gradient-to-r from-cyan-500 to-blue-500 text-white border-transparent shadow-[0_0_20px_rgba(6,182,212,0.5)] scale-105" 
                      : "bg-dark-900/60 text-gray-300 border-white/10 hover:border-cyan-500/50 hover:bg-dark-800"
                  }`}
                >
                  {main.name}
                </button>
              </div>
            </div>
          ))}
        </div>
      </div>

      <div className="gamified-banner-container !min-h-0 !p-6 flex-col gap-4 animate-in fade-in slide-in-from-top-4 duration-500" style={{ background: 'linear-gradient(135deg, #1e1b4b 0%, #2e1065 50%, #4c1d95 100%)' }}>
        <div className="banner-glow-effect" style={{ right: 'auto', left: '-10%', background: 'radial-gradient(circle, rgba(56,189,248,0.3) 0%, rgba(0,0,0,0) 70%)' }}></div>
        <div className="relative z-10 w-full text-center">
          <span className="banner-badge mb-2" style={{ borderColor: '#38bdf8', color: '#7dd3fc', background: 'rgba(56, 189, 248, 0.2)' }}>⚡ ADIM 2</span>
          <h2 className="text-lg sm:text-xl font-bold text-white mb-2">
            {activeMainId === 'games' ? 'KATEGORİ SEÇİMİ' : (activeMainId === 'en-tr' ? 'KATEGORİ SEÇENEKLERİ (CATEGORY OPTIONS)' : 'DİL SEÇENEKLERİ (LANGUAGE OPTIONS)')}
          </h2>
        </div>
        
        <div className="flex flex-wrap gap-3 justify-center relative z-10 w-full mt-2">
          {activeMainId === 'games' ? (
             <div className="flex gap-4 items-center">
               <button 
                 onClick={() => setActiveMainId(previousMainId || defaultMainId)}
                 className="bg-dark-900/60 text-gray-300 hover:text-white px-4 py-3 rounded-xl border border-white/10 hover:border-gray-500 transition-colors flex items-center gap-2 font-bold"
               >
                 <ChevronLeft className="w-5 h-5" /> Geri Dön
               </button>
               <button className="bg-gradient-to-r from-purple-500 to-indigo-500 text-white shadow-[0_0_20px_rgba(168,85,247,0.5)] px-6 py-3 rounded-xl font-bold transition-all duration-300 scale-105 border-transparent cursor-default">
                 Oyunlar
               </button>
             </div>
          ) : (
            currentMain?.subCategories.map((sub) => (
              <button
                key={sub.id}
                onClick={() => { setActiveSubId(sub.id); setActiveLevelId(sub.levels[0]?.id || ""); }}
                className={`px-6 py-3 rounded-xl font-bold transition-all duration-300 flex items-center gap-2 border-2 ${
                  activeSubId === sub.id 
                    ? "bg-gradient-to-r from-purple-500 to-pink-500 text-white shadow-[0_0_20px_rgba(217,70,239,0.5)] scale-105 border-transparent" 
                    : "bg-dark-900/60 text-gray-300 border-white/10 hover:border-purple-500/50 hover:bg-dark-800"
                }`}
              >
                {sub.name}
              </button>
            ))
          )}
        </div>
      </div>

      <div className="gamified-banner-container !min-h-0 !p-6 flex-col gap-4 animate-in fade-in slide-in-from-top-4 duration-500" style={{ background: 'linear-gradient(135deg, #020617 0%, #0891b2 50%, #0f766e 100%)', alignItems: 'stretch' }}>
        <div className="banner-glow-effect" style={{ top: 'auto', bottom: '-50%', background: 'radial-gradient(circle, rgba(16,185,129,0.3) 0%, rgba(0,0,0,0) 70%)' }}></div>
        <div className="relative z-10 w-full text-center">
          <span className="banner-badge mb-2" style={{ borderColor: '#34d399', color: '#6ee7b7', background: 'rgba(52, 211, 153, 0.2)' }}>🔥 ADIM 3</span>
          <h2 className="text-lg sm:text-xl font-bold text-white mb-4">
            {activeMainId === 'games' ? 'OYUN SEÇİMİ (GAME OPTIONS)' : 'SEVİYE SEÇENEKLERİ (LEVEL OPTIONS)'}
          </h2>

          {activeMainId !== 'games' && currentSub?.sentenceLevels?.length > 0 && (
            <div className="flex justify-center mb-6">
              <div className="bg-dark-900/60 p-1.5 rounded-xl border border-white/10 inline-flex">
                <button
                  onClick={() => { setActiveLevelMode('words'); setActiveLevelId(''); }}
                  className={`px-4 sm:px-6 py-2 sm:py-2.5 rounded-lg font-bold text-sm sm:text-base transition-all duration-300 flex items-center gap-2 ${
                    activeLevelMode === 'words'
                      ? 'bg-gradient-to-r from-emerald-500 to-teal-600 text-white shadow-lg'
                      : 'text-gray-400 hover:text-white hover:bg-white/5'
                  }`}
                >
                  📚 Kelimeler
                </button>
                <button
                  onClick={() => { setActiveLevelMode('sentences'); setActiveLevelId(''); }}
                  className={`px-4 sm:px-6 py-2 sm:py-2.5 rounded-lg font-bold text-sm sm:text-base transition-all duration-300 flex items-center gap-2 ${
                    activeLevelMode === 'sentences'
                      ? 'bg-gradient-to-r from-blue-500 to-indigo-600 text-white shadow-lg'
                      : 'text-gray-400 hover:text-white hover:bg-white/5'
                  }`}
                >
                  💬 En Sık Kullanılan Cümleler
                </button>
              </div>
            </div>
          )}


        </div>
        
        <div className="relative z-10 w-full">
          {activeMainId === 'games' ? (
            <GameSelector 
              activeGameId={activeGameId}
              onSelectGame={(gameId) => {
                setActiveGameId(gameId);
                handleGameOrLevelStart(activeLevelId, gameId);
              }} 
            />
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 max-h-[400px] overflow-y-auto pr-2 custom-scrollbar">
              {displayLevels.map((level) => {
                const formatted = formatLevelName(level.name);
                return (
                <button
                  key={level.id}
                  onClick={() => {
                    setPreviousMainId(activeMainId);
                    setActiveLevelId(level.id);
                    setActiveMainId('games');
                  }}
                  className={`p-4 rounded-xl text-center transition-all duration-300 border-2 flex flex-col items-center justify-center min-h-[110px] relative overflow-hidden group ${
                    activeLevelId === level.id 
                      ? "bg-gradient-to-br from-emerald-500 to-teal-600 text-white border-transparent shadow-[0_0_20px_rgba(16,185,129,0.5)] scale-[1.03] z-10" 
                      : "bg-dark-900/60 border-white/10 text-gray-300 hover:border-emerald-500/50 hover:bg-dark-800"
                  }`}
                >
                  <div className="flex flex-col items-center justify-center gap-2 w-full">
                    <div className={`font-black text-[15px] sm:text-base leading-tight transition-colors ${activeLevelId === level.id ? 'text-white' : 'text-gray-200 group-hover:text-emerald-400'}`}>
                      {formatted.levelText}
                    </div>
                    {formatted.descText && (
                      <div className={`text-sm font-medium w-full leading-snug mt-1 transition-colors ${activeLevelId === level.id ? 'text-white font-bold' : 'text-gray-300 group-hover:text-emerald-200'}`}>
                        {formatted.descText}
                      </div>
                    )}
                  </div>
                  
                  {activeLevelId === level.id && (
                     <div className="absolute top-2 right-2">
                       <span className="flex h-3 w-3 relative">
                          <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-white opacity-75"></span>
                          <span className="relative inline-flex rounded-full h-3 w-3 bg-white"></span>
                        </span>
                     </div>
                  )}
                </button>
              )})}
              {displayLevels.length === 0 && (
                <div className="col-span-full text-center text-gray-500 py-10 font-mono">VERİ BULUNAMADI</div>
              )}
            </div>
          )}
        </div>
      </div>

    </div>
  );
}
