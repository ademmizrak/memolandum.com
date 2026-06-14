// Siberian Invaders (Kabuk #6) - Retro Neon Portrait Space SHMUP
// Features Formational grid spawning, laser spelling, guided counter-shells,
// chain explosions, freeze-frames, magnetic gem drops, and Star Wars 3D crawls.

class InvadersObjectPool {
  constructor(createFn, resetFn) {
    this.createFn = createFn;
    this.resetFn = resetFn;
    this.pool = [];
  }

  acquire(...args) {
    if (this.pool.length > 0) {
      const obj = this.pool.pop();
      this.resetFn(obj, ...args);
      return obj;
    }
    const obj = this.createFn();
    this.resetFn(obj, ...args);
    return obj;
  }

  release(obj) {
    this.pool.push(obj);
  }
}

class InvadersParticle {
  reset(x, y, color, type = 'spark') {
    this.x = x;
    this.y = y;
    this.type = type; // 'spark', 'smoke', or 'plasma'
    
    if (type === 'spark') {
      const angle = Math.random() * Math.PI * 2;
      const speed = 1 + Math.random() * 5;
      this.vx = Math.cos(angle) * speed;
      this.vy = Math.sin(angle) * speed;
      this.size = 2 + Math.random() * 2;
      this.color = color || '#39ff14';
      this.alpha = 1.0;
      this.maxLife = 20 + Math.random() * 15;
    } else if (type === 'smoke') {
      this.vx = (Math.random() - 0.5) * 0.8;
      this.vy = 1.0 + Math.random() * 1.5; // fall behind player
      this.size = 4 + Math.random() * 4;
      this.color = color || '#ff00ff';
      this.alpha = 0.8;
      this.maxLife = 25 + Math.random() * 15;
    } else {
      // Plasma trail
      this.vx = (Math.random() - 0.5) * 1.2;
      this.vy = (Math.random() - 0.5) * 1.2;
      this.size = 3 + Math.random() * 3;
      this.color = color || '#ff0055';
      this.alpha = 0.9;
      this.maxLife = 15 + Math.random() * 10;
    }
    this.life = this.maxLife;
  }

  update() {
    this.x += this.vx;
    this.y += this.vy;
    this.life--;
    this.alpha = Math.max(0, this.life / this.maxLife);
  }

  draw(ctx) {
    ctx.save();
    ctx.globalAlpha = this.alpha;
    ctx.fillStyle = this.color;
    ctx.shadowColor = this.color;
    ctx.shadowBlur = this.type === 'smoke' ? 0 : 6;
    ctx.beginPath();
    ctx.arc(this.x, this.y, this.size, 0, Math.PI * 2);
    ctx.fill();
    ctx.restore();
  }
}

class InvadersFloatingText {
  reset(x, y, text, color = '#ffea00') {
    this.x = x;
    this.y = y;
    this.text = text;
    this.color = color;
    this.alpha = 1.0;
    this.life = 45;
  }

  update() {
    this.y -= 1.0;
    this.life--;
    this.alpha = Math.max(0, this.life / 45);
  }

  draw(ctx) {
    ctx.save();
    ctx.globalAlpha = this.alpha;
    ctx.fillStyle = this.color;
    ctx.font = 'bold 16px "Orbitron", sans-serif';
    ctx.textAlign = 'center';
    ctx.shadowColor = this.color;
    ctx.shadowBlur = 5;
    ctx.fillText(this.text, this.x, this.y);
    ctx.restore();
  }
}

class Invader {
  constructor(x, y, width, height, text, isCorrect, wordObj) {
    this.x = x; // center X
    this.y = y; // center Y
    this.width = width;
    this.height = height;
    this.text = text;
    this.isCorrect = isCorrect;
    this.wordObj = wordObj;
    this.active = true;
    this.pulseTimer = Math.random() * Math.PI;
    this.color = isCorrect ? '#00f0ff' : '#bd00ff'; // Neon cyan or purple border
  }

  update(fleetYOffset) {
    this.pulseTimer += 0.04;
    this.currentY = this.y + fleetYOffset;
  }

  draw(ctx) {
    if (!this.active) return;

    ctx.save();
    ctx.strokeStyle = this.color;
    ctx.lineWidth = 2.5;

    // Glowing shadow
    ctx.shadowColor = this.color;
    ctx.shadowBlur = 6 + Math.sin(this.pulseTimer) * 3;
    ctx.fillStyle = 'rgba(10, 8, 25, 0.9)';

    // Rounded rectangle chassis (cyber invader vehicle shape)
    const rx = this.x - this.width / 2;
    const ry = this.currentY - this.height / 2;
    
    ctx.beginPath();
    ctx.roundRect(rx, ry, this.width, this.height, 8);
    ctx.fill();
    ctx.stroke();

    // Cyber cockpit/siren lines on invader
    ctx.strokeStyle = this.isCorrect ? '#39ff14' : '#ff0055';
    ctx.lineWidth = 1.5;
    ctx.shadowBlur = 0;
    ctx.beginPath();
    ctx.moveTo(this.x - 20, ry + 6);
    ctx.lineTo(this.x + 20, ry + 6);
    ctx.stroke();

    // Render meaning label
    if (this.text) {
      ctx.fillStyle = '#ffffff';
      ctx.textAlign = 'center';
      ctx.textBaseline = 'middle';

      // Split words if there is a space
      const words = this.text.split(/\s+/);
      
      if (words.length > 1) {
        // Multi-line wrap
        let fontSize = 16;
        ctx.font = `bold ${fontSize}px "Orbitron", Arial, sans-serif`;
        
        // Ensure both lines fit horizontally
        let maxWidthOfLines = Math.max(...words.map(w => ctx.measureText(w).width));
        while (maxWidthOfLines > this.width - 16 && fontSize > 10) {
          fontSize--;
          ctx.font = `bold ${fontSize}px "Orbitron", Arial, sans-serif`;
          maxWidthOfLines = Math.max(...words.map(w => ctx.measureText(w).width));
        }

        // Draw the lines vertically centered
        const lineHeight = fontSize + 4;
        const totalHeight = lineHeight * words.length;
        const startY = this.currentY - (totalHeight / 2) + (lineHeight / 2) + 4;

        words.forEach((w, index) => {
          ctx.fillText(w, this.x, startY + index * lineHeight);
        });
      } else {
        // Single line
        let fontSize = 18; // base font size larger!
        ctx.font = `bold ${fontSize}px "Orbitron", Arial, sans-serif`;
        let textWidth = ctx.measureText(this.text).width;
        
        while (textWidth > this.width - 16 && fontSize > 11) {
          fontSize--;
          ctx.font = `bold ${fontSize}px "Orbitron", Arial, sans-serif`;
          textWidth = ctx.measureText(this.text).width;
        }
        
        ctx.fillText(this.text, this.x, this.currentY + 4);
      }
    }

    ctx.restore();
  }
}

