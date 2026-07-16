import fs from 'fs/promises';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const DATA_DIR = path.resolve(__dirname, '../public/data');
const OUT_FILE = path.resolve(__dirname, '../src/config/manifest.js');
const FUNCTIONS_OUT_FILE = path.resolve(__dirname, '../functions/data_manifest.json');

const ENGLISH_LEGACY_CATEGORIES = {
  'Tr_Eng_Sinav_Ozel': 'Sınav Özel',
  'Tr_Eng_Temel_Cumleler': 'Temel Cümleler',
  'Tr_Eng_Yaz_Cumleleri': 'Yaz Cümleleri',
  'Tr_Eng_YDS_kelimeleri': 'YDS Kelimeleri',
  'Tr_Eng_YKS_Kelimeleri': 'YKS Kelimeleri'
};

const LANG_CODE_NAMES = {
  'de': 'Almanca',
  'ar': 'Arapça',
  'zh': 'Çince',
  'cn': 'Çince',
  'fr': 'Fransızca',
  'el': 'Yunanca',
  'it': 'İtalyanca',
  'ja': 'Japonca',
  'jap': 'Japonca',
  'ko': 'Korece',
  'kr': 'Korece',
  'osm': 'Osmanlıca',
  'pt': 'Portekizce',
  'brpt': 'Portekizce',
  'ru': 'Rusça',
  'es': 'İspanyolca',
  'en': 'İngilizce',
  'tr': 'Türkçe'
};

const CEFR_MAPPING = {
  'A1': 'Beginner / Başlangıç',
  'A2': 'Elementary / Temel',
  'B1': 'Intermediate / Orta',
  'B2': 'Upper-Intermediate / Orta Üstü',
  'C1': 'Advanced / İleri',
  'C2': 'Proficient / Yetkin'
};

const TAG_DISPLAY_NAMES = {
  'daily': '🏠 Günlük Yaşam & Ev',
  'social': '💬 Sosyal Etkileşim & İletişim',
  'travel': '✈️ Seyahat & Keşif',
  'business': '💼 İş & Profesyonel Yaşam',
  'learning': '🧠 Öğrenme & Gelişim',
  'health': '🧠 Sağlık & Yaşam',
  'Hajj': '🕌 Hac & İbadet',
  'Growth': '🧠 Öğrenme & Gelişim',
  'Daily': '🏠 Günlük Yaşam & Ev',
  'Social': '💬 Sosyal Etkileşim & İletişim',
  'Travel': '✈️ Seyahat & Keşif',
  'Business': '💼 İş & Profesyonel Yaşam',
  'Fandom_Slang': '🎵 K-Pop & Fandom',
  'Alphabet': '🔤 Alfabe / Harfler'
};

function formatLevelName(code) {
  const cleanCode = code.replace(/_Vocabulary/i, '').replace(/_Sentence/i, '').trim();
  const upperCode = cleanCode.toUpperCase();
  if (CEFR_MAPPING[upperCode]) {
    return CEFR_MAPPING[upperCode];
  }
  const lowerCode = cleanCode.toLowerCase();
  // Check lowercase keys
  for (const [key, val] of Object.entries(TAG_DISPLAY_NAMES)) {
    if (key.toLowerCase() === lowerCode) {
      return val;
    }
  }
  // Capitalize first letter of code if no display name found
  return cleanCode.charAt(0).toUpperCase() + cleanCode.slice(1);
}

// Rekürsif olarak eski JSON dosyalarını bulan fonksiyon
async function scanLegacyDirectory(dirPath, basePath = '') {
  const entries = await fs.readdir(dirPath, { withFileTypes: true });
  let files = [];
  
  for (const entry of entries) {
    if (entry.name === 'node_modules') continue;
    if (entry.isDirectory() && entry.name.toLowerCase().includes('audio')) continue;
    
    const fullPath = path.join(dirPath, entry.name);
    if (entry.isDirectory()) {
      const subpath = basePath ? `${basePath}/${entry.name}` : entry.name;
      const subFiles = await scanLegacyDirectory(fullPath, subpath);
      files.push(...subFiles);
    } else if (entry.name.endsWith('.json')) {
      files.push({
        name: entry.name,
        subpath: basePath,
        fullPath: fullPath
      });
    }
  }
  return files;
}

