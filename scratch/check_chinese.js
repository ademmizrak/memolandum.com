const fs = require('fs');
const path = require('path');

const filePath = path.resolve(__dirname, '../public/data/Chinesee/content/zh_ch_en/words_ch_en.json');
const data = JSON.parse(fs.readFileSync(filePath, 'utf8'));

console.log('Chinese levels in file:');
data.forEach(item => {
  console.log(`- level: "${item.level}", level_tag: "${item.level_tag}", words count: ${item.words ? item.words.length : 0}`);
});
