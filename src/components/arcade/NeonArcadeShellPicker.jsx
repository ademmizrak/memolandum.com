"use client";

import React from "react";
import Link from "next/link";
import { buildGameShellHref } from "@/lib/seo/arcadeShells";
import { resolveManifestLangId } from "@/lib/seo/learnPathwayResolve";
import { useLocale } from "@/lib/i18n/LocaleProvider";
import { useMemolandumStore } from "@/store/useMemolandumStore";

/** Neon kabuk kataloğu — ikon + avatar + glow */
export const NEON_SHELLS = [
  {
    id: "shooter",
    tag: "SPACE SHOOTER",
    name: "Retro Shooter",
    blurb: "Meteordaki kelimeleri vurarak eşle.",
    avatar: "🚀",
    neon: "#22d3ee",
    neonRgb: "34,211,238",
    Icon: ShooterIcon,
  },
  {
    id: "breakout",
    tag: "BRICK BREAKER",
    name: "Breakout DX-Ball",
    blurb: "Tuğlaları kırarak kelimeleri eşle.",
    avatar: "💥",
    neon: "#f472b6",
    neonRgb: "244,114,182",
    Icon: BreakoutIcon,
  },
  {
    id: "highway",
    tag: "LANE RACER",
    name: "Highway Survivor",
    blurb: "Doğru şeritte sür, kelimeyi yakala.",
    avatar: "🏎️",
    neon: "#facc15",
    neonRgb: "250,204,21",
    Icon: HighwayIcon,
  },
  {
    id: "invaders",
    tag: "NEON SHMUP",
    name: "Siberian Invaders",
    blurb: "İstilacı formasyonları vur.",
    avatar: "👾",
    neon: "#c084fc",
    neonRgb: "192,132,252",
    Icon: InvadersIcon,
  },
  {
    id: "wordascent",
    tag: "VERTICAL CLIMBER",
    name: "The Word Ascent",
    blurb: "Platformlarda zıplayarak tırman.",
    avatar: "🧗",
    neon: "#34d399",
    neonRgb: "52,211,153",
    Icon: AscentIcon,
  },
  {
    id: "worddrop",
    tag: "DIKEY TETRIS",
    name: "Reverse Word Drop",
    blurb: "Blokları yerleştir, eşleştir.",
    avatar: "🧱",
    neon: "#fb7185",
    neonRgb: "251,113,133",
    Icon: DropIcon,
  },
  {
    id: "quiz",
    tag: "QUIZ BLAST",
    name: "Retro Quiz",
    blurb: "Çoktan seçmeli active recall.",
    avatar: "⚡",
    neon: "#fbbf24",
    neonRgb: "251,191,36",
    Icon: QuizIcon,
  },
  {
    id: "lexicon",
    tag: "TOKEN ARCADE",
    name: "Lexicon Tokens",
    blurb: "Kart çevir: kelime, ses, anlam.",
    avatar: "🃏",
    neon: "#a3e635",
    neonRgb: "163,230,53",
    Icon: LexiconIcon,
  },
  {
    id: "hangman",
    tag: "WORD GUESS",
    name: "Retro Hangman",
    blurb: "Harf harf tahmin et.",
    avatar: "🎯",
    neon: "#fb923c",
    neonRgb: "251,146,60",
    Icon: HangmanIcon,
  },
  {
    id: "word-snake",
    tag: "RETRO SNAKE",
    name: "Retro Yılan",
    blurb: "Harfleri yiyerek kelimeyi tamamla.",
    avatar: "🐍",
    neon: "#4ade80",
    neonRgb: "74,222,128",
    Icon: SnakeIcon,
  },
  {
    id: "academic-shooter",
    tag: "ACADEMIC ARENA",
    name: "Academic Shooter",
    blurb: "Akademik kelimeleri uzay arenasında hedefle.",
    avatar: "🎓",
    neon: "#38bdf8",
    neonRgb: "56,189,248",
    Icon: ShooterIcon,
  },
  {
    id: "academic-lexicon",
    tag: "ACADEMIC DECK",
    name: "Academic Lexicon",
    blurb: "Akademik terimleri kartlarla hızlıca özümse.",
    avatar: "📚",
    neon: "#a78bfa",
    neonRgb: "167,139,250",
    Icon: LexiconIcon,
  },
  {
    id: "word-card",
    tag: "INTERACTIVE FLIP",
    name: "Kelime Kartı",
    blurb: "Görsel ve sesli interaktif kelime kartları.",
    avatar: "🎴",
    neon: "#06b6d4",
    neonRgb: "6,182,212",
    Icon: CardIcon,
  },
  {
    id: "word-board",
    tag: "GARDEN BOARD",
    name: "Ahşap Kelime Panosu",
    blurb: "Güneşli bahçede 8'li ahşap pano üzerinde sesli kelime avı.",
    avatar: "🌳",
    neon: "#22c55e",
    neonRgb: "34,197,94",
    Icon: CardIcon,
  },
  {
    id: "star-cards",
    tag: "STAR TRIO CARDS",
    name: "Yıldız Kartlar",
    blurb: "Güneşli çayırda 3 renkli karttan doğru kelimeyi seç, yıldızları patlat.",
    avatar: "⭐",
    neon: "#facc15",
    neonRgb: "250,204,21",
    Icon: CardIcon,
  },
  {
    id: "orbitlex",
    tag: "ORBITAL RUNNER",
    name: "OrbitLex",
    blurb: "Gezegen yörüngesinde eş ve zıt anlam kristallerini topla.",
    avatar: "🪐",
    neon: "#818cf8",
    neonRgb: "129,140,248",
    Icon: OrbitIcon,
  },
];

