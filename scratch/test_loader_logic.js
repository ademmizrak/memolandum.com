const fs = require('fs');
const path = require('path');

const levelConfig = {
  "id": "other-arabic-ar_tr-words-a1_temel",
  "name": "Beginner / Başlangıç Kelimeleri",
  "path": "Arabic/content/ar_tr/words_ar_tr.json",
  "levelCode": "A1_Temel",
  "type": "words"
};

async function testLoaderLogic() {
  const filePath = path.resolve(__dirname, '../public/data/Arabic/content/ar_tr/words_ar_tr.json');
  console.log('Reading:', filePath);
  const data = JSON.parse(fs.readFileSync(filePath, 'utf8'));
  console.log('Total items in file:', data.length);

  let rawWords = [];
  if (Array.isArray(data)) {
    if (data.length > 0 && data[0].words && Array.isArray(data[0].words)) {
      if (levelConfig.levelCode) {
        const targetLvl = data.find(item => item.level === levelConfig.levelCode || item.level_tag === levelConfig.levelCode);
        rawWords = targetLvl ? targetLvl.words : [];
      } else {
        rawWords = data.flatMap(item => item.words || []);
      }
    } else {
      rawWords = data;
    }
  }

  console.log('After initial unpacking:', rawWords.length);

  if (levelConfig.levelCode && !(Array.isArray(data) && data.length > 0 && data[0].words && Array.isArray(data[0].words))) {
    const targetCode = levelConfig.levelCode.toLowerCase();
    rawWords = rawWords.filter(w => {
      const itemLvl = String(w.level || w.level_tag || w.category || '').toLowerCase();
      if (itemLvl === targetCode) return true;
      if (w.tags) {
        if (Array.isArray(w.tags)) {
          return w.tags.some(t => String(t).toLowerCase() === targetCode);
        } else {
          return String(w.tags).toLowerCase() === targetCode;
        }
      }
      return false;
    });
  }

  console.log('After filtering by levelCode:', rawWords.length);

  const basePath = levelConfig.path.split('/')[0];
  const subPath = levelConfig.path.split('/').length > 1 ? levelConfig.path.split('/')[1] : '';

  const fetchedWords = rawWords.map(w => {
    const english = w.english || w.original_script || w.word || w.mission_word || w.mission_phrase || w.en || w.osmanlica_latin;
    const turkish = w.turkish || w.meaning || w.translation || w.target_translation || w.tr || w.guncel_turkce;
    
    const safeWord = (english || "").toLowerCase().replace(/[^a-z0-9]+/g, '_').replace(/^_|_$/g, '');
    
    let audioUrl = "";
    if (w.audioUrl) {
      audioUrl = w.audioUrl;
    } else if (w.audio) {
      if (typeof w.audio === 'string') {
        audioUrl = w.audio;
      } else if (w.audio.default) {
        audioUrl = w.audio.default;
      } else if (w.audio.male) {
        audioUrl = w.audio.male;
      } else if (w.audio.female) {
        audioUrl = w.audio.female;
      }
    }

    const romanized = w.osmanlica_arapca || w.romanized_script || w.romanized || w.latin_okunusu || w.pinyin || '';

    return {
      ...w,
      english,
      turkish,
      romanized,
      romanized_script: romanized,
      audioUrl: audioUrl
    };
  }).filter(w => w.english && w.turkish);

  console.log('After mapping & filtering empty:', fetchedWords.length);
  if (fetchedWords.length > 0) {
    console.log('Sample item:', JSON.stringify(fetchedWords[0], null, 2));
  }
}

testLoaderLogic();