class InvadersBullet {
  constructor(x, y) {
    this.x = x;
    this.y = y;
    this.width = 4;
    this.height = 14;
    this.vy = -15;
    this.active = true;
  }

  update() {
    this.y += this.vy;
    if (this.y < -20) {
      this.active = false;
    }
  }

  draw(ctx) {
    ctx.save();
    ctx.fillStyle = '#00f0ff'; // Neon cyan player lasers
    ctx.shadowColor = '#00f0ff';
    ctx.shadowBlur = 10;
    ctx.beginPath();
    ctx.roundRect(this.x - this.width / 2, this.y - this.height / 2, this.width, this.height, 2);
    ctx.fill();
    ctx.restore();
  }
}

class InvadersEnemyBullet {
  constructor(x, y) {
    this.x = x;
    this.y = y;
    this.width = 6;
    this.height = 16;
    this.vx = 0;
    this.vy = 5;
    this.active = true;
  }

  update(playerX) {
    // Steer horizontally toward the player X coordinate
    const dx = playerX - this.x;
    this.vx += (dx * 0.015 - this.vx) * 0.08;
    this.x += this.vx;
    this.y += this.vy;
    
    if (this.y > 1020) {
      this.active = false;
    }
  }

  draw(ctx) {
    ctx.save();
    ctx.fillStyle = '#ff0055'; // Neon magenta/red guided counter plazma shell
    ctx.shadowColor = '#ff0055';
    ctx.shadowBlur = 12;
    ctx.beginPath();
    ctx.arc(this.x, this.y, 6, 0, Math.PI * 2);
    ctx.fill();
    ctx.restore();
  }
}

class InvadersGem {
  constructor(x, y) {
    this.x = x;
    this.y = y;
    this.size = 8;
    this.vy = 3.5;
    this.active = true;
  }

  update(playerX, playerY) {
    const dx = playerX - this.x;
    const dy = playerY - this.y;
    const dist = Math.hypot(dx, dy);
    
    // Magnetic pull when player is close or duringStarWarsCrawl celebration
    if (dist < 280) {
      const pull = (280 - dist) / 280;
      this.x += (dx / dist) * 12 * pull;
      this.y += (dy / dist) * 12 * pull;
    } else {
      this.y += this.vy;
    }
    
    if (this.y > 1020) {
      this.active = false;
    }
  }

  draw(ctx) {
    ctx.save();
    ctx.fillStyle = '#00ffcc';
    ctx.shadowColor = '#00ffcc';
    ctx.shadowBlur = 8;
    ctx.beginPath();
    ctx.moveTo(this.x, this.y - this.size);
    ctx.lineTo(this.x + this.size, this.y);
    ctx.lineTo(this.x, this.y + this.size);
    ctx.lineTo(this.x - this.size, this.y);
    ctx.closePath();
    ctx.fill();
    ctx.restore();
  }
}

class InvadersStar {
  reset(width, height) {
    this.x = Math.random() * width;
    this.y = Math.random() * height;
    this.size = Math.random() * 2 + 0.5;
    this.speed = Math.random() * 1.5 + 0.5;
  }

  update(height) {
    this.y += this.speed;
    if (this.y > height) {
      this.y = 0;
      this.x = Math.random() * 600;
    }
  }

  draw(ctx) {
    ctx.fillStyle = 'rgba(255, 255, 255, 0.4)';
    ctx.fillRect(this.x, this.y, this.size, this.size);
  }
}

class InvadersGame {
  constructor(vocabulary, jsonFileName) {
    this.isInvadersGame = true;
    this.canvas = document.getElementById('gameCanvas');
    this.ctx = this.canvas.getContext('2d');

    this.vocabulary = vocabulary;
    this.jsonFileName = jsonFileName;

    this.virtualWidth = 600;
    this.virtualHeight = 1000;
    this.scaleX = 1;
    this.scaleY = 1;

    this.soundManager = new SoundManager();

    this.speedMultiplier = 1.0;
    if (window.selectedSpeed === 'slow') {
      this.speedMultiplier = 0.7;
    } else if (window.selectedSpeed === 'fast') {
      this.speedMultiplier = 1.4;
    }

    // Player initial metrics
    this.player = {
      x: 300,
      y: 850,
      vx: 0,
      width: 54,
      height: 36,
      targetVx: 0,
      cooldown: 0
    };

    // Keyboard states
    this.input = {
      left: false,
      right: false,
      fire: false
    };

    // Game states
    this.state = 'start';
    this.score = 0;
    this.highScore = parseInt(localStorage.getItem('memolandum_high_score')) || 0;
    this.shields = 3;
    this.collectedGems = parseInt(localStorage.getItem('memolandum_collected_gems')) || 0;
    this.wordsLearnedThisRun = [];

    this.currentLevel = 1;
    this.chunkIndex = 0;
    this.wordsPerLevel = 12;
    this.activeChunk = [];
    this.processedCount = 0;

    // Entity lists
    this.invaders = [];
    this.bullets = [];
    this.enemyBullets = [];
    this.fallingGems = [];
    this.activeParticles = [];
    this.activeFloatingTexts = [];
    this.stars = [];

    // Object Pools
    this.particlePool = new InvadersObjectPool(
      () => new InvadersParticle(),
      (p, x, y, color, type) => p.reset(x, y, color, type)
    );

    this.floatingTextPool = new InvadersObjectPool(
      () => new InvadersFloatingText(),
      (ft, x, y, text, color) => ft.reset(x, y, text, color)
    );

    // Dynamic fillers fallback
    const localFillers = [
      { word: "am", translation: "olmak" },
      { word: "as", translation: "olarak" },
      { word: "be", translation: "olmak" },
      { word: "do", translation: "yapmak" },
      { word: "go", translation: "gitmek" },
      { word: "he", translation: "o" },
      { word: "if", translation: "eğer" },
      { word: "in", translation: "içinde" },
      { word: "is", translation: "olmak" },
      { word: "it", translation: "o" },
      { word: "me", translation: "beni" },
      { word: "my", translation: "benim" },
      { word: "no", translation: "hayır" },
      { word: "of", translation: "-in" },
      { word: "on", translation: "üzerinde" },
      { word: "or", translation: "veya" },
      { word: "so", translation: "böylece" },
      { word: "to", translation: "e doğru" },
      { word: "up", translation: "yukarı" },
      { word: "we", translation: "biz" }
    ];

    this.fillers = localFillers.map(w => ({
      english: w.word.toUpperCase(),
      turkish: w.translation.toUpperCase()
    }));

    fetch('./data/fillers.json')
      .then(res => res.json())
      .then(data => {
        if (Array.isArray(data)) {
          const fetched = data.map(w => ({
            english: w.word.toUpperCase(),
            turkish: w.translation.toUpperCase()
          }));
          const merged = [...fetched];
          localFillers.forEach(lf => {
            const lfUpper = lf.word.toUpperCase();
            if (!merged.some(m => m.english === lfUpper)) {
              merged.push({
                english: lfUpper,
                turkish: lf.translation.toUpperCase()
              });
            }
          });
          this.fillers = merged;
        }
      })
      .catch(err => {
        console.error("Failed to load fillers, using local preloaded:", err);
      });

    // Control parameters
    this.fleetY = 220;
    this.fleetSpeed = 0.07;

    // Star Wars Crawl overlay info
    this.floatingFx = { active: false };

    // Screen Shake
    this.screenShakeTimer = 0;
    this.screenShakeIntensity = 0;

    // Damage flash countdown
    this.damageTimer = 0;

    // Load background stars
    for (let i = 0; i < 40; i++) {
      const star = new InvadersStar();
      star.reset(this.virtualWidth, this.virtualHeight);
      star.y = Math.random() * this.virtualHeight;
      this.stars.push(star);
    }

    this.resizeHandler = () => this.resize();
    this.bindEvents();
    this.resize();
    requestAnimationFrame((time) => this.gameLoop(time));
  }

