import fs from 'fs/promises';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const DATA_DIR = path.resolve(__dirname, '../public/data');
const OUT_FILE = path.resolve(__dirname, '../src/config/manifest.js');

const ENGLISH_CATEGORIES = {
  'Tr_Eng_Genel': 'Genel İngilizce',
  'Tr_Eng_Sınav_Ozel': 'Sınav Özel',
  'Tr_Eng_Temel_Cumleler': 'Temel Cümleler',
  'Tr_Eng_Yaz_Cumleleri': 'Yaz Cümleleri',
  'Tr_Eng_YDS_kelimeleri': 'YDS Kelimeleri',
  'Tr_Eng_YKS_Kelimeleri': 'YKS Kelimeleri'
};

const OTHER_LANGUAGES = {
  'Almanca': 'Almanca',
  'Greek': 'Yunanca',
  'Italyanca': 'İtalyanca',
  'Kore': 'Korece',
  'Osm_Tr': 'Osmanlıca',
  'portugal': 'Portekizce - İngilizce',
  'Russian': 'Rusça',
  'Spanish': 'İspanyolca',
  'Tr_Fr_Genel': 'Fransızca',
  'Tr_Port_Genel': 'Portekizce'
};

const CEFR_MAPPING = {
  'A1': 'Beginner / Başlangıç',
  'A2': 'Elementary / Temel',
  'B1': 'Intermediate / Orta',
  'B2': 'Upper-Intermediate / Orta Üstü',
  'C1': 'Advanced / İleri',
  'C2': 'Proficient / Yetkin'
};

// Yolu temizleyen ve okunabilir isim üreten yardımcı fonksiyon
function formatName(filename, subpath = '') {
  let name = path.basename(filename, '.json');
  
  // Alt çizgi ve tireleri boşluğa çevir
  name = name.replace(/_/g, ' ').replace(/-/g, ' ');
  
  // CEFR kodlarını (A1, A2 vb.) açıklayıcı isimlerle değiştir (Sadece tam kelime olarak eşleşenleri)
  for (const [code, desc] of Object.entries(CEFR_MAPPING)) {
    const regex = new RegExp(`\\b${code}\\b`, 'g');
    name = name.replace(regex, desc);
  }

  if (subpath) {
    name = `${subpath.replace(/_/g, ' ')} - ${name}`;
  }
  return name;
}

// Rekürsif olarak JSON dosyalarını bulan fonksiyon
async function scanDirectory(dirPath, basePath = '') {
  const entries = await fs.readdir(dirPath, { withFileTypes: true });
  let files = [];
  
  for (const entry of entries) {
    if (entry.name === 'node_modules') continue;
    
    const fullPath = path.join(dirPath, entry.name);
    if (entry.isDirectory()) {
      const subpath = basePath ? `${basePath}/${entry.name}` : entry.name;
      const subFiles = await scanDirectory(fullPath, subpath);
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
function generateSlug(mainCategory, subCategoryName, fileName) {
  const text = `${mainCategory}-${subCategoryName}-${fileName}`;
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

  // İngilizce Kategorilerini Tara
  for (const [folderName, displayName] of Object.entries(ENGLISH_CATEGORIES)) {
    const folderPath = path.join(DATA_DIR, folderName);
    try {
      const jsonFiles = await scanDirectory(folderPath);
      if (jsonFiles.length > 0) {
        const levels = jsonFiles.map((file, index) => {
          const relativePath = file.subpath ? `${folderName}/${file.subpath}/${file.name}` : `${folderName}/${file.name}`;
          const levelId = `en-${folderName.toLowerCase()}-${index}`;
          const formattedName = formatName(file.name, file.subpath);
          return {
            id: levelId,
            name: formattedName,
            path: relativePath,
            slug: generateSlug('ingilizce', displayName, path.basename(file.name, '.json'))
          };
        });
        
        manifest.mainCategories[0].subCategories.push({
          id: `en-${folderName.toLowerCase()}`,
          name: displayName,
          folder: folderName,
          levels: levels
        });
      }
    } catch (e) {
      console.warn(`[UYARI] ${folderName} klasörü bulunamadı veya okunamadı:`, e.message);
    }
  }

  // Diğer Dilleri Tara
  for (const [folderName, displayName] of Object.entries(OTHER_LANGUAGES)) {
    const folderPath = path.join(DATA_DIR, folderName);
    try {
      const jsonFiles = await scanDirectory(folderPath);
      if (jsonFiles.length > 0) {
        const levels = jsonFiles.map((file, index) => {
          const relativePath = file.subpath ? `${folderName}/${file.subpath}/${file.name}` : `${folderName}/${file.name}`;
          const levelId = `other-${folderName.toLowerCase()}-${index}`;
          const formattedName = formatName(file.name, file.subpath);
          return {
            id: levelId,
            name: formattedName,
            path: relativePath,
            slug: generateSlug('diger', displayName, path.basename(file.name, '.json'))
          };
        });
        
        manifest.mainCategories[1].subCategories.push({
          id: `other-${folderName.toLowerCase()}`,
          name: displayName,
          folder: folderName,
          levels: levels
        });
      }
    } catch (e) {
      console.warn(`[UYARI] ${folderName} klasörü bulunamadı veya okunamadı:`, e.message);
    }
  }

  // "ingilizce-genel-a1-words" gibi eski linkleri korumak için manuel geçersiz kılma:
  // Eğer "Beginner / Başlangıç 001 100" gibi bir isim bulunursa, slug'ı doğrudan ayarla.
  const genelKategori = manifest.mainCategories[0]?.subCategories.find(sc => sc.id === 'en-tr_eng_genel');
  if (genelKategori) {
    const a1Level = genelKategori.levels.find(l => l.name.includes("Beginner / Başlangıç 001 100"));
    if (a1Level) a1Level.slug = "ingilizce-genel-a1-words";
  }

  // Sadece içi dolu olan ana kategorileri tut
  manifest.mainCategories = manifest.mainCategories.filter(main => main.subCategories.length > 0);

  const fileContent = `// BU DOSYA OTOMATIK OLARAK OLUŞTURULMUŞTUR. MANUEL DEĞİŞTİRMEYİNİZ.
// Veritabanını güncellemek için 'node scripts/generate-manifest.mjs' komutunu çalıştırın.

export const gameManifest = ${JSON.stringify(manifest, null, 2)};
`;

  await fs.writeFile(OUT_FILE, fileContent, 'utf-8');
  console.log('✅ manifest.js başarıyla oluşturuldu!');
}

generateManifest().catch(console.error);
