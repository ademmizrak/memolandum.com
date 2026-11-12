"use client";

import React, { useState, useEffect } from "react";
import { Bell, X, CheckCircle2, Download } from "lucide-react";
import {
  isWebNotificationSupported,
  requestNotificationPermission,
  showWebNotification,
} from "../../utils/localNotifications";
import { useLocale } from "../../lib/i18n/LocaleProvider";
import { useMemolandumStore } from "../../store/useMemolandumStore";

const COPY = {
  tr: {
    title: "Öğrendiğin Kelimeleri Unutma!",
    desc: "Ana ekrana ekle veya tekrar zamanı gelen kelimelerin olduğunda hatırlatma al (günde en fazla 1 kez).",
    allowNotif: "🔔 Hatırlatıcıyı Aç",
    installPwa: "📲 Ana Ekrana Ekle",
    later: "Daha Sonra",
    closeAria: "Kapat",
    grantedMsg: "Bildirimler aktif! Tekrar zamanı geldiğinde haber vereceğiz.",
    notifTitle: "Memolandum Bildirimleri Aktif! 🎉",
    notifBody: "Tekrar zamanı gelen kelimelerin olduğunda seni haberdar edeceğiz.",
  },
  en: {
    title: "Never Forget Words You Learned!",
    desc: "Add Memolandum to your home screen or get a spaced-repetition reminder when words are due for review.",
    allowNotif: "🔔 Enable Reminders",
    installPwa: "📲 Add to Home Screen",
    later: "Later",
    closeAria: "Close",
    grantedMsg: "Reminders enabled! We will notify you when words are due.",
    notifTitle: "Memolandum Reminders Active! 🎉",
    notifBody: "We will let you know when your vocabulary is due for review.",
  },
  ar: {
    title: "لا تنسَ الكلمات التي تعلمتها!",
    desc: "أضف Memolandum إلى شاشتك الرئيسية أو فعّل تذكير التكرار المتباعد عند حلول موعد مراجعة كلماتك.",
    allowNotif: "🔔 تفعيل التذكير",
    installPwa: "📲 أضف للشاشة الرئيسية",
    later: "لاحقاً",
    closeAria: "إغلاق",
    grantedMsg: "تم تفعيل التذكيرات بنجاح! سنخبرك عند حلول موعد المراجعة.",
    notifTitle: "تم تفعيل إشعارات Memolandum! 🎉",
    notifBody: "سنقوم بتذكيرك عندما يحين وقت مراجعة كلماتك.",
  },
  pt: {
    title: "Não Esqueça as Palavras Aprendidas!",
    desc: "Adicione o Memolandum à tela inicial ou ative lembretes de repetição espaçada para revisar suas palavras.",
    allowNotif: "🔔 Ativar Lembretes",
    installPwa: "📲 Adicionar à Tela Inicial",
    later: "Depois",
    closeAria: "Fechar",
    grantedMsg: "Lembretes ativados! Avisaremos quando for hora de revisar.",
    notifTitle: "Lembretes do Memolandum Ativos! 🎉",
    notifBody: "Avisaremos quando suas palavras estiverem prontas para revisão.",
  },
};

