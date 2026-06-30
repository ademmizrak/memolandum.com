const fs = require('fs');
const path = require('path');

const starClassCode = `
class Star {
  constructor() {
    this.x = 0;
    this.y = 0;
    this.size = 1;
    this.speed = 10;
  }

  reset(virtualWidth, virtualHeight) {
    this.x = Math.random() * virtualWidth;
    this.y = Math.random() * virtualHeight;
    this.size = Math.random() * 2 + 0.5;
    this.speed = Math.random() * 30 + 15;
  }

  update(dt, virtualWidth, virtualHeight) {
    this.y += this.speed * dt;
    if (this.y > virtualHeight) {
      this.y = 0;
      this.x = Math.random() * virtualWidth;
    }
  }

  draw(ctx) {
    ctx.fillStyle = 'rgba(255, 255, 255, 0.45)';
    ctx.fillRect(this.x, this.y, this.size, this.size);
  }
}
`;

const engines = ['breakout', 'invaders', 'wordascent', 'worddrop'];
const enginesDir = path.join(__dirname, 'src', 'engines');

engines.forEach(name => {
  const filePath = path.join(enginesDir, name + '.shell.js');
  let code = fs.readFileSync(filePath, 'utf8');

  // Insert Star class after imports if not present
  if (!code.includes('class Star {') && !code.includes('class Star')) {
    code = code.replace(/import .*?;\n/, match => match + '\n' + starClassCode + '\n');
    console.log('Added Star class to', name);
  }

  // Remove old global bootstrap code (anything after the class export)
  // Let's find the end of the exported class
  const classRegex = new RegExp(`export class ${name === 'wordascent' ? 'WordAscent' : name === 'worddrop' ? 'WordDrop' : name.charAt(0).toUpperCase() + name.slice(1)}Game\\s*\\{[\\s\\S]*?\\n\\}`, 'g');
  
  // Find where the class ends by finding "function loadLevel" or "window.addEventListener('load'"
  const truncateIndex1 = code.indexOf("window.addEventListener('load'");
  const truncateIndex2 = code.indexOf("function showMainMenu");
  const truncateIndex3 = code.indexOf("window.Game =");
  const truncateIndex4 = code.indexOf("// ----------------------------------------------------\n// Engine Bootstrapper");

  const indices = [truncateIndex1, truncateIndex2, truncateIndex3, truncateIndex4].filter(i => i > -1);
  if (indices.length > 0) {
    const minIndex = Math.min(...indices);
    // Let's truncate everything from minIndex onwards
    code = code.substring(0, minIndex);
    console.log('Truncated old vanilla JS from', name);
  }

  fs.writeFileSync(filePath, code, 'utf8');
});

console.log('Done fixing stars and tails.');
