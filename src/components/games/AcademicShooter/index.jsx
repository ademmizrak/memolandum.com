import React, { useEffect, useRef, useState, useCallback, useMemo } from 'react';
import { ShooterGame } from './AcademicShooterEngine';
import { useLessonLoader } from '../../../hooks/useLessonLoader';
import { useMemolandumStore } from '../../../store/useMemolandumStore';
import { createSessionProgressTracker } from '../../../lib/progress/applySessionProgress';
import { PauseScreen, GameOverScreen, VictoryScreen } from '../shared/GameOverlays';
import { GameHeader } from '../shared/GameHeader';
import { getLevelProgress } from '../../../lib/learning/studyContext';

export default function RetroShooter({ levelId, langId, onExit, onNextLevel, isAudioEnabled, setIsAudioEnabled, isFxEnabled, setIsFxEnabled }) {
  const canvasRef = useRef(null);
  const engineRef = useRef(null);

  const levelProgress = useMemo(() => getLevelProgress(levelId, langId), [levelId, langId]);
  
  // Game State for UI
  const [activeScreen, setActiveScreen] = useState('playing'); // 'playing', 'pause', 'gameOver', 'victory', 'celebration'
  const [uiState, setUiState] = useState({
    score: 0,
    shields: '🛡️ 🛡️ 🛡️',
    level: 1,
    mastered: '0/10',
    gems: '💎 0',
    celebrationText: '',
    countdown: '4'
  });
  const [learnedWords, setLearnedWords] = useState([]);
  const [showStarWarsCrawl, setShowStarWarsCrawl] = useState(false);
  const [crawlConcept, setCrawlConcept] = useState(null);
  const sessionStartGemsRef = useRef(null);
  const progressTrackerRef = useRef(createSessionProgressTracker('shooter'));

  // Yeni koşu (skor sıfır) → senkron sayaçlarını sıfırla
  useEffect(() => {
    if (activeScreen === 'playing' && (parseInt(uiState.score, 10) || 0) === 0) {
      progressTrackerRef.current.reset();
      sessionStartGemsRef.current = null;
    }
  }, [activeScreen, uiState.score]);

  useEffect(() => {
    if (engineRef.current && engineRef.current.soundManager) {
      const sm = engineRef.current.soundManager;
      if (typeof sm.setFxEnabled === 'function') {
        sm.setFxEnabled(isFxEnabled);
      } else if (typeof sm.setMuted === 'function') {
        sm.setMuted(!isFxEnabled);
      }
      
      if (typeof sm.setAudioEnabled === 'function') {
        sm.setAudioEnabled(isAudioEnabled);
      }
    }
  }, [isFxEnabled, isAudioEnabled]);

  // Hooks
  const { words, isLoading, reload } = useLessonLoader(levelId, langId);

  // Callbacks for Engine -> React
  const onScoreChange = useCallback((val) => {
    setUiState(p => ({ ...p, score: val }));
  }, []);

  const onShieldsChange = useCallback((val) => setUiState(p => ({ ...p, shields: val })), []);
  const onLevelChange = useCallback((val) => setUiState(p => ({ ...p, level: val })), []);
  const onMasteredChange = useCallback((val) => setUiState(p => ({ ...p, mastered: val })), []);
  const onGemsChange = useCallback((val) => {
    const n = parseInt(String(val).replace(/[^0-9]/g, ''), 10) || 0;
    if (sessionStartGemsRef.current === null) {
      sessionStartGemsRef.current = n;
    }
    setUiState(p => ({ ...p, gems: val }));
  }, []);
  const onCelebrationTextChange = useCallback((val) => setUiState(p => ({ ...p, celebrationText: val })), []);
  const onCountdownChange = useCallback((val) => setUiState(p => ({ ...p, countdown: val })), []);
  
  const onScreenChange = useCallback((screenId, isHidden) => {
    if (!isHidden) {
      if (screenId === 'start-screen') setActiveScreen('start');
      if (screenId === 'game-over-screen') setActiveScreen('gameOver');
      if (screenId === 'victory-screen') setActiveScreen('victory');
      if (screenId === 'pause-screen') setActiveScreen('pause');
      if (screenId === 'celebration-screen') setActiveScreen('celebration');
      if (screenId === 'hud') setActiveScreen('playing');
    } else {
      // If pause or celebration overlays are closed, we return to the HUD (playing)
      if (['pause-screen', 'celebration-screen'].includes(screenId)) {
        setActiveScreen('playing');
      }
    }
  }, []);

  const onWordLearned = useCallback((wordHtml) => {
    setLearnedWords(prev => [...prev, wordHtml]);
  }, []);

  // When engine fires wordsLearnedThisRun, add them to the Vocabulary Vault
  const onVictory = useCallback((learnedArr) => {
    if (!learnedArr || learnedArr.length === 0) return;
    const { recordWordQuizResult } = useMemolandumStore.getState();
    learnedArr.forEach((w) => {
      recordWordQuizResult(w, true, 8, { language: langId });
    });
  }, [langId]);

  const closeCrawl = useCallback(() => {
    if ('speechSynthesis' in window) {
      window.speechSynthesis.cancel();
    }
    setShowStarWarsCrawl(false);
    setCrawlConcept(null);
    if (engineRef.current && engineRef.current.isPaused) {
      engineRef.current.isPaused = false;
      setActiveScreen('playing');
    }
  }, []);

  useEffect(() => {
    if (!showStarWarsCrawl) return undefined;
    const handleKeyDown = (e) => {
      if (e.key === " " || e.key === "Enter") {
        e.preventDefault();
        e.stopPropagation();
        closeCrawl();
      }
    };
    window.addEventListener("keydown", handleKeyDown, true);
    return () => window.removeEventListener("keydown", handleKeyDown, true);
  }, [showStarWarsCrawl, closeCrawl]);

  // Engine Initialization
  useEffect(() => {
    if (!canvasRef.current || isLoading || words.length === 0) return;

    const callbacks = {
      onScoreChange,
      onShieldsChange,
      onLevelChange,
      onMasteredChange,
      onGemsChange,
      onCelebrationTextChange,
      onCountdownChange,
      onScreenChange,
      onWordLearned,
      onVictory,
      onExit,
      onConceptMastered: (word) => {
        setCrawlConcept(word);
        setShowStarWarsCrawl(true);
        if (engineRef.current && !engineRef.current.isPaused) {
          engineRef.current.isPaused = true;
          setActiveScreen('pause');
        }
        
        // Record concept result to Vocabulary Vault immediately upon successful hit!
        try {
          const { recordWordQuizResult } = useMemolandumStore.getState();
          recordWordQuizResult(word, true, 8, { language: langId });
        } catch (err) {
          console.warn("Failed to record academic word quiz result immediately:", err);
        }

        if ('speechSynthesis' in window) {
          window.speechSynthesis.cancel();
          const utterance = new SpeechSynthesisUtterance(`${word.english}. ${word.turkish}. ${word.content || ""}`);
          utterance.lang = 'tr-TR';
          utterance.rate = 0.95;
          window.speechSynthesis.speak(utterance);
        }
      }
    };

    const engine = new ShooterGame(words, `level-${levelId}`, canvasRef.current, callbacks);
    engineRef.current = engine;
    
    if (engine.soundManager) {
      if (typeof engine.soundManager.setFxEnabled === 'function') {
        engine.soundManager.setFxEnabled(isFxEnabled);
      } else if (typeof engine.soundManager.setMuted === 'function') {
        engine.soundManager.setMuted(!isFxEnabled);
      }
      if (typeof engine.soundManager.setAudioEnabled === 'function') {
        engine.soundManager.setAudioEnabled(isAudioEnabled);
      }
    }
    
    engine.startGame();

    // Resize observer
    const resizeObserver = new ResizeObserver((entries) => {
      for (let entry of entries) {
        if (canvasRef.current && engineRef.current) {
          canvasRef.current.width = entry.contentRect.width;
          canvasRef.current.height = entry.contentRect.height;
          if (typeof engineRef.current.resize === 'function') {
            engineRef.current.resize(entry.contentRect.width, entry.contentRect.height);
          }
        }
      }
    });
    
    if (canvasRef.current.parentElement) {
      resizeObserver.observe(canvasRef.current.parentElement);
    }

    return () => {
      resizeObserver.disconnect();
      if ('speechSynthesis' in window) {
        window.speechSynthesis.cancel();
      }
      if (engineRef.current) {
        engineRef.current.cleanup(); // Stops requestAnimationFrame
      }
    };
  }, [isLoading, words, onScoreChange, onShieldsChange, onLevelChange, onMasteredChange, onGemsChange, onCelebrationTextChange, onCountdownChange, onScreenChange, onWordLearned, onExit]);

  // Handle Global State Sync when Game Ends (yalnızca senkronlanmamış delta)
  useEffect(() => {
    if (activeScreen === 'gameOver' || activeScreen === 'victory') {
      const s = parseInt(uiState.score, 10) || 0;
      const currentGems = parseInt(uiState.gems ? String(uiState.gems).replace(/[^0-9]/g, '') : '0', 10) || 0;
      const startGems = sessionStartGemsRef.current ?? currentGems;
      const g = Math.max(0, currentGems - startGems);
      progressTrackerRef.current.commit({ score: s, gems: g });
    }
  }, [activeScreen, uiState.score, uiState.gems]);

  // UI Event Triggers mapped to Engine
  const togglePause = () => {
    if (activeScreen === 'playing') {
      setActiveScreen('pause');
      if (engineRef.current) {
        if (typeof engineRef.current.togglePause === 'function') {
          if (!engineRef.current.isPaused) engineRef.current.togglePause();
        } else {
          engineRef.current.isPaused = true;
        }
      }
    } else if (activeScreen === 'pause') {
      setActiveScreen('playing');
      if (engineRef.current) {
        if (typeof engineRef.current.togglePause === 'function') {
          if (engineRef.current.isPaused) engineRef.current.togglePause();
        } else {
          engineRef.current.isPaused = false;
        }
      }
    }
  };

  const handleRestart = () => {
    setActiveScreen('playing');
    if (typeof reload === 'function') reload();
    else if (engineRef.current) engineRef.current.startGame();
  };

  if (isLoading) {
    return <div className="flex items-center justify-center h-full w-full text-cyan-400">Loading System...</div>;
  }

  return (
    <div className="relative w-full h-full bg-black overflow-hidden font-mono" style={{ fontFamily: '"Courier New", Courier, monospace' }}>
      
      {/* Game Canvas */}
      <div className="absolute inset-0 w-full h-full" onPointerDown={() => engineRef.current?.soundManager.warmUp()}>
        <canvas ref={canvasRef} className="w-full h-full block" />
      </div>

      {/* Star Wars Crawl Overlay */}
      {showStarWarsCrawl && crawlConcept && (
        <div className="absolute inset-0 w-full h-full bg-slate-950/85 backdrop-blur-md flex flex-col justify-between p-6 md:p-10 z-[100] pointer-events-auto select-text">
          <style>{`
            .star-wars-perspective {
              perspective: 300px;
              perspective-origin: 50% 100%;
            }
            .star-wars-crawl {
              transform: rotateX(18deg);
              transform-origin: 50% 100%;
              animation: starWarsScroll 12s linear forwards;
            }
            @keyframes starWarsScroll {
              0% {
                transform: rotateX(18deg) translateY(360px);
                opacity: 0;
              }
              15% {
                opacity: 1;
              }
              90% {
                opacity: 1;
              }
              100% {
                transform: rotateX(18deg) translateY(-180px);
                opacity: 0.95;
              }
            }
          `}</style>

          {/* Slanted Crawler Area */}
          <div className="flex-1 overflow-hidden relative star-wars-perspective flex items-center justify-center">
            <div className="absolute w-[92%] md:w-[85%] text-center text-[#FFE81F] font-sans star-wars-crawl flex flex-col gap-5 md:gap-6 px-4 leading-relaxed">
              <h2 className="text-2xl md:text-4xl font-black tracking-widest text-[#FFE81F] uppercase drop-shadow-[0_0_15px_rgba(255,232,31,0.6)]">
                {crawlConcept.english}
              </h2>
              {crawlConcept.romanized && (
                <div className="text-xs md:text-base font-bold text-slate-300 uppercase tracking-wider">
                  ({crawlConcept.romanized})
                </div>
              )}
              <div className="text-sm md:text-xl font-bold text-slate-100 border-y border-white/5 py-2.5">
                {crawlConcept.turkish}
              </div>
              <p className="text-xs md:text-lg font-semibold text-slate-300 text-center hyphens-auto tracking-wide max-w-2xl mx-auto leading-relaxed">
                {crawlConcept.content}
              </p>
            </div>
          </div>

          {/* Action button at bottom */}
          <div className="w-full flex justify-center py-4 z-[101]">
            <button
              onClick={closeCrawl}
              className="px-10 py-4 bg-gradient-to-r from-yellow-500 to-[#FFE81F] hover:from-[#FFE81F] hover:to-yellow-400 text-slate-950 font-black rounded-2xl text-xs md:text-sm uppercase tracking-widest hover:scale-105 active:scale-95 transition-all shadow-[0_0_25px_rgba(255,232,31,0.5)] cursor-pointer"
            >
              Devam Et (Space)
            </button>
          </div>
        </div>
      )}

      {/* UI Layer */}
      <div className="absolute inset-0 w-full h-full pointer-events-none z-40">
        <div className="scanlines absolute inset-0 bg-[linear-gradient(rgba(18,16,16,0)_50%,rgba(0,0,0,0.25)_50%),linear-gradient(90deg,rgba(255,0,0,0.06),rgba(0,255,0,0.02),rgba(0,0,255,0.06))] bg-[length:100%_4px,3px_100%] z-50 pointer-events-none"></div>

        {/* HUD */}
        {activeScreen === 'playing' && (
          <GameHeader>
            <GameHeader.Left>
              <GameHeader.Shields max={3} current={parseInt(uiState.shields, 10) || 0} />
              <GameHeader.Stage value={levelProgress.current} max={levelProgress.total} />
            </GameHeader.Left>

            <GameHeader.Right>
              <GameHeader.Score value={uiState.score} />
              <GameHeader.Gems value={uiState.gems ? String(uiState.gems).replace(/[^0-9]/g, '') : 0} />
              <GameHeader.Controls 
                isFxEnabled={isFxEnabled}
                onFxToggle={() => setIsFxEnabled && setIsFxEnabled(!isFxEnabled)}
                isAudioEnabled={isAudioEnabled}
                onAudioToggle={() => setIsAudioEnabled && setIsAudioEnabled(!isAudioEnabled)}
                onPause={togglePause}
              />
            </GameHeader.Right>
          </GameHeader>
        )}

        {/* Pause Screen */}
        {activeScreen === 'pause' && (
          <PauseScreen 
            onResume={togglePause} 
            onRestart={handleRestart} 
            onMainMenu={() => {
              if (onExit) onExit();
              else window.location.href = '/games/';
            }}
            words={words}
            levelId={levelId}
            langId={langId}
            currentGameType="shooter"
            isAudioEnabled={isAudioEnabled}
            onMiniQuizCorrect={() => {
              if (engineRef.current) {
                engineRef.current.shields = Math.min(3, (engineRef.current.shields || 0) + 1);
                if (typeof onShieldsChange === 'function') {
                  onShieldsChange(engineRef.current.shields);
                }
              }
              onScoreChange(parseInt(uiState.score, 10) + 50);
            }}
          />
        )}

        {/* Game Over Screen */}
        {activeScreen === 'gameOver' && (
          <GameOverScreen 
            score={uiState.score}
            message="SHIELDS DEPLETED"
            onRestart={handleRestart}
            onMainMenu={() => {
              if (onExit) onExit();
              else window.location.href = '/games/';
            }}
            words={words}
            levelId={levelId}
            langId={langId}
            currentGameType="shooter"
            isAudioEnabled={isAudioEnabled}
          />
        )}

        {/* Victory Screen */}
        {activeScreen === 'victory' && (
          <VictoryScreen 
            score={uiState.score}
            onNextLevel={() => onNextLevel ? onNextLevel() : handleRestart()}
            onMainMenu={() => {
              if (onExit) onExit();
              else window.location.href = '/games/';
            }}
            words={words}
            levelId={levelId}
            langId={langId}
            currentGameType="shooter"
          >
            <div className="flex flex-col items-center w-full bg-gray-900/50 p-4 rounded-xl border border-cyan-500/30 max-h-48 overflow-y-auto">
              <h3 className="text-cyan-400 mb-3 text-sm tracking-widest">LEARNED VOCABULARY</h3>
              <ul className="flex flex-wrap gap-2 justify-center">
                 {learnedWords.map((html, idx) => (
                    <li key={idx} dangerouslySetInnerHTML={{ __html: html }} className="text-green-400 bg-green-900/30 px-3 py-1 rounded-full border border-green-500/50 text-sm font-bold" />
                 ))}
              </ul>
            </div>
          </VictoryScreen>
        )}

        {/* Celebration Screen */}
        {activeScreen === 'celebration' && (
          <div className="absolute inset-0 flex flex-col items-center justify-center bg-black/60 pointer-events-none transition-opacity duration-1000">
            <h2 className="text-5xl text-yellow-400 font-bold mb-2 tracking-widest animate-pulse" dangerouslySetInnerHTML={{ __html: uiState.celebrationText }} style={{ textShadow: '0 0 20px #ffea00' }}></h2>
            <div className="text-3xl text-cyan-300 font-mono mt-8">
               {uiState.countdown}
            </div>
          </div>
        )}

        {/* Mobile Controls (Only visible in playing mode, positioned at bottom) */}
        {activeScreen === 'playing' && (
          <div className="absolute bottom-16 md:bottom-8 left-0 w-full px-6 flex justify-between pointer-events-auto select-none z-50">
             <div className="flex space-x-4">
               <button 
                onPointerDown={(e) => { e.preventDefault(); e.target.setPointerCapture(e.pointerId); if (engineRef.current) engineRef.current.input.left = true; }} 
                onPointerUp={(e) => { e.preventDefault(); e.target.releasePointerCapture(e.pointerId); if (engineRef.current) engineRef.current.input.left = false; }} 
                onPointerLeave={(e) => { e.preventDefault(); if (engineRef.current) engineRef.current.input.left = false; }}
                onPointerCancel={(e) => { e.preventDefault(); if (engineRef.current) engineRef.current.input.left = false; }}
                onContextMenu={(e) => e.preventDefault()}
                className="w-16 h-16 rounded-full border-2 border-cyan-500/50 flex items-center justify-center text-cyan-400 bg-cyan-900/30 backdrop-blur-sm active:bg-cyan-400 active:text-black transition-colors touch-none"
               >◀</button>
               <button 
                onPointerDown={(e) => { e.preventDefault(); e.target.setPointerCapture(e.pointerId); if (engineRef.current) engineRef.current.input.right = true; }} 
                onPointerUp={(e) => { e.preventDefault(); e.target.releasePointerCapture(e.pointerId); if (engineRef.current) engineRef.current.input.right = false; }} 
                onPointerLeave={(e) => { e.preventDefault(); if (engineRef.current) engineRef.current.input.right = false; }}
                onPointerCancel={(e) => { e.preventDefault(); if (engineRef.current) engineRef.current.input.right = false; }}
                onContextMenu={(e) => e.preventDefault()}
                className="w-16 h-16 rounded-full border-2 border-cyan-500/50 flex items-center justify-center text-cyan-400 bg-cyan-900/30 backdrop-blur-sm active:bg-cyan-400 active:text-black transition-colors touch-none"
               >▶</button>
             </div>
             <button 
              onPointerDown={(e) => { e.preventDefault(); e.target.setPointerCapture(e.pointerId); if (engineRef.current) engineRef.current.input.fire = true; }} 
              onPointerUp={(e) => { e.preventDefault(); e.target.releasePointerCapture(e.pointerId); if (engineRef.current) engineRef.current.input.fire = false; }} 
              onPointerLeave={(e) => { e.preventDefault(); if (engineRef.current) engineRef.current.input.fire = false; }}
              onPointerCancel={(e) => { e.preventDefault(); if (engineRef.current) engineRef.current.input.fire = false; }}
              onContextMenu={(e) => e.preventDefault()}
              className="w-20 h-20 rounded-full border-2 border-pink-500/50 flex items-center justify-center text-pink-500 bg-pink-900/30 backdrop-blur-sm active:bg-pink-500 active:text-white font-bold transition-colors touch-none"
             >FIRE</button>
          </div>
        )}

      </div>
    </div>
  );
}
