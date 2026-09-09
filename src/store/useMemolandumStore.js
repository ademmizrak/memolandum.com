import { create } from 'zustand';
import { persist, createJSONStorage } from 'zustand/middleware';
import { updateUserAvatarInFirebase, saveWordToCloud, deleteWordFromCloud } from '../lib/firebase/authService';
import {
  buildStudyProfile,
  emptyProfileStats,
  makeStudyProfileId,
} from '../lib/profiles/studyProfileService';
import {
  createPulseEntry,
  findVaultItem,
  migrateVaultItem,
  migrateVaultMap,
  PulseQuality,
  qualityFromGameResult,
  resolveWordId,
  schedulePulse,
} from '../lib/learning/memolandumPulse';
import { processLearningAction } from '../lib/learning/learningEngineAdapter';
import {
  normalizeStudyContext,
  pickNewerStudyContext,
  resolveResumeContext,
} from '../lib/learning/studyContext';
import { doc, setDoc } from 'firebase/firestore';
import { db } from '../lib/firebase/config';

const emptyGlobal = () => ({
  total_score: 0,
  total_xp: 0,
  gems: 0,
  level: 1,
  game_breakdown: {},
});

function cloudSyncWord(uid, wordId, wordData) {
  if (!uid || !wordId || !wordData) return;
  saveWordToCloud(uid, wordId, wordData).catch(() => {});
}

