import { httpsCallable } from "firebase/functions";
import { auth, cloudFuncs } from "./config";
import { assertAllowed, commitAbuse, AbuseError } from "../security";
import { useMemolandumStore } from "../../store/useMemolandumStore";
import { createPulseEntry } from "../learning/memolandumPulse";

export { AbuseError };

function translateAction(kind) {
  const premium = !!useMemolandumStore.getState().isPremium;
  if (kind === "audio") {
    return premium ? "translate_audio_premium" : "translate_audio";
  }
  return premium ? "translate_text_premium" : "translate_text";
}

export const TRANSLATE_LANGUAGES = [
  { code: "tr", label: "Türkçe", name: "Türkçe" },
  { code: "en", label: "English", name: "English" },
  { code: "de", label: "Deutsch", name: "Deutsch" },
  { code: "fr", label: "Français", name: "Français" },
  { code: "es", label: "Español", name: "Español" },
  { code: "ru", label: "Русский", name: "Русский" },
  { code: "ko", label: "한국어", name: "한국어" },
  { code: "pt", label: "Português", name: "Português" },
  { code: "ar", label: "العربية", name: "العربية" },
  { code: "ja", label: "日本語", name: "日本語" },
  { code: "zh", label: "中文", name: "中文" },
  { code: "el", label: "Ελληνικά", name: "Ελληνικά" },
  { code: "it", label: "Italiano", name: "Italiano" },
  { code: "osm", label: "Osmanlıca", name: "Osmanlıca" },
];

const LANG_PROMPT_LABEL = {
  osm: "Osmanlıca (Ottoman Turkish — prefer Arabic script with Ottoman orthography; add Latin transliteration in parentheses)",
};

const DEEP_CONTEXT_TRANSLATOR_SYSTEM_INSTRUCTION = `Sen Memolandum dil öğrenme platformunun hızlı çeviri asistanısın. Görevin metni/sesi hedef dile açık, doğru ve günlük dile uygun şekilde çevirmektir — roman/şiir çevirmeni gibi değil.

Kuralların:
1) YALIN VE DOĞAL (ÖNCELİK): Sade, standart, günlük dil kullan. Aşırı şiirsel, edebi (literary), lirik veya dramatize çevirilerden kaçın.
2) DEYİM: Motamot kalma. Gerçek deyimleri hedef dildeki en doğal günlük karşılığıyla ver.
3) TON: Tonu tespit et (Samimi/Günlük, Resmî, Duygusal, Akademik). Duygusal metinde bile abartma; öğrenen için net kal.
4) EĞİTİMCİ İPUCU (contextNotes): 1-2 cümle Türkçe — neden bu karşılık, kısa ve net.
5) NÜANSLAR (nuances): Kilit kelime/deyimleri Türkçe anlamlarıyla ayrıştır.`;

function languageLabel(code) {
  if (LANG_PROMPT_LABEL[code]) return LANG_PROMPT_LABEL[code];
  const row = TRANSLATE_LANGUAGES.find((l) => l.code === code);
  return row?.label || row?.name || code;
}

/** REST için canlı adaylar */
const CANDIDATE_MODELS = ["gemini-3.8-flash", "gemini-flash-latest"];

const REQUEST_TIMEOUT_MS = 28000;

function getGeminiKey() {
  return (
    process.env.NEXT_PUBLIC_GEMINI_API_KEY ||
    process.env.GEMINI_API_KEY ||
    ""
  );
}

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

