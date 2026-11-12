/**
 * Memolandum AI çeviri — Google AI (Gemini) API
 * Enterprise Cloud Function — Hem Masaüstü/Web hem Mobil (Capacitor iOS/Android) için
 * Anahtar: Firebase Secret GEMINI_API_KEY (sunucuda güvenle korunur, istemcide ifşa olmaz)
 */

const { onCall, HttpsError } = require("firebase-functions/v2/https");
const { defineSecret } = require("firebase-functions/params");
const { GoogleGenerativeAI } = require("@google/generative-ai");

const geminiApiKey = defineSecret("GEMINI_API_KEY");

const DEEP_CONTEXT_TRANSLATOR_SYSTEM_INSTRUCTION = `Sen Memolandum dil öğrenme platformunun hızlı çeviri asistanısın. Görevin metni/sesi hedef dile açık, doğru ve günlük dile uygun şekilde çevirmektir — roman/şiir üslubu değil.

Kuralların:
1) YALIN VE DOĞAL (ÖNCELİK): Sade, standart, günlük dil kullan. Aşırı şiirsel, edebi (literary), lirik veya dramatize çevirilerden kaçın.
2) DEYİM: Motamot kalma. Gerçek deyimleri hedef dildeki en doğal günlük karşılığıyla ver.
3) TON: Tonu tespit et (Samimi/Günlük, Resmî, Duygusal, Akademik). Duygusal metinde bile abartma; öğrenen için net kal.
4) EĞİTİMCİ İPUCU (contextNotes): 1-2 cümle Türkçe — neden bu karşılık, kısa ve net.
5) NÜANSLAR (nuances): Kilit kelime/deyimleri Türkçe anlamlarıyla ayrıştır.`;

const LANG_PROMPT_LABEL = {
  osm: "Osmanlıca (Ottoman Turkish — prefer Arabic script; add Latin transliteration in parentheses when helpful)",
};

function languageLabel(code, fallbackLabel) {
  if (LANG_PROMPT_LABEL[code]) return LANG_PROMPT_LABEL[code];
  return fallbackLabel || code;
}

const CANDIDATE_MODELS = [
  process.env.GEMINI_MODEL || "gemini-3.8-flash",
  "gemini-flash-latest",
];

function parseModelJson(text) {
  if (!text) return null;
  const raw = String(text).trim();
  const cleaned = raw
    .replace(/^```(?:json)?\s*/i, "")
    .replace(/\s*```$/i, "")
    .trim();

  const tryParse = (s) => {
    try {
      return JSON.parse(s);
    } catch {
      return null;
    }
  };

  let parsed = tryParse(cleaned);
  if (parsed) return parsed;

  const match = cleaned.match(/\{[\s\S]*\}/);
  if (match) {
    parsed = tryParse(match[0]);
    if (parsed) return parsed;
  }

  const translationMatch = cleaned.match(
    /"translation"\s*:\s*"((?:\\.|[^"\\])*)"/
  );
  if (translationMatch?.[1]) {
    try {
      return { translation: JSON.parse(`"${translationMatch[1]}"`) };
    } catch {
      return { translation: translationMatch[1] };
    }
  }
  return null;
}

function getGenerativeModelInstance(modelName = CANDIDATE_MODELS[0]) {
  const key =
    process.env.GEMINI_API_KEY ||
    (typeof geminiApiKey?.value === "function" ? geminiApiKey.value() : "");
  if (!key) {
    throw new HttpsError("failed-precondition", "GEMINI_API_KEY yapılandırılmadı.");
  }
  const genAI = new GoogleGenerativeAI(key);
  return genAI.getGenerativeModel({
    model: modelName,
    systemInstruction: DEEP_CONTEXT_TRANSLATOR_SYSTEM_INSTRUCTION,
    generationConfig: {
      temperature: 0.2,
      maxOutputTokens: 4096,
      responseMimeType: "application/json",
    },
  });
}

function isRetryableModelError(err) {
  const msg = String(err?.message || "").toLowerCase();
  return (
    msg.includes("not found") ||
    msg.includes("404") ||
    msg.includes("invalid model") ||
    msg.includes("is no longer available") ||
    msg.includes("not available to new users")
  );
}

/**
 * Enterprise Callable Function: geminiTranslate
 * Masaüstü, Web ve Mobil (Capacitor iOS/Android) için App Check engeli olmadan sorunsuz çalışır.
 * Güvenlik: Firebase Auth doğrulaması + istek boyutu sınırları ile sağlanır.
 * data: { mode: 'text'|'audio', text?, targetLang, targetLabel?, mimeType?, audioBase64? }
 */