  startGame() {
    this.soundManager.init();
    this.score = window.sessionScore || 0;
    this.shields = 3;
    this.wordsLearnedThisRun = [];
    this.currentLevel = window.sessionLevel || 1;

    if (window.resumeLevelIndex !== undefined && window.resumeLevelIndex !== null) {
      this.chunkIndex = window.resumeLevelIndex;
      window.resumeLevelIndex = null;
    } else {
      this.chunkIndex = 0;
    }

    this.isLevelTransitioning = false;
    this.levelCompleteTimer = 0;
    this.damageTimer = 0;
    this.processedCount = 0;

    localStorage.setItem('memolandum_saved_stage', this.jsonFileName);
    localStorage.setItem('memolandum_saved_level', this.chunkIndex + 1);
    localStorage.setItem('memolandum_saved_score', this.score);
    updateMainMenuResumeUI();

    // Reset player
    this.player.x = 300;
    this.player.vx = 0;
    this.player.targetVx = 0;
    this.player.cooldown = 0;

    this.bullets = [];
    this.enemyBullets = [];
    this.fallingGems = [];
    this.invaders = [];
    
    this.activeParticles.forEach(p => this.particlePool.release(p));
    this.activeFloatingTexts.forEach(ft => this.floatingTextPool.release(ft));
    this.activeParticles = [];
    this.activeFloatingTexts = [];

    this.fleetY = 220;
    this.fleetSpeed = 0.07 + (this.chunkIndex * 0.015); // Slightly accelerate per level
    this.screenShakeTimer = 0;
    this.damageTimer = 0;
    this.floatingFx = { active: false };

    this.loadLevelChunk();
    this.selectNextWord();
    this.spawnInvaders();

    this.state = 'playing';

    document.getElementById('start-screen').classList.add('hidden');
    document.getElementById('game-over-screen').classList.add('hidden');
    document.getElementById('victory-screen').classList.add('hidden');
    
    // Unhide Canvas and HUD
    document.getElementById('gameCanvas').classList.remove('hidden');
    document.getElementById('hud').classList.remove('hidden');
    const controls = document.querySelector('.controls-container');
    if (controls) controls.classList.remove('hidden');

    this.updateHUD();
  }

  loadLevelChunk() {
    const start = this.chunkIndex * this.wordsPerLevel;
    const chunkWords = this.vocabulary.slice(start, start + this.wordsPerLevel);
    if (chunkWords.length === 0) {
      return false;
    }
    this.activeChunk = chunkWords.map(w => ({
      ...w,
      processed: false
    }));
    return true;
  }

  selectNextWord() {
    const unprocessed = this.activeChunk.filter(w => !w.processed);
    if (unprocessed.length === 0 || this.processedCount >= this.wordsPerLevel) {
      this.triggerLevelComplete();
      return;
    }

    this.activeWord = unprocessed[Math.floor(Math.random() * unprocessed.length)];
  }

  spawnInvaders() {
    this.invaders = [];
    this.fleetY = 220;

    // Grid details: 3 columns x 2 rows = 6 invaders
    const xCenters = [110, 300, 490];
    const yOffsets = [0, 100]; // vertical spacings relative to fleetY

    // Select correct lane out of the 6 spots randomly
    const correctIndex = Math.floor(Math.random() * 6);
    let invaderSpotIndex = 0;

    // Pick distractors
    const otherVocab = this.vocabulary.filter(w => w.turkish !== this.activeWord.turkish);
    const distractorPool = [];
    
    // Populate distractor words
    while (distractorPool.length < 5 && otherVocab.length > 0) {
      const w = otherVocab[Math.floor(Math.random() * otherVocab.length)];
      if (!distractorPool.some(d => d.turkish === w.turkish)) {
        distractorPool.push(w);
      }
    }
    
    // Fill up distractor pool using fillers if needed
    while (distractorPool.length < 5) {
      const f = this.fillers[Math.floor(Math.random() * this.fillers.length)];
      distractorPool.push(f);
    }

    for (let row = 0; row < 2; row++) {
      const y = yOffsets[row];
      for (let col = 0; col < 3; col++) {
        const x = xCenters[col];
        const isCorrect = (invaderSpotIndex === correctIndex);

        if (isCorrect) {
          // Spawn Correct Invader
          const text = this.activeWord.turkish;
          const inv = new Invader(x, y, 160, 56, text, true, this.activeWord);
          this.invaders.push(inv);
        } else {
          // Spawn Distractor Invader
          let dObj = distractorPool.pop();
          let dText = dObj ? dObj.turkish : "DUMMY";
          
          // Responsive Formatting Check: 
          // Test if distractor word width at 9px is too wide for 160px platform (must fit within 150px padding area)
          this.ctx.font = 'bold 9px "Orbitron", Arial, sans-serif';
          let wWidth = this.ctx.measureText(dText).width;
          if (wWidth > 150) {
            // Swap with dynamic filler from fillers.json to maintain grid spacing legibly!
            const fillerObj = this.fillers[Math.floor(Math.random() * this.fillers.length)];
            dText = fillerObj.turkish;
          }

          const inv = new Invader(x, y, 160, 56, dText, false, dObj);
          this.invaders.push(inv);
        }
        invaderSpotIndex++;
      }
    }
  }

