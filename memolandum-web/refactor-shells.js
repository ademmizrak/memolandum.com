const fs = require('fs');
const path = require('path');

const filesToUpdate = [
  'breakout.shell.js',
  'invaders.shell.js',
  'shooter.shell.js',
  'wordascent.shell.js',
  'worddrop.shell.js'
];

const enginesDir = path.join(__dirname, 'src', 'engines');

filesToUpdate.forEach(fileName => {
  const filePath = path.join(enginesDir, fileName);
  if (!fs.existsSync(filePath)) {
    console.log(`Skipping ${fileName}, not found.`);
    return;
  }

  let code = fs.readFileSync(filePath, 'utf8');
  
  // 1. Add SoundManager import if not there
  if (!code.includes("import { SoundManager }")) {
    code = `import { SoundManager } from './soundManager';\n\n` + code;
  }

  // 2. Remove inline SoundManager class completely
  const smRegex = /\/\/ ----------------------------------------------------\s*\n\/\/ Synthesized Audio System.*?\n\/\/ ----------------------------------------------------\s*\nclass SoundManager \{[\s\S]*?\n\}\n/g;
  code = code.replace(smRegex, '');
  
  // Also catch just the class if header is missing or different
  const smRegex2 = /class SoundManager \{[\s\S]*?\n\}\n/g;
  code = code.replace(smRegex2, '');

  // 3. Export class and remove module.exports
  // e.g. class BreakoutGame -> export class BreakoutGame
  const classNameMatch = code.match(/class ([A-Za-z0-9]+Game) \{/);
  if (classNameMatch) {
    const className = classNameMatch[1];
    code = code.replace(`class ${className} {`, `export class ${className} {`);
    
    // Remove module.exports
    const exportsRegex = new RegExp(`if \\(typeof module !== 'undefined' && module\\.exports\\) \\{\\s*module\\.exports = ${className};\\s*\\}`, 'g');
    code = code.replace(exportsRegex, '');
    const exportsRegex2 = new RegExp(`if\\(typeof module !== 'undefined' && module\\.exports\\) module\\.exports = ${className};`, 'g');
    code = code.replace(exportsRegex2, '');
  }

  // 4. Constructor updates
  // constructor(vocabulary, jsonFileName) { -> constructor(vocabulary, jsonFileName, canvasElement, playAudioCallback) {
  code = code.replace(/constructor\(vocabulary, jsonFileName\) \{/, 'constructor(vocabulary, jsonFileName, canvasElement, playAudioCallback) {');
  
  // this.canvas = document.getElementById('gameCanvas'); -> this.canvas = canvasElement || document.getElementById('gameCanvas');\n    this.playAudioCallback = playAudioCallback;
  code = code.replace(/this\.canvas = document\.getElementById\('gameCanvas'\);/g, `this.canvas = canvasElement || document.getElementById('gameCanvas');\n    this.playAudioCallback = playAudioCallback;`);

  // 5. Replace Main Menu navigations
  code = code.replace(/if\s*\(\s*typeof showMainMenu === 'function'\s*\)\s*showMainMenu\(\);/g, `window.location.href = '/';`);
  code = code.replace(/if\s*\(\s*typeof updateMainMenuResumeUI === 'function'\s*\)\s*updateMainMenuResumeUI\(\);/g, `// removed`);
  code = code.replace(/updateMainMenuResumeUI\(\);/g, `// removed`);

  // 6. Safe DOM calls for game-over-screen, start-screen, pause-screen, victory-screen
  // document.getElementById('start-screen').classList... -> const ss = document.getElementById('start-screen'); if(ss) ss.classList...
  code = code.replace(/document\.getElementById\('([^']+)'\)\.classList\.([a-zA-Z]+)\('([^']+)'\);/g, (match, id, method, cls) => {
    return `const el_${id.replace(/-/g, '_')} = document.getElementById('${id}'); if(el_${id.replace(/-/g, '_')}) el_${id.replace(/-/g, '_')}.classList.${method}('${cls}');`;
  });

  // 7. Pause keyboard ignore
  // Inside handleKeyDown(e) {
  // If it doesn't already have the pause check
  if (code.includes('handleKeyDown(e) {') && !code.includes('this.isPaused && e.key !==')) {
    code = code.replace(/handleKeyDown\(e\) \{/, `handleKeyDown(e) {\n    if (this.isPaused && e.key !== 'Escape' && e.key !== 'p' && e.key !== 'P') return;`);
  }

  // 8. Safe pause toggle bindings
  // this.handleKeyDownBound = (e) => { if (this.state === 'playing') this.handleKeyDown(e); }; -> if (this.state === 'playing' || this.state === 'paused')
  code = code.replace(/if\s*\(\s*this\.state === 'playing'\s*\)\s*this\.handleKeyDown\(e\);/g, `if (this.state === 'playing' || this.state === 'paused' || this.isPaused) this.handleKeyDown(e);`);

  fs.writeFileSync(filePath, code, 'utf8');
  console.log(`Successfully refactored ${fileName}`);
});
