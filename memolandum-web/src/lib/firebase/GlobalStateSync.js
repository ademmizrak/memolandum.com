import { db, auth } from './config';
import { doc, setDoc, increment, serverTimestamp } from 'firebase/firestore';
import { useMemolandumStore } from '../../store/useMemolandumStore';

/**
 * Enterprise Level Global State Synchronizer for Firebase.
 * Ensures atomicity using increment operations and provides Debounce/Batching.
 */
class GlobalStateSync {
  static pendingUpdates = {
    score: 0,
    xp: 0,
    gems: 0,
    games: {}
  };
  
  static syncTimeout = null;
  static SYNC_DELAY_MS = 0; // 0 seconds delay for instant batched writes (next event loop tick)

  /**
   * Oyundan gelen kazanımları (score, xp, gems) alır, debounce ile Firestore'a tek bir write (setDoc merge) atar.
   * @param {string} userId - Firebase Auth User ID
   * @param {string} gameId - Hangi oyun kabuğu ('shooter', 'breakout' vb.)
   * @param {object} delta - { score: Number, xp: Number, gems: Number }
   */
  static async updateProgress(userId, gameId, delta = {}) {
    if (!userId) return; // Sadece auth kullanıcılar için senkronize et

    const s = parseInt(delta.score, 10) || 0;
    const x = parseInt(delta.xp, 10) || 0;
    const g = parseInt(delta.gems, 10) || 0;

    if (s === 0 && x === 0 && g === 0) return;

    // Bekleyen güncellemelere ekle (Queue)
    this.pendingUpdates.score += s;
    this.pendingUpdates.xp += x;
    this.pendingUpdates.gems += g;

    if (!this.pendingUpdates.games[gameId]) {
      this.pendingUpdates.games[gameId] = { score: 0, xp: 0, gems: 0 };
    }
    this.pendingUpdates.games[gameId].score += s;
    this.pendingUpdates.games[gameId].xp += x;
    this.pendingUpdates.games[gameId].gems += g;

    // Debounce Timer başlat veya sıfırla
    if (this.syncTimeout) {
      clearTimeout(this.syncTimeout);
    }

    this.syncTimeout = setTimeout(() => {
      this.flushToFirebase(userId);
    }, this.SYNC_DELAY_MS);
  }

  /**
   * Birikmiş puanları Firestore'a yazar
   */
  static async flushToFirebase(userId) {
    if (!userId || !db) return;

    const snapshot = { ...this.pendingUpdates };
    
    // Kuyruğu sıfırla
    this.pendingUpdates = {
      score: 0,
      xp: 0,
      gems: 0,
      games: {}
    };

    if (snapshot.score === 0 && snapshot.xp === 0 && snapshot.gems === 0) return;

    try {
      const userRef = doc(db, 'users', userId, 'stats', 'global');
      
      const payload = {
        total_score: increment(snapshot.score),
        total_xp: increment(snapshot.xp),
        gems: increment(snapshot.gems),
        last_updated: serverTimestamp()
      };

      const storeProfile = useMemolandumStore.getState().profile;
      if (storeProfile) {
        payload.displayName = storeProfile.displayName || "Siber Kadet";
        payload.photoURL = storeProfile.photoURL || null;
      }

      // Dinamik oyun bazlı alanları ekle
      for (const [gameId, stats] of Object.entries(snapshot.games)) {
        if (stats.score > 0) payload[`game_breakdown.${gameId}.score`] = increment(stats.score);
        if (stats.xp > 0) payload[`game_breakdown.${gameId}.xp`] = increment(stats.xp);
        if (stats.gems > 0) payload[`game_breakdown.${gameId}.gems`] = increment(stats.gems);
      }

      // setDoc ve merge:true kullanıyoruz ki doküman yoksa oluşsun (updateDoc hata verir)
      await setDoc(userRef, payload, { merge: true });
      
      console.log('🔥 [GlobalStateSync] Firestore\'a atomik güncellemeler başarıyla yazıldı:', payload);
    } catch (error) {
      console.error('🔥 [GlobalStateSync] Firebase senkronizasyon hatası:', error);
      // Hata durumunda puanları geri kuyruğa ekle ki kaybolmasınlar
      this.pendingUpdates.score += snapshot.score;
      this.pendingUpdates.xp += snapshot.xp;
      this.pendingUpdates.gems += snapshot.gems;
      
      for (const [gameId, stats] of Object.entries(snapshot.games)) {
        if (!this.pendingUpdates.games[gameId]) {
           this.pendingUpdates.games[gameId] = { score: 0, xp: 0, gems: 0 };
        }
        this.pendingUpdates.games[gameId].score += stats.score;
        this.pendingUpdates.games[gameId].xp += stats.xp;
        this.pendingUpdates.games[gameId].gems += stats.gems;
      }
    }
  }

  /**
   * Anında senkronizasyon (Örn: Ekran kapanırken)
   */
  static async forceFlush(userId) {
    if (this.syncTimeout) {
      clearTimeout(this.syncTimeout);
      this.syncTimeout = null;
    }
    await this.flushToFirebase(userId);
  }
}

export default GlobalStateSync;