function extractText(result) {
  try {
    const direct = result?.response?.text?.();
    if (direct) return direct;
  } catch {
    /* fallback below */
  }
  const parts = result?.response?.candidates?.[0]?.content?.parts || [];
  return parts
    .filter((p) => typeof p?.text === "string" && !p.thought)
    .map((p) => p.text)
    .join("")
    .trim();
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

function withTimeout(promise, ms, label = "Gemini") {
  return new Promise((resolve, reject) => {
    const timer = setTimeout(() => {
      reject(new Error(`${label} yanıt süresi aşıldı (${Math.round(ms / 1000)} sn).`));
    }, ms);
    promise.then(
      (v) => {
        clearTimeout(timer);
        resolve(v);
      },
      (err) => {
        clearTimeout(timer);
        reject(err);
      }
    );
  });
}


/** Doğrudan Google AI REST — yedek yol */
async function fetchGeminiDirect(promptParts, modelName = CANDIDATE_MODELS[0]) {
  const apiKey = getGeminiKey();
  if (!apiKey) {
    throw new Error("Gemini API anahtarı eksik (NEXT_PUBLIC_GEMINI_API_KEY).");
  }

  const url = `https://generativelanguage.googleapis.com/v1beta/models/${modelName}:generateContent?key=${encodeURIComponent(apiKey)}`;
  const controller = new AbortController();
  const timeoutId = setTimeout(() => controller.abort(), REQUEST_TIMEOUT_MS);

  try {
    const response = await fetch(url, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "x-goog-api-key": apiKey,
      },
      signal: controller.signal,
      body: JSON.stringify({
        contents: [{ parts: promptParts }],
        systemInstruction: {
          parts: [{ text: DEEP_CONTEXT_TRANSLATOR_SYSTEM_INSTRUCTION }],
        },
        generationConfig: {
          temperature: 0.2,
          maxOutputTokens: 4096,
          responseMimeType: "application/json",
          responseSchema: {
            type: "OBJECT",
            properties: {
              translation: { type: "STRING" },
              sourceLang: { type: "STRING" },
              tone: { type: "STRING" },
              contextNotes: { type: "STRING" },
              transcript: { type: "STRING" },
              nuances: {
                type: "ARRAY",
                items: {
                  type: "OBJECT",
                  properties: {
                    phrase: { type: "STRING" },
                    meaning: { type: "STRING" },
                    note: { type: "STRING" },
                  },
                },
              },
            },
            required: ["translation"],
          },
        },
      }),
    });

    clearTimeout(timeoutId);

    if (!response.ok) {
      const errText = await response.text();
      throw new Error(`API HTTP ${response.status}: ${errText.slice(0, 150)}`);
    }

    const data = await response.json();
    const candidate = data?.candidates?.[0];
    const finish = String(candidate?.finishReason || "");
    const parts = candidate?.content?.parts;
    const rawText = Array.isArray(parts)
      ? parts.map((p) => p?.text || "").filter(Boolean).join("\n").trim()
      : String(candidate?.content?.parts?.[0]?.text || "").trim();

    if (!rawText) {
      if (/SAFETY|BLOCK|RECITATION/i.test(finish)) {
        throw new Error("Çeviri güvenlik filtresine takıldı. Metni sadeleştirip tekrar deneyin.");
      }
      if (/MAX_TOKENS/i.test(finish)) {
        throw new Error("Çeviri yanıtı kesildi. Daha kısa metin deneyin.");
      }
      throw new Error("Gemini geçerli bir yanıt metni dönmedi.");
    }
    return rawText;
  } catch (err) {
    clearTimeout(timeoutId);
    if (err?.name === "AbortError") {
      throw new Error(`Gemini yanıt süresi aşıldı (${Math.round(REQUEST_TIMEOUT_MS / 1000)} sn).`);
    }
    throw err;
  }
}

async function generateViaRest(promptParts) {
  let lastErr = null;
  for (const modelName of CANDIDATE_MODELS) {
    try {
      return await fetchGeminiDirect(promptParts, modelName);
    } catch (err) {
      lastErr = err;
      if (isRetryableModelError(err)) continue;
      throw err;
    }
  }
  throw lastErr || new Error("Gemini AI servisinden yanıt alınamadı.");
}

