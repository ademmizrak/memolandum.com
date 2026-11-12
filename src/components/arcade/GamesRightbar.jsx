"use client";

import React, { useEffect, useState } from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { NEON_SHELLS } from "@/components/arcade/NeonArcadeShellPicker";
import { buildGameShellHref } from "@/lib/seo/arcadeShells";
import { useMemolandumStore } from "@/store/useMemolandumStore";
import { useStoreHydrated } from "@/hooks/useStoreHydrated";
import { findLevelContext } from "@/lib/learning/studyContext";
import { useLocale } from "@/lib/i18n/LocaleProvider";
import "./games-rightbar.css";

function isActiveGameplay(pathname) {
  if (!pathname) return false;
  const parts = pathname.split("/").filter(Boolean);
  // /games/shooter → gizle; /games → göster
  return parts[0] === "games" && Boolean(parts[1]);
}

export default function GamesRightbar() {
  const { locale, t } = useLocale();
  const isEn = locale === "en";
  const isAr = locale === "ar";
  const isPt = locale === "pt";
  const pathname = usePathname();
  const hydrated = useStoreHydrated();
  const [open, setOpen] = useState(false);
  const [expanded, setExpanded] = useState(false);

  const lastPlayedLang = useMemolandumStore((s) => s.lastPlayedLang);
  const lastPlayedLevel = useMemolandumStore((s) => s.lastPlayedLevel);
  const lastPlayedGame = useMemolandumStore((s) => s.lastPlayedGame);

  useEffect(() => {
    if (isActiveGameplay(pathname)) return;
    document.documentElement.classList.add("mm-has-games-rail");
    return () => document.documentElement.classList.remove("mm-has-games-rail");
  }, [pathname]);

  useEffect(() => {
    setOpen(false);
  }, [pathname]);

  if (isActiveGameplay(pathname)) return null;

  const levelCtx =
    hydrated && lastPlayedLevel ? findLevelContext(lastPlayedLevel) : null;

  const playCtx = {
    langId: lastPlayedLang || undefined,
    levelId: lastPlayedLevel || undefined,
  };

  const deskLabel = levelCtx
    ? `${levelCtx.langName} · ${levelCtx.levelName}`
    : isAr
      ? "لم يتم اختيار مستوى — العب على أي حال"
      : isPt
        ? "Nenhum nível selecionado — jogue mesmo assim"
        : isEn
          ? "No level selected — play anyway"
          : "Seviye seçilmedi — yine de oyna";

  return (
    <>
      <button
        type="button"
        className="mm-games-fab"
        aria-expanded={open}
        aria-controls="mm-games-rightbar"
        onClick={() => setOpen((v) => !v)}
      >
        <span className="mm-games-fab__glow" aria-hidden />
        <span className="mm-games-fab__icon" aria-hidden>
          🎮
        </span>{" "}
        <span className="mm-games-fab__label">{t("nav.games")}</span>
      </button>

      <aside
        id="mm-games-rightbar"
        className={`mm-games-rail ${open ? "is-open" : ""} ${expanded ? "is-expanded" : ""}`}
        onMouseEnter={() => setExpanded(true)}
        onMouseLeave={() => setExpanded(false)}
        aria-label={
          isAr
            ? "ألعاب الأركيد — تشغيل سريع"
            : isPt
              ? "Jogos arcade — acesso rápido"
              : isEn
                ? "Arcade shells — quick launch"
                : "Oyun kabukları — hızlı başlat"
        }
      >
        <div className="mm-games-rail__head">
          <span className="mm-games-rail__live" aria-hidden>
            ●
          </span>{" "}
          <div className="mm-games-rail__head-text">
            <strong>{isAr ? "الألعاب" : isPt ? "JOGOS" : isEn ? "GAMES" : "OYUNLAR"}</strong>{" "}
            <span>{isAr ? "تشغيل سريع" : isPt ? "Arcade rápido" : isEn ? "Quick arcade" : "Hızlı arcade"}</span>
          </div>
          <button
            type="button"
            className="mm-games-rail__close"
            aria-label={isAr ? "إغلاق" : isPt ? "Fechar" : isEn ? "Close" : "Kapat"}
            onClick={() => setOpen(false)}
          >
            ×
          </button>
        </div>

        <div className="mm-games-rail__desk" title={deskLabel}>
          <span className="mm-games-rail__desk-label">
            {isAr ? "مكتبك" : isPt ? "Sua Mesa" : isEn ? "Your Desk" : "Masan"}
          </span>{" "}
          <span className="mm-games-rail__desk-value">{deskLabel}</span>
          <div className="mm-games-rail__desk-links">
            <Link href="/learn/" onClick={() => setOpen(false)}>
              {isAr ? "المسارات" : isPt ? "Trilhas" : isEn ? "Pathways" : "Dil yolu"}
            </Link>{" "}
            <Link href="/#basla" onClick={() => setOpen(false)}>
              {isAr ? "اختر درساً" : isPt ? "Escolher aula" : isEn ? "Pick lesson" : "Ders seç"}
            </Link>
          </div>
        </div>

        <ul className="mm-games-rail__list">
          {NEON_SHELLS.map((shell) => {
            const href = buildGameShellHref(shell.id, playCtx);
            const active = lastPlayedGame === shell.id;
            const localizedName = t(`games.${shell.id}.name`, shell.name);
            const localizedBlurb = t(`games.${shell.id}.desc`, shell.blurb);
            return (
              <li key={shell.id}>
                <Link
                  href={href}
                  className={`mm-games-rail__item ${active ? "is-active" : ""}`}
                  style={{ "--neon": shell.neon, "--neon-rgb": shell.neonRgb }}
                  title={`${localizedName} — ${localizedBlurb}`}
                  onClick={() => setOpen(false)}
                >
                  <span className="mm-games-rail__avatar" aria-hidden>
                    {shell.avatar}
                  </span>{" "}
                  <span className="mm-games-rail__meta">
                    <span className="mm-games-rail__name">{localizedName}</span>{" "}
                    <span className="mm-games-rail__blurb">{localizedBlurb}</span>
                  </span>{" "}
                  <span className="mm-games-rail__go" aria-hidden>
                    ▶
                  </span>
                </Link>
              </li>
            );
          })}
        </ul>

        <Link
          href="/games/"
          className="mm-games-rail__all"
          onClick={() => setOpen(false)}
        >
          {isAr ? "جميع الألعاب ←" : isPt ? "Todos os jogos →" : isEn ? "All games →" : "Tüm oyunlar →"}
        </Link>
      </aside>

      {open && (
        <button
          type="button"
          className="mm-games-rail__backdrop"
          aria-label={t("nav.menuClose")}
          onClick={() => setOpen(false)}
        />
      )}
    </>
  );
}
