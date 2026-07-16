"use client";
import React, { useEffect, useState } from "react";
import { useMemolandumStore } from "../../store/useMemolandumStore";
import Header from "../../components/Header";
import AuthModal from "../../components/AuthModal";
import StudyProfilesPanel from "../../components/StudyProfilesPanel";
import { changeUsername, logoutUser } from "../../lib/firebase/authService";
import { auth, db } from "../../lib/firebase/config";
import { doc, onSnapshot } from "firebase/firestore";

const PRESET_AVATARS = [
  "https://api.dicebear.com/9.x/bottts/svg?seed=Felix",
  "https://api.dicebear.com/9.x/bottts/svg?seed=Aneka",
  "https://api.dicebear.com/9.x/bottts/svg?seed=Oliver",
  "https://api.dicebear.com/9.x/bottts/svg?seed=Luna",
  "https://api.dicebear.com/9.x/bottts/svg?seed=Nala",
  "https://api.dicebear.com/9.x/bottts/svg?seed=Tinkerbell",
  "https://api.dicebear.com/9.x/bottts/svg?seed=Jack",
  "https://api.dicebear.com/9.x/bottts/svg?seed=Sasha"
];

const DICEBEAR_STYLES = [
  { id: "bottts", name: "Robotlar 🤖" },
  { id: "pixel-art", name: "Pixel Art 👾" },
  { id: "avataaars", name: "Karakterler 🧑‍🚀" },
  { id: "identicon", name: "Geometrik 💠" }
];

const THEME_COLORS = [
  { id: "cyan", name: "Neon Siber", primary: "#22d3ee", secondary: "#0e7490", glow: "rgba(34,211,238,0.25)" },
  { id: "purple", name: "Kozmik Mor", primary: "#c084fc", secondary: "#7e22ce", glow: "rgba(192,132,252,0.25)" },
  { id: "pink", name: "Siber Pembe", primary: "#f472b6", secondary: "#be185d", glow: "rgba(244,114,182,0.25)" },
  { id: "emerald", name: "Matrix Yeşil", primary: "#34d399", secondary: "#047857", glow: "rgba(52,211,153,0.25)" },
  { id: "amber", name: "Retro Altın", primary: "#fbbf24", secondary: "#b45309", glow: "rgba(251,191,36,0.25)" },
  { id: "crimson", name: "Lazer Kırmızı", primary: "#f87171", secondary: "#b91c1c", glow: "rgba(248,113,113,0.25)" }
];

