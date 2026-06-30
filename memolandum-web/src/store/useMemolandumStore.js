import { create } from 'zustand';
import { persist } from 'zustand/middleware';
import { updateUserAvatarInFirebase } from '../lib/firebase/authService';

export const useMemolandumStore = create(
  persist(
    (set, get) => ({
      // User Profile Data
      uid: null,
      profile: null,
      totalXp: 0,
      
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

      // XP Management
      addXp: (amount) => set((state) => ({
        totalXp: state.totalXp + amount
      })),

      setTotalXp: (amount) => set({
        totalXp: amount
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
        totalXp: state.totalXp
        // Add other progress fields here (gems, level progress, etc.)
      }),
    }
  )
);
