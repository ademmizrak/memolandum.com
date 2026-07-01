'use client';

import { useEffect, useState } from 'react';
import { onAuthStateChanged } from 'firebase/auth';
import { doc, onSnapshot } from 'firebase/firestore';
import { auth, db } from '../lib/firebase/config';
import { useMemolandumStore } from '../store/useMemolandumStore';
import { syncUserProgress } from '../lib/firebase/authService';

export default function AuthProvider({ children }) {
  const { setAuthUser, isAuthLoading, syncGlobalStats } = useMemolandumStore();
  const [initialCheckDone, setInitialCheckDone] = useState(false);

  useEffect(() => {
    let unsubStats = null;

    const unsubscribe = onAuthStateChanged(auth, async (user) => {
      setAuthUser(user);
      
      if (user) {
        // Sync progress every time auth state is confirmed
        await syncUserProgress(user);

        // Start listening to global stats
        const userRef = doc(db, 'users', user.uid, 'stats', 'global');
        unsubStats = onSnapshot(userRef, (docSnap) => {
           if (docSnap.exists()) {
             syncGlobalStats(docSnap.data());
           }
        });
      } else {
        if (unsubStats) {
          unsubStats();
          unsubStats = null;
        }
      }
      
      setInitialCheckDone(true);
    });

    return () => {
      unsubscribe();
      if (unsubStats) unsubStats();
    };
  }, [setAuthUser, syncGlobalStats]);

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
