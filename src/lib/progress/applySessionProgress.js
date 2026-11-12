import { useMemolandumStore } from '../../store/useMemolandumStore';
import GlobalStateSync from '../firebase/GlobalStateSync';
import { auth } from '../firebase/config';
import { recordPlaySignal } from '../security';
import { fireGuaranteedLevelEnd } from '../../hooks/useAnalytics';

/**
 * Oturum skoru kümülatiftir; aynı oyun bitişinde veya celebration dönüşünde
 * toplam skorun yeniden yazılmasını engellemek için yalnızca senkronlanmamış
 * farkı (delta) localStorage + Firestore'a basar.
 */
export function createSessionProgressTracker(gameId) {
  let syncedScore = 0;
  let syncedGems = 0;
  let hasTrackedCompletion = false;

  return {
    reset() {
      syncedScore = 0;
      syncedGems = 0;
      hasTrackedCompletion = false;
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

      const state = useMemolandumStore.getState();
      const delta = { score: dScore, xp: dXp, gems: dGems };
      state.addLocalProgress(gameId, delta);

      if (!hasTrackedCompletion && totalScore > 0) {
        hasTrackedCompletion = true;
        fireGuaranteedLevelEnd({
          gameSlug: gameId,
          score: totalScore,
          langPair: state.lastPlayedLang || "",
          levelId: state.lastPlayedLevel || "",
          triggerReason: "session_progress_commit",
          onLevelCompletedCallback: () => {
            useMemolandumStore.getState().markLevelCompleted?.();
          },
        });
      }

      const uid = auth.currentUser?.uid;
      if (uid) {
        GlobalStateSync.updateProgress(uid, gameId, delta);
      }

      return delta;
    }
  };
}

export function applySessionProgress(gameId, { score = 0, gems = 0 } = {}) {
  const dScore = Math.max(0, parseInt(score, 10) || 0);
  const dGems = Math.max(0, parseInt(gems, 10) || 0);
  const dXp = Math.floor(dScore / 10);
  if (dScore === 0 && dGems === 0) return null;

  recordPlaySignal();

  const state = useMemolandumStore.getState();
  const delta = { score: dScore, xp: dXp, gems: dGems };
  state.addLocalProgress(gameId, delta);

  if (dScore > 0) {
    fireGuaranteedLevelEnd({
      gameSlug: gameId,
      score: dScore,
      langPair: state.lastPlayedLang || "",
      levelId: state.lastPlayedLevel || "",
      triggerReason: "apply_session_progress",
      onLevelCompletedCallback: () => {
        useMemolandumStore.getState().markLevelCompleted?.();
      },
    });
  }

  const uid = auth.currentUser?.uid;
  if (uid) {
    GlobalStateSync.updateProgress(uid, gameId, delta);
  }

  return delta;
}
