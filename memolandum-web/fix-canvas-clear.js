const fs = require('fs');
const path = require('path');
const enginesDir = path.join(__dirname, 'src', 'engines');
const files = fs.readdirSync(enginesDir).filter(f => f.endsWith('.shell.js'));

files.forEach(file => {
  const filePath = path.join(enginesDir, file);
  let code = fs.readFileSync(filePath, 'utf8');

  // Let's find the main draw or drawGame method
  let targetMethod = file === 'invaders.shell.js' ? 'drawGame() {' : 'draw() {';
  let methodIndex = code.indexOf(targetMethod);

  if (methodIndex !== -1) {
    let before = code.substring(0, methodIndex + targetMethod.length);
    let after = code.substring(methodIndex + targetMethod.length);

    let bgColor = "this.ctx.fillStyle = '#000000';";
    if (file === 'invaders.shell.js') {
      bgColor = "this.ctx.fillStyle = '#060312';";
    } else if (file === 'highway.shell.js') {
      bgColor = "this.ctx.fillStyle = '#0d0d1a';";
    }

    // We will inject the robust clearing logic right after the method opening
    let robustClear = `\n    this.ctx.save();\n    this.ctx.setTransform(1, 0, 0, 1, 0, 0);\n    ${bgColor}\n    this.ctx.fillRect(0, 0, this.canvas.width, this.canvas.height);\n    this.ctx.restore();\n`;

    // Now we need to remove the old clearing logic from the "after" block
    // We'll just look for the first few lines and strip out clearRect or fillRect 
    // that operates on the canvas width/height or virtualWidth/Height.
    let lines = after.split('\n');
    let newLines = [];
    let skipMode = true;
    let i = 0;

    // Skip the first few lines if they are just clearing the canvas
    while (i < lines.length && i < 15) {
      let line = lines[i];
      if (line.includes('this.state ===') || line.includes('this.ctx.save()') || line.includes('this.stars.forEach')) {
        // We reached actual logic, stop skipping
        break;
      }
      if (
        line.trim() === '' ||
        line.includes('// 1. Draw Starry Void') ||
        line.includes('// Clear frame buffer') ||
        line.includes('this.ctx.fillStyle =') ||
        line.includes('this.ctx.clearRect(') ||
        line.includes('this.ctx.fillRect(')
      ) {
        // This is old clearing logic, skip it
        i++;
      } else {
        break;
      }
    }

    newLines = lines.slice(i);
    
    // Some engines have an 'if (this.state === "exam")' wrapper.
    // If we stripped it, we might need to be careful.
    // Actually, it's safer to use regex replacement on the specific known patterns.
  }
});
