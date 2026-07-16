"use client";

import React from 'react';
import { useMemolandumStore } from '../../../store/useMemolandumStore';

/**
 * GameHeader - Universal responsive HUD for all games
 * 
 * Usage:
 * <GameHeader>
 *   <GameHeader.Left>
 *     <GameHeader.Shields max={3} current={2} />
 *     <GameHeader.Stage value={1} max={10} />
 *   </GameHeader.Left>
 *   
 *   <GameHeader.Right>
 *     <GameHeader.Score value={1500} />
 *     <GameHeader.Gems value={100} />
 *     <GameHeader.Controls 
 *       isFxEnabled={isFxEnabled} 
 *       onFxToggle={onFxToggle}
 *       isAudioEnabled={isAudioEnabled}
 *       onAudioToggle={onAudioToggle}
 *       onPause={onPause}
 *     />
 *   </GameHeader.Right>
 * </GameHeader>
 */

export function GameHeader({ children }) {
  return (
    <div className="w-full max-w-[800px] mx-auto bg-gradient-to-b from-slate-900/95 to-slate-900/60 border-b border-white/10 pb-2 sm:px-4 sm:py-3 flex flex-row items-center justify-between shadow-lg rounded-b-lg sm:rounded-b-xl z-50 pointer-events-auto font-mono select-none overflow-hidden game-header-safe">
      {children}
    </div>
  );
}

GameHeader.Left = function GameHeaderLeft({ children }) {
  return (
    <div className="flex items-center gap-1 sm:gap-4 overflow-x-auto no-scrollbar min-w-0 max-w-[45%] sm:max-w-none">
      {children}
    </div>
  );
};

GameHeader.Right = function GameHeaderRight({ children }) {
  return (
    <div className="flex items-center gap-1 sm:gap-4 shrink-0">
      {children}
    </div>
  );
};

// --- PRESET CARDS ---

GameHeader.Shields = function GameHeaderShields({ max = 3, current = 0, customId = "hud-shields" }) {
  return (
    <div className="flex items-center gap-1 sm:gap-2 bg-slate-800/80 border border-white/10 rounded-lg px-1 py-0.5 sm:px-3 sm:py-1.5 shadow-[inset_0_0_8px_rgba(0,0,0,0.6)]">
      <span className="text-xs sm:text-xl drop-shadow-[0_0_8px_#38bdf8] animate-pulse">🛡️</span>
      <div className="flex flex-col">
        <span className="text-[8px] sm:text-[9px] text-slate-400 font-black tracking-wider hidden sm:block">SHIELD</span>
        <div id={customId} className="flex gap-0.5 sm:gap-1 mt-0 sm:mt-0.5">
          {Array.from({ length: max }).map((_, i) => (
            <div 
              key={i} 
              className={`shield-cell h-1.5 w-2.5 sm:h-2.5 sm:w-6 rounded-sm transition-all duration-300 ${
                i < current ? 'bg-cyan-400 shadow-[0_0_8px_#22d3ee]' : 'bg-slate-700/50'
              }`}
            ></div>
          ))}
        </div>
      </div>
    </div>
  );
};

GameHeader.Stage = function GameHeaderStage({ value, max, label = "STAGE", icon = "🚀", customIdValues = {} }) {
  return (
    <div className="flex items-center gap-1 sm:gap-2 bg-slate-800/80 border border-white/10 rounded-lg px-1 py-0.5 sm:px-3 sm:py-1.5 shadow-[inset_0_0_8px_rgba(0,0,0,0.6)]">
      <span className="text-xs sm:text-xl drop-shadow-[0_0_8px_rgba(255,255,255,0.5)]">{icon}</span>
      <div className="flex flex-col">
        <span id={customIdValues.labelId} className="text-[8px] sm:text-[9px] text-slate-400 font-black tracking-wider hidden sm:block">{label}</span>
        <span id={customIdValues.valueId} className="text-[10px] sm:text-base font-bold text-cyan-400 leading-none mt-0 sm:mt-0.5">
          {value !== undefined ? String(value).padStart(2, '0') : ''}{max && <span className="text-slate-500 text-[10px] sm:text-xs">/{max}</span>}
        </span>
      </div>
    </div>
  );
};

GameHeader.Score = function GameHeaderScore({ value, label = "SCORE", customIdValues = {} }) {
  return (
    <div className="flex flex-col items-end sm:items-center bg-slate-800/80 sm:bg-transparent border border-white/10 sm:border-none rounded-lg px-1 py-0.5 sm:p-0">
      <span id={customIdValues.labelId} className="text-[8px] sm:text-[9px] text-green-500 font-black tracking-widest hidden sm:block">{label}</span>
      <span id={customIdValues.valueId} className="text-xs sm:text-xl font-black text-green-400 drop-shadow-[0_0_8px_rgba(74,222,128,0.5)] leading-none mt-0 sm:mt-0.5">
        {value !== undefined ? value.toLocaleString() : '0'}
      </span>
    </div>
  );
};

