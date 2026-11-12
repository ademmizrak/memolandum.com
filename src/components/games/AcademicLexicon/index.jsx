"use client";

import React, { useState, useEffect, useCallback, useMemo, useRef } from 'react';
import { useLessonLoader } from '../../../hooks/useLessonLoader';
import { useMemolandumStore } from '../../../store/useMemolandumStore';
import { createSessionProgressTracker } from '../../../lib/progress/applySessionProgress';
import SkeletonLoader from '../../SkeletonLoader';

// Helper to play retro sound frequencies using Web Audio API (offline & native)
const playBeepSound = (type) => {
  try {
    const ctx = new (window.AudioContext || window.webkitAudioContext)();
    const osc = ctx.createOscillator();
    const gain = ctx.createGain();
    osc.connect(gain);
    gain.connect(ctx.destination);

    if (type === 'success') {
      // High pitch double-beep
      osc.type = 'sine';
      osc.frequency.setValueAtTime(523.25, ctx.currentTime); // C5
      osc.frequency.setValueAtTime(659.25, ctx.currentTime + 0.1); // E5
      gain.gain.setValueAtTime(0.08, ctx.currentTime);
      gain.gain.exponentialRampToValueAtTime(0.01, ctx.currentTime + 0.25);
      osc.start();
      osc.stop(ctx.currentTime + 0.25);
    } else if (type === 'error') {
      // Low pitch buzzer
      osc.type = 'sawtooth';
      osc.frequency.setValueAtTime(120, ctx.currentTime);
      gain.gain.setValueAtTime(0.12, ctx.currentTime);
      gain.gain.exponentialRampToValueAtTime(0.01, ctx.currentTime + 0.35);
      osc.start();
      osc.stop(ctx.currentTime + 0.35);
    }
  } catch (e) {
    console.warn("AudioContext failed:", e);
  }
};

