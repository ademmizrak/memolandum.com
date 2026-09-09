import { isDue } from "../lib/learning/memolandumPulse";

const REMINDER_NOTIFICATION_ID = 1;
const STORAGE_LAST_REMINDER = "memolandum_last_reminder_date";

/**
 * Native platformda LocalNotifications API'sini döner.
 * Web / desteklenmeyen ortam / plugin hatasında null (güvenli no-op).
 */
async function getNativeLocalNotifications() {
  if (typeof window === "undefined") return null;
  try {
    const { Capacitor } = await import("@capacitor/core");
    if (!Capacitor.isNativePlatform()) return null;
    const { LocalNotifications } = await import("@capacitor/local-notifications");
    return LocalNotifications;
  } catch {
    return null;
  }
}

/**
 * Web tarayıcısında Notification API destekleniyor mu?
 */
export function isWebNotificationSupported() {
  return typeof window !== "undefined" && "Notification" in window;
}

/**
 * Bildirim izin durumunu kontrol eder ('granted' | 'denied' | 'default' | 'unsupported').
 */
export async function getNotificationPermissionStatus() {
  if (typeof window === "undefined") return "unsupported";

  const LocalNotifications = await getNativeLocalNotifications();
  if (LocalNotifications) {
    try {
      const status = await LocalNotifications.checkPermissions();
      return status?.display || "default";
    } catch {
      return "default";
    }
  }

  if (isWebNotificationSupported()) {
    return Notification.permission; // 'granted', 'denied', 'default'
  }

  return "unsupported";
}

/**
 * Bildirim izni ister (Hem Native hem Web uyumlu).
 * Red / desteklenmiyor / hata → false, crash yok.
 * @returns {Promise<boolean>}
 */
export const requestNotificationPermission = async () => {
  if (typeof window === "undefined") return false;

  // 1. Native platform (Capacitor)
  const LocalNotifications = await getNativeLocalNotifications();
  if (LocalNotifications) {
    try {
      const existing = await LocalNotifications.checkPermissions();
      if (existing?.display === "granted") return true;
      if (existing?.display === "denied") return false;
      const requested = await LocalNotifications.requestPermissions();
      return requested?.display === "granted";
    } catch (e) {
      console.warn("Native notification permission request failed:", e);
      return false;
    }
  }

  // 2. Web Tarayıcısı (Chrome, Safari, Edge, PWA)
  if (isWebNotificationSupported()) {
    try {
      if (Notification.permission === "granted") return true;
      if (Notification.permission === "denied") return false;
      const res = await Notification.requestPermission();
      return res === "granted";
    } catch (e) {
      console.warn("Web notification permission request failed:", e);
      return false;
    }
  }

  return false;
};

/**
 * Web tarayıcısında anlık/planlı bildirim gösterir.
 */
export function showWebNotification(title, options = {}) {
  if (!isWebNotificationSupported() || Notification.permission !== "granted") {
    return null;
  }

  try {
    const notif = new Notification(title, {
      icon: "/favicon.ico",
      badge: "/favicon.ico",
      tag: options.tag || "memolandum-srs-reminder",
      body: options.body || "",
      silent: false,
      ...options,
    });

    notif.onclick = function () {
      try {
        window.focus();
        if (options.url) {
          window.location.href = options.url;
        } else {
          window.location.href = "/vocabulary";
        }
      } catch (_) {}
      notif.close();
    };

    return notif;
  } catch (e) {
    console.warn("Web notification display failed:", e);
    return null;
  }
}

/**
 * Günlük SRS hatırlatması (Native + Web Hibrit).
 * - Kasa boş → no-op
 * - İzin denied → no-op (crash yok)
 * - Native: LocalNotifications ile saat 20:00'ye planlar
 * - Web: Günde en fazla 1 kez vadesi gelen kelimeler için bildirim tetikler
 */
export const scheduleDailySrsReminder = async (vocabularyVault) => {
  if (typeof window === "undefined") return;

  const entries = Object.values(vocabularyVault || {});
  if (entries.length === 0) return;

  const dueCount = entries.filter((item) => isDue(item)).length;
  const LocalNotifications = await getNativeLocalNotifications();

  // ─── A. NATIVE (iOS / Android Capacitor) ──────────────────────────────────
  if (LocalNotifications) {
    try {
      const status = await LocalNotifications.checkPermissions();
      if (status?.display === "denied") return;

      let granted = status?.display === "granted";
      if (!granted) {
        const requested = await LocalNotifications.requestPermissions();
        granted = requested?.display === "granted";
        if (!granted) return;
      }

      await LocalNotifications.schedule({
        notifications: [
          {
            id: REMINDER_NOTIFICATION_ID,
            title: "Memolandum Tekrar Zamanı! 🧠",
            body:
              dueCount > 0
                ? `Kasanızda tekrar edilmeyi bekleyen ${dueCount} kelime var. Hadi hafızanı tazele!`
                : "Bugün yeni kelimeler öğrenmek ister misin? Arcade oyunları seni bekliyor!",
            schedule: {
              on: {
                hour: 20,
                minute: 0,
              },
              repeats: true,
            },
            actionTypeId: "OPEN_APP",
          },
        ],
      });
    } catch (e) {
      console.warn("Failed to schedule native local notification:", e);
    }
    return;
  }

  // ─── B. WEB TARAYICISI (Desktop / Mobil Web / PWA) ─────────────────────────
  if (isWebNotificationSupported()) {
    if (Notification.permission !== "granted") return;
    if (dueCount === 0) return;

    try {
      const today = new Date().toISOString().slice(0, 10);
      const lastShown = localStorage.getItem(STORAGE_LAST_REMINDER);

      // Günde en fazla 1 kez bildirim gönder (kullanıcıyı sıkmamak ve retention'ı korumak için)
      if (lastShown === today) return;

      // Sekme arka plandaysa veya kullanıcı sayfadayken vadesi gelen kelime hatırlatması
      const title = "Memolandum Tekrar Zamanı! 🧠";
      const body = `Kasanızda tekrar edilmeyi bekleyen ${dueCount} kelime var. Hadi serin bozulmasın!`;

      // Sayfa görünürlüğü değiştiğinde (sekmeden ayrıldığında) veya hemen göster
      const fire = () => {
        showWebNotification(title, {
          body,
          tag: "srs-due-reminder",
          url: "/vocabulary",
        });
        localStorage.setItem(STORAGE_LAST_REMINDER, today);
      };

      if (document.hidden) {
        fire();
      } else {
        // Kullanıcı sayfadayken sekme gizlendiğinde tetikle
        const onVisChange = () => {
          if (document.hidden) {
            fire();
            document.removeEventListener("visibilitychange", onVisChange);
          }
        };
        document.addEventListener("visibilitychange", onVisChange);
      }
    } catch (e) {
      console.warn("Web notification scheduling check failed:", e);
    }
  }
};
