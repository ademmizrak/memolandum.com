// ----------------------------------------------------
// iOS Safari Zoom & Rubber-Banding Prevention
// ----------------------------------------------------
document.addEventListener('gesturestart', function(e) {
  e.preventDefault();
}, { passive: false });

document.addEventListener('gesturechange', function(e) {
  e.preventDefault();
}, { passive: false });

document.addEventListener('gestureend', function(e) {
  e.preventDefault();
}, { passive: false });

let lastTouchEnd = 0;
let lastTarget = null;
document.addEventListener('touchend', function(e) {
  const now = (new Date()).getTime();
  if (now - lastTouchEnd <= 300 && e.target === lastTarget) {
    e.preventDefault();
  }
  lastTouchEnd = now;
  lastTarget = e.target;
}, { passive: false });



// ----------------------------------------------------
// Memory Efficient Object Pool Pattern
// ----------------------------------------------------
class ObjectPool {
  constructor(factory, reset) {
    this.factory = factory; // Factory function to construct raw instances
    this.reset = reset;     // Reset function to repurpose instances upon reuse
    this.pool = [];
  }

  acquire(...args) {
    let instance;
    if (this.pool.length > 0) {
      instance = this.pool.pop();
    } else {
      instance = this.factory();
    }
    this.reset(instance, ...args);
    instance.active = true;
    return instance;
  }

  release(instance) {
    instance.active = false;
    this.pool.push(instance);
  }
}

// ----------------------------------------------------
// Synthesized Audio System (Web Audio API)
// ----------------------------------------------------
class SoundManager {
  constructor() {
    this.audioCtx = null;
  }

  init() {
    if (!this.audioCtx) {
      try {
        this.audioCtx = new (window.AudioContext || window.webkitAudioContext)();
      } catch (e) {
        console.warn("Web Audio API not supported or blocked in this browser:", e);
        this.audioCtx = null;
      }
    }
    if (this.audioCtx && this.audioCtx.state === 'suspended') {
      this.audioCtx.resume();
    }
  }

  playLaser() {
    this.init();
    if (!this.audioCtx) return;

    const time = this.audioCtx.currentTime;
    const osc = this.audioCtx.createOscillator();
    const gain = this.audioCtx.createGain();

    osc.type = 'sawtooth';
    osc.frequency.setValueAtTime(750, time);
    osc.frequency.exponentialRampToValueAtTime(80, time + 0.12);

    gain.gain.setValueAtTime(0.12, time);
    gain.gain.linearRampToValueAtTime(0.01, time + 0.12);

    osc.connect(gain);
    gain.connect(this.audioCtx.destination);

    osc.start(time);
    osc.stop(time + 0.12);
  }

  playExplosion() {
    this.init();
    if (!this.audioCtx) return;

    const time = this.audioCtx.currentTime;
    const duration = 0.35;

    // White noise node logic for gritty texture
    const bufferSize = this.audioCtx.sampleRate * duration;
    const buffer = this.audioCtx.createBuffer(1, bufferSize, this.audioCtx.sampleRate);
    const data = buffer.getChannelData(0);
    for (let i = 0; i < bufferSize; i++) {
      data[i] = Math.random() * 2 - 1;
    }

    const noiseNode = this.audioCtx.createBufferSource();
    noiseNode.buffer = buffer;

    const filter = this.audioCtx.createBiquadFilter();
    filter.type = 'bandpass';
    filter.frequency.setValueAtTime(250, time);
    filter.frequency.exponentialRampToValueAtTime(45, time + duration);

    const gainNode = this.audioCtx.createGain();
    gainNode.gain.setValueAtTime(0.25, time);
    gainNode.gain.exponentialRampToValueAtTime(0.01, time + duration);

    noiseNode.connect(filter);
    filter.connect(gainNode);
    gainNode.connect(this.audioCtx.destination);

    noiseNode.start(time);
    noiseNode.stop(time + duration);

    // Sub-synth bass frequency sweep for depth/impact
    const bassOsc = this.audioCtx.createOscillator();
    const bassGain = this.audioCtx.createGain();
    bassOsc.type = 'triangle';
    bassOsc.frequency.setValueAtTime(100, time);
    bassOsc.frequency.linearRampToValueAtTime(20, time + duration);

    bassGain.gain.setValueAtTime(0.35, time);
    bassGain.gain.exponentialRampToValueAtTime(0.01, time + duration);

    bassOsc.connect(bassGain);
    bassGain.connect(this.audioCtx.destination);

    bassOsc.start(time);
    bassOsc.stop(time + duration);
  }

  playDamage() {
    this.init();
    if (!this.audioCtx) return;

    const time = this.audioCtx.currentTime;
    const osc = this.audioCtx.createOscillator();
    const gain = this.audioCtx.createGain();

    osc.type = 'sawtooth';
    osc.frequency.setValueAtTime(180, time);
    osc.frequency.setValueAtTime(90, time + 0.12);

    gain.gain.setValueAtTime(0.25, time);
    gain.gain.linearRampToValueAtTime(0.01, time + 0.25);

    osc.connect(gain);
    gain.connect(this.audioCtx.destination);

    osc.start(time);
    osc.stop(time + 0.25);
  }

  playGameOver() {
    this.init();
    if (!this.audioCtx) return;

    const time = this.audioCtx.currentTime;
    const notes = [220, 165, 110];

    notes.forEach((freq, i) => {
      const osc = this.audioCtx.createOscillator();
      const gain = this.audioCtx.createGain();

      osc.type = 'sawtooth';
      osc.frequency.setValueAtTime(freq, time + i * 0.2);

      gain.gain.setValueAtTime(0.2, time + i * 0.2);
      gain.gain.linearRampToValueAtTime(0.01, time + (i + 1) * 0.2);

      osc.connect(gain);
      gain.connect(this.audioCtx.destination);

      osc.start(time + i * 0.2);
      osc.stop(time + (i + 1) * 0.2);
    });
  }

  playStageClear() {
    this.init();
    if (!this.audioCtx) return;

    const time = this.audioCtx.currentTime;
    // Ascending notes arpeggio
    const freqs = [261.63, 329.63, 392.00, 523.25, 659.25, 783.99];
    freqs.forEach((freq, i) => {
      const noteTime = time + i * 0.08;
      const osc = this.audioCtx.createOscillator();
      const gain = this.audioCtx.createGain();

      osc.type = 'triangle';
      osc.frequency.setValueAtTime(freq, noteTime);

      gain.gain.setValueAtTime(0.2, noteTime);
      gain.gain.linearRampToValueAtTime(0.01, noteTime + 0.25);

      osc.connect(gain);
      gain.connect(this.audioCtx.destination);

      osc.start(noteTime);
      osc.stop(noteTime + 0.25);
    });

    // Add a long, bright glowing synth pad at the end
    const padOsc = this.audioCtx.createOscillator();
    const padGain = this.audioCtx.createGain();
    padOsc.type = 'sine';
    padOsc.frequency.setValueAtTime(1046.50, time + 0.48); // High C6
    padGain.gain.setValueAtTime(0, time + 0.48);
    padGain.gain.linearRampToValueAtTime(0.15, time + 0.55);
    padGain.gain.linearRampToValueAtTime(0.01, time + 1.5);
    
    padOsc.connect(padGain);
    padGain.connect(this.audioCtx.destination);
    
    padOsc.start(time + 0.48);
    padOsc.stop(time + 1.5);
  }

  playStageRiser() {
    this.init();
    if (!this.audioCtx) return;

    const time = this.audioCtx.currentTime;
    const osc = this.audioCtx.createOscillator();
    const gain = this.audioCtx.createGain();

    osc.type = 'sawtooth';
    osc.frequency.setValueAtTime(150, time);
    osc.frequency.exponentialRampToValueAtTime(800, time + 1.2);

    gain.gain.setValueAtTime(0.01, time);
    gain.gain.linearRampToValueAtTime(0.08, time + 0.8);
    gain.gain.exponentialRampToValueAtTime(0.001, time + 1.2);

    osc.connect(gain);
    gain.connect(this.audioCtx.destination);

    osc.start(time);
    osc.stop(time + 1.2);
  }

  playGemTick() {
    this.init();
    if (!this.audioCtx) return;

    const time = this.audioCtx.currentTime;
    const osc = this.audioCtx.createOscillator();
    const gain = this.audioCtx.createGain();

    osc.type = 'sine';
    osc.frequency.setValueAtTime(600, time);
    osc.frequency.exponentialRampToValueAtTime(1200, time + 0.05);

    gain.gain.setValueAtTime(0.08, time);
    gain.gain.linearRampToValueAtTime(0.001, time + 0.05);

    osc.connect(gain);
    gain.connect(this.audioCtx.destination);

    osc.start(time);
    osc.stop(time + 0.05);
  }

  playCoinCollect() {
    this.init();
    if (!this.audioCtx) return;

    const time = this.audioCtx.currentTime;
    
    // Play a retro arpeggio chime
    const osc1 = this.audioCtx.createOscillator();
    const gain1 = this.audioCtx.createGain();
    osc1.type = 'square';
    osc1.frequency.setValueAtTime(987.77, time); // B5
    osc1.frequency.setValueAtTime(1318.51, time + 0.08); // E6
    
    gain1.gain.setValueAtTime(0.08, time);
    gain1.gain.linearRampToValueAtTime(0.08, time + 0.08);
    gain1.gain.linearRampToValueAtTime(0.001, time + 0.25);
    
    osc1.connect(gain1);
    gain1.connect(this.audioCtx.destination);
    
    osc1.start(time);
    osc1.stop(time + 0.25);
  }
}

// ----------------------------------------------------
// Game Entities
// ----------------------------------------------------

// Static Background Stars
class Star {
  constructor() {
    this.x = 0;
    this.y = 0;
    this.size = 1;
    this.speed = 10;
  }

  reset(virtualWidth, virtualHeight) {
    this.x = Math.random() * virtualWidth;
    this.y = Math.random() * virtualHeight;
    this.size = Math.random() * 2 + 0.5;
    this.speed = Math.random() * 30 + 15;
  }

  update(dt, virtualWidth, virtualHeight) {
    this.y += this.speed * dt;
    if (this.y > virtualHeight) {
      this.y = 0;
      this.x = Math.random() * virtualWidth;
    }
  }

  draw(ctx) {
    ctx.fillStyle = 'rgba(255, 255, 255, 0.45)';
    ctx.fillRect(this.x, this.y, this.size, this.size);
  }
}

// Player Spaceship
class Player {
  constructor(virtualWidth, virtualHeight) {
    this.virtualWidth = virtualWidth;
    this.virtualHeight = virtualHeight;
    this.width = 54;
    this.height = 36;
    this.x = virtualWidth / 2;
    this.y = 780; // Clamped comfortably above the mobile virtual controls
    this.speed = 460;
    this.cooldown = 0;
    this.cooldownMax = 0.22; // Seconds between laser fires
  }

  reset() {
    this.x = this.virtualWidth / 2;
    this.cooldown = 0;
  }

  update(dt, input) {
    let dx = 0;
    if (input.left) dx = -1;
    if (input.right) dx = 1;

    this.x += dx * this.speed * dt;

    // Clamp movement inside virtual boundaries
    const halfWidth = this.width / 2;
    if (this.x < halfWidth) this.x = halfWidth;
    if (this.x > this.virtualWidth - halfWidth) this.x = this.virtualWidth - halfWidth;

    // Reduce firing cooldown timer
    if (this.cooldown > 0) {
      this.cooldown -= dt;
    }
  }

  canFire() {
    return this.cooldown <= 0;
  }

  resetCooldown() {
    this.cooldown = this.cooldownMax;
  }

