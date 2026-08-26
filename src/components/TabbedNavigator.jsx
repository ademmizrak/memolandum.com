"use client";

import React, { useState, useEffect, useMemo } from "react";
import { useRouter } from "next/navigation";
import { gameManifest } from "../config/manifest";
import GameSelector from "./GameSelector";
import { ChevronLeft, Play, Zap, Video } from "lucide-react";
import { useMemolandumStore } from "../store/useMemolandumStore";
import { useStoreHydrated } from "../hooks/useStoreHydrated";
import { useT } from "../lib/i18n/LocaleProvider";
import {
  findLevelContext,
  getDefaultStudyContext,
  resolveResumeContext,
  hasSavedResume,
  formatResumeAge,
  gameDisplayName,
} from "../lib/learning/studyContext";
import { getSlugFromManifestLangId } from "../lib/seo/learnPathwayResolve";

function getPlaylistCategory(levelId) {
  if (!levelId) return null;
  const idLower = levelId.toLowerCase();
  if (idLower.includes("yds")) return "yds";
  if (idLower.includes("ilkokul-1") || idLower.includes("ilkokul-2")) return "2sınıf";
  if (idLower.includes("ilkokul-3") || idLower.includes("ilkokul-4")) return "3sınıf";
  if (idLower.includes("ilkokul-5") || idLower.includes("ilkokul-6")) return "4sınıf";
  return null;
}

