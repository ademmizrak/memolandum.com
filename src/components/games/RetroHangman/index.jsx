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
  areLettersEqual,
  ARABIC_KEYBOARD_ROWS,
  formatBiDiPair,
} from "../../../lib/i18n/arabicTextUtils";

const GAME_ID = "hangman";
const DECK_SIZE = 8;
const MAX_WRONG = 6;

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

export default function RetroHangman({
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

  const [activeScreen, setActiveScreen] = useState("playing"); // playing, paused, gameover, victory
  const [score, setScore] = useState(0);
  const [shields, setShields] = useState(3);
  const [combo, setCombo] = useState(0);
  
  const [deck, setDeck] = useState([]);
  const [wordIndex, setWordIndex] = useState(0);
  const [currentWordObj, setCurrentWordObj] = useState(null);
  
  const [guessedLetters, setGuessedLetters] = useState(new Set());
  const [wrongAttempts, setWrongAttempts] = useState(0);
  const [locked, setLocked] = useState(false);
  const [feedback, setFeedback] = useState(null); // null | 'correct' | 'wrong'
  const [revealCorrectWord, setRevealCorrectWord] = useState(false);
  const [learnedWords, setLearnedWords] = useState([]); // Array of strings e.g. "apple: elma"

  const soundManagerRef = useRef(null);
  const progressTrackerRef = useRef(createSessionProgressTracker(GAME_ID));
  const timerRef = useRef(null);
  const wordStartTimeRef = useRef(Date.now());

  // Set active game ID
  useEffect(() => {
    setCurrentGame?.(GAME_ID);
  }, [setCurrentGame]);

  // Audio Manager Lifecycle
  useEffect(() => {
    soundManagerRef.current = new SoundManager();
    return () => {
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

  // Session stats sync
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

  // Initialize Game
  const startNewGame = useCallback((wordList) => {
    const newDeck = pickDeck(wordList || words, DECK_SIZE);
    setDeck(newDeck);
    setWordIndex(0);
    setScore(0);
    setShields(3);
    setCombo(0);
    setLearnedWords([]);
    setGuessedLetters(new Set());
    setWrongAttempts(0);
    setLocked(false);
    setFeedback(null);
    setRevealCorrectWord(false);
    setActiveScreen("playing");
    progressTrackerRef.current.reset();
    
    if (newDeck.length > 0) {
      setCurrentWordObj(newDeck[0]);
      wordStartTimeRef.current = Date.now();
    } else {
      setCurrentWordObj(null);
    }
  }, [words]);

  useEffect(() => {
    if (!isLoading && words?.length) {
      startNewGame(words);
    }
  }, [isLoading, words, startNewGame]);

  // Text-To-Speech Pronunciation
  const playPronunciation = useCallback((wordObj) => {
    if (!isAudioEnabled || !wordObj) return;
    if (soundManagerRef.current) {
      soundManagerRef.current.speakWord(wordObj, { langId });
    } else {
      playWordPronunciation(wordObj, { isAudioEnabled, langId });
    }
  }, [isAudioEnabled, langId]);

  // Get active word details
  const targetWord = useMemo(() => {
    return prepareWordForLetterGame(currentWordObj?.english || currentWordObj?.word || "", langId);
  }, [currentWordObj, langId]);

  const isTargetArabic = useMemo(() => isArabicText(targetWord), [targetWord]);

  const targetMeaning = useMemo(() => {
    return currentWordObj?.turkish || currentWordObj?.meaning || currentWordObj?.translation || "";
  }, [currentWordObj]);

  const wordAlphabet = useMemo(() => {
    if (isTargetArabic) {
      const std = ARABIC_KEYBOARD_ROWS.join("").split("");
      const extra = targetWord.split("").filter((c) => isWordLetter(c) && !std.some((s) => areLettersEqual(s, c)));
      return [...Array.from(new Set(std)), ...Array.from(new Set(extra))];
    }
    const std = "ABCDEFGHIJKLMNOPQRSTUVWXYZ".split("");
    const extra = targetWord.split("").filter((c) => isWordLetter(c) && !std.some((s) => areLettersEqual(s, c)));
    return [...std, ...Array.from(new Set(extra))];
  }, [targetWord, isTargetArabic]);

  const keyboardRows = useMemo(() => {
    if (isTargetArabic) {
      const arRows = [
        ["ض", "ص", "ث", "ق", "ف", "غ", "ع", "ه", "خ", "ح", "ج", "د"],
        ["ش", "س", "ي", "ب", "ل", "ا", "ت", "ن", "م", "ك", "ط"],
        ["ئ", "ء", "ؤ", "ر", "ى", "ة", "و", "ز", "ظ", "ذ"],
      ];
      const stdLetters = arRows.flat();
      const extraLetters = wordAlphabet.filter((letter) => !stdLetters.includes(letter));
      if (extraLetters.length > 0) {
        return [arRows[0], arRows[1], [...arRows[2], ...extraLetters]];
      }
      return arRows;
    }
    const stdRows = [
      ["Q", "W", "E", "R", "T", "Y", "U", "I", "O", "P"],
      ["A", "S", "D", "F", "G", "H", "J", "K", "L"],
      ["Z", "X", "C", "V", "B", "N", "M"]
    ];
    const stdLetters = stdRows.flat();
    const extraLetters = wordAlphabet.filter(letter => !stdLetters.includes(letter));
    if (extraLetters.length > 0) {
      return [
        stdRows[0],
        stdRows[1],
        [...stdRows[2], ...extraLetters]
      ];
    }
    return stdRows;
  }, [wordAlphabet, isTargetArabic]);

  const hasGuessedMatchingLetter = useCallback(
    (char, guessedSet = guessedLetters) => {
      if (guessedSet.has(char)) return true;
      for (const g of guessedSet) {
        if (areLettersEqual(char, g)) return true;
      }
      return false;
    },
    [guessedLetters]
  );

  // Auto-reveal non-alphabetic characters
  const hiddenRepresentation = useMemo(() => {
    return targetWord.split("").map(char => {
      if (!isWordLetter(char)) {
        return char; // Keep spaces, hyphens, numbers
      }
      return hasGuessedMatchingLetter(char, guessedLetters) ? char : "_";
    });
  }, [targetWord, guessedLetters, hasGuessedMatchingLetter]);

  // Proceed to next word
  const advanceWord = useCallback((fromIndex) => {
    const next = fromIndex + 1;
    if (next >= deck.length) {
      soundManagerRef.current?.playStageClear?.();
      setActiveScreen("victory");
      return;
    }
    setWordIndex(next);
    setCurrentWordObj(deck[next]);
    setGuessedLetters(new Set());
    setWrongAttempts(0);
    setFeedback(null);
    setRevealCorrectWord(false);
    setLocked(false);
    wordStartTimeRef.current = Date.now();
  }, [deck]);

  // Handle harf tahmini
  const handleGuess = useCallback((letter) => {
    if (!currentWordObj || locked || activeScreen !== "playing") return;
    const cleanLetter = prepareWordForLetterGame(letter, langId);
    if (hasGuessedMatchingLetter(cleanLetter, guessedLetters)) return; // Already guessed

    const nextGuessed = new Set(guessedLetters);
    nextGuessed.add(cleanLetter);
    setGuessedLetters(nextGuessed);

    const isCorrect = targetWord.split("").some((ch) => areLettersEqual(ch, cleanLetter));
    const responseTimeSec = Math.max(1, (Date.now() - wordStartTimeRef.current) / 1000);

    if (isCorrect) {
      soundManagerRef.current?.playCoinCollect?.();
      
      // Check if word is fully solved
      const allLettersGuessed = targetWord.split("").every(char => {
        return !isWordLetter(char) || hasGuessedMatchingLetter(char, nextGuessed);
      });

      if (allLettersGuessed) {
        setLocked(true);
        setFeedback("correct");
        const nextCombo = combo + 1;
        setCombo(nextCombo);
        
        // Score calculation: 100 base + remaining wrong attempts bonus + combo bonus
        const gained = 100 + (MAX_WRONG - wrongAttempts) * 25 + Math.min(nextCombo, 8) * 20;
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
      }
    } else {
      soundManagerRef.current?.playDamage?.();
      const nextWrong = wrongAttempts + 1;
      setWrongAttempts(nextWrong);
      setCombo(0);

      if (nextWrong >= MAX_WRONG) {
        setLocked(true);
        setFeedback("wrong");
        setRevealCorrectWord(true);

        recordWordQuizResult?.(currentWordObj, false, responseTimeSec, {
          language: langId,
          attempts: 2,
          gameId: GAME_ID,
        });

        setShields(prev => {
          const nextShields = prev - 1;
          if (nextShields <= 0) {
            soundManagerRef.current?.playGameOver?.();
            timerRef.current = setTimeout(() => {
              setActiveScreen("gameover");
            }, 1500);
          } else {
            timerRef.current = setTimeout(() => {
              advanceWord(wordIndex);
            }, 1800);
          }
          return nextShields;
        });
      }
    }
  }, [
    currentWordObj,
    locked,
    activeScreen,
    guessedLetters,
    hasGuessedMatchingLetter,
    targetWord,
    targetMeaning,
    wrongAttempts,
    combo,
    wordIndex,
    langId,
    recordWordQuizResult,
    playPronunciation,
    advanceWord
  ]);

  // Physical Keyboard Listener
  useEffect(() => {
    const handleKeyDown = (e) => {
      if (activeScreen !== "playing" || locked) return;
      if (e.key === "Escape" || e.key === "p" || e.key === "P") {
        setActiveScreen("pause");
        e.preventDefault();
        return;
      }
      if (e.key && e.key.length === 1 && isWordLetter(e.key)) {
        handleGuess(prepareWordForLetterGame(e.key, langId));
        e.preventDefault();
      }
    };

    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [activeScreen, locked, handleGuess, langId]);

  // Restarters & Navigation
  const handleResume = () => {
    setActiveScreen("playing");
  };

  const handleRestart = () => {
    startNewGame(words);
  };

  const handleNextLevel = () => {
    if (onNextLevel) onNextLevel();
  };

  if (isLoading) {
    return (
      <div className="w-full h-full flex items-center justify-center bg-[#06030c]">
        <div className="text-[#00f0ff] text-2xl font-black animate-pulse font-mono tracking-widest drop-shadow-[0_0_10px_#00f0ff]">
          LOADING PROTOCOL #9...
        </div>
      </div>
    );
  }

  // Draw SVG Hangman
  const renderHangmanSVG = () => {
    return (
      <svg viewBox="0 0 200 240" className="w-full max-w-[130px] sm:max-w-[180px] h-auto drop-shadow-[0_0_15px_rgba(6,182,212,0.45)]">
        {/* Gallows base & pole (always visible) */}
        <line x1="20" y1="220" x2="180" y2="220" stroke="#00f0ff" strokeWidth="4" strokeLinecap="round" opacity="0.3" />
        <line x1="50" y1="220" x2="50" y2="20" stroke="#00f0ff" strokeWidth="4" strokeLinecap="round" />
        <line x1="50" y1="20" x2="130" y2="20" stroke="#00f0ff" strokeWidth="4" strokeLinecap="round" />
        <line x1="130" y1="20" x2="130" y2="50" stroke="#00f0ff" strokeWidth="4" strokeLinecap="round" />
        <line x1="50" y1="50" x2="80" y2="20" stroke="#00f0ff" strokeWidth="3" strokeLinecap="round" opacity="0.5" />
        
        {/* Step 1: Head */}
        {wrongAttempts >= 1 && (
          <circle cx="130" cy="68" r="18" stroke="#ff0055" strokeWidth="4" fill="none" className="animate-pulse" />
        )}
        
        {/* Step 2: Body */}
        {wrongAttempts >= 2 && (
          <line x1="130" y1="86" x2="130" y2="145" stroke="#ff0055" strokeWidth="4" strokeLinecap="round" />
        )}
        
        {/* Step 3: Left Arm */}
        {wrongAttempts >= 3 && (
          <line x1="130" y1="102" x2="100" y2="122" stroke="#ff0055" strokeWidth="4" strokeLinecap="round" />
        )}
        
        {/* Step 4: Right Arm */}
        {wrongAttempts >= 4 && (
          <line x1="130" y1="102" x2="160" y2="122" stroke="#ff0055" strokeWidth="4" strokeLinecap="round" />
        )}
        
        {/* Step 5: Left Leg */}
        {wrongAttempts >= 5 && (
          <line x1="130" y1="145" x2="105" y2="195" stroke="#ff0055" strokeWidth="4" strokeLinecap="round" />
        )}
        
        {/* Step 6: Right Leg */}
        {wrongAttempts >= 6 && (
          <line x1="130" y1="145" x2="155" y2="195" stroke="#ff0055" strokeWidth="4" strokeLinecap="round" />
        )}
      </svg>
    );
  };

  return (
    <div className="w-full h-full bg-[#030106] flex justify-center items-center">
      <div className="w-full max-w-[600px] h-full relative bg-[#06030c] flex flex-col overflow-hidden font-sans select-none border-x border-slate-800/40 shadow-[0_0_50px_rgba(0,0,0,0.85)]">
        
        {/* 1) HUD Bar */}
        <GameHeader>
          <GameHeader.Left>
            <GameHeader.Shields max={3} current={shields} />
            <GameHeader.Stage value={wordIndex} max={deck.length} label="GUESSES" icon="👤" />
          </GameHeader.Left>

          <GameHeader.Right>
            <GameHeader.Score value={score} />
            <GameHeader.Controls 
              isFxEnabled={isFxEnabled}
              onFxToggle={() => setIsFxEnabled(!isFxEnabled)}
              isAudioEnabled={isAudioEnabled}
              onAudioToggle={() => setIsAudioEnabled(!isAudioEnabled)}
              onPause={() => {
                setActiveScreen("pause");
              }}
            />
          </GameHeader.Right>
        </GameHeader>

        {/* 2) Main Screen (split layout) */}
        <div className="flex-1 w-full flex flex-col justify-start gap-4 p-4 overflow-y-auto min-h-0 bg-[#06030c] shadow-[inset_0_0_80px_rgba(0,0,0,0.9)] scrollbar-thin">
          
          {/* Top Panel: Gallows & Hint */}
          <div className="flex flex-col sm:flex-row items-center justify-around gap-4 py-2 mt-2">
            {/* SVG Illustration Container */}
            <div className="flex items-center justify-center p-3 bg-slate-950/40 border border-slate-800/40 rounded-2xl shadow-[inset_0_0_15px_rgba(0,0,0,0.7)]">
              {renderHangmanSVG()}
            </div>
            
            {/* Hint Box & Info */}
            <div className="flex-1 max-w-xs flex flex-col gap-3">
              <div className="bg-slate-950/60 border border-slate-800 p-4 rounded-2xl shadow-md text-center sm:text-start relative overflow-hidden">
                <span className="text-[8px] font-mono text-gray-500 uppercase tracking-widest absolute top-1.5 end-3">İPUCU (HINT)</span>
                <p dir="auto" className="text-gray-300 italic text-sm font-medium mt-1 leading-relaxed whitespace-normal break-words">
                  "{targetMeaning}"
                </p>
                {currentWordObj?.romanized && (
                  <p className="text-[10px] font-mono text-cyan-400 mt-2">
                    [{currentWordObj.romanized}]
                  </p>
                )}
              </div>

              {/* Combo & Progress indicators */}
              <div className="flex items-center justify-around bg-slate-950/20 py-2 border border-slate-900 rounded-xl">
                <div className="text-center">
                  <div className="text-[9px] font-mono text-gray-500 uppercase tracking-wider">HATA</div>
                  <div className="text-sm font-black text-rose-500">{wrongAttempts} / {MAX_WRONG}</div>
                </div>
                <div className="w-[1px] h-6 bg-slate-800/50"></div>
                <div className="text-center">
                  <div className="text-[9px] font-mono text-gray-500 uppercase tracking-wider">COMBO</div>
                  <div className="text-sm font-black text-amber-400">x{combo}</div>
                </div>
              </div>
            </div>
          </div>

          {/* Word Slots Panel */}
          <div className="flex flex-col items-center justify-center my-4 py-4 border-y border-slate-900/60 relative">
            
            {/* Slots */}
            <div
              dir={isTargetArabic ? "rtl" : "ltr"}
              className="flex flex-wrap gap-2 justify-center max-w-full px-2"
            >
              {hiddenRepresentation.map((char, index) => {
                const isBlank = char === "_";
                const isSpace = char === " ";
                
                return (
                  <div
                    key={index}
                    className={`w-8 h-10 flex items-center justify-center text-xl font-black rounded-lg border ${
                      isTargetArabic ? "font-sans" : "font-mono"
                    } transition-all duration-300 ${
                      isSpace
                        ? "border-transparent w-4 bg-transparent"
                        : isBlank
                        ? "border-slate-800 text-transparent bg-slate-950/30 border-b-4 border-b-cyan-500/50"
                        : feedback === "correct"
                        ? "border-emerald-500/40 text-emerald-400 bg-emerald-950/20 shadow-[0_0_10px_rgba(16,185,129,0.2)] animate-bounce"
                        : "border-slate-700 text-white bg-slate-900/50"
                    }`}
                  >
                    {!isBlank ? char : ""}
                  </div>
                );
              })}
            </div>

            {/* Reveal correct word when failed */}
            {revealCorrectWord && (
              <div className="absolute -bottom-2 text-center text-xs font-mono text-rose-400 mt-2 bg-rose-950/20 border border-rose-500/30 px-3 py-1 rounded-full animate-pulse">
                DOĞRU KELİME: <span dir={isTargetArabic ? "rtl" : "ltr"} className={`font-extrabold text-white ${isTargetArabic ? "font-sans tracking-normal" : "tracking-widest"}`}>{targetWord}</span>
              </div>
            )}
          </div>

          {/* Virtual Keyboard Panel */}
          <div className="w-full py-2 select-none">
            <div className="flex flex-col gap-2 max-w-md mx-auto">
              {keyboardRows.map((row, rIdx) => (
                <div key={rIdx} dir={isTargetArabic ? "rtl" : "ltr"} className="flex gap-1 justify-center w-full">
                  {row.map((letter) => {
                    const isGuessed = hasGuessedMatchingLetter(letter, guessedLetters);
                    const isCorrect = targetWord.split("").some((ch) => areLettersEqual(ch, letter));
                    
                    let keyClass = "bg-slate-900/80 border-slate-800 text-white hover:border-cyan-500/40 hover:bg-slate-800 active:bg-cyan-500/20 active:border-cyan-400";
                    if (isGuessed) {
                      keyClass = isCorrect
                        ? "bg-emerald-950/40 border-emerald-500/60 text-emerald-400 pointer-events-none opacity-80"
                        : "bg-rose-950/20 border-rose-900 text-rose-800 pointer-events-none line-through opacity-35";
                    }

                    return (
                      <button
                        key={letter}
                        disabled={isGuessed || locked}
                        onClick={() => handleGuess(letter)}
                        className={`flex-1 h-12 sm:h-14 flex items-center justify-center font-black text-base sm:text-xl rounded-lg border-2 ${
                          isTargetArabic ? "font-sans" : "font-mono"
                        } transition-all touch-none select-none ${keyClass}`}
                      >
                        {letter}
                      </button>
                    );
                  })}
                </div>
              ))}
            </div>
          </div>
        </div>

        {/* 3) Overlays */}
        {activeScreen === "pause" && (
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
                TAHMİN EDİLEN KELİMELER
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
                KAZANILAN KELİMELER
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
