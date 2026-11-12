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
    if (entry.name === 'node_modules' || entry.name.startsWith('.')) continue;
    
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
  console.log('🔍 Scanning local databases and audio files...');
  const { files } = await scanDirectory(DATA_DIR);
  
  const jsonFiles = files.filter(f => f.endsWith('.json') && !f.includes('manifest.json') && !f.includes('audioMap.json'));
  const mp3Files = files.filter(f => f.endsWith('.mp3'));
  
  console.log(`📊 Found ${jsonFiles.length} JSON database files.`);
  console.log(`🎵 Found ${mp3Files.length} MP3 audio files.`);

  // Build a global map of mp3 files normalized by name
  // key: normalized filename, value: array of absolute paths
  const globalMp3Map = new Map();
  mp3Files.forEach(mp3 => {
    const name = path.basename(mp3, '.mp3');
    const norm = normalizeStr(name);
    if (!globalMp3Map.has(norm)) {
      globalMp3Map.set(norm, []);
    }
    globalMp3Map.get(norm).push(mp3);
  });

  let totalUpdatedJson = 0;
  let totalUpdatedKeys = 0;

  for (const jsonPath of jsonFiles) {
    const rawData = await fs.readFile(jsonPath, 'utf8');
    let data;
    try {
      data = JSON.parse(rawData);
    } catch (e) {
      console.warn(`❌ Invalid JSON skipped: ${jsonPath}`);
      continue;
    }

    const jsonDir = path.dirname(jsonPath);
    
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
      const english = w.english || w.original_script || w.word || w.mission_phrase || w.mission_word || w.en;
      if (!english) continue;

      const normWord = normalizeStr(english);
      const normId = w.id ? normalizeStr(w.id.toString()) : null;

      // Determine candidate MP3 files
      let candidates = [];

      // 1. If audioUrl is present, get its filename and try to match it
      if (w.audioUrl) {
        const legacyFileName = path.basename(w.audioUrl, '.mp3');
        const normLegacy = normalizeStr(legacyFileName);
        if (globalMp3Map.has(normLegacy)) {
          candidates.push(...globalMp3Map.get(normLegacy));
        }
      }

      // 2. Add candidates matching by ID or word
      if (normId && globalMp3Map.has(normId)) {
        candidates.push(...globalMp3Map.get(normId));
      }
      if (globalMp3Map.has(normWord)) {
        candidates.push(...globalMp3Map.get(normWord));
      }

      // 3. Match by ID prefix / word suffixes globally
      for (const [normMp3, paths] of globalMp3Map.entries()) {
        if (normId && normMp3.startsWith(normId)) {
          candidates.push(...paths);
        }
        if (normMp3.endsWith(normWord) && normMp3.length < normWord.length + 15) {
          candidates.push(...paths);
        }
      }

      // Deduplicate candidates
      candidates = Array.from(new Set(candidates));

      if (candidates.length === 0) continue;

      // Find the best candidate:
      // Priority 1: Sibling/parent folder match
      // Priority 2: Global folder match
      let bestMp3 = null;
      
      // Try to find one in the same language folder
      bestMp3 = candidates.find(mp3 => {
        const mp3Dir = path.dirname(mp3);
        return mp3Dir.startsWith(jsonDir) || mp3Dir.startsWith(path.dirname(jsonDir));
      });

      // Fallback to any matching candidate if no folder-level match is found
      if (!bestMp3) {
        bestMp3 = candidates[0];
      }

      if (bestMp3) {
        const relativePath = bestMp3.substring(DATA_DIR.length).replace(/\\/g, '/');
        const newAudioUrl = `/data${relativePath}`;
        
        if (w.audioUrl !== newAudioUrl) {
          w.audioUrl = newAudioUrl;
          modified = true;
          totalUpdatedKeys++;
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
      totalUpdatedJson++;
      console.log(`✅ Relinked paths in: ${path.basename(jsonPath)}`);
    }
  }

  console.log(`\n🎉 Success! Relink complete.`);
  console.log(`Total database files updated: ${totalUpdatedJson}`);
  console.log(`Total audioUrl references corrected: ${totalUpdatedKeys}`);
}

main().catch(console.error);
