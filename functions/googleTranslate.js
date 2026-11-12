const { onCall, HttpsError } = require("firebase-functions/v2/https");
const { TranslationServiceClient } = require("@google-cloud/translate");

// İstemciyi tembel (lazy) başlat — modül yükleme sırasında gRPC metadata sorgusu ve deploy zaman aşımını engeller
let _translationClient = null;
function getTranslationClient() {
  if (!_translationClient) {
    _translationClient = new TranslationServiceClient();
  }
  return _translationClient;
}

async function translateText({ text, targetLanguage, sourceLanguage = null, projectId = "memolandum-33dc4" }) {
  const location = "global";

  const request = {
    parent: `projects/${projectId}/locations/${location}`,
    contents: Array.isArray(text) ? text : [text],
    targetLanguageCode: targetLanguage,
    sourceLanguageCode: sourceLanguage || undefined, // Belirtilmezse otomatik algılar
    mimeType: "text/plain",
  };

  try {
    const client = getTranslationClient();
    const [response] = await client.translateText(request);

    return response.translations.map((translation) => ({
      translatedText: translation.translatedText,
      detectedLanguage: translation.detectedLanguageCode,
    }));
  } catch (error) {
    console.error("Çeviri API Hatası:", error);
    throw new Error("Çeviri servisi şu an yanıt veremiyor: " + (error?.message || error));
  }
}

const translateRateMap = new Map();
function enforceCloudTranslateRateLimit(uid, maxPerMinute = 20) {
  const now = Date.now();
  const entry = translateRateMap.get(uid) || { count: 0, resetAt: now + 60000 };
  if (now > entry.resetAt) {
    entry.count = 0;
    entry.resetAt = now + 60000;
  }
  entry.count += 1;
  translateRateMap.set(uid, entry);
  if (translateRateMap.size > 5000) {
    for (const [k, v] of translateRateMap.entries()) {
      if (now > v.resetAt) translateRateMap.delete(k);
    }
  }
  if (entry.count > maxPerMinute) {
    throw new HttpsError(
      "resource-exhausted",
      "Çok sık çeviri isteği gönderildi. Lütfen 1 dakika bekleyin."
    );
  }
}

/**
 * Firebase Cloud Function Endpoint: cloudTranslate
 */
exports.cloudTranslate = onCall({ region: "us-central1", enforceAppCheck: false }, async (request) => {
  if (!request.auth) {
    throw new HttpsError("unauthenticated", "Çeviri yapmak için giriş yapmalısınız.");
  }
  enforceCloudTranslateRateLimit(request.auth.uid, 20);

  const data = request.data || {};
  const text = data.text;
  const targetLanguage = String(data.targetLanguage || "tr").slice(0, 10);
  const sourceLanguage = data.sourceLanguage ? String(data.sourceLanguage).slice(0, 10) : null;

  if (!text || (typeof text !== "string" && !Array.isArray(text))) {
    throw new HttpsError("invalid-argument", "Çevrilecek metin belirtilmedi.");
  }
  const items = Array.isArray(text) ? text : [text];
  if (items.length > 10 || items.some((t) => typeof t !== "string" || t.length > 2000)) {
    throw new HttpsError(
      "invalid-argument",
      "Metin boyutu sınırları aşıldı (azami 10 öğe, 2000 karakter)."
    );
  }

  try {
    const results = await translateText({
      text,
      targetLanguage,
      sourceLanguage,
      projectId: process.env.GCP_PROJECT || process.env.GCLOUD_PROJECT || "memolandum-33dc4",
    });

    return {
      success: true,
      translations: results,
      translation: results[0]?.translatedText || "",
      detectedLanguage: results[0]?.detectedLanguage || "",
    };
  } catch (err) {
    throw new HttpsError("internal", err.message || "Google Cloud Çeviri servisi yanıt vermedi.");
  }
});

module.exports.translateText = translateText;