  draw(ctx) {
    ctx.save();
    ctx.translate(this.x, this.y);

    // Add cyber glow effect
    ctx.shadowColor = '#00f0ff';
    ctx.shadowBlur = 10;
    ctx.fillStyle = '#00f0ff';
    ctx.strokeStyle = '#00f0ff';
    ctx.lineWidth = 2.5;

    // Render detailed cyberpunk ship geometry
    ctx.beginPath();
    ctx.moveTo(0, -this.height / 2); // Front Nose
    ctx.lineTo(this.width / 2, this.height / 2); // Right wing tip
    ctx.lineTo(this.width / 5, this.height / 4); // Right wing indent
    ctx.lineTo(-this.width / 5, this.height / 4); // Left wing indent
    ctx.lineTo(-this.width / 2, this.height / 2); // Left wing tip
    ctx.closePath();
    ctx.fill();
    ctx.stroke();

    // Thruster core glow (retro neon-magenta fire engine)
    ctx.shadowColor = '#ff0055';
    ctx.fillStyle = '#ff0055';
    ctx.beginPath();
    ctx.arc(-this.width / 5, this.height / 3.2, 4.5 + Math.random() * 3, 0, Math.PI * 2);
    ctx.arc(this.width / 5, this.height / 3.2, 4.5 + Math.random() * 3, 0, Math.PI * 2);
    ctx.fill();

    ctx.restore();
  }
}

// Yellow Projectile (Laser)
class Laser {
  constructor() {
    this.x = 0;
    this.y = 0;
    this.width = 5;
    this.height = 18;
    this.speed = 850;
    this.active = false;
  }

  update(dt) {
    this.y -= this.speed * dt;
    if (this.y < -30) {
      this.active = false;
    }
  }

  draw(ctx) {
    ctx.save();
    ctx.fillStyle = '#ffea00';
    ctx.shadowColor = '#ffea00';
    ctx.shadowBlur = 12;
    ctx.beginPath();
    ctx.roundRect(this.x - this.width / 2, this.y, this.width, this.height, 2.5);
    ctx.fill();
    ctx.restore();
  }
}

// Magenta Falling Target (Meteor)
class Meteor {
  constructor() {
    this.x = 0;
    this.y = 0;
    this.width = 160;
    this.height = 42;
    this.speed = 55;
    this.word = null;
    this.active = false;
    this.hp = 1;
    this.maxHp = 1;
    this.isBoss = false;
  }

  update(dt) {
    this.y += this.speed * dt;
  }

  getTurkishHint() {
    if (!this.word || !this.word.turkish) return "";
    const tr = this.word.turkish;
    if (this.hp === 3) {
      // 0 hits taken: completely hidden
      return tr.split('').map(char => (char === ' ' ? ' ' : '_')).join(' ');
    } else if (this.hp === 2) {
      // 1 hit taken: reveal first 1/3 of characters
      const revealCount = Math.max(1, Math.floor(tr.length / 3));
      return tr.split('').map((char, index) => {
        if (char === ' ') return ' ';
        return index < revealCount ? char : '_';
      }).join(' ');
    } else if (this.hp === 1) {
      // 2 hits taken: reveal 2/3 of characters
      const revealCount = Math.max(2, Math.floor(tr.length * 2 / 3));
      return tr.split('').map((char, index) => {
        if (char === ' ') return ' ';
        return index < revealCount ? char : '_';
      }).join(' ');
    }
    return tr;
  }

  draw(ctx) {
    ctx.save();
    
    const isPlayZone = this.isBoss ? this.y > 50 : this.y > 240;
    const roundedX = Math.round(this.x);
    const roundedY = Math.round(this.y);
    const roundedWidth = Math.round(this.width);
    const roundedHeight = Math.round(this.height);
    
    if (this.isBoss) {
      // Render Boss Meteor with custom premium styling
      ctx.strokeStyle = isPlayZone ? '#00f0ff' : 'rgba(0, 240, 255, 0.35)'; // Cyan neon theme for Boss
      ctx.lineWidth = 4;
      ctx.shadowColor = '#00f0ff';
      ctx.shadowBlur = isPlayZone ? 15 : 0;
      ctx.fillStyle = isPlayZone ? 'rgba(5, 12, 25, 0.95)' : 'rgba(5, 12, 25, 0.5)';
      
      ctx.beginPath();
      ctx.roundRect(roundedX, roundedY, roundedWidth, roundedHeight, 12);
      ctx.fill();
      ctx.stroke();
      
      // Draw a health indicator line at the top of the Boss card
      const hpRatio = this.hp / this.maxHp;
      ctx.fillStyle = hpRatio > 0.5 ? '#39ff14' : (hpRatio > 0.25 ? '#ffea00' : '#ff0055');
      ctx.fillRect(roundedX + 10, roundedY + 8, (roundedWidth - 20) * hpRatio, 5);

      // Render Boss Label
      ctx.fillStyle = '#ff0055';
      ctx.font = '900 11px "Orbitron", sans-serif';
      ctx.textAlign = 'left';
      ctx.fillText("SECTOR BOSS", roundedX + 10, roundedY + 26);
      
      // Render English Word
      ctx.fillStyle = '#ffffff';
      ctx.font = 'bold 22px Arial, sans-serif';
      ctx.textAlign = 'center';
      ctx.textBaseline = 'middle';
      ctx.fillText(this.word.english, roundedX + roundedWidth / 2, roundedY + roundedHeight / 2 + 5);

      // Render Turkish Hint
      ctx.fillStyle = '#ffea00';
      ctx.font = 'bold 15px "Orbitron", sans-serif';
      ctx.fillText(this.getTurkishHint(), roundedX + roundedWidth / 2, roundedY + roundedHeight - 20);
    } else {
      // Render regular meteor
      ctx.strokeStyle = isPlayZone ? '#ff0055' : 'rgba(255, 0, 85, 0.35)';
      ctx.lineWidth = 2.5;
      ctx.shadowColor = '#ff0055';
      ctx.shadowBlur = isPlayZone ? 10 : 0;
      ctx.fillStyle = isPlayZone ? 'rgba(15, 2, 8, 0.85)' : 'rgba(15, 2, 8, 0.35)';
      
      ctx.beginPath();
      ctx.roundRect(roundedX, roundedY, roundedWidth, roundedHeight, 8);
      ctx.fill();
      ctx.stroke();

      // English text rendering
      ctx.fillStyle = isPlayZone ? '#ffffff' : 'rgba(255, 255, 255, 0.4)';
      ctx.shadowBlur = 0;
      ctx.font = isPlayZone ? 'bold 17px Arial, sans-serif' : '16px Arial, sans-serif';
      ctx.textAlign = 'center';
      ctx.textBaseline = 'middle';
      ctx.letterSpacing = '1px';
      
      // Wrap text if it contains spaces (for phrasal verbs, compound words)
      const words = this.word.english.split(' ');
      if (words.length > 1) {
        ctx.font = isPlayZone ? 'bold 13px Arial, sans-serif' : '12px Arial, sans-serif';
        const mid = Math.ceil(words.length / 2);
        const line1 = words.slice(0, mid).join(' ');
        const line2 = words.slice(mid).join(' ');
        ctx.fillText(line1, roundedX + roundedWidth / 2, roundedY + roundedHeight / 2 - 8);
        ctx.fillText(line2, roundedX + roundedWidth / 2, roundedY + roundedHeight / 2 + 8);
      } else {
        ctx.fillText(this.word.english, roundedX + roundedWidth / 2, roundedY + roundedHeight / 2);
      }
    }
    
    ctx.restore();
  }
}

// Impact Visual Feedback Particles
class Particle {
  constructor() {
    this.x = 0;
    this.y = 0;
    this.vx = 0;
    this.vy = 0;
    this.color = '';
    this.alpha = 1;
    this.size = 0;
    this.life = 0;
    this.maxLife = 0;
    this.active = false;
    
    // Confetti physics additions
    this.gravity = 0;
    this.decay = 1.0;
    this.angle = 0;
    this.spin = 0;
    this.isConfetti = false;
  }

  update(dt) {
    this.x += this.vx * dt;
    this.y += this.vy * dt;
    this.vy += this.gravity * dt;
    
    // Apply friction decay
    const friction = Math.pow(this.decay, dt);
    this.vx *= friction;
    this.vy *= friction;
    
    if (this.isConfetti) {
      this.angle += this.spin * dt;
    }

    this.life -= dt * 1000;
    this.alpha = Math.max(0, this.life / this.maxLife);
    if (this.life <= 0) {
      this.active = false;
    }
  }

  draw(ctx) {
    ctx.save();
    ctx.globalAlpha = this.alpha;
    ctx.fillStyle = this.color;
    ctx.shadowColor = this.color;
    ctx.shadowBlur = this.isConfetti ? 2 : 6;
    
    if (this.isConfetti) {
      ctx.translate(this.x, this.y);
      ctx.rotate(this.angle);
      // Draw a rectangular confetti strip
      ctx.fillRect(-this.size, -this.size / 2, this.size * 2, this.size);
    } else {
      ctx.fillRect(this.x - this.size / 2, this.y - this.size / 2, this.size, this.size);
    }
    ctx.restore();
  }
}

// Glowing Progression Reward (Gem)
class Gem {
  constructor() {
    this.x = 0;
    this.y = 0;
    this.size = 12;
    this.active = false;
    this.isLevelCompletionGem = false;
  }

  reset(x, y, isLevelCompletionGem = false) {
    const angle = Math.random() * Math.PI * 2;
    const radius = Math.random() * 60;
    this.x = x + Math.cos(angle) * radius;
    this.y = y + Math.sin(angle) * radius;
    this.active = true;
    this.isLevelCompletionGem = isLevelCompletionGem;
  }

  update(dt, playerX, playerY) {
    // Magnet (Homing) speed is 0.05 lerp factor (60fps normalized)
    const rate = 1 - Math.pow(1 - 0.05, dt * 60);
    this.x += (playerX - this.x) * rate;
    this.y += (playerY - this.y) * rate;
  }

  draw(ctx) {
    ctx.save();
    ctx.translate(this.x, this.y);
    
    // Glowing emerald green diamond
    ctx.shadowColor = '#39ff14';
    ctx.shadowBlur = 10;
    ctx.fillStyle = '#39ff14';
    ctx.strokeStyle = '#ffffff';
    ctx.lineWidth = 1.5;

    ctx.beginPath();
    ctx.moveTo(0, -this.size / 2);
    ctx.lineTo(this.size / 2, 0);
    ctx.lineTo(0, this.size / 2);
    ctx.lineTo(-this.size / 2, 0);
    ctx.closePath();
    ctx.fill();
    ctx.stroke();

    ctx.restore();
  }

  checkPlayerCollision(player) {
    const dx = this.x - player.x;
    const dy = this.y - player.y;
    const distance = Math.sqrt(dx * dx + dy * dy);
    return distance < 25; // Player bounding radius
  }
}

// ----------------------------------------------------
// Prefetching and Stage Chaining System
// ----------------------------------------------------
let prefetchPromise = null;
let prefetchedData = null;

function prefetchStageData(jsonFileName) {
  prefetchedData = null;
  prefetchPromise = fetch(`./data/${jsonFileName}`)
    .then(response => {
      if (!response.ok) throw new Error(`File not found: ./data/${jsonFileName}`);
      return response.json();
    })
    .then(data => {
      prefetchedData = data;
      return data;
    })
    .catch(error => {
      console.warn(`Prefetch failed for ${jsonFileName}. Checking fallback embedded dataset. Error details:`, error);
      if (typeof FALLBACK_DATA !== 'undefined' && FALLBACK_DATA[jsonFileName]) {
        prefetchedData = FALLBACK_DATA[jsonFileName];
        return FALLBACK_DATA[jsonFileName];
      }
      throw error;
    });
}