/**
 * @param {{ pathway?: string, langId?: string, levelId?: string, compact?: boolean, title?: string }} props
 */
export default function NeonArcadeShellPicker({
  pathway = "",
  langId = "",
  levelId = "",
  compact = false,
  title,
  subtitle,
}) {
  const { locale, t } = useLocale();
  const isEn = locale === "en";
  const isAr = locale === "ar";
  const isPt = locale === "pt";
  const resolvedTitle =
    title || (isAr ? "ألعاب الأركيد" : isPt ? "JOGOS ARCADE" : isEn ? "ARCADE SHELLS" : "OYUN KABUKLARI");
  const resolvedSubtitle =
    subtitle ||
    (isAr
      ? "أركيد نيون · اختر اللعبة · العب واحفظ"
      : isPt
        ? "Arcade neon · escolha o jogo · jogue e memorize"
        : isEn
          ? "Neon arcade · icon · avatar · pick · play"
          : "Neon arcade · ikon · avatar · seç · oyna");
  const rawLang = langId || pathway || (isAr ? "ar-en" : "");
  const resolvedLangId = resolveManifestLangId(rawLang) || rawLang;
  const resolvedPathway = pathway || (isAr && !langId ? "ar-en" : "");
  const resolvedLevelId = levelId || (resolvedLangId ? "a1_words.json" : "");
  const ctx = { pathway: resolvedPathway, langId: resolvedLangId, levelId: resolvedLevelId };

  const handleShellSelect = (shellId) => {
    try {
      if (resolvedLangId && resolvedLevelId) {
        const state = useMemolandumStore.getState();
        if (typeof state?.setLastPlayed === "function") {
          state.setLastPlayed(resolvedLangId, resolvedLevelId, shellId);
        }
      }
    } catch {
      // Ignore storage sync errors
    }
  };

  const displayedShells = React.useMemo(() => {
    const list = [...NEON_SHELLS];
    const isSchool = levelId && (levelId.toLowerCase().includes("ilkokul") || levelId.toLowerCase().includes("ortaokul"));
    if (isSchool) {
      const scIdx = list.findIndex(s => s.id === 'star-cards');
      if (scIdx > -1) {
        const [sc] = list.splice(scIdx, 1);
        list.unshift(sc);
      }
      const wbIdx = list.findIndex(s => s.id === 'word-board');
      if (wbIdx > -1) {
        const [wb] = list.splice(wbIdx, 1);
        list.unshift(wb);
      }
      const idx = list.findIndex(s => s.id === 'word-card');
      if (idx > -1) {
        const [wc] = list.splice(idx, 1);
        list.unshift(wc);
      }
    }
    return list;
  }, [levelId]);

  return (
    <section
      className={`neon-arcade ${compact ? "neon-arcade--compact" : "neon-arcade--full"}`}
      aria-label={resolvedTitle}
    >
      <style dangerouslySetInnerHTML={{ __html: NEON_CSS }} />

      <div className="neon-arcade__header">
        <div className="neon-arcade__badge">
          <span className="neon-arcade__flame" aria-hidden>
            🔥
          </span>
          <span>ARCADE LIVE</span>
          <span className="neon-arcade__pulse-dot" aria-hidden />
        </div>
        <h2 className="neon-arcade__title">{resolvedTitle}</h2>
        <p className="neon-arcade__sub">{resolvedSubtitle}</p>
      </div>

      <ul className="neon-arcade__grid">
        {displayedShells.map((shell, i) => {
          const href = buildGameShellHref(shell.id, ctx);
          const Icon = shell.Icon;
          const localizedTag = t(`games.${shell.id}.category`, shell.tag);
          const localizedName = t(`games.${shell.id}.name`, shell.name);
          const localizedBlurb = t(`games.${shell.id}.desc`, shell.blurb);
          return (
            <li key={shell.id} style={{ "--neon": shell.neon, "--neon-rgb": shell.neonRgb, "--i": i }}>
              <Link
                href={href}
                rel={href.includes("?") ? "nofollow" : undefined}
                onClick={() => handleShellSelect(shell.id)}
                className="neon-shell"
              >
                <span className="neon-shell__ring" aria-hidden />
                <span className="neon-shell__glow" aria-hidden />
                <div className="neon-shell__avatar-wrap">
                  <span className="neon-shell__avatar" aria-hidden>
                    {shell.avatar}
                  </span>
                  <span className="neon-shell__icon">
                    <Icon />
                  </span>
                </div>
                <div className="neon-shell__body">
                  <span className="neon-shell__tag">{localizedTag}</span>
                  <span className="neon-shell__name">{localizedName}</span>
                  <span className="neon-shell__blurb">{localizedBlurb}</span>
                </div>
                <span className="neon-shell__cta">
                  {isAr ? "العب" : isPt ? "JOGAR" : isEn ? "PLAY" : "OYNA"}
                  <span className="neon-shell__cta-arrow rtl:scale-x-[-1]" aria-hidden>
                    →
                  </span>
                </span>
              </Link>
            </li>
          );
        })}
      </ul>
    </section>
  );
}