// Güvenli URL dostu slug oluşturma
function generateSlug(mainCategory, subCategoryName, levelName) {
  const text = `${mainCategory}-${subCategoryName}-${levelName}`;
  return text
    .toLowerCase()
    .replace(/ç/g, 'c')
    .replace(/ğ/g, 'g')
    .replace(/ı/g, 'i')
    .replace(/ö/g, 'o')
    .replace(/ş/g, 's')
    .replace(/ü/g, 'u')
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-|-$/g, '');
}

// Dil çifti klasöründen subCategory ismini çözme
// e.g. "de_tr" -> "Almanca - Türkçe"
function resolveSubCategoryName(langPairCode) {
  const parts = langPairCode.split('_');
  if (parts.length >= 2) {
    const srcCode = parts[0].toLowerCase();
    const dstCode = parts[parts.length - 1].toLowerCase();
    const srcName = LANG_CODE_NAMES[srcCode] || srcCode.toUpperCase();
    const dstName = LANG_CODE_NAMES[dstCode] || dstCode.toUpperCase();
    return `${srcName} - ${dstName}`;
  }
  return langPairCode;
}

async function extractLevelsFromUnifiedFile(filePath) {
  try {
    const data = JSON.parse(await fs.readFile(filePath, 'utf-8'));
    const levels = new Set();
    
    if (Array.isArray(data)) {
      if (data.length > 0 && data[0].words && Array.isArray(data[0].words)) {
        // Çince gibi nested yapı
        data.forEach(item => {
          if (item.level) levels.add(item.level);
          if (item.level_tag) levels.add(item.level_tag);
        });
      } else {
        // Düz yapı
        data.forEach(item => {
          if (item.level) levels.add(item.level);
          if (item.level_tag) levels.add(item.level_tag);
          if (item.category) levels.add(item.category);
          if (item.tags) {
            if (Array.isArray(item.tags)) {
              item.tags.forEach(t => levels.add(t));
            } else {
              levels.add(item.tags);
            }
          }
        });
      }
    }
    
    // Temizlik
    return Array.from(levels).filter(l => l && l !== 'DE' && l !== 'ES' && l !== 'Core');
  } catch (e) {
    console.error(`Dosya okunurken hata: ${filePath}`, e.message);
    return [];
  }
}