function getStageDisplayName(jsonFileName) {
  const Names = {
    'a1_words.json': 'A1 - Beginner',
    'a2_words.json': 'A2 - Elementary',
    'b1_words.json': 'B1 - Intermediate',
    'b2_words.json': 'B2 - Upper Intermediate',
    'phrasal_verbs.json': 'Phrasal Verbs',
    'conjunctions.json': 'Conjunctions',
    'academic_verbs.json': 'Advanced Verbs',
    'prepositions.json': 'Prepositions',
    'abstract_adjectives.json': 'Abstract Adjectives'
  };
  return Names[jsonFileName] || 'UNKNOWN';
}

function updateMainMenuResumeUI() {
  const savedStage = localStorage.getItem('memolandum_saved_stage');
  const savedLevel = parseInt(localStorage.getItem('memolandum_saved_level')) || 1;
  
  const resumeContainer = document.getElementById('resume-container');
  const resumeStageText = document.getElementById('resume-stage-text');
  const resumeLevelText = document.getElementById('resume-level-text');
  
  if (savedStage) {
    if (resumeContainer) resumeContainer.classList.remove('hidden');
    if (resumeStageText) {
      resumeStageText.textContent = getStageDisplayName(savedStage);
    }
    if (resumeLevelText) {
      resumeLevelText.textContent = savedLevel;
    }
  } else {
    if (resumeContainer) resumeContainer.classList.add('hidden');
  }
}

// ----------------------------------------------------
// Core Game Manager Class
// ----------------------------------------------------
class Game {
  constructor(vocabulary, jsonFileName) {
    this.canvas = document.getElementById('gameCanvas');
    this.ctx = this.canvas.getContext('2d');
    
    this.vocabulary = vocabulary; // Specific loaded words category
    this.jsonFileName = jsonFileName; // Sector JSON file name

    // Virtual resolution design settings (maintains responsive proportions)
    this.virtualWidth = 600;
    this.virtualHeight = 1000;
    this.scaleX = 1;
    this.scaleY = 1;

    this.soundManager = new SoundManager();
    this.player = new Player(this.virtualWidth, this.virtualHeight);

    // Speed control setup
    this.speedMultiplier = 1.0;
    if (window.selectedSpeed === 'slow') {
      this.speedMultiplier = 0.7;
    } else if (window.selectedSpeed === 'fast') {
      this.speedMultiplier = 1.4;
    }
    this.player.speed = 460 * this.speedMultiplier;

    // Quit confirmation flags
    this.confirmQuitActive = false;
    this.confirmQuitTimeoutId = null;

    // Pools initialization
    this.laserPool = new ObjectPool(
      () => new Laser(),
      (laser, x, y) => {
        laser.x = x;
        laser.y = y;
        laser.active = true;
        laser.speed = 850 * this.speedMultiplier;
      }
    );

    this.meteorPool = new ObjectPool(
      () => new Meteor(),
      (meteor, x, y, word, speed, isBoss = false) => {
        meteor.x = x;
        meteor.y = y;
        meteor.word = word;
        meteor.speed = speed;
        meteor.isBoss = isBoss;
        if (isBoss) {
          meteor.hp = 3;
          meteor.maxHp = 3;
          meteor.width = 300; // Giant Boss size
          meteor.height = 100;
        } else {
          meteor.hp = 1;
          meteor.maxHp = 1;
          meteor.width = Math.max(160, word.english.length * 14 + 30);
          meteor.height = 42;
        }
        meteor.active = true;
      }
    );

    this.particlePool = new ObjectPool(
      () => new Particle(),
      (particle, x, y, color, isConfetti = false) => {
        particle.x = x;
        particle.y = y;
        particle.color = color;
        particle.alpha = 1;
        particle.active = true;
        particle.isConfetti = isConfetti;

        if (isConfetti) {
          const angle = Math.random() * Math.PI * 2;
          const speed = Math.random() * 250 + 150;
          particle.vx = Math.cos(angle) * speed;
          particle.vy = Math.sin(angle) * speed - 150; // bias upwards
          particle.gravity = 280;
          particle.decay = 0.5; // air resistance
          particle.size = Math.random() * 5 + 3.5;
          particle.life = Math.random() * 800 + 1400; // longer life
          particle.maxLife = particle.life;
          particle.angle = Math.random() * Math.PI * 2;
          particle.spin = (Math.random() - 0.5) * 8;
        } else {
          const angle = Math.random() * Math.PI * 2;
          const speed = Math.random() * 200 + 75;
          particle.vx = Math.cos(angle) * speed;
          particle.vy = Math.sin(angle) * speed;
          particle.gravity = 0;
          particle.decay = 1.0;
          particle.size = Math.random() * 5 + 2.5;
          particle.life = Math.random() * 300 + 300;
          particle.maxLife = particle.life;
          particle.angle = 0;
          particle.spin = 0;
        }
      }
    );

    this.gemPool = new ObjectPool(
      () => new Gem(),
      (gem, x, y, isLevelCompletionGem = false) => {
        gem.reset(x, y, isLevelCompletionGem);
      }
    );

    // Active items arrays
    this.activeLasers = [];
    this.activeMeteors = [];
    this.activeParticles = [];
    this.activeGems = [];
    this.stars = [];
    
    // Setup starfield
    for (let i = 0; i < 60; i++) {
      const star = new Star();
      star.reset(this.virtualWidth, this.virtualHeight);
      // Distribute stars randomly across screen height on start
      star.y = Math.random() * this.virtualHeight;
      this.stars.push(star);
    }

    // Gameplay state values
    this.state = 'start'; // States: 'start', 'playing', 'gameover', 'victory'
    this.score = 0;
    this.highScore = parseInt(localStorage.getItem('memolandum_high_score')) || 0;
    this.shields = 3;
    this.wordsLearnedThisRun = [];
    this.collectedGems = parseInt(localStorage.getItem('memolandum_collected_gems')) || 0;
    this.gemsCollectedThisLevel = 0;

    // Level and spaced repetition properties
    this.currentLevel = 1;
    this.chunkIndex = 0; // Index of the unmastered 10-word chunk in the current file
    this.wordsPerLevel = 12;
    this.activeChunk = [];
    this.isLevelTransitioning = false;
    this.levelCompleteTimer = 0;
    this.bossSpawned = false; // boss spawn tracking flag

    // Stage celebration properties
    this.isCelebrationActive = false;
    this.celebrationNextStage = null;
    this.celebrationIntervalId = null;

    // Game loop control values
    this.lastTime = 0;
    this.spawnTimer = 999; // Spawn immediately on first frame
    this.spawnInterval = 3.2; // Seconds between spawns (longer for readability)
    this.hitPauseUntil = 0; // Epoch timestamp (ms) for hit-stop freeze effect
    this.screenShake = 0; // Camera shake intensity (decaying over time)
    this.riserPlayed = false; // Tracks if stage transition riser sound played

    // Neon Green learning effect states
    this.flashMessage = null; // Stores { english, turkish }
    this.flashTimeRemaining = 0; // Duration left to draw flash message
    this.isPaused = false; // Pause overlay state tracking

    // Controller bindings state
    this.input = {
      left: false,
      right: false,
      fire: false
    };

    // Cache elements
    this.scoreValEl = document.getElementById('score-val');
    this.highValEl = document.getElementById('high-val');
    this.shieldsEl = document.getElementById('hud-shields');
    this.startScreenEl = document.getElementById('start-screen');
    this.gameOverScreenEl = document.getElementById('game-over-screen');
    this.finalScoreEl = document.getElementById('final-score');
    this.learnedListEl = document.getElementById('learned-list');

    // Set Highscore UI immediately
    this.highValEl.textContent = this.highScore;

    this.bindEvents();
    this.resize();
    
    // Start RequestAnimationFrame ticker
    requestAnimationFrame((time) => this.gameLoop(time));
  }

  loadLevelChunk() {
    const start = this.chunkIndex * this.wordsPerLevel;
    const chunkWords = this.vocabulary.slice(start, start + this.wordsPerLevel);
    
    if (chunkWords.length === 0) {
      return false;
    }
    
    this.activeChunk = chunkWords.map(w => ({
      ...w,
      hitCount: 0
    }));
    return true;
  }

  getSectorShortCode(jsonFileName) {
    const ShortCodes = {
      'a1_words.json': 'A1',
      'a2_words.json': 'A2',
      'b1_words.json': 'B1',
      'b2_words.json': 'B2',
      'phrasal_verbs.json': 'PV',
      'conjunctions.json': 'CONJ',
      'academic_verbs.json': 'AV',
      'prepositions.json': 'PREP',
      'abstract_adjectives.json': 'ADJ'
    };
    return ShortCodes[jsonFileName] || 'SEC';
  }

  updateHUD() {
    if (this.scoreValEl) this.scoreValEl.textContent = this.score;
    if (this.highValEl) this.highValEl.textContent = this.highScore;
    
    this.updateShieldsHUD();
    
    const levelValEl = document.getElementById('level-val');
    const masteredValEl = document.getElementById('mastered-val');
    const gemsValEl = document.getElementById('gems-val');

    const levelLabelEl = document.getElementById('level-label');
    const masteredLabelEl = document.getElementById('mastered-label');
    const scoreLabelEl = document.getElementById('score-label');

    // Restore standard labels
    if (levelLabelEl) levelLabelEl.textContent = 'LEVEL';
    if (masteredLabelEl) masteredLabelEl.textContent = 'MASTERED';
    if (scoreLabelEl) scoreLabelEl.textContent = 'SCORE';
    
    if (levelValEl) {
      const code = this.getSectorShortCode(this.jsonFileName);
      const totalChunks = Math.max(1, Math.ceil(this.vocabulary.length / this.wordsPerLevel));
      levelValEl.textContent = `${code} (${this.chunkIndex + 1}/${totalChunks})`;
    }
    if (masteredValEl && this.activeChunk) {
      const masteredCount = this.activeChunk.filter(w => w.hitCount >= 3).length;
      masteredValEl.textContent = `${masteredCount}/${this.activeChunk.length}`;
    }
    if (gemsValEl) {
      gemsValEl.textContent = `💎 ${this.collectedGems}`;
    }
  }