export default function NotificationPrompt() {
  const { locale } = useLocale();
  const c = COPY[locale] || COPY.tr;

  const quizHistory = useMemolandumStore((s) => s.quizHistory) || [];
  const vocabularyVault = useMemolandumStore((s) => s.vocabularyVault) || {};
  const totalXp = useMemolandumStore((s) => s.globalStats?.totalXp) || 0;

  const [show, setShow] = useState(false);
  const [granted, setGranted] = useState(false);
  const [deferredPrompt, setDeferredPrompt] = useState(null);

  const hasEngaged =
    quizHistory.length >= 1 ||
    Object.keys(vocabularyVault).length >= 2 ||
    totalXp > 0;

  useEffect(() => {
    if (typeof window === "undefined") return undefined;
    const onBeforeInstall = (e) => {
      e.preventDefault();
      setDeferredPrompt(e);
    };
    window.addEventListener("beforeinstallprompt", onBeforeInstall);
    return () => window.removeEventListener("beforeinstallprompt", onBeforeInstall);
  }, []);

  useEffect(() => {
    if (!hasEngaged) return undefined;
    try {
      if (sessionStorage.getItem("memolandum_hide_notif_banner") === "1") return undefined;
      const canNotif =
        isWebNotificationSupported() && Notification.permission === "default";
      if (!canNotif && !deferredPrompt) return undefined;

      const timer = setTimeout(() => setShow(true), 2000);
      return () => clearTimeout(timer);
    } catch (_) {
      return undefined;
    }
  }, [hasEngaged, deferredPrompt]);

  const handleRequest = async () => {
    const ok = await requestNotificationPermission();
    if (ok) {
      setGranted(true);
      showWebNotification(c.notifTitle, {
        body: c.notifBody,
      });
      setTimeout(() => setShow(false), 2500);
    } else if (!deferredPrompt) {
      setShow(false);
    }
  };

  const handleInstallPwa = async () => {
    if (!deferredPrompt) return;
    try {
      deferredPrompt.prompt();
      await deferredPrompt.userChoice;
    } catch (_) {
      /* ignore */
    }
    setDeferredPrompt(null);
    setShow(false);
  };

  const handleDismiss = () => {
    setShow(false);
    try {
      sessionStorage.setItem("memolandum_hide_notif_banner", "1");
    } catch (_) {}
  };

  if (!show) return null;

  const canNotif =
    typeof window !== "undefined" &&
    isWebNotificationSupported() &&
    Notification.permission === "default";

  return (
    <div
      dir={locale === "ar" ? "rtl" : "ltr"}
      className="fixed bottom-20 sm:bottom-5 right-4 sm:right-5 rtl:right-auto rtl:left-4 sm:rtl:left-5 z-[75] max-w-sm w-[calc(100vw-32px)] sm:w-[calc(100vw-40px)] bg-[#111827]/95 border border-amber-500/40 backdrop-blur-md p-4 rounded-2xl shadow-2xl shadow-black/80 animate-in fade-in slide-in-from-bottom-4 duration-300"
    >
      {granted ? (
        <div className="flex items-center gap-3 text-emerald-400 font-semibold text-sm">
          <CheckCircle2 className="w-5 h-5 flex-shrink-0" />
          <span>{c.grantedMsg}</span>
        </div>
      ) : (
        <div className="flex flex-col gap-2.5">
          <div className="flex items-start justify-between gap-2">
            <div className="flex items-center gap-2 text-amber-400 font-bold text-sm">
              <Bell className="w-4 h-4 animate-bounce shrink-0" />
              <span>{c.title}</span>
            </div>
            <button
              onClick={handleDismiss}
              className="text-slate-400 hover:text-white p-1 transition-colors cursor-pointer"
              aria-label={c.closeAria}
            >
              <X className="w-4 h-4" />
            </button>
          </div>
          <p className="text-xs text-slate-300 leading-relaxed m-0">{c.desc}</p>
          <div className="flex flex-wrap items-center gap-2 mt-1">
            {deferredPrompt && (
              <button
                onClick={handleInstallPwa}
                className="flex-1 py-1.5 px-3 bg-cyan-500 hover:bg-cyan-400 text-slate-950 font-black text-xs rounded-lg transition-colors shadow-sm inline-flex items-center justify-center gap-1 cursor-pointer"
              >
                <Download className="w-3.5 h-3.5" />
                <span>{c.installPwa}</span>
              </button>
            )}
            {canNotif && (
              <button
                onClick={handleRequest}
                className="flex-1 py-1.5 px-3 bg-amber-500 hover:bg-amber-400 text-slate-950 font-bold text-xs rounded-lg transition-colors shadow-sm cursor-pointer"
              >
                {c.allowNotif}
              </button>
            )}
            <button
              onClick={handleDismiss}
              className="py-1.5 px-3 bg-slate-800 hover:bg-slate-700 text-slate-300 text-xs rounded-lg transition-colors cursor-pointer"
            >
              {c.later}
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
