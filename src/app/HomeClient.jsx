"use client";

import React, { useEffect, useState, useMemo } from "react";
import Link from "next/link";
import TabbedNavigator from "../components/TabbedNavigator";
import Header from "../components/Header";
import ArcadeHeroBanner from "../components/home/ArcadeHeroBanner";
import PathwayQuickGrid from "../components/home/PathwayQuickGrid";
import KpssQuickGrid from "../components/home/KpssQuickGrid";
import { useLocale } from "../lib/i18n/LocaleProvider";
import ParentReportModal from "../components/profile/ParentReportModal";
import ParentComparisonTable from "../components/home/ParentComparisonTable";
import TeacherShowcaseSection from "../components/home/TeacherShowcaseSection";
import {
  GRADE_QUICK_CARDS,
  HOME_GAME_ALIAS_MAP,
  HOME_LEVEL_ALIAS_MAP,
} from "../components/home/homeGradeCards";
import { calculateParentReportData } from "../lib/reports/reportGenerator";
import { useMemolandumStore } from "../store/useMemolandumStore";
import {
  Award,
  BookOpen,
  Brain,
  Sparkles,
  Gamepad2,
  Volume2,
  ShieldCheck,
  ChevronRight,
  Zap,
  Video,
} from "lucide-react";

export default function HomeClient() {
  const { locale, t } = useLocale();
  const isEn = locale === "en";
  const isAr = locale === "ar";
  const isPt = locale === "pt";
  const [parentReportOpen, setParentReportOpen] = useState(false);
  const [parentReportTab, setParentReportTab] = useState("report");

  // Store data for sample/actual parent report
  const vocabularyVault = useMemolandumStore((s) => s.vocabularyVault) || {};
  const quizHistory = useMemolandumStore((s) => s.quizHistory) || [];
  const globalStats = useMemolandumStore((s) => s.globalStats);
  const profile = useMemolandumStore((s) => s.profile);
  const activeStudyProfile = useMemolandumStore((s) => s.getActiveStudyProfile?.() || null);
  const lastPlayedLevel = useMemolandumStore((s) => s.lastPlayedLevel);
  const childrenProfiles = useMemolandumStore((s) => s.childrenProfiles) || [];
  const activeChildId = useMemolandumStore((s) => s.activeChildId);

  const reportData = useMemo(() => {
    const selectedChild =
      childrenProfiles.find((c) => c.id === activeChildId) ||
      childrenProfiles[0] ||
      null;
    return calculateParentReportData({
      vocabularyVault,
      quizHistory,
      globalStats,
      profile,
      activeStudyProfile,
      lastPlayedLevel: selectedChild?.grade || lastPlayedLevel || "meb-2-sinif-kelimeleri",
      selectedChild,
    });
  }, [
    vocabularyVault,
    quizHistory,
    globalStats,
    profile,
    activeStudyProfile,
    lastPlayedLevel,
    childrenProfiles,
    activeChildId,
  ]);

  useEffect(() => {
    if (typeof window === "undefined") return;
    // Faz 3: Arapça (/ar veya ar locale) oturumda ilk kez gelen kullanıcıya ar-en (other-arabic-ar_en) dil çiftini otomatik bağla
    try {
      if (isAr) {
        const state = useMemolandumStore.getState();
        if (!state?.lastPlayedLang && typeof state?.setLastPlayed === "function") {
          state.setLastPlayed("other-arabic-ar_en", "a1_words.json", "shooter");
        }
      }
    } catch {
      /* ignore */
    }
    // Görev C2: Doğrudan Oyuna İniş (Deep-Linking) — ?game=retro-shooter&level=grade-5 vb.
    try {
      const params = new URLSearchParams(window.location.search);
      const rawGame = (params.get("game") || "").toLowerCase().trim();
      if (rawGame) {
        const targetSlug = HOME_GAME_ALIAS_MAP[rawGame];
        if (targetSlug) {
          const rawLevel = (params.get("level") || "").toLowerCase().trim();
          const mapped = HOME_LEVEL_ALIAS_MAP[rawLevel];
          const q = new URLSearchParams();
          if (mapped) {
            q.set("lang", mapped.lang);
            q.set("level", mapped.level);
          } else {
            const pLang = params.get("pathway") || params.get("langPair") || params.get("lang");
            if (pLang && pLang !== "tr" && pLang !== "en" && pLang !== "ar" && pLang !== "pt") {
              q.set("lang", pLang);
            }
            if (rawLevel) q.set("level", rawLevel);
          }
          const qs = q.toString();
          window.location.replace(`/games/${targetSlug}/${qs ? `?${qs}` : ""}`);
          return;
        }
      }
    } catch {
      /* ignore */
    }

    const hash = window.location.hash;
    if (hash === "#basla" || hash === "#kpss" || hash === "#ilkokul-grades" || hash === "#meb-grades") {
      requestAnimationFrame(() => {
        document.getElementById(hash.slice(1))?.scrollIntoView({
          behavior: "smooth",
          block: "start",
        });
      });
    }
  }, []);

  const scrollToPlay = (e) => {
    e?.preventDefault?.();
    document.getElementById("basla")?.scrollIntoView({ behavior: "smooth", block: "start" });
  };

  return (
    <div className="min-h-screen bg-dark-900 text-gray-200 font-sans selection:bg-primary-500/30">
      <Header />

      <main className="relative pt-3 pb-16 px-4 sm:px-6 max-w-6xl mx-auto min-h-screen flex flex-col justify-start">
        {/* 00. SINAV DÖNEMİ ÖZEL — EN ÜST VİTRİN BANNER: 2–8. Sınıf 20 Soruluk Rastgele Deneme Quizleri */}
        <section
          aria-label="2-8. Sınıf İngilizce Deneme Quizleri"
          className="mb-4 relative overflow-hidden rounded-2xl p-4 sm:p-5 bg-gradient-to-r from-indigo-950/95 via-slate-900/95 to-emerald-950/90 border border-amber-400/50 shadow-xl backdrop-blur-md"
        >
          {/* Üst Satır: Başlık & Açıklama (Tam Genişlik) + Sağda Tek Ana Buton */}
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 mb-3.5">
            <div className="min-w-0 flex-1">
              <div className="flex flex-wrap items-center gap-2 mb-1.5">
                <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full bg-amber-400 text-slate-950 text-[10px] sm:text-[11px] font-black uppercase tracking-wider shadow-sm">
                  🔥 {isAr ? "موسم الامتحانات" : isPt ? "Época de Provas" : isEn ? "Exam Season Special" : "Sınav Dönemi Özel"}
                </span>
                <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full bg-cyan-500/15 border border-cyan-400/35 text-cyan-300 text-[10px] sm:text-[11px] font-bold">
                  🎯 {isAr ? "100 سؤال لكل صف ← 20 عشوائياً" : isPt ? "100 Questões por Série → 20 Aleatórias" : isEn ? "100-Question Pool → 20 Random Quiz" : "Her Sınıf İçin 100 Soru Havuzu → 20 Soruluk Rastgele Test"}
                </span>
              </div>
              <h2 className="text-base sm:text-lg md:text-xl font-black text-white tracking-tight leading-snug">
                {isAr
                  ? "اختبارات اللغة الإنجليزية التجريبية للصفوف 2–8 (مع بطاقة نتيجة فورية!)"
                  : isPt
                    ? "Simulados Rápidos de Inglês do 2º ao 8º Ano (Resultado Instantâneo!)"
                    : isEn
                      ? "Grades 2–8 Fast & Fun Multiple-Choice Practice Quizzes (Instant Score Card!)"
                      : "2. Sınıftan 8. Sınıfa (LGS Dahil) Hızlı & Eğlenceli Çoktan Seçmeli Deneme Quizleri"}
              </h2>
              <p className="text-xs text-slate-300 mt-0.5">
                {isAr
                  ? "بدون تسجيل — اختر صفك وابدأ اختبار 20 سؤالاً عشوائياً فوراً!"
                  : isPt
                    ? "Sem cadastro — escolha sua série e comece um teste de 20 questões na hora!"
                    : isEn
                      ? "No sign-up needed — pick your grade below, solve 20 random exam questions, and get your instant report card!"
                      : "Üyelik gerekmez — aşağıdan sınıfını seç, 20 soruluk rastgele yazılı denemesini çöz ve anında sınav karneni gör!"}
              </p>
            </div>

            <Link
              href="/quiz/"
              className="self-start sm:self-center shrink-0 px-4 py-2.5 rounded-xl bg-gradient-to-r from-amber-400 to-emerald-400 hover:from-amber-300 hover:to-emerald-300 text-slate-950 font-black text-xs sm:text-sm transition-all shadow-md shadow-amber-500/20 hover:scale-[1.02] inline-flex items-center gap-1.5"
            >
              <span>📝 Tüm Deneme Quizleri</span>
              <ChevronRight className="w-4 h-4" />
            </Link>
          </div>

          {/* Alt Satır: 2. Sınıftan 8. Sınıfa Dengeli 7 Sütunlu Sınıf Seçim Grid'i */}
          <div className="grid grid-cols-2 sm:grid-cols-4 lg:grid-cols-7 gap-2">
            {[
              { g: 2, icon: "🎈", label: "2. Sınıf", sub: "20 Soru Test", cls: "border-emerald-500/40 hover:border-emerald-400 bg-emerald-950/30 hover:bg-emerald-500/20 text-emerald-200" },
              { g: 3, icon: "🚀", label: "3. Sınıf", sub: "20 Soru Test", cls: "border-amber-500/40 hover:border-amber-400 bg-amber-950/30 hover:bg-amber-500/20 text-amber-200" },
              { g: 4, icon: "🌟", label: "4. Sınıf", sub: "Yazılı Quizi", cls: "border-purple-500/40 hover:border-purple-400 bg-purple-950/30 hover:bg-purple-500/20 text-purple-200" },
              { g: 5, icon: "🎒", label: "5. Sınıf", sub: "Yazılı Quizi", cls: "border-indigo-500/40 hover:border-indigo-400 bg-indigo-950/30 hover:bg-indigo-500/20 text-indigo-200" },
              { g: 6, icon: "⚡", label: "6. Sınıf", sub: "Yazılı Quizi", cls: "border-cyan-500/40 hover:border-cyan-400 bg-cyan-950/30 hover:bg-cyan-500/20 text-cyan-200" },
              { g: 7, icon: "🔥", label: "7. Sınıf", sub: "Yazılı Quizi", cls: "border-teal-500/40 hover:border-teal-400 bg-teal-950/30 hover:bg-teal-500/20 text-teal-200" },
              { g: 8, icon: "🏆", label: "8. Sınıf", sub: "LGS Deneme", cls: "col-span-2 sm:col-span-1 border-rose-500/50 hover:border-rose-400 bg-rose-950/35 hover:bg-rose-500/25 text-rose-200" },
            ].map((item) => (
              <Link
                key={item.g}
                href={`/quiz/${item.g}-sinif/`}
                className={`px-3 py-2 rounded-xl border transition-all flex items-center justify-between gap-2 group shadow-sm ${item.cls}`}
              >
                <div className="flex items-center gap-2 min-w-0">
                  <span className="text-base shrink-0">{item.icon}</span>
                  <div className="leading-tight truncate">
                    <div className="font-black text-xs sm:text-[13px] text-white group-hover:text-amber-200">
                      {item.label}
                    </div>
                    <div className="text-[10px] opacity-80 font-semibold">
                      {item.sub}
                    </div>
                  </div>
                </div>
                <ChevronRight className="w-3.5 h-3.5 opacity-60 group-hover:opacity-100 group-hover:translate-x-0.5 transition-all shrink-0" />
              </Link>
            ))}
          </div>

          {/* 3. Satır: LGS 6 Kategori × 200 Soru MEB Soru Kökü & Çeldirici Kampı Hızlı Erişim Şeridi */}
          <div className="mt-3 pt-2.5 border-t border-white/10 flex flex-col lg:flex-row lg:items-center justify-between gap-2">
            <div className="flex items-center gap-1.5 text-[11px] font-black text-amber-300 shrink-0">
              <span>🏆 LGS 6 Kategori × 200 Soru Çeldirici Kampı:</span>
            </div>
            <div className="flex flex-wrap items-center gap-1.5">
              {[
                { slug: "lgs-olumsuz-kokler", label: "⚠️ 1. Olumsuz Kökler (200)" },
                { slug: "lgs-diyalog-bosluk", label: "💬 2. Diyalog & Boşluk (200)" },
                { slug: "lgs-afis-davetiye", label: "📢 3. Afiş & Eksik Bilgi (200)" },
                { slug: "lgs-grafik-tablo", label: "📊 4. Grafik & Tablo (200)" },
                { slug: "lgs-es-anlam-tuzaklari", label: "🔄 5. Eş Anlam Tuzakları (200)" },
                { slug: "lgs-siklik-zarflari", label: "🗓️ 6. Sıklık Zarfları (200)" },
                { slug: "lgs-celdirici-kampi", label: "🔥 Tüm 6 Kategori Karma (1.200 Soru)", highlight: true },
              ].map((cat) => (
                <Link
                  key={cat.slug}
                  href={`/quiz/${cat.slug}/`}
                  className={`px-2.5 py-1 rounded-lg text-[11px] font-extrabold transition-all border ${
                    cat.highlight
                      ? "bg-amber-400 hover:bg-amber-300 text-slate-950 border-amber-300 shadow-sm"
                      : "bg-slate-950/80 hover:bg-slate-800 text-slate-200 hover:text-amber-200 border-white/15 hover:border-amber-400/50"
                  }`}
                >
                  {cat.label}
                </Link>
              ))}
            </div>
          </div>
        </section>

        {/* 0. RADİKAL OYUN-ODAKLI HERO BANNER (İlk Açılışta Doğrudan Oyun Deneyimi & 6 Tek-Dokunuş Oyun Vitrini) */}
        <ArcadeHeroBanner
          locale={locale}
          onScrollToAllGames={scrollToPlay}
          onOpenParentReport={() => {
            setParentReportTab("report");
            setParentReportOpen(true);
          }}
        />

        {/* 0.5. İnteraktif 16 Oyun & 23 Dil Seçim Masası (#basla) — Hero'nun Hemen Altında */}
        <div id="basla" className="mb-8 scroll-mt-24">
          <div className="flex flex-wrap items-center justify-between gap-2 mb-3">
            <p className="text-[10px] font-bold uppercase tracking-[0.16em] text-slate-400">
              {t("home.step1")} · {t("home.step1Title")}
            </p>
            <div className="flex items-center gap-2">
              <Link
                href="/games/orbitlex/"
                className="text-[11px] font-bold text-indigo-300 hover:text-white bg-indigo-950/50 hover:bg-indigo-900/60 border border-indigo-500/30 hover:border-indigo-400/50 px-2.5 py-0.5 rounded-full transition-all inline-flex items-center gap-1 shadow-sm"
              >
                <span>
                  {isAr
                    ? "🪐 OrbitLex (المترادفات والأضداد)"
                    : isPt
                      ? "🪐 OrbitLex (Sinônimos e Antônimos)"
                      : isEn
                        ? "🪐 OrbitLex (Synonyms & Antonyms)"
                        : "🪐 OrbitLex (Eş & Zıt Anlam)"}
                </span>
              </Link>{" "}
              <span className="text-[11px] font-bold text-cyan-400 bg-cyan-950/40 border border-cyan-500/20 px-2 py-0.5 rounded-full">
                {isAr
                  ? "⚡ المكتب الدراسي التفاعلي"
                  : isPt
                    ? "⚡ Mesa de Estudo Interativa"
                    : isEn
                      ? "⚡ Interactive Study Desk"
                      : "⚡ İnteraktif Öğrenme Masası"}
              </span>
            </div>
          </div>
          <TabbedNavigator />
        </div>

        {/* 1. Okula Dönüş duyuru — 1–8. Sınıf (İlkokul & Ortaokul / LGS) + YDS vurgusu */}
        <div className="mb-4 py-2.5 px-4 rounded-xl bg-gradient-to-r from-cyan-950/90 via-indigo-950/90 to-amber-950/90 border border-cyan-500/40 flex flex-wrap items-center justify-between gap-3 shadow-lg backdrop-blur-md">
          <div className="flex items-center gap-2.5">
            <span className="text-xl animate-bounce" aria-hidden>
              🎒
            </span>{" "}
            <div>
              <span className="text-xs sm:text-sm font-black text-white">
                {isAr
                  ? "موسم العودة للمدارس 2026-2027: "
                  : isPt
                    ? "Volta às Aulas 2026-2027: "
                    : isEn
                      ? "2026-2027 Back to School: "
                      : "2026-2027 Okula Dönüş: "}
              </span>
              <span className="text-xs text-cyan-300 ml-1 hidden md:inline">
                {isAr
                  ? "من الابتدائية إلى الاختبارات — مفردات وجمل صوتية للصفوف 1–8 متاحة الآن."
                  : isPt
                    ? "Do Fundamental aos Exames — vocabulário e frases com áudio (1º ao 8º ano) já disponíveis."
                    : isEn
                      ? "From Primary School to YDS — Grades 1–8 (Primary & Middle School / LGS) words & audio sentences live."
                      : "İlkokuldan YDS’ye yollar açık — 1–8. Sınıf (İlkokul & Ortaokul / LGS) kelime & sesli cümleler yayında."}
              </span>
            </div>
          </div>
          <div className="flex flex-wrap items-center gap-2.5">
            <Link
              href="/quiz/"
              className="inline-flex items-center gap-1.5 text-xs font-black text-slate-950 bg-gradient-to-r from-amber-400 to-emerald-400 hover:from-amber-300 hover:to-emerald-300 border border-amber-300/60 px-3 py-1.5 rounded-lg transition-all shadow-md"
            >
              <span className="text-sm" aria-hidden>
                📝
              </span>{" "}
              <span>
                {isAr
                  ? "اختبارات تجريبية (الصفوف 2–8)"
                  : isPt
                    ? "Simulados (2º ao 8º Ano)"
                    : isEn
                      ? "Practice Quizzes (Grades 2–8)"
                      : "2–8. Sınıf Deneme Quizleri"}
              </span>{" "}
              <span className="text-[9px] font-black bg-slate-950 text-amber-300 px-1 py-0.5 rounded uppercase">
                {isAr ? "جديد" : isPt ? "Novo" : isEn ? "New" : "Yeni"}
              </span>
            </Link>{" "}
            <Link
              href="/games/orbitlex/"
              className="inline-flex items-center gap-1.5 text-xs font-black text-cyan-300 hover:text-white bg-cyan-500/20 hover:bg-cyan-500/30 border border-cyan-500/40 px-3 py-1.5 rounded-lg transition-all shadow-sm"
            >
              <span className="text-sm" aria-hidden>
                🪐
              </span>{" "}
              <span>
                {isAr ? "لعبة جديدة: OrbitLex" : isPt ? "Novo Jogo: OrbitLex" : isEn ? "New Game: OrbitLex" : "Yeni Oyun: OrbitLex"}
              </span>{" "}
              <span className="text-[9px] font-black bg-cyan-400 text-slate-950 px-1 py-0.5 rounded uppercase">
                {isAr ? "جديد" : isPt ? "Novo" : isEn ? "New" : "Yeni"}
              </span>
            </Link>{" "}
            <Link
              href="/schools/?tab=dashboard"
              className="inline-flex items-center gap-1.5 text-xs font-bold text-cyan-300 hover:text-white bg-cyan-500/20 hover:bg-cyan-500/30 border border-cyan-500/40 px-3 py-1.5 rounded-lg transition-all shadow-sm"
            >
              <span>{isAr ? "🦉 مكتب المعلم" : isPt ? "🦉 Mesa do Professor" : isEn ? "🦉 Teacher Desk" : "🦉 Öğretmen Masası"}</span>
            </Link>{" "}
            <Link
              href="/veli-rehberi/"
              className="inline-flex items-center gap-1.5 text-xs font-bold text-emerald-300 hover:text-white bg-emerald-500/20 hover:bg-emerald-500/30 border border-emerald-500/40 px-3 py-1.5 rounded-lg transition-all shadow-sm"
            >
              <span>
                {isAr ? "👨‍👩‍👧 دليل أولياء الأمور" : isPt ? "👨‍👩‍👧 Guia dos Pais" : isEn ? "👨‍👩‍👧 Parent Guide" : "👨‍👩‍👧 Veli Rehberi"}
              </span>
            </Link>{" "}
            <a
              href="#ilkokul-grades"
              className="inline-flex items-center gap-1.5 text-xs font-bold text-amber-300 hover:text-white bg-amber-500/20 hover:bg-amber-500/30 border border-amber-500/40 px-3.5 py-1.5 rounded-lg transition-all shadow-sm cursor-pointer"
            >
              <span>
                {isAr ? "اختر صفك وابدأ" : isPt ? "Escolha a Série e Comece" : isEn ? "Pick Your Grade & Start" : "Sınıfını Seç & Başla"}
              </span>
              <ChevronRight className="w-3.5 h-3.5" />
            </a>
          </div>
        </div>

        {/* 1.5. Yeni: Arapça – İngilizce & Brezilya Portekizcesi – İngilizce Konu Anlatımları Başladı (@memolandum YouTube) */}
        <div className="mb-4 grid grid-cols-1 lg:grid-cols-2 gap-3">
          {/* Arapça - İngilizce Konu Anlatımları Banner */}
          <div className="py-2.5 px-4 rounded-xl bg-gradient-to-r from-rose-950/90 via-slate-900/95 to-emerald-950/90 border border-rose-500/40 flex flex-wrap items-center justify-between gap-2.5 shadow-lg backdrop-blur-md">
            <div className="flex items-center gap-2.5">
              <span className="inline-flex items-center justify-center w-7 h-7 rounded-lg bg-red-500/20 border border-red-400/40 text-red-400 shrink-0">
                <Video className="w-4 h-4 fill-current" aria-hidden />
              </span>
              <div className="text-start">
                <span className="inline-flex items-center gap-1 text-[10px] font-black uppercase tracking-wider px-2 py-0.5 rounded bg-red-500/25 text-red-200 border border-red-400/40 mr-1.5 rtl:mr-0 rtl:ml-1.5">
                  {isAr ? "جديد · عربي" : isPt ? "NOVO · AR–EN" : isEn ? "NEW · AR–EN" : "YENİ · AR–EN"}
                </span>
                <span className="text-xs sm:text-sm font-black text-white">
                  {isAr
                    ? "بدأت دروس شرح اللغة الإنجليزية بالعربية خطوة بخطوة!"
                    : isPt
                      ? "Aulas de Árabe–Inglês passo a passo começaram!"
                      : isEn
                        ? "Arabic–English Step-by-Step Video Lessons Started!"
                        : "Arapça–İngilizce Konu Anlatımları Başladı!"}
                </span>
              </div>
            </div>
            <div className="flex flex-wrap items-center gap-2">
              <Link
                href="/videos/?playlist=ar-en"
                className="inline-flex items-center gap-1.5 text-xs font-black text-white bg-gradient-to-r from-red-600 to-rose-600 hover:from-red-500 hover:to-rose-500 border border-red-400/50 px-3 py-1.5 rounded-lg transition-all shadow-md shadow-red-950/50"
              >
                <Video className="w-3.5 h-3.5 fill-current" aria-hidden />
                <span>
                  {isAr ? "شاهد الدروس" : isPt ? "Ver Aulas" : isEn ? "Watch Lessons" : "Dersleri İzle"}
                </span>
                <ChevronRight className="w-3.5 h-3.5 rtl:rotate-180" />
              </Link>
              <Link
                href="/learn/ar-en/"
                className="inline-flex items-center gap-1 text-xs font-bold text-emerald-300 hover:text-white bg-emerald-500/20 hover:bg-emerald-500/30 border border-emerald-500/40 px-2.5 py-1.5 rounded-lg transition-all"
              >
                <span>{isAr ? "🎮 مفردات" : isPt ? "🎮 Árabe–Inglês" : isEn ? "🎮 AR–EN Words" : "🎮 AR–EN Oyna"}</span>
              </Link>
            </div>
          </div>

          {/* Brezilya Portekizcesi - İngilizce Konu Anlatımları Banner */}
          <div className="py-2.5 px-4 rounded-xl bg-gradient-to-r from-emerald-950/90 via-slate-900/95 to-amber-950/85 border border-emerald-500/40 flex flex-wrap items-center justify-between gap-2.5 shadow-lg backdrop-blur-md">
            <div className="flex items-center gap-2.5">
              <span className="inline-flex items-center justify-center w-7 h-7 rounded-lg bg-emerald-500/20 border border-emerald-400/40 text-emerald-300 shrink-0 text-sm">
                🇧🇷
              </span>
              <div className="text-start">
                <span className="inline-flex items-center gap-1 text-[10px] font-black uppercase tracking-wider px-2 py-0.5 rounded bg-emerald-500/25 text-emerald-200 border border-emerald-400/40 mr-1.5 rtl:mr-0 rtl:ml-1.5">
                  {isPt ? "NOVO · PT-BR" : isAr ? "جديد · برتغالي" : isEn ? "NEW · PT-BR" : "YENİ · PT-BR"}
                </span>
                <span className="text-xs sm:text-sm font-black text-white">
                  {isPt
                    ? "Curso de Inglês do Zero (Explicado em Português) começou!"
                    : isAr
                      ? "بدأت دروس شرح الإنجليزية بالبرتغالية البرازيلية!"
                      : isEn
                        ? "Brazilian Portuguese–English Video Lessons Started!"
                        : "Brezilya Portekizcesi–İngilizce Konu Anlatımları Başladı!"}
                </span>
              </div>
            </div>
            <div className="flex flex-wrap items-center gap-2">
              <Link
                href="/videos/?playlist=pt-en"
                className="inline-flex items-center gap-1.5 text-xs font-black text-slate-950 bg-gradient-to-r from-emerald-400 to-amber-400 hover:from-emerald-300 hover:to-amber-300 border border-emerald-300/60 px-3 py-1.5 rounded-lg transition-all shadow-md shadow-emerald-950/50"
              >
                <Video className="w-3.5 h-3.5 fill-current" aria-hidden />
                <span>
                  {isPt ? "Assistir Aulas" : isAr ? "شاهد الدروس" : isEn ? "Watch Lessons" : "Dersleri İzle"}
                </span>
                <ChevronRight className="w-3.5 h-3.5 rtl:rotate-180" />
              </Link>
              <Link
                href="/learn/pt-en/"
                className="inline-flex items-center gap-1 text-xs font-bold text-amber-300 hover:text-white bg-amber-500/20 hover:bg-amber-500/30 border border-amber-500/40 px-2.5 py-1.5 rounded-lg transition-all"
              >
                <span>{isPt ? "🎮 Jogar PT–EN" : isAr ? "🎮 مفردات" : isEn ? "🎮 PT–EN Words" : "🎮 PT–EN Oyna"}</span>
              </Link>
            </div>
          </div>
        </div>

        {/* 2. Hızlı Özellik & Ekosistem Şeridi (Videolar, 23 Dil Yolu, Veli Karnesi, Bilimsel Metod) */}
        <div className="mb-8 grid grid-cols-2 lg:grid-cols-4 gap-3">
          <Link href="/videos/" className="banner-btn-videos group">
            <div className="flex items-center justify-between w-full gap-1.5">
              <span className="font-extrabold flex items-center gap-1.5 text-rose-200 group-hover:text-white text-[13px] tracking-wide">
                <Video className="w-4 h-4 fill-current text-red-400 group-hover:scale-110 transition-transform shrink-0" aria-hidden />
                <span>{isAr ? "ادرس بالفيديو" : isPt ? "Estude com Vídeos" : isEn ? "Study with Videos" : "Videolarla Çalış"}</span>
              </span>
              <span className="text-[9px] font-black uppercase tracking-wider px-1.5 py-0.5 rounded bg-red-500/25 text-red-300 border border-red-400/40 shrink-0">
                {isAr ? "15 قائمة" : isPt ? "15 Listas" : isEn ? "15 Lists" : "15 Liste"}
              </span>
            </div>
            <span className="banner-lexicon-sub !text-rose-200/85">
              {isAr
                ? "الصفوف 1–8 · اختبارات Shorts"
                : isPt
                  ? "1º ao 8º Ano · Exames Shorts"
                  : isEn
                    ? "1–8th Grade · LGS · YDS Shorts"
                    : "1–8. Sınıf · LGS · YDS Shorts"}
            </span>
          </Link>

          <Link href="/learn/" className="banner-btn-pathway group">
            <div className="flex items-center justify-between w-full gap-1.5">
              <span className="font-extrabold text-cyan-100 group-hover:text-white text-[13px] tracking-wide">
                🌍 {t("home.pathwayCta")}
              </span>
              <span className="text-[9px] font-black uppercase tracking-wider px-1.5 py-0.5 rounded bg-cyan-500/20 text-cyan-300 border border-cyan-400/30 shrink-0">
                {isAr ? "مجاني" : isPt ? "Grátis" : isEn ? "Free" : "Ücretsiz"}
              </span>
            </div>
            <span className="banner-lexicon-sub !text-cyan-200/85">
              {t("home.pathwayCtaHint")}
            </span>
          </Link>

          <button
            type="button"
            onClick={() => {
              setParentReportTab("report");
              setParentReportOpen(true);
            }}
            className="banner-btn-lexicon cursor-pointer group"
          >
            <div className="flex items-center justify-between w-full gap-1.5">
              <span className="font-extrabold text-amber-300 group-hover:text-amber-200 text-[13px]">
                {isAr ? "🎓 تقرير التقدم" : isPt ? "🎓 Boletim de Progresso" : isEn ? "🎓 Progress Report" : "🎓 Veli Karnesi"}
              </span>
              <span className="text-[9px] font-black uppercase tracking-wider px-1.5 py-0.5 rounded bg-amber-500/20 text-amber-200 border border-amber-400/30 shrink-0">
                {isAr ? "واتساب والعائلة" : isPt ? "WhatsApp e Família" : "WhatsApp & Aile"}
              </span>
            </div>
            <span className="banner-lexicon-sub">
              {isAr
                ? "تقرير بيانات حقيقي · لعبة العائلة"
                : isPt
                  ? "Boletim em tempo real e Jogo em Família"
                  : isEn
                    ? "Real data report & 3-Word Family Game"
                    : "Gerçek karne · Evde 3 Kelime · WhatsApp"}
            </span>
          </button>

          <Link href="/about/" className="banner-btn-orbitlex group">
            <div className="flex items-center justify-between w-full gap-1.5">
              <span className="font-extrabold flex items-center gap-1.5 text-indigo-200 group-hover:text-white text-[13px]">
                <span>🧠 {t("home.scienceLink")}</span>
              </span>
              <span className="text-[9px] font-black uppercase tracking-wider px-1.5 py-0.5 rounded bg-indigo-400/20 text-indigo-200 border border-indigo-400/30 shrink-0">
                SM-2
              </span>
            </div>
            <span className="banner-lexicon-sub !text-indigo-200/80">
              {t("home.bannerBadge")}
            </span>
          </Link>
        </div>

        {/* 3. İlkokul, Ortaokul (LGS) & Sınav Hızlı Sınıf Seçici (#ilkokul-grades) */}
        <section id="ilkokul-grades" className="mb-10 scroll-mt-24">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 mb-4">
            <div>
              <span className="text-[11px] font-mono font-bold tracking-widest uppercase text-cyan-400 bg-cyan-950/60 px-2.5 py-0.5 rounded-md border border-cyan-500/30">
                {isAr
                  ? "منهج الصفوف 1–8 (الابتدائية والمتوسطة) والاختبارات"
                  : isPt
                    ? "Currículo do 1º ao 8º Ano e Exames"
                    : isEn
                      ? "Grades 1–8 (Primary & Middle School / LGS) & Exam Curriculum"
                      : "1–8. Sınıf (İlkokul & Ortaokul / LGS) & Sınav Müfredatı"}
              </span>
              <h2 className="text-xl sm:text-2xl font-black text-white mt-1">
                {isAr
                  ? "اختر صفك وابدأ لعبة المفردات فوراً"
                  : isPt
                    ? "Escolha sua Série e Comece o Jogo de Vocabulário Agora"
                    : isEn
                      ? "Pick Your Grade, Start the Vocabulary Game Now"
                      : "Sınıfını Seç, Hemen Kelime Oyununa Başla"}
              </h2>
            </div>
            <span className="text-xs text-slate-400">
              {isAr
                ? "حوّل مفردات المنهج الدراسي إلى ذاكرة دائمة!"
                : isPt
                  ? "Transforme o vocabulário escolar em memória duradoura!"
                  : isEn
                    ? "Turn curriculum words into lasting reflexes!"
                    : "Okul müfredatı kelimelerini refleks haline getir!"}
            </span>
          </div>

          <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-5 gap-3.5">
            {GRADE_QUICK_CARDS.map((card) => (
              <div
                key={card.playlist}
                className={`group p-4 rounded-2xl bg-gradient-to-b from-slate-900/90 to-slate-950 border border-slate-800 ${card.accent.border} transition-all duration-300 hover:scale-[1.02] shadow-md flex flex-col justify-between ${
                  card.wide ? "col-span-2 sm:col-span-1" : ""
                }`}
              >
                <div>
                  <div
                    className={`w-9 h-9 rounded-xl border flex items-center justify-center font-black mb-2 group-hover:scale-110 transition-transform ${card.accent.badge} ${
                      card.grade === "YDS" ? "text-xs" : "text-sm"
                    }`}
                  >
                    {card.grade}
                  </div>
                  <h3
                    className={`font-bold text-white text-sm transition-colors ${card.accent.title}`}
                  >
                    {isAr
                      ? card.titleAr || card.titleEn
                      : isPt
                        ? card.titlePt || card.titleEn
                        : isEn
                          ? card.titleEn
                          : card.title}
                  </h3>
                  <p className="text-[11px] text-slate-400 mt-1">
                    {isAr
                      ? card.blurbAr || card.blurbEn
                      : isPt
                        ? card.blurbPt || card.blurbEn
                        : isEn
                          ? card.blurbEn
                          : card.blurb}
                  </p>
                </div>
                <div className="mt-3 flex flex-col gap-1.5">
                  <Link
                    href={
                      isAr
                        ? card.learnHrefAr || card.learnHref
                        : isPt
                          ? card.learnHrefPt || card.learnHref
                          : card.learnHref
                    }
                    className={`text-[10px] font-bold ${card.accent.cta} inline-flex items-center gap-1 hover:translate-x-0.5 transition-transform`}
                  >
                    {isAr ? "ابدأ باللعبة ←" : isPt ? "Começar com jogo →" : isEn ? "Start with game →" : "Oyunla başla →"}
                  </Link>{" "}
                  {card.quizHref && (
                    <Link
                      href={card.quizHref}
                      className="text-[10px] font-black tracking-wide text-emerald-300 hover:text-slate-950 inline-flex items-center gap-1.5 border border-emerald-500/35 hover:border-emerald-400 bg-emerald-500/10 hover:bg-emerald-400 rounded-lg px-2 py-1.5 transition-colors"
                    >
                      <span>📝</span>
                      <span>
                        {isAr
                          ? "اختبار 20 سؤالاً"
                          : isPt
                            ? "Quiz de 20 Questões"
                            : isEn
                              ? "20-Question Quiz"
                              : "20 Soruluk Deneme Quizi"}
                      </span>
                    </Link>
                  )}
                  <Link
                    href={`/videos/?playlist=${encodeURIComponent(card.playlist)}`}
                    className="text-[10px] font-black tracking-wide text-red-400/90 hover:text-red-300 inline-flex items-center gap-1.5 border border-red-500/25 hover:border-red-500/50 bg-red-500/5 hover:bg-red-500/15 rounded-lg px-2 py-1.5 transition-colors"
                  >
                    <Video className="w-3 h-3 fill-current" aria-hidden />
                    <span>{isAr ? "ادرس بالفيديو" : isPt ? "Estudar com vídeo" : isEn ? "Study with video" : "Video ile çalış"}</span>
                  </Link>
                </div>
              </div>
            ))}
          </div>
        </section>

        {/* 4. Veli Başarı Takibi & Karne Vitrini Banner */}
        <div className="mb-10 p-6 rounded-2xl border-2 border-amber-500/40 bg-gradient-to-r from-amber-950/30 via-slate-900/90 to-indigo-950/40 shadow-xl backdrop-blur-md flex flex-col md:flex-row items-center justify-between gap-6 transition-all duration-300 hover:border-amber-400/70">
          <div className="flex items-center gap-4 text-center md:text-start">
            <div className="w-14 h-14 rounded-2xl bg-amber-500/15 border border-amber-500/40 flex items-center justify-center text-3xl shadow-inner shrink-0">
              🎓
            </div>
            <div>
              <div className="flex items-center gap-2 justify-center md:justify-start">
                <span className="px-2.5 py-0.5 rounded-full text-[10px] font-black uppercase tracking-wider bg-amber-500/20 text-amber-300 border border-amber-500/30">
                  {isAr ? "لأولياء الأمور" : isPt ? "Para os Pais" : isEn ? "For Parents" : "Veliler İçin Özel"}
                </span>{" "}
                <span className="text-[10px] text-slate-400 font-mono">
                  {isAr
                    ? "بطاقة التقرير ومشاركة واتساب"
                    : isPt
                      ? "Boletim e Compartilhamento no WhatsApp"
                      : isEn
                        ? "Report Card & WhatsApp Share"
                        : "Karne & WhatsApp Paylaşımı"}
                </span>
              </div>
              <h3 className="text-lg sm:text-xl font-black text-white mt-1">
                {isAr
                  ? "تابع تقدّم طفلك في اللغة الإنجليزية"
                  : isPt
                    ? "Acompanhe o Progresso do seu Filho no Inglês"
                    : isEn
                      ? "Track Your Child’s English Progress"
                      : "Çocuğunuzun İngilizce Başarısını Takip Edin"}
              </h3>
              <p className="text-xs sm:text-sm text-slate-300 max-w-xl mt-0.5 leading-relaxed">
                {isAr
                  ? "اعرض الكلمات المحفوظة ونسبة الدقة في بطاقة تقرير حقيقية؛ حمّلها أو شاركها عبر واتساب أو البريد الإلكتروني."
                  : isPt
                    ? "Veja as palavras memorizadas e a taxa de acerto em um boletim real; baixe ou compartilhe pelo WhatsApp ou e-mail."
                    : isEn
                      ? "View memorized vocabulary and accuracy rates as a real-data report card; download or share via WhatsApp / email."
                      : "Ezberlenen kelimeleri ve başarı oranını gerçek veriden üretilen karne olarak görüntüleyin; indirin veya WhatsApp / e-posta ile paylaşın."}
              </p>
            </div>
          </div>

          <div className="flex flex-wrap items-center gap-2.5 w-full md:w-auto justify-center">
            <button
              onClick={() => {
                setParentReportTab("report");
                setParentReportOpen(true);
              }}
              className="flex-1 md:flex-none inline-flex items-center justify-center gap-2 px-5 py-3 rounded-xl bg-amber-500 hover:bg-amber-400 text-slate-950 font-black text-xs sm:text-sm tracking-wide shadow-lg shadow-amber-500/25 hover:scale-105 active:scale-95 transition-all whitespace-nowrap cursor-pointer"
            >
              <span>
                {isAr ? "📜 عرض تقرير ولي الأمر" : isPt ? "📜 Ver Boletim dos Pais" : isEn ? "View Parent Report" : "📜 Veli Karnesini Gör"}
              </span>
              <Award className="w-4 h-4" />
            </button>{" "}
            <button
              onClick={() => {
                setParentReportTab("bond");
                setParentReportOpen(true);
              }}
              className="flex-1 md:flex-none inline-flex items-center justify-center gap-1.5 px-4 py-3 rounded-xl bg-emerald-500/20 hover:bg-emerald-500/30 text-emerald-200 border border-emerald-500/40 font-bold text-xs sm:text-sm transition-all whitespace-nowrap cursor-pointer"
            >
              <span>
                {isAr ? "💬 لعبة 3 كلمات للعائلة" : isPt ? "💬 Jogo de 3 Palavras em Família" : isEn ? "💬 3-Word Family Game" : "💬 Evde 3 Kelime Sor & Tebrik"}
              </span>
            </button>{" "}
            <Link
              href="/veli-rehberi/"
              className="flex-1 md:flex-none inline-flex items-center justify-center gap-1.5 px-4 py-3 rounded-xl bg-slate-800 hover:bg-slate-700 text-amber-300 border border-amber-500/30 font-bold text-xs sm:text-sm transition-all whitespace-nowrap"
            >
              <span>
                {isAr ? "📖 دليل ولي الأمر (دقيقة واحدة)" : isPt ? "📖 Guia dos Pais (1 Min)" : isEn ? "📖 1-Min Parent Guide" : "📖 1 Dk Veli Rehberi"}
              </span>
            </Link>
          </div>
        </div>

        {/* 4.1. "Neden Memolandum?" Veli Karşılaştırma & Güven Tablosu */}
        <ParentComparisonTable
          onOpenReport={() => {
            setParentReportTab("report");
            setParentReportOpen(true);
          }}
        />

        {/* 4.2. Öğretmenler & Okullar İçin Memolandum Tanıtım Vitrini */}
        <TeacherShowcaseSection />

        {/* 5. Kurumsal Güven & Platform Metrikleri Şeridi (Task 5.2) */}
        <div
          className="grid grid-cols-2 md:grid-cols-4 gap-3.5 mb-12"
          aria-label={
            isAr
              ? "مقاييس المنصة والثقة"
              : isPt
                ? "Métricas da Plataforma e Confiança"
                : isEn
                  ? "Platform Metrics & Trust Strip"
                  : "Platform Metrikleri & Güven Şeridi"
          }
        >
          <div className="p-4 rounded-xl bg-slate-900/60 border border-slate-800 flex items-center gap-3">
            <div className="p-2.5 rounded-lg bg-cyan-500/10 text-cyan-400 shrink-0">
              <BookOpen className="w-5 h-5" />
            </div>
            <div>
              <div className="text-base sm:text-lg font-black text-white">
                {isAr ? "23 مساراً لغوياً" : isPt ? "23 Trilhas de Idiomas" : isEn ? "23 Language Pathways" : "23 Dil Yolu"}
              </div>
              <div className="text-[11px] text-slate-400">
                {isAr
                  ? "الصفوف 1–8 والاختبارات الدولية"
                  : isPt
                    ? "1º ao 8º Ano e Exames Internacionais"
                    : isEn
                      ? "1–8. Sınıf (Primary & Middle School / LGS) & Exams"
                      : "1–8. Sınıf (İlkokul & Ortaokul / LGS) Tam Uyum"}
              </div>
            </div>
          </div>

          <div className="p-4 rounded-xl bg-slate-900/60 border border-slate-800 flex items-center gap-3">
            <div className="p-2.5 rounded-lg bg-indigo-500/10 text-indigo-400 shrink-0">
              <Gamepad2 className="w-5 h-5" />
            </div>
            <div>
              <div className="text-base sm:text-lg font-black text-white">
                {isAr ? "16 لعبة أركيد مجانية" : isPt ? "16 Jogos Arcade Grátis" : isEn ? "16 Free Arcade Games" : "16 Ücretsiz Arcade Oyun"}
              </div>
              <div className="text-[11px] text-slate-400">
                {isAr
                  ? "نظام التكرار المتباعد Memolandum Pulse™"
                  : isPt
                    ? "Repetição Espaçada Memolandum Pulse™ SM-2"
                    : isEn
                      ? "Memolandum Pulse™ SM-2 Spaced Repetition"
                      : "Memolandum Pulse™ SM-2 Aralıklı Tekrar"}
              </div>
            </div>
          </div>

          <div className="p-4 rounded-xl bg-slate-900/60 border border-slate-800 flex items-center gap-3">
            <div className="p-2.5 rounded-lg bg-emerald-500/10 text-emerald-400 shrink-0">
              <Volume2 className="w-5 h-5" />
            </div>
            <div>
              <div className="text-base sm:text-lg font-black text-white">
                {isAr ? "+10,000 تسجيل صوتي" : isPt ? "+10.000 Áudios de Estúdio" : isEn ? "+10,000 Studio Audio" : "+10.000 Stüdyo Ses Kaydı"}
              </div>
              <div className="text-[11px] text-slate-400">
                {isAr
                  ? "نطق طبيعي وجمل صوتية"
                  : isPt
                    ? "Pronúncia Natural e Frases com Áudio"
                    : isEn
                      ? "Natural Pronunciation & Phonetics"
                      : "Doğal Telaffuz & Sesli Cümleler"}
              </div>
            </div>
          </div>

          <div className="p-4 rounded-xl bg-slate-900/60 border border-slate-800 flex items-center gap-3">
            <div className="p-2.5 rounded-lg bg-amber-500/10 text-amber-400 shrink-0">
              <Brain className="w-5 h-5" />
            </div>
            <div>
              <div className="text-base sm:text-lg font-black text-white">
                {isAr
                  ? "~4,000 مفهوم أكاديمي"
                  : isPt
                    ? "~4.000 Conceitos Acadêmicos"
                    : isEn
                      ? "~4,000 KPSS & Academic"
                      : "~4.000 KPSS & Akademik Kavram"}
              </div>
              <div className="text-[11px] text-slate-400">
                {isAr
                  ? "منصة آمنة للأطفال وخالية من الإعلانات"
                  : isPt
                    ? "Plataforma Segura e Sem Anúncios"
                    : isEn
                      ? "Ad-Free & Child-Safe Platform"
                      : "Reklamsız & Güvenli Öğrenme Ortamı"}
              </div>
            </div>
          </div>
        </div>

        <div className="mt-6 grid gap-4 lg:grid-cols-2 lg:items-stretch">
          <div className="min-w-0 flex">
            <PathwayQuickGrid />
          </div>
          <div className="min-w-0 flex">
            <KpssQuickGrid />
          </div>
        </div>
      </main>

      {/* Veli Başarı Karnesi Modalı */}
      <ParentReportModal
        isOpen={parentReportOpen}
        onClose={() => setParentReportOpen(false)}
        reportData={reportData}
        initialTab={parentReportTab}
      />
    </div>
  );
}
