import { getGenerativeModel, Schema } from "firebase/ai";
import { ai, auth } from "./config";
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

const DEEP_CONTEXT_TRANSLATOR_SYSTEM_INSTRUCTION = `Sen kıdemli bir dilbilimci ve kültür mütehassısısın. Görevin metni/sesi hedef dile çevirirken arkasındaki derin bağlamı, duyguyu, nüansları ve deyimleri algılayarak en doğal şekilde aktarmaktır.

Kuralların:
1) DERİN BAĞLAM: Motamot çeviri yapma. Deyimleri ve kültürel kalıpları hedef dildeki en doğal karşılığı ile çevir.
2) TON HAKKIMDA: Metnin tonunu tespit et (Örn: Samimi/Günlük, Resmî, Deyimsel, Duygusal, Akademik).
3) EĞİTİMCİ İPUCU (contextNotes): Kullanıcıya çevirinin neden böyle yapıldığını ve inceliğini açıklayan 1-2 cümlelik Türkçe ipucu ver.
4) NÜANSLAR (nuances): Metindeki kilit kelime ve deyimleri Türkçe anlamlarıyla ayrıştır.`;

const nuanceItemSchema = Schema.object({
  properties: {
    phrase: Schema.string(),
    meaning: Schema.string(),
    note: Schema.string(),
  },
  optionalProperties: ["note"],
});

const responseSchema = Schema.object({
  properties: {
    sourceLang: Schema.string(),
    translation: Schema.string(),
    tone: Schema.string(),
    contextNotes: Schema.string(),
    nuances: Schema.array(nuanceItemSchema),
    transcript: Schema.string(),
  },
  optionalProperties: ["sourceLang", "tone", "contextNotes", "nuances", "transcript"],
});

function languageLabel(code) {
  if (LANG_PROMPT_LABEL[code]) return LANG_PROMPT_LABEL[code];
  const row = TRANSLATE_LANGUAGES.find((l) => l.code === code);
  return row?.label || row?.name || code;
}

const CANDIDATE_MODELS = [
  "gemini-2.5-flash",
  "gemini-2.0-flash",
  "gemini-flash-latest",
];

function getTranslateModel(modelName = CANDIDATE_MODELS[0]) {
  if (!ai) {
    throw new Error("AI servisi bağlanamadı.");
  }
  return getGenerativeModel(ai, {
    model: modelName,
    systemInstruction: DEEP_CONTEXT_TRANSLATOR_SYSTEM_INSTRUCTION,
    generationConfig: {
      temperature: 0.15,
      maxOutputTokens: 4096,
      responseMimeType: "application/json",
      responseSchema,
    },
  });
}

function parseModelJson(text) {
  if (!text) return null;
  try {
    return JSON.parse(text);
  } catch {
    const match = String(text).match(/\{[\s\S]*\}/);
    if (!match) return null;
    try {
      return JSON.parse(match[0]);
    } catch {
      return null;
    }
  }
}

function extractText(result) {
  try {
    const direct = result?.response?.text?.();
    if (direct) return direct;
  } catch {
    /* ignore */
  }
  const parts = result?.response?.candidates?.[0]?.content?.parts || [];
  return parts
    .filter((p) => typeof p?.text === "string" && !p.thought)
    .map((p) => p.text)
    .join("")
    .trim();
}

async function generateWithFallback(promptParts) {
  let lastErr = null;
  for (const modelName of CANDIDATE_MODELS) {
    try {
      const model = getTranslateModel(modelName);
      const timeoutPromise = new Promise((_, reject) =>
        setTimeout(() => reject(new Error("Gemini AI yanıt süresi aşıldı (10 sn). Lütfen tekrar deneyin.")), 10000)
      );
      return await Promise.race([model.generateContent(promptParts), timeoutPromise]);
    } catch (err) {
      lastErr = err;
      const msg = String(err?.message || "").toLowerCase();
      if (msg.includes("not found") || msg.includes("invalid model") || msg.includes("404")) {
        continue;
      }
      throw err;
    }
  }
  throw lastErr || new Error("Gemini servisi yanıt vermedi.");
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
  const prompt = `Task: Deep contextual translation into ${target} (${targetLangCode}).
Return JSON with keys: translation, sourceLang, tone, contextNotes, nuances.
User text: """${trimmed}"""`;

  const result = await generateWithFallback(prompt);
  const raw = extractText(result);
  const parsed = parseModelJson(raw);

  if (!parsed?.translation) {
    throw new Error("Çeviri üretilemedi, lütfen tekrar deneyin.");
  }

  commitAbuse(ticket);

  return {
    translation: String(parsed.translation).trim(),
    sourceLang: parsed.sourceLang ? String(parsed.sourceLang).trim() : undefined,
    tone: parsed.tone ? String(parsed.tone).trim() : undefined,
    contextNotes: parsed.contextNotes ? String(parsed.contextNotes).trim() : undefined,
    nuances: Array.isArray(parsed.nuances) ? parsed.nuances : [],
    transcript: parsed.transcript ? String(parsed.transcript).trim() : undefined,
  };
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

  const prompt = `Task: Voice transcription & deep context translation into ${target} (${targetLangCode}).
Return JSON with keys: transcript, translation, sourceLang, tone, contextNotes, nuances.`;

  const result = await generateWithFallback([
    { text: prompt },
    { inlineData: { mimeType, data: audioBase64 } },
  ]);

  const raw = extractText(result);
  const parsed = parseModelJson(raw);
  if (!parsed?.translation && !parsed?.transcript) {
    throw new Error("Ses anlaşılamadı. Tekrar deneyin.");
  }

  commitAbuse(ticket);

  return {
    translation: String(parsed.translation || "").trim(),
    transcript: String(parsed.transcript || "").trim(),
    sourceLang: parsed.sourceLang ? String(parsed.sourceLang).trim() : undefined,
    tone: parsed.tone ? String(parsed.tone).trim() : undefined,
    contextNotes: parsed.contextNotes ? String(parsed.contextNotes).trim() : undefined,
    nuances: Array.isArray(parsed.nuances) ? parsed.nuances : [],
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
  const id = `ai_${slugifyPart(targetLang)}_${slugifyPart(source)}_${slugifyPart(target)}`.slice(0, 120);

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
