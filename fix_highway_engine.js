const fs = require('fs');
const path = require('path');

const file = path.join(__dirname, 'src/components/games/RetroHighway/engine.js');
let code = fs.readFileSync(file, 'utf8');

// Inject store import if missing
if (!code.includes('useMemolandumStore')) {
  code = `import { useMemolandumStore } from '../../../store/useMemolandumStore';\n` + code;
}

code = code.replace(
  `    if (isCorrect) {
      this.color = '#39ff14'; // neon green correct target
    } else if (isFiller) {
      this.color = '#ffaa00'; // orange filler vehicles
    } else {
      this.color = '#ff0055'; // magenta wrong distractors
    }`,
  `    const isChallengeMode = useMemolandumStore.getState().isChallengeMode;
    if (isChallengeMode) {
      this.color = '#00f0ff'; // All same color in challenge mode
    } else {
      if (isCorrect) {
        this.color = '#39ff14'; // neon green correct target
      } else if (isFiller) {
        this.color = '#ffaa00'; // orange filler vehicles
      } else {
        this.color = '#ff0055'; // magenta wrong distractors
      }
    }`
);

fs.writeFileSync(file, code);
console.log('Fixed RetroHighway/engine.js');
