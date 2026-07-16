const fs = require('fs');
const path = require('path');

const filePath = path.resolve(__dirname, '../public/data/Arabic/content/ar_en/words_ar_en.json');
const data = JSON.parse(fs.readFileSync(filePath, 'utf8'));

const levelTags = new Set();
const levels = new Set();

data.forEach(item => {
  if (item.level_tag) levelTags.add(item.level_tag);
  if (item.level) levels.add(item.level);
});

console.log('Unique level_tags in words_ar_en.json:', Array.from(levelTags));
console.log('Unique levels in words_ar_en.json:', Array.from(levels));
