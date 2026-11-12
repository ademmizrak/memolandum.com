import { create } from 'zustand';
import { persist, createJSONStorage } from 'zustand/middleware';
import { updateUserAvatarInFirebase } from '../lib/firebase/authService';
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
import {
  MEMOLANDUM_STORAGE_KEY,
  emptyGlobal,
  cloudSyncWord,
  limitVaultTo50,
  triggerNotificationUpdate,
  triggerHaptic,
  cloudSyncStudyContext,
  snapshotActive,
  hybridStorage,
} from './storeHelpers';
import { createParentClassroomSlice } from './slices/parentClassroomSlice';
import { recordWordSolvedForFunnel } from '../hooks/useAnalytics';

export { MEMOLANDUM_STORAGE_KEY } from './storeHelpers';

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
      completedLevels: 0,
      isFirstSession: true,
      markLevelCompleted: () => {
        set((state) => ({
          completedLevels: (Number(state.completedLevels) || 0) + 1,
          isFirstSession: false,
        }));
        const s = get();
        if (s.joinedClassroom?.classCode) {
          s.syncJoinedClassroomProgress?.({ immediate: true });
        }
      },

      // Dil bazlı öğrenme profilleri (aynı hesap / cihaz)
      studyProfiles: [],
      activeStudyProfileId: null,
      profileStatsMap: {},

      // Veli & Öğrenci Ekosistemi + Öğretmen Sınıf Masası (Modüler Slice)
      ...createParentClassroomSlice(set, get),

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
        const prevProfile = !uidChanged ? state.profile : null;
        const isOAuthVerified = Array.isArray(user?.providerData)
          && user.providerData.some((p) => p?.providerId && p.providerId !== 'password');
        return {
          uid: nextUid,
          profile: user
            ? {
                displayName: user.displayName || prevProfile?.displayName || null,
                email: user.email || prevProfile?.email || null,
                photoURL: user.photoURL || prevProfile?.photoURL || null,
                username: user.username || prevProfile?.username || null,
              }
            : null,
          isAuthenticated: !!user,
          isAuthLoading: false,
          isGuest: !user,
          isEmailVerified: user ? Boolean(user.emailVerified || isOAuthVerified) : false,
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
        parentEmailDigest: false,
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
        const localGlobal = state.globalStats || {};
        const mergedBreakdown = { ...(localGlobal.game_breakdown || {}), ...(activeStats.game_breakdown || {}) };
        Object.keys(mergedBreakdown).forEach((gameKey) => {
          const localG = localGlobal.game_breakdown?.[gameKey] || {};
          const remoteG = activeStats.game_breakdown?.[gameKey] || {};
          mergedBreakdown[gameKey] = {
            score: Math.max(localG.score || 0, remoteG.score || 0),
            xp: Math.max(localG.xp || 0, remoteG.xp || 0),
            gems: Math.max(localG.gems || 0, remoteG.gems || 0),
          };
        });
        const mergedGlobal = {
          total_score: Math.max(localGlobal.total_score || 0, activeStats.total_score || 0),
          total_xp: Math.max(localGlobal.total_xp || 0, activeStats.total_xp || 0),
          gems: Math.max(localGlobal.gems || 0, activeStats.gems || 0),
          level: Math.max(localGlobal.level || 1, activeStats.level || 1),
          game_breakdown: mergedBreakdown,
        };
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
        if (id) {
          map[id] = {
            ...activeStats,
            ...mergedGlobal,
            lastPlayedLang: picked.langId,
            lastPlayedLevel: picked.levelId,
            lastPlayedGame: picked.gameId,
            lastPlayedAt: picked.lastPlayedAt || 0,
          };
        }
        set({
          studyProfiles: list,
          activeStudyProfileId: id,
          profileStatsMap: map,
          globalStats: mergedGlobal,
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
      setVocabularyVault: (vault, opts = {}) => {
        const incoming = migrateVaultMap(vault || {});
        if (opts?.replace) {
          set({ vocabularyVault: incoming });
          triggerNotificationUpdate(incoming);
          return;
        }
        const current = get().vocabularyVault || {};
        const merged = { ...current };
        for (const [k, remoteItem] of Object.entries(incoming)) {
          const localItem = merged[k];
          if (!localItem) {
            merged[k] = remoteItem;
          } else {
            const localTime = Number(localItem.lastSeen || localItem.updatedAt || 0);
            const remoteTime = Number(remoteItem.lastSeen || remoteItem.updatedAt || 0);
            if (remoteTime >= localTime) {
              merged[k] = remoteItem;
            }
          }
        }
        const next = limitVaultTo50(merged, get().uid);
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
       */
      recordWordQuizResult: async (wordObj, isCorrect, responseTimeSec = 5, opts = {}) => {
        if (!wordObj) return;
        const state = get();
        const now = Date.now();
        const wordId = resolveWordId(wordObj);
        if (!wordId) return;

        const attempts = opts.attempts != null ? Number(opts.attempts) : 1;
        const found = findVaultItem(state.vocabularyVault, wordObj);
        const gameId = opts.gameId || opts.game || state.currentGame || 'quiz';

        if (isCorrect) {
          recordWordSolvedForFunnel({
            wordId,
            isCorrect: true,
            gameSlug: gameId,
            langPair: opts.language || wordObj.language || state.lastPlayedLang || '',
            levelId: state.lastPlayedLevel || '',
            onFinalWordSolved: () => {
              get().markLevelCompleted?.();
            },
          });
        }

        // Tüm doğru/yanlış eşleşmeler Pulse tekrarına ve Kelime Kasası'na yazılır
        const shouldAddToVault = true;

        const quality =
          opts.quality != null
            ? opts.quality
            : qualityFromGameResult({
                correct: !!isCorrect,
                responseTimeSec,
                struggled: !!opts.struggled || attempts > 1,
              });

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
          const taggedScheduled =
            state.activeChildId && !updatedScheduled?.childId
              ? { ...updatedScheduled, childId: state.activeChildId }
              : updatedScheduled;
          const newVault = { ...state.vocabularyVault, [key]: taggedScheduled };
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
            aiFeedback: evaluation.aiFeedback,
            ...(state.activeChildId ? { childId: state.activeChildId } : {}),
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
            cloudSyncWord(state.uid, key, taggedScheduled);
          }
        } else {
          const key = wordId;

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
            ...(state.activeChildId ? { childId: state.activeChildId } : {}),
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

        // Öğretmen sınıf tablosu — soft childId ile roster key (oyun içi vuruşlarda debounced/coalesced)
        if (stateNow.joinedClassroom?.classCode) {
          stateNow.syncJoinedClassroomProgress?.({ immediate: false });
        }
      },

      /** Kasa review UI: bildim / bilmedim */
      recordVaultReview: async (wordId, knew) => {
        const state = get();
        const item = state.vocabularyVault[wordId];
        if (!item) return;
        const quality = knew ? PulseQuality.GOOD : PulseQuality.AGAIN;

        const evaluation = await processLearningAction({
          uid: state.uid,
          wordObj: item,
          currentVaultItem: item,
          isCorrect: !!knew,
          responseTimeMs: 3000,
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
        completedLevels: state.completedLevels,
        isFirstSession: state.isFirstSession,
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
          // Mevcut kıdemli kullanıcılar (kasasında >=10 kelime veya >100 puanı olanlar)
          // ilk oturum mikro-setine (3 kelime) düşmesin; yeni kullanıcılar completedLevels=0 ile başlasın
          if (state.completedLevels == null) {
            const vaultSize = Object.keys(state.vocabularyVault || {}).length;
            const totalScore = Number(state.globalStats?.total_score) || 0;
            if (vaultSize >= 10 || totalScore > 100) {
              state.completedLevels = 2;
              state.isFirstSession = false;
            } else {
              state.completedLevels = 0;
              state.isFirstSession = true;
            }
          }
        }
      },
    }
  )
);
