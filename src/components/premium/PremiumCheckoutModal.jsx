"use client";

import React, { useEffect, useState } from "react";
import { X, Sparkles, ShieldCheck, Loader2, Bell } from "lucide-react";
import { useMemolandumStore } from "../../store/useMemolandumStore";
import {
  FREE_TRANSLATION_QUOTA,
  PAYMENTS_LIVE,
  PREMIUM_FAIR_USE_MONTHLY,
  PREMIUM_PRODUCT,
} from "../../lib/premium/config";
import {
  restorePremiumPurchases,
  startPremiumCheckout,
} from "../../lib/premium/premiumService";
import { isNativeIapPlatform } from "../../lib/premium/revenueCat";
import AuthModal from "../AuthModal";
import { auth } from "../../lib/firebase/config";
import { useAnalytics } from "../../hooks/useAnalytics";

export default function PremiumCheckoutModal({ open, onClose, preferredProvider = null }) {
  const isAuthenticated = useMemolandumStore((s) => s.isAuthenticated);
  const isPremium = useMemolandumStore((s) => s.isPremium);
  const [step, setStep] = useState("select");
  const [error, setError] = useState("");
  const [showAuth, setShowAuth] = useState(false);
  const [notifyEmail, setNotifyEmail] = useState("");
  const [notified, setNotified] = useState(false);
  const [isNative, setIsNative] = useState(false);

  useEffect(() => {
    let cancelled = false;
    isNativeIapPlatform().then((v) => {
      if (!cancelled) setIsNative(!!v);
    });
    return () => {
      cancelled = true;
    };
  }, []);

  if (!open) return null;

  const close = () => {
    setStep("select");
    setError("");
    onClose?.();
  };

  const { trackPremiumStart, trackPremiumPurchase } = useAnalytics();

  const startPay = async (provider) => {
    setError("");
    const p = provider || preferredProvider || PREMIUM_PRODUCT.try.provider || "shopier";
    if (!auth?.currentUser && !isAuthenticated) {
      setShowAuth(true);
      return;
    }
    try {
      trackPremiumStart(p);
      setStep("redirecting");
      const result = await startPremiumCheckout(p);
      if (result?.nativePurchased) {
        setStep(result.isPremium ? "native-success" : "select");
        if (result.isPremium) {
          trackPremiumPurchase(p, 99.99);
          return;
        }
      }
      // Web yönlendirme: sayfa değişir; native değilse select'e dönme
    } catch (e) {
      if (e?.code === "login-required" || e?.message === "login-required") {
        setStep("select");
        setShowAuth(true);
        return;
      }
      const msg = e?.message || "";
      setStep("error");
      setError(
        msg ||
          (isNative
            ? "Mağaza satın alma başlatılamadı."
            : "Ödeme oturumu açılamadı. Shopier API anahtarları Functions ortamına eklenince Satın al çalışır.")
      );
    }
  };

  const startRestore = async () => {
    setError("");
    if (!auth?.currentUser && !isAuthenticated) {
      setShowAuth(true);
      return;
    }
    try {
      setStep("redirecting");
      const result = await restorePremiumPurchases();
      if (result?.isPremium) {
        setStep("native-success");
      } else {
        setStep("error");
        setError("Geri yüklenecek aktif Premium abonelik bulunamadı.");
      }
    } catch (e) {
      if (e?.code === "login-required" || e?.message === "login-required") {
        setStep("select");
        setShowAuth(true);
        return;
      }
      setStep("error");
      setError(e?.message || "Satın alımlar geri yüklenemedi.");
    }
  };

  const submitWaitlist = (e) => {
    e.preventDefault();
    const mail = (notifyEmail || auth?.currentUser?.email || "").trim();
    if (!mail) return;
    try {
      const key = "mm_premium_notify";
      const prev = JSON.parse(localStorage.getItem(key) || "[]");
      if (!prev.includes(mail)) {
        localStorage.setItem(key, JSON.stringify([...prev, mail].slice(-50)));
      }
      // Operasyonel: mailto ile info@’a da düşer
      window.location.href = `mailto:info@memolandum.com?subject=${encodeURIComponent(
        "Premium / Shopier haberdar et"
      )}&body=${encodeURIComponent(`Premium açılınca haber verin.\nE-posta: ${mail}\n`)}`;
    } catch {
      /* ignore */
    }
    setNotified(true);
  };

  return (
    <>
      <div className="pm-overlay" role="dialog" aria-modal="true" aria-labelledby="pm-title" onClick={(e) => { if (e.target === e.currentTarget) close(); }}>
        <div className="pm-modal">
          <button type="button" className="pm-close" onClick={close} aria-label="Kapat">
            <X size={18} />
          </button>

          {step === "select" && (
            <div className="pm-body">
              <div className="pm-hero">
                <Sparkles className="w-8 h-8 text-amber-400" />
                <h2 id="pm-title">MEMOLANDUM PREMIUM</h2>
                <p>{PREMIUM_PRODUCT.slogan.tr}</p>
              </div>

              <p className="pm-desc">
                Arcade oyunlar ve tüm seviyeler <strong>herkese ücretsizdir</strong>. Gemini AI
                çeviri API maliyeti taşıdığı için üye hesabına özel ilk{" "}
                <strong>{FREE_TRANSLATION_QUOTA} çeviri ücretsiz</strong>; sonrası Premium.
              </p>

              <div className="pm-price-row">
                <div className="pm-price-card">
                  <span className="pm-flag">🇹🇷 Türkiye</span>
                  <strong>{PREMIUM_PRODUCT.try.label}</strong>
                  <span className="pm-was">{PREMIUM_PRODUCT.try.compareAt}</span>
                </div>
                <div className="pm-price-card">
                  <span className="pm-flag">🌍 Global</span>
                  <strong>{PREMIUM_PRODUCT.usd.label}</strong>
                  <span className="pm-was">{PREMIUM_PRODUCT.usd.compareAt}</span>
                </div>
              </div>
              <p className="pm-fair">
                Fair use ≈ {PREMIUM_FAIR_USE_MONTHLY} AI çeviri / ay · kötüye kullanım hız limitleriyle
                engellenir
              </p>

              <ul className="pm-features">
                {PREMIUM_PRODUCT.features.tr.map((f) => (
                  <li key={f.title}>
                    <strong>{f.title}</strong>
                    <span>{f.desc}</span>
                  </li>
                ))}
              </ul>

              <div className="pm-secure">
                <ShieldCheck size={16} className="text-emerald-400 shrink-0" />
                <span>
                  {isNative ? (
                    <>
                      Ödeme <strong>App Store / Google Play</strong> üzerinden alınır. Kart bilgisi
                      Memolandum’da tutulmaz.
                    </>
                  ) : (
                    <>
                      Kart bilgisi sitemizde yok. Türkiye’de <strong>Shopier</strong>, dünyada{" "}
                      <strong>Stripe</strong> güvenli ödeme sayfasına yönlendirilirsiniz.
                    </>
                  )}
                </span>
              </div>

              {!isNative && !PAYMENTS_LIVE && (
                <div className="pm-pending">
                  Shopier API anahtarları bağlanınca tahsilat canlıya geçer. Fiyatlar ve Satın al
                  akışı hazır.
                </div>
              )}

              <div className="pm-actions">
                {isNative ? (
                  <>
                    <button
                      type="button"
                      className="pm-btn pm-btn-tr"
                      disabled={isPremium}
                      onClick={() => startPay("native")}
                    >
                      {isPremium
                        ? "Zaten Premium’sunuz"
                        : "App Store / Play ile abone ol"}
                    </button>
                    <button type="button" className="pm-btn pm-btn-global" onClick={startRestore}>
                      Satın alımları geri yükle
                    </button>
                  </>
                ) : (
                  <>
                    <button type="button" className="pm-btn pm-btn-tr" onClick={() => startPay("shopier")}>
                      🇹🇷 Satın al · {PREMIUM_PRODUCT.try.label}
                    </button>
                    <button type="button" className="pm-btn pm-btn-global" onClick={() => startPay("stripe")}>
                      🌍 Buy · {PREMIUM_PRODUCT.usd.label}
                    </button>
                    {!PAYMENTS_LIVE && (
                      <button type="button" className="pm-link" onClick={() => setStep("waitlist")}>
                        <Bell size={14} className="inline mr-1" /> Açılınca e-posta ile haber ver
                      </button>
                    )}
                  </>
                )}
              </div>
              <p className="pm-legal">
                <a href="/legal/terms/">Koşullar</a> · <a href="/legal/privacy/">Gizlilik</a>
              </p>
            </div>
          )}

          {step === "waitlist" && (
            <div className="pm-body pm-center">
              {!notified ? (
                <form onSubmit={submitWaitlist} className="pm-wait-form">
                  <Bell className="w-10 h-10 text-amber-300 mb-3" />
                  <h3>Premium hazır olunca yazalım</h3>
                  <p>
                    Shopier bağlantısı tamamlanınca {PREMIUM_PRODUCT.try.label} /{" "}
                    {PREMIUM_PRODUCT.usd.label} ile güvenli ödeme açılacak.
                  </p>
                  <input
                    type="email"
                    required
                    placeholder="E-posta"
                    value={notifyEmail}
                    onChange={(e) => setNotifyEmail(e.target.value)}
                    className="pm-input"
                  />
                  <button type="submit" className="pm-btn pm-btn-tr">
                    Haberdar et
                  </button>
                  <button type="button" className="pm-link" onClick={() => setStep("select")}>
                    Geri
                  </button>
                </form>
              ) : (
                <>
                  <h3>Teşekkürler</h3>
                  <p>Ödeme açılınca bilgilendirileceksiniz.</p>
                  <button type="button" className="pm-btn pm-btn-tr" onClick={close}>
                    Tamam
                  </button>
                </>
              )}
            </div>
          )}

          {step === "redirecting" && (
            <div className="pm-body pm-center">
              <Loader2 className="w-12 h-12 text-cyan-400 animate-spin mb-4" />
              <h4>
                {isNative
                  ? "Mağaza hazırlanıyor…"
                  : "Güvenli ödeme sayfasına yönlendiriliyorsunuz…"}
              </h4>
            </div>
          )}

          {step === "native-success" && (
            <div className="pm-body pm-center">
              <Sparkles className="w-12 h-12 text-amber-400 mb-4" />
              <h3>Premium aktif</h3>
              <p>Aboneliğiniz doğrulandı. AI çeviri Premium özellikleriniz açıldı.</p>
              <button type="button" className="pm-btn pm-btn-tr" onClick={close}>
                Tamam
              </button>
            </div>
          )}

          {step === "error" && (
            <div className="pm-body pm-center">
              <h3>Ödeme başlatılamadı</h3>
              <p>{error}</p>
              <button type="button" className="pm-btn pm-btn-tr" onClick={() => setStep("select")}>
                Geri
              </button>
            </div>
          )}
        </div>
      </div>

      <AuthModal isOpen={showAuth} onClose={() => setShowAuth(false)} initialView="login" />

      <style jsx>{`
        .pm-overlay {
          position: fixed;
          inset: 0;
          z-index: 9999;
          background: rgba(2, 6, 23, 0.82);
          backdrop-filter: blur(6px);
          display: flex;
          align-items: center;
          justify-content: center;
          padding: 16px;
        }
        .pm-modal {
          position: relative;
          width: 100%;
          max-width: 440px;
          max-height: min(90vh, 720px);
          overflow: auto;
          border-radius: 16px;
          border: 1px solid rgba(251, 191, 36, 0.25);
          background: linear-gradient(165deg, #0f172a 0%, #1c1917 55%, #0c1222 100%);
          box-shadow: 0 25px 50px rgba(0, 0, 0, 0.55);
        }
        .pm-close {
          position: absolute;
          top: 12px;
          right: 12px;
          background: transparent;
          border: none;
          color: #94a3b8;
          cursor: pointer;
          z-index: 2;
        }
        .pm-body {
          padding: 28px 22px 22px;
        }
        .pm-center {
          text-align: center;
          padding-top: 40px;
        }
        .pm-hero {
          text-align: center;
          margin-bottom: 14px;
        }
        .pm-hero h2 {
          margin: 10px 0 4px;
          font-size: 1.25rem;
          font-weight: 900;
          letter-spacing: 0.06em;
          color: #fff;
        }
        .pm-hero p {
          margin: 0;
          color: #fbbf24;
          font-size: 0.8rem;
          font-weight: 700;
        }
        .pm-desc {
          font-size: 0.85rem;
          line-height: 1.55;
          color: #cbd5e1;
          margin: 0 0 14px;
        }
        .pm-price-row {
          display: grid;
          grid-template-columns: 1fr 1fr;
          gap: 8px;
          margin-bottom: 8px;
        }
        .pm-price-card {
          border: 1px solid rgba(255, 255, 255, 0.08);
          border-radius: 10px;
          padding: 10px;
          background: rgba(0, 0, 0, 0.25);
          display: flex;
          flex-direction: column;
          gap: 2px;
        }
        .pm-flag {
          font-size: 10px;
          color: #94a3b8;
        }
        .pm-price-card strong {
          color: #fde68a;
          font-size: 1rem;
        }
        .pm-was {
          font-size: 10px;
          color: #64748b;
          text-decoration: line-through;
        }
        .pm-fair {
          font-size: 10px;
          color: #64748b;
          margin: 0 0 12px;
          text-align: center;
        }
        .pm-features {
          list-style: none;
          margin: 0 0 14px;
          padding: 0;
          display: flex;
          flex-direction: column;
          gap: 10px;
        }
        .pm-features li {
          display: flex;
          flex-direction: column;
          gap: 2px;
          font-size: 12px;
        }
        .pm-features strong {
          color: #e2e8f0;
        }
        .pm-features span {
          color: #94a3b8;
          line-height: 1.4;
        }
        .pm-secure {
          display: flex;
          gap: 8px;
          font-size: 11px;
          color: #94a3b8;
          margin-bottom: 12px;
          line-height: 1.4;
        }
        .pm-pending {
          font-size: 11px;
          color: #fcd34d;
          background: rgba(251, 191, 36, 0.08);
          border: 1px solid rgba(251, 191, 36, 0.2);
          border-radius: 8px;
          padding: 8px 10px;
          margin-bottom: 12px;
        }
        .pm-actions {
          display: flex;
          flex-direction: column;
          gap: 8px;
        }
        .pm-btn {
          display: inline-flex;
          align-items: center;
          justify-content: center;
          gap: 8px;
          width: 100%;
          padding: 12px 14px;
          border-radius: 10px;
          border: none;
          font-weight: 800;
          font-size: 13px;
          cursor: pointer;
        }
        .pm-btn-tr {
          background: linear-gradient(90deg, #b45309, #d97706);
          color: #fffbeb;
        }
        .pm-btn-global {
          background: linear-gradient(90deg, #1d4ed8, #2563eb);
          color: #eff6ff;
        }
        .pm-legal {
          text-align: center;
          font-size: 10px;
          color: #64748b;
          margin: 12px 0 0;
        }
        .pm-legal a {
          color: #64748b;
        }
        .pm-wait-form {
          display: flex;
          flex-direction: column;
          align-items: center;
          gap: 8px;
        }
        .pm-input {
          width: 100%;
          padding: 10px 12px;
          border-radius: 8px;
          border: 1px solid rgba(255, 255, 255, 0.12);
          background: #0f172a;
          color: #fff;
        }
        .pm-link {
          background: none;
          border: none;
          color: #64748b;
          cursor: pointer;
          font-size: 12px;
          margin-top: 4px;
        }
      `}</style>
    </>
  );
}
