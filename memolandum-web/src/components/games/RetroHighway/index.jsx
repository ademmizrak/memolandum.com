import React, { useEffect, useRef, useState, useCallback } from 'react';
import { useScoreSync } from '../../../hooks/useScoreSync';
import { useLessonLoader } from '../../../hooks/useLessonLoader';
import { PauseScreen, GameOverScreen, VictoryScreen } from '../shared/GameOverlays';
import { HighwayGame } from './engineCore';

// Highway Survivor (Shell #4) - Canvas Integration
export default function RetroHighway({ 
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
  const { addScore, syncToFirebase } = useScoreSync('highway');
  const { words, isLoading } = useLessonLoader(levelId, langId);

  // UI State
  const [activeScreen, setActiveScreen] = useState('playing'); // playing, pause, gameover, victory
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

  const initGame = useCallback(() => {
    if (!canvasRef.current || !words || words.length === 0) return;
    
    // Cleanup old engine if exists
    if (gameEngineRef.current) {
       cancelAnimationFrame(requestRef.current);
    }

    const ctx = canvasRef.current.getContext('2d');
    
    // Create new engine instance
    const engine = new HighwayGame(canvasRef.current, ctx, words, {
      onScore: (points) => {
        setScore(s => s + points);
        if (addScore) addScore(points);
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
        setActiveScreen(stateData.state); // 'playing', 'paused', 'gameover', 'victory'
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
  }, [words, addScore]);

  useEffect(() => {
    if (!isLoading && words && words.length > 0) {
      const cleanup = initGame();
      return cleanup;
    }
  }, [isLoading, words, initGame]);

  // Keyboard Binding (Bridging React to Canvas Engine)
  useEffect(() => {
    const handleKeyDown = (e) => {
      if (!gameEngineRef.current || gameEngineRef.current.state !== 'playing') return;
      if (e.key === 'ArrowLeft') gameEngineRef.current.handleInput('left', true);
      else if (e.key === 'ArrowRight') gameEngineRef.current.handleInput('right', true);
      else if (e.key === 'ArrowUp') gameEngineRef.current.handleInput('up', true);
      else if (e.key === 'ArrowDown' || e.key === ' ') gameEngineRef.current.handleInput('down', true);
      else if (e.key === 'Escape' || e.key === 'p' || e.key === 'P') {
        setActiveScreen('pause');
        gameEngineRef.current.state = 'paused';
      }
    };
    
    const handleKeyUp = (e) => {
      if (!gameEngineRef.current) return;
      if (e.key === 'ArrowLeft') gameEngineRef.current.handleInput('left', false);
      else if (e.key === 'ArrowRight') gameEngineRef.current.handleInput('right', false);
      else if (e.key === 'ArrowUp') gameEngineRef.current.handleInput('up', false);
      else if (e.key === 'ArrowDown' || e.key === ' ') gameEngineRef.current.handleInput('down', false);
    };

    window.addEventListener('keydown', handleKeyDown);
    window.addEventListener('keyup', handleKeyUp);
    return () => {
      window.removeEventListener('keydown', handleKeyDown);
      window.removeEventListener('keyup', handleKeyUp);
    };
  }, []);

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
    if (syncToFirebase) {
      await syncToFirebase(score);
    }
    if (onExit) onExit();
  };

  if (isLoading) {
    return (
      <div className="w-full h-full flex items-center justify-center bg-[#0a0a0f]">
        <div className="text-cyan-400 text-2xl font-black animate-pulse font-mono tracking-widest drop-shadow-[0_0_10px_#00f3ff]">
          LOADING SHELL #4...
        </div>
      </div>
    );
  }

  return (
    <div className="w-full h-full bg-[#050508] flex justify-center items-center">
      <div className="w-full max-w-[600px] h-full relative bg-[#0a0a0f] flex flex-col overflow-hidden font-sans select-none border-x-2 border-slate-800/50 shadow-[0_0_50px_rgba(255,0,127,0.1)]">
      
      {/* 1) HUD (Universal Top Header) */}
      <div className="w-full h-auto bg-[#050508] border-b-2 border-[#ff007f] flex flex-row items-center justify-between p-2 md:p-4 shrink-0 z-50 shadow-[0_4px_20px_rgba(255,0,127,0.2)]">
        
        {/* Left Side: Title & Stats */}
        <div className="flex items-center gap-4 md:gap-8 overflow-x-auto no-scrollbar">
          
          <h1 className="text-xl md:text-3xl font-black text-transparent bg-clip-text bg-gradient-to-r from-[#00f3ff] to-[#ff007f] tracking-wider italic uppercase shrink-0">
            HIGHWAY
          </h1>

          <div className="flex items-center gap-3 md:gap-6">
            {/* Score */}
            <div className="bg-[#110515] rounded-lg px-3 py-1 border border-[#ff007f40] shadow-[0_0_10px_rgba(255,0,127,0.1)] flex items-center gap-2 shrink-0">
              <span className="text-[10px] md:text-xs text-[#ff007f] font-bold uppercase tracking-widest">Score:</span>
              <span className="text-lg md:text-2xl font-black text-white drop-shadow-[0_0_8px_#ff007f] leading-none">
                {score.toLocaleString()}
              </span>
            </div>

            {/* Progress */}
            <div className="bg-[#051515] rounded-lg px-3 py-1 border border-[#00f3ff40] shadow-[0_0_10px_rgba(0,243,255,0.1)] flex items-center gap-2 shrink-0">
              <span className="text-[10px] md:text-xs text-[#00f3ff] font-bold uppercase tracking-widest">Learned:</span>
              <span className="text-lg md:text-2xl font-black text-white drop-shadow-[0_0_8px_#00f3ff] leading-none">
                {learnedCount} <span className="text-sm md:text-base text-gray-500">/ {totalWords || 12}</span>
              </span>
            </div>

            {/* Shields */}
            <div className="bg-[#150505] rounded-lg px-3 py-1 border border-[#ff000040] flex items-center gap-2 shrink-0">
              <div className="flex gap-1">
                 {[0,1,2].map(i => (
                    <div key={i} className={`w-4 h-4 md:w-5 md:h-5 rounded ${i < shields ? 'bg-[#39ff14] shadow-[0_0_8px_#39ff14]' : 'bg-[#333333]'} border border-white/20 transition-all duration-300`}></div>
                 ))}
              </div>
            </div>
          </div>

        </div>

        {/* Right Side: Pause Button */}
        <button 
          onClick={() => {
            setActiveScreen('pause');
            if (gameEngineRef.current) gameEngineRef.current.state = 'paused';
          }}
          className="p-1 md:p-2 ml-2 rounded bg-[#00f3ff20] hover:bg-[#00f3ff40] border border-[#00f3ff] transition-all flex items-center justify-center shrink-0"
        >
          <span className="text-xl md:text-2xl text-[#00f3ff]">⏸</span>
        </button>
      </div>

      {/* 2) Game Area (Centered Arcade Cabinet Style) */}
      <div className="flex-1 relative w-full h-full overflow-hidden flex justify-center items-center bg-[#050508] bg-[radial-gradient(circle_at_center,_var(--tw-gradient-stops))] from-[#1a0525] to-[#050508]">
        
        {/* Arcade Screen Boundaries */}
        <div ref={containerRef} className="relative h-full w-full max-w-[600px] shadow-[0_0_50px_rgba(0,243,255,0.1)] border-x border-[#00f3ff20] bg-[#0a0a0f]">
          <canvas 
            ref={canvasRef} 
            className="block w-full h-full touch-none"
            onPointerDown={(e) => {
               if (gameEngineRef.current && activeScreen === 'playing') {
                  const rect = canvasRef.current.getBoundingClientRect();
                  const x = (e.clientX - rect.left) / gameEngineRef.current.scaleX;
                  const lane = Math.floor(x / 150);
                  if (lane >= 0 && lane <= 3) {
                    gameEngineRef.current.player.lane = lane;
                    gameEngineRef.current.soundManager.playGemTick();
                  }
               }
            }}
          />

          {/* On-Screen Touch Controls */}
          {activeScreen === 'playing' && (
            <div className="absolute bottom-6 left-0 w-full px-4 flex justify-between items-end pointer-events-none z-50">
              
              {/* Steering Controls (Left) */}
              <div className="flex gap-2 pointer-events-auto">
                <button 
                  onPointerDown={(e) => { e.preventDefault(); gameEngineRef.current?.handleInput('left', true); }}
                  onContextMenu={(e) => e.preventDefault()}
                  className="w-14 h-14 bg-[#0a0a0fcc] border-2 border-[#00f3ff] rounded-full flex items-center justify-center text-[#00f3ff] text-2xl shadow-[0_0_15px_rgba(0,243,255,0.4)] active:bg-[#00f3ff50] active:scale-95 transition-all touch-none select-none"
                >
                  ◀
                </button>
                <button 
                  onPointerDown={(e) => { e.preventDefault(); gameEngineRef.current?.handleInput('right', true); }}
                  onContextMenu={(e) => e.preventDefault()}
                  className="w-14 h-14 bg-[#0a0a0fcc] border-2 border-[#00f3ff] rounded-full flex items-center justify-center text-[#00f3ff] text-2xl shadow-[0_0_15px_rgba(0,243,255,0.4)] active:bg-[#00f3ff50] active:scale-95 transition-all touch-none select-none"
                >
                  ▶
                </button>
              </div>

              {/* Speed Controls (Right) */}
              <div className="flex gap-2 pointer-events-auto">
                <button 
                  onPointerDown={(e) => { e.preventDefault(); gameEngineRef.current?.handleInput('down', true); }}
                  onPointerUp={(e) => { e.preventDefault(); gameEngineRef.current?.handleInput('down', false); }}
                  onPointerLeave={(e) => { e.preventDefault(); gameEngineRef.current?.handleInput('down', false); }}
                  onContextMenu={(e) => e.preventDefault()}
                  className="w-14 h-14 bg-[#0a0a0fcc] border-2 border-[#ffaa00] rounded-full flex items-center justify-center text-[#ffaa00] text-2xl shadow-[0_0_15px_rgba(255,170,0,0.4)] active:bg-[#ffaa0050] active:scale-95 transition-all touch-none select-none"
                >
                  ⏬
                </button>
                <button 
                  onPointerDown={(e) => { e.preventDefault(); gameEngineRef.current?.handleInput('up', true); }}
                  onPointerUp={(e) => { e.preventDefault(); gameEngineRef.current?.handleInput('up', false); }}
                  onPointerLeave={(e) => { e.preventDefault(); gameEngineRef.current?.handleInput('up', false); }}
                  onContextMenu={(e) => e.preventDefault()}
                  className="w-14 h-14 bg-[#0a0a0fcc] border-2 border-[#ff007f] rounded-full flex items-center justify-center text-[#ff007f] text-2xl shadow-[0_0_15px_rgba(255,0,127,0.4)] active:bg-[#ff007f50] active:scale-95 transition-all touch-none select-none"
                >
                  ⏫
                </button>
              </div>

            </div>
          )}
        </div>

      </div>

      {/* 3) Overlay Screens */}
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
        <GameOverScreen score={score} onRestart={handleRestart} onMainMenu={handleExit} />
      )}
      {activeScreen === 'victory' && (
        <VictoryScreen 
          score={score} 
          learnedCount={learnedCount}
          onNextLevel={handleNextLevel}
          onRestart={handleRestart} 
          onMainMenu={handleExit} 
        />
      )}
      </div>
    </div>
  );
}
