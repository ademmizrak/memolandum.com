'use client';

import { useEffect, useState } from 'react';
import { onAuthStateChanged } from 'firebase/auth';
import { auth } from '../lib/firebase/config';
import { useMemolandumStore } from '../store/useMemolandumStore';
import { syncUserProgress } from '../lib/firebase/authService';

export default function AuthProvider({ children }) {
  const setAuthUser = useMemolandumStore((state) => state.setAuthUser);
  const isAuthLoading = useMemolandumStore((state) => state.isAuthLoading);
  const [initialCheckDone, setInitialCheckDone] = useState(false);

  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, async (user) => {
      setAuthUser(user);
      
      if (user) {
        // Sync progress every time auth state is confirmed
        await syncUserProgress(user);
      }
      
      setInitialCheckDone(true);
    });

    return () => unsubscribe();
  }, [setAuthUser]);

  // Show a subtle loading state if auth hasn't been determined yet
  if (!initialCheckDone || isAuthLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-[#0a0a0a]">
        <div className="w-10 h-10 border-4 border-cyan-500 border-t-transparent rounded-full animate-spin"></div>
      </div>
    );
  }

  return <>{children}</>;
}
