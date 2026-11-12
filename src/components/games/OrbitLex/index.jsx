"use client";

import React, { useMemo, useCallback } from "react";
import { GameApp } from "./GameApp";
import { useLessonLoader } from "../../../hooks/useLessonLoader";
import { useMemolandumStore } from "../../../store/useMemolandumStore";
import { applySessionProgress } from "../../../lib/progress/applySessionProgress";
import { speakTts, playWordPronunciation } from "../../../lib/pronunciation";
import { preloadAudioAssetsNonBlocking } from "../../../lib/contentCdn";
import SkeletonLoader from "../../SkeletonLoader";

import { resolveEnglishSynonymsAndAntonyms } from "./game/lexicon";

class OrbitLexErrorBoundary extends React.Component {
  constructor(props) {
    super(props);
    this.state = { hasError: false };
  }
  static getDerivedStateFromError(error) {
    return { hasError: true };
  }
  componentDidCatch(error, errorInfo) {
    console.error("[OrbitLex] Caught error:", error, errorInfo);
  }
  render() {
    if (this.state.hasError) {
      return (
        <div className="w-full h-full min-h-[600px] flex flex-col items-center justify-center bg-[#070b14] text-white p-6 text-center">
          <div className="max-w-md p-6 rounded-2xl bg-slate-900 border border-cyan-500/30 shadow-2xl">
            <h2 className="text-xl font-bold text-cyan-400 mb-2">OrbitLex Yörüngesi Yeniden Başlatılıyor</h2>
            <p className="text-xs text-slate-300 mb-4">Bir yükleme gecikmesi oluştu. Yörüngeyi sıfırlayarak hemen oyuna başlayabilirsiniz.</p>
            <div className="flex gap-3 justify-center">
              <button
                type="button"
                onClick={() => this.setState({ hasError: false })}
                className="px-4 py-2 rounded-xl bg-cyan-500 text-slate-950 font-bold text-xs hover:bg-cyan-400 cursor-pointer"
              >
                Yeniden Başlat
              </button>
              <button
                type="button"
                onClick={() => { window.location.href = '/games/'; }}
                className="px-4 py-2 rounded-xl bg-slate-800 text-slate-300 font-bold text-xs hover:bg-slate-700 cursor-pointer"
              >
                Oyun Menüsü
              </button>
            </div>
          </div>
        </div>
      );
    }
    return this.props.children;
  }
}

export function OrbitLexInner({
  levelId,
  langId,
  onExit,
  onNextLevel,
  isAudioEnabled = true,
  setIsAudioEnabled,
  isFxEnabled = true,
  setIsFxEnabled,
}) {
  const { words, isLoading } = useLessonLoader(levelId, langId);
  const recordWordQuizResult = useMemolandumStore((s) => s.recordWordQuizResult);

  // Convert Memolandum level words to OrbitLex compatible format with pure English synonyms & antonyms
  const mappedWords = useMemo(() => {
    if (!words || words.length === 0) return undefined;
    return words.map((w, idx) => {
      const resolved = resolveEnglishSynonymsAndAntonyms(w);
      const turkishMeaning = String(w.turkish || w.meaning || w.translation || "").trim();
      let rawEng = String(w.english || w.word || w.original_script || "WORD").trim();
      let cleanTarget = rawEng;
      if (cleanTarget.includes("/")) cleanTarget = cleanTarget.split("/")[0].trim();
      cleanTarget = cleanTarget.replace(/\(.*?\)/g, "").trim();

      return {
        id: String(w.id || `w-${idx}`),
        word: cleanTarget.toUpperCase(),
        definition: String(w.english_definition || w.definition || w.content || rawEng),
        definitionTr: turkishMeaning,
        synonyms: resolved.synonyms,
        antonyms: resolved.antonyms,
      };
    });
  }, [words]);

  const handleComplete = useCallback(
    (result) => {
      if (!result) return;
      const earnedScore =
        (result.coins || 0) * 10 +
        (result.diamonds || 0) * 25 +
        (result.stars || 1) * 50;
      const earnedGems = Number(result.diamonds || 0);

      if (earnedScore > 0 || earnedGems > 0) {
        applySessionProgress("orbitlex", { score: earnedScore, gems: earnedGems });
      }

      const matchedWord = (words || []).find((w) => {
        const eng = String(w.english || w.word || "").toUpperCase();
        return eng.includes(String(result.word || "").toUpperCase()) ||
          String(result.word || "").toUpperCase().includes(eng);
      });

      if (matchedWord && typeof recordWordQuizResult === "function") {
        recordWordQuizResult(matchedWord, true, Number(result.time) || 6, {
          language: langId,
          gameId: "orbitlex",
        });
        if (isAudioEnabled) {
          playWordPronunciation(matchedWord, { isAudioEnabled, langId, includeMeaning: true });
        }
        const solvedIdx = (words || []).indexOf(matchedWord);
        if (solvedIdx >= 0) {
          preloadAudioAssetsNonBlocking(words, solvedIdx + 1);
        }
      }
      // Note: We do NOT advance level on every single word.
      // Next level navigation happens when the player finishes all words of the level!
    },
    [words, langId, recordWordQuizResult]
  );

  const handleExit = useCallback(() => {
    if (typeof onExit === "function") {
      onExit();
    } else {
      window.location.href = "/games/";
    }
  }, [onExit]);

  if (isLoading && (!mappedWords || mappedWords.length === 0)) {
    return <SkeletonLoader gameType="orbitlex" />;
  }

  return (
    <div className="w-full h-full min-h-[600px] relative bg-[#070b14] flex flex-col font-sans">
      <GameApp
        words={mappedWords}
        assetBase="/sprites"
        storageKey={`orbit-lex-${levelId || "default"}`}
        onComplete={handleComplete}
        onNextLevel={onNextLevel}
        onExit={handleExit}
        showMenu={!levelId}
        isAudioEnabled={isAudioEnabled}
        setIsAudioEnabled={setIsAudioEnabled}
      />
    </div>
  );
}

export default function OrbitLexShell(props) {
  return (
    <OrbitLexErrorBoundary>
      <OrbitLexInner {...props} />
    </OrbitLexErrorBoundary>
  );
}

