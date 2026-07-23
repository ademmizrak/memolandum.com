/**
 * Google Cloud Translation API v3 Servis Modülü
 *
 * Özellikler:
 * - Google Cloud Translation API v3 entegrasyonu
 * - Service Account kimlik doğrulaması (Environment / JSON String / Default ADC)
 * - Tekli & Toplu (Batch) metin çeviri desteği
 * - Otomatik dil algılama (Language Detection)
 * - Desteklenen dilleri listeleme (Supported Languages)
 * - Enterprise seviyede hata yönetimi, loglama ve kota takibi
 */

const { TranslationServiceClient } = require("@google-cloud/translate");

/**
 * Service Account İstemci Yapılandırması
 */
function createTranslationClient() {
  const options = {};

  // 1. RAW JSON String veya Base64 olarak tanımlanmış Service Account Key
  if (process.env.GOOGLE_SERVICE_ACCOUNT_JSON) {
    try {
      const raw = process.env.GOOGLE_SERVICE_ACCOUNT_JSON.trim();
      const jsonStr = raw.startsWith("{")
        ? raw
        : Buffer.from(raw, "base64").toString("utf-8");
      options.credentials = JSON.parse(jsonStr);
    } catch (err) {
      console.error("[TranslationService] GOOGLE_SERVICE_ACCOUNT_JSON parse hatası:", err.message);
    }
  }

  // 2. Dosya yolu olarak verilen Service Account Key (GOOGLE_APPLICATION_CREDENTIALS)
  if (process.env.GOOGLE_APPLICATION_CREDENTIALS && !options.credentials) {
    options.keyFilename = process.env.GOOGLE_APPLICATION_CREDENTIALS;
  }

  return new TranslationServiceClient(options);
}

const translationClient = createTranslationClient();
const DEFAULT_PROJECT_ID = process.env.GOOGLE_CLOUD_PROJECT_ID || process.env.GCP_PROJECT || "memolandum-33dc4";
const DEFAULT_LOCATION = process.env.GOOGLE_CLOUD_LOCATION || "global";

/**
 * Tekli veya Küçük Diziler için Metin Çevirisi
 *
 * @param {Object} params
 * @param {string|string[]} params.text - Çevrilecek tekil metin veya metin dizisi
 * @param {string} params.targetLanguage - Hedef dil kodu (örn: 'tr', 'en', 'de')
 * @param {string} [params.sourceLanguage] - Kaynak dil kodu (isteğe bağlı, varsayılan: otomatik algılama)
 * @param {string} [params.projectId] - Google Cloud Proje ID (varsayılan: memolandum-33dc4)
 * @param {string} [params.location] - GCP lokasyonu (varsayılan: global)
 * @param {string} [params.mimeType] - 'text/plain' veya 'text/html' (varsayılan: 'text/plain')
 * @returns {Promise<Array<{translatedText: string, detectedLanguage: string}>>}
 */
async function translateText({
  text,
  targetLanguage,
  sourceLanguage = null,
  projectId = DEFAULT_PROJECT_ID,
  location = DEFAULT_LOCATION,
  mimeType = "text/plain",
}) {
  const startTime = Date.now();

  if (!text || (Array.isArray(text) && text.length === 0)) {
    throw new Error("[TranslationService] Çevrilecek metin boş olamaz.");
  }

  if (!targetLanguage) {
    throw new Error("[TranslationService] Hedef dil (targetLanguage) belirtilmelidir.");
  }

  const contents = Array.isArray(text) ? text : [text];
  const parent = `projects/${projectId}/locations/${location}`;

  const request = {
    parent,
    contents,
    targetLanguageCode: targetLanguage,
    mimeType,
  };

  if (sourceLanguage) {
    request.sourceLanguageCode = sourceLanguage;
  }

  try {
    console.log(
      `[TranslationService] Metin çevirisi başlatıldı -> Hedef: ${targetLanguage}, Metin Adedi: ${contents.length}`
    );

    const [response] = await translationClient.translateText(request);

    const duration = Date.now() - startTime;
    console.log(`[TranslationService] Metin çevirisi başarıyla tamamlandı (${duration}ms).`);

    return response.translations.map((t) => ({
      translatedText: t.translatedText,
      detectedLanguage: t.detectedLanguageCode || sourceLanguage || "unknown",
      glossaryConfig: t.glossaryConfig || null,
    }));
  } catch (error) {
    const duration = Date.now() - startTime;
    console.error(`[TranslationService] Çeviri API hatası (${duration}ms):`, {
      code: error.code,
      message: error.message,
      targetLanguage,
      projectId,
    });

    // Enterprise Seviyede Özel Hata Sınıflandırması
    if (error.code === 7 || error.message?.includes("PERMISSION_DENIED")) {
      throw new Error("Google Cloud Translation API yetkilendirme hatası (Service Account izinlerini kontrol edin).");
    }
    if (error.code === 8 || error.message?.includes("RESOURCE_EXHAUSTED")) {
      throw new Error("Google Cloud Translation API kotası doldu. Lütfen daha sonra tekrar deneyin.");
    }
    if (error.code === 3 || error.message?.includes("INVALID_ARGUMENT")) {
      throw new Error(`Geçersiz çeviri parametresi: ${error.message}`);
    }

    throw new Error(`Çeviri servisi yanıt veremiyor: ${error.message}`);
  }
}