  bindEvents() {
    if (!window.invadersKeydownBound) {
      window.invadersKeydownBound = true;
      window.addEventListener('keydown', (e) => {
        if (window.game && window.game.isInvadersGame && window.game.state === 'playing') {
          window.game.handleKeyDown(e);
        }
      });
      window.addEventListener('keyup', (e) => {
        if (window.game && window.game.isInvadersGame && window.game.state === 'playing') {
          window.game.handleKeyUp(e);
        }
      });
    }

    // Touch controls on canvas
    this.canvas.addEventListener('touchstart', (e) => {
      if (this.state !== 'playing' || this.isPaused) return;
      if (e.touches.length > 0) {
        const touchX = e.touches[0].clientX;
        const rect = this.canvas.getBoundingClientRect();
        const canvasX = (touchX - rect.left) / this.scaleX;
        
        // Tap screen horizontally to steer, hold touch triggers firing
        this.player.x = Math.max(30, Math.min(570, canvasX));
        this.input.fire = true;
      }
    });

    this.canvas.addEventListener('touchmove', (e) => {
      if (this.state !== 'playing' || this.isPaused) return;
      if (e.touches.length > 0) {
        const touchX = e.touches[0].clientX;
        const rect = this.canvas.getBoundingClientRect();
        const canvasX = (touchX - rect.left) / this.scaleX;
        this.player.x = Math.max(30, Math.min(570, canvasX));
      }
    }, { passive: false });

    this.canvas.addEventListener('touchend', () => {
      this.input.fire = false;
    });

    // Mobile buttons hooks
    const btnLeft = document.getElementById('btn-left');
    const btnRight = document.getElementById('btn-right');
    const btnFire = document.getElementById('btn-fire');

    if (btnLeft) {
      btnLeft.ontouchstart = () => { this.player.targetVx = -6.5; };
      btnLeft.ontouchend = () => { this.player.targetVx = 0; };
      btnLeft.onmousedown = () => { this.player.targetVx = -6.5; };
      btnLeft.onmouseup = () => { this.player.targetVx = 0; };
    }
    if (btnRight) {
      btnRight.ontouchstart = () => { this.player.targetVx = 6.5; };
      btnRight.ontouchend = () => { this.player.targetVx = 0; };
      btnRight.onmousedown = () => { this.player.targetVx = 6.5; };
      btnRight.onmouseup = () => { this.player.targetVx = 0; };
    }
    if (btnFire) {
      btnFire.ontouchstart = () => { this.input.fire = true; };
      btnFire.ontouchend = () => { this.input.fire = false; };
      btnFire.onmousedown = () => { this.input.fire = true; };
      btnFire.onmouseup = () => { this.input.fire = false; };
    }

    // Pause menu hooks
    const btnPause = document.getElementById('btn-pause');
    if (btnPause) btnPause.onclick = () => this.togglePause();

    const btnResume = document.getElementById('resume-btn');
    if (btnResume) btnResume.onclick = () => this.togglePause();

    const btnPauseExam = document.getElementById('pause-exam-btn');
    if (btnPauseExam) {
      btnPauseExam.onclick = () => {
        cancelAnimationFrame(this.loopId);
        const vocab = this.vocabulary;
        const fn = this.jsonFileName;
        this.cleanup();
        this.isPaused = false;
        document.getElementById('pause-screen').classList.add('hidden');

        window.game = new Game(vocab, fn);
        window.game.state = 'exam';
        if (!window.examEngine) {
          window.examEngine = new ExamEngine();
        }
        window.examEngine.startSession(vocab, window.game);
      };
    }

    const btnPauseRestart = document.getElementById('pause-restart-btn');
    if (btnPauseRestart) {
      btnPauseRestart.onclick = () => {
        this.isPaused = false;
        document.getElementById('pause-screen').classList.add('hidden');
        this.startGame();
      };
    }

    const btnPauseMenu = document.getElementById('pause-menu-btn');
    if (btnPauseMenu) {
      btnPauseMenu.onclick = () => {
        if (!this.confirmQuitActive) {
          this.confirmQuitActive = true;
          btnPauseMenu.textContent = 'CONFIRM QUIT?';
          btnPauseMenu.classList.remove('btn-cyan');
          btnPauseMenu.classList.add('btn-magenta');
          this.confirmQuitTimeoutId = setTimeout(() => {
            this.confirmQuitActive = false;
            btnPauseMenu.textContent = 'MAIN MENU';
            btnPauseMenu.classList.remove('btn-magenta');
            btnPauseMenu.classList.add('btn-cyan');
          }, 3000);
        } else {
          clearTimeout(this.confirmQuitTimeoutId);
          this.confirmQuitActive = false;
          btnPauseMenu.textContent = 'MAIN MENU';
          btnPauseMenu.classList.remove('btn-magenta');
          btnPauseMenu.classList.add('btn-cyan');

          this.isPaused = false;
          document.getElementById('pause-screen').classList.add('hidden');

          cancelAnimationFrame(this.loopId);
          this.cleanup();

          if (window.examEngine) {
            window.examEngine.isActive = false;
            window.examEngine.options = [];
          }

          window.game = null;
          this.state = 'start';
          document.getElementById('hud').classList.add('hidden');
          document.getElementById('gameCanvas').classList.add('hidden');
          document.querySelector('.controls-container').classList.add('hidden');
          showMainMenu();
          updateMainMenuResumeUI();
        }
      };
    }

    // Game Over restart hook
    const restartBtn = document.getElementById('restart-btn');
    if (restartBtn) {
      restartBtn.onclick = () => {
        document.getElementById('game-over-screen').classList.add('hidden');
        this.startGame();
      };
    }

    // Victory restart hook
    const victoryRestartBtn = document.getElementById('victory-restart-btn');
    if (victoryRestartBtn) {
      victoryRestartBtn.onclick = () => {
        document.getElementById('victory-screen').classList.add('hidden');
        this.startGame();
      };
    }
  }

  handleKeyDown(e) {
    if (e.key === 'ArrowLeft' || e.key === 'a' || e.key === 'A') {
      this.player.targetVx = -6.5;
      this.input.left = true;
      e.preventDefault();
    } else if (e.key === 'ArrowRight' || e.key === 'd' || e.key === 'D') {
      this.player.targetVx = 6.5;
      this.input.right = true;
      e.preventDefault();
    } else if (e.key === 'Spacebar' || e.key === ' ' || e.key === 'ArrowUp' || e.key === 'w' || e.key === 'W') {
      this.input.fire = true;
      e.preventDefault();
    } else if (e.key === 'Escape' || e.key === 'p' || e.key === 'P') {
      this.togglePause();
      e.preventDefault();
    }
  }

