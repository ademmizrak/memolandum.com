"use client";

import React, { useState, useEffect, useCallback, useRef, useMemo } from "react";
import Link from "next/link";
import {
  QUIZ_GRADES_META,
  LGS_STRATEGY_CATEGORIES,
  LGS_ALL_MIXED_META,
  resolveQuizGradeMeta,
  buildRandomQuizSession,
  loadAllQuizStats,
  saveQuizAttemptResult,
} from "@/lib/quizzes/gradeQuizEngine";
import { playWordPronunciation } from "@/lib/pronunciation";
import { applySessionProgress } from "@/lib/progress/applySessionProgress";
import { useMemolandumStore } from "@/store/useMemolandumStore";
import {
  Award,
  CheckCircle2,
  XCircle,
  Volume2,
  VolumeX,
  RotateCcw,
  Sparkles,
  Flame,
  Clock,
  ChevronRight,
  ChevronLeft,
  Share2,
  Gamepad2,
  Zap,
  Trophy,
  BookOpen,
  Flag,
} from "lucide-react";

function playQuizTone(type = "correct", enabled = true) {
  if (!enabled || typeof window === "undefined") return;
  try {
    const AudioCtx = window.AudioContext || window.webkitAudioContext;
    if (!AudioCtx) return;
    const ctx = new AudioCtx();
    const now = ctx.currentTime;

    if (type === "correct") {
      const freqs = [523.25, 659.25, 783.99]; // C5 - E5 - G5 pleasant chord arpeggio
      freqs.forEach((f, idx) => {
        const osc = ctx.createOscillator();
        const gain = ctx.createGain();
        osc.type = "triangle";
        osc.frequency.setValueAtTime(f, now + idx * 0.06);
        gain.gain.setValueAtTime(0.12, now + idx * 0.06);
        gain.gain.exponentialRampToValueAtTime(0.001, now + idx * 0.06 + 0.22);
        osc.connect(gain);
        gain.connect(ctx.destination);
        osc.start(now + idx * 0.06);
        osc.stop(now + idx * 0.06 + 0.24);
      });
    } else if (type === "wrong") {
      const osc = ctx.createOscillator();
      const gain = ctx.createGain();
      osc.type = "sawtooth";
      osc.frequency.setValueAtTime(220, now);
      osc.frequency.linearRampToValueAtTime(165, now + 0.2);
      gain.gain.setValueAtTime(0.08, now);
      gain.gain.exponentialRampToValueAtTime(0.001, now + 0.24);
      osc.connect(gain);
      gain.connect(ctx.destination);
      osc.start(now);
      osc.stop(now + 0.25);
    } else if (type === "victory") {
      const notes = [523.25, 659.25, 783.99, 1046.5];
      notes.forEach((f, idx) => {
        const osc = ctx.createOscillator();
        const gain = ctx.createGain();
        osc.type = "triangle";
        osc.frequency.setValueAtTime(f, now + idx * 0.09);
        gain.gain.setValueAtTime(0.14, now + idx * 0.09);
        gain.gain.exponentialRampToValueAtTime(0.001, now + idx * 0.09 + 0.35);
        osc.connect(gain);
        gain.connect(ctx.destination);
        osc.start(now + idx * 0.09);
        osc.stop(now + idx * 0.09 + 0.36);
      });
    }
  } catch {
    /* ignore audio restriction */
  }
}

function getRankInfo(scoreOut100) {
  if (scoreOut100 >= 90) {
    return {
      stars: 5,
      badge: "🏆 Sınav Şampiyonu (Pekiyi)",
      message: "Muhteşem! Bu sınıfın kelimelerine ve cümle kalıplarına tam anlamıyla hakimsin!",
      color: "text-amber-300 border-amber-400/50 bg-amber-500/15",
    };
  }
  if (scoreOut100 >= 75) {
    return {
      stars: 4,
      badge: "🌟 Harika Başarı (İyi)",
      message: "Çok iyi bir sonuç! Sadece birkaç kelimeyi tekrar ederek 100 tam puana ulaşabilirsin.",
      color: "text-emerald-300 border-emerald-400/50 bg-emerald-500/15",
    };
  }
  if (scoreOut100 >= 55) {
    return {
      stars: 3,
      badge: "💪 Güzel İlerleme (Orta)",
      message: "Temelin güzel! Aşağıdaki yanlış yaptığın kelimeleri tekrar çözerek puanını hızla yükseltebilirsin.",
      color: "text-cyan-300 border-cyan-400/50 bg-cyan-500/15",
    };
  }
  return {
    stars: 2,
    badge: "🚀 Gelişim Zamanı (Tekrar Dene)",
    message: "Hiç sorun değil! Yanlışlarını incele ve hemen yeni bir 20 soruluk deneme testiyle rövanşı al!",
    color: "text-rose-300 border-rose-400/50 bg-rose-500/15",
  };
}

function normalizeGradeKey(val) {
  if (!val) return 5;
  const resolved = resolveQuizGradeMeta(val);
  if (resolved) return resolved.grade;
  return Number(val) || 5;
}

