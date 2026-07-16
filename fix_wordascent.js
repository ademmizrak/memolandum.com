const fs = require('fs');
const path = require('path');

const file = path.join(__dirname, 'src/engines/wordascent.shell.js');
let code = fs.readFileSync(file, 'utf8');

// 1. Remove freeze
code = code.replace(
`      if (this.floatingFx.duration <= 0) {
        this.floatingFx.active = false;
        // Proceed vocabulary updates at the end of crawl
        const lastFloor = this.rocketStartFloor + 5;
        this.selectNextWord();
        this.spawnFloorPlatforms(lastFloor + 1);
      }
      return; // Freeze movement during Star Wars Cinematic Clear`,
`      if (this.floatingFx.duration <= 0) {
        this.floatingFx.active = false;
      }`
);

code = code.replace(
`    this.floatingFx = {
      active: true,
      words: words, // List of { english, turkish }
      y: 700,
      duration: 14.0 // 4x slower duration (scaled from 3.5)
    };`,
`    this.floatingFx = {
      active: true,
      words: words, // List of { english, turkish }
      y: 700,
      duration: 2.5 // Screen time
    };

    // Instant level transition (no freeze)
    const lastFloor = this.rocketStartFloor + 5;
    this.selectNextWord();
    this.spawnFloorPlatforms(lastFloor + 1);`
);

// 2. Add challenge mode colors
code = code.replace(
  /if \(isGround\) \{\s+this\.color = '#777777';\s+\} else if \(isCorrect\) \{\s+this\.color = '#39ff14'; \/\/ green correct\s+\} else if \(isFiller\) \{\s+this\.color = '#ffaa00'; \/\/ orange filler\s+\} else \{\s+this\.color = '#ff0055'; \/\/ magenta wrong\s+\}/g,
  `const isChallengeMode = useMemolandumStore.getState().isChallengeMode;
    if (isGround) {
      this.color = '#777777';
    } else if (isChallengeMode) {
      this.color = '#00f0ff'; // Cyan neutral
    } else if (isCorrect) {
      this.color = '#39ff14'; // green correct
    } else if (isFiller) {
      this.color = '#ffaa00'; // orange filler
    } else {
      this.color = '#ff0055'; // magenta wrong
    }`
);

// Inject store import if missing
if (!code.includes('useMemolandumStore')) {
  code = `import { useMemolandumStore } from '../store/useMemolandumStore';\n` + code;
}

fs.writeFileSync(file, code);
console.log('Fixed wordascent.shell.js');
