const fs = require('fs');
const paths = [
  'src/components/games/RetroShooter/RetroShooterEngine.js',
  'src/components/games/RetroBreakout/RetroBreakoutEngine.js',
  'src/components/games/RetroHighway/RetroHighwayEngine.js',
  'src/components/games/SiberianInvaders/InvadersEngine.js',
  'src/components/games/WordAscent/WordAscentEngine.js',
  'src/components/games/WordDrop/WordDropEngine.js'
];

paths.forEach(p => {
  if (fs.existsSync(p)) {
    let content = fs.readFileSync(p, 'utf8');
    
    // Check if already patched
    if (content.includes('this.accumulator >=')) {
      console.log('Already patched ' + p);
      return;
    }

    const oldLoopRegex = /gameLoop\(timestamp\)\s*\{[\s\S]*?this\.update\(dt\);[\s\S]*?this\.draw\(\);[\s\S]*?if\s*\(this\.isRunning\)\s*\{[\s\S]*?this\.animationFrameId\s*=\s*requestAnimationFrame\(this\.gameLoop\.bind\(this\)\);[\s\S]*?\}[\s\S]*?\}/;
    
    const newLoop = "gameLoop(timestamp) {\n" +
    "    if (!this.lastTime) this.lastTime = timestamp;\n" +
    "    let realDt = (timestamp - this.lastTime) / 1000;\n" +
    "    if (realDt > 0.1) realDt = 0.1;\n" +
    "    this.lastTime = timestamp;\n\n" +
    "    if (this.accumulator === undefined) this.accumulator = 0;\n" +
    "    this.accumulator += realDt;\n\n" +
    "    const FIXED_DT = 1 / 60;\n" +
    "    while (this.accumulator >= FIXED_DT) {\n" +
    "      this.update(FIXED_DT);\n" +
    "      this.accumulator -= FIXED_DT;\n" +
    "    }\n\n" +
    "    this.draw();\n\n" +
    "    if (this.isRunning) {\n" +
    "      this.animationFrameId = requestAnimationFrame(this.gameLoop.bind(this));\n" +
    "    }\n" +
    "  }";

    if (oldLoopRegex.test(content)) {
      content = content.replace(oldLoopRegex, newLoop);
      fs.writeFileSync(p, content);
      console.log('Patched ' + p);
    } else {
      console.log('Could not find pattern in ' + p);
    }
  } else {
    console.log('File not found: ' + p);
  }
});