  bindEvents() {
    // Window responsiveness
    window.addEventListener('resize', () => this.resize());

    // Keyboard Controllers
    window.addEventListener('keydown', (e) => {
      if (this.state === 'playing' || this.state === 'exam') {
        if (e.key === 'ArrowLeft' || e.key === 'a' || e.key === 'A') {
          this.input.left = true;
          e.preventDefault();
        }
        if (e.key === 'ArrowRight' || e.key === 'd' || e.key === 'D') {
          this.input.right = true;
          e.preventDefault();
        }
        if (e.key === ' ' || e.key === 'Spacebar') {
          this.input.fire = true;
          e.preventDefault();
        }
        if ((e.key === 'Escape' || e.key === 'p' || e.key === 'P') && (this.state === 'playing' || this.state === 'exam')) {
          this.togglePause();
          e.preventDefault();
        }
      }
    });

    window.addEventListener('keyup', (e) => {
      if (e.key === 'ArrowLeft' || e.key === 'a' || e.key === 'A') {
        this.input.left = false;
      }
      if (e.key === 'ArrowRight' || e.key === 'd' || e.key === 'D') {
        this.input.right = false;
      }
      if (e.key === ' ' || e.key === 'Spacebar') {
        this.input.fire = false;
      }
    });

    // Setup Virtual UI Buttons (Touch & Mouse compat)
    this.bindButton('btn-left', 'left');
    this.bindButton('btn-right', 'right');
    this.bindButton('btn-fire', 'fire');

    // Screen Action buttons
    document.getElementById('start-btn').onclick = () => this.startGame();
    document.getElementById('restart-btn').onclick = () => this.startGame();

    // Bind Pause UI buttons
    document.getElementById('btn-pause').onclick = () => this.togglePause();
    document.getElementById('resume-btn').onclick = () => this.togglePause();
    
    const pauseExamBtn = document.getElementById('pause-exam-btn');
    if (pauseExamBtn) {
      pauseExamBtn.onclick = () => {
        this.state = 'exam';
        this.isPaused = false;
        document.getElementById('pause-screen').classList.add('hidden');
        
        if (!window.examEngine) {
          window.examEngine = new ExamEngine();
        }
        window.examEngine.startSession(this.vocabulary, this);
      };
    }
    document.getElementById('pause-menu-btn').onclick = () => {
      const pauseMenuBtn = document.getElementById('pause-menu-btn');
      if (!this.confirmQuitActive) {
        // First click: switch to confirm state
        this.confirmQuitActive = true;
        pauseMenuBtn.textContent = 'CONFIRM QUIT?';
        pauseMenuBtn.classList.remove('btn-cyan');
        pauseMenuBtn.classList.add('btn-magenta');
        
        this.confirmQuitTimeoutId = setTimeout(() => {
          this.confirmQuitActive = false;
          pauseMenuBtn.textContent = 'MAIN MENU';
          pauseMenuBtn.classList.remove('btn-magenta');
          pauseMenuBtn.classList.add('btn-cyan');
        }, 3000);
      } else {
        // Second click: confirm and exit
        clearTimeout(this.confirmQuitTimeoutId);
        this.confirmQuitActive = false;
        
        // Revert styles immediately so they are reset for next pause
        pauseMenuBtn.textContent = 'MAIN MENU';
        pauseMenuBtn.classList.remove('btn-magenta');
        pauseMenuBtn.classList.add('btn-cyan');
        
        this.isPaused = false;
        document.getElementById('pause-screen').classList.add('hidden');
        
        const pauseBtn = document.getElementById('btn-pause');
        pauseBtn.textContent = '⏸';
        pauseBtn.style.color = 'var(--glow-cyan)';
        pauseBtn.style.borderColor = 'var(--border-color)';
        
        cancelAnimationFrame(this.loopId);
        this.cleanup();
        window.game = null;
        this.state = 'start';
        
        document.getElementById('hud').classList.add('hidden');
        document.getElementById('gameCanvas').classList.add('hidden');
        document.querySelector('.controls-container').classList.add('hidden');
        showMainMenu();
        updateMainMenuResumeUI();
      }
    };

    // Victory Screen buttons
    const victoryRestartBtn = document.getElementById('victory-restart-btn');
    if (victoryRestartBtn) {
      victoryRestartBtn.onclick = () => {
        document.getElementById('victory-screen').classList.add('hidden');
        this.startGame();
      };
    }

    const victoryNextBtn = document.getElementById('victory-next-btn');
    if (victoryNextBtn) {
      victoryNextBtn.onclick = () => {
        const nextSector = victoryNextBtn.dataset.nextSector;
        if (nextSector) {
          document.getElementById('victory-screen').classList.add('hidden');
          loadLevel(nextSector, true);
        }
      };
    }

    const victoryMenuBtn = document.getElementById('victory-menu-btn');
    if (victoryMenuBtn) {
      victoryMenuBtn.onclick = () => {
        document.getElementById('victory-screen').classList.add('hidden');
        cancelAnimationFrame(this.loopId);
        this.cleanup();
        window.game = null;
        this.state = 'start';
        document.getElementById('hud').classList.add('hidden');
        document.getElementById('gameCanvas').classList.add('hidden');
        document.querySelector('.controls-container').classList.add('hidden');
        showMainMenu();
        updateMainMenuResumeUI();
      };
    }
  }

  bindButton(elementId, inputProperty) {
    const btn = document.getElementById(elementId);
    
    // Touch events
    btn.addEventListener('touchstart', (e) => {
      this.input[inputProperty] = true;
      e.preventDefault();
    }, { passive: false });

    btn.addEventListener('touchend', (e) => {
      this.input[inputProperty] = false;
      e.preventDefault();
    }, { passive: false });

    btn.addEventListener('touchcancel', (e) => {
      this.input[inputProperty] = false;
      e.preventDefault();
    }, { passive: false });

    // Mouse fallbacks for desktop emulation clicks
    btn.addEventListener('mousedown', () => {
      this.input[inputProperty] = true;
    });

    btn.addEventListener('mouseup', () => {
      this.input[inputProperty] = false;
    });

    btn.addEventListener('mouseleave', () => {
      this.input[inputProperty] = false;
    });
  }

  resize() {
    const rect = this.canvas.parentElement.getBoundingClientRect();
    const dpr = window.devicePixelRatio || 1;

    // Apply scale based on DPR for retina screens
    this.canvas.width = rect.width * dpr;
    this.canvas.height = rect.height * dpr;
    this.ctx.scale(dpr, dpr);

    // Determine logical resolution scales relative to parent container sizing
    this.scaleX = rect.width / this.virtualWidth;
    this.scaleY = rect.height / this.virtualHeight;
  }

  startGame() {
    this.soundManager.init();
    
    // Reset game stats
    this.score = window.sessionScore || 0;
    this.shields = 3;
    this.wordsLearnedThisRun = [];
    
    // Reset level and chunking properties
    this.currentLevel = window.sessionLevel || 1;
    
    if (window.resumeLevelIndex !== undefined && window.resumeLevelIndex !== null) {
      this.chunkIndex = window.resumeLevelIndex;
      window.resumeLevelIndex = null; // Clear it
    } else {
      this.chunkIndex = 0;
    }
    
    this.isLevelTransitioning = false;
    this.levelCompleteTimer = 0;
    this.bossSpawned = false;
    this.loadLevelChunk();
    this.updateHUD();

    // Save current progress to local storage so F5/refresh persists the start level
    localStorage.setItem('memolandum_saved_stage', this.jsonFileName);
    localStorage.setItem('memolandum_saved_level', this.chunkIndex + 1);
    localStorage.setItem('memolandum_saved_score', this.score);
    updateMainMenuResumeUI();

    // Release all active entities back to their respective pools
    this.activeLasers.forEach(l => this.laserPool.release(l));
    this.activeMeteors.forEach(m => this.meteorPool.release(m));
    this.activeParticles.forEach(p => this.particlePool.release(p));
    this.activeGems.forEach(g => this.gemPool.release(g));

    this.activeLasers = [];
    this.activeMeteors = [];
    this.activeParticles = [];
    this.activeGems = [];
    this.gemsCollectedThisLevel = 0;

    this.player.reset();
    this.spawnTimer = 999; // Spawn immediately on first frame
    this.spawnInterval = 3.2;
    this.flashMessage = null;
    this.flashTimeRemaining = 0;
    this.hitPauseUntil = 0;

    // Clear controls state
    this.input.left = false;
    this.input.right = false;
    this.input.fire = false;

    // Visual overlays switch
    this.startScreenEl.classList.add('hidden');
    this.gameOverScreenEl.classList.add('hidden');
    const victoryScreen = document.getElementById('victory-screen');
    if (victoryScreen) {
      victoryScreen.classList.add('hidden');
    }
    
    this.state = 'playing';
    this.lastTime = performance.now();
  }

  gameOver() {
    this.state = 'gameover';
    this.soundManager.playGameOver();

    // Display scores and vocab badges in overlay
    this.finalScoreEl.textContent = this.score;
    this.learnedListEl.innerHTML = '';

    if (this.wordsLearnedThisRun.length === 0) {
      const emptyLi = document.createElement('li');
      emptyLi.style.fontSize = '12px';
      emptyLi.style.color = 'rgba(255,255,255,0.4)';
      emptyLi.textContent = "None. Hit some meteors to learn!";
      this.learnedListEl.appendChild(emptyLi);
    } else {
      this.wordsLearnedThisRun.forEach(word => {
        const badge = document.createElement('li');
        badge.className = 'word-badge';
        badge.textContent = word.english;

        const tooltip = document.createElement('span');
        tooltip.className = 'tooltip';
        tooltip.textContent = word.turkish;
        
        badge.appendChild(tooltip);
        this.learnedListEl.appendChild(badge);
      });
    }

    this.gameOverScreenEl.classList.remove('hidden');
  }

  decreaseShields() {
    this.shields--;
    this.updateShieldsHUD();
    
    if (this.shields <= 0) {
      this.gameOver();
    }
  }

  updateShieldsHUD() {
    let shieldsStr = '';
    for (let i = 0; i < 3; i++) {
      shieldsStr += (i < this.shields) ? '🛡️ ' : '💀 ';
    }
    this.shieldsEl.textContent = shieldsStr;
  }

  spawnMeteor() {
    if (this.isLevelTransitioning) return;

    const eligibleWords = this.activeChunk.filter(w => {
      const activeCount = this.activeMeteors.filter(m => m.word.english === w.english).length;
      return (w.hitCount + activeCount) < 3;
    });
    if (eligibleWords.length === 0) return;

    const randomIndex = Math.floor(Math.random() * eligibleWords.length);
    const word = eligibleWords[randomIndex];

    // Random horizontal coordinate clamping inside virtualWidth
    // Width will be computed inside pool reset based on the character length
    const tempWidth = Math.max(160, word.english.length * 14 + 30);
    const x = Math.random() * (this.virtualWidth - tempWidth);
    const y = -60;

    // Comfortable falling speeds (slightly increased to maintain interest) scaled by speedMultiplier
    const speed = (55 + Math.min(30, this.score * 0.45)) * this.speedMultiplier;
    const meteor = this.meteorPool.acquire(x, y, word, speed);
    
    this.activeMeteors.push(meteor);
  }

  spawnExplosion(x, y, color) {
    for (let i = 0; i < 18; i++) {
      const particle = this.particlePool.acquire(x, y, color);
      this.activeParticles.push(particle);
    }
  }

  spawnMasteredGems(x, y, count = 10) {
    this.gemsCollectedThisLevel = 0; // Reset for this wave
    for (let i = 0; i < count; i++) {
      const gem = this.gemPool.acquire(x, y, true); // true = isLevelCompletionGem
      this.activeGems.push(gem);
    }
  }

  spawnWordMasteryGem(x, y) {
    const gem = this.gemPool.acquire(x, y, false); // false = isWordMasteryGem (spawns 1 gem)
    this.activeGems.push(gem);
  }

  updateGems(dt) {
    for (let i = this.activeGems.length - 1; i >= 0; i--) {
      const gem = this.activeGems[i];
      gem.update(dt, this.player.x, this.player.y);
      
      if (gem.checkPlayerCollision(this.player)) {
        this.soundManager.playGemTick();
        this.collectedGems++;
        localStorage.setItem('memolandum_collected_gems', this.collectedGems);
        
        if (gem.isLevelCompletionGem) {
          this.gemsCollectedThisLevel++;
          if (this.gemsCollectedThisLevel === 10) {
            this.soundManager.playCoinCollect();
          }
        }
        
        this.updateHUD();
        this.gemPool.release(gem);
        this.activeGems.splice(i, 1);
      }
    }
  }

  checkLaserMeteorCollision(laser, meteor) {
    const lMinX = laser.x - laser.width / 2;
    const lMaxX = laser.x + laser.width / 2;
    const lMinY = laser.y;
    const lMaxY = laser.y + laser.height;

    const mMinX = meteor.x;
    const mMaxX = meteor.x + meteor.width;
    const mMinY = meteor.y;
    const mMaxY = meteor.y + meteor.height;

    return lMinX < mMaxX &&
           lMaxX > mMinX &&
           lMinY < mMaxY &&
           lMaxY > mMinY;
  }

