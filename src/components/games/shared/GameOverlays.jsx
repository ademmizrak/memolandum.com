"use client";

import React, { useState, useEffect, useRef } from 'react';
import { useRouter } from 'next/navigation';
import { Volume2, Gamepad2, BookOpen, HelpCircle, Shield, Award, ArrowRight, Play, Home } from 'lucide-react';

const GAMES_LIST = [
  { id: 'shooter', name: 'Retro Shooter', label: 'SHOOTER', color: 'text-cyan-400 border-cyan-500/30 hover:border-cyan-400' },
  { id: 'breakout', name: 'Breakout DX-Ball', label: 'DX-BALL', color: 'text-pink-500 border-pink-500/30 hover:border-pink-500' },
  { id: 'highway', name: 'Highway Survivor', label: 'HIGHWAY', color: 'text-yellow-400 border-yellow-500/30 hover:border-yellow-400' },
  { id: 'invaders', name: 'Siberian Invaders', label: 'INVADERS', color: 'text-purple-500 border-purple-500/30 hover:border-purple-500' },
  { id: 'wordascent', name: 'The Word Ascent', label: 'ASCENT', color: 'text-emerald-500 border-emerald-500/30 hover:border-emerald-500' },
  { id: 'worddrop', name: 'Reverse Word Drop', label: 'TETRIS', color: 'text-rose-500 border-rose-500/30 hover:border-rose-500' },
  { id: 'quiz', name: 'Retro Quiz', label: 'QUIZ', color: 'text-amber-400 border-amber-500/30 hover:border-amber-400' }
];

// Helper to pronounce a word
const speakWord = (text, isAudioEnabled = true) => {
  if (!isAudioEnabled || typeof window === 'undefined' || !window.speechSynthesis) return;
  window.speechSynthesis.cancel();
  const utterance = new SpeechSynthesisUtterance(text);
  utterance.lang = 'en-US';
  window.speechSynthesis.speak(utterance);
};

