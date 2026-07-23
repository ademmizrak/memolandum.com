import { assertAllowed, commitAbuse, AbuseError } from "../security";
import { useMemolandumStore } from "../../store/useMemolandumStore";
import { createPulseEntry } from "../learning/memolandumPulse";
import { auth } from "./config";

export { AbuseError };

function getGeminiKey() {
  return (
    process.env.NEXT_PUBLIC_GEMINI_API_KEY ||
    process.env.GEMINI_API_KEY ||
    ""
  );
}

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

function languageLabel(code) {
  if (LANG_PROMPT_LABEL[code]) return LANG_PROMPT_LABEL[code];
  const row = TRANSLATE_LANGUAGES.find((l) => l.code === code);
  return row?.label || row?.name || code;
}

const CANDIDATE_MODELS = [
  "gemini-2.5-flash",
  "gemini-2.0-flash",
  "gemini-1.5-flash",
];

async function fetchGeminiDirect(promptParts, modelName = CANDIDATE_MODELS[0]) {
  const apiKey = getGeminiKey();
  const url = `https://generativelanguage.googleapis.com/v1beta/models/${modelName}:generateContent?key=${apiKey}`;

  const controller = new AbortController();
  const timeoutId = setTimeout(() => controller.abort(), 12000);

  try {
    const response = await fetch(url, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      signal: controller.signal,
      body: JSON.stringify({
        contents: [{ parts: promptParts }],
        systemInstruction: {
          parts: [{ text: DEEP_CONTEXT_TRANSLATOR_SYSTEM_INSTRUCTION }],
        },
        generationConfig: {
          temperature: 0.15,
          maxOutputTokens: 2048,
          responseMimeType: "application/json",
        },
      }),
    });

    clearTimeout(timeoutId);

    if (!response.ok) {
      const errText = await response.text();
      throw new Error(`API HTTP ${response.status}: ${errText.slice(0, 150)}`);
    }

    const data = await response.json();
    const rawText = data?.candidates?.[0]?.content?.parts?.[0]?.text;
    if (!rawText) {
      throw new Error("Gemini geçerli bir yanıt metni dönmedi.");
    }
    return rawText;
  } catch (err) {
    clearTimeout(timeoutId);
    if (err.name === "AbortError") {
      throw new Error("Gemini yanıt süresi aşıldı (12 sn).");
    }
    throw err;
  }
}

async function generateWithFallback(promptParts) {
  let lastErr = null;
  for (const modelName of CANDIDATE_MODELS) {
    try {
      return await fetchGeminiDirect(promptParts, modelName);
    } catch (err) {
      lastErr = err;
      const msg = String(err?.message || "").toLowerCase();
      if (
        msg.includes("not found") ||
        msg.includes("404") ||
        msg.includes("invalid") ||
        msg.includes("unsupported")
      ) {
        continue;
      }
      throw err;
    }
  }
  throw lastErr || new Error("Gemini AI servisinden yanıt alınamadı.");
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
  const promptParts = [
    {
      text: `Task: Deep contextual translation into ${target} (${targetLangCode}).
Return JSON with keys: translation, sourceLang, tone, contextNotes, nuances.
nuances is an array of objects with keys: phrase, meaning, note.
User text: """${trimmed}"""`,
    },
  ];

  const rawJsonStr = await generateWithFallback(promptParts);
  const parsed = parseModelJson(rawJsonStr);

  if (!parsed?.translation) {
    throw new Error("Çeviri yanıtı çözümlenemedi. Tekrar deneyin.");
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

  const promptParts = [
    {
      text: `Task: Voice transcription & deep context translation into ${target} (${targetLangCode}).
Return JSON with keys: transcript, translation, sourceLang, tone, contextNotes, nuances.`,
    },
    { inlineData: { mimeType, data: audioBase64 } },
  ];

  const rawJsonStr = await generateWithFallback(promptParts);
  const parsed = parseModelJson(rawJsonStr);

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
