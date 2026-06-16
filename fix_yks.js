const fs = require('fs');
const path = require('path');

const dir = path.join(__dirname, 'data', 'yks_dil');
const files = fs.readdirSync(dir).filter(f => f.endsWith('.json'));

for (let file of files) {
  const filePath = path.join(dir, file);
  const content = JSON.parse(fs.readFileSync(filePath, 'utf8'));
  
  if (content.words && Array.isArray(content.words)) {
    // It's the nested object format
    const newFormat = content.words.map((item, index) => ({
      id: item.id || `yks_${file}_${index}`,
      word: item.word || '',
      translation: item.meaning || item.translation || '',
      pos: item.type || item.pos || '',
      tags: ["YKS-DIL"]
    }));
    
    fs.writeFileSync(filePath, JSON.stringify(newFormat, null, 2), 'utf8');
    console.log(`Fixed ${file}`);
  } else if (Array.isArray(content)) {
    // It's an array, let's make sure it uses "translation" instead of "meaning"
    let updated = false;
    const newFormat = content.map(item => {
      if (item.meaning && !item.translation) {
        item.translation = item.meaning;
        delete item.meaning;
        updated = true;
      }
      return item;
    });
    if (updated) {
      fs.writeFileSync(filePath, JSON.stringify(newFormat, null, 2), 'utf8');
      console.log(`Updated keys for ${file}`);
    } else {
      console.log(`Skipped ${file} (Already in array format and looks fine)`);
    }
  }
}