export default function GradeQuizRunner({ initialGrade = 5, showGradeSwitcher = true }) {
  const [activeGrade, setActiveGrade] = useState(() => normalizeGradeKey(initialGrade));
  const [quizMode, setQuizMode] = useState("mixed"); // "mixed" | "context" | "vocab"
  const [showHintBeforeAnswer, setShowHintBeforeAnswer] = useState(false);
  const [questions, setQuestions] = useState([]);
  const [poolSize, setPoolSize] = useState(100);
  const [currentIndex, setCurrentIndex] = useState(0);
  const [answersMap, setAnswersMap] = useState({}); // { [questionId]: { selectedLetter, selectedText, isCorrect, timeMs } }
  const [isFinished, setIsFinished] = useState(false);
  const [combo, setCombo] = useState(0);
  const [maxCombo, setMaxCombo] = useState(0);
  const [elapsedSec, setElapsedSec] = useState(0);
  const [autoAdvance, setAutoAdvance] = useState(true);
  const [soundEnabled, setSoundEnabled] = useState(true);
  const [autoSpeak, setAutoSpeak] = useState(false);
  const [gradeStats, setGradeStats] = useState(null);
  const [shareCopied, setShareCopied] = useState(false);
  const [isRetryWrongMode, setIsRetryWrongMode] = useState(false);

  const recordWordQuizResult = useMemolandumStore((s) => s.recordWordQuizResult);
  const questionStartRef = useRef(Date.now());
  const autoAdvanceTimerRef = useRef(null);
  const resetSeenCycleRef = useRef(false);

  const gradeMeta = useMemo(
    () => resolveQuizGradeMeta(activeGrade) || QUIZ_GRADES_META[3],
    [activeGrade]
  );

  // Start or restart a 20-question random session
  const startNewQuizSession = useCallback(
    (targetGrade = activeGrade, targetMode = quizMode, customSpecificQuestions = null) => {
      if (autoAdvanceTimerRef.current) {
        clearTimeout(autoAdvanceTimerRef.current);
      }
      const allStats = loadAllQuizStats();
      const gStat = allStats[String(targetGrade)] || null;
      setGradeStats(gStat);

      const seenIds = gStat?.seenQuestionIds || [];
      const session = buildRandomQuizSession(targetGrade, {
        count: 20,
        mode: targetMode,
        seenIds,
        specificQuestions: customSpecificQuestions,
      });

      resetSeenCycleRef.current = session.resetSeenCycle;
      setQuestions(session.questions);
      setPoolSize(session.poolSize || 100);
      setCurrentIndex(0);
      setAnswersMap({});
      setIsFinished(false);
      setCombo(0);
      setMaxCombo(0);
      setElapsedSec(0);
      setShareCopied(false);
      setShowHintBeforeAnswer(false);
      setIsRetryWrongMode(Boolean(customSpecificQuestions));
      questionStartRef.current = Date.now();
    },
    [activeGrade, quizMode]
  );

  useEffect(() => {
    setActiveGrade(normalizeGradeKey(initialGrade));
  }, [initialGrade]);

  useEffect(() => {
    startNewQuizSession(activeGrade, quizMode, null);
    return () => {
      if (autoAdvanceTimerRef.current) clearTimeout(autoAdvanceTimerRef.current);
    };
  }, [activeGrade, quizMode, startNewQuizSession]);

  // Stopwatch timer while quiz is active
  useEffect(() => {
    if (isFinished || questions.length === 0) return undefined;
    const interval = setInterval(() => {
      setElapsedSec((prev) => prev + 1);
    }, 1000);
    return () => clearInterval(interval);
  }, [isFinished, questions.length]);

  const currentQuestion = questions[currentIndex] || null;
  const currentAnswer = currentQuestion ? answersMap[currentQuestion.id] : null;

  const speakCurrentWord = useCallback(
    (q = currentQuestion) => {
      if (!q) return;
      playWordPronunciation(
        {
          word: q.english,
          english: q.english,
          audioUrl: q.audioUrl,
        },
        { isAudioEnabled: true, langId: gradeMeta.langId }
      );
    },
    [currentQuestion, gradeMeta.langId]
  );

  // Optional auto-speak when a new question appears
  useEffect(() => {
    if (!autoSpeak || isFinished || !currentQuestion) return;
    if (currentQuestion.effectiveType !== "tr_to_en") {
      speakCurrentWord(currentQuestion);
    }
  }, [currentIndex, autoSpeak, isFinished, currentQuestion, speakCurrentWord]);

  const finalizeQuiz = useCallback(
    (finalAnswers = answersMap) => {
      if (autoAdvanceTimerRef.current) clearTimeout(autoAdvanceTimerRef.current);
      setIsFinished(true);
      playQuizTone("victory", soundEnabled);

      const totalQ = questions.length || 20;
      let correctCount = 0;
      let wrongCount = 0;

      questions.forEach((q) => {
        const ans = finalAnswers[q.id];
        if (ans) {
          if (ans.isCorrect) correctCount++;
          else wrongCount++;
        }
      });

      const scoreOut100 = Math.round((correctCount / totalQ) * 100);
      const updatedStat = saveQuizAttemptResult(activeGrade, {
        score: scoreOut100,
        correctCount,
        wrongCount,
        totalQuestions: totalQ,
        durationSec: elapsedSec,
        questionIds: questions.map((q) => q.id),
        resetSeenCycle: resetSeenCycleRef.current,
      });

      if (updatedStat) setGradeStats(updatedStat);

      // Award XP & Gems in Memolandum global store
      const earnedScorePoints = correctCount * 100 + maxCombo * 25;
      const earnedGems = Math.max(1, Math.floor(correctCount / 4));
      applySessionProgress("quiz", { score: earnedScorePoints, gems: earnedGems });
    },
    [answersMap, questions, activeGrade, elapsedSec, maxCombo, soundEnabled]
  );

  const handleSelectOption = useCallback(
    (option) => {
      if (!currentQuestion || isFinished) return;
      if (answersMap[currentQuestion.id]) return; // already answered

      const timeTakenSec = Math.max(
        1,
        Math.round((Date.now() - questionStartRef.current) / 1000)
      );
      const isCorrect = Boolean(option.isCorrect);

      playQuizTone(isCorrect ? "correct" : "wrong", soundEnabled);

      // Record word in Spaced Repetition Vault & Parent Report Card
      try {
        recordWordQuizResult?.(
          {
            id: currentQuestion.wordId,
            word_id: currentQuestion.wordId,
            word: currentQuestion.english,
            english: currentQuestion.english,
            translation: currentQuestion.turkish,
            turkish: currentQuestion.turkish,
            example_sentence: currentQuestion.exampleSentence,
            audioUrl: currentQuestion.audioUrl,
          },
          isCorrect,
          timeTakenSec,
          { gameId: "deneme-quiz" }
        );
      } catch {
        /* ignore store sync errors */
      }

      const nextCombo = isCorrect ? combo + 1 : 0;
      setCombo(nextCombo);
      if (nextCombo > maxCombo) setMaxCombo(nextCombo);

      const nextAnswers = {
        ...answersMap,
        [currentQuestion.id]: {
          selectedLetter: option.letter,
          selectedText: option.text,
          isCorrect,
          timeSec: timeTakenSec,
        },
      };
      setAnswersMap(nextAnswers);

      // Check if all questions are answered or auto-advance is on
      const answeredCount = Object.keys(nextAnswers).length;
      if (answeredCount >= questions.length) {
        autoAdvanceTimerRef.current = setTimeout(() => {
          finalizeQuiz(nextAnswers);
        }, 950);
      } else if (autoAdvance) {
        autoAdvanceTimerRef.current = setTimeout(() => {
          // Move to next unanswered question
          const nextIdx = questions.findIndex(
            (q, idx) => idx > currentIndex && !nextAnswers[q.id]
          );
          if (nextIdx !== -1) {
            setCurrentIndex(nextIdx);
            questionStartRef.current = Date.now();
          } else {
            const firstUnanswered = questions.findIndex((q) => !nextAnswers[q.id]);
            if (firstUnanswered !== -1) {
              setCurrentIndex(firstUnanswered);
              questionStartRef.current = Date.now();
            }
          }
        }, isCorrect ? 950 : 1450);
      }
    },
    [
      currentQuestion,
      isFinished,
      answersMap,
      soundEnabled,
      recordWordQuizResult,
      combo,
      maxCombo,
      questions,
      autoAdvance,
      currentIndex,
      finalizeQuiz,
    ]
  );

  // Keyboard shortcuts (A, B, C, D or 1, 2, 3, 4, ArrowLeft, ArrowRight, Enter)
  useEffect(() => {
    const onKeyDown = (e) => {
      if (isFinished || !currentQuestion) return;
      if (e.target && ["INPUT", "TEXTAREA", "SELECT"].includes(e.target.tagName)) return;

      const key = e.key.toUpperCase();
      const mapIdx = { A: 0, B: 1, C: 2, D: 3, "1": 0, "2": 1, "3": 2, "4": 3 };
      if (mapIdx[key] !== undefined && !answersMap[currentQuestion.id]) {
        const opt = currentQuestion.options[mapIdx[key]];
        if (opt) {
          e.preventDefault();
          handleSelectOption(opt);
        }
      } else if (e.key === "ArrowRight" || (e.key === "Enter" && answersMap[currentQuestion.id])) {
        e.preventDefault();
        if (currentIndex < questions.length - 1) {
          if (autoAdvanceTimerRef.current) clearTimeout(autoAdvanceTimerRef.current);
          setCurrentIndex((i) => i + 1);
          questionStartRef.current = Date.now();
        } else if (Object.keys(answersMap).length > 0) {
          finalizeQuiz(answersMap);
        }
      } else if (e.key === "ArrowLeft") {
        e.preventDefault();
        if (currentIndex > 0) {
          if (autoAdvanceTimerRef.current) clearTimeout(autoAdvanceTimerRef.current);
          setCurrentIndex((i) => i - 1);
          questionStartRef.current = Date.now();
        }
      }
    };
    window.addEventListener("keydown", onKeyDown);
    return () => window.removeEventListener("keydown", onKeyDown);
  }, [isFinished, currentQuestion, answersMap, handleSelectOption, currentIndex, questions.length, finalizeQuiz]);

  // Metrics
  const totalQuestions = questions.length || 20;
  const answeredCount = Object.keys(answersMap).length;
  const correctCount = useMemo(
    () => Object.values(answersMap).filter((a) => a.isCorrect).length,
    [answersMap]
  );
  const wrongCount = answeredCount - correctCount;
  const liveScoreOut100 = Math.round((correctCount / totalQuestions) * 100);
  const wrongQuestions = useMemo(
    () => questions.filter((q) => answersMap[q.id] && !answersMap[q.id].isCorrect),
    [questions, answersMap]
  );

  const formatTime = (sec) => {
    const m = Math.floor(sec / 60);
    const s = sec % 60;
    return `${m}:${String(s).padStart(2, "0")}`;
  };

  const handleShareResult = async () => {
    const rank = getRankInfo(liveScoreOut100);
    const text = `🎯 Memolandum ${gradeMeta.title}\n📊 Puanım: ${liveScoreOut100}/100 (${correctCount}/${totalQuestions} Doğru)\n${rank.badge}\n⏱️ Süre: ${formatTime(elapsedSec)}\nSen de çöz: https://memolandum.com/quiz/${gradeMeta.slug}/`;
    try {
      if (navigator.share) {
        await navigator.share({ title: gradeMeta.title, text });
      } else if (navigator.clipboard) {
        await navigator.clipboard.writeText(text);
        setShareCopied(true);
        setTimeout(() => setShareCopied(false), 3000);
      }
    } catch {
      /* ignore share cancel */
    }
  };

  const discoveredCount = Math.min(
    poolSize,
    gradeStats?.seenQuestionIds?.length || answeredCount
  );

  return (
    <div className="w-full max-w-4xl mx-auto">
      {/* 1. Üst Sınıf Seçici Şerit (2. Sınıftan 8. Sınıfa Tek Tıkla Geçiş) */}
      {showGradeSwitcher && (
        <div className="mb-4 p-2 rounded-2xl bg-slate-900/90 border border-white/10 shadow-lg backdrop-blur-md">
          <div className="flex items-center justify-between px-2 mb-2">
            <span className="text-[11px] font-black uppercase tracking-wider text-cyan-400 flex items-center gap-1.5">
              <Sparkles className="w-3.5 h-3.5" />
              Sınıfını Seç (100 Soruluk Havuzdan 20 Rastgele Soru)
            </span>
            <Link
              href="/quiz/"
              className="text-[11px] font-bold text-slate-400 hover:text-white transition-colors"
            >
              Tüm Sınıflar →
            </Link>
          </div>
          <div className="grid grid-cols-4 sm:grid-cols-7 gap-1.5">
            {QUIZ_GRADES_META.map((g) => {
              const isSelected =
                g.grade === activeGrade ||
                (g.grade === 8 && Boolean(gradeMeta?.isLgsStrategy));
              return (
                <button
                  key={g.grade}
                  type="button"
                  onClick={() => setActiveGrade(g.grade)}
                  className={`py-2 px-2 rounded-xl font-black text-xs sm:text-sm transition-all cursor-pointer flex flex-col items-center justify-center gap-0.5 border ${
                    isSelected
                      ? `${g.accent.button} border-transparent scale-[1.02] shadow-md`
                      : "bg-slate-800/80 hover:bg-slate-800 text-slate-200 border-white/10"
                  }`}
                >
                  <span>
                    {g.icon} {g.grade}. Sınıf
                  </span>
                  <span
                    className={`text-[9px] font-bold ${
                      isSelected ? "opacity-90" : "text-slate-400"
                    }`}
                  >
                    {g.grade === 8 ? "LGS & 6 Kamp" : "20 Soru"}
                  </span>
                </button>
              );
            })}
          </div>

          {/* LGS 6 KATEGORİ × 200 SORU ÇELDİRİCİ & SORU KÖKÜ KAMPI SEÇİCİSİ */}
          <div className="mt-2.5 pt-2.5 border-t border-white/10">
            <div className="flex flex-wrap items-center justify-between gap-2 px-1 mb-2">
              <span className="text-[11px] font-black uppercase tracking-wider text-amber-300 flex items-center gap-1.5">
                <span>🏆 LGS MEB Soru Kökü & Çeldirici Kampı:</span>
                <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-amber-500/20 border border-amber-400/40 text-amber-200">
                  Her Kategoride 200 Soru Havuzu → 20 Soruluk Rastgele Test
                </span>
              </span>
              <button
                type="button"
                onClick={() => setActiveGrade("lgs-celdirici-kampi")}
                className={`text-[11px] font-black px-2.5 py-1 rounded-lg border transition-all cursor-pointer ${
                  activeGrade === "lgs-celdirici-kampi"
                    ? "bg-gradient-to-r from-amber-400 to-rose-500 text-slate-950 border-amber-300 shadow-sm"
                    : "bg-amber-500/15 hover:bg-amber-500/25 text-amber-300 border-amber-400/40"
                }`}
              >
                🔥 Tüm 6 Kategori Karma (1.200 Soru)
              </button>
            </div>

            <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-1.5">
              {LGS_STRATEGY_CATEGORIES.map((cat) => {
                const isSelected = activeGrade === cat.slug;
                return (
                  <button
                    key={cat.slug}
                    type="button"
                    onClick={() => setActiveGrade(cat.slug)}
                    className={`p-2 rounded-xl text-left transition-all cursor-pointer border flex flex-col justify-between gap-1 ${
                      isSelected
                        ? `${cat.accent.button} border-transparent scale-[1.02] shadow-md`
                        : "bg-slate-950/80 hover:bg-slate-800/90 text-slate-200 border-white/10 hover:border-amber-400/40"
                    }`}
                  >
                    <div className="flex items-center justify-between gap-1">
                      <span className="text-sm">{cat.icon}</span>
                      <span
                        className={`text-[9px] font-black px-1.5 py-0.5 rounded ${
                          isSelected
                            ? "bg-slate-950/25 text-current"
                            : "bg-slate-800 text-amber-300"
                        }`}
                      >
                        200 Soru
                      </span>
                    </div>
                    <div className="text-[11px] font-black leading-tight line-clamp-2">
                      {cat.shortLabel}
                    </div>
                  </button>
                );
              })}
            </div>
          </div>
        </div>
      )}

      {/* 2. Aktif Sınıf Başlığı, Mod Seçici ve Hızlı Kontroller */}
      <div
        className={`mb-4 p-4 sm:p-5 rounded-2xl bg-gradient-to-br ${gradeMeta.accent.from} ${gradeMeta.accent.to} border ${gradeMeta.accent.border} shadow-xl`}
      >
        <div className="flex flex-wrap items-center justify-between gap-3">
          <div className="flex items-center gap-3">
            <div className="w-12 h-12 rounded-2xl bg-slate-950/70 border border-white/15 flex items-center justify-center text-2xl shrink-0 shadow-inner">
              {gradeMeta.icon}
            </div>
            <div>
              <div className="flex flex-wrap items-center gap-2">
                <span
                  className={`text-[10px] font-black uppercase tracking-wider px-2.5 py-0.5 rounded-full border ${gradeMeta.accent.badge}`}
                >
                  {gradeMeta.badge}
                </span>
                <span className="text-[11px] font-bold text-slate-300 bg-slate-950/60 px-2.5 py-0.5 rounded-full border border-white/10">
                  📚 Havuz: {discoveredCount}/{poolSize} Soru Keşfedildi
                </span>
                {gradeStats?.bestScore > 0 && (
                  <span className="text-[11px] font-black text-amber-300 bg-amber-500/15 px-2.5 py-0.5 rounded-full border border-amber-400/30">
                    🏆 Rekorun: {gradeStats.bestScore}/100
                  </span>
                )}
              </div>
              <h1 className="text-lg sm:text-2xl font-black text-white mt-1 tracking-tight">
                {gradeMeta.title}
              </h1>
              <p className="text-xs text-slate-300">{gradeMeta.subtitle}</p>
            </div>
          </div>

          <div className="flex flex-wrap items-center gap-2">
            <button
              type="button"
              onClick={() => startNewQuizSession(activeGrade, quizMode, null)}
              className="inline-flex items-center gap-1.5 px-3 py-2 rounded-xl bg-slate-950/80 hover:bg-slate-900 text-cyan-300 border border-cyan-500/30 font-bold text-xs transition-all cursor-pointer shadow-sm"
              title="100 soruluk havuzdan yeni 20 rastgele soru çek"
            >
              <RotateCcw className="w-3.5 h-3.5" />
              <span>Yeni 20 Soru Çek</span>
            </button>
            {!isFinished && answeredCount > 0 && (
              <button
                type="button"
                onClick={() => finalizeQuiz(answersMap)}
                className="inline-flex items-center gap-1.5 px-3.5 py-2 rounded-xl bg-amber-500 hover:bg-amber-400 text-slate-950 font-black text-xs transition-all cursor-pointer shadow-md"
              >
                <Flag className="w-3.5 h-3.5" />
                <span>Testi Bitir & Sonucu Gör</span>
              </button>
            )}
          </div>
        </div>

        {/* Soru Formatı Seçici & Hızlı Ayarlar */}
        <div className="mt-4 pt-3 border-t border-white/10 flex flex-wrap items-center justify-between gap-2">
          {gradeMeta.isLgsStrategy ? (
            <div className="flex flex-wrap items-center gap-2">
              <span className="px-3 py-1.5 rounded-xl bg-amber-500/20 border border-amber-400/40 text-amber-200 text-xs font-black">
                🎯 MEB Çeldirici Odağı: {gradeMeta.trapSummary}
              </span>
              <button
                type="button"
                onClick={() => setActiveGrade(8)}
                className="px-2.5 py-1.5 rounded-xl bg-slate-950/70 hover:bg-slate-900 text-slate-300 hover:text-white border border-white/10 text-xs font-bold cursor-pointer"
              >
                📚 8. Sınıf 100 Kelime Havuzuna Geç
              </button>
            </div>
          ) : (
            <div className="flex flex-wrap items-center gap-1.5">
              {[
                { id: "mixed", label: "🎯 Karma Yazılı Sınavı (Önerilen)" },
                { id: "context", label: "📝 Cümlede Boşluk Doldurma" },
                { id: "vocab", label: "⚡ Hızlı Kelime Anlamı" },
              ].map((m) => (
                <button
                  key={m.id}
                  type="button"
                  onClick={() => setQuizMode(m.id)}
                  className={`px-3 py-1.5 rounded-xl text-xs font-bold transition-all cursor-pointer border ${
                    quizMode === m.id
                      ? "bg-white text-slate-950 border-white font-black shadow-sm"
                      : "bg-slate-950/60 text-slate-300 hover:text-white border-white/10"
                  }`}
                >
                  {m.label}
                </button>
              ))}
            </div>
          )}

          <div className="flex flex-wrap items-center gap-1.5">
            <button
              type="button"
              onClick={() => setAutoAdvance((v) => !v)}
              className={`px-2.5 py-1.5 rounded-xl text-[11px] font-bold border transition-all cursor-pointer inline-flex items-center gap-1 ${
                autoAdvance
                  ? "bg-emerald-500/20 text-emerald-300 border-emerald-500/40"
                  : "bg-slate-950/60 text-slate-400 border-white/10"
              }`}
              title="Şıkkı işaretledikten sonra otomatik sonraki soruya geçer"
            >
              <Zap className="w-3 h-3" />
              <span>Otomatik Geçiş: {autoAdvance ? "Açık" : "Kapalı"}</span>
            </button>

            <button
              type="button"
              onClick={() => setAutoSpeak((v) => !v)}
              className={`px-2.5 py-1.5 rounded-xl text-[11px] font-bold border transition-all cursor-pointer inline-flex items-center gap-1 ${
                autoSpeak
                  ? "bg-cyan-500/20 text-cyan-300 border-cyan-500/40"
                  : "bg-slate-950/60 text-slate-400 border-white/10"
              }`}
            >
              <Volume2 className="w-3 h-3" />
              <span>Oto Okuma: {autoSpeak ? "Açık" : "Kapalı"}</span>
            </button>

            <button
              type="button"
              onClick={() => setSoundEnabled((v) => !v)}
              className="p-1.5 rounded-xl bg-slate-950/60 text-slate-300 hover:text-white border border-white/10 cursor-pointer"
              title={soundEnabled ? "Ses efektlerini kapat" : "Ses efektlerini aç"}
            >
              {soundEnabled ? (
                <Volume2 className="w-4 h-4 text-emerald-400" />
              ) : (
                <VolumeX className="w-4 h-4 text-slate-500" />
              )}
            </button>
          </div>
        </div>
      </div>

      {/* 3. SONUÇ KARNESİ EKRANI (Test bittiğinde veya 'Sonucu Gör' tıklandığında anında açılır) */}
      {isFinished ? (
        <div className="rounded-3xl bg-slate-900/95 border-2 border-cyan-500/40 p-5 sm:p-8 shadow-2xl animate-fadeIn">
          {(() => {
            const rank = getRankInfo(liveScoreOut100);
            return (
              <>
                <div className="text-center max-w-2xl mx-auto">
                  <div
                    className={`inline-flex items-center gap-2 px-4 py-1.5 rounded-full text-xs sm:text-sm font-black border mb-3 ${rank.color}`}
                  >
                    <span>{rank.badge}</span>
                  </div>

                  <div className="flex justify-center gap-1 my-2 text-2xl sm:text-3xl">
                    {Array.from({ length: 5 }).map((_, i) => (
                      <span
                        key={i}
                        className={
                          i < rank.stars
                            ? "text-amber-400 drop-shadow-[0_0_8px_rgba(251,191,36,0.6)]"
                            : "text-slate-700"
                        }
                      >
                        ★
                      </span>
                    ))}
                  </div>

                  <h2 className="text-2xl sm:text-4xl font-black text-white mt-1">
                    Sınav Puanın:{" "}
                    <span className="text-cyan-400">{liveScoreOut100}</span>{" "}
                    <span className="text-slate-500 text-xl">/ 100</span>
                  </h2>
                  <p className="text-xs sm:text-sm text-slate-300 mt-2">
                    {rank.message}
                  </p>
                </div>

                {/* Özet İstatistik Kartları */}
                <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 my-6">
                  <div className="p-4 rounded-2xl bg-emerald-950/40 border border-emerald-500/30 text-center">
                    <div className="text-2xl sm:text-3xl font-black text-emerald-400">
                      {correctCount}
                    </div>
                    <div className="text-xs font-bold text-emerald-200/80 mt-0.5">
                      ✅ Doğru Cevap
                    </div>
                  </div>
                  <div className="p-4 rounded-2xl bg-rose-950/40 border border-rose-500/30 text-center">
                    <div className="text-2xl sm:text-3xl font-black text-rose-400">
                      {wrongCount}
                    </div>
                    <div className="text-xs font-bold text-rose-200/80 mt-0.5">
                      ❌ Yanlış Cevap
                    </div>
                  </div>
                  <div className="p-4 rounded-2xl bg-amber-950/40 border border-amber-500/30 text-center">
                    <div className="text-2xl sm:text-3xl font-black text-amber-300">
                      +{correctCount * 10 + maxCombo * 2} XP
                    </div>
                    <div className="text-xs font-bold text-amber-200/80 mt-0.5">
                      ⚡ Kazanılan XP (Max {maxCombo}x Seri)
                    </div>
                  </div>
                  <div className="p-4 rounded-2xl bg-cyan-950/40 border border-cyan-500/30 text-center">
                    <div className="text-2xl sm:text-3xl font-black text-cyan-300">
                      {formatTime(elapsedSec)}
                    </div>
                    <div className="text-xs font-bold text-cyan-200/80 mt-0.5">
                      ⏱️ Tamamlama Süresi
                    </div>
                  </div>
                </div>

                {/* Ana Aksiyon Butonları */}
                <div className="flex flex-wrap items-center justify-center gap-3 mb-8">
                  <button
                    type="button"
                    onClick={() => startNewQuizSession(activeGrade, quizMode, null)}
                    className="inline-flex items-center justify-center gap-2 px-6 py-3.5 rounded-2xl bg-gradient-to-r from-cyan-400 to-emerald-400 hover:from-cyan-300 hover:to-emerald-300 text-slate-950 font-black text-sm shadow-lg shadow-cyan-500/25 hover:scale-[1.02] transition-all cursor-pointer"
                  >
                    <RotateCcw className="w-4 h-4" />
                    <span>Yeni 20 Soruluk Rastgele Test Oluştur</span>
                  </button>

                  {wrongQuestions.length > 0 && (
                    <button
                      type="button"
                      onClick={() =>
                        startNewQuizSession(activeGrade, quizMode, wrongQuestions)
                      }
                      className="inline-flex items-center justify-center gap-2 px-5 py-3.5 rounded-2xl bg-rose-500/20 hover:bg-rose-500/30 text-rose-200 border border-rose-500/40 font-black text-sm transition-all cursor-pointer"
                    >
                      <Flame className="w-4 h-4 text-rose-400" />
                      <span>
                        Sadece Yanlışlarımı Tekrar Çöz ({wrongQuestions.length} Soru)
                      </span>
                    </button>
                  )}

                  <button
                    type="button"
                    onClick={handleShareResult}
                    className="inline-flex items-center justify-center gap-2 px-5 py-3.5 rounded-2xl bg-amber-500/20 hover:bg-amber-500/30 text-amber-200 border border-amber-500/40 font-bold text-sm transition-all cursor-pointer"
                  >
                    <Share2 className="w-4 h-4" />
                    <span>
                      {shareCopied ? "✅ Sonuç Kopyalandı!" : "📲 Sonucu Paylaş / Kopyala"}
                    </span>
                  </button>

                  <Link
                    href={`/games/shooter/?lang=${gradeMeta.langId}&level=${gradeMeta.levelId}`}
                    className="inline-flex items-center justify-center gap-2 px-5 py-3.5 rounded-2xl bg-indigo-500/20 hover:bg-indigo-500/30 text-indigo-200 border border-indigo-500/40 font-bold text-sm transition-all"
                  >
                    <Gamepad2 className="w-4 h-4" />
                    <span>🎮 Bu Sınıfın Arcade Oyununu Oyna</span>
                  </Link>
                </div>

                {/* Soru & Cevap Anahtarı İnceleme Listesi */}
                <div className="border-t border-white/10 pt-6">
                  <div className="flex items-center justify-between mb-4">
                    <h3 className="text-base sm:text-lg font-black text-white flex items-center gap-2">
                      <BookOpen className="w-5 h-5 text-cyan-400" />
                      <span>Cevap Anahtarı & Kelime Özeti ({questions.length} Soru)</span>
                    </h3>
                    <span className="text-xs text-slate-400">
                      Kelimelerin okunuşunu dinlemek için 🔊 butonuna dokunun
                    </span>
                  </div>

                  <div className="grid grid-cols-1 md:grid-cols-2 gap-3 max-h-[460px] overflow-y-auto pr-1">
                    {questions.map((q, idx) => {
                      const ans = answersMap[q.id];
                      const isCorrect = ans?.isCorrect;
                      return (
                        <div
                          key={q.id}
                          className={`p-3.5 rounded-2xl border flex flex-col justify-between gap-2 ${
                            isCorrect
                              ? "bg-emerald-950/20 border-emerald-500/30"
                              : ans
                                ? "bg-rose-950/25 border-rose-500/35"
                                : "bg-slate-950/50 border-white/10"
                          }`}
                        >
                          <div className="flex items-start justify-between gap-2">
                            <div>
                              <span className="text-[11px] font-black uppercase tracking-wider text-slate-400">
                                Soru {idx + 1} · Ünite {q.unitNo}
                              </span>
                              <div className="text-sm font-black text-white mt-0.5">
                                {q.english}{" "}
                                <span className="text-cyan-300 font-bold">
                                  = {q.turkish}
                                </span>
                              </div>
                            </div>
                            <div className="flex items-center gap-1.5 shrink-0">
                              <button
                                type="button"
                                onClick={() => speakCurrentWord(q)}
                                className="p-1.5 rounded-lg bg-slate-800 hover:bg-slate-700 text-cyan-300 cursor-pointer"
                                title="Telaffuzu dinle"
                              >
                                <Volume2 className="w-4 h-4" />
                              </button>
                              <span
                                className={`text-xs font-black px-2 py-0.5 rounded-md ${
                                  isCorrect
                                    ? "bg-emerald-500/20 text-emerald-300"
                                    : ans
                                      ? "bg-rose-500/20 text-rose-300"
                                      : "bg-slate-800 text-slate-400"
                                }`}
                              >
                                {isCorrect ? "Doğru" : ans ? "Yanlış" : "Boş"}
                              </span>
                            </div>
                          </div>

                          {q.exampleSentence && (
                            <p className="text-xs text-slate-300 italic bg-slate-950/50 px-2.5 py-1.5 rounded-lg border border-white/5">
                              &ldquo;{q.exampleSentence}&rdquo;
                            </p>
                          )}

                          {ans && !isCorrect && (
                            <div className="text-[11px] flex flex-wrap items-center gap-2 pt-1 border-t border-white/5">
                              <span className="text-rose-300">
                                Senin cevabın: <strong>{ans.selectedText}</strong>
                              </span>
                              <span className="text-emerald-300">
                                Doğru cevap: <strong>{q.correctAnswer}</strong>
                              </span>
                            </div>
                          )}
                        </div>
                      );
                    })}
                  </div>
                </div>
              </>
            );
          })()}
        </div>
      ) : (
        /* 4. AKTİF SORU EKRANI */
        currentQuestion && (
          <div className="rounded-3xl bg-slate-900/95 border border-white/15 p-4 sm:p-7 shadow-2xl">
            {/* Üst İlerleme Çubuğu & Canlı Skor Şeridi */}
            <div className="flex flex-wrap items-center justify-between gap-2 mb-3">
              <div className="flex items-center gap-2">
                <span className="px-3 py-1 rounded-xl bg-cyan-500/15 border border-cyan-500/30 text-cyan-300 font-black text-xs sm:text-sm">
                  Soru {currentIndex + 1} / {totalQuestions}
                </span>
                {isRetryWrongMode && (
                  <span className="px-2.5 py-1 rounded-xl bg-rose-500/20 border border-rose-500/40 text-rose-300 font-bold text-xs">
                    🎯 Yanlışları Tekrar Modu
                  </span>
                )}
                {combo >= 2 && (
                  <span className="px-2.5 py-1 rounded-xl bg-amber-500/20 border border-amber-400/40 text-amber-300 font-black text-xs inline-flex items-center gap-1 animate-pulse">
                    <Flame className="w-3.5 h-3.5 fill-current" />
                    {combo}x Seri!
                  </span>
                )}
              </div>

              <div className="flex items-center gap-3 text-xs font-bold">
                <span className="text-emerald-400 bg-emerald-950/60 px-2.5 py-1 rounded-lg border border-emerald-500/30">
                  ✅ {correctCount} Doğru
                </span>
                <span className="text-rose-400 bg-rose-950/60 px-2.5 py-1 rounded-lg border border-rose-500/30">
                  ❌ {wrongCount} Yanlış
                </span>
                <span className="text-amber-300 bg-amber-950/60 px-2.5 py-1 rounded-lg border border-amber-500/30">
                  🏆 {liveScoreOut100} Puan
                </span>
                <span className="text-slate-400 hidden sm:inline-flex items-center gap-1">
                  <Clock className="w-3.5 h-3.5" />
                  {formatTime(elapsedSec)}
                </span>
              </div>
            </div>

            {/* 20 Soruluk Hızlı Soru Haritası (İstediğin soruya tıkla geç) */}
            <div className="grid grid-cols-10 sm:grid-cols-20 gap-1 mb-5">
              {questions.map((q, idx) => {
                const ans = answersMap[q.id];
                const isCurrent = idx === currentIndex;
                return (
                  <button
                    key={q.id}
                    type="button"
                    onClick={() => {
                      if (autoAdvanceTimerRef.current) clearTimeout(autoAdvanceTimerRef.current);
                      setCurrentIndex(idx);
                      questionStartRef.current = Date.now();
                    }}
                    className={`h-7 rounded-lg text-[11px] font-black transition-all cursor-pointer flex items-center justify-center border ${
                      isCurrent
                        ? "ring-2 ring-cyan-400 bg-cyan-500/30 text-white border-cyan-300"
                        : ans
                          ? ans.isCorrect
                            ? "bg-emerald-500/25 text-emerald-300 border-emerald-500/40"
                            : "bg-rose-500/25 text-rose-300 border-rose-500/40"
                          : "bg-slate-800/70 text-slate-400 hover:text-white border-white/5"
                    }`}
                    title={`Soru ${idx + 1}`}
                  >
                    {idx + 1}
                  </button>
                );
              })}
            </div>

            {/* Soru Gövdesi */}
            <div className="p-5 sm:p-6 rounded-2xl bg-slate-950/80 border border-white/10 mb-5 relative">
              <div className="flex flex-wrap items-center justify-between gap-2 mb-3">
                <div className="flex flex-wrap items-center gap-2">
                  <span className="text-[11px] font-bold uppercase tracking-wider px-2.5 py-0.5 rounded-md bg-indigo-500/20 text-indigo-300 border border-indigo-500/30">
                    Ünite {currentQuestion.unitNo}: {currentQuestion.unitName}
                  </span>
                  <span className="text-[11px] font-bold px-2.5 py-0.5 rounded-md bg-slate-800 text-slate-300">
                    {currentQuestion.effectiveType === "lgs_strategy"
                      ? `🎯 ${currentQuestion.subType || "LGS MEB Soru Kökü"}`
                      : currentQuestion.effectiveType === "context_blank"
                        ? "📝 Cümlede Boşluk Doldurma"
                        : currentQuestion.effectiveType === "tr_to_en"
                          ? "🇹🇷 → 🇬🇧 İngilizce Karşılığını Bul"
                          : "🇬🇧 → 🇹🇷 Türkçe Anlamını Bul"}
                  </span>
                </div>

                <div className="flex items-center gap-2">
                  {currentQuestion.effectiveType === "lgs_strategy" &&
                    currentQuestion.helperText &&
                    !currentAnswer && (
                      <button
                        type="button"
                        onClick={() => setShowHintBeforeAnswer((v) => !v)}
                        className="inline-flex items-center gap-1 px-3 py-1.5 rounded-xl bg-amber-500/15 hover:bg-amber-500/25 text-amber-300 border border-amber-500/30 text-xs font-bold transition-all cursor-pointer"
                      >
                        <span>💡 {showHintBeforeAnswer ? "İpucunu Gizle" : "MEB Çeldirici İpucu"}</span>
                      </button>
                    )}
                  <button
                    type="button"
                    onClick={() => speakCurrentWord(currentQuestion)}
                    className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-cyan-500/15 hover:bg-cyan-500/25 text-cyan-300 border border-cyan-500/30 text-xs font-bold transition-all cursor-pointer"
                  >
                    <Volume2 className="w-4 h-4" />
                    <span>Telaffuzu Dinle</span>
                  </button>
                </div>
              </div>

              <p className="text-xs sm:text-sm font-bold text-slate-400 mb-2">
                {currentQuestion.promptTr}
              </p>

              {/* LGS Metin / Diyalog / Afiş / Tablo / Grafik Kutusu */}
              {currentQuestion.passageText && (
                <div className="my-3 p-4 rounded-xl bg-slate-900/95 border-l-4 border-amber-400 border-y border-r border-white/10 text-slate-100 text-xs sm:text-sm md:text-base font-medium leading-relaxed whitespace-pre-line shadow-inner">
                  {currentQuestion.passageText}
                </div>
              )}

              <div
                className={`${
                  currentQuestion.passageText
                    ? "text-base sm:text-lg md:text-xl text-amber-200"
                    : "text-xl sm:text-2xl md:text-3xl text-white"
                } font-black leading-snug tracking-tight my-2`}
              >
                {currentQuestion.questionText}
              </div>

              {currentQuestion.helperText &&
                (currentQuestion.effectiveType !== "lgs_strategy" ||
                  showHintBeforeAnswer ||
                  Boolean(currentAnswer)) && (
                  <div className="mt-3 inline-flex items-center gap-2 px-3 py-2 rounded-xl bg-amber-500/10 border border-amber-500/25 text-amber-200 text-xs sm:text-sm font-semibold leading-relaxed">
                    <span>💡 {currentQuestion.helperText}</span>
                  </div>
                )}
            </div>

            {/* 4 Çoktan Seçmeli Şık (A, B, C, D) */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              {currentQuestion.options.map((opt) => {
                const isAnswered = Boolean(currentAnswer);
                const isSelected = currentAnswer?.selectedLetter === opt.letter;
                const showAsCorrect = isAnswered && opt.isCorrect;
                const showAsWrong = isAnswered && isSelected && !opt.isCorrect;

                let btnClass =
                  "bg-slate-800/80 hover:bg-slate-800 border-white/15 hover:border-cyan-400/60 text-white";
                let badgeClass =
                  "bg-slate-900 text-cyan-300 border-white/15 group-hover:bg-cyan-500 group-hover:text-slate-950";

                if (showAsCorrect) {
                  btnClass =
                    "bg-emerald-500/25 border-emerald-400 text-emerald-100 shadow-lg shadow-emerald-500/15 scale-[1.01]";
                  badgeClass = "bg-emerald-400 text-slate-950 border-emerald-300";
                } else if (showAsWrong) {
                  btnClass =
                    "bg-rose-500/25 border-rose-400 text-rose-100 shadow-lg shadow-rose-500/15";
                  badgeClass = "bg-rose-400 text-slate-950 border-rose-300";
                } else if (isAnswered) {
                  btnClass = "bg-slate-900/50 border-white/5 text-slate-500 opacity-65";
                  badgeClass = "bg-slate-900 text-slate-500 border-white/5";
                }

                return (
                  <button
                    key={opt.letter}
                    type="button"
                    disabled={isAnswered}
                    onClick={() => handleSelectOption(opt)}
                    className={`group p-4 rounded-2xl border-2 text-left transition-all flex items-center justify-between gap-3 cursor-pointer ${btnClass}`}
                  >
                    <div className="flex items-center gap-3.5 min-w-0">
                      <span
                        className={`w-9 h-9 rounded-xl border font-black text-sm flex items-center justify-center shrink-0 transition-colors ${badgeClass}`}
                      >
                        {opt.letter}
                      </span>
                      <span className="font-bold text-sm sm:text-base break-words">
                        {opt.text}
                      </span>
                    </div>

                    {showAsCorrect && (
                      <CheckCircle2 className="w-6 h-6 text-emerald-400 shrink-0" />
                    )}
                    {showAsWrong && (
                      <XCircle className="w-6 h-6 text-rose-400 shrink-0" />
                    )}
                  </button>
                );
              })}
            </div>

            {/* Cevap Sonrası Anlık Öğrenme Kutusu */}
            {currentAnswer && (
              <div
                className={`mt-4 p-4 rounded-2xl border flex flex-wrap items-center justify-between gap-3 ${
                  currentAnswer.isCorrect
                    ? "bg-emerald-950/40 border-emerald-500/40 text-emerald-200"
                    : "bg-rose-950/40 border-rose-500/40 text-rose-200"
                }`}
              >
                <div className="space-y-1">
                  <div className="text-xs sm:text-sm font-black">
                    {currentAnswer.isCorrect
                      ? "🎉 Harika! Doğru Cevap!"
                      : `💡 Doğru Cevap: ${currentQuestion.correctAnswer}`}
                  </div>
                  <div className="text-xs text-slate-200">
                    <strong>{currentQuestion.english}</strong> ={" "}
                    <span className="text-cyan-300 font-bold">
                      {currentQuestion.turkish}
                    </span>
                    {currentQuestion.exampleSentence && (
                      <span className="text-slate-300 italic ml-2">
                        — &ldquo;{currentQuestion.exampleSentence}&rdquo;
                      </span>
                    )}
                  </div>
                </div>

                <div className="flex items-center gap-2">
                  <button
                    type="button"
                    onClick={() => speakCurrentWord(currentQuestion)}
                    className="px-3 py-1.5 rounded-xl bg-slate-900/80 hover:bg-slate-900 text-cyan-300 text-xs font-bold inline-flex items-center gap-1 cursor-pointer"
                  >
                    <Volume2 className="w-3.5 h-3.5" />
                    <span>Dinle</span>
                  </button>
                  {currentIndex < totalQuestions - 1 ? (
                    <button
                      type="button"
                      onClick={() => {
                        if (autoAdvanceTimerRef.current)
                          clearTimeout(autoAdvanceTimerRef.current);
                        setCurrentIndex((i) => i + 1);
                        questionStartRef.current = Date.now();
                      }}
                      className="px-4 py-1.5 rounded-xl bg-white text-slate-950 font-black text-xs inline-flex items-center gap-1 cursor-pointer hover:bg-cyan-200 transition-colors"
                    >
                      <span>Sonraki Soru</span>
                      <ChevronRight className="w-4 h-4" />
                    </button>
                  ) : (
                    <button
                      type="button"
                      onClick={() => finalizeQuiz(answersMap)}
                      className="px-4 py-1.5 rounded-xl bg-amber-400 text-slate-950 font-black text-xs inline-flex items-center gap-1 cursor-pointer hover:bg-amber-300 transition-colors"
                    >
                      <Trophy className="w-4 h-4" />
                      <span>Sonuç Karnesini Gör</span>
                    </button>
                  )}
                </div>
              </div>
            )}

            {/* Alt Gezinme Çubuğu (Önceki / Sonraki / Sonucu Gör) */}
            <div className="mt-5 pt-4 border-t border-white/10 flex items-center justify-between gap-2">
              <button
                type="button"
                disabled={currentIndex === 0}
                onClick={() => {
                  if (autoAdvanceTimerRef.current) clearTimeout(autoAdvanceTimerRef.current);
                  setCurrentIndex((i) => Math.max(0, i - 1));
                  questionStartRef.current = Date.now();
                }}
                className="inline-flex items-center gap-1 px-3.5 py-2 rounded-xl bg-slate-800/80 hover:bg-slate-800 disabled:opacity-40 text-xs font-bold text-slate-200 cursor-pointer"
              >
                <ChevronLeft className="w-4 h-4" />
                <span>Önceki Soru</span>
              </button>

              <span className="text-[11px] text-slate-400 hidden sm:inline">
                Klavye kısayolları: <strong>A, B, C, D</strong> veya{" "}
                <strong>1, 2, 3, 4</strong>
              </span>

              {currentIndex < totalQuestions - 1 ? (
                <button
                  type="button"
                  onClick={() => {
                    if (autoAdvanceTimerRef.current) clearTimeout(autoAdvanceTimerRef.current);
                    setCurrentIndex((i) => Math.min(totalQuestions - 1, i + 1));
                    questionStartRef.current = Date.now();
                  }}
                  className="inline-flex items-center gap-1 px-3.5 py-2 rounded-xl bg-slate-800/80 hover:bg-slate-800 text-xs font-bold text-cyan-300 cursor-pointer"
                >
                  <span>Sonraki Soru</span>
                  <ChevronRight className="w-4 h-4" />
                </button>
              ) : (
                <button
                  type="button"
                  onClick={() => finalizeQuiz(answersMap)}
                  className="inline-flex items-center gap-1.5 px-4 py-2 rounded-xl bg-amber-500 hover:bg-amber-400 text-slate-950 font-black text-xs cursor-pointer shadow-md"
                >
                  <Award className="w-4 h-4" />
                  <span>Sonucu Gör</span>
                </button>
              )}
            </div>
          </div>
        )
      )}
    </div>
  );
}
