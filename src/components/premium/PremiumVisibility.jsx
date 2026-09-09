"use client";

import React, { useState } from "react";
import Link from "next/link";
import { Crown, Sparkles, BookOpen, Languages } from "lucide-react";
import { useMemolandumStore } from "../../store/useMemolandumStore";
import {
  FREE_TRANSLATION_QUOTA,
  GUEST_TRANSLATION_QUOTA,
  PAYMENTS_LIVE,
  PREMIUM_PRODUCT,
  remainingFreeTranslations,
} from "../../lib/premium/config";
import PremiumCheckoutModal from "./PremiumCheckoutModal";

/**
 * Enterprise Premium görünürlük — web + mobil.
 * Öğrenme bedava mesajını net tutar; AI çeviriyi Premium’a bağlar.
 */
export function PremiumNavChip({ onOpen }) {
  const isPremium = useMemolandumStore((s) => s.isPremium);
  if (isPremium) {
    return (
      <Link
        href="/premium/"
        className="inline-flex items-center gap-1 px-2 py-1 rounded-md text-[10px] font-black tracking-wider bg-amber-500/15 text-amber-200 border border-amber-400/30 no-underline"
      >
        <Crown size={12} /> PREMIUM
      </Link>
    );
  }
  return null;
}

export function PremiumValueStrip({ onOpenPremium }) {
  const isPremium = useMemolandumStore((s) => s.isPremium);
  const isAuthenticated = useMemolandumStore((s) => s.isAuthenticated);
  const translationCount = useMemolandumStore((s) => s.translationCount) || 0;
  const left = remainingFreeTranslations(translationCount, isAuthenticated);

  return (
    <div
      className={`premium-value-strip${isPremium ? " premium-value-strip--active" : ""}`}
    >
      {isPremium ? (
        <>
          <Crown size={14} className="text-amber-300 shrink-0" />
          <p className="premium-value-strip__text m-0 text-[11px] sm:text-xs text-amber-50/90">
            <strong className="text-amber-200">Premium aktif</strong>
            <span className="text-slate-400"> — </span>
            AI çeviri fair-use kotanız açık. Tüm oyunlar ve seviyeler herkese ücretsizdir.
          </p>
        </>
      ) : (
        <>
          <div className="premium-value-strip__icons" aria-hidden>
            <BookOpen size={14} className="text-emerald-400" />
            <Languages size={14} className="text-cyan-400" />
          </div>
          <div className="premium-value-strip__text">
            <p className="m-0 text-[11px] sm:text-xs leading-snug">
              <strong className="text-emerald-300">Tüm Oyunlar & Seviyeler Ücretsiz</strong>
              <span className="text-slate-500"> · </span>
              <strong className="text-cyan-300">AI çeviri</strong>
              {isAuthenticated ? (
                <span className="text-slate-400">
                  {" "}
                  — hesabınıza özel {left}/{FREE_TRANSLATION_QUOTA} ücretsiz kaldı
                </span>
              ) : (
                <span className="text-slate-400">
                  {" "}
                  — misafir {left}/{GUEST_TRANSLATION_QUOTA}; üye olunca {FREE_TRANSLATION_QUOTA} hak
                </span>
              )}
            </p>
            <p className="m-0 text-[10px] text-amber-200/80 mt-0.5 font-medium">
              Daha Çok Çeviri İçin Premiuma geçin: {PREMIUM_PRODUCT.try.label}
              {!PAYMENTS_LIVE ? " · güvenli ödeme bağlanıyor" : ""}
            </p>
          </div>
        </>
      )}
      <style jsx>{`
        .premium-value-strip {
          display: flex;
          align-items: center;
          gap: 10px;
          width: 100%;
          max-width: 1400px;
          margin: 0 auto;
          padding: 8px 24px 10px;
          box-sizing: border-box;
          background: linear-gradient(
            90deg,
            rgba(6, 78, 59, 0.25) 0%,
            rgba(15, 23, 42, 0.9) 45%,
            rgba(120, 53, 15, 0.2) 100%
          );
          border-bottom: 1px solid rgba(251, 191, 36, 0.12);
        }
        .premium-value-strip--active {
          background: linear-gradient(
            90deg,
            rgba(120, 53, 15, 0.35) 0%,
            rgba(15, 23, 42, 0.95) 100%
          );
        }
        .premium-value-strip__icons {
          display: flex;
          gap: 6px;
          flex-shrink: 0;
        }
        .premium-value-strip__text {
          flex: 1;
          min-width: 0;
        }
        @media (max-width: 900px) {
          .premium-value-strip {
            padding: 8px 14px 10px;
          }
        }
        @media (max-width: 640px) {
          .premium-value-strip {
            padding: 8px 12px;
            gap: 8px;
          }
          .premium-value-strip__icons {
            display: none;
          }
        }
      `}</style>
    </div>
  );
}

/** Header + strip için tek state köprüsü */
export default function PremiumChrome({ children }) {
  const [open, setOpen] = useState(false);
  return (
    <>
      {typeof children === "function" ? children({ openPremium: () => setOpen(true) }) : children}
      <PremiumCheckoutModal open={open} onClose={() => setOpen(false)} />
    </>
  );
}
