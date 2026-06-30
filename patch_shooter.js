const fs = require('fs');
const path = require('path');

const oldPath = path.join('d:', '000Memorade', 'shells', 'shooter.shell.js');
const newPath = path.join('d:', '000Memorade', 'memolandum-web', 'src', 'engines', 'shooter.shell.js');

let code = fs.readFileSync(oldPath, 'utf8');

// 1. Rename class Game to export class ShooterGame
code = code.replace(/^class Game\b/m, 'export class ShooterGame');

// 3. Patch the constructor
const constructorRegex = /constructor\([^)]*\)\s*\{/;
const constructorMatch = code.match(constructorRegex);

const uiHtml = `
  <div id="retro-shooter-ui-layer" style="position: absolute; top: 0; left: 0; width: 100%; height: 100%; pointer-events: none; z-index: 40;">
    <!-- Retro Filter Overlay -->
    <div class="scanlines"></div>

    <!-- HUD Overlay -->
    <div id="hud" style="pointer-events: auto;">
      <div class="hud-item">
        <span class="hud-label">SHIELDS</span>
        <span id="hud-shields">🛡️ 🛡️ 🛡️</span>
      </div>
      <div class="hud-item">
        <span id="level-label" class="hud-label">LEVEL</span>
        <span id="level-val" class="hud-value">1</span>
      </div>
      <div class="hud-item">
        <span id="mastered-label" class="hud-label">MASTERED</span>
        <span id="mastered-val" class="hud-value">0/10</span>
      </div>
      <div class="hud-item">
        <span class="hud-label">GEMS</span>
        <span id="gems-val" class="hud-value">💎 0</span>
      </div>
      <div class="hud-item">
        <span id="score-label" class="hud-label">SCORE</span>
        <span id="score-val" class="hud-value">0</span>
      </div>
      <div class="hud-item">
        <span class="hud-label">HIGH SCORE</span>
        <span id="high-val" class="hud-value">0</span>
      </div>
      <button id="btn-pause" class="hud-pause-btn" aria-label="Pause Game">⏸</button>
    </div>

    <!-- Start Game UI Overlay -->
    <div id="start-screen" class="screen-overlay hidden" style="pointer-events: auto;">
      <h2 class="game-title">MEMOLANDUM</h2>
      <div class="game-subtitle">CYBER VOCABULARY RETRO SHOTTER</div>
      <div class="instructions-box">
        <p>🛸 Move left/right with <strong>Arrow Keys / A & D</strong> or virtual arrows.</p>
        <p>⚡ Fire lasers with <strong>Spacebar</strong> or the virtual <strong>FIRE</strong> button.</p>
        <p>👾 Blast falling meteors displaying English words.</p>
        <p>💡 Memorize the <strong>neon green Turkish meaning</strong> flashed upon destruction!</p>
        <p>🛡️ Do not let meteors pass! Protect your shields.</p>
      </div>
      <button id="start-btn" class="glow-btn btn-cyan">START SYSTEM</button>
    </div>

    <!-- Game Over UI Overlay -->
    <div id="game-over-screen" class="screen-overlay hidden" style="pointer-events: auto;">
      <h2 class="game-title" style="color: var(--glow-magenta); text-shadow: 0 0 15px rgba(255, 0, 85, 0.6); animation: none;">SYSTEM FAULT</h2>
      <div class="game-subtitle" style="color: #ffffff; text-shadow: none; font-size: 12px; margin-bottom: 20px;">SHIELDS DEPRECIATED</div>
      <div class="score-summary">Your Score: <span id="final-score">0</span></div>
      <div class="words-learned-container">
        <div class="words-learned-title">Vocabulary Encountered This Run</div>
        <ul id="learned-list" class="word-list"></ul>
      </div>
      <button id="restart-btn" class="glow-btn btn-magenta">RESTART SYSTEM</button>
      <button id="menu-btn" class="glow-btn btn-cyan" style="margin-top: 12px; width: 100%; max-width: 200px;">MAIN MENU</button>
    </div>

    <!-- Victory UI Overlay -->
    <div id="victory-screen" class="screen-overlay hidden" style="pointer-events: auto;">
      <h2 class="game-title" style="color: var(--glow-green); text-shadow: 0 0 15px rgba(57, 255, 20, 0.6); animation: none;">SECTOR CLEARED</h2>
      <div class="game-subtitle" style="color: #ffffff; text-shadow: none; font-size: 12px; margin-bottom: 20px;">ALL VOCABULARY MASTERED</div>
      <div class="score-summary">Final Score: <span id="victory-score">0</span></div>
      <div class="words-learned-container">
        <div class="words-learned-title">Mastered Vocabulary</div>
        <ul id="victory-learned-list" class="word-list"></ul>
      </div>
      <button id="victory-next-btn" class="glow-btn btn-yellow hidden" style="margin-bottom: 12px; width: 100%; max-width: 200px;">NEXT SECTOR</button>
      <button id="victory-restart-btn" class="glow-btn btn-green" style="width: 100%; max-width: 200px;">RESTART SYSTEM</button>
      <button id="victory-menu-btn" class="glow-btn btn-cyan" style="margin-top: 12px; width: 100%; max-width: 200px;">MAIN MENU</button>
    </div>

    <!-- Stage Celebration UI Overlay -->
    <div id="celebration-screen" class="screen-overlay hidden" style="pointer-events: auto;">
      <div style="font-size: 50px; margin-bottom: 20px;">🏆</div>
      <h2 class="game-title" style="color: var(--glow-green); text-shadow: 0 0 15px rgba(57, 255, 20, 0.6); font-size: 28px; line-height: 1.3; margin-bottom: 10px;">SECTOR FULLY DECRYPTED</h2>
      <div id="celebration-text" class="game-subtitle" style="color: #ffffff; text-shadow: none; font-size: 15px; margin-bottom: 30px; line-height: 1.6; max-width: 360px;"></div>
      <div style="font-family: var(--font-header); font-size: 12px; color: var(--glow-yellow); margin-bottom: 25px; letter-spacing: 2px;">
        NEXT SECTOR LOADING IN <span id="celebration-countdown">4</span>s
      </div>
      <button id="celebration-skip-btn" class="glow-btn btn-yellow" style="width: 100%; max-width: 220px;">START NOW</button>
    </div>

    <!-- Pause UI Overlay -->
    <div id="pause-screen" class="screen-overlay hidden" style="pointer-events: auto;">
      <h2 class="game-title" style="color: var(--glow-yellow); text-shadow: 0 0 15px rgba(255, 234, 0, 0.6); animation: none;">SYSTEM PAUSED</h2>
      <div class="game-subtitle" style="color: #ffffff; text-shadow: none; font-size: 11px; margin-bottom: 30px; letter-spacing: 1px;">TRAINING TEMPORARILY SUSPENDED</div>
      <button id="resume-btn" class="glow-btn btn-yellow" style="margin-bottom: 12px; width: 100%; max-width: 200px;">RESUME SYSTEM</button>
      <button id="pause-restart-btn" class="glow-btn btn-magenta" style="margin-bottom: 12px; width: 100%; max-width: 200px;">RESTART SYSTEM</button>
      <button id="pause-menu-btn" class="glow-btn btn-cyan" style="width: 100%; max-width: 200px;">MAIN MENU</button>
    </div>

    <!-- Mobile Virtual Controls -->
    <div class="controls-container hidden" style="pointer-events: auto;">
      <div class="d-pad">
        <button id="btn-left" class="control-btn" aria-label="Move Left">◀</button>
        <button id="btn-right" class="control-btn" aria-label="Move Right">▶</button>
      </div>
      <div class="fire-pad">
        <button id="btn-fire" class="fire-btn">FIRE</button>
      </div>
    </div>
  </div>
`;

const newConstructorParams = `constructor(vocabulary, jsonFileName, canvasElement, playAudioCallback) {
    this.canvas = canvasElement;
    this.playAudioCallback = playAudioCallback;
    this.ctx = this.canvas.getContext('2d');
    
    // UI Injection
    this.uiLayer = document.createElement('div');
    this.uiLayer.innerHTML = uiHtml;
    
    if (this.canvas.parentElement) {
      this.canvas.parentElement.appendChild(this.uiLayer);
      this.canvas.parentElement.style.position = 'relative';
    }

    // Wrap document.getElementById to search within this.uiLayer to prevent clashes with base.jsx
    this.getElementById = (id) => {
      if(id === 'gameCanvas') return this.canvas;
      return this.uiLayer.querySelector('#' + id) || document.getElementById(id);
    };
`;

code = code.replace(constructorMatch[0], newConstructorParams);

// 4. Replace document.getElementById(...) with this.getElementById(...) inside ShooterGame
code = code.replace(/document\.getElementById/g, 'this.getElementById');

// 5. Replace document.querySelector('.controls-container')
code = code.replace(/document\.querySelector\\('\\.controls-container'\\)/g, "this.uiLayer.querySelector('.controls-container')");

// 6. Cleanup function patch
// Replace the old cleanup method body to also remove the uiLayer
code = code.replace(/cleanup\(\)\s*\{/, `cleanup() {
    if (this.uiLayer && this.uiLayer.parentElement) {
      this.uiLayer.parentElement.removeChild(this.uiLayer);
    }
`);

// Fix hardcoded canvas assignments
code = code.replace(/this\\.canvas\\s*=\\s*this\\.getElementById\\('gameCanvas'\\);/g, '');
code = code.replace(/this\\.ctx\\s*=\\s*this\\.canvas\\.getContext\\('2d'\\);/g, '');

fs.writeFileSync(newPath, code);
console.log('Patch complete.');
