import fs from 'fs/promises';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const DATA_DIR = path.resolve(__dirname, '../public/data');

// Recursive directory scanner
async function scanDirectory(dirPath) {
  const entries = await fs.readdir(dirPath, { withFileTypes: true });
  let files = [];
  
  for (const entry of entries) {
    if (entry.name === 'node_modules' || entry.name.startsWith('.')) continue;
    const fullPath = path.join(dirPath, entry.name);
    if (entry.isDirectory()) {
      const sub = await scanDirectory(fullPath);
      files.push(...sub);
    } else {
      files.push(fullPath);
    }
  }
  return files;
}

async function run() {
  console.log('🔍 Scanning databases for German placeholder audios...');
  const files = await scanDirectory(DATA_DIR);
  const jsonFiles = files.filter(f => f.endsWith('.json') && !f.includes('manifest.json') && !f.includes('audioMap.json'));
  
  let totalFixedCount = 0;
  let totalFilesUpdated = 0;

  for (const jsonPath of jsonFiles) {
    // Determine the language folder name (e.g. Greek, Korean, Italy)
    const relative = path.relative(DATA_DIR, jsonPath);
    const firstDir = relative.split(path.sep)[0];
    
    // Skip German (Almanca) and Turkish (Turkish, Tr_Eng_...)
    if (firstDir === 'Almanca' || firstDir === 'Turkish' || firstDir.startsWith('Tr_Eng_')) {
      continue;
    }

    const rawData = await fs.readFile(jsonPath, 'utf8');
    let data;
    try {
      data = JSON.parse(rawData);
    } catch {
      continue;
    }

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
      // Check if audioUrl is a German placeholder
      const hasPlaceholder = w.audioUrl && (w.audioUrl.includes('Almanca') || w.audioUrl.includes('de_biz_prof_001.mp3'));
      
      if (hasPlaceholder && w.audio) {
        // Resolve the actual audio path
        let audioPath = '';
        if (typeof w.audio === 'string') {
          audioPath = w.audio;
        } else {
          audioPath = w.audio.default || w.audio.male || w.audio.female || '';
        }

        if (audioPath) {
          // Normalize slash at start
          const cleanAudioPath = audioPath.startsWith('/') ? audioPath : `/${audioPath}`;
          const correctUrl = `/data/${firstDir}${cleanAudioPath}`;
          
          if (w.audioUrl !== correctUrl) {
            w.audioUrl = correctUrl;
            modified = true;
            totalFixedCount++;
          }
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
      totalFilesUpdated++;
      console.log(`✅ Fixed placeholder URLs in: ${relative}`);
    }
  }

  console.log(`\n🎉 Completed!`);
  console.log(`Total database files corrected: ${totalFilesUpdated}`);
  console.log(`Total audioUrl placeholders fixed: ${totalFixedCount}`);
}

run().catch(console.error);
