const fs = require('fs');
const path = require('path');

const engines = ['breakout', 'invaders', 'shooter', 'wordascent', 'worddrop'];
const enginesDir = path.join(__dirname, 'src', 'engines');

engines.forEach(name => {
  const filePath = path.join(enginesDir, name + '.shell.js');
  let code = fs.readFileSync(filePath, 'utf8');
  let modified = false;

  // 1. Remove `if (window.game !== this) return;`
  if (code.includes('if (window.game !== this) return;')) {
    code = code.replace(/if\s*\(\s*window\.game !== this\s*\)\s*return;/g, 'if (this.isDestroyed) return;');
    modified = true;
  }
  
  // 2. Add this.isDestroyed = true and cancelAnimationFrame to cleanup()
  // Search for `cleanup() {`
  if (code.includes('cleanup() {') && !code.includes('this.isDestroyed = true;')) {
    code = code.replace(/cleanup\(\)\s*\{/, 'cleanup() {\n    this.isDestroyed = true;\n    if (this.loopId) cancelAnimationFrame(this.loopId);\n');
    modified = true;
  }
  
  // Also fix the case where window.game is referenced elsewhere unnecessarily that might crash
  
  if (modified) {
    fs.writeFileSync(filePath, code, 'utf8');
    console.log('Fixed loop logic for', name);
  }
});
console.log('All loops checked.');
