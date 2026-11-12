"use client";

import React, { useEffect, useState } from "react";
import { useMemolandumStore } from "../../../store/useMemolandumStore";

/**
 * Dil bağımsız (metinsiz / RTL-Arapça dostu) İlk Etkileşim İpucu (Textless Onboarding Hint).
 * Seviye 1 başladığında kullanıcı ilk 3 saniye boyunca ekrana dokunmazsa / aksiyon almazsa,
 * hedef kelimenin veya aksiyon alanının üzerinde parlayan bir el/dokunma (tap/pulse) animasyonu gösterir.
 */
export function TextlessOnboardingHint({ idleDelayMs = 3000, positionClass = "bottom-24 right-10 md:bottom-1/3 md:right-1/2 md:translate-x-1/2" }) {
  const completedLevels = useMemolandumStore((s) => s.completedLevels ?? 0);
  const [showHint, setShowHint] = useState(false);
  const [hasInteracted, setHasInteracted] = useState(false);

  useEffect(() => {
    if ((Number(completedLevels) || 0) > 0 || hasInteracted) {
      setShowHint(false);
      return undefined;
    }

    let timerId = window.setTimeout(() => {
      setShowHint(true);
    }, idleDelayMs);

    const handleUserAction = () => {
      setHasInteracted(true);
      setShowHint(false);
      if (timerId) {
        window.clearTimeout(timerId);
        timerId = null;
      }
    };

    window.addEventListener("pointerdown", handleUserAction, { passive: true });
    window.addEventListener("touchstart", handleUserAction, { passive: true });
    window.addEventListener("keydown", handleUserAction, { passive: true });

    return () => {
      if (timerId) window.clearTimeout(timerId);
      window.removeEventListener("pointerdown", handleUserAction);
      window.removeEventListener("touchstart", handleUserAction);
      window.removeEventListener("keydown", handleUserAction);
    };
  }, [completedLevels, hasInteracted, idleDelayMs]);

  if (!showHint || hasInteracted) return null;

  return (
    <div
      aria-hidden="true"
      className={`pointer-events-none fixed ${positionClass} z-[60] flex items-center justify-center select-none`}
    >
      <div className="relative flex items-center justify-center w-24 h-24">
        {/* Dış parlayan dalga halkaları (Tap / Pulse Ripple) */}
        <span className="absolute inset-0 rounded-full border-2 border-cyan-400/80 bg-cyan-400/15 animate-ping" />
        <span
          className="absolute inset-3 rounded-full border-2 border-amber-400/90 bg-amber-400/20 animate-pulse shadow-[0_0_30px_rgba(34,211,238,0.85)]"
        />
        {/* Evrensel metinsiz dokunma / el ikonu */}
        <div className="relative z-10 flex items-center justify-center w-14 h-14 rounded-full bg-slate-950/90 border-2 border-cyan-300 shadow-[0_0_25px_rgba(6,182,212,0.9)] animate-bounce">
          <span className="text-3xl leading-none drop-shadow-[0_0_10px_rgba(255,255,255,0.9)]">
            👆
          </span>
        </div>
      </div>
    </div>
  );
}

/**
 * Hızlı Geçiş Kancası (Next Level Hook) için çok dilli odaklanmış buton metni.
 */
export function getNextLevelHookCopy(langId = "", nextWordCount = 5) {
  let uiLang = "tr";
  if (typeof window !== "undefined") {
    try {
      uiLang = (
        document?.documentElement?.lang ||
        localStorage.getItem("memolandum-ui-locale") ||
        navigator?.language ||
        "tr"
      ).toLowerCase();
    } catch {
      uiLang = "tr";
    }
  }

  const cleanLangId = String(langId || "").toLowerCase();
  if (uiLang.startsWith("ar") || cleanLangId.startsWith("ar-") || cleanLangId.includes("_ar")) {
    return {
      badge: "✨ 3/3",
      cta: `🚀 انتقل إلى المستوى 2 (${nextWordCount} كلمات)`,
      sub: "تقدم سريع · بدون توقف",
    };
  }
  if (uiLang.startsWith("pt") || cleanLangId.startsWith("pt-") || cleanLangId.includes("portugal")) {
    return {
      badge: "✨ 3/3",
      cta: `🚀 IR PARA O NÍVEL 2 (${nextWordCount} PALAVRAS)`,
      sub: "Fluxo Rápido · Continue Jogando",
    };
  }
  if (uiLang.startsWith("en") && !cleanLangId.includes("tr")) {
    return {
      badge: "✨ 3/3",
      cta: `🚀 START LEVEL 2 (${nextWordCount} WORDS)`,
      sub: "Fast Flow · Keep Your Streak",
    };
  }
  return {
    badge: "✨ 3/3 TAMAMLANDI",
    cta: `🚀 SEVİYE 2'YE GEÇ (${nextWordCount} KELİME)`,
    sub: "Harika başlangıç! Hız kesmeden 2. seviyeye devam et.",
  };
}

export default TextlessOnboardingHint;
