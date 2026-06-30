const fs = require('fs');
const file = 'd:/000Memorade/memolandum-web/src/engines/wordascent.shell.js';
let code = fs.readFileSync(file, 'utf8');
const lines = code.split('\n');

if (lines[538].includes('          }));') && lines[734].includes('  bindEvents() {')) {
  lines.splice(538, 196);
  
  const missingCode = [
    "    window.addEventListener('keyup', this.keyupHandler);",
    "",
    "    // Touch controls on canvas",
    "    this.canvas.addEventListener('touchstart', (e) => {",
    "      if (this.state !== 'playing' || this.isPaused) return;",
    "      if (e.touches.length > 0) {"
  ];
  
  lines.splice(542, 0, ...missingCode);
  fs.writeFileSync(file, lines.join('\n'), 'utf8');
  console.log('Successfully fixed wordascent.shell.js');
} else {
  console.log('Could not match expected lines for splicing.');
}
