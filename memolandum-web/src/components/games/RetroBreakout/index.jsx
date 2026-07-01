import React, { useEffect, useRef, useState, useCallback } from 'react';
import { RetroBreakoutEngine } from './RetroBreakoutEngine';
import { useLessonLoader } from '../../../hooks/useLessonLoader';
import { useMemolandumStore } from '../../../store/useMemolandumStore';
import GlobalStateSync from '../../../lib/firebase/GlobalStateSync';
import { GameHeader } from '../shared/GameHeader';
import { PauseScreen, GameOverScreen, VictoryScreen } from '../shared/GameOverlays';

export default function RetroBreakout({ levelId, langId, onExit, onNextLevel, isAudioEnabled, setIsAudioEnabled, isFxEnabled, setIsFxEnabled }) {
  const canvasRef = useRef(null);
  const engineRef = useRef(null);
  
  // Game State for UI
  const [activeScreen, setActiveScreen] = useState('playing'); // 'playing', 'pause', 'gameOver', 'victory'
  const [uiState, setUiState] = useState({
    score: 0,
    shields: 3, // Numeric shields for Dx-Ball
    level: 1,
    mastered: '0/10',
    gems: '0',
    targetWord: 'HEDEF BEKLENİYOR...'
  });
  const [learnedWords, setLearnedWords] = useState([]);
  const hasSyncedRef = useRef(false);

  useEffect(() => {
    if (activeScreen === 'playing') {
      hasSyncedRef.current = false;
    }
  }, [activeScreen]);

  // Sync sound settings with global store / props if needed
  // For breakout engine, if we had a soundManager, we would set it here.
  // We will assume soundManager integration in the future, for now rely on callbacks.

  // Hooks
  const { words, isLoading } = useLessonLoader(levelId, langId);

  // Callbacks for Engine -> React
  const onScore = useCallback((val) => {
    setUiState(p => ({ ...p, score: val }));
  }, []);

  const onUpdateLives = useCallback((val) => {
    setUiState(p => ({ ...p, shields: val }));
  }, []);

  const onGameOver = useCallback((isVictory, finalScore) => {
    setActiveScreen(isVictory ? 'victory' : 'gameOver');
  }, []);
  
  const onTargetWord = useCallback((trWord) => {
    setUiState(p => ({ ...p, targetWord: trWord.toUpperCase() }));
  }, []);

  const voiceDebounceTimer = useRef(null);
  const voiceQueue = useRef({ targetWord: null, lastWord: null });

  const onPlayVoice = useCallback((wordText, isTarget) => {
    // Play SFX if enabled
    if (isFxEnabled) {
       // Optional: Add simple web audio API beep for block hit
       try {
         const ctx = new (window.AudioContext || window.webkitAudioContext)();
         const osc = ctx.createOscillator();
         const gain = ctx.createGain();
         osc.connect(gain);
         gain.connect(ctx.destination);
         osc.type = 'square';
         osc.frequency.value = 400; // Beep
         gain.gain.setValueAtTime(0.1, ctx.currentTime);
         gain.gain.exponentialRampToValueAtTime(0.01, ctx.currentTime + 0.1);
         osc.start(ctx.currentTime);
         osc.stop(ctx.currentTime + 0.1);
       } catch (e) {
         console.warn("Web Audio not supported", e);
       }
    }

    // Snappy TTS for rapid block breaking
    if (isAudioEnabled && 'speechSynthesis' in window) {
       window.speechSynthesis.cancel(); // Interrupt any ongoing speech
       const utter = new SpeechSynthesisUtterance(wordText);
       utter.lang = 'en-US';
       window.speechSynthesis.speak(utter);
    }
  }, [isAudioEnabled, isFxEnabled]);

  // Engine Initialization
  useEffect(() => {
    if ('speechSynthesis' in window) {
      window.speechSynthesis.cancel(); // Clear any pending TTS from previous games
    }
    
    if (!canvasRef.current || isLoading || words.length === 0) return;

    const callbacks = {
      onScore,
      onUpdateLives,
      onGameOver,
      onPlayVoice,
      onTargetWord
    };

    const engine = new RetroBreakoutEngine(canvasRef.current, words, callbacks);
    engineRef.current = engine;
    engine.startGame();

    // Resize observer
    const resizeObserver = new ResizeObserver((entries) => {
      for (let entry of entries) {
        if (canvasRef.current && engineRef.current) {
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
        engineRef.current.destroy();
      }
    };
  }, [isLoading, words, onScore, onUpdateLives, onGameOver, onPlayVoice, onTargetWord]);

  // Handle Global State Sync when Game Ends
  useEffect(() => {
    if ((activeScreen === 'gameOver' || activeScreen === 'victory') && !hasSyncedRef.current) {
      hasSyncedRef.current = true;
      const state = useMemolandumStore.getState();
      const s = parseInt(uiState.score, 10) || 0;
      const x = Math.floor(s / 10);
      
      state.addLocalProgress('breakout', { score: s, xp: x, gems: 0 });
      if (state.uid) {
         GlobalStateSync.updateProgress(state.uid, 'breakout', { score: s, xp: x, gems: 0 });
      }
    }
  }, [activeScreen, uiState.score]);

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

  const restartGame = () => {
    setActiveScreen('playing');
    if (engineRef.current) engineRef.current.startGame();
  };

  if (isLoading) {
    return <div className="flex items-center justify-center h-full w-full text-pink-500 font-mono text-xl animate-pulse">LOADING DX-BALL SYSTEM...</div>;
  }

  return (
    <div className="relative w-full h-full bg-black overflow-hidden font-mono" style={{ fontFamily: '"Courier New", Courier, monospace' }}>
      
      {/* Game Canvas */}
      <div className="absolute inset-0 w-full h-full">
        <canvas ref={canvasRef} className="w-full h-full block touch-none" />
      </div>

      {/* UI Layer */}
      <div className="absolute inset-0 w-full h-full pointer-events-none z-40">
        <div className="scanlines absolute inset-0 bg-[linear-gradient(rgba(18,16,16,0)_50%,rgba(0,0,0,0.25)_50%),linear-gradient(90deg,rgba(255,0,0,0.06),rgba(0,255,0,0.02),rgba(0,0,255,0.06))] bg-[length:100%_4px,3px_100%] z-50 pointer-events-none"></div>

        {/* HUD */}
        {activeScreen === 'playing' && (
          <GameHeader>
            <GameHeader.Left>
              <GameHeader.Shields max={3} current={uiState.shields} />
              <GameHeader.TargetWord value={uiState.targetWord} />
            </GameHeader.Left>

            <GameHeader.Right>
              <GameHeader.Score value={uiState.score} />
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
            onRestart={restartGame} 
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
            onRestart={restartGame}
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
            onNextLevel={onNextLevel}
            onMainMenu={() => {
              if (onExit) onExit();
              else window.location.href = '/';
            }}
          />
        )}

      </div>
    </div>
  );
}
