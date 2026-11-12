const fs = require('fs');

function fixDraw(filePath) {
  let code = fs.readFileSync(filePath, 'utf8');

  // Let's find "draw() {"
  let methodIndex = code.indexOf('  draw() {\n');
  if (methodIndex !== -1) {
    let before = code.substring(0, methodIndex);
    let after = code.substring(methodIndex);
    
    // We want to replace the first few lines of the draw() method
    if (filePath.includes('breakout') || filePath.includes('shooter')) {
      // It should look like:
      //   draw() {
      //     if (this.state === 'exam') {
      //       this.ctx.fillStyle = '#000000';
      //       this.ctx.fillRect(0, 0, this.canvas.width, this.canvas.height);
      
      let regex = /draw\(\) \{\s*if \(this\.state === 'exam'\) \{\s*(?:\/\/ Clear frame buffer\s*)?this\.ctx\.fillStyle = '#000000';\s*this\.ctx\.fillRect\(0, 0, this\.canvas\.width, this\.canvas\.height\);/;
      
      if (regex.test(after)) {
        after = after.replace(regex, `draw() {
    this.ctx.save();
    this.ctx.setTransform(1, 0, 0, 1, 0, 0);
    this.ctx.fillStyle = '#000000';
    this.ctx.fillRect(0, 0, this.canvas.width, this.canvas.height);
    this.ctx.restore();

    if (this.state === 'exam') {`);
      }
    }
    
    fs.writeFileSync(filePath, before + after);
    console.log('Fixed', filePath);
  }
}

// But wait, breakout got messed up by the replace tool. Let's fix breakout first.
let breakoutPath = 'src/engines/breakout.shell.js';
let bCode = fs.readFileSync(breakoutPath, 'utf8');

// The botched replacement removed screenShake logic.
// The botched tool removed from line 1267:
//       this.screenShake -= dt * 20;
//       if (this.screenShake < 0) this.screenShake = 0;
//     }
//   }
//
//   draw() { ... up to translate(dx, dy);

// We need to restore it from our last known good state or just rewrite it.
// Actually, since I have the tool history, I can see exactly what was removed.
let botchedPattern = /this\.ctx\.translate\(dx, dy\);/;
let indexBotched = bCode.indexOf('this.ctx.translate(dx, dy);');

if (indexBotched !== -1 && !bCode.includes('this.screenShake -= dt * 20;')) {
  // It is botched. Let's find where it starts being botched.
  // The line before the botched block is:
  // "    if (this.screenShake > 0) {\n"
  
  let beforeBotched = bCode.substring(0, bCode.indexOf('    if (this.screenShake > 0) {\n') + 32);
  let afterBotched = bCode.substring(indexBotched);
  
  let restore = `      this.screenShake -= dt * 20;
      if (this.screenShake < 0) this.screenShake = 0;
    }
  }

  draw() {
    this.ctx.save();
    this.ctx.setTransform(1, 0, 0, 1, 0, 0);
    this.ctx.fillStyle = '#000000';
    this.ctx.fillRect(0, 0, this.canvas.width, this.canvas.height);
    this.ctx.restore();

    if (this.state === 'exam') {
      this.ctx.save();
      if (this.screenShake > 0) {
        const dx = (Math.random() - 0.5) * this.screenShake;
        const dy = (Math.random() - 0.5) * this.screenShake;
        `;
        
  fs.writeFileSync(breakoutPath, beforeBotched + restore + afterBotched);
  console.log('Restored breakout.shell.js');
} else if (!bCode.includes('this.ctx.setTransform(1, 0, 0, 1, 0, 0);')) {
  fixDraw(breakoutPath);
}

fixDraw('src/engines/shooter.shell.js');