// Zenginleştirilmiş Pause Ekranı
export const PauseScreen = ({ 
  onResume, 
  onRestart, 
  onMainMenu, 
  words = [], 
  levelId, 
  langId, 
  currentGameType,
  onMiniQuizCorrect,
  isAudioEnabled = true
}) => {
  const router = useRouter();
  const [activeTab, setActiveTab] = useState('controls'); // controls, dictionary, miniquiz
  
  // Mini quiz state
  const [quizQuestion, setQuizQuestion] = useState(null);
  const [selectedChoiceIdx, setSelectedChoiceIdx] = useState(null);
  const [isQuizAnswered, setIsQuizAnswered] = useState(false);
  const [quizCorrect, setQuizCorrect] = useState(false);
  const [miniQuizScore, setMiniQuizScore] = useState(0);

  // Initialize mini-quiz question
  useEffect(() => {
    if (words && words.length >= 4) {
      // Pick a random word
      const targetIndex = Math.floor(Math.random() * words.length);
      const targetWordObj = words[targetIndex];
      
      const isEnToTr = Math.random() > 0.5;
      const questionText = isEnToTr ? targetWordObj.english : targetWordObj.turkish;
      const correctAnswer = isEnToTr ? targetWordObj.turkish : targetWordObj.english;

      const otherWords = words.filter((_, idx) => idx !== targetIndex);
      const shuffledOthers = [...otherWords].sort(() => 0.5 - Math.random());
      const distractors = shuffledOthers.slice(0, 3).map(w => isEnToTr ? w.turkish : w.english);

      const choices = [correctAnswer, ...distractors]
        .map(val => ({ value: val, isCorrect: val === correctAnswer }))
        .sort(() => 0.5 - Math.random());

      setQuizQuestion({
        wordObj: targetWordObj,
        questionText,
        choices,
        correctAnswerIndex: choices.findIndex(c => c.isCorrect)
      });
    }
  }, [words]);

  const handleMiniQuizAnswer = (idx) => {
    if (isQuizAnswered) return;
    setIsQuizAnswered(true);
    setSelectedChoiceIdx(idx);
    const choice = quizQuestion.choices[idx];
    
    if (choice.isCorrect) {
      setQuizCorrect(true);
      setMiniQuizScore(50);
      speakWord(quizQuestion.wordObj.english, isAudioEnabled);
      // Trigger callback if defined
      if (onMiniQuizCorrect) onMiniQuizCorrect();
      
      // Simple web audio pop/coin sound
      try {
        const audioCtx = new (window.AudioContext || window.webkitAudioContext)();
        const osc = audioCtx.createOscillator();
        const gain = audioCtx.createGain();
        osc.connect(gain);
        gain.connect(audioCtx.destination);
        osc.type = 'sine';
        osc.frequency.setValueAtTime(587.33, audioCtx.currentTime); // D5
        osc.frequency.setValueAtTime(880.00, audioCtx.currentTime + 0.1); // A5
        gain.gain.setValueAtTime(0.08, audioCtx.currentTime);
        gain.gain.exponentialRampToValueAtTime(0.001, audioCtx.currentTime + 0.25);
        osc.start();
        osc.stop(audioCtx.currentTime + 0.25);
      } catch(e) {}
    } else {
      setQuizCorrect(false);
      // Simple web audio error sound
      try {
        const audioCtx = new (window.AudioContext || window.webkitAudioContext)();
        const osc = audioCtx.createOscillator();
        const gain = audioCtx.createGain();
        osc.connect(gain);
        gain.connect(audioCtx.destination);
        osc.type = 'sawtooth';
        osc.frequency.setValueAtTime(150, audioCtx.currentTime);
        gain.gain.setValueAtTime(0.08, audioCtx.currentTime);
        gain.gain.exponentialRampToValueAtTime(0.001, audioCtx.currentTime + 0.2);
        osc.start();
        osc.stop(audioCtx.currentTime + 0.2);
      } catch(e) {}
    }
  };

  const handleSwitchGame = (gameId) => {
    if (gameId === currentGameType) return;
    router.push(`/games/${gameId}`);
  };

  return (
    <div className="absolute inset-0 flex flex-col items-center justify-center bg-black/85 pointer-events-auto backdrop-blur-md z-50 p-4 overflow-y-auto">
      <div className="w-full max-w-md bg-slate-950/80 border border-cyan-500/20 rounded-3xl p-5 md:p-6 shadow-[0_0_40px_rgba(6,182,212,0.15)] flex flex-col max-h-[90vh]">
        
        {/* Neon Header */}
        <h2 className="text-2xl md:text-3xl text-cyan-400 font-black text-center tracking-widest mb-4 drop-shadow-[0_0_10px_cyan]">
          SYSTEM PAUSED
        </h2>

        {/* Tab Buttons */}
        <div className="flex bg-slate-900/80 border border-slate-800 rounded-xl p-1 mb-5">
          <button 
            onClick={() => setActiveTab('controls')}
            className={`flex-1 py-2 text-xs md:text-sm font-bold font-mono rounded-lg transition-all flex items-center justify-center gap-1.5 ${activeTab === 'controls' ? 'bg-cyan-500 text-slate-950 shadow-md' : 'text-gray-400 hover:text-white'}`}
          >
            <Gamepad2 className="w-4 h-4" /> KONTROL
          </button>
          <button 
            onClick={() => setActiveTab('dictionary')}
            className={`flex-1 py-2 text-xs md:text-sm font-bold font-mono rounded-lg transition-all flex items-center justify-center gap-1.5 ${activeTab === 'dictionary' ? 'bg-cyan-500 text-slate-950 shadow-md' : 'text-gray-400 hover:text-white'}`}
          >
            <BookOpen className="w-4 h-4" /> SÖZLÜK ({words?.length || 0})
          </button>
          {words && words.length >= 4 && (
            <button 
              onClick={() => setActiveTab('miniquiz')}
              className={`flex-1 py-2 text-xs md:text-sm font-bold font-mono rounded-lg transition-all flex items-center justify-center gap-1.5 ${activeTab === 'miniquiz' ? 'bg-cyan-500 text-slate-950 shadow-md animate-pulse' : 'text-gray-400 hover:text-white'}`}
            >
              <HelpCircle className="w-4 h-4" /> MİNİ QUIZ
            </button>
          )}
        </div>

        {/* Tab Contents */}
        <div className="flex-1 overflow-y-auto min-h-0 pr-1 custom-scrollbar mb-4">
          
          {/* TAB 1: Controls & Game Switcher */}
          {activeTab === 'controls' && (
            <div className="flex flex-col gap-5">
              {/* Primary Actions */}
              <div className="flex flex-col gap-2.5">
                <button 
                  onClick={onResume}
                  className="w-full py-3 bg-gradient-to-r from-cyan-500 to-blue-600 text-slate-950 font-black text-sm rounded-xl hover:opacity-95 hover:scale-[1.01] active:scale-95 transition-all shadow-[0_0_15px_rgba(6,182,212,0.3)] flex items-center justify-center gap-2"
                >
                  <Play className="w-4 h-4 fill-slate-950" /> DEVAM ET (P)
                </button>
                <button 
                  onClick={onRestart}
                  className="w-full py-3 bg-slate-900 border border-slate-700 text-cyan-400 font-black text-sm rounded-xl hover:bg-slate-800 transition-colors"
                >
                  YENİDEN BAŞLAT
                </button>
                <button 
                  onClick={onMainMenu}
                  className="w-full py-3 bg-slate-900 border border-slate-800 text-purple-400 hover:text-purple-300 font-bold text-sm rounded-xl hover:bg-slate-800/50 transition-colors flex items-center justify-center gap-2"
                >
                  <Home className="w-4 h-4" /> ANA PORTAL
                </button>
              </div>

              {/* Game Switcher */}
              <div className="border-t border-slate-800/80 pt-4">
                <h3 className="text-xs font-mono font-bold text-cyan-500/70 tracking-widest uppercase mb-3 text-center">
                  ARAYÜZ DEĞİŞTİR (GAME MODES)
                </h3>
                <div className="grid grid-cols-2 gap-2">
                  {GAMES_LIST.map((g) => {
                    const isCurrent = g.id === currentGameType;
                    return (
                      <button
                        key={g.id}
                        onClick={() => handleSwitchGame(g.id)}
                        disabled={isCurrent}
                        className={`p-2 border text-xs font-bold rounded-xl transition-all flex flex-col items-center justify-center text-center ${
                          isCurrent 
                            ? 'bg-cyan-950/20 border-cyan-500/50 text-cyan-400 cursor-default opacity-80' 
                            : `bg-slate-900/50 border-slate-800 hover:bg-slate-800 ${g.color}`
                        }`}
                      >
                        <span className="font-mono text-[9px] opacity-40 mb-0.5">{g.label}</span>
                        <span className="truncate max-w-[150px]">{g.name}</span>
                      </button>
                    );
                  })}
                </div>
              </div>
            </div>
          )}

          {/* TAB 2: Dictionary review */}
          {activeTab === 'dictionary' && (
            <div className="flex flex-col gap-2">
              <h3 className="text-xs font-mono text-cyan-500/70 tracking-widest uppercase mb-2 text-center">
                SEVİYE KELİME KARTI LİSTESİ
              </h3>
              {words && words.length > 0 ? (
                <div className="flex flex-col gap-2">
                  {words.map((w, idx) => (
                    <div 
                      key={idx}
                      className="p-3 bg-slate-900/60 border border-slate-800/80 rounded-xl flex items-center justify-between gap-3 hover:border-slate-700 transition-colors"
                    >
                      <div className="flex-1 min-w-0">
                        <div className="text-cyan-400 font-bold text-sm truncate">{w.english}</div>
                        <div className="text-gray-400 text-xs truncate mt-0.5">{w.turkish}</div>
                        {w.romanized && (
                          <div className="text-gray-500 text-[10px] font-mono mt-0.5">[{w.romanized}]</div>
                        )}
                      </div>
                      <button 
                        onClick={() => speakWord(w.english, isAudioEnabled)}
                        className="p-2 bg-slate-800 hover:bg-slate-700 text-cyan-400 rounded-lg hover:scale-105 active:scale-95 transition-all flex-shrink-0"
                        title="Telaffuzu Dinle"
                      >
                        <Volume2 className="w-4 h-4" />
                      </button>
                    </div>
                  ))}
                </div>
              ) : (
                <div className="text-center text-gray-500 py-8 font-mono text-sm">KELİME BULUNAMADI</div>
              )}
            </div>
          )}

          {/* TAB 3: Mini-Quiz bubble pop game */}
          {activeTab === 'miniquiz' && quizQuestion && (
            <div className="flex flex-col items-center gap-4 text-center">
              <div className="flex flex-col items-center gap-1.5">
                <span className="text-[10px] font-mono text-amber-500/70 tracking-widest uppercase">
                  PAUSE MINI-QUIZ
                </span>
                <p className="text-xs text-gray-400 px-4">
                  Kelimenin doğru karşılığını patlatarak kalkanını yenile veya ekstra puan kazan!
                </p>
              </div>

              {/* Target word display box */}
              <div className="w-full py-5 px-3 bg-slate-900/80 border border-amber-500/20 rounded-2xl shadow-[inset_0_0_15px_rgba(245,158,11,0.05)] relative overflow-hidden my-1">
                <span className="text-[9px] font-mono text-amber-500/30 absolute top-1 right-3 tracking-widest">TARGET</span>
                <div className="text-xl md:text-2xl font-black text-white leading-relaxed break-all">
                  {quizQuestion.questionText}
                </div>
                {quizQuestion.wordObj.romanized && quizQuestion.correctAnswerIndex !== -1 && (
                  <div className="text-xs font-mono text-cyan-400 mt-1">[{quizQuestion.wordObj.romanized}]</div>
                )}
              </div>

              {/* Choices list */}
              <div className="w-full flex flex-col gap-2.5">
                {quizQuestion.choices.map((choice, i) => {
                  let btnClass = 'bg-slate-900/60 border-slate-800 text-gray-300 hover:border-amber-500/40 hover:bg-slate-800';
                  
                  if (isQuizAnswered) {
                    if (choice.isCorrect) {
                      btnClass = 'bg-emerald-950/80 border-emerald-500 text-white shadow-[0_0_15px_rgba(16,185,129,0.3)] scale-[1.01]';
                    } else if (i === selectedChoiceIdx) {
                      btnClass = 'bg-rose-950/80 border-rose-500 text-white shadow-[0_0_15px_rgba(244,63,94,0.3)]';
                    } else {
                      btnClass = 'bg-slate-950/40 border-slate-900 text-gray-600 opacity-40 cursor-default';
                    }
                  }

                  return (
                    <button
                      key={i}
                      disabled={isQuizAnswered}
                      onClick={() => handleMiniQuizAnswer(i)}
                      className={`w-full py-3 px-4 border-2 rounded-xl text-left font-bold text-sm md:text-base transition-all flex items-center justify-between ${btnClass}`}
                    >
                      <span className="truncate pr-2">{choice.value}</span>
                      <span className="text-[10px] font-mono text-gray-500 bg-slate-950/30 px-1.5 py-0.5 rounded">
                        {i + 1}
                      </span>
                    </button>
                  );
                })}
              </div>

              {/* Result display */}
              {isQuizAnswered && (
                <div className="mt-2 animate-bounce w-full flex flex-col items-center">
                  {quizCorrect ? (
                    <div className="text-sm font-bold text-emerald-400 flex items-center gap-1.5 bg-emerald-950/30 border border-emerald-500/20 px-4 py-2 rounded-full">
                      <Shield className="w-4 h-4 fill-emerald-500" /> DOĞRU! +1 Kalkan / +50 Puan Eklendi
                    </div>
                  ) : (
                    <div className="text-sm font-bold text-rose-400 flex items-center gap-1.5 bg-rose-950/30 border border-rose-500/20 px-4 py-2 rounded-full">
                      YANLIŞ! Kalkan Kazanılamadı
                    </div>
                  )}
                  
                  <button 
                    onClick={onResume}
                    className="mt-4 px-6 py-2 bg-cyan-500 hover:bg-cyan-400 text-slate-950 font-bold text-xs rounded-lg transition-all shadow-md flex items-center gap-1"
                  >
                    DEVAM ET <ArrowRight className="w-3.5 h-3.5" />
                  </button>
                </div>
              )}
            </div>
          )}

        </div>
        
        {/* Footer label */}
        <div className="text-center text-[9px] font-mono text-slate-600 tracking-wider">
          MEMOLANDUM SECURE OVERLAY INTERFACE
        </div>
      </div>
    </div>
  );
};

