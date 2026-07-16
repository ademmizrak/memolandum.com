const fs = require('fs');
const path = require('path');

function processEngine(name) {
  const file = path.join(__dirname, 'src/engines', name + '.shell.js');
  if (!fs.existsSync(file)) return;
  let code = fs.readFileSync(file, 'utf8');

  // Challenge Mode hook
  // Find where useMemolandumStore is imported, if not, add it
  if (!code.includes('useMemolandumStore')) {
    code = `import { useMemolandumStore } from '../../store/useMemolandumStore';\n` + code;
  }

  // Find all colored hints and replace with Challenge Mode logic
  // This will be engine specific, let's just log for now to inspect manually.

  // Remove isLevelTransitioning paddle/ship freeze in breakout
  if (name === 'breakout') {
    code = code.replace(
      `        if (this.isLevelTransitioning) {
            this.levelCompleteTimer -= dt;`,
      `        if (this.isLevelTransitioning) {
            this.levelCompleteTimer -= dt;
            // Removed early return so paddle doesn't freeze`
    );
    code = code.replace(
      `                } else {
                    this.triggerFinalVictory();
                }
            }
            return;
        }`,
      `                } else {
                    this.triggerFinalVictory();
                }
            }
            // Removed early return so paddle doesn't freeze
        }`
    );
    // Add flash timer
    if (!code.includes('this.flashTimer')) {
        code = code.replace(`this.hitPauseUntil = 0;`, `this.hitPauseUntil = 0;\n        this.flashTimer = 0;`);
    }
    // Remove the hitPauseUntil from gameLoop and add flash overlay
    code = code.replace(
      `        if (performance.now() < this.hitPauseUntil) {
            this.draw();
            return;
        }`,
      `        if (this.flashTimer > 0) {
            this.flashTimer -= dt;
        }`
    );
    // Add green flash overlay
    code = code.replace(
      `        this.ctx.fillRect(0, 0, this.canvas.width, this.canvas.height);
        this.ctx.save();`,
      `        this.ctx.fillRect(0, 0, this.canvas.width, this.canvas.height);
        if (this.flashTimer > 0) {
            this.ctx.fillStyle = \`rgba(74, 222, 128, \${this.flashTimer * 2})\`;
            this.ctx.fillRect(0, 0, this.canvas.width, this.canvas.height);
        }
        this.ctx.save();`
    );
    // Replace hitPause assignment on correct block
    code = code.replace(
        `this.hitPauseUntil = performance.now() + 100;`,
        `this.flashTimer = 0.2;`
    );
  }

  if (name === 'invaders') {
    if (!code.includes('this.flashTimer = 0')) {
        code = code.replace(`this.collectedGems = 0;`, `this.collectedGems = 0;\n    this.flashTimer = 0;`);
    }
    code = code.replace(
        `this.screenShakeTimer = 0;`,
        `this.screenShakeTimer = 0;\n    this.flashTimer = 0;`
    );
    // Remove star wars freeze if any, but it's handled in handleCorrectHit already (instantly spawns next wave).
    // Let's add flash logic.
    code = code.replace(
        `this.triggerScreenShake(20, 7);`,
        `this.triggerScreenShake(20, 7);\n    this.flashTimer = 0.3;`
    );
    code = code.replace(
        `this.ctx.fillRect(0, 0, this.canvas.width, this.canvas.height);
    this.ctx.restore();`,
        `this.ctx.fillRect(0, 0, this.canvas.width, this.canvas.height);
    
    if (this.flashTimer > 0) {
        this.flashTimer -= 1/60;
        this.ctx.fillStyle = \`rgba(74, 222, 128, \${this.flashTimer * 2})\`;
        this.ctx.fillRect(0, 0, this.canvas.width, this.canvas.height);
    }
    this.ctx.restore();`
    );
  }

  fs.writeFileSync(file, code);
  console.log(name + ' updated');
}

['breakout', 'invaders'].forEach(processEngine);
