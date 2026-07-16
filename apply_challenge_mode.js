const fs = require('fs');
const path = require('path');

const applyChallengeMode = (engineName) => {
  const file = path.join(__dirname, 'src/engines', engineName + '.shell.js');
  if (!fs.existsSync(file)) return;
  let code = fs.readFileSync(file, 'utf8');

  // Inject store import if missing
  if (!code.includes('useMemolandumStore')) {
    code = `import { useMemolandumStore } from '../../store/useMemolandumStore';\n` + code;
  }

  // Engine specific
  if (engineName === 'highway') {
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
  }

  if (engineName === 'invaders') {
    code = code.replace(
      `this.color = isCorrect ? '#00f0ff' : '#bd00ff';`,
      `const isChallengeMode = useMemolandumStore.getState().isChallengeMode;
    this.color = (isChallengeMode || !isCorrect) ? '#bd00ff' : '#00f0ff';`
    );
  }

  if (engineName === 'breakout') {
    code = code.replace(
      `            const isCorrect = brick.word.isCorrect;
            if (isCorrect && window.examEngine.currentQuestionMissed) {`,
      `            const isCorrect = brick.word.isCorrect;
            const isChallengeMode = useMemolandumStore.getState().isChallengeMode;
            if (isCorrect && window.examEngine.currentQuestionMissed && !isChallengeMode) {`
    );
    code = code.replace(
      `} else if (isCorrect && window.examEngine.currentWord && window.examEngine.currentWord.isSpecial) {`,
      `} else if (isCorrect && window.examEngine.currentWord && window.examEngine.currentWord.isSpecial && !isChallengeMode) {`
    );
  }

  if (engineName === 'wordascent') {
    code = code.replace(
      `    } else if (isCorrect) {
      this.color = '#39ff14'; // Neon green target
    } else if (isFiller) {
      this.color = '#ffaa00'; // Yellow/Orange filler
    } else {
      this.color = '#ff0055'; // Magenta distractor
    }`,
      `    } else {
      const isChallengeMode = useMemolandumStore.getState().isChallengeMode;
      if (isChallengeMode) {
        this.color = '#00f0ff'; // Cyan neutral
      } else if (isCorrect) {
        this.color = '#39ff14'; // Neon green target
      } else if (isFiller) {
        this.color = '#ffaa00'; // Yellow/Orange filler
      } else {
        this.color = '#ff0055'; // Magenta distractor
      }
    }`
    );
  }

  fs.writeFileSync(file, code);
  console.log(engineName + ' updated for challenge mode');
};

['highway', 'invaders', 'breakout', 'wordascent'].forEach(applyChallengeMode);
