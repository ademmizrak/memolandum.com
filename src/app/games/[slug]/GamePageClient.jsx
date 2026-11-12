"use client";

import { useEffect, useState, useMemo, useRef } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import dynamic from "next/dynamic";
import { useMemolandumStore } from "../../../store/useMemolandumStore";
import SkeletonLoader from "../../../components/SkeletonLoader";
import { useStoreHydrated } from "../../../hooks/useStoreHydrated";
import {
  findNextLevelId,
  findLevelContext,
  normalizeStudyContext,
  resolveResumeContext,
} from "../../../lib/learning/studyContext";
import {
  readQuizReturnContext,
  clearQuizReturnContext,
} from "../../../lib/learning/quizReturn";
import { resolveManifestLangId, getSlugFromManifestLangId } from "../../../lib/seo/learnPathwayResolve";
import { buildGamesPickerHref } from "../../../lib/seo/arcadeShells";
import {
  useAnalytics,
  fireCanvasReadyAnalytics,
  fireLevelAbandonedIfIncomplete,
} from "../../../hooks/useAnalytics";
import { TextlessOnboardingHint } from "../../../components/games/shared/TextlessOnboardingHint";

const GameEngineWrapper = dynamic(() => import("../../../engines/base"), {
  ssr: false,
  loading: () => <SkeletonLoader gameType="loading" />,
});

const VALID_SLUGS = [
  "shooter",
  "breakout",
  "highway",
  "invaders",
  "wordascent",
  "worddrop",
  "quiz",
  "lexicon",
  "hangman",
  "word-snake",
  "academic-shooter",
  "academic-lexicon",
  "word-card",
  "word-board",
  "star-cards",
  "orbitlex",
];

const LEVEL_ALIAS_MAP = {
  "grade-1": { langId: "en-tr_eng_ilkokul", levelId: "meb-1-sinif-kelimeleri" },
  "sinif-1": { langId: "en-tr_eng_ilkokul", levelId: "meb-1-sinif-kelimeleri" },
  "grade-2": { langId: "en-tr_eng_ilkokul", levelId: "meb-2-sinif-kelimeleri" },
  "sinif-2": { langId: "en-tr_eng_ilkokul", levelId: "meb-2-sinif-kelimeleri" },
  "grade-3": { langId: "en-tr_eng_ilkokul", levelId: "meb-3-sinif-kelimeleri" },
  "sinif-3": { langId: "en-tr_eng_ilkokul", levelId: "meb-3-sinif-kelimeleri" },
  "grade-4": { langId: "en-tr_eng_ilkokul", levelId: "meb-4-sinif-kelimeleri" },
  "sinif-4": { langId: "en-tr_eng_ilkokul", levelId: "meb-4-sinif-kelimeleri" },
  "grade-5": { langId: "en-tr_eng_ortaokul", levelId: "meb-5-sinif-kelimeleri" },
  "sinif-5": { langId: "en-tr_eng_ortaokul", levelId: "meb-5-sinif-kelimeleri" },
  "grade-6": { langId: "en-tr_eng_ortaokul", levelId: "meb-6-sinif-kelimeleri" },
  "sinif-6": { langId: "en-tr_eng_ortaokul", levelId: "meb-6-sinif-kelimeleri" },
  "grade-7": { langId: "en-tr_eng_ortaokul", levelId: "meb-7-sinif-kelimeleri" },
  "sinif-7": { langId: "en-tr_eng_ortaokul", levelId: "meb-7-sinif-kelimeleri" },
  "grade-8": { langId: "en-tr_eng_ortaokul", levelId: "meb-8-sinif-kelimeleri" },
  "sinif-8": { langId: "en-tr_eng_ortaokul", levelId: "meb-8-sinif-kelimeleri" },
  lgs: { langId: "en-tr_eng_ortaokul", levelId: "meb-8-sinif-kelimeleri" },
  yds: { langId: "en-tr_eng_yds_kelimeleri", levelId: "ingilizce-yds-kelimeleri-yds-grup1-en-tr-v2" },
  yokdil: { langId: "en-tr_eng_yds_kelimeleri", levelId: "ingilizce-yds-kelimeleri-yds-grup1-en-tr-v2" },
  ielts: { langId: "en-tr_eng_yds_kelimeleri", levelId: "ingilizce-yds-kelimeleri-yds-grup1-en-tr-v2" },
  toefl: { langId: "en-tr_eng_yds_kelimeleri", levelId: "ingilizce-yds-kelimeleri-yds-grup1-en-tr-v2" },
  yks: { langId: "en-tr_eng_yks_kelimeleri", levelId: "ingilizce-yks-kelimeleri-yks-kelimeler-1" },
  ydt: { langId: "en-tr_eng_yks_kelimeleri", levelId: "ingilizce-yks-kelimeleri-yks-kelimeler-1" },
};

