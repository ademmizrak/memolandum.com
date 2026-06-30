import React, { useEffect, useRef, useState, useCallback } from 'react';
import { ShooterGame } from './RetroShooterEngine';
import { useScoreSync } from '../../../hooks/useScoreSync';
import { useLessonLoader } from '../../../hooks/useLessonLoader';
import { useMemolandumStore } from '../../../store/useMemolandumStore';
import { PauseScreen, GameOverScreen, VictoryScreen } from '../shared/GameOverlays';

export default function RetroShooter({ levelId, langId, onExit, onNextLevel, isAudioEnabled, setIsAudioEnabled, isFxEnabled, setIsFxEnabled }) {
  const canvasRef = useRef(null);
  const engineRef = useRef(null);
  
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
  const [highScore, setHighScore] = useState(0);

  useEffect(() => {
    const saved = localStorage.getItem('memolandum_saved_score_high_shooter') || 0;
    // eslint-disable-next-line react-hooks/set-state-in-effect
    setHighScore(parseInt(saved, 10));
  }, []);

  useEffect(() => {
    if (engineRef.current && engineRef.current.soundManager) {
      engineRef.current.soundManager.setFxEnabled(isFxEnabled);
      engineRef.current.soundManager.setAudioEnabled(isAudioEnabled);
    }
  }, [isFxEnabled, isAudioEnabled]);

  // Hooks
  const { addScore, syncToFirebase } = useScoreSync('retro-shooter');
  const { words, isLoading } = useLessonLoader(levelId, langId);

  // Callbacks for Engine -> React (Wrapped in useCallback as requested by PRD)
  const onScoreChange = useCallback((val) => {
    const num = parseInt(val, 10) || 0;
    setUiState(p => ({ ...p, score: val }));
    setHighScore(prev => {
      if (num > prev) {
        localStorage.setItem('memolandum_saved_score_high_shooter', num);
        return num;
      }
      return prev;
    });
  }, []);

  const onShieldsChange = useCallback((val) => setUiState(p => ({ ...p, shields: val })), []);
  const onLevelChange = useCallback((val) => setUiState(p => ({ ...p, level: val })), []);
  const onMasteredChange = useCallback((val) => setUiState(p => ({ ...p, mastered: val })), []);
  const onGemsChange = useCallback((val) => setUiState(p => ({ ...p, gems: val })), []);
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
    // wordHtml is raw HTML from old engine, we can parse or just save raw text
    setLearnedWords(prev => [...prev, wordHtml]);
  }, []);

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
      onExit
    };

    const engine = new ShooterGame(words, `level-${levelId}`, canvasRef.current, callbacks);
    engineRef.current = engine;
    engine.soundManager.setFxEnabled(isFxEnabled);
    engine.soundManager.setAudioEnabled(isAudioEnabled);
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
      if (engineRef.current) {
        engineRef.current.cleanup(); // Stops requestAnimationFrame
      }
    };
  }, [isLoading, words, onScoreChange, onShieldsChange, onLevelChange, onMasteredChange, onGemsChange, onCelebrationTextChange, onCountdownChange, onScreenChange, onWordLearned, onExit]);

  // Handle Firebase Sync when Game Ends
  useEffect(() => {
    if (activeScreen === 'gameOver' || activeScreen === 'victory') {
      syncToFirebase();
    }
  }, [activeScreen, syncToFirebase]);

  // UI Event Triggers mapped to Engine
  const triggerAction = (actionId) => {
    if (engineRef.current) {
      engineRef.current.triggerAction(actionId);
    }
  };

  if (isLoading) {
    return <div className="flex items-center justify-center h-full w-full text-cyan-400">Loading System...</div>;
  }

  return (
    <div className="relative w-full h-full bg-black overflow-hidden font-mono" style={{ fontFamily: '"Courier New", Courier, monospace' }}>
      
      {/* Game Canvas */}
      <div className="absolute inset-0 w-full h-full">
        <canvas ref={canvasRef} className="w-full h-full block" />
      </div>

      {/* UI Layer */}
      <div className="absolute inset-0 w-full h-full pointer-events-none z-40">
        <div className="scanlines absolute inset-0 bg-[linear-gradient(rgba(18,16,16,0)_50%,rgba(0,0,0,0.25)_50%),linear-gradient(90deg,rgba(255,0,0,0.06),rgba(0,255,0,0.02),rgba(0,0,255,0.06))] bg-[length:100%_4px,3px_100%] z-50 pointer-events-none"></div>

        {/* HUD */}
        {activeScreen === 'playing' && (
          <div className="absolute top-0 left-0 w-full pointer-events-none z-50">
            <div className="game-hud-container pointer-events-auto">
              {/* 1. BÖLÜM: Oyuncu Durumu (Kalkan ve Aşama) */}
              <div className="hud-section player-stats">
                <div className="hud-card shield-card">
                  <span className="hud-icon animate-pulse">🛡️</span>
                  <div className="stat-meta">
                    <span className="stat-label">SHIELD</span>
                    <div className="shield-bar-wrapper">
                      <div 
                        className="shield-bar-fill" 
                        style={{ width: `${Math.max(0, (parseInt(uiState.shields, 10) || 0) / 3 * 100)}%` }}
                      ></div>
                    </div>
                  </div>
                </div>
                
                <div className="hud-card stage-card">
                  <span className="hud-icon">🚀</span>
                  <div className="stat-meta">
                    <span className="stat-label">STAGE</span>
                    <span className="stat-value text-cyan">
                      {String(uiState.level || '1').padStart(2, '0')}<span className="text-muted">/10</span>
                    </span>
                  </div>
                </div>
              </div>

              {/* 2. BÖLÜM: Skor ve Ekonomi (Mücevher / Kelime Sayacı) */}
              <div className="hud-section game-economy">
                <div className="hud-card score-card">
                  <div className="stat-meta text-center">
                    <span className="stat-label">SCORE</span>
                    <span className="stat-value neon-text-green">{uiState.score || '0'}</span>
                  </div>
                </div>

                <div className="hud-card gem-card">
                  <span className="hud-icon">💎</span>
                  <div className="stat-meta">
                    <span className="stat-label">GEMS</span>
                    <span className="stat-value neon-text-blue">{uiState.gems ? String(uiState.gems).replace(/[^0-9]/g, '') : '0'}</span>
                  </div>
                </div>
              </div>

              {/* 3. BÖLÜM: Konsolide Oyun Kontrolleri */}
              <div className="hud-section game-controls">
                <button 
                  className="hud-btn" 
                  id="hudFxBtn" 
                  title="Oyun Efektleri" 
                  onClick={() => setIsFxEnabled && setIsFxEnabled(!isFxEnabled)}
                  style={{ opacity: isFxEnabled ? 1 : 0.5 }}
                >
                  <svg xmlns="http://www.w3.org/2000/svg" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M9 18V5l12-2v13"></path><circle cx="6" cy="18" r="3"></circle><circle cx="18" cy="16" r="3"></circle></svg>
                </button>
                <button 
                  className="hud-btn" 
                  id="hudVoiceBtn" 
                  title="Kelime Telaffuzu" 
                  onClick={() => setIsAudioEnabled && setIsAudioEnabled(!isAudioEnabled)}
                  style={{ opacity: isAudioEnabled ? 1 : 0.5 }}
                >
                  <svg xmlns="http://www.w3.org/2000/svg" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M11 5L6 9H2v6h4l5 4V5z"></path><path d="M19.07 4.93a10 10 0 0 1 0 14.14M15.54 8.46a5 5 0 0 1 0 7.07"></path></svg>
                </button>
                <button 
                  className="hud-btn pause-btn" 
                  id="hudPauseBtn" 
                  title="Oyunu Durdur" 
                  onClick={() => triggerAction('btn-pause')}
                >
                  <svg xmlns="http://www.w3.org/2000/svg" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><line x1="18" y1="4" x2="18" y2="20"></line><line x1="6" y1="4" x2="6" y2="20"></line></svg>
                </button>
              </div>
            </div>
          </div>
        )}

        {/* Pause Screen */}
        {activeScreen === 'pause' && (
          <PauseScreen 
            onResume={() => triggerAction('resume-btn')} 
            onRestart={() => triggerAction('pause-restart-btn')} 
            onMainMenu={() => {
              if (onExit) onExit();
              else window.location.href = '/';
            }} 
          />
        )}

        {/* Game Over Screen */}
        {activeScreen === 'gameOver' && (
          <GameOverScreen 
            score={uiState.score}
            message="SHIELDS DEPLETED"
            onRestart={() => triggerAction('gameover-restart-btn')}
            onMainMenu={() => {
              if (onExit) onExit();
              else window.location.href = '/';
            }}
          />
        )}

        {/* Victory Screen */}
        {activeScreen === 'victory' && (
          <VictoryScreen 
            score={uiState.score}
            onNextLevel={() => onNextLevel ? onNextLevel() : triggerAction('victory-restart-btn')}
            onMainMenu={() => {
              if (onExit) onExit();
              else window.location.href = '/';
            }}
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
          <div className="absolute bottom-8 left-0 w-full px-6 flex justify-between pointer-events-auto select-none">
             <div className="flex space-x-4">
               <button 
                onTouchStart={(e) => { e.preventDefault(); if (engineRef.current) engineRef.current.input.left = true; }} 
                onTouchEnd={(e) => { e.preventDefault(); if (engineRef.current) engineRef.current.input.left = false; }} 
                onMouseDown={(e) => { e.preventDefault(); if (engineRef.current) engineRef.current.input.left = true; }} 
                onMouseUp={(e) => { e.preventDefault(); if (engineRef.current) engineRef.current.input.left = false; }}
                onMouseLeave={(e) => { e.preventDefault(); if (engineRef.current) engineRef.current.input.left = false; }}
                className="w-16 h-16 rounded-full border-2 border-cyan-500/50 flex items-center justify-center text-cyan-400 bg-cyan-900/30 backdrop-blur-sm active:bg-cyan-400 active:text-black transition-colors"
               >◀</button>
               <button 
                onTouchStart={(e) => { e.preventDefault(); if (engineRef.current) engineRef.current.input.right = true; }} 
                onTouchEnd={(e) => { e.preventDefault(); if (engineRef.current) engineRef.current.input.right = false; }} 
                onMouseDown={(e) => { e.preventDefault(); if (engineRef.current) engineRef.current.input.right = true; }} 
                onMouseUp={(e) => { e.preventDefault(); if (engineRef.current) engineRef.current.input.right = false; }}
                onMouseLeave={(e) => { e.preventDefault(); if (engineRef.current) engineRef.current.input.right = false; }}
                className="w-16 h-16 rounded-full border-2 border-cyan-500/50 flex items-center justify-center text-cyan-400 bg-cyan-900/30 backdrop-blur-sm active:bg-cyan-400 active:text-black transition-colors"
               >▶</button>
             </div>
             <button 
              onTouchStart={(e) => { e.preventDefault(); if (engineRef.current) engineRef.current.input.fire = true; }} 
              onTouchEnd={(e) => { e.preventDefault(); if (engineRef.current) engineRef.current.input.fire = false; }} 
              onMouseDown={(e) => { e.preventDefault(); if (engineRef.current) engineRef.current.input.fire = true; }} 
              onMouseUp={(e) => { e.preventDefault(); if (engineRef.current) engineRef.current.input.fire = false; }}
              onMouseLeave={(e) => { e.preventDefault(); if (engineRef.current) engineRef.current.input.fire = false; }}
              className="w-20 h-20 rounded-full border-2 border-pink-500/50 flex items-center justify-center text-pink-500 bg-pink-900/30 backdrop-blur-sm active:bg-pink-500 active:text-white font-bold transition-colors"
             >FIRE</button>
          </div>
        )}

      </div>
    </div>
  );
}
