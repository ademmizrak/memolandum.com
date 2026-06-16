const fs = require('fs');
const path = require('path');

const dir = path.join(__dirname, 'data', 'YDS_kelimeleri');
const files = fs.readdirSync(dir).filter(f => f.endsWith('.json') && !f.endsWith('_v2.json'));

for (let file of files) {
  const filePath = path.join(dir, file);
  const content = JSON.parse(fs.readFileSync(filePath, 'utf8'));
  
  if (content.words && Array.isArray(content.words)) {
    // It's the nested object format
    const newFormat = content.words.map((item, index) => ({
      id: item.id || `yds_${file}_${index}`,
      word: item.word || '',
      translation: item.meaning || item.translation || '',
      pos: item.type || item.pos || '',
      tags: ["YDS"]
    }));
    
    const newFileName = file.replace('.json', '_v2.json');
    const newFilePath = path.join(dir, newFileName);
    fs.writeFileSync(newFilePath, JSON.stringify(newFormat, null, 2), 'utf8');
    
    // delete old file to keep it clean
    fs.unlinkSync(filePath);
    console.log(`Converted and renamed ${file} to ${newFileName}`);
  }
}