  gameLoop(currentTime) {
    // Handle RequestAnimationFrame cycling
    this.loopId = requestAnimationFrame((time) => this.gameLoop(time));

    if (!this.lastTime) this.lastTime = Math.max(0, currentTime - 16.6); // guard against large time steps on start
    let dt = (currentTime - this.lastTime) / 1000;
    this.lastTime = currentTime;

    // Cap dt to prevent massive jumps when switching tabs
    if (dt > 0.1) dt = 0.1;

    if (this.state !== 'playing' && this.state !== 'exam') {
      // If start or gameover states, just update background stars and draw
      this.stars.forEach(star => star.update(dt, this.virtualWidth, this.virtualHeight));
      this.draw();
      return;
    }

    // Skip calculations and updates when system is paused
    if (this.isPaused) {
      this.draw();
      return;
    }

    // Implementation of 200ms Hit-Pause impact freeze frame
    if (performance.now() < this.hitPauseUntil) {
      // Render frozen state visually (skipping gameplay updates)
      this.draw();
      return;
    }

    this.update(dt);
    this.draw();
  }

  triggerLevelComplete() {
    this.isLevelTransitioning = true;
    this.levelCompleteTimer = 3.0; // 3 seconds transition
    this.riserPlayed = false;

    // Release active meteors and lasers to pool
    this.activeMeteors.forEach(m => this.meteorPool.release(m));
    this.activeLasers.forEach(l => this.laserPool.release(l));
    this.activeMeteors = [];
    this.activeLasers = [];

    // Play synthetic fanfare
    this.soundManager.playStageClear();

    // Shake the camera
    this.screenShake = 12;

    // Spawn 80 confetti particles radiating from the center of the virtual canvas
    const colors = ['#00f0ff', '#ff0055', '#ffea00', '#39ff14'];
    const cx = this.virtualWidth / 2;
    const cy = this.virtualHeight / 2 - 50;
    for (let i = 0; i < 80; i++) {
      const randColor = colors[Math.floor(Math.random() * colors.length)];
      const particle = this.particlePool.acquire(cx, cy, randColor, true); // true = isConfetti
      this.activeParticles.push(particle);
    }
  }

  getNextSector() {
    const SECTOR_ORDER = [
      'a1_words.json',
      'a2_words.json',
      'b1_words.json',
      'b2_words.json',
      'phrasal_verbs.json',
      'conjunctions.json',
      'academic_verbs.json',
      'prepositions.json',
      'abstract_adjectives.json'
    ];
    const index = SECTOR_ORDER.indexOf(this.jsonFileName);
    if (index !== -1 && index < SECTOR_ORDER.length - 1) {
      return SECTOR_ORDER[index + 1];
    }
    return null;
  }

  triggerVictory() {
    this.state = 'victory';
    
    // Show Victory Overlay
    const victoryScreen = document.getElementById('victory-screen');
    if (victoryScreen) {
      victoryScreen.classList.remove('hidden');
    }
    
    // Reset Title and Subtitle to default values in case they were modified by final victory
    const victoryTitle = victoryScreen.querySelector('.game-title');
    const victorySubtitle = victoryScreen.querySelector('.game-subtitle');
    if (victoryTitle) {
      victoryTitle.textContent = "SECTOR CLEARED";
      victoryTitle.style.color = "var(--glow-green)";
      victoryTitle.style.textShadow = "0 0 15px rgba(57, 255, 20, 0.6)";
    }
    if (victorySubtitle) {
      victorySubtitle.textContent = "ALL VOCABULARY MASTERED";
    }
    
    // Handle Next Sector Button
    const nextSector = this.getNextSector();
    const nextBtn = document.getElementById('victory-next-btn');
    if (nextBtn) {
      if (nextSector) {
        nextBtn.classList.remove('hidden');
        nextBtn.dataset.nextSector = nextSector;
      } else {
        nextBtn.classList.add('hidden');
      }
    }

    // Display score
    const victoryScoreEl = document.getElementById('victory-score');
    if (victoryScoreEl) {
      victoryScoreEl.textContent = this.score;
    }
    
    // Display mastered words
    const victoryLearnedList = document.getElementById('victory-learned-list');
    if (victoryLearnedList) {
      victoryLearnedList.innerHTML = '';
      this.vocabulary.forEach(word => {
        const badge = document.createElement('li');
        badge.className = 'word-badge';
        badge.textContent = word.english;

        const tooltip = document.createElement('span');
        tooltip.className = 'tooltip';
        tooltip.textContent = word.turkish;
        
        badge.appendChild(tooltip);
        victoryLearnedList.appendChild(badge);
      });
    }
  }

  isCoreStage(jsonFileName) {
    return ['a1_words.json', 'a2_words.json', 'b1_words.json', 'b2_words.json'].includes(jsonFileName);
  }

  getNextCoreStage(jsonFileName) {
    const CORE_CHAIN = ['a1_words.json', 'a2_words.json', 'b1_words.json', 'b2_words.json'];
    const index = CORE_CHAIN.indexOf(jsonFileName);
    if (index !== -1 && index < CORE_CHAIN.length - 1) {
      return CORE_CHAIN[index + 1];
    }
    return null;
  }

  cleanup() {
    // Clear celebration interval if active
    if (this.celebrationIntervalId) {
      clearInterval(this.celebrationIntervalId);
      this.celebrationIntervalId = null;
    }

    // Release active entities back to their respective pools
    if (this.activeLasers) {
      this.activeLasers.forEach(l => this.laserPool.release(l));
      this.activeLasers = [];
    }
    if (this.activeMeteors) {
      this.activeMeteors.forEach(m => this.meteorPool.release(m));
      this.activeMeteors = [];
    }
    if (this.activeParticles) {
      this.activeParticles.forEach(p => this.particlePool.release(p));
      this.activeParticles = [];
    }
    if (this.activeGems) {
      this.activeGems.forEach(g => this.gemPool.release(g));
      this.activeGems = [];
    }

    // Dereference arrays and objects for garbage collection
    this.vocabulary = null;
    this.activeChunk = null;
    this.stars = [];
    this.player = null;
    this.soundManager = null;
  }

  triggerStageCelebration(nextStage) {
    this.isCelebrationActive = true;
    this.celebrationNextStage = nextStage;
    
    // Release active meteors and lasers to pool
    this.activeMeteors.forEach(m => this.meteorPool.release(m));
    this.activeLasers.forEach(l => this.laserPool.release(l));
    this.activeMeteors = [];
    this.activeLasers = [];

    // Play synthetic fanfare
    this.soundManager.playStageClear();

    // Shake the camera
    this.screenShake = 15;

    // Spawn initial burst of 100 confetti particles
    const colors = ['#00f0ff', '#ff0055', '#ffea00', '#39ff14'];
    const cx = this.virtualWidth / 2;
    const cy = this.virtualHeight / 2 - 50;
    for (let i = 0; i < 100; i++) {
      const randColor = colors[Math.floor(Math.random() * colors.length)];
      const particle = this.particlePool.acquire(cx, cy, randColor, true); // true = isConfetti
      this.activeParticles.push(particle);
    }

    // Prefetch the next stage JSON in background
    prefetchStageData(nextStage);

    // Save progress immediately to localStorage
    localStorage.setItem('memolandum_saved_stage', nextStage);
    localStorage.setItem('memolandum_saved_level', 1);
    localStorage.setItem('memolandum_saved_score', this.score);
    updateMainMenuResumeUI();

    // Show the celebration DOM Overlay
    const celebrationScreen = document.getElementById('celebration-screen');
    const celebrationText = document.getElementById('celebration-text');
    
    const currentCode = this.getSectorShortCode(this.jsonFileName);
    const nextCode = this.getSectorShortCode(nextStage);
    
    if (celebrationText) {
      celebrationText.innerHTML = `Tebrikler! ${currentCode} Seviyesini Tamamladın.<br>${nextCode} Seviyesi Başlıyor...`;
    }
    
    if (celebrationScreen) {
      celebrationScreen.classList.remove('hidden');
    }

    // Setup Countdown
    let countdown = 4;
    const countdownEl = document.getElementById('celebration-countdown');
    if (countdownEl) countdownEl.textContent = countdown;
    
    this.celebrationIntervalId = setInterval(() => {
      countdown--;
      if (countdownEl) countdownEl.textContent = countdown;
      if (countdown <= 0) {
        clearInterval(this.celebrationIntervalId);
        this.proceedToNextStage();
      }
    }, 1000);
    
    // Bind the skip button
    const skipBtn = document.getElementById('celebration-skip-btn');
    skipBtn.onclick = () => {
      clearInterval(this.celebrationIntervalId);
      this.proceedToNextStage();
    };
  }

  proceedToNextStage() {
    const nextStage = this.celebrationNextStage;
    
    if (this.celebrationIntervalId) {
      clearInterval(this.celebrationIntervalId);
    }

    // Hide overlay
    document.getElementById('celebration-screen').classList.add('hidden');
    this.isCelebrationActive = false;

    const proceed = (data) => {
      window.sessionScore = this.score; // Carry over score
      const SECTOR_ORDER = [
        'a1_words.json', 'a2_words.json', 'b1_words.json', 'b2_words.json',
        'phrasal_verbs.json', 'conjunctions.json', 'academic_verbs.json',
        'prepositions.json', 'abstract_adjectives.json'
      ];
      const sectorIndex = SECTOR_ORDER.indexOf(nextStage);
      window.sessionLevel = sectorIndex !== -1 ? (sectorIndex + 1) : 1;
      
      initializeGameWithData(data, nextStage);
    };

    if (prefetchedData) {
      proceed(prefetchedData);
    } else {
      // Show loading spinner if prefetch hasn't resolved yet
      const loadingScreen = document.getElementById('loading-screen');
      if (loadingScreen) loadingScreen.classList.remove('hidden');
      
      prefetchPromise.then(data => {
        if (loadingScreen) loadingScreen.classList.add('hidden');
        proceed(data);
      });
    }
  }

  triggerFinalVictory() {
    this.state = 'victory';
    
    // Show Victory Overlay
    const victoryScreen = document.getElementById('victory-screen');
    if (victoryScreen) {
      victoryScreen.classList.remove('hidden');
    }
    
    // Update Title and Subtitle dynamically for Campaign Completion
    const victoryTitle = victoryScreen.querySelector('.game-title');
    const victorySubtitle = victoryScreen.querySelector('.game-subtitle');
    
    if (victoryTitle) {
      victoryTitle.textContent = "CAMPAIGN COMPLETED";
      victoryTitle.style.color = "var(--glow-yellow)";
      victoryTitle.style.textShadow = "0 0 15px rgba(255, 234, 0, 0.6)";
    }
    if (victorySubtitle) {
      victorySubtitle.textContent = "CONGRATULATIONS! YOU HAVE MASTERED ALL SECTORS: A1, A2, B1, & B2";
    }
    
    // Hide next button since there is no next stage in the core chain
    const nextBtn = document.getElementById('victory-next-btn');
    if (nextBtn) {
      nextBtn.classList.add('hidden');
    }

    // Display score
    const victoryScoreEl = document.getElementById('victory-score');
    if (victoryScoreEl) {
      victoryScoreEl.textContent = this.score;
    }
    
    // Display mastered words
    const victoryLearnedList = document.getElementById('victory-learned-list');
    if (victoryLearnedList) {
      victoryLearnedList.innerHTML = '';
      this.vocabulary.forEach(word => {
        const badge = document.createElement('li');
        badge.className = 'word-badge';
        badge.textContent = word.english;

        const tooltip = document.createElement('span');
        tooltip.className = 'tooltip';
        tooltip.textContent = word.turkish;
        
        badge.appendChild(tooltip);
        victoryLearnedList.appendChild(badge);
      });
    }

    // Clear saved campaign progress in localStorage since they completed it
    localStorage.removeItem('memolandum_saved_stage');
    localStorage.removeItem('memolandum_saved_level');
    localStorage.removeItem('memolandum_saved_score');
    updateMainMenuResumeUI();
  }