export default function AcademicLexicon({ levelId, langId, onExit, onNextLevel }) {
  const { words, isLoading, reload } = useLessonLoader(levelId, langId);
  const [currentIndex, setCurrentIndex] = useState(0);
  const [isFlipped, setIsFlipped] = useState(false);
  const [shake, setShake] = useState(false);
  const [selectedOption, setSelectedOption] = useState(null);
  const [isRevealed, setIsRevealed] = useState(false);
  const [masteredCount, setMasteredCount] = useState(0);
  const [completed, setCompleted] = useState(false);
  const [score, setScore] = useState(0);
  const progressTrackerRef = useRef(createSessionProgressTracker('lexicon'));

  const currentWord = useMemo(() => words[currentIndex] || null, [words, currentIndex]);

  // Generate 4 multiple-choice options (1 correct, 3 distractor definitions)
  const options = useMemo(() => {
    if (!currentWord || words.length === 0) return [];
    
    // Correct answer is the short definition (turkish field)
    const correctAns = currentWord.turkish;
    
    // Grab all other definitions in the current deck as distractors
    const pool = words
      .filter(w => w.id !== currentWord.id)
      .map(w => w.turkish);
    
    // Shuffle pool and select up to 3 distractors
    const distractors = [...pool].sort(() => 0.5 - Math.random()).slice(0, 3);
    
    // If we don't have enough distractors, fill with default placeholders
    while (distractors.length < 3) {
      distractors.push("Konu dışı akademik terim tanımı.");
    }
    
    // Combine correct answer and distractors, then shuffle
    return [correctAns, ...distractors].sort(() => 0.5 - Math.random());
  }, [currentWord, words]);

  // Handle option click
  const handleOptionSelect = (option) => {
    if (isRevealed) return; // Prevent multiple clicks on the same question
    
    setSelectedOption(option);
    setIsRevealed(true);
    
    if (option === currentWord.turkish) {
      // Correct!
      playBeepSound('success');
      setMasteredCount(prev => prev + 1);
      setScore(prev => prev + 10);
      setIsFlipped(true); // Flip card to reveal detail explanation content

      // Record result to vocabulary vault
      const { recordWordQuizResult } = useMemolandumStore.getState();
      recordWordQuizResult(currentWord, true, 8, { language: langId });
    } else {
      // Wrong!
      playBeepSound('error');
      setShake(true);
      setTimeout(() => setShake(false), 500);

      // Record incorrect result to vault
      const { recordWordQuizResult } = useMemolandumStore.getState();
      recordWordQuizResult(currentWord, false, 8, { language: langId });
    }
  };

  // Move to next word
  const handleNext = () => {
    if (currentIndex + 1 < words.length) {
      setCurrentIndex(prev => prev + 1);
      setIsFlipped(false);
      setSelectedOption(null);
      setIsRevealed(false);
    } else {
      // Completed the deck
      setCompleted(true);
      progressTrackerRef.current.commit({ score: score, gems: Math.floor(score / 5) });
    }
  };

  // Restart deck
  const handleRestart = () => {
    setCurrentIndex(0);
    setIsFlipped(false);
    setSelectedOption(null);
    setIsRevealed(false);
    setMasteredCount(0);
    setScore(0);
    setCompleted(false);
    reload?.();
  };

  if (isLoading || words.length === 0) {
    return <SkeletonLoader gameType="lexicon" />;
  }

  if (completed) {
    return (
      <div className="absolute inset-0 flex flex-col items-center justify-center p-6 bg-slate-950 font-sans text-gray-200 select-none z-40">
        <div className="w-full max-w-md bg-white/[0.03] border border-white/10 rounded-3xl p-8 backdrop-blur-xl text-center shadow-2xl relative overflow-hidden">
          <div className="absolute top-0 right-0 w-32 h-32 bg-lime-500/10 blur-[50px] pointer-events-none rounded-full" />
          
          <h2 className="text-3xl font-black text-lime-400 uppercase tracking-widest mb-2">
            Deste Tamamlandı!
          </h2>
          <p className="text-slate-400 text-sm mb-6 leading-relaxed">
            Bu kategorideki tüm akademik kelime kartlarını başarıyla inceledin ve testleri cevapladın.
          </p>

          <div className="flex flex-col gap-4 bg-slate-900/50 p-6 rounded-2xl border border-white/5 mb-8">
            <div className="flex justify-between items-center text-sm">
              <span className="text-slate-500 font-bold">Toplam Kart:</span>
              <span className="text-slate-200 font-black">{words.length}</span>
            </div>
            <div className="flex justify-between items-center text-sm">
              <span className="text-slate-500 font-bold">Doğru Cevap:</span>
              <span className="text-lime-400 font-black">{masteredCount} / {words.length}</span>
            </div>
            <div className="flex justify-between items-center text-sm border-t border-white/5 pt-3">
              <span className="text-slate-400 font-extrabold">Kazanılan Skor:</span>
              <span className="text-cyan-400 font-black">+{score} XP</span>
            </div>
          </div>

          <div className="flex flex-col gap-3">
            <button
              onClick={handleRestart}
              className="w-full py-4 bg-lime-500 hover:bg-lime-400 text-slate-950 font-black rounded-2xl text-xs uppercase tracking-widest hover:scale-105 active:scale-95 transition-all shadow-lg shadow-lime-500/10 cursor-pointer"
            >
              Yeniden Başlat
            </button>
            <button
              onClick={() => onExit ? onExit() : window.history.back()}
              className="w-full py-4 bg-white/5 border border-white/10 text-white font-extrabold rounded-2xl text-xs uppercase tracking-widest hover:bg-white/10 transition-colors cursor-pointer"
            >
              Sözlüğe Dön
            </button>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="absolute inset-0 bg-slate-950 font-sans text-gray-200 flex flex-col justify-between p-6 select-none z-40 overflow-y-auto">
      <style>{`
        .card-perspective {
          perspective: 1000px;
        }
        .card-inner {
          transition: transform 0.6s cubic-bezier(0.4, 0, 0.2, 1);
          transform-style: preserve-3d;
        }
        .card-flipped {
          transform: rotateY(180deg);
        }
        .card-face {
          backface-visibility: hidden;
        }
        .card-back {
          transform: rotateY(180deg);
        }
        .animate-shake {
          animation: shakeEffect 0.5s ease-in-out;
        }
        @keyframes shakeEffect {
          0%, 100% { transform: translateX(0); }
          20%, 60% { transform: translateX(-8px); }
          40%, 80% { transform: translateX(8px); }
        }
      `}</style>

      {/* Header Bar */}
      <div className="flex items-center justify-between w-full border-b border-white/5 pb-4">
        <button
          onClick={() => onExit ? onExit() : window.history.back()}
          className="text-xs font-extrabold text-slate-400 hover:text-white transition-colors"
        >
          ✕ ÇIKIŞ
        </button>
        <div className="text-xs font-black tracking-widest text-slate-400 bg-white/5 px-3 py-1.5 rounded-full border border-white/5">
          KAVRAM: {currentIndex + 1} / {words.length}
        </div>
        <div className="text-xs font-black text-cyan-400">
          ⚡ {score} XP
        </div>
      </div>

      {/* Main Flashcard Container */}
      <div className={`flex-1 flex items-center justify-center py-6 card-perspective ${shake ? 'animate-shake' : ''}`}>
        <div 
          onClick={() => setIsFlipped(!isFlipped)}
          className={`w-full max-w-sm h-60 relative cursor-pointer card-inner ${isFlipped ? 'card-flipped' : ''}`}
        >
          {/* Card Front */}
          <div className="absolute inset-0 w-full h-full card-face bg-gradient-to-b from-slate-900/60 to-slate-950 border border-white/10 rounded-3xl p-6 flex flex-col justify-between items-center shadow-xl">
            <div className="w-full flex justify-between text-[10px] font-black text-slate-500 tracking-wider">
              <span>AKADEMİK DESTE</span>
              <span>TÜRKÇE ANLAMI</span>
            </div>
            
            <div className="text-center">
              <h1 dir="auto" className="text-3xl font-black tracking-tight text-white mb-2 uppercase">
                {currentWord.english}
              </h1>
              {currentWord.romanized && (
                <div className="text-xs text-lime-400 font-extrabold">
                  {currentWord.romanized}
                </div>
              )}
            </div>

            <div className="text-[10px] text-slate-500 font-bold uppercase tracking-widest">
              Kartı Çevir veya Tanımı Seç ➔
            </div>
          </div>

          {/* Card Back */}
          <div className="absolute inset-0 w-full h-full card-face card-back bg-gradient-to-b from-slate-900 to-slate-950 border border-lime-500/20 rounded-3xl p-6 flex flex-col justify-between shadow-2xl relative overflow-hidden">
            <div className="absolute top-0 right-0 w-24 h-24 bg-lime-500/5 blur-[25px] pointer-events-none rounded-full" />
            <div className="w-full flex justify-between text-[10px] font-black text-lime-500/70 tracking-wider">
              <span>BİLGİ PANELİ</span>
              <span>DETAYLI AÇIKLAMA</span>
            </div>

            <div className="flex-1 flex flex-col justify-center my-2 overflow-y-auto pr-1">
              <h2 className="text-lg font-black text-white uppercase mb-2">
                {currentWord.english}
              </h2>
              <p className="text-xs md:text-sm font-medium text-slate-300 leading-relaxed text-justify mb-2">
                {currentWord.content || "Bu akademik kavramın henüz detaylı bir makale açıklaması bulunmuyor."}
              </p>
            </div>

            <div className="text-[10px] text-slate-500 font-bold text-center uppercase tracking-widest pt-2 border-t border-white/5">
              Kartı Çevir ➔
            </div>
          </div>
        </div>
      </div>

      {/* Multiple-Choice Options Panel */}
      <div className="w-full max-w-xl mx-auto flex flex-col gap-4 border-t border-white/5 pt-6">
        <h3 className="text-center text-xs font-black text-slate-400 uppercase tracking-widest mb-1">
          Bu Kavramın Doğru Tanımı Hangisidir?
        </h3>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
          {options.map((option, idx) => {
            let btnClass = "border border-white/10 bg-white/[0.02] hover:bg-white/[0.05] text-slate-200";
            
            if (isRevealed) {
              if (option === currentWord.turkish) {
                // Correct option (turns green always when revealed)
                btnClass = "border-lime-500/30 bg-lime-500/10 text-lime-400 font-bold shadow-lg shadow-lime-500/5";
              } else if (selectedOption === option) {
                // Selected option was incorrect (turns red)
                btnClass = "border-red-500/30 bg-red-500/10 text-red-400 font-bold";
              } else {
                // Other options are dimmed
                btnClass = "border-white/5 bg-white/[0.01] text-slate-500 opacity-60";
              }
            }

            return (
              <button
                key={idx}
                dir="auto"
                disabled={isRevealed}
                onClick={() => handleOptionSelect(option)}
                className={`w-full py-4 px-5 rounded-2xl text-xs text-start leading-relaxed transition-all cursor-pointer flex items-center justify-between ${btnClass}`}
              >
                <span>{option}</span>
                {isRevealed && option === currentWord.turkish && (
                  <span className="text-lime-400 font-extrabold text-[10px] bg-lime-500/20 px-2 py-0.5 rounded-md shrink-0 ms-2">✓ DOĞRU</span>
                )}
                {isRevealed && selectedOption === option && option !== currentWord.turkish && (
                  <span className="text-red-400 font-extrabold text-[10px] bg-red-500/20 px-2 py-0.5 rounded-md shrink-0 ms-2">✕ YANLIŞ</span>
                )}
              </button>
            );
          })}
        </div>

        {/* Navigation Action */}
        <div className="flex justify-center mt-3 h-12">
          {isRevealed && (
            <button
              onClick={handleNext}
              className="px-10 py-3.5 bg-gradient-to-r from-lime-500 to-emerald-400 hover:from-lime-400 hover:to-emerald-300 text-slate-950 font-black rounded-2xl text-xs uppercase tracking-widest hover:scale-105 active:scale-95 transition-all shadow-lg shadow-lime-500/10 cursor-pointer animate-pulse"
            >
              {currentIndex + 1 === words.length ? "Değerlendirmeyi Bitir ➔" : "Sonraki Kavram ➔"}
            </button>
          )}
        </div>
      </div>
    </div>
  );
}
