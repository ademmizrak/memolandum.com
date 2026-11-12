"use client";

import React, { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { Volume2, Check, RefreshCw, Sparkles, Trophy, Play } from "lucide-react";
import { useLessonLoader } from "../../../hooks/useLessonLoader";
import { useMemolandumStore } from "../../../store/useMemolandumStore";
import { PauseScreen, VictoryScreen } from "../shared/GameOverlays";
import { SoundManager } from "../../../engines/soundManager";
import { playWordPronunciation } from "../../../lib/pronunciation";
import { containsRtlScript } from "../../../lib/i18n/arabicTextUtils";
import { createSessionProgressTracker } from "../../../lib/progress/applySessionProgress";
import { findLevelContext, findNextLevelId } from "../../../lib/learning/studyContext";
import { resolveWordImageUrl } from "../../../lib/contentCdn";

const GAME_ID = "word-board";
const BOARD_SIZE = 8; // Reklam görselindeki gibi 4x2 (8 kartlık) ahşap pano

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
 * Reklam filmindeki gibi kelimenin sesli harflerini / hecelerini neşeli renklerle vurgular
 */
function renderColoredWord(text = "") {
  const str = String(text || "");
  if (containsRtlScript(str)) {
    return (
      <span dir="rtl" className="font-sans tracking-normal">
        {str}
      </span>
    );
  }
  const vowels = new Set([
    "a", "e", "i", "o", "u", "A", "E", "I", "O", "U",
    "á", "à", "â", "ã", "é", "ê", "í", "ó", "ô", "õ", "ú", "ü", "ı", "ö",
    "Á", "À", "Â", "Ã", "É", "Ê", "Í", "Ó", "Ô", "Õ", "Ú", "Ü", "İ", "Ö",
  ]);
  const colors = ["#e11d48", "#d97706", "#16a34a", "#2563eb", "#9333ea"];
  let colorIdx = 0;

  return str.split("").map((ch, idx) => {
    if (vowels.has(ch)) {
      const c = colors[colorIdx % colors.length];
      colorIdx += 1;
      return (
        <span key={idx} style={{ color: c }}>
          {ch}
        </span>
      );
    }
    return <span key={idx}>{ch}</span>;
  });
}

const TITLE_LETTERS = [
  { ch: "M", color: "#fbbf24" },
  { ch: "e", color: "#fde047" },
  { ch: "m", color: "#fb923c" },
  { ch: "o", color: "#4ade80" },
  { ch: "l", color: "#38bdf8" },
  { ch: "a", color: "#60a5fa" },
  { ch: "n", color: "#f472b6" },
  { ch: "d", color: "#fb7185" },
  { ch: "u", color: "#c084fc" },
  { ch: "m", color: "#a3e635" },
];

export default function WordBoard({
  levelId,
  langId,
  onExit,
  onNextLevel,
  isAudioEnabled = true,
  setIsAudioEnabled,
  isFxEnabled = true,
  setIsFxEnabled,
  onSwitchToFlipCard,
}) {
  const { words, isLoading } = useLessonLoader(levelId, langId, true);
  const recordWordQuizResult = useMemolandumStore((s) => s.recordWordQuizResult);
  const setCurrentGame = useMemolandumStore((s) => s.setCurrentGame);

  const [activeScreen, setActiveScreen] = useState("playing");
  const [coins, setCoins] = useState(30); // Reklamdaki gibi 30 altınla başlar, bildikçe artar
  const [score, setScore] = useState(0);
  const [boardWords, setBoardWords] = useState([]);
  const [checkedIds, setCheckedIds] = useState({});
  const [revealedIds, setRevealedIds] = useState({});
  const [targetWordId, setTargetWordId] = useState(null);
  const [wrongShakeId, setWrongShakeId] = useState(null);
  const [buddyMessage, setBuddyMessage] = useState("Kartlara dokun, sesi dinle ve hedef kelimeyi bul!");
  const [learnedWords, setLearnedWords] = useState([]);
  const [selectedUnitNo, setSelectedUnitNo] = useState(null);
  const [roundNumber, setRoundNumber] = useState(1);
  const [imgErrors, setImgErrors] = useState({});

  const soundManagerRef = useRef(null);
  const progressTrackerRef = useRef(createSessionProgressTracker(GAME_ID));
  const sessionCompletedRef = useRef(new Set());

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
    (wordObj) => {
      if (!wordObj || !isAudioEnabled) return;
      playWordPronunciation(wordObj, { langId, levelId });
    },
    [isAudioEnabled, langId, levelId]
  );

  // Yeni 8'li ahşap pano turu başlat
  const startBoardRound = useCallback(
    (pool, resetAll = false) => {
      if (!pool?.length) return;
      if (resetAll) {
        sessionCompletedRef.current = new Set();
        setLearnedWords([]);
        setRoundNumber(1);
      }

      const unplayed = pool.filter((w) => !sessionCompletedRef.current.has(w.word_id || w.id || w.english));
      const source = unplayed.length >= 4 ? unplayed : pool;
      const picked = shuffle(source).slice(0, Math.min(BOARD_SIZE, pool.length));

      setBoardWords(picked);
      setCheckedIds({});
      setRevealedIds({});
      setImgErrors({});
      setActiveScreen("playing");

      if (picked.length > 0) {
        const firstTarget = picked[0];
        const tId = firstTarget.word_id || firstTarget.id || firstTarget.english;
        setTargetWordId(tId);
        const trMeaning = firstTarget.turkish || firstTarget.meaning || firstTarget.translation || "";
        setBuddyMessage(`🎯 Bul bakalım: "${trMeaning}" hangisi?`);
      }
    },
    []
  );

  useEffect(() => {
    if (unitWords.length > 0) {
      startBoardRound(unitWords, true);
    }
  }, [unitWords, startBoardRound]);

  useEffect(() => {
    if (activeScreen === "victory") {
      progressTrackerRef.current.commit({
        score: Math.max(score, 100),
        gems: Math.max(2, Math.floor(coins / 15)),
      });
    }
  }, [activeScreen, score, coins]);

  const handleSelectUnit = (uNo) => {
    setSelectedUnitNo(uNo);
    try {
      sessionStorage.setItem(unitStorageKey(levelId), String(uNo));
    } catch {
      /* ignore */
    }
  };

  // Karta tıklandığında hem sesi okur hem de hedef kelimeyse (veya keşif dokunuşuysa) ✓ işaretler
  const handleCardTap = (wordObj) => {
    if (!wordObj) return;
    const wId = wordObj.word_id || wordObj.id || wordObj.english;
    const eng = wordObj.english || wordObj.word || "";
    const tr = wordObj.turkish || wordObj.meaning || wordObj.translation || "";

    // Her dokunuşta kelimenin İngilizce telaffuzunu seslendir
    playPronunciation(wordObj);

    // Zaten tamamlanmış bir kartsa sadece anlamını tekrar göster ve seslendir
    if (checkedIds[wId]) {
      setRevealedIds((prev) => ({ ...prev, [wId]: !prev[wId] }));
      setBuddyMessage(`👏 "${eng}" = ${tr}`);
      return;
    }

    // Eğer aktif hedef kelime buysa VEYA kullanıcı kartı ikinci kez çevirip öğrendiyse ✓ olarak işaretle
    const isTargetMatch = targetWordId === wId;
    const wasAlreadyRevealed = !!revealedIds[wId];

    if (isTargetMatch || wasAlreadyRevealed) {
      soundManagerRef.current?.playMatch?.();
      const nextChecked = { ...checkedIds, [wId]: true };
      setCheckedIds(nextChecked);
      setRevealedIds((prev) => ({ ...prev, [wId]: true }));
      setCoins((c) => c + 10);
      setScore((s) => s + 125);

      // Kalıcı hafıza (Memolandum Pulse & Veli Karnesi) kaydı
      sessionCompletedRef.current.add(wId);
      try {
        recordWordQuizResult?.({
          word: wordObj,
          isCorrect: true,
          gameType: GAME_ID,
          langId,
          levelId,
        });
      } catch {
        /* ignore */
      }

      setLearnedWords((prev) => {
        const label = `${eng} : ${tr}`;
        return prev.includes(label) ? prev : [...prev, label];
      });

      // Panoda kalan tamamlanmamış kart var mı?
      const remaining = boardWords.filter((item) => {
        const id = item.word_id || item.id || item.english;
        return !nextChecked[id];
      });

      if (remaining.length > 0) {
        const nextTarget = remaining[Math.floor(Math.random() * remaining.length)];
        const nextId = nextTarget.word_id || nextTarget.id || nextTarget.english;
        const nextTr = nextTarget.turkish || nextTarget.meaning || nextTarget.translation || "";
        setTargetWordId(nextId);
        setBuddyMessage(`Harika! ✓ Şimdi bul: "${nextTr}" hangisi?`);
      } else {
        setTargetWordId(null);
        soundManagerRef.current?.playStageClear?.();
        setBuddyMessage("🎉 Muhteşem! Panodaki tüm kelimeleri tamamladın!");
      }
    } else {
      // İlk dokunuşta kartın anlamını ipucu olarak aç, hedef kelimeyi hatırlat
      soundManagerRef.current?.playMismatch?.();
      setRevealedIds((prev) => ({ ...prev, [wId]: true }));
      setWrongShakeId(wId);
      setTimeout(() => setWrongShakeId(null), 450);
      const targetObj = boardWords.find((b) => (b.word_id || b.id || b.english) === targetWordId);
      const targetTr = targetObj?.turkish || targetObj?.meaning || targetObj?.translation || tr;
      setBuddyMessage(`💡 "${eng}" = ${tr}. Tekrar dokunursan ✓ olur! (Hedef: "${targetTr}")`);
    }
  };

  const completedCountOnBoard = Object.keys(checkedIds).length;
  const allBoardCompleted = boardWords.length > 0 && completedCountOnBoard >= boardWords.length;

  const handleGreenActionBtn = () => {
    if (allBoardCompleted) {
      if (roundNumber >= 2) {
        setActiveScreen("victory");
      } else {
        setRoundNumber((r) => r + 1);
        startBoardRound(unitWords, false);
      }
    } else {
      // Henüz bitmediyse sıradaki hedef kelimeyi seslendir veya yeni dizilim getir
      const targetObj = boardWords.find((b) => (b.word_id || b.id || b.english) === targetWordId);
      if (targetObj) {
        playPronunciation(targetObj);
        const tr = targetObj.turkish || targetObj.meaning || targetObj.translation || "";
        setBuddyMessage(`🔊 İpucu sesi çalındı! "${tr}" kelimesini seç!`);
      } else {
        startBoardRound(unitWords, false);
      }
    }
  };

  const nextLevelExists = useMemo(() => !!findNextLevelId(langId, levelId), [langId, levelId]);

  if (isLoading) {
    return (
      <div className="w-full h-full flex items-center justify-center bg-sky-200 text-sky-900 font-black text-xl">
        🌳 Kelime Panosu Hazırlanıyor...
      </div>
    );
  }

  return (
    <div className="relative w-full h-full max-h-full min-h-0 flex flex-col justify-between overflow-hidden select-none rounded-none sm:rounded-2xl shadow-2xl border-0 sm:border-4 border-sky-300/60 bg-gradient-to-b from-[#7dd3fc] via-[#bae6fd] to-[#86efac]">
      {/* ================================================================= */}
      {/* ARKA PLAN: GÜNEŞLİ GÖKYÜZÜ, BULUTLAR, YEŞİL TEPELER, AĞAÇLAR     */}
      {/* ================================================================= */}
      <div className="absolute inset-0 pointer-events-none overflow-hidden z-0">
        {/* Yüzen Beyaz Bulutlar */}
        <div className="absolute top-6 left-[6%] w-28 h-10 bg-white/85 rounded-full blur-[0.5px] shadow-sm">
          <div className="absolute -top-4 left-4 w-12 h-12 bg-white/90 rounded-full" />
          <div className="absolute -top-5 left-11 w-14 h-14 bg-white/90 rounded-full" />
        </div>
        <div className="absolute top-10 right-[8%] w-32 h-11 bg-white/80 rounded-full shadow-sm">
          <div className="absolute -top-5 left-5 w-14 h-14 bg-white/90 rounded-full" />
          <div className="absolute -top-3 left-14 w-12 h-12 bg-white/90 rounded-full" />
        </div>

        {/* Sol ve Sağ Arka Plan Ağaçları */}
        <div className="hidden sm:block absolute bottom-28 left-3">
          <div className="w-20 h-20 rounded-full bg-[#4ade80] border-b-4 border-[#22c55e] shadow-inner" />
          <div className="w-16 h-16 rounded-full bg-[#22c55e] -mt-12 -ml-3" />
          <div className="w-4 h-14 bg-[#92400e] mx-auto -mt-2 rounded-sm" />
        </div>
        <div className="hidden sm:block absolute bottom-28 right-4">
          <div className="w-16 h-16 rounded-full bg-[#4ade80] border-b-4 border-[#22c55e]" />
          <div className="w-14 h-14 rounded-full bg-[#22c55e] -mt-10 ml-4" />
          <div className="w-3.5 h-12 bg-[#92400e] mx-auto -mt-2 rounded-sm" />
        </div>

        {/* Yeşil Çimen Tepeleri */}
        <div className="absolute -bottom-16 -left-16 w-[70%] h-44 rounded-[100%] bg-gradient-to-b from-[#84cc16] to-[#4d7c0f]" />
        <div className="absolute -bottom-14 -right-16 w-[75%] h-44 rounded-[100%] bg-gradient-to-b from-[#65a30d] to-[#3f6212]" />
        <div className="absolute bottom-0 inset-x-0 h-20 bg-gradient-to-b from-[#65a30d] to-[#365314]" />

        {/* Çiçek Detayları */}
        <div className="absolute bottom-4 left-6 text-lg">🌼🌿🌸</div>
        <div className="absolute bottom-4 right-6 text-lg">🌸🌿🌼</div>
      </div>

      {/* ================================================================= */}
      {/* ÜST BAR: SOLDA MAVİ EV (🏠), ORTADA ZİNCİRLİ AHŞAP TABELA,        */}
      {/* SAĞDA ALTIN SAYACI (🪙 30) VE KIRMIZI KAPAT (✖) BUTONU           */}
      {/* ================================================================= */}
      <div className="relative z-20 flex items-start justify-between px-3 sm:px-6 pt-2.5 sm:pt-3">
        {/* Sol: Mavi Yuvarlak Ev Butonu + Tekli Kart Geçişi */}
        <div className="flex items-center gap-2">
          <button
            type="button"
            onClick={onExit}
            title="Oyun Menüsüne Dön"
            className="w-11 h-11 sm:w-12 sm:h-12 rounded-full bg-gradient-to-b from-[#38bdf8] to-[#0284c7] hover:from-[#7dd3fc] hover:to-[#0369a1] border-[3px] border-white shadow-[0_4px_0_#075985,0_6px_12px_rgba(0,0,0,0.25)] flex items-center justify-center text-white active:translate-y-0.5 transition-all cursor-pointer"
          >
            <svg viewBox="0 0 24 24" fill="currentColor" className="w-6 h-6 drop-shadow">
              <path d="M12 3l9 8h-3v9h-5v-6h-2v6H6v-9H3l9-8z" />
            </svg>
          </button>

          {onSwitchToFlipCard && (
            <button
              type="button"
              onClick={onSwitchToFlipCard}
              className="px-2.5 py-1.5 rounded-full bg-white/90 hover:bg-white text-sky-900 border-2 border-sky-400 shadow font-black text-[11px] sm:text-xs cursor-pointer transition-all"
              title="Büyük Tekli Çevirme Kartı Moduna Geç"
            >
              🎴 Tekli Kart
            </button>
          )}
        </div>

        {/* Orta: Zincirle Asılı Ahşap "Memolandum Vocabulary" Tabelası */}
        <div className="relative flex flex-col items-center -mt-1">
          {/* Asma Zincirleri */}
          <div className="flex justify-between w-28 sm:w-36 px-4 -mb-1 pointer-events-none">
            <div className="w-1.5 h-4 sm:h-5 bg-gradient-to-b from-slate-500 to-slate-700 rounded-full border border-white/40" />
            <div className="w-1.5 h-4 sm:h-5 bg-gradient-to-b from-slate-500 to-slate-700 rounded-full border border-white/40" />
          </div>

          {/* Ahşap Tabela Gövdesi */}
          <div className="px-4 sm:px-7 py-1.5 sm:py-2 rounded-2xl bg-gradient-to-b from-[#b45309] via-[#92400e] to-[#78350f] border-[3px] border-[#451a03] shadow-[0_5px_0_#451a03,0_8px_16px_rgba(0,0,0,0.3)] text-center relative">
            {/* Çivi Detayları */}
            <span className="absolute top-1.5 left-2 w-2 h-2 rounded-full bg-amber-200/80 border border-amber-950" />
            <span className="absolute top-1.5 right-2 w-2 h-2 rounded-full bg-amber-200/80 border border-amber-950" />

            <div className="text-lg sm:text-2xl font-black tracking-wide leading-none drop-shadow-[0_2px_0_#451a03]">
              {TITLE_LETTERS.map((item, i) => (
                <span
                  key={i}
                  style={{
                    color: item.color,
                    textShadow: "0 2px 0 #451a03, -1px -1px 0 #451a03, 1px -1px 0 #451a03",
                  }}
                >
                  {item.ch}
                </span>
              ))}
            </div>
            <div className="text-[11px] sm:text-sm font-black text-white tracking-wider leading-tight mt-0.5 drop-shadow-[0_1.5px_0_#451a03]">
              Vocabulary
            </div>
          </div>
        </div>

        {/* Sağ: Altın Sayacı (🪙 30) & Kırmızı Kapat/Duraklat (✖) */}
        <div className="flex items-center gap-1.5 sm:gap-2">
          <div className="flex items-center gap-1.5 bg-[#334155]/95 border-2 border-white/80 rounded-full pl-1.5 pr-3 py-1 shadow-[0_3px_0_#0f172a]">
            <span className="w-6 h-6 sm:w-7 sm:h-7 rounded-full bg-gradient-to-b from-[#fde047] to-[#eab308] border-2 border-[#fef08a] flex items-center justify-center text-xs sm:text-sm font-black text-amber-950 shadow-inner">
              ★
            </span>
            <span className="text-white font-black text-xs sm:text-base font-mono tracking-tight">
              {coins}
            </span>
          </div>

          <button
            type="button"
            onClick={() => setActiveScreen("paused")}
            title="Duraklat / Menü"
            className="w-10 h-10 sm:w-11 sm:h-11 rounded-full bg-gradient-to-b from-[#fb7185] to-[#e11d48] hover:from-[#fda4af] hover:to-[#be123c] border-[3px] border-white shadow-[0_4px_0_#881337,0_6px_12px_rgba(0,0,0,0.25)] flex items-center justify-center text-white font-black text-lg active:translate-y-0.5 transition-all cursor-pointer"
          >
            ✕
          </button>
        </div>
      </div>

      {/* Ünite Seçici (Varsa Kompakt Şerit) */}
      {hasUnitLevels && (
        <div className="relative z-20 flex items-center justify-center gap-1.5 px-3 mt-1 overflow-x-auto no-scrollbar">
          {units.map(({ unitNo, unitName }) => {
            const active = unitNo === selectedUnitNo;
            return (
              <button
                key={unitNo}
                type="button"
                onClick={() => handleSelectUnit(unitNo)}
                className={`px-2.5 py-0.5 rounded-full text-[11px] font-black border-2 transition-all cursor-pointer shrink-0 ${
                  active
                    ? "bg-amber-400 text-amber-950 border-white shadow"
                    : "bg-white/80 text-slate-700 border-white/60 hover:bg-white"
                }`}
                title={unitName}
              >
                Ünite {unitNo}
              </button>
            );
          })}
        </div>
      )}

      {/* ================================================================= */}
      {/* ORTA ALAN: AHŞAP ÇERÇEVELİ PARŞÖMEN TAHTA & 8 KART IZGARASI       */}
      {/* ================================================================= */}
      <div className="relative z-10 flex-1 flex flex-col items-center justify-center px-2.5 sm:px-8 py-1 min-h-0">
        {/* Konuşma Balonu / Hedef Kelime Yönergesi */}
        <div className="mb-1.5 sm:mb-2 px-3.5 py-1 rounded-full bg-white/95 border-2 border-amber-400 shadow-md flex items-center gap-2 max-w-md text-center">
          <span className="text-xs sm:text-sm font-black text-slate-800 truncate">
            {buddyMessage}
          </span>
          {targetWordId && (
            <button
              type="button"
              onClick={() => {
                const targetObj = boardWords.find(
                  (b) => (b.word_id || b.id || b.english) === targetWordId
                );
                if (targetObj) playPronunciation(targetObj);
              }}
              className="p-1 rounded-full bg-sky-100 hover:bg-sky-200 text-sky-700 shrink-0 cursor-pointer"
              title="Hedef kelimeyi sesli dinle"
            >
              <Volume2 className="w-3.5 h-3.5" />
            </button>
          )}
        </div>

        {/* Ahşap Çerçeveli Parşömen Pano */}
        <div className="relative w-full max-w-[600px] rounded-[26px] bg-gradient-to-b from-[#d97706] via-[#b45309] to-[#92400e] p-2.5 sm:p-3.5 border-[3px] border-[#78350f] shadow-[0_8px_0_#78350f,0_14px_28px_rgba(0,0,0,0.3)]">
          {/* Sol Üst Köşedeki Sevimli Sarı Maskot (Reklamdaki gibi) */}
          <div
            className="absolute -top-5 -left-2 sm:-left-3 z-20 w-10 h-10 sm:w-11 sm:h-11 rounded-2xl bg-gradient-to-b from-[#fde047] to-[#facc15] border-2 border-[#854d0e] shadow-md flex items-center justify-center text-lg sm:text-xl transform -rotate-6"
            aria-hidden="true"
          >
            🐥
          </div>

          {/* Sağ Üst Köşedeki Altın Yıldız Rozeti (Reklamdaki gibi) */}
          <div
            className="absolute -top-4 -right-2 sm:-right-3 z-20 w-10 h-10 sm:w-11 sm:h-11 rounded-full bg-gradient-to-b from-[#fef08a] to-[#f59e0b] border-2 border-[#92400e] shadow-md flex items-center justify-center text-lg sm:text-xl transform rotate-12"
            aria-hidden="true"
          >
            ⭐
          </div>

          {/* İç Krem Parşömen Zemin */}
          <div className="relative w-full rounded-[18px] bg-[#fdf8e7] border-2 border-[#e7d8b1] p-2 sm:p-4 shadow-inner">
            {/* 8 Kartlık Izgara (Mobil dikeyde 2x4 geniş okunaklı, yatay ve tablet/masaüstünde 4x2) */}
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-1.5 sm:gap-3">
              {boardWords.map((item, idx) => {
                const wId = item.word_id || item.id || item.english || idx;
                const eng = item.english || item.word || "";
                const tr = item.turkish || item.meaning || item.translation || "";
                const imageId = item.image_id || item.id;
                const isChecked = !!checkedIds[wId];
                const isRevealed = !!revealedIds[wId];
                const isShaking = wrongShakeId === wId;

                return (
                  <button
                    key={wId}
                    type="button"
                    onClick={() => handleCardTap(item)}
                    className={`group relative rounded-xl sm:rounded-2xl p-1.5 sm:p-2.5 flex flex-col items-center justify-between min-h-[62px] sm:min-h-[96px] border-2 transition-all cursor-pointer active:scale-95 min-w-0 ${
                      isChecked
                        ? "bg-white border-[#4ade80] shadow-[0_3px_0_#86efac]"
                        : isRevealed
                        ? "bg-amber-50/90 border-amber-300 shadow-[0_3px_0_#fcd34d]"
                        : "bg-white hover:bg-sky-50/40 border-[#cbd5e1] shadow-[0_3px_0_#cbd5e1]"
                    } ${isShaking ? "animate-bounce" : ""}`}
                  >
                    {/* Sağ Üst Mini Ses İkonu */}
                    <span className="self-end text-[10px] text-slate-400 group-hover:text-sky-600">
                      🔊
                    </span>

                    {/* İlk kartta veya resimli kartlarda küçük görsel/illüstrasyon + renkli kelime */}
                    <div className="my-auto text-center px-0.5 w-full">
                      {imageId && !imgErrors[wId] && idx === 4 ? (
                        <img
                          src={resolveWordImageUrl(imageId)}
                          alt={eng}
                          onError={() =>
                            setImgErrors((prev) => ({ ...prev, [wId]: true }))
                          }
                          className="w-8 h-8 sm:w-10 sm:h-10 object-contain mx-auto mb-0.5"
                        />
                      ) : null}

                      <div className="text-xs sm:text-lg font-black text-slate-800 tracking-tight leading-tight break-words">
                        {renderColoredWord(eng)}
                      </div>

                      {(isRevealed || isChecked) && (
                        <div className="text-[10px] sm:text-xs font-extrabold text-emerald-700 leading-tight mt-0.5 truncate">
                          {tr}
                        </div>
                      )}
                    </div>

                    {/* Alt Yeşil Onay Tiki (Reklamdaki gibi her kartın altında ✓) */}
                    <div className="mt-1 h-4 sm:h-5 flex items-center justify-center">
                      {isChecked ? (
                        <span className="inline-flex items-center justify-center w-4 h-4 sm:w-5 sm:h-5 rounded-full bg-emerald-100 text-[#22c55e] font-black text-xs sm:text-sm">
                          ✓
                        </span>
                      ) : (
                        <span className="inline-flex items-center justify-center text-[#86efac] font-black text-xs opacity-60 group-hover:opacity-100">
                          ✓
                        </span>
                      )}
                    </div>
                  </button>
                );
              })}
            </div>

            {/* Parşömen Sağ Alt Kıvrım Detayı (Reklamdaki gibi) */}
            <div
              className="absolute bottom-0 right-0 w-6 h-6 bg-gradient-to-tl from-[#d6c394] via-[#efe4c6] to-transparent rounded-tl-lg pointer-events-none"
              aria-hidden="true"
            />
          </div>

          {/* Sol Alt Neşeli Okul Çantalı Çocuk Karakteri (Reklamdaki gibi) */}
          <div className="hidden sm:flex flex-col items-center absolute -bottom-6 -left-12 z-20 pointer-events-none">
            <div className="w-16 h-16 rounded-2xl bg-white/95 border-[3px] border-amber-500 shadow-lg flex items-center justify-center text-4xl">
              👦🏻
            </div>
            <span className="mt-0.5 px-2 py-0.5 rounded-full bg-amber-500 text-slate-950 font-black text-[10px] shadow">
              🎒 Öğrenci
            </span>
          </div>

          {/* Sağ Alt Sevimli Taçlı Mavi Arkadaş Karakteri (Reklamdaki gibi) */}
          <div className="hidden sm:flex flex-col items-center absolute -bottom-6 -right-12 z-20 pointer-events-none">
            <div className="w-16 h-16 rounded-2xl bg-[#94a3b8] border-[3px] border-white shadow-lg flex flex-col items-center justify-center relative">
              <span className="text-xs -mt-2">👑</span>
              <span className="text-2xl leading-none">👾</span>
            </div>
            <span className="mt-0.5 px-2 py-0.5 rounded-full bg-sky-600 text-white font-black text-[10px] shadow">
              Kanka
            </span>
          </div>
        </div>
      </div>

      {/* ================================================================= */}
      {/* ALT BAR: PARLAK YEŞİL 3D BUTON (REKLAMDAKİ GİBİ ORTADA)          */}
      {/* ================================================================= */}
      <div className="relative z-20 pb-3 sm:pb-4 pt-1 flex items-center justify-center gap-3 px-4">
        <button
          type="button"
          onClick={handleGreenActionBtn}
          className="min-w-[180px] sm:min-w-[220px] px-7 py-2.5 sm:py-3 rounded-full bg-gradient-to-b from-[#84cc16] via-[#65a30d] to-[#4d7c0f] hover:from-[#a3e635] hover:to-[#65a30d] text-white font-black text-sm sm:text-lg tracking-wider uppercase border-[3px] border-white shadow-[0_5px_0_#365314,0_10px_20px_rgba(0,0,0,0.3)] active:translate-y-0.5 transition-all cursor-pointer flex items-center justify-center gap-2"
        >
          {allBoardCompleted ? (
            <>
              <Trophy className="w-5 h-5" />
              <span>SONRAKİ TUR</span>
            </>
          ) : (
            <>
              <Volume2 className="w-5 h-5" />
              <span>TEKRARLA ({completedCountOnBoard}/{boardWords.length})</span>
            </>
          )}
        </button>

        <button
          type="button"
          onClick={() => startBoardRound(unitWords, false)}
          title="Yeni 8 Kelime Getir"
          className="px-3.5 py-2.5 sm:py-3 rounded-full bg-white/90 hover:bg-white text-emerald-900 font-black text-xs sm:text-sm border-2 border-white shadow-md active:translate-y-0.5 transition-all cursor-pointer flex items-center gap-1"
        >
          <RefreshCw className="w-4 h-4" />
          <span className="hidden sm:inline">Yeni Pano</span>
        </button>
      </div>

      {/* DURAKLATMA EKRANI */}
      {activeScreen === "paused" && (
        <PauseScreen
          gameType={GAME_ID}
          onResume={() => setActiveScreen("playing")}
          onRestart={() => startBoardRound(unitWords, true)}
          onExit={onExit}
        />
      )}

      {/* ZAFER EKRANI */}
      {activeScreen === "victory" && (
        <VictoryScreen
          score={score}
          words={boardWords}
          onNextLevel={() => {
            if (nextLevelExists && onNextLevel) {
              onNextLevel();
            } else {
              startBoardRound(unitWords, true);
            }
          }}
          onMainMenu={onExit}
          levelId={levelId}
          langId={langId}
          currentGameType={GAME_ID}
        >
          <div className="flex flex-col items-center w-full bg-slate-950/60 p-4 rounded-2xl border border-lime-500/30 max-h-48 overflow-y-auto">
            <h3 className="text-lime-400 mb-3 text-xs tracking-widest font-mono uppercase">
              PANODA ÖĞRENİLEN KELİMELER ({learnedWords.length})
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