function ShooterIcon() {
  return (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" className="w-full h-full">
      <path d="M12 2S8 7 8 12c0 3 2 4 4 6 2-2 4-3 4-6 0-5-4-10-4-10z" fill="rgba(34,211,238,0.2)" />
      <path d="M8 12H4l2 3h2v-3zM16 12h4l-2 3h-2v-3z" fill="currentColor" opacity="0.7" />
      <path d="M12 18v4M10 19v2M14 19v2" stroke="#f97316" strokeWidth="2.5" />
    </svg>
  );
}
function BreakoutIcon() {
  return (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" className="w-full h-full">
      <rect x="2" y="3" width="6" height="3" rx="1" fill="currentColor" opacity="0.8" />
      <rect x="9" y="3" width="6" height="3" rx="1" opacity="0.35" />
      <rect x="16" y="3" width="6" height="3" rx="1" fill="currentColor" opacity="0.8" />
      <rect x="4" y="7" width="7" height="3" rx="1" fill="currentColor" opacity="0.7" />
      <rect x="13" y="7" width="7" height="3" rx="1" fill="currentColor" opacity="0.7" />
      <circle cx="10" cy="12" r="2" fill="currentColor" />
      <rect x="6" y="18" width="12" height="3" rx="1.5" fill="currentColor" opacity="0.85" />
    </svg>
  );
}
function HighwayIcon() {
  return (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" className="w-full h-full">
      <path d="M4 21L10 3M20 21L14 3" />
      <path d="M12 20v-3M12 14v-2M12 9V8" strokeWidth="1.5" opacity="0.8" />
      <rect x="9" y="13" width="6" height="5" rx="1" fill="rgba(250,204,21,0.2)" />
    </svg>
  );
}
function InvadersIcon() {
  return (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" className="w-full h-full">
      <path d="M4 8h2v2H4V8zm4 0h8V6H8v2zm10 0h2v2h-2V8zm-2 4h2v-2h-2v2zm-10 0H4v-2h2v2zm10 2v2H6v-2h12zm2 2v2h-2v-2h2zM4 16v2h2v-2H4zm6 4h4v-2h-4v2z" fill="rgba(192,132,252,0.25)" />
      <circle cx="9" cy="10" r="1" fill="currentColor" />
      <circle cx="15" cy="10" r="1" fill="currentColor" />
    </svg>
  );
}
function AscentIcon() {
  return (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" className="w-full h-full">
      <line x1="3" y1="19" x2="9" y2="19" />
      <line x1="8" y1="14" x2="14" y2="14" />
      <line x1="13" y1="9" x2="19" y2="9" />
      <path d="M19 4l1 2 2 1-2 1-1 2-1-2-2-1 2-1z" fill="currentColor" stroke="none" />
    </svg>
  );
}
function DropIcon() {
  return (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" className="w-full h-full">
      <rect x="2" y="17" width="5" height="5" rx="1" fill="currentColor" />
      <rect x="7" y="17" width="5" height="5" rx="1" fill="currentColor" />
      <rect x="12" y="12" width="5" height="5" rx="1" fill="currentColor" />
      <rect x="12" y="17" width="5" height="5" rx="1" fill="currentColor" />
      <rect x="7" y="4" width="5" height="5" rx="1" opacity="0.4" />
      <rect x="7" y="9" width="5" height="5" rx="1" opacity="0.55" />
    </svg>
  );
}
function QuizIcon() {
  return (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" className="w-full h-full">
      <path d="M9.09 9a3 3 0 0 1 5.83 1c0 2-3 3-3 3" />
      <circle cx="12" cy="17" r="1.25" fill="currentColor" />
    </svg>
  );
}
function LexiconIcon() {
  return (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" className="w-full h-full">
      <rect x="4" y="5" width="14" height="14" rx="2" fill="rgba(163,230,53,0.2)" />
      <line x1="7" y1="9" x2="15" y2="9" strokeWidth="2" />
      <line x1="7" y1="12" x2="12" y2="12" />
      <line x1="7" y1="15" x2="10" y2="15" />
    </svg>
  );
}
function HangmanIcon() {
  return (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" className="w-full h-full">
      <path d="M4 21h10M6 21V3h8v3" />
      <circle cx="14" cy="11.5" r="2.5" fill="rgba(251,146,60,0.2)" />
      <path d="M14 14v4M12 15h4" strokeWidth="2" />
    </svg>
  );
}
function SnakeIcon() {
  return (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3" className="w-full h-full">
      <path d="M4 18h6V12H4V6h14v4" fill="none" strokeLinecap="round" />
      <circle cx="18" cy="15" r="2" fill="currentColor" strokeWidth="2" />
    </svg>
  );
}
function CardIcon() {
  return (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" className="w-full h-full">
      <rect x="3" y="3" width="18" height="18" rx="2" fill="rgba(6,182,212,0.15)" />
      <rect x="7" y="7" width="10" height="10" rx="1" fill="currentColor" opacity="0.6" />
      <circle cx="12" cy="12" r="1.5" fill="#020617" />
    </svg>
  );
}
function OrbitIcon() {
  return (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" className="w-full h-full">
      <circle cx="12" cy="12" r="4" fill="rgba(99,102,241,0.2)" stroke="currentColor" />
      <ellipse cx="12" cy="12" rx="9" ry="3.5" stroke="currentColor" strokeWidth="1.5" transform="rotate(-25 12 12)" />
      <circle cx="18" cy="9" r="1.5" fill="#f59e0b" stroke="#f59e0b" />
    </svg>
  );
}