  handleKeyUp(e) {
    if (e.key === 'ArrowLeft' || e.key === 'a' || e.key === 'A') {
      this.input.left = false;
      if (!this.input.right) this.player.targetVx = 0;
    } else if (e.key === 'ArrowRight' || e.key === 'd' || e.key === 'D') {
      this.input.right = false;
      if (!this.input.left) this.player.targetVx = 0;
    } else if (e.key === 'Spacebar' || e.key === ' ' || e.key === 'ArrowUp' || e.key === 'w' || e.key === 'W') {
      this.input.fire = false;
    }
  }

  togglePause() {
    if (this.state !== 'playing' && this.state !== 'paused') return;

    if (this.state === 'playing') {
      this.state = 'paused';
      this.isPaused = true;
      document.getElementById('pause-screen').classList.remove('hidden');
    } else {
      this.state = 'playing';
      this.isPaused = false;
      document.getElementById('pause-screen').classList.add('hidden');
    }
  }

  triggerScreenShake(duration, intensity) {
    this.screenShakeTimer = duration;
    this.screenShakeIntensity = intensity;
  }

  decreaseShields() {
    this.shields--;
    this.soundManager.playDamage();
    this.damageTimer = 30; // Red flash
    this.triggerScreenShake(20, 6);
    this.updateHUD();

    if (this.shields <= 0) {
      this.gameOver();
    }
  }

  gameOver() {
    this.state = 'gameover';
    this.soundManager.playGameOver();

    document.getElementById('hud').classList.add('hidden');
    document.getElementById('gameCanvas').classList.add('hidden');
    document.querySelector('.controls-container').classList.add('hidden');

    const gameOverScreen = document.getElementById('game-over-screen');
    const finalScoreEl = document.getElementById('final-score');
    const learnedListEl = document.getElementById('learned-list');

    if (finalScoreEl) finalScoreEl.textContent = this.score;

    if (learnedListEl) {
      learnedListEl.innerHTML = '';
      this.wordsLearnedThisRun.forEach(w => {
        const item = document.createElement('li');
        item.style.padding = '6px 12px';
        item.style.borderRadius = '6px';
        item.style.background = 'rgba(255, 255, 255, 0.03)';
        item.style.border = '1px solid rgba(255, 255, 255, 0.05)';
        item.style.color = '#ffffff';
        item.innerHTML = `<strong>${w.english}</strong>: ${w.turkish}`;
        learnedListEl.appendChild(item);
      });
    }

    gameOverScreen.classList.remove('hidden');
  }

  triggerLevelComplete() {
    this.isLevelTransitioning = true;
    this.levelCompleteTimer = 3.0;
    this.collectedGems += 10;
    localStorage.setItem('memolandum_collected_gems', this.collectedGems);
    this.soundManager.playStageClear();
    this.updateHUD();
  }

  triggerFinalVictory() {
    this.state = 'victory';
    this.soundManager.playStageClear();

    document.getElementById('hud').classList.add('hidden');
    document.getElementById('gameCanvas').classList.add('hidden');
    document.querySelector('.controls-container').classList.add('hidden');

    const victoryScreen = document.getElementById('victory-screen');
    const victoryScoreEl = document.getElementById('victory-score');
    const victoryListEl = document.getElementById('victory-learned-list');

    if (victoryScoreEl) victoryScoreEl.textContent = this.score;

    if (victoryListEl) {
      victoryListEl.innerHTML = '';
      this.wordsLearnedThisRun.forEach(w => {
        const item = document.createElement('li');
        item.style.padding = '6px 12px';
        item.style.borderRadius = '6px';
        item.style.background = 'rgba(255, 255, 255, 0.03)';
        item.style.border = '1px solid rgba(255, 255, 255, 0.05)';
        item.style.color = '#ffffff';
        item.innerHTML = `<strong>${w.english}</strong>: ${w.turkish}`;
        victoryListEl.appendChild(item);
      });
    }

    victoryScreen.classList.remove('hidden');
    localStorage.removeItem('memolandum_saved_stage');
    localStorage.removeItem('memolandum_saved_level');
    localStorage.removeItem('memolandum_saved_score');
  }

  nextLevel() {
    this.chunkIndex++;
    const nextExists = this.loadLevelChunk();
    if (nextExists) {
      this.processedCount = 0;
      this.isLevelTransitioning = false;
      
      this.player.x = 300;
      this.player.vx = 0;
      this.player.targetVx = 0;
      this.player.cooldown = 0;

      this.bullets = [];
      this.enemyBullets = [];
      this.fallingGems = [];
      this.invaders = [];

      this.fleetY = 220;
      this.fleetSpeed += 0.015; // Accelerate fleet marginally per level
      this.floatingFx = { active: false };

      this.selectNextWord();
      this.spawnInvaders();
      this.updateHUD();

      localStorage.setItem('memolandum_saved_stage', this.jsonFileName);
      localStorage.setItem('memolandum_saved_level', this.chunkIndex + 1);
      localStorage.setItem('memolandum_saved_score', this.score);
      updateMainMenuResumeUI();
    } else {
      this.triggerFinalVictory();
    }
  }

  updateHUD() {
    const shieldsEl = document.getElementById('hud-shields');
    const levelValEl = document.getElementById('level-val');
    const masteredValEl = document.getElementById('mastered-val');
    const scoreValEl = document.getElementById('score-val');

    const lblLevel = document.getElementById('level-label');
    const lblMastered = document.getElementById('mastered-label');
    const lblScore = document.getElementById('score-label');
    if (lblLevel) lblLevel.textContent = 'LEVEL';
    if (lblMastered) lblMastered.textContent = 'MASTERED';
    if (lblScore) lblScore.textContent = 'SCORE';

    if (shieldsEl) {
      shieldsEl.innerHTML = '';
      for (let i = 0; i < 3; i++) {
        const shieldCell = document.createElement('div');
        shieldCell.className = `shield-cell ${i < this.shields ? 'active' : ''}`;
        shieldsEl.appendChild(shieldCell);
      }
    }

    if (levelValEl) {
      levelValEl.textContent = this.chunkIndex + 1;
    }

    if (masteredValEl) {
      masteredValEl.textContent = `${this.processedCount}/${this.wordsPerLevel}`;
    }

    if (scoreValEl) {
      scoreValEl.textContent = this.score;
    }
  }

  resize() {
    const rect = this.canvas.parentElement.getBoundingClientRect();
    const dpr = window.devicePixelRatio || 1;
    this.canvas.width = rect.width * dpr;
    this.canvas.height = rect.height * dpr;
    this.ctx.scale(dpr, dpr);
    this.scaleX = rect.width / this.virtualWidth;
    this.scaleY = rect.height / this.virtualHeight;
  }

