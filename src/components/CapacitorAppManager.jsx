"use client";

import { useEffect } from "react";
import { Capacitor } from "@capacitor/core";
import { pauseAllGameAudio } from "../engines/soundManager";
import { stopTts } from "../lib/pronunciation";

function pauseActiveArcadeGameIfPlaying() {
  if (typeof document === "undefined") return false;

  // If the React PauseScreen overlay is already open, do nothing
  if (document.getElementById("mm-pause-overlay")) {
    return false;
  }

  // Legacy base.jsx pause overlay check
  const legacyPause = document.getElementById("pause-screen");
  if (legacyPause && !legacyPause.classList.contains("hidden")) {
    return false;
  }

  // Find active HUD pause button across all arcade & WordCard shells
  const pauseBtn =
    document.getElementById("hudPauseBtn") ||
    document.getElementById("card-btn-pause") ||
    document.getElementById("btn-pause");

  if (pauseBtn && pauseBtn.offsetParent !== null) {
    pauseBtn.click();
    return true;
  }

  return false;
}

function handleAppBackgrounded() {
  if (typeof window === "undefined") return;

  // 1. Stop TTS and suspend all SoundManager WebAudio / HTML5 Audio pools
  stopTts();
  pauseAllGameAudio();

  // 2. Pause any standalone HTML5 <audio> or <video> elements
  try {
    const mediaElements = document.querySelectorAll("audio, video");
    mediaElements.forEach((el) => {
      try {
        if (!el.paused) el.pause();
      } catch {
        /* ignore */
      }
    });
  } catch {
    /* ignore */
  }

  // 3. Pause active HTML5 Canvas arcade game loops
  pauseActiveArcadeGameIfPlaying();

  // 4. Broadcast custom event for any specialized listeners
  window.dispatchEvent(new CustomEvent("mm:app-background"));
}

export default function CapacitorAppManager() {
  useEffect(() => {
    if (typeof window === "undefined") return undefined;

    const onVisibilityChange = () => {
      if (document.hidden) {
        handleAppBackgrounded();
      }
    };
    document.addEventListener("visibilitychange", onVisibilityChange);

    if (!Capacitor.isNativePlatform()) {
      return () => {
        document.removeEventListener("visibilitychange", onVisibilityChange);
      };
    }

    let backButtonHandle = null;
    let appStateHandle = null;
    let urlOpenHandle = null;

    // 1. Configure Native StatusBar & SplashScreen
    import("@capacitor/status-bar")
      .then(async ({ StatusBar, Style }) => {
        try {
          await StatusBar.setStyle({ style: Style.Dark });
          if (Capacitor.getPlatform() === "android") {
            await StatusBar.setBackgroundColor({ color: "#0d0d1a" });
          }
        } catch {
          /* ignore */
        }
      })
      .catch(() => {});

    import("@capacitor/splash-screen")
      .then(async ({ SplashScreen }) => {
        try {
          await SplashScreen.hide();
        } catch {
          /* ignore */
        }
      })
      .catch(() => {});

    // 2. Register @capacitor/app Hardware Back Button, App State & Deep Links
    import("@capacitor/app")
      .then(async ({ App }) => {
        backButtonHandle = await App.addListener("backButton", ({ canGoBack }) => {
          // A) Allow open modals, drawers, WordCard states, or PauseScreen to close first
          const cancelableEvent = new CustomEvent("mm:hardware-back", {
            cancelable: true,
          });
          window.dispatchEvent(cancelableEvent);
          if (cancelableEvent.defaultPrevented) {
            return;
          }

          // B) Check legacy pause screen in base.jsx
          const legacyPause = document.getElementById("pause-screen");
          if (legacyPause && !legacyPause.classList.contains("hidden")) {
            const resumeBtn = document.getElementById("resume-btn");
            if (resumeBtn) {
              resumeBtn.click();
              return;
            }
          }

          // C) If an arcade game is actively playing, pause it first instead of abruptly exiting
          if (pauseActiveArcadeGameIfPlaying()) {
            return;
          }

          // D) Route navigation if not on root '/'
          const pathname = window.location.pathname || "/";
          const isRoot = pathname === "/" || pathname === "/index.html";

          if (!isRoot) {
            if (canGoBack || window.history.length > 1) {
              window.history.back();
            } else {
              window.location.href = "/";
            }
            return;
          }

          // E) On root '/', minimize the app instead of killing the process
          App.minimizeApp().catch(() => {});
        });

        appStateHandle = await App.addListener("appStateChange", ({ isActive }) => {
          if (!isActive) {
            handleAppBackgrounded();
          } else {
            window.dispatchEvent(new CustomEvent("mm:app-foreground"));
          }
        });

        urlOpenHandle = await App.addListener("appUrlOpen", (event) => {
          try {
            if (!event?.url) return;
            const parsed = new URL(event.url);
            if (parsed.pathname && parsed.pathname !== "/") {
              window.location.href = `${parsed.pathname}${parsed.search || ""}${parsed.hash || ""}`;
            }
          } catch {
            /* ignore */
          }
        });
      })
      .catch((err) => {
        console.warn("[CapacitorAppManager] @capacitor/app init failed:", err);
      });

    return () => {
      document.removeEventListener("visibilitychange", onVisibilityChange);
      backButtonHandle?.remove?.();
      appStateHandle?.remove?.();
      urlOpenHandle?.remove?.();
    };
  }, []);

  return null;
}
