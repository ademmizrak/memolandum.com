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

// Copy assets needed by firebase functions SSR
console.log('Copying assets to functions/ directory for SSR...');
const functionsDir = path.join(__dirname, 'functions');

// Helper to copy directory recursively
function copyDirectory(src, dest) {
  if (!fs.existsSync(dest)) {
    fs.mkdirSync(dest, { recursive: true });
  }
  const entries = fs.readdirSync(src, { withFileTypes: true });
  for (let entry of entries) {
    const srcPath = path.join(src, entry.name);
    const destPath = path.join(dest, entry.name);
    if (entry.isDirectory()) {
      copyDirectory(srcPath, destPath);
    } else {
      fs.copyFileSync(srcPath, destPath);
    }
  }
}

// Copy index.html
fs.copyFileSync(
  path.join(__dirname, 'index.html'),
  path.join(functionsDir, 'index.html')
);

// Copy data_manifest.json
fs.copyFileSync(
  path.join(__dirname, 'data_manifest.json'),
  path.join(functionsDir, 'data_manifest.json')
);

// Copy data directory
const destDataDir = path.join(functionsDir, 'data');
if (fs.existsSync(destDataDir)) {
  fs.rmSync(destDataDir, { recursive: true, force: true });
}
copyDirectory(path.join(__dirname, 'data'), destDataDir);

console.log('Assets copied to functions/ directory.');
console.log('Build complete.');