  cleanup() {
    window.removeEventListener('resize', this.resizeHandler);
    this.invaders = [];
    this.bullets = [];
    this.enemyBullets = [];
    this.fallingGems = [];
    this.activeParticles = [];
    this.activeFloatingTexts = [];
    this.stars = [];
    this.soundManager = null;
  }

  gameLoop(currentTime) {
    if (window.game !== this) return;
    this.loopId = requestAnimationFrame((time) => this.gameLoop(time));

    this.ctx.save();
    this.ctx.scale(this.scaleX, this.scaleY);

    if (this.state === 'playing' || this.state === 'freeze') {
      this.updateGame();
    }
    this.drawGame();
    this.ctx.restore();
  }

  updateGame() {
    // Screen shake countdown
    if (this.screenShakeTimer > 0) {
      this.screenShakeTimer--;
    }

    // Damage flash countdown
    if (this.damageTimer > 0) {
      this.damageTimer--;
    }

    // Bullet-Time slowdown factor for Star Wars crawl FX
    let dt = 1.0;
    if (this.floatingFx && this.floatingFx.active) {
      dt = 0.2;
    }

    if (this.isLevelTransitioning) {
      this.levelCompleteTimer -= (1 / 60) * dt;
      if (this.levelCompleteTimer <= 0) {
        this.nextLevel();
      }
    }

    // Update background stars
    this.stars.forEach(star => star.update(this.virtualHeight));

    // Update particles
    for (let i = this.activeParticles.length - 1; i >= 0; i--) {
      const p = this.activeParticles[i];
      p.update();
      if (p.life <= 0) {
        this.activeParticles.splice(i, 1);
        this.particlePool.release(p);
      }
    }

    // Update floating texts
    for (let i = this.activeFloatingTexts.length - 1; i >= 0; i--) {
      const ft = this.activeFloatingTexts[i];
      ft.update();
      if (ft.life <= 0) {
        this.activeFloatingTexts.splice(i, 1);
        this.floatingTextPool.release(ft);
      }
    }

    // Update Star Wars Crawl FX
    if (this.floatingFx && this.floatingFx.active) {
      this.floatingFx.duration -= (1 / 60);
      
      // Magnetic pull of gems is complete during crawl celebration
      this.fallingGems.forEach(gem => gem.update(this.player.x, this.player.y));
      
      if (this.floatingFx.duration <= 0) {
        this.floatingFx.active = false;
        
        // Commit attempt to ExamEngine
        if (window.examEngine) {
          window.examEngine.registerAttempt(this.activeWord.english, true);
        }

        // Spawn next wave
        this.selectNextWord();
        this.spawnInvaders();
      }
      return; // Freeze main action physics during celebration crawl!
    }

    // 1. Player Slide Physics
    if (this.player.targetVx !== 0) {
      this.player.vx += (this.player.targetVx - this.player.vx) * 0.22;
    } else {
      this.player.vx *= 0.88; // Deceleration friction slide
    }
    this.player.x += this.player.vx * dt;

    // Constrain player bounds
    if (this.player.x < 30) {
      this.player.x = 30;
      this.player.vx = 0;
    }
    if (this.player.x > 570) {
      this.player.x = 570;
      this.player.vx = 0;
    }

    // Exhaust tail particles
    if (Math.random() < 0.2) {
      this.activeParticles.push(this.particlePool.acquire(this.player.x, this.player.y + 18, '#ff00ff', 'smoke'));
    }

    // 2. Auto-Fire Controller (fires every 60 frames if held - 1 shot per second)
    if (this.player.cooldown > 0) {
      this.player.cooldown--;
    }
    if (this.input.fire && this.player.cooldown <= 0) {
      this.bullets.push(new InvadersBullet(this.player.x, this.player.y - 18));
      this.soundManager.playLaser();
      this.player.cooldown = 60; // 60 frame cooldown (1 second)
    }

    // 3. Update Player Bullets
    for (let i = this.bullets.length - 1; i >= 0; i--) {
      const b = this.bullets[i];
      b.update();
      if (!b.active) {
        this.bullets.splice(i, 1);
      }
    }

    // 4. Update Guided Counter Shells (Enemy Bullets)
    for (let i = this.enemyBullets.length - 1; i >= 0; i--) {
      const eb = this.enemyBullets[i];
      eb.update(this.player.x);
      
      // Spawn plasma trail particles
      if (Math.random() < 0.3) {
        this.activeParticles.push(this.particlePool.acquire(eb.x, eb.y, '#ff0055', 'plasma'));
      }

      // Check collision with player ship (AABB)
      const px = this.player.x - this.player.width / 2;
      const py = this.player.y - this.player.height / 2;
      const pw = this.player.width;
      const ph = this.player.height;

      const ebx = eb.x - eb.width / 2;
      const eby = eb.y - eb.height / 2;
      const ebw = eb.width;
      const ebh = eb.height;

      const hit = ebx < px + pw && ebx + ebw > px && eby < py + ph && eby + ebh > py;
      
      if (hit) {
        eb.active = false;
        this.enemyBullets.splice(i, 1);
        this.decreaseShields();
        
        // Spawn damage explosion particles
        for (let k = 0; k < 15; k++) {
          this.activeParticles.push(this.particlePool.acquire(this.player.x, this.player.y, '#ff0055', 'spark'));
        }
      } else if (!eb.active) {
        this.enemyBullets.splice(i, 1);
      }
    }

    // 5. Update Falling Gems (magnetic pull)
    for (let i = this.fallingGems.length - 1; i >= 0; i--) {
      const gem = this.fallingGems[i];
      gem.update(this.player.x, this.player.y);

      // Check player capture (AABB or distance check)
      const dist = Math.hypot(this.player.x - gem.x, this.player.y - gem.y);
      if (dist < 25) {
        gem.active = false;
        this.fallingGems.splice(i, 1);
        
        this.score += 50;
        this.collectedGems++;
        localStorage.setItem('memolandum_collected_gems', this.collectedGems);
        this.soundManager.playGemTick();
        this.updateHUD();

        const ft = this.floatingTextPool.acquire(gem.x, gem.y, "+💎", '#00ffcc');
        this.activeFloatingTexts.push(ft);
      } else if (!gem.active) {
        this.fallingGems.splice(i, 1);
      }
    }

    // 6. Update Invaders descent Y position
    this.fleetY += this.fleetSpeed * this.speedMultiplier * dt;
    this.invaders.forEach(inv => inv.update(this.fleetY));

    // Check Fleet Invasion Y Limit (reach Y=780, reset and punish)
    let reachedLimit = false;
    for (let i = 0; i < this.invaders.length; i++) {
      if (this.invaders[i].active && this.invaders[i].currentY + 20 >= 780) {
        reachedLimit = true;
        break;
      }
    }

    if (reachedLimit) {
      this.decreaseShields();
      this.fleetY = 220; // reset fleet Y
      const ft = this.floatingTextPool.acquire(300, 500, "FLEET INVASION RESET!", '#ff0055');
      this.activeFloatingTexts.push(ft);
    }

    // 7. Core 2D AABB Collision Matrix (Player Bullet vs Invader Ship)
    for (let bIdx = this.bullets.length - 1; bIdx >= 0; bIdx--) {
      const b = this.bullets[bIdx];
      if (!b.active) continue;

      for (let invIdx = 0; invIdx < this.invaders.length; invIdx++) {
        const inv = this.invaders[invIdx];
        if (!inv.active) continue;

        const bx1 = b.x - b.width / 2;
        const by1 = b.y - b.height / 2;
        const bx2 = b.x + b.width / 2;
        const by2 = b.y + b.height / 2;

        const invX1 = inv.x - inv.width / 2;
        const invY1 = inv.currentY - inv.height / 2;
        const invX2 = inv.x + inv.width / 2;
        const invY2 = inv.currentY + inv.height / 2;

        const overlap = bx1 < invX2 && bx2 > invX1 && by1 < invY2 && by2 > invY1;

        if (overlap) {
          b.active = false;
          this.bullets.splice(bIdx, 1);

          if (inv.isCorrect) {
            // TARGET ACQUIRED! Kusursuz Vuruş!
            this.handleCorrectHit(inv);
          } else {
            // INCORRECT HIT! Wrong Target Counter-Shell!
            this.handleIncorrectHit(inv);
          }
          break;
        }
      }
    }
  }

