const fs = require('fs');
const path = require('path');

const levelConfig = {
  "id": "other-arabic-ar_en-words-a1_sifat",
  "name": "A1_Sifat Kelimeleri",
  "path": "Arabic/content/ar_en/words_ar_en.json",
  "levelCode": "A1_Sifat",
  "type": "words"
};

async function testLoaderLogic() {
  const filePath = path.resolve(__dirname, '../public/data/Arabic/content/ar_en/words_ar_en.json');
  console.log('Reading:', filePath);
  const data = JSON.parse(fs.readFileSync(filePath, 'utf8'));
  console.log('Total items in file:', data.length);

  let rawWords = [];
  if (Array.isArray(data)) {
    rawWords = data;
  }

  console.log('After initial unpacking:', rawWords.length);

  const targetCode = levelConfig.levelCode.toLowerCase();
  rawWords = rawWords.filter(w => {
    const itemLvl = String(w.level || w.level_tag || w.category || '').toLowerCase();
    const matches = itemLvl === targetCode;
    if (matches) {
      // console.log('Match found!', w.id, w.level_tag);
    }
    return matches;
  });

  console.log('After filtering by levelCode:', rawWords.length);

  const fetchedWords = rawWords.map(w => {
    const english = w.english || w.original_script || w.word || w.mission_word || w.mission_phrase || w.en || w.osmanlica_latin;
    const turkish = w.turkish || w.meaning || w.translation || w.target_translation || w.tr || w.guncel_turkce || 
                    w.es || w.fr || w.de || w.ar || w.pt || w.brpt || w.zh || w.cn || w.it || w.ru || w.ja || w.jap || w.ko || w.el;
    
    return {
      id: w.id,
      english,
      turkish
    };
  }).filter(w => w.english && w.turkish);

  console.log('After mapping & filtering empty:', fetchedWords.length);
  if (rawWords.length > 0 && fetchedWords.length === 0) {
    console.log('Raw sample item:', JSON.stringify(rawWords[0], null, 2));
  }
}

testLoaderLogic();
