import { create } from 'zustand';
import { persist } from 'zustand/middleware';
import { updateUserAvatarInFirebase } from '../lib/firebase/authService';
import {
  buildStudyProfile,
  emptyProfileStats,
  makeStudyProfileId,
} from '../lib/profiles/studyProfileService';

const emptyGlobal = () => ({
  total_score: 0,
  total_xp: 0,
  gems: 0,
  level: 1,
  game_breakdown: {},
});

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
    },
  };
}

export const useMemolandumStore = create(
  persist(
    (set, get) => ({
      uid: null,
      profile: null,

      globalStats: emptyGlobal(),
      lastPlayedLevel: null,
      lastPlayedLang: null,
      isChallengeMode: false,
      guestProgressPending: false,

      // Dil bazlı öğrenme profilleri (aynı hesap / cihaz)
      studyProfiles: [],
      activeStudyProfileId: null,
      profileStatsMap: {},

      isAuthenticated: false,
      isAuthLoading: true,
      isGuest: true,
      isEmailVerified: false,

      setAuthUser: (user) => set({
        uid: user ? user.uid : null,
        profile: user ? {
          displayName: user.displayName,
          email: user.email,
          photoURL: user.photoURL
        } : null,
        isAuthenticated: !!user,
        isAuthLoading: false,
        isGuest: !user,
        isEmailVerified: user ? user.emailVerified : false
      }),

      setLastPlayed: (lang, level) => set((state) => {
        const next = { lastPlayedLang: lang, lastPlayedLevel: level };
        const id = state.activeStudyProfileId;
        if (!id) return next;
        return {
          ...next,
          profileStatsMap: {
            ...state.profileStatsMap,
            [id]: {
              ...emptyProfileStats(),
              ...(state.profileStatsMap[id] || {}),
              lastPlayedLang: lang,
              lastPlayedLevel: level,
              total_score: state.globalStats.total_score,
              total_xp: state.globalStats.total_xp,
              gems: state.globalStats.gems,
              level: state.globalStats.level,
              game_breakdown: state.globalStats.game_breakdown,
            },
          },
        };
      }),

      toggleChallengeMode: () => set((state) => ({
        isChallengeMode: !state.isChallengeMode
      })),

      syncGlobalStats: (firestoreStats) => set((state) => {
        const next = {
          total_score: Number(firestoreStats.total_score) || 0,
          total_xp: Number(firestoreStats.total_xp) || 0,
          gems: Number(firestoreStats.gems) || 0,
          level: Number(firestoreStats.level) || 1,
          game_breakdown: firestoreStats.game_breakdown && typeof firestoreStats.game_breakdown === 'object'
            ? firestoreStats.game_breakdown
            : {}
        };
        const id = state.activeStudyProfileId;
        const map = id
          ? {
              ...state.profileStatsMap,
              [id]: {
                ...emptyProfileStats(),
                ...(state.profileStatsMap[id] || {}),
                ...next,
                lastPlayedLang: firestoreStats.lastPlayedLang ?? state.profileStatsMap[id]?.lastPlayedLang ?? state.lastPlayedLang,
                lastPlayedLevel: firestoreStats.lastPlayedLevel ?? state.profileStatsMap[id]?.lastPlayedLevel ?? state.lastPlayedLevel,
              },
            }
          : state.profileStatsMap;
        return {
          globalStats: next,
          profileStatsMap: map,
          ...(firestoreStats.lastPlayedLang != null ? { lastPlayedLang: firestoreStats.lastPlayedLang } : {}),
          ...(firestoreStats.lastPlayedLevel != null ? { lastPlayedLevel: firestoreStats.lastPlayedLevel } : {}),
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
          lastPlayedLang: incoming.lastPlayedLang || null,
          lastPlayedLevel: incoming.lastPlayedLevel || null,
        });
      },

      hydrateStudyProfiles: ({ profiles, activeId, statsById } = {}) => {
        const list = profiles?.length ? profiles : [];
        const id = activeId && list.some((p) => p.id === activeId)
          ? activeId
          : list[0]?.id || null;
        const map = { ...(statsById || {}) };
        const activeStats = (id && map[id]) || emptyProfileStats();
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
          lastPlayedLang: activeStats.lastPlayedLang || get().lastPlayedLang,
          lastPlayedLevel: activeStats.lastPlayedLevel || get().lastPlayedLevel,
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
      setVocabularyVault: (vault) => set({ vocabularyVault: vault }),

      addLearnedWords: (words, language) => set((state) => {
        const newVault = { ...state.vocabularyVault };
        let updated = false;
        words.forEach(w => {
          const id = w.id || w.word_id;
          if (!id) return;
          if (!newVault[id]) {
            newVault[id] = {
              id: id,
              english: w.english || w.word || w.hanzi || w.kanji || '',
              turkish: w.turkish || w.translation || w.meaning || '',
              audioUrl: w.audioUrl || '',
              language: language || w.language || '',
              strength: 1,
              lastSeen: Date.now(),
              ...(w.origin ? { origin: w.origin } : {}),
              ...(w.sourceLang ? { sourceLang: w.sourceLang } : {}),
              ...(w.targetLang ? { targetLang: w.targetLang } : {}),
            };
            updated = true;
          }
        });
        return updated ? { vocabularyVault: newVault } : {};
      }),

      updateWordStrength: (wordId, strength) => set((state) => {
        if (!state.vocabularyVault[wordId]) return {};
        const newVault = { ...state.vocabularyVault };
        newVault[wordId] = {
          ...newVault[wordId],
          strength: Math.max(1, Math.min(5, strength)),
          lastSeen: Date.now()
        };
        return { vocabularyVault: newVault };
      }),

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
    }),
    {
      name: 'memolandum-storage',
      partialize: (state) => ({
        globalStats: state.globalStats,
        lastPlayedLevel: state.lastPlayedLevel,
        lastPlayedLang: state.lastPlayedLang,
        vocabularyVault: state.vocabularyVault,
        guestProgressPending: state.guestProgressPending,
        studyProfiles: state.studyProfiles,
        activeStudyProfileId: state.activeStudyProfileId,
        profileStatsMap: state.profileStatsMap,
      }),
    }
  )
);
