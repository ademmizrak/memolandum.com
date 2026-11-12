import fs from 'fs/promises';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const SENTENCES_JSON = path.resolve(__dirname, '../public/data/Turkish/content/en_tr/sentences_en_tr.json');
const WORDS_JSON = path.resolve(__dirname, '../public/data/Turkish/content/en_tr/words_en_tr.json');

const SENTENCE_AUDIO_DIR = path.resolve(__dirname, '../public/data/Tr_Eng_Temel_Cumleler/Audio');
const WORD_AUDIO_DIR = path.resolve(__dirname, '../public/data/Turkish/audio_en');

async function checkFileExists(filePath) {
  try {
    await fs.access(filePath);
    return true;
  } catch {
    return false;
  }
}

async function fixSentences() {
  console.log('🔄 Cümle ses yolları düzeltiliyor...');
  
  const rawData = await fs.readFile(SENTENCES_JSON, 'utf8');
  const sentences = JSON.parse(rawData);
  let updatedCount = 0;

  for (const item of sentences) {
    const paddedId = String(item.id).padStart(3, '0');
    // useLessonLoader.js safeWord mantığı
    const safeWord = item.en.toLowerCase().replace(/[^a-z0-9]+/g, '_').replace(/^_|_$/g, '');
    
    // Tr_Eng_Temel_Cumleler altındaki dosya adı formatı: sentence_001_hello.mp3
    const fileName = `sentence_${paddedId}_${safeWord}.mp3`;
    const localAudioPath = path.join(SENTENCE_AUDIO_DIR, fileName);

    const exists = await checkFileExists(localAudioPath);
    if (exists) {
      // Standart GCS / Local path
      const targetUrl = `/data/Tr_Eng_Temel_Cumleler/Audio/${fileName}`;
      if (item.audioUrl !== targetUrl) {
        item.audioUrl = targetUrl;
        updatedCount++;
      }
    } else {
      console.warn(`⚠️ Ses dosyası bulunamadı: ${fileName} (Cümle: "${item.en}")`);
    }
  }

  if (updatedCount > 0) {
    await fs.writeFile(SENTENCES_JSON, JSON.stringify(sentences, null, 2), 'utf8');
    console.log(`✅ Cümleler güncellendi. Toplam ${updatedCount} satır düzeltildi.`);
  } else {
    console.log('ℹ️ Cümle ses yolları zaten güncel.');
  }
}

async function fixWords() {
  console.log('🔄 Kelime ses yolları düzeltiliyor...');
  
  const rawData = await fs.readFile(WORDS_JSON, 'utf8');
  const words = JSON.parse(rawData);
  let updatedCount = 0;

  for (const item of words) {
    if (item.audioUrl) {
      // Eski /data/data/Tr_Eng_Genel/Audio/ veya /data/Tr_Eng_Genel/Audio/ yolunu temizle
      const fileName = path.basename(item.audioUrl);
      const localAudioPath = path.join(WORD_AUDIO_DIR, fileName);

      const exists = await checkFileExists(localAudioPath);
      if (exists) {
        const targetUrl = `/data/Turkish/audio_en/${fileName}`;
        if (item.audioUrl !== targetUrl) {
          item.audioUrl = targetUrl;
          updatedCount++;
        }
      } else {
        console.warn(`⚠️ Kelime ses dosyası bulunamadı: ${fileName} (Kelime: "${item.original_script}")`);
      }
    }
  }

  if (updatedCount > 0) {
    await fs.writeFile(WORDS_JSON, JSON.stringify(words, null, 2), 'utf8');
    console.log(`✅ Kelimeler güncellendi. Toplam ${updatedCount} satır düzeltildi.`);
  } else {
    console.log('ℹ️ Kelime ses yolları zaten güncel.');
  }
}

async function run() {
  try {
    await fixSentences();
    await fixWords();
    console.log('\n🎉 Başarılı! Veritabanı ses yolları tamamen düzeltildi.');
  } catch (err) {
    console.error('❌ Hata:', err.message);
  }
}

run();
