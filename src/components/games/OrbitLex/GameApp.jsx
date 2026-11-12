"use client";

import "./orbitlex.css";
import React, { useCallback, useEffect, useMemo, useRef, useState } from "react";
import {
  Flag,
  Pause,
  Volume2,
  VolumeX,
  Volume1,
  ChevronLeft,
  RotateCcw,
  Star,
  Sparkles,
  BookOpen,
  Layers,
  Flame,
  HelpCircle
} from "lucide-react";
import { createGame } from "./game/sim";
import { HOLD_180_MS } from "./game/input";
import { loadSprites } from "./game/sprites";
import { LEVELS, levelWord, nextLevelId as stockNext } from "./game/levels";
import { LEXICON, resolveEnglishSynonymsAndAntonyms } from "./game/lexicon";
import { isUnlocked, loadSave, markComplete, setSaveKey, writeSave } from "./game/save";
import { unlockAudio } from "./game/audio";
import { speakTts } from "../../../lib/pronunciation";
import {
  fireCanvasReadyAnalytics,
  fireGuaranteedLevelEnd,
} from "../../../hooks/useAnalytics";
import { useMemolandumStore } from "../../../store/useMemolandumStore";
import {
  TextlessOnboardingHint,
  getNextLevelHookCopy,
} from "../shared/TextlessOnboardingHint";

function easeInOutCubic(t) {
  return t < 0.5 ? 4 * t * t * t : 1 - (-2 * t + 2) ** 3 / 2;
}

const emptyHud = {
  word: "",
  definition: "",
  definitionTr: "",
  mode: "synonyms",
  coins: 0,
  totalCoins: 0,
  diamonds: 0,
  totalDiamonds: 0,
  tokens: [],
  synonyms: [],
  antonyms: [],
  popped: null,
  flies: [],
  flagReady: false,
  stars: 0,
  won: false,
  time: 0,
  muted: false
};

function slug(s) {
  return (
    String(s || "word")
      .toLowerCase()
      .replace(/[^a-z0-9]+/g, "-")
      .replace(/^-|-$/g, "") || "word"
  );
}

function asEntry(w) {
  const resolved = resolveEnglishSynonymsAndAntonyms(w);
  const wordText = String(w.word || w.english || w.original_script || "WORD").toUpperCase();
  return {
    id: w.id ?? slug(wordText),
    word: wordText,
    definition: String(w.definition || w.english_definition || "Academic term"),
    definitionTr: String(w.definitionTr || w.turkish || w.meaning || ""),
    synonyms: resolved.synonyms,
    antonyms: resolved.antonyms
  };
}