GameHeader.Gems = function GameHeaderGems({ value, label = "GEMS", icon = "💎" }) {
  return (
    <div className="flex items-center gap-1 sm:gap-2 bg-slate-800/80 border border-white/10 rounded-lg px-1 py-0.5 sm:px-3 sm:py-1.5 shadow-[inset_0_0_8px_rgba(0,0,0,0.6)]">
      <span className="text-xs sm:text-lg">{icon}</span>
      <div className="flex flex-col">
        <span className="text-[8px] sm:text-[9px] text-slate-400 font-black tracking-wider hidden sm:block">{label}</span>
        <span className="text-[10px] sm:text-base font-bold text-sky-400 drop-shadow-[0_0_8px_rgba(56,189,248,0.5)] leading-none mt-0 sm:mt-0.5">
          {value || '0'}
        </span>
      </div>
    </div>
  );
};

GameHeader.TargetWord = function GameHeaderTargetWord({ value, label = "HEDEF" }) {
  return (
    <div className="flex items-center gap-1 sm:gap-2 bg-pink-900/40 border border-pink-500/50 rounded-lg px-1 py-0.5 sm:px-4 sm:py-1.5 shadow-[0_0_15px_rgba(236,72,153,0.2)] min-w-0 max-w-[85px] sm:max-w-none">
      <div className="flex flex-col items-center min-w-0 w-full">
        <span className="text-[8px] sm:text-[9px] text-pink-400 font-black tracking-wider hidden sm:block">{label}</span>
        <span className="text-[10px] sm:text-lg font-bold text-white drop-shadow-[0_0_5px_#fff] leading-none mt-0 sm:mt-0.5 truncate w-full text-center">
          {value}
        </span>
      </div>
    </div>
  );
};

GameHeader.Controls = function GameHeaderControls({ 
  isFxEnabled, onFxToggle, 
  isAudioEnabled, onAudioToggle, 
  onPause, pauseId = "hudPauseBtn"
}) {
  const { isChallengeMode, toggleChallengeMode } = useMemolandumStore();

  return (
    <div className="flex items-center gap-1 sm:gap-2">
      <button 
        className={`flex items-center justify-center w-6 h-6 sm:w-8 sm:h-8 rounded-lg border transition-all text-xs sm:text-base ${isChallengeMode ? 'bg-amber-600/30 border-amber-500/50 text-amber-400 shadow-[0_0_8px_rgba(245,158,11,0.5)]' : 'bg-slate-800 border-white/5 text-slate-500 hover:text-slate-300'}`}
        onClick={toggleChallengeMode}
        title="Challenge Mode"
      >
        ⚡
      </button>

      {onFxToggle && (
        <button 
          className={`flex items-center justify-center w-6 h-6 sm:w-8 sm:h-8 rounded-lg border transition-all ${isFxEnabled ? 'bg-slate-700 border-white/20 text-white' : 'bg-slate-800 border-white/5 text-slate-500'}`}
          onClick={onFxToggle}
          title="SFX"
        >
          <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="w-3.5 h-3.5 sm:w-4 sm:h-4"><path d="M9 18V5l12-2v13"></path><circle cx="6" cy="18" r="3"></circle><circle cx="18" cy="16" r="3"></circle></svg>
        </button>
      )}
      
      {onAudioToggle && (
        <button 
          className={`flex items-center justify-center w-6 h-6 sm:w-8 sm:h-8 rounded-lg border transition-all ${isAudioEnabled ? 'bg-slate-700 border-white/20 text-white' : 'bg-slate-800 border-white/5 text-slate-500'}`}
          onClick={onAudioToggle}
          title="Voice"
        >
          <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="w-3.5 h-3.5 sm:w-4 sm:h-4"><path d="M11 5L6 9H2v6h4l5 4V5z"></path><path d="M19.07 4.93a10 10 0 0 1 0 14.14M15.54 8.46a5 5 0 0 1 0 7.07"></path></svg>
        </button>
      )}

      {onPause && (
        <button 
          id={pauseId}
          className="flex items-center justify-center w-6 h-6 sm:w-8 sm:h-8 rounded-lg bg-slate-800 border border-white/10 text-slate-300 hover:bg-rose-500/20 hover:border-rose-500 hover:text-rose-400 hover:shadow-[0_0_10px_rgba(244,63,94,0.3)] transition-all ml-0.5 sm:ml-2"
          onClick={onPause}
          title="Pause"
        >
          <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="w-3.5 h-3.5 sm:w-4 sm:h-4"><line x1="18" y1="4" x2="18" y2="20"></line><line x1="6" y1="4" x2="6" y2="20"></line></svg>
        </button>
      )}
    </div>
  );
};