export default function GamePageClient({ slug }) {
  const router = useRouter();
  const searchParams = useSearchParams();
  const hydrated = useStoreHydrated();
  const [mounted, setMounted] = useState(false);
  const [isFullscreen, setIsFullscreen] = useState(false);

  const toggleSmartboardFullscreen = () => {
    if (typeof document === "undefined") return;
    try {
      if (!document.fullscreenElement) {
        document.documentElement.requestFullscreen?.();
        setIsFullscreen(true);
      } else {
        document.exitFullscreen?.();
        setIsFullscreen(false);
      }
    } catch {
      /* ignore */
    }
  };

  const lastPlayedLang = useMemolandumStore((s) => s.lastPlayedLang);
  const lastPlayedLevel = useMemolandumStore((s) => s.lastPlayedLevel);
  const lastPlayedGame = useMemolandumStore((s) => s.lastPlayedGame);
  const lastPlayedAt = useMemolandumStore((s) => s.lastPlayedAt);
  const setLastPlayed = useMemolandumStore((s) => s.setLastPlayed);

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

  const urlContext = useMemo(() => {
    const raw =
      searchParams?.get("lang") ||
      searchParams?.get("pathway") ||
      searchParams?.get("langPair");
    const levelParam = searchParams?.get("level");
    if (!raw && !levelParam) return null;
    const alias = levelParam ? LEVEL_ALIAS_MAP[levelParam.toLowerCase().trim()] : null;
    const manifestLangId = alias?.langId || resolveManifestLangId(raw);
    const resolvedLevelId = alias?.levelId || levelParam || undefined;
    const ctx = normalizeStudyContext({
      langId: manifestLangId || undefined,
      levelId: resolvedLevelId,
      gameId: slug,
      lastPlayedAt: Date.now(),
    });
    if (!ctx?.langId || !ctx?.levelId) return null;
    return ctx;
  }, [searchParams, slug]);

  const activeContext = urlContext || resume;

  const { trackGameStart, trackGameComplete } = useAnalytics();

  useEffect(() => {
    setMounted(true);
    if (!VALID_SLUGS.includes(slug)) {
      router.push("/");
    } else {
      trackGameStart(slug, activeContext.langId || "", activeContext.levelId || "");
    }
  }, [slug, router, activeContext.langId, activeContext.levelId, trackGameStart]);

  // Faz 1 Huni Teşhis: Canvas ilk frame hazır olduğunda `canvas_ready` ve
  // seviye bitmeden sayfadan çıkılırsa `level_abandoned` event'lerini ateşle
  useEffect(() => {
    if (!hydrated || !mounted || !VALID_SLUGS.includes(slug)) return undefined;

    const rafId = window.requestAnimationFrame(() => {
      fireCanvasReadyAnalytics(
        slug,
        activeContext.langId || "",
        activeContext.levelId || ""
      );
    });

    const handleVisibilityChange = () => {
      if (document.visibilityState === "hidden") {
        fireLevelAbandonedIfIncomplete("visibilitychange_hidden");
      }
    };
    const handlePageHide = () => {
      fireLevelAbandonedIfIncomplete("pagehide");
    };

    document.addEventListener("visibilitychange", handleVisibilityChange);
    window.addEventListener("pagehide", handlePageHide);

    return () => {
      window.cancelAnimationFrame(rafId);
      document.removeEventListener("visibilitychange", handleVisibilityChange);
      window.removeEventListener("pagehide", handlePageHide);
      fireLevelAbandonedIfIncomplete("component_unmount");
    };
  }, [hydrated, mounted, slug, activeContext.langId, activeContext.levelId]);

  // Özel seviye yalnızca kasadan başlatılan oturumda geçerli; bayrak yoksa kilidi kır
  useEffect(() => {
    if (!hydrated || !mounted) return;
    const words = useMemolandumStore.getState().activeCustomWords;
    if (!Array.isArray(words) || words.length === 0) return;
    let ok = false;
    try {
      ok = sessionStorage.getItem("memolandum-custom-play") === "1";
    } catch {
      ok = false;
    }
    if (!ok) {
      useMemolandumStore.getState().clearActiveCustomWords();
    }
  }, [hydrated, mounted]);

  // Masayı sabitle: URL deep-link veya son oynanan bağlamla store'u senkronla
  useEffect(() => {
    if (!hydrated || !mounted || !VALID_SLUGS.includes(slug)) return;
    const targetLang = activeContext?.langId;
    const targetLevel = activeContext?.levelId;
    if (!targetLang || !targetLevel) return;
    const cur = useMemolandumStore.getState();
    if (
      cur.lastPlayedLang !== targetLang ||
      cur.lastPlayedLevel !== targetLevel ||
      cur.lastPlayedGame !== slug
    ) {
      setLastPlayed(targetLang, targetLevel, slug);
    }
  }, [hydrated, mounted, slug, activeContext?.langId, activeContext?.levelId, setLastPlayed]);

  if (!mounted || !hydrated) return <SkeletonLoader gameType={slug} />;
  if (!VALID_SLUGS.includes(slug)) return null;

  return (
    <div
      dir="ltr"
      data-game-ltr="true"
      className="w-full h-[100dvh] min-h-0 overflow-hidden bg-dark-950 text-gray-200 font-sans selection:bg-primary-500/30 flex justify-center items-center pb-[env(safe-area-inset-bottom,0px)]"
    >
      {/* Görev C3: Akıllı Tahta (EBA / ETAP) Tam Ekran Butonu — yalnızca geniş ekranlarda oyun alanı dışında görünür */}
      <button
        type="button"
        onClick={toggleSmartboardFullscreen}
        title="Akıllı Tahta Tam Ekran Modu (Full Screen)"
        className="hidden xl:inline-flex fixed top-3 right-4 z-50 items-center gap-1.5 px-3 py-2 rounded-xl bg-slate-900/90 hover:bg-cyan-950/90 border border-cyan-500/40 text-cyan-300 text-xs font-bold shadow-lg cursor-pointer transition-all"
      >
        <span aria-hidden>🖥️</span>
        <span>{isFullscreen ? "Tam Ekrandan Çık" : "Akıllı Tahta Tam Ekran"}</span>
      </button>
      <div className="w-full max-w-[800px] h-full relative bg-dark-900 shadow-[0_0_50px_rgba(0,0,0,0.8)] border-x border-white/5">
        <TextlessOnboardingHint />
        <GameEngineWrapper
          key={`${activeContext.langId}-${activeContext.levelId}-${slug}`}
          gameType={slug}
          levelId={activeContext.levelId}
          langId={activeContext.langId}
          onExit={() => {
            // Pause / ANA MENÜ: ana sayfaya değil, bir önceki kabuk seçicisine dön.
            // Ana sayfa yalnızca hub’daki “Ana sayfa” veya marka linkiyle.
            useMemolandumStore.getState().clearActiveCustomWords();
            const langId =
              activeContext.langId ||
              useMemolandumStore.getState().lastPlayedLang ||
              searchParams?.get("lang") ||
              "";
            const levelId =
              activeContext.levelId ||
              useMemolandumStore.getState().lastPlayedLevel ||
              searchParams?.get("level") ||
              "";
            if (langId && levelId) {
              setLastPlayed(langId, levelId, slug);
            }
            const pathway =
              searchParams?.get("pathway") ||
              getSlugFromManifestLangId(langId) ||
              "";
            router.push(
              buildGamesPickerHref({
                pathway: pathway || undefined,
                langId: langId || undefined,
                levelId: levelId || undefined,
              })
            );
          }}
          onNextLevel={(nextLvl) => {
            trackGameComplete(slug, 100);
            useMemolandumStore.getState().clearActiveCustomWords();
            const returnCtx = readQuizReturnContext();

            if (slug === 'quiz' && returnCtx?.gameId) {
              const next = nextLvl || findNextLevelId(returnCtx.langId, returnCtx.levelId);
              if (next) {
                setLastPlayed(returnCtx.langId, next, returnCtx.gameId);
                clearQuizReturnContext();
                router.push(`/games/${returnCtx.gameId}`);
              } else {
                clearQuizReturnContext();
                const pathway =
                  searchParams?.get("pathway") ||
                  getSlugFromManifestLangId(returnCtx.langId) ||
                  "";
                router.push(
                  buildGamesPickerHref({
                    pathway: pathway || undefined,
                    langId: returnCtx.langId || undefined,
                    levelId: returnCtx.levelId || undefined,
                  })
                );
              }
            } else {
              const next =
                nextLvl || findNextLevelId(activeContext.langId, activeContext.levelId);
              if (!next) {
                const pathway =
                  searchParams?.get("pathway") ||
                  getSlugFromManifestLangId(activeContext.langId) ||
                  "";
                router.push(
                  buildGamesPickerHref({
                    pathway: pathway || undefined,
                    langId: activeContext.langId || undefined,
                    levelId: activeContext.levelId || undefined,
                  })
                );
                return;
              }
              const nextCtx = findLevelContext(next);
              const targetLang = nextCtx?.langId || activeContext.langId;
              setLastPlayed(targetLang, next, slug);
              
              // Sync URL to reflect the new level
              const pathway = searchParams?.get("pathway") || getSlugFromManifestLangId(targetLang) || "";
              const lang = searchParams?.get("lang") || targetLang || "";
              const q = new URLSearchParams();
              if (pathway) q.set("pathway", pathway);
              if (lang) q.set("lang", lang);
              q.set("level", next);
              router.replace(`/games/${slug}/?${q.toString()}`);
            }
          }}
        />
      </div>
    </div>
  );
}