  update(dt) {
    // Decay screen shake
    if (this.screenShake > 0) {
      this.screenShake -= dt * 25; // decays over 0.5s if initial is 12
      if (this.screenShake < 0) this.screenShake = 0;
    }

    if (this.state === 'exam') {
      if (window.examEngine) {
        window.examEngine.update(dt);
      }
      return;
    }

    // Celebration Active state update loop
    if (this.isCelebrationActive) {
      // Update stars so space continues scrolling
      this.stars.forEach(star => star.update(dt, this.virtualWidth, this.virtualHeight));
      
      // Update active gems during celebration
      this.updateGems(dt);

      // Spawn confetti occasionally (e.g. 2 particles every frame)
      const colors = ['#00f0ff', '#ff0055', '#ffea00', '#39ff14'];
      const cx = Math.random() * this.virtualWidth;
      const cy = -20;
      for (let i = 0; i < 2; i++) {
        const randColor = colors[Math.floor(Math.random() * colors.length)];
        const particle = this.particlePool.acquire(cx, cy, randColor, true); // true = isConfetti
        particle.gravity = 150;
        particle.vx = (Math.random() - 0.5) * 100;
        particle.vy = Math.random() * 100 + 50;
        this.activeParticles.push(particle);
      }

      // Update active particles (confetti)
      for (let i = this.activeParticles.length - 1; i >= 0; i--) {
        const particle = this.activeParticles[i];
        particle.update(dt);
        if (!particle.active) {
          this.particlePool.release(particle);
          this.activeParticles.splice(i, 1);
        }
      }
      return;
    }

    if (this.isLevelTransitioning) {
      this.levelCompleteTimer -= dt;

      // Play riser sound effect 1.2 seconds before the countdown finishes
      if (this.levelCompleteTimer <= 1.2 && !this.riserPlayed) {
        this.soundManager.playStageRiser();
        this.riserPlayed = true;
      }

      if (this.levelCompleteTimer <= 0) {
        this.isLevelTransitioning = false;
        this.chunkIndex++; // Advance to the next unmastered chunk
        const hasMore = this.loadLevelChunk();
        if (hasMore) {
          this.updateHUD();
          this.spawnTimer = 0;
          // Save progress to localStorage
          localStorage.setItem('memolandum_saved_stage', this.jsonFileName);
          localStorage.setItem('memolandum_saved_level', this.chunkIndex + 1);
          localStorage.setItem('memolandum_saved_score', this.score);
          updateMainMenuResumeUI();
        } else {
          this.triggerVictory();
        }
      }
      // Update active gems during transition
      this.updateGems(dt);

      // Update particles so active explosions/confetti can finish
      for (let i = this.activeParticles.length - 1; i >= 0; i--) {
        const particle = this.activeParticles[i];
        particle.update(dt);
        if (!particle.active) {
          this.particlePool.release(particle);
          this.activeParticles.splice(i, 1);
        }
      }
      // Update background stars
      this.stars.forEach(star => star.update(dt, this.virtualWidth, this.virtualHeight));
      return;
    }

    // Update background stars
    this.stars.forEach(star => star.update(dt, this.virtualWidth, this.virtualHeight));

    // Update player ship
    this.player.update(dt, this.input);

    // Handle weapon firing rate checks
    if (this.input.fire && this.player.canFire()) {
      this.soundManager.playLaser();
      // Fire dual lasers from left & right wings
      const laserLeft = this.laserPool.acquire(this.player.x - 18, this.player.y - 10);
      const laserRight = this.laserPool.acquire(this.player.x + 18, this.player.y - 10);
      this.activeLasers.push(laserLeft, laserRight);
      this.player.resetCooldown();
    }

    // Update active lasers
    for (let i = this.activeLasers.length - 1; i >= 0; i--) {
      const laser = this.activeLasers[i];
      laser.update(dt);
      if (!laser.active) {
        this.laserPool.release(laser);
        this.activeLasers.splice(i, 1);
      }
    }

    // Spawn timer logic
    this.spawnTimer += dt;
    // Calm spawn rates to keep game readable, relaxed, and focused on learning scaled by speedMultiplier
    const activeInterval = Math.max(2.6, this.spawnInterval - (this.score * 0.005)) / this.speedMultiplier;
    if (this.spawnTimer >= activeInterval) {
      this.spawnTimer = 0;
      this.spawnMeteor();
    }

    // Update falling targets (meteors)
    for (let i = this.activeMeteors.length - 1; i >= 0; i--) {
      const meteor = this.activeMeteors[i];
      meteor.update(dt);

      // Check if meteor crossed the bottom defense line (above controls)
      if (meteor.y > 830) {
        this.soundManager.playDamage();
        this.spawnExplosion(meteor.x + meteor.width / 2, meteor.y + meteor.height, '#ff0055');
        this.decreaseShields();
        if (meteor.isBoss) {
          // Reset Boss position instead of destroying it
          meteor.y = -100;
        } else {
          this.meteorPool.release(meteor);
          this.activeMeteors.splice(i, 1);
        }
      }
    }

    // Collision Check (Lasers vs Meteors)
    for (let i = this.activeLasers.length - 1; i >= 0; i--) {
      const laser = this.activeLasers[i];
      
      for (let j = this.activeMeteors.length - 1; j >= 0; j--) {
        const meteor = this.activeMeteors[j];

        // Only allow collisions if the meteor has descended below the green meaning card zone (y > 240, or y > 50 for Boss)
        if ((meteor.isBoss ? meteor.y > 50 : meteor.y > 240) && this.checkLaserMeteorCollision(laser, meteor)) {
          // Release collided laser immediately
          this.laserPool.release(laser);
          this.activeLasers.splice(i, 1);

          // Decrement meteor HP
          meteor.hp--;

          if (meteor.hp > 0) {
            // Play hit visual/audio feedback and skip destruction logic
            this.soundManager.playExplosion();
            this.spawnExplosion(laser.x, laser.y, '#00f0ff');
            this.screenShake = 3;
            this.hitPauseUntil = performance.now() + 50; // brief hit stop freeze
          } else {
            // Play final destruction audio synth
            this.soundManager.playExplosion();

            if (meteor.isBoss) {
              // Boss defeat sequence: giant explosion and heavy screen shake
              this.spawnExplosion(meteor.x + meteor.width / 2, meteor.y + meteor.height / 2, '#ff0055');
              this.spawnExplosion(meteor.x + meteor.width / 2, meteor.y + meteor.height / 2, '#00f0ff');
              this.spawnExplosion(meteor.x + meteor.width / 2, meteor.y + meteor.height / 2, '#39ff14');
              
              // Spawn additional particles for massive explosion effect
              for (let pIdx = 0; pIdx < 30; pIdx++) {
                const particle = this.particlePool.acquire(
                  meteor.x + meteor.width / 2,
                  meteor.y + meteor.height / 2,
                  ['#00f0ff', '#ff0055', '#ffea00', '#39ff14'][Math.floor(Math.random() * 4)]
                );
                this.activeParticles.push(particle);
              }
              
              this.screenShake = 24; // Massive shake
              this.hitPauseUntil = performance.now() + 300; // Slower hit pause for epic feel
            } else {
              // Regular meteor explosion
              this.spawnExplosion(meteor.x + meteor.width / 2, meteor.y + meteor.height / 2, '#ff0055');
              this.spawnExplosion(meteor.x + meteor.width / 2, meteor.y + meteor.height / 2, '#00f0ff');
              this.hitPauseUntil = performance.now() + 200;
            }

            // Flash Translation (Learning Effect)
            this.flashMessage = {
              english: meteor.word.english,
              turkish: meteor.word.turkish
            };
            this.flashTimeRemaining = 2.4; // Show for 2.4 seconds for slower, better memorization

            // Increment the word's hitCount
            if (!meteor.isBoss) {
              meteor.word.hitCount = (meteor.word.hitCount || 0) + 1;
              if (meteor.word.hitCount === 3) {
                // Spawn 1 word mastery gem
                this.spawnWordMasteryGem(meteor.x + meteor.width / 2, meteor.y + meteor.height / 2);
              }
            }

            // Track words learned for gameover stats screen
            if (!this.wordsLearnedThisRun.some(w => w.english === meteor.word.english)) {
              this.wordsLearnedThisRun.push(meteor.word);
            }

            // Update Score
            this.score += meteor.isBoss ? 50 : 10; // 50 points for Boss!
            window.sessionScore = this.score; // Sync to session stats
            if (this.score > this.highScore) {
              this.highScore = this.score;
              localStorage.setItem('memolandum_high_score', this.highScore);
            }

            // Release meteor
            this.meteorPool.release(meteor);
            this.activeMeteors.splice(j, 1);

            // Sync HUD changes
            this.updateHUD();

            // Check level complete
            if (meteor.isBoss) {
              const nextStage = this.getNextCoreStage(this.jsonFileName);
              if (nextStage) {
                this.triggerStageCelebration(nextStage);
              } else {
                this.triggerFinalVictory();
              }
              return; // Exit update loop immediately to prevent collision check crashes with active lasers
            } else {
              const allMastered = this.activeChunk.every(w => w.hitCount >= 3);
              if (allMastered) {
                // Spawn 10 Learning Gems at the center of the last destroyed meteor
                this.spawnMasteredGems(meteor.x + meteor.width / 2, meteor.y + meteor.height / 2, 10);

                if (this.chunkIndex === 9 && this.isCoreStage(this.jsonFileName)) {
                  if (!this.bossSpawned) {
                    this.spawnBoss();
                    this.bossSpawned = true;
                    return; // Exit update loop immediately to prevent collision check crashes with active lasers
                  }
                } else {
                  this.triggerLevelComplete();
                  return; // Exit update loop immediately to prevent collision check crashes with active lasers
                }
              }
            }
          }

          break; // Proceed to next laser check
        }
      }
    }

    // Update active gems
    this.updateGems(dt);

    // Update explosion particles
    for (let i = this.activeParticles.length - 1; i >= 0; i--) {
      const particle = this.activeParticles[i];
      particle.update(dt);
      if (!particle.active) {
        this.particlePool.release(particle);
        this.activeParticles.splice(i, 1);
      }
    }

    // Update Translation Flash overlay timer
    if (this.flashTimeRemaining > 0) {
      this.flashTimeRemaining -= dt;
    }
  }

