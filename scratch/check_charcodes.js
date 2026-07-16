const fs = require('fs');
const path = require('path');

const filePath = path.resolve(__dirname, '../public/data/Arabic/content/ar_en/words_ar_en.json');
const data = JSON.parse(fs.readFileSync(filePath, 'utf8'));

const tags = new Set();
data.forEach(item => {
  if (item.level_tag) tags.add(item.level_tag);
});

console.log('Level tags with char codes:');
for (const tag of tags) {
  const codes = [];
  for (let i = 0; i < tag.length; i++) {
    codes.push(`${tag[i]}(${tag.charCodeAt(i)})`);
  }
  console.log(`${tag} -> ${codes.join(', ')}`);
}
