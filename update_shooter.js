const fs = require('fs');
const path = require('path');

const file = path.join(__dirname, 'src/engines/shooter.shell.js');
let code = fs.readFileSync(file, 'utf8');

// 1. hitPauseUntil to flashTimer initialization
code = code.replace(
  'this.hitPauseUntil = 0;',
  'this.flashTimer = 0;'
);
code = code.replace(
  'this.hitPauseUntil = 0; // Epoch timestamp (ms) for hit-stop freeze effect',
  'this.flashTimer = 0; // Flash timer for green flash effect'
);

// 2. Remove the freeze logic in gameLoop and replace with flashTimer update
code = code.replace(
  `    // Implementation of 200ms Hit-Pause impact freeze frame
    if (performance.now() < this.hitPauseUntil) {
      // Render frozen state visually (skipping gameplay updates)
      this.draw();
      return;
    }`,
  `    // Flash effect
    if (this.flashTimer > 0) {
      this.flashTimer -= dt;
    }`
);

// 3. Replace hitPauseUntil with flashTimer assignments
code = code.replace(
  'this.hitPauseUntil = performance.now() + 50; // brief hit stop freeze',
  'this.flashTimer = 0.1;'
);
code = code.replace(
  'this.hitPauseUntil = performance.now() + 300; // Slower hit pause for epic feel',
  'this.flashTimer = 0.3;'
);
code = code.replace(
  "this.hitPauseUntil = performance.now() + 200;",
  "this.flashTimer = 0.2;"
);

// 4. Add flash overlay in draw
code = code.replace(
  `      this.ctx.fillRect(0, 0, this.canvas.width, this.canvas.height);

      this.ctx.save();`,
  `      this.ctx.fillRect(0, 0, this.canvas.width, this.canvas.height);
      
      // Green flash overlay
      if (this.flashTimer > 0) {
        this.ctx.fillStyle = \`rgba(74, 222, 128, \${this.flashTimer * 2})\`;
        this.ctx.fillRect(0, 0, this.canvas.width, this.canvas.height);
      }

      this.ctx.save();`
);

fs.writeFileSync(file, code);
console.log('shooter.shell.js updated');
