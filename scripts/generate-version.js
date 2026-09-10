const fs = require('fs');
const path = require('path');

const publicDir = path.join(__dirname, '../public');
if (!fs.existsSync(publicDir)) {
  fs.mkdirSync(publicDir, { recursive: true });
}

const versionPath = path.join(publicDir, 'version.json');
const versionData = {
  version: Date.now()
};

fs.writeFileSync(versionPath, JSON.stringify(versionData, null, 2));
console.log(`[VersionGenerator] Generated version.json with version: ${versionData.version}`);
