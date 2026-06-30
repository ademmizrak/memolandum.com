"use client";

import React, { useEffect, useRef, useState } from "react";
import { EngineController } from "./engine.controller";
import RetroShooter from "../components/games/RetroShooter";
import RetroBreakout from "../components/games/RetroBreakout";
import RetroHighway from "../components/games/RetroHighway";
import WordAscent from "../components/games/WordAscent";
import WordDrop from "../components/games/WordDrop";
import { gameManifest } from "../config/manifest";

const GAME_THEMES = {
  highway: {
    pauseTitle: "SÜRÜŞ DURAKLATILDI",
    resumeBtn: "MOTORA DÖN (P)",
    restartBtn: "YARIŞI YENİDEN BAŞLAT",
    gameOverTitle: "ARAÇ HASAR ALDI",
    victoryTitle: "BİTİŞ ÇİZGİSİNE ULAŞILDI",
    rebootBtn: "YENİDEN YARIŞ",
  },
  breakout: {
    pauseTitle: "KIRMA İŞLEMİ BEKLEMEDE",
    resumeBtn: "TOPU SERBEST BIRAK (P)",
    restartBtn: "TUĞLALARI YENİLE",
    gameOverTitle: "TOP DÜŞTÜ",
    victoryTitle: "TÜM TUĞLALAR KIRILDI",
    rebootBtn: "YENİDEN BAŞLA",
  },
  invaders: {
    pauseTitle: "RADAR DURAKLATILDI",
    resumeBtn: "SAVAŞA DÖN (P)",
    restartBtn: "FİLOYU SIFIRLA",
    gameOverTitle: "İSTİLA EDİLDİK",
    victoryTitle: "FİLO YOK EDİLDİ",
    rebootBtn: "YENİDEN SAVUN",
  },
  shooter: {
    pauseTitle: "SİLAH SİSTEMİ BEKLEMEDE",
    resumeBtn: "NİŞAN ALMAYA DEVAM ET (P)",
    restartBtn: "SİSTEMİ YENİDEN YÜKLE",
    gameOverTitle: "METEOR ÇARPMASI",
    victoryTitle: "SEKTÖR TEMİZLENDİ",
    rebootBtn: "YENİDEN GÖREVLENDİR",
  },
  wordascent: {
    pauseTitle: "TIRMANIŞ DURDURULDU",
    resumeBtn: "YÜKSELMEYE DEVAM ET (P)",
    restartBtn: "ATLAYIŞI SIFIRLA",
    gameOverTitle: "BOŞLUĞA DÜŞÜŞ",
    victoryTitle: "ZİRVEYE ULAŞILDI",
    rebootBtn: "TEKRAR TIRMAN",
  },
  worddrop: {
    pauseTitle: "SİMÜLASYON DURAKLATILDI",
    resumeBtn: "DEVAM ET (P)",
    restartBtn: "IZGARAYI SIFIRLA",
    gameOverTitle: "VERİ TAŞMASI",
    victoryTitle: "BAŞARIYLA TAMAMLANDI",
    rebootBtn: "YENİDEN BAŞLAT",
  }
};

/**
 * Mevcut Vanilla JS oyun motorunu React içine kapsülleyen temel iskelet.
 */