export function GameApp({
  words,
  word,
  assetBase = "/sprites",
  storageKey = "orbit-lex-v1",
  className = "",
  showMenu,
  onComplete,
  onNextLevel,
  onExit,
  isAudioEnabled = true,
  setIsAudioEnabled
} = {}) {
  const menu = showMenu ?? !word;

  const catalog = useMemo(() => {
    const list = words?.length ? words : word ? [word] : null;
    if (!list) return null;
    const entries = list.map(asEntry);
    const built = entries.map((w, i) => ({
      ...LEVELS[i % LEVELS.length],
      id: `c-${w.id}`,
      wordId: w.id
    }));
    return {
      entries,
      levels: built
    };
  }, [words, word]);

  const levels = catalog?.levels ?? LEVELS;
  const lexicon = catalog?.entries ?? LEXICON;

  function wordOf(lv) {
    if (catalog) {
      return (
        catalog.entries.find((e) => e.id === lv.wordId) ?? catalog.entries[0]
      );
    }
    return levelWord(lv);
  }

  const canvasRef = useRef(null);
  const gameRef = useRef(null);
  const spritesRef = useRef(null);

  const [screen, setScreen] = useState(menu ? "title" : "play");
  const [levelId, setLevelId] = useState(() => (catalog?.levels?.[0]?.id ?? LEVELS[0].id));

  // Catalog veya words değiştiğinde levelId senkronizasyonu
  useEffect(() => {
    if (catalog?.levels?.length) {
      setLevelId((curr) => {
        const exists = catalog.levels.some((l) => l.id === curr);
        return exists ? curr : catalog.levels[0].id;
      });
    }
  }, [catalog]);
  const [runKey, setRunKey] = useState(0);
  const [gameMode, setGameMode] = useState("mixed"); // 'mixed' (default: Eş & Zıt Birlikte) | 'synonyms' | 'antonyms'
  const [save, setSave] = useState({
    version: 1,
    completed: [],
    bestCoins: {},
    bestTime: {},
    bestDiamonds: {},
    bestStars: {},
    muted: !isAudioEnabled,
    lastMode: "mixed"
  });

  const [hud, setHud] = useState(emptyHud);
  const [paused, setPaused] = useState(false);
  const [won, setWon] = useState(false);
  const [touch, setTouch] = useState(false);
  const [loadErr, setLoadErr] = useState(null);

  const playHudRef = useRef(null);
  const slotRefs = useRef([]);
  const onCompleteRef = useRef(onComplete);
  onCompleteRef.current = onComplete;

  // Load storage & screen sync
  useEffect(() => {
    setSaveKey(storageKey);
    const s = loadSave();
    setSave(s);
    if (s.lastMode && ["mixed", "synonyms", "antonyms"].includes(s.lastMode)) {
      setGameMode(s.lastMode);
    } else {
      setGameMode("mixed");
    }
    const sync = () => {
      const coarse =
        window.matchMedia("(pointer: coarse)").matches ||
        navigator.maxTouchPoints > 0 ||
        "ontouchstart" in window;
      setTouch(coarse || window.innerWidth < 720);
    };
    sync();
    window.addEventListener("resize", sync);
    return () => window.removeEventListener("resize", sync);
  }, [storageKey]);

  // Load Sprites
  useEffect(() => {
    let cancelled = false;
    loadSprites(assetBase)
      .then((s) => {
        if (!cancelled) spritesRef.current = s;
      })
      .catch((err) => {
        if (!cancelled) setLoadErr(err.message);
      });
    return () => {
      cancelled = true;
    };
  }, [assetBase]);

  // Start Canvas Game Loop
  useEffect(() => {
    if (screen !== "play") return;
    const canvas = canvasRef.current;
    const sprites = spritesRef.current;
    if (!canvas || !sprites) {
      const t = window.setInterval(() => {
        if (canvasRef.current && spritesRef.current) {
          window.clearInterval(t);
          setRunKey((k) => k + 1);
        }
      }, 50);
      return () => window.clearInterval(t);
    }

    const lv = levels.find((l) => l.id === levelId) ?? levels[0];
    const sessionData = {
      level: lv,
      word: wordOf(lv),
      mode: gameMode
    };

    const game = createGame(
      canvas,
      sprites,
      levelId,
      {
        onHud: (h) => setHud(h),
        onWordCollect: ({ word: collectedWord }) => {
          if (!save.muted && isAudioEnabled) {
            speakTts(collectedWord, { lang: "en-US", rate: 0.9 });
          }
        },
        onWin: (h) => {
          setHud(h);
          setWon(true);
          const nextSave = markComplete(
            levelId,
            h.coins,
            h.diamonds,
            h.time,
            h.stars
          );
          setSave(nextSave);
          const idx = levels.findIndex((l) => l.id === levelId);
          const isFinalWordOfLevel = idx >= 0 && idx >= levels.length - 1;
          if (isFinalWordOfLevel) {
            fireGuaranteedLevelEnd({
              gameSlug: "orbitlex",
              score: (h.coins || 1) * 20 + (h.diamonds || 0) * 50,
              langPair: useMemolandumStore.getState().lastPlayedLang || "",
              levelId: useMemolandumStore.getState().lastPlayedLevel || levelId,
              triggerReason: "orbitlex_final_word_win",
              onLevelCompletedCallback: () => {
                useMemolandumStore.getState().markLevelCompleted?.();
              },
            });
          }
          onCompleteRef.current?.({
            id: levelId,
            word: h.word,
            coins: h.coins,
            diamonds: h.diamonds,
            stars: h.stars,
            time: h.time,
            mode: gameMode
          });
        },
        onPause: (p) => setPaused(p)
      },
      save.muted || !isAudioEnabled,
      sessionData
    );

    game.unlockAudio();
    gameRef.current = game;
    setPaused(false);
    setWon(false);
    setHud(game.getHud());
    fireCanvasReadyAnalytics(
      "orbitlex",
      useMemolandumStore.getState().lastPlayedLang || "",
      useMemolandumStore.getState().lastPlayedLevel || levelId
    );

    return () => {
      game.destroy();
      gameRef.current = null;
    };
  }, [screen, levelId, runKey, gameMode, isAudioEnabled]);

  const startLevel = useCallback((id, selectedMode = gameMode) => {
    unlockAudio();
    const s = loadSave();
    s.lastMode = selectedMode;
    writeSave(s);
    setSave(s);
    setLevelId(id);
    setGameMode(selectedMode);
    setWon(false);
    setPaused(false);
    setScreen("play");
    setRunKey((k) => k + 1);
  }, [gameMode]);

  const handleModeChange = useCallback((newMode) => {
    setGameMode(newMode);
    const s = { ...save, lastMode: newMode };
    writeSave(s);
    setSave(s);
    if (gameRef.current && typeof gameRef.current.setMode === "function") {
      gameRef.current.setMode(newMode);
    } else {
      setRunKey((k) => k + 1);
    }
  }, [save]);

  function toggleMute() {
    const next = !save.muted;
    const data = {
      ...save,
      muted: next
    };
    writeSave(data);
    setSave(data);
    setIsAudioEnabled?.(!next);
    gameRef.current?.setMuted(next);
  }

  function handlePronounceWord(wordToSpeak, e) {
    e?.stopPropagation();
    if (wordToSpeak) {
      speakTts(wordToSpeak, { lang: "en-US", rate: 0.9 });
    }
  }

  function bindFire() {
    return {
      onPointerDown: (e) => {
        e.preventDefault();
        e.currentTarget.setPointerCapture(e.pointerId);
        gameRef.current?.setTouch({
          fire: true
        });
      },
      onPointerUp: () =>
        gameRef.current?.setTouch({
          fire: false
        }),
      onPointerCancel: () =>
        gameRef.current?.setTouch({
          fire: false
        })
    };
  }

  const nxt = (() => {
    const i = levels.findIndex((l) => l.id === levelId);
    if (i < 0 || i >= levels.length - 1) {
      return catalog ? null : stockNext(levelId);
    }
    return levels[i + 1]?.id ?? null;
  })();

  const currentWordIndex = Math.max(0, levels.findIndex((l) => l.id === levelId));
  const totalWords = levels.length;

  const activeTokens = (hud?.tokens?.length ? hud.tokens : hud?.synonyms) || [];
  const collectedCount = activeTokens.filter((s) => s?.collected).length;
  const currentWordObj = useMemo(() => {
    const lv = levels.find((l) => l.id === levelId) ?? levels[0];
    return wordOf(lv);
  }, [levels, levelId]);

  return (
    <div
      className={`orbit-lex relative min-h-dvh overflow-hidden bg-[#070b14] text-slate-100 font-sans ${className}`}
    >
      {/* 1. PLAY CANVAS */}
      {screen === "play" && (
        <>
          <canvas
            ref={canvasRef}
            className="absolute inset-0 h-full w-full touch-none"
            aria-label="OrbitLex Arena"
          />
          {!won && !paused && <TextlessOnboardingHint positionClass="bottom-24 right-8" />}
        </>
      )}

      {/* 2. MENÜ ARKA PLANI */}
      {screen !== "play" && (
        <MenuBackdrop src={`${assetBase.replace(/\/$/, "")}/planet.png`} />
      )}

      {/* 3. ANA BAŞLIK EKRANI */}
      {screen === "title" && (
        <Shell>
          <div className="flex items-center gap-2 rounded-full border border-cyan-500/30 bg-cyan-950/40 px-3.5 py-1 text-xs font-bold tracking-widest text-cyan-400 uppercase shadow-lg shadow-cyan-950/50">
            <Sparkles className="size-3.5 animate-pulse text-cyan-300" />
            <span>MEMOLANDUM · NEON ARCADE KABUĞU</span>
          </div>

          <h1 className="mt-4 text-5xl sm:text-6xl font-black tracking-tight text-white drop-shadow-[0_0_25px_rgba(34,211,238,0.4)]">
            Orbit<span className="text-cyan-400">Lex</span>
          </h1>

          <p className="mt-2 text-xs font-bold tracking-[0.2em] text-slate-400 uppercase">
            Yörünge Kelime Yarışı · Eş & Zıt Anlam
          </p>

          <p className="mt-4 max-w-md text-center text-sm text-slate-300 leading-relaxed">
            Gezegenin merkezindeki kelimenin etrafında uzay geminle süzül. Kristalleri topla,
            beton engelleri kır ve bayrağa ulaşarak kelime ağını tamamla!
          </p>

          {/* OYUN MODU SEÇİCİ */}
          <div className="mt-6 w-full max-w-sm">
            <p className="text-[11px] font-extrabold uppercase tracking-widest text-slate-400 mb-2.5 text-center">
              OYUN MODUNU SEÇ
            </p>
            <div className="grid grid-cols-3 gap-2 p-1.5 rounded-2xl bg-slate-900/80 border border-slate-700/60 shadow-xl backdrop-blur-md">
              <button
                type="button"
                onClick={() => setGameMode("mixed")}
                className={`flex flex-col items-center justify-center gap-1 py-2.5 px-2 rounded-xl text-xs font-black transition-all cursor-pointer ${
                  gameMode === "mixed"
                    ? "bg-cyan-500/20 text-cyan-300 border border-cyan-400/50 shadow-[0_0_15px_rgba(34,211,238,0.25)] scale-[1.02]"
                    : "text-slate-400 hover:text-slate-200 hover:bg-slate-800/50 border border-transparent"
                }`}
              >
                <span className="text-base">⚡</span>
                <span>Eş + Zıt Anlam</span>
                <span className="text-[9px] font-normal text-cyan-300">Önerilen</span>
              </button>

              <button
                type="button"
                onClick={() => setGameMode("synonyms")}
                className={`flex flex-col items-center justify-center gap-1 py-2.5 px-2 rounded-xl text-xs font-black transition-all cursor-pointer ${
                  gameMode === "synonyms"
                    ? "bg-emerald-500/20 text-emerald-300 border border-emerald-400/50 shadow-[0_0_15px_rgba(34,197,94,0.25)] scale-[1.02]"
                    : "text-slate-400 hover:text-slate-200 hover:bg-slate-800/50 border border-transparent"
                }`}
              >
                <span className="text-base">🟢</span>
                <span>Yalnızca Eş</span>
                <span className="text-[9px] font-normal text-slate-400">Synonym</span>
              </button>

              <button
                type="button"
                onClick={() => setGameMode("antonyms")}
                className={`flex flex-col items-center justify-center gap-1 py-2.5 px-2 rounded-xl text-xs font-black transition-all cursor-pointer ${
                  gameMode === "antonyms"
                    ? "bg-rose-500/20 text-rose-300 border border-rose-400/50 shadow-[0_0_15px_rgba(244,63,94,0.25)] scale-[1.02]"
                    : "text-slate-400 hover:text-slate-200 hover:bg-slate-800/50 border border-transparent"
                }`}
              >
                <span className="text-base">🔴</span>
                <span>Yalnızca Zıt</span>
                <span className="text-[9px] font-normal text-slate-400">Antonym</span>
              </button>
            </div>
            <p className="mt-2 text-center text-[11px] text-slate-400">
              {gameMode === "mixed" && "⚡ 3 Eş Anlam (Yeşil) + 3 Zıt Anlam (Kırmızı) · Tam kelime ağı!"}
              {gameMode === "synonyms" && "✨ Yörüngedeki yeşil kristalleri topla · Yalnızca eş anlamlılar."}
              {gameMode === "antonyms" && "🎯 Yörüngedeki kırmızı kristalleri topla · Yalnızca zıt anlamlılar."}
            </p>
          </div>

          <div className="mt-8 flex w-full max-w-xs flex-col gap-3">
            <Primary onClick={() => startLevel(firstPlayable(save, levels), gameMode)}>
              🚀 YÖRÜNGEYİ BAŞLAT
            </Primary>
            <Ghost onClick={() => setScreen("levels")}>
              <Layers className="size-4 mr-1 text-cyan-400" />
              Seviyeler ({levels.length})
            </Ghost>
            <Ghost onClick={() => setScreen("lexicon")}>
              <BookOpen className="size-4 mr-1 text-amber-400" />
              Sözlük & Anlam Ağı
            </Ghost>
            <Ghost onClick={() => setScreen("help")}>
              <HelpCircle className="size-4 mr-1 text-slate-400" />
              Nasıl Oynanır?
            </Ghost>
            {onExit && (
              <button
                type="button"
                onClick={onExit}
                className="mt-2 text-xs font-bold text-slate-500 hover:text-slate-300 transition-colors"
              >
                ✕ Oyun Merkezine Dön
              </button>
            )}
          </div>
          {loadErr && <p className="mt-6 text-sm text-rose-400 font-bold">{loadErr}</p>}
        </Shell>
      )}

      {/* 4. NASIL OYNANIR EKRANI */}
      {screen === "help" && (
        <Shell>
          <Back onClick={() => setScreen("title")} label="Geri" />
          <h2 className="mt-4 text-3xl font-black text-white tracking-tight flex items-center gap-2">
            <HelpCircle className="size-7 text-cyan-400" />
            Nasıl Oynanır?
          </h2>
          <div className="mt-6 max-w-lg space-y-3.5 text-sm text-slate-300 bg-slate-900/60 p-6 rounded-2xl border border-cyan-500/20 backdrop-blur-md">
            <div className="flex gap-3">
              <span className="font-mono font-bold text-cyan-400 shrink-0">W / A / S / D</span>
              <p>Geminizi yörüngede hareket ettirin (W yukarı, S aşağı, A sola, D sağa veya Ok tuşları).</p>
            </div>
            <div className="flex gap-3">
              <span className="font-mono font-bold text-cyan-400 shrink-0">Ctrl / ⌘ / 180°</span>
              <p>Anında 180 derece ters dönüş yapın. Mobilde sağ alttaki 180 butonuna basılı tutun.</p>
            </div>
            <div className="flex gap-3">
              <span className="font-mono font-bold text-cyan-400 shrink-0">Space / J (Ateş)</span>
              <p>Gemi merkezdeki kelimeye kilitlenir. Aradaki beton levhaları 6 vuruşta kırarak elmas saçın!</p>
            </div>
            <div className="flex gap-3">
              <span className="font-mono font-bold text-amber-400 shrink-0">Altın Kristalleri</span>
              <p>Topladığınız her altın kristali kelimenin <strong className="text-amber-300">Eş Anlamlısını</strong> açar ve telaffuzunu çalar.</p>
            </div>
            <div className="flex gap-3">
              <span className="font-mono font-bold text-rose-400 shrink-0">Yakut Kristalleri</span>
              <p>Zıt Anlam modunda veya Karma modda <strong className="text-rose-300">Zıt Anlamlıları</strong> açar.</p>
            </div>
            <div className="flex gap-3">
              <span className="font-mono font-bold text-emerald-400 shrink-0">Hedef Bayrak</span>
              <p>Tüm kristalleri açığa çıkardığınızda bayrak aktif olur. Bayrağa ulaşarak bölümü tamamlayın!</p>
            </div>
          </div>
          <div className="mt-8 w-full max-w-xs">
            <Primary onClick={() => startLevel(firstPlayable(save, levels), gameMode)}>
              Anladım, Başlat!
            </Primary>
          </div>
        </Shell>
      )}

      {/* 5. SEVİYELER EKRANI */}
      {screen === "levels" && (
        <Shell wide>
          <Back onClick={() => setScreen("title")} label="Ana Menü" />
          <h2 className="mt-4 text-3xl font-black text-white tracking-tight flex items-center gap-2">
            <Layers className="size-7 text-cyan-400" />
            Yörünge Seviyeleri
          </h2>
          <p className="mt-1 text-sm text-slate-400">
            Her yörünge bir akademik kelime ve anlam ailesini temsil eder.
          </p>

          <div className="mt-6 grid w-full max-w-3xl grid-cols-1 gap-3 sm:grid-cols-2">
            {levels.map((lv, i) => {
              const w = wordOf(lv);
              const open = isUnlocked(i, save.completed, levels.map((l) => l.id));
              const done = save.completed.includes(lv.id);
              return (
                <button
                  key={lv.id}
                  disabled={!open}
                  onClick={() => startLevel(lv.id, gameMode)}
                  className={`rounded-2xl border p-4 text-left transition-all duration-150 cursor-pointer ${
                    open
                      ? "border-cyan-500/20 bg-slate-900/60 hover:border-cyan-400/50 hover:bg-slate-900/90 active:scale-[0.99]"
                      : "border-slate-800 bg-slate-950/40 opacity-40 cursor-not-allowed"
                  }`}
                >
                  <div className="flex items-baseline justify-between gap-3">
                    <span className="text-xs font-black tracking-widest text-cyan-400 uppercase">
                      SEVİYE {String(i + 1).padStart(2, "0")}
                    </span>
                    <span className="flex items-center gap-1">
                      {[1, 2, 3].map((n) => (
                        <Star
                          key={n}
                          className={`size-3.5 ${
                            (save.bestStars[lv.id] ?? 0) >= n
                              ? "text-amber-400"
                              : "text-slate-600"
                          }`}
                          fill={
                            (save.bestStars[lv.id] ?? 0) >= n ? "currentColor" : "none"
                          }
                          strokeWidth={2}
                        />
                      ))}
                      {done && <Flag className="ml-1 size-3.5 text-emerald-400" strokeWidth={2.5} />}
                    </span>
                  </div>
                  <div className="mt-2 text-xl font-black text-white tracking-tight flex items-center gap-2">
                    {w.word}
                    <button
                      type="button"
                      onClick={(e) => handlePronounceWord(w.word, e)}
                      className="p-1 rounded-md text-slate-400 hover:text-cyan-300 hover:bg-slate-800 transition-colors"
                      title="Telaffuzu Dinle"
                    >
                      <Volume1 className="size-4" />
                    </button>
                  </div>
                  <p className="mt-1 line-clamp-2 text-xs text-slate-300 font-medium">
                    {w.definitionTr || w.definition}
                  </p>
                </button>
              );
            })}
          </div>
        </Shell>
      )}

      {/* 6. SÖZLÜK & ANLAM AĞI EKRANI */}
      {screen === "lexicon" && (
        <Shell wide>
          <Back onClick={() => setScreen("title")} label="Ana Menü" />
          <h2 className="mt-4 text-3xl font-black text-white tracking-tight flex items-center gap-2">
            <BookOpen className="size-7 text-amber-400" />
            Akademik Sözlük & Anlam Ağı
          </h2>
          <p className="mt-1 text-sm text-slate-400 max-w-lg">
            Tamamlanan yörüngelerde açılan Eş Anlam (Synonym) ve Zıt Anlam (Antonym) kelimeleri.
          </p>

          <div className="mt-6 grid w-full max-w-3xl grid-cols-1 gap-3 sm:grid-cols-2">
            {lexicon.map((w) => {
              const lv = levels.find((l) => l.wordId === w.id);
              const revealed = lv ? save.completed.includes(lv.id) : true;
              return (
                <article
                  key={w.id}
                  className="rounded-2xl border border-slate-700/60 bg-slate-900/70 p-4 backdrop-blur-md"
                >
                  <div className="flex items-center justify-between">
                    <h3 className="text-lg font-black text-white tracking-tight flex items-center gap-2">
                      {w.word}
                      <button
                        type="button"
                        onClick={(e) => handlePronounceWord(w.word, e)}
                        className="p-1 rounded-md text-slate-400 hover:text-cyan-300 hover:bg-slate-800"
                        title="Dinle"
                      >
                        <Volume1 className="size-4" />
                      </button>
                    </h3>
                    <span className="text-[10px] font-bold text-cyan-400 bg-cyan-950/60 px-2 py-0.5 rounded-full border border-cyan-800/40">
                      IELTS / YDS
                    </span>
                  </div>
                  <p className="mt-1 text-xs text-slate-300">{w.definitionTr || w.definition}</p>

                  <div className="mt-3 pt-3 border-t border-slate-800/80 space-y-1.5">
                    <div className="text-xs">
                      <span className="font-bold text-amber-400">🟢 Eş Anlam: </span>
                      <span className="text-slate-300">
                        {revealed ? w.synonyms.join(" · ") : "Yörüngede açılmayı bekliyor…"}
                      </span>
                    </div>
                    {w.antonyms && w.antonyms.length > 0 && (
                      <div className="text-xs">
                        <span className="font-bold text-rose-400">🔴 Zıt Anlam: </span>
                        <span className="text-slate-300">
                          {revealed ? w.antonyms.join(" · ") : "Yörüngede açılmayı bekliyor…"}
                        </span>
                      </div>
                    )}
                  </div>
                </article>
              );
            })}
          </div>
        </Shell>
      )}

      {/* 7. OYUN İÇİ HUD (PLAY SCREEN) */}
      {screen === "play" && !won && (
        <div
          ref={playHudRef}
          className="pointer-events-none absolute inset-0 flex flex-col justify-between p-4 pt-[max(1rem,env(safe-area-inset-top))] pb-[max(4.5rem,env(safe-area-inset-bottom))]"
        >
          {/* Uçan Kristal Animasyonları */}
          {hud.flies.map((f) => {
            const e = easeInOutCubic(Math.min(1, Math.max(0, f.t)));
            const slot = slotRefs.current[f.slot];
            const root = playHudRef.current;
            let tx = 88;
            let ty = 128 + f.slot * 34;
            if (slot && root) {
              const a = slot.getBoundingClientRect();
              const b = root.getBoundingClientRect();
              tx = a.left - b.left + Math.min(a.width, 120) / 2;
              ty = a.top - b.top + a.height / 2;
            }
            const x = f.x + (tx - f.x) * e;
            const y = f.y + (ty - f.y) * e;
            const s = 1.15 - 0.22 * e;
            const fade = f.t < 0.06 ? f.t / 0.06 : f.t > 0.9 ? (1 - f.t) / 0.1 : 1;
            const isAnt = f.type === "antonym";
            return (
              <div
                key={`${f.word}-${f.slot}-${Math.round(f.x)}-${Math.round(f.y)}`}
                className={`font-black absolute rounded-xl border px-3.5 py-1 text-xl tracking-wide sm:text-2xl shadow-xl z-30 ${
                  isAnt
                    ? "border-rose-400 bg-rose-950/80 text-rose-200 shadow-[0_0_15px_rgba(244,63,94,0.4)]"
                    : "border-amber-400 bg-amber-950/80 text-amber-200 shadow-[0_0_15px_rgba(250,204,21,0.4)]"
                }`}
                style={{
                  left: x,
                  top: y,
                  opacity: Math.max(0, fade),
                  transform: `translate(-50%, -50%) scale(${s})`
                }}
              >
                {f.word}
              </div>
            );
          })}

          {/* ÜST BAR: SOL (KELİME & ANLAMLAR) - SAĞ (SKOR & KONTROLLER) */}
          <div className="flex items-start justify-between gap-3">
            {/* SOL KELİME & TOKENS KUTUSU */}
            <div className="flex max-w-[min(22rem,72%)] flex-col gap-2">
              {/* Hedef Kelime & Anlamı */}
              <div className="pointer-events-auto rounded-2xl border border-cyan-500/30 bg-slate-900/85 p-3 shadow-xl backdrop-blur-md">
                <div className="flex items-center justify-between gap-2">
                  <div className="text-xl sm:text-2xl font-black text-white tracking-tight flex items-center gap-2">
                    <span>{hud.word || "—"}</span>
                    <button
                      type="button"
                      onClick={(e) => handlePronounceWord(hud.word, e)}
                      className="p-1 rounded-md text-cyan-400 hover:text-white hover:bg-cyan-900/50 transition-colors cursor-pointer"
                      title="Telaffuzu Dinle"
                    >
                      <Volume1 className="size-4" />
                    </button>
                  </div>
                  <span
                    className={`text-[10px] font-black uppercase px-2 py-0.5 rounded-md border ${
                      gameMode === "antonyms"
                        ? "border-rose-500/40 bg-rose-500/20 text-rose-300"
                        : gameMode === "mixed"
                        ? "border-cyan-500/40 bg-cyan-500/20 text-cyan-300"
                        : "border-emerald-500/40 bg-emerald-500/20 text-emerald-300"
                    }`}
                  >
                    {gameMode === "antonyms"
                      ? "ZIT ANLAM"
                      : gameMode === "mixed"
                      ? "EŞ & ZIT ANLAM"
                      : "EŞ ANLAM"}
                  </span>
                </div>
                <p className="text-xs font-medium text-slate-300 mt-1 line-clamp-2">
                  {hud.definitionTr || currentWordObj?.definitionTr || hud.definition}
                </p>
              </div>

              {/* 1. EŞ ANLAMLILAR (SYNONYMS) KARTI */}
              {(gameMode === "mixed" || gameMode === "synonyms") && (
                <div className="pointer-events-auto rounded-2xl border border-emerald-500/40 bg-slate-900/85 p-2.5 sm:p-3 shadow-xl backdrop-blur-md">
                  <div className="flex items-center justify-between mb-1">
                    <p className="text-[10px] font-black tracking-widest text-emerald-400 uppercase flex items-center gap-1.5">
                      <span>🟢</span>
                      <span>EŞ ANLAMLILAR (SYNONYMS)</span>
                    </p>
                    <span dir="ltr" className="text-[10px] font-bold text-emerald-400 tabular-nums">
                      {hud.synonyms.filter((s) => s.collected).length}/{hud.synonyms.length || 3}
                    </span>
                  </div>

                  <ul className="space-y-0.5">
                    {(hud.synonyms.length
                      ? hud.synonyms
                      : [{ word: "—", collected: false, landed: false }]
                    ).map((s, i) => {
                      const isPopped = hud.popped === s.word;
                      return (
                        <li
                          key={"syn-" + s.word + i}
                          ref={(el) => {
                            slotRefs.current[i] = el;
                          }}
                          className={`flex items-center justify-between py-0.5 text-sm sm:text-base font-black leading-tight transition-all ${
                            isPopped
                              ? "text-white scale-105"
                              : s.landed
                              ? "text-emerald-400 drop-shadow-[0_0_8px_rgba(34,197,94,0.4)]"
                              : "text-slate-600"
                          }`}
                        >
                          <div className="flex items-center gap-1.5">
                            <span className="text-xs">
                              {s.landed ? (s.collected ? "✨" : "🟢") : "⚪"}
                            </span>
                            <span>{s.landed ? s.word : "· · ·"}</span>
                          </div>
                          {s.landed && (
                            <button
                              type="button"
                              onClick={(e) => handlePronounceWord(s.word, e)}
                              className="p-1 rounded text-slate-400 hover:text-white cursor-pointer"
                            >
                              <Volume1 className="size-3.5" />
                            </button>
                          )}
                        </li>
                      );
                    })}
                  </ul>
                </div>
              )}

              {/* 2. ZIT ANLAMLILAR (ANTONYMS) KARTI */}
              {(gameMode === "mixed" || gameMode === "antonyms") && (
                <div className="pointer-events-auto rounded-2xl border border-rose-500/40 bg-slate-900/85 p-2.5 sm:p-3 shadow-xl backdrop-blur-md">
                  <div className="flex items-center justify-between mb-1">
                    <p className="text-[10px] font-black tracking-widest text-rose-400 uppercase flex items-center gap-1.5">
                      <span>🔴</span>
                      <span>ZIT ANLAMLILAR (ANTONYMS)</span>
                    </p>
                    <span dir="ltr" className="text-[10px] font-bold text-rose-400 tabular-nums">
                      {hud.antonyms.filter((s) => s.collected).length}/{hud.antonyms.length || 3}
                    </span>
                  </div>

                  <ul className="space-y-0.5">
                    {(hud.antonyms.length
                      ? hud.antonyms
                      : [{ word: "—", collected: false, landed: false }]
                    ).map((s, i) => {
                      const isPopped = hud.popped === s.word;
                      const antSlotIdx = (hud.synonyms.length || 3) + i;
                      return (
                        <li
                          key={"ant-" + s.word + i}
                          ref={(el) => {
                            slotRefs.current[antSlotIdx] = el;
                          }}
                          className={`flex items-center justify-between py-0.5 text-sm sm:text-base font-black leading-tight transition-all ${
                            isPopped
                              ? "text-white scale-105"
                              : s.landed
                              ? "text-rose-400 drop-shadow-[0_0_8px_rgba(244,63,94,0.4)]"
                              : "text-slate-600"
                          }`}
                        >
                          <div className="flex items-center gap-1.5">
                            <span className="text-xs">
                              {s.landed ? (s.collected ? "✨" : "🔴") : "⚪"}
                            </span>
                            <span>{s.landed ? s.word : "· · ·"}</span>
                          </div>
                          {s.landed && (
                            <button
                              type="button"
                              onClick={(e) => handlePronounceWord(s.word, e)}
                              className="p-1 rounded text-slate-400 hover:text-white cursor-pointer"
                            >
                              <Volume1 className="size-3.5" />
                            </button>
                          )}
                        </li>
                      );
                    })}
                  </ul>
                </div>
              )}
            </div>

            {/* SAĞ TARAF SKOR & MENÜ KUTUSU */}
            <div className="pointer-events-auto flex items-center gap-2">
              <div className="rounded-2xl border border-cyan-500/30 bg-slate-900/85 px-3 py-2 text-right rtl:text-left shadow-xl backdrop-blur-md">
                <div dir="ltr" className="font-mono text-xs font-black tabular-nums text-amber-400">
                  🪙 {hud.coins}/{hud.totalCoins} Altın
                </div>
                <div dir="ltr" className="font-mono text-xs font-black tabular-nums text-cyan-400">
                  💎 {hud.diamonds}/{hud.totalDiamonds} Elmas
                </div>
                <div className="text-[10px] font-bold text-slate-300 mt-0.5">
                  {hud.flagReady ? (
                    <span className="text-emerald-400 font-black animate-pulse">
                      🏁 Bayrak Açık!
                    </span>
                  ) : (
                    <span>Kristalleri Topla</span>
                  )}
                </div>
              </div>

              {/* Hızlı Mod Geçiş Butonu */}
              <button
                type="button"
                onClick={() => {
                  const next =
                    gameMode === "mixed"
                      ? "synonyms"
                      : gameMode === "synonyms"
                      ? "antonyms"
                      : "mixed";
                  handleModeChange(next);
                }}
                className="flex size-11 items-center justify-center rounded-2xl border border-slate-700 bg-slate-900/85 text-white shadow-xl hover:border-cyan-400 hover:bg-slate-800 transition-colors cursor-pointer"
                title={`Aktif Mod: ${gameMode}. Tıkla ve değiştir.`}
              >
                {gameMode === "mixed" && <span className="text-[11px] font-black text-cyan-400">EŞ+ZIT</span>}
                {gameMode === "synonyms" && <span className="text-sm font-black text-emerald-400">SYN</span>}
                {gameMode === "antonyms" && <span className="text-sm font-black text-rose-400">ANT</span>}
              </button>

              <IconBtn label={save.muted ? "Sesi Aç" : "Sesi Kapat"} onClick={toggleMute}>
                {save.muted ? <VolumeX className="size-4 text-slate-400" /> : <Volume2 className="size-4 text-cyan-400" />}
              </IconBtn>

              <IconBtn
                label="Duraklat"
                onClick={() => {
                  setPaused(true);
                  gameRef.current?.pause();
                }}
              >
                <Pause className="size-4 text-white" />
              </IconBtn>
            </div>
          </div>

          {/* ORTA BİLGİ İPUCU (Klavye tuşları) */}
          <div className="pointer-events-none flex flex-col items-center gap-2">
            {!touch && (
              <p className="rounded-full border border-slate-700/60 bg-slate-900/75 px-3 py-1 text-xs font-semibold text-slate-300 shadow-lg">
                W/A/S/D veya Yön Tuşları: Sürüş · Space: Lazer Ateşi · Ctrl: 180° Dönüş
              </p>
            )}
          </div>

          {/* MOBİL DOKUNMATİK KONTROLLERİ */}
          {touch ? (
            <div className="pointer-events-auto flex items-end justify-between gap-4">
              <Stick
                onChange={(x, y) => gameRef.current?.setStick(x, y)}
                onEnd={() => gameRef.current?.setStick(0, 0)}
              />
              <div className="flex flex-col items-end gap-2">
                <Pad {...bindFire()} aria-label="Ateş">
                  💥 ATEŞ
                </Pad>
                <Hold180 onFire={() => gameRef.current?.queueAboutFace()} />
              </div>
            </div>
          ) : (
            <div />
          )}
        </div>
      )}

      {/* 8. DURAKLATILDI (PAUSE) EKRANI */}
      {screen === "play" && paused && !won && (
        <Overlay>
          <div className="p-8 rounded-3xl bg-slate-900/90 border border-cyan-500/30 max-w-sm w-full shadow-2xl backdrop-blur-xl">
            <h2 className="text-3xl font-black text-white tracking-tight">
              Yörünge Duraklatıldı
            </h2>
            <p className="mt-1 text-xs text-slate-400">
              Mod:{" "}
              <strong className="text-cyan-400">
                {gameMode === "antonyms"
                  ? "Zıt Anlam"
                  : gameMode === "mixed"
                  ? "Karma Mod"
                  : "Eş Anlam"}
              </strong>
            </p>

            <div className="mt-6 flex flex-col gap-3">
              <Primary
                onClick={() => {
                  setPaused(false);
                  gameRef.current?.resume();
                }}
              >
                ▶ DEVAM ET
              </Primary>
              <Ghost
                onClick={() => {
                  gameRef.current?.restart();
                  setPaused(false);
                }}
              >
                🔄 YÖRÜNGEYİ YENİDEN BAŞLAT
              </Ghost>
              <Ghost
                onClick={() => {
                  gameRef.current?.destroy();
                  if (!menu && onExit) onExit();
                  else setScreen(menu ? "levels" : "title");
                }}
              >
                {menu ? "Seviyeler Listesi" : onExit ? "Çıkış Yap" : "Ana Menü"}
              </Ghost>
            </div>
          </div>
        </Overlay>
      )}

      {/* 9. ZAFER (ORBİT TAMAMLANDI) EKRANI */}
      {screen === "play" && won && (
        <Overlay>
          <div className="p-8 rounded-3xl bg-slate-900/95 border border-cyan-500/40 max-w-md w-full shadow-2xl backdrop-blur-2xl text-center">
            <p className="text-xs font-bold tracking-[0.2em] text-cyan-400 uppercase">
              ORBİTAL GÖREV BAŞARILI
            </p>
            <div className="mt-3 flex justify-center gap-1.5">
              {[1, 2, 3].map((n) => (
                <Star
                  key={n}
                  className={`size-7 ${
                    hud.stars >= n ? "text-amber-400" : "text-slate-700"
                  }`}
                  fill={hud.stars >= n ? "currentColor" : "none"}
                  strokeWidth={2}
                />
              ))}
            </div>

            <div className="mt-4 flex items-center justify-center gap-2">
              <h2 className="text-4xl font-black text-white tracking-tight">
                {hud.word}
              </h2>
              <button
                type="button"
                onClick={(e) => handlePronounceWord(hud.word, e)}
                className="p-1.5 rounded-lg bg-cyan-950/60 text-cyan-300 hover:text-white border border-cyan-800/40"
                title="Telaffuzu Dinle"
              >
                <Volume1 className="size-5" />
              </button>
            </div>

            <p className="mt-2 text-sm text-slate-300 font-medium">
              {hud.definitionTr || currentWordObj?.definitionTr || hud.definition}
            </p>

            {/* Öğrenilen Anlam Ağı Rozetleri */}
            <div className="mt-5 p-4 rounded-2xl bg-slate-950/60 border border-slate-800 text-left">
              <p className="text-[10px] font-black uppercase tracking-wider text-slate-400 mb-2">
                ÖĞRENİLEN KELİME AĞI
              </p>

              {hud.synonyms && hud.synonyms.length > 0 && (
                <div className="mb-2">
                  <span className="text-xs font-bold text-amber-400">🟢 Eş Anlamlılar: </span>
                  <div className="flex flex-wrap gap-1.5 mt-1">
                    {hud.synonyms.map((s) => (
                      <span
                        key={s.word}
                        onClick={() => handlePronounceWord(s.word)}
                        className="inline-flex items-center gap-1 text-xs font-bold bg-amber-500/10 text-amber-300 border border-amber-500/30 px-2 py-0.5 rounded-lg cursor-pointer hover:bg-amber-500/20"
                        title="Dinlemek için tıkla"
                      >
                        {s.word} <Volume1 className="size-3 opacity-60" />
                      </span>
                    ))}
                  </div>
                </div>
              )}

              {hud.antonyms && hud.antonyms.length > 0 && (
                <div>
                  <span className="text-xs font-bold text-rose-400">🔴 Zıt Anlamlılar: </span>
                  <div className="flex flex-wrap gap-1.5 mt-1">
                    {hud.antonyms.map((s) => (
                      <span
                        key={s.word}
                        onClick={() => handlePronounceWord(s.word)}
                        className="inline-flex items-center gap-1 text-xs font-bold bg-rose-500/10 text-rose-300 border border-rose-500/30 px-2 py-0.5 rounded-lg cursor-pointer hover:bg-rose-500/20"
                        title="Dinlemek için tıkla"
                      >
                        {s.word} <Volume1 className="size-3 opacity-60" />
                      </span>
                    ))}
                  </div>
                </div>
              )}
            </div>

            <p className="mt-4 text-xs text-slate-400 font-mono tabular-nums">
              🪙 {hud.coins}/{hud.totalCoins} altın · 💎 {hud.diamonds}/{hud.totalDiamonds} elmas · ⏱️ {hud.time.toFixed(1)}s
            </p>

            <div className="mt-6 flex flex-col gap-3">
              {nxt ? (
                <Primary onClick={() => startLevel(nxt, gameMode)}>
                  SONRAKİ KELİME ({currentWordIndex + 2}/{totalWords}) ➔
                </Primary>
              ) : (
                <Primary
                  onClick={() => {
                    gameRef.current?.destroy();
                    if (typeof onNextLevel === "function") {
                      onNextLevel();
                    } else if (typeof onExit === "function") {
                      onExit();
                    } else {
                      startLevel(levels[0].id, gameMode);
                    }
                  }}
                  className="bg-gradient-to-r from-emerald-500 to-cyan-500 hover:from-emerald-400 hover:to-cyan-400 border-none shadow-[0_0_20px_rgba(16,185,129,0.4)] font-black tracking-wide animate-pulse"
                >
                  {totalWords <= 3
                    ? getNextLevelHookCopy(
                        useMemolandumStore.getState().lastPlayedLang || "",
                        5
                      ).cta
                    : "🎉 BÖLÜM TAMAMLANDI · SONRAKİ SEVİYE ➔"}
                </Primary>
              )}
              <Ghost
                onClick={() => {
                  gameRef.current?.restart();
                  setWon(false);
                }}
              >
                🔄 YENİDEN OYNA
              </Ghost>
              <Ghost
                onClick={() => {
                  gameRef.current?.destroy();
                  if (!menu && onExit) onExit();
                  else setScreen("levels");
                }}
              >
                {menu ? "Seviye Listesi" : onExit ? "Çıkış Yap" : "Ana Menü"}
              </Ghost>
            </div>
          </div>
        </Overlay>
      )}
    </div>
  );
}

