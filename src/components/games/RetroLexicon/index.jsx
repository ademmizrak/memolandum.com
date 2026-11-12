"use client";

import React, { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { Volume2 } from "lucide-react";
import { useLessonLoader } from "../../../hooks/useLessonLoader";
import { useMemolandumStore } from "../../../store/useMemolandumStore";
import { PauseScreen, GameOverScreen, VictoryScreen } from "../shared/GameOverlays";
import { GameHeader } from "../shared/GameHeader";
import { SoundManager } from "../../../engines/soundManager";
import { playWordPronunciation } from "../../../lib/pronunciation";
import { createSessionProgressTracker } from "../../../lib/progress/applySessionProgress";

const GAME_ID = "lexicon";
const DECK_SIZE = 8;
const CHOICE_COUNT = 3;

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

function buildCard(wordObj, deck) {
  const meaning = wordObj.turkish || wordObj.meaning || wordObj.translation || "";
  const others = deck.filter((w) => (w.english || w.word) !== (wordObj.english || wordObj.word));
  const distractors = shuffle(others)
    .slice(0, CHOICE_COUNT - 1)
    .map((w) => w.turkish || w.meaning || w.translation || "")
    .filter(Boolean);

  while (distractors.length < CHOICE_COUNT - 1 && others.length) {
    const fallback = others[distractors.length % others.length];
    const m = fallback.turkish || fallback.meaning || "";
    if (m && !distractors.includes(m) && m !== meaning) distractors.push(m);
    else break;
  }

  const choices = shuffle([
    { value: meaning, isCorrect: true },
    ...distractors.map((value) => ({ value, isCorrect: false })),
  ]).slice(0, CHOICE_COUNT);

  return {
    wordObj,
    target: wordObj.english || wordObj.word || "",
    romanization: wordObj.romanized || wordObj.romanized_script || "",
    meaning,
    choices,
    attempts: 1,
    startedAt: Date.now(),
  };
}

export default function RetroLexicon({
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

  const [activeScreen, setActiveScreen] = useState("playing");
  const [score, setScore] = useState(0);
  const [shields, setShields] = useState(3);
  const [combo, setCombo] = useState(0);
  const [cardIndex, setCardIndex] = useState(0);
  const [deck, setDeck] = useState([]);
  const [card, setCard] = useState(null);
  const [feedback, setFeedback] = useState(null); // null | 'correct' | 'wrong'
  const [locked, setLocked] = useState(false);
  const [learnedWords, setLearnedWords] = useState([]);
  const [flash, setFlash] = useState(null);

  const soundManagerRef = useRef(null);
  const progressTrackerRef = useRef(createSessionProgressTracker(GAME_ID));
  const advanceTimerRef = useRef(null);

  useEffect(() => {
    setCurrentGame?.(GAME_ID);
  }, [setCurrentGame]);

  useEffect(() => {
    soundManagerRef.current = new SoundManager();
    return () => {
      if (advanceTimerRef.current) clearTimeout(advanceTimerRef.current);
      soundManagerRef.current?.stop?.();
    };
  }, []);

  useEffect(() => {
    if (soundManagerRef.current) {
      soundManagerRef.current.setMuted(!isFxEnabled);
      soundManagerRef.current.setAudioEnabled(isAudioEnabled);
    }
  }, [isFxEnabled, isAudioEnabled]);

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

  const startDeck = useCallback(
    (wordList) => {
      const nextDeck = pickDeck(wordList || words, DECK_SIZE);
      setDeck(nextDeck);
      setCardIndex(0);
      setScore(0);
      setShields(3);
      setCombo(0);
      setLearnedWords([]);
      setFeedback(null);
      setLocked(false);
      setFlash(null);
      setActiveScreen("playing");
      progressTrackerRef.current.reset();
      if (nextDeck.length) setCard(buildCard(nextDeck[0], nextDeck));
      else setCard(null);
    },
    [words]
  );

  useEffect(() => {
    if (!isLoading && words?.length) startDeck(words);
  }, [isLoading, words, startDeck]);

  const playPronunciation = useCallback(
    (wordObj, extraOpts = {}) => {
      if (!isAudioEnabled || !wordObj) return;
      if (soundManagerRef.current) {
        soundManagerRef.current.speakWord(wordObj, { langId, ...extraOpts });
      } else {
        playWordPronunciation(wordObj, { isAudioEnabled, langId, ...extraOpts });
      }
    },
    [isAudioEnabled, langId]
  );

  const advance = useCallback(
    (fromIndex) => {
      const next = fromIndex + 1;
      if (next >= deck.length) {
        soundManagerRef.current?.playStageClear?.();
        setActiveScreen("victory");
        return;
      }
      setCardIndex(next);
      setCard(buildCard(deck[next], deck));
      setFeedback(null);
      setLocked(false);
      setFlash(null);
    },
    [deck]
  );

  useEffect(() => {
    if (activeScreen === "playing" && card?.wordObj) {
      const timer = setTimeout(() => {
        playPronunciation(card.wordObj, { includeMeaning: false });
      }, 350);
      return () => clearTimeout(timer);
    }
  }, [cardIndex, activeScreen, playPronunciation]);

  const handleChoice = useCallback(
    (choice) => {
      if (!card || locked || activeScreen !== "playing") return;
      setLocked(true);

      const responseTimeSec = Math.max(1, (Date.now() - (card.startedAt || Date.now())) / 1000);

      if (choice.isCorrect) {
        const nextCombo = combo + 1;
        const gained = 100 + Math.min(nextCombo, 8) * 25;
        setCombo(nextCombo);
        setScore((s) => s + gained);
        setFeedback("correct");
        setFlash("green");
        soundManagerRef.current?.playCoinCollect?.();

        const pair = `${card.target}: ${card.meaning}`;
        setLearnedWords((prev) => (prev.includes(pair) ? prev : [...prev, pair]));

        recordWordQuizResult?.(card.wordObj, true, responseTimeSec, {
          language: langId,
          attempts: card.attempts || 1,
          gameId: GAME_ID,
        });
        playPronunciation(card.wordObj, { includeMeaning: false });

        playPronunciation(card.wordObj, { includeMeaning: true }); advanceTimerRef.current = setTimeout(() => advance(cardIndex), 1350);
      } else {
        const nextAttempts = (card.attempts || 1) + 1;
        setCard((c) => (c ? { ...c, attempts: nextAttempts } : c));
        setCombo(0);
        setFeedback("wrong");
        setFlash("red");
        soundManagerRef.current?.playDamage?.();

        recordWordQuizResult?.(card.wordObj, false, responseTimeSec, {
          language: langId,
          attempts: nextAttempts,
          gameId: GAME_ID,
        });

        setShields((prev) => {
          const nextShields = prev - 1;
          if (nextShields <= 0) {
            soundManagerRef.current?.playGameOver?.();
            advanceTimerRef.current = setTimeout(() => setActiveScreen("gameover"), 700);
          } else {
            advanceTimerRef.current = setTimeout(() => {
              setFeedback(null);
              setLocked(false);
              setFlash(null);
            }, 700);
          }
          return nextShields;
        });
      }
    },
    [
      card,
      locked,
      activeScreen,
      combo,
      cardIndex,
      langId,
      recordWordQuizResult,
      playPronunciation,
      advance,
    ]
  );

  const handleRestart = () => {
    if (advanceTimerRef.current) clearTimeout(advanceTimerRef.current);
    if (typeof reload === "function") reload();
    else startDeck(words);
  };

  const comboLabel = useMemo(() => (combo > 1 ? `x${combo}` : "x1"), [combo]);

  if (isLoading) {
    return (
      <div className="w-full h-full flex items-center justify-center bg-[#05080f] text-lime-400">
        <div className="text-xl font-mono tracking-widest animate-pulse">LEXICON TOKENS // LOADING…</div>
      </div>
    );
  }

  return (
    <div
      className="w-full h-full bg-[#05080f] flex justify-center relative overflow-hidden select-none"
      onPointerDown={() => soundManagerRef.current?.init?.()}
    >
      {/* CRT scanlines (subtle) */}
      <div
        className="absolute inset-0 pointer-events-none opacity-[0.12] z-[1]"
        style={{
          background:
            "repeating-linear-gradient(0deg, transparent, transparent 2px, rgba(0,0,0,0.35) 2px, rgba(0,0,0,0.35) 4px)",
        }}
      />
      <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_center,rgba(34,197,94,0.06),transparent_65%)] pointer-events-none" />

      {flash === "green" && (
        <div className="absolute inset-0 bg-emerald-500/10 pointer-events-none z-[2] animate-pulse" />
      )}
      {flash === "red" && (
        <div className="absolute inset-0 bg-red-500/15 pointer-events-none z-[2] animate-pulse" />
      )}

      <div className="w-full max-w-[480px] h-full relative flex flex-col z-10 px-3 pt-2 pb-[max(0.75rem,env(safe-area-inset-bottom))]">
        <GameHeader>
          <GameHeader.Left>
            <GameHeader.Shields max={3} current={shields} />
            <GameHeader.Stage
              value={Math.min(cardIndex + 1, deck.length || DECK_SIZE)}
              max={deck.length || DECK_SIZE}
              label="TOKEN"
              icon="◈"
            />
          </GameHeader.Left>
          <GameHeader.Right>
            <div
              className="shrink-0 border border-yellow-500/40 bg-yellow-500/10 rounded-md px-1.5 py-0.5 text-[10px] font-mono font-bold text-yellow-300 tabular-nums"
              title="Combo"
            >
              {comboLabel}
            </div>
            <GameHeader.Score value={score} />
            <GameHeader.Controls
              isFxEnabled={isFxEnabled}
              onFxToggle={() => setIsFxEnabled?.(!isFxEnabled)}
              isAudioEnabled={isAudioEnabled}
              onAudioToggle={() => setIsAudioEnabled?.(!isAudioEnabled)}
              onPause={() => setActiveScreen("paused")}
            />
          </GameHeader.Right>
        </GameHeader>

        {/* Card zone — upper/mid, read-only except audio */}
        <div className="flex-1 min-h-0 flex flex-col items-center justify-center px-1 py-2">
          {card ? (
            <div
              className={`w-full max-w-[400px] rounded-2xl border-2 px-5 py-7 text-center transition-colors ${
                feedback === "correct"
                  ? "border-emerald-400/70 bg-emerald-950/50 shadow-[0_0_28px_rgba(52,211,153,0.25)]"
                  : feedback === "wrong"
                    ? "border-red-500/60 bg-red-950/40 shadow-[0_0_24px_rgba(239,68,68,0.2)]"
                    : "border-lime-500/35 bg-slate-950/80 shadow-[0_0_24px_rgba(132,204,22,0.12)]"
              }`}
            >
              <div className="text-[9px] font-mono tracking-[0.2em] text-lime-500/70 uppercase mb-2">
                Arcade Token
              </div>
              {(() => {
                const imageId = card.wordObj.word_id || (card.wordObj.id?.startsWith("w_") ? card.wordObj.id : null);
                if (imageId) {
                  return (
                    <div className="flex justify-center mb-4">
                      <img
                        src={`/assets/words/${imageId}.png`}
                        alt={card.target}
                        className="w-32 h-32 object-contain rounded-xl border border-lime-500/20 bg-slate-950/90 p-1.5 shadow-[0_0_15px_rgba(132,204,22,0.15)]"
                        onError={(e) => {
                          e.target.style.display = "none";
                        }}
                      />
                    </div>
                  );
                }
                return null;
              })()}
              <h2 dir="auto" className="text-3xl sm:text-4xl font-black text-white leading-tight break-words drop-shadow-[0_0_10px_rgba(255,255,255,0.25)]">
                {card.target}
              </h2>
              {card.romanization ? (
                <p className="mt-2 text-sm font-mono text-cyan-300 tracking-wide">[{card.romanization}]</p>
              ) : null}

              {feedback === "wrong" ? (
                <p className="mt-3 text-sm font-bold text-emerald-300">= {card.meaning}</p>
              ) : null}

              <button
                type="button"
                onClick={() => playPronunciation(card.wordObj)}
                className="mt-5 inline-flex items-center justify-center gap-2 min-h-12 min-w-[48%] px-4 rounded-xl border border-lime-400/40 bg-lime-500/10 text-lime-300 font-mono text-xs font-bold active:scale-95"
                aria-label="Play pronunciation"
              >
                <Volume2 className="w-5 h-5" /> LISTEN
              </button>
            </div>
          ) : (
            <p className="text-slate-400 font-mono text-sm">No tokens in this deck.</p>
          )}
        </div>

        {/* Thumb zone — bottom ~35% */}
        <div className="shrink-0 flex flex-col gap-2.5 pb-1 pt-1 min-h-[34vh] justify-end">
          <div className="text-[9px] font-mono text-slate-500 tracking-widest uppercase text-center mb-0.5">
            Select meaning
          </div>
          {(card?.choices || []).map((choice, i) => {
            const showCorrect = feedback && choice.isCorrect;
            const showWrong = feedback === "wrong" && !choice.isCorrect;
            return (
              <button
                key={`${cardIndex}-${i}-${choice.value}`}
                type="button"
                disabled={locked || activeScreen !== "playing"}
                onClick={() => handleChoice(choice)}
                className={`w-full min-h-[52px] px-4 py-3 rounded-xl border-2 text-start font-semibold text-[15px] leading-snug transition-all active:scale-[0.98] disabled:opacity-80 ${
                  showCorrect
                    ? "border-emerald-400 bg-emerald-500/25 text-emerald-100"
                    : showWrong
                      ? "border-slate-700 bg-slate-900/60 text-slate-500"
                      : "border-slate-600/80 bg-slate-900/90 text-slate-100 hover:border-lime-400/50"
                }`}
              >
                <span className="font-mono text-[10px] text-lime-500/70 me-2">{i + 1}</span>
                {choice.value}
              </button>
            );
          })}
        </div>
      </div>

      {activeScreen === "paused" && (
        <PauseScreen
          onResume={() => setActiveScreen("playing")}
          onRestart={handleRestart}
          onMainMenu={onExit}
          levelId={levelId}
          langId={langId}
          currentGameType={GAME_ID}
          words={deck}
          isAudioEnabled={isAudioEnabled}
          onMiniQuizCorrect={() => {
            setShields((s) => Math.min(3, s + 1));
            setScore((s) => s + 50);
          }}
        />
      )}
      {activeScreen === "gameover" && (
        <GameOverScreen
          score={score}
          words={deck}
          onRestart={handleRestart}
          onMainMenu={onExit}
          levelId={levelId}
          langId={langId}
          currentGameType={GAME_ID}
          isAudioEnabled={isAudioEnabled}
          message="TOKENS DEPLETED // DECK FAILED"
        />
      )}
      {activeScreen === "victory" && (
        <VictoryScreen
          score={score}
          words={deck}
          onNextLevel={onNextLevel ? () => onNextLevel() : handleRestart}
          onMainMenu={onExit}
          levelId={levelId}
          langId={langId}
          currentGameType={GAME_ID}
        >
          <div className="flex flex-col items-center w-full bg-slate-950/60 p-4 rounded-2xl border border-lime-500/30 max-h-48 overflow-y-auto">
            <h3 className="text-lime-400 mb-3 text-xs tracking-widest font-mono uppercase">
              TOKEN VAULT
            </h3>
            <ul className="flex flex-wrap gap-2 justify-center">
              {learnedWords.map((wordPair, idx) => (
                <li
                  key={idx}
                  className="text-emerald-400 bg-emerald-950/30 px-3 py-1 rounded-full border border-emerald-500/50 text-xs font-mono font-bold"
                >
                  {wordPair}
                </li>
              ))}
            </ul>
          </div>
        </VictoryScreen>
      )}
    </div>
  );
}
