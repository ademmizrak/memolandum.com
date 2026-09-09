"use client";

import React, { useEffect, useState } from "react";
import dynamic from "next/dynamic";
import Link from "next/link";
import AuthModal from "./AuthModal";
import MemolandumIcon from "./MemolandumIcon";
import LocaleSwitcher from "./LocaleSwitcher";
import PremiumCheckoutModal from "./premium/PremiumCheckoutModal";
import { PremiumNavChip } from "./premium/PremiumVisibility";
import { useMemolandumStore } from "../store/useMemolandumStore";
import { peekAuthOpenModal, logoutUser } from "../lib/firebase/authService";
import { useT } from "../lib/i18n/LocaleProvider";
import {
  FREE_TRANSLATION_QUOTA,
  GUEST_TRANSLATION_QUOTA,
  PAYMENTS_LIVE,
  PREMIUM_PRODUCT,
  remainingFreeTranslations,
} from "../lib/premium/config";
import "./header/site-chrome.css";

const QuickTranslateBar = dynamic(() => import("./QuickTranslateBar"), { ssr: false });
const GamesRightbar = dynamic(() => import("./arcade/GamesRightbar"), { ssr: false });

function IconStar(props) {
  return (
    <svg xmlns="http://www.w3.org/2000/svg" width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" aria-hidden {...props}>
      <polygon points="12 2 15.09 8.26 22 9.27 17 14.14 18.18 21.02 12 17.77 5.82 21.02 7 14.14 2 9.27 8.91 8.26 12 2" />
    </svg>
  );
}

function IconVault(props) {
  return (
    <svg xmlns="http://www.w3.org/2000/svg" width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" aria-hidden {...props}>
      <path d="M4 19.5A2.5 2.5 0 0 1 6.5 17H20" />
      <path d="M6.5 2H20v20H6.5A2.5 2.5 0 0 1 4 19.5v-15A2.5 2.5 0 0 1 6.5 2z" />
    </svg>
  );
}

function IconTranslate(props) {
  return (
    <svg xmlns="http://www.w3.org/2000/svg" width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" aria-hidden {...props}>
      <path d="M5 8l6 6M4 14l6-6 2 3M2 5h12M7 2v3M22 22l-5-10-5 10M14 18h6" />
    </svg>
  );
}

function IconFlask(props) {
  return (
    <svg xmlns="http://www.w3.org/2000/svg" width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" aria-hidden {...props}>
      <path d="M9 3h6v2H9zM8 7h8l-1 12a2 2 0 0 1-2 2h-2a2 2 0 0 1-2-2L8 7z" />
    </svg>
  );
}

function IconHeart(props) {
  return (
    <svg xmlns="http://www.w3.org/2000/svg" width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" aria-hidden {...props}>
      <path d="M20.84 4.61a5.5 5.5 0 0 0-7.78 0L12 5.67l-1.06-1.06a5.5 5.5 0 0 0-7.78 7.78l1.06 1.06L12 21.23l7.78-7.78 1.06-1.06a5.5 5.5 0 0 0 0-7.78z" />
    </svg>
  );
}

function IconPlay(props) {
  return (
    <svg xmlns="http://www.w3.org/2000/svg" width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" aria-hidden {...props}>
      <polygon points="5 3 19 12 5 21 5 3" />
    </svg>
  );
}

function IconGlobe(props) {
  return (
    <svg xmlns="http://www.w3.org/2000/svg" width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" aria-hidden {...props}>
      <circle cx="12" cy="12" r="10" />
      <path d="M2 12h20M12 2a15.3 15.3 0 0 1 4 10 15.3 15.3 0 0 1-4 10 15.3 15.3 0 0 1-4-10 15.3 15.3 0 0 1 4-10z" />
    </svg>
  );
}

function IconBookOpen(props) {
  return (
    <svg xmlns="http://www.w3.org/2000/svg" width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden {...props}>
      <path d="M2 3h6a4 4 0 0 1 4 4v14a3 3 0 0 0-3-3H2z" />
      <path d="M22 3h-6a4 4 0 0 0-4 4v14a3 3 0 0 1 3-3h7z" />
    </svg>
  );
}