async function generateWithFallback(promptParts) {
  const hasRestKey = !!getGeminiKey();

  if (hasRestKey) {
    try {
      return await generateViaRest(promptParts);
    } catch (restErr) {
      console.warn("[translate] REST API hatası:", restErr?.message || restErr);
      throw restErr;
    }
  }

  throw new Error("Çeviri servisine şu anda ulaşılamıyor. Lütfen giriş yapın veya biraz sonra tekrar deneyin.");
}

function normalizeResult(parsed) {
  const translationVal =
    parsed?.translation ||
    parsed?.translatedText ||
    parsed?.translated_text ||
    parsed?.translation_text ||
    parsed?.translated;

  if (!translationVal) return null;

  return {
    translation: String(translationVal).trim(),
    sourceLang: parsed.sourceLang ? String(parsed.sourceLang).trim() : undefined,
    tone: parsed.tone ? String(parsed.tone).trim() : undefined,
    contextNotes: parsed.contextNotes ? String(parsed.contextNotes).trim() : undefined,
    nuances: Array.isArray(parsed.nuances) ? parsed.nuances : [],
    transcript: parsed.transcript ? String(parsed.transcript).trim() : undefined,
  };
}

/**
 * Girişli kullanıcı: kurumsal sunucu geminiTranslate Cloud Function (Firebase Secret GEMINI_API_KEY).
 * İstemcide App Check gereksinimi olmadan Web ve Mobil (Capacitor) ortamlarında çalışır.
 * Başarısız olursa / misafirde istemci REST API yedeğine düşülür.
 */
async function tryCloudGeminiTranslate(payload) {
  if (!auth?.currentUser || !cloudFuncs) return null;
  try {
    const call = httpsCallable(cloudFuncs, "geminiTranslate");
    const { data } = await call(payload);
    if (!data) return null;
    const normalized = normalizeResult(data);
    if (normalized) return normalized;
    if (data.transcript || data.translation) {
      return {
        translation: String(data.translation || "").trim(),
        transcript: data.transcript ? String(data.transcript).trim() : undefined,
        sourceLang: data.sourceLang ? String(data.sourceLang).trim() : undefined,
        tone: data.tone ? String(data.tone).trim() : undefined,
        contextNotes: data.contextNotes ? String(data.contextNotes).trim() : undefined,
        nuances: Array.isArray(data.nuances) ? data.nuances : [],
      };
    }
    return null;
  } catch (err) {
    console.warn(
      "[translate] Cloud Function çağrısı başarısız, istemci REST yedeğine düşülüyor:",
      err?.code || err?.message || err
    );
    return null;
  }
}

export async function translateText(text, targetLangCode) {
  const isAuthenticated = !!auth?.currentUser;
  const uid = auth?.currentUser?.uid || null;
  const ticket = assertAllowed({
    action: translateAction("text"),
    text,
    isAuthenticated,
    uid,
  });
  const trimmed = ticket.text;

  if (!trimmed) throw new Error("Çevrilecek bir metin girin.");
  if (!targetLangCode) throw new Error("Hedef dil seçin.");

  const target = languageLabel(targetLangCode);

  const cloudResult = await tryCloudGeminiTranslate({
    mode: "text",
    text: trimmed,
    targetLang: targetLangCode,
    targetLabel: target,
  });
  if (cloudResult?.translation) {
    commitAbuse(ticket);
    return cloudResult;
  }

  const promptParts = [
    {
      text: `Task: Natural, plain translation for language learners into ${target} (${targetLangCode}).
Prefer everyday wording; avoid literary/poetic phrasing.
Return JSON with keys: translation, sourceLang, tone, contextNotes, nuances.
nuances is an array of objects with keys: phrase, meaning, note.
User text: """${trimmed}"""`,
    },
  ];

  const rawJsonStr = await generateWithFallback(promptParts);
  const parsed = parseModelJson(rawJsonStr);
  const result = normalizeResult(parsed);

  if (!result) {
    throw new Error("Çeviri yanıtı çözümlenemedi. Tekrar deneyin.");
  }

  commitAbuse(ticket);
  return result;
}

