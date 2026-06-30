const fs = require('fs');
const path = require('path');

const srcPath = path.join('d:', '000Memorade', 'shells', 'shooter.shell.js');
const destPath = path.join('d:', '000Memorade', 'memolandum-web', 'src', 'components', 'games', 'RetroShooter', 'RetroShooterEngine.js');

let code = fs.readFileSync(srcPath, 'utf8');

// 1. Rename class Game to export class ShooterGame
code = code.replace(/^class Game\b/m, 'export class ShooterGame');

// 2. Replace document.getElementById with this.getElementById
code = code.replace(/document\.getElementById/g, 'this.getElementById');

// 3. Replace document.querySelector('.controls-container') with dummy
code = code.replace(/document\.querySelector\('\.controls-container'\)/g, "this.getElementById('controls-container')");

// 4. Inject Virtual DOM into the constructor
const constructorStart = `export class ShooterGame {
  constructor(vocabulary, jsonFileName) {`;

const newConstructorStart = `export class ShooterGame {
  constructor(vocabulary, jsonFileName, canvasElement, callbacks) {
    this.canvas = canvasElement;
    this.ctx = this.canvas.getContext('2d');
    this.callbacks = callbacks || {};
    
    // Create Virtual DOM Elements to decouple from real DOM
    this.vDom = {};
    const getVDom = (id) => {
      if (!this.vDom[id]) {
        this.vDom[id] = {
          classList: {
            add: (cls) => { if (cls === 'hidden') this.callbacks.onScreenChange?.(id, false); },
            remove: (cls) => { if (cls === 'hidden') this.callbacks.onScreenChange?.(id, true); }
          },
          style: {},
          textContent: '',
          innerHTML: '',
          onclick: null,
          addEventListener: () => {},
          appendChild: () => {},
          removeChild: () => {},
          querySelector: () => getVDom(id + '-child')
        };
      }
      return this.vDom[id];
    };
    
    this.getElementById = (id) => {
      if (id === 'gameCanvas') return this.canvas;
      return getVDom(id);
    };
    
    // Proxy for textContent to trigger callbacks when engine updates UI
    Object.defineProperty(getVDom('score-val'), 'textContent', { set: (val) => this.callbacks.onScoreChange?.(val) });
    Object.defineProperty(getVDom('hud-shields'), 'textContent', { set: (val) => this.callbacks.onShieldsChange?.(val) });
    Object.defineProperty(getVDom('level-val'), 'textContent', { set: (val) => this.callbacks.onLevelChange?.(val) });
    Object.defineProperty(getVDom('mastered-val'), 'textContent', { set: (val) => this.callbacks.onMasteredChange?.(val) });
    Object.defineProperty(getVDom('gems-val'), 'textContent', { set: (val) => this.callbacks.onGemsChange?.(val) });
    Object.defineProperty(getVDom('celebration-text'), 'innerHTML', { set: (val) => this.callbacks.onCelebrationTextChange?.(val) });
    Object.defineProperty(getVDom('celebration-countdown'), 'textContent', { set: (val) => this.callbacks.onCountdownChange?.(val) });
    
    // Listen to learned words appending
    const learnedList = getVDom('learned-list');
    learnedList.appendChild = (child) => {
      // It appends a <li> with innerHTML
      this.callbacks.onWordLearned?.(child.innerHTML);
    };
    const victoryList = getVDom('victory-learned-list');
    victoryList.appendChild = (child) => {
      this.callbacks.onWordLearned?.(child.innerHTML);
    };

    // Forward API to React for trigger actions
    this.triggerAction = (actionId) => {
      const el = this.vDom[actionId];
      if (el && typeof el.onclick === 'function') el.onclick();
    };

    // Original properties initialization...
`;

code = code.replace(constructorStart, newConstructorStart);

// Remove the hardcoded canvas fetch (since we pass it in constructor)
code = code.replace(`    this.canvas = this.getElementById('gameCanvas');\n    this.ctx = this.canvas.getContext('2d');\n`, '');

// Remove global bindings
code = code.replace(/window\.Game = Game;[\s\S]*?window\.setGameSpeed = setGameSpeed;/m, '');

// Ensure cleanup stops animation frame and clears callbacks
code = code.replace(/cleanup\(\)\s*\{/, `cleanup() {
    if (this.loopId) cancelAnimationFrame(this.loopId);
    this.callbacks = {};
`);

fs.writeFileSync(destPath, code);
console.log('RetroShooterEngine.js generated successfully.');