export const OrbitLex = GameApp;

function firstPlayable(save, levels) {
  const ids = levels.map((l) => l.id);
  const idx = levels.findIndex(
    (_, i) => !save.completed.includes(levels[i].id) && isUnlocked(i, save.completed, ids)
  );
  return idx >= 0 ? levels[idx].id : levels[0].id;
}

function MenuBackdrop({ src }) {
  return (
    <div className="pointer-events-none absolute inset-0">
      <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_50%_30%,rgba(15,23,42,0.9),transparent_65%)]" />
      <img
        src={src}
        alt=""
        className="absolute top-[10%] left-1/2 h-[min(54vw,300px)] w-[min(54vw,300px)] -translate-x-1/2 opacity-75 drop-shadow-[0_0_50px_rgba(34,211,238,0.2)]"
      />
    </div>
  );
}

function Shell({ children, wide }) {
  return (
    <main
      className={`relative z-10 mx-auto flex min-h-dvh flex-col items-center px-5 py-8 pt-[max(2rem,env(safe-area-inset-top))] pb-[max(2rem,env(safe-area-inset-bottom))] ${
        wide ? "justify-start" : "justify-center"
      }`}
    >
      {children}
    </main>
  );
}

function Overlay({ children }) {
  return (
    <div className="absolute inset-0 z-40 flex flex-col items-center justify-center bg-slate-950/85 px-4 backdrop-blur-md">
      {children}
    </div>
  );
}

