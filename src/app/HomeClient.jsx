"use client";

import React, { useEffect } from "react";
import Link from "next/link";
import TabbedNavigator from "../components/TabbedNavigator";
import Header from "../components/Header";
import PathwayQuickGrid from "../components/home/PathwayQuickGrid";
import KpssQuickGrid from "../components/home/KpssQuickGrid";
import { useT } from "../lib/i18n/LocaleProvider";

export default function HomeClient() {
  const t = useT();

  useEffect(() => {
    if (typeof window === "undefined") return;
    const hash = window.location.hash;
    if (hash === "#basla" || hash === "#kpss") {
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

      <main className="relative pt-4 pb-16 px-6 max-w-6xl mx-auto min-h-screen flex flex-col justify-start">
        <div className="block mb-4">
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

              <Link
                href="/#kpss"
                className="banner-coming-soon cursor-pointer hover:scale-[1.02] transition-all duration-300"
                aria-label={t("home.kpssAria")}
                onClick={(e) => {
                  if (typeof window === "undefined") return;
                  if (window.location.pathname === "/" || window.location.pathname === "") {
                    e.preventDefault();
                    document.getElementById("kpss")?.scrollIntoView({
                      behavior: "smooth",
                      block: "start",
                    });
                  }
                }}
              >
                <span className="coming-soon-pulse" aria-hidden />
                <span className="coming-soon-badge !border-amber-400/60 !text-amber-200">
                  {t("home.kpssLiveBadge")}
                </span>
                <div className="coming-soon-main-title">{t("home.topicExam")}</div>
                <p className="coming-soon-sub-topics">{t("home.bannerSubTopics")}</p>
                <p className="coming-soon-tagline">{t("home.kpssTagline")}</p>
              </Link>

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
                  <Link href="/my-lexicon/" className="banner-btn-lexicon">
                    <span>{t("home.myLexiconCta")}</span>
                    <span className="banner-lexicon-sub">{t("home.myLexiconHint")}</span>
                  </Link>
                </div>
              </div>
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
  font-size: 32px;
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
  font-size: 12px;
  font-weight: 700;
  line-height: 1.35;
  color: #a5f3fc;
  max-width: 200px;
}
.banner-action-side { position: relative; display: flex; align-items: center; justify-content: flex-end; }
.banner-cta-stack { display: flex; flex-direction: column; align-items: stretch; gap: 10px; width: min(100%, 280px); z-index: 2; }
.banner-btn {
  background: linear-gradient(90deg, #4f46e5, #7c3aed); color: #ffffff; border: none; padding: 14px 28px;
  font-size: 14px; font-weight: 700; border-radius: 8px; cursor: pointer; display: flex; align-items: center; justify-content: center; gap: 10px;
  box-shadow: 0 4px 15px rgba(124, 58, 237, 0.4); transition: all 0.3s ease;
}
.banner-btn:hover { transform: translateY(-2px); box-shadow: 0 6px 20px rgba(124, 58, 237, 0.6); background: linear-gradient(90deg, #5b52f9, #8b4cfc); }
.banner-btn-pathway {
  display: flex; flex-direction: column; align-items: flex-start; gap: 2px; text-decoration: none;
  padding: 12px 16px; border-radius: 8px; border: 1.5px solid rgba(34, 211, 238, 0.55);
  background: linear-gradient(135deg, rgba(8, 47, 73, 0.9), rgba(15, 23, 42, 0.95));
  color: #e0f2fe; box-shadow: 0 4px 18px rgba(34, 211, 238, 0.2); transition: all 0.25s ease;
}
.banner-btn-pathway span:first-child { font-size: 13px; font-weight: 800; letter-spacing: 0.02em; }
.banner-btn-pathway:hover { transform: translateY(-2px); border-color: #22d3ee; box-shadow: 0 6px 22px rgba(34, 211, 238, 0.35); }
.banner-btn-lexicon {
  display: flex; flex-direction: column; align-items: flex-start; gap: 2px; text-decoration: none;
  padding: 12px 16px; border-radius: 8px; border: 1.5px solid rgba(163, 230, 53, 0.55);
  background: linear-gradient(135deg, rgba(20, 83, 45, 0.85), rgba(15, 23, 42, 0.95));
  color: #ecfccb; box-shadow: 0 4px 18px rgba(132, 204, 22, 0.22); transition: all 0.25s ease;
}
.banner-btn-lexicon span:first-child { font-size: 13px; font-weight: 800; letter-spacing: 0.02em; }
.banner-lexicon-sub { font-size: 11px; font-weight: 600; color: #a3e635; opacity: 0.9; line-height: 1.3; }
.banner-btn-lexicon:hover { transform: translateY(-2px); border-color: #a3e635; box-shadow: 0 6px 22px rgba(163, 230, 53, 0.35); }
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

        <div id="basla" className="mt-16 scroll-mt-28">
          <p className="mb-3 text-[10px] font-bold uppercase tracking-[0.16em] text-slate-500">
            {t("home.step1")} · {t("home.step1Title")}
          </p>
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
    </div>
  );
}
