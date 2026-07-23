"use client";

import React, { useState, useEffect } from "react";
import AuthModal from "./AuthModal";
import { useMemolandumStore } from "../store/useMemolandumStore";
import { peekAuthOpenModal, logoutUser } from "../lib/firebase/authService";
import dynamic from "next/dynamic";
import Link from "next/link";
import MemolandumIcon from "./MemolandumIcon";
import LocaleSwitcher from "./LocaleSwitcher";
import { useT } from "../lib/i18n/LocaleProvider";
import { PremiumNavChip, PremiumValueStrip } from "./premium/PremiumVisibility";
import PremiumCheckoutModal from "./premium/PremiumCheckoutModal";

const QuickTranslateBar = dynamic(() => import("./QuickTranslateBar"), { ssr: false });

export default function Header() {
  const t = useT();
  const [isAuthModalOpen, setIsAuthModalOpen] = useState(false);
  const [authModalView, setAuthModalView] = useState('login');
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);
  const [premiumOpen, setPremiumOpen] = useState(false);
  const [mounted, setMounted] = useState(false);
  
  const { isAuthenticated, profile, globalStats, isEmailVerified, studyProfiles, activeStudyProfileId, ensureDefaultStudyProfile } = useMemolandumStore();
  const totalXp = globalStats?.total_xp || 0;
  const activeStudy = studyProfiles?.find((p) => p.id === activeStudyProfileId) || null;

  useEffect(() => {
    setMounted(true);
    ensureDefaultStudyProfile?.();
  }, [ensureDefaultStudyProfile]);

  useEffect(() => {
    const pending = peekAuthOpenModal();
    if (pending === "username" || pending === "login") {
      setAuthModalView(pending);
      setIsAuthModalOpen(true);
    }
  }, []);

  const openAuthModal = (view) => {
    setAuthModalView(view);
    setIsAuthModalOpen(true);
  };

  return (
    <>
      <div className="sticky-chrome">
      <header className="modern-header">
        <div className="header-container">
          {/* Sol Bölüm: Logo — slogan oyuna, bilim ayrı küçük link */}
          <div className="logo-area">
            <Link href="/" className="logo-area-link" style={{ display: "flex", alignItems: "center", gap: "inherit", textDecoration: "none", color: "inherit" }}>
              <MemolandumIcon size={52} />
              <div className="logo-text">
                <span className="brand-name">MEMOLANDUM</span>
                <button
                  type="button"
                  className="brand-slogan hover:text-cyan-400 transition-colors"
                  onClick={(e) => {
                    e.preventDefault();
                    e.stopPropagation();
                    const go = () => {
                      const el = document.getElementById("basla");
                      if (el) el.scrollIntoView({ behavior: "smooth", block: "start" });
                      else window.location.href = "/#basla";
                    };
                    if (window.location.pathname === "/" || window.location.pathname === "") go();
                    else window.location.href = "/#basla";
                  }}
                >
                  {t("brand.slogan")}
                </button>
              </div>
            </Link>
          </div>

          {/* Orta Bölüm: Navigasyon Linkleri (Masaüstü) */}
          <nav className="nav-menu" aria-label="Ana menü">
            <Link href="/leaderboard" className="nav-item">
              <svg xmlns="http://www.w3.org/2000/svg" width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" className="nav-icon" aria-hidden><polygon points="12 2 15.09 8.26 22 9.27 17 14.14 18.18 21.02 12 17.77 5.82 21.02 7 14.14 2 9.27 8.91 8.26 12 2"></polygon></svg>
              <span>{t("nav.leaderboard")}</span>
            </Link>
            <Link href="/vocabulary" className="nav-item">
              <svg xmlns="http://www.w3.org/2000/svg" width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" className="nav-icon" aria-hidden><path d="M12 2l3.09 6.26L22 9.27l-5 4.87 1.18 6.88L12 17.77l-6.18 3.25L7 14.14 2 9.27l6.91-1.01L12 2z"/></svg>
              <span>{t("nav.vault")}</span>
            </Link>
            <Link href="/translate" className="nav-item nav-item--cyan">
              <svg xmlns="http://www.w3.org/2000/svg" width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" className="nav-icon" aria-hidden><path d="M5 8l6 6M4 14l6-6 2 3M2 5h12M7 2v3M22 22l-5-10-5 10M14 18h6"/></svg>
              <span>AI Çeviri</span>
            </Link>
            <Link href="/premium/" className="nav-item nav-item--amber">
              <svg xmlns="http://www.w3.org/2000/svg" width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" className="nav-icon" aria-hidden><path d="M12 2l3.09 6.26L22 9.27l-5 4.87 1.18 6.88L12 17.77l-6.18 3.25L7 14.14 2 9.27l6.91-1.01L12 2z"/></svg>
              <span>Premium</span>
            </Link>
            <Link href="/about/" className="nav-item" title={t("nav.science")}>
              <svg xmlns="http://www.w3.org/2000/svg" width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" className="nav-icon" aria-hidden><path d="M9 3h6v2H9zM8 7h8l-1 12a2 2 0 0 1-2 2h-2a2 2 0 0 1-2-2L8 7z"/></svg>
              <span>{t("nav.science")}</span>
            </Link>
            <a
              href="https://kreosus.com/httpsmemolandumcom/about"
              target="_blank"
              rel="noopener noreferrer"
              className="nav-item nav-item--pink"
            >
              <svg xmlns="http://www.w3.org/2000/svg" width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" className="nav-icon" aria-hidden><path d="M20.84 4.61a5.5 5.5 0 0 0-7.78 0L12 5.67l-1.06-1.06a5.5 5.5 0 0 0-7.78 7.78l1.06 1.06L12 21.23l7.78-7.78 1.06-1.06a5.5 5.5 0 0 0 0-7.78z"></path></svg>
              <span>{t("nav.support")}</span>
            </a>
          </nav>

          {/* Sağ Bölüm: Kullanıcı Profil ve XP Alanı */}
          <div className="user-action-area">
            <div className="xp-badge">
              <span className="xp-bolt">⚡</span>
              <span className="xp-text">{totalXp.toLocaleString()} XP</span>
            </div>
            {activeStudy && (
              <Link
                href="/profile"
                className="hidden sm:inline-flex items-center gap-1.5 px-2.5 py-1 rounded-lg border border-cyan-500/25 bg-cyan-500/10 text-cyan-200 text-[11px] font-bold no-underline hover:bg-cyan-500/20"
                title={t("nav.langProfile")}
              >
                <span aria-hidden>🌐</span>
                {activeStudy.label}
              </Link>
            )}
            
            {(mounted && isAuthenticated) ? (
              <div className="flex items-center gap-3">
                {(!isEmailVerified || !profile?.displayName) && (
                  <button 
                    onClick={() => openAuthModal(!isEmailVerified ? 'verify' : 'username')}
                    className="text-amber-500 hover:text-amber-400 bg-amber-500/10 px-2 py-1 rounded-md text-xs font-bold border border-amber-500/20 transition-colors hidden sm:flex items-center gap-1"
                    title={!isEmailVerified ? "E-posta Onayı Gerekli" : "Kullanıcı Adı Belirle"}
                  >
                    <svg className="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" /></svg>
                    {!isEmailVerified ? t("nav.verifyEmail") : t("nav.setName")}
                  </button>
                )}
                
                <div className="user-profile-dropdown flex items-center gap-2">
                  <Link href="/profile" style={{ textDecoration: 'none' }}>
                    <div className="profile-trigger">
                      <div className="user-info">
                        <span className="user-welcome">{t("nav.welcome")}</span>
                        <span className="user-name truncate max-w-[120px]">{profile?.displayName || profile?.email?.split('@')[0]}</span>
                      </div>
                      {profile?.photoURL ? (
                        <img src={profile.photoURL} alt="Profil" className="avatar-image-circle" />
                      ) : (
                        <div className="avatar-circle">
                          {(profile?.displayName || profile?.email || 'U')[0].toUpperCase()}
                        </div>
                      )}
                    </div>
                  </Link>

                  <button
                    type="button"
                    onClick={async () => {
                      await logoutUser();
                      window.location.href = "/";
                    }}
                    className="hidden lg:flex items-center gap-1.5 px-3 py-1.5 bg-red-500/10 hover:bg-red-500/20 border border-red-500/30 hover:border-red-500/60 text-red-400 hover:text-red-300 rounded-xl text-xs font-bold transition-all shadow-sm cursor-pointer whitespace-nowrap"
                    title="Çıkış Yap / Başka Profil Ekle"
                  >
                    <svg className="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 16l4-4m0 0l-4-4m4 4H7m6 4v1a3 3 0 01-3 3H6a3 3 0 01-3-3V7a3 3 0 013-3h4a3 3 0 013 3v1" />
                    </svg>
                    <span>Çıkış Yap</span>
                  </button>
                </div>
              </div>
            ) : (
              <div className="flex items-center gap-2">
                <div className="user-profile-dropdown">
                  <Link href="/profile" style={{ textDecoration: 'none' }}>
                    <div className="profile-trigger">
                      <div className="user-info">
                        <span className="user-welcome">{t("nav.guestUser")}</span>
                        <span className="user-name truncate max-w-[100px]">{profile?.displayName || t("nav.guest")}</span>
                      </div>
                      {profile?.photoURL ? (
                        <img src={profile.photoURL} alt="Profil" className="avatar-image-circle" />
                      ) : (
                        <div className="avatar-circle">
                          {(profile?.displayName || 'M')[0].toUpperCase()}
                        </div>
                      )}
                    </div>
                  </Link>
                </div>
                <button 
                  onClick={() => openAuthModal('login')}
                  className="desktop-only-btn text-sm font-bold text-gray-300 hover:text-white px-3 py-1.5 rounded-lg transition-colors hover:bg-white/5 border border-dark-600"
                >
                  Giriş
                </button>
                <button 
                  onClick={() => openAuthModal('register')}
                  className="desktop-only-btn bg-gradient-to-r from-cyan-500 to-blue-500 hover:from-cyan-400 hover:to-blue-400 text-white text-sm font-bold px-4 py-1.5 rounded-lg transition-colors shadow-lg shadow-cyan-500/20"
                >
                  Üye Ol
                </button>
              </div>
            )}

            <PremiumNavChip onOpen={() => setPremiumOpen(true)} />
            <LocaleSwitcher compact />

            {/* Mobil Menü Butonu (Hamburger) */}
            <button 
              className={`mobile-menu-toggle ${isMobileMenuOpen ? 'open' : ''}`} 
              id="mobileMenuBtn" 
              aria-label={t("nav.menuOpen")}
              onClick={() => setIsMobileMenuOpen(!isMobileMenuOpen)}
            >
              <span></span>
              <span></span>
              <span></span>
            </button>
          </div>
        </div>

        {/* Mobil Dropdown Menü */}
        {isMobileMenuOpen && (
          <div className="mobile-dropdown-menu">
            <Link href="/leaderboard" className="mobile-nav-item" onClick={() => setIsMobileMenuOpen(false)}>
              <svg xmlns="http://www.w3.org/2000/svg" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><polygon points="12 2 15.09 8.26 22 9.27 17 14.14 18.18 21.02 12 17.77 5.82 21.02 7 14.14 2 9.27 8.91 8.26 12 2"></polygon></svg>
              {t("nav.leaderboard")}
            </Link>
            <Link href="/vocabulary" className="mobile-nav-item" onClick={() => setIsMobileMenuOpen(false)}>
              <svg xmlns="http://www.w3.org/2000/svg" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M12 2l3.09 6.26L22 9.27l-5 4.87 1.18 6.88L12 17.77l-6.18 3.25L7 14.14 2 9.27l6.91-1.01L12 2z"/></svg>
              {t("nav.vault")}
            </Link>
            <Link href="/translate" className="mobile-nav-item text-cyan-400" onClick={() => setIsMobileMenuOpen(false)}>
              <svg xmlns="http://www.w3.org/2000/svg" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M5 8l6 6M4 14l6-6 2 3M2 5h12M7 2v3M22 22l-5-10-5 10M14 18h6"/></svg>
              AI Çeviri Stüdyosu
            </Link>
            <Link href="/premium/" className="mobile-nav-item text-amber-300" onClick={() => setIsMobileMenuOpen(false)}>
              <svg xmlns="http://www.w3.org/2000/svg" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M12 2l3.09 6.26L22 9.27l-5 4.87 1.18 6.88L12 17.77l-6.18 3.25L7 14.14 2 9.27l6.91-1.01L12 2z"/></svg>
              Premium — Üyelik
            </Link>
            <Link href="/#basla" className="mobile-nav-item text-emerald-300" onClick={() => setIsMobileMenuOpen(false)}>
              <svg xmlns="http://www.w3.org/2000/svg" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><polygon points="5 3 19 12 5 21 5 3"></polygon></svg>
              {t("common.playNow")}
            </Link>
            <Link href="/about/" className="mobile-nav-item" onClick={() => setIsMobileMenuOpen(false)}>
              <svg xmlns="http://www.w3.org/2000/svg" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M9 3h6v2H9zM8 7h8l-1 12a2 2 0 0 1-2 2h-2a2 2 0 0 1-2-2L8 7z"/></svg>
              {t("nav.science")}
            </Link>
            <a
              href="https://kreosus.com/httpsmemolandumcom/about"
              target="_blank"
              rel="noopener noreferrer"
              className="mobile-nav-item text-pink-400"
              onClick={() => setIsMobileMenuOpen(false)}
            >
              <svg xmlns="http://www.w3.org/2000/svg" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M20.84 4.61a5.5 5.5 0 0 0-7.78 0L12 5.67l-1.06-1.06a5.5 5.5 0 0 0-7.78 7.78l1.06 1.06L12 21.23l7.78-7.78 1.06-1.06a5.5 5.5 0 0 0 0-7.78z"></path></svg>
              {t("nav.support")}
            </a>

            <div className="mobile-dropdown-divider border-t border-white/5 my-2" />
            
            {isAuthenticated ? (
              <div className="flex flex-col gap-1">
                <Link href="/profile" className="mobile-nav-item" onClick={() => setIsMobileMenuOpen(false)}>
                  <svg xmlns="http://www.w3.org/2000/svg" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><circle cx="12" cy="12" r="10"></circle><path d="M8 14s1.5 2 4 2 4-2 4-2"></path><line x1="9" y1="9" x2="9.01" y2="9"></line><line x1="15" y1="9" x2="15.01" y2="9"></line></svg>
                  {t("nav.profile") || "Profilim"}
                </Link>
                <button
                  type="button"
                  onClick={async () => {
                    setIsMobileMenuOpen(false);
                    await logoutUser();
                    window.location.href = "/";
                  }}
                  className="mobile-nav-item text-red-400 hover:text-red-300 w-full text-left font-bold"
                >
                  <svg xmlns="http://www.w3.org/2000/svg" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M9 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h4"></path><polyline points="16 17 21 12 16 7"></polyline><line x1="21" y1="12" x2="9" y2="12"></line></svg>
                  🚪 Çıkış Yap / Başka Hesap Ekle
                </button>
              </div>
            ) : (
              <div className="flex flex-col gap-2 p-3">
                <button
                  onClick={() => {
                    setIsMobileMenuOpen(false);
                    openAuthModal('login');
                  }}
                  className="w-full text-center text-sm font-bold text-gray-200 bg-slate-800 hover:bg-slate-700 border border-slate-700 py-2 rounded-lg transition-colors"
                >
                  Giriş Yap
                </button>
                <button
                  onClick={() => {
                    setIsMobileMenuOpen(false);
                    openAuthModal('register');
                  }}
                  className="w-full text-center text-sm font-bold text-white bg-gradient-to-r from-cyan-500 to-blue-500 hover:from-cyan-400 hover:to-blue-400 py-2 rounded-lg transition-colors shadow-lg shadow-cyan-500/10"
                >
                  Üye Ol
                </button>
              </div>
            )}
          </div>
        )}
        
        <style dangerouslySetInnerHTML={{ __html: `
/* --- HEADER ANA STİLLERİ --- */
.sticky-chrome {
  position: sticky;
  top: 0;
  z-index: 1000;
  width: 100%;
  /* iOS notch / safe area */
  padding-top: env(safe-area-inset-top, 0);
  background: rgba(15, 23, 42, 0.92);
}
.modern-header {
  position: relative;
  width: 100%;
  background: rgba(15, 23, 42, 0.75);
  backdrop-filter: blur(12px);
  -webkit-backdrop-filter: blur(12px);
  border-bottom: 1px solid rgba(79, 70, 229, 0.2);
  box-sizing: border-box;
  font-family: system-ui, -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif;
  transition: all 0.3s ease;
}

.header-container {
  max-width: 1400px;
  margin: 0 auto;
  padding: 14px 24px;
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 20px;
}

/* --- LOGO VE SLOGAN --- */
.logo-area {
  display: flex;
  align-items: center;
  gap: 12px;
  text-decoration: none;
  min-width: 200px;
}

.logo-icon {
  width: 40px;
  height: 40px;
  background: linear-gradient(135deg, #06b6d4 0%, #3b82f6 100%);
  border-radius: 10px;
  display: flex;
  align-items: center;
  justify-content: center;
  color: white;
  font-size: 22px;
  font-weight: 900;
  box-shadow: 0 0 15px rgba(6, 182, 212, 0.4);
  text-shadow: 0 2px 4px rgba(0,0,0,0.3);
}

.logo-text {
  display: flex;
  flex-direction: column;
}

.brand-name {
  color: white;
  font-size: 18px;
  font-weight: 900;
  letter-spacing: 1px;
  line-height: 1.1;
}

.brand-slogan {
  color: #94a3b8;
  font-size: 11px;
  font-weight: 600;
  letter-spacing: 0.5px;
  margin-top: 2px;
  background: none;
  border: none;
  padding: 0;
  cursor: pointer;
  text-align: left;
  font-family: inherit;
}

/* --- ORTA MENÜ --- */
.nav-menu {
  display: flex;
  flex-direction: row;
  flex-wrap: nowrap;
  align-items: center;
  gap: 2px;
  background: rgba(30, 41, 59, 0.5);
  padding: 4px;
  border-radius: 12px;
  border: 1px solid rgba(255,255,255,0.05);
}

.nav-item {
  display: inline-flex;
  flex-direction: row;
  flex-wrap: nowrap;
  align-items: center;
  gap: 6px;
  padding: 7px 11px;
  color: #cbd5e1;
  text-decoration: none;
  font-size: 13px;
  font-weight: 600;
  line-height: 1;
  white-space: nowrap;
  border-radius: 8px;
  transition: all 0.2s ease;
}

.nav-item span {
  white-space: nowrap;
}

.nav-item:hover {
  color: white;
  background: rgba(255,255,255,0.05);
}

.nav-item.active {
  background: rgba(6, 182, 212, 0.15);
  color: #22d3ee;
  border: 1px solid rgba(6, 182, 212, 0.2);
}

.nav-item--cyan { color: #22d3ee; }
.nav-item--cyan:hover { color: #67e8f9; }
.nav-item--amber { color: #fcd34d; }
.nav-item--amber:hover { color: #fde68a; }
.nav-item--pink { color: #f472b6; }
.nav-item--pink:hover { color: #f9a8d4; }

.nav-icon {
  opacity: 0.85;
  flex-shrink: 0;
}

@media (max-width: 1180px) {
  .nav-item {
    padding: 6px 8px;
    font-size: 12px;
    gap: 5px;
  }
}

/* --- KULLANICI / SAĞ BÖLÜM --- */
.user-action-area {
  display: flex;
  align-items: center;
  gap: 16px;
  min-width: 200px;
  justify-content: flex-end;
}

/* XP Göstergesi */
.xp-badge {
  display: flex;
  align-items: center;
  gap: 6px;
  background: rgba(234, 179, 8, 0.1);
  border: 1px solid rgba(234, 179, 8, 0.3);
  padding: 6px 12px;
  border-radius: 20px;
  box-shadow: 0 0 10px rgba(234, 179, 8, 0.1);
}

.xp-bolt {
  color: #eab308;
  font-size: 14px;
  animation: pulseBolt 2s infinite;
}

.xp-text {
  color: #fde047;
  font-weight: 800;
  font-size: 13px;
  letter-spacing: 0.5px;
}

/* Profil Alanı */
.profile-trigger {
  display: flex;
  align-items: center;
  gap: 12px;
  background: transparent;
  padding: 4px 12px 4px 4px;
  border-radius: 30px;
  transition: background 0.2s;
}

.profile-trigger:hover {
  background: rgba(255,255,255,0.05);
}

.avatar-circle {
  width: 36px;
  height: 36px;
  background: linear-gradient(135deg, #6366f1 0%, #8b5cf6 100%);
  border-radius: 50%;
  display: flex;
  align-items: center;
  justify-content: center;
  color: white;
  font-weight: bold;
  font-size: 16px;
  box-shadow: 0 0 10px rgba(139, 92, 246, 0.3);
}

.avatar-image-circle {
  width: 36px;
  height: 36px;
  border-radius: 50%;
  background: #4f46e5;
  border: 2px solid #38bdf8;
  object-fit: cover;
  box-shadow: 0 0 10px rgba(56, 189, 248, 0.3);
}

.user-info {
  display: flex;
  flex-direction: column;
  align-items: flex-end;
}

.user-welcome {
  font-size: 10px;
  color: #94a3b8;
  text-transform: uppercase;
  letter-spacing: 0.5px;
}

.user-name {
  font-size: 13px;
  font-weight: 700;
  color: white;
}

/* Mobil Hamburger Menü */
.mobile-menu-toggle {
  display: none;
  background: none;
  border: none;
  cursor: pointer;
  flex-direction: column;
  gap: 5px;
  padding: 4px;
}

.mobile-menu-toggle span {
  width: 24px;
  height: 2px;
  background: white;
  border-radius: 2px;
  transition: all 0.3s ease;
}

.mobile-menu-toggle.open span:nth-child(1) {
  transform: translateY(7px) rotate(45deg);
}
.mobile-menu-toggle.open span:nth-child(2) {
  opacity: 0;
}
.mobile-menu-toggle.open span:nth-child(3) {
  transform: translateY(-7px) rotate(-45deg);
}

.mobile-dropdown-menu {
  display: none; /* Mobilde açılacak */
  flex-direction: column;
  background: rgba(15, 23, 42, 0.95);
  border-top: 1px solid rgba(79, 70, 229, 0.2);
  padding: 10px 0;
}

.mobile-nav-item {
  display: flex;
  align-items: center;
  gap: 12px;
  padding: 14px 24px;
  color: #cbd5e1;
  text-decoration: none;
  font-size: 16px;
  font-weight: 600;
  border-bottom: 1px solid rgba(255,255,255,0.05);
}

.mobile-nav-item:last-child {
  border-bottom: none;
}

.mobile-nav-item:hover, .mobile-nav-item:active {
  background: rgba(255,255,255,0.05);
  color: white;
}

/* --- RESPONSIVE TASARIM (Mobil) --- */
@media (max-width: 900px) {
  .nav-menu {
    display: none;
  }
  .mobile-menu-toggle {
    display: flex;
  }
  .mobile-dropdown-menu {
    display: flex;
  }
  .header-container {
    padding: 10px 14px;
    gap: 12px;
  }
  .user-action-area {
    gap: 8px;
    min-width: 0;
  }
  .xp-badge {
    padding: 5px 8px;
  }
  .xp-text {
    font-size: 12px;
  }
  .desktop-only-btn {
    display: none !important;
  }
}

@media (max-width: 600px) {
  .header-container {
    padding: 8px 12px;
  }
  .user-info {
    display: none;
  }
  .brand-slogan {
    display: none;
  }
  .logo-area {
    min-width: 0;
    gap: 8px;
  }
  .brand-name {
    font-size: 15px;
  }
  .avatar-circle,
  .avatar-image-circle {
    width: 32px;
    height: 32px;
  }
  .user-action-area button {
    font-size: 12px !important;
    padding: 6px 10px !important;
  }
}

@keyframes pulseBolt {
  0%, 100% { transform: scale(1); filter: drop-shadow(0 0 2px rgba(234,179,8,0.4)); }
  50% { transform: scale(1.15); filter: drop-shadow(0 0 8px rgba(234,179,8,0.8)); }
}
        `}} />
      </header>
      <PremiumValueStrip onOpenPremium={() => setPremiumOpen(true)} />
      <QuickTranslateBar onOpenPremium={() => setPremiumOpen(true)} />
      </div>
      
      <AuthModal isOpen={isAuthModalOpen} onClose={() => setIsAuthModalOpen(false)} initialView={authModalView} />
      <PremiumCheckoutModal open={premiumOpen} onClose={() => setPremiumOpen(false)} />
    </>
  );
}
