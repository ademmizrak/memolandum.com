'use client';

import { useEffect, useState } from 'react';
import { collection, query, orderBy, limit, onSnapshot } from 'firebase/firestore';
import { db } from '../../lib/firebase/config';
import Link from 'next/link';
import Header from '../../components/Header';

export default function LeaderboardPage() {
  const [leaderboard, setLeaderboard] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    
    const q = query(
      collection(db, "leaderboard"), 
      orderBy("high_score", "desc"), 
      limit(10)
    );
    
    const unsubscribe = onSnapshot(q, (snapshot) => {
      const data = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
      setLeaderboard(data);
      setLoading(false);
    }, (error) => {
      console.error("Leaderboard stream error:", error);
      setLoading(false);
    });

    return () => unsubscribe();
  }, []);

  return (
    <div className="min-h-screen bg-[#0b101a] pb-12 relative overflow-hidden flex flex-col">
      
      <Header />

      {/* Background Glows */}
      <div className="absolute top-0 left-1/4 w-96 h-96 bg-cyan-500/10 rounded-full blur-[120px] -z-10 pointer-events-none mt-20"></div>
      <div className="absolute bottom-0 right-1/4 w-96 h-96 bg-purple-500/10 rounded-full blur-[120px] -z-10 pointer-events-none"></div>

      <div className="max-w-4xl mx-auto mt-8 px-4 w-full">
        <div className="flex flex-col items-center justify-center mb-8 relative z-10 gap-6">
          <div className="w-full flex justify-start">
            <Link href="/" className="text-gray-400 hover:text-cyan-400 transition-colors flex items-center gap-2 group bg-dark-900/50 px-4 py-2 rounded-xl border border-white/10 hover:border-cyan-500/50 hover:bg-cyan-500/10 backdrop-blur-md w-max">
              <svg className="w-5 h-5 group-hover:-translate-x-1 transition-transform" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 19l-7-7m0 0l7-7m-7 7h18" />
              </svg>
              <span className="font-bold text-sm tracking-widest uppercase">Geri Dön</span>
            </Link>
          </div>
          
          <div className="text-center w-max">
            <h1 className="text-3xl sm:text-5xl font-black text-transparent bg-clip-text bg-gradient-to-r from-cyan-400 via-blue-500 to-purple-500 tracking-tight mb-2 drop-shadow-sm">
              LİDERLİK TABLOSU
            </h1>
            <p className="text-gray-400 font-mono text-xs sm:text-sm tracking-[0.2em] uppercase">
              <span className="text-amber-400 animate-pulse inline-block mr-1">⚡</span> 
              EN İYİ 10 SİBER KADET 
              <span className="text-amber-400 animate-pulse inline-block ml-1">⚡</span>
            </p>
          </div>
        </div>

        <div className="gamified-banner-container flex-col !p-6 sm:!p-10 shadow-[0_0_40px_rgba(49,46,129,0.5)]" style={{ background: 'linear-gradient(135deg, #0f172a 0%, #172554 50%, #312e81 100%)' }}>
          
          <div className="banner-glow-effect" style={{ top: 'auto', bottom: '-20%', left: '30%', background: 'radial-gradient(circle, rgba(168,85,247,0.3) 0%, rgba(0,0,0,0) 70%)' }}></div>
          
          {/* Cyberpunk Grid Lines */}
          <div className="absolute inset-0 bg-[linear-gradient(rgba(255,255,255,0.02)_1px,transparent_1px),linear-gradient(90deg,rgba(255,255,255,0.02)_1px,transparent_1px)] bg-[size:4rem_4rem] [mask-image:linear-gradient(to_bottom,white,transparent)] pointer-events-none rounded-[20px]"></div>

          <div className="relative z-10 w-full">
            {loading ? (
              <div className="flex flex-col items-center justify-center py-20">
                <div className="animate-spin rounded-full h-16 w-16 border-t-2 border-b-2 border-cyan-500 mb-4"></div>
                <p className="text-cyan-500 font-mono text-sm animate-pulse tracking-widest">AĞ VERİLERİ SENKRONİZE EDİLİYOR...</p>
              </div>
            ) : leaderboard.length === 0 ? (
              <div className="text-center py-20">
                <div className="w-20 h-20 bg-dark-800/80 rounded-full flex items-center justify-center mx-auto mb-4 border border-white/10 shadow-[0_0_15px_rgba(255,255,255,0.05)]">
                  <svg className="w-10 h-10 text-gray-500" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M19 11H5m14 0a2 2 0 012 2v6a2 2 0 01-2 2H5a2 2 0 01-2-2v-6a2 2 0 012-2m14 0V9a2 2 0 00-2-2M5 11V9a2 2 0 002-2m0 0V5a2 2 0 012-2h6a2 2 0 012 2v2M7 7h10" />
                  </svg>
                </div>
                <p className="text-gray-300 font-bold text-lg">Henüz kimse skor kaydetmedi.</p>
                <p className="text-gray-500 text-sm mt-2">İlk sırayı almak için hemen oynamaya başla!</p>
              </div>
            ) : (
              <div className="space-y-4">
                {leaderboard.map((user, index) => (
                  <div 
                    key={user.id} 
                    className={`flex items-center justify-between p-4 sm:p-5 rounded-xl border-2 transition-all duration-300 hover:scale-[1.02] relative overflow-hidden group ${
                      index === 0 ? 'bg-gradient-to-r from-amber-500/20 to-orange-600/10 border-amber-500/50 shadow-[0_0_20px_rgba(245,158,11,0.3)] z-10' :
                      index === 1 ? 'bg-gradient-to-r from-gray-400/20 to-gray-600/10 border-gray-400/50 shadow-[0_0_15px_rgba(156,163,175,0.2)]' :
                      index === 2 ? 'bg-gradient-to-r from-amber-700/20 to-amber-900/10 border-amber-700/50 shadow-[0_0_15px_rgba(180,83,9,0.2)]' :
                      'bg-dark-900/60 border-white/10 hover:border-cyan-500/50 hover:bg-dark-800'
                    }`}
                  >
                    {/* Hover Glow Effect */}
                    <div className="absolute inset-0 bg-gradient-to-r from-transparent via-white/5 to-transparent -translate-x-full group-hover:animate-[shimmer_1.5s_infinite] pointer-events-none"></div>

                    <div className="flex items-center gap-4 sm:gap-6 relative z-10">
                      {/* Rank Number */}
                      <div className={`w-12 h-12 rounded-full flex items-center justify-center font-black text-xl ${
                        index === 0 ? 'bg-gradient-to-br from-amber-300 to-amber-600 text-dark-900 shadow-[0_0_15px_rgba(245,158,11,0.6)]' :
                        index === 1 ? 'bg-gradient-to-br from-gray-300 to-gray-500 text-dark-900 shadow-[0_0_10px_rgba(156,163,175,0.5)]' :
                        index === 2 ? 'bg-gradient-to-br from-amber-600 to-amber-800 text-white shadow-[0_0_10px_rgba(180,83,9,0.5)]' :
                        'bg-dark-800 border border-white/10 text-gray-400'
                      }`}>
                        #{index + 1}
                      </div>
                      
                      {/* Avatar & Name */}
                      <div className="flex items-center gap-4">
                        <div className={`w-12 h-12 rounded-full flex items-center justify-center font-bold uppercase text-base border-2 ${
                          index === 0 ? 'bg-amber-900/50 border-amber-400 text-amber-400' :
                          index < 3 ? 'bg-dark-800 border-gray-400 text-gray-300' :
                          'bg-dark-800 border-dark-600 text-gray-500'
                        }`}>
                          {(user.displayName || "C")[0]}
                        </div>
                        <div>
                          <p className={`font-black text-lg sm:text-xl tracking-wide ${index === 0 ? 'text-amber-400 drop-shadow-[0_0_5px_rgba(245,158,11,0.5)]' : 'text-white'}`}>
                            {user.displayName || "CADET_" + user.id.slice(0,4)}
                          </p>
                          <div className="flex items-center gap-2 mt-0.5">
                            <span className={`text-[10px] font-bold uppercase tracking-widest px-2 py-0.5 rounded-md ${
                              index === 0 ? 'bg-amber-500/20 text-amber-400' : 
                              index < 3 ? 'bg-gray-500/20 text-gray-400' : 
                              'bg-dark-700/50 text-gray-500'
                            }`}>
                              {index === 0 ? 'Şampiyon' : index < 3 ? 'Elit' : 'Çaylak'}
                            </span>
                          </div>
                        </div>
                      </div>
                    </div>

                    {/* Score */}
                    <div className="flex flex-col items-end relative z-10">
                      <span className={`font-black text-2xl sm:text-3xl font-mono tracking-tighter ${
                        index === 0 ? 'text-amber-400 drop-shadow-[0_0_10px_rgba(245,158,11,0.8)]' : 
                        index < 3 ? 'text-gray-200' :
                        'text-cyan-400'
                      }`}>
                        {user.high_score?.toLocaleString() || 0}
                      </span>
                      <span className="text-[11px] font-bold text-gray-500 uppercase tracking-widest mt-[-4px]">
                        XP Puanı
                      </span>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
