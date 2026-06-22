const fs = require('fs');
const path = require('path');

const srcDir = __dirname;
const destDir = path.join(__dirname, 'www');

const ignoredItems = [
  'node_modules',
  'android',
  'ios',
  '.git',
  '.github',
  'www',
  'package.json',
  'package-lock.json',
  'capacitor.config.json',
  'build.js'
];

function copyDir(src, dest) {
  if (!fs.existsSync(dest)) {
    fs.mkdirSync(dest, { recursive: true });
  }

  const entries = fs.readdirSync(src, { withFileTypes: true });

  for (let entry of entries) {
    if (ignoredItems.includes(entry.name)) continue;

    const srcPath = path.join(src, entry.name);
    const destPath = path.join(dest, entry.name);

    if (entry.isDirectory()) {
      copyDir(srcPath, destPath);
    } else {
      fs.copyFileSync(srcPath, destPath);
    }
  }
}

const { execSync } = require('child_process');

console.log('Building www folder...');

console.log('Generating data manifest...');
execSync('node generate_manifest.js', { stdio: 'inherit' });

if (fs.existsSync(destDir)) {
  fs.rmSync(destDir, { recursive: true, force: true });
}
copyDir(srcDir, destDir);
console.log('Build complete.');
