const fs = require('fs');
const path = require('path');

const srcDir = path.join(__dirname, 'public', 'data', 'Tr_Eng_Genel', 'Audio');
const destDir = path.join(__dirname, 'public', 'assets', 'audio', 'en');

if (!fs.existsSync(destDir)) {
  fs.mkdirSync(destDir, { recursive: true });
}

if (!fs.existsSync(srcDir)) {
  console.log(`Source directory not found: ${srcDir}`);
  process.exit(1);
}

const files = fs.readdirSync(srcDir);
let copied = 0;

files.forEach(file => {
  if (file.endsWith('.mp3')) {
    // eng_a1_001_the.mp3 -> the
    // eng_a2_150_friend.mp3 -> friend
    // We split by '_' and take the last part, then remove '.mp3'
    const parts = file.split('_');
    let word = parts[parts.length - 1].replace('.mp3', '');
    
    // Some words might have special characters or be combined. We just take it as is.
    const destFile = path.join(destDir, `${word}.mp3`);
    fs.copyFileSync(path.join(srcDir, file), destFile);
    copied++;
  }
});

console.log(`Successfully copied ${copied} audio files to ${destDir}`);
