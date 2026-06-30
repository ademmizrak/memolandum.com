import { useRef, useCallback, useEffect } from 'react';
import { useMemolandumStore } from '../store/useMemolandumStore';
import { db } from '../lib/firebase/config';
import { doc, updateDoc, increment, setDoc } from 'firebase/firestore';

/**
 * useScoreSync hook'u, oyun içindeki anlık puan artışlarını
 * React tarafında state olarak tutar (UI'ı güncellemek için),
 * ancak Firestore'a her tick'te yazmak yerine "batch" veya
 * belirli aralıklarla/oyun bittiğinde kaydeder.
 */
export function useScoreSync(gameId) {
  const { uid, addXp } = useMemolandumStore();
  
  // Accumulated pending score that hasn't been written to Firebase yet
  const pendingScoreRef = useRef(0);
  
  // Total score for the current session
  const sessionScoreRef = useRef(0);

  // Syncs the pending score to Firebase
  const syncToFirebase = useCallback(async () => {
    // FIREBASE BYPASSED FOR NOW AS REQUESTED
    if (!uid || pendingScoreRef.current === 0) return;
    
    const scoreToSync = pendingScoreRef.current;
    pendingScoreRef.current = 0; // Reset pending
    addXp(scoreToSync); // Sadece lokal Zustand state'ini güncelle
    
    console.log("🔥 Firebase pas geçildi. Kazanılan Skor:", scoreToSync);
    
    /* Firebase kodları geçici olarak devredışı
    if (!db) {
      console.warn("Firestore (db) başlatılamadığı için skor buluta yazılamadı.");
      return;
    }

    try {
      // 1. Update global user XP in Firestore
      const userRef = doc(db, 'users', uid);
      await setDoc(userRef, {
        totalXp: increment(scoreToSync)
      }, { merge: true });

      // 2. Update specific game stats
      if (gameId) {
        const gameStatsRef = doc(db, `user_stats/${uid}/games`, gameId);
        await setDoc(gameStatsRef, {
          totalScore: increment(scoreToSync),
          lastPlayed: new Date().toISOString()
        }, { merge: true });
      }
    } catch (error) {
      console.error("Firebase'e skor yazılırken hata oluştu:", error);
      pendingScoreRef.current += scoreToSync;
    }
    */
  }, [uid, gameId, addXp]);

  // Optionally, we could set up an interval to sync every X seconds
  // But doing it on unmount or game over is better for costs.
  useEffect(() => {
    // Component unmount olduğunda bekleyen skor varsa yaz
    return () => {
      syncToFirebase();
    };
  }, [syncToFirebase]);

  const addScore = useCallback((points) => {
    pendingScoreRef.current += points;
    sessionScoreRef.current += points;
    return sessionScoreRef.current;
  }, []);

  const getSessionScore = useCallback(() => {
    return sessionScoreRef.current;
  }, []);

  return {
    addScore,
    getSessionScore,
    syncToFirebase // Call this explicitly on Game Over
  };
}
