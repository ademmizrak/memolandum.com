/**
 * Faz 2 — HTML5 Canvas Dinamik FPS İzleme ve Otomatik Kalite Düşürme (Adaptive Quality Scaling)
 *
 * - Son 60 frame'in ortalamasını alan hafif FPS sayacı.
 * - FPS 35'in altına düşerse otomatik olarak `isLowSpecDevice = true` bayrağını aktif eder:
 *   1. Arka plan yıldız/parçacık (particle) sayılarını %70 azaltır (`scaleParticleCount`).
 *   2. Pahalı Canvas işlemlerini (`ctx.shadowBlur`, karmaşık radyal gradyanlar) devre dışı bırakır.
 *   3. `window.devicePixelRatio` değerini düşük donanımlı/mobil cihazlarda maksimum 1.5 (Low-Spec'te 1.0) ile sınırlar.
 */

import {
  containsRtlScript,
  ensureArabicCanvasFontsReady,
  formatCanvasFontForRtl,
  wrapBiDiText,
} from "../i18n/canvasTextHelper";

let _globalLowSpecTriggered = false;
let _lastMeasuredFps = 60;
const _lowSpecListeners = new Set();

export function isLowSpecDeviceActive() {
  if (typeof window !== "undefined" && window.__memoLowSpecTriggered === true) {
    return true;
  }
  return _globalLowSpecTriggered;
}

export function getLastMeasuredFps() {
  return _lastMeasuredFps;
}

export function onLowSpecModeTriggered(listener) {
  if (typeof listener !== "function") return () => {};
  _lowSpecListeners.add(listener);
  return () => _lowSpecListeners.delete(listener);
}

export function triggerLowSpecMode(measuredFps = 30) {
  _lastMeasuredFps = Math.round(measuredFps);
  if (_globalLowSpecTriggered) return false;
  _globalLowSpecTriggered = true;
  if (typeof window !== "undefined") {
    window.__memoLowSpecTriggered = true;
    window.__memoLastFps = _lastMeasuredFps;
  }
  _lowSpecListeners.forEach((fn) => {
    try {
      fn(_lastMeasuredFps);
    } catch {
      /* ignore */
    }
  });
  return true;
}

/**
 * Eski sürüm Android WebView (Android 5–9 / Chrome < 88) veya düşük bellekli (<= 2GB RAM / <= 2 çekirdek)
 * mobil cihazları tespit eder.
 */
export function isLegacyAndroidOrLowMemDevice() {
  if (typeof window === "undefined") return false;
  try {
    const nav = window.navigator || (typeof navigator !== "undefined" ? navigator : null);
    if (!nav) return false;
    const ua = String(nav.userAgent || "");
    const isOldAndroid = /Android\s+[4-9](?:\.|_|\b)/i.test(ua);
    const isOldChromeWebView = /Chrome\/[4-8][0-9]\./i.test(ua);
    const devMem = Number(nav.deviceMemory) || 0;
    const cores = Number(nav.hardwareConcurrency) || 0;
    const isLowRamOrCpu = (devMem > 0 && devMem <= 2) || (cores > 0 && cores <= 2);
    return isOldAndroid || isOldChromeWebView || isLowRamOrCpu;
  } catch {
    return false;
  }
}

/**
 * Mobil GPU ısınmasını ve aşırı piksel doldurma (fill-rate) darboğazını önlemek için
 * güvenli DPR (Device Pixel Ratio) sınırlandırması.
 * - Low-Spec aktifse: maksimum 1.0
 * - Eski Android / <=2GB RAM cihazlarda: maksimum 1.25
 * - Mobil / dokunmatik cihazlarda: maksimum 1.5
 * - Masaüstünde: maksimum 2.0
 */
export function getAdaptiveDevicePixelRatio(forceLowSpec = false) {
  if (typeof window === "undefined") return 1;
  const rawDpr = Number(window.devicePixelRatio) || 1;
  if (forceLowSpec || isLowSpecDeviceActive()) {
    return 1.0;
  }
  if (isLegacyAndroidOrLowMemDevice()) {
    return Math.min(1.25, Math.max(1.0, rawDpr));
  }
  const isMobileViewport =
    window.innerWidth <= 900 ||
    (typeof navigator !== "undefined" && navigator.maxTouchPoints > 0);
  const maxAllowedDpr = isMobileViewport ? 1.5 : 2.0;
  return Math.min(maxAllowedDpr, Math.max(1.0, rawDpr));
}

