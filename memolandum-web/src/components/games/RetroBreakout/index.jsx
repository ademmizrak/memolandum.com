import React, { useEffect, useRef, useState, useCallback } from 'react';
import { RetroBreakoutEngine } from './RetroBreakoutEngine';
import { useScoreSync } from '../../../hooks/useScoreSync';
import { useLessonLoader } from '../../../hooks/useLessonLoader';
import { useMemolandumStore } from '../../../store/useMemolandumStore';
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
  const [highScore, setHighScore] = useState(0);

  useEffect(() => {
    const saved = localStorage.getItem('memolandum_saved_score_high_breakout') || 0;
    setHighScore(parseInt(saved, 10));
  }, []);

  // Sync sound settings with global store / props if needed
  // For breakout engine, if we had a soundManager, we would set it here.
  // We will assume soundManager integration in the future, for now rely on callbacks.

  // Hooks
  const { addScore, syncToFirebase } = useScoreSync('breakout');
  const { words, isLoading } = useLessonLoader(levelId, langId);

  // Callbacks for Engine -> React
  const onScore = useCallback((val) => {
    const num = parseInt(val, 10) || 0;
    setUiState(p => ({ ...p, score: val }));
    setHighScore(prev => {
      if (num > prev) {
        localStorage.setItem('memolandum_saved_score_high_breakout', num);
        return num;
      }
      return prev;
    });
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

    // Smart TTS debounce for rapid block breaking
    if (isAudioEnabled && 'speechSynthesis' in window) {
       voiceQueue.current.lastWord = wordText;
       if (isTarget) {
         voiceQueue.current.targetWord = wordText;
       }
       
       if (voiceDebounceTimer.current) {
         clearTimeout(voiceDebounceTimer.current);
       }
       
       voiceDebounceTimer.current = setTimeout(() => {
         const { targetWord, lastWord } = voiceQueue.current;
         let textToSpeak = '';
         
         if (targetWord && targetWord !== lastWord) {
           textToSpeak = `${targetWord}, ${lastWord}`;
         } else {
           textToSpeak = targetWord || lastWord;
         }
         
         if (textToSpeak) {
           const utter = new SpeechSynthesisUtterance(textToSpeak);
           utter.lang = 'en-US';
           window.speechSynthesis.speak(utter);
         }
         
         // Reset the queue
         voiceQueue.current = { targetWord: null, lastWord: null };
       }, 1000);
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

  // Handle Firebase Sync when Game Ends
  useEffect(() => {
    if (activeScreen === 'gameOver' || activeScreen === 'victory') {
      // For this simplified version, assuming syncToFirebase takes the score
      addScore(uiState.score);
      syncToFirebase();
    }
  }, [activeScreen, syncToFirebase, addScore, uiState.score]);

  const togglePause = () => {
    if (activeScreen === 'playing') {
      setActiveScreen('pause');
      if (engineRef.current) engineRef.current.pauseGame();
    } else if (activeScreen === 'pause') {
      setActiveScreen('playing');
      if (engineRef.current) engineRef.current.resumeGame();
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
          <div className="absolute top-0 left-0 w-full pointer-events-none z-50">
            <div className="game-hud-container pointer-events-auto flex items-center justify-between p-4 bg-gradient-to-b from-black/80 to-transparent">
              
              {/* Player Stats (Shields & Target) */}
              <div className="flex space-x-6 items-center">
                <div className="hud-card shield-card flex items-center gap-2">
                  <span className="hud-icon text-2xl drop-shadow-[0_0_8px_#38bdf8]">🛡️</span>
                  <div className="flex flex-col">
                    <span className="text-[10px] text-cyan-500 font-bold tracking-widest">SHIELD</span>
                    <div className="flex gap-1 mt-1">
                       {[1,2,3].map(i => (
                         <div key={i} className={`h-3 w-8 rounded-sm ${i <= uiState.shields ? 'bg-cyan-400 shadow-[0_0_8px_#22d3ee]' : 'bg-gray-800'}`}></div>
                       ))}
                    </div>
                  </div>
                </div>
                
                <div className="hud-card bg-pink-900/40 border border-pink-500/50 rounded-lg px-6 py-2 shadow-[0_0_15px_rgba(236,72,153,0.3)]">
                  <span className="text-xs text-pink-400 block tracking-widest">HEDEF KELİME:</span>
                  <span className="text-xl text-white font-bold tracking-wider drop-shadow-[0_0_5px_#fff]">{uiState.targetWord}</span>
                </div>
              </div>

              {/* Controls & Score */}
              <div className="flex items-center gap-6">
                <div className="flex flex-col items-end">
                  <span className="text-[10px] text-green-500 font-bold tracking-widest">SCORE</span>
                  <span className="text-2xl text-green-400 font-black drop-shadow-[0_0_10px_#4ade80]">{uiState.score}</span>
                </div>

                <div className="flex gap-2">
                  <button 
                    className="hud-btn" 
                    title="Oyun Efektleri" 
                    onClick={() => setIsFxEnabled && setIsFxEnabled(!isFxEnabled)}
                    style={{ opacity: isFxEnabled ? 1 : 0.5 }}
                  >
                    <svg xmlns="http://www.w3.org/2000/svg" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M9 18V5l12-2v13"></path><circle cx="6" cy="18" r="3"></circle><circle cx="18" cy="16" r="3"></circle></svg>
                  </button>
                  <button 
                    className="hud-btn" 
                    title="Kelime Telaffuzu" 
                    onClick={() => setIsAudioEnabled && setIsAudioEnabled(!isAudioEnabled)}
                    style={{ opacity: isAudioEnabled ? 1 : 0.5 }}
                  >
                    <svg xmlns="http://www.w3.org/2000/svg" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M11 5L6 9H2v6h4l5 4V5z"></path><path d="M19.07 4.93a10 10 0 0 1 0 14.14M15.54 8.46a5 5 0 0 1 0 7.07"></path></svg>
                  </button>
                  <button 
                    className="hud-btn pause-btn" 
                    title="Oyunu Durdur"
                    onClick={togglePause}
                  >
                    <svg xmlns="http://www.w3.org/2000/svg" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><line x1="18" y1="4" x2="18" y2="20"></line><line x1="6" y1="4" x2="6" y2="20"></line></svg>
                  </button>
                </div>
              </div>
            </div>
          </div>
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
