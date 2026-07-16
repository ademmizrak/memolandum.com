const fs = require('fs');
const path = require('path');

const filePath = path.resolve(__dirname, '../public/data/Chinesee/content/zh_ch_en/words_ch_en.json');
const data = JSON.parse(fs.readFileSync(filePath, 'utf8'));

console.log('Chinese first level words first item keys:');
const firstWord = data[0].words[0];
console.log(JSON.stringify(firstWord, null, 2));
