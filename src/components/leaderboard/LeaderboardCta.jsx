'use client';

import React, { useState } from 'react';
import dynamic from 'next/dynamic';
import Link from 'next/link';
import { Trophy, Zap, Sparkles, UserPlus, Play, Award } from 'lucide-react';
import { useMemolandumStore } from '../../store/useMemolandumStore';
import { useAnalytics } from '../../hooks/useAnalytics';

const AuthModal = dynamic(() => import('../AuthModal'), { ssr: false });

export default function LeaderboardCta({ onOpenAuth = null }) {
  const [internalModalOpen, setInternalModalOpen] = useState(false);
  const [authView, setAuthView] = useState('register');

  const isAuthenticated = useMemolandumStore((s) => s.isAuthenticated);
  const profile = useMemolandumStore((s) => s.profile);
  const globalStats = useMemolandumStore((s) => s.globalStats);
  const { trackSignUp } = useAnalytics();

  const totalXp = globalStats?.total_xp || 0;
  const displayName = profile?.username || profile?.displayName || 'Kadet';

  const handleOpen = (view = 'register') => {
    try {
      trackSignUp(`cta_leaderboard_${view}`);
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
      {/* 1. MİSAFİR KULLANICI İÇİN: SIRALAMAYA KATILMA ÇAĞRISI */}
      {!isAuthenticated && (
        <div className="w-full rounded-2xl p-5 sm:p-6 mb-8 relative overflow-hidden border-2 border-cyan-500/40 bg-gradient-to-r from-cyan-950/40 via-slate-900/90 to-purple-950/40 shadow-[0_0_35px_rgba(6,182,212,0.2)] backdrop-blur-md">
          {/* Ambient Glows */}
          <div className="absolute top-0 right-10 w-48 h-48 bg-cyan-500/10 rounded-full blur-3xl pointer-events-none" />
          <div className="absolute bottom-0 left-10 w-48 h-48 bg-purple-500/10 rounded-full blur-3xl pointer-events-none" />

          <div className="flex flex-col md:flex-row items-center justify-between gap-6 relative z-10">
            <div className="flex items-center gap-4 text-center md:text-left">
              <div className="w-14 h-14 rounded-2xl bg-gradient-to-br from-cyan-500/20 to-blue-500/20 border border-cyan-500/40 flex items-center justify-center text-cyan-400 flex-shrink-0 shadow-[0_0_20px_rgba(6,182,212,0.3)] animate-pulse">
                <Trophy className="w-7 h-7 text-cyan-300" />
              </div>
              <div>
                <div className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full bg-cyan-500/15 border border-cyan-500/30 text-[10px] font-mono font-bold text-cyan-300 uppercase tracking-widest mb-1">
                  ⚡ SİBER KADET SIRALAMASI
                </div>
                <h3 className="text-lg sm:text-xl font-black text-white tracking-wide">
                  Liderlik Tablosunda Adını Görmek İster misin?
                </h3>
                <p className="text-xs sm:text-sm text-gray-300 mt-1 max-w-xl">
                  Şu an misafir modundasın. Ücretsiz profilini oluşturarak oyunlardan kazandığın XP'leri sabitleyebilir ve ilk 10 şampiyon arasına girebilirsin!
                </p>
              </div>
            </div>

            <div className="flex flex-col sm:flex-row items-center gap-3 w-full md:w-auto flex-shrink-0">
              <button
                type="button"
                onClick={() => handleOpen('register')}
                className="w-full sm:w-auto px-6 py-3 bg-gradient-to-r from-cyan-500 via-blue-500 to-indigo-600 hover:from-cyan-400 hover:to-blue-500 text-slate-950 font-black text-sm uppercase tracking-wider rounded-xl transition-all duration-200 transform hover:scale-105 active:scale-95 shadow-[0_0_20px_rgba(6,182,212,0.4)] flex items-center justify-center gap-2 cursor-pointer"
              >
                <UserPlus className="w-4 h-4 fill-slate-950 text-slate-950" />
                <span>1 Tıkla Ücretsiz Kayıt Ol</span>
              </button>

              <button
                type="button"
                onClick={() => handleOpen('login')}
                className="w-full sm:w-auto px-4 py-3 bg-dark-900/80 hover:bg-dark-800 border border-white/10 hover:border-cyan-500/50 text-cyan-300 font-bold text-sm rounded-xl transition-all flex items-center justify-center cursor-pointer"
              >
                Giriş Yap
              </button>
            </div>
          </div>
        </div>
      )}

      {/* 2. GİRİŞ YAPMIŞ AMA 0 XP'Lİ KULLANICI İÇİN: OYNA VE PUAN KAZAN ÇAĞRISI */}
      {isAuthenticated && totalXp <= 0 && (
        <div className="w-full rounded-2xl p-5 sm:p-6 mb-8 relative overflow-hidden border border-amber-500/30 bg-gradient-to-r from-amber-950/30 via-slate-900/90 to-orange-950/30 shadow-[0_0_25px_rgba(245,158,11,0.15)] backdrop-blur-md">
          <div className="flex flex-col sm:flex-row items-center justify-between gap-5 relative z-10">
            <div className="flex items-center gap-4 text-center sm:text-left">
              <div className="w-12 h-12 rounded-xl bg-amber-500/20 border border-amber-500/40 flex items-center justify-center text-amber-400 flex-shrink-0">
                <Award className="w-6 h-6 text-amber-300" />
              </div>
              <div>
                <h4 className="text-base font-black text-white">
                  Hoş geldin {displayName}! Henüz Liderlik Tablosunda Puanın Yok
                </h4>
                <p className="text-xs sm:text-sm text-gray-300 mt-0.5">
                  Liderlik tablosunda yer almak için en az 1 XP puanı kazanmalısın. Hemen bir oyun başlat veya kelime çalış!
                </p>
              </div>
            </div>

            <Link
              href="/#basla"
              className="w-full sm:w-auto px-6 py-2.5 bg-gradient-to-r from-amber-500 to-orange-500 hover:from-amber-400 hover:to-orange-400 text-slate-950 font-black text-xs sm:text-sm uppercase tracking-wider rounded-xl transition-all duration-200 transform hover:scale-105 active:scale-95 shadow-[0_0_15px_rgba(245,158,11,0.3)] flex items-center justify-center gap-2 flex-shrink-0"
            >
              <Play className="w-4 h-4 fill-slate-950" />
              <span>Hemen Oyna & XP Kazan</span>
            </Link>
          </div>
        </div>
      )}

      {/* 3. GİRİŞ YAPMIŞ VE PUANI OLAN KULLANICI İÇİN: TEBRİK VE İLERLEME ÇAĞRISI */}
      {isAuthenticated && totalXp > 0 && (
        <div className="w-full rounded-2xl p-4 sm:p-5 mb-8 relative overflow-hidden border border-emerald-500/30 bg-gradient-to-r from-emerald-950/30 via-slate-900/90 to-cyan-950/30 shadow-[0_0_20px_rgba(16,185,129,0.15)] backdrop-blur-md">
          <div className="flex flex-col sm:flex-row items-center justify-between gap-4 relative z-10">
            <div className="flex items-center gap-3.5 text-center sm:text-left">
              <div className="w-10 h-10 rounded-xl bg-emerald-500/20 border border-emerald-500/40 flex items-center justify-center text-emerald-400 flex-shrink-0">
                <Sparkles className="w-5 h-5 text-emerald-300" />
              </div>
              <div>
                <h4 className="text-sm sm:text-base font-black text-white">
                  Tebrikler, {displayName}! Toplam Puanın: <span className="text-emerald-400 font-mono font-bold">{totalXp.toLocaleString()} XP</span>
                </h4>
                <p className="text-xs text-gray-400 mt-0.5">
                  Sıralamadaki yerini korumak veya daha yukarılara tırmanmak için oynamaya devam et!
                </p>
              </div>
            </div>

            <Link
              href="/#basla"
              className="w-full sm:w-auto px-5 py-2 bg-emerald-500/20 hover:bg-emerald-500/30 border border-emerald-500/40 text-emerald-300 font-bold text-xs uppercase tracking-wider rounded-xl transition-all flex items-center justify-center gap-1.5 flex-shrink-0"
            >
              <Play className="w-3.5 h-3.5 fill-emerald-400" />
              <span>XP Kazanmaya Devam Et</span>
            </Link>
          </div>
        </div>
      )}

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
