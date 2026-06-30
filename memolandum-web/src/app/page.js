"use client";

import React, { useState, useEffect } from "react";
import TabbedNavigator from "../components/TabbedNavigator";
import Header from "../components/Header";
import dynamic from 'next/dynamic';

const GameEngineWrapper = dynamic(() => import('../engines/base'), { ssr: false });

export default function Home({ initialSlug = null }) {
  const [activeGameConfig, setActiveGameConfig] = useState(null);
  const [isLoaded, setIsLoaded] = useState(false);

  useEffect(() => {
    setIsLoaded(true);
  }, []);

  const handleStartGame = (config) => {
    setActiveGameConfig(config);
  };

  if (!isLoaded) return <div className="min-h-screen bg-dark-900 flex items-center justify-center">
    <div className="w-10 h-10 border-4 border-cyan-500 border-t-transparent rounded-full animate-spin"></div>
  </div>;

  return (
    <div className="min-h-screen bg-dark-900 text-gray-200 font-sans selection:bg-primary-500/30">
      
      {/* HEADER */}
      {!activeGameConfig && (
        <Header />
      )}

      {/* MAIN CONTENT */}
      <main className={`relative ${activeGameConfig ? '' : 'pt-4 pb-16 px-6'} max-w-6xl mx-auto min-h-screen flex flex-col justify-start`}>
        
        {activeGameConfig ? (
          <div className="animate-in fade-in zoom-in duration-500 h-screen w-full">
            <GameEngineWrapper 
              gameType={activeGameConfig.gameType}
              levelId={activeGameConfig.levelId}
              langId={activeGameConfig.langId}
              onExit={() => setActiveGameConfig(null)}
              onNextLevel={(nextLevelId) => {
                 setActiveGameConfig(prev => ({
                    ...prev,
                    levelId: nextLevelId
                 }));
              }}
            />
          </div>
        ) : (
          <>
            {/* Oyna-Ezberle & Subliminal Banner */}
            <a href="/about.html" className="block mb-4 no-underline group cursor-pointer hover:opacity-95 transition-opacity">
              <div className="gamified-banner-container">
                <div className="banner-glow-effect"></div>
                <div className="banner-content">
                  <div className="banner-text-side">
                    <span className="banner-badge">🚀 SUBLİMİNAL ÖĞRENMENİN GÜCÜNÜ KEŞFEDİN!!!</span>
                    <h2 className="banner-title">
                      Kelime Ezberlemek <span className="highlight-text">Artık Çok Eğlenceli!</span>
                    </h2>
                    <p className="banner-description">
                      Sıkıcı listeleri unutun. Oyun oynayarak, eğlenerek ve beyin potansiyelinizi zorlayarak yeni diller keşfedin.
                    </p>
                  </div>

                  <div className="banner-action-side">
                    <div className="floating-game-icons">
                      <span className="game-icon game-icon-1">🎮</span>
                      <span className="game-icon game-icon-2">⚡</span>
                      <span className="game-icon game-icon-3">🔥</span>
                    </div>
                    <button className="banner-btn">
                      <span>HEMEN OYNA VE KEŞFET</span>
                      <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="btn-arrow"><line x1="5" y1="12" x2="19" y2="12"></line><polyline points="12 5 19 12 12 19"></polyline></svg>
                    </button>
                  </div>
                </div>
              </div>
              <style dangerouslySetInnerHTML={{ __html: `
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
  display: flex;
  justify-content: space-between;
  align-items: center;
  flex-wrap: wrap;
  gap: 20px;
}
.banner-text-side { flex: 1; min-width: 280px; }
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
.banner-description { color: #94a3b8; font-size: 14px; margin: 0; max-width: 550px; line-height: 1.4; }
.banner-action-side { position: relative; display: flex; align-items: center; justify-content: flex-end; min-width: 220px; }
.banner-btn {
  background: linear-gradient(90deg, #4f46e5, #7c3aed); color: #ffffff; border: none; padding: 14px 28px;
  font-size: 14px; font-weight: 700; border-radius: 8px; cursor: pointer; display: flex; align-items: center; gap: 10px;
  box-shadow: 0 4px 15px rgba(124, 58, 237, 0.4); transition: all 0.3s ease;
}
.banner-btn:hover { transform: translateY(-2px); box-shadow: 0 6px 20px rgba(124, 58, 237, 0.6); background: linear-gradient(90deg, #5b52f9, #8b4cfc); }
.btn-arrow { transition: transform 0.3s ease; }
.banner-btn:hover .btn-arrow { transform: translateX(4px); }
.floating-game-icons { position: absolute; top: -40px; left: -20px; width: 100%; height: 100%; pointer-events: none; }
.game-icon { position: absolute; font-size: 20px; opacity: 0.6; }
.game-icon-1 { top: -10px; right: 40px; animation: floatAnim 3s infinite ease-in-out; }
.game-icon-2 { bottom: -10px; left: 20px; animation: floatAnim 2.5s infinite ease-in-out 0.5s; }
.game-icon-3 { top: 20px; right: 180px; animation: floatAnim 3.5s infinite ease-in-out 1s; }
@keyframes pulseGlow { 0%, 100% { transform: scale(1); opacity: 0.4; } 50% { transform: scale(1.2); opacity: 0.6; } }
@keyframes floatAnim { 0%, 100% { transform: translateY(0) rotate(0deg); } 50% { transform: translateY(-8px) rotate(10deg); } }
@media (max-width: 768px) {
  .gamified-banner-container { padding: 20px; text-align: center; }
  .banner-content { flex-direction: column; justify-content: center; }
  .banner-text-side { display: flex; flex-direction: column; align-items: center; }
  .banner-action-side { width: 100%; justify-content: center; margin-top: 10px; }
  .floating-game-icons { display: none; }
  .banner-title { font-size: 19px; }
  .banner-description { font-size: 13px; }
}
              `}} />
            </a>

            <TabbedNavigator 
              initialSlug={initialSlug} 
              onStartGame={handleStartGame} 
            />
          </>
        )}
      </main>

    </div>
  );
}