async function generateManifest() {
  console.log('Veritabanı taranıyor...');
  
  const manifest = {
    mainCategories: [
      {
        id: "en-tr",
        name: "İngilizce-Türkçe",
        subCategories: []
      },
      {
        id: "other-langs",
        name: "Diğer Diller",
        subCategories: []
      }
    ],
    thresholds: {
      maxHealth: 100,
      healAmount: 5,
      damageAmount: 15,
      levelUpScore: 1000
    }
  };

  // 1. Genel İngilizce (Yeni Standardize Turkish/content/en_tr)
  const turkishFolderPath = path.join(DATA_DIR, 'Turkish');
  if (await fs.access(turkishFolderPath).then(() => true).catch(() => false)) {
    const enTrPath = path.join(turkishFolderPath, 'content', 'en_tr');
    try {
      const wordsFilePath = path.join(enTrPath, 'words_en_tr.json');
      const sentencesFilePath = path.join(enTrPath, 'sentences_en_tr.json');
      
      const wordsLevels = await extractLevelsFromUnifiedFile(wordsFilePath);
      const sentencesLevels = await extractLevelsFromUnifiedFile(sentencesFilePath);
      
      const levels = wordsLevels.map(lvl => ({
        id: `en-tr_eng_genel-words-${lvl.toLowerCase()}`,
        name: `${formatLevelName(lvl)} Kelimeleri`,
        path: `Turkish/content/en_tr/words_en_tr.json`,
        levelCode: lvl,
        type: 'words',
        slug: generateSlug('ingilizce', 'genel', `words-${lvl}`)
      }));
      
      const sentenceLevels = sentencesLevels.map(lvl => ({
        id: `en-tr_eng_genel-sentences-${lvl.toLowerCase()}`,
        name: `${formatLevelName(lvl)} Cümleleri`,
        path: `Turkish/content/en_tr/sentences_en_tr.json`,
        levelCode: lvl,
        type: 'sentences',
        slug: generateSlug('ingilizce', 'genel', `sentences-${lvl}`)
      }));

      manifest.mainCategories[0].subCategories.push({
        id: 'en-tr_eng_genel',
        name: 'Genel İngilizce',
        folder: 'Turkish',
        levels,
        sentenceLevels
      });
    } catch (e) {
      console.warn('[UYARI] Genel İngilizce standardize dosyaları okunamadı:', e.message);
    }
  }

  // 2. Diğer İngilizce Kategorilerini (Legacy) Tara
  for (const [folderName, displayName] of Object.entries(ENGLISH_LEGACY_CATEGORIES)) {
    const folderPath = path.join(DATA_DIR, folderName);
    try {
      const jsonFiles = await scanLegacyDirectory(folderPath);
      if (jsonFiles.length > 0) {
        const levels = [];
        const sentenceLevels = [];
        
        jsonFiles.forEach((file, index) => {
          const relativePath = file.subpath ? `${folderName}/${file.subpath}/${file.name}` : `${folderName}/${file.name}`;
          const levelId = `en-${folderName.toLowerCase()}-${index}`;
          const cleanName = path.basename(file.name, '.json').replace(/_/g, ' ');
          
          const levelObj = {
            id: levelId,
            name: cleanName,
            path: relativePath,
            slug: generateSlug('ingilizce', displayName, path.basename(file.name, '.json'))
          };

          if (file.name.toLowerCase().includes('sentence') || folderName.includes('Temel_Cumleler')) {
            sentenceLevels.push(levelObj);
          } else {
            levels.push(levelObj);
          }
        });
        
        manifest.mainCategories[0].subCategories.push({
          id: `en-${folderName.toLowerCase()}`,
          name: displayName,
          folder: folderName,
          levels,
          sentenceLevels
        });
      }
    } catch (e) {
      console.warn(`[UYARI] ${folderName} klasörü okunamadı:`, e.message);
    }
  }

  // 3. Diğer Dilleri Tara
  const dirs = await fs.readdir(DATA_DIR, { withFileTypes: true });
  for (const dir of dirs) {
    if (!dir.isDirectory()) continue;
    // İngilizce ve Turkish klasörlerini atla (çünkü Turkish'i en-tr olarak ekledik)
    if (dir.name.startsWith('Tr_Eng_') || dir.name === 'Turkish') continue;
    
    const folderPath = path.join(DATA_DIR, dir.name);
    const contentPath = path.join(folderPath, 'content');
    
    // Content klasörü yoksa (e.g. Osm_Tr) doğrudan dosya bazlı oku
    const hasContent = await fs.access(contentPath).then(() => true).catch(() => false);
    
    if (!hasContent) {
      // Legacy veya Osm_Tr
      try {
        const jsonFiles = await scanLegacyDirectory(folderPath);
        if (jsonFiles.length > 0) {
          const levels = jsonFiles.map((file, index) => {
            const relativePath = `${dir.name}/${file.name}`;
            return {
              id: `other-${dir.name.toLowerCase()}-${index}`,
              name: path.basename(file.name, '.json').replace(/_/g, ' '),
              path: relativePath,
              slug: generateSlug('diger', dir.name, path.basename(file.name, '.json'))
            };
          });
          
          manifest.mainCategories[1].subCategories.push({
            id: `other-${dir.name.toLowerCase()}`,
            name: LANG_CODE_NAMES[dir.name.toLowerCase()] || dir.name,
            folder: dir.name,
            levels
          });
        }
      } catch (e) {
        console.warn(`[UYARI] ${dir.name} okunamadı:`, e.message);
      }
      continue;
    }
    
    // Content klasöründeki dil çiftlerini oku (e.g. de_tr, de_en)
    const langPairs = await fs.readdir(contentPath, { withFileTypes: true });
    for (const pair of langPairs) {
      if (!pair.isDirectory()) continue;
      
      const pairPath = path.join(contentPath, pair.name);
      const subCatId = `other-${dir.name.toLowerCase()}-${pair.name.toLowerCase()}`;
      const subCatDisplayName = resolveSubCategoryName(pair.name);
      
      const levels = [];
      const sentenceLevels = [];
      
      const files = await fs.readdir(pairPath);
      for (const file of files) {
        if (!file.endsWith('.json')) continue;
        
        const relativePath = `${dir.name}/content/${pair.name}/${file}`;
        const filePath = path.join(pairPath, file);
        
        if (file.startsWith('words_')) {
          const extracted = await extractLevelsFromUnifiedFile(filePath);
          extracted.forEach(lvl => {
            levels.push({
              id: `${subCatId}-words-${lvl.toLowerCase()}`,
              name: `${formatLevelName(lvl)} Kelimeleri`,
              path: relativePath,
              levelCode: lvl,
              type: 'words',
              slug: generateSlug('diger', subCatDisplayName, `words-${lvl}`)
            });
          });
        } else if (file.startsWith('sentences_')) {
          const extracted = await extractLevelsFromUnifiedFile(filePath);
          extracted.forEach(lvl => {
            sentenceLevels.push({
              id: `${subCatId}-sentences-${lvl.toLowerCase()}`,
              name: `${formatLevelName(lvl)} Cümleleri`,
              path: relativePath,
              levelCode: lvl,
              type: 'sentences',
              slug: generateSlug('diger', subCatDisplayName, `sentences-${lvl}`)
            });
          });
        } else if (file.startsWith('alphabet_')) {
          levels.push({
            id: `${subCatId}-alphabet`,
            name: 'Alfabe / Harfler',
            path: relativePath,
            type: 'alphabet',
            slug: generateSlug('diger', subCatDisplayName, 'alphabet')
          });
        }
      }
      
      if (levels.length > 0 || sentenceLevels.length > 0) {
        manifest.mainCategories[1].subCategories.push({
          id: subCatId,
          name: subCatDisplayName,
          folder: dir.name,
          levels,
          sentenceLevels
        });
      }
    }
  }

  // Sadece içi dolu olan ana kategorileri tut
  manifest.mainCategories = manifest.mainCategories.filter(main => main.subCategories.length > 0);

  // 4. manifest.js dosyasını yaz
  const fileContent = `// BU DOSYA OTOMATIK OLARAK OLUŞTURULMUŞTUR. MANUEL DEĞİŞTİRMEYİNİZ.
// Veritabanını güncellemek için 'node scripts/generate-manifest.mjs' komutunu çalıştırın.

export const gameManifest = ${JSON.stringify(manifest, null, 2)};
`;

  await fs.writeFile(OUT_FILE, fileContent, 'utf-8');
  console.log('✅ manifest.js başarıyla oluşturuldu!');

  // 5. Cloud Functions için data_manifest.json formatında kaydet
  // SEO SSR sunucusu bu manifest dosyasını okuyarak statik SEO sayfaları üretir.
  const functionsManifest = {
    singleLanguages: manifest.mainCategories[1].subCategories.map(sc => ({
      name: sc.name,
      folder: sc.folder,
      files: [...(sc.levels || []), ...(sc.sentenceLevels || [])].map(l => ({
        path: l.path,
        label: sc.name + ' - ' + l.name,
        directionLabel: sc.name
      }))
    })),
    englishCategories: manifest.mainCategories[0].subCategories.map(sc => ({
      name: sc.name,
      folder: sc.folder,
      files: [...(sc.levels || []), ...(sc.sentenceLevels || [])].map(l => ({
        path: l.path,
        label: l.name,
        directionLabel: 'İngilizce - Türkçe'
      }))
    }))
  };

  await fs.writeFile(FUNCTIONS_OUT_FILE, JSON.stringify(functionsManifest, null, 2), 'utf-8');
  console.log('✅ functions/data_manifest.json başarıyla oluşturuldu!');
}

generateManifest().catch(console.error);
