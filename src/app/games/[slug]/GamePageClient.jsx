"use client";

import { useEffect, useState, useMemo, useRef } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import dynamic from "next/dynamic";
import { useMemolandumStore } from "../../../store/useMemolandumStore";
import SkeletonLoader from "../../../components/SkeletonLoader";
import { useStoreHydrated } from "../../../hooks/useStoreHydrated";
import {
  findNextLevelId,
  normalizeStudyContext,
  resolveResumeContext,
} from "../../../lib/learning/studyContext";
import {
  readQuizReturnContext,
  clearQuizReturnContext,
} from "../../../lib/learning/quizReturn";
import { resolveManifestLangId, getSlugFromManifestLangId } from "../../../lib/seo/learnPathwayResolve";

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
];

export default function GamePageClient({ slug }) {
  const router = useRouter();
  const searchParams = useSearchParams();
  const hydrated = useStoreHydrated();
  const [mounted, setMounted] = useState(false);
  const pathwayApplied = useRef(false);

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

  useEffect(() => {
    setMounted(true);
    if (!VALID_SLUGS.includes(slug)) {
      router.push("/");
    }
  }, [slug, router]);

  // Ã–zel seviye yalnÄ±zca kasadan baÅŸlatÄ±lan oturumda geÃ§erli; bayrak yoksa kilidi kÄ±r
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

  // /learn SEO deep-link: ?pathway=de-tr | ?lang=other-almanca-de_tr
  useEffect(() => {
    if (!hydrated || !mounted || !VALID_SLUGS.includes(slug) || pathwayApplied.current) {
      return;
    }
    const raw =
      searchParams?.get("lang") ||
      searchParams?.get("pathway") ||
      searchParams?.get("langPair");
    const levelParam = searchParams?.get("level");
    if (!raw && !levelParam) return;

    const manifestLangId = resolveManifestLangId(raw);
    const ctx = normalizeStudyContext({
      langId: manifestLangId || undefined,
      levelId: levelParam || undefined,
      gameId: slug,
      lastPlayedAt: Date.now(),
    });
    if (!ctx?.langId || !ctx?.levelId) return;

    pathwayApplied.current = true;
    setLastPlayed(ctx.langId, ctx.levelId, slug);
  }, [hydrated, mounted, slug, searchParams, setLastPlayed]);

  // MasayÄ± sabitle: bu oyuna her giriÅŸte dil+seviye+oyun kaydÄ± yenilensin
  useEffect(() => {
    if (!hydrated || !mounted || !VALID_SLUGS.includes(slug)) return;
    // Deep-link henÃ¼z uygulanmadÄ±ysa bir tick bekle
    const raw =
      searchParams?.get("pathway") ||
      searchParams?.get("lang") ||
      searchParams?.get("langPair");
    if (raw && !pathwayApplied.current) return;

    const ctx = resolveResumeContext({
      lastPlayedLang: useMemolandumStore.getState().lastPlayedLang,
      lastPlayedLevel: useMemolandumStore.getState().lastPlayedLevel,
      lastPlayedGame: useMemolandumStore.getState().lastPlayedGame,
      lastPlayedAt: useMemolandumStore.getState().lastPlayedAt,
    });
    if (!ctx?.levelId || !ctx?.langId) return;
    setLastPlayed(ctx.langId, ctx.levelId, slug);
  }, [hydrated, mounted, slug, setLastPlayed, searchParams, lastPlayedLang, lastPlayedLevel]);

  if (!mounted || !hydrated) return <SkeletonLoader gameType={slug} />;
  if (!VALID_SLUGS.includes(slug)) return null;

  return (
    <div className="w-full h-screen overflow-hidden bg-dark-950 text-gray-200 font-sans selection:bg-primary-500/30 flex justify-center items-center">
      <div className="w-full max-w-[800px] h-full relative bg-dark-900 shadow-[0_0_50px_rgba(0,0,0,0.8)] border-x border-white/5">
        <GameEngineWrapper
          key={`${resume.langId}-${resume.levelId}-${slug}`}
          gameType={slug}
          levelId={resume.levelId}
          langId={resume.langId}
          onExit={() => {
            useMemolandumStore.getState().clearActiveCustomWords();
            if (resume.levelId && resume.langId) {
              setLastPlayed(resume.langId, resume.levelId, slug);
            }
            window.location.href = "/";
          }}
          onNextLevel={(nextLvl) => {
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
                router.push("/");
              }
            } else {
              const next =
                nextLvl || findNextLevelId(resume.langId, resume.levelId);
              if (!next) return;
              setLastPlayed(resume.langId, next, slug);
              
              // Sync URL to reflect the new level
              const pathway = searchParams?.get("pathway") || getSlugFromManifestLangId(resume.langId) || "";
              const lang = searchParams?.get("lang") || resume.langId || "";
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
