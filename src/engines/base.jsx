"use client";

import React, { useEffect, useRef, useState } from "react";
import { useMemolandumStore } from '../store/useMemolandumStore';
import GlobalStateSync from '../lib/firebase/GlobalStateSync';
import { GameHeader } from '../components/games/shared/GameHeader';
import { EngineController } from "./engine.controller";
import dynamic from 'next/dynamic';
import SkeletonLoader from '../components/SkeletonLoader';

const RetroShooter = dynamic(() => import('../components/games/RetroShooter'), {
  ssr: false,
  loading: () => <SkeletonLoader gameType="shooter" />
});
const RetroBreakout = dynamic(() => import('../components/games/RetroBreakout'), {
  ssr: false,
  loading: () => <SkeletonLoader gameType="breakout" />
});
const RetroHighway = dynamic(() => import('../components/games/RetroHighway'), {
  ssr: false,
  loading: () => <SkeletonLoader gameType="highway" />
});
const WordAscent = dynamic(() => import('../components/games/WordAscent'), {
  ssr: false,
  loading: () => <SkeletonLoader gameType="wordascent" />
});
const WordDrop = dynamic(() => import('../components/games/WordDrop'), {
  ssr: false,
  loading: () => <SkeletonLoader gameType="worddrop" />
});
const SiberianInvaders = dynamic(() => import('../components/games/SiberianInvaders'), {
  ssr: false,
  loading: () => <SkeletonLoader gameType="invaders" />
});
const RetroQuiz = dynamic(() => import('../components/games/RetroQuiz'), {
  ssr: false,
  loading: () => <SkeletonLoader gameType="quiz" />
});

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
  },
  quiz: {
    pauseTitle: "DEĞERLENDİRME DURDURULDU",
    resumeBtn: "TESTE DÖN (P)",
    restartBtn: "TESTİ BAŞTAN AL",
    gameOverTitle: "ANALİZ BAŞARISIZ",
    victoryTitle: "ANALİZ TAMAMLANDI",
    rebootBtn: "YENİDEN DENE",
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

  if (gameType === 'invaders') {
    return (
      <div className="w-full h-full absolute inset-0">
        <SiberianInvaders 
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

  if (gameType === 'quiz') {
    return (
      <div className="w-full h-full absolute inset-0">
        <RetroQuiz 
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
      
      {/* Üst Kısım: Skor ve Genel Kontroller */}
      <GameHeader>
        <GameHeader.Left>
          <GameHeader.Shields max={3} current={3} customId="hud-shields" />
          <GameHeader.Stage value={1} label="LEVEL" customIdValues={{ labelId: "level-label", valueId: "level-val" }} />
        </GameHeader.Left>

        <GameHeader.Right>
          <GameHeader.Score value={score} customIdValues={{ labelId: "score-label", valueId: "score-val" }} />
          <GameHeader.Controls 
            isFxEnabled={isFxEnabled}
            onFxToggle={() => setIsFxEnabled(!isFxEnabled)}
            isAudioEnabled={isAudioEnabled}
            onAudioToggle={() => setIsAudioEnabled(!isAudioEnabled)}
            onPause={() => {}} 
            pauseId="btn-pause"
          />
        </GameHeader.Right>
      </GameHeader>

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