export default function TabbedNavigator({ initialSlug }) {
  const t = useT();
  const router = useRouter();
  const hydrated = useStoreHydrated();
  const lastPlayedLang = useMemolandumStore((s) => s.lastPlayedLang);
  const lastPlayedLevel = useMemolandumStore((s) => s.lastPlayedLevel);
  const lastPlayedGame = useMemolandumStore((s) => s.lastPlayedGame);
  const lastPlayedAt = useMemolandumStore((s) => s.lastPlayedAt);
  const setLastPlayed = useMemolandumStore((s) => s.setLastPlayed);
  const clearActiveCustomWords = useMemolandumStore((s) => s.clearActiveCustomWords);

  const resume = useMemo(
    () =>
      resolveResumeContext({
        lastPlayedLang,
        lastPlayedLevel,
        lastPlayedGame,
        lastPlayedAt,
      }),
    [lastPlayedLang, lastPlayedLevel, lastPlayedGame, lastPlayedAt]
  );

  const savedDesk = hasSavedResume(lastPlayedLevel, lastPlayedAt);
  const resumeAge = formatResumeAge(lastPlayedAt, t);
  const resumeGameLabel = gameDisplayName(resume.gameId);

  const defaults = getDefaultStudyContext();

  const [activeMainId, setActiveMainId] = useState(resume.mainId || defaults.mainId);
  const [activeSubId, setActiveSubId] = useState(resume.langId || defaults.langId);
  const [activeLevelId, setActiveLevelId] = useState(resume.levelId || defaults.levelId);
  const [activeGameId, setActiveGameId] = useState(resume.gameId || defaults.gameId);
  const [previousMainId, setPreviousMainId] = useState("");
  /** Seçim pin’i — main tab gezinmesi lastPlayed’i bozmasın */
  const [pinnedLevelId, setPinnedLevelId] = useState(resume.levelId || null);

  // Store rehydrate / cloud LWW sonrası UI’yı kanonik resume ile hizala.
  // Seviye seçilince setLastPlayed → resume güncellenir; bu effect "Oyun Seç"
  // sekmesini dil sekmesine geri çekmesin (kullanıcı orada mahsur kalmasın).
  useEffect(() => {
    if (!resume?.levelId) return;
    setActiveMainId((prev) => (prev === "game" ? prev : resume.mainId));
    setActiveSubId(resume.langId);
    setActiveLevelId(resume.levelId);
    setActiveGameId(resume.gameId || defaults.gameId);
    setPinnedLevelId(resume.levelId);
  }, [resume.langId, resume.levelId, resume.gameId, resume.mainId, resume.lastPlayedAt]);

  useEffect(() => {
    if (initialSlug) {
      for (const main of gameManifest.mainCategories) {
        for (const sub of main.subCategories) {
          const level = sub.levels.find((l) => l.slug === initialSlug);
          if (level) {
            setActiveMainId(main.id);
            setActiveSubId(sub.id);
            setActiveLevelId(level.id);
            setPinnedLevelId(level.id);
            return;
          }
        }
      }
    }
  }, [initialSlug]);

  // Main değişince: yalnızca UI; lastPlayed’e yazma. Pin varsa onu koru.
  useEffect(() => {
    if (activeMainId === "game") return;

    const mainCat = gameManifest.mainCategories.find((c) => c.id === activeMainId);
    if (!mainCat?.subCategories?.length) return;

    const pinnedCtx = pinnedLevelId ? findLevelContext(pinnedLevelId) : null;
    if (pinnedCtx && pinnedCtx.mainId === activeMainId) {
      setActiveSubId(pinnedCtx.langId);
      setActiveLevelId(pinnedCtx.levelId);
      return;
    }

    if (!mainCat.subCategories.find((s) => s.id === activeSubId)) {
      const firstSub = mainCat.subCategories[0];
      setActiveSubId(firstSub.id);
      setActiveLevelId(firstSub.levels?.[0]?.id || "");
    }
  }, [activeMainId]);

  const mainCategoriesWithGames = gameManifest.mainCategories;

  const [activeLevelMode, setActiveLevelMode] = useState("words");

  const currentMain = gameManifest.mainCategories.find((c) => c.id === activeMainId);
  const currentSub =
    currentMain?.subCategories.find((c) => c.id === activeSubId) ||
    currentMain?.subCategories[0];

  useEffect(() => {
    if (currentSub) {
      const isKorean = currentSub.id?.includes("korean");
      const hasSentences = currentSub.sentenceLevels?.length > 0;
      if (activeLevelMode === "kpop" && !isKorean) {
        setActiveLevelMode("words");
      } else if (activeLevelMode === "sentences" && !hasSentences) {
        setActiveLevelMode("words");
      }
    }
  }, [currentSub, activeLevelMode]);

  const getDisplayLevels = () => {
    let sourceLevels = currentSub?.levels || [];
    const isKorean = currentSub?.id?.includes("korean");
    const isIlkokul = currentSub?.id?.toLowerCase().includes("ilkokul");

    if (isKorean) {
      if (activeLevelMode === "words") {
        sourceLevels = sourceLevels.filter((l) => !l.id?.includes("kpop"));
      } else if (activeLevelMode === "kpop") {
        sourceLevels = sourceLevels.filter((l) => l.id?.includes("kpop"));
      }
    }

    // İlkokul: kelime + cümle paketleri aynı gridde (3. kart = temel cümleler)
    if (isIlkokul && currentSub?.sentenceLevels?.length > 0) {
      return [...sourceLevels, ...currentSub.sentenceLevels];
    }

    if (activeLevelMode === "sentences" && currentSub?.sentenceLevels?.length > 0) {
      sourceLevels = currentSub.sentenceLevels;
    }
    return sourceLevels;
  };
  const displayLevels = getDisplayLevels();
  const isIlkokulSub = currentSub?.id?.toLowerCase().includes("ilkokul");

  const handleGameOrLevelStart = (newLevelId, newGameId) => {
    // Normal dil/seviye seçimi özel seviye kilidini kırar
    clearActiveCustomWords();

    const levelCandidate =
      newLevelId || pinnedLevelId || activeLevelId || resume.levelId || defaults.levelId;
    const gm = newGameId || activeGameId || resume.gameId || "shooter";

    // ENTERPRISE: lang her zaman level’ın parent’ından — Portekizce drift yok
    const ctx = findLevelContext(levelCandidate);
    if (!ctx) {
      console.warn("[TabbedNavigator] level manifestte yok", levelCandidate);
      return;
    }

    setPinnedLevelId(ctx.levelId);
    setActiveSubId(ctx.langId);
    setActiveLevelId(ctx.levelId);
    setActiveMainId(ctx.mainId);
    setActiveGameId(gm);
    setLastPlayed(ctx.langId, ctx.levelId, gm);
    router.push(`/games/${gm}`);
  };

  const formatLevelName = (rawName) => {
    const cleanName = rawName.replace(/^Ita\s+(En|Tr)\s*-\s*/i, "").trim();
    const match = cleanName.match(/(\d{3})\s+(\d{3})/);
    if (!match) {
      return { levelText: cleanName, descText: "" };
    }

    const startNum = parseInt(match[1], 10);
    const endNum = parseInt(match[2], 10);
    const diff = endNum - startNum + 1;

    let descText = "";
    if (startNum === 1) {
      descText = `En Sık Kullanılan ${diff} Kelime`;
    } else {
      const nth = Math.floor(startNum / diff) + 1;
      let word = `${nth}.`;
      if (nth === 2) word = "İkinci";
      if (nth === 3) word = "Üçüncü";
      if (nth === 4) word = "Dördüncü";
      if (nth === 5) word = "Beşinci";
      if (nth === 6) word = "Altıncı";

      descText = `En Sık Kullanılan ${word} ${diff} Kelime`;
    }

    let levelText = cleanName.substring(0, match.index).trim();
    if (levelText.endsWith("-")) levelText = levelText.slice(0, -1).trim();

    return { levelText, descText };
  };

  return (
    <div className="flex flex-col gap-5 w-full max-w-6xl mx-auto">
      {!hydrated ? (
        <div className="w-full h-[88px] rounded-2xl border border-cyan-500/20 bg-slate-950/80 animate-pulse" />
      ) : (
      <div className="w-full bg-gradient-to-r from-slate-950 via-cyan-950/40 to-slate-950 border border-cyan-500/30 rounded-2xl p-4 sm:p-5 flex flex-col sm:flex-row items-center justify-between gap-4 shadow-[0_0_25px_rgba(6,182,212,0.12)] hover:border-cyan-400/60 transition-all group">
        <div className="flex items-center gap-3.5 text-center sm:text-left">
          <div className="w-11 h-11 rounded-xl bg-cyan-500/10 border border-cyan-500/30 flex items-center justify-center text-cyan-400 flex-shrink-0 shadow-[0_0_15px_rgba(6,182,212,0.2)] group-hover:scale-105 transition-transform">
            <Zap className="w-5 h-5 fill-cyan-400 text-cyan-400" />
          </div>
          <div>
            <div className="flex items-center justify-center sm:justify-start gap-2 mb-1 flex-wrap">
              <span className="text-[10px] font-mono font-bold tracking-widest text-cyan-400 uppercase bg-cyan-950/60 border border-cyan-500/30 px-2.5 py-0.5 rounded-full">
                {savedDesk ? t("home.savedDesk.title") : t("home.savedDesk.start")}
              </span>
              {savedDesk && resumeAge && (
                <span className="text-[10px] font-mono text-slate-400 tracking-wide">
                  {t("home.savedDesk.lastStudy", { age: resumeAge })}
                </span>
              )}
            </div>
            <h3 className="text-sm sm:text-base font-bold text-gray-200">
              <span className="text-white font-extrabold">{resume.langName}</span> •{" "}
              <span className="text-cyan-300">{resume.levelName}</span>
            </h3>
            <p className="text-[11px] sm:text-xs text-slate-400 mt-1">
              {savedDesk
                ? t("home.savedDesk.resumeDesc", { game: resumeGameLabel })
                : t("home.savedDesk.setupDesc")}
            </p>
          </div>
        </div>

        <button
          onClick={() => handleGameOrLevelStart(resume.levelId, resume.gameId)}
          className="w-full sm:w-auto px-6 py-3.5 bg-slate-900 border-2 border-red-500/60 text-red-500 font-black text-xs sm:text-sm rounded-xl hover:bg-slate-800 hover:border-red-500 hover:scale-[1.02] active:scale-95 transition-all shadow-[0_0_20px_rgba(239,68,68,0.25)] flex items-center justify-center gap-2 flex-shrink-0"
        >
          <Play className="w-4 h-4 fill-red-500 text-red-500" />
          <span className="text-red-500 font-black tracking-wider uppercase">
            {savedDesk ? t("home.savedDesk.resumeCta") : t("home.savedDesk.startCta")}
          </span>
        </button>
      </div>
      )}

      <div
        className="gamified-banner-container !min-h-0 !p-6 flex-col gap-4"
        style={{ background: "linear-gradient(135deg, #0f172a 0%, #172554 50%, #312e81 100%)" }}
      >
        <div className="banner-glow-effect"></div>
        <div className="relative z-10 w-full text-center">
          <span className="banner-badge mb-2">{t("home.step1")}</span>
          <h2 className="text-xl sm:text-2xl font-black text-white mb-2">
            {t("home.step1Title")}
          </h2>
        </div>

        <div className="flex flex-wrap items-center justify-center gap-3 sm:gap-6 relative z-10 w-full mt-2">
          {mainCategoriesWithGames.map((main, idx) => (
            <div key={main.id} className="flex items-center gap-3 sm:gap-6">
              {idx > 0 && (
                <div className="hidden sm:flex text-4xl sm:text-5xl font-black text-white/10 select-none">
                  /
                </div>
              )}
              <div className="flex items-center gap-3">
                <span className="text-4xl sm:text-5xl font-black text-cyan-500/40 select-none bg-clip-text bg-gradient-to-br from-cyan-400 to-purple-500 drop-shadow-lg">
                  {idx + 1}
                </span>
                <button
                  type="button"
                  onClick={() => setActiveMainId(main.id)}
                  className={`px-6 py-3 rounded-xl font-bold transition-all duration-300 flex items-center gap-2 border-2 ${
                    activeMainId === main.id || (activeMainId === "game" && previousMainId === main.id)
                      ? "bg-gradient-to-r from-cyan-500 to-blue-500 text-white border-transparent shadow-[0_0_20px_rgba(6,182,212,0.5)] scale-105"
                      : "bg-dark-900/60 text-gray-300 border-white/10 hover:border-cyan-500/50 hover:bg-dark-800"
                  }`}
                >
                  {main.name}
                </button>
              </div>
            </div>
          ))}
          {/* Third Category: Akademik */}
          <div className="flex items-center gap-3 sm:gap-6">
            <div className="hidden sm:flex text-4xl sm:text-5xl font-black text-white/10 select-none">
              /
            </div>
            <div className="flex items-center gap-3">
              <span className="text-4xl sm:text-5xl font-black text-cyan-500/40 select-none bg-clip-text bg-gradient-to-br from-cyan-400 to-purple-500 drop-shadow-lg">
                3
              </span>
              <button
                type="button"
                onClick={() => router.push("/sozluk/")}
                className="px-6 py-3 rounded-xl font-bold transition-all duration-300 flex items-center gap-2 border-2 bg-dark-900/60 text-gray-300 border-white/10 hover:border-cyan-500/50 hover:bg-dark-800 hover:text-white cursor-pointer"
              >
                {t("home.academic")}
              </button>
            </div>
          </div>
        </div>
        <div className="relative z-10 w-full text-center mt-1">
          <button
            type="button"
            onClick={() => router.push("/vocabulary")}
            className="text-xs font-bold text-slate-500 hover:text-emerald-300 transition-colors underline-offset-2 hover:underline bg-transparent border-none cursor-pointer"
          >
            {t("home.vaultHint")}
          </button>
        </div>
      </div>

      <div
        className="gamified-banner-container !min-h-0 !p-6 flex-col gap-4 animate-in fade-in slide-in-from-top-4 duration-500"
        style={{ background: "linear-gradient(135deg, #1e1b4b 0%, #2e1065 50%, #4c1d95 100%)" }}
      >
        <div
          className="banner-glow-effect"
          style={{
            right: "auto",
            left: "-10%",
            background: "radial-gradient(circle, rgba(56,189,248,0.3) 0%, rgba(0,0,0,0) 70%)",
          }}
        ></div>
        <div className="relative z-10 w-full text-center">
          <span
            className="banner-badge mb-2"
            style={{ borderColor: "#38bdf8", color: "#7dd3fc", background: "rgba(56, 189, 248, 0.2)" }}
          >
            {t("home.step2")}
          </span>
          <h2 className="text-lg sm:text-xl font-bold text-white mb-2">
            {t("home.step2Title")}
          </h2>
        </div>

        <div className="flex flex-wrap gap-3 justify-center relative z-10 w-full mt-2">
          {activeMainId === "game" ? (
            <div className="flex gap-4 items-center">
              <button
                type="button"
                onClick={() => setActiveMainId(previousMainId || defaults.mainId)}
                className="bg-dark-900/60 text-gray-300 hover:text-white px-4 py-3 rounded-xl border border-white/10 hover:border-gray-500 transition-colors flex items-center gap-2 font-bold"
              >
                <ChevronLeft className="w-5 h-5" /> {t("common.back")}
              </button>
              <button
                type="button"
                className="bg-gradient-to-r from-purple-500 to-indigo-500 text-white shadow-[0_0_20px_rgba(168,85,247,0.5)] px-6 py-3 rounded-xl font-bold transition-all duration-300 scale-105 border-transparent cursor-default"
              >
                {t("home.step3GameTitle")}
              </button>
            </div>
          ) : (
            currentMain?.subCategories.map((sub) => (
              <button
                type="button"
                key={sub.id}
                onClick={() => {
                  setActiveSubId(sub.id);
                  const first = sub.levels?.[0]?.id || "";
                  setActiveLevelId(first);
                }}
                className={`px-6 py-3 rounded-xl font-bold transition-all duration-300 flex items-center gap-2 border-2 ${
                  activeSubId === sub.id
                    ? "bg-gradient-to-r from-purple-500 to-pink-500 text-white shadow-[0_0_20px_rgba(217,70,239,0.5)] scale-105 border-transparent"
                    : "bg-dark-900/60 text-gray-300 border-white/10 hover:border-purple-500/50 hover:bg-dark-800"
                }`}
              >
                {sub.name}
              </button>
            ))
          )}
        </div>
      </div>

      <div className="gamified-banner-container !min-h-0 !p-6 flex-col gap-4 animate-in fade-in slide-in-from-top-4 duration-500" style={{ background: 'linear-gradient(135deg, #020617 0%, #0891b2 50%, #0f766e 100%)', alignItems: 'stretch' }}>
        <div className="banner-glow-effect" style={{ top: 'auto', bottom: '-50%', background: 'radial-gradient(circle, rgba(16,185,129,0.3) 0%, rgba(0,0,0,0) 70%)' }}></div>
        <div className="relative z-10 w-full text-center">
          <span className="banner-badge mb-2" style={{ borderColor: '#34d399', color: '#6ee7b7', background: 'rgba(52, 211, 153, 0.2)' }}>🔥 ADIM 3</span>
          <h2 className="text-lg sm:text-xl font-bold text-white mb-4">
            {activeMainId === 'games' ? 'OYUN SEÇİMİ (GAME OPTIONS)' : 'SEVİYE SEÇENEKLERİ (LEVEL OPTIONS)'}
          </h2>

          {activeMainId !== 'games' && currentSub?.sentenceLevels?.length > 0 && !isIlkokulSub && (
            <div className="flex justify-center mb-6">
              <div className="bg-dark-900/60 p-1.5 rounded-xl border border-white/10 inline-flex">
                <button
                  onClick={() => { setActiveLevelMode('words'); setActiveLevelId(''); }}
                  className={`px-4 sm:px-6 py-2 sm:py-2.5 rounded-lg font-bold text-sm sm:text-base transition-all duration-300 flex items-center gap-2 ${
                    activeLevelMode === 'words'
                      ? 'bg-gradient-to-r from-emerald-500 to-teal-600 text-white shadow-lg'
                      : 'text-gray-400 hover:text-white hover:bg-white/5'
                  }`}
                >
                  📚 Kelimeler
                </button>
                <button
                  onClick={() => { setActiveLevelMode('sentences'); setActiveLevelId(''); }}
                  className={`px-4 sm:px-6 py-2 sm:py-2.5 rounded-lg font-bold text-sm sm:text-base transition-all duration-300 flex items-center gap-2 ${
                    activeLevelMode === 'sentences'
                      ? 'bg-gradient-to-r from-blue-500 to-indigo-600 text-white shadow-lg'
                      : 'text-gray-400 hover:text-white hover:bg-white/5'
                  }`}
                >
                  💬 En Sık Kullanılan Cümleler
                </button>
              </div>
            </div>
          )}


        </div>
        
        <div className="relative z-10 w-full">
          {activeMainId === 'games' ? (
            <GameSelector 
              activeGameId={activeGameId}
              onSelectGame={(gameId) => {
                setActiveGameId(gameId);
                handleGameOrLevelStart(activeLevelId, gameId);
              }} 
            />
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 max-h-[400px] overflow-y-auto pr-2 custom-scrollbar">
              {displayLevels.map((level) => {
                const formatted = formatLevelName(level.name);
                const isSentenceLevel =
                  level.id?.includes("sentences") ||
                  level.path?.toLowerCase().includes("cumle") ||
                  level.path?.toLowerCase().includes("sentence");
                const playlistCategory = getPlaylistCategory(level.id);
                return (
                <div
                  key={level.id}
                  className={`p-4 rounded-xl text-center border-2 flex flex-col items-center justify-between min-h-[120px] relative overflow-hidden group transition-all duration-300 ${
                    activeLevelId === level.id 
                      ? "bg-gradient-to-br from-emerald-500 to-teal-600 text-white border-transparent shadow-[0_0_20px_rgba(16,185,129,0.5)] scale-[1.03] z-10" 
                      : isSentenceLevel
                        ? "bg-dark-900/60 border-cyan-500/30 text-gray-300 hover:border-cyan-400/60 hover:bg-dark-800"
                        : "bg-dark-900/60 border-white/10 text-gray-300 hover:border-emerald-500/50 hover:bg-dark-800"
                  }`}
                >
                  <div 
                    onClick={() => {
                      const isIlkokul = level.id.toLowerCase().includes("ilkokul") || activeSubId.toLowerCase().includes("ilkokul");
                      if (isIlkokul) {
                        handleGameOrLevelStart(level.id, "word-card");
                      } else {
                        setPreviousMainId(activeMainId);
                        setActiveLevelId(level.id);
                        setActiveMainId("games");
                      }
                    }}
                    className="cursor-pointer flex-1 flex flex-col items-center justify-center gap-2 w-full"
                  >
                    {isSentenceLevel && (
                      <span className={`absolute top-2 left-2 text-[9px] font-black uppercase tracking-wider px-2 py-0.5 rounded-md ${
                        activeLevelId === level.id
                          ? "bg-white/20 text-white"
                          : "bg-cyan-500/20 text-cyan-300"
                      }`}>
                        Cümle
                      </span>
                    )}
                    <div className={`font-black text-[15px] sm:text-base leading-tight transition-colors ${activeLevelId === level.id ? 'text-white' : 'text-gray-200 group-hover:text-emerald-400'}`}>
                      {formatted.levelText}
                    </div>
                    {formatted.descText && (
                      <div className={`text-sm font-medium w-full leading-snug mt-1 transition-colors ${activeLevelId === level.id ? 'text-white font-bold' : 'text-gray-300 group-hover:text-emerald-200'}`}>
                        {formatted.descText}
                      </div>
                    )}
                    {isIlkokulSub && (
                      <div className={`text-[11px] mt-1 ${activeLevelId === level.id ? 'text-emerald-100' : 'text-slate-500'}`}>
                        Ünite seçimi oyunda
                      </div>
                    )}
                  </div>
                  
                  {playlistCategory && (
                    <button
                      type="button"
                      onClick={(e) => {
                        e.stopPropagation();
                        router.push(`/videos?playlist=${playlistCategory}`);
                      }}
                      className={`mt-3 w-full py-1.5 rounded-lg text-[10px] font-black tracking-wider flex items-center justify-center gap-1.5 border transition-all z-20 ${
                        activeLevelId === level.id
                          ? "bg-white/20 hover:bg-white/30 text-white border-white/30"
                          : "bg-red-500/10 hover:bg-red-500/25 text-red-400 border-red-500/30 hover:border-red-500/60"
                      }`}
                    >
                      <Video className="w-3.5 h-3.5 fill-current" />
                      VİDEOYLA ÇALIŞ
                    </button>
                  )}

                  {activeLevelId === level.id && (
                     <div className="absolute top-2 right-2">
                       <span className="flex h-3 w-3 relative">
                          <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-white opacity-75"></span>
                          <span className="relative inline-flex rounded-full h-3 w-3 bg-white"></span>
                        </span>
                     </div>
                  )}
                </div>
              )})}
              {displayLevels.length === 0 && (
                <div className="col-span-full text-center text-gray-500 py-10 font-mono">VERİ BULUNAMADI</div>
              )}
            </div>
          )}
        </div>
      </div>

    </div>
  );
}
