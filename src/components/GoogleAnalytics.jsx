"use client";

/**
 * GoogleAnalytics — Memolandum Analytics & Ads Tracking Komponenti (Faz 4 Beacon & Exit Flush)
 *
 * Yalnızca NEXT_PUBLIC_GA4_ID tanımlıysa GA4 scriptlerini yükler.
 * Ayrıca mobil tarayıcılarda (iOS Safari / Android Chrome) sekme kapatıldığında veya
 * geri tuşuna basıldığında `visibilitychange` ve `pagehide` üzerinden yarım kalan
 * oyun oturumu telemetrisini (`transport_type: 'beacon'`) kayıpsız olarak boşaltır.
 *
 * Env vars:
 *   NEXT_PUBLIC_GA4_ID         = G-XXXXXXXXXX    (Google Analytics 4)
 *   NEXT_PUBLIC_ADS_ID         = AW-XXXXXXXXXX   (Google Ads Conversion Tag — opsiyonel)
 *
 * Kullanım: <GoogleAnalytics /> → layout.js'e eklenmiştir
 */

import { useEffect } from "react";
import Script from "next/script";
import { registerExitTelemetryListeners } from "../lib/learning/telemetryService";
import { useMemolandumStore } from "../store/useMemolandumStore";

const GA4_ID = process.env.NEXT_PUBLIC_GA4_ID;
const ADS_ID = process.env.NEXT_PUBLIC_ADS_ID;

export default function GoogleAnalytics() {
  useEffect(() => {
    registerExitTelemetryListeners(() => {
      try {
        return useMemolandumStore.getState()?.uid || null;
      } catch {
        return null;
      }
    });
  }, []);

  // ID yoksa script yükleme — mevcut yapı bozulmaz
  if (!GA4_ID) return null;

  const gtmSrc = `https://www.googletagmanager.com/gtag/js?id=${GA4_ID}`;

  return (
    <>
      {/* Google tag (gtag.js) */}
      <Script
        id="gtag-script"
        src={gtmSrc}
        strategy="afterInteractive"
      />
      <Script
        id="gtag-init"
        strategy="afterInteractive"
        dangerouslySetInnerHTML={{
          __html: `
            window.dataLayer = window.dataLayer || [];
            function gtag(){dataLayer.push(arguments);}
            gtag('js', new Date());

            // GA4 temel yapılandırma (Kritik dönüşüm event'lerinde beacon useAnalytics.js üzerinden gönderilir)
            gtag('config', '${GA4_ID}', {
              page_title: document.title,
              page_location: window.location.href,
              send_page_view: true,
              // Kullanıcı gizliliği ve Demografik / İlgi Alanı Sinyalleri (GA4 Google Signals)
              anonymize_ip: true,
              allow_google_signals: true,
              allow_ad_personalization_signals: true,
            });

            ${ADS_ID ? `// Google Ads Conversion Tag\ngtag('config', '${ADS_ID}', { transport_type: 'beacon' });` : "// Google Ads ID henüz eklenmedi (NEXT_PUBLIC_ADS_ID)"}

            // Memolandum özel eventleri window'a aç — useAnalytics hook kullanır
            window._memoGtag = function() {
              if (typeof gtag === 'function') {
                gtag.apply(null, arguments);
              }
            };
          `,
        }}
      />
    </>
  );
}
