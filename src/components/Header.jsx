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
import { useLocale } from "../lib/i18n/LocaleProvider";
import {
  FREE_TRANSLATION_QUOTA,
  GUEST_TRANSLATION_QUOTA,
  PAYMENTS_LIVE,
  PREMIUM_PRODUCT,
  remainingFreeTranslations,
  shouldHideExternalPayments,
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

function IconUser(props) {
  return (
    <svg xmlns="http://www.w3.org/2000/svg" width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden {...props}>
      <path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2" />
      <circle cx="12" cy="7" r="4" />
    </svg>
  );
}

function IconVideo(props) {
  return (
    <svg xmlns="http://www.w3.org/2000/svg" width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden {...props}>
      <path d="m16 13 5.223 3.482a.5.5 0 0 0 .777-.416V7.87a.5.5 0 0 0-.752-.432L16 10.5" />
      <rect x="2" y="6" width="14" height="12" rx="2" />
    </svg>
  );
}

function IconCrown(props) {
  return (
    <svg xmlns="http://www.w3.org/2000/svg" width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden {...props}>
      <path d="M11.562 3.266a.5.5 0 0 1 .876 0L15.39 8.87a1 1 0 0 0 1.516.294L21.183 5.5a.5.5 0 0 1 .798.519l-2.834 10.246a1 1 0 0 1-.956.734H5.81a1 1 0 0 1-.957-.734L2.02 6.02a.5.5 0 0 1 .798-.519l4.276 3.664a1 1 0 0 0 1.516-.294z" />
      <path d="M5 21h14" />
    </svg>
  );
}

function goPlay() {
  const el = document.getElementById("basla");
  if (el) el.scrollIntoView({ behavior: "smooth", block: "start" });
  else window.location.href = "/#basla";
}

export default function Header() {
  const { locale, t } = useLocale();
  const isEn = locale === "en";
  const isAr = locale === "ar";
  const isPt = locale === "pt";
  const [isAuthModalOpen, setIsAuthModalOpen] = useState(false);
  const [authModalView, setAuthModalView] = useState("login");
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);
  const [premiumOpen, setPremiumOpen] = useState(false);
  const [mounted, setMounted] = useState(false);
  const [hideExternalPay, setHideExternalPay] = useState(false);

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
    try {
      setHideExternalPay(shouldHideExternalPayments());
    } catch {
      setHideExternalPay(false);
    }
    ensureDefaultStudyProfile?.();
  }, [ensureDefaultStudyProfile]);

  useEffect(() => {
    const checkPendingModal = (customView) => {
      const pending = customView || peekAuthOpenModal();
      if (pending === "username" || pending === "login" || pending === "register" || pending === "verify") {
        setAuthModalView(pending);
        setIsAuthModalOpen(true);
      }
    };
    checkPendingModal();
    const onOpenModalEvent = (e) => {
      const targetView = e?.detail?.view;
      if (targetView) {
        peekAuthOpenModal(); // clear storage flag
        checkPendingModal(targetView);
      } else {
        checkPendingModal();
      }
    };
    window.addEventListener("mm:open-auth-modal", onOpenModalEvent);
    return () => {
      window.removeEventListener("mm:open-auth-modal", onOpenModalEvent);
    };
  }, []);

  useEffect(() => {
    if (!isMobileMenuOpen && !isAuthModalOpen && !premiumOpen) return undefined;
    const onKey = (e) => {
      if (e.key === "Escape") {
        setIsMobileMenuOpen(false);
      }
    };
    const onHardwareBack = (e) => {
      if (premiumOpen) {
        e.preventDefault();
        setPremiumOpen(false);
        return;
      }
      if (isAuthModalOpen) {
        e.preventDefault();
        setIsAuthModalOpen(false);
        return;
      }
      if (isMobileMenuOpen) {
        e.preventDefault();
        setIsMobileMenuOpen(false);
      }
    };
    window.addEventListener("keydown", onKey);
    window.addEventListener("mm:hardware-back", onHardwareBack);
    return () => {
      window.removeEventListener("keydown", onKey);
      window.removeEventListener("mm:hardware-back", onHardwareBack);
    };
  }, [isMobileMenuOpen, isAuthModalOpen, premiumOpen]);

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
                <strong className="text-amber-200">
                  {isAr ? "بريميوم مفعّل" : isPt ? "Premium ativo" : isEn ? "Premium active" : "Premium aktif"}
                </strong>
                <span className="text-slate-400">
                  {isAr
                    ? " — ترجمة الذكاء الاصطناعي · الألعاب مجانية"
                    : isPt
                      ? " — Tradução IA · jogos gratuitos"
                      : isEn
                        ? " — AI translate fair-use · games are free"
                        : " — AI çeviri fair-use · oyunlar ücretsiz"}
                </span>
              </>
            ) : (
              <>
                <strong className="text-emerald-300">
                  {isAr ? "الألعاب مجانية" : isPt ? "Jogos gratuitos" : isEn ? "Games are free" : "Oyunlar ücretsiz"}
                </strong>
                <span className="text-slate-500"> · </span>
                <strong className="text-cyan-300">
                  {isAr ? "ترجمة الذكاء الاصطناعي" : isPt ? "Tradução IA" : isEn ? "AI translate" : "AI çeviri"}
                </strong>
                <span className="text-slate-400">
                  {isAuthenticated
                    ? isAr
                      ? ` — ${left}/${FREE_TRANSLATION_QUOTA} مجاناً`
                      : isPt
                        ? ` — ${left}/${FREE_TRANSLATION_QUOTA} grátis`
                        : isEn
                          ? ` — ${left}/${FREE_TRANSLATION_QUOTA} free`
                          : ` — ${left}/${FREE_TRANSLATION_QUOTA} ücretsiz`
                    : isAr
                      ? ` — للضيف ${left}/${GUEST_TRANSLATION_QUOTA}`
                      : isPt
                        ? ` — convidado ${left}/${GUEST_TRANSLATION_QUOTA}`
                        : isEn
                          ? ` — guest ${left}/${GUEST_TRANSLATION_QUOTA}`
                          : ` — misafir ${left}/${GUEST_TRANSLATION_QUOTA}`}
                </span>
                {!hideExternalPay && (
                  <span className="text-amber-200/80">
                    {" "}
                    · Premium {isEn || isAr || isPt ? PREMIUM_PRODUCT.usd.label : PREMIUM_PRODUCT.try.label}
                    {!PAYMENTS_LIVE
                      ? isAr
                        ? " (جارٍ ربط الدفع)"
                        : isPt
                          ? " (conectando pagamento)"
                          : isEn
                            ? " (checkout connecting)"
                            : " (ödeme bağlanıyor)"
                      : ""}
                  </span>
                )}
              </>
            )}
          </p>
          {!hideExternalPay && (
            <div className="flex items-center gap-1.5 shrink-0">
              {!isPremium && (
                <a
                  href="https://www.shopier.com/49186522"
                  target="_blank"
                  rel="noopener noreferrer"
                  className="mm-chrome__announce-cta"
                >
                  👑 {t("nav.premium")}
                </a>
              )}
              <a
                href="https://kreosus.com/httpsmemolandumcom/about"
                target="_blank"
                rel="noopener noreferrer"
                className="mm-chrome__announce-cta mm-chrome__announce-cta--pink"
              >
                💖 {t("nav.support")}
              </a>
            </div>
          )}
        </div>

        <header className="mm-header">
          <div className="mm-header__inner">
            <Link href="/" className="mm-header__brand" onClick={closeMenu}>
              <MemolandumIcon size={40} />
              <div className="mm-header__brand-text">
                <span className="mm-header__brand-name">MEMOLANDUM</span>{" "}
                <span
                  role="button"
                  tabIndex={0}
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
                </span>
              </div>
            </Link>

            <nav className="mm-header__nav" aria-label={isAr ? "القائمة الرئيسية" : isPt ? "Navegação principal" : isEn ? "Main navigation" : "Ana menü"}>
              <div className="mm-header__nav-track">
                <Link key="nav-play" href="/#basla" className="mm-nav-link mm-nav-link--play">
                  <IconPlay />
                  <span>{t("common.playNow")}</span>
                </Link>
                <Link key="nav-games" href="/games/" className="mm-nav-link">
                  <IconPlay />
                  <span>{t("nav.games")}</span>
                </Link>
                <Link key="nav-quiz" href="/quiz/" className="mm-nav-link text-emerald-300 hover:text-emerald-200">
                  <IconBookOpen />
                  <span>{isAr ? "الاختبارات" : isPt ? "Simulados" : isEn ? "Quizzes" : "Deneme Quiz"}</span>
                </Link>
                <Link key="nav-learn" href="/learn/" className="mm-nav-link">
                  <IconGlobe />
                  <span>{t("nav.learn")}</span>
                </Link>
                <Link key="nav-videos" href="/videos/" className="mm-nav-link text-red-400 hover:text-red-300">
                  <IconVideo />
                  <span>{isAr ? "الفيديوهات" : isPt ? "Vídeos" : isEn ? "Videos" : "Videolar"}</span>
                </Link>
                <Link key="nav-leaderboard" href="/leaderboard/" className="mm-nav-link">
                  <IconStar />
                  <span>{t("nav.leaderboard")}</span>
                </Link>
                <Link key="nav-vault" href="/vocabulary/" className="mm-nav-link">
                  <IconVault />
                  <span>{t("nav.vault")}</span>
                </Link>
                <Link key="nav-glossary" href="/sozluk/" className="mm-nav-link">
                  <IconBookOpen />
                  <span>{t("nav.glossary")}</span>
                </Link>
                <Link key="nav-translate" href="/translate/" className="mm-nav-link mm-nav-link--cyan">
                  <IconTranslate />
                  <span>{t("translate.label")}</span>
                </Link>
                <Link key="nav-schools" href="/schools/" className="mm-nav-link text-indigo-300 hover:text-indigo-200">
                  <IconSchool />
                  <span>{t("nav.schools")}</span>
                </Link>
                <Link key="nav-about" href="/about/" className="mm-nav-link" title={t("nav.science")}>
                  <IconFlask />
                  <span>{t("nav.science")}</span>
                </Link>
                {(!hideExternalPay || isPremium) && (
                  <a
                    key="nav-premium"
                    href="https://www.shopier.com/49186522"
                    target="_blank"
                    rel="noopener noreferrer"
                    className="mm-nav-link mm-nav-link--amber"
                  >
                    <IconCrown />
                    <span>{t("nav.premium")}</span>
                  </a>
                )}
                {!hideExternalPay && (
                  <a
                    key="nav-support"
                    href="https://kreosus.com/httpsmemolandumcom/about"
                    target="_blank"
                    rel="noopener noreferrer"
                    className="mm-nav-link mm-nav-link--pink"
                  >
                    <IconHeart />
                    <span>{t("nav.support")}</span>
                  </a>
                )}
              </div>
            </nav>

            <div className="mm-header__actions">
              <div
                className="mm-xp"
                title={
                  isAr
                    ? "إجمالي نقاط الخبرة (XP)"
                    : isEn
                      ? "Total experience points (XP)"
                      : "Toplam deneyim puanı (XP) — jeton değildir"
                }
                aria-label={`${isAr ? "الإجمالي" : isEn ? "Total" : "Toplam"} ${totalXp.toLocaleString()} XP`}
              >
                <span className="mm-xp__bolt" aria-hidden>
                  ⚡
                </span>{" "}
                <span>
                  {totalXp.toLocaleString()}{" "}
                  <span className="mm-xp__unit">XP</span>
                </span>
              </div>

              {mounted && isAuthenticated && (!isEmailVerified || !profile?.displayName) && (
                <button
                  type="button"
                  className="mm-btn-warn"
                  onClick={() =>
                    openAuthModal(!isEmailVerified ? "verify" : "username")
                  }
                  title={!isEmailVerified ? t("nav.verifyEmail") : t("nav.setName")}
                >
                  {!isEmailVerified ? t("nav.verifyEmail") : t("nav.setName")}
                </button>
              )}

              <Link href="/profile/" className="mm-profile" title={displayName}>
                <div className="mm-profile__meta">
                  <span className="mm-profile__label">
                    {mounted && isAuthenticated ? t("nav.welcome") : t("nav.guestUser")}
                  </span>{" "}
                  <span className="mm-profile__name">{displayName}</span>
                </div>{" "}
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
                    {t("nav.login")}
                  </button>{" "}
                  <button
                    type="button"
                    className="mm-btn-primary"
                    onClick={() => openAuthModal("register")}
                  >
                    {t("nav.signup")}
                  </button>
                </>
              )}

              <PremiumNavChip onOpen={() => setPremiumOpen(true)} />{" "}
              <LocaleSwitcher compact />

              <button
                type="button"
                className={`mm-menu-toggle${isMobileMenuOpen ? " is-open" : ""}`}
                aria-label={isMobileMenuOpen ? t("nav.menuClose") : t("nav.menuOpen")}
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
                <span className="mm-xp__bolt">⚡</span>{" "}
                <span>{totalXp.toLocaleString()} XP</span>
              </div>{" "}
              <LocaleSwitcher compact />
            </div>

            {mounted && !isAuthenticated && (
              <div className="mm-drawer__guest-banner">
                <span className="mm-drawer__guest-badge">{t("nav.guestBadge")}</span>
                <p className="mm-drawer__guest-text">
                  {t("nav.guestBannerText")}
                </p>
                <div className="mm-drawer__guest-btns">
                  <button
                    type="button"
                    className="mm-btn-primary"
                    onClick={() => {
                      closeMenu();
                      openAuthModal("register");
                    }}
                  >
                    {t("nav.signup")}
                  </button>{" "}
                  <button
                    type="button"
                    className="mm-btn-ghost"
                    onClick={() => {
                      closeMenu();
                      openAuthModal("login");
                    }}
                  >
                    {t("nav.loginFull")}
                  </button>
                </div>
              </div>
            )}

            <Link key="drawer-play" href="/#basla" className="mm-drawer__link" onClick={closeMenu}>
              <IconPlay /> <span>{t("common.playNow")}</span>
            </Link>
            <Link key="drawer-games" href="/games/" className="mm-drawer__link" onClick={closeMenu}>
              <IconPlay /> <span>{t("nav.games")}</span>
            </Link>
            <Link key="drawer-quiz" href="/quiz/" className="mm-drawer__link text-emerald-300" onClick={closeMenu}>
              <IconBookOpen /> <span>{isAr ? "الاختبارات التجريبية" : isPt ? "Simulados (2º–8º Ano)" : isEn ? "Practice Quizzes (2–8)" : "Deneme Quizleri (2–8. Sınıf)"}</span>
            </Link>
            <Link key="drawer-learn" href="/learn/" className="mm-drawer__link" onClick={closeMenu}>
              <IconGlobe /> <span>{t("nav.learn")}</span>
            </Link>
            <Link key="drawer-videos" href="/videos/" className="mm-drawer__link text-red-400" onClick={closeMenu}>
              <IconVideo /> <span>{isAr ? "الفيديوهات" : isPt ? "Vídeos" : isEn ? "Videos" : "Videolar"}</span>
            </Link>
            <Link key="drawer-leaderboard" href="/leaderboard/" className="mm-drawer__link" onClick={closeMenu}>
              <IconStar /> <span>{t("nav.leaderboard")}</span>
            </Link>
            <Link key="drawer-vault" href="/vocabulary/" className="mm-drawer__link" onClick={closeMenu}>
              <IconVault /> <span>{t("nav.vault")}</span>
            </Link>
            <Link key="drawer-glossary" href="/sozluk/" className="mm-drawer__link" onClick={closeMenu}>
              <IconBookOpen /> <span>{t("nav.glossary")}</span>
            </Link>
            <Link
              key="drawer-translate"
              href="/translate/"
              className="mm-drawer__link mm-drawer__link--cyan"
              onClick={closeMenu}
            >
              <IconTranslate /> <span>{t("translate.label")}</span>
            </Link>
            {(!hideExternalPay || isPremium) && (
              <a
                key="drawer-premium"
                href="https://www.shopier.com/49186522"
                target="_blank"
                rel="noopener noreferrer"
                className="mm-drawer__link mm-drawer__link--amber"
                onClick={closeMenu}
              >
                <IconCrown /> <span>{t("nav.premium")}</span>
              </a>
            )}
            <Link
              key="drawer-schools"
              href="/schools/"
              className="mm-drawer__link text-indigo-400"
              onClick={closeMenu}
            >
              <IconSchool /> <span>{t("nav.schools")}</span>
            </Link>
            <Link key="drawer-about" href="/about/" className="mm-drawer__link" onClick={closeMenu}>
              <IconFlask /> <span>{t("nav.science")}</span>
            </Link>
            <Link key="drawer-roadmap" href="/roadmap/" className="mm-drawer__link" onClick={closeMenu}>
              <IconGlobe /> <span>{t("nav.roadmap")}</span>
            </Link>
            <Link key="drawer-mylexicon" href="/my-lexicon/" className="mm-drawer__link" onClick={closeMenu}>
              <IconVault /> <span>{t("nav.myLexicon")}</span>
            </Link>
            <Link key="drawer-profile" href="/profile/" className="mm-drawer__link" onClick={closeMenu}>
              <IconUser /> <span>{t("nav.profile")}</span>
            </Link>
            {!hideExternalPay && (
              <a
                key="drawer-support"
                href="https://kreosus.com/httpsmemolandumcom/about"
                target="_blank"
                rel="noopener noreferrer"
                className="mm-drawer__link mm-drawer__link--pink"
                onClick={closeMenu}
              >
                <IconHeart /> <span>{t("nav.support")}</span>
              </a>
            )}

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
                  {t("nav.logoutSwitch")}
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
                    {t("nav.loginFull")}
                  </button>{" "}
                  <button
                    type="button"
                    className="mm-btn-primary"
                    onClick={() => {
                      closeMenu();
                      openAuthModal("register");
                    }}
                  >
                    {t("nav.signup")}
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
