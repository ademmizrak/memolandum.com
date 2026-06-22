const fs = require('fs');
const path = require('path');

const dataDir = path.join(__dirname, 'data');

const singleNames = {
  'Greek': 'Greek (Yunanca)',
  'Kore': 'Korece',
  'Osm_Tr': 'Osmanlı Türkçesi',
  'portugal': 'Portekizce',
  'Tr_Port_Genel': 'Portekizce',
  'Russian': 'Rusça',
  'spanish': 'İspanyolca',
  'Tr_De_Genel': 'Almanca',
  'Tr_Fr_Genel': 'Fransızca',
  'Tr_Ita_Genel': 'İtalyanca'
};

const englishNames = {
  'Tr_Eng_Genel': 'Genel İngilizce',
  'Tr_Eng_Sınav_Ozel': 'Sınav Özel',
  'Tr_Eng_Temel_Cumleler': 'Temel Cümleler',
  'Tr_Eng_Yaz_Cumleleri': 'Yazma Cümleleri',
  'Tr_Eng_YDS_kelimeleri': 'YDS Kelimeleri',
  'Tr_Eng_YKS_Kelimeleri': 'YKS Kelimeleri'
};

function buildManifest() {
  const manifest = {
    singleLanguages: [],
    englishCategories: []
  };

  if (!fs.existsSync(dataDir)) {
    console.error("data directory not found!");
    return manifest;
  }

  const entries = fs.readdirSync(dataDir, { withFileTypes: true });

  for (const entry of entries) {
    if (!entry.isDirectory()) continue;
    
    const folderName = entry.name;
    const folderPath = path.join(dataDir, folderName);
    
    // Read all JSON files in the directory
    const files = fs.readdirSync(folderPath)
      .filter(f => f.endsWith('.json'))
      .map(f => {
        // Strip .json to use as level name or try to format nicely later
        return { filename: f, path: `${folderName}/${f}` };
      });
      
    // Sort files alphabetically
    files.sort((a, b) => a.filename.localeCompare(b.filename));

    if (folderName.startsWith('Tr_Eng_')) {
      manifest.englishCategories.push({
        id: folderName,
        label: englishNames[folderName] || folderName,
        files: files
      });
    } else if (singleNames[folderName] || (!folderName.startsWith('Tr_') && folderName !== 'summer')) {
      manifest.singleLanguages.push({
        id: folderName,
        label: singleNames[folderName] || folderName,
        files: files
      });
    }
  }

  // Sort logically if needed, but defaults are fine
  return manifest;
}

const manifest = buildManifest();
const outputStr = `window.DATA_MANIFEST = ${JSON.stringify(manifest, null, 2)};`;

const outputPath = path.join(__dirname, 'data_manifest.js');
fs.writeFileSync(outputPath, outputStr, 'utf8');
console.log('Successfully generated data_manifest.js');