function Primary({ children, onClick }) {
  return (
    <button
      type="button"
      onClick={onClick}
      className="h-12 w-full rounded-2xl bg-gradient-to-r from-cyan-500 to-emerald-400 hover:from-cyan-400 hover:to-emerald-300 px-5 text-sm font-black text-slate-950 shadow-lg shadow-cyan-500/20 transition-all duration-150 ease-out hover:scale-[1.02] active:scale-[0.98] cursor-pointer"
    >
      {children}
    </button>
  );
}

function Ghost({ children, onClick }) {
  return (
    <button
      type="button"
      onClick={onClick}
      className="flex items-center justify-center h-12 w-full rounded-2xl border border-cyan-500/20 bg-slate-900/80 px-5 text-sm font-extrabold text-slate-200 transition-all duration-150 ease-out hover:border-cyan-400/50 hover:bg-slate-800/80 hover:text-white active:scale-[0.98] cursor-pointer shadow-md"
    >
      {children}
    </button>
  );
}

function Back({ onClick, label = "Geri" }) {
  return (
    <button
      type="button"
      onClick={onClick}
      className="flex h-10 items-center gap-1 self-start text-xs font-bold text-slate-400 hover:text-cyan-300 transition-colors cursor-pointer mb-2"
    >
      <ChevronLeft className="size-4 rtl:scale-x-[-1]" />
      {label}
    </button>
  );
}

