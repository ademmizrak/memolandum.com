import React, { useEffect, useRef, useState, useCallback } from 'react';
import { useLessonLoader } from '../../../hooks/useLessonLoader';
import { PauseScreen, GameOverScreen, VictoryScreen } from '../shared/GameOverlays';
import { GameHeader } from '../shared/GameHeader';
import { WordAscentGame } from './engineCore';
import { useMemolandumStore } from '../../../store/useMemolandumStore';
import GlobalStateSync from '../../../lib/firebase/GlobalStateSync';

// The Word Ascent Protocol (Shell #5) - Canvas Integration
export default function WordAscent({ 
  levelId, 
  langId, 
  onExit, 
  onNextLevel, 
  isAudioEnabled, 
  setIsAudioEnabled, 
  isFxEnabled, 
  setIsFxEnabled 
}) {
  // Hooks
  const { words, isLoading } = useLessonLoader(levelId, langId);

  // UI State
  const [activeScreen, setActiveScreen] = useState('playing'); // playing, paused, gameover, victory
  const [score, setScore] = useState(0);
  const [learnedCount, setLearnedCount] = useState(0);
  const [learnedWords, setLearnedWords] = useState([]);
  const [shields, setShields] = useState(3);
  const [totalWords, setTotalWords] = useState(0);
  
  // Canvas Refs
  const canvasRef = useRef(null);
  const containerRef = useRef(null);
  const gameEngineRef = useRef(null);
  const requestRef = useRef(null);
  const hasSyncedRef = useRef(false);

  useEffect(() => {
    if (activeScreen === 'playing') {
      hasSyncedRef.current = false;
    }
  }, [activeScreen]);

  useEffect(() => {
    if ((activeScreen === 'gameover' || activeScreen === 'victory') && !hasSyncedRef.current) {
      hasSyncedRef.current = true;
      const state = useMemolandumStore.getState();
      const s = parseInt(score, 10) || 0;
      const x = Math.floor(s / 10);
      
      state.addLocalProgress('word_ascent', { score: s, xp: x, gems: 0 });
      if (state.uid) {
         GlobalStateSync.updateProgress(state.uid, 'word_ascent', { score: s, xp: x, gems: 0 });
      }
    }
  }, [activeScreen, score]);

  const initGame = useCallback(() => {
    if (!canvasRef.current || !words || words.length === 0) return;
    
    // Cleanup old engine if exists
    if (gameEngineRef.current) {
       cancelAnimationFrame(requestRef.current);
    }

    const ctx = canvasRef.current.getContext('2d');
    
    // Create new engine instance
    const engine = new WordAscentGame(canvasRef.current, ctx, words, {
      onScore: (points) => {
        setScore(s => s + points);
      },
      onLearned: (wordObj) => {
        setLearnedWords(prev => {
          if (!prev.find(w => w.english === wordObj.english)) {
            return [...prev, wordObj];
          }
          return prev;
        });
      },
      onStateChange: (stateData) => {
        if (stateData.state === 'paused') {
          setActiveScreen('pause');
        } else {
          setActiveScreen(stateData.state); // 'playing', 'gameover', 'victory'
        }
        setShields(stateData.shields);
        setLearnedCount(stateData.processedCount);
        setTotalWords(stateData.totalWords);
      }
    });

    gameEngineRef.current = engine;
    
    // Initial Resize
    const resizeCanvas = () => {
      if (containerRef.current && engine) {
        engine.resize(containerRef.current.clientWidth, containerRef.current.clientHeight);
      }
    };
    
    window.addEventListener('resize', resizeCanvas);
    resizeCanvas();

    // Start Game Loop
    engine.startGame();
    
    const loop = (time) => {
      if (engine.state === 'playing') {
        engine.gameLoop(time);
      }
      requestRef.current = requestAnimationFrame(loop);
    };
    
    requestRef.current = requestAnimationFrame(loop);

    return () => {
      window.removeEventListener('resize', resizeCanvas);
      cancelAnimationFrame(requestRef.current);
    };
  }, [words]);

  useEffect(() => {
    if (!isLoading && words && words.length > 0) {
      const cleanup = initGame();
      return cleanup;
    }
  }, [isLoading, words, initGame]);

  // Keyboard Handlers
  useEffect(() => {
    const handleKeyDown = (e) => {
      if (gameEngineRef.current && activeScreen === 'playing') {
        if (e.key === 'ArrowLeft' || e.key === 'a' || e.key === 'A') {
          gameEngineRef.current.handleInput('left');
          e.preventDefault();
        } else if (e.key === 'ArrowRight' || e.key === 'd' || e.key === 'D') {
          gameEngineRef.current.handleInput('right');
          e.preventDefault();
        } else if (e.key === 'ArrowUp' || e.key === 'w' || e.key === 'W' || e.key === ' ') {
          gameEngineRef.current.handleInput('jump');
          e.preventDefault();
        } else if (e.key === 'Escape' || e.key === 'p' || e.key === 'P') {
          gameEngineRef.current.state = 'paused';
          setActiveScreen('pause');
          e.preventDefault();
        }
      }
    };

    const handleKeyUp = (e) => {
      if (gameEngineRef.current && activeScreen === 'playing') {
        if (['ArrowLeft', 'a', 'A', 'ArrowRight', 'd', 'D'].includes(e.key)) {
          gameEngineRef.current.handleInput('stopX');
        }
      }
    };

    window.addEventListener('keydown', handleKeyDown, { passive: false });
    window.addEventListener('keyup', handleKeyUp);
    return () => {
      window.removeEventListener('keydown', handleKeyDown);
      window.removeEventListener('keyup', handleKeyUp);
    };
  }, [activeScreen]);

  // Screen Actions
  const handleResume = () => {
    setActiveScreen('playing');
    if (gameEngineRef.current) {
      gameEngineRef.current.state = 'playing';
    }
  };

  const handleRestart = () => {
    setScore(0);
    setLearnedCount(0);
    setLearnedWords([]);
    setActiveScreen('playing');
    if (gameEngineRef.current) {
      gameEngineRef.current.startGame();
    }
  };

  const handleNextLevel = () => {
    if (onNextLevel) onNextLevel();
  };

  const handleExit = async () => {
    if (onExit) onExit();
  };

  if (isLoading) {
    return (
      <div className="w-full h-full flex items-center justify-center bg-[#06030c]">
        <div className="text-[#00f0ff] text-2xl font-black animate-pulse font-mono tracking-widest drop-shadow-[0_0_10px_#00f0ff]">
          LOADING SHELL #5...
        </div>
      </div>
    );
  }

  return (
    <div className="w-full h-full bg-[#030106] flex justify-center items-center">
      <div className="w-full max-w-[600px] h-full relative bg-[#06030c] flex flex-col overflow-hidden font-sans select-none border-x-2 border-slate-800/50 shadow-[0_0_50px_rgba(0,240,255,0.1)]">
      
      {/* 1) HUD (Universal Top Header) */}
      <GameHeader>
        <GameHeader.Left>
          <GameHeader.Shields max={3} current={shields} />
          <GameHeader.Stage value={learnedCount} max={totalWords || 12} label="ASCENDED" icon="▲" />
        </GameHeader.Left>

        <GameHeader.Right>
          <GameHeader.Score value={score} />
          <GameHeader.Controls 
            isFxEnabled={isFxEnabled}
            onFxToggle={() => setIsFxEnabled && setIsFxEnabled(!isFxEnabled)}
            isAudioEnabled={isAudioEnabled}
            onAudioToggle={() => setIsAudioEnabled && setIsAudioEnabled(!isAudioEnabled)}
            onPause={() => {
              setActiveScreen('pause');
              if (gameEngineRef.current) gameEngineRef.current.state = 'paused';
            }}
          />
        </GameHeader.Right>
      </GameHeader>

      {/* 2) Canvas Container */}
      <div 
        ref={containerRef} 
        className="flex-1 w-full relative bg-[#06030c] shadow-[inset_0_0_100px_rgba(0,0,0,0.9)] touch-none"
        onPointerDown={() => gameEngineRef.current?.soundManager.warmUp()}
      >
        <canvas 
          ref={canvasRef} 
          className="block w-full h-full"
          onPointerDown={(e) => {
             if (gameEngineRef.current && activeScreen === 'playing') {
                const rect = canvasRef.current.getBoundingClientRect();
                const y = e.clientY - rect.top;
                // If tapping top half of the screen directly, it acts as a jump
                if (y < rect.height / 2) {
                   gameEngineRef.current.handleInput('jump');
                }
             }
          }}
        />
      </div>

      {/* 3) Virtual Mobile Gamepad */}
      {activeScreen === 'playing' && (
        <div className="w-full bg-[#05020a] border-t-2 border-[#00f0ff] py-4 px-4 md:px-12 flex justify-between items-center pointer-events-none select-none shrink-0 z-50 shadow-[0_-4px_20px_rgba(0,240,255,0.15)]">
            
            {/* Left Controls (Steering) */}
            <div className="flex gap-4 pointer-events-auto">
              <button 
                onPointerDown={(e) => {
                  if (gameEngineRef.current) gameEngineRef.current.handleInput('left');
                }}
                onPointerUp={() => {
                  if (gameEngineRef.current) gameEngineRef.current.handleInput('stopX');
                }}
                onPointerLeave={() => {
                  if (gameEngineRef.current) gameEngineRef.current.handleInput('stopX');
                }}
                onContextMenu={(e) => e.preventDefault()}
                className="w-16 h-16 bg-[#00f0ff]/10 border-2 border-[#00f0ff]/50 rounded-full flex items-center justify-center text-[#00f0ff] shadow-[0_0_15px_rgba(0,240,255,0.3)] active:bg-[#00f0ff]/40 active:scale-95 transition-all touch-none"
              >
                <svg xmlns="http://www.w3.org/2000/svg" className="h-8 w-8 pointer-events-none" viewBox="0 0 20 20" fill="currentColor">
                  <path fillRule="evenodd" d="M12.707 5.293a1 1 0 010 1.414L9.414 10l3.293 3.293a1 1 0 01-1.414 1.414l-4-4a1 1 0 010-1.414l4-4a1 1 0 011.414 0z" clipRule="evenodd" />
                </svg>
              </button>
              <button 
                onPointerDown={(e) => {
                  if (gameEngineRef.current) gameEngineRef.current.handleInput('right');
                }}
                onPointerUp={() => {
                  if (gameEngineRef.current) gameEngineRef.current.handleInput('stopX');
                }}
                onPointerLeave={() => {
                  if (gameEngineRef.current) gameEngineRef.current.handleInput('stopX');
                }}
                onContextMenu={(e) => e.preventDefault()}
                className="w-16 h-16 bg-[#00f0ff]/10 border-2 border-[#00f0ff]/50 rounded-full flex items-center justify-center text-[#00f0ff] shadow-[0_0_15px_rgba(0,240,255,0.3)] active:bg-[#00f0ff]/40 active:scale-95 transition-all touch-none"
              >
                <svg xmlns="http://www.w3.org/2000/svg" className="h-8 w-8 pointer-events-none" viewBox="0 0 20 20" fill="currentColor">
                  <path fillRule="evenodd" d="M7.293 14.707a1 1 0 010-1.414L10.586 10 7.293 6.707a1 1 0 011.414-1.414l4 4a1 1 0 010 1.414l-4 4a1 1 0 01-1.414 0z" clipRule="evenodd" />
                </svg>
              </button>
            </div>

            {/* Right Controls (Jump / Rocket) */}
            <div className="flex pointer-events-auto">
              <button 
                onPointerDown={(e) => {
                  if (gameEngineRef.current) gameEngineRef.current.handleInput('jump');
                }}
                onContextMenu={(e) => e.preventDefault()}
                className="w-20 h-20 bg-[#39ff14]/10 border-2 border-[#39ff14]/60 rounded-full flex items-center justify-center text-[#39ff14] shadow-[0_0_20px_rgba(57,255,20,0.4)] active:bg-[#39ff14]/40 active:border-[#39ff14] active:scale-95 transition-all touch-none"
              >
                <svg xmlns="http://www.w3.org/2000/svg" className="h-10 w-10 pointer-events-none" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={3}>
                  <path strokeLinecap="round" strokeLinejoin="round" d="M5 11l7-7 7 7M5 19l7-7 7 7" />
                </svg>
              </button>
            </div>
          </div>
        )}

      {/* 4) Overlays */}
      {activeScreen === 'pause' && (
        <PauseScreen 
          score={score}
          onResume={handleResume} 
          onRestart={handleRestart} 
          onMainMenu={handleExit} 
          isAudioEnabled={isAudioEnabled}
          setIsAudioEnabled={setIsAudioEnabled}
          isFxEnabled={isFxEnabled}
          setIsFxEnabled={setIsFxEnabled}
        />
      )}
      {activeScreen === 'gameover' && (
        <GameOverScreen score={score} learnedWords={learnedWords} onRestart={handleRestart} onMainMenu={handleExit} />
      )}
      {activeScreen === 'victory' && (
        <VictoryScreen score={score} learnedWords={learnedWords} onNextLevel={handleNextLevel} onMainMenu={handleExit} />
      )}
      
      </div>
    </div>
  );
}
