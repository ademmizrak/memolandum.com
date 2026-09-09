"use client";

import React, { useState, useRef, useMemo } from "react";
import {
  X,
  BookOpen,
  Sparkles,
  Volume2,
  CheckCircle2,
  AlertTriangle,
  RotateCcw,
  Award,
  Zap,
  ArrowRight,
  TrendingUp,
} from "lucide-react";
import { useMemolandumStore } from "../../store/useMemolandumStore";
import { getWeakWords, calculateReinforcedWord } from "../../lib/learning/weakWordsService";

export default function WeakWordsModal({ isOpen, onClose }) {
  const vocabularyVault = useMemolandumStore((s) => s.vocabularyVault) || {};
  const quizHistory = useMemolandumStore((s) => s.quizHistory) || [];
  const setVocabularyVault = useMemolandumStore((s) => s.setVocabularyVault);
  const addLocalProgress = useMemolandumStore((s) => s.addLocalProgress);
  const logParentActivity = useMemolandumStore((s) => s.logParentActivity);

  const [mode, setMode] = useState("list"); // 'list' | 'workout' | 'completed'
  const [currentIdx, setCurrentIdx] = useState(0);
  const [isFlipped, setIsFlipped] = useState(false);
  const [workoutResults, setWorkoutResults] = useState({ mastered: 0, struggling: 0 });
  const audioRef = useRef(null);

  // Zayıf kelimeleri çek
  const weakWords = useMemo(() => {
    return getWeakWords(vocabularyVault, quizHistory, { limit: 40 });
  }, [vocabularyVault, quizHistory]);

  if (!isOpen) return null;

  const currentWord = weakWords[currentIdx] || null;

  // Ses çalma
  const playAudio = (url) => {
    if (!url) {
      if (typeof window !== "undefined" && "speechSynthesis" in window && currentWord?.english) {
        const u = new SpeechSynthesisUtterance(currentWord.english);
        u.lang = "en-US";
        u.rate = 0.85;
        window.speechSynthesis.speak(u);
      }
      return;
    }
    if (audioRef.current) {
      audioRef.current.src = url;
      audioRef.current.play().catch(() => {});
    }
  };

  const handleStartWorkout = () => {
    setMode("workout");
    setCurrentIdx(0);
    setIsFlipped(false);
    setWorkoutResults({ mastered: 0, struggling: 0 });
  };

  const handleRateWorkoutWord = (wasKnown) => {
    if (!currentWord) return;

    // Kelimeyi hafızada güçlendir
    const updated = calculateReinforcedWord(currentWord, wasKnown);
    const newVault = {
      ...vocabularyVault,
      [currentWord.id]: updated,
    };
    setVocabularyVault(newVault);

    if (wasKnown) {
      // Skor & XP ödülü ver
      addLocalProgress("flashcards", { score: 50, xp: 15, gems: 1 });
      setWorkoutResults((prev) => ({ ...prev, mastered: prev.mastered + 1 }));
    } else {
      setWorkoutResults((prev) => ({ ...prev, struggling: prev.struggling + 1 }));
    }

    if (currentIdx + 1 >= weakWords.length) {
      // Alıştırma bitti
      setMode("completed");
      logParentActivity({
        type: "weak_words_remediation",
        summary: `Hata Defterinden ${workoutResults.mastered + (wasKnown ? 1 : 0)} zayıf kelime pekiştirildi`,
        wordsCount: workoutResults.mastered + (wasKnown ? 1 : 0),
        score: (workoutResults.mastered + (wasKnown ? 1 : 0)) * 15,
      });
    } else {
      setCurrentIdx((prev) => prev + 1);
      setIsFlipped(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-4 bg-slate-950/85 backdrop-blur-md animate-in fade-in duration-200">
      <audio ref={audioRef} className="hidden" />

      <div className="relative w-full max-w-xl bg-slate-900 border-2 border-amber-500/40 rounded-3xl shadow-2xl overflow-hidden text-slate-100 flex flex-col max-h-[90vh]">
        
        {/* Modal Başlık Çubuğu */}
        <div className="p-5 sm:p-6 border-b border-slate-800 flex items-center justify-between bg-slate-950/60">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-2xl bg-amber-500/15 border border-amber-500/30 flex items-center justify-center text-amber-400">
              <BookOpen className="w-5 h-5" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h3 className="text-base sm:text-lg font-black text-white">
                  Kişiselleştirilmiş Hata Defteri
                </h3>
                <span className="px-2 py-0.5 rounded-full text-[10px] font-mono font-bold bg-rose-500/20 text-rose-300 border border-rose-500/30">
                  {weakWords.length} Zayıf Kelime
                </span>
              </div>
              <p className="text-[11px] sm:text-xs text-slate-400">
                Spaced Repetition (Memolandum Pulse™) ile takıldığın kelimeleri kalıcı hafızaya aktar.
              </p>
            </div>
          </div>

          <button
            type="button"
            onClick={onClose}
            className="p-2 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-400 hover:text-white transition-colors cursor-pointer"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* MOD 1: ZAYIF KELİMELER LİSTE GÖRÜNÜMÜ */}
        {mode === "list" && (
          <>
            <div className="flex-1 overflow-y-auto p-4 sm:p-6 space-y-3">
              {weakWords.length > 0 ? (
                <>
                  <div className="p-3.5 rounded-2xl bg-gradient-to-r from-amber-500/10 via-indigo-950/40 to-slate-900 border border-amber-500/30 flex items-center justify-between gap-3">
                    <div className="flex items-center gap-2.5">
                      <AlertTriangle className="w-5 h-5 text-amber-400 shrink-0" />
                      <div className="text-xs text-slate-200">
                        Bu kelimeler oyunlarda takıldığın veya henüz refleksen ezberlenmemiş kelimelerdir.
                      </div>
                    </div>
                  </div>

                  <div className="divide-y divide-slate-800/80 rounded-2xl bg-slate-950/60 border border-slate-800 overflow-hidden">
                    {weakWords.map((word) => (
                      <div
                        key={word.id}
                        className="p-3.5 flex items-center justify-between gap-3 hover:bg-slate-900/50 transition-colors"
                      >
                        <div className="flex items-center gap-3 min-w-0">
                          <button
                            type="button"
                            onClick={() => playAudio(word.audioUrl)}
                            className="w-8 h-8 rounded-xl bg-cyan-500/15 hover:bg-cyan-500/25 border border-cyan-500/30 flex items-center justify-center text-cyan-400 shrink-0 transition-all cursor-pointer"
                            title="Telaffuzu Dinle"
                          >
                            <Volume2 className="w-4 h-4" />
                          </button>
                          <div className="min-w-0">
                            <div className="text-sm font-bold text-white truncate">
                              {word.english}
                            </div>
                            <div className="text-xs text-slate-400 truncate">
                              {word.turkish || "—"}
                            </div>
                          </div>
                        </div>

                        <div className="flex items-center gap-2 shrink-0">
                          <span className="px-2 py-0.5 rounded text-[10px] font-medium bg-rose-500/15 text-rose-300 border border-rose-500/30">
                            {word.reason}
                          </span>
                        </div>
                      </div>
                    ))}
                  </div>
                </>
              ) : (
                <div className="text-center py-12 px-4 space-y-3">
                  <div className="w-16 h-16 rounded-full bg-emerald-500/20 border border-emerald-500/40 flex items-center justify-center text-emerald-400 mx-auto text-2xl">
                    🏆
                  </div>
                  <h4 className="text-base font-bold text-white">
                    Hata Defterin Tamamen Temiz!
                  </h4>
                  <p className="text-xs text-slate-400 max-w-sm mx-auto">
                    Şu anda takıldığın veya acil tekrar bekleyen hiçbir kelime bulunmuyor. Yeni üniteler ve oyunlar oynayarak kelime dağarcığını genişletmeye devam et!
                  </p>
                </div>
              )}
            </div>

            {/* Liste Alt Butonları */}
            <div className="p-4 sm:p-5 border-t border-slate-800 bg-slate-950 flex items-center justify-between gap-3">
              <span className="text-xs text-slate-400">
                {weakWords.length} kelime pekiştirme bekliyor
              </span>

              <div className="flex items-center gap-2">
                <button
                  type="button"
                  onClick={onClose}
                  className="px-4 py-2.5 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-300 text-xs font-bold transition-colors cursor-pointer"
                >
                  Kapat
                </button>
                {weakWords.length > 0 && (
                  <button
                    type="button"
                    onClick={handleStartWorkout}
                    className="inline-flex items-center gap-2 px-5 py-2.5 rounded-xl bg-gradient-to-r from-amber-500 to-amber-400 hover:from-amber-400 hover:to-amber-300 text-slate-950 text-xs sm:text-sm font-black shadow-lg shadow-amber-500/25 hover:scale-105 active:scale-95 transition-all cursor-pointer"
                  >
                    <Zap className="w-4 h-4 fill-current" />
                    <span>Hatalarımı Pekiştir ({weakWords.length})</span>
                  </button>
                )}
              </div>
            </div>
          </>
        )}

        {/* MOD 2: İNTERAKTİF ÇALIŞMA / ANTRENMAN MODU */}
        {mode === "workout" && currentWord && (
          <div className="p-6 sm:p-8 flex flex-col items-center justify-center space-y-6">
            {/* İlerleme Çubuğu */}
            <div className="w-full space-y-1">
              <div className="flex items-center justify-between text-xs font-mono text-slate-400">
                <span>Kelime {currentIdx + 1} / {weakWords.length}</span>
                <span className="text-amber-400 font-bold">⚡ Hafıza Güçlendirme</span>
              </div>
              <div className="w-full h-2 bg-slate-800 rounded-full overflow-hidden">
                <div
                  className="h-full bg-gradient-to-r from-amber-500 to-emerald-400 transition-all duration-300"
                  style={{ width: `${((currentIdx + 1) / weakWords.length) * 100}%` }}
                />
              </div>
            </div>

            {/* Flashcard Kartı */}
            <div
              onClick={() => {
                setIsFlipped(true);
                playAudio(currentWord.audioUrl);
              }}
              className="w-full min-h-[220px] rounded-3xl bg-gradient-to-b from-slate-800/90 to-slate-950 border-2 border-amber-500/30 p-6 flex flex-col items-center justify-center text-center cursor-pointer relative shadow-xl hover:border-amber-400 transition-all group"
            >
              <span className="text-[11px] font-mono text-amber-400/80 mb-2 uppercase tracking-widest">
                {isFlipped ? "Türkçe Anlamı" : "Dokun ve Anlamını Gör"}
              </span>

              <div className="text-3xl sm:text-4xl font-black text-white tracking-tight mb-2">
                {currentWord.english}
              </div>

              {isFlipped ? (
                <div className="text-xl sm:text-2xl font-bold text-emerald-400 animate-in fade-in zoom-in-95 duration-200">
                  {currentWord.turkish || "—"}
                </div>
              ) : (
                <div className="text-xs text-slate-400 mt-2 group-hover:text-slate-200 transition-colors">
                  💡 Cevabı hatırlamaya çalış, ardından kartı çevir
                </div>
              )}

              <button
                type="button"
                onClick={(e) => {
                  e.stopPropagation();
                  playAudio(currentWord.audioUrl);
                }}
                className="mt-4 p-2.5 rounded-full bg-cyan-500/20 hover:bg-cyan-500/30 text-cyan-300 border border-cyan-500/40 transition-transform active:scale-95"
                title="Doğal Telaffuz"
              >
                <Volume2 className="w-5 h-5" />
              </button>
            </div>

            {/* Değerlendirme Butonları */}
            {isFlipped ? (
              <div className="grid grid-cols-2 gap-3 w-full animate-in fade-in duration-200">
                <button
                  type="button"
                  onClick={() => handleRateWorkoutWord(false)}
                  className="py-3 px-4 rounded-xl bg-rose-500/15 hover:bg-rose-500/25 border border-rose-500/40 text-rose-300 font-bold text-xs sm:text-sm transition-all cursor-pointer"
                >
                  ✗ Hâlâ Zorlanıyorum
                </button>
                <button
                  type="button"
                  onClick={() => handleRateWorkoutWord(true)}
                  className="py-3 px-4 rounded-xl bg-emerald-500 hover:bg-emerald-400 text-slate-950 font-black text-xs sm:text-sm shadow-lg shadow-emerald-500/20 transition-all cursor-pointer"
                >
                  ✓ Şimdi Öğrendim (+15 XP)
                </button>
              </div>
            ) : (
              <button
                type="button"
                onClick={() => {
                  setIsFlipped(true);
                  playAudio(currentWord.audioUrl);
                }}
                className="w-full py-3.5 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-200 font-bold text-xs sm:text-sm transition-colors cursor-pointer"
              >
                Kartı Çevir & Cevabı Gör
              </button>
            )}
          </div>
        )}

        {/* MOD 3: ALISTIRMA TAMAMLANDI */}
        {mode === "completed" && (
          <div className="p-8 text-center space-y-6">
            <div className="w-20 h-20 rounded-3xl bg-emerald-500/20 border-2 border-emerald-400/40 flex items-center justify-center text-emerald-400 mx-auto text-4xl shadow-xl shadow-emerald-500/20 animate-bounce">
              🏆
            </div>

            <div className="space-y-2">
              <h3 className="text-xl sm:text-2xl font-black text-white">
                Hata Defteri Antrenmanı Tamamlandı!
              </h3>
              <p className="text-xs sm:text-sm text-slate-400 max-w-md mx-auto">
                Tebrikler! Zorlandığın kelimeleri SM-2 aralıklı tekrar algoritmasıyla hafızana kazıdın.
              </p>
            </div>

            <div className="grid grid-cols-2 gap-4 max-w-xs mx-auto">
              <div className="p-4 rounded-2xl bg-emerald-500/10 border border-emerald-500/30">
                <div className="text-2xl font-black text-emerald-400 font-mono">
                  {workoutResults.mastered}
                </div>
                <div className="text-xs text-slate-400">Pekiştirilen</div>
              </div>
              <div className="p-4 rounded-2xl bg-amber-500/10 border border-amber-500/30">
                <div className="text-2xl font-black text-amber-400 font-mono">
                  +{workoutResults.mastered * 15}
                </div>
                <div className="text-xs text-slate-400">Kazanılan XP</div>
              </div>
            </div>

            <button
              type="button"
              onClick={onClose}
              className="px-8 py-3.5 rounded-xl bg-gradient-to-r from-emerald-500 to-emerald-400 text-slate-950 font-black text-sm shadow-lg shadow-emerald-500/25 hover:scale-105 transition-all cursor-pointer"
            >
              Tamamla ve Kapat
            </button>
          </div>
        )}

      </div>
    </div>
  );
}