/**
 * Büyük Veri Setleri İçin Toplu (Batch) Çeviri İşlemi
 * Otomatik olarak verileri parçalara (chunks) bölerek kotaları ve sınırları korur.
 *
 * @param {Object} params
 * @param {string[]} params.texts - Çevrilecek metinler dizisi
 * @param {string} params.targetLanguage - Hedef dil kodu
 * @param {string} [params.sourceLanguage] - Kaynak dil kodu
 * @param {number} [params.chunkSize] - Her istekteki maksimum metin sayısı (varsayılan: 100)
 * @param {string} [params.projectId] - GCP Proje ID
 * @returns {Promise<Array<{originalText: string, translatedText: string, detectedLanguage: string}>>}
 */
async function translateBatch({
  texts,
  targetLanguage,
  sourceLanguage = null,
  chunkSize = 100,
  projectId = DEFAULT_PROJECT_ID,
}) {
  if (!Array.isArray(texts) || texts.length === 0) {
    return [];
  }

  console.log(`[TranslationService] Toplu (Batch) çeviri başladı -> Toplam Metin: ${texts.length}, Parça Boyutu: ${chunkSize}`);

  const results = [];
  for (let i = 0; i < texts.length; i += chunkSize) {
    const chunk = texts.slice(i, i + chunkSize);
    console.log(`[TranslationService] Parça işleniyor: ${i + 1} - ${i + chunk.length} / ${texts.length}`);

    try {
      const chunkResults = await translateText({
        text: chunk,
        targetLanguage,
        sourceLanguage,
        projectId,
      });

      chunk.forEach((originalText, index) => {
        results.push({
          originalText,
          translatedText: chunkResults[index]?.translatedText || "",
          detectedLanguage: chunkResults[index]?.detectedLanguage || sourceLanguage || "unknown",
        });
      });
    } catch (chunkError) {
      console.error(`[TranslationService] Batch parça hatası (${i}-${i + chunk.length}):`, chunkError.message);
      // Hata durumunda kalan parçalar için boş karşılık dönüp süreci kesmiyoruz
      chunk.forEach((originalText) => {
        results.push({
          originalText,
          translatedText: "",
          error: chunkError.message,
        });
      });
    }
  }

  console.log(`[TranslationService] Toplu (Batch) çeviri tamamlandı -> Başarılı/Toplam: ${results.filter(r => !r.error).length}/${texts.length}`);
  return results;
}

/**
 * Verilen Metinlerin Dilini Otomatik Algılama
 *
 * @param {Object} params
 * @param {string|string[]} params.text - Dili algılanacak metin veya metinler
 * @param {string} [params.projectId] - GCP Proje ID
 * @returns {Promise<Array<{languageCode: string, confidence: number}>>}
 */
async function detectLanguage({ text, projectId = DEFAULT_PROJECT_ID, location = DEFAULT_LOCATION }) {
  if (!text) throw new Error("[TranslationService] Metin belirtilmelidir.");

  const contents = Array.isArray(text) ? text : [text];
  const parent = `projects/${projectId}/locations/${location}`;

  try {
    const [response] = await translationClient.detectLanguage({
      parent,
      content: contents[0],
      mimeType: "text/plain",
    });

    return (response.languages || []).map((l) => ({
      languageCode: l.languageCode,
      confidence: l.confidence,
    }));
  } catch (error) {
    console.error("[TranslationService] Dil algılama hatası:", error.message);
    throw new Error(`Dil algılanamadı: ${error.message}`);
  }
}

/**
 * Desteklenen Dillerin Listesini Getirme
 *
 * @param {Object} params
 * @param {string} [params.displayLanguageCode] - Dil isimlerinin gösterileceği dil (örn: 'tr')
 * @param {string} [params.projectId] - GCP Proje ID
 * @returns {Promise<Array<{languageCode: string, displayName: string}>>}
 */
async function getSupportedLanguages({ displayLanguageCode = "tr", projectId = DEFAULT_PROJECT_ID, location = DEFAULT_LOCATION }) {
  const parent = `projects/${projectId}/locations/${location}`;

  try {
    const [response] = await translationClient.getSupportedLanguages({
      parent,
      displayLanguageCode,
    });

    return (response.languages || []).map((l) => ({
      languageCode: l.languageCode,
      displayName: l.displayName,
      supportSource: l.supportSource,
      supportTarget: l.supportTarget,
    }));
  } catch (error) {
    console.error("[TranslationService] Desteklenen diller alınamadı:", error.message);
    throw new Error(`Desteklenen diller getirilemedi: ${error.message}`);
  }
}

module.exports = {
  translateText,
  translateBatch,
  detectLanguage,
  getSupportedLanguages,
  translationClient,
};
