const fs = require('fs');
let content = fs.readFileSync('D:/000Memorade/index.html', 'utf8');

const targetStr = `      const levels = [
        { id: 'a1_words.json', name: 'A1 - Başlangıç Seviyesi' },
        { id: 'a2_words.json', name: 'A2 - Temel Seviye' },
        { id: 'b1_words.json', name: 'B1 - Orta Seviye' },
        { id: 'b2_words.json', name: 'B2 - İleri Seviye' },
        { id: 'phrasal_verbs.json', name: 'Phrasal Verbs' },
        { id: 'prepositions.json', name: 'Prepositions' },
        { id: 'conjunctions.json', name: 'Conjunctions' },
        { id: 'academic_verbs.json', name: 'Akademik Fiiller' }
      ];`;

const replacementStr = `      const rawCats = getCategories(langPair);
      const levels = [
        ...(rawCats.core || []),
        ...(rawCats.sentences || []),
        ...(rawCats.special || []),
        ...(rawCats.yksHazirlik || []),
        ...(rawCats.ydsKelimeleri || [])
      ];`;

content = content.replace(targetStr, replacementStr);
fs.writeFileSync('D:/000Memorade/index.html', content, 'utf8');
