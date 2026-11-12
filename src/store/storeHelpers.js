import { saveWordToCloud, deleteWordFromCloud } from '../lib/firebase/authService';
import { emptyProfileStats } from '../lib/profiles/studyProfileService';
import { doc, setDoc } from 'firebase/firestore';
import { db } from '../lib/firebase/config';

export const MEMOLANDUM_STORAGE_KEY = "memolandum-storage";

export const emptyGlobal = () => ({
  total_score: 0,
  total_xp: 0,
  gems: 0,
  level: 1,
  game_breakdown: {},
});

export function cloudSyncWord(uid, wordId, wordData) {
  if (!uid || !wordId || !wordData) return;
  saveWordToCloud(uid, wordId, wordData).catch(() => {});
}

export const limitVaultTo50 = (vault, uid) => {
  const entries = Object.entries(vault);
  // Genel hafızadaki sınır 50'den 5000'e çıkarıldı, böylece akademik kavramlar ve kelimeler silinmeden hafızada tutulur.
  if (entries.length <= 5000) return vault;

  // Sort by lastSeen descending (newest first)
  entries.sort((a, b) => {
    const aTime = Number(a[1].lastSeen) || Number(a[1].dueAt) || 0;
    const bTime = Number(b[1].lastSeen) || Number(b[1].dueAt) || 0;
    return bTime - aTime;
  });

  const keptEntries = entries.slice(0, 5000);
  const removedEntries = entries.slice(5000);

  const newVault = {};
  keptEntries.forEach(([key, val]) => {
    newVault[key] = val;
  });

  // Async delete removed entries from cloud
  if (uid) {
    removedEntries.forEach(([key]) => {
      deleteWordFromCloud(uid, key).catch(() => {});
    });
  }

  return newVault;
};

export const triggerNotificationUpdate = (vault) => {
  if (typeof window === "undefined") return;
  import("../utils/localNotifications")
    .then(({ scheduleDailySrsReminder }) => {
      scheduleDailySrsReminder(vault);
    })
    .catch((err) => console.warn("Notification sync warning:", err));
};

export const triggerHaptic = async (isCorrect) => {
  if (typeof window === "undefined") return;
  try {
    const { Capacitor } = await import("@capacitor/core");
    if (!Capacitor.isNativePlatform()) return;

    const { Haptics, ImpactStyle, NotificationType } = await import("@capacitor/haptics");
    if (isCorrect) {
      await Haptics.impact({ style: ImpactStyle.Light });
    } else {
      await Haptics.notification({ type: NotificationType.Error });
    }
  } catch (e) {
    /* ignore */
  }
};

/** lastPlayed → Firestore profileStats (enterprise resume) */
export function cloudSyncStudyContext(uid, profileId, ctx) {
  if (!uid || !profileId || !ctx || !db) return;
  setDoc(
    doc(db, 'users', uid, 'profileStats', profileId),
    {
      lastPlayedLang: ctx.langId,
      lastPlayedLevel: ctx.levelId,
      lastPlayedGame: ctx.gameId,
      lastPlayedAt: ctx.lastPlayedAt || Date.now(),
    },
    { merge: true }
  ).catch(() => {});
}

export function snapshotActive(state) {
  const id = state.activeStudyProfileId;
  if (!id) return state.profileStatsMap || {};
  return {
    ...(state.profileStatsMap || {}),
    [id]: {
      ...emptyProfileStats(),
      ...(state.profileStatsMap?.[id] || {}),
      total_score: state.globalStats?.total_score || 0,
      total_xp: state.globalStats?.total_xp || 0,
      gems: state.globalStats?.gems || 0,
      level: state.globalStats?.level || 1,
      game_breakdown: state.globalStats?.game_breakdown || {},
      lastPlayedLang: state.lastPlayedLang,
      lastPlayedLevel: state.lastPlayedLevel,
      lastPlayedGame: state.lastPlayedGame,
      lastPlayedAt: state.lastPlayedAt,
    },
  };
}

export const hybridStorage = {
  getItem: async (name) => {
    if (typeof window === "undefined") return null;
    try {
      const { Preferences } = await import("@capacitor/preferences");
      const { value } = await Preferences.get({ key: name });
      // Preferences web'de Cap key kullanır; eski düz localStorage yedeği
      if (value != null) return value;
      return localStorage.getItem(name);
    } catch {
      return localStorage.getItem(name);
    }
  },
  setItem: async (name, value) => {
    if (typeof window === "undefined") return;
    try {
      const { Preferences } = await import("@capacitor/preferences");
      await Preferences.set({ key: name, value });
    } catch {
      localStorage.setItem(name, value);
    }
  },
  // Preferences + legacy localStorage — biri başarısız olsa diğeri yine silinir (web bozulmaz)
  removeItem: async (name) => {
    if (typeof window === "undefined") return;
    try {
      const { Preferences } = await import("@capacitor/preferences");
      await Preferences.remove({ key: name });
    } catch {
      /* Preferences yok / native değil */
    }
    try {
      localStorage.removeItem(name);
    } catch {
      /* ignore */
    }
  },
};