exports.geminiTranslate = onCall(
  {
    region: "us-central1",
    secrets: [geminiApiKey],
    timeoutSeconds: 60,
    memory: "512MiB",
    enforceAppCheck: false,
  },
  async (request) => {
    if (!request.auth?.uid) {
      throw new HttpsError("unauthenticated", "Çeviri yapmak için giriş yapmalısınız.");
    }
    const data = request.data || {};
    const mode = data.mode === "audio" ? "audio" : "text";
    const targetLang = String(data.targetLang || "").trim();
    if (!targetLang) {
      throw new HttpsError("invalid-argument", "Hedef dil gerekli.");
    }

    const target = languageLabel(targetLang, data.targetLabel);

    try {
      if (mode === "text") {
        const text = String(data.text || "").trim();
        if (!text) {
          throw new HttpsError("invalid-argument", "Çevrilecek metin gerekli.");
        }
        if (text.length > 4000) {
          throw new HttpsError("invalid-argument", "Metin çok uzun (azami 4000 karakter).");
        }

        const prompt = `Task: Natural, plain translation for language learners into ${target} (${targetLang}).
Detect the source language.
Prefer everyday wording; avoid literary/poetic phrasing.
Return ONLY valid JSON with keys:
- translation: string (natural translated text)
- sourceLang: string (detected ISO code)
- tone: string (detected tone: Samimi/Günlük, Resmî, Duygusal, Akademik)
- contextNotes: string (1-2 sentences Turkish pedagogical explanation)
- nuances: array of objects { phrase, meaning, note }
Do not add commentary outside JSON.
User text:
"""${text}"""`;

        let lastErr = null;
        for (const modelName of CANDIDATE_MODELS) {
          try {
            const model = getGenerativeModelInstance(modelName);
            const result = await model.generateContent(prompt);
            const raw = result?.response?.text?.() || "";
            const parsed = parseModelJson(raw);
            if (!parsed?.translation) {
              throw new Error("Gemini geçerli bir çeviri metni dönmedi.");
            }
            return {
              translation: String(parsed.translation).trim(),
              sourceLang: parsed.sourceLang ? String(parsed.sourceLang).trim() : undefined,
              tone: parsed.tone ? String(parsed.tone).trim() : undefined,
              contextNotes: parsed.contextNotes ? String(parsed.contextNotes).trim() : undefined,
              nuances: Array.isArray(parsed.nuances) ? parsed.nuances : [],
              transcript: parsed.transcript ? String(parsed.transcript).trim() : undefined,
            };
          } catch (err) {
            lastErr = err;
            if (isRetryableModelError(err)) continue;
            throw err;
          }
        }
        throw lastErr || new Error("Gemini AI servisinden yanıt alınamadı.");
      }

      // audio mode
      const audioBase64 = String(data.audioBase64 || "");
      const mimeType = String(data.mimeType || "audio/webm");
      if (!audioBase64 || audioBase64.length < 32) {
        throw new HttpsError("invalid-argument", "Ses kaydı boş görünüyor.");
      }
      if (audioBase64.length > 3_500_000) {
        throw new HttpsError("invalid-argument", "Ses kaydı çok uzun (azami ~2.5MB).");
      }

      const prompt = `Task: Voice translation for language learners into ${target} (${targetLang}).
1) Transcribe the spoken audio accurately.
2) Translate the transcript into ${target}.
Prefer everyday wording; avoid literary/poetic phrasing.
Return ONLY valid JSON with keys:
- transcript: string (accurate transcription)
- translation: string (natural translation)
- sourceLang: string (detected ISO code)
- tone: string
- contextNotes: string (1-2 sentences Turkish pedagogical explanation)
- nuances: array of objects { phrase, meaning, note }
Do not add commentary outside JSON.`;

      let lastErr = null;
      for (const modelName of CANDIDATE_MODELS) {
        try {
          const model = getGenerativeModelInstance(modelName);
          const result = await model.generateContent([
            { text: prompt },
            {
              inlineData: {
                mimeType,
                data: audioBase64,
              },
            },
          ]);
          const raw = result?.response?.text?.() || "";
          const parsed = parseModelJson(raw);
          if (!parsed?.translation && !parsed?.transcript) {
            throw new Error("Ses anlaşılamadı. Lütfen daha net konuşup tekrar deneyin.");
          }
          return {
            translation: String(parsed.translation || "").trim(),
            transcript: String(parsed.transcript || "").trim(),
            sourceLang: parsed.sourceLang ? String(parsed.sourceLang).trim() : undefined,
            tone: parsed.tone ? String(parsed.tone).trim() : undefined,
            contextNotes: parsed.contextNotes ? String(parsed.contextNotes).trim() : undefined,
            nuances: Array.isArray(parsed.nuances) ? parsed.nuances : [],
          };
        } catch (err) {
          lastErr = err;
          if (isRetryableModelError(err)) continue;
          throw err;
        }
      }
      throw lastErr || new Error("Gemini ses çeviri servisinden yanıt alınamadı.");
    } catch (e) {
      if (e instanceof HttpsError) throw e;
      console.error("geminiTranslate error:", e?.message || e);
      const msg = String(e?.message || "Google AI çeviri hatası");
      if (/API_KEY|invalid.*key|403|PERMISSION/i.test(msg)) {
        throw new HttpsError("failed-precondition", "Google AI API anahtarı geçersiz veya yetkisiz.");
      }
      if (/429|quota|resource.exhausted/i.test(msg)) {
        throw new HttpsError("resource-exhausted", "Google AI kotası doldu; lütfen biraz sonra tekrar deneyin.");
      }
      throw new HttpsError("internal", msg.slice(0, 180));
    }
  }
);
