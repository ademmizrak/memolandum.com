"use client";

import React, { useEffect, useMemo } from "react";
import Link from "next/link";
import { useMemolandumStore } from "../../store/useMemolandumStore";
import { buildGameShellHref } from "../../lib/seo/arcadeShells";
import { resolveManifestLangId } from "../../lib/seo/learnPathwayResolve";

function parseContextFromHref(href = "") {
  if (!href || typeof href !== "string") {
    return { pathway: "", langId: "", levelId: "" };
  }
  const qIndex = href.indexOf("?");
  if (qIndex === -1) {
    return { pathway: "", langId: "", levelId: "" };
  }
  const params = new URLSearchParams(href.slice(qIndex + 1));
  const pathway = params.get("pathway") || "";
  const langId = params.get("lang") || pathway || "";
  const levelId = params.get("level") || (langId ? "a1_words.json" : "");
  return { pathway, langId, levelId };
}

/**
 * Faz 3: Zero-Friction 1-Click Direct Game Launch CTA for Programmatic SEO pages (`/learn/[langPair]/...` & `/ar/...`)
 *
 * - Automatically writes the page's language pair (`ar-en`, `en-ar`, etc.) and level into
 *   `useMemolandumStore` (`setLastPlayed`) so the user never sees a redundant language/category selection modal.
 * - Directly launches into the playable HTML5 Canvas shell in a single click when pathway/lang context is present.
 */
export default function LearnStartButton({
  href,
  label,
  pathway = "",
  langId = "",
  levelId = "",
  directGameId = "shooter",
  directLaunch = true,
}) {
  const parsed = useMemo(() => parseContextFromHref(href), [href]);
  const resolvedPathway = pathway || parsed.pathway;
  const rawLang = langId || parsed.langId || resolvedPathway;
  const resolvedLangId = resolveManifestLangId(rawLang) || rawLang;
  const resolvedLevelId = levelId || parsed.levelId || (resolvedLangId ? "a1_words.json" : "");

  const targetHref = useMemo(() => {
    if (
      directLaunch &&
      resolvedLangId &&
      resolvedLevelId &&
      typeof href === "string" &&
      (href.startsWith("/games?") || href.startsWith("/games/?"))
    ) {
      return buildGameShellHref(directGameId, {
        pathway: resolvedPathway,
        langId: resolvedLangId,
        levelId: resolvedLevelId,
      });
    }
    return href || "/games/";
  }, [directLaunch, directGameId, href, resolvedLangId, resolvedLevelId, resolvedPathway]);

  const syncContextToStore = () => {
    try {
      if (resolvedLangId && resolvedLevelId) {
        const state = useMemolandumStore.getState();
        if (typeof state?.setLastPlayed === "function") {
          state.setLastPlayed(resolvedLangId, resolvedLevelId, state.lastPlayedGame || directGameId);
        }
      }
      if (
        typeof window !== "undefined" &&
        resolvedPathway &&
        resolvedPathway.toLowerCase().startsWith("ar-")
      ) {
        const existing = window.localStorage?.getItem("memolandum-ui-locale");
        if (!existing) {
          window.localStorage?.setItem("memolandum-ui-locale", "ar");
          document.documentElement.lang = "ar";
          document.documentElement.dir = "rtl";
        }
      }
    } catch {
      // Ignore storage sync errors
    }
  };

  useEffect(() => {
    syncContextToStore();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [resolvedPathway, resolvedLangId, resolvedLevelId]);

  return (
    <Link
      href={targetHref}
      rel={targetHref.includes("?") ? "nofollow" : undefined}
      onClick={syncContextToStore}
      className="inline-flex items-center justify-center gap-2 rounded-xl bg-cyan-400 px-6 py-3.5 text-sm font-black tracking-wide text-slate-950 transition hover:bg-cyan-300 hover:shadow-lg hover:shadow-cyan-400/20"
    >
      <span>{label}</span>
      <span aria-hidden="true" className="inline-block transition-transform rtl:scale-x-[-1]">
        →
      </span>
    </Link>
  );
}