// Zenginleştirilmiş Game Over Ekranı
export const GameOverScreen = ({ 
  score, 
  onRestart, 
  onMainMenu, 
  message = "SHIELDS DEPLETED",
  words = [],
  levelId,
  langId,
  currentGameType,
  isAudioEnabled = true,
  children 
}) => {
  const router = useRouter();
  const [activeTab, setActiveTab] = useState('controls'); // controls, dictionary

  const handleSwitchGame = (gameId) => {
    if (gameId === currentGameType) return;
    router.push(`/games/${gameId}`);
  };

  return (
    <div className="absolute inset-0 flex flex-col items-center justify-center bg-black/90 pointer-events-auto backdrop-blur-md z-50 p-4 overflow-y-auto">
      <div className="w-full max-w-md bg-slate-950/90 border border-red-500/20 rounded-3xl p-5 md:p-6 shadow-[0_0_40px_rgba(239,68,68,0.15)] flex flex-col max-h-[90vh]">
        
        {/* Header */}
        <h2 className="text-3xl font-black text-red-500 text-center tracking-widest mb-1.5 drop-shadow-[0_0_15px_#ef4444]">
          GAME OVER
        </h2>
        <div className="text-white/60 text-[10px] font-mono text-center mb-2 uppercase tracking-wide">
          {message}
        </div>
        <div className="text-lg font-mono text-cyan-300 text-center mb-4">
          SCORE: <span className="font-black text-white">{score}</span>
        </div>

        {/* Tab Buttons */}
        <div className="flex bg-slate-900/80 border border-slate-800 rounded-xl p-1 mb-5">
          <button 
            onClick={() => setActiveTab('controls')}
            className={`flex-1 py-2 text-xs md:text-sm font-bold font-mono rounded-lg transition-all flex items-center justify-center gap-1.5 ${activeTab === 'controls' ? 'bg-red-500 text-white shadow-md' : 'text-gray-400 hover:text-white'}`}
          >
            <Gamepad2 className="w-4 h-4" /> KONTROL
          </button>
          <button 
            onClick={() => setActiveTab('dictionary')}
            className={`flex-1 py-2 text-xs md:text-sm font-bold font-mono rounded-lg transition-all flex items-center justify-center gap-1.5 ${activeTab === 'dictionary' ? 'bg-red-500 text-white shadow-md' : 'text-gray-400 hover:text-white'}`}
          >
            <BookOpen className="w-4 h-4" /> KELİMELERİ İNCELE
          </button>
        </div>

        {/* Tab Contents */}
        <div className="flex-1 overflow-y-auto min-h-0 pr-1 custom-scrollbar mb-4">
          
          {/* TAB 1: Controls & Game Switcher */}
          {activeTab === 'controls' && (
            <div className="flex flex-col gap-5">
              {children && <div className="w-full bg-slate-900/30 p-2.5 rounded-xl border border-slate-800/50">{children}</div>}

              {/* Primary Actions */}
              <div className="flex flex-col gap-2.5">
                <button 
                  onClick={onRestart}
                  className="w-full py-3 bg-gradient-to-r from-red-500 to-pink-600 text-white font-black text-sm rounded-xl hover:opacity-95 hover:scale-[1.01] active:scale-95 transition-all shadow-[0_0_15px_rgba(239,68,68,0.3)]"
                >
                  TEKRAR DENE
                </button>
                <button 
                  onClick={onMainMenu}
                  className="w-full py-3 bg-slate-900 border border-slate-800 text-purple-400 hover:text-purple-300 font-bold text-sm rounded-xl hover:bg-slate-800/50 transition-colors flex items-center justify-center gap-2"
                >
                  <Home className="w-4 h-4" /> ANA PORTAL
                </button>
              </div>

              {/* Game Switcher */}
              <div className="border-t border-slate-800/80 pt-4">
                <h3 className="text-xs font-mono font-bold text-red-400/70 tracking-widest uppercase mb-3 text-center">
                  AYNI SEVİYEYİ BAŞKA OYUNLA DENE
                </h3>
                <div className="grid grid-cols-2 gap-2">
                  {GAMES_LIST.map((g) => {
                    const isCurrent = g.id === currentGameType;
                    return (
                      <button
                        key={g.id}
                        onClick={() => handleSwitchGame(g.id)}
                        disabled={isCurrent}
                        className={`p-2 border text-xs font-bold rounded-xl transition-all flex flex-col items-center justify-center text-center ${
                          isCurrent 
                            ? 'bg-red-950/20 border-red-500/50 text-red-400 cursor-default opacity-85' 
                            : `bg-slate-900/50 border-slate-800 hover:bg-slate-800 ${g.color}`
                        }`}
                      >
                        <span className="font-mono text-[9px] opacity-40 mb-0.5">{g.label}</span>
                        <span className="truncate max-w-[150px]">{g.name}</span>
                      </button>
                    );
                  })}
                </div>
              </div>
            </div>
          )}

          {/* TAB 2: Dictionary review */}
          {activeTab === 'dictionary' && (
            <div className="flex flex-col gap-2">
              <h3 className="text-xs font-mono text-cyan-500/70 tracking-widest uppercase mb-2 text-center">
                SEVİYE SÖZLÜĞÜ (KAYBETME SEBEPLERİ)
              </h3>
              {words && words.length > 0 ? (
                <div className="flex flex-col gap-2">
                  {words.map((w, idx) => (
                    <div 
                      key={idx}
                      className="p-3 bg-slate-900/60 border border-slate-800/80 rounded-xl flex items-center justify-between gap-3 hover:border-slate-700 transition-colors"
                    >
                      <div className="flex-1 min-w-0">
                        <div className="text-red-400 font-bold text-sm truncate">{w.english}</div>
                        <div className="text-gray-400 text-xs truncate mt-0.5">{w.turkish}</div>
                        {w.romanized && (
                          <div className="text-gray-500 text-[10px] font-mono mt-0.5">[{w.romanized}]</div>
                        )}
                      </div>
                      <button 
                        onClick={() => speakWord(w.english, isAudioEnabled)}
                        className="p-2 bg-slate-800 hover:bg-slate-700 text-red-400 rounded-lg hover:scale-105 active:scale-95 transition-all flex-shrink-0"
                        title="Telaffuzu Dinle"
                      >
                        <Volume2 className="w-4 h-4" />
                      </button>
                    </div>
                  ))}
                </div>
              ) : (
                <div className="text-center text-gray-500 py-8 font-mono text-sm">KELİME LİSTESİ ÇEKİLEMEDİ</div>
              )}
            </div>
          )}

        </div>

        {/* Footer label */}
        <div className="text-center text-[9px] font-mono text-slate-650 tracking-wider">
          MEMOLANDUM CRITICAL FAILURE SYSTEM
        </div>
      </div>
    </div>
  );
};

