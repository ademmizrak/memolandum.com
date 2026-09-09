"use client";

import React, { useState, useEffect } from "react";
import { Bell, X, CheckCircle2 } from "lucide-react";
import {
  isWebNotificationSupported,
  requestNotificationPermission,
  showWebNotification,
} from "../../utils/localNotifications";

export default function NotificationPrompt() {
  const [show, setShow] = useState(false);
  const [granted, setGranted] = useState(false);

  useEffect(() => {
    if (!isWebNotificationSupported()) return;
    try {
      if (Notification.permission !== "default") return;
      if (sessionStorage.getItem("memolandum_hide_notif_banner") === "1") return;
      // 3 saniye sonra sakin bir animasyonla göster
      const timer = setTimeout(() => setShow(true), 3000);
      return () => clearTimeout(timer);
    } catch (_) {}
  }, []);

  const handleRequest = async () => {
    const ok = await requestNotificationPermission();
    if (ok) {
      setGranted(true);
      showWebNotification("Memolandum Bildirimleri Aktif! 🎉", {
        body: "Tekrar zamanı gelen kelimelerin olduğunda seni haberdar edeceğiz.",
      });
      setTimeout(() => setShow(false), 2500);
    } else {
      setShow(false);
    }
  };

  const handleDismiss = () => {
    setShow(false);
    try {
      sessionStorage.setItem("memolandum_hide_notif_banner", "1");
    } catch (_) {}
  };

  if (!show) return null;

  return (
    <div className="fixed bottom-5 right-5 z-40 max-w-sm w-[calc(100vw-40px)] bg-[#111827]/95 border border-amber-500/40 backdrop-blur-md p-4 rounded-2xl shadow-2xl shadow-black/80 animate-in fade-in slide-in-from-bottom-4 duration-300">
      {granted ? (
        <div className="flex items-center gap-3 text-emerald-400 font-semibold text-sm">
          <CheckCircle2 className="w-5 h-5 flex-shrink-0" />
          <span>Bildirimler başarıyla açıldı! Tekrarlarını kaçırmayacaksın.</span>
        </div>
      ) : (
        <div className="flex flex-col gap-2.5">
          <div className="flex items-start justify-between gap-2">
            <div className="flex items-center gap-2 text-amber-400 font-bold text-sm">
              <Bell className="w-4 h-4 animate-bounce" />
              <span>Kelime Serini Koru!</span>
            </div>
            <button
              onClick={handleDismiss}
              className="text-slate-400 hover:text-white p-1 transition-colors"
              aria-label="Kapat"
            >
              <X className="w-4 h-4" />
            </button>
          </div>
          <p className="text-xs text-slate-300 leading-relaxed m-0">
            Vadesi gelen kelimeleri unutmamak ve serini korumak için günlük tekrar hatırlatmalarını açmak ister misin?
          </p>
          <div className="flex items-center gap-2 mt-1">
            <button
              onClick={handleRequest}
              className="flex-1 py-1.5 px-3 bg-amber-500 hover:bg-amber-400 text-slate-950 font-bold text-xs rounded-lg transition-colors shadow-sm"
            >
              Bildirimleri Aç
            </button>
            <button
              onClick={handleDismiss}
              className="py-1.5 px-3 bg-slate-800 hover:bg-slate-700 text-slate-300 text-xs rounded-lg transition-colors"
            >
              Daha Sonra
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