  handleCorrectHit(correctInvader) {
    this.soundManager.playExplosion();
    this.soundManager.playStageRiser();
    this.triggerScreenShake(20, 7);

    // Save mastered word to local list
    const found = this.vocabulary.find(v => v.english === this.activeWord.english);
    if (found && !this.wordsLearnedThisRun.some(w => w.english === found.english)) {
      this.wordsLearnedThisRun.push(found);
    }

    this.score += 500;
    this.collectedGems += 10;
    localStorage.setItem('memolandum_collected_gems', this.collectedGems);
    this.processedCount++;
    this.updateHUD();

    // Trigger chain-explosion for all remaining invader figures
    this.invaders.forEach(inv => {
      if (inv.active) {
        inv.active = false;
        
        // Sparks at invader center
        for (let k = 0; k < 18; k++) {
          this.activeParticles.push(this.particlePool.acquire(inv.x, inv.currentY, '#39ff14', 'spark'));
        }
        
        // Spawn gem falling
        this.fallingGems.push(new InvadersGem(inv.x, inv.currentY));
      }
    });

    const ft = this.floatingTextPool.acquire(correctInvader.x, correctInvader.currentY - 15, "PERFECT CLEAR! +500", '#39ff14');
    this.activeFloatingTexts.push(ft);

    // Initialize Star Wars 3D Crawl Celebration & Freeze Frame state
    this.triggerStarWarsCrawl();
  }

  handleIncorrectHit(incorrectInvader) {
    incorrectInvader.active = false;
    this.soundManager.playExplosion();
    
    // Spawn wrong hit feedback sparks
    for (let k = 0; k < 12; k++) {
      this.activeParticles.push(this.particlePool.acquire(incorrectInvader.x, incorrectInvader.currentY, '#ff5500', 'spark'));
    }

    // Register incorrect attempt in ExamEngine
    if (window.examEngine) {
      window.examEngine.registerAttempt(this.activeWord.english, false);
    }

    const ft = this.floatingTextPool.acquire(incorrectInvader.x, incorrectInvader.currentY - 15, "WRONG TARGET!", '#ff0055');
    this.activeFloatingTexts.push(ft);
  }

  triggerStarWarsCrawl() {
    this.floatingFx = {
      active: true,
      english: this.activeWord.english,
      turkish: this.activeWord.turkish,
      y: 750,
      duration: 3.0 // 3-second crawl window
    };
  }

  drawGame() {
    // 1. Draw Starry Void
    this.ctx.fillStyle = '#060312';
    this.ctx.fillRect(0, 0, this.virtualWidth, this.virtualHeight);

    // Stars background
    this.stars.forEach(star => star.draw(this.ctx));

    // 2. Translate for screen shake offsets
    this.ctx.save();
    if (this.screenShakeTimer > 0) {
      const dx = (Math.random() - 0.5) * this.screenShakeIntensity;
      const dy = (Math.random() - 0.5) * this.screenShakeIntensity;
      this.ctx.translate(dx, dy);
    }

    // Render invaders fleet
    this.invaders.forEach(inv => inv.draw(this.ctx));

    // Render player bullets
    this.bullets.forEach(b => b.draw(this.ctx));

    // Render enemy guided counter bullets
    this.enemyBullets.forEach(eb => eb.draw(this.ctx));

    // Render falling gems
    this.fallingGems.forEach(gem => gem.draw(this.ctx));

    // Render particles & floating texts
    this.activeParticles.forEach(p => p.draw(this.ctx));
    this.activeFloatingTexts.forEach(ft => ft.draw(this.ctx));

    // Render player spaceship
    this.drawPlayer(this.ctx);

    this.ctx.restore();

    // 3. Render Cyber Target Billboard
    this.drawTargetHUD(this.ctx);

    // 4. Render Star Wars 3D crawl overlay
    if (this.floatingFx && this.floatingFx.active) {
      this.drawStarWarsCrawl(this.ctx);
    }

    // 5. Draw damage red flash overlay
    if (this.damageTimer > 0) {
      this.ctx.fillStyle = `rgba(255, 0, 85, ${this.damageTimer / 60})`;
      this.ctx.fillRect(0, 0, this.virtualWidth, this.virtualHeight);
    }

    // 6. Draw Level Transition Overlay
    if (this.isLevelTransitioning) {
      this.drawLevelTransition(this.ctx);
    }
  }

