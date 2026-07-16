const fs = require('fs');
const path = require('path');

const content = fs.readFileSync(path.resolve(__dirname, '../src/config/manifest.js'), 'utf8');
const cjsContent = content.replace('export const gameManifest =', 'module.exports =');
const tempPath = path.resolve(__dirname, 'temp_manifest.cjs');
fs.writeFileSync(tempPath, cjsContent);
const manifest = require(tempPath);
fs.unlinkSync(tempPath);

const arabicEn = manifest.mainCategories[1].subCategories.find(s => s.id === 'other-arabic-ar_en');
console.log('Manifest Arabic-English levelCodes:');
arabicEn.levels.forEach(lvl => {
  const code = lvl.levelCode;
  if (!code) {
    console.log(`${lvl.id} -> [NO LEVELCODE]`);
    return;
  }
  const codes = [];
  for (let i = 0; i < code.length; i++) {
    codes.push(`${code[i]}(${code.charCodeAt(i)})`);
  }
  console.log(`${lvl.id} -> ${lvl.levelCode} -> ${codes.join(', ')}`);
});