const NEON_CSS = `
.neon-arcade {
  --panel: rgba(8,12,24,0.92);
  position: relative;
  border-radius: 1.25rem;
  padding: 1.1rem 1rem 1.15rem;
  background:
    radial-gradient(ellipse 80% 50% at 50% -10%, rgba(34,211,238,0.18), transparent 55%),
    linear-gradient(160deg, rgba(15,23,42,0.98), rgba(7,11,20,0.98));
  border: 1px solid rgba(255,255,255,0.08);
  box-shadow:
    0 0 0 1px rgba(34,211,238,0.08) inset,
    0 20px 50px rgba(0,0,0,0.45);
  overflow: hidden;
}
.neon-arcade::before {
  content: "";
  position: absolute;
  inset: -40% -20% auto;
  height: 70%;
  background: conic-gradient(from 120deg, transparent, rgba(34,211,238,0.12), transparent 40%, rgba(168,85,247,0.1), transparent 70%);
  animation: neon-spin-slow 14s linear infinite;
  pointer-events: none;
}
.neon-arcade__header {
  position: relative;
  z-index: 1;
  margin-bottom: 0.9rem;
}
.neon-arcade__badge {
  display: inline-flex;
  align-items: center;
  gap: 0.4rem;
  font-size: 9px;
  font-weight: 800;
  letter-spacing: 0.18em;
  color: #67e8f9;
  text-transform: uppercase;
  margin-bottom: 0.45rem;
  padding: 0.28rem 0.55rem;
  border-radius: 999px;
  background: rgba(34,211,238,0.1);
  border: 1px solid rgba(34,211,238,0.35);
  box-shadow: 0 0 18px rgba(34,211,238,0.25);
}
.neon-arcade__flame {
  display: inline-block;
  animation: neon-flicker 1.2s ease-in-out infinite;
}
.neon-arcade__pulse-dot {
  width: 6px;
  height: 6px;
  border-radius: 50%;
  background: #22d3ee;
  box-shadow: 0 0 10px #22d3ee;
  animation: neon-blink 1.4s ease-in-out infinite;
}
.neon-arcade__title {
  margin: 0;
  font-size: 0.95rem;
  font-weight: 900;
  letter-spacing: 0.14em;
  color: #fff;
  text-shadow:
    0 0 12px rgba(34,211,238,0.55),
    0 0 28px rgba(168,85,247,0.35);
}
.neon-arcade__sub {
  margin: 0.35rem 0 0;
  font-size: 11px;
  color: #94a3b8;
}
.neon-arcade__grid {
  position: relative;
  z-index: 1;
  list-style: none;
  margin: 0;
  padding: 0;
  display: grid;
  gap: 0.65rem;
}
.neon-arcade--full .neon-arcade__grid {
  grid-template-columns: repeat(1, minmax(0, 1fr));
  gap: 0.85rem;
}
@media (min-width: 640px) {
  .neon-arcade--full .neon-arcade__grid {
    grid-template-columns: repeat(2, minmax(0, 1fr));
  }
}
@media (min-width: 1024px) {
  .neon-arcade--full .neon-arcade__grid {
    grid-template-columns: repeat(3, minmax(0, 1fr));
  }
  .neon-arcade--full {
    padding: 1.5rem;
  }
  .neon-arcade--full .neon-arcade__title {
    font-size: 1.35rem;
  }
}
.neon-shell {
  --n: var(--neon);
  position: relative;
  display: grid;
  grid-template-columns: auto 1fr auto;
  align-items: center;
  gap: 0.7rem;
  padding: 0.7rem 0.75rem;
  border-radius: 1rem;
  text-decoration: none;
  color: inherit;
  background: linear-gradient(135deg, rgba(15,23,42,0.95), rgba(2,6,23,0.9));
  border: 1px solid rgba(var(--neon-rgb), 0.28);
  box-shadow:
    0 0 0 1px rgba(var(--neon-rgb), 0.08) inset,
    0 0 22px rgba(var(--neon-rgb), 0.08);
  transition: transform 0.25s ease, border-color 0.25s ease, box-shadow 0.25s ease;
  animation: neon-enter 0.55s ease both;
  animation-delay: calc(var(--i) * 45ms);
  overflow: hidden;
}
.neon-arcade--full .neon-shell {
  grid-template-columns: 1fr;
  grid-template-rows: auto auto auto;
  justify-items: start;
  min-height: 168px;
  padding: 1rem 1rem 0.9rem;
  gap: 0.55rem;
}
.neon-shell:hover {
  transform: translateY(-3px) scale(1.015);
  border-color: rgba(var(--neon-rgb), 0.75);
  box-shadow:
    0 0 0 1px rgba(var(--neon-rgb), 0.35) inset,
    0 0 28px rgba(var(--neon-rgb), 0.35),
    0 12px 28px rgba(0,0,0,0.35);
}
.neon-shell__glow {
  position: absolute;
  inset: auto -20% -40%;
  height: 70%;
  background: radial-gradient(circle, rgba(var(--neon-rgb), 0.35), transparent 65%);
  opacity: 0.45;
  pointer-events: none;
  transition: opacity 0.25s ease;
}
.neon-shell:hover .neon-shell__glow { opacity: 0.9; }
.neon-shell__ring {
  position: absolute;
  inset: -1px;
  border-radius: inherit;
  pointer-events: none;
  background: conic-gradient(from calc(var(--i) * 36deg), transparent, rgba(var(--neon-rgb), 0.55), transparent 35%);
  opacity: 0;
  mix-blend-mode: screen;
  animation: neon-spin-slow 6s linear infinite;
  mask: linear-gradient(#000 0 0) content-box, linear-gradient(#000 0 0);
  -webkit-mask-composite: xor;
  mask-composite: exclude;
  padding: 1px;
}
.neon-shell:hover .neon-shell__ring { opacity: 0.85; }
.neon-shell__avatar-wrap {
  position: relative;
  width: 48px;
  height: 48px;
  flex-shrink: 0;
}
.neon-arcade--full .neon-shell__avatar-wrap {
  width: 58px;
  height: 58px;
}
.neon-shell__avatar {
  position: absolute;
  inset: 0;
  display: grid;
  place-items: center;
  font-size: 1.35rem;
  border-radius: 14px;
  background: rgba(var(--neon-rgb), 0.12);
  border: 1px solid rgba(var(--neon-rgb), 0.4);
  box-shadow: 0 0 16px rgba(var(--neon-rgb), 0.35);
  animation: neon-bob 2.8s ease-in-out infinite;
  animation-delay: calc(var(--i) * 0.12s);
  z-index: 1;
}
.neon-shell:hover .neon-shell__avatar {
  animation: neon-spin-avatar 0.85s ease;
}
.neon-shell__icon {
  position: absolute;
  inset: 8px;
  color: var(--n);
  opacity: 0;
  transform: scale(0.6) rotate(-20deg);
  transition: opacity 0.25s ease, transform 0.35s ease;
  filter: drop-shadow(0 0 8px rgba(var(--neon-rgb), 0.9));
  z-index: 2;
}
.neon-shell:hover .neon-shell__icon {
  opacity: 1;
  transform: scale(1) rotate(0deg);
}
.neon-shell:hover .neon-shell__avatar {
  opacity: 0.15;
}
.neon-shell__body {
  min-width: 0;
  position: relative;
  z-index: 1;
}
.neon-shell__tag {
  display: block;
  font-size: 8px;
  font-weight: 800;
  letter-spacing: 0.16em;
  color: var(--n);
  text-shadow: 0 0 10px rgba(var(--neon-rgb), 0.65);
  margin-bottom: 0.15rem;
}
.neon-shell__name {
  display: block;
  font-size: 0.84rem;
  font-weight: 900;
  color: #f8fafc;
  line-height: 1.2;
}
.neon-arcade--full .neon-shell__name { font-size: 1.05rem; }
.neon-shell__blurb {
  display: block;
  margin-top: 0.2rem;
  font-size: 10.5px;
  color: #94a3b8;
  line-height: 1.35;
}
.neon-shell__cta {
  position: relative;
  z-index: 1;
  display: inline-flex;
  align-items: center;
  gap: 0.25rem;
  padding: 0.4rem 0.55rem;
  border-radius: 0.65rem;
  font-size: 9px;
  font-weight: 900;
  letter-spacing: 0.12em;
  color: #020617;
  background: var(--n);
  box-shadow: 0 0 16px rgba(var(--neon-rgb), 0.55);
  white-space: nowrap;
}
.neon-arcade--full .neon-shell__cta {
  margin-top: auto;
  width: 100%;
  justify-content: center;
  padding: 0.55rem;
  font-size: 11px;
}
.neon-shell__cta-arrow {
  display: inline-block;
  transition: transform 0.2s ease;
}
.neon-shell:hover .neon-shell__cta-arrow {
  transform: translateX(3px);
}
@keyframes neon-spin-slow {
  to { transform: rotate(360deg); }
}
@keyframes neon-spin-avatar {
  from { transform: rotate(0deg) scale(1); }
  40% { transform: rotate(180deg) scale(1.08); }
  to { transform: rotate(360deg) scale(1); }
}
@keyframes neon-bob {
  0%, 100% { transform: translateY(0); }
  50% { transform: translateY(-3px); }
}
@keyframes neon-flicker {
  0%, 100% { opacity: 1; filter: brightness(1); }
  40% { opacity: 0.75; filter: brightness(1.35); }
  60% { opacity: 1; filter: brightness(0.9); }
}
@keyframes neon-blink {
  0%, 100% { opacity: 1; transform: scale(1); }
  50% { opacity: 0.35; transform: scale(0.75); }
}
@keyframes neon-enter {
  from { opacity: 0; transform: translateY(10px) scale(0.97); }
  to { opacity: 1; transform: translateY(0) scale(1); }
}
@media (prefers-reduced-motion: reduce) {
  .neon-arcade::before,
  .neon-shell__ring,
  .neon-shell__avatar,
  .neon-arcade__flame,
  .neon-arcade__pulse-dot,
  .neon-shell {
    animation: none !important;
  }
  .neon-shell:hover { transform: none; }
}
`;
