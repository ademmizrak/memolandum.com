import { create } from 'zustand';
import { persist } from 'zustand/middleware';
import { updateUserAvatarInFirebase } from '../lib/firebase/authService';

export const useMemolandumStore = create(
  persist(
    (set, get) => ({
      // User Profile Data
      uid: null,
      profile: null,
      
      // Global Progress Tracking (Single Source of Truth locally)
      globalStats: {
        total_score: 0,
        total_xp: 0,
        gems: 0,
        level: 1,
        game_breakdown: {}
      },
      lastPlayedLevel: null,
      lastPlayedLang: null,
      
      // Auth State
      isAuthenticated: false,
      isAuthLoading: true,
      isGuest: true,
      isEmailVerified: false,

      // Actions
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

      setLastPlayed: (lang, level) => set({
        lastPlayedLang: lang,
        lastPlayedLevel: level
      }),

      // Syncs state from Firestore upon login or listener
      syncGlobalStats: (firestoreStats) => set((state) => ({
        globalStats: { ...state.globalStats, ...firestoreStats }
      })),

      // Offline / Guest accumulation (runs parallel to GlobalStateSync for UI reactivity)
      addLocalProgress: (gameId, delta) => set((state) => {
        const s = parseInt(delta.score, 10) || 0;
        const x = parseInt(delta.xp, 10) || 0;
        const g = parseInt(delta.gems, 10) || 0;
        
        const currentBreakdown = state.globalStats.game_breakdown[gameId] || { score: 0, xp: 0, gems: 0 };

        return {
          globalStats: {
            ...state.globalStats,
            total_score: state.globalStats.total_score + s,
            total_xp: state.globalStats.total_xp + x,
            gems: state.globalStats.gems + g,
            game_breakdown: {
              ...state.globalStats.game_breakdown,
              [gameId]: {
                score: currentBreakdown.score + s,
                xp: currentBreakdown.xp + x,
                gems: currentBreakdown.gems + g
              }
            }
          }
        };
      }),

      // Game specific temporary state (optional, for passing data between screens)
      currentGame: null,
      setCurrentGame: (gameId) => set({ currentGame: gameId }),

      // Avatar Management
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
        lastPlayedLang: state.lastPlayedLang
      }),
    }
  )
);