// Zenginleştirilmiş Victory Ekranı
export const VictoryScreen = ({ 
  score, 
  onNextLevel, 
  onMainMenu, 
  words = [],
  levelId,
  langId,
  currentGameType,
  children 
}) => {
  const router = useRouter();
  const [activeTab, setActiveTab] = useState('controls'); // controls, dictionary

  const handleSwitchGame = (gameId) => {
    if (gameId === currentGameType) return;
    router.push(`/games/${gameId}`);
  };

  return (
    <div className="absolute inset-0 flex flex-col items-center justify-center bg-black/90 pointer-events-auto backdrop-blur-md z-50 p-4 overflow-y-auto">
      <div className="w-full max-w-md bg-slate-950/90 border border-green-500/20 rounded-3xl p-5 md:p-6 shadow-[0_0_40px_rgba(34,197,94,0.15)] flex flex-col max-h-[90vh]">
        
        {/* Header */}
        <h2 className="text-3xl font-black text-green-400 text-center tracking-widest mb-1.5 drop-shadow-[0_0_15px_#22c55e]">
          SECTOR CLEARED
        </h2>
        <div className="text-lg font-mono text-cyan-350 text-center mb-4">
          SCORE: <span className="font-black text-white">{score}</span>
        </div>

        {/* Tab Buttons */}
        <div className="flex bg-slate-900/80 border border-slate-800 rounded-xl p-1 mb-5">
          <button 
            onClick={() => setActiveTab('controls')}
            className={`flex-1 py-2 text-xs md:text-sm font-bold font-mono rounded-lg transition-all flex items-center justify-center gap-1.5 ${activeTab === 'controls' ? 'bg-green-500 text-slate-950 shadow-md' : 'text-gray-400 hover:text-white'}`}
          >
            <Gamepad2 className="w-4 h-4" /> BİLGİ & SEÇENEK
          </button>
          <button 
            onClick={() => setActiveTab('dictionary')}
            className={`flex-1 py-2 text-xs md:text-sm font-bold font-mono rounded-lg transition-all flex items-center justify-center gap-1.5 ${activeTab === 'dictionary' ? 'bg-green-500 text-slate-950 shadow-md' : 'text-gray-400 hover:text-white'}`}
          >
            <BookOpen className="w-4 h-4" /> KELİMELER ({words?.length || 0})
          </button>
        </div>

        {/* Tab Contents */}
        <div className="flex-1 overflow-y-auto min-h-0 pr-1 custom-scrollbar mb-4">
          
          {/* TAB 1: Controls & Game Switcher */}
          {activeTab === 'controls' && (
            <div className="flex flex-col gap-5">
              {children && <div className="w-full">{children}</div>}

              {/* Primary Actions */}
              <div className="flex flex-col gap-2.5">
                {onNextLevel && (
                  <button 
                    onClick={onNextLevel}
                    className="w-full py-3 bg-gradient-to-r from-green-500 to-emerald-600 text-slate-950 font-black text-sm rounded-xl hover:opacity-95 hover:scale-[1.01] active:scale-95 transition-all shadow-[0_0_15px_rgba(34,197,94,0.3)]"
                  >
                    SONRAKİ SEKTÖR (LEVEL)
                  </button>
                )}
                <button 
                  onClick={onMainMenu}
                  className="w-full py-3 bg-slate-900 border border-slate-800 text-purple-400 hover:text-purple-300 font-bold text-sm rounded-xl hover:bg-slate-800/50 transition-colors flex items-center justify-center gap-2"
                >
                  <Home className="w-4 h-4" /> ANA PORTAL
                </button>
              </div>

              {/* Game Switcher */}
              <div className="border-t border-slate-800/80 pt-4">
                <h3 className="text-xs font-mono font-bold text-green-400/70 tracking-widest uppercase mb-3 text-center">
                  BU SEVİYEYİ BAŞKA MOTORLA DENE
                </h3>
                <div className="grid grid-cols-2 gap-2">
                  {GAMES_LIST.map((g) => {
                    const isCurrent = g.id === currentGameType;
                    return (
                      <button
                        key={g.id}
                        onClick={() => handleSwitchGame(g.id)}
                        disabled={isCurrent}
                        className={`p-2 border text-xs font-bold rounded-xl transition-all flex flex-col items-center justify-center text-center ${
                          isCurrent 
                            ? 'bg-green-950/20 border-green-500/50 text-green-400 cursor-default opacity-85' 
                            : `bg-slate-900/50 border-slate-800 hover:bg-slate-800 ${g.color}`
                        }`}
                      >
                        <span className="font-mono text-[9px] opacity-40 mb-0.5">{g.label}</span>
                        <span className="truncate max-w-[150px]">{g.name}</span>
                      </button>
                    );
                  })}
                </div>
              </div>
            </div>
          )}

          {/* TAB 2: Dictionary review */}
          {activeTab === 'dictionary' && (
            <div className="flex flex-col gap-2">
              <h3 className="text-xs font-mono text-cyan-500/70 tracking-widest uppercase mb-2 text-center">
                SEKTÖRDE USTALAŞILAN KELİMELER
              </h3>
              {words && words.length > 0 ? (
                <div className="flex flex-col gap-2">
                  {words.map((w, idx) => (
                    <div 
                      key={idx}
                      className="p-3 bg-slate-900/60 border border-slate-800/80 rounded-xl flex items-center justify-between gap-3 hover:border-slate-700 transition-colors"
                    >
                      <div className="flex-1 min-w-0">
                        <div className="text-green-400 font-bold text-sm truncate">{w.english}</div>
                        <div className="text-gray-400 text-xs truncate mt-0.5">{w.turkish}</div>
                        {w.romanized && (
                          <div className="text-gray-500 text-[10px] font-mono mt-0.5">[{w.romanized}]</div>
                        )}
                      </div>
                      <button 
                        onClick={() => speakWord(w.english, true)}
                        className="p-2 bg-slate-800 hover:bg-slate-700 text-green-400 rounded-lg hover:scale-105 active:scale-95 transition-all flex-shrink-0"
                        title="Telaffuzu Dinle"
                      >
                        <Volume2 className="w-4 h-4" />
                      </button>
                    </div>
                  ))}
                </div>
              ) : (
                <div className="text-center text-gray-500 py-8 font-mono text-sm">KELİME BİLGİSİ BULUNAMADI</div>
              )}
            </div>
          )}

        </div>

        {/* Footer label */}
        <div className="text-center text-[9px] font-mono text-slate-650 tracking-wider">
          MEMOLANDUM VICTORY ANALYSERS ACTIVE
        </div>
      </div>
    </div>
  );
};
