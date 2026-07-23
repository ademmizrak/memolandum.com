import { getGenerativeModel, Schema } from "firebase/ai";
import { ai, auth } from "./config";
import { assertAllowed, commitAbuse, AbuseError } from "../security";
import { useMemolandumStore } from "../../store/useMemolandumStore";
import { createPulseEntry } from "../learning/memolandumPulse";

export { AbuseError };

function translateAction(kind /* 'text' | 'audio' */) {
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

const DEEP_CONTEXT_TRANSLATOR_SYSTEM_INSTRUCTION = `Sen dünya çapında kıdemli bir dilbilimci, edebiyat mütehassısı ve dil öğretim uzmanısın. Görevin, verilen metin ya da ses kaydını hedef dile SADECE KELİME KELİME ÇEVİRMEK DEĞİL, cümlenin arkasındaki TÜM DERİN BAĞLAMI, DUYGUYU, NÜANSLARI VE KÜLTÜREL DEYİMLERİ algılayarak en doğal ve mükemmel şekilde aktarmaktır.

Temel İlkelerin:
1) DERİN BAĞLAM & KÜLTÜREL DEYİMLER: Kaynak metindeki kültürel kalıpları, deyimleri ve argo/argo-dışı nüansları analiz et. Hedef dildeki tam birebir ruhdaş karşılığını bul. Asla mekanik veya ruhsuz çeviri yapma.
2) TON VE DUYGU ANALİZİ: Konuşmanın/metnin tonunu belirle (Örn: Samimi/Günlük, Resmî/Profesyonel, Edebi/Şairane, Deyimsel, Duygusal, Esprili, Akademik).
3) EĞİTİMCİ VE İPUCU NOTU (contextNotes): Kullanıcının dil öğrenimini destekleyecek şekilde; cümlenin neden böyle çevrildiğini, gizli anlamını veya hedef dildeki kullanım ipucunu 1-2 cümlelik harika bir açıklama ile sun.
4) TERİM/KAVRAM NÜANSLARI (nuances): Metindeki kritik kelimeleri veya deyimleri ayrıştırıp kısa Türkçe açıklamalarını ekle.
5) FORMAT Sadakati: Kaynak metindeki biçimlendirmeye ve imla ruhuna sadık kal.`;

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

// Tercih sırasına göre en güçlü Gemini Flash modelleri
const CANDIDATE_MODELS = [
  "gemini-2.5-flash",
  "gemini-2.0-flash",
  "gemini-flash-latest",
];

function getTranslateModel(preferredModel = null) {
  if (!ai) {
    throw new Error("AI çeviri servisi yapılandırılmadı. Lütfen internet bağlantınızı ve Firebase ayarlarınızı kontrol edin.");
  }

  const modelName = preferredModel || CANDIDATE_MODELS[0];

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
  Model isteğini dener, model adı hatası alması durumunda alt modellerle otomatik dener
 */
async function generateWithFallback(promptParts) {
  let lastError = null;

  for (const modelName of CANDIDATE_MODELS) {
    try {
      const model = getTranslateModel(modelName);
      const result = await model.generateContent(promptParts);
      return result;
    } catch (err) {
      lastError = err;
      const msg = String(err?.message || "").toLowerCase();
      // Model bulunamadıysa bir sonraki adayı dene
      if (msg.includes("not found") || msg.includes("invalid model") || msg.includes("404")) {
        console.warn(`Gemini model ${modelName} kullanılamadı, alternatif deneniyor...`);
        continue;
      }
      throw err;
    }
  }

  throw lastError || new Error("Gemini servisine erişilemedi.");
}

/**
 * Metni hedef dile derin bağlamsal zekâ ile çevirir.
 * @returns {{ translation: string, sourceLang?: string, tone?: string, contextNotes?: string, nuances?: Array, transcript?: string }}
 */
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

  if (!trimmed) {
    throw new Error("Çevrilecek bir metin girin.");
  }
  if (!targetLangCode) {
    throw new Error("Hedef dil seçin.");
  }

  const target = languageLabel(targetLangCode);
  const prompt = `Task: Deep contextual translation into ${target} (code: ${targetLangCode}).
1. Detect the source language.
2. Translate with deep cultural context, natural native phrasing, and emotional resonance.
3. Identify the tone of the sentence (e.g. Samimi/Günlük, Resmî, Deyimsel, Duygusal, Akademik).
4. Provide a helpful context note (contextNotes in Turkish) explaining subtle meanings or usage tips.
5. Extract key vocabulary/idiom nuances (nuances array with phrase, meaning, note).

Return ONLY valid JSON matching schema with keys:
translation, sourceLang, tone, contextNotes, nuances.

User text:
"""${trimmed}"""`;

  const result = await generateWithFallback(prompt);
  const raw = extractText(result);
  const parsed = parseModelJson(raw);

  if (!parsed?.translation) {
    const finish = result?.response?.candidates?.[0]?.finishReason;
    console.warn("translateText parse fail", { finish, rawLen: String(raw || "").length });
    throw new Error("Çeviri alınamadı. Tekrar deneyin.");
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

/**
 * Ses kaydını yazıya döker ve hedef dile derin bağlamla çevirir (Gemini Multimodal).
 */
export async function translateAudioBlob(audioBlob, targetLangCode) {
  if (!audioBlob || audioBlob.size < 8) {
    throw new Error("Ses kaydı boş görünüyor.");
  }
  if (audioBlob.size > 3_500_000) {
    throw new Error("Ses kaydı çok uzun. Lütfen daha kısa konuşun.");
  }
  if (!targetLangCode) {
    throw new Error("Hedef dil seçin.");
  }

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

  const prompt = `Task: Multimodal voice transcription & deep context translation into ${target} (code: ${targetLangCode}).
1. Transcribe the spoken audio accurately into 'transcript'.
2. Detect source language into 'sourceLang'.
3. Translate the spoken message into 'translation' with natural native tone, idiom awareness, and cultural context.
4. Provide 'tone' (e.g. Samimi, Resmî, Duygusal, Deyimsel).
5. Provide 'contextNotes' (Turkish pedagogical tip explaining context).
6. Provide 'nuances' array if key phrases exist.

Return ONLY valid JSON with keys: transcript, translation, sourceLang, tone, contextNotes, nuances.`;

  const result = await generateWithFallback([
    { text: prompt },
    {
      inlineData: {
        mimeType,
        data: audioBase64,
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
    tone: parsed.tone ? String(parsed.tone).trim() : undefined,
    contextNotes: parsed.contextNotes ? String(parsed.contextNotes).trim() : undefined,
    nuances: Array.isArray(parsed.nuances) ? parsed.nuances : [],
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
  return (
    String(value || "")
      .trim()
      .toLowerCase()
      .normalize("NFKD")
      .replace(/[\u0300-\u036f]/g, "")
      .replace(/[^a-z0-9\u00c0-\u024f]+/gi, "-")
      .replace(/^-+|-+$/g, "")
      .slice(0, 40) || "word"
  );
}

/**
 * Anlık çeviri sonucundan Kelime Kasası kaydı üretir (Pulse seed).
 */
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
    throw new Error("Kasaya eklemek için metin ve çeviri gerekli.");
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