  draw() {
    if (this.state === 'exam') {
      // Clear frame buffer
      this.ctx.fillStyle = '#000000';
      this.ctx.fillRect(0, 0, this.canvas.width, this.canvas.height);

      this.ctx.save();
      // Apply camera shake rumble if active
      if (this.screenShake > 0) {
        const dx = (Math.random() - 0.5) * this.screenShake;
        const dy = (Math.random() - 0.5) * this.screenShake;
        this.ctx.translate(dx, dy);
      }
      this.ctx.scale(this.scaleX, this.scaleY);

      if (window.examEngine) {
        window.examEngine.draw(this.ctx);
      }
      this.ctx.restore();
      return;
    }

    // Clear frame buffer
    this.ctx.fillStyle = '#000000';
    this.ctx.fillRect(0, 0, this.canvas.width, this.canvas.height);

    // Apply scale projection mapping to match virtual coordinates
    this.ctx.save();
    
    // Apply camera shake rumble if active
    if (this.screenShake > 0) {
      const dx = (Math.random() - 0.5) * this.screenShake;
      const dy = (Math.random() - 0.5) * this.screenShake;
      this.ctx.translate(dx, dy);
    }

    this.ctx.scale(this.scaleX, this.scaleY);

    // Draw stars
    this.stars.forEach(star => star.draw(this.ctx));

    // Draw lasers
    this.activeLasers.forEach(laser => laser.draw(this.ctx));

    // Draw meteors
    this.activeMeteors.forEach(meteor => meteor.draw(this.ctx));

    // Draw gems
    this.activeGems.forEach(gem => gem.draw(this.ctx));

    // Draw particles
    this.activeParticles.forEach(particle => particle.draw(this.ctx));

    // Draw player ship (draw when state is playing or gameover)
    if (this.state === 'playing') {
      this.player.draw(this.ctx);
    }

    // Draw Learning Translation Overlay if active
    if (this.flashMessage && this.flashTimeRemaining > 0) {
      this.ctx.save();
      
      // Calculate animation progress (0 to 1 over 2.4 seconds)
      const p = (2.4 - this.flashTimeRemaining) / 2.4;
      
      // Interpolate position and scale (slower, travels less distance, shrinks less for maximum readability)
      const cx = this.virtualWidth / 2;
      const cy = 520 - p * 340; // Travels slowly from y=520 to y=180 (shorter flight path)
      const scale = 1.1 - p * 0.5; // Shrinks gently from 1.1 down to 0.6 (larger card & text)
      const opacity = Math.min(1.0, this.flashTimeRemaining / 0.5); // Fade out in last 500ms
      
      this.ctx.globalAlpha = opacity;
      this.ctx.fillStyle = 'rgba(5, 1, 10, 0.92)'; // Slightly darker backdrop for text readability
      
      // Outer glow effect
      this.ctx.shadowColor = '#39ff14';
      this.ctx.shadowBlur = 12 * scale;
      
      // Bounding dimensions of the card
      const W = 340;
      const H = 90;
      
      // Tapered trapezoid dimensions for Star Wars 3D depth tilt
      const topW = W * scale * 0.78;
      const bottomW = W * scale * 1.22;
      const topY = cy - (H / 2) * scale;
      const bottomY = cy + (H / 2) * scale;
      
      // Draw Star Wars 3D Trapezoid Card (BORDERLESS)
      this.ctx.beginPath();
      this.ctx.moveTo(cx - topW / 2, topY);
      this.ctx.lineTo(cx + topW / 2, topY);
      this.ctx.lineTo(cx + bottomW / 2, bottomY);
      this.ctx.lineTo(cx - bottomW / 2, bottomY);
      this.ctx.closePath();
      this.ctx.fill();

      // Render neon-green Turkish translation text with scale
      this.ctx.fillStyle = '#39ff14';
      this.ctx.shadowColor = '#39ff14';
      this.ctx.shadowBlur = 14 * scale;
      const turkishSize = Math.max(12, Math.round(24 * scale));
      this.ctx.font = `900 ${turkishSize}px "Orbitron", sans-serif`;
      this.ctx.textAlign = 'center';
      this.ctx.textBaseline = 'middle';
      this.ctx.fillText(this.flashMessage.turkish, cx, cy - 8 * scale);

      // Render matching English reference below with scale
      this.ctx.fillStyle = '#ffffff';
      this.ctx.shadowBlur = 0;
      const englishSize = Math.max(10, Math.round(13 * scale));
      this.ctx.font = `500 ${englishSize}px "Space Grotesk", sans-serif`;
      this.ctx.letterSpacing = `${2 * scale}px`;
      this.ctx.fillText(`MATCHED: ${this.flashMessage.english}`, cx, cy + 22 * scale);

      this.ctx.restore();
    }

    // Draw Stage transition banner with celebratory animation
    if (this.isLevelTransitioning) {
      this.ctx.save();
      
      // Dim background slightly to focus on text
      this.ctx.fillStyle = 'rgba(5, 2, 10, 0.55)';
      this.ctx.fillRect(0, 0, this.virtualWidth, this.virtualHeight);
      
      const cx = this.virtualWidth / 2;
      const cy = this.virtualHeight / 2 - 30;
      
      // Determine celebration phase (first 1.5s is stage clear celebration, last 1.5s is prepare next stage)
      const timeSpent = 3.0 - this.levelCompleteTimer; // 0 to 3.0
      
      if (timeSpent < 1.5) {
        // --- Phase 1: Celebration Fanfare ---
        const p = timeSpent / 1.5; // 0 to 1
        
        // Elastic bounce scale effect: pops in fast, bounces back slightly, settles at 1.0
        let scale = 1.0;
        if (p < 0.3) {
          scale = (p / 0.3) * 1.3;
        } else if (p < 0.6) {
          scale = 1.3 - ((p - 0.3) / 0.3) * 0.4; // settle back to 0.9
        } else {
          scale = 0.9 + ((p - 0.6) / 0.9) * 0.1; // settle to 1.0
        }
        
        // Subtly rotate and sway for premium retro-arcade look
        const swayAngle = Math.sin(timeSpent * 8) * 0.03;
        
        this.ctx.translate(cx, cy);
        this.ctx.scale(scale, scale);
        this.ctx.rotate(swayAngle);
        
        // Pulsating cyan glow
        const glowIntensity = Math.abs(Math.sin(timeSpent * 12)) * 10 + 15;
        this.ctx.shadowColor = '#00f0ff';
        this.ctx.shadowBlur = glowIntensity;
        
        // Drawing main text
        this.ctx.fillStyle = '#00f0ff';
        this.ctx.font = '900 36px "Orbitron", sans-serif';
        this.ctx.textAlign = 'center';
        this.ctx.textBaseline = 'middle';
        this.ctx.fillText(`STAGE ${this.chunkIndex + 1} CLEARED!`, 0, -25);
        
        // Drawing subtext (glowing magenta)
        this.ctx.shadowColor = '#ff0055';
        this.ctx.shadowBlur = 10;
        this.ctx.fillStyle = '#ff0055';
        this.ctx.font = '700 16px "Orbitron", sans-serif';
        this.ctx.letterSpacing = '2px';
        this.ctx.fillText("EXCELLENT TRAINING PROTOCOL", 0, 25);
      } else {
        // --- Phase 2: Countdown / Prepare Stage ---
        const countdown = Math.max(1, Math.ceil(this.levelCompleteTimer));
        
        // Soft heartbeat pulse scale
        const scale = 1.0 + Math.abs(Math.sin(timeSpent * Math.PI * 2)) * 0.08;
        
        this.ctx.translate(cx, cy);
        this.ctx.scale(scale, scale);
        
        // Pulsating yellow glow
        this.ctx.shadowColor = '#ffea00';
        this.ctx.shadowBlur = 15;
        
        // Main countdown text
        this.ctx.fillStyle = '#ffea00';
        this.ctx.font = '900 26px "Orbitron", sans-serif';
        this.ctx.textAlign = 'center';
        this.ctx.textBaseline = 'middle';
        this.ctx.fillText(`INITIALIZING STAGE ${this.chunkIndex + 2}`, 0, -25);
        
        // Subtitle prepare message
        this.ctx.shadowColor = '#39ff14';
        this.ctx.shadowBlur = 8;
        this.ctx.fillStyle = '#39ff14';
        this.ctx.font = '900 20px "Orbitron", sans-serif';
        this.ctx.fillText(`READY IN ... ${countdown}`, 0, 20);
      }
      
      this.ctx.restore();
    }

    this.ctx.restore();
  }

  togglePause() {
    if (this.state !== 'playing' && this.state !== 'exam') return;
    
    this.isPaused = !this.isPaused;
    
    const pauseScreen = document.getElementById('pause-screen');
    const pauseBtn = document.getElementById('btn-pause');
    const pauseExamBtn = document.getElementById('pause-exam-btn');
    
    if (this.isPaused) {
      pauseScreen.classList.remove('hidden');
      pauseBtn.textContent = '▶';
      pauseBtn.style.color = 'var(--glow-yellow)';
      pauseBtn.style.borderColor = 'var(--glow-yellow)';
      
      // Hide the "START EXAM" button when already in an exam!
      if (this.state === 'exam' && pauseExamBtn) {
        pauseExamBtn.classList.add('hidden');
      } else if (pauseExamBtn) {
        pauseExamBtn.classList.remove('hidden');
      }
    } else {
      // If we resume, reset the quit confirmation state if it was active
      if (this.confirmQuitActive) {
        clearTimeout(this.confirmQuitTimeoutId);
        this.confirmQuitActive = false;
        const pauseMenuBtn = document.getElementById('pause-menu-btn');
        if (pauseMenuBtn) {
          pauseMenuBtn.textContent = 'MAIN MENU';
          pauseMenuBtn.classList.remove('btn-magenta');
          pauseMenuBtn.classList.add('btn-cyan');
        }
      }
      pauseScreen.classList.add('hidden');
      pauseBtn.textContent = '⏸';
      pauseBtn.style.color = 'var(--glow-cyan)';
      pauseBtn.style.borderColor = 'var(--border-color)';
    }
  }

  spawnBoss() {
    this.soundManager.playStageRiser();
    
    // Clear all existing regular meteors and lasers to prepare the arena
    this.activeMeteors.forEach(m => this.meteorPool.release(m));
    this.activeMeteors = [];
    this.activeLasers.forEach(l => this.laserPool.release(l));
    this.activeLasers = [];
    
    // Choose a word for the Boss (the last word of the level chunk)
    const bossWord = this.activeChunk[this.activeChunk.length - 1];
    
    // Spawn the Boss at the top center of the screen
    const x = this.virtualWidth / 2 - 150; // Center the 300px wide Boss card
    const y = -120;
    
    // Boss moves down very slowly
    const speed = 20 * this.speedMultiplier;
    const bossMeteor = this.meteorPool.acquire(x, y, bossWord, speed, true); // true = isBoss
    
    this.activeMeteors.push(bossMeteor);
    
    // Trigger screen shake rumble to warn the player
    this.screenShake = 8;
  }
}

// ----------------------------------------------------
// UI Helpers: Tab Switching & Category Selection
// ----------------------------------------------------
function switchMenuTab(tabId) {
  // Hide all tab content
  document.querySelectorAll('.tab-content').forEach(content => {
    content.classList.remove('active');
  });
  // Show selected tab content
  document.getElementById(tabId).classList.add('active');

  // Update active state on tab buttons
  document.querySelectorAll('.tab-btn').forEach(btn => {
    btn.classList.remove('active');
    if (btn.getAttribute('data-tab') === tabId) {
      btn.classList.add('active');
    }
  });
}

// Global State for speed selector & helper functions
window.selectedSpeed = 'normal';

function setGameSpeed(speed) {
  window.selectedSpeed = speed;
  document.querySelectorAll('.speed-btn').forEach(btn => {
    btn.classList.remove('active');
  });
  const activeBtn = document.getElementById(`speed-${speed}`);
  if (activeBtn) {
    activeBtn.classList.add('active');
  }
}

function selectCategoryAndLaunch(jsonFileName, cardElement) {
  selectCategory(jsonFileName, cardElement);
  loadLevel(jsonFileName);
}

function selectCategory(jsonFileName, cardElement) {
  window.selectedCategory = jsonFileName;

  // Reset all level card styles and action texts
  document.querySelectorAll('.level-card').forEach(card => {
    card.classList.remove('selected');
    const actionEl = card.querySelector('.level-action');
    if (actionEl) {
      actionEl.textContent = 'CONNECT SECTOR';
    }
  });

  // Highlight the selected card and set its action text to CONNECTED
  if (cardElement) {
    cardElement.classList.add('selected');
    const actionEl = cardElement.querySelector('.level-action');
    if (actionEl) {
      actionEl.textContent = 'LINK ESTABLISHED';
    }
  }
}

function showMainMenu() {
  // Unhide menu overlay
  document.getElementById('main-menu').classList.remove('hidden');
  
  updateMainMenuResumeUI();

  // Restore previously selected category and auto-switch to its corresponding tab
  const category = window.selectedCategory || 'a1_words.json';
  const card = document.querySelector(`.level-card[data-category="${category}"]`);
  if (card) {
    const tabContent = card.closest('.tab-content');
    if (tabContent) {
      switchMenuTab(tabContent.id);
    }
    selectCategory(category, card);
  }
}

