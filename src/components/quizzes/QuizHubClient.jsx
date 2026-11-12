"use client";

import React, { useState, useEffect } from "react";
import Link from "next/link";
import { useSearchParams } from "next/navigation";
import {
  QUIZ_GRADES_META,
  LGS_STRATEGY_CATEGORIES,
  LGS_ALL_MIXED_META,
  resolveQuizGradeMeta,
  loadAllQuizStats,
} from "@/lib/quizzes/gradeQuizEngine";
import GradeQuizRunner from "./GradeQuizRunner";
import {
  Sparkles,
  Award,
  Zap,
  CheckCircle2,
  ChevronRight,
  BookOpen,
} from "lucide-react";

export default function QuizHubClient() {
  const searchParams = useSearchParams();
  const gradeParam = searchParams?.get("grade") || searchParams?.get("sinif");
  const resolvedInitial = resolveQuizGradeMeta(gradeParam)?.grade || 5;

  const [selectedGrade, setSelectedGrade] = useState(resolvedInitial);
  const [statsMap, setStatsMap] = useState({});

  useEffect(() => {
    setStatsMap(loadAllQuizStats());
  }, [selectedGrade]);

  useEffect(() => {
    const resolved = resolveQuizGradeMeta(gradeParam);
    if (resolved) {
      setSelectedGrade(resolved.grade);
    }
  }, [gradeParam]);

  const handleQuickStart = (gradeNum) => {
    setSelectedGrade(gradeNum);
    const el = document.getElementById("active-quiz-runner");
    if (el) {
      el.scrollIntoView({ behavior: "smooth", block: "start" });
    }
  };

  return (
    <main className="max-w-6xl mx-auto px-4 sm:px-6 pt-6 pb-20">
      {/* Üst Başlık & Sınav Dönemi Vitrini */}
      <section className="mb-8 rounded-3xl bg-gradient-to-r from-indigo-950/90 via-slate-900/95 to-cyan-950/90 border border-cyan-500/40 p-6 sm:p-8 shadow-2xl relative overflow-hidden">
        <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-6">
          <div className="max-w-2xl">
            <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-amber-500/20 border border-amber-400/40 text-amber-300 text-xs font-black uppercase tracking-wider mb-3">
              <Sparkles className="w-3.5 h-3.5" />
              <span>Sınav Dönemi Özel · 2. Sınıftan 8. Sınıfa</span>
            </div>
            <h1 className="text-2xl sm:text-4xl font-black text-white tracking-tight leading-tight">
              2–8. Sınıf İngilizce Deneme Quizleri
            </h1>
            <p className="text-sm sm:text-base text-slate-300 mt-2 leading-relaxed">
              Her sınıf için müfredata özel hazırlanmış{" "}
              <strong className="text-cyan-300">100 ayrı soru havuzundan</strong>{" "}
              her seferinde rastgele seçilen{" "}
              <strong className="text-emerald-300">20 soruluk hızlı deneme testleri</strong>.
              Üyelik gerekmez; sınıfını seç, çözmeye başla ve anında sınav karneni gör!
            </p>
          </div>

          <div className="grid grid-cols-3 gap-2.5 shrink-0">
            <div className="p-3.5 rounded-2xl bg-slate-950/70 border border-white/10 text-center">
              <div className="text-xl sm:text-2xl font-black text-cyan-400">7 Sınıf</div>
              <div className="text-[11px] font-bold text-slate-400">2–8. Sınıf & LGS</div>
            </div>
            <div className="p-3.5 rounded-2xl bg-slate-950/70 border border-white/10 text-center">
              <div className="text-xl sm:text-2xl font-black text-emerald-400">1.900+</div>
              <div className="text-[11px] font-bold text-slate-400">Sınav & LGS Havuzu</div>
            </div>
            <div className="p-3.5 rounded-2xl bg-slate-950/70 border border-white/10 text-center">
              <div className="text-xl sm:text-2xl font-black text-amber-400">20 Soru</div>
              <div className="text-[11px] font-bold text-slate-400">Rastgele Deneme</div>
            </div>
          </div>
        </div>
      </section>

      {/* Sınıf Kartları Grid (2. Sınıf - 8. Sınıf) */}
      <section className="mb-10" aria-labelledby="grade-cards-heading">
        <div className="flex flex-wrap items-center justify-between gap-2 mb-4">
          <h2
            id="grade-cards-heading"
            className="text-lg sm:text-xl font-black text-white flex items-center gap-2"
          >
            <BookOpen className="w-5 h-5 text-cyan-400" />
            <span>Sınıfını Seç & 20 Soruluk Deneme Testini Başlat</span>
          </h2>
          <span className="text-xs text-slate-400">
            Her testte 100 soruluk havuzdan yeni 20 soru rastgele seçilir
          </span>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3.5">
          {QUIZ_GRADES_META.map((g) => {
            const st = statsMap[String(g.grade)];
            const isSelected = selectedGrade === g.grade;
            const seenCount = st?.seenQuestionIds?.length || 0;

            return (
              <div
                key={g.grade}
                className={`rounded-2xl p-4 bg-gradient-to-b ${g.accent.from} to-slate-950 border transition-all flex flex-col justify-between ${
                  isSelected
                    ? `${g.accent.border} ring-2 ${g.accent.ring} scale-[1.01]`
                    : "border-white/10 hover:border-white/25"
                }`}
              >
                <div>
                  <div className="flex items-center justify-between gap-2 mb-2">
                    <span
                      className={`text-[10px] font-black uppercase tracking-wider px-2.5 py-0.5 rounded-full border ${g.accent.badge}`}
                    >
                      {g.badge}
                    </span>
                    <span className="text-xl">{g.icon}</span>
                  </div>

                  <h3 className="text-base font-black text-white">{g.title}</h3>
                  <p className="text-xs text-slate-400 mt-1 line-clamp-2">
                    {g.subtitle}
                  </p>

                  <div className="mt-3 flex flex-wrap items-center gap-1.5 text-[11px]">
                    <span className="px-2 py-0.5 rounded-md bg-slate-900/90 text-slate-300 border border-white/10 font-semibold">
                      Havuz: {seenCount}/100
                    </span>
                    {st?.bestScore > 0 && (
                      <span className="px-2 py-0.5 rounded-md bg-amber-500/15 text-amber-300 border border-amber-400/30 font-bold">
                        🏆 Rekor: {st.bestScore}/100
                      </span>
                    )}
                  </div>
                </div>

                <div className="mt-4 pt-3 border-t border-white/10 flex items-center gap-2">
                  <button
                    type="button"
                    onClick={() => handleQuickStart(g.grade)}
                    className={`flex-1 py-2 px-3 rounded-xl font-black text-xs transition-all cursor-pointer inline-flex items-center justify-center gap-1 shadow-md ${g.accent.button}`}
                  >
                    <Zap className="w-3.5 h-3.5" />
                    <span>Hemen Çöz</span>
                  </button>
                  <Link
                    href={`/quiz/${g.slug}/`}
                    className="py-2 px-3 rounded-xl bg-slate-900 hover:bg-slate-800 text-slate-200 border border-white/10 font-bold text-xs inline-flex items-center gap-1 transition-colors"
                    title={`${g.title} tam sayfa`}
                  >
                    <span>Sayfa</span>
                    <ChevronRight className="w-3.5 h-3.5" />
                  </Link>
                </div>
              </div>
            );
          })}
        </div>
      </section>

      {/* LGS MEB SORU KÖKÜ & ÇELDİRİCİ KAMPI (6 KATEGORİ × 200 SORU = 1.200 SORULUK ÖZEL HAVUZ) */}
      <section
        id="lgs-celdirici-kampi"
        className="mb-10 rounded-3xl bg-gradient-to-br from-rose-950/50 via-slate-900/95 to-amber-950/40 border-2 border-amber-400/45 p-5 sm:p-7 shadow-2xl"
        aria-labelledby="lgs-strategy-heading"
      >
        <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4 mb-5">
          <div>
            <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-amber-400 text-slate-950 text-[11px] font-black uppercase tracking-wider mb-2">
              <span>🏆 LGS Özel · MEB Soru Kökü & Çeldirici Mekanizmaları</span>
            </div>
            <h2
              id="lgs-strategy-heading"
              className="text-xl sm:text-2xl font-black text-white tracking-tight"
            >
              LGS 6 Kategori × 200 Soruluk Çeldirici & Soru Kökü Testleri (1.200 Soru Havuzu)
            </h2>
            <p className="text-xs sm:text-sm text-slate-300 mt-1 max-w-3xl">
              MEB&apos;in LGS tarihinde en sık kullandığı{" "}
              <strong className="text-amber-300">6 soru kökü kalıbı ve çeldirici tuzağı</strong> için
              her kategoride <strong className="text-cyan-300">200 ayrı soru havuzundan</strong>{" "}
              rastgele beslenen <strong className="text-emerald-300">20&apos;şer soruluk</strong>{" "}
              özel deneme testleri:
            </p>
          </div>

          <div className="flex flex-wrap items-center gap-2 shrink-0">
            <button
              type="button"
              onClick={() => handleQuickStart("lgs-celdirici-kampi")}
              className="px-4 py-2.5 rounded-2xl bg-gradient-to-r from-amber-400 to-rose-500 hover:from-amber-300 hover:to-rose-400 text-slate-950 font-black text-xs sm:text-sm shadow-lg shadow-amber-500/20 cursor-pointer inline-flex items-center gap-1.5"
            >
              <Zap className="w-4 h-4" />
              <span>🔥 Tüm 6 Kategori Karma Çöz (1.200 Havuz → 20 Soru)</span>
            </button>
            <Link
              href={`/quiz/${LGS_ALL_MIXED_META.slug}/`}
              className="px-3.5 py-2.5 rounded-2xl bg-slate-900 hover:bg-slate-800 text-amber-300 border border-amber-400/40 font-bold text-xs inline-flex items-center gap-1"
            >
              <span>Tam Sayfa</span>
              <ChevronRight className="w-3.5 h-3.5" />
            </Link>
          </div>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3.5">
          {LGS_STRATEGY_CATEGORIES.map((cat) => {
            const st = statsMap[cat.slug];
            const isSelected = selectedGrade === cat.slug;
            const seenCount = st?.seenQuestionIds?.length || 0;

            return (
              <div
                key={cat.slug}
                className={`rounded-2xl p-4 bg-gradient-to-b ${cat.accent.from} to-slate-950 border transition-all flex flex-col justify-between ${
                  isSelected
                    ? `${cat.accent.border} ring-2 ${cat.accent.ring} scale-[1.01]`
                    : "border-white/10 hover:border-amber-400/40"
                }`}
              >
                <div>
                  <div className="flex items-center justify-between gap-2 mb-2">
                    <span
                      className={`text-[10px] font-black uppercase tracking-wider px-2.5 py-0.5 rounded-full border ${cat.accent.badge}`}
                    >
                      {cat.badge}
                    </span>
                    <span className="text-xl">{cat.icon}</span>
                  </div>

                  <h3 className="text-sm sm:text-base font-black text-white leading-snug">
                    {cat.title}
                  </h3>
                  <p className="text-xs text-slate-300 mt-1.5 leading-relaxed">
                    🎯 {cat.trapSummary}
                  </p>

                  <div className="mt-3 flex flex-wrap items-center gap-1.5 text-[11px]">
                    <span className="px-2 py-0.5 rounded-md bg-slate-900/90 text-cyan-300 border border-cyan-500/30 font-bold">
                      Havuz: {seenCount}/200 Soru
                    </span>
                    <span className="px-2 py-0.5 rounded-md bg-emerald-500/15 text-emerald-300 border border-emerald-500/30 font-bold">
                      20 Rastgele Soru
                    </span>
                    {st?.bestScore > 0 && (
                      <span className="px-2 py-0.5 rounded-md bg-amber-500/15 text-amber-300 border border-amber-400/30 font-bold">
                        🏆 Rekor: {st.bestScore}/100
                      </span>
                    )}
                  </div>
                </div>

                <div className="mt-4 pt-3 border-t border-white/10 flex items-center gap-2">
                  <button
                    type="button"
                    onClick={() => handleQuickStart(cat.slug)}
                    className={`flex-1 py-2 px-3 rounded-xl font-black text-xs transition-all cursor-pointer inline-flex items-center justify-center gap-1 shadow-md ${cat.accent.button}`}
                  >
                    <Zap className="w-3.5 h-3.5" />
                    <span>20 Soruluk Testi Çöz</span>
                  </button>
                  <Link
                    href={`/quiz/${cat.slug}/`}
                    className="py-2 px-3 rounded-xl bg-slate-900 hover:bg-slate-800 text-slate-200 border border-white/10 font-bold text-xs inline-flex items-center gap-1 transition-colors"
                    title={`${cat.title} tam sayfa`}
                  >
                    <span>Sayfa</span>
                    <ChevronRight className="w-3.5 h-3.5" />
                  </Link>
                </div>
              </div>
            );
          })}
        </div>
      </section>

      {/* Canlı Deneme Quizi Alanı */}
      <section id="active-quiz-runner" className="scroll-mt-20">
        <GradeQuizRunner initialGrade={selectedGrade} showGradeSwitcher={true} />
      </section>
    </main>
  );
}
