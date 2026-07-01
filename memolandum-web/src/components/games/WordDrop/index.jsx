import React, { useEffect, useRef, useState, useCallback } from 'react';
import { useScoreSync } from '../../../hooks/useScoreSync';
import { useLessonLoader } from '../../../hooks/useLessonLoader';
import { PauseScreen, GameOverScreen, VictoryScreen } from '../shared/GameOverlays';
import { WordDropGame } from './engineCore';

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
  const { addScore, syncToFirebase } = useScoreSync('word_drop');
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
        if (addScore) addScore(finalScore);
      },
      onVictory: (finalScore, learned) => {
        setScore(finalScore);
        setLearnedWords(learned);
        setActiveScreen('victory');
        if (addScore) addScore(finalScore);
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
  }, [words, addScore]);

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
    if (syncToFirebase) {
      await syncToFirebase(score);
    }
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
      
      {/* 1) HUD */}
      <div className="w-full h-auto bg-[#05020a] flex flex-row items-center justify-between p-2 md:p-4 shrink-0 z-50 shadow-[0_4px_20px_rgba(255,0,85,0.2)]">
        <div className="flex flex-col gap-1 min-w-0 flex-1">
          <div className="text-white text-xs md:text-xl font-black italic tracking-wider flex items-center gap-1 md:gap-2 drop-shadow-[0_0_5px_#ffffff] truncate">
            <span className="text-[#ff0055] animate-pulse">▼</span>
            REVERSE DROP
          </div>
          
          <div className="flex flex-row items-center gap-3 md:gap-6 text-xs md:text-sm font-bold">
            <div className="flex flex-col">
              <span className="text-slate-400 text-[10px] md:text-xs tracking-wider">LEVEL</span>
              <span className="text-white text-sm md:text-lg drop-shadow-[0_0_8px_#ffffff]">{levelText}</span>
            </div>
            
            <div className="w-px h-6 bg-slate-700/50"></div>
            
            <div className="flex flex-col">
              <span className="text-slate-400 text-[10px] md:text-xs tracking-wider">CLEARED</span>
              <span className="text-[#39ff14] text-sm md:text-lg drop-shadow-[0_0_8px_#39ff14]">{learnedCount}/{totalWords}</span>
            </div>
            
            <div className="w-px h-6 bg-slate-700/50"></div>
            
            <div className="flex flex-col">
              <span className="text-slate-400 text-[10px] md:text-xs tracking-wider">SCORE</span>
              <span className="text-[#ffea00] text-sm md:text-lg drop-shadow-[0_0_8px_#ffea00]">{score}</span>
            </div>
          </div>
        </div>

        <div className="flex flex-row items-center gap-2 md:gap-4 shrink-0">
          <div className="flex flex-col items-end gap-1">
             <span className="hidden sm:block text-slate-400 text-[10px] md:text-xs tracking-wider font-bold">SHIELDS</span>
             <div className="flex flex-row gap-1">
               {[...Array(3)].map((_, i) => (
                 <div 
                   key={i}
                   className={`w-4 h-4 md:w-6 md:h-6 rotate-45 border-2 transition-all duration-300 ${
                     i < shields 
                     ? 'bg-[#ff0055] border-white shadow-[0_0_10px_#ff0055]' 
                     : 'bg-transparent border-slate-700'
                   }`}
                 />
               ))}
             </div>
          </div>
          
          <button 
            onClick={() => {
              if (activeScreen === 'playing') {
                setActiveScreen('pause');
                if (gameEngineRef.current) gameEngineRef.current.state = 'paused';
              }
            }}
            className="ml-1 md:ml-2 w-9 h-9 md:w-12 md:h-12 shrink-0 bg-slate-800/80 hover:bg-[#ff0055] text-white hover:text-black border-2 border-slate-600 hover:border-white rounded-lg flex items-center justify-center transition-all duration-200 shadow-lg cursor-pointer z-50 active:scale-95"
          >
            <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4 md:h-6 md:w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={3}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M10 9v6m4-6v6m7-3a9 9 0 11-18 0 9 9 0 0118 0z" />
            </svg>
          </button>
        </div>
      </div>

      {/* 2) Canvas Container */}
      <div 
        ref={containerRef} 
        className="flex-1 w-full relative bg-[#06030c] shadow-[inset_0_0_100px_rgba(0,0,0,0.9)] touch-none"
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
        <PauseScreen onResume={handleResume} onRestart={handleRestart} onMainMenu={handleExit} />
      )}
      {activeScreen === 'gameover' && (
        <GameOverScreen score={score} learnedWords={learnedWords} onRestart={handleRestart} onMainMenu={handleExit} />
      )}
      {activeScreen === 'victory' && (
        <VictoryScreen score={score} learnedWords={learnedWords} onNextLevel={handleNextLevel} onRestart={handleRestart} onMainMenu={handleExit} />
      )}
      
      </div>
    </div>
  );
}
