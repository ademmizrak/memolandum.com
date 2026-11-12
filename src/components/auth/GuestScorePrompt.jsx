'use client';

import React, { useState } from 'react';
import dynamic from 'next/dynamic';
import { Zap, Trophy, ShieldAlert, Sparkles } from 'lucide-react';
import { useMemolandumStore } from '../../store/useMemolandumStore';
import { useAnalytics } from '../../hooks/useAnalytics';

const AuthModal = dynamic(() => import('../AuthModal'), { ssr: false });

/**
 * GuestScorePrompt — Misafir kullanıcılara oyun sonu/sektör temizleme ekranında
 * kazandıkları puanı ve XP'yi liderlik tablosuna kaydetmeleri için çağrı yapan gamified bileşen.
 */
export default function GuestScorePrompt({
  score = 0,
  xp = 0,
  gameTitle = '',
  className = '',
  onOpenAuth = null
}) {
  const [internalModalOpen, setInternalModalOpen] = useState(false);
  const [authView, setAuthView] = useState('register');
  const isAuthenticated = useMemolandumStore((s) => s.isAuthenticated);
  const { trackSignUp } = useAnalytics();

  // Zaten giriş yapmışsa misafir uyarısı gösterme
  if (isAuthenticated) return null;

  const displayXp = xp > 0 ? xp : Math.max(1, Math.floor(score / 10));

  const handleOpen = (view = 'register') => {
    try {
      trackSignUp(`cta_guest_score_${view}`);
    } catch (_) {}
    
    if (onOpenAuth) {
      onOpenAuth(view);
    } else {
      setAuthView(view);
      setInternalModalOpen(true);
    }
  };

  return (
    <>
      <div
        className={`w-full rounded-2xl p-4 my-3 relative overflow-hidden transition-all duration-300 border border-amber-500/40 bg-gradient-to-r from-amber-950/40 via-slate-900/90 to-cyan-950/40 shadow-[0_0_25px_rgba(245,158,11,0.18)] ${className}`}
      >
        {/* Shimmer / Glow Effect */}
        <div className="absolute top-0 right-0 w-32 h-32 bg-amber-500/10 rounded-full blur-2xl pointer-events-none" />
        <div className="absolute bottom-0 left-0 w-32 h-32 bg-cyan-500/10 rounded-full blur-2xl pointer-events-none" />

        <div className="flex flex-col gap-3 relative z-10">
          <div className="flex items-start justify-between gap-3">
            <div className="flex items-center gap-2.5">
              <div className="w-9 h-9 rounded-xl bg-amber-500/20 border border-amber-500/40 flex items-center justify-center text-amber-400 flex-shrink-0 shadow-sm animate-pulse">
                <Trophy className="w-5 h-5 text-amber-300" />
              </div>
              <div>
                <div className="flex items-center gap-1.5">
                  <span className="text-[10px] font-mono font-black tracking-widest text-amber-400 uppercase bg-amber-500/15 border border-amber-500/30 px-2 py-0.5 rounded-full">
                    MİSAFİR PUANI · KAYDEDİLMEDİ
                  </span>
                </div>
                <h4 className="text-xs sm:text-sm font-black text-white mt-1 leading-snug">
                  Bu skoru Liderlik Tablosuna kaydet!
                </h4>
              </div>
            </div>

            {displayXp > 0 && (
              <div className="flex items-center gap-1 bg-cyan-950/70 border border-cyan-500/40 px-2.5 py-1 rounded-lg flex-shrink-0">
                <Zap className="w-3.5 h-3.5 fill-cyan-400 text-cyan-400" />
                <span className="font-mono font-black text-cyan-300 text-xs sm:text-sm">
                  +{displayXp.toLocaleString()} XP
                </span>
              </div>
            )}
          </div>

          <p className="text-[11px] sm:text-xs text-slate-300 leading-relaxed">
            Misafir modundasın. Skorun tarayıcını kapatınca kaybolmasın ve en iyi 10 kadet arasına girsin istiyorsan ücretsiz bağlan.
          </p>

          <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-2 pt-1">
            <button
              type="button"
              onClick={() => handleOpen('register')}
              className="flex-1 py-2.5 px-4 bg-gradient-to-r from-amber-500 via-orange-500 to-amber-600 hover:from-amber-400 hover:to-orange-500 text-slate-950 font-black text-xs uppercase tracking-wider rounded-xl transition-all duration-200 transform hover:scale-[1.02] active:scale-95 shadow-[0_0_15px_rgba(245,158,11,0.35)] flex items-center justify-center gap-2 cursor-pointer"
            >
              <Sparkles className="w-3.5 h-3.5 fill-slate-950 text-slate-950" />
              <span>Sıralamaya Katıl & Skoru Kaydet</span>
            </button>

            <button
              type="button"
              onClick={() => handleOpen('login')}
              className="py-2.5 px-3 bg-slate-900/80 hover:bg-slate-800 border border-slate-700/80 hover:border-cyan-500/50 text-cyan-300 font-bold text-xs rounded-xl transition-all flex items-center justify-center cursor-pointer"
            >
              Giriş Yap
            </button>
          </div>
        </div>
      </div>

      {!onOpenAuth && (
        <AuthModal
          isOpen={internalModalOpen}
          onClose={() => setInternalModalOpen(false)}
          initialView={authView}
        />
      )}
    </>
  );
}
