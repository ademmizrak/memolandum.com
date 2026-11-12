"use client";

import React, { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { Volume2, Settings, RotateCcw, Check, Sparkles, Trophy } from "lucide-react";
import { useLessonLoader } from "../../../hooks/useLessonLoader";
import { useMemolandumStore } from "../../../store/useMemolandumStore";
import { PauseScreen, VictoryScreen } from "../shared/GameOverlays";
import { SoundManager } from "../../../engines/soundManager";
import { playWordPronunciation } from "../../../lib/pronunciation";
import { createSessionProgressTracker } from "../../../lib/progress/applySessionProgress";
import { findLevelContext, findNextLevelId } from "../../../lib/learning/studyContext";
import { resolveWordImageUrl } from "../../../lib/contentCdn";
import { useLocale } from "../../../lib/i18n/LocaleProvider";

const GAME_ID = "star-cards";
const ROUND_TOTAL = 10;

function shuffle(arr) {
  const a = [...arr];
  for (let i = a.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [a[i], a[j]] = [a[j], a[i]];
  }
  return a;
}

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

/**
 * Kelime içeriğine göre reklam filmindeki gibi neşeli illüstrasyon ikonu seçer
 */
const WORD_ILLUSTRATION_POOL = [
  "🎨", "🚀", "🌈", "🎈", "⭐", "🍎", "🐶", "🐱", "🦁", "🐼",
  "🌍", "🎸", "⚽", "🏆", "📚", "✏️", "🎒", "🌞", "🍀", "🦋",
  "🐬", "🍓", "🍕", "🍦", "🚲", "✈️", "🏰", "👑", "💎", "🔮",
];

function pickWordIllustration(wordObj, idx = 0) {
  const text = String(wordObj?.english || wordObj?.word || "").toLowerCase();
  if (text.includes("apple") || text.includes("fruit")) return "🍎";
  if (text.includes("cat")) return "🐱";
  if (text.includes("dog")) return "🐶";
  if (text.includes("book") || text.includes("read") || text.includes("school")) return "📚";
  if (text.includes("pen") || text.includes("write") || text.includes("draw")) return "✏️";
  if (text.includes("sun") || text.includes("day") || text.includes("morning")) return "🌞";
  if (text.includes("star") || text.includes("night")) return "⭐";
  if (text.includes("car") || text.includes("drive")) return "🚗";
  if (text.includes("house") || text.includes("home")) return "🏡";
  if (text.includes("water") || text.includes("sea") || text.includes("swim")) return "🌊";
  if (text.includes("music") || text.includes("sing") || text.includes("song")) return "🎵";
  if (text.includes("food") || text.includes("eat")) return "🍽️";
  if (text.includes("play") || text.includes("game") || text.includes("ball")) return "⚽";
  if (text.includes("tree") || text.includes("green") || text.includes("park")) return "🌳";
  if (text.includes("bird") || text.includes("fly")) return "🐦";
  if (text.includes("fish")) return "🐠";
  if (text.includes("milk") || text.includes("drink")) return "🥛";
  if (text.includes("friend") || text.includes("hello") || text.includes("hi")) return "👋";
  if (text.includes("love") || text.includes("like") || text.includes("happy")) return "💛";

  let hash = idx * 7;
  for (let i = 0; i < text.length; i++) {
    hash = (hash * 31 + text.charCodeAt(i)) >>> 0;
  }
  return WORD_ILLUSTRATION_POOL[hash % WORD_ILLUSTRATION_POOL.length];
}

/**
 * Reklam filmindeki 3 renkli kart teması:
 * 1. Sol Kart: Altın Sarısı Çerçeve + Yeşil Onay Rozeti (✓ 11)
 * 2. Orta Kart: Mor Çerçeve + Mor Onay Rozeti (✓ 8)
 * 3. Sağ Kart: Mercan Kırmızısı Çerçeve + Kırmızı Onay Rozeti (✓ 3)
 */
const CARD_THEMES = [
  {
    key: "yellow",
    tiltClass: "-rotate-2 sm:-rotate-3",
    frameBg: "from-[#facc15] via-[#eab308] to-[#ca8a04]",
    frameBorder: "border-[#fef08a]",
    frameShadow: "shadow-[0_6px_0_#a16207,0_12px_20px_rgba(0,0,0,0.22)]",
    headerText: "text-amber-950",
    badgeBg: "from-[#22c55e] to-[#16a34a]",
    badgeBorder: "border-white",
    badgeShadow: "shadow-[0_3px_0_#15803d]",
    defaultCount: 11,
  },
  {
    key: "purple",
    tiltClass: "rotate-0 sm:-translate-y-1",
    frameBg: "from-[#a855f7] via-[#8b5cf6] to-[#6d28d9]",
    frameBorder: "border-[#e9d5ff]",
    frameShadow: "shadow-[0_6px_0_#4c1d95,0_12px_20px_rgba(0,0,0,0.22)]",
    headerText: "text-white",
    badgeBg: "from-[#8b5cf6] to-[#6d28d9]",
    badgeBorder: "border-white",
    badgeShadow: "shadow-[0_3px_0_#4c1d95]",
    defaultCount: 8,
  },
  {
    key: "red",
    tiltClass: "rotate-2 sm:rotate-3",
    frameBg: "from-[#f87171] via-[#ef4444] to-[#dc2626]",
    frameBorder: "border-[#fecaca]",
    frameShadow: "shadow-[0_6px_0_#991b1b,0_12px_20px_rgba(0,0,0,0.22)]",
    headerText: "text-white",
    badgeBg: "from-[#f97316] to-[#dc2626]",
    badgeBorder: "border-white",
    badgeShadow: "shadow-[0_3px_0_#991b1b]",
    defaultCount: 3,
  },
];

export default function StarCards({
  levelId,
  langId,
  onExit,
  onNextLevel,
  isAudioEnabled = true,
  setIsAudioEnabled,
  isFxEnabled = true,
  setIsFxEnabled,
}) {
  const { locale } = useLocale();
  const isEn = locale === "en";
  const { words, isLoading } = useLessonLoader(levelId, langId, true);
  const recordWordQuizResult = useMemolandumStore((s) => s.recordWordQuizResult);
  const setCurrentGame = useMemolandumStore((s) => s.setCurrentGame);

  const [activeScreen, setActiveScreen] = useState("playing");
  const [score, setScore] = useState(0);
  const [questionIndex, setQuestionIndex] = useState(0);
  const [roundQuestions, setRoundQuestions] = useState([]);
  const [cardCounts, setCardCounts] = useState([11, 8, 3]);
  const [selectedCardIdx, setSelectedCardIdx] = useState(null);
  const [wrongCardIdx, setWrongCardIdx] = useState(null);
  const [starBurst, setStarBurst] = useState(false);
  const [learnedWords, setLearnedWords] = useState([]);
  const [selectedUnitNo, setSelectedUnitNo] = useState(null);
  const [imgErrors, setImgErrors] = useState({});
  const [settingsOpen, setSettingsOpen] = useState(false);
  // "targetToMeaning": Beyaz tabelada yabancı kelime, 3 kartta anlam + görsel
  // "meaningToTarget": Beyaz tabelada anlam, 3 kartta yabancı kelime + görsel
  const [promptDirection, setPromptDirection] = useState("targetToMeaning");

  const soundManagerRef = useRef(null);
  const progressTrackerRef = useRef(createSessionProgressTracker(GAME_ID));
  const advanceTimerRef = useRef(null);

  useEffect(() => {
    setCurrentGame?.(GAME_ID);
    soundManagerRef.current = new SoundManager();
    return () => {
      soundManagerRef.current?.stop?.();
      if (advanceTimerRef.current) clearTimeout(advanceTimerRef.current);
    };
  }, [setCurrentGame]);

  useEffect(() => {
    if (soundManagerRef.current) {
      soundManagerRef.current.setMuted(!isFxEnabled);
      soundManagerRef.current.setAudioEnabled(isAudioEnabled);
    }
  }, [isFxEnabled, isAudioEnabled]);

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

  useEffect(() => {
    if (!hasUnitLevels) {
      setSelectedUnitNo(null);
      return;
    }
    let preferred = null;
    try {
      if (typeof window !== "undefined") {
        const q = new URLSearchParams(window.location.search).get("unit");
        if (q != null && q !== "") preferred = Number(q);
      }
      if (preferred == null) {
        const slug = findLevelContext(levelId)?.level?.slug;
        const raw =
          sessionStorage.getItem(unitStorageKey(levelId)) ??
          (slug ? sessionStorage.getItem(unitStorageKey(slug)) : null);
        if (raw != null && raw !== "") preferred = Number(raw);
      }
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

  const playPronunciation = useCallback(
    (wordObj, extraOpts = {}) => {
      if (!wordObj || !isAudioEnabled) return;
      playWordPronunciation(wordObj, { langId, levelId, ...extraOpts });
    },
    [isAudioEnabled, langId, levelId]
  );

  // 10 soruluk 3'lü kart turu oluştur
  const startNewRound = useCallback((pool) => {
    if (!pool || pool.length === 0) return;
    if (advanceTimerRef.current) clearTimeout(advanceTimerRef.current);

    const shuffledPool = shuffle(pool);
    const totalCount = Math.min(ROUND_TOTAL, Math.max(1, shuffledPool.length));
    const questions = [];

    for (let i = 0; i < totalCount; i++) {
      const target = shuffledPool[i % shuffledPool.length];
      const targetId = target.word_id || target.id || target.english;
      const distractors = shuffle(
        pool.filter((w) => (w.word_id || w.id || w.english) !== targetId)
      ).slice(0, 2);

      while (distractors.length < 2 && pool.length > 0) {
        distractors.push(pool[(i + distractors.length + 1) % pool.length]);
      }

      const options = shuffle([target, ...distractors]);
      const correctIdx = options.findIndex(
        (o) => (o.word_id || o.id || o.english) === targetId
      );

      questions.push({
        target,
        options,
        correctIdx: correctIdx >= 0 ? correctIdx : 0,
      });
    }

    setRoundQuestions(questions);
    setQuestionIndex(0);
    setSelectedCardIdx(null);
    setWrongCardIdx(null);
    setStarBurst(false);
    setCardCounts([11, 8, 3]);
    setImgErrors({});
    setActiveScreen("playing");
  }, []);

  useEffect(() => {
    if (unitWords.length > 0) {
      startNewRound(unitWords);
    }
  }, [unitWords, startNewRound]);

  const currentQuestion = roundQuestions[questionIndex] || null;

  // Yeni soru geldiğinde hedef kelimeyi otomatik seslendir
  useEffect(() => {
    if (activeScreen === "playing" && currentQuestion?.target) {
      const timer = setTimeout(() => {
        playPronunciation(currentQuestion.target, { includeMeaning: false });
      }, 220);
      return () => clearTimeout(timer);
    }
  }, [activeScreen, questionIndex, currentQuestion, playPronunciation]);

  useEffect(() => {
    if (activeScreen === "victory") {
      progressTrackerRef.current.commit({
        score: Math.max(score, 150),
        gems: Math.max(3, Math.floor(score / 150)),
      });
    }
  }, [activeScreen, score]);

  const handleSelectUnit = (uNo) => {
    setSelectedUnitNo(uNo);
    try {
      sessionStorage.setItem(unitStorageKey(levelId), String(uNo));
    } catch {
      /* ignore */
    }
  };

  const handleCardSelect = (idx) => {
    if (!currentQuestion || selectedCardIdx !== null) return;
    const isCorrect = idx === currentQuestion.correctIdx;

    if (isCorrect) {
      setSelectedCardIdx(idx);
      setWrongCardIdx(null);
      setStarBurst(true);
      // Önce neşeli kutlama sesi duyulsun, hemen ardından kelime telaffuzu okunsun
      soundManagerRef.current?.playMatch?.();
      setTimeout(() => {
        playPronunciation(currentQuestion.target, { includeMeaning: true });
      }, 240);

      setCardCounts((prev) => {
        const next = [...prev];
        next[idx] = (next[idx] || 0) + 1;
        return next;
      });
      setScore((s) => s + 150);

      const eng = currentQuestion.target.english || currentQuestion.target.word || "";
      const tr =
        currentQuestion.target.turkish ||
        currentQuestion.target.meaning ||
        currentQuestion.target.translation ||
        "";

      setLearnedWords((prev) => {
        const label = `${eng} : ${tr}`;
        return prev.includes(label) ? prev : [...prev, label];
      });

      try {
        recordWordQuizResult?.({
          word: currentQuestion.target,
          isCorrect: true,
          gameType: GAME_ID,
          langId,
          levelId,
        });
      } catch {
        /* ignore */
      }

      advanceTimerRef.current = setTimeout(() => {
        setStarBurst(false);
        setSelectedCardIdx(null);
        if (questionIndex + 1 < roundQuestions.length) {
          setQuestionIndex((q) => q + 1);
        } else {
          soundManagerRef.current?.playStageClear?.();
          setActiveScreen("victory");
        }
      }, 1250);
    } else {
      setWrongCardIdx(idx);
      // Yanlış kartta olumsuz uyarı sesi çalsın (telaffuz sesiyle bastırılmasın)
      soundManagerRef.current?.playMismatch?.();
      try {
        recordWordQuizResult?.({
          word: currentQuestion.target,
          isCorrect: false,
          gameType: GAME_ID,
          langId,
          levelId,
        });
      } catch {
        /* ignore */
      }
      setTimeout(() => {
        setWrongCardIdx(null);
      }, 550);
    }
  };

  const nextLevelExists = useMemo(() => !!findNextLevelId(langId, levelId), [langId, levelId]);

  if (isLoading) {
    return (
      <div className="w-full h-full flex items-center justify-center bg-gradient-to-b from-[#60c5f8] to-[#76c945] text-white font-black text-xl">
        ⭐ {isEn ? "Loading Star Cards..." : "Yıldız Kartlar Hazırlanıyor..."}
      </div>
    );
  }

  const totalQuestions = roundQuestions.length || ROUND_TOTAL;
  const completedCount =
    selectedCardIdx !== null ? questionIndex + 1 : Math.max(1, questionIndex + 1);
  const progressPct = Math.min(100, Math.round((completedCount / totalQuestions) * 100));

  const targetWordObj = currentQuestion?.target;
  const targetForeign = targetWordObj?.english || targetWordObj?.word || "Memolandum";
  const targetMeaning =
    targetWordObj?.turkish || targetWordObj?.meaning || targetWordObj?.translation || "";

  const bannerMainText =
    promptDirection === "targetToMeaning" ? targetForeign : targetMeaning || targetForeign;
  const isLongBanner = bannerMainText.length > 20;

  return (
    <div className="relative w-full h-full max-h-full min-h-0 flex flex-col justify-between overflow-hidden select-none rounded-none sm:rounded-2xl shadow-2xl border-0 sm:border-4 border-[#bae6fd]/80 bg-gradient-to-b from-[#5cc3f8] via-[#9be0fa] to-[#74c644]">
      {/* ================================================================= */}
      {/* REKLAM FİLMİNDEKİ 3B ALTIN YILDIZ PATLAMASI ANİMASYONU            */}
      {/* ================================================================= */}
      {starBurst && (
        <div className="pointer-events-none absolute inset-0 z-50 overflow-hidden">
          {[
            { left: "12%", top: "18%", size: "text-4xl sm:text-5xl", delay: "0ms" },
            { left: "26%", top: "8%", size: "text-5xl sm:text-6xl", delay: "60ms" },
            { left: "48%", top: "6%", size: "text-5xl sm:text-6xl", delay: "30ms" },
            { left: "72%", top: "10%", size: "text-4xl sm:text-5xl", delay: "90ms" },
            { left: "85%", top: "22%", size: "text-4xl sm:text-5xl", delay: "40ms" },
            { left: "20%", top: "42%", size: "text-3xl sm:text-4xl", delay: "80ms" },
            { left: "78%", top: "40%", size: "text-3xl sm:text-4xl", delay: "110ms" },
          ].map((st, i) => (
            <div
              key={i}
              style={{ left: st.left, top: st.top, animationDelay: st.delay }}
              className={`absolute ${st.size} animate-bounce drop-shadow-[0_6px_12px_rgba(234,179,8,0.75)]`}
            >
              ⭐
            </div>
          ))}
        </div>
      )}

      {/* ================================================================= */}
      {/* ARKA PLAN: REKLAM FİLMİNDEKİ GÜNEŞLİ GÖKYÜZÜ, BULUTLAR VE AĞAÇLAR */}
      {/* ================================================================= */}
      <div className="absolute inset-0 pointer-events-none overflow-hidden z-0">
        {/* Sol Üst ve Sağ Üst Pamuk Bulutlar */}
        <div className="absolute top-5 left-[4%] w-28 sm:w-36 h-10 sm:h-12 bg-white/90 rounded-full shadow-sm">
          <div className="absolute -top-4 left-4 w-12 sm:w-14 h-12 sm:h-14 bg-white/95 rounded-full" />
          <div className="absolute -top-6 left-12 w-14 sm:w-16 h-14 sm:h-16 bg-white/95 rounded-full" />
        </div>
        <div className="absolute top-8 right-[5%] w-28 sm:w-36 h-10 sm:h-12 bg-white/85 rounded-full shadow-sm">
          <div className="absolute -top-5 left-5 w-12 sm:w-14 h-12 sm:h-14 bg-white/90 rounded-full" />
          <div className="absolute -top-3 left-14 w-11 sm:w-13 h-11 sm:h-13 bg-white/90 rounded-full" />
        </div>

        {/* Uzak Açık Yeşil Tepeler */}
        <div className="absolute bottom-20 -left-16 w-[68%] h-40 rounded-[100%] bg-gradient-to-b from-[#9be15d] to-[#68b836]" />
        <div className="absolute bottom-16 -right-16 w-[68%] h-44 rounded-[100%] bg-gradient-to-b from-[#8bd84e] to-[#5aa82b]" />

        {/* Sol Ağaçlar (Reklam görselindeki gibi yuvarlak taçlı ağaçlar) */}
        <div className="absolute bottom-20 left-1 sm:left-4 flex items-end">
          <div className="relative flex flex-col items-center">
            <div className="w-16 sm:w-24 h-16 sm:h-24 rounded-full bg-gradient-to-b from-[#66bb6a] to-[#2e7d32] border-b-4 border-[#1b5e20] shadow-md" />
            <div className="w-12 sm:w-18 h-12 sm:h-18 rounded-full bg-gradient-to-b from-[#81c784] to-[#388e3c] -mt-12 sm:-mt-16 -ml-6 shadow" />
            <div className="w-3.5 sm:w-5 h-12 sm:h-16 bg-gradient-to-r from-[#8d6e63] to-[#5d4037] -mt-2 rounded-sm" />
          </div>
        </div>

        {/* Sağ Ağaçlar */}
        <div className="absolute bottom-20 right-1 sm:right-4 flex items-end">
          <div className="relative flex flex-col items-center">
            <div className="w-16 sm:w-24 h-16 sm:h-24 rounded-full bg-gradient-to-b from-[#66bb6a] to-[#2e7d32] border-b-4 border-[#1b5e20] shadow-md" />
            <div className="w-12 sm:w-16 h-12 sm:h-16 rounded-full bg-gradient-to-b from-[#81c784] to-[#388e3c] -mt-12 sm:-mt-14 ml-6 shadow" />
            <div className="w-3.5 sm:w-5 h-12 sm:h-16 bg-gradient-to-r from-[#8d6e63] to-[#5d4037] -mt-2 rounded-sm" />
          </div>
        </div>

        {/* Ön Plan Çimen Zemin ve Köşe Çalıları */}
        <div className="absolute bottom-0 inset-x-0 h-24 bg-gradient-to-b from-[#68b836] via-[#4e9a22] to-[#38761d]" />
        <div className="absolute -bottom-3 -left-3 w-24 h-14 rounded-full bg-[#275912]/80" />
        <div className="absolute -bottom-3 -right-3 w-24 h-14 rounded-full bg-[#275912]/80" />
      </div>

      {/* ================================================================= */}
      {/* ÜST BAR: SOL SARI GERİ BUTONU, ORTA "Memolandum" KEMER LOGO,      */}
      {/* SAĞ TURUNCU MENÜ BUTONU (REKLAM FİLMİYLE BİREBİR)                */}
      {/* ================================================================= */}
      <div className="relative z-20 flex items-start justify-between px-2.5 sm:px-6 pt-2 sm:pt-3.5 shrink-0">
        {/* Sol Üst: Sarı Yuvarlak Geri (↩) Butonu */}
        <button
          type="button"
          onClick={onExit}
          title={isEn ? "Back to Games" : "Oyunlara Dön"}
          className="w-9 h-9 sm:w-12 sm:h-12 rounded-full bg-gradient-to-b from-[#fde047] via-[#facc15] to-[#eab308] hover:from-[#fef08a] hover:to-[#facc15] border-[2.5px] sm:border-[3px] border-white shadow-[0_3px_0_#b45309,0_6px_12px_rgba(0,0,0,0.22)] flex items-center justify-center text-white active:translate-y-0.5 transition-all cursor-pointer shrink-0"
        >
          <RotateCcw className="w-4 h-4 sm:w-6 sm:h-6 stroke-[3] drop-shadow" />
        </button>

        {/* Orta Üst: Reklam Filmindeki Kemerli "Memolandum" Logosu */}
        <div className="flex flex-col items-center -mt-0.5 min-w-0 px-1">
          <div className="relative px-2 py-0.5 flex flex-col items-center">
            <h1
              className="text-xl sm:text-4xl font-black tracking-tight select-none transform -rotate-2"
              style={{
                color: "#facc15",
                WebkitTextStroke: "1.5px #312e81",
                textShadow:
                  "0 2px 0 #312e81, 0 4px 0 #1e1b4b, 0 6px 12px rgba(0,0,0,0.25)",
              }}
            >
              Memolandum
            </h1>
            {/* Logo Altındaki Gökkuşağı Kavis Şeridi */}
            <div className="w-28 sm:w-48 h-1.5 sm:h-2.5 -mt-1 rounded-full bg-gradient-to-r from-[#ef4444] via-[#facc15] to-[#3b82f6] border border-[#312e81] shadow-sm transform -rotate-1" />
          </div>

          {/* Okul Üniteleri Varsa Kompakt Ünite Seçici */}
          {hasUnitLevels && (
            <div className="flex items-center justify-start sm:justify-center gap-1 mt-1 max-w-[72vw] sm:max-w-md overflow-x-auto no-scrollbar px-1">
              {units.map(({ unitNo, unitName }) => {
                const active = unitNo === selectedUnitNo;
                return (
                  <button
                    key={unitNo}
                    type="button"
                    onClick={() => handleSelectUnit(unitNo)}
                    title={unitName}
                    className={`px-2 py-0.5 rounded-full text-[10px] font-black border transition-all cursor-pointer shrink-0 ${
                      active
                        ? "bg-[#facc15] text-indigo-950 border-white shadow"
                        : "bg-white/75 text-slate-700 border-white/60 hover:bg-white"
                    }`}
                  >
                    {isEn ? `U${unitNo}` : `Ünite ${unitNo}`}
                  </button>
                );
              })}
            </div>
          )}
        </div>

        {/* Sağ Üst: Turuncu/Altın Yuvarlak Liste/Duraklat (☰) Butonu */}
        <button
          type="button"
          onClick={() => setActiveScreen("paused")}
          title={isEn ? "Pause / Menu" : "Duraklat / Menü"}
          className="w-9 h-9 sm:w-12 sm:h-12 rounded-full bg-gradient-to-b from-[#fbbf24] via-[#f59e0b] to-[#d97706] hover:from-[#fde047] hover:to-[#f59e0b] border-[2.5px] sm:border-[3px] border-white shadow-[0_3px_0_#92400e,0_6px_12px_rgba(0,0,0,0.22)] flex flex-col items-center justify-center gap-1 text-white active:translate-y-0.5 transition-all cursor-pointer shrink-0"
        >
          <span className="w-3.5 sm:w-5 h-0.5 bg-white rounded-full shadow-sm" />
          <span className="w-3.5 sm:w-5 h-0.5 bg-white rounded-full shadow-sm" />
          <span className="w-3.5 sm:w-5 h-0.5 bg-white rounded-full shadow-sm" />
        </button>
      </div>

      {/* ================================================================= */}
      {/* ORTA ALAN: BEYAZ HEDEF KELİME TABELASI + 3 RENKLİ OYUN KARTI      */}
      {/* ================================================================= */}
      <div className="relative z-10 flex-1 flex flex-col items-center justify-center px-2 sm:px-8 py-1 min-h-0 gap-2 sm:gap-5">
        {/* Reklam Filmindeki Büyük Beyaz Hedef Kelime Tabelası + Sağ Üst Yıldız */}
        <button
          type="button"
          onClick={() => playPronunciation(targetWordObj)}
          title={isEn ? "Tap to listen" : "Sesli dinlemek için dokun"}
          className="group relative w-full max-w-[92vw] sm:max-w-[440px] bg-white hover:bg-amber-50/40 rounded-[20px] sm:rounded-[28px] px-4 sm:px-8 py-2.5 sm:py-4 border-[2.5px] sm:border-[3px] border-white shadow-[0_5px_0_#cbd5e1,0_10px_20px_rgba(0,0,0,0.16)] transform -rotate-1 transition-all active:scale-95 cursor-pointer flex items-center justify-center shrink-0"
        >
          {/* Sağ Üst Köşedeki 3B Altın Yıldız (Görseldeki gibi) */}
          <span
            className={`absolute -top-3 -right-2 sm:-top-3.5 sm:-right-3 text-xl sm:text-3xl drop-shadow-[0_4px_6px_rgba(234,179,8,0.55)] transition-transform duration-300 ${
              starBurst ? "scale-125 rotate-45" : "group-hover:scale-110 rotate-12"
            }`}
            aria-hidden="true"
          >
            ⭐
          </span>

          {/* Sol Üst Mini Hoparlör Rozeti */}
          <span className="absolute top-1.5 left-2.5 sm:top-2 sm:left-3 text-sky-500 group-hover:text-sky-600 transition-colors">
            <Volume2 className="w-3.5 h-3.5 sm:w-5 sm:h-5" />
          </span>

          <span
            className={`font-black text-[#1e293b] tracking-tight text-center leading-tight break-words px-3 ${
              isLongBanner
                ? "text-base sm:text-2xl md:text-3xl"
                : "text-xl sm:text-3xl md:text-4xl"
            }`}
          >
            {bannerMainText}
          </span>
        </button>

        {/* Reklam Filmindeki 3'lü Renkli Kart Dizilimi (Sarı · Mor · Kırmızı) */}
        <div className="w-full max-w-[600px] grid grid-cols-3 gap-1.5 sm:gap-5 items-stretch pt-1 pb-3 px-0.5 sm:px-0">
          {(currentQuestion?.options || []).slice(0, 3).map((optionObj, idx) => {
            const theme = CARD_THEMES[idx % CARD_THEMES.length];
            const optId = optionObj?.word_id || optionObj?.id || optionObj?.english || idx;
            const foreignText = optionObj?.english || optionObj?.word || "";
            const meaningText =
              optionObj?.turkish || optionObj?.meaning || optionObj?.translation || "";

            // Üst şeritte yardımcı ipucu, beyaz kart içinde ana seçenek metni + görsel
            const cardMainLabel =
              promptDirection === "targetToMeaning" ? meaningText : foreignText;
            const cardHeaderHint =
              promptDirection === "targetToMeaning"
                ? isEn
                  ? `CARD ${idx + 1}`
                  : `SEÇENEK ${idx + 1}`
                : meaningText;

            const isLongCardText = cardMainLabel.length > 18;
            const imageId = optionObj?.image_id || optionObj?.id;
            const showRealImg = imageId && !imgErrors[optId];
            const fallbackEmoji = pickWordIllustration(optionObj, idx);
            const isSelectedCorrect = selectedCardIdx === idx;
            const isWrong = wrongCardIdx === idx;
            const badgeCount = cardCounts[idx] ?? theme.defaultCount;

            return (
              <button
                key={`${optId}-${idx}`}
                type="button"
                onClick={() => handleCardSelect(idx)}
                className={`group relative flex flex-col justify-between rounded-[16px] sm:rounded-[22px] p-1 sm:p-2 bg-gradient-to-b ${theme.frameBg} border-[2.5px] sm:border-[3px] ${theme.frameBorder} ${theme.frameShadow} ${theme.tiltClass} transition-all duration-200 cursor-pointer hover:scale-[1.03] active:scale-95 min-w-0 ${
                  isSelectedCorrect ? "ring-4 ring-yellow-300 scale-105 z-20" : ""
                } ${isWrong ? "animate-bounce ring-4 ring-rose-400" : ""}`}
              >
                {/* Kart Üst Renkli Başlık Şeridi */}
                <div
                  className={`w-full px-1 py-0.5 sm:py-1 text-center font-black text-[8px] sm:text-xs tracking-wide truncate ${theme.headerText}`}
                >
                  {cardHeaderHint}
                </div>

                {/* Kart İç Beyaz Gövde (İllüstrasyon + Kelime) */}
                <div className="w-full flex-1 bg-white rounded-[11px] sm:rounded-[15px] px-1.5 sm:px-2.5 py-2 sm:py-4 flex flex-col items-center justify-center min-h-[82px] sm:min-h-[128px] shadow-inner relative overflow-hidden">
                  {showRealImg ? (
                    <img
                      src={resolveWordImageUrl(imageId)}
                      alt={foreignText}
                      onError={() =>
                        setImgErrors((prev) => ({ ...prev, [optId]: true }))
                      }
                      className="w-8 h-8 sm:w-14 sm:h-14 object-contain mb-1 sm:mb-1.5 transition-transform group-hover:scale-110 shrink-0"
                    />
                  ) : (
                    <span
                      className="text-xl sm:text-4xl mb-1 sm:mb-1.5 transition-transform group-hover:scale-110 drop-shadow-sm shrink-0"
                      aria-hidden="true"
                    >
                      {fallbackEmoji}
                    </span>
                  )}

                  <span
                    className={`font-black text-slate-800 text-center leading-tight line-clamp-3 break-words w-full ${
                      isLongCardText
                        ? "text-[10px] sm:text-sm"
                        : "text-[11px] sm:text-base"
                    }`}
                  >
                    {cardMainLabel}
                  </span>
                </div>

                {/* Kart Altındaki Onay Rozeti: Reklam görselindeki gibi (✓ 11, ✓ 8, ✓ 3) */}
                <div className="mt-1 sm:mt-1.5 -mb-3 sm:-mb-3.5 self-center z-10">
                  <span
                    className={`inline-flex items-center gap-0.5 sm:gap-1 px-2 sm:px-3.5 py-0.5 rounded-full bg-gradient-to-b ${
                      isSelectedCorrect ? "from-[#22c55e] to-[#15803d]" : theme.badgeBg
                    } border-2 ${theme.badgeBorder} ${theme.badgeShadow} text-white font-black text-[9px] sm:text-xs tracking-tight`}
                  >
                    <Check className="w-2.5 h-2.5 sm:w-3.5 sm:h-3.5 stroke-[3.5]" />
                    <span>{badgeCount}</span>
                  </span>
                </div>
              </button>
            );
          })}
        </div>
      </div>

      {/* ================================================================= */}
      {/* ALT BAR: REKLAM FİLMİNDEKİ ALTIN İLERLEME ÇUBUĞU (10/10)          */}
      {/* VE SAĞ ALT MOR AYARLAR ÇARKI (⚙️)                                */}
      {/* ================================================================= */}
      <div className="relative z-20 px-3 sm:px-8 pb-[max(0.75rem,env(safe-area-inset-bottom))] sm:pb-4 pt-1.5 flex items-center justify-between gap-2 shrink-0">
        {/* Sol Dengeleyici Boşluk (İlerleme çubuğunu tam ortalamak için) */}
        <div className="w-9 sm:w-12 shrink-0" />

        {/* Orta: Yeşil Yatak İçinde Altın Sarısı İlerleme Çubuğu (10/10) */}
        <div className="relative flex-1 max-w-[230px] sm:max-w-[340px] h-8 sm:h-11 rounded-full bg-[#2b5319]/90 border-[2.5px] sm:border-[3px] border-[#4d7c0f] shadow-[inset_0_3px_6px_rgba(0,0,0,0.45),0_4px_0_#1a360d] flex items-center p-1">
          {/* Sol Yuvarlak Altın Rozet (Dokununca hedef kelimeyi tekrar seslendirir) */}
          <button
            type="button"
            onClick={() => playPronunciation(targetWordObj)}
            title={isEn ? "Listen again" : "Tekrar dinle"}
            className="relative z-20 -ml-2 w-8 h-8 sm:w-11 sm:h-11 rounded-full bg-gradient-to-b from-[#fde047] via-[#facc15] to-[#d97706] border-[2.5px] sm:border-[3px] border-white shadow-[0_3px_0_#92400e] flex items-center justify-center text-amber-950 hover:scale-105 active:scale-95 transition-transform cursor-pointer shrink-0"
          >
            <Volume2 className="w-3.5 h-3.5 sm:w-5 sm:h-5 stroke-[2.75]" />
          </button>

          {/* Altın Doluluk Şeridi */}
          <div className="flex-1 h-full rounded-full overflow-hidden ml-1 relative flex items-center">
            <div
              className="h-full rounded-full bg-gradient-to-r from-[#facc15] via-[#fbbf24] to-[#f97316] transition-all duration-500 shadow-[0_0_12px_rgba(250,204,21,0.65)]"
              style={{ width: `${progressPct}%` }}
            />
          </div>

          {/* Ortadaki 10/10 Sayaç Yazısı */}
          <span className="absolute inset-0 flex items-center justify-center pointer-events-none text-white font-black text-[11px] sm:text-sm tracking-wider drop-shadow-[0_2px_2px_rgba(0,0,0,0.8)]">
            {completedCount}/{totalQuestions}
          </span>
        </div>

        {/* Sağ Alt: Reklam Filmindeki Mor Ayarlar Çarkı Butonu (⚙️) */}
        <div className="relative shrink-0">
          <button
            type="button"
            onClick={() => setSettingsOpen((prev) => !prev)}
            title={isEn ? "Card Settings" : "Kart Ayarları"}
            className="w-9 h-9 sm:w-12 sm:h-12 rounded-full bg-gradient-to-b from-[#a855f7] via-[#9333ea] to-[#6b21a8] hover:from-[#c084fc] hover:to-[#7e22ce] border-[2.5px] sm:border-[3px] border-white shadow-[0_3px_0_#4c1d95,0_6px_12px_rgba(0,0,0,0.28)] flex items-center justify-center text-white active:translate-y-0.5 transition-all cursor-pointer"
          >
            <Settings className="w-4 h-4 sm:w-6 sm:h-6 stroke-[2.5]" />
          </button>

          {/* Hızlı Ayarlar Balonu */}
          {settingsOpen && (
            <div className="absolute bottom-14 right-0 w-56 rounded-2xl bg-white/95 backdrop-blur-md border-2 border-purple-400 shadow-2xl p-3 text-slate-800 z-40">
              <div className="text-[11px] font-black uppercase tracking-wider text-purple-700 mb-2">
                {isEn ? "Game Settings" : "Oyun Ayarları"}
              </div>
              <button
                type="button"
                onClick={() => {
                  setPromptDirection((d) =>
                    d === "targetToMeaning" ? "meaningToTarget" : "targetToMeaning"
                  );
                  setSettingsOpen(false);
                }}
                className="w-full text-left px-2.5 py-1.5 rounded-xl bg-purple-50 hover:bg-purple-100 text-xs font-bold text-purple-950 mb-1.5 cursor-pointer transition-colors"
              >
                🔄{" "}
                {promptDirection === "targetToMeaning"
                  ? isEn
                    ? "Mode: Word → Meaning"
                    : "Yön: Kelime → Anlam"
                  : isEn
                  ? "Mode: Meaning → Word"
                  : "Yön: Anlam → Kelime"}
              </button>
              <button
                type="button"
                onClick={() => setIsAudioEnabled?.(!isAudioEnabled)}
                className="w-full text-left px-2.5 py-1.5 rounded-xl bg-slate-100 hover:bg-slate-200 text-xs font-bold text-slate-800 mb-1.5 cursor-pointer transition-colors"
              >
                {isAudioEnabled
                  ? isEn
                    ? "🔊 Voice: ON"
                    : "🔊 Seslendirme: AÇIK"
                  : isEn
                  ? "🔇 Voice: OFF"
                  : "🔇 Seslendirme: KAPALI"}
              </button>
              <button
                type="button"
                onClick={() => {
                  setSettingsOpen(false);
                  startNewRound(unitWords);
                }}
                className="w-full text-left px-2.5 py-1.5 rounded-xl bg-amber-50 hover:bg-amber-100 text-xs font-bold text-amber-900 cursor-pointer transition-colors"
              >
                ✨ {isEn ? "Shuffle New Cards" : "Yeni Kartlar Dağıt"}
              </button>
            </div>
          )}
        </div>
      </div>

      {/* DURAKLATMA EKRANI */}
      {activeScreen === "paused" && (
        <PauseScreen
          gameType={GAME_ID}
          onResume={() => setActiveScreen("playing")}
          onRestart={() => startNewRound(unitWords)}
          onExit={onExit}
        />
      )}

      {/* ZAFER EKRANI */}
      {activeScreen === "victory" && (
        <VictoryScreen
          score={score}
          words={roundQuestions.map((q) => q.target)}
          onNextLevel={() => {
            if (nextLevelExists && onNextLevel) {
              onNextLevel();
            } else {
              startNewRound(unitWords);
            }
          }}
          onMainMenu={onExit}
          levelId={levelId}
          langId={langId}
          currentGameType={GAME_ID}
        >
          <div className="flex flex-col items-center w-full bg-slate-950/60 p-4 rounded-2xl border border-amber-500/30 max-h-48 overflow-y-auto">
            <h3 className="text-amber-400 mb-3 text-xs tracking-widest font-mono uppercase">
              ⭐ {isEn ? "MASTERED STAR CARDS" : "YILDIZ KARTLARDA ÖĞRENİLENLER"} (
              {learnedWords.length})
            </h3>
            <ul className="flex flex-wrap gap-2 justify-center">
              {learnedWords.map((wordPair, idx) => (
                <li
                  key={idx}
                  className="bg-slate-900 border border-slate-800 text-slate-200 px-3 py-1 rounded-lg text-xs font-mono"
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
