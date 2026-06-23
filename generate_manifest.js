const fs = require('fs');
const path = require('path');

const dataDir = path.join(__dirname, 'data');

const singleNames = {
  'Greek': 'Yunanca',
  'Kore': 'Korece',
  'Osm_Tr': 'Osmanlıca',
  'portugal': 'Portekizce',
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
  'Tr_Eng_Yaz_Cumleleri': 'Yaz Kelimeleri',
  'Tr_Eng_YDS_kelimeleri': 'YDS Kelimeleri',
  'Tr_Eng_YKS_Kelimeleri': 'YKS Kelimeleri'
};

function walk(dir, baseDir) {
  let results = [];
  if (!fs.existsSync(dir)) return results;
  const list = fs.readdirSync(dir);
  list.forEach(file => {
    const fullPath = path.join(dir, file);
    const stat = fs.statSync(fullPath);
    if (stat && stat.isDirectory()) {
      results = results.concat(walk(fullPath, baseDir));
    } else if (file.endsWith('.json')) {
      const relPath = path.relative(baseDir, fullPath).replace(/\\/g, '/');
      results.push(relPath);
    }
  });
  return results;
}

function formatLabel(relPath) {
  const filename = path.basename(relPath, '.json');
  const name = filename;
  
  let levelMatch = name.match(/(A1|A2|B1|B2|C1|C2)/i);
  let level = levelMatch ? levelMatch[0].toUpperCase() : '';
  
  let rangeMatch = name.match(/(\d{1,3})[_-](\d{2,4})/);
  let range = rangeMatch ? rangeMatch[1] + '-' + rangeMatch[2] : '';

  let singleNumberMatch = name.match(/_(\d{3,4})$/);
  if (!singleNumberMatch) singleNumberMatch = name.match(/_(\d{3,4})\s*$/);

  if (relPath.includes('Tr_Eng_Sınav_Ozel')) {
    const dict = {
      'abstract_adjectives': 'Soyut Sıfatlar',
      'academic_verbs': 'Akademik Fiiller',
      'conjunctions': 'Bağlaçlar',
      'fillers': 'Dolgu Kelimeleri',
      'phrasal_verbs': 'Phrasal Verbs',
      'prepositions': 'Edatlar (Prepositions)'
    };
    if (dict[name]) return dict[name];
  }
  
  if (relPath.includes('YDS_kelimeleri') || relPath.includes('YKS_Kelimeleri')) {
    let groupMatch = name.match(/Grup\s*(\d+)/i);
    if (!groupMatch) groupMatch = name.match(/Group\s*(\d+)/i);
    if (groupMatch) return 'Grup ' + groupMatch[1];
  }
  
  if (relPath.includes('Yaz_Cumleleri') || name.includes('summer')) {
     let t = name.replace(/_/g, ' ').replace('summer', 'Yaz').replace('sentences', 'Cümleleri').replace('phrases', 'İfadeleri').replace('vacation', 'Tatili');
     return t.split(' ').map(w => w.charAt(0).toUpperCase() + w.slice(1).toLowerCase()).join(' ');
  }

  if (name.includes('Alphabet') || name.includes('Alfabe')) {
    return 'Alfabe (Alphabet)';
  }

  if (level && range) return level + ' Seviyesi (' + range + ')';
  if (level) {
    if (name.includes('sentences')) return level + ' Seviyesi (Cümleler)';
    return level + ' Seviyesi';
  }
  if (range) {
    if (relPath.includes('Temel_Cumleler') || name.includes('sentences')) return 'Cümleler (' + range + ')';
    return 'Kelime Grubu (' + range + ')';
  }
  if (singleNumberMatch) {
    return 'Kelime Grubu (İlk ' + singleNumberMatch[1] + ')';
  }
  
  return name.replace(/_/g, ' ').replace(/\b\w/g, c => c.toUpperCase());
}

