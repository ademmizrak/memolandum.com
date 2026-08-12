"use client";

import React, { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { Volume2, ChevronLeft, ChevronRight, RefreshCw, Check, Award, HelpCircle, Video, ExternalLink } from "lucide-react";
import { useLessonLoader } from "../../../hooks/useLessonLoader";
import { useMemolandumStore } from "../../../store/useMemolandumStore";
import { PauseScreen, VictoryScreen } from "../shared/GameOverlays";
import { GameHeader } from "../shared/GameHeader";
import { SoundManager } from "../../../engines/soundManager";
import { createSessionProgressTracker } from "../../../lib/progress/applySessionProgress";
import { findNextLevelId } from "../../../lib/learning/studyContext";
import { findVaultItem } from "../../../lib/learning/memolandumPulse";
import { resolveWordImageUrl, resolveDataUrl } from "../../../lib/contentCdn";

function getPlaylistCategory(levelId) {
  if (!levelId) return null;
  const idLower = levelId.toLowerCase();
  if (idLower.includes("yds")) return "yds";
  if (idLower.includes("ilkokul-1") || idLower.includes("ilkokul-2")) return "2sınıf";
  if (idLower.includes("ilkokul-3") || idLower.includes("ilkokul-4")) return "3sınıf";
  if (idLower.includes("ilkokul-5") || idLower.includes("ilkokul-6")) return "4sınıf";
  return null;
}

function findVideoForWord(wordText, playlistVideos) {
  if (!wordText || !playlistVideos) return null;
  const cleanWord = wordText.trim().toLowerCase();
  return playlistVideos.find(v => {
    const title = v.title.toLowerCase();
    const desc = v.description.toLowerCase();
    if (v.id === 'ywDtgObP08Y') return false;
    return title.includes(cleanWord) || desc.includes(cleanWord);
  });
}

const GAME_ID = "word-card";
const DECK_SIZE = 10;

function shuffle(arr) {
  const a = [...arr];
  for (let i = a.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [a[i], a[j]] = [a[j], a[i]];
  }
  return a;
}

/** MEB curriculum: sentences use curriculum.unit_no; words use curriculum.units[].unit_no */
function getItemUnit(item) {
  if (!item?.curriculum) return null;
  if (item.curriculum.unit_no != null) {
    return {
      unitNo: Number(item.curriculum.unit_no),
      unitName: item.curriculum.unit_name || `Ünite ${item.curriculum.unit_no}`,
    };
  }
  const units = item.curriculum.units;
  if (Array.isArray(units) && units.length > 0) {
    const u = units[0];
    if (u?.unit_no == null) return null;
    return {
      unitNo: Number(u.unit_no),
      unitName: u.unit_name || `Ünite ${u.unit_no}`,
    };
  }
  return null;
}

function unitStorageKey(levelId) {
  return `word-card-unit:${levelId || "default"}`;
}

export default function WordCard({
  levelId,
  langId,
  onExit,
  onNextLevel,
  isAudioEnabled,
  setIsAudioEnabled,
  isFxEnabled,
  setIsFxEnabled,
}) {
  const { words, isLoading, reload } = useLessonLoader(levelId, langId, true);
  const recordWordQuizResult = useMemolandumStore((s) => s.recordWordQuizResult);
  const setCurrentGame = useMemolandumStore((s) => s.setCurrentGame);
  const vocabularyVault = useMemolandumStore((s) => s.vocabularyVault) || {};

  const isWordLearned = useCallback((word) => {
    if (!word) return false;
    const found = findVaultItem(vocabularyVault, word);
    if (!found?.item) return false;
    const entry = found.item;
    return entry.learningProgressPct === 100 || entry.firstTryCorrect === true || (Number(entry.reps) || 0) > 0;
  }, [vocabularyVault]);

  const [activeScreen, setActiveScreen] = useState("playing");
  const [score, setScore] = useState(0);
  const [cardIndex, setCardIndex] = useState(0);
  const [initialDeck, setInitialDeck] = useState([]);
  const [activeDeck, setActiveDeck] = useState([]);
  const [completedWordIds, setCompletedWordIds] = useState(new Set());
  const [isFlipped, setIsFlipped] = useState(false);
  const [imgError, setImgError] = useState(false);
  const [learnedWords, setLearnedWords] = useState([]);
  const [selectedUnitNo, setSelectedUnitNo] = useState(null);
  const [youtubeData, setYoutubeData] = useState(null);

  useEffect(() => {
    fetch(`${resolveDataUrl("youtube_videos.json")}?v=${Date.now()}`)
      .then((res) => {
        if (!res.ok) throw new Error("JSON fetch failed");
        return res.json();
      })
      .then((data) => setYoutubeData(data))
      .catch((err) => console.warn("Failed to load youtube_videos.json:", err));
  }, []);

  const units = useMemo(() => {
    const map = new Map();
    (words || []).forEach((w) => {
      const info = getItemUnit(w);
      if (!info) return;
      if (!map.has(info.unitNo)) {
        map.set(info.unitNo, info.unitName);
      }
    });
    return [...map.entries()]
      .sort((a, b) => a[0] - b[0])
      .map(([unitNo, unitName]) => ({ unitNo, unitName }));
  }, [words]);

  const hasUnitLevels = units.length > 0;

  // Restore or default unit when dataset / level changes
  useEffect(() => {
    if (!hasUnitLevels) {
      setSelectedUnitNo(null);
      return;
    }
    let preferred = null;
    try {
      const raw = sessionStorage.getItem(unitStorageKey(levelId));
      if (raw != null && raw !== "") preferred = Number(raw);
    } catch {
      /* ignore */
    }
    const exists = preferred != null && units.some((u) => u.unitNo === preferred);
    setSelectedUnitNo(exists ? preferred : units[0].unitNo);
  }, [levelId, hasUnitLevels, units]);

  const unitWords = useMemo(() => {
    if (!words?.length) return [];
    if (!hasUnitLevels || selectedUnitNo == null) return words;
    return words.filter((w) => getItemUnit(w)?.unitNo === selectedUnitNo);
  }, [words, hasUnitLevels, selectedUnitNo]);

  const selectedUnitMeta = useMemo(
    () => units.find((u) => u.unitNo === selectedUnitNo) || null,
    [units, selectedUnitNo]
  );

  const nextLevelExists = useMemo(() => {
    return !!findNextLevelId(langId, levelId);
  }, [langId, levelId]);

  const nextUnitNo = useMemo(() => {
    if (!hasUnitLevels || selectedUnitNo == null) return null;
    const idx = units.findIndex((u) => u.unitNo === selectedUnitNo);
    if (idx < 0 || idx >= units.length - 1) return null;
    return units[idx + 1].unitNo;
  }, [hasUnitLevels, selectedUnitNo, units]);

  const sessionCompletedRef = useRef(new Set());

  const soundManagerRef = useRef(null);
  const progressTrackerRef = useRef(createSessionProgressTracker(GAME_ID));

  useEffect(() => {
    setCurrentGame?.(GAME_ID);
    soundManagerRef.current = new SoundManager();
    return () => {
      soundManagerRef.current?.stop?.();
    };
  }, [setCurrentGame]);

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
    if (activeScreen === "victory") {
      progressTrackerRef.current.commit({ score, gems: Math.max(1, Math.floor(score / 200)) });
    }
  }, [activeScreen, score]);

  const startSession = useCallback(
    (wordList, resetSession = false) => {
      if (!wordList?.length) return;

      if (resetSession) {
        sessionCompletedRef.current = new Set();
      }

      const newWords = wordList.filter((w) => {
        const wId = w.word_id || w.id;
        return !sessionCompletedRef.current.has(wId);
      });
      const oldWords = wordList.filter((w) => {
        const wId = w.word_id || w.id;
        return sessionCompletedRef.current.has(wId);
      });

      let selectedNew = [];
      let selectedOld = [];
      const targetSize = Math.min(DECK_SIZE, wordList.length);

      if (newWords.length === 0) {
        sessionCompletedRef.current = new Set();
        const freshNew = [...wordList];
        selectedNew = shuffle(freshNew).slice(0, targetSize);
      } else {
        let targetNewCount = 7;
        let targetOldCount = 3;

        if (newWords.length < targetNewCount) {
          targetNewCount = newWords.length;
          targetOldCount = targetSize - targetNewCount;
        }
        if (oldWords.length < targetOldCount) {
          targetOldCount = oldWords.length;
          targetNewCount = targetSize - targetOldCount;
        }

        selectedNew = shuffle(newWords).slice(0, targetNewCount);
        selectedOld = shuffle(oldWords).slice(0, targetOldCount);
      }

      const selected = shuffle([...selectedNew, ...selectedOld]);

      setInitialDeck(selected);
      setActiveDeck([...selected]);
      setCardIndex(0);
      setScore(0);
      setCompletedWordIds(new Set());
      setLearnedWords([]);
      setIsFlipped(false);
      setImgError(false);
      setActiveScreen("playing");
      progressTrackerRef.current.reset();
    },
    []
  );

  // Start / restart when unit pool changes
  useEffect(() => {
    if (isLoading || !unitWords?.length) return;
    if (hasUnitLevels && selectedUnitNo == null) return;

    const studied = new Set();
    unitWords.forEach((w) => {
      if (isWordLearned(w)) {
        const wId = w.word_id || w.id;
        studied.add(wId);
      }
    });
    sessionCompletedRef.current = studied;
    startSession(unitWords);
  }, [isLoading, unitWords, hasUnitLevels, selectedUnitNo, isWordLearned, startSession]);

  const handleSelectUnit = (unitNo) => {
    if (unitNo === selectedUnitNo) return;
    setSelectedUnitNo(unitNo);
    try {
      sessionStorage.setItem(unitStorageKey(levelId), String(unitNo));
    } catch {
      /* ignore */
    }
  };

  const currentWord = useMemo(() => {
    if (!activeDeck.length || cardIndex >= activeDeck.length) return null;
    return activeDeck[cardIndex];
  }, [activeDeck, cardIndex]);

  const imageId = useMemo(() => {
    if (!currentWord) return "";
    // Sentence cards: dedicated s_* art, or linked word w_* illustration
    const linked =
      currentWord.image_id ||
      currentWord.imageId ||
      "";
    if (linked && (String(linked).startsWith("w_") || String(linked).startsWith("s_"))) {
      return String(linked);
    }
    const url = currentWord.imageUrl || currentWord.image_url || "";
    if (url) {
      const m = String(url).match(/((?:w|s)_\d+)/);
      if (m) return m[1];
    }
    const wId = currentWord.word_id || currentWord.sentence_id || currentWord.id;
    const id = String(wId || "");
    return id.startsWith("w_") || id.startsWith("s_") ? id : "";
  }, [currentWord]);

  const isSentenceCard = useMemo(() => {
    if (!currentWord) return false;
    const id = String(currentWord.sentence_id || currentWord.id || "");
    return id.startsWith("s_") || Boolean(currentWord.sentence_id);
  }, [currentWord]);

  useEffect(() => {
    setImgError(false);
  }, [cardIndex]);

  const speakTts = useCallback((text) => {
    if (typeof window === "undefined" || !window.speechSynthesis || !text) return;
    window.speechSynthesis.cancel();
    const utterance = new SpeechSynthesisUtterance(text);
    utterance.lang = "en-US";
    utterance.rate = 0.85;
    window.speechSynthesis.speak(utterance);
  }, []);

  const playPronunciation = useCallback(
    (wordObj) => {
      if (!isAudioEnabled || !wordObj) return;
      const text = wordObj.english || wordObj.word || "";
      const id = String(wordObj.sentence_id || wordObj.word_id || wordObj.id || "");
      const isSentence = id.startsWith("s_") || Boolean(wordObj.sentence_id);
      // Cümle ses dosyaları henüz yoksa TTS; kelimelerde kayıtlı audioUrl kullan
      if (!isSentence && soundManagerRef.current && wordObj.audioUrl) {
        soundManagerRef.current.playWordAudio(wordObj.audioUrl);
      } else {
        speakTts(text);
      }
    },
    [isAudioEnabled, speakTts]
  );

  useEffect(() => {
    if (activeScreen === "playing" && currentWord) {
      const timer = setTimeout(() => {
        playPronunciation(currentWord);
      }, 350);
      return () => clearTimeout(timer);
    }
  }, [currentWord, activeScreen, playPronunciation]);

  const toggleFlip = () => {
    if (activeScreen !== "playing") return;
    setIsFlipped(!isFlipped);
    soundManagerRef.current?.playButtonHover?.();
  };

  const handleLearned = () => {
    if (!currentWord || activeScreen !== "playing") return;

    const wId = currentWord.word_id || currentWord.id;
    const wordKey = currentWord.english || currentWord.word || "";
    const translationKey = currentWord.turkish || currentWord.meaning || currentWord.translation || "";

    soundManagerRef.current?.playCoinCollect?.();

    const newCompleted = new Set(completedWordIds);
    newCompleted.add(wId);
    setCompletedWordIds(newCompleted);

    sessionCompletedRef.current.add(wId);

    setScore((s) => s + 100);
    const pair = `${wordKey}: ${translationKey}`;
    setLearnedWords((prev) => (prev.includes(pair) ? prev : [...prev, pair]));

    recordWordQuizResult?.(currentWord, true, 2, {
      game: GAME_ID,
      levelId,
      langId,
      unitNo: selectedUnitNo,
    });

    if (newCompleted.size >= initialDeck.length) {
      const playlistCategory = getPlaylistCategory(levelId);
      if (playlistCategory) {
        setTimeout(() => {
          setCardIndex(0);
          setActiveScreen("video-review");
        }, 500);
      } else {
        setTimeout(() => {
          soundManagerRef.current?.playStageClear?.();
          setActiveScreen("victory");
        }, 500);
      }
      return;
    }

    advanceToNext(newCompleted);
  };

  const handlePrevCard = () => {
    if (activeDeck.length <= 1 || activeScreen !== "playing") return;
    const prevIdx = (cardIndex - 1 + activeDeck.length) % activeDeck.length;
    setCardIndex(prevIdx);
    setIsFlipped(false);
    soundManagerRef.current?.playButtonHover?.();
  };

  const handleNextCard = () => {
    if (activeDeck.length <= 1 || activeScreen !== "playing") return;
    const nextIdx = (cardIndex + 1) % activeDeck.length;
    setCardIndex(nextIdx);
    setIsFlipped(false);
    soundManagerRef.current?.playButtonHover?.();
  };

  const handleListenOnly = () => {
    if (!currentWord || activeScreen !== "playing") return;
    soundManagerRef.current?.playButtonHover?.();
    playPronunciation(currentWord);
  };

  const advanceToNext = (completedSet) => {
    let nextIdx = cardIndex + 1;
    while (nextIdx < activeDeck.length) {
      const nextWord = activeDeck[nextIdx];
      const nextWordId = nextWord.word_id || nextWord.id;
      if (!completedSet.has(nextWordId)) {
        setCardIndex(nextIdx);
        setIsFlipped(false);
        return;
      }
      nextIdx++;
    }
  };

  const levelProgressPercent = useMemo(() => {
    if (activeScreen === "video-review") {
      return Math.min(100, Math.floor(((cardIndex + 1) / initialDeck.length) * 100));
    }
    if (!unitWords?.length) return 0;
    return Math.min(100, Math.floor((sessionCompletedRef.current.size / unitWords.length) * 100));
  }, [unitWords, completedWordIds, activeScreen, cardIndex, initialDeck]);

  const handleNextRound = () => {
    useMemolandumStore.getState().clearActiveCustomWords();
    const totalWords = unitWords?.length || 0;
    const studiedCount = sessionCompletedRef.current.size;

    if (studiedCount >= totalWords) {
      // Önce bir sonraki üniteye geç
      if (nextUnitNo != null) {
        handleSelectUnit(nextUnitNo);
        return;
      }
      if (nextLevelExists && onNextLevel) {
        onNextLevel();
      } else {
        startSession(unitWords, true);
      }
    } else {
      startSession(unitWords, false);
    }
  };

  if (isLoading || (hasUnitLevels && selectedUnitNo == null) || !currentWord) {
    return (
      <div className="absolute inset-0 flex items-center justify-center bg-slate-950 z-20">
        <div className="text-cyan-400 animate-pulse text-2xl font-mono">YÜKLENİYOR...</div>
      </div>
    );
  }

  const englishText = currentWord.english || currentWord.word || "";
  const isLongText = englishText.length > 32;

  const playlistCategory = getPlaylistCategory(levelId);

  return (
    <div className="relative w-full h-[82vh] min-h-[540px] sm:h-[780px] flex flex-col bg-slate-950 rounded-2xl overflow-hidden border border-slate-800 shadow-2xl">

      <GameHeader>
        <GameHeader.Left>
          <div className="flex items-center gap-2.5 bg-slate-900/90 px-4 py-2 rounded-2xl border border-cyan-500/20 shadow-[0_0_15px_rgba(6,182,212,0.1)]">
            <Award className="w-5 h-5 text-cyan-400 animate-bounce" />
            <div className="flex flex-col">
              <span className="text-[9px] text-slate-400 font-bold uppercase tracking-wider">
                {activeScreen === "video-review" ? "VİDEO" : "İLERLEME"}
              </span>
              <span className="text-cyan-400 font-mono text-xs sm:text-sm font-black leading-none mt-0.5">
                {activeScreen === "video-review"
                  ? `${cardIndex + 1} / ${initialDeck.length}`
                  : `${sessionCompletedRef.current.size} / ${unitWords.length}`}
              </span>
            </div>
          </div>
        </GameHeader.Left>

        <div className="absolute left-1/2 -translate-x-1/2 flex items-center gap-3 w-40 sm:w-64 bg-slate-950/80 px-3 py-1.5 rounded-2xl border border-slate-800/80 shadow-[inset_0_2px_4px_rgba(0,0,0,0.6)]">
          <div className="flex-1 h-3 bg-slate-900 rounded-full overflow-hidden border border-slate-800 relative">
            <div
              className="bg-gradient-to-r from-cyan-500 via-teal-400 to-emerald-500 h-full rounded-full transition-all duration-500 ease-out shadow-[0_0_10px_rgba(52,211,153,0.5)]"
              style={{ width: `${levelProgressPercent}%` }}
            />
            <div className="absolute inset-0 bg-gradient-to-b from-white/10 to-transparent pointer-events-none" />
          </div>
          <span className="text-emerald-400 font-mono text-xs font-black min-w-8 text-right">
            {levelProgressPercent}%
          </span>
        </div>

        <GameHeader.Right>
          <GameHeader.Score value={score} customIdValues={{ labelId: "score-lbl", valueId: "score-val" }} />
          <GameHeader.Controls
            isFxEnabled={isFxEnabled}
            onFxToggle={() => setIsFxEnabled(!isFxEnabled)}
            isAudioEnabled={isAudioEnabled}
            onAudioToggle={() => setIsAudioEnabled(!isAudioEnabled)}
            onPause={() => setActiveScreen("paused")}
            pauseId="card-btn-pause"
          />
        </GameHeader.Right>
      </GameHeader>

      {/* MEB ünite seçici — header altı, okulda görülen ünite */}
      {hasUnitLevels && activeScreen !== "video-review" && (
        <div className="w-full max-w-[800px] mx-auto px-2 sm:px-3 pt-2 pb-1 shrink-0 z-40">
          <div className="rounded-xl border border-cyan-500/30 bg-slate-900/95 px-2.5 py-2 shadow-[0_0_20px_rgba(6,182,212,0.12)]">
            <div className="flex items-center justify-between gap-2 mb-1.5 px-0.5">
              <span className="text-[10px] sm:text-xs font-black uppercase tracking-wider text-cyan-300">
                Okul üniteni seç
              </span>
              {selectedUnitMeta && (
                <span className="text-[10px] sm:text-xs text-slate-300 font-medium truncate max-w-[55%]">
                  Ünite {selectedUnitMeta.unitNo}: {selectedUnitMeta.unitName}
                </span>
              )}
            </div>
            <div className="flex gap-1.5 overflow-x-auto pb-0.5 custom-scrollbar snap-x">
              {units.map(({ unitNo, unitName }) => {
                const active = unitNo === selectedUnitNo;
                return (
                  <button
                    key={unitNo}
                    type="button"
                    onClick={() => handleSelectUnit(unitNo)}
                    title={unitName}
                    className={`snap-start shrink-0 min-w-[2.5rem] px-3 py-1.5 rounded-xl border text-xs sm:text-sm font-bold transition-all active:scale-95 ${
                      active
                        ? "bg-cyan-500 text-slate-950 border-cyan-300 shadow-[0_0_14px_rgba(6,182,212,0.45)]"
                        : "bg-slate-950/80 text-slate-300 border-slate-700 hover:border-cyan-500/50 hover:text-cyan-300"
                    }`}
                  >
                    {unitNo}
                    <span className="hidden md:inline ml-1 font-medium opacity-80">
                      · {unitName.length > 12 ? `${unitName.slice(0, 12)}…` : unitName}
                    </span>
                  </button>
                );
              })}
            </div>
          </div>
        </div>
      )}

      {activeScreen === "video-review" ? (
        <div className="flex-1 flex flex-col items-center justify-center py-3 px-6 select-none min-h-0">
          {(() => {
            const playlistVideos = youtubeData?.[playlistCategory]?.videos || [];
            const video = findVideoForWord(currentWord?.english || currentWord?.word, playlistVideos);

            return (
              <div className="flex flex-col items-center justify-center w-full max-w-sm h-full">
                <span className="text-red-500 font-mono text-xs font-black tracking-widest uppercase mb-3 flex items-center gap-1.5">
                  <span className="w-2.5 h-2.5 rounded-full bg-red-500 animate-ping"></span>
                  VİDEO İLE PEKİŞTİRME
                </span>
                
                {video ? (
                  <div className="relative w-full max-w-[200px] aspect-[9/16] rounded-2xl overflow-hidden border border-red-500/30 bg-slate-950 shadow-[0_0_25px_rgba(239,68,68,0.15)] mb-4">
                    <iframe
                      src={`https://www.youtube.com/embed/${video.id}?autoplay=1&mute=0&rel=0&loop=1`}
                      title={englishText}
                      className="absolute inset-0 w-full h-full border-0"
                      allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
                      allowFullScreen
                    />
                  </div>
                ) : (
                  <div className="w-full max-w-[200px] aspect-[9/16] rounded-2xl bg-gradient-to-tr from-slate-900 to-slate-950 border border-slate-800 flex flex-col items-center justify-center p-4 text-center mb-4">
                    <HelpCircle className="w-12 h-12 text-slate-500 mb-2 animate-pulse" />
                    <span className="text-xs text-slate-400 font-bold leading-normal">Bu kelimenin animasyonlu videosu yakında eklenecek!</span>
                  </div>
                )}

                <div className="text-center w-full mb-4">
                  <h3 className="font-bold text-white tracking-wide mb-1 leading-snug px-1 text-xl sm:text-2xl">
                    {englishText}
                  </h3>
                  <h4 className="text-emerald-400 font-extrabold text-lg">
                    {currentWord.turkish || currentWord.meaning || currentWord.translation}
                  </h4>
                </div>

                <div className="flex items-center justify-between gap-4 w-full max-w-[320px] sm:max-w-sm">
                  <button
                    type="button"
                    disabled={cardIndex === 0}
                    onClick={() => {
                      if (cardIndex > 0) setCardIndex(cardIndex - 1);
                    }}
                    className={`w-12 h-12 flex items-center justify-center bg-slate-900 text-cyan-400 rounded-2xl border border-slate-800 active:scale-90 transition-all shadow-lg ${
                      cardIndex === 0 ? "opacity-40 cursor-not-allowed" : "hover:bg-slate-850 hover:border-slate-700"
                    }`}
                    title="Önceki"
                  >
                    <ChevronLeft className="w-6 h-6" />
                  </button>

                  <button
                    type="button"
                    onClick={() => playPronunciation(currentWord)}
                    className="flex-1 h-12 flex items-center justify-center gap-2 bg-slate-900 hover:bg-slate-850 text-slate-350 font-bold rounded-2xl border border-slate-800 hover:border-slate-700 active:scale-95 transition-all shadow-lg"
                  >
                    <Volume2 className="w-5 h-5 text-cyan-400" />
                    Tekrar Dinle
                  </button>

                  <button
                    type="button"
                    onClick={() => {
                      if (cardIndex < initialDeck.length - 1) {
                        setCardIndex(cardIndex + 1);
                      } else {
                        soundManagerRef.current?.playStageClear?.();
                        setActiveScreen("victory");
                      }
                    }}
                    className="w-12 h-12 flex items-center justify-center bg-slate-900 hover:bg-slate-850 text-cyan-400 rounded-2xl border border-slate-800 hover:border-slate-700 active:scale-90 transition-all shadow-lg"
                    title={cardIndex === initialDeck.length - 1 ? "Bitir" : "Sonraki"}
                  >
                    <ChevronRight className="w-6 h-6" />
                  </button>
                </div>

                <div className="w-full max-w-[320px] sm:max-w-sm mt-3">
                  <button
                    type="button"
                    onClick={() => {
                      if (cardIndex < initialDeck.length - 1) {
                        setCardIndex(cardIndex + 1);
                      } else {
                        soundManagerRef.current?.playStageClear?.();
                        setActiveScreen("victory");
                      }
                    }}
                    className="w-full py-3.5 bg-gradient-to-r from-red-600 to-red-500 hover:from-red-500 hover:to-red-400 text-white font-extrabold text-base rounded-2xl transition-all flex items-center justify-center gap-2 active:scale-95 shadow-lg shadow-red-500/20"
                  >
                    <Check className="w-5 h-5" />
                    {cardIndex === initialDeck.length - 1 ? "Pekiştirmeyi Tamamla!" : "Sonraki Video"}
                  </button>
                </div>
              </div>
            );
          })()}
        </div>
      ) : (
        <div className="flex-1 flex flex-col items-center justify-center py-3 px-6 select-none min-h-0">

          <div
            onClick={toggleFlip}
            className="relative w-full max-w-[320px] sm:max-w-[380px] h-[300px] sm:h-[360px] cursor-pointer group"
            style={{ perspective: "1200px" }}
          >
            <div
              className="relative w-full h-full rounded-3xl border border-slate-800/80 shadow-[0_15px_40px_rgba(0,0,0,0.4)] transition-all duration-500"
              style={{
                transformStyle: "preserve-3d",
                transform: isFlipped ? "rotateY(180deg)" : "rotateY(0deg)",
              }}
            >

              <div
                className="absolute inset-0 w-full h-full rounded-3xl bg-gradient-to-b from-slate-900 to-slate-950 flex flex-col items-center justify-between p-6 overflow-hidden backface-hidden"
                style={{ backfaceVisibility: "hidden" }}
              >
                <div className="flex-1 flex items-center justify-center w-full max-h-40 sm:max-h-48 mt-2 relative">
                  {!imgError && imageId ? (
                    <img
                      src={resolveWordImageUrl(imageId)}
                      alt={englishText}
                      onError={() => setImgError(true)}
                      className="max-h-36 sm:max-h-44 w-auto object-contain rounded-2xl drop-shadow-[0_8px_16px_rgba(6,182,212,0.15)] group-hover:scale-105 transition-transform duration-300"
                    />
                  ) : (
                    <div className="w-40 h-40 bg-gradient-to-tr from-cyan-900/30 to-purple-900/30 border border-cyan-800/40 rounded-full flex items-center justify-center">
                      <HelpCircle className="w-16 h-16 text-cyan-400/80" />
                    </div>
                  )}
                </div>

                <div className="text-center w-full pb-2">
                  <h3
                    className={`font-bold text-white tracking-wide drop-shadow mb-1 font-sans leading-snug px-1 ${
                      isLongText || isSentenceCard
                        ? "text-lg sm:text-xl"
                        : "text-2xl sm:text-3xl"
                    }`}
                  >
                    {englishText}
                  </h3>

                  <button
                    type="button"
                    onClick={(e) => {
                      e.stopPropagation();
                      playPronunciation(currentWord);
                    }}
                    className="mx-auto mt-2 w-10 h-10 sm:w-12 sm:h-12 bg-cyan-500 hover:bg-cyan-400 text-slate-950 rounded-full flex items-center justify-center transition-all duration-200 active:scale-95 shadow-md shadow-cyan-500/25"
                  >
                    <Volume2 className="w-6 h-6" />
                  </button>
                </div>

                <div className="text-slate-500 font-mono text-xs flex items-center gap-1 border border-slate-800 bg-slate-950/50 px-3 py-1 rounded-full">
                  <RefreshCw className="w-3.5 h-3.5 animate-spin-slow" /> KARTI ÇEVİR
                </div>
              </div>

              <div
                className="absolute inset-0 w-full h-full rounded-3xl bg-gradient-to-b from-slate-900 to-slate-950 flex flex-col items-center justify-between p-6 overflow-hidden backface-hidden"
                style={{
                  backfaceVisibility: "hidden",
                  transform: "rotateY(180deg)",
                }}
              >
                <div className="flex-1 flex flex-col items-center justify-center text-center px-4">
                  <span className="text-cyan-400 font-mono text-sm font-bold uppercase tracking-wider mb-2">ANLAMI</span>
                  <h2
                    className={`font-extrabold text-emerald-400 drop-shadow mb-4 font-sans leading-snug ${
                      isSentenceCard ? "text-2xl sm:text-3xl" : "text-4xl sm:text-5xl"
                    }`}
                  >
                    {currentWord.turkish || currentWord.meaning || currentWord.translation}
                  </h2>
                  {currentWord.english && (
                    <span className="text-slate-500 text-base sm:text-lg italic mt-1 font-mono leading-snug">
                      "{currentWord.english}"
                    </span>
                  )}
                </div>

                <div className="text-slate-500 font-mono text-xs flex items-center gap-1 border border-slate-800 bg-slate-950/50 px-3 py-1 rounded-full">
                  <RefreshCw className="w-3.5 h-3.5" /> GÖRSELE DÖN
                </div>
              </div>

            </div>
          </div>

          <div className="flex items-center justify-between gap-4 mt-4 w-full max-w-[320px] sm:max-w-sm">
            <button
              type="button"
              onClick={handlePrevCard}
              className="w-12 h-12 flex items-center justify-center bg-slate-900 hover:bg-slate-850 text-cyan-400 rounded-2xl border border-slate-800 hover:border-slate-700 active:scale-90 transition-all shadow-lg"
              title="Önceki"
            >
              <ChevronLeft className="w-6 h-6" />
            </button>

            <button
              type="button"
              onClick={handleListenOnly}
              className="flex-1 h-12 flex items-center justify-center gap-2 bg-slate-900 hover:bg-slate-850 text-slate-355 font-bold rounded-2xl border border-slate-800 hover:border-slate-700 active:scale-95 transition-all shadow-lg"
            >
              <Volume2 className="w-5 h-5 text-cyan-400" />
              Tekrar Dinle
            </button>

            <button
              type="button"
              onClick={handleNextCard}
              className="w-12 h-12 flex items-center justify-center bg-slate-900 hover:bg-slate-850 text-cyan-400 rounded-2xl border border-slate-800 hover:border-slate-700 active:scale-90 transition-all shadow-lg"
              title="Sonraki"
            >
              <ChevronRight className="w-6 h-6" />
            </button>
          </div>

          <div className="w-full max-w-[320px] sm:max-w-sm mt-3">
            <button
              type="button"
              onClick={handleLearned}
              className="w-full py-3.5 bg-gradient-to-r from-emerald-500 to-teal-500 hover:from-emerald-400 hover:to-teal-400 text-slate-950 font-extrabold text-base rounded-2xl transition-all flex items-center justify-center gap-2 active:scale-95 shadow-lg shadow-emerald-500/20"
            >
              <Check className="w-5 h-5" />
              Öğrendim!
            </button>
          </div>

        </div>
      )}

      {activeScreen === "paused" && (
        <PauseScreen
          gameType={GAME_ID}
          onResume={() => setActiveScreen("playing")}
          onRestart={() => startSession(unitWords)}
          onExit={onExit}
        />
      )}

      {activeScreen === "victory" && (
        <VictoryScreen
          score={score}
          words={initialDeck}
          onNextLevel={handleNextRound}
          onMainMenu={onExit}
          levelId={levelId}
          langId={langId}
          currentGameType={GAME_ID}
        >
          {playlistCategory && youtubeData?.[playlistCategory] && (
            <div className="w-full max-w-sm mb-4">
              <a
                href={`https://www.youtube.com/playlist?list=${youtubeData[playlistCategory].playlistId}`}
                target="_blank"
                rel="noopener noreferrer"
                className="w-full py-3.5 bg-gradient-to-r from-red-600 to-red-500 hover:from-red-500 hover:to-red-400 text-white font-black text-sm rounded-2xl transition-all flex items-center justify-center gap-2 active:scale-95 shadow-lg shadow-red-500/20"
              >
                <Video className="w-5 h-5 fill-current text-white" />
                Videolarla YouTube'da Devam Et
              </a>
            </div>
          )}

          <div className="flex flex-col items-center w-full bg-slate-950/60 p-4 rounded-2xl border border-lime-500/30 max-h-48 overflow-y-auto">
            <h3 className="text-lime-400 mb-3 text-xs tracking-widest font-mono uppercase">
              {isSentenceCard || levelId?.includes("sentences")
                ? "ÖĞRENİLEN CÜMLELER"
                : "ÖĞRENİLEN KELİMELER"}
            </h3>
            <ul className="flex flex-wrap gap-2 justify-center">
              {learnedWords.map((wordPair, idx) => (
                <li key={idx} className="bg-slate-900 border border-slate-800 text-slate-350 px-3 py-1 rounded-lg text-xs font-mono">
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
