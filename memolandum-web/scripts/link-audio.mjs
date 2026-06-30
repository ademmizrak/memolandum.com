import fs from 'fs/promises';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const DATA_DIR = path.resolve(__dirname, '../public/data');

function normalizeStr(str) {
  if (!str) return '';
  return str.toString().toLowerCase().replace(/[^a-z0-9]/g, '');
}

async function scanDirectory(dirPath) {
  const entries = await fs.readdir(dirPath, { withFileTypes: true });
  let files = [];
  let dirs = [];
  
  for (const entry of entries) {
    if (entry.name === 'node_modules') continue;
    
    const fullPath = path.join(dirPath, entry.name);
    if (entry.isDirectory()) {
      dirs.push(fullPath);
      const sub = await scanDirectory(fullPath);
      files.push(...sub.files);
      dirs.push(...sub.dirs);
    } else {
      files.push(fullPath);
    }
  }
  return { files, dirs };
}

async function main() {
  console.log('Veritabanı taranıyor...');
  const { files, dirs } = await scanDirectory(DATA_DIR);
  
  const jsonFiles = files.filter(f => f.endsWith('.json') && !f.includes('manifest.json') && !f.includes('audioMap.json'));
  const audioDirs = dirs.filter(d => path.basename(d).toLowerCase().includes('audio'));

  // Build a map of all mp3 files
  const mp3Files = files.filter(f => f.endsWith('.mp3'));
  
  console.log(`Bulunan JSON sayısı: ${jsonFiles.length}`);
  console.log(`Bulunan MP3 sayısı: ${mp3Files.length}`);

  let updatedCount = 0;

  for (const jsonPath of jsonFiles) {
    const rawData = await fs.readFile(jsonPath, 'utf8');
    let data;
    try {
      data = JSON.parse(rawData);
    } catch (e) {
      console.warn(`[HATA] Geçersiz JSON: ${jsonPath}`);
      continue;
    }

    const jsonDir = path.dirname(jsonPath);
    // Find audio dirs that are in the same dir or subdirs, or same parent dir
    const relatedMp3s = mp3Files.filter(mp3 => {
       const mp3Dir = path.dirname(mp3);
       // if mp3 is inside a folder that is a sibling or child of jsonDir
       return mp3Dir.startsWith(jsonDir) || mp3Dir.startsWith(path.dirname(jsonDir));
    });

    let wordsArray = null;
    let isRootArray = false;
    let targetKey = null;

    if (Array.isArray(data)) {
      wordsArray = data;
      isRootArray = true;
    } else if (data.words && Array.isArray(data.words)) {
      wordsArray = data.words;
      targetKey = 'words';
    } else if (data.phrase_vault && Array.isArray(data.phrase_vault)) {
      wordsArray = data.phrase_vault;
      targetKey = 'phrase_vault';
    } else if (data.vocabulary_vault && Array.isArray(data.vocabulary_vault)) {
      wordsArray = data.vocabulary_vault;
      targetKey = 'vocabulary_vault';
    } else {
      continue;
    }

    let modified = false;

    for (const w of wordsArray) {
      const english = w.english || w.original_script || w.word || w.mission_phrase || w.mission_word;
      if (!english) continue;

      const normWord = normalizeStr(english);
      const normId = w.id ? normalizeStr(w.id.toString()) : null;

      // Find best mp3
      let bestMp3 = null;
      for (const mp3 of relatedMp3s) {
        const mp3Name = path.basename(mp3, '.mp3');
        const normMp3 = normalizeStr(mp3Name);

        // match by ID (exact prefix)
        if (normId && normMp3.startsWith(normId)) {
          bestMp3 = mp3;
          break;
        }

        // match by word exact
        if (normMp3 === normWord) {
          bestMp3 = mp3;
          break;
        }

        // match by word suffix (e.g. 001_word.mp3)
        if (normMp3.endsWith(normWord) && normMp3.length < normWord.length + 15) {
          bestMp3 = mp3;
        }
      }

      if (bestMp3) {
        // Convert abs path to /data/...
        const relativePath = bestMp3.substring(DATA_DIR.length).replace(/\\/g, '/');
        const newAudioUrl = `/data${relativePath}`;
        if (w.audioUrl !== newAudioUrl) {
          w.audioUrl = newAudioUrl;
          modified = true;
        }
      }
    }

    if (modified) {
      if (isRootArray) {
        await fs.writeFile(jsonPath, JSON.stringify(wordsArray, null, 2), 'utf8');
      } else {
        data[targetKey] = wordsArray;
        await fs.writeFile(jsonPath, JSON.stringify(data, null, 2), 'utf8');
      }
      updatedCount++;
    }
  }

  console.log(`Tamamlandı. Toplam güncellenen JSON dosyası: ${updatedCount}`);
}

main().catch(console.error);