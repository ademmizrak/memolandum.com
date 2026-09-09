"use client";

import React, { useEffect, useState, useMemo } from "react";
import Link from "next/link";
import TabbedNavigator from "../components/TabbedNavigator";
import Header from "../components/Header";
import PathwayQuickGrid from "../components/home/PathwayQuickGrid";
import KpssQuickGrid from "../components/home/KpssQuickGrid";
import { useT } from "../lib/i18n/LocaleProvider";
import ParentReportModal from "../components/profile/ParentReportModal";
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
} from "lucide-react";

export default function HomeClient() {
  const t = useT();
  const [parentReportOpen, setParentReportOpen] = useState(false);

  // Store data for sample/actual parent report
  const vocabularyVault = useMemolandumStore((s) => s.vocabularyVault) || {};
  const quizHistory = useMemolandumStore((s) => s.quizHistory) || [];
  const globalStats = useMemolandumStore((s) => s.globalStats);
  const profile = useMemolandumStore((s) => s.profile);
  const activeStudyProfile = useMemolandumStore((s) => s.getActiveStudyProfile?.() || null);
  const lastPlayedLevel = useMemolandumStore((s) => s.lastPlayedLevel);

  const reportData = useMemo(() => {
    return calculateParentReportData({
      vocabularyVault,
      quizHistory,
      globalStats,
      profile,
      activeStudyProfile,
      lastPlayedLevel: lastPlayedLevel || "meb-2-sinif-kelimeleri",
    });
  }, [vocabularyVault, quizHistory, globalStats, profile, activeStudyProfile, lastPlayedLevel]);

  useEffect(() => {
    if (typeof window === "undefined") return;
    const hash = window.location.hash;
    if (hash === "#basla" || hash === "#kpss" || hash === "#meb-grades") {
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
        {/* 1. Okula Dönüş 2026-2027 Primetime Duyuru Çubuğu */}
        <div className="mb-4 py-2.5 px-4 rounded-xl bg-gradient-to-r from-cyan-950/90 via-indigo-950/90 to-amber-950/90 border border-cyan-500/40 flex flex-wrap items-center justify-between gap-3 shadow-lg backdrop-blur-md">
          <div className="flex items-center gap-2.5">
            <span className="text-xl animate-bounce">🎒</span>
            <div>
              <span className="text-xs sm:text-sm font-black text-white">
                2026-2027 MEB Okula Dönüş Özel:
              </span>
              <span className="text-xs text-cyan-300 ml-1.5 hidden md:inline">
                İlkokul 1, 2, 3 ve 4. Sınıf İngilizce Kelimeleri & Sesli Cümleleri Yayında!
              </span>
            </div>
          </div>
          <a
            href="#meb-grades"
            className="inline-flex items-center gap-1.5 text-xs font-bold text-amber-300 hover:text-white bg-amber-500/20 hover:bg-amber-500/30 border border-amber-500/40 px-3.5 py-1.5 rounded-lg transition-all shadow-sm cursor-pointer"
          >
            <span>Sınıfını Seç & Başla</span>
            <ChevronRight className="w-3.5 h-3.5" />
          </a>
        </div>

        {/* 2. Ana Banner */}
        <div className="block mb-6">
          <div className="gamified-banner-container">
            <div className="banner-glow-effect"></div>
            <div className="banner-content">
              <div className="banner-text-side">
                <span className="banner-badge">{t("home.bannerBadge")}</span>
                <h2 className="banner-title">
                  {t("home.bannerTitleBefore")}{" "}
                  <span className="highlight-text">{t("home.bannerTitleHighlight")}</span>
                </h2>
                <p className="banner-description">{t("home.bannerDesc")}</p>
                <Link href="/about/" className="science-side-link">
                  {t("home.scienceLink")}
                </Link>
              </div>

              {/* Orta Öne Çıkan Kart: MEB Okula Dönüş & KPSS */}
              <div className="banner-coming-soon hover:scale-[1.02] transition-all duration-300">
                <span className="coming-soon-pulse" aria-hidden />
                <span className="coming-soon-badge !border-amber-400/60 !text-amber-200">
                  ⚡ 2026-2027 YENİ DÖNEM
                </span>
                <div className="coming-soon-main-title">MEB İLKOKUL</div>
                <p className="coming-soon-sub-topics">1 · 2 · 3 · 4. SINIF İNGİLİZCE</p>
                <p className="coming-soon-tagline">
                  Sesli Cümleler, Oyunlar ve Resimli Kelime Kartlarıyla Kalıcı Ezber
                </p>
              </div>

              <div className="banner-action-side">
                <div className="floating-game-icons">
                  <span className="game-icon game-icon-1">🎮</span>
                  <span className="game-icon game-icon-2">⚡</span>
                  <span className="game-icon game-icon-3">🔥</span>
                </div>
                <div className="banner-cta-stack">
                  <Link href="/learn/" className="banner-btn-pathway">
                    <span>{t("home.pathwayCta")}</span>
                    <span className="banner-lexicon-sub">{t("home.pathwayCtaHint")}</span>
                  </Link>
                  <button type="button" className="banner-btn" onClick={scrollToPlay}>
                    <span>{t("home.bannerCta")}</span>
                    <svg
                      xmlns="http://www.w3.org/2000/svg"
                      width="24"
                      height="24"
                      viewBox="0 0 24 24"
                      fill="none"
                      stroke="currentColor"
                      strokeWidth="2"
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      className="btn-arrow"
                    >
                      <line x1="5" y1="12" x2="19" y2="12"></line>
                      <polyline points="12 5 19 12 12 19"></polyline>
                    </svg>
                  </button>
                  <button
                    type="button"
                    onClick={() => setParentReportOpen(true)}
                    className="banner-btn-lexicon cursor-pointer"
                  >
                    <span>🎓 Veli Başarı Karnesi</span>
                    <span className="banner-lexicon-sub">Öğrenci karnesini WhatsApp ile al</span>
                  </button>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* 3. MEB İlkokul & Sınav Hızlı Sınıf Seçici (#meb-grades) */}
        <section id="meb-grades" className="mb-10 scroll-mt-24">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 mb-4">
            <div>
              <span className="text-[11px] font-mono font-bold tracking-widest uppercase text-cyan-400 bg-cyan-950/60 px-2.5 py-0.5 rounded-md border border-cyan-500/30">
                MEB İngilizce Müfredatı
              </span>
              <h2 className="text-xl sm:text-2xl font-black text-white mt-1">
                Sınıfını Seç, Hemen Kelime Oyununa Başla
              </h2>
            </div>
            <span className="text-xs text-slate-400">
              Okul başlamadan kelimeleri refleks haline getir!
            </span>
          </div>

          <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-5 gap-3.5">
            {/* 1. Sınıf */}
            <Link
              href="/learn/en-tr/meb-1-sinif-kelimeleri/"
              className="group p-4 rounded-2xl bg-gradient-to-b from-slate-900/90 to-slate-950 border border-slate-800 hover:border-cyan-400 transition-all duration-300 hover:scale-105 shadow-md flex flex-col justify-between"
            >
              <div>
                <div className="w-9 h-9 rounded-xl bg-cyan-500/15 border border-cyan-500/30 flex items-center justify-center text-cyan-300 font-black text-sm mb-2 group-hover:scale-110 transition-transform">
                  1
                </div>
                <h3 className="font-bold text-white text-sm group-hover:text-cyan-300 transition-colors">
                  1. Sınıf MEB
                </h3>
                <p className="text-[11px] text-slate-400 mt-1">Temel 100 Kelime (Görsel & Sesli)</p>
              </div>
              <span className="text-[10px] font-bold text-cyan-400 mt-3 inline-flex items-center gap-1 group-hover:translate-x-1 transition-transform">
                Başla →
              </span>
            </Link>

            {/* 2. Sınıf */}
            <Link
              href="/learn/en-tr/meb-2-sinif-kelimeleri/"
              className="group p-4 rounded-2xl bg-gradient-to-b from-slate-900/90 to-slate-950 border border-slate-800 hover:border-emerald-400 transition-all duration-300 hover:scale-105 shadow-md flex flex-col justify-between"
            >
              <div>
                <div className="w-9 h-9 rounded-xl bg-emerald-500/15 border border-emerald-500/30 flex items-center justify-center text-emerald-300 font-black text-sm mb-2 group-hover:scale-110 transition-transform">
                  2
                </div>
                <h3 className="font-bold text-white text-sm group-hover:text-emerald-300 transition-colors">
                  2. Sınıf MEB
                </h3>
                <p className="text-[11px] text-slate-400 mt-1">Kelimeler + 100 Sesli Cümle</p>
              </div>
              <span className="text-[10px] font-bold text-emerald-400 mt-3 inline-flex items-center gap-1 group-hover:translate-x-1 transition-transform">
                Başla →
              </span>
            </Link>

            {/* 3. Sınıf */}
            <Link
              href="/learn/en-tr/meb-3-sinif-kelimeleri/"
              className="group p-4 rounded-2xl bg-gradient-to-b from-slate-900/90 to-slate-950 border border-slate-800 hover:border-amber-400 transition-all duration-300 hover:scale-105 shadow-md flex flex-col justify-between"
            >
              <div>
                <div className="w-9 h-9 rounded-xl bg-amber-500/15 border border-amber-500/30 flex items-center justify-center text-amber-300 font-black text-sm mb-2 group-hover:scale-110 transition-transform">
                  3
                </div>
                <h3 className="font-bold text-white text-sm group-hover:text-amber-300 transition-colors">
                  3. Sınıf MEB
                </h3>
                <p className="text-[11px] text-slate-400 mt-1">Tüm Üniteler & Kalıp Cümleler</p>
              </div>
              <span className="text-[10px] font-bold text-amber-400 mt-3 inline-flex items-center gap-1 group-hover:translate-x-1 transition-transform">
                Başla →
              </span>
            </Link>

            {/* 4. Sınıf */}
            <Link
              href="/learn/en-tr/meb-4-sinif-kelimeleri/"
              className="group p-4 rounded-2xl bg-gradient-to-b from-slate-900/90 to-slate-950 border border-slate-800 hover:border-purple-400 transition-all duration-300 hover:scale-105 shadow-md flex flex-col justify-between"
            >
              <div>
                <div className="w-9 h-9 rounded-xl bg-purple-500/15 border border-purple-500/30 flex items-center justify-center text-purple-300 font-black text-sm mb-2 group-hover:scale-110 transition-transform">
                  4
                </div>
                <h3 className="font-bold text-white text-sm group-hover:text-purple-300 transition-colors">
                  4. Sınıf MEB
                </h3>
                <p className="text-[11px] text-slate-400 mt-1">Ortaokula Hazırlık & Gramer</p>
              </div>
              <span className="text-[10px] font-bold text-purple-400 mt-3 inline-flex items-center gap-1 group-hover:translate-x-1 transition-transform">
                Başla →
              </span>
            </Link>

            {/* YDS / Sınav */}
            <Link
              href="/learn/en-tr/ingilizce-yds-kelimeleri-yds-grup1-en-tr-v2/"
              className="group p-4 rounded-2xl bg-gradient-to-b from-slate-900/90 to-slate-950 border border-slate-800 hover:border-rose-400 transition-all duration-300 hover:scale-105 shadow-md flex flex-col justify-between col-span-2 sm:col-span-1"
            >
              <div>
                <div className="w-9 h-9 rounded-xl bg-rose-500/15 border border-rose-500/30 flex items-center justify-center text-rose-300 font-black text-xs mb-2 group-hover:scale-110 transition-transform">
                  YDS
                </div>
                <h3 className="font-bold text-white text-sm group-hover:text-rose-300 transition-colors">
                  YDS & YÖKDİL
                </h3>
                <p className="text-[11px] text-slate-400 mt-1">Top 500 Sınav Kelimesi</p>
              </div>
              <span className="text-[10px] font-bold text-rose-400 mt-3 inline-flex items-center gap-1 group-hover:translate-x-1 transition-transform">
                Başla →
              </span>
            </Link>
          </div>
        </section>

        {/* 4. Veli Başarı Takibi & Karne Vitrini Banner */}
        <div className="mb-10 p-6 rounded-2xl border-2 border-amber-500/40 bg-gradient-to-r from-amber-950/30 via-slate-900/90 to-indigo-950/40 shadow-xl backdrop-blur-md flex flex-col md:flex-row items-center justify-between gap-6 transition-all duration-300 hover:border-amber-400/70">
          <div className="flex items-center gap-4 text-center md:text-left">
            <div className="w-14 h-14 rounded-2xl bg-amber-500/15 border border-amber-500/40 flex items-center justify-center text-3xl shadow-inner shrink-0">
              🎓
            </div>
            <div>
              <div className="flex items-center gap-2 justify-center md:justify-start">
                <span className="px-2.5 py-0.5 rounded-full text-[10px] font-black uppercase tracking-wider bg-amber-500/20 text-amber-300 border border-amber-500/30">
                  Veliler İçin Özel
                </span>
                <span className="text-[10px] text-slate-400 font-mono">
                  Otomatik Karne & Raporlama
                </span>
              </div>
              <h3 className="text-lg sm:text-xl font-black text-white mt-1">
                Çocuğunuzun İngilizce Başarısını Günlük Takip Edin
              </h3>
              <p className="text-xs sm:text-sm text-slate-300 max-w-xl mt-0.5 leading-relaxed">
                Ezberlenen kelimeleri, başarı oranını ve pedagojik gelişim notunu resmi karne olarak görüntüleyin, yüksek çözünürlüklü indirin veya WhatsApp aile grubunda paylaşın.
              </p>
            </div>
          </div>

          <div className="flex items-center gap-3 w-full md:w-auto justify-center">
            <button
              onClick={() => setParentReportOpen(true)}
              className="flex-1 md:flex-none inline-flex items-center justify-center gap-2 px-6 py-3 rounded-xl bg-amber-500 hover:bg-amber-400 text-slate-950 font-black text-sm tracking-wide shadow-lg shadow-amber-500/25 hover:scale-105 active:scale-95 transition-all whitespace-nowrap cursor-pointer"
            >
              <span>Veli Karnesini Gör</span>
              <Award className="w-4 h-4" />
            </button>
            <Link
              href="/profile/"
              className="flex-1 md:flex-none inline-flex items-center justify-center gap-1.5 px-4 py-3 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-200 font-bold text-sm transition-all whitespace-nowrap"
            >
              <span>Profilim</span>
            </Link>
          </div>
        </div>

        {/* 5. Kurumsal Güven Sayaçları Şeridi */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-3.5 mb-12">
          <div className="p-4 rounded-xl bg-slate-900/60 border border-slate-800 flex items-center gap-3">
            <div className="p-2.5 rounded-lg bg-cyan-500/10 text-cyan-400 shrink-0">
              <BookOpen className="w-5 h-5" />
            </div>
            <div>
              <div className="text-base sm:text-lg font-black text-white">%100 MEB Uyumlu</div>
              <div className="text-[11px] text-slate-400">1-4. Sınıf Tam Müfredat</div>
            </div>
          </div>

          <div className="p-4 rounded-xl bg-slate-900/60 border border-slate-800 flex items-center gap-3">
            <div className="p-2.5 rounded-lg bg-emerald-500/10 text-emerald-400 shrink-0">
              <Volume2 className="w-5 h-5" />
            </div>
            <div>
              <div className="text-base sm:text-lg font-black text-white">Stüdyo Telaffuz</div>
              <div className="text-[11px] text-slate-400">+10.000 Doğal Seslendirme</div>
            </div>
          </div>

          <div className="p-4 rounded-xl bg-slate-900/60 border border-slate-800 flex items-center gap-3">
            <div className="p-2.5 rounded-lg bg-amber-500/10 text-amber-400 shrink-0">
              <Brain className="w-5 h-5" />
            </div>
            <div>
              <div className="text-base sm:text-lg font-black text-white">Aralıklı Tekrar</div>
              <div className="text-[11px] text-slate-400">Memolandum Pulse™ SM-2</div>
            </div>
          </div>

          <div className="p-4 rounded-xl bg-slate-900/60 border border-slate-800 flex items-center gap-3">
            <div className="p-2.5 rounded-lg bg-purple-500/10 text-purple-400 shrink-0">
              <ShieldCheck className="w-5 h-5" />
            </div>
            <div>
              <div className="text-base sm:text-lg font-black text-white">Çocuk Dostu</div>
              <div className="text-[11px] text-slate-400">Reklamsız & Güvenli Ortam</div>
            </div>
          </div>
        </div>

        <style
          dangerouslySetInnerHTML={{
            __html: `
.gamified-banner-container {
  position: relative;
  width: 100%;
  min-height: 140px;
  background: linear-gradient(135deg, #0f172a 0%, #1e1b4b 50%, #2e1065 100%);
  border: 2px solid #4f46e5;
  border-radius: 12px;
  overflow: hidden;
  display: flex;
  align-items: center;
  padding: 24px;
  box-shadow: 0 10px 30px rgba(79, 70, 229, 0.15);
  box-sizing: border-box;
  font-family: system-ui, -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif;
  transition: transform 0.3s ease, box-shadow 0.3s ease;
}
.gamified-banner-container:hover {
  transform: translateY(-2px);
  box-shadow: 0 15px 40px rgba(79, 70, 229, 0.3);
}
.banner-glow-effect {
  position: absolute;
  top: -50%;
  right: -10%;
  width: 300px;
  height: 300px;
  background: radial-gradient(circle, rgba(168,85,247,0.4) 0%, rgba(0,0,0,0) 70%);
  z-index: 1;
  pointer-events: none;
  animation: pulseGlow 4s infinite ease-in-out;
}
.banner-content {
  position: relative;
  z-index: 2;
  width: 100%;
  display: grid;
  grid-template-columns: minmax(200px, 1.2fr) minmax(180px, 1fr) auto;
  align-items: center;
  gap: 16px 20px;
}
.banner-text-side { min-width: 0; }
.banner-badge {
  display: inline-block;
  background: rgba(168, 85, 247, 0.2);
  border: 1px solid #a855f7;
  color: #c084fc;
  font-size: 11px;
  font-weight: 700;
  padding: 4px 10px;
  border-radius: 20px;
  letter-spacing: 1px;
  margin-bottom: 8px;
}
.banner-title { color: #ffffff; font-size: 22px; font-weight: 800; margin: 0 0 6px 0; line-height: 1.3; }
.highlight-text { background: linear-gradient(90deg, #38bdf8, #a855f7); -webkit-background-clip: text; -webkit-text-fill-color: transparent; }
.banner-description { color: #94a3b8; font-size: 13px; margin: 0; max-width: 520px; line-height: 1.45; }
.science-side-link {
  display: inline-block;
  margin-top: 10px;
  font-size: 12px;
  font-weight: 700;
  color: #64748b;
  text-decoration: none;
  border-bottom: 1px dotted rgba(100, 116, 139, 0.6);
}
.science-side-link:hover { color: #94a3b8; }
.banner-coming-soon {
  position: relative;
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  gap: 8px;
  text-align: center;
  padding: 14px 16px;
  border-radius: 14px;
  border: 1px solid rgba(45, 212, 191, 0.45);
  background:
    linear-gradient(145deg, rgba(13, 148, 136, 0.28) 0%, rgba(30, 27, 75, 0.55) 55%, rgba(79, 70, 229, 0.25) 100%);
  box-shadow:
    0 0 0 1px rgba(255, 255, 255, 0.04) inset,
    0 8px 28px rgba(20, 184, 166, 0.18);
  overflow: hidden;
  animation: comingSoonFloat 3.6s ease-in-out infinite;
}
.coming-soon-pulse {
  position: absolute;
  inset: -40%;
  background: radial-gradient(circle at 50% 40%, rgba(45, 212, 191, 0.35) 0%, transparent 55%);
  animation: comingSoonPulse 2.8s ease-in-out infinite;
  pointer-events: none;
}
.coming-soon-badge {
  position: relative;
  z-index: 1;
  display: inline-flex;
  align-items: center;
  gap: 6px;
  font-size: 11px;
  font-weight: 900;
  letter-spacing: 0.16em;
  text-transform: uppercase;
  color: #99f6e4;
  background: rgba(15, 23, 42, 0.55);
  border: 1px solid rgba(45, 212, 191, 0.55);
  border-radius: 999px;
  padding: 4px 12px;
}
.coming-soon-badge::before {
  content: "";
  width: 7px;
  height: 7px;
  border-radius: 50%;
  background: #2dd4bf;
  box-shadow: 0 0 10px #2dd4bf;
  animation: comingSoonDot 1.4s ease-in-out infinite;
}
.coming-soon-main-title {
  position: relative;
  z-index: 1;
  font-size: 28px;
  font-weight: 950;
  letter-spacing: 0.15em;
  color: #fbbf24;
  text-shadow: 
    0 0 12px rgba(251, 191, 36, 0.8),
    0 0 24px rgba(217, 119, 6, 0.5);
  margin: 6px 0;
  text-transform: uppercase;
  animation: titlePulse 2.2s infinite ease-in-out;
}
.coming-soon-sub-topics {
  position: relative;
  z-index: 1;
  font-size: 10px;
  color: #94a3b8;
  font-family: monospace;
  margin: 0;
  opacity: 0.85;
  letter-spacing: 0.05em;
}
.coming-soon-tagline {
  position: relative;
  z-index: 1;
  margin: 0;
  font-size: 11px;
  font-weight: 700;
  line-height: 1.35;
  color: #a5f3fc;
  max-width: 220px;
}
.banner-action-side { position: relative; display: flex; align-items: center; justify-content: flex-end; }
.banner-cta-stack { display: flex; flex-direction: column; align-items: stretch; gap: 8px; width: min(100%, 280px); z-index: 2; }
.banner-btn {
  background: linear-gradient(90deg, #4f46e5, #7c3aed); color: #ffffff; border: none; padding: 12px 24px;
  font-size: 14px; font-weight: 700; border-radius: 8px; cursor: pointer; display: flex; align-items: center; justify-content: center; gap: 10px;
  box-shadow: 0 4px 15px rgba(124, 58, 237, 0.4); transition: all 0.3s ease;
}
.banner-btn:hover { transform: translateY(-2px); box-shadow: 0 6px 20px rgba(124, 58, 237, 0.6); background: linear-gradient(90deg, #5b52f9, #8b4cfc); }
.banner-btn-pathway {
  display: flex; flex-direction: column; align-items: flex-start; gap: 2px; text-decoration: none;
  padding: 10px 14px; border-radius: 8px; border: 1.5px solid rgba(34, 211, 238, 0.55);
  background: linear-gradient(135deg, rgba(8, 47, 73, 0.9), rgba(15, 23, 42, 0.95));
  color: #e0f2fe; box-shadow: 0 4px 18px rgba(34, 211, 238, 0.2); transition: all 0.25s ease;
}
.banner-btn-pathway span:first-child { font-size: 13px; font-weight: 800; letter-spacing: 0.02em; }
.banner-btn-pathway:hover { transform: translateY(-2px); border-color: #22d3ee; box-shadow: 0 6px 22px rgba(34, 211, 238, 0.35); }
.banner-btn-lexicon {
  display: flex; flex-direction: column; align-items: flex-start; gap: 2px; text-decoration: none;
  padding: 10px 14px; border-radius: 8px; border: 1.5px solid rgba(251, 191, 36, 0.55);
  background: linear-gradient(135deg, rgba(120, 53, 15, 0.75), rgba(15, 23, 42, 0.95));
  color: #fef3c7; box-shadow: 0 4px 18px rgba(245, 158, 11, 0.22); transition: all 0.25s ease; text-align: left;
}
.banner-btn-lexicon span:first-child { font-size: 13px; font-weight: 800; letter-spacing: 0.02em; color: #fbbf24; }
.banner-lexicon-sub { font-size: 11px; font-weight: 600; color: #fde68a; opacity: 0.9; line-height: 1.3; }
.banner-btn-lexicon:hover { transform: translateY(-2px); border-color: #fbbf24; box-shadow: 0 6px 22px rgba(245, 158, 11, 0.35); }
.btn-arrow { transition: transform 0.3s ease; }
.banner-btn:hover .btn-arrow { transform: translateX(4px); }
.floating-game-icons { position: absolute; top: -40px; left: -20px; width: 100%; height: 100%; pointer-events: none; }
.game-icon { position: absolute; font-size: 20px; opacity: 0.6; }
.game-icon-1 { top: -10px; right: 40px; animation: floatAnim 3s infinite ease-in-out; }
.game-icon-2 { bottom: -10px; left: 20px; animation: floatAnim 2.5s infinite ease-in-out 0.5s; }
.game-icon-3 { top: 20px; right: 180px; animation: floatAnim 3.5s infinite ease-in-out 1s; }
@keyframes pulseGlow { 0%, 100% { transform: scale(1); opacity: 0.4; } 50% { transform: scale(1.2); opacity: 0.6; } }
@keyframes floatAnim { 0%, 100% { transform: translateY(0) rotate(0deg); } 50% { transform: translateY(-8px) rotate(10deg); } }
@keyframes comingSoonFloat {
  0%, 100% { transform: translateY(0); }
  50% { transform: translateY(-4px); }
}
@keyframes comingSoonPulse {
  0%, 100% { opacity: 0.45; transform: scale(1); }
  50% { opacity: 0.85; transform: scale(1.08); }
}
@keyframes comingSoonDot {
  0%, 100% { opacity: 1; transform: scale(1); }
  50% { opacity: 0.45; transform: scale(0.75); }
}
@keyframes titlePulse {
  0%, 100% {
    transform: scale(1);
    text-shadow: 
      0 0 12px rgba(251, 191, 36, 0.8),
      0 0 24px rgba(217, 119, 6, 0.5);
  }
  50% {
    transform: scale(1.06);
    text-shadow: 
      0 0 18px rgba(251, 191, 36, 1.0),
      0 0 35px rgba(217, 119, 6, 0.7),
      0 0 50px rgba(251, 191, 36, 0.4);
  }
}
@media (max-width: 900px) {
  .banner-content {
    grid-template-columns: 1fr;
    justify-items: center;
    text-align: center;
  }
  .banner-text-side { display: flex; flex-direction: column; align-items: center; }
  .banner-description { max-width: 100%; }
  .banner-action-side { width: 100%; justify-content: center; }
  .banner-coming-soon { width: 100%; max-width: 360px; }
  .coming-soon-tagline { max-width: none; }
  .floating-game-icons { display: none; }
}
@media (max-width: 768px) {
  .gamified-banner-container { padding: 20px; text-align: center; }
  .banner-title { font-size: 19px; }
  .banner-description { font-size: 13px; }
}
`,
          }}
        />

        <div id="basla" className="mt-8 scroll-mt-28">
          <div className="flex items-center justify-between mb-3">
            <p className="text-[10px] font-bold uppercase tracking-[0.16em] text-slate-500">
              {t("home.step1")} · {t("home.step1Title")}
            </p>
            <span className="text-[11px] font-bold text-cyan-400 bg-cyan-950/40 border border-cyan-500/20 px-2 py-0.5 rounded-full">
              ⚡ İnteraktif Öğrenme Masası
            </span>
          </div>
          <TabbedNavigator />

          <div className="mt-10 grid gap-4 lg:grid-cols-2 lg:items-stretch">
            <div className="min-w-0 flex">
              <PathwayQuickGrid />
            </div>
            <div className="min-w-0 flex">
              <KpssQuickGrid />
            </div>
          </div>
        </div>
      </main>

      {/* Veli Başarı Karnesi Modalı */}
      <ParentReportModal
        isOpen={parentReportOpen}
        onClose={() => setParentReportOpen(false)}
        reportData={reportData}
      />
    </div>
  );
}
