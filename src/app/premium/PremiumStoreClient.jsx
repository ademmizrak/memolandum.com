"use client";

import React, { useEffect, useState } from "react";
import Link from "next/link";
import Header from "../../components/Header";
import PremiumCheckoutModal from "../../components/premium/PremiumCheckoutModal";
import {
  FREE_TRANSLATION_QUOTA,
  GUEST_TRANSLATION_QUOTA,
  PREMIUM_FAIR_USE_MONTHLY,
  PREMIUM_PRODUCT,
  shouldHideExternalPayments,
  isNativeApp,
} from "../../lib/premium/config";
import { isNativeIapPlatform } from "../../lib/premium/revenueCat";
import { startPremiumCheckout } from "../../lib/premium/premiumService";
import { useMemolandumStore } from "../../store/useMemolandumStore";

/**
 * Shopier / mağaza incelemesi için: net fiyat + satın alınabilir ürün sayfası.
 * Native: App Store / Play IAP · Web: Shopier + Stripe.
 */
export default function PremiumStoreClient() {
  const [open, setOpen] = useState(false);
  const [providerHint, setProviderHint] = useState(null);
  const [isNative, setIsNative] = useState(false);
  const [hideExternalPay, setHideExternalPay] = useState(false);
  const [loadingProvider, setLoadingProvider] = useState(null);
  const isPremium = useMemolandumStore((s) => s.isPremium);

  useEffect(() => {
    let cancelled = false;
    setHideExternalPay(shouldHideExternalPayments());
    if (isNativeApp()) {
      setIsNative(true);
    }
    isNativeIapPlatform().then((v) => {
      if (!cancelled) setIsNative(!!v || isNativeApp());
    });
    return () => {
      cancelled = true;
    };
  }, []);

  const openBuy = async (provider) => {
    if (isNative || provider === "native") {
      setProviderHint(provider);
      setOpen(true);
      return;
    }
    try {
      setLoadingProvider(provider);
      await startPremiumCheckout(provider);
    } catch {
      setProviderHint(provider);
      setOpen(true);
    } finally {
      setLoadingProvider(null);
    }
  };

  return (
    <div className="min-h-screen bg-[#070b14] text-slate-200">
      <Header />
      <main className="max-w-3xl mx-auto px-5 py-10 sm:py-14">
        <p className="text-[11px] font-bold tracking-[0.16em] uppercase text-amber-500/80 m-0 mb-3">
          {isNative ? "Google Play Abonelik" : "Dijital Abonelik · Shopier & Stripe"}
        </p>
        <h1 className="text-3xl sm:text-4xl font-black text-white m-0 mb-3 tracking-tight">
          Memolandum Premium
        </h1>
        <p className="text-lg text-amber-200/90 font-semibold m-0 mb-4">
          {PREMIUM_PRODUCT.slogan.tr}
        </p>
        <p className="text-slate-400 leading-relaxed m-0 mb-8">
          Arcade kelime oyunları ve 23 dil yolu <strong className="text-emerald-300/90">ücretsiz olarak açıktır</strong>.
          Google Gemini ile anlık AI çeviri (metin + ses) üye hesabına özel ilk {FREE_TRANSLATION_QUOTA} çeviri
          ücretsizdir; misafir {GUEST_TRANSLATION_QUOTA} çeviri deneyebilir; sonrası Premium aboneliğe dahildir.
        </p>

        {isNative ? (
          <div className="mb-8">
            <article className="rounded-2xl border border-amber-400/35 bg-gradient-to-b from-amber-950/40 to-slate-950/80 p-6">
              <p className="text-xs text-slate-400 m-0 mb-1">Mobil · Google Play</p>
              <p className="text-3xl font-black text-amber-200 m-0">Premium</p>
              <p className="text-sm text-slate-400 mt-3 mb-5">
                Aylık abonelik · Fiyat mağaza sayfasında gösterilir · Fair use ≈{" "}
                {PREMIUM_FAIR_USE_MONTHLY} AI çeviri / ay
              </p>
              {!hideExternalPay ? (
                <button
                  type="button"
                  disabled={isPremium}
                  onClick={() => openBuy("native")}
                  className="w-full py-3 rounded-xl font-black text-sm bg-amber-500 text-slate-950 hover:bg-amber-400 disabled:opacity-40"
                >
                  {isPremium ? "Zaten Premium’sunuz" : "Google Play ile abone ol"}
                </button>
              ) : (
                <Link
                  href="/"
                  className="inline-block w-full text-center py-3 rounded-xl font-black text-sm bg-emerald-500 text-slate-950 hover:bg-emerald-400 no-underline"
                >
                  Ücretsiz Öğrenmeye Devam Et →
                </Link>
              )}
            </article>
          </div>
        ) : (
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 mb-8">
            <article className="rounded-2xl border border-amber-400/35 bg-gradient-to-b from-amber-950/40 to-slate-950/80 p-6 flex flex-col justify-between">
              <div>
                <p className="text-xs text-amber-300 font-bold uppercase tracking-wider m-0 mb-1">
                  🇹🇷 Türkiye · Shopier
                </p>
                <div className="flex items-baseline gap-2">
                  <p className="text-3xl font-black text-amber-200 m-0">
                    {PREMIUM_PRODUCT.try.label}
                  </p>
                  <span className="text-xs text-slate-500 line-through">
                    {PREMIUM_PRODUCT.try.compareAt}
                  </span>
                </div>
                <p className="text-sm text-slate-400 mt-3 mb-5">
                  Shopier güvenli ödeme altyapısı ile 30 günlük Premium aktivasyonu · Aylık ≈{" "}
                  {PREMIUM_FAIR_USE_MONTHLY} AI çeviri hakkı
                </p>
              </div>
              <a
                href="https://www.shopier.com/49186522"
                target="_blank"
                rel="noopener noreferrer"
                className="block w-full text-center py-3 rounded-xl font-black text-sm bg-amber-500 text-slate-950 hover:bg-amber-400 no-underline cursor-pointer"
              >
                {isPremium
                  ? "Zaten Premium’sunuz"
                  : `🇹🇷 Satın al (Shopier) · ${PREMIUM_PRODUCT.try.label}`}
              </a>
            </article>

            <article className="rounded-2xl border border-blue-400/35 bg-gradient-to-b from-blue-950/40 to-slate-950/80 p-6 flex flex-col justify-between">
              <div>
                <p className="text-xs text-blue-300 font-bold uppercase tracking-wider m-0 mb-1">
                  🌍 Global · Shopier / Stripe
                </p>
                <div className="flex items-baseline gap-2">
                  <p className="text-3xl font-black text-blue-200 m-0">
                    {PREMIUM_PRODUCT.usd.label}
                  </p>
                  <span className="text-xs text-slate-500 line-through">
                    {PREMIUM_PRODUCT.usd.compareAt}
                  </span>
                </div>
                <p className="text-sm text-slate-400 mt-3 mb-5">
                  International secure checkout via Shopier / Stripe · ~{PREMIUM_FAIR_USE_MONTHLY} AI
                  translations / month fair use
                </p>
              </div>
              <a
                href="https://www.shopier.com/49186522"
                target="_blank"
                rel="noopener noreferrer"
                className="block w-full text-center py-3 rounded-xl font-black text-sm bg-blue-500 text-white hover:bg-blue-400 no-underline cursor-pointer"
              >
                {isPremium
                  ? "Already Premium"
                  : `🌍 Buy (Shopier) · ${PREMIUM_PRODUCT.usd.label}`}
              </a>
            </article>
          </div>
        )}

        {!isNative && (
          <section className="rounded-2xl border border-pink-500/30 bg-pink-950/20 p-5 mb-8 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
            <div>
              <h2 className="text-pink-200 text-sm font-black m-0 mb-1">
                💖 Kreosus ile Destek & İşbirliği
              </h2>
              <p className="text-xs text-slate-300 m-0 leading-relaxed">
                Memolandum’un ücretsiz kelime oyunlarını ve eğitim içeriklerini büyütmemize Kreosus üzerinden destek olabilirsiniz.
              </p>
            </div>
            <a
              href="https://kreosus.com/httpsmemolandumcom/about"
              target="_blank"
              rel="noopener noreferrer"
              className="px-4 py-2.5 rounded-xl font-black text-xs bg-pink-500 text-slate-950 hover:bg-pink-400 no-underline whitespace-nowrap shrink-0"
            >
              Kreosus Sayfamız ↗
            </a>
          </section>
        )}

        <section className="mb-10">
          <h2 className="text-base font-bold text-white m-0 mb-3">Pakete neler dahil?</h2>
          <ul className="m-0 pl-5 space-y-2 text-sm text-slate-300">
            {PREMIUM_PRODUCT.features.tr.map((f) => (
              <li key={f.title}>
                <strong className="text-slate-100">{f.title}</strong> — {f.desc}
              </li>
            ))}
          </ul>
        </section>

        <section className="rounded-xl border border-white/10 bg-white/[0.03] p-5 mb-8 text-sm text-slate-400">
          <h2 className="text-white text-sm font-bold m-0 mb-2">Ödeme güvenliği</h2>
          <p className="m-0 leading-relaxed">
            {isNative ? (
              <>
                Uygulamamızda ödeme işlemleri yalnızca resmi{" "}
                <strong className="text-slate-200">Google Play Store / App Store</strong> kanalı
                üzerinden gerçekleştirilir. Kart bilgileri hiçbir şekilde Memolandum sunucularında tutulmaz.
              </>
            ) : (
              <>
                Kart bilgileriniz Memolandum sunucularında tutulmaz; Türkiye’de{" "}
                <strong className="text-slate-200">Shopier</strong>, globalde{" "}
                <strong className="text-slate-200">Stripe</strong> güvenli ödeme altyapısı üzerinden
                işlem yapılır ve ödeme tamamlandığında hesabınız otomatik olarak Premium’a yükseltilir.
              </>
            )}
          </p>
        </section>

        <p className="text-xs text-slate-600 m-0">
          <Link href="/legal/terms/" className="text-slate-500 hover:text-cyan-400">
            Kullanım Koşulları
          </Link>
          {" · "}
          <Link href="/legal/privacy/" className="text-slate-500 hover:text-cyan-400">
            Gizlilik Politikası
          </Link>
          {" · "}
          <Link href="/" className="text-slate-500 hover:text-cyan-400">
            Ana sayfa — ücretsiz öğrenmeye devam
          </Link>
        </p>
      </main>

      <PremiumCheckoutModal
        open={open}
        onClose={() => {
          setOpen(false);
          setProviderHint(null);
        }}
        preferredProvider={providerHint}
      />
    </div>
  );
}