// ----------------------------------------------------
// Shell Management Helper (Hot-Swapping Modules)
// ----------------------------------------------------
function switchGameShell(shellName) {
  window.activeShell = shellName;
  localStorage.setItem('memolandum_active_shell', shellName);

  const btnShooter = document.getElementById('shell-shooter');
  const btnBreakout = document.getElementById('shell-breakout');
  const btnWordDrop = document.getElementById('shell-worddrop');
  const btnHighway = document.getElementById('shell-highway');
  const btnWordAscent = document.getElementById('shell-wordascent');
  const btnInvaders = document.getElementById('shell-invaders');

  if (btnShooter && btnBreakout && btnWordDrop && btnHighway && btnWordAscent) {
    btnShooter.classList.remove('active');
    btnBreakout.classList.remove('active');
    btnWordDrop.classList.remove('active');
    btnHighway.classList.remove('active');
    btnWordAscent.classList.remove('active');
    if (btnInvaders) btnInvaders.classList.remove('active');

    if (shellName === 'breakout') {
      btnBreakout.classList.add('active');
    } else if (shellName === 'worddrop') {
      btnWordDrop.classList.add('active');
    } else if (shellName === 'highway') {
      btnHighway.classList.add('active');
    } else if (shellName === 'wordascent') {
      btnWordAscent.classList.add('active');
    } else if (shellName === 'invaders') {
      if (btnInvaders) btnInvaders.classList.add('active');
    } else {
      btnShooter.classList.add('active');
    }
  }
}

// ----------------------------------------------------
// Category JSON Level Loader & Fallback Logic
// ----------------------------------------------------
function loadLevel(jsonFileName, isTransition = false) {
  const loadingScreen = document.getElementById('loading-screen');
  if (loadingScreen) {
    loadingScreen.classList.remove('hidden');
  }

  const SECTOR_ORDER = [
    'a1_words.json',
    'a2_words.json',
    'b1_words.json',
    'b2_words.json',
    'phrasal_verbs.json',
    'conjunctions.json',
    'academic_verbs.json',
    'prepositions.json',
    'abstract_adjectives.json'
  ];
  const sectorIndex = SECTOR_ORDER.indexOf(jsonFileName);
  window.sessionLevel = sectorIndex !== -1 ? (sectorIndex + 1) : 1;

  if (!isTransition) {
    window.sessionScore = 0;
  }

  fetch(`./data/${jsonFileName}`)
    .then(response => {
      if (!response.ok) {
        throw new Error(`File not found: ./data/${jsonFileName}`);
      }
      return response.json();
    })
    .then(data => {
      if (loadingScreen) {
        loadingScreen.classList.add('hidden');
      }
      initializeGameWithData(data, jsonFileName);
    })
    .catch(error => {
      console.warn(`Fetch error for ${jsonFileName}. Browser local security context or offline status detected. Checking fallback embedded dataset. Error details:`, error);
      
      if (typeof FALLBACK_DATA !== 'undefined' && FALLBACK_DATA[jsonFileName]) {
        if (loadingScreen) {
          loadingScreen.classList.add('hidden');
        }
        initializeGameWithData(FALLBACK_DATA[jsonFileName], jsonFileName);
      } else {
        console.error(`Error loading level data for ${jsonFileName}:`, error);
        if (loadingScreen) {
          loadingScreen.classList.add('hidden');
        }
        alert(`Level data for ${jsonFileName} could not be loaded. Please ensure you are running a local web server (CORS requirement).`);
        
        // Revert back to main menu
        showMainMenu();
        document.getElementById('gameCanvas').classList.add('hidden');
        document.getElementById('hud').classList.add('hidden');
        document.querySelector('.controls-container').classList.add('hidden');
      }
    });
}

function initializeGameWithData(data, jsonFileName) {
  let rawWords = [];
  if (Array.isArray(data)) {
    rawWords = data;
  } else if (data && Array.isArray(data.words)) {
    rawWords = data.words;
  } else {
    throw new Error("Invalid vocabulary file format. Expected a list or a 'words' array.");
  }
  
  // Map JSON schema { en, tr } or { word, translation } -> internal schema { english, turkish }
  const vocabulary = rawWords.map(w => {
    if (!w) return { english: "", turkish: "" };
    return {
      english: (w.word || w.en || "").toString().toUpperCase(),
      turkish: (w.translation || w.tr || "").toString().toUpperCase()
    };
  }).filter(w => w.english && w.turkish);

  // Hide Menu Overlay
  document.getElementById('main-menu').classList.add('hidden');
  
  // Unhide Canvas, HUD, and Virtual Controls
  document.getElementById('gameCanvas').classList.remove('hidden');
  document.getElementById('hud').classList.remove('hidden');
  document.querySelector('.controls-container').classList.remove('hidden');

  // Clean up existing game context if active to prevent memory leaks
  if (window.game) {
    cancelAnimationFrame(window.game.loopId);
    window.game.cleanup();
    window.game = null;
  }

  // Initialize Game with loaded vocabulary
  if (window.activeShell === 'breakout') {
    window.game = new BreakoutGame(vocabulary, jsonFileName);
  } else if (window.activeShell === 'worddrop') {
    window.game = new WordDropGame(vocabulary, jsonFileName);
  } else if (window.activeShell === 'highway') {
    window.game = new HighwayGame(vocabulary, jsonFileName);
  } else if (window.activeShell === 'wordascent') {
    window.game = new WordAscentGame(vocabulary, jsonFileName);
  } else if (window.activeShell === 'invaders') {
    window.game = new InvadersGame(vocabulary, jsonFileName);
  } else {
    window.game = new Game(vocabulary, jsonFileName);
  }
  window.game.startGame();
}

function launchExam() {
  const category = window.selectedCategory || 'a1_words.json';
  
  const loadingScreen = document.getElementById('loading-screen');
  if (loadingScreen) {
    loadingScreen.classList.remove('hidden');
  }

  fetch(`./data/${category}`)
    .then(response => {
      if (!response.ok) throw new Error(`File not found: ./data/${category}`);
      return response.json();
    })
    .then(data => {
      if (loadingScreen) loadingScreen.classList.add('hidden');
      initializeExamWithData(data, category);
    })
    .catch(error => {
      console.warn(`Fetch error for ${category}. Checking fallback embedded dataset.`, error);
      if (typeof FALLBACK_DATA !== 'undefined' && FALLBACK_DATA[category]) {
        if (loadingScreen) loadingScreen.classList.add('hidden');
        initializeExamWithData(FALLBACK_DATA[category], category);
      } else {
        console.error(`Error loading level data for ${category}:`, error);
        if (loadingScreen) loadingScreen.classList.add('hidden');
        alert("Sector data could not be loaded for the exam.");
        
        // Revert back to main menu
        showMainMenu();
        document.getElementById('gameCanvas').classList.add('hidden');
        document.getElementById('hud').classList.add('hidden');
        document.querySelector('.controls-container').classList.add('hidden');
      }
    });
}

function initializeExamWithData(data, jsonFileName) {
  let rawWords = [];
  if (Array.isArray(data)) {
    rawWords = data;
  } else if (data && Array.isArray(data.words)) {
    rawWords = data.words;
  } else {
    throw new Error("Invalid vocabulary file format.");
  }
  
  const vocabulary = rawWords.map(w => {
    if (!w) return { english: "", turkish: "" };
    return {
      english: (w.word || w.en || "").toString().toUpperCase(),
      turkish: (w.translation || w.tr || "").toString().toUpperCase()
    };
  }).filter(w => w.english && w.turkish);

  // Hide Menu Overlay
  document.getElementById('main-menu').classList.add('hidden');
  
  // Unhide Canvas, HUD, and Virtual Controls
  document.getElementById('gameCanvas').classList.remove('hidden');
  document.getElementById('hud').classList.remove('hidden');
  document.querySelector('.controls-container').classList.remove('hidden');

  // Clean up existing game context if active to prevent memory leaks
  if (window.game) {
    cancelAnimationFrame(window.game.loopId);
    window.game.cleanup();
    window.game = null;
  }

  // Initialize Game with loaded vocabulary (Always Shooter for Exam)
  window.game = new Game(vocabulary, jsonFileName);
  window.game.state = 'exam';
  
  // Initialize and start the ExamEngine
  if (!window.examEngine) {
    window.examEngine = new ExamEngine();
  }
  window.examEngine.startSession(vocabulary, window.game);
}

function restartExam(mode) {
  if (!window.examEngine || !window.examEngine.vocabulary) return;
  
  const vocabulary = window.examEngine.vocabulary;
  const jsonFileName = window.examEngine.game ? window.examEngine.game.jsonFileName : (window.selectedCategory || 'a1_words.json');

  // Hide Exam Results Overlay
  document.getElementById('exam-results-screen').classList.add('hidden');

  // Unhide Canvas, HUD, and Virtual Controls
  document.getElementById('gameCanvas').classList.remove('hidden');
  document.getElementById('hud').classList.remove('hidden');
  document.querySelector('.controls-container').classList.remove('hidden');

  // Clean up existing game context if active to prevent memory leaks
  if (window.game) {
    cancelAnimationFrame(window.game.loopId);
    window.game.cleanup();
    window.game = null;
  }

  // Initialize Game with loaded vocabulary (Always Shooter for Exam)
  window.game = new Game(vocabulary, jsonFileName);
  window.game.state = 'exam';
  
  // Restart the session in ExamEngine
  window.examEngine.startSession(vocabulary, window.game, mode);
}

// ----------------------------------------------------
// Engine Bootstrapper
// ----------------------------------------------------
window.addEventListener('load', () => {
  // Setup Resume Button listener
  const resumeBtnMain = document.getElementById('resume-btn-main');
  if (resumeBtnMain) {
    resumeBtnMain.addEventListener('click', () => {
      const savedStage = localStorage.getItem('memolandum_saved_stage');
      const savedLevel = parseInt(localStorage.getItem('memolandum_saved_level')) || 1;
      const savedScore = parseInt(localStorage.getItem('memolandum_saved_score')) || 0;
      
      if (savedStage) {
        window.resumeLevelIndex = savedLevel - 1;
        window.sessionScore = savedScore;
        
        const SECTOR_ORDER = [
          'a1_words.json', 'a2_words.json', 'b1_words.json', 'b2_words.json',
          'phrasal_verbs.json', 'conjunctions.json', 'academic_verbs.json',
          'prepositions.json', 'abstract_adjectives.json'
        ];
        const sectorIndex = SECTOR_ORDER.indexOf(savedStage);
        window.sessionLevel = sectorIndex !== -1 ? (sectorIndex + 1) : 1;
        
        loadLevel(savedStage, true); // true = transition/resume (keep score)
      }
    });
  }

  // Restore saved active shell selection on page load
  const savedShell = localStorage.getItem('memolandum_active_shell') || 'shooter';
  switchGameShell(savedShell);

  // Restore saved stage selection on page load
  const savedStage = localStorage.getItem('memolandum_saved_stage');
  if (savedStage) {
    window.selectedCategory = savedStage;
  }
  
  updateMainMenuResumeUI();

  // Pre-select the active level card
  const category = window.selectedCategory || 'a1_words.json';
  const card = document.querySelector(`.level-card[data-category="${category}"]`);
  if (card) {
    const tabContent = card.closest('.tab-content');
    if (tabContent) {
      switchMenuTab(tabContent.id);
    }
    selectCategory(category, card);
  }
  
  // Bind Menu Button logic once
  document.getElementById('menu-btn').addEventListener('click', () => {
    if (window.game) {
      cancelAnimationFrame(window.game.loopId);
      window.game.cleanup();
      window.game = null;
    }
    document.getElementById('game-over-screen').classList.add('hidden');
    document.getElementById('hud').classList.add('hidden');
    document.getElementById('gameCanvas').classList.add('hidden');
    document.querySelector('.controls-container').classList.add('hidden');
    showMainMenu();
  });
});

window.Game = Game;
window.switchGameShell = switchGameShell;
window.loadLevel = loadLevel;
window.restartExam = restartExam;
window.setGameSpeed = setGameSpeed;
