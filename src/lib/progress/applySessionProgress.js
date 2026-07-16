import { useMemolandumStore } from '../../store/useMemolandumStore';
import GlobalStateSync from '../firebase/GlobalStateSync';
import { auth } from '../firebase/config';
import { recordPlaySignal } from '../security';

/**
 * Oturum skoru kümülatiftir; aynı oyun bitişinde veya celebration dönüşünde
 * toplam skorun yeniden yazılmasını engellemek için yalnızca senkronlanmamış
 * farkı (delta) localStorage + Firestore'a basar.
 */
export function createSessionProgressTracker(gameId) {
  let syncedScore = 0;
  let syncedGems = 0;

  return {
    reset() {
      syncedScore = 0;
      syncedGems = 0;
    },

    /**
     * @param {{ score?: number|string, gems?: number|string }} sessionTotals
     * Oturum içinde biriken toplam skor / elmas (kümülatif).
     */
    commit(sessionTotals = {}) {
      const totalScore = Math.max(0, parseInt(sessionTotals.score, 10) || 0);
      const totalGems = Math.max(0, parseInt(sessionTotals.gems, 10) || 0);

      const dScore = Math.max(0, totalScore - syncedScore);
      const dGems = Math.max(0, totalGems - syncedGems);
      const dXp = Math.floor(dScore / 10);

      syncedScore = Math.max(syncedScore, totalScore);
      syncedGems = Math.max(syncedGems, totalGems);

      if (dScore === 0 && dGems === 0) return null;

      recordPlaySignal();

      const delta = { score: dScore, xp: dXp, gems: dGems };
      useMemolandumStore.getState().addLocalProgress(gameId, delta);

      const uid = auth.currentUser?.uid;
      if (uid) {
        GlobalStateSync.updateProgress(uid, gameId, delta);
      }

      return delta;
    }
  };
}
