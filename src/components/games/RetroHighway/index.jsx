import React, { useEffect, useRef, useState, useCallback } from 'react';
import { useLessonLoader } from '../../../hooks/useLessonLoader';
import { PauseScreen, GameOverScreen, VictoryScreen } from '../shared/GameOverlays';
import { GameHeader } from '../shared/GameHeader';
import { HighwayGame } from './engineCore';
import { useMemolandumStore } from '../../../store/useMemolandumStore';
import { saveWordToCloud } from '../../../lib/firebase/authService';
import { auth } from '../../../lib/firebase/config';
import { createSessionProgressTracker } from '../../../lib/progress/applySessionProgress';

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
  const progressTrackerRef = useRef(createSessionProgressTracker('highway'));

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
    
    // Cleanup old engine if exists
    if (gameEngineRef.current) {
       cancelAnimationFrame(requestRef.current);
    }

    const ctx = canvasRef.current.getContext('2d');
    
    // Create new engine instance
    const engine = new HighwayGame(canvasRef.current, ctx, words, {
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
        setActiveScreen(stateData.state);
        setShields(stateData.shields);
        setLearnedCount(stateData.processedCount);
        setTotalWords(stateData.totalWords);

        // On victory, save learned words to Vocabulary Vault
        if (stateData.state === 'victory' && stateData.learnedWords?.length > 0) {
          const { addLearnedWords } = useMemolandumStore.getState();
          addLearnedWords(stateData.learnedWords, langId);
          const uid = auth.currentUser?.uid;
          if (uid) {
            stateData.learnedWords.forEach(w => {
              const id = w.id || w.word_id;
              if (id) saveWordToCloud(uid, id, { id, english: w.english || w.word || '', turkish: w.turkish || w.translation || '', audioUrl: w.audioUrl || '', language: langId, strength: 1, lastSeen: Date.now() });
            });
          }
        }
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
      <GameHeader>
        <GameHeader.Left>
          <GameHeader.Shields max={3} current={shields} />
          <GameHeader.Stage value={learnedCount} max={totalWords || 12} label="LEARNED" icon="🧠" />
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
                    gameEngineRef.current.soundManager.warmUp();
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
                  onPointerDown={(e) => { e.preventDefault(); gameEngineRef.current?.soundManager.warmUp(); gameEngineRef.current?.handleInput('left', true); }}
                  onContextMenu={(e) => e.preventDefault()}
                  className="w-14 h-14 bg-[#0a0a0fcc] border-2 border-[#00f3ff] rounded-full flex items-center justify-center text-[#00f3ff] text-2xl shadow-[0_0_15px_rgba(0,243,255,0.4)] active:bg-[#00f3ff50] active:scale-95 transition-all touch-none select-none"
                >
                  ◀
                </button>
                <button 
                  onPointerDown={(e) => { e.preventDefault(); gameEngineRef.current?.soundManager.warmUp(); gameEngineRef.current?.handleInput('right', true); }}
                  onContextMenu={(e) => e.preventDefault()}
                  className="w-14 h-14 bg-[#0a0a0fcc] border-2 border-[#00f3ff] rounded-full flex items-center justify-center text-[#00f3ff] text-2xl shadow-[0_0_15px_rgba(0,243,255,0.4)] active:bg-[#00f3ff50] active:scale-95 transition-all touch-none select-none"
                >
                  ▶
                </button>
              </div>

              {/* Speed Controls (Right) */}
              <div className="flex gap-2 pointer-events-auto">
                <button 
                  onPointerDown={(e) => { e.preventDefault(); gameEngineRef.current?.soundManager.warmUp(); gameEngineRef.current?.handleInput('down', true); }}
                  onPointerUp={(e) => { e.preventDefault(); gameEngineRef.current?.handleInput('down', false); }}
                  onPointerLeave={(e) => { e.preventDefault(); gameEngineRef.current?.handleInput('down', false); }}
                  onContextMenu={(e) => e.preventDefault()}
                  className="w-14 h-14 bg-[#0a0a0fcc] border-2 border-[#ffaa00] rounded-full flex items-center justify-center text-[#ffaa00] text-2xl shadow-[0_0_15px_rgba(255,170,0,0.4)] active:bg-[#ffaa0050] active:scale-95 transition-all touch-none select-none"
                >
                  ⏬
                </button>
                <button 
                  onPointerDown={(e) => { e.preventDefault(); gameEngineRef.current?.soundManager.warmUp(); gameEngineRef.current?.handleInput('up', true); }}
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
          words={words}
          levelId={levelId}
          langId={langId}
          currentGameType="highway"
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
          onRestart={handleRestart} 
          onMainMenu={handleExit} 
          words={words}
          levelId={levelId}
          langId={langId}
          currentGameType="highway"
          isAudioEnabled={isAudioEnabled}
        />
      )}
      {activeScreen === 'victory' && (
        <VictoryScreen 
          score={score} 
          learnedCount={learnedCount}
          onNextLevel={handleNextLevel}
          onRestart={handleRestart} 
          onMainMenu={handleExit} 
          words={words}
          levelId={levelId}
          langId={langId}
          currentGameType="highway"
        />
      )}
      </div>
    </div>
  );
}