/**
 * Low-Spec modunda yıldız ve parçacık (particle) sayısını %70 azaltır (%30'unu korur).
 * Eski Android / düşük RAM cihazlarda başlangıçtan itibaren %50 azaltır.
 */
export function scaleParticleCount(baseCount, forceLowSpec = false) {
  const n = Math.max(0, Number(baseCount) || 0);
  if (n === 0) return 0;
  if (forceLowSpec || isLowSpecDeviceActive()) {
    return Math.max(1, Math.round(n * 0.3));
  }
  if (isLegacyAndroidOrLowMemDevice()) {
    return Math.max(1, Math.round(n * 0.5));
  }
  return n;
}

/**
 * Son 60 frame'in ortalamasını takip eden hafif FPS monitörü.
 * FPS < 35 olduğunda otomatik olarak Low-Spec modunu tetikler.
 */
export function createCanvasFpsMonitor({
  sampleSize = 60,
  fpsThreshold = 35,
  onLowSpec = null,
} = {}) {
  const frameDurationsMs = new Float32Array(sampleSize);
  let index = 0;
  let count = 0;
  let sumMs = 0;
  let lastTimestamp = 0;
  let lowSpecActive = isLowSpecDeviceActive();

  return {
    get isLowSpec() {
      return lowSpecActive || isLowSpecDeviceActive();
    },
    get fps() {
      return _lastMeasuredFps;
    },
    tick(nowMs = typeof performance !== "undefined" ? performance.now() : Date.now()) {
      if (lastTimestamp <= 0) {
        lastTimestamp = nowMs;
        return _lastMeasuredFps;
      }
      const deltaMs = nowMs - lastTimestamp;
      lastTimestamp = nowMs;

      // Sekme değiştirmeden kaynaklı >250ms sıçramaları FPS ortalamasına dahil etme
      if (deltaMs <= 0 || deltaMs > 250) {
        return _lastMeasuredFps;
      }

      if (count >= sampleSize) {
        sumMs -= frameDurationsMs[index];
      } else {
        count += 1;
      }
      frameDurationsMs[index] = deltaMs;
      sumMs += deltaMs;
      index = (index + 1) % sampleSize;

      if (count >= sampleSize) {
        const avgDeltaMs = sumMs / sampleSize;
        const currentFps = avgDeltaMs > 0 ? 1000 / avgDeltaMs : 60;
        _lastMeasuredFps = Math.round(currentFps);

        if (!lowSpecActive && currentFps < fpsThreshold) {
          lowSpecActive = true;
          const newlyTriggered = triggerLowSpecMode(currentFps);
          if (typeof onLowSpec === "function") {
            try {
              onLowSpec(Math.round(currentFps), newlyTriggered);
            } catch {
              /* ignore */
            }
          }
        }
      }
      return _lastMeasuredFps;
    },
    reset() {
      index = 0;
      count = 0;
      sumMs = 0;
      lastTimestamp = 0;
    },
  };
}

/**
 * Canvas 2D Context üzerinde:
 * 1. (Faz 2) Low-Spec modunda pahalı `shadowBlur` işlemlerini sıfır maliyetle devre dışı bırakır.
 * 2. (Faz 3) Tüm `fillText` ve `strokeText` çağrılarında Arapça/RTL karakter algılaması yaparak
 *    otomatik `ctx.direction = 'rtl'` (Latin'de `'ltr'`), `ctx.letterSpacing = '0px'` (harf birleşmelerini
 *    korumak için) ve okunaklı Arapça web fontu ("Cairo", "Tajawal", "Noto Sans Arabic") ataması yapar.
 */