export async function translateAudioBlob(audioBlob, targetLangCode) {
  if (!audioBlob || audioBlob.size < 8) throw new Error("Ses kaydı boş.");
  if (audioBlob.size > 3_500_000) throw new Error("Ses kaydı çok uzun.");
  if (!targetLangCode) throw new Error("Hedef dil seçin.");

  const isAuthenticated = !!auth?.currentUser;
  const uid = auth?.currentUser?.uid || null;
  const ticket = assertAllowed({
    action: translateAction("audio"),
    isAuthenticated,
    uid,
    skipDedupe: true,
  });

  const mimeType = audioBlob.type || "audio/webm";
  const audioBase64 = await blobToBase64(audioBlob);
  const target = languageLabel(targetLangCode);

  const cloudResult = await tryCloudGeminiTranslate({
    mode: "audio",
    audioBase64,
    mimeType,
    targetLang: targetLangCode,
    targetLabel: target,
  });
  if (cloudResult && (cloudResult.translation || cloudResult.transcript)) {
    commitAbuse(ticket);
    return {
      translation: cloudResult.translation || "",
      transcript: cloudResult.transcript || "",
      sourceLang: cloudResult.sourceLang,
      tone: cloudResult.tone,
      contextNotes: cloudResult.contextNotes,
      nuances: cloudResult.nuances || [],
    };
  }

  const promptParts = [
    {
      text: `Task: Voice transcription & natural plain translation for language learners into ${target} (${targetLangCode}).
Prefer everyday wording; avoid literary/poetic phrasing.
Return JSON with keys: transcript, translation, sourceLang, tone, contextNotes, nuances.`,
    },
    { inlineData: { mimeType, data: audioBase64 } },
  ];

  const rawJsonStr = await generateWithFallback(promptParts);
  const parsed = parseModelJson(rawJsonStr);
  const result = normalizeResult(parsed);

  if (!result && !parsed?.transcript) {
    throw new Error("Ses anlaşılamadı. Tekrar deneyin.");
  }

  commitAbuse(ticket);

  return {
    translation: result?.translation || "",
    transcript: String(parsed?.transcript || result?.transcript || "").trim(),
    sourceLang: result?.sourceLang,
    tone: result?.tone,
    contextNotes: result?.contextNotes,
    nuances: result?.nuances || [],
  };
}

function blobToBase64(blob) {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onloadend = () => {
      const res = reader.result;
      if (typeof res !== "string") return reject(new Error("Ses okunamadı."));
      const comma = res.indexOf(",");
      resolve(comma >= 0 ? res.slice(comma + 1) : res);
    };
    reader.onerror = () => reject(new Error("Ses okunamadı."));
    reader.readAsDataURL(blob);
  });
}

function slugifyPart(v) {
  return (
    String(v || "")
      .trim()
      .toLowerCase()
      .normalize("NFKD")
      .replace(/[\u0300-\u036f]/g, "")
      .replace(/[^a-z0-9]+/g, "-")
      .replace(/^-+|-+$/g, "")
      .slice(0, 40) || "word"
  );
}

export function buildVaultWordFromTranslation({
  sourceText,
  translation,
  targetLang,
  sourceLang,
  contextNotes,
}) {
  const source = String(sourceText || "").trim();
  const target = String(translation || "").trim();
  if (!source || !target) {
    throw new Error("Metin ve çeviri gerekli.");
  }
  const id = `ai_${slugifyPart(targetLang)}_${slugifyPart(source)}_${slugifyPart(target)}`.slice(
    0,
    120
  );

  return createPulseEntry({
    id,
    english: source,
    turkish: target,
    audioUrl: "",
    language: `ai:${targetLang || "xx"}`,
    origin: "instant_translate",
    sourceLang: sourceLang || "",
    targetLang: targetLang || "",
    note: contextNotes || "",
  });
}