function IconBtn({ children, onClick, label }) {
  return (
    <button
      type="button"
      aria-label={label}
      onClick={onClick}
      className="flex size-11 items-center justify-center rounded-2xl border border-slate-700/80 bg-slate-900/85 text-slate-200 shadow-lg hover:border-cyan-400 hover:text-white transition-colors cursor-pointer"
    >
      {children}
    </button>
  );
}

function Pad({ children, ...rest }) {
  return (
    <button
      type="button"
      className="flex h-14 min-w-16 items-center justify-center rounded-2xl border border-cyan-500/40 bg-slate-900/90 px-4 text-xs font-black text-cyan-300 shadow-xl select-none active:scale-95 cursor-pointer"
      {...rest}
    >
      {children}
    </button>
  );
}

function Stick({ onChange, onEnd }) {
  const root = useRef(null);
  const [knob, setKnob] = useState({
    x: 0,
    y: 0
  });
  const radius = 42;
  function apply(e) {
    const el = root.current;
    if (!el) return;
    const b = el.getBoundingClientRect();
    const cx = b.left + b.width / 2;
    const cy = b.top + b.height / 2;
    let dx = e.clientX - cx;
    let dy = e.clientY - cy;
    const m = Math.hypot(dx, dy);
    if (m > radius) {
      dx = (dx / m) * radius;
      dy = (dy / m) * radius;
    }
    setKnob({
      x: dx,
      y: dy
    });
    onChange(dx / radius, -dy / radius);
  }
  return (
    <div
      ref={root}
      className="relative size-28 touch-none rounded-full border border-cyan-500/30 bg-slate-900/85 shadow-xl select-none"
      onPointerDown={(e) => {
        e.preventDefault();
        e.currentTarget.setPointerCapture(e.pointerId);
        apply(e);
      }}
      onPointerMove={(e) => {
        if (e.currentTarget.hasPointerCapture(e.pointerId)) apply(e);
      }}
      onPointerUp={() => {
        setKnob({
          x: 0,
          y: 0
        });
        onEnd();
      }}
      onPointerCancel={() => {
        setKnob({
          x: 0,
          y: 0
        });
        onEnd();
      }}
      aria-label="Hareket joystick"
      role="button"
    >
      <span
        className="pointer-events-none absolute size-12 rounded-full border border-cyan-400/60 bg-cyan-950/80 shadow-[0_0_15px_rgba(34,211,238,0.4)]"
        style={{
          left: `calc(50% + ${knob.x}px)`,
          top: `calc(50% + ${knob.y}px)`,
          transform: "translate(-50%, -50%)"
        }}
      />
    </div>
  );
}

