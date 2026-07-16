const fs = require('fs');
const path = require('path');

const BUCKET_BASE = "https://storage.googleapis.com/memolandum-33dc4.firebasestorage.app/data";

// Helper to convert ES module manifest to CommonJS for testing
function loadManifest() {
  const manifestPath = path.resolve(__dirname, '../src/config/manifest.js');
  const content = fs.readFileSync(manifestPath, 'utf8');
  const cjsContent = content.replace('export const gameManifest =', 'module.exports =');
  const tempPath = path.resolve(__dirname, 'temp_manifest.cjs');
  fs.writeFileSync(tempPath, cjsContent);
  const manifest = require(tempPath);
  fs.unlinkSync(tempPath); // Clean up
  return manifest;
}

// Emulate useLessonLoader's data unpacking & filtering logic
function processWords(data, levelCode) {
  let rawWords = [];
  if (Array.isArray(data)) {
    if (data.length > 0 && data[0].words && Array.isArray(data[0].words)) {
      if (levelCode) {
        const targetLvl = data.find(item => item.level === levelCode || item.level_tag === levelCode);
        rawWords = targetLvl ? targetLvl.words : [];
      } else {
        rawWords = data.flatMap(item => item.words || []);
      }
    } else {
      rawWords = data;
    }
  } else if (data && data.words) {
    rawWords = data.words;
  } else if (data && data.phrase_vault) {
    rawWords = data.phrase_vault;
  } else if (data && data.vocabulary_vault) {
    rawWords = data.vocabulary_vault;
  } else {
    rawWords = Object.values(data);
  }

  if (levelCode && !(Array.isArray(data) && data.length > 0 && data[0].words && Array.isArray(data[0].words))) {
    const targetCode = levelCode.toLowerCase();
    rawWords = rawWords.filter(w => {
      const tags = [
        w.level,
        w.level_tag,
        w.category,
        ...(Array.isArray(w.tags) ? w.tags : (w.tags ? [w.tags] : []))
      ].filter(Boolean).map(t => String(t).toLowerCase());
      
      return tags.includes(targetCode);
    });
  }

  return rawWords.map(w => {
    const english = w.english || w.original_script || w.word || w.mission_word || w.mission_phrase || w.en || w.osmanlica_latin || w.hanzi || w.kanji || w.character || w.character_script || w.root;
    const turkish = w.turkish || w.meaning || w.translation || w.target_translation || w.tr || w.guncel_turkce || 
                    w.es || w.fr || w.de || w.ar || w.pt || w.brpt || w.zh || w.cn || w.it || w.ru || w.ja || w.jap || w.ko || w.el || w.type;
    return { english, turkish };
  }).filter(w => w.english && w.turkish);
}

async function verifyAll() {
  console.log('🔍 Loading manifest...');
  const manifest = loadManifest();
  
  const allLevels = [];
  manifest.mainCategories.forEach(main => {
    main.subCategories.forEach(sub => {
      const levels = sub.levels || [];
      const sentenceLevels = sub.sentenceLevels || [];
      
      levels.forEach(lvl => {
        allLevels.push({ mainName: main.name, subName: sub.name, ...lvl });
      });
      sentenceLevels.forEach(lvl => {
        allLevels.push({ mainName: main.name, subName: sub.name, ...lvl });
      });
    });
  });

  console.log(`📋 Found ${allLevels.length} total levels across all languages. Starting verification...`);
  
  const failures = [];
  let checkedCount = 0;

  // We can fetch files sequentially or with limited concurrency to avoid GCS rate limits
  const CONCURRENCY = 15;
  const chunkArray = (arr, size) => {
    const chunks = [];
    for (let i = 0; i < arr.length; i += size) {
      chunks.push(arr.slice(i, i + size));
    }
    return chunks;
  };

  const levelChunks = chunkArray(allLevels, CONCURRENCY);

  for (const chunk of levelChunks) {
    await Promise.all(chunk.map(async (lvl) => {
      const fetchUrl = `${BUCKET_BASE}/${lvl.path}`;
      try {
        const response = await fetch(fetchUrl);
        if (!response.ok) {
          failures.push({ level: lvl, error: `HTTP ${response.status}: ${response.statusText}` });
          return;
        }
        
        const data = await response.json();
        const processed = processWords(data, lvl.levelCode);
        
        if (processed.length === 0) {
          failures.push({ level: lvl, error: `Level returned 0 parsed words (filtered by levelCode: ${lvl.levelCode})` });
        }
      } catch (err) {
        failures.push({ level: lvl, error: `Fetch/Parse exception: ${err.message}` });
      } finally {
        checkedCount++;
        if (checkedCount % 50 === 0 || checkedCount === allLevels.length) {
          console.log(`  Checked [${checkedCount}/${allLevels.length}] levels...`);
        }
      }
    }));
  }

  console.log('\n======================================');
  console.log('📊 VERIFICATION REPORT:');
  console.log(`Total Levels Checked: ${checkedCount}`);
  console.log(`Total Successful: ${checkedCount - failures.length}`);
  console.log(`Total Failures: ${failures.length}`);
  console.log('======================================\n');

  if (failures.length > 0) {
    console.error('❌ FAILURES DETECTED:');
    failures.forEach((f, index) => {
      console.error(`\n[${index + 1}] Language: ${f.level.subName} | Level: ${f.level.name}`);
      console.error(`    Path: ${f.level.path}`);
      console.error(`    LevelCode: ${f.level.levelCode}`);
      console.error(`    Error Details: ${f.error}`);
    });
    process.exit(1);
  } else {
    console.log('🎉 SUCCESS! All levels across all languages load correctly and contain valid word mappings!');
  }
}

verifyAll();
