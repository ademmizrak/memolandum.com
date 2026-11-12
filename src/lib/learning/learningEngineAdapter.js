import { trackTelemetryToFirestore } from "./telemetryService";
import { schedulePulse, PulseQuality } from "./memolandumPulse";

// FEATURE_FLAG: 3.0 AI Motoru Durumu (default false)
// Gelecekte process.env.NEXT_PUBLIC_AI_ENGINE_ACTIVE veya admin paneli ile değiştirilebilir
const AI_ENGINE_ACTIVE = process.env.NEXT_PUBLIC_AI_ENGINE_ACTIVE === "true" || false;

/**
 * Learning and Spaced Repetition calculation service adapter.
 * Intercepts all quiz/game evaluations, gathers telemetry, and routes to either
 * the future 3.0 Gemini AI engine or fallback to the static SM-2 algorithm.
 * 
 * @param {Object} params
 * @param {string} params.uid - User ID (can be null for guest)
 * @param {Object} params.wordObj - The target vocabulary word object
 * @param {Object} params.currentVaultItem - Existing vault pulse entry (if any)
 * @param {boolean} params.isCorrect - Whether the user answered correctly
 * @param {number} params.responseTimeMs - User's response time in milliseconds
 * @param {Object} [params.opts] - Additional metadata (gameId, language, attempts, userContextInput)
 * @param {number} [params.quality] - Pre-calculated PulseQuality (optional)
 * @returns {Promise<Object>} The computed learning schedule and telemetry metadata
 */
export async function processLearningAction({
  uid,
  wordObj,
  currentVaultItem,
  isCorrect,
  responseTimeMs,
  opts = {},
  quality
}) {
  const wordId = wordObj?.id || wordObj?.word || "";
  const currentEase = Number(currentVaultItem?.easiness) || 2.5;
  // Map easiness (1.3 to 2.8) to difficulty rating (0.0 to 1.0)
  // 1.3 is hardest (1.0 difficulty), 2.8 is easiest (0.0 difficulty)
  const currentDifficulty = Number((1 - (currentEase - 1.3) / 1.5).toFixed(2));

  const actionType = isCorrect ? (responseTimeMs > 5000 ? "correct_slow" : "correct") : "failed";

  // 1. GATHER TELEMETRY (Data Flywheel logic for Google for Startups AI readiness)
  const telemetryData = {
    wordId,
    currentDifficulty,
    actionType,
    responseTimeMs,
    userContextInput: opts.userContextInput || null,
    gameId: opts.gameId || "quiz",
    language: opts.language || wordObj?.language || "",
    attempts: opts.attempts || 1,
    engineVersion: AI_ENGINE_ACTIVE ? "Memolandum-AI-3.0" : "Memolandum-MVP-2.0",
    isAiPowered: AI_ENGINE_ACTIVE
  };

  // Run telemetry asynchronously to prevent blockages or performance latency
  trackTelemetryToFirestore(uid, telemetryData).catch((err) => {
    console.error("[LearningEngineAdapter] Telemetry async tracking failed:", err);
  });

  // 2. FEATURE FLAG CHECK: 3.0 AI Engine Route
  if (AI_ENGINE_ACTIVE) {
    return await callGeminiAIEngine(wordObj, currentVaultItem, telemetryData);
  }

  // 3. FALLBACK TO STATIC SM-2 ALGORITHM (Safe MVP Layer)
  return getStaticFallbackEvaluation(currentVaultItem || wordObj, isCorrect, responseTimeMs, quality, opts);
}

/**
 * Placeholder/Abstraction boundary for future Gemini / Vertex AI model integration.
 */
async function callGeminiAIEngine(wordObj, currentVaultItem, telemetryData) {
  // In future version 3.0, we will call Vertex AI or Gemini API here
  // e.g., await fetch('/api/v3/learning', { method: 'POST', body: JSON.stringify({...}) })
  console.log("[LearningEngineAdapter] 3.0 AI Engine would process action.");
  
  // Placeholder mock response simulating Gemini output structure
  return {
    scheduledItem: {
      ...currentVaultItem,
      easiness: 2.3,
      intervalDays: 4,
      dueAt: Date.now() + 4 * 24 * 60 * 60 * 1000,
      reps: (Number(currentVaultItem?.reps) || 0) + 1,
      lastSeen: Date.now()
    },
    newDifficultyRating: 0.35,
    nextIntervalDays: 4,
    aiFeedback: "Excellent! Your response indicates high retention. Setting next review in 4 days.",
    engineVersion: "Memolandum-AI-3.0",
    isAiPowered: true
  };
}

/**
 * Wrapper for the static SM-2 / Pulse algorithm logic.
 */
function getStaticFallbackEvaluation(baseWordOrItem, isCorrect, responseTimeMs, quality, opts) {
  const now = Date.now();
  const scheduled = schedulePulse(baseWordOrItem, quality, now);

  // Learning Curve & First-Try Success Logic (replicated from useMemolandumStore)
  let updatedScheduled = { ...scheduled };
  const attempts = opts.attempts != null ? Number(opts.attempts) : 1;

  if (isCorrect) {
    if (attempts === 1) {
      if (updatedScheduled.learningProgressPct != null && Number(updatedScheduled.learningProgressPct) < 100) {
        const nextProg = Math.min(100, Number(updatedScheduled.learningProgressPct) + 25);
        updatedScheduled.learningProgressPct = nextProg;
        if (nextProg === 100) {
          updatedScheduled.firstTryCorrect = false;
        }
      } else {
        updatedScheduled.firstTryCorrect = true;
        updatedScheduled.learningProgressPct = 100;
      }
    } else {
      updatedScheduled.firstTryCorrect = false;
      if (updatedScheduled.learningProgressPct == null || Number(updatedScheduled.learningProgressPct) >= 100) {
        updatedScheduled.learningProgressPct = 25;
      } else {
        updatedScheduled.learningProgressPct = Math.min(100, Number(updatedScheduled.learningProgressPct) + 25);
      }
    }
  } else {
    updatedScheduled.firstTryCorrect = false;
    updatedScheduled.learningProgressPct = 25;
  }

  const updatedEase = Number(updatedScheduled.easiness) || 2.5;
  const newDifficulty = Number((1 - (updatedEase - 1.3) / 1.5).toFixed(2));

  return {
    scheduledItem: updatedScheduled,
    newDifficultyRating: newDifficulty,
    nextIntervalDays: Number(updatedScheduled.intervalDays) || 1,
    aiFeedback: isCorrect ? "Harika! Doğru bildin." : "Bu kelimeyi tekrar etmeliyiz.",
    engineVersion: "Memolandum-MVP-2.0",
    isAiPowered: false
  };
}
