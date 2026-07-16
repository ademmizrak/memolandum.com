import React, { useEffect, useRef, useState, useCallback } from 'react';
import { useLessonLoader } from '../../../hooks/useLessonLoader';
import { PauseScreen, GameOverScreen, VictoryScreen } from '../shared/GameOverlays';
import { GameHeader } from '../shared/GameHeader';
import { WordDropGame } from './engineCore';
import { createSessionProgressTracker } from '../../../lib/progress/applySessionProgress';

// Reverse Word Drop Protocol V2 (Dikey Tetris) - Canvas Integration
export default function WordDrop({ 
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
  const [totalWords, setTotalWords] = useState(12);
  const [levelText, setLevelText] = useState('1/1');
  
  // Canvas Refs
  const canvasRef = useRef(null);
  const containerRef = useRef(null);
  const gameEngineRef = useRef(null);
  const progressTrackerRef = useRef(createSessionProgressTracker('word_drop'));

  useEffect(() => {
    if (activeScreen === 'playing' && (parseInt(score, 10) || 0) === 0) {
      progressTrackerRef.current.reset();
    }
  }, [activeScreen, score]);

  useEffect(() => {
    if (activeScreen === 'gameover' || activeScreen === 'victory') {
      progressTrackerRef.current.commit({ score, gems: 0 });
    }
  }, [activeScreen, score]);

  const initGame = useCallback(() => {
    if (!canvasRef.current || !words || words.length === 0) return;
    
    if (gameEngineRef.current) {
       gameEngineRef.current.stopGame();
    }

    const ctx = canvasRef.current.getContext('2d');
    
    // Create new engine instance
    const engine = new WordDropGame(canvasRef.current, ctx, words, {
      onScore: (points) => {
        // handled internally, but we could expose it
      },
      onGameOver: (finalScore, learned) => {
        setScore(finalScore);
        setLearnedWords(learned);
        setActiveScreen('gameover');
      },
      onVictory: (finalScore, learned) => {
        setScore(finalScore);
        setLearnedWords(learned);
        setActiveScreen('victory');
      },
      onStateUpdate: (stateData) => {
        if (stateData.score !== undefined) setScore(stateData.score);
        if (stateData.shields !== undefined) setShields(stateData.shields);
        if (stateData.levelText !== undefined) setLevelText(stateData.levelText);
        if (stateData.masteredCount !== undefined) setLearnedCount(stateData.masteredCount);
        if (stateData.masteredTotal !== undefined) setTotalWords(stateData.masteredTotal);
      }
    });

    gameEngineRef.current = engine;
    
    const resizeCanvas = () => {
      if (containerRef.current && engine) {
        engine.resize(containerRef.current.clientWidth, containerRef.current.clientHeight);
      }
    };
    
    window.addEventListener('resize', resizeCanvas);
    resizeCanvas();

    engine.startGame();

    return () => {
      window.removeEventListener('resize', resizeCanvas);
      if (gameEngineRef.current) {
        gameEngineRef.current.stopGame();
      }
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
        } else if (e.key === 'ArrowDown' || e.key === 's' || e.key === 'S') {
          gameEngineRef.current.handleInput('down');
          e.preventDefault();
        } else if (e.key === 'ArrowUp' || e.key === 'w' || e.key === 'W') {
          gameEngineRef.current.handleInput('rotate');
          e.preventDefault();
        } else if (e.key === ' ') {
          gameEngineRef.current.handleInput('drop');
          e.preventDefault();
        } else if (e.key === 'Escape' || e.key === 'p' || e.key === 'P') {
          gameEngineRef.current.state = 'paused';
          setActiveScreen('pause');
          e.preventDefault();
        }
      }
    };

    window.addEventListener('keydown', handleKeyDown, { passive: false });
    return () => {
      window.removeEventListener('keydown', handleKeyDown);
    };
  }, [activeScreen]);

  const handleResume = () => {
    setActiveScreen('playing');
    if (gameEngineRef.current) {
      gameEngineRef.current.state = 'playing';
      gameEngineRef.current.lastTime = 0;
      gameEngineRef.current.loopId = requestAnimationFrame((time) => gameEngineRef.current.gameLoop(time));
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
        <div className="text-[#ff0055] text-2xl font-black animate-pulse font-mono tracking-widest drop-shadow-[0_0_10px_#ff0055]">
          LOADING REVERSE DROP PROTOCOL...
        </div>
      </div>
    );
  }

  return (
    <div className="w-full h-full bg-[#030106] flex justify-center items-center">
      <div className="w-full max-w-[600px] h-full relative bg-[#06030c] flex flex-col overflow-hidden font-sans select-none border-x-2 border-slate-800/50 shadow-[0_0_50px_rgba(255,0,85,0.15)]">
      
      {/* 1) HUD (Universal Top Header) */}
      <GameHeader>
        <GameHeader.Left>
          <GameHeader.Shields max={3} current={shields} />
          <GameHeader.Stage value={learnedCount} max={totalWords || 12} label="CLEARED" icon="▼" />
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
        />
      </div>

      {/* 3) Virtual Mobile Gamepad */}
      {activeScreen === 'playing' && (
        <div className="w-full bg-[#05020a] border-t-2 border-[#ff0055] py-4 px-4 md:px-12 flex justify-between items-center pointer-events-auto select-none shrink-0 z-50 shadow-[0_-4px_20px_rgba(255,0,85,0.15)]">
            
            {/* Left Controls (Move Left/Right/Down) */}
            <div className="flex gap-2">
              <button 
                onPointerDown={(e) => { e.preventDefault(); if (gameEngineRef.current) gameEngineRef.current.handleInput('left'); }}
                className="w-14 h-14 md:w-16 md:h-16 rounded-full bg-slate-800/80 border-2 border-slate-600 flex items-center justify-center text-white active:bg-[#ff0055] active:border-white transition-colors touch-none"
              >
                <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round" className="w-8 h-8">
                   <path d="M15 18l-6-6 6-6" />
                </svg>
              </button>
              <button 
                onPointerDown={(e) => { e.preventDefault(); if (gameEngineRef.current) gameEngineRef.current.handleInput('down'); }}
                className="w-14 h-14 md:w-16 md:h-16 rounded-full bg-slate-800/80 border-2 border-slate-600 flex items-center justify-center text-white active:bg-[#ff0055] active:border-white transition-colors touch-none"
              >
                <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round" className="w-8 h-8">
                   <path d="M6 9l6 6 6-6" />
                </svg>
              </button>
              <button 
                onPointerDown={(e) => { e.preventDefault(); if (gameEngineRef.current) gameEngineRef.current.handleInput('right'); }}
                className="w-14 h-14 md:w-16 md:h-16 rounded-full bg-slate-800/80 border-2 border-slate-600 flex items-center justify-center text-white active:bg-[#ff0055] active:border-white transition-colors touch-none"
              >
                <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round" className="w-8 h-8">
                   <path d="M9 18l6-6-6-6" />
                </svg>
              </button>
            </div>

            {/* Middle Control (Hard Drop) */}
            <div className="flex flex-1 justify-center px-2">
              <button 
                onPointerDown={(e) => { e.preventDefault(); if (gameEngineRef.current) gameEngineRef.current.handleInput('drop'); }}
                className="w-full max-w-[120px] h-14 md:h-16 rounded-xl bg-slate-800/80 border-2 border-slate-600 flex flex-col items-center justify-center text-white active:bg-[#ff0055] active:border-white transition-colors touch-none"
              >
                <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round" className="w-6 h-6">
                   <path d="M12 4v16m-7-7l7 7 7-7" />
                </svg>
                <span className="text-[10px] font-bold mt-1">DROP</span>
              </button>
            </div>

            {/* Right Controls (Rotate) */}
            <div className="flex gap-2">
               <button 
                 onPointerDown={(e) => { e.preventDefault(); if (gameEngineRef.current) gameEngineRef.current.handleInput('rotate'); }}
                 className="w-16 h-16 md:w-20 md:h-20 rounded-full bg-slate-800/80 border-2 border-[#ff0055] flex items-center justify-center text-[#ff0055] active:bg-[#ff0055] active:text-white transition-colors touch-none shadow-[0_0_15px_rgba(255,0,85,0.4)]"
               >
                 <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" className="w-8 h-8">
                   <path d="M3 12a9 9 0 1 0 9-9 9.75 9.75 0 0 0-6.74 2.74L3 8" />
                   <path d="M3 3v5h5" />
                 </svg>
               </button>
            </div>
        </div>
      )}

      {/* 4) Overlays */}
      {activeScreen === 'pause' && (
        <PauseScreen 
          onResume={handleResume} 
          onRestart={handleRestart} 
          onMainMenu={handleExit} 
          words={words}
          levelId={levelId}
          langId={langId}
          currentGameType="worddrop"
          onMiniQuizCorrect={() => {
            if (gameEngineRef.current) {
              gameEngineRef.current.shields = Math.min(3, (gameEngineRef.current.shields || 0) + 1);
              setShields(gameEngineRef.current.shields);
            }
            setScore(s => s + 50);
          }}
        />
      )}
      {activeScreen === 'gameover' && (
        <GameOverScreen 
          score={score} 
          learnedWords={learnedWords} 
          onRestart={handleRestart} 
          onMainMenu={handleExit} 
          words={words}
          levelId={levelId}
          langId={langId}
          currentGameType="worddrop"
          isAudioEnabled={isAudioEnabled}
        />
      )}
      {activeScreen === 'victory' && (
        <VictoryScreen 
          score={score} 
          learnedWords={learnedWords} 
          onNextLevel={handleNextLevel} 
          onRestart={handleRestart} 
          onMainMenu={handleExit} 
          words={words}
          levelId={levelId}
          langId={langId}
          currentGameType="worddrop"
        />
      )}
      
      </div>
    </div>
  );
}
