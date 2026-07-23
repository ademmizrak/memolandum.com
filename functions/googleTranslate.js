const { onCall, HttpsError } = require("firebase-functions/v2/https");
const { TranslationServiceClient } = require("@google-cloud/translate");

// İstemciyi başlat (Service Account otomatik algılanır)
const translationClient = new TranslationServiceClient();

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
    const [response] = await translationClient.translateText(request);

    return response.translations.map((translation) => ({
      translatedText: translation.translatedText,
      detectedLanguage: translation.detectedLanguageCode,
    }));
  } catch (error) {
    console.error("Çeviri API Hatası:", error);
    throw new Error("Çeviri servisi şu an yanıt veremiyor: " + (error?.message || error));
  }
}

/**
 * Firebase Cloud Function Endpoint: cloudTranslate
 */
exports.cloudTranslate = onCall({ region: "us-central1" }, async (request) => {
  const data = request.data || {};
  const text = data.text;
  const targetLanguage = data.targetLanguage || "tr";
  const sourceLanguage = data.sourceLanguage || null;

  if (!text) {
    throw new HttpsError("invalid-argument", "Çevrilecek metin belirtilmedi.");
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