export function attachAdaptiveCanvasGuard(ctx) {
  if (!ctx || ctx.__memoAdaptiveGuardAttached) return ctx;
  try {
    ctx.__memoAdaptiveGuardAttached = true;
    ensureArabicCanvasFontsReady();

    const proto = Object.getPrototypeOf(ctx);
    const shadowBlurDesc =
      Object.getOwnPropertyDescriptor(proto, "shadowBlur") ||
      Object.getOwnPropertyDescriptor(ctx, "shadowBlur");

    if (shadowBlurDesc && typeof shadowBlurDesc.set === "function") {
      Object.defineProperty(ctx, "shadowBlur", {
        configurable: true,
        enumerable: true,
        get() {
          return shadowBlurDesc.get ? shadowBlurDesc.get.call(this) : 0;
        },
        set(val) {
          // Low-Spec aktifse tüm shadowBlur çağrılarını 0'a indirge (GPU darboğazını keser)
          shadowBlurDesc.set.call(this, isLowSpecDeviceActive() ? 0 : val);
        },
      });
    }

    // Eski Android WebView (Chrome < 99) için ctx.roundRect polyfill
    if (typeof ctx.roundRect !== "function") {
      ctx.roundRect = function (x, y, w, h, radii) {
        let r = 0;
        if (typeof radii === "number") r = radii;
        else if (Array.isArray(radii) && radii.length > 0) r = Number(radii[0]) || 0;
        r = Math.max(0, Math.min(r, Math.abs(w) / 2, Math.abs(h) / 2));
        this.moveTo(x + r, y);
        this.arcTo(x + w, y, x + w, y + h, r);
        this.arcTo(x + w, y + h, x, y + h, r);
        this.arcTo(x, y + h, x, y, r);
        this.arcTo(x, y, x + w, y, r);
        this.closePath();
        return this;
      };
    }

    // Faz 2 & 3: Otomatik BiDi (RTL/LTR) Yön, Ligature Koruması, 1.15x Arapça Font ve measureText Ölçeklemesi
    const origFillText = ctx.fillText ? ctx.fillText.bind(ctx) : null;
    const origStrokeText = ctx.strokeText ? ctx.strokeText.bind(ctx) : null;
    const origMeasureText = ctx.measureText ? ctx.measureText.bind(ctx) : null;

    const invokeLocalizedDraw = (origFn, text, x, y, maxWidth) => {
      const rawStr = String(text ?? "");
      const isRtl = containsRtlScript(rawStr);
      // BiDi isolation when RTL string contains parentheses, brackets, or Latin characters
      const str =
        isRtl && /[A-Za-z0-9()[\]{}<>]/.test(rawStr)
          ? wrapBiDiText(rawStr, "rtl")
          : rawStr;
      const prevDirection = ctx.direction;
      const prevLetterSpacing = ctx.letterSpacing;
      const prevFont = ctx.font;

      try {
        ctx.direction = isRtl ? "rtl" : "ltr";
        if (isRtl) {
          if ("letterSpacing" in ctx) {
            ctx.letterSpacing = "0px";
          }
          if (prevFont) {
            ctx.font = formatCanvasFontForRtl(prevFont, true);
          }
        }
        const drawY = isRtl && ctx.textBaseline === "middle" ? y + 1 : y;
        if (maxWidth !== undefined) {
          origFn(str, x, drawY, maxWidth);
        } else {
          origFn(str, x, drawY);
        }
      } finally {
        try {
          ctx.direction = prevDirection || "ltr";
          if (isRtl) {
            if ("letterSpacing" in ctx && prevLetterSpacing !== undefined) {
              ctx.letterSpacing = prevLetterSpacing;
            }
            if (prevFont) {
              ctx.font = prevFont;
            }
          }
        } catch {
          /* ignore */
        }
      }
    };

    if (origFillText) {
      ctx.fillText = function (text, x, y, maxWidth) {
        invokeLocalizedDraw(origFillText, text, x, y, maxWidth);
      };
    }

    if (origStrokeText) {
      ctx.strokeText = function (text, x, y, maxWidth) {
        invokeLocalizedDraw(origStrokeText, text, x, y, maxWidth);
      };
    }

    if (origMeasureText) {
      ctx.measureText = function (text) {
        const str = String(text ?? "");
        const isRtl = containsRtlScript(str);
        if (!isRtl) {
          return origMeasureText(str);
        }
        const prevDirection = ctx.direction;
        const prevLetterSpacing = ctx.letterSpacing;
        const prevFont = ctx.font;
        try {
          ctx.direction = "rtl";
          if ("letterSpacing" in ctx) {
            ctx.letterSpacing = "0px";
          }
          if (prevFont) {
            ctx.font = formatCanvasFontForRtl(prevFont, true);
          }
          return origMeasureText(str);
        } finally {
          try {
            ctx.direction = prevDirection || "ltr";
            if ("letterSpacing" in ctx && prevLetterSpacing !== undefined) {
              ctx.letterSpacing = prevLetterSpacing;
            }
            if (prevFont) {
              ctx.font = prevFont;
            }
          } catch {
            /* ignore */
          }
        }
      };
    }
  } catch {
    // Bazı eski WebView'larda defineProperty izin vermezse sessizce geç
  }
  return ctx;
}
