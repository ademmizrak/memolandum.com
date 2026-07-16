import { getGenerativeModel, Schema } from "firebase/ai";
import { ai, auth } from "./config";
import { assertAllowed, commitAbuse, AbuseError } from "../security";

export { AbuseError };

export const TRANSLATE_LANGUAGES = [
  { code: "tr", label: "Türkçe" },
  { code: "en", label: "English" },
  { code: "de", label: "Deutsch" },
  { code: "fr", label: "Français" },
  { code: "es", label: "Español" },
  { code: "ru", label: "Русский" },
  { code: "ko", label: "한국어" },
  { code: "pt", label: "Português" },
  { code: "ar", label: "العربية" },
  { code: "ja", label: "日本語" },
  { code: "zh", label: "中文" },
  { code: "el", label: "Ελληνικά" },
  { code: "it", label: "Italiano" },
];

const responseSchema = Schema.object({
  properties: {
    sourceLang: Schema.string(),
    translation: Schema.string(),
    transcript: Schema.string(),
  },
  optionalProperties: ["sourceLang", "transcript"],
});

function getTranslateModel() {
  if (!ai) {
    throw new Error("Firebase AI Logic henüz yapılandırılmadı.");
  }

  return getGenerativeModel(ai, {
    // Lite: düşük gecikme; thinkingBudget 0: JSON kesilmesini önler
    model: "gemini-flash-lite-latest",
    generationConfig: {
      temperature: 0.1,
      maxOutputTokens: 1024,
      responseMimeType: "application/json",
      responseSchema,
      thinkingConfig: {
        thinkingBudget: 0,
        includeThoughts: false,
      },
    },
  });
}

function languageLabel(code) {
  return TRANSLATE_LANGUAGES.find((l) => l.code === code)?.label || code;
}

function parseModelJson(text) {
  if (!text) return null;
  try {
    return JSON.parse(text);
  } catch {
    const match = text.match(/\{[\s\S]*\}/);
    if (match) {
      try {
        return JSON.parse(match[0]);
      } catch {
        return null;
      }
    }
    return null;
  }
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

/**
 * Metni hedef dile çevirir (Gemini via Firebase AI Logic).
 * @returns {{ translation: string, sourceLang?: string, transcript?: string }}
 */
export async function translateText(text, targetLangCode) {
  const isAuthenticated = !!auth?.currentUser;
  const uid = auth?.currentUser?.uid || null;
  const ticket = assertAllowed({
    action: "translate_text",
    text,
    isAuthenticated,
    uid,
  });
  const trimmed = ticket.text;

  if (!trimmed) {
    throw new Error("Çevrilecek bir metin girin.");
  }
  if (!targetLangCode) {
    throw new Error("Hedef dil seçin.");
  }

  const target = languageLabel(targetLangCode);
  const model = getTranslateModel();
  const prompt = `You are Memolandum's instant translator for language learners.
Translate the user's text into ${target} (${targetLangCode}).
Detect the source language.
Return ONLY valid JSON matching the schema with keys: translation, sourceLang.
Keep the translation natural and complete. Do not truncate.
User text:
"""${trimmed}"""`;

  const result = await model.generateContent(prompt);
  const raw = extractText(result);
  const parsed = parseModelJson(raw);
  const finish = result?.response?.candidates?.[0]?.finishReason;

  if (!parsed?.translation) {
    const hint =
      finish && finish !== "STOP"
        ? ` (model: ${finish})`
        : raw
          ? " (yanıt kesik/bozuk)"
          : "";
    throw new Error(`Çeviri alınamadı. Tekrar deneyin.${hint}`);
  }

  commitAbuse(ticket);

  return {
    translation: String(parsed.translation).trim(),
    sourceLang: parsed.sourceLang ? String(parsed.sourceLang).trim() : undefined,
    transcript: parsed.transcript ? String(parsed.transcript).trim() : undefined,
  };
}

/**
 * Ses kaydını yazıya döker ve hedef dile çevirir (multimodal Gemini).
 */
export async function translateAudioBlob(audioBlob, targetLangCode) {
  if (!audioBlob || audioBlob.size < 8) {
    throw new Error("Ses kaydı boş görünüyor.");
  }
  if (audioBlob.size > 2_500_000) {
    throw new Error("Ses kaydı çok uzun. Daha kısa konuşun.");
  }
  if (!targetLangCode) {
    throw new Error("Hedef dil seçin.");
  }

  const isAuthenticated = !!auth?.currentUser;
  const uid = auth?.currentUser?.uid || null;
  const ticket = assertAllowed({
    action: "translate_audio",
    isAuthenticated,
    uid,
    skipDedupe: true,
  });

  const target = languageLabel(targetLangCode);
  const mimeType = audioBlob.type || "audio/webm";
  const base64 = await blobToBase64(audioBlob);
  const model = getTranslateModel();

  const prompt = `You are Memolandum's voice translator for language learners.
1) Transcribe the spoken audio accurately.
2) Translate the transcript into ${target} (${targetLangCode}).
Return ONLY valid JSON with fields: transcript, translation, sourceLang.`;

  const result = await model.generateContent([
    { text: prompt },
    {
      inlineData: {
        mimeType,
        data: base64,
      },
    },
  ]);

  const raw = extractText(result);
  const parsed = parseModelJson(raw);

  if (!parsed?.translation && !parsed?.transcript) {
    throw new Error("Ses anlaşılamadı. Daha net konuşup tekrar deneyin.");
  }

  commitAbuse(ticket);

  return {
    translation: String(parsed.translation || "").trim(),
    transcript: String(parsed.transcript || "").trim(),
    sourceLang: parsed.sourceLang ? String(parsed.sourceLang).trim() : undefined,
  };
}

function blobToBase64(blob) {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onloadend = () => {
      const result = reader.result;
      if (typeof result !== "string") {
        reject(new Error("Ses okunamadı."));
        return;
      }
      const comma = result.indexOf(",");
      resolve(comma >= 0 ? result.slice(comma + 1) : result);
    };
    reader.onerror = () => reject(new Error("Ses okunamadı."));
    reader.readAsDataURL(blob);
  });
}

function slugifyPart(value) {
  return String(value || "")
    .trim()
    .toLowerCase()
    .normalize("NFKD")
    .replace(/[\u0300-\u036f]/g, "")
    .replace(/[^a-z0-9\u00c0-\u024f]+/gi, "-")
    .replace(/^-+|-+$/g, "")
    .slice(0, 40) || "word";
}

/**
 * Anlık çeviri sonucundan Kelime Kasası kaydı üretir.
 */
export function buildVaultWordFromTranslation({
  sourceText,
  translation,
  targetLang,
  sourceLang,
}) {
  const source = String(sourceText || "").trim();
  const target = String(translation || "").trim();
  if (!source || !target) {
    throw new Error("Kasaya eklemek için metin ve çeviri gerekli.");
  }

  const id = `ai_${slugifyPart(targetLang)}_${slugifyPart(source)}_${slugifyPart(target)}`.slice(0, 120);

  return {
    id,
    english: source,
    turkish: target,
    audioUrl: "",
    language: `ai:${targetLang || "xx"}`,
    strength: 1,
    lastSeen: Date.now(),
    origin: "instant_translate",
    sourceLang: sourceLang || "",
    targetLang: targetLang || "",
  };
}