  drawPlayer(ctx) {
    ctx.save();
    const px = this.player.x;
    const py = this.player.y;
    const pw = this.player.width;
    const ph = this.player.height;

    // Glowing shadow
    ctx.shadowColor = '#bd00ff'; // neon purple player ship
    ctx.shadowBlur = 10;
    ctx.fillStyle = 'rgba(10, 8, 25, 0.9)';
    ctx.strokeStyle = '#bd00ff';
    ctx.lineWidth = 2.5;

    // Spaceship vectors shape
    ctx.beginPath();
    ctx.moveTo(px, py - ph / 2); // front tip
    ctx.lineTo(px + pw / 2, py + ph / 2); // right wing tip
    ctx.lineTo(px + pw / 6, py + ph / 4); // wing indent right
    ctx.lineTo(px - pw / 6, py + ph / 4); // wing indent left
    ctx.lineTo(px - pw / 2, py + ph / 2); // left wing tip
    ctx.closePath();
    ctx.fill();
    ctx.stroke();

    // Cockpit neon cyan core
    ctx.strokeStyle = '#00f0ff';
    ctx.fillStyle = 'rgba(0, 240, 255, 0.25)';
    ctx.beginPath();
    ctx.roundRect(px - 10, py - 10, 20, 15, 3);
    ctx.fill();
    ctx.stroke();

    // Renders active target English word written directly on top of the player spaceship
    if (this.activeWord && !this.isLevelTransitioning) {
      ctx.fillStyle = 'rgba(10, 8, 20, 0.95)';
      ctx.strokeStyle = '#00f0ff';
      ctx.lineWidth = 1.5;
      ctx.shadowColor = '#00f0ff';
      ctx.shadowBlur = 4;
      
      const text = this.activeWord.english;
      ctx.font = 'bold 15px "Orbitron", Arial, sans-serif';
      const textWidth = ctx.measureText(text).width;
      const boxWidth = textWidth + 20;
      const boxHeight = 28;
      const bx = px - boxWidth / 2;
      const by = py - ph / 2 - boxHeight - 8; // 8px above tip
      
      ctx.beginPath();
      ctx.roundRect(bx, by, boxWidth, boxHeight, 5);
      ctx.fill();
      ctx.stroke();
      
      ctx.fillStyle = '#ffffff';
      ctx.shadowBlur = 0;
      ctx.textAlign = 'center';
      ctx.textBaseline = 'middle';
      ctx.fillText(text, px, by + boxHeight / 2);
    }

    ctx.restore();
  }

  drawTargetHUD(ctx) {
    ctx.save();
    
    const bob = Math.sin(Date.now() * 0.0035) * 2.5;
    const ty = 120 + bob;
    const tx = this.virtualWidth / 2;

    ctx.fillStyle = 'rgba(8, 6, 20, 0.95)';
    ctx.strokeStyle = '#00f0ff';
    ctx.lineWidth = 3;
    ctx.shadowColor = '#00f0ff';
    ctx.shadowBlur = 8;

    ctx.beginPath();
    ctx.roundRect(tx - 160, ty - 38, 320, 76, 8);
    ctx.fill();
    ctx.stroke();

    // Cyber grid lines
    ctx.strokeStyle = 'rgba(0, 240, 255, 0.08)';
    ctx.lineWidth = 1;
    ctx.shadowBlur = 0;
    ctx.beginPath();
    for (let gx = tx - 150; gx < tx + 160; gx += 20) {
      ctx.moveTo(gx, ty - 32);
      ctx.lineTo(gx, ty + 32);
    }
    ctx.stroke();

    if (this.activeWord) {
      ctx.fillStyle = '#ffffff';
      ctx.font = '900 24px "Orbitron", sans-serif';
      ctx.shadowColor = '#00f0ff';
      ctx.shadowBlur = 6;
      ctx.textAlign = 'center';
      ctx.textBaseline = 'middle';
      
      // Dynamic target text fit check
      let fontSize = 24;
      let textWidth = ctx.measureText(this.activeWord.english).width;
      while (textWidth > 300 && fontSize > 14) {
        fontSize--;
        ctx.font = `900 ${fontSize}px "Orbitron", sans-serif`;
        textWidth = ctx.measureText(this.activeWord.english).width;
      }

      ctx.fillText(this.activeWord.english, tx, ty);
    }

    ctx.restore();
  }

  drawStarWarsCrawl(ctx) {
    ctx.save();
    const floatingFx = this.floatingFx;
    const progress = Math.max(0, floatingFx.duration / 3.0);

    // Scroll up
    floatingFx.y -= 150 * (1 / 60);

    ctx.fillStyle = 'rgba(5, 2, 12, 0.7)';
    ctx.fillRect(0, 0, this.virtualWidth, this.virtualHeight);

    const textY = floatingFx.y;
    if (textY > 50 && textY < 950) {
      ctx.save();
      
      // Star Wars perspective depth formula
      const scale = Math.max(0.2, (textY - 50) / 600);
      ctx.translate(this.virtualWidth / 2, textY);
      ctx.scale(scale, scale);

      ctx.globalAlpha = progress;
      ctx.fillStyle = '#ffea00'; // Star Wars Gold
      ctx.font = 'bold 32px "Orbitron", Arial, sans-serif';
      ctx.textAlign = 'center';
      ctx.shadowColor = '#ffea00';
      ctx.shadowBlur = 10;
      ctx.fillText(floatingFx.english, 0, -18);

      ctx.fillStyle = '#00f0ff'; // Cyan meaning
      ctx.shadowColor = '#00f0ff';
      ctx.font = 'bold 22px Arial, sans-serif';
      ctx.fillText(floatingFx.turkish, 0, 18);

      ctx.restore();
    }

    ctx.restore();
  }

  drawLevelTransition(ctx) {
    ctx.save();
    ctx.fillStyle = 'rgba(5, 2, 12, 0.75)';
    ctx.fillRect(0, 0, this.virtualWidth, this.virtualHeight);

    const cx = this.virtualWidth / 2;
    const cy = this.virtualHeight / 2 - 30;

    ctx.textAlign = 'center';
    ctx.textBaseline = 'middle';
    ctx.fillStyle = '#39ff14';
    ctx.font = '900 38px "Orbitron", sans-serif';
    ctx.shadowColor = '#39ff14';
    ctx.shadowBlur = 15;
    ctx.fillText("SECTOR DECRYPTED", cx, cy - 30);

    ctx.fillStyle = '#ffffff';
    ctx.font = '700 16px "Orbitron", sans-serif';
    ctx.shadowBlur = 0;
    ctx.fillText("CLIMB BONUS GEMS: +10 💎", cx, cy + 25);

    const countdown = Math.max(1, Math.ceil(this.levelCompleteTimer));
    ctx.fillStyle = '#39ff14';
    ctx.font = '900 18px "Orbitron", sans-serif';
    ctx.shadowColor = '#39ff14';
    ctx.shadowBlur = 8;
    ctx.fillText(`LOADING ROADWAY MATRIX ... ${countdown}`, cx, cy + 80);

    ctx.restore();
  }
}

window.InvadersGame = InvadersGame;