function IconSchool(props) {
  return (
    <svg xmlns="http://www.w3.org/2000/svg" width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden {...props}>
      <path d="M22 10v6M2 10l10-5 10 5-10 5z" />
      <path d="M6 12v5c3 3 9 3 12 0v-5" />
    </svg>
  );
}

function goPlay() {
  const el = document.getElementById("basla");
  if (el) el.scrollIntoView({ behavior: "smooth", block: "start" });
  else window.location.href = "/#basla";
}

export default function Header() {
  const t = useT();
  const [isAuthModalOpen, setIsAuthModalOpen] = useState(false);
  const [authModalView, setAuthModalView] = useState("login");
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);
  const [premiumOpen, setPremiumOpen] = useState(false);
  const [mounted, setMounted] = useState(false);

  const {
    isAuthenticated,
    profile,
    globalStats,
    isEmailVerified,
    isPremium,
    translationCount,
    ensureDefaultStudyProfile,
  } = useMemolandumStore();

  const totalXp = globalStats?.total_xp || 0;
  const left = remainingFreeTranslations(translationCount || 0, isAuthenticated);

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

  useEffect(() => {
    if (!isMobileMenuOpen) return undefined;
    const onKey = (e) => {
      if (e.key === "Escape") setIsMobileMenuOpen(false);
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [isMobileMenuOpen]);

  const openAuthModal = (view) => {
    setAuthModalView(view);
    setIsAuthModalOpen(true);
  };

  const closeMenu = () => setIsMobileMenuOpen(false);

  const displayName =
    profile?.displayName || profile?.email?.split("@")[0] || t("nav.guest");
  const avatarLetter = (displayName || "M")[0].toUpperCase();

  return (
    <>
      <div className="mm-chrome">
        {/* Announcement strip */}
        <div
          className={`mm-chrome__announce${isPremium ? " mm-chrome__announce--premium" : ""}`}
        >
          <p className="mm-chrome__announce-text">
            {isPremium ? (
              <>
                <strong className="text-amber-200">Premium aktif</strong>
                <span className="text-slate-400"> — AI çeviri fair-use · oyunlar ücretsiz</span>
              </>
            ) : (
              <>
                <strong className="text-emerald-300">Oyunlar ücretsiz</strong>
                <span className="text-slate-500"> · </span>
                <strong className="text-cyan-300">AI çeviri</strong>
                <span className="text-slate-400">
                  {isAuthenticated
                    ? ` — ${left}/${FREE_TRANSLATION_QUOTA} ücretsiz`
                    : ` — misafir ${left}/${GUEST_TRANSLATION_QUOTA}`}
                </span>
                <span className="text-amber-200/80">
                  {" "}
                  · Premium {PREMIUM_PRODUCT.try.label}
                  {!PAYMENTS_LIVE ? " (ödeme bağlanıyor)" : ""}
                </span>
              </>
            )}
          </p>
          {!isPremium && (
            <button
              type="button"
              className="mm-chrome__announce-cta"
              onClick={() => setPremiumOpen(true)}
            >
              Premium
            </button>
          )}
        </div>

        <header className="mm-header">
          <div className="mm-header__inner">
            <Link href="/" className="mm-header__brand" onClick={closeMenu}>
              <MemolandumIcon size={40} />
              <div className="mm-header__brand-text">
                <span className="mm-header__brand-name">MEMOLANDUM</span>
                <button
                  type="button"
                  className="mm-header__brand-slogan"
                  onClick={(e) => {
                    e.preventDefault();
                    e.stopPropagation();
                    if (window.location.pathname === "/" || window.location.pathname === "") {
                      goPlay();
                    } else {
                      window.location.href = "/#basla";
                    }
                  }}
                >
                  {t("brand.slogan")}
                </button>
              </div>
            </Link>

            <nav className="mm-header__nav" aria-label="Ana menü">
              <div className="mm-header__nav-track">
                <Link href="/#basla" className="mm-nav-link mm-nav-link--play">
                  <IconPlay />
                  <span>{t("common.playNow") || "Oyna"}</span>
                </Link>
                <Link href="/games/" className="mm-nav-link">
                  <IconPlay />
                  <span>Oyunlar</span>
                </Link>
                <Link href="/learn/" className="mm-nav-link">
                  <IconGlobe />
                  <span>{t("nav.learn")}</span>
                </Link>
                <Link href="/leaderboard" className="mm-nav-link">
                  <IconStar />
                  <span>{t("nav.leaderboard")}</span>
                </Link>
                <Link href="/vocabulary" className="mm-nav-link">
                  <IconVault />
                  <span>{t("nav.vault")}</span>
                </Link>
                <Link href="/sozluk/" className="mm-nav-link">
                  <IconBookOpen />
                  <span>{t("nav.glossary")}</span>
                </Link>
                <Link href="/translate" className="mm-nav-link mm-nav-link--cyan">
                  <IconTranslate />
                  <span>{t("translate.label")}</span>
                </Link>
                <Link href="/schools" className="mm-nav-link text-indigo-300 hover:text-indigo-200">
                  <IconSchool />
                  <span>Okullar</span>
                </Link>
                <Link href="/about/" className="mm-nav-link" title={t("nav.science")}>
                  <IconFlask />
                  <span>{t("nav.science")}</span>
                </Link>
                <a
                  href="https://kreosus.com/httpsmemolandumcom/about"
                  target="_blank"
                  rel="noopener noreferrer"
                  className="mm-nav-link mm-nav-link--pink"
                >
                  <IconHeart />
                  <span>{t("nav.support")}</span>
                </a>
              </div>
            </nav>

            <div className="mm-header__actions">
              <div className="mm-xp" title="Toplam XP">
                <span className="mm-xp__bolt" aria-hidden>
                  ⚡
                </span>
                <span>{totalXp.toLocaleString()}</span>
              </div>

              {mounted && isAuthenticated && (!isEmailVerified || !profile?.displayName) && (
                <button
                  type="button"
                  className="mm-btn-warn"
                  onClick={() =>
                    openAuthModal(!isEmailVerified ? "verify" : "username")
                  }
                  title={!isEmailVerified ? "E-posta Onayı Gerekli" : "Kullanıcı Adı Belirle"}
                >
                  {!isEmailVerified ? t("nav.verifyEmail") : t("nav.setName")}
                </button>
              )}

              <Link href="/profile" className="mm-profile" title={displayName}>
                <div className="mm-profile__meta">
                  <span className="mm-profile__label">
                    {mounted && isAuthenticated ? t("nav.welcome") : t("nav.guestUser")}
                  </span>
                  <span className="mm-profile__name">{displayName}</span>
                </div>
                {profile?.photoURL ? (
                  <img
                    src={profile.photoURL}
                    alt=""
                    className="mm-avatar mm-avatar--img"
                  />
                ) : (
                  <div className="mm-avatar">{avatarLetter}</div>
                )}
              </Link>

              {mounted && !isAuthenticated && (
                <>
                  <button
                    type="button"
                    className="mm-btn-ghost"
                    onClick={() => openAuthModal("login")}
                  >
                    Giriş
                  </button>
                  <button
                    type="button"
                    className="mm-btn-primary"
                    onClick={() => openAuthModal("register")}
                  >
                    Üye Ol
                  </button>
                </>
              )}

              <PremiumNavChip onOpen={() => setPremiumOpen(true)} />
              <LocaleSwitcher compact />

              <button
                type="button"
                className={`mm-menu-toggle${isMobileMenuOpen ? " is-open" : ""}`}
                aria-label={isMobileMenuOpen ? "Menüyü kapat" : t("nav.menuOpen")}
                aria-expanded={isMobileMenuOpen}
                onClick={() => setIsMobileMenuOpen((v) => !v)}
              >
                <span />
                <span />
                <span />
              </button>
            </div>
          </div>

          <div className="mm-drawer" hidden={!isMobileMenuOpen}>
            <div className="mm-drawer__meta">
              <div className="mm-xp">
                <span className="mm-xp__bolt">⚡</span>
                <span>{totalXp.toLocaleString()} XP</span>
              </div>
              <LocaleSwitcher compact />
            </div>

            <Link href="/#basla" className="mm-drawer__link" onClick={closeMenu}>
              <IconPlay /> {t("common.playNow") || "Hemen Oyna"}
            </Link>
            <Link href="/games/" className="mm-drawer__link" onClick={closeMenu}>
              <IconPlay /> Oyun Kabukları
            </Link>
            <Link href="/learn/" className="mm-drawer__link" onClick={closeMenu}>
              <IconGlobe /> {t("nav.learn")}
            </Link>
            <Link href="/leaderboard" className="mm-drawer__link" onClick={closeMenu}>
              <IconStar /> {t("nav.leaderboard")}
            </Link>
            <Link href="/vocabulary" className="mm-drawer__link" onClick={closeMenu}>
              <IconVault /> {t("nav.vault")}
            </Link>
            <Link href="/sozluk/" className="mm-drawer__link" onClick={closeMenu}>
              <IconBookOpen /> {t("nav.glossary")}
            </Link>
            <Link
              href="/translate"
              className="mm-drawer__link mm-drawer__link--cyan"
              onClick={closeMenu}
            >
              <IconTranslate /> {t("translate.label")}
            </Link>
            <Link
              href="/premium/"
              className="mm-drawer__link mm-drawer__link--amber"
              onClick={closeMenu}
            >
              <IconStar /> Premium
            </Link>
            <Link
              href="/schools"
              className="mm-drawer__link text-indigo-400"
              onClick={closeMenu}
            >
              <IconSchool /> Okullar & Öğretmenler
            </Link>
            <Link href="/about/" className="mm-drawer__link" onClick={closeMenu}>
              <IconFlask /> {t("nav.science")}
            </Link>
            <Link href="/roadmap/" className="mm-drawer__link" onClick={closeMenu}>
              <IconGlobe /> Roadmap
            </Link>
            <Link href="/my-lexicon/" className="mm-drawer__link" onClick={closeMenu}>
              <IconVault /> My Lexicon
            </Link>
            <Link href="/profile" className="mm-drawer__link" onClick={closeMenu}>
              Profil
            </Link>
            <a
              href="https://kreosus.com/httpsmemolandumcom/about"
              target="_blank"
              rel="noopener noreferrer"
              className="mm-drawer__link mm-drawer__link--pink"
              onClick={closeMenu}
            >
              <IconHeart /> {t("nav.support")}
            </a>

            <div className="mm-drawer__actions">
              {mounted && isAuthenticated ? (
                <button
                  type="button"
                  className="mm-drawer__link mm-drawer__link--danger"
                  onClick={async () => {
                    closeMenu();
                    await logoutUser();
                    window.location.href = "/";
                  }}
                >
                  Çıkış Yap / Başka Hesap
                </button>
              ) : (
                <>
                  <button
                    type="button"
                    className="mm-btn-ghost"
                    onClick={() => {
                      closeMenu();
                      openAuthModal("login");
                    }}
                  >
                    Giriş Yap
                  </button>
                  <button
                    type="button"
                    className="mm-btn-primary"
                    onClick={() => {
                      closeMenu();
                      openAuthModal("register");
                    }}
                  >
                    Üye Ol
                  </button>
                </>
              )}
            </div>
          </div>
        </header>

        <QuickTranslateBar onOpenPremium={() => setPremiumOpen(true)} />
      </div>

      <AuthModal
        isOpen={isAuthModalOpen}
        onClose={() => setIsAuthModalOpen(false)}
        initialView={authModalView}
      />
      <PremiumCheckoutModal open={premiumOpen} onClose={() => setPremiumOpen(false)} />
      <GamesRightbar />
    </>
  );
}
