"use client";

import React, { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { useLessonLoader } from "../../../hooks/useLessonLoader";
import { useMemolandumStore } from "../../../store/useMemolandumStore";
import { PauseScreen, GameOverScreen, VictoryScreen } from "../shared/GameOverlays";
import { GameHeader } from "../shared/GameHeader";
import { SoundManager } from "../../../engines/soundManager";
import { playWordPronunciation } from "../../../lib/pronunciation";
import { createSessionProgressTracker } from "../../../lib/progress/applySessionProgress";
import {
  isArabicText,
  prepareWordForLetterGame,
  isWordLetter,
  extractWordLetters,
  areLettersEqual,
  ARABIC_ALPHABET,
  formatBiDiPair,
} from "../../../lib/i18n/arabicTextUtils";

const GAME_ID = "word-snake";
const DECK_SIZE = 8;
const GRID_SIZE = 14;
const INITIAL_SPEED = 280; // ms (reduced speed for manageable mobile play)
const FEVER_SPEED = 210; // ms (manageable speed even in fever mode)

function shuffle(arr) {
  const a = [...arr];
  for (let i = a.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [a[i], a[j]] = [a[j], a[i]];
  }
  return a;
}

function pickDeck(words, size) {
  if (!words?.length) return [];
  return shuffle(words).slice(0, Math.min(size, words.length));
}

export default function WordSnake({
  levelId,
  langId,
  onExit,
  onNextLevel,
  isAudioEnabled,
  setIsAudioEnabled,
  isFxEnabled,
  setIsFxEnabled,
}) {
  const { words, isLoading, reload } = useLessonLoader(levelId, langId);
  const recordWordQuizResult = useMemolandumStore((s) => s.recordWordQuizResult);
  const setCurrentGame = useMemolandumStore((s) => s.setCurrentGame);

  // Game UI screens
  const [activeScreen, setActiveScreen] = useState("playing"); // playing, paused, gameover, victory
  const [score, setScore] = useState(0);
  const [shields, setShields] = useState(3);
  const [combo, setCombo] = useState(0);

  // Deck & Current Word
  const [deck, setDeck] = useState([]);
  const [wordIndex, setWordIndex] = useState(0);
  const [currentWordObj, setCurrentWordObj] = useState(null);

  // Snake State
  const [snake, setSnake] = useState([]); // [{x, y}] Head is snake[0]
  const [direction, setDirection] = useState("UP"); // UP, DOWN, LEFT, RIGHT
  const [foods, setFoods] = useState([]); // [{char, x, y, isTarget}]
  const [targetCharIndex, setTargetCharIndex] = useState(0);

  const [locked, setLocked] = useState(false);
  const [feedback, setFeedback] = useState(null); // null | 'correct' | 'wrong'
  const [learnedWords, setLearnedWords] = useState([]); // Array of strings "word: meaning"

  const soundManagerRef = useRef(null);
  const progressTrackerRef = useRef(createSessionProgressTracker(GAME_ID));
  
  const timerRef = useRef(null);
  const gameLoopRef = useRef(null);
  const inputQueueRef = useRef([]); // Command queue for buffering input
  const directionRef = useRef("UP");
  const wordStartTimeRef = useRef(Date.now());

  // Set active game ID
  useEffect(() => {
    setCurrentGame?.(GAME_ID);
  }, [setCurrentGame]);

  // Audio Manager lifecycle
  useEffect(() => {
    soundManagerRef.current = new SoundManager();
    return () => {
      stopGameLoop();
      if (timerRef.current) clearTimeout(timerRef.current);
      soundManagerRef.current?.stop?.();
    };
  }, []);

  // Sync Audio Settings
  useEffect(() => {
    if (soundManagerRef.current) {
      soundManagerRef.current.setMuted(!isFxEnabled);
      soundManagerRef.current.setAudioEnabled(isAudioEnabled);
    }
  }, [isFxEnabled, isAudioEnabled]);

  // Sync state stats
  useEffect(() => {
    if (activeScreen === "playing" && score === 0) {
      progressTrackerRef.current.reset();
    }
  }, [activeScreen, score]);

  useEffect(() => {
    if (activeScreen === "gameover" || activeScreen === "victory") {
      progressTrackerRef.current.commit({ score, gems: Math.floor(score / 300) });
    }
  }, [activeScreen, score]);

  // Safe Haptic Vibration Helper
  const triggerHaptic = useCallback((type) => {
    if (typeof navigator !== "undefined" && "vibrate" in navigator) {
      try {
        if (type === "turn") {
          navigator.vibrate(10);
        } else if (type === "eat") {
          navigator.vibrate([15, 30, 15]);
        } else if (type === "damage") {
          navigator.vibrate([80, 50, 80]);
        }
      } catch (e) {
        // Safe fallback for device blocks
      }
    }
  }, []);

  // Word targets
  const targetWord = useMemo(() => {
    return prepareWordForLetterGame(currentWordObj?.english || currentWordObj?.word || "", langId);
  }, [currentWordObj, langId]);

  const isTargetArabic = useMemo(() => isArabicText(targetWord), [targetWord]);

  const targetMeaning = useMemo(() => {
    return currentWordObj?.turkish || currentWordObj?.meaning || currentWordObj?.translation || "";
  }, [currentWordObj]);

  // Fever Mode detection
  const isFeverMode = useMemo(() => combo >= 3, [combo]);
  const gameSpeed = useMemo(() => (isFeverMode ? FEVER_SPEED : INITIAL_SPEED), [isFeverMode]);

  // Text-to-speech pronunciation
  const playPronunciation = useCallback((wordObj) => {
    if (!isAudioEnabled || !wordObj) return;
    if (soundManagerRef.current) {
      soundManagerRef.current.speakWord(wordObj, { langId });
    } else {
      playWordPronunciation(wordObj, { isAudioEnabled, langId });
    }
  }, [isAudioEnabled, langId]);

  // Spawn foods inside grid
  const spawnFoodItems = useCallback((targetIndex, snakeBody, word) => {
    if (!word) return;

    // Get the next active letter to target
    const cleanWord = extractWordLetters(word).join("");
    if (targetIndex >= cleanWord.length) return;
    const targetChar = cleanWord[targetIndex];
    const wordIsArabic = isArabicText(cleanWord);

    // Helper to get random coord not on snake
    const getRandomCoord = () => {
      let tries = 0;
      while (tries < 100) {
        const x = Math.floor(Math.random() * GRID_SIZE);
        const y = Math.floor(Math.random() * GRID_SIZE);
        const onSnake = snakeBody.some(s => s.x === x && s.y === y);
        if (!onSnake) return { x, y };
        tries++;
      }
      return { x: 0, y: 0 };
    };

    const newFoods = [];

    // 1. Spawn the correct letter
    const targetPos = getRandomCoord();
    newFoods.push({
      char: targetChar,
      x: targetPos.x,
      y: targetPos.y,
      isTarget: true
    });

    // 2. Spawn 3 distractor letters
    const alphabet = wordIsArabic ? ARABIC_ALPHABET : "ABCDEFGHIJKLMNOPQRSTUVWXYZ";
    const distractorsCount = 3;
    const busyCoords = [targetPos];

    for (let i = 0; i < distractorsCount; i++) {
      // Find a random distractor letter (either from word or random)
      let distractorChar = "";
      if (Math.random() > 0.5 && cleanWord.length > 1) {
        // Pick random letter from word that is not current target
        const otherChars = cleanWord.split("").filter(c => !areLettersEqual(c, targetChar));
        distractorChar = otherChars.length > 0 
          ? otherChars[Math.floor(Math.random() * otherChars.length)] 
          : alphabet[Math.floor(Math.random() * alphabet.length)];
      } else {
        const safePool = alphabet.split("").filter(c => !areLettersEqual(c, targetChar));
        distractorChar = safePool[Math.floor(Math.random() * safePool.length)] || alphabet[0];
      }

      // Find coordinate not busy by snake or other food
      let tries = 0;
      let pos = { x: 0, y: 0 };
      while (tries < 100) {
        const testPos = getRandomCoord();
        const busy = busyCoords.some(c => c.x === testPos.x && c.y === testPos.y);
        if (!busy) {
          pos = testPos;
          break;
        }
        tries++;
      }

      busyCoords.push(pos);
      newFoods.push({
        char: distractorChar,
        x: pos.x,
        y: pos.y,
        isTarget: false
      });
    }

    setFoods(newFoods);
  }, []);

  // Initialize a new word
  const initWord = useCallback((wordObj, freshDeck) => {
    if (!wordObj) return;

    // Reset snake in the center of the grid moving up
    const midX = Math.floor(GRID_SIZE / 2);
    const midY = Math.floor(GRID_SIZE / 2) + 1;
    const initialSnake = [
      { x: midX, y: midY - 1 }, // head
      { x: midX, y: midY },     // body
      { x: midX, y: midY + 1 }  // tail
    ];

    setSnake(initialSnake);
    setDirection("UP");
    directionRef.current = "UP";
    inputQueueRef.current = [];
    setTargetCharIndex(0);
    setFeedback(null);
    setLocked(false);
    wordStartTimeRef.current = Date.now();

    const cleanWord = prepareWordForLetterGame(wordObj.english || wordObj.word || "");
    spawnFoodItems(0, initialSnake, cleanWord);
  }, [spawnFoodItems]);

  // Initialize game deck
  const startNewGame = useCallback((wordList) => {
    const newDeck = pickDeck(wordList || words, DECK_SIZE);
    setDeck(newDeck);
    setWordIndex(0);
    setScore(0);
    setShields(3);
    setCombo(0);
    setLearnedWords([]);
    
    if (newDeck.length > 0) {
      setCurrentWordObj(newDeck[0]);
      initWord(newDeck[0], newDeck);
      setActiveScreen("playing");
    } else {
      setCurrentWordObj(null);
    }
  }, [words, initWord]);

  useEffect(() => {
    if (!isLoading && words?.length) {
      startNewGame(words);
    }
  }, [isLoading, words, startNewGame]);

  // Proceed to next word in deck
  const advanceWord = useCallback((fromIndex) => {
    const next = fromIndex + 1;
    if (next >= deck.length) {
      stopGameLoop();
      soundManagerRef.current?.playStageClear?.();
      setActiveScreen("victory");
      return;
    }
    setWordIndex(next);
    setCurrentWordObj(deck[next]);
    initWord(deck[next], deck);
  }, [deck, initWord]);

  // Game Loop Tick Logic
  const tickGame = useCallback(() => {
    if (activeScreen !== "playing" || locked || !currentWordObj) return;

    setSnake(prevSnake => {
      // 1. Get next buffered direction
      let nextDir = directionRef.current;
      if (inputQueueRef.current.length > 0) {
        nextDir = inputQueueRef.current.shift();
        setDirection(nextDir);
        directionRef.current = nextDir;
      }

      // 2. Compute new head position
      const head = prevSnake[0];
      let newHead = { ...head };

      if (nextDir === "UP") newHead.y -= 1;
      else if (nextDir === "DOWN") newHead.y += 1;
      else if (nextDir === "LEFT") newHead.x -= 1;
      else if (nextDir === "RIGHT") newHead.x += 1;

      // 3. Collision: Wall collision
      if (
        newHead.x < 0 ||
        newHead.x >= GRID_SIZE ||
        newHead.y < 0 ||
        newHead.y >= GRID_SIZE
      ) {
        handleCollisionCrash();
        return prevSnake; // Don't move
      }

      // 4. Collision: Tail collision (excluding tail tip if not growing)
      const hitTail = prevSnake.slice(0, -1).some(seg => seg.x === newHead.x && seg.y === newHead.y);
      if (hitTail) {
        handleCollisionCrash();
        return prevSnake;
      }

      // 5. Food Interaction Check
      const foodIndex = foods.findIndex(f => f.x === newHead.x && f.y === newHead.y);
      let grew = false;

      if (foodIndex !== -1) {
        const foodItem = foods[foodIndex];
        const responseTimeSec = Math.max(1, (Date.now() - wordStartTimeRef.current) / 1000);

        if (foodItem.isTarget || areLettersEqual(foodItem.char, extractWordLetters(targetWord)[targetCharIndex] || "")) {
          // Correct Letter Eaten!
          grew = true;
          triggerHaptic("eat");
          soundManagerRef.current?.playCoinCollect?.();

          const cleanWord = extractWordLetters(targetWord).join("");
          const nextIdx = targetCharIndex + 1;

          if (nextIdx >= cleanWord.length) {
            // Word completely solved!
            setLocked(true);
            setFeedback("correct");
            
            const nextCombo = combo + 1;
            setCombo(nextCombo);
            
            // Score calculation: 150 base + combo bonus
            const gained = 150 + Math.min(nextCombo, 8) * 25;
            setScore(s => s + gained);

            const pair = formatBiDiPair(targetWord, targetMeaning, ": ");
            setLearnedWords(prev => prev.includes(pair) ? prev : [...prev, pair]);

            recordWordQuizResult?.(currentWordObj, true, responseTimeSec, {
              language: langId,
              attempts: 1,
              gameId: GAME_ID,
            });

            playPronunciation(currentWordObj);

            timerRef.current = setTimeout(() => {
              advanceWord(wordIndex);
            }, 1200);
          } else {
            // Move to next letter in the word
            setTargetCharIndex(nextIdx);
            setScore(s => s + 20); // Minor correct letter score
            spawnFoodItems(nextIdx, [...prevSnake], targetWord);
          }
        } else {
          // Distractor/Wrong Letter Eaten!
          triggerHaptic("damage");
          soundManagerRef.current?.playDamage?.();
          setCombo(0);

          recordWordQuizResult?.(currentWordObj, false, responseTimeSec, {
            language: langId,
            attempts: 2,
            gameId: GAME_ID,
          });

          // Shrink snake segment as penalty
          grew = false;

          setShields(prev => {
            const nextShields = prev - 1;
            if (nextShields <= 0) {
              stopGameLoop();
              soundManagerRef.current?.playGameOver?.();
              timerRef.current = setTimeout(() => {
                setActiveScreen("gameover");
              }, 800);
            } else {
              // Relocate wrong letter
              spawnFoodItems(targetCharIndex, prevSnake, targetWord);
            }
            return nextShields;
          });
        }
      }

      // 6. Return new snake array
      const newSnake = [newHead, ...prevSnake];
      if (!grew) {
        newSnake.pop(); // Remove tail tip
      }
      return newSnake;
    });
  }, [
    activeScreen,
    locked,
    currentWordObj,
    foods,
    targetWord,
    targetMeaning,
    targetCharIndex,
    combo,
    wordIndex,
    langId,
    recordWordQuizResult,
    playPronunciation,
    advanceWord,
    spawnFoodItems,
    triggerHaptic
  ]);

  // Handle crash into wall or self
  const handleCollisionCrash = () => {
    triggerHaptic("damage");
    soundManagerRef.current?.playDamage?.();
    setCombo(0);

    const responseTimeSec = Math.max(1, (Date.now() - wordStartTimeRef.current) / 1000);
    recordWordQuizResult?.(currentWordObj, false, responseTimeSec, {
      language: langId,
      attempts: 2,
      gameId: GAME_ID,
    });

    setShields(prev => {
      const nextShields = prev - 1;
      if (nextShields <= 0) {
        stopGameLoop();
        soundManagerRef.current?.playGameOver?.();
        timerRef.current = setTimeout(() => {
          setActiveScreen("gameover");
        }, 800);
      } else {
        // Reset current word yılan position
        initWord(currentWordObj, deck);
      }
      return nextShields;
    });
  };

  // Game Loop interval triggers
  const startGameLoop = useCallback(() => {
    stopGameLoop();
    gameLoopRef.current = setInterval(tickGame, gameSpeed);
  }, [tickGame, gameSpeed]);

  const stopGameLoop = () => {
    if (gameLoopRef.current) {
      clearInterval(gameLoopRef.current);
      gameLoopRef.current = null;
    }
  };

  useEffect(() => {
    if (activeScreen === "playing" && !locked) {
      startGameLoop();
    } else {
      stopGameLoop();
    }
    return () => stopGameLoop();
  }, [activeScreen, locked, startGameLoop]);

  // Input direction changes helper
  const queueDirection = useCallback((newDir) => {
    if (locked || activeScreen !== "playing") return;
    
    // Get last queued direction or current direction if queue empty
    const lastDir = inputQueueRef.current.length > 0 
      ? inputQueueRef.current[inputQueueRef.current.length - 1] 
      : directionRef.current;

    // Prevent direct 180 degree turns
    if (newDir === "UP" && lastDir === "DOWN") return;
    if (newDir === "DOWN" && lastDir === "UP") return;
    if (newDir === "LEFT" && lastDir === "RIGHT") return;
    if (newDir === "RIGHT" && lastDir === "LEFT") return;

    // Push direction to buffer
    inputQueueRef.current.push(newDir);
    triggerHaptic("turn");
  }, [locked, activeScreen, triggerHaptic]);

  // Key handlers
  useEffect(() => {
    const handleKeyDown = (e) => {
      if (activeScreen !== "playing" || locked) return;

      if (e.key === "ArrowUp" || e.key === "w" || e.key === "W") {
        queueDirection("UP");
        e.preventDefault();
      } else if (e.key === "ArrowDown" || e.key === "s" || e.key === "S") {
        queueDirection("DOWN");
        e.preventDefault();
      } else if (e.key === "ArrowLeft" || e.key === "a" || e.key === "A") {
        queueDirection("LEFT");
        e.preventDefault();
      } else if (e.key === "ArrowRight" || e.key === "d" || e.key === "D") {
        queueDirection("RIGHT");
        e.preventDefault();
      } else if (e.key === "Escape" || e.key === "p" || e.key === "P") {
        setActiveScreen("paused");
        e.preventDefault();
      }
    };

    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [activeScreen, locked, queueDirection]);

  // Tap-to-Turn Mobile handler
  const handleTouchZone = (side) => {
    if (locked || activeScreen !== "playing") return;

    const currentDir = inputQueueRef.current.length > 0 
      ? inputQueueRef.current[inputQueueRef.current.length - 1] 
      : directionRef.current;

    let nextDir = currentDir;

    if (side === "LEFT") {
      // Turn relative Left (-90 degrees)
      if (currentDir === "UP") nextDir = "LEFT";
      else if (currentDir === "LEFT") nextDir = "DOWN";
      else if (currentDir === "DOWN") nextDir = "RIGHT";
      else if (currentDir === "RIGHT") nextDir = "UP";
    } else {
      // Turn relative Right (+90 degrees)
      if (currentDir === "UP") nextDir = "RIGHT";
      else if (currentDir === "RIGHT") nextDir = "DOWN";
      else if (currentDir === "DOWN") nextDir = "LEFT";
      else if (currentDir === "LEFT") nextDir = "UP";
    }

    queueDirection(nextDir);
  };

  // Restarters & Overlays handlers
  const handleResume = () => {
    setActiveScreen("playing");
  };

  const handleRestart = () => {
    startNewGame(words);
  };

  const handleNextLevel = () => {
    if (onNextLevel) onNextLevel();
  };

  // Compute cell rendering classes
  const getCellClasses = (x, y) => {
    const isHead = snake[0] && snake[0].x === x && snake[0].y === y;
    if (isHead) {
      return isFeverMode 
        ? "bg-fuchsia-500 border border-fuchsia-300 shadow-[0_0_12px_#d946ef] rounded-md scale-105 z-10" 
        : "bg-emerald-400 border border-emerald-300 shadow-[0_0_10px_#34d399] rounded-md scale-105 z-10";
    }

    const isBody = snake.slice(1).some(seg => seg.x === x && seg.y === y);
    if (isBody) {
      return isFeverMode
        ? "bg-fuchsia-600/90 border border-fuchsia-800 rounded-sm scale-[0.9]"
        : "bg-emerald-500/90 border border-emerald-700 rounded-sm scale-[0.9]";
    }

    const foodItem = foods.find(f => f.x === x && f.y === y);
    if (foodItem) {
      return foodItem.isTarget
        ? "bg-emerald-950/40 border-2 border-emerald-500 text-emerald-400 font-black text-sm flex items-center justify-center rounded-full shadow-[0_0_15px_rgba(16,185,129,0.7)] animate-pulse scale-105"
        : "bg-rose-950/20 border-2 border-rose-600/70 text-rose-500 font-bold text-xs flex items-center justify-center rounded-full shadow-[0_0_10px_rgba(239,68,68,0.4)] opacity-85 scale-[0.95]";
    }

    // Default empty cell
    return "bg-slate-950/40 border border-slate-900/30 flex items-center justify-center text-[5px] text-slate-800";
  };

  if (isLoading) {
    return (
      <div className="w-full h-full flex items-center justify-center bg-[#06030c]">
        <div className="text-[#00f0ff] text-2xl font-black animate-pulse font-mono tracking-widest drop-shadow-[0_0_10px_#00f0ff]">
          LOADING PROTOCOL #10...
        </div>
      </div>
    );
  }

  // Generate 14x14 grid array
  const gridCells = [];
  for (let y = 0; y < GRID_SIZE; y++) {
    for (let x = 0; x < GRID_SIZE; x++) {
      gridCells.push({ x, y });
    }
  }

  // Find next target char
  const cleanWord = extractWordLetters(targetWord).join("");
  const currentTargetChar = targetCharIndex < cleanWord.length ? cleanWord[targetCharIndex] : "";

  return (
    <div className="w-full h-full bg-[#030106] flex justify-center items-center">
      <div className="w-full max-w-[600px] h-full relative bg-[#06030c] flex flex-col overflow-hidden font-sans select-none border-x border-slate-800/40 shadow-[0_0_50px_rgba(0,0,0,0.85)]">
        
        {/* 1) HUD Bar */}
        <GameHeader>
          <GameHeader.Left>
            <GameHeader.Shields max={3} current={shields} />
            <GameHeader.Stage value={wordIndex} max={deck.length} label="WORDS" icon="🐍" />
          </GameHeader.Left>

          <GameHeader.Right>
            <GameHeader.Score value={score} />
            <GameHeader.Controls 
              isFxEnabled={isFxEnabled}
              onFxToggle={() => setIsFxEnabled(!isFxEnabled)}
              isAudioEnabled={isAudioEnabled}
              onAudioToggle={() => setIsAudioEnabled(!isAudioEnabled)}
              onPause={() => {
                setActiveScreen("paused");
              }}
            />
          </GameHeader.Right>
        </GameHeader>

        {/* 2) Main Screen */}
        <div className="flex-1 w-full flex flex-col justify-start gap-3 p-4 overflow-y-auto min-h-0 bg-[#06030c] shadow-[inset_0_0_80px_rgba(0,0,0,0.9)] scrollbar-thin">
          
          {/* Top Panel: Hint Box & Fever indicators */}
          <div className="w-full flex flex-col gap-2 mt-1">
            <div className="bg-slate-950/60 border border-slate-850 p-3 rounded-2xl shadow-md text-center relative overflow-hidden">
              <span className="text-[8px] font-mono text-gray-500 uppercase tracking-widest absolute top-1.5 end-3">İPUCU (HINT)</span>
              <p dir="auto" className="text-gray-300 italic text-sm font-medium mt-1.5 leading-relaxed whitespace-normal break-words">
                "{targetMeaning}"
              </p>
              {currentWordObj?.romanized && (
                <p className="text-[10px] font-mono text-cyan-400 mt-1">
                  [{currentWordObj.romanized}]
                </p>
              )}
            </div>

            {/* Word Slots & Next Letter Hint */}
            <div className="flex items-center justify-between bg-slate-950/20 px-4 py-2 border border-slate-900 rounded-xl">
              <div
                dir={isTargetArabic ? "rtl" : "ltr"}
                className="flex flex-wrap gap-1 items-center max-w-[70%]"
              >
                {targetWord.split("").map((char, index) => {
                  const isLetter = isWordLetter(char);
                  // Find index of this letter in the cleaned alphanumeric word
                  const cleanedPrefix = extractWordLetters(targetWord.substring(0, index)).join("");
                  const letterIdx = cleanedPrefix.length;
                  const isRevealed = !isLetter || letterIdx < targetCharIndex;
                  
                  return (
                    <span
                      key={index}
                      className={`text-sm sm:text-base font-black px-1.5 py-0.5 rounded ${
                        !isLetter
                          ? "text-gray-500"
                          : isRevealed
                          ? feedback === "correct"
                            ? "text-emerald-400 bg-emerald-950/30 animate-bounce"
                            : "text-white bg-slate-900/60"
                          : "text-slate-800 bg-slate-950 border-b border-slate-850"
                      }`}
                    >
                      {isRevealed ? char : "_"}
                    </span>
                  );
                })}
              </div>

              {/* Targets info */}
              <div className="text-end">
                <span className="text-[8px] font-mono text-emerald-400 uppercase tracking-wider block">SIRADAKİ YEM (TARGET)</span>
                <span className={`text-base font-black tracking-widest uppercase inline-block px-2.5 py-0.5 rounded-full ${
                  isFeverMode 
                    ? "bg-fuchsia-950/50 text-fuchsia-400 border border-fuchsia-500/50 shadow-[0_0_10px_rgba(217,70,239,0.3)] animate-pulse" 
                    : "bg-emerald-950/50 text-emerald-400 border border-emerald-500/30"
                }`}>
                  {currentTargetChar}
                </span>
              </div>
            </div>
          </div>

          {/* 3) Snake Grid Area */}
          <div className="w-full flex items-center justify-center py-2 relative">
            <div 
              style={{
                display: "grid",
                gridTemplateColumns: `repeat(${GRID_SIZE}, minmax(0, 1fr))`,
                gridTemplateRows: `repeat(${GRID_SIZE}, minmax(0, 1fr))`,
              }}
              className={`w-full aspect-square max-w-[340px] gap-0.5 bg-slate-950 p-1 border-2 rounded-2xl shadow-[0_0_20px_rgba(0,0,0,0.8)] transition-colors duration-500 ${
                isFeverMode 
                  ? "border-fuchsia-500/40 shadow-[0_0_25px_rgba(217,70,239,0.15)]" 
                  : "border-slate-850"
              }`}
            >
              {gridCells.map((cell) => {
                const cellClass = getCellClasses(cell.x, cell.y);
                const foodItem = foods.find(f => f.x === cell.x && f.y === cell.y);
                
                return (
                  <div
                    key={`${cell.x}-${cell.y}`}
                    className={`aspect-square transition-all duration-150 ${cellClass}`}
                  >
                    {foodItem ? foodItem.char : ""}
                  </div>
                );
              })}
            </div>

            {/* Fever Mode banner */}
            {isFeverMode && (
              <div className="absolute top-4 left-1/2 -translate-x-1/2 bg-fuchsia-600 border border-fuchsia-300 text-slate-950 text-[9px] font-black tracking-[0.25em] px-3 py-1 rounded-full uppercase shadow-[0_0_15px_#d946ef] animate-bounce">
                FEVER MODE x2
              </div>
            )}
          </div>

          {/* 4) Mobile D-Pad Controllers */}
          <div className="w-full py-1 text-center select-none">
            <div className="text-[10px] text-slate-500 font-mono tracking-wider">
              <span className="hidden sm:inline">Yönlendirmek için YÖN / WASD tuşlarını veya aşağıdaki D-Pad'i kullanın.</span>
              <span className="sm:hidden">Yönlendirmek için aşağıdaki D-Pad'i kullanın.</span>
            </div>
          </div>

          {/* Retro tactile 3x3 D-Pad */}
          <div className="w-full flex justify-center pb-2 select-none">
            <div 
              style={{
                display: "grid",
                gridTemplateColumns: "repeat(3, 1fr)",
                gridTemplateRows: "repeat(3, 1fr)",
              }}
              className="gap-1.5 w-44 aspect-square max-w-[170px]"
            >
              {/* Row 1 */}
              <div></div>
              <button
                onPointerDown={() => queueDirection("UP")}
                className="w-full h-full rounded-2xl bg-slate-900 border-2 border-slate-800 active:bg-cyan-500/25 active:border-cyan-400 text-white flex items-center justify-center shadow-lg touch-none select-none transition-all"
              >
                <svg xmlns="http://www.w3.org/2000/svg" className="h-7 w-7 text-cyan-400" viewBox="0 0 20 20" fill="currentColor">
                  <path fillRule="evenodd" d="M14.707 12.707a1 1 0 01-1.414 0L10 9.414l-3.293 3.293a1 1 0 01-1.414-1.414l4-4a1 1 0 011.414 0l4 4a1 1 0 010 1.414z" clipRule="evenodd" />
                </svg>
              </button>
              <div></div>

              {/* Row 2 */}
              <button
                onPointerDown={() => queueDirection("LEFT")}
                className="w-full h-full rounded-2xl bg-slate-900 border-2 border-slate-800 active:bg-cyan-500/25 active:border-cyan-400 text-white flex items-center justify-center shadow-lg touch-none select-none transition-all"
              >
                <svg xmlns="http://www.w3.org/2000/svg" className="h-7 w-7 text-cyan-400" viewBox="0 0 20 20" fill="currentColor">
                  <path fillRule="evenodd" d="M12.707 5.293a1 1 0 010 1.414L9.414 10l3.293 3.293a1 1 0 01-1.414 1.414l-4-4a1 1 0 010-1.414l4-4a1 1 0 011.414 0z" clipRule="evenodd" />
                </svg>
              </button>
              <div className="flex items-center justify-center text-slate-800 text-base bg-slate-950/40 rounded-xl border border-slate-900/60 shadow-[inset_0_0_8px_rgba(0,0,0,0.5)]">
                🎮
              </div>
              <button
                onPointerDown={() => queueDirection("RIGHT")}
                className="w-full h-full rounded-2xl bg-slate-900 border-2 border-slate-800 active:bg-cyan-500/25 active:border-cyan-400 text-white flex items-center justify-center shadow-lg touch-none select-none transition-all"
              >
                <svg xmlns="http://www.w3.org/2000/svg" className="h-7 w-7 text-cyan-400" viewBox="0 0 20 20" fill="currentColor">
                  <path fillRule="evenodd" d="M7.293 14.707a1 1 0 010-1.414L10.586 10 7.293 6.707a1 1 0 011.414-1.414l4 4a1 1 0 010 1.414l-4 4a1 1 0 01-1.414 0z" clipRule="evenodd" />
                </svg>
              </button>

              {/* Row 3 */}
              <div></div>
              <button
                onPointerDown={() => queueDirection("DOWN")}
                className="w-full h-full rounded-2xl bg-slate-900 border-2 border-slate-800 active:bg-cyan-500/25 active:border-cyan-400 text-white flex items-center justify-center shadow-lg touch-none select-none transition-all"
              >
                <svg xmlns="http://www.w3.org/2000/svg" className="h-7 w-7 text-cyan-400" viewBox="0 0 20 20" fill="currentColor">
                  <path fillRule="evenodd" d="M5.293 7.293a1 1 0 011.414 0L10 10.586l3.293-3.293a1 1 0 111.414 1.414l-4 4a1 1 0 01-1.414 0l-4-4a1 1 0 010-1.414z" clipRule="evenodd" />
                </svg>
              </button>
              <div></div>
            </div>
          </div>
        </div>

        {/* 3) Overlays */}
        {activeScreen === "paused" && (
          <PauseScreen 
            score={score}
            onResume={handleResume} 
            onRestart={handleRestart} 
            onMainMenu={onExit} 
            isAudioEnabled={isAudioEnabled}
            setIsAudioEnabled={setIsAudioEnabled}
            isFxEnabled={isFxEnabled}
            setIsFxEnabled={setIsFxEnabled}
            words={deck}
            levelId={levelId}
            langId={langId}
            currentGameType={GAME_ID}
            onMiniQuizCorrect={() => {
              setShields(s => Math.min(3, s + 1));
              setScore(s => s + 50);
            }}
          />
        )}
        
        {activeScreen === "gameover" && (
          <GameOverScreen 
            score={score} 
            onRestart={handleRestart} 
            onMainMenu={onExit} 
            words={deck}
            levelId={levelId}
            langId={langId}
            currentGameType={GAME_ID}
            isAudioEnabled={isAudioEnabled}
          >
            <div className="flex flex-col items-center w-full bg-slate-950/60 p-4 rounded-2xl border border-red-500/30 max-h-48 overflow-y-auto">
              <h3 className="text-red-400 mb-3 text-xs tracking-widest font-mono uppercase">
                TOPLANAN KELİMELER
              </h3>
              {learnedWords.length > 0 ? (
                <ul className="flex flex-wrap gap-2 justify-center">
                  {learnedWords.map((wordPair, idx) => (
                    <li
                      key={idx}
                      className="text-red-400 bg-red-950/30 px-3 py-1 rounded-full border border-red-550/40 text-xs font-mono font-bold"
                    >
                      {wordPair}
                    </li>
                  ))}
                </ul>
              ) : (
                <div className="text-gray-500 font-mono text-[10px]">HİÇ KELİME BİLİNEMEDİ</div>
              )}
            </div>
          </GameOverScreen>
        )}

        {activeScreen === "victory" && (
          <VictoryScreen 
            score={score} 
            onNextLevel={handleNextLevel} 
            onMainMenu={onExit} 
            words={deck}
            levelId={levelId}
            langId={langId}
            currentGameType={GAME_ID}
          >
            <div className="flex flex-col items-center w-full bg-slate-950/60 p-4 rounded-2xl border border-emerald-500/30 max-h-48 overflow-y-auto">
              <h3 className="text-emerald-400 mb-3 text-xs tracking-widest font-mono uppercase">
                USTALAŞILAN KELİMELER
              </h3>
              {learnedWords.length > 0 ? (
                <ul className="flex flex-wrap gap-2 justify-center">
                  {learnedWords.map((wordPair, idx) => (
                    <li
                      key={idx}
                      className="text-emerald-400 bg-emerald-950/30 px-3 py-1 rounded-full border border-emerald-550/40 text-xs font-mono font-bold"
                    >
                      {wordPair}
                    </li>
                  ))}
                </ul>
              ) : (
                <div className="text-gray-500 font-mono text-[10px]">HİÇ KELİME BİLİNEMEDİ</div>
              )}
            </div>
          </VictoryScreen>
        )}

      </div>
    </div>
  );
}