function getDirectionInfo(relPath, filename) {
  const name = filename.toLowerCase();
  const pathLower = relPath.toLowerCase();

  // Spanish
  if (pathLower.includes('spanish')) {
    if (pathLower.includes('es_en_es') || name.includes('eng')) {
      return { direction: 'EN_ES', label: '🇬🇧 English \u2794 🇪🇸 Spanish', labelTR: '🇬🇧 İngilizce \u2794 🇪🇸 İspanyolca' };
    }
    if (pathLower.includes('es_tr_es') || name.includes('es_tr') || name.includes('tr_es')) {
      return { direction: 'TR_ES', label: '🇹🇷 Turkish \u2794 🇪🇸 Spanish', labelTR: '🇹🇷 Türkçe \u2794 🇪🇸 İspanyolca' };
    }
    if (pathLower.includes('es_ita_es') || name.includes('es_ita') || name.includes('ita_es')) {
      return { direction: 'IT_ES', label: '🇮🇹 Italian \u2794 🇪🇸 Spanish', labelTR: '🇮🇹 İtalyanca \u2794 🇪🇸 İspanyolca' };
    }
  }

  // Portuguese
  if (pathLower.includes('portugal') || pathLower.includes('tr_port_genel')) {
    if (name.includes('eng_pt_br') || name.includes('eng_pt')) {
      return { direction: 'EN_PT', label: '🇬🇧 English \u2794 🇵🇹 Portuguese', labelTR: '🇬🇧 İngilizce \u2794 🇵🇹 Portekizce' };
    }
    if (name.includes('pt_br_eng') || name.includes('pt_eng')) {
      return { direction: 'PT_EN', label: '🇵🇹 Portuguese \u2794 🇬🇧 English', labelTR: '🇵🇹 Portekizce \u2794 🇬🇧 İngilizce' };
    }
    if (pathLower.includes('tr_port_genel') || name.includes('tr_port') || name.includes('port_tr')) {
      return { direction: 'TR_PT', label: '🇹🇷 Turkish \u2794 🇵🇹 Portuguese', labelTR: '🇹🇷 Türkçe \u2794 🇵🇹 Portekizce' };
    }
  }

  // German
  if (pathLower.includes('tr_de_genel')) {
    return { direction: 'TR_DE', label: '🇹🇷 Turkish \u2794 🇩🇪 German', labelTR: '🇹🇷 Türkçe \u2794 🇩🇪 Almanca' };
  }

  // French
  if (pathLower.includes('tr_fr_genel')) {
    return { direction: 'TR_FR', label: '🇹🇷 Turkish \u2794 🇫🇷 French', labelTR: '🇹🇷 Türkçe \u2794 🇫🇷 Fransızca' };
  }

  // Italian
  if (pathLower.includes('tr_ita_genel')) {
    return { direction: 'TR_IT', label: '🇹🇷 Turkish \u2794 🇮🇹 Italian', labelTR: '🇹🇷 Türkçe \u2794 🇮🇹 İtalyanca' };
  }

  // Korean
  if (pathLower.includes('kore')) {
    return { direction: 'KO_TR', label: '🇰🇷 Korean \u2794 🇹🇷 Turkish', labelTR: '🇰🇷 Korece \u2794 🇹🇷 Türkçe' };
  }

  // Ottoman
  if (pathLower.includes('osm_tr')) {
    return { direction: 'OSM_TR', label: '📜 Ottoman \u2794 🇹🇷 Turkish', labelTR: '📜 Osmanlıca \u2794 🇹🇷 Türkçe' };
  }

  // Russian
  if (pathLower.includes('russian')) {
    return { direction: 'RU_TR', label: '🇷🇺 Russian \u2794 🇹🇷 Turkish', labelTR: '🇷🇺 Rusça \u2794 🇹🇷 Türkçe' };
  }

  // Greek
  if (pathLower.includes('greek')) {
    return { direction: 'EL_TR', label: '🇬🇷 Greek \u2794 🇹🇷 Turkish', labelTR: '🇬🇷 Yunanca \u2794 🇹🇷 Türkçe' };
  }

  // English
  if (pathLower.includes('tr_eng_')) {
    if (name.includes('tr_eng') || name.includes('tr_sentences') || name.startsWith('tr_')) {
      return { direction: 'TR_EN', label: '🇹🇷 Turkish \u2794 🇬🇧 English', labelTR: '🇹🇷 Türkçe \u2794 🇬🇧 İngilizce' };
    }
    return { direction: 'EN_TR', label: '🇬🇧 English \u2794 🇹🇷 Turkish', labelTR: '🇬🇧 İngilizce \u2794 🇹🇷 Türkçe' };
  }

  return { direction: 'UNKNOWN', label: 'Other', labelTR: 'Diğer' };
}

function buildManifest() {
  const manifest = {
    singleLanguages: [],
    englishCategories: []
  };

  const allFiles = walk(dataDir, dataDir);
  const groups = {};
  
  allFiles.forEach(relPath => {
     let catKey = relPath.split('/')[0];
     
     // Merge Tr_Port_Genel and portugal into portugal
     if (catKey === 'Tr_Port_Genel') {
       catKey = 'portugal';
     }
     
     if (!groups[catKey]) groups[catKey] = [];
     
     const filename = path.basename(relPath);
     const dirInfo = getDirectionInfo(relPath, filename);
     
     groups[catKey].push({
       filename: filename,
       path: relPath,
       label: formatLabel(relPath),
       direction: dirInfo.direction,
       directionLabel: dirInfo.label,
       directionLabelTR: dirInfo.labelTR
     });
  });

  for (const catKey in groups) {
     const files = groups[catKey];
     
     // Custom sort: Level 0 or Alphabet comes first, then natural sort on label
     files.sort((a, b) => {
        const aIsAlpha = a.filename.toLowerCase().includes('alphabet') || a.filename.toLowerCase().includes('alfabe') || a.filename.toLowerCase().includes('level_0');
        const bIsAlpha = b.filename.toLowerCase().includes('alphabet') || b.filename.toLowerCase().includes('alfabe') || b.filename.toLowerCase().includes('level_0');
        if (aIsAlpha && !bIsAlpha) return -1;
        if (!aIsAlpha && bIsAlpha) return 1;
        return a.label.localeCompare(b.label, undefined, {numeric: true});
     });
     
     if (catKey.startsWith('Tr_Eng_')) {
       manifest.englishCategories.push({
         id: catKey,
         label: englishNames[catKey] || catKey,
         files: files
       });
     } else {
       manifest.singleLanguages.push({
         id: catKey,
         label: singleNames[catKey] || catKey.replace('/', ' - ').toUpperCase(),
         files: files
       });
     }
  }

  // Sort categories alphabetically by label
  manifest.englishCategories.sort((a, b) => a.label.localeCompare(b.label));
  manifest.singleLanguages.sort((a, b) => a.label.localeCompare(b.label));

  return manifest;
}

const manifest = buildManifest();

// Output 1: Client side JavaScript variable
const outputJs = `window.DATA_MANIFEST = ${JSON.stringify(manifest, null, 2)};`;
fs.writeFileSync(path.join(__dirname, 'data_manifest.js'), outputJs, 'utf8');
console.log('Successfully generated data_manifest.js');

// Output 2: Node.js/Cloud Function JSON
const outputJson = JSON.stringify(manifest, null, 2);
fs.writeFileSync(path.join(__dirname, 'data_manifest.json'), outputJson, 'utf8');
console.log('Successfully generated data_manifest.json');
