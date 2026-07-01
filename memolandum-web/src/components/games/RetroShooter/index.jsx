import React, { useEffect, useRef, useState, useCallback } from 'react';
import { ShooterGame } from './RetroShooterEngine';
import { useLessonLoader } from '../../../hooks/useLessonLoader';
import { useMemolandumStore } from '../../../store/useMemolandumStore';
import GlobalStateSync from '../../../lib/firebase/GlobalStateSync';
import { PauseScreen, GameOverScreen, VictoryScreen } from '../shared/GameOverlays';
import { GameHeader } from '../shared/GameHeader';

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
  const hasSyncedRef = useRef(false);

  useEffect(() => {
    if (activeScreen === 'playing') {
      hasSyncedRef.current = false;
    }
  }, [activeScreen]);

  useEffect(() => {
    if (engineRef.current && engineRef.current.soundManager) {
      engineRef.current.soundManager.setFxEnabled(isFxEnabled);
      engineRef.current.soundManager.setAudioEnabled(isAudioEnabled);
    }
  }, [isFxEnabled, isAudioEnabled]);

  // Hooks
  const { words, isLoading } = useLessonLoader(levelId, langId);

  // Callbacks for Engine -> React
  const onScoreChange = useCallback((val) => {
    setUiState(p => ({ ...p, score: val }));
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

  // Handle Global State Sync when Game Ends
  useEffect(() => {
    if ((activeScreen === 'gameOver' || activeScreen === 'victory') && !hasSyncedRef.current) {
      hasSyncedRef.current = true;
      const state = useMemolandumStore.getState();
      const s = parseInt(uiState.score, 10) || 0;
      const g = parseInt(uiState.gems ? String(uiState.gems).replace(/[^0-9]/g, '') : '0', 10) || 0;
      const x = Math.floor(s / 10); // Basic XP calculation
      
      // Update local store
      state.addLocalProgress('shooter', { score: s, xp: x, gems: g });
      
      // Update Firestore if logged in
      if (state.uid) {
         GlobalStateSync.updateProgress(state.uid, 'shooter', { score: s, xp: x, gems: g });
      }
    }
  }, [activeScreen, uiState.score, uiState.gems]);

  // UI Event Triggers mapped to Engine
  const togglePause = () => {
    if (activeScreen === 'playing') {
      setActiveScreen('pause');
      if (engineRef.current) engineRef.current.isPaused = true;
    } else if (activeScreen === 'pause') {
      setActiveScreen('playing');
      if (engineRef.current) engineRef.current.isPaused = false;
    }
  };

  const handleRestart = () => {
    setActiveScreen('playing');
    if (engineRef.current) engineRef.current.startGame();
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

      {/* UI Layer */}
      <div className="absolute inset-0 w-full h-full pointer-events-none z-40">
        <div className="scanlines absolute inset-0 bg-[linear-gradient(rgba(18,16,16,0)_50%,rgba(0,0,0,0.25)_50%),linear-gradient(90deg,rgba(255,0,0,0.06),rgba(0,255,0,0.02),rgba(0,0,255,0.06))] bg-[length:100%_4px,3px_100%] z-50 pointer-events-none"></div>

        {/* HUD */}
        {activeScreen === 'playing' && (
          <GameHeader>
            <GameHeader.Left>
              <GameHeader.Shields max={3} current={parseInt(uiState.shields, 10) || 0} />
              <GameHeader.Stage value={uiState.level || 1} max={10} />
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
              else window.location.href = '/';
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
              else window.location.href = '/';
            }}
          />
        )}

        {/* Victory Screen */}
        {activeScreen === 'victory' && (
          <VictoryScreen 
            score={uiState.score}
            onNextLevel={() => onNextLevel ? onNextLevel() : handleRestart()}
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
