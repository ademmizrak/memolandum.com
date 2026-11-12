import fs from 'fs/promises';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const KPOP_TR_JSON = path.resolve(__dirname, '../public/data/Korean/content/ko_tr/words_kpop_ko_tr.json');
const KPOP_EN_JSON = path.resolve(__dirname, '../public/data/Korean/content/ko_en/words_kpop_ko_en.json');

async function processFile(filePath) {
  console.log(`🔄 Processing file: ${path.basename(filePath)}`);
  const rawData = await fs.readFile(filePath, 'utf8');
  const words = JSON.parse(rawData);

  words.forEach(w => {
    // 1. Extract the number from ID, e.g., kor_fan_055 -> 55
    const idParts = w.id.split('_');
    const numStr = idParts[idParts.length - 1];
    const num = parseInt(numStr, 10);

    // 2. Set the correct level_tag for group splitting
    if (num >= 1 && num <= 100) {
      w.level_tag = 'Kpop_Group1';
    } else if (num >= 101 && num <= 200) {
      w.level_tag = 'Kpop_Group2';
    } else if (num >= 201 && num <= 300) {
      w.level_tag = 'Kpop_Group3';
    }

    // 3. Fix the audioUrl from German placeholder to Korean GCS path
    if (w.audio && w.audio.default) {
      const fileName = path.basename(w.audio.default);
      w.audioUrl = `/data/Korean/audio/K_pop_ko/${fileName}`;
    }
  });

  await fs.writeFile(filePath, JSON.stringify(words, null, 2), 'utf8');
  console.log(`✅ Saved processed file.`);
}

async function run() {
  try {
    await processFile(KPOP_TR_JSON);
    await processFile(KPOP_EN_JSON);
    console.log('\n🎉 K-Pop databases successfully updated and split into 3 groups!');
  } catch (err) {
    console.error('❌ Hata:', err.message);
  }
}

run();