const limitVaultTo50 = (vault, uid) => {
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


const triggerNotificationUpdate = (vault) => {
  if (typeof window === "undefined") return;
  import("../utils/localNotifications")
    .then(({ scheduleDailySrsReminder }) => {
      scheduleDailySrsReminder(vault);
    })
    .catch((err) => console.warn("Notification sync warning:", err));
};

const triggerHaptic = async (isCorrect) => {
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
function cloudSyncStudyContext(uid, profileId, ctx) {
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

function snapshotActive(state) {
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

export const MEMOLANDUM_STORAGE_KEY = "memolandum-storage";

const hybridStorage = {
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

/** Logout / hesap silme: Preferences + localStorage + bellek (hesaplar arası sızıntıyı keser). */
export async function clearMemolandumPersistedStorage() {
  if (typeof window === "undefined") return;
  try {
    await useMemolandumStore.persist?.clearStorage?.();
  } catch {
    /* ignore */
  }
  try {
    await hybridStorage.removeItem(MEMOLANDUM_STORAGE_KEY);
  } catch {
    /* ignore */
  }
}

export const useMemolandumStore = create(
  persist(
    (set, get) => ({
      uid: null,
      profile: null,

      globalStats: emptyGlobal(),
      lastPlayedLevel: null,
      lastPlayedLang: null,
      lastPlayedGame: null,
      lastPlayedAt: 0,
      isChallengeMode: false,
      guestProgressPending: false,

      // Dil bazlı öğrenme profilleri (aynı hesap / cihaz)
      studyProfiles: [],
      activeStudyProfileId: null,
      profileStatsMap: {},

      // Veli & Öğrenci Ekosistemi (Parent & Student Ecosystem)
      isParentAccount: false,
      parentEmailDigest: true,
      childrenProfiles: [],
      activeChildId: null,
      parentActivityLog: [],
      joinedClassroom: null,

      isAuthenticated: false,
      isAuthLoading: false,
      isGuest: true,
      isEmailVerified: false,
      isPremium: false,
      /** 'revenuecat' | 'firestore' | null — native IAP'yi Firestore false ile ezmemek için */
      premiumSource: null,
      translationCount: 0,
      lastAuthenticatedUid: null,

      setAuthUser: (user) => set((state) => {
        const nextUid = user ? user.uid : null;
        const uidChanged = nextUid !== state.uid;
        return {
          uid: nextUid,
          profile: user
            ? {
                displayName: user.displayName,
                email: user.email,
                photoURL: user.photoURL,
              }
            : null,
          isAuthenticated: !!user,
          isAuthLoading: false,
          isGuest: !user,
          isEmailVerified: user ? user.emailVerified || true : false,
          // Çeviri kotası hesaba özel — önceki misafir/başka üye sayacı taşınmasın
          ...(uidChanged ? { translationCount: 0 } : {}),
          ...(user ? { lastAuthenticatedUid: user.uid } : {}),
        };
      }),

      setIsEmailVerified: (status) => set({ isEmailVerified: status }),

      /**
       * Kanonik kaldığın yer — levelId’den lang türetilir; geçersiz çiftler reddedilir.
       * Firestore’a LWW timestamp ile yazılır.
       */
      setLastPlayed: (lang, level, game) => {
        const state = get();
        const normalized = normalizeStudyContext({
          langId: lang,
          levelId: level,
          gameId: game || state.lastPlayedGame,
          lastPlayedAt: Date.now(),
        });
        if (!normalized) {
          console.warn('[setLastPlayed] geçersiz context', { lang, level, game });
          return;
        }
        const next = {
          lastPlayedLang: normalized.langId,
          lastPlayedLevel: normalized.levelId,
          lastPlayedGame: normalized.gameId,
          lastPlayedAt: normalized.lastPlayedAt,
        };
        const id = state.activeStudyProfileId;
        if (!id) {
          set(next);
          return;
        }
        set({
          ...next,
          profileStatsMap: {
            ...state.profileStatsMap,
            [id]: {
              ...emptyProfileStats(),
              ...(state.profileStatsMap[id] || {}),
              ...next,
              total_score: state.globalStats.total_score,
              total_xp: state.globalStats.total_xp,
              gems: state.globalStats.gems,
              level: state.globalStats.level,
              game_breakdown: state.globalStats.game_breakdown,
            },
          },
        });
        cloudSyncStudyContext(state.uid, id, normalized);
      },

      /** Güvenli resume (UI / oyun) */
      getResumeContext: () => {
        const s = get();
        return resolveResumeContext({
          lastPlayedLang: s.lastPlayedLang,
          lastPlayedLevel: s.lastPlayedLevel,
          lastPlayedGame: s.lastPlayedGame,
          lastPlayedAt: s.lastPlayedAt,
        });
      },

      toggleChallengeMode: () => set((state) => ({
        isChallengeMode: !state.isChallengeMode
      })),

      syncGlobalStats: (firestoreStats) => set((state) => {
        const localStats = state.globalStats || {};
        const localBreakdown = localStats.game_breakdown || {};
        const firestoreBreakdown = (firestoreStats && typeof firestoreStats.game_breakdown === 'object' && firestoreStats.game_breakdown) || {};

        const mergedBreakdown = { ...localBreakdown };
        Object.keys(firestoreBreakdown).forEach((gId) => {
          const l = localBreakdown[gId] || { score: 0, xp: 0, gems: 0 };
          const f = firestoreBreakdown[gId] || { score: 0, xp: 0, gems: 0 };
          mergedBreakdown[gId] = {
            score: Math.max(l.score || 0, f.score || 0),
            xp: Math.max(l.xp || 0, f.xp || 0),
            gems: Math.max(l.gems || 0, f.gems || 0),
          };
        });

        const next = {
          total_score: Math.max(localStats.total_score || 0, Number(firestoreStats?.total_score) || 0),
          total_xp: Math.max(localStats.total_xp || 0, Number(firestoreStats?.total_xp) || 0),
          gems: Math.max(localStats.gems || 0, Number(firestoreStats?.gems) || 0),
          level: Math.max(localStats.level || 1, Number(firestoreStats?.level) || 1),
          game_breakdown: mergedBreakdown
        };

        // LWW: bulut lastPlayed yalnızca daha yeniyse ve manifest’te geçerliyse uygulanır
        const picked = pickNewerStudyContext(
          {
            langId: state.lastPlayedLang,
            levelId: state.lastPlayedLevel,
            gameId: state.lastPlayedGame,
            lastPlayedAt: state.lastPlayedAt,
          },
          {
            langId: firestoreStats.lastPlayedLang,
            levelId: firestoreStats.lastPlayedLevel,
            gameId: firestoreStats.lastPlayedGame,
            lastPlayedAt: firestoreStats.lastPlayedAt,
          }
        );

        const resumeFields = {
          lastPlayedLang: picked.langId,
          lastPlayedLevel: picked.levelId,
          lastPlayedGame: picked.gameId,
          lastPlayedAt: picked.lastPlayedAt || state.lastPlayedAt || 0,
        };

        const id = state.activeStudyProfileId;
        const map = id
          ? {
              ...state.profileStatsMap,
              [id]: {
                ...emptyProfileStats(),
                ...(state.profileStatsMap[id] || {}),
                ...next,
                ...resumeFields,
              },
            }
          : state.profileStatsMap;

        return {
          globalStats: next,
          profileStatsMap: map,
          ...resumeFields,
        };
      }),

      resetLocalProgress: () => set({
        globalStats: emptyGlobal(),
        guestProgressPending: false
      }),

      /** Aynı cihazda hesap değiştirirken yerel ilerleme/kasa/profilleri temizle */
      clearForAccountSwitch: () => set({
        globalStats: emptyGlobal(),
        guestProgressPending: false,
        vocabularyVault: {},
        studyProfiles: [],
        activeStudyProfileId: null,
        profileStatsMap: {},
        lastPlayedLang: null,
        lastPlayedLevel: null,
        lastPlayedGame: null,
        lastPlayedAt: 0,
        translationCount: 0,
        activeCustomWords: null,
        isPremium: false,
        premiumSource: null,
        lastAuthenticatedUid: null,
        isParentAccount: false,
        parentEmailDigest: true,
        childrenProfiles: [],
        activeChildId: null,
        parentActivityLog: [],
        joinedClassroom: null,
      }),

      clearGuestProgressPending: () => set({ guestProgressPending: false }),

      ensureDefaultStudyProfile: () => {
        const state = get();
        if (state.studyProfiles?.length > 0 && state.activeStudyProfileId) return state.activeStudyProfileId;
        const profile = buildStudyProfile({ langPair: 'en-tr', label: 'İngilizce' });
        const stats = {
          ...emptyProfileStats(),
          ...state.globalStats,
          lastPlayedLang: state.lastPlayedLang,
          lastPlayedLevel: state.lastPlayedLevel,
        };
        set({
          studyProfiles: [profile],
          activeStudyProfileId: profile.id,
          profileStatsMap: { [profile.id]: stats },
        });
        return profile.id;
      },

      setStudyProfiles: (profiles) => set({ studyProfiles: profiles || [] }),

      addStudyProfile: (langPair, label) => {
        const state = get();
        const id = makeStudyProfileId(langPair);
        if (state.studyProfiles.some((p) => p.id === id)) {
          get().switchStudyProfile(id);
          return id;
        }
        if (state.studyProfiles.length >= 8) {
          throw new Error('En fazla 8 dil profili oluşturabilirsiniz.');
        }
        const savedMap = snapshotActive(state);
        const profile = buildStudyProfile({ langPair, label, id });
        set({
          studyProfiles: [...state.studyProfiles, profile],
          activeStudyProfileId: profile.id,
          profileStatsMap: {
            ...savedMap,
            [profile.id]: emptyProfileStats(),
          },
          globalStats: emptyGlobal(),
          lastPlayedLang: null,
          lastPlayedLevel: null,
          lastPlayedGame: null,
          lastPlayedAt: 0,
          activeCustomWords: null,
        });
        return profile.id;
      },

      switchStudyProfile: (profileId) => {
        const state = get();
        if (!profileId || profileId === state.activeStudyProfileId) return;
        const exists = state.studyProfiles.some((p) => p.id === profileId);
        if (!exists) return;

        const savedMap = snapshotActive(state);
        const incoming = savedMap[profileId] || emptyProfileStats();
        const resume = resolveResumeContext({
          lastPlayedLang: incoming.lastPlayedLang,
          lastPlayedLevel: incoming.lastPlayedLevel,
          lastPlayedGame: incoming.lastPlayedGame,
          lastPlayedAt: incoming.lastPlayedAt,
        });
        set({
          activeStudyProfileId: profileId,
          profileStatsMap: savedMap,
          globalStats: {
            total_score: incoming.total_score || 0,
            total_xp: incoming.total_xp || 0,
            gems: incoming.gems || 0,
            level: incoming.level || 1,
            game_breakdown: incoming.game_breakdown || {},
          },
          lastPlayedLang: resume.langId,
          lastPlayedLevel: resume.levelId,
          lastPlayedGame: resume.gameId,
          lastPlayedAt: resume.lastPlayedAt || 0,
          activeCustomWords: null,
        });
      },

      hydrateStudyProfiles: ({ profiles, activeId, statsById } = {}) => {
        const list = profiles?.length ? profiles : [];
        const id = activeId && list.some((p) => p.id === activeId)
          ? activeId
          : list[0]?.id || null;
        const map = { ...(statsById || {}) };
        const activeStats = (id && map[id]) || emptyProfileStats();
        const state = get();
        const picked = pickNewerStudyContext(
          {
            langId: state.lastPlayedLang,
            levelId: state.lastPlayedLevel,
            gameId: state.lastPlayedGame,
            lastPlayedAt: state.lastPlayedAt,
          },
          {
            langId: activeStats.lastPlayedLang,
            levelId: activeStats.lastPlayedLevel,
            gameId: activeStats.lastPlayedGame,
            lastPlayedAt: activeStats.lastPlayedAt,
          }
        );
        set({
          studyProfiles: list,
          activeStudyProfileId: id,
          profileStatsMap: map,
          globalStats: {
            total_score: activeStats.total_score || 0,
            total_xp: activeStats.total_xp || 0,
            gems: activeStats.gems || 0,
            level: activeStats.level || 1,
            game_breakdown: activeStats.game_breakdown || {},
          },
          lastPlayedLang: picked.langId,
          lastPlayedLevel: picked.levelId,
          lastPlayedGame: picked.gameId,
          lastPlayedAt: picked.lastPlayedAt || 0,
        });
      },

      getActiveStudyProfile: () => {
        const state = get();
        return state.studyProfiles.find((p) => p.id === state.activeStudyProfileId) || null;
      },

      // --- Veli & Öğrenci Yönetim Eylemleri (Parent-Student Actions) ---
      setIsParentAccount: (isParent) => {
        set({ isParentAccount: !!isParent });
        const uid = get().uid;
        if (uid) {
          import('../lib/firebase/authService').then(({ syncParentDataToCloud }) => {
            syncParentDataToCloud(uid, { isParentAccount: !!isParent });
          }).catch(() => {});
        }
      },

      setParentEmailDigest: (status) => {
        set({ parentEmailDigest: !!status });
        const uid = get().uid;
        if (uid) {
          import('../lib/firebase/authService').then(({ syncParentDataToCloud }) => {
            syncParentDataToCloud(uid, { parentEmailDigest: !!status });
          }).catch(() => {});
        }
      },

      addChildProfile: (childData) => {
        const state = get();
        const childId = childData.id || `child_${Date.now()}_${Math.random().toString(36).slice(2, 6)}`;
        const seed = encodeURIComponent(childData.name || "Child");
        const newChild = {
          id: childId,
          name: childData.name || "Öğrenci",
          grade: childData.grade || "meb-2-sinif-kelimeleri",
          gradeLabel: childData.gradeLabel || "2. Sınıf MEB İngilizce",
          avatar: childData.avatar || `https://api.dicebear.com/9.x/bottts/svg?seed=${seed}`,
          dailyTarget: Number(childData.dailyTarget) || 15,
          createdAt: Date.now(),
          lastStudiedAt: Date.now(),
          lastStudiedTopic: "Henüz derse başlanmadı",
        };

        const nextChildren = [...(state.childrenProfiles || []), newChild];
        set({
          isParentAccount: true,
          childrenProfiles: nextChildren,
          activeChildId: childId,
          ...(newChild.grade ? { lastPlayedLevel: newChild.grade, lastPlayedLang: 'en-tr' } : {}),
        });

        const uid = state.uid;
        if (uid) {
          import('../lib/firebase/authService').then(({ syncParentDataToCloud }) => {
            syncParentDataToCloud(uid, {
              isParentAccount: true,
              childrenProfiles: nextChildren,
              activeChildId: childId,
            });
          }).catch(() => {});
        }
        return childId;
      },

      updateChildProfile: (childId, updates) => {
        const state = get();
        const nextChildren = (state.childrenProfiles || []).map((c) =>
          c.id === childId ? { ...c, ...updates } : c
        );
        set({ childrenProfiles: nextChildren });

        const uid = state.uid;
        if (uid) {
          import('../lib/firebase/authService').then(({ syncParentDataToCloud }) => {
            syncParentDataToCloud(uid, { childrenProfiles: nextChildren });
          }).catch(() => {});
        }
      },

      removeChildProfile: (childId) => {
        const state = get();
        const nextChildren = (state.childrenProfiles || []).filter((c) => c.id !== childId);
        const nextActiveId = state.activeChildId === childId
          ? (nextChildren[0]?.id || null)
          : state.activeChildId;

        set({
          childrenProfiles: nextChildren,
          activeChildId: nextActiveId,
          ...(nextChildren.length === 0 ? { isParentAccount: false } : {}),
        });

        const uid = state.uid;
        if (uid) {
          import('../lib/firebase/authService').then(({ syncParentDataToCloud }) => {
            syncParentDataToCloud(uid, {
              childrenProfiles: nextChildren,
              activeChildId: nextActiveId,
              isParentAccount: nextChildren.length > 0,
            });
          }).catch(() => {});
        }
      },

      setActiveChild: (childId) => {
        const state = get();
        const child = (state.childrenProfiles || []).find((c) => c.id === childId);
        if (!child) return;

        set({
          activeChildId: childId,
          ...(child.grade ? { lastPlayedLevel: child.grade, lastPlayedLang: 'en-tr' } : {}),
        });

        const uid = state.uid;
        if (uid) {
          import('../lib/firebase/authService').then(({ syncParentDataToCloud }) => {
            syncParentDataToCloud(uid, { activeChildId: childId });
          }).catch(() => {});
        }
      },

      logParentActivity: ({ type, summary, wordsCount = 1, score = 0, levelId = null } = {}) => {
        const state = get();
        const hasChildren = state.childrenProfiles && state.childrenProfiles.length > 0;
        if (!state.isParentAccount && !hasChildren) return;

        const activeChild = hasChildren
          ? (state.childrenProfiles.find((c) => c.id === state.activeChildId) || state.childrenProfiles[0])
          : null;
        const now = Date.now();
        const childName = activeChild?.name || state.profile?.displayName || "Öğrenci";
        const childId = activeChild?.id || "default_student";

        const prevLogs = state.parentActivityLog || [];
        const lastLog = prevLogs[0];

        // 5 dakika içinde aynı çocuğa ait aktivite varsa tek oturum olarak birleştir
        let nextLogs;
        if (lastLog && lastLog.childId === childId && (now - lastLog.timestamp) < 5 * 60 * 1000) {
          const combinedCount = (lastLog.wordsCount || 0) + (Number(wordsCount) || 1);
          const combinedScore = (lastLog.score || 0) + (Number(score) || 0);
          const updatedLog = {
            ...lastLog,
            timestamp: now,
            wordsCount: combinedCount,
            score: combinedScore,
            summary: summary || `${combinedCount} kelime çalışıldı`,
          };
          nextLogs = [updatedLog, ...prevLogs.slice(1)];
        } else {
          const newEntry = {
            id: `act_${now}_${Math.random().toString(36).slice(2, 6)}`,
            timestamp: now,
            childId,
            childName,
            type: type || "words_studied",
            summary: summary || `${wordsCount} kelime çalışıldı`,
            wordsCount: Number(wordsCount) || 1,
            score: Number(score) || 0,
            levelId: levelId || state.lastPlayedLevel || null,
          };
          nextLogs = [newEntry, ...prevLogs].slice(0, 50);
        }

        let nextChildren = state.childrenProfiles || [];
        if (activeChild) {
          nextChildren = nextChildren.map((c) =>
            c.id === activeChild.id
              ? {
                  ...c,
                  lastStudiedAt: now,
                  lastStudiedTopic: summary || c.lastStudiedTopic,
                }
              : c
          );
        }

        set({
          parentActivityLog: nextLogs,
          childrenProfiles: nextChildren,
        });

        const uid = state.uid;
        if (uid) {
          import('../lib/firebase/authService').then(({ logParentActivityToCloud }) => {
            logParentActivityToCloud(uid, nextLogs[0], activeChild ? {
              lastStudiedAt: now,
              lastStudiedTopic: summary || activeChild.lastStudiedTopic,
            } : null);
          }).catch(() => {});
        }
      },

      setJoinedClassroom: (classroom) => set({ joinedClassroom: classroom }),

      addLocalProgress: (gameId, delta) => set((state) => {
        const s = parseInt(delta.score, 10) || 0;
        const x = parseInt(delta.xp, 10) || 0;
        const g = parseInt(delta.gems, 10) || 0;
        if (s === 0 && x === 0 && g === 0) return {};

        const currentBreakdown = state.globalStats.game_breakdown[gameId] || { score: 0, xp: 0, gems: 0 };
        const nextGlobal = {
          ...state.globalStats,
          total_score: (state.globalStats.total_score || 0) + s,
          total_xp: (state.globalStats.total_xp || 0) + x,
          gems: (state.globalStats.gems || 0) + g,
          game_breakdown: {
            ...state.globalStats.game_breakdown,
            [gameId]: {
              score: (currentBreakdown.score || 0) + s,
              xp: (currentBreakdown.xp || 0) + x,
              gems: (currentBreakdown.gems || 0) + g
            }
          }
        };

        const pid = state.activeStudyProfileId;
        const map = pid
          ? {
              ...state.profileStatsMap,
              [pid]: {
                ...emptyProfileStats(),
                ...(state.profileStatsMap[pid] || {}),
                ...nextGlobal,
                lastPlayedLang: state.lastPlayedLang,
                lastPlayedLevel: state.lastPlayedLevel,
              },
            }
          : state.profileStatsMap;

        return {
          globalStats: nextGlobal,
          profileStatsMap: map,
          guestProgressPending: state.isGuest ? true : state.guestProgressPending
        };
      }),

      vocabularyVault: {},
      setVocabularyVault: (vault) => {
        const next = migrateVaultMap(vault || {});
        set({ vocabularyVault: next });
        triggerNotificationUpdate(next);
      },

      /**
       * Kasaya ekle / seed — SRS ilerletmez (çift sayım yok).
       * Zaten varsa yalnızca meta (dil, audio) güncellenir.
       */
      addLearnedWords: (words, language) => {
        const state = get();
        const newVault = { ...state.vocabularyVault };
        const synced = [];
        let updated = false;
        const now = Date.now();

        (words || []).forEach((w) => {
          const englishText = w.english || w.word || w.hanzi || w.kanji || "";
          const id = resolveWordId({ ...w, english: englishText });
          if (!id) return;

          const found = findVaultItem(newVault, { ...w, id, english: englishText });
          if (!found) {
            const entry = createPulseEntry(
              {
                id,
                english: englishText,
                turkish: w.turkish || w.translation || w.meaning || "",
                audioUrl: w.audioUrl || "",
                language: language || w.language || "",
                origin: w.origin,
                sourceLang: w.sourceLang,
                targetLang: w.targetLang,
                romanized: w.romanized || w.romanized_script || "",
                note: w.note || "",
              },
              now
            );
            entry.streak = 1;
            newVault[id] = entry;
            synced.push([id, entry]);
            updated = true;
          } else {
            const item = migrateVaultItem(found.item, now);
            const patched = {
              ...item,
              audioUrl: w.audioUrl || item.audioUrl || "",
              language: language || w.language || item.language || "",
              turkish: w.turkish || w.translation || w.meaning || item.turkish || "",
              lastSeen: now,
            };
            newVault[found.key] = patched;
            synced.push([found.key, patched]);
            updated = true;
          }
        });

        if (!updated) return;
        const limitedVault = limitVaultTo50(newVault, state.uid);
        set({ vocabularyVault: limitedVault });
        triggerNotificationUpdate(limitedVault);
        synced.forEach(([id, data]) => {
          if (limitedVault[id]) {
            cloudSyncWord(state.uid, id, data);
          }
        });
      },

      /**
       * Manuel strength (eski UI) → Pulse schedule’a map edilir
       */
      updateWordStrength: (wordId, strength) => {
        const state = get();
        if (!state.vocabularyVault[wordId]) return;
        const now = Date.now();
        const target = Math.max(1, Math.min(5, strength));
        const current = migrateVaultItem(state.vocabularyVault[wordId], now);
        const currentS = current.strength || 1;
        let next = current;
        if (target > currentS) {
          next = schedulePulse(current, PulseQuality.GOOD, now);
        } else if (target < currentS) {
          next = schedulePulse(current, PulseQuality.AGAIN, now);
        } else {
          next = { ...current, lastSeen: now };
        }
        const newVault = { ...state.vocabularyVault, [wordId]: next };
        set({ vocabularyVault: newVault });
        triggerNotificationUpdate(newVault);
        cloudSyncWord(state.uid, wordId, next);
      },

      quizHistory: [],

      /**
       * Ana öğrenme API’si — Memolandum Pulse™ (Edge-ready async)
       * @param {object} wordObj
       * @param {boolean} isCorrect
       * @param {number} [responseTimeSec=5]
       * @param {{ struggled?: boolean, language?: string, quality?: number, attempts?: number, gameId?: string }} [opts]
       */
      recordWordQuizResult: async (wordObj, isCorrect, responseTimeSec = 5, opts = {}) => {
        if (!wordObj) return;
        const state = get();
        const now = Date.now();
        const wordId = resolveWordId(wordObj);
        if (!wordId) return;

        const attempts = opts.attempts != null ? Number(opts.attempts) : 1;
        const found = findVaultItem(state.vocabularyVault, wordObj);

        // Sadece kasada zaten varsa, ya da yanlış bilinmişse / zorlanılmışsa kasaya ekle (akademik kavramlar daima eklenir)
        const isAcademic = wordObj.language === "academic" || opts.language === "academic";
        const isWordCard = opts.gameId === "word-card" || opts.game === "word-card" || gameId === "word-card";
        const shouldAddToVault = found || !isCorrect || attempts > 1 || isAcademic || isWordCard;

        const quality =
          opts.quality != null
            ? opts.quality
            : qualityFromGameResult({
                correct: !!isCorrect,
                responseTimeSec,
                struggled: !!opts.struggled || attempts > 1,
              });

        const gameId = opts.gameId || state.currentGame || 'quiz';

        if (shouldAddToVault) {
          const base =
            found?.item ||
            createPulseEntry(
              {
                id: wordId,
                english: wordObj.english || wordObj.word || "",
                turkish: wordObj.turkish || wordObj.meaning || wordObj.translation || "",
                audioUrl: wordObj.audioUrl || "",
                language: opts.language || wordObj.language || "",
              },
              now
            );

          // Route through the learning engine adapter
          const evaluation = await processLearningAction({
            uid: state.uid,
            wordObj,
            currentVaultItem: base,
            isCorrect: !!isCorrect,
            responseTimeMs: responseTimeSec * 1000,
            opts: { ...opts, gameId },
            quality
          });

          const updatedScheduled = evaluation.scheduledItem;
          const key = found?.key || wordId;
          const newVault = { ...state.vocabularyVault, [key]: updatedScheduled };
          const limitedVault = limitVaultTo50(newVault, state.uid);

          // Append log to rolling history (max 300 entries to protect localStorage & main thread)
          const historyEntry = {
            id: `${now}_${Math.random().toString(36).substring(2, 7)}`,
            timestamp: now,
            wordId: key,
            english: wordObj.english || wordObj.word || "",
            turkish: wordObj.turkish || wordObj.meaning || wordObj.translation || "",
            isCorrect: !!isCorrect,
            attempts,
            gameId,
            language: opts.language || wordObj.language || "",
            engineVersion: evaluation.engineVersion,
            isAiPowered: evaluation.isAiPowered,
            aiFeedback: evaluation.aiFeedback
          };

          const prevHistory = state.quizHistory || [];
          const nextHistory = [historyEntry, ...prevHistory].slice(0, 300);

          set({
            vocabularyVault: limitedVault,
            quizHistory: nextHistory,
          });
          triggerNotificationUpdate(limitedVault);
          triggerHaptic(isCorrect);
          if (limitedVault[key]) {
            cloudSyncWord(state.uid, key, updatedScheduled);
          }
        } else {
          // Kasada yok ve ilk seferde doğru bilindi -> Kasaya eklemiyoruz ama yine de geçmişe ekliyoruz + telemetri topluyoruz
          const key = wordId;

          // Asenkron telemetri toplama
          processLearningAction({
            uid: state.uid,
            wordObj,
            currentVaultItem: null,
            isCorrect: !!isCorrect,
            responseTimeMs: responseTimeSec * 1000,
            opts: { ...opts, gameId },
            quality
          }).catch((err) => console.error("Telemetry failed for non-vault word:", err));

          const historyEntry = {
            id: `${now}_${Math.random().toString(36).substring(2, 7)}`,
            timestamp: now,
            wordId: key,
            english: wordObj.english || wordObj.word || "",
            turkish: wordObj.turkish || wordObj.meaning || wordObj.translation || "",
            isCorrect: !!isCorrect,
            attempts,
            gameId,
            language: opts.language || wordObj.language || "",
          };

          const prevHistory = state.quizHistory || [];
          const nextHistory = [historyEntry, ...prevHistory].slice(0, 300);

          set({
            quizHistory: nextHistory,
          });
          triggerHaptic(isCorrect);
        }

        // Veli Takip Günlüğü (Parent Activity Stream)
        const stateNow = get();
        if (stateNow.isParentAccount || (stateNow.childrenProfiles && stateNow.childrenProfiles.length > 0)) {
          stateNow.logParentActivity({
            type: 'words_studied',
            summary: `${wordObj.english || wordObj.word || "Kelime"} çalışıldı (${isCorrect ? 'Doğru' : 'Tekrar'})`,
            wordsCount: 1,
            score: isCorrect ? 10 : 2,
            levelId: stateNow.lastPlayedLevel,
          });
        }
      },

      /** Kasa review UI: bildim / bilmedim */
      recordVaultReview: async (wordId, knew) => {
        const state = get();
        const item = state.vocabularyVault[wordId];
        if (!item) return;
        const now = Date.now();
        const quality = knew ? PulseQuality.GOOD : PulseQuality.AGAIN;

        const evaluation = await processLearningAction({
          uid: state.uid,
          wordObj: item,
          currentVaultItem: item,
          isCorrect: !!knew,
          responseTimeMs: 3000, // mock response time for review
          opts: {
            gameId: "vault_review",
            language: item.language || ""
          },
          quality
        });

        const scheduled = evaluation.scheduledItem;
        const newVault = { ...state.vocabularyVault, [wordId]: scheduled };
        set({ vocabularyVault: newVault });
        triggerNotificationUpdate(newVault);
        triggerHaptic(knew);
        cloudSyncWord(state.uid, wordId, scheduled);
      },

      currentGame: null,
      setCurrentGame: (gameId) => set({ currentGame: gameId }),

      changeAvatar: async (avatarUrl) => {
        try {
          await updateUserAvatarInFirebase(avatarUrl);
          set((state) => ({
            profile: state.profile ? { ...state.profile, photoURL: avatarUrl } : null
          }));
        } catch (error) {
          console.error("Zustand Avatar Update Error:", error);
        }
      },
      customLevels: [],
      activeCustomWords: null,
      setActiveCustomWords: (words) => {
        try {
          if (typeof window !== "undefined") {
            sessionStorage.setItem("memolandum-custom-play", "1");
          }
        } catch {
          /* ignore */
        }
        set({ activeCustomWords: words });
      },
      clearActiveCustomWords: () => {
        try {
          if (typeof window !== "undefined") {
            sessionStorage.removeItem("memolandum-custom-play");
            sessionStorage.removeItem("memolandum-custom-words");
          }
        } catch {
          /* ignore */
        }
        set({ activeCustomWords: null });
      },
      createCustomLevel: (title, wordIds) => {
        const levelObj = {
          id: `custom_level_${Date.now()}`,
          title: title || `Kişisel Seviye (${wordIds.length} Kelime)`,
          wordIds,
          createdAt: Date.now(),
        };
        set((state) => ({
          customLevels: [levelObj, ...(state.customLevels || [])]
        }));
        return levelObj;
      },
      /**
       * @param {boolean} status
       * @param {{ source?: 'revenuecat' | 'firestore' | 'manual' }} [meta]
       * Native'de RevenueCat premium'u, boş Firestore billing kaydı false yazarak ezemez.
       */
      setPremium: (status, meta = {}) =>
        set((state) => {
          const source = meta.source || "manual";
          const next = !!status;
          if (
            !next &&
            source === "firestore" &&
            state.premiumSource === "revenuecat" &&
            state.isPremium
          ) {
            return state;
          }
          return {
            isPremium: next,
            premiumSource: next ? source : null,
          };
        }),
      incrementTranslationCount: () => set((state) => ({
        translationCount: (state.translationCount || 0) + 1
      })),
    }),
    {
      name: MEMOLANDUM_STORAGE_KEY,
      storage: createJSONStorage(() => hybridStorage),
      partialize: (state) => ({
        uid: state.uid,
        profile: state.profile,
        isAuthenticated: state.isAuthenticated,
        isGuest: state.isGuest,
        isEmailVerified: state.isEmailVerified,
        lastAuthenticatedUid: state.lastAuthenticatedUid,
        globalStats: state.globalStats,
        lastPlayedLevel: state.lastPlayedLevel,
        lastPlayedLang: state.lastPlayedLang,
        lastPlayedGame: state.lastPlayedGame,
        lastPlayedAt: state.lastPlayedAt,
        vocabularyVault: state.vocabularyVault,
        quizHistory: state.quizHistory,
        customLevels: state.customLevels,
        // activeCustomWords ASLA persist edilmez — özel seviye tek oturumluk; kalırsa tüm oyunları kilitler
        guestProgressPending: state.guestProgressPending,
        studyProfiles: state.studyProfiles,
        activeStudyProfileId: state.activeStudyProfileId,
        profileStatsMap: state.profileStatsMap,
        // isPremium ASLA localStorage'dan gelmez — Firestore billing dinleyicisi yazar
        translationCount: state.translationCount,
        isParentAccount: state.isParentAccount,
        parentEmailDigest: state.parentEmailDigest,
        childrenProfiles: state.childrenProfiles,
        activeChildId: state.activeChildId,
        parentActivityLog: state.parentActivityLog,
        joinedClassroom: state.joinedClassroom,
      }),
      onRehydrateStorage: () => (state) => {
        if (state?.vocabularyVault) {
          state.vocabularyVault = migrateVaultMap(state.vocabularyVault);
        }
        // Eski oturumda uid yokken biriken çeviri sayacı yanlış hesaba yapışmasın
        if (state && !state.uid && state.isAuthenticated) {
          state.translationCount = 0;
        }
        // Eski kalıcı özel seviye kilidini kır
        if (state) {
          state.activeCustomWords = null;
        }
      },
    }
  )
);
