"use client";
import React, { useEffect, useState } from "react";
import { useMemolandumStore } from "../../store/useMemolandumStore";
import Header from "../../components/Header";
import AuthModal from "../../components/AuthModal";
import StudyProfilesPanel from "../../components/StudyProfilesPanel";
import {
  changeUsername,
  logoutUser,
  deleteUserAccount,
  changeAccountPassword,
  requestPasswordReset,
  userHasPasswordProvider,
} from "../../lib/firebase/authService";
import { auth, db } from "../../lib/firebase/config";
import { doc, onSnapshot } from "firebase/firestore";
import {
  FREE_TRANSLATION_QUOTA,
  PAYMENTS_LIVE,
  PREMIUM_PRODUCT,
  remainingFreeTranslations,
} from "../../lib/premium/config";
import PremiumCheckoutModal from "../../components/premium/PremiumCheckoutModal";
import { RetroLineChart } from "../../components/ui/charts/RetroLineChart";
import { RetroBarChart } from "../../components/ui/charts/RetroBarChart";
import { RetroRadialChart } from "../../components/ui/charts/RetroRadialChart";

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
  const profile = useMemolandumStore((s) => s.profile);
  const changeAvatar = useMemolandumStore((s) => s.changeAvatar);
  const isAuthenticated = useMemolandumStore((s) => s.isAuthenticated);
  const uid = useMemolandumStore((s) => s.uid);
  const localStats = useMemolandumStore((s) => s.globalStats);
  const vocabularyVault = useMemolandumStore((s) => s.vocabularyVault) || {};
  const quizHistory = useMemolandumStore((s) => s.quizHistory) || [];

  const allWords = React.useMemo(() => {
    return Object.values(vocabularyVault);
  }, [vocabularyVault]);

  const stageCounts = React.useMemo(() => {
    let firstTry = 0;
    let p100 = 0;
    let p75 = 0;
    let p50 = 0;
    let p25 = 0;

    allWords.forEach((w) => {
      if (w.firstTryCorrect === true) {
        firstTry++;
      } else if (w.learningProgressPct === 100) {
        p100++;
      } else if (w.learningProgressPct === 75) {
        p75++;
      } else if (w.learningProgressPct === 50) {
        p50++;
      } else if (w.learningProgressPct === 25) {
        p25++;
      } else {
        // Fallback mapping based on word strength level (1..5) for vault words
        const s = w.strength || 1;
        if (s >= 4) firstTry++;
        else if (s === 3) p75++;
        else if (s === 2) p50++;
        else p25++;
      }
    });

    return { firstTry, p100, p75, p50, p25 };
  }, [allWords]);

  const dailyHistory = React.useMemo(() => {
    const daysMap = {};
    const dayNames = ["Paz", "Pzt", "Sal", "Çar", "Per", "Cum", "Cmt"];
    const today = new Date();

    for (let i = 6; i >= 0; i--) {
      const d = new Date(today);
      d.setDate(d.getDate() - i);
      const key = d.toISOString().split("T")[0];
      const label = dayNames[d.getDay()];
      daysMap[key] = { label, correct: 0, wrong: 0 };
    }

    quizHistory.forEach((h) => {
      const dStr = new Date(h.timestamp || Date.now()).toISOString().split("T")[0];
      if (daysMap[dStr]) {
        if (h.isCorrect) daysMap[dStr].correct++;
        else daysMap[dStr].wrong++;
      }
    });

    return Object.values(daysMap);
  }, [quizHistory]);

  const vaultStrengthStats = React.useMemo(() => {
    const s = { 1: 0, 2: 0, 3: 0, 4: 0, 5: 0 };
    allWords.forEach((w) => {
      s[w.strength || 1] = (s[w.strength || 1] || 0) + 1;
    });
    return s;
  }, [allWords]);

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
  const [premiumOpen, setPremiumOpen] = useState(false);
  const isPremium = useMemolandumStore((s) => s.isPremium);
  const translationCount = useMemolandumStore((s) => s.translationCount) || 0;
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);
  const [deletePassword, setDeletePassword] = useState("");
  const [deleteAck, setDeleteAck] = useState(false);
  const [isDeletingAccount, setIsDeletingAccount] = useState(false);
  const [deleteError, setDeleteError] = useState("");

  // Şifre yönetimi
  const [currentPassword, setCurrentPassword] = useState("");
  const [newPassword, setNewPassword] = useState("");
  const [confirmNewPassword, setConfirmNewPassword] = useState("");
  const [passwordBusy, setPasswordBusy] = useState(false);
  const [passwordMsg, setPasswordMsg] = useState("");
  const [passwordErr, setPasswordErr] = useState("");
  const [resetBusy, setResetBusy] = useState(false);
  const hasPasswordProvider = isAuthenticated && userHasPasswordProvider(auth?.currentUser);

  const handleChangePassword = async (e) => {
    e?.preventDefault?.();
    setPasswordErr("");
    setPasswordMsg("");
    if (newPassword.length < 6) {
      setPasswordErr("Yeni şifre en az 6 karakter olmalı.");
      return;
    }
    if (newPassword !== confirmNewPassword) {
      setPasswordErr("Yeni şifreler eşleşmiyor.");
      return;
    }
    try {
      setPasswordBusy(true);
      await changeAccountPassword(currentPassword, newPassword);
      setCurrentPassword("");
      setNewPassword("");
      setConfirmNewPassword("");
      setPasswordMsg("Şifreniz güncellendi. Firestore güvenlik kaydı da yazıldı.");
    } catch (err) {
      const code = err?.code || "";
      if (code === "auth/wrong-password" || code === "auth/invalid-credential") {
        setPasswordErr("Mevcut şifre hatalı.");
      } else if (code === "auth/weak-password") {
        setPasswordErr("Yeni şifre çok zayıf (en az 6 karakter).");
      } else if (code === "same-password") {
        setPasswordErr("Yeni şifre mevcut şifreyle aynı olamaz.");
      } else if (code === "password-provider-missing") {
        setPasswordErr("Bu hesapta e-posta/şifre girişi yok (ör. yalnızca Google).");
      } else if (String(code).includes("requires-recent-login")) {
        setPasswordErr("Güvenlik için yeniden giriş yapıp tekrar deneyin.");
      } else {
        setPasswordErr(err?.message || "Şifre değiştirilemedi.");
      }
    } finally {
      setPasswordBusy(false);
    }
  };

  const handleSendPasswordReset = async () => {
    setPasswordErr("");
    setPasswordMsg("");
    const email = auth?.currentUser?.email || profile?.email;
    if (!email) {
      setPasswordErr("Hesap e-postası bulunamadı.");
      return;
    }
    try {
      setResetBusy(true);
      await requestPasswordReset(email);
      setPasswordMsg(
        `Sıfırlama bağlantısı ${email} adresine gönderildi. Gelen kutusu ve spam klasörünü kontrol edin.`
      );
    } catch (err) {
      const code = err?.code || "";
      if (code === "auth/too-many-requests") {
        setPasswordErr("Çok fazla deneme. Bir süre sonra tekrar deneyin.");
      } else {
        setPasswordErr(err?.message || "Sıfırlama e-postası gönderilemedi.");
      }
    } finally {
      setResetBusy(false);
    }
  };

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

  const needsPasswordForDelete = () => {
    const user = auth?.currentUser;
    if (!user) return false;
    return (user.providerData || []).some((p) => p.providerId === "password")
      && !(user.providerData || []).some((p) => p.providerId === "google.com");
  };

  const handleDeleteAccount = async () => {
    setDeleteError("");
    if (!deleteAck) {
      setDeleteError("Devam etmek için onayı işaretleyin.");
      return;
    }
    try {
      setIsDeletingAccount(true);
      const opts = {};
      if (needsPasswordForDelete()) {
        if (!deletePassword) {
          setDeleteError("E-posta hesabı için şifrenizi girin.");
          setIsDeletingAccount(false);
          return;
        }
        opts.password = deletePassword;
      }
      await deleteUserAccount(opts);
      window.location.href = "/?account=deleted";
    } catch (e) {
      console.error(e);
      const code = e?.code || e?.message || "";
      if (code === "password-required" || String(code).includes("password-required")) {
        setDeleteError("E-posta hesabı için şifrenizi girin.");
      } else if (String(code).includes("recent-login") || String(e?.message || "").includes("recent-login")) {
        setDeleteError("Güvenlik için yeniden giriş yapıp tekrar deneyin.");
      } else if (String(code).includes("popup-closed") || String(code).includes("cancelled")) {
        setDeleteError("Doğrulama iptal edildi.");
      } else {
        setDeleteError(e?.message || "Silme başarısız. info@memolandum.com");
      }
      setIsDeletingAccount(false);
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
          const data = docSnap.exists() ? docSnap.data() : {};
          const local = localStats || {};
          const localBreakdown = local.game_breakdown || {};
          const firestoreBreakdown = data.game_breakdown || {};

          const mergedBreakdown = { ...localBreakdown };
          Object.keys(firestoreBreakdown).forEach((gId) => {
            const l = localBreakdown[gId] || { score: 0, xp: 0, gems: 0 };
            const f = firestoreBreakdown[gId] || { score: 0, xp: 0, gems: 0 };
            mergedBreakdown[gId] = {
              score: Math.max(l.score || 0, f.score || 0),
              xp: Math.max(l.xp || 0, f.xp || 0),
              gems: Math.max(l.gems || 0, f.gems || 0),
            };
          });

          const merged = {
            total_score: Math.max(local.total_score || 0, Number(data.total_score) || 0),
            total_xp: Math.max(local.total_xp || 0, Number(data.total_xp) || 0),
            gems: Math.max(local.gems || 0, Number(data.gems) || 0),
            level: Math.max(local.level || 1, Number(data.level) || 1),
            game_breakdown: mergedBreakdown,
          };

          setGlobalStats(merged);
        }, (err) => {
          console.warn("Profile stats snapshot error:", err);
          setGlobalStats(localStats);
        });
        return () => unsub();
      } else {
        // Guest mode
        setGlobalStats(localStats);
      }
    }
  }, [mounted, isAuthenticated, uid, localStats]);

  if (!mounted) {
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

        {/* Bireysel Gelişim ve Öğrenme Grafikleri */}
        <section className="profile-section">
          <h2>📊 Bireysel Gelişim ve Öğrenme Analitiği</h2>
          <p className="text-gray-400 text-sm mb-6">
            Spaced Repetition (Aralıklı Tekrar) algoritması ve quiz pratik geçmişinize göre oluşan kişisel öğrenme profiliniz.
          </p>

          <div className="flex flex-col gap-6">
            {/* 7-Günlük Pratik Aktivitesi */}
            <RetroLineChart data={dailyHistory} />

            {/* Donut & Bar Charts */}
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
              <RetroRadialChart stageCounts={stageCounts} />
              <RetroBarChart stats={vaultStrengthStats} />
            </div>
          </div>
        </section>

        {/* Şifre & güvenlik */}
        {isAuthenticated && (
          <section className="profile-section border border-violet-500/20 bg-slate-900/60 p-6 rounded-2xl">
            <div className="border-b border-slate-800 pb-4 mb-4">
              <h2 className="!text-violet-300 !text-base !font-extrabold flex items-center gap-2 m-0">
                <span>🔐</span> ŞİFRE & GÜVENLİK
              </h2>
              <p className="text-gray-400 text-xs mt-1 leading-relaxed">
                Şifre değiştirme Firebase Auth üzerinden yapılır; olay kaydı Firestore{" "}
                <code className="text-violet-300/80">users/…/meta/security</code> altına yazılır.
              </p>
            </div>

            {hasPasswordProvider ? (
              <form onSubmit={handleChangePassword} className="space-y-3 max-w-md">
                <p className="text-xs text-slate-400 mb-1">
                  Oturum açıkken mevcut şifrenizle yeni şifre belirleyin.
                </p>
                <input
                  type="password"
                  autoComplete="current-password"
                  placeholder="Mevcut şifre"
                  value={currentPassword}
                  onChange={(e) => setCurrentPassword(e.target.value)}
                  className="w-full rounded-lg bg-slate-950 border border-white/10 px-3 py-2.5 text-sm text-white"
                  required
                />
                <input
                  type="password"
                  autoComplete="new-password"
                  placeholder="Yeni şifre (min. 6)"
                  value={newPassword}
                  onChange={(e) => setNewPassword(e.target.value)}
                  className="w-full rounded-lg bg-slate-950 border border-white/10 px-3 py-2.5 text-sm text-white"
                  required
                  minLength={6}
                />
                <input
                  type="password"
                  autoComplete="new-password"
                  placeholder="Yeni şifre (tekrar)"
                  value={confirmNewPassword}
                  onChange={(e) => setConfirmNewPassword(e.target.value)}
                  className="w-full rounded-lg bg-slate-950 border border-white/10 px-3 py-2.5 text-sm text-white"
                  required
                  minLength={6}
                />
                <button
                  type="submit"
                  disabled={passwordBusy}
                  className="px-5 py-2.5 bg-violet-600 hover:bg-violet-500 text-white font-bold rounded-xl text-xs transition-colors disabled:opacity-50"
                >
                  {passwordBusy ? "Güncelleniyor…" : "Şifreyi Değiştir"}
                </button>
              </form>
            ) : (
              <p className="text-sm text-slate-400 leading-relaxed mb-3">
                Bu hesapta e-posta/şifre girişi yok
                {auth?.currentUser?.providerData?.some((p) => p.providerId === "google.com")
                  ? " (Google ile giriş)."
                  : "."}{" "}
                Şifre Google / Apple hesabınızdan yönetilir. İsterseniz yine de sıfırlama
                e-postası deneyebilirsiniz (yalnızca e-posta/şifre bağlıysa işe yarar).
              </p>
            )}

            <div className="mt-5 pt-4 border-t border-slate-800/80 space-y-3">
              <p className="text-xs text-slate-500">
                Şifrenizi unuttuysanız e-posta ile sıfırlama bağlantısı gönderin. Bağlantı{" "}
                <span className="text-slate-400">/auth/action</span> sayfasında yeni şifre
                belirlemenizi ister.
              </p>
              <button
                type="button"
                disabled={resetBusy || !auth?.currentUser?.email}
                onClick={handleSendPasswordReset}
                className="px-5 py-2.5 bg-slate-800 hover:bg-slate-700 border border-violet-500/30 text-violet-200 font-bold rounded-xl text-xs transition-colors disabled:opacity-40"
              >
                {resetBusy ? "Gönderiliyor…" : "Şifre sıfırlama e-postası gönder"}
              </button>
              {passwordMsg && (
                <p className="text-xs text-emerald-300/90 bg-emerald-500/10 border border-emerald-500/30 rounded-lg px-3 py-2">
                  {passwordMsg}
                </p>
              )}
              {passwordErr && (
                <p className="text-xs text-red-300 bg-red-500/10 border border-red-500/30 rounded-lg px-3 py-2">
                  {passwordErr}
                </p>
              )}
            </div>
          </section>
        )}

        {/* Oturum & Çıkış Yap / Başka Profil Ekle */}
        {isAuthenticated && (
          <section className="profile-section border border-cyan-500/20 bg-slate-900/60 p-6 rounded-2xl mt-4">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-slate-800 pb-4 mb-4">
              <div>
                <h2 className="!text-cyan-300 !text-base !font-extrabold flex items-center gap-2 m-0">
                  <span>🔑</span> HESAP & PROFİL YÖNETİMİ
                </h2>
                <p className="text-gray-400 text-xs mt-1 leading-relaxed">
                  Şu anda <strong className="text-white">{profile?.displayName || profile?.email}</strong> hesabıyla giriş yapılmış durumda. Başka bir profil ile girmek veya yeni bir hesap eklemek için çıkış yapabilirsiniz.
                </p>
              </div>
            </div>

            <div className="flex flex-wrap items-center gap-3">
              <button
                type="button"
                disabled={isLoggingOut}
                onClick={handleLogout}
                className="px-5 py-2.5 bg-gradient-to-r from-red-600 to-rose-700 hover:from-red-500 hover:to-rose-600 text-white font-bold rounded-xl text-xs shadow-md shadow-red-900/30 transition-all flex items-center gap-2 active:scale-95 cursor-pointer"
              >
                <span>🚪</span>
                <span>{isLoggingOut ? "Çıkış Yapılıyor..." : "Güvenli Çıkış Yap"}</span>
              </button>

              <button
                type="button"
                onClick={async () => {
                  await handleLogout();
                }}
                className="px-5 py-2.5 bg-slate-800 hover:bg-slate-700 border border-slate-700 text-cyan-300 font-bold rounded-xl text-xs transition-colors flex items-center gap-2 cursor-pointer"
              >
                <span>➕</span>
                <span>Başka Bir Profil / Hesap Ekle</span>
              </button>
            </div>
          </section>
        )}

        {/* Premium — öğrenme bedava, AI çeviri ücretli */}
        <section className="profile-section border border-amber-500/20 mt-4">
          <h2 className="!text-amber-200/90 !text-sm">Premium · AI çeviri</h2>
          <p className="text-slate-400 text-sm mb-3 leading-relaxed">
            <strong className="text-emerald-300/90">Tüm Oyunlar & Seviyeler Ücretsiz</strong>.
            Gemini AI çeviri API maliyetli olduğu için üye hesabına özel ilk{" "}
            <strong>{FREE_TRANSLATION_QUOTA}</strong> çeviri ücretsiz; sonrası Premium.
          </p>
          {isPremium ? (
            <p className="text-amber-200 text-sm font-bold m-0">⭐ Premium aktif — AI çeviri fair-use kotanız açık.</p>
          ) : (
            <>
              <p className="text-slate-500 text-xs mb-3">
                Kalan ücretsiz çeviri:{" "}
                <strong className="text-cyan-300">
                  {remainingFreeTranslations(translationCount, isAuthenticated)}/{FREE_TRANSLATION_QUOTA}
                </strong>
                {" · "}
                {PREMIUM_PRODUCT.try.label} / {PREMIUM_PRODUCT.usd.label}
                {!PAYMENTS_LIVE && " · Shopier bağlantısı bekleniyor"}
              </p>
              <button
                type="button"
                onClick={() => setPremiumOpen(true)}
                className="px-4 py-2 rounded-lg text-sm font-black bg-amber-500/20 text-amber-100 border border-amber-400/40 hover:bg-amber-500/30"
              >
                Premium’u incele
              </button>
            </>
          )}
        </section>

        {/* Hesap silme — Privacy Policy / Play Store */}
        {isAuthenticated && (
          <section className="profile-section border border-red-500/10 mt-4">
            <h2 className="!text-red-300/80 !text-sm">Tehlikeli bölge</h2>
            <p className="text-slate-500 text-sm mb-4 leading-relaxed">
              Hesabınızı kalıcı silmek; kelime kasası, XP, dil profilleri, liderlik kaydı ve
              giriş bilginizi buluttan kaldırır. Bu işlem geri alınamaz.{" "}
              <a href="/legal/privacy/" className="text-cyan-500/80 hover:text-cyan-400 underline">
                Gizlilik Politikası
              </a>
            </p>
            {!showDeleteConfirm ? (
              <button
                type="button"
                onClick={() => {
                  setShowDeleteConfirm(true);
                  setDeleteError("");
                  setDeleteAck(false);
                  setDeletePassword("");
                }}
                className="text-xs text-red-400/80 hover:text-red-300 underline underline-offset-4 transition-colors"
              >
                Hesabımı kalıcı olarak sil…
              </button>
            ) : (
              <div className="rounded-xl border border-red-500/30 bg-red-950/40 p-4 space-y-3">
                <label className="flex items-start gap-2 text-sm text-red-100/90 cursor-pointer">
                  <input
                    type="checkbox"
                    checked={deleteAck}
                    onChange={(e) => setDeleteAck(e.target.checked)}
                    className="mt-1"
                  />
                  <span>
                    Anlıyorum: tüm bulut verim ve hesabım silinecek; bu geri alınamaz.
                  </span>
                </label>
                {needsPasswordForDelete() && (
                  <input
                    type="password"
                    autoComplete="current-password"
                    placeholder="Hesap şifreniz"
                    value={deletePassword}
                    onChange={(e) => setDeletePassword(e.target.value)}
                    className="w-full rounded-lg bg-slate-900 border border-white/10 px-3 py-2 text-sm text-white"
                  />
                )}
                {!needsPasswordForDelete() && (
                  <p className="text-xs text-slate-400">
                    Google hesabı kullanıyorsanız onay penceresi açılacak (yeniden doğrulama).
                  </p>
                )}
                {deleteError && (
                  <p className="text-xs text-red-300">{deleteError}</p>
                )}
                <div className="flex flex-wrap gap-2">
                  <button
                    type="button"
                    onClick={() => setShowDeleteConfirm(false)}
                    disabled={isDeletingAccount}
                    className="px-3 py-2 rounded-lg text-sm font-bold bg-slate-700 text-white hover:bg-slate-600 disabled:opacity-50"
                  >
                    Vazgeç
                  </button>
                  <button
                    type="button"
                    disabled={isDeletingAccount || !deleteAck}
                    onClick={handleDeleteAccount}
                    className="px-3 py-2 rounded-lg text-sm font-bold bg-red-600 text-white hover:bg-red-500 disabled:opacity-40"
                  >
                    {isDeletingAccount ? "Siliniyor…" : "Evet, hesabımı sil"}
                  </button>
                </div>
              </div>
            )}
          </section>
        )}

        <p className="text-center text-xs text-slate-600 mt-8 mb-2">
          <a href="/legal/privacy/" className="text-slate-500 hover:text-cyan-400 mx-2">
            Gizlilik
          </a>
          <span className="text-slate-700">·</span>
          <a href="/legal/terms/" className="text-slate-500 hover:text-cyan-400 mx-2">
            Koşullar
          </a>
          <span className="text-slate-700">·</span>
          <a href="/legal/" className="text-slate-500 hover:text-cyan-400 mx-2">
            Yasal
          </a>
        </p>

      </div>

      {/* Auth Modal for Guests */}
      <AuthModal isOpen={isAuthModalOpen} onClose={() => setIsAuthModalOpen(false)} initialView="register" />
      <PremiumCheckoutModal open={premiumOpen} onClose={() => setPremiumOpen(false)} />

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