export default function GameEngineWrapper({ gameType, levelId, langId, onExit, onNextLevel }) {
  const canvasRef = useRef(null);
  const controllerRef = useRef(null);
  const [isPaused, setIsPaused] = useState(false);
  const [isAudioEnabled, setIsAudioEnabled] = useState(true);
  const [isFxEnabled, setIsFxEnabled] = useState(true);
  const [activeScreen, setActiveScreen] = useState('playing'); // playing, paused, gameover, victory
  const [isLoading, setIsLoading] = useState(true);
  const [score, setScore] = useState(0);

  // Motoru Başlatma ve Temizleme (Lifecycle)
  useEffect(() => {
    if (!canvasRef.current) return;

    // 1. Controller'ı (Köprü) Oluştur
    const controller = new EngineController(
      canvasRef.current,
      (newScore) => setScore(newScore), // Skor Güncellemesi
      () => console.log("Oyun Bitti!")    // Oyun Bitiş Tetikleyicisi
    );
    
    controllerRef.current = controller;

    // 2. Oyunu Başlat
    const init = async () => {
      setIsLoading(true);
      await controller.initGame(levelId, langId, gameType, isAudioEnabled, isFxEnabled);
      setIsLoading(false);
    };
    init();

    // 3. Resize (Boyutlandırma) Yönetimi
    // Dikey ekranlarda (Mobil vb.) canvas'ın bozulmamasını sağlamak için ResizeObserver kullanıyoruz.
    const resizeObserver = new ResizeObserver((entries) => {
      for (let entry of entries) {
        if (canvasRef.current) {
          // Canvas'ın fiziksel pixel boyutlarını, kapsayıcısına göre ayarlıyoruz
          canvasRef.current.width = entry.contentRect.width;
          canvasRef.current.height = entry.contentRect.height;
          
          // Eğer motorun kendi resize fonksiyonu varsa onu da tetikle
          if (controllerRef.current && controllerRef.current.engineInstance && typeof controllerRef.current.engineInstance.resize === 'function') {
            controllerRef.current.engineInstance.resize(entry.contentRect.width, entry.contentRect.height);
          }
        }
      }
    });

    if (canvasRef.current?.parentElement) {
      resizeObserver.observe(canvasRef.current.parentElement);
    }

    // 4. React Bileşeni Ekranda Kaybolduğunda Motoru Temizle (Unmount)
    return () => {
      resizeObserver.disconnect();
      if (controllerRef.current) {
        controllerRef.current.destroy();
      }
    };
  }, [levelId, langId]); // Dil veya seviye değişirse motoru yeniden kur

  // Ses Durumu Değiştiğinde Motora Bildir
  useEffect(() => {
    if (controllerRef.current) {
      controllerRef.current.updateAudioState(isAudioEnabled);
    }
  }, [isAudioEnabled]);

  // FX Ses Durumu Değiştiğinde Motora Bildir
  useEffect(() => {
    if (controllerRef.current) {
      controllerRef.current.updateFxState(isFxEnabled);
    }
  }, [isFxEnabled]);

  const handleNextLevel = () => {
    let nextLevelId = null;
    let foundCurrent = false;

    for (const mainCat of gameManifest.mainCategories) {
      for (const subCat of mainCat.subCategories) {
        if (subCat.id === langId) {
          for (let i = 0; i < subCat.levels.length; i++) {
            if (subCat.levels[i].id === levelId) {
              if (i + 1 < subCat.levels.length) {
                nextLevelId = subCat.levels[i + 1].id;
              }
              break;
            }
          }
        }
      }
    }

    if (nextLevelId && onNextLevel) {
      onNextLevel(nextLevelId);
    } else {
      if (onExit) onExit();
    }
  };

  if (gameType === 'highway') {
    return (
      <div className="w-full h-full absolute inset-0">
        <RetroHighway 
          levelId={levelId} 
          langId={langId} 
          onExit={onExit}
          onNextLevel={handleNextLevel}
          isAudioEnabled={isAudioEnabled}
          setIsAudioEnabled={setIsAudioEnabled}
          isFxEnabled={isFxEnabled}
          setIsFxEnabled={setIsFxEnabled}
        />
      </div>
    );
  }

  if (gameType === 'shooter') {
    return (
      <div className="w-full h-full absolute inset-0">
        <RetroShooter 
          levelId={levelId} 
          langId={langId} 
          onExit={onExit}
          onNextLevel={handleNextLevel}
          isAudioEnabled={isAudioEnabled}
          setIsAudioEnabled={setIsAudioEnabled}
          isFxEnabled={isFxEnabled}
          setIsFxEnabled={setIsFxEnabled}
        />
      </div>
    );
  }

  if (gameType === 'breakout') {
    return (
      <div className="w-full h-full absolute inset-0">
        <RetroBreakout 
          levelId={levelId} 
          langId={langId} 
          onExit={onExit}
          onNextLevel={handleNextLevel}
          isAudioEnabled={isAudioEnabled}
          setIsAudioEnabled={setIsAudioEnabled}
          isFxEnabled={isFxEnabled}
          setIsFxEnabled={setIsFxEnabled}
        />
      </div>
    );
  }

  if (gameType === 'wordascent') {
    return (
      <div className="w-full h-full absolute inset-0">
        <WordAscent 
          levelId={levelId} 
          langId={langId} 
          onExit={onExit}
          onNextLevel={handleNextLevel}
          isAudioEnabled={isAudioEnabled}
          setIsAudioEnabled={setIsAudioEnabled}
          isFxEnabled={isFxEnabled}
          setIsFxEnabled={setIsFxEnabled}
        />
      </div>
    );
  }

  if (gameType === 'worddrop') {
    return (
      <div className="w-full h-full absolute inset-0">
        <WordDrop 
          levelId={levelId} 
          langId={langId} 
          onExit={onExit}
          onNextLevel={handleNextLevel}
          isAudioEnabled={isAudioEnabled}
          setIsAudioEnabled={setIsAudioEnabled}
          isFxEnabled={isFxEnabled}
          setIsFxEnabled={setIsFxEnabled}
        />
      </div>
    );
  }

  return (
    <div className="relative w-full h-[950px] flex flex-col bg-dark-900 rounded-xl overflow-hidden shadow-[0_0_15px_rgba(6,182,212,0.15)] border border-dark-800">
      
      {/* Üst Kısım: Skor ve Genel Kontroller (Shooter ve Breakout hariç) */}
      {gameType !== 'shooter' && gameType !== 'breakout' && (
        <div className="w-full pointer-events-none z-50 font-mono shrink-0">
          <div className="game-hud-container pointer-events-auto flex items-center justify-between p-4 bg-dark-950 border-b border-dark-800 shadow-md">
            
            {/* Player Stats (Shields & Level) */}
            <div className="flex space-x-6 items-center">
              <div className="hud-card shield-card flex items-center gap-2 bg-slate-900/40 border border-slate-500/30 rounded-lg px-4 py-2 shadow-lg">
                <span className="hud-icon text-2xl drop-shadow-[0_0_8px_#38bdf8]">🛡️</span>
                <div className="flex flex-col">
                  <span className="text-[10px] text-cyan-500 font-bold tracking-widest">SHIELD</span>
                  <div id="hud-shields" className="flex gap-1 mt-1">
                     {/* Vanilla JS motoru kalkanları buraya çizecek */}
                     {[1,2,3].map(i => (
                       <div key={i} className="shield-cell h-3 w-8 rounded-sm bg-cyan-400 shadow-[0_0_8px_#22d3ee]"></div>
                     ))}
                  </div>
                </div>
              </div>
              
              <div className="hud-card bg-indigo-900/40 border border-indigo-500/50 rounded-lg px-6 py-2 shadow-[0_0_15px_rgba(99,102,241,0.3)]">
                <span id="level-label" className="text-xs text-indigo-400 block tracking-widest">LEVEL</span>
                <span id="level-val" className="text-xl text-white font-bold tracking-wider drop-shadow-[0_0_5px_#fff]">1</span>
              </div>
            </div>

            {/* Controls & Score */}
            <div className="flex items-center gap-6">
              <div className="flex flex-col items-end">
                <span id="score-label" className="text-[10px] text-green-500 font-bold tracking-widest">SCORE</span>
                <span id="score-val" className="text-2xl text-green-400 font-black drop-shadow-[0_0_10px_#4ade80]">{score}</span>
              </div>

              <div className="flex gap-2">
                <button 
                  className="hud-btn bg-slate-800/80 p-2 rounded-md hover:bg-slate-700 transition-colors border border-slate-600" 
                  title="Oyun Efektleri" 
                  onClick={() => setIsFxEnabled(!isFxEnabled)}
                  style={{ opacity: isFxEnabled ? 1 : 0.5 }}
                >
                  <svg xmlns="http://www.w3.org/2000/svg" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke={isFxEnabled ? "#4ade80" : "#f87171"} strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M9 18V5l12-2v13"></path><circle cx="6" cy="18" r="3"></circle><circle cx="18" cy="16" r="3"></circle></svg>
                </button>
                <button 
                  className="hud-btn bg-slate-800/80 p-2 rounded-md hover:bg-slate-700 transition-colors border border-slate-600" 
                  title="Kelime Telaffuzu" 
                  onClick={() => setIsAudioEnabled(!isAudioEnabled)}
                  style={{ opacity: isAudioEnabled ? 1 : 0.5 }}
                >
                  <svg xmlns="http://www.w3.org/2000/svg" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke={isAudioEnabled ? "#38bdf8" : "#f87171"} strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M11 5L6 9H2v6h4l5 4V5z"></path><path d="M19.07 4.93a10 10 0 0 1 0 14.14M15.54 8.46a5 5 0 0 1 0 7.07"></path></svg>
                </button>
                <button 
                  className="hud-btn bg-slate-800/80 p-2 rounded-md hover:bg-slate-700 transition-colors border border-slate-600" 
                  title="Durdur / Devam Et"
                  id="btn-pause"
                >
                  <svg xmlns="http://www.w3.org/2000/svg" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="#fff" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><rect x="6" y="4" width="4" height="16"></rect><rect x="14" y="4" width="4" height="16"></rect></svg>
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Game Area (Canvas + Overlays) */}
      <div className="flex-1 relative w-full h-full min-h-0">
        
        {/* Yükleniyor Ekranı */}
      {isLoading && (
        <div className="absolute inset-0 flex items-center justify-center bg-dark-900/80 z-20 backdrop-blur-sm">
          <div className="text-primary-500 animate-glow text-2xl font-mono">LOADING PROTOCOL...</div>
        </div>
      )}

      {/* Vanilla JS Motorunun Çizim Yapacağı Canvas */}
      <canvas 
        ref={canvasRef} 
        className="w-full h-full block"
      />

      {/* Pause Menu Overlay */}
      <div id="pause-screen" className="hidden absolute top-0 left-0 w-full h-full bg-black/80 z-50 flex items-center justify-center">
        <div className="bg-dark-800 border border-dark-700 p-8 rounded-xl shadow-[0_0_20px_rgba(6,182,212,0.3)] text-center w-80">
          <h2 className="text-3xl font-mono font-bold text-primary-500 mb-6 drop-shadow-md">
            {GAME_THEMES[gameType]?.pauseTitle || "PAUSED"}
          </h2>
          
          <button id="resume-btn" className="w-full py-3 mb-4 bg-primary-500 text-dark-900 font-bold font-mono rounded-lg hover:bg-primary-400 transition-colors">
            {GAME_THEMES[gameType]?.resumeBtn || "RESUME (P)"}
          </button>
          
          <button id="pause-restart-btn" className="w-full py-3 mb-4 bg-secondary-500 text-dark-900 font-bold font-mono rounded-lg hover:bg-secondary-400 transition-colors">
            {GAME_THEMES[gameType]?.restartBtn || "RESTART"}
          </button>
          
          <button id="pause-menu-btn" onClick={() => { if(onExit) onExit(); else window.location.href = '/'; }} className="w-full py-3 bg-dark-700 text-gray-300 font-bold font-mono rounded-lg border border-dark-600 hover:bg-dark-600 transition-colors">
            MAIN MENU
          </button>
        </div>
      </div>

      {/* Game Over Overlay */}
      <div id="game-over-screen" className="hidden absolute top-0 left-0 w-full h-full bg-black/90 z-50 flex items-center justify-center">
        <div className="bg-dark-800 border border-red-500/50 p-8 rounded-xl shadow-[0_0_30px_rgba(239,68,68,0.2)] text-center w-96 max-h-[80vh] flex flex-col">
          <h2 className="text-4xl font-mono font-bold text-red-500 mb-2 drop-shadow-md">
            {GAME_THEMES[gameType]?.gameOverTitle || "GAME OVER"}
          </h2>
          <h3 className="text-xl font-mono text-gray-300 mb-6">SCORE: <span id="final-score" className="text-primary-500">0</span></h3>
          
          <div className="flex-1 overflow-y-auto mb-6 bg-dark-900/50 border border-dark-700 rounded-lg p-2 text-sm text-left">
            <h4 className="text-secondary-500 font-mono font-bold mb-2 text-center border-b border-dark-700 pb-2">ÖĞRENİLEN KELİMELER</h4>
            <ul id="learned-list" className="space-y-1 font-mono"></ul>
          </div>
          
          <button id="restart-btn" className="w-full py-3 mb-4 bg-primary-500 text-dark-900 font-bold font-mono rounded-lg hover:bg-primary-400 transition-colors">
            {GAME_THEMES[gameType]?.rebootBtn || "RETRY"}
          </button>
          
          <button onClick={() => { if(onExit) onExit(); else window.location.href = '/'; }} className="w-full py-3 bg-dark-700 text-gray-300 font-bold font-mono rounded-lg border border-dark-600 hover:bg-dark-600 transition-colors">
            MAIN MENU
          </button>
        </div>
      </div>

      {/* Victory Overlay */}
      <div id="victory-screen" className="hidden absolute top-0 left-0 w-full h-full bg-black/90 z-50 flex items-center justify-center">
        <div className="bg-dark-800 border border-green-500/50 p-8 rounded-xl shadow-[0_0_30px_rgba(34,197,94,0.2)] text-center w-96 max-h-[80vh] flex flex-col">
          <h2 className="text-4xl font-mono font-bold text-green-500 mb-2 drop-shadow-md">
            {GAME_THEMES[gameType]?.victoryTitle || "VICTORY"}
          </h2>
          <h3 className="text-xl font-mono text-gray-300 mb-6">SCORE: <span id="victory-score" className="text-green-400">0</span></h3>
          
          <div className="flex-1 overflow-y-auto mb-6 bg-dark-900/50 border border-dark-700 rounded-lg p-2 text-sm text-left">
            <h4 className="text-green-500 font-mono font-bold mb-2 text-center border-b border-dark-700 pb-2">USTALAŞILAN KELİMELER</h4>
            <ul id="victory-learned-list" className="space-y-1 font-mono text-gray-300"></ul>
          </div>
          
          <button id="next-level-btn" className="w-full py-3 mb-4 bg-green-600 text-white font-bold font-mono rounded-lg hover:bg-green-500 transition-colors hidden">
            SONRAKİ BÖLÜM
          </button>
          
          <button onClick={() => { if(onExit) onExit(); else window.location.href = '/'; }} className="w-full py-3 bg-dark-700 text-gray-300 font-bold font-mono rounded-lg border border-dark-600 hover:bg-dark-600 transition-colors">
            MAIN MENU
          </button>
        </div>
      </div>

      </div>

    </div>
  );
}