function Hold180({ onFire }) {
  const [fill, setFill] = useState(0);
  const raf = useRef(0);
  const origin = useRef(0);
  const fired = useRef(false);
  const hold = HOLD_180_MS;
  function stop() {
    cancelAnimationFrame(raf.current);
    setFill(0);
    fired.current = false;
  }
  function start(e) {
    e.preventDefault();
    e.currentTarget.setPointerCapture(e.pointerId);
    origin.current = performance.now();
    fired.current = false;
    const tick = (now) => {
      const p = Math.min(1, (now - origin.current) / hold);
      setFill(p);
      if (p >= 1 && !fired.current) {
        fired.current = true;
        onFire();
      }
      if (p < 1) raf.current = requestAnimationFrame(tick);
    };
    raf.current = requestAnimationFrame(tick);
  }
  return (
    <button
      type="button"
      aria-label="180 derece ters dönüş için basılı tut"
      className="relative flex h-14 min-w-20 items-center justify-center overflow-hidden rounded-2xl border border-cyan-500/40 bg-slate-900/90 px-3 text-xs font-black text-white shadow-xl select-none cursor-pointer"
      onPointerDown={start}
      onPointerUp={stop}
      onPointerCancel={stop}
    >
      <span
        className="pointer-events-none absolute inset-0 origin-left rtl:origin-right bg-cyan-500/35"
        style={{
          transform: `scaleX(${fill})`
        }}
      />
      <span className="relative z-10 flex items-center gap-1.5">
        <RotateCcw className="size-4 text-cyan-400" />
        180° DÖNÜŞ
      </span>
    </button>
  );
}

export default GameApp;