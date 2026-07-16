const fs = require('fs');
const path = require('path');

function checkFile(filePath) {
  if (fs.existsSync(filePath)) {
    const data = JSON.parse(fs.readFileSync(filePath, 'utf8'));
    const item = Array.isArray(data) ? data[0] : {};
    console.log(`\nKeys for ${path.basename(filePath)}:`);
    console.log(JSON.stringify(item, null, 2));
  } else {
    console.log(`\nFile not found: ${filePath}`);
  }
}

checkFile(path.resolve(__dirname, '../public/data/Japan/content/jap_tr/words_jap_tr.json'));
checkFile(path.resolve(__dirname, '../public/data/Korean/content/ko_tr/words_ko_tr.json'));