export default function ProfilePage() {
  const { profile, changeAvatar, isAuthenticated, isAuthLoading, uid, globalStats: localStats } = useMemolandumStore();
  const [globalStats, setGlobalStats] = useState(null);
  const [mounted, setMounted] = useState(false);
  const [isEditingUsername, setIsEditingUsername] = useState(false);
  const [newUsernameInput, setNewUsernameInput] = useState("");
  const [usernameError, setUsernameError] = useState("");
  const [isSavingUsername, setIsSavingUsername] = useState(false);
  
  // Custom Avatar Designer State
  const [avatarStyle, setAvatarStyle] = useState("bottts");
  const [avatarSeed, setAvatarSeed] = useState("Felix");
  const [customAvatarUrl, setCustomAvatarUrl] = useState("https://api.dicebear.com/9.x/bottts/svg?seed=Felix");

  // Theme Customizer State
  const [themeColor, setThemeColor] = useState("cyan");

  // Auth modal for guests
  const [isAuthModalOpen, setIsAuthModalOpen] = useState(false);
  const [showLogoutConfirm, setShowLogoutConfirm] = useState(false);
  const [isLoggingOut, setIsLoggingOut] = useState(false);

  const handleLogout = async () => {
    try {
      setIsLoggingOut(true);
      await logoutUser();
      setShowLogoutConfirm(false);
      window.location.href = "/";
    } catch (e) {
      console.error(e);
      setIsLoggingOut(false);
    }
  };

  useEffect(() => {
    setMounted(true);
    // Load theme color from localStorage
    const savedTheme = localStorage.getItem("memolandum_theme_color");
    if (savedTheme && THEME_COLORS.some(t => t.id === savedTheme)) {
      setThemeColor(savedTheme);
    }
  }, []);

  // Update dynamic avatar url preview when style/seed changes
  useEffect(() => {
    if (avatarSeed.trim()) {
      const url = `https://api.dicebear.com/9.x/${avatarStyle}/svg?seed=${encodeURIComponent(avatarSeed.trim())}`;
      setCustomAvatarUrl(url);
    }
  }, [avatarStyle, avatarSeed]);

  // Sync Global Stats (Authenticated -> Firestore, Guest -> Zustand Local)
  useEffect(() => {
    if (mounted) {
      if (isAuthenticated && uid) {
        const userRef = doc(db, 'users', uid, 'stats', 'global');
        const unsub = onSnapshot(userRef, (docSnap) => {
          if (docSnap.exists()) {
            setGlobalStats(docSnap.data());
          } else {
            setGlobalStats(localStats);
          }
        });
        return () => unsub();
      } else {
        // Guest mode
        setGlobalStats(localStats);
      }
    }
  }, [mounted, isAuthenticated, uid, localStats]);

  if (!mounted || isAuthLoading) {
    return (
      <div className="min-h-screen bg-[#0b101a] flex items-center justify-center">
        <div className="w-10 h-10 border-4 border-cyan-500 border-t-transparent rounded-full animate-spin"></div>
      </div>
    );
  }

  // Active theme properties
  const activeTheme = THEME_COLORS.find(t => t.id === themeColor) || THEME_COLORS[0];

  const handleEditUsername = () => {
    setNewUsernameInput(profile?.displayName || "Misafir");
    setIsEditingUsername(true);
    setUsernameError("");
  };

  const handleSaveUsername = async () => {
    if (!newUsernameInput || newUsernameInput.trim().length < 3) {
      setUsernameError("En az 3 karakter olmalı.");
      return;
    }
    
    setIsSavingUsername(true);
    setUsernameError("");
    try {
      if (isAuthenticated) {
        await changeUsername(auth.currentUser, profile?.displayName, newUsernameInput.trim());
      } else {
        // Local state update for guests
        useMemolandumStore.setState((state) => ({
          profile: state.profile ? { ...state.profile, displayName: newUsernameInput.trim() } : { displayName: newUsernameInput.trim() }
        }));
      }
      setIsEditingUsername(false);
    } catch (err) {
      setUsernameError(err.message || "Bir hata oluştu.");
    } finally {
      setIsSavingUsername(false);
    }
  };

  const handleAvatarChange = async (url) => {
    try {
      if (isAuthenticated) {
        await changeAvatar(url);
      } else {
        // Local state update for guests
        useMemolandumStore.setState((state) => ({
          profile: state.profile ? { ...state.profile, photoURL: url } : { photoURL: url }
        }));
      }
    } catch (err) {
      console.error(err);
    }
  };

  const handleRandomizeSeed = () => {
    const randomSeeds = ["Neo", "Trinity", "Morpheus", "Apex", "Nova", "Cosmo", "Zero", "Pixel", "Kadet", "Specter", "Aegis", "Goliath"];
    const newSeed = randomSeeds[Math.floor(Math.random() * randomSeeds.length)] + Math.floor(Math.random() * 1000);
    setAvatarSeed(newSeed);
  };

  const handleSelectTheme = (id) => {
    setThemeColor(id);
    localStorage.setItem("memolandum_theme_color", id);
  };

  // Rank Calculation based on total XP
  const xp = globalStats?.total_xp || 0;
  let rankName = "Siber Kadet";
  let rankIcon = "🛡️";
  let rankColor = "#38bdf8";
  let nextRankXp = 1000;
  
  if (xp >= 10000) {
    rankName = "Siber Efsane";
    rankIcon = "🌌";
    rankColor = "#f472b6";
    nextRankXp = 10000; // maxed
  } else if (xp >= 5000) {
    rankName = "Siber Komutan";
    rankIcon = "👑";
    rankColor = "#fbbf24";
    nextRankXp = 10000;
  } else if (xp >= 1000) {
    rankName = "Siber Savaşçı";
    rankIcon = "⚔️";
    rankColor = "#c084fc";
    nextRankXp = 5000;
  }

  const rankPercent = Math.min(100, Math.round((xp / nextRankXp) * 100));

  return (
    <div className="min-h-screen bg-[#0b101a] text-gray-200 font-sans relative overflow-hidden flex flex-col pb-16">
      <Header />
      
      {/* Background Glows (Dynamically themed) */}
      <div 
        className="absolute top-20 left-1/4 w-96 h-96 rounded-full blur-[120px] -z-10 pointer-events-none transition-all duration-500"
        style={{ backgroundColor: activeTheme.primary, opacity: 0.12 }}
      ></div>
      <div 
        className="absolute bottom-0 right-1/4 w-96 h-96 rounded-full blur-[120px] -z-10 pointer-events-none transition-all duration-500"
        style={{ backgroundColor: activeTheme.primary, opacity: 0.08 }}
      ></div>

      <div className="w-full max-w-4xl mx-auto px-4 py-8 flex flex-col gap-8 relative z-10">
        
        {/* Guest Migration Warning Banner */}
        {!isAuthenticated && (
          <div className="bg-amber-500/10 border border-amber-500/30 rounded-xl p-6 flex flex-col md:flex-row items-center justify-between gap-6 backdrop-blur-md shadow-lg animate-pulse">
            <div className="flex items-center gap-4 text-center md:text-left">
              <span className="text-3xl">⚠️</span>
              <div>
                <h3 className="text-amber-400 font-black tracking-wide text-lg">MİSAFİR MODUNDASINIZ</h3>
                <p className="text-sm text-gray-300">İlerlemeleriniz ve kazandığınız elmaslar şu an tarayıcınızda geçici olarak tutuluyor. Kalıcı hale getirmek için ücretsiz siber hesap oluşturun!</p>
              </div>
            </div>
            <button 
              onClick={() => setIsAuthModalOpen(true)}
              className="bg-amber-500 hover:bg-amber-400 text-black px-6 py-2.5 rounded-lg font-black text-sm transition-all duration-200 transform hover:scale-105 shadow-md shadow-amber-500/20 whitespace-nowrap"
            >
              Hesap Oluştur / Giriş Yap
            </button>
          </div>
        )}

        <StudyProfilesPanel />

        {/* Profile Hero Card */}
        <div 
          className="profile-hero p-8 rounded-2xl flex flex-col md:flex-row items-center gap-6 border transition-all duration-500 backdrop-blur-md"
          style={{ 
            borderColor: `${activeTheme.primary}4D`, 
            boxShadow: `0 0 25px ${activeTheme.glow}`,
            background: `linear-gradient(135deg, rgba(15, 23, 42, 0.8) 0%, rgba(30, 27, 75, 0.4) 100%)`
          }}
        >
          <div className="relative group">
            {profile?.photoURL ? (
              <img 
                src={profile.photoURL} 
                alt="Profil" 
                className="w-28 h-28 rounded-full border-3 bg-[#111827] object-cover shadow-lg transition-all duration-300"
                style={{ borderColor: activeTheme.primary, boxShadow: `0 0 20px ${activeTheme.primary}66` }}
              />
            ) : (
              <div 
                className="w-28 h-28 rounded-full border-3 flex items-center justify-center text-4xl font-bold bg-indigo-950/80 shadow-lg text-white"
                style={{ borderColor: activeTheme.primary, boxShadow: `0 0 20px ${activeTheme.primary}66` }}
              >
                {(profile?.displayName || 'M')[0].toUpperCase()}
              </div>
            )}
            <div className="absolute -bottom-1 -right-1 bg-gray-900 border border-gray-700 px-2 py-0.5 rounded-md text-[10px] font-black text-gray-400 uppercase tracking-widest shadow-md">
              {isAuthenticated ? "SİBER" : "GUEST"}
            </div>
          </div>

          <div className="flex-1 flex flex-col items-center md:items-start gap-1 text-center md:text-left">
            {isEditingUsername ? (
              <div className="flex flex-col gap-2 w-full max-w-sm">
                <div className="flex items-center gap-2">
                  <input 
                    type="text" 
                    value={newUsernameInput}
                    onChange={(e) => setNewUsernameInput(e.target.value.replace(/[^a-zA-Z0-9_ çÇğĞıİöÖşŞüÜ.-]/g, ''))}
                    className="bg-gray-800/80 border border-gray-700 text-white rounded-lg px-3 py-1.5 focus:outline-none focus:border-cyan-500 font-bold w-full"
                    placeholder="Yeni İsim"
                  />
                  <button 
                    onClick={handleSaveUsername} 
                    disabled={isSavingUsername} 
                    className="bg-cyan-600 hover:bg-cyan-500 text-white px-3 py-1.5 rounded-lg disabled:opacity-50 text-sm font-bold transition-colors"
                  >
                    {isSavingUsername ? '...' : 'Kaydet'}
                  </button>
                  <button 
                    onClick={() => setIsEditingUsername(false)} 
                    className="bg-gray-700 hover:bg-gray-600 text-white px-3 py-1.5 rounded-lg text-sm font-bold transition-colors"
                  >
                    İptal
                  </button>
                </div>
                {usernameError && <span className="text-red-400 text-sm text-left">{usernameError}</span>}
              </div>
            ) : (
              <div className="flex items-center gap-3">
                <h1 className="text-3xl font-black text-white tracking-wide">{profile?.displayName || "Siber Savaşçı"}</h1>
                <button 
                  onClick={handleEditUsername} 
                  className="text-gray-400 hover:text-cyan-400 transition-colors" 
                  title="Kullanıcı adını değiştir"
                >
                  <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15.232 5.232l3.536 3.536m-2.036-5.036a2.5 2.5 0 113.536 3.536L6.5 21.036H3v-3.572L16.732 3.732z" />
                  </svg>
                </button>
              </div>
            )}
            <p className="text-gray-400 font-mono text-sm">{profile?.email || "Yerel Kayıt (Misafir Oturumu)"}</p>
            
            {/* Rank display */}
            <div className="mt-3 flex items-center gap-2 bg-gray-900/60 border border-gray-800/80 px-3 py-1 rounded-full text-xs">
              <span className="text-base">{rankIcon}</span>
              <span className="font-bold tracking-wider uppercase" style={{ color: rankColor }}>{rankName}</span>
              <span className="text-gray-500">|</span>
              <span className="text-gray-400 font-bold">{xp} XP</span>
            </div>
          </div>
        </div>

        {/* Color customizer */}
        <section className="profile-section">
          <h2>Kozmetik Arayüz Teması</h2>
          <p className="text-gray-400 text-sm mb-4">Sitedeki neon siber efektlerin rengini değiştirerek arayüzünü kişiselleştir.</p>
          <div className="flex flex-wrap gap-3">
            {THEME_COLORS.map((t) => (
              <button
                key={t.id}
                onClick={() => handleSelectTheme(t.id)}
                className="flex items-center gap-2 px-4 py-2.5 rounded-xl border font-bold text-xs tracking-wider uppercase transition-all duration-300 transform active:scale-95"
                style={{
                  backgroundColor: themeColor === t.id ? `${t.primary}1A` : 'rgba(30, 41, 59, 0.4)',
                  borderColor: themeColor === t.id ? t.primary : 'rgba(255,255,255,0.06)',
                  color: themeColor === t.id ? '#ffffff' : '#94a3b8',
                  boxShadow: themeColor === t.id ? `0 0 12px ${t.glow}` : 'none'
                }}
              >
                <span className="w-3.5 h-3.5 rounded-full" style={{ backgroundColor: t.primary }}></span>
                {t.name}
              </button>
            ))}
          </div>
        </section>

        {/* Interactive Avatar Designer */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
          
          <section className="profile-section flex flex-col justify-between">
            <div>
              <h2>Karakter Tasarım Laboratuvarı</h2>
              <p className="text-gray-400 text-sm mb-6">Yapay Zeka destekli Dicebear robot motorunu kullanarak milyonlarca benzersiz avatardan kendi karakterini yarat.</p>
              
              <div className="flex flex-col gap-4">
                <div className="flex flex-col gap-1.5">
                  <label className="text-xs font-black text-gray-400 uppercase tracking-widest">Karakter Tarzı</label>
                  <div className="grid grid-cols-2 gap-2">
                    {DICEBEAR_STYLES.map((style) => (
                      <button
                        key={style.id}
                        onClick={() => setAvatarStyle(style.id)}
                        className={`px-3 py-2 rounded-lg text-xs font-bold border transition-all duration-200 text-left ${avatarStyle === style.id ? 'bg-indigo-950/60 border-cyan-500/80 text-white' : 'bg-gray-800/40 border-transparent text-gray-400 hover:bg-gray-800/80'}`}
                      >
                        {style.name}
                      </button>
                    ))}
                  </div>
                </div>

                <div className="flex flex-col gap-1.5">
                  <label className="text-xs font-black text-gray-400 uppercase tracking-widest">Karakter Tohumu (Seed)</label>
                  <div className="flex gap-2">
                    <input 
                      type="text" 
                      value={avatarSeed}
                      onChange={(e) => setAvatarSeed(e.target.value.replace(/[^a-zA-Z0-9_-]/g, ''))}
                      className="bg-gray-800 border border-gray-700 text-white rounded-lg px-3 py-2 focus:outline-none focus:border-cyan-500 font-bold w-full font-mono text-sm"
                      placeholder="Benzersiz isim yaz..."
                    />
                    <button 
                      onClick={handleRandomizeSeed}
                      className="bg-gray-800 hover:bg-gray-700 border border-gray-700 text-white p-2.5 rounded-lg transition-colors"
                      title="Rastgele Tohum"
                    >
                      🎲
                    </button>
                  </div>
                </div>
              </div>
            </div>

            <div className="flex items-center gap-6 mt-6 bg-gray-950/40 border border-gray-800/80 p-4 rounded-xl">
              <img 
                src={customAvatarUrl} 
                alt="Custom Avatar Preview" 
                className="w-20 h-20 rounded-xl border border-gray-700 bg-gray-900 p-2.5"
              />
              <div className="flex flex-col gap-2 flex-1">
                <span className="text-xs text-green-400 font-black tracking-wide">AVATAR OLUŞTURULDU!</span>
                <button
                  onClick={() => handleAvatarChange(customAvatarUrl)}
                  className="w-full text-center py-2.5 rounded-lg text-xs font-black uppercase tracking-wider text-black transition-all duration-200 transform hover:scale-[1.02]"
                  style={{ backgroundColor: activeTheme.primary, boxShadow: `0 0 10px ${activeTheme.primary}4D` }}
                >
                  Karakteri Seç
                </button>
              </div>
            </div>
          </section>

          {/* Preset Avatars */}
          <section className="profile-section">
            <h2>Klasik Kadet Serisi</h2>
            <p className="text-gray-400 text-sm mb-6">Sistemde hazır bulunan klasik siber kadet avatar paketlerinden birini tercih et.</p>
            
            <div className="avatar-grid">
              {PRESET_AVATARS.map((url, index) => (
                <button 
                  key={index} 
                  onClick={() => handleAvatarChange(url)}
                  className={`avatar-option-btn ${profile?.photoURL === url ? "selected" : ""}`}
                >
                  <img src={url} alt={`Avatar ${index + 1}`} className="w-full h-auto p-1" />
                </button>
              ))}
            </div>
          </section>
        </div>

        {/* Global Statistics */}
        <section className="profile-section">
          <h2>Siber Performans Kartı</h2>
          
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 mb-8">
            <div className="bg-gray-800/40 p-5 rounded-2xl border border-gray-800/80 flex flex-col gap-1">
              <span className="text-gray-400 text-xs font-black tracking-widest uppercase">TOPLAM SKOR</span>
              <div className="text-3xl font-black transition-all duration-300" style={{ color: activeTheme.primary }}>
                {(globalStats?.total_score || 0).toLocaleString()}
              </div>
            </div>
            <div className="bg-gray-800/40 p-5 rounded-2xl border border-gray-800/80 flex flex-col gap-1">
              <span className="text-gray-400 text-xs font-black tracking-widest uppercase">KAZANILAN XP</span>
              <div className="text-3xl font-black text-purple-400 drop-shadow-[0_0_8px_rgba(168,85,247,0.3)]">
                {(globalStats?.total_xp || 0).toLocaleString()}
              </div>
            </div>
            <div className="bg-gray-800/40 p-5 rounded-2xl border border-gray-800/80 flex flex-col gap-1">
              <span className="text-gray-400 text-xs font-black tracking-widest uppercase">TOPLANAN ELMAS</span>
              <div className="text-3xl font-black text-green-400 drop-shadow-[0_0_8px_rgba(74,222,128,0.3)]">
                💎 {globalStats?.gems || 0}
              </div>
            </div>
          </div>

          <div className="chart-container">
            <h3 className="text-xs font-black text-gray-400 uppercase tracking-widest mb-2">Oyun Bazlı Başarı Puanları</h3>
            
            {Object.entries(globalStats?.game_breakdown || {}).map(([gameId, stats], idx) => {
              const maxPossible = 10000;
              const percentage = Math.min(100, Math.max(8, Math.round(((stats.score || 0) / maxPossible) * 100)));
              const colors = ["#38bdf8", "#a855f7", "#22c55e", "#fbbf24", "#f87171", "#f472b6"];
              const barColor = colors[idx % colors.length];
              
              return (
                <div key={idx} className="progress-bar-row">
                  <div className="bar-info">
                    <span className="lang-name capitalize font-bold text-sm tracking-wide">{gameId.replace(/_/g, ' ')}</span>
                    <span className="lang-level font-mono text-xs">⚡ {stats.xp || 0} XP</span>
                  </div>
                  <div className="bar-bg">
                    <div className="bar-fill" style={{ width: `${percentage}%`, backgroundColor: barColor }}>
                      <span className="bar-percentage text-[10px] font-black text-gray-900">{stats.score || 0} PTS</span>
                    </div>
                  </div>
                </div>
              );
            })}
            
            {(!globalStats || !globalStats.game_breakdown || Object.keys(globalStats.game_breakdown).length === 0) && (
              <div className="text-gray-500 italic font-mono text-sm py-4 border border-dashed border-gray-800 rounded-xl text-center bg-gray-950/20">
                🚀 Henüz hiçbir oyunda skor kaydınız bulunmuyor. Hemen bir oyun oynamaya başlayın!
              </div>
            )}
          </div>
        </section>

        {/* Çıkış — bilerek gömülü; tek tıkta header'dan değil */}
        {isAuthenticated && (
          <section className="profile-section border border-white/5 opacity-80">
            <h2 className="!text-slate-500 !text-sm">Hesap</h2>
            <p className="text-slate-500 text-sm mb-4 leading-relaxed">
              Oturumun bu cihazda kalıcıdır. Çıkış yaparsan XP, kasa ve ilerleme bulutta kalır;
              yeniden giriş yapman gerekir.
            </p>
            {!showLogoutConfirm ? (
              <button
                type="button"
                onClick={() => setShowLogoutConfirm(true)}
                className="text-xs text-slate-500 hover:text-slate-300 underline underline-offset-4 transition-colors"
              >
                Bu cihazdan çıkış yap…
              </button>
            ) : (
              <div className="rounded-xl border border-red-500/20 bg-red-500/5 p-4 flex flex-col sm:flex-row sm:items-center gap-3">
                <p className="text-sm text-red-200/90 flex-1">
                  Emin misin? Tekrar girene kadar bu tarayıcıda misafir gibi görünürsün.
                </p>
                <div className="flex gap-2">
                  <button
                    type="button"
                    onClick={() => setShowLogoutConfirm(false)}
                    className="px-3 py-2 rounded-lg text-sm font-bold bg-slate-700 text-white hover:bg-slate-600"
                  >
                    Vazgeç
                  </button>
                  <button
                    type="button"
                    disabled={isLoggingOut}
                    onClick={handleLogout}
                    className="px-3 py-2 rounded-lg text-sm font-bold bg-red-600/80 text-white hover:bg-red-500 disabled:opacity-50"
                  >
                    {isLoggingOut ? "…" : "Evet, çıkış yap"}
                  </button>
                </div>
              </div>
            )}
          </section>
        )}

      </div>

      {/* Auth Modal for Guests */}
      <AuthModal isOpen={isAuthModalOpen} onClose={() => setIsAuthModalOpen(false)} initialView="register" />

      <style jsx>{`
        .profile-section { 
          background: rgba(15, 23, 42, 0.4); 
          border: 1px solid rgba(255,255,255,0.03); 
          padding: 28px; 
          border-radius: 16px;
          backdrop-filter: blur(12px); 
          box-shadow: 0 4px 30px rgba(0, 0, 0, 0.2);
        }
        .profile-section h2 { 
          font-size: 18px; 
          font-weight: 900; 
          margin-bottom: 16px; 
          color: #f1f5f9; 
          letter-spacing: 0.75px;
          text-transform: uppercase;
        }
        .avatar-grid { 
          display: grid; 
          grid-template-columns: repeat(4, 1fr); 
          gap: 12px; 
        }
        .avatar-option-btn { 
          background: rgba(15, 23, 42, 0.6); 
          border: 2px solid rgba(255,255,255,0.03); 
          border-radius: 12px; 
          padding: 6px; 
          cursor: pointer; 
          transition: all 0.25s cubic-bezier(0.4, 0, 0.2, 1); 
        }
        .avatar-option-btn:hover { 
          transform: translateY(-3px) scale(1.04); 
          background: rgba(30, 41, 59, 0.6);
          border-color: rgba(255,255,255,0.1);
        }
        .avatar-option-btn.selected { 
          border-color: ${activeTheme.primary}; 
          box-shadow: 0 0 15px ${activeTheme.primary}4D; 
          background: ${activeTheme.secondary}1D;
        }
        .chart-container { 
          display: flex; 
          flex-direction: column; 
          gap: 20px; 
        }
        .progress-bar-row { 
          display: flex; 
          flex-direction: column; 
          gap: 6px; 
        }
        .bar-info { 
          display: flex; 
          justify-content: space-between; 
          align-items: center;
        }
        .lang-level { 
          background: rgba(255,255,255,0.04); 
          padding: 2px 10px; 
          border-radius: 8px; 
          color: #cbd5e1;
          border: 1px solid rgba(255,255,255,0.04);
        }
        .bar-bg { 
          width: 100%; 
          height: 20px; 
          background: rgba(15, 23, 42, 0.8); 
          border-radius: 8px; 
          overflow: hidden; 
          border: 1px solid rgba(255,255,255,0.02);
        }
        .bar-fill { 
          height: 100%; 
          border-radius: 8px; 
          display: flex; 
          align-items: center; 
          justify-content: flex-end; 
          padding-right: 8px; 
          transition: width 1.2s cubic-bezier(0.4, 0, 0.2, 1); 
        }
      `}</style>
    </div>
  );
}
