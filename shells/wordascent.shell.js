// The Word Ascent Protocol (Shell #5) - Retro Neon Vertical Platformer
// Features Lerp camera tracking, procedural platform spawning, auto-bounce physics,
// combo rocket mods, bullet-time slowdowns, and Star Wars holographic crawlers.

class AscentObjectPool {
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

class AscentParticle {
  reset(x, y, color, type = 'spark') {
    this.x = x;
    this.y = y;
    this.type = type; // 'spark' or 'smoke'
    
    if (type === 'spark') {
      const angle = Math.random() * Math.PI * 2;
      const speed = 1 + Math.random() * 4;
      this.vx = Math.cos(angle) * speed;
      this.vy = Math.sin(angle) * speed;
      this.size = 2 + Math.random() * 2;
      this.color = color || '#00f0ff';
      this.alpha = 1.0;
      this.maxLife = 20 + Math.random() * 15;
    } else {
      // Smoke / Trail
      this.vx = (Math.random() - 0.5) * 0.8;
      this.vy = Math.random() * 1.5; // fall behind
      this.size = 5 + Math.random() * 5;
      this.color = color || '#ff0055';
      this.alpha = 0.8;
      this.maxLife = 30 + Math.random() * 20;
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
    ctx.shadowBlur = this.type === 'spark' ? 6 : 0;
    ctx.beginPath();
    ctx.arc(this.x, this.y, this.size, 0, Math.PI * 2);
    ctx.fill();
    ctx.restore();
  }
}

class AscentFloatingText {
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

class Platform {
  constructor(x, y, width, text, isCorrect, isFiller, isGround = false, floor = 0) {
    this.x = x; // center X
    this.y = y; // center Y
    this.width = width;
    this.height = 20;
    this.text = text;
    this.isCorrect = isCorrect;
    this.isFiller = isFiller;
    this.isGround = isGround;
    this.floor = floor;

    // Theme color
    if (isGround) {
      this.color = '#777777';
    } else if (isCorrect) {
      this.color = '#39ff14'; // green correct
    } else if (isFiller) {
      this.color = '#ffaa00'; // orange filler
    } else {
      this.color = '#ff0055'; // magenta wrong
    }
    
    this.active = true;
    this.pulseTimer = 0;
  }

  update() {
    this.pulseTimer += 0.05;
  }

  draw(ctx) {
    if (!this.active) return;

    ctx.save();
    ctx.strokeStyle = this.color;
    ctx.lineWidth = 2.5;

    // Glowing shadow
    ctx.shadowColor = this.color;
    ctx.shadowBlur = this.isGround ? 0 : 8 + Math.sin(this.pulseTimer) * 3;
    ctx.fillStyle = 'rgba(10, 8, 20, 0.9)';

    // Rounded rectangle chassis
    ctx.beginPath();
    ctx.roundRect(this.x - this.width / 2, this.y - this.height / 2, this.width, this.height, 6);
    ctx.fill();
    ctx.stroke();

    // Renders the label meaning text on top of the platform
    if (this.text) {
      ctx.shadowBlur = 0;
      ctx.fillStyle = '#ffffff';
      
      // Calculate font size dynamically based on platform width and text length
      let fontSize = 16;
      ctx.font = `bold ${fontSize}px "Orbitron", Arial, sans-serif`;
      let textWidth = ctx.measureText(this.text).width;
      
      while (textWidth > this.width - 12 && fontSize > 10) {
        fontSize--;
        ctx.font = `bold ${fontSize}px "Orbitron", Arial, sans-serif`;
        textWidth = ctx.measureText(this.text).width;
      }
      
      ctx.textAlign = 'center';
      ctx.textBaseline = 'middle';
      ctx.fillText(this.text, this.x, this.y);
    }

    ctx.restore();
  }
}

class WordAscentGame {
  constructor(vocabulary, jsonFileName) {
    this.isWordAscentGame = true;
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

    // World & Camera physics
    this.cameraY = 0;
    this.targetCameraY = 0;
    
    // Player initial metrics
    this.player = {
      x: 300,
      y: 850,
      vx: 0,
      vy: 0,
      width: 40,
      height: 40,
      targetVx: 0,
      gravity: 0.38,
      grounded: false,
      standingOn: null,
      lastStandingOn: null
    };
    this.coyoteTimer = 0;
    this.jumpBufferTimer = 0;

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

    // Entity lists
    this.platforms = [];
    this.activeParticles = [];
    this.activeFloatingTexts = [];
    this.stars = [];

    // Object Pools
    this.particlePool = new AscentObjectPool(
      () => new AscentParticle(),
      (p, x, y, color, type) => p.reset(x, y, color, type)
    );

    this.floatingTextPool = new AscentObjectPool(
      () => new AscentFloatingText(),
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
    this.comboCount = 0;
    this.rocketActive = false;
    this.rocketTimer = 0;
    this.comboWords = []; // tracks the 5 words for the Star Wars Crawl
    this.maxClearedFloor = 0;

    // Threat laser line
    this.laserY = 1050;
    this.laserSpeed = 0.6;
    this.damageCoolDown = 0;

    // Star Wars Crawl overlay info
    this.floatingFx = { active: false };

    // Screen Shake
    this.screenShakeTimer = 0;
    this.screenShakeIntensity = 0;

    // Load stars
    for (let i = 0; i < 40; i++) {
      const star = new Star();
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

    // Reset player position
    this.player.x = 300;
    this.player.y = 850;
    this.player.vx = 0;
    this.player.vy = 0;
    this.player.grounded = false;
    this.player.standingOn = null;
    this.player.lastStandingOn = null;
    this.coyoteTimer = 0;
    this.jumpBufferTimer = 0;
    this.cameraY = 0;
 
    this.platforms = [];
    this.activeParticles.forEach(p => this.particlePool.release(p));
    this.activeFloatingTexts.forEach(ft => this.floatingTextPool.release(ft));
    this.activeParticles = [];
    this.activeFloatingTexts = [];
 
    this.comboCount = 0;
    this.rocketActive = false;
    this.rocketTimer = 0;
    this.comboWords = [];
    this.maxClearedFloor = 0;
    this.laserY = 1050;
    this.laserSpeed = 0.8;
    this.damageCoolDown = 0;
 
    this.loadLevelChunk();
    this.selectNextWord();
    
    // Generate Floor 0 ground and Floor 1 platforms dynamically
    this.currentFloor = 0;
    this.platforms.push(new Platform(300, 920, 600, "START CLIMBING!", false, false, true, 0));
    this.spawnFloorPlatforms(1);
 
    this.state = 'playing';

    document.getElementById('start-screen').classList.add('hidden');
    document.getElementById('game-over-screen').classList.add('hidden');
    document.getElementById('victory-screen').classList.add('hidden');
    
    // Ensure gameplay elements are visible on start/restart
    document.getElementById('gameCanvas').classList.remove('hidden');
    document.getElementById('hud').classList.remove('hidden');
    const controls = document.querySelector('.controls-container');
    if (controls) controls.classList.remove('hidden');
    
    // Switch HUD labels back to default
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

  spawnFloorPlatforms(floorIndex) {
    const y = 920 - floorIndex * 140;
    
    // Choose floor target word
    let wordObj = this.activeWord;

    // Pick a correct lane (0, 1, or 2)
    const correctLane = Math.floor(Math.random() * 3);

    // Get distractor meanings
    const otherVocab = this.vocabulary.filter(w => w.turkish !== wordObj.turkish);
    const distractorWords = [];
    while (distractorWords.length < 2 && otherVocab.length > 0) {
      const w = otherVocab[Math.floor(Math.random() * otherVocab.length)];
      if (!distractorWords.some(d => d.turkish === w.turkish)) {
        distractorWords.push(w);
      }
    }
    // Fallback fillers if distractors are too short
    while (distractorWords.length < 2) {
      const f = this.fillers[Math.floor(Math.random() * this.fillers.length)];
      distractorWords.push(f);
    }

    const laneCenters = [120, 300, 480];

    for (let lane = 0; lane < 3; lane++) {
      const x = laneCenters[lane];
      
      if (lane === correctLane) {
        // Correct option platform
        // Calculate platform width based on string length dynamically
        const wWidth = Math.min(180, Math.max(90, wordObj.turkish.length * 9 + 20));
        const plat = new Platform(x, y, wWidth, wordObj.turkish, true, false, false, floorIndex);
        plat.englishMatch = wordObj.english; // save for Star Wars Crawl matching
        this.platforms.push(plat);
      } else {
        // Distractor platform
        const dObj = distractorWords.pop();
        const dText = dObj ? dObj.turkish : "DUMMY";
        const wWidth = Math.min(180, Math.max(90, dText.length * 9 + 20));
        const plat = new Platform(x, y, wWidth, dText, false, false, false, floorIndex);
        this.platforms.push(plat);
      }
    }
  }

  bindEvents() {
    if (!window.wordascentKeydownBound) {
      window.wordascentKeydownBound = true;
      window.addEventListener('keydown', (e) => {
        if (window.game && window.game.isWordAscentGame && window.game.state === 'playing') {
          window.game.handleKeyDown(e);
        }
      });
      window.addEventListener('keyup', (e) => {
        if (window.game && window.game.isWordAscentGame && window.game.state === 'playing') {
          window.game.handleKeyUp(e);
        }
      });
    }

    // Touch controls on canvas
    this.canvas.addEventListener('touchstart', (e) => {
      if (this.state !== 'playing' || this.isPaused) return;
      if (e.touches.length > 0) {
        const touchX = e.touches[0].clientX;
        const touchY = e.touches[0].clientY;
        const rect = this.canvas.getBoundingClientRect();
        const canvasX = (touchX - rect.left) / this.scaleX;
        const canvasY = (touchY - rect.top) / this.scaleY;

        // Tapping upper half of canvas jumps, lower half steers
        if (canvasY < this.virtualHeight / 2) {
          this.jumpBufferTimer = 6;
          this.tryJump();
        } else {
          if (canvasX < this.virtualWidth / 2) {
            this.player.targetVx = -6.5;
          } else {
            this.player.targetVx = 6.5;
          }
        }
      }
    });

    this.canvas.addEventListener('touchend', () => {
      this.player.targetVx = 0;
    });

    // Mobile buttons hooks
    const btnLeft = document.getElementById('btn-left');
    const btnRight = document.getElementById('btn-right');
    const btnFire = document.getElementById('btn-fire'); // Used for manual jump / Super Jump

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
      btnFire.onclick = () => {
        if (this.comboCount >= 3 && !this.rocketActive) {
          const currentFloor = this.player.standingOn ? this.player.standingOn.floor : (this.maxClearedFloor || 0);
          this.triggerSuperJump(currentFloor);
        } else {
          this.jumpBufferTimer = 6;
          this.tryJump();
        }
      };
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
      e.preventDefault();
    } else if (e.key === 'ArrowRight' || e.key === 'd' || e.key === 'D') {
      this.player.targetVx = 6.5;
      e.preventDefault();
    } else if (e.key === 'ArrowUp' || e.key === 'w' || e.key === 'W' || e.key === ' ') {
      if (e.key === ' ' && this.comboCount >= 3 && !this.rocketActive) {
        const currentFloor = this.player.standingOn ? this.player.standingOn.floor : (this.maxClearedFloor || 0);
        this.triggerSuperJump(currentFloor);
      } else {
        this.jumpBufferTimer = 6;
        this.tryJump();
      }
      e.preventDefault();
    } else if (e.key === 'Escape' || e.key === 'p' || e.key === 'P') {
      this.togglePause();
      e.preventDefault();
    }
  }

  handleKeyUp(e) {
    if (e.key === 'ArrowLeft' || e.key === 'a' || e.key === 'A' || e.key === 'ArrowRight' || e.key === 'd' || e.key === 'D') {
      this.player.targetVx = 0;
    }
  }

  tryJump() {
    const canJump = this.player.grounded || this.coyoteTimer > 0;
    if (canJump) {
      const p = this.player.standingOn || this.player.lastStandingOn;
      const baseJump = (p && p.isCorrect) ? -16.0 : -11.0;
      
      // Momentum-based speed boost (Icy Tower style!)
      let speedBoost = 0;
      const absVx = Math.abs(this.player.vx);
      if (absVx > 2.0) {
        speedBoost = Math.min(4.5, (absVx - 2.0) * 0.9);
      }
      
      this.player.vy = baseJump - speedBoost;
      this.player.grounded = false;
      this.player.standingOn = null;
      this.coyoteTimer = 0;
      this.jumpBufferTimer = 0;
      this.soundManager.playGemTick();
      
      // Neon sparks at player feet
      for (let k = 0; k < 8; k++) {
        this.activeParticles.push(this.particlePool.acquire(this.player.x, this.player.y + 20, '#00f0ff', 'spark'));
      }
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

  gameOver() {
    this.state = 'gameover';
    this.soundManager.playDamage();

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
      this.player.y = 850;
      this.player.vx = 0;
      this.player.vy = 0;
      this.player.grounded = false;
      this.player.standingOn = null;
      this.player.lastStandingOn = null;
      this.coyoteTimer = 0;
      this.jumpBufferTimer = 0;
      this.cameraY = 0;
      this.comboCount = 0;
      this.maxClearedFloor = 0;
      this.laserY = 1050;
      this.laserSpeed += 0.025; // accelerate laser speed slightly per level

      this.selectNextWord();
      
      this.platforms = [];
      this.platforms.push(new Platform(300, 920, 600, "START CLIMBING!", false, false, true, 0));
      this.spawnFloorPlatforms(1);

      this.updateHUD();

      localStorage.setItem('memolandum_saved_stage', this.jsonFileName);
      localStorage.setItem('memolandum_saved_level', this.chunkIndex + 1);
      localStorage.setItem('memolandum_saved_score', this.score);
      updateMainMenuResumeUI();
    } else {
      this.triggerFinalVictory();
    }
  }

  decreaseShields() {
    this.shields--;
    this.soundManager.playDamage();
    this.damageTimer = 30; // red damage screen flash
    this.triggerScreenShake(20, 5);
    this.updateHUD();

    if (this.shields <= 0) {
      this.gameOver();
    }
  }

  updateHUD() {
    const shieldsEl = document.getElementById('hud-shields');
    const levelValEl = document.getElementById('level-val');
    const masteredValEl = document.getElementById('mastered-val');
    const scoreValEl = document.getElementById('score-val');

    // Reset layout labels if changed by other shells
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
    this.platforms = [];
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
    // Decrement input helper timers
    if (this.coyoteTimer > 0) this.coyoteTimer--;
    if (this.jumpBufferTimer > 0) this.jumpBufferTimer--;

    // Bullet-time slowdown factor
    let dt = 1.0;
    if (this.floatingFx && this.floatingFx.active) {
      dt = 0.2; // Bullet-Time slow motion
    }

    // Screen shake countdown
    if (this.screenShakeTimer > 0) {
      this.screenShakeTimer--;
    }

    // Damage flash countdown
    if (this.damageTimer > 0) {
      this.damageTimer--;
    }

    if (this.isLevelTransitioning) {
      this.levelCompleteTimer -= (1 / 60) * dt;
      if (this.levelCompleteTimer <= 0) {
        this.nextLevel();
      }
    }

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
      if (this.floatingFx.duration <= 0) {
        this.floatingFx.active = false;
        // Proceed vocabulary updates at the end of crawl
        const lastFloor = this.rocketStartFloor + 5;
        this.selectNextWord();
        this.spawnFloorPlatforms(lastFloor + 1);
      }
      return; // Freeze movement during Star Wars Cinematic Clear
    }

    // Rocket Mod Timer
    if (this.rocketActive) {
      this.rocketTimer--;
      this.player.vy = -22.0; // Fly upwards! (scaled from -30)
      this.player.vx = 0;
      this.player.y += this.player.vy;

      // Spawn flame trails
      if (Math.random() < 0.6) {
        const px = this.player.x + (Math.random() - 0.5) * 16;
        const py = this.player.y + 20;
        this.activeParticles.push(this.particlePool.acquire(px, py, '#00f0ff', 'smoke'));
      }

      if (this.rocketTimer <= 0) {
        this.rocketActive = false;
        this.comboCount = 0; // reset combo after rocket completes
        
        // Land the player on a safe checkpoint ground platform at the target height to continue tırmanış
        const targetFloor = this.rocketStartFloor + 5;
        const targetY = 920 - targetFloor * 140;
        this.player.y = targetY - 30; // standing on top
        this.player.vy = 0;
        
        // Spawn a temporary checkpoint ground platform for them to land on
        const cp = new Platform(300, targetY, 600, "CHECKPOINT REACHED", false, false, true, targetFloor);
        this.platforms.push(cp);
        
        this.player.grounded = true;
        this.player.standingOn = cp;
        
        // Immediately select next word and spawn platforms to keep momentum and playing flow continuous!
        this.selectNextWord();
        this.spawnFloorPlatforms(targetFloor + 1);
      }
    } else {
      // Normal physics with slidey run-slide inertia
      if (this.player.targetVx !== 0) {
        this.player.vx += (this.player.targetVx - this.player.vx) * 0.22;
      } else {
        this.player.vx *= 0.88; // Deceleration slide friction
      }
      this.player.x += this.player.vx * dt;

      // Wrap horizontal borders
      if (this.player.x < 20) {
        this.player.x = 20;
        this.player.vx = 0;
      }
      if (this.player.x > 580) {
        this.player.x = 580;
        this.player.vx = 0;
      }

      // Check if player walked off their standing platform (center-based edge check)
      if (this.player.grounded && this.player.standingOn) {
        const p = this.player.standingOn;
        const dx = Math.abs(this.player.x - p.x);
        if (dx >= (p.width / 2 + 6)) {
          this.player.grounded = false;
          this.player.standingOn = null;
          this.coyoteTimer = 6; // Trigger coyote time window
        }
      }

      if (!this.player.grounded) {
        this.player.vy += this.player.gravity * dt;
        this.player.y += this.player.vy * dt;
      } else {
        this.player.vy = 0;
      }
    }

    // Update Laser Threat Line
    if (!this.rocketActive) {
      this.laserY -= this.laserSpeed * this.speedMultiplier * dt;
      // Laser Y bounding to prevent getting too far
      if (this.laserY < this.player.y + 450) {
        this.laserY = this.player.y + 450;
      }
      
      // Pull laser upwards faster if player is climbing
      this.laserY = Math.min(this.laserY, this.player.y + 550);

      // Check laser collision
      if (this.player.y + 20 > this.laserY) {
        if (this.damageCoolDown <= 0) {
          this.decreaseShields();
          this.damageCoolDown = 60; // 1 second cooldown
          this.player.vy = -3.5; // bounce upward from laser (scaled from -14)
          this.player.grounded = false;
          this.player.standingOn = null;
        }
      }
    }

    if (this.damageCoolDown > 0) {
      this.damageCoolDown--;
    }

    // Camera follow Y Lerp interpolation
    // Target camera focuses player around Y=650 relative to screen
    const targetCam = 650 - this.player.y;
    this.cameraY += (targetCam - this.cameraY) * 0.1;

    // Check Platform AABB top surface collisions
    if (this.player.vy > 0 && !this.rocketActive && !this.player.grounded) {
      const pyBottom = this.player.y + this.player.height / 2;
      
      for (let i = 0; i < this.platforms.length; i++) {
        const p = this.platforms[i];
        if (!p.active) continue;

        const pyTop = p.y - p.height / 2;
        const dx = Math.abs(this.player.x - p.x);
        
        // Horizontal overlap check (must match the walk-off threshold to prevent infinite edge-landing loop)
        const overlapX = dx < (p.width / 2 + 6);
        // Vertical check (must land on top surface falling down)
        const overlapY = pyBottom >= pyTop && (pyBottom - this.player.vy <= pyTop + 12);

        if (overlapX && overlapY) {
          // Landed on platform!
          this.player.y = pyTop - this.player.height / 2;
          this.player.vy = 0;
          this.player.grounded = true;
          this.player.standingOn = p;
          this.player.lastStandingOn = p; // Track for coyote time
          this.coyoteTimer = 0;
          
          if (p.isGround) {
            this.soundManager.playGemTick();
          } else if (p.isCorrect) {
            // Correct jump/landing!
            const landedFloor = p.floor;
            
            if (landedFloor > this.maxClearedFloor) {
              this.maxClearedFloor = landedFloor;
              
              // Mark the word as processed
              this.activeWord.processed = true;
              
              // Spawn neon sparks
              for (let k = 0; k < 25; k++) {
                this.activeParticles.push(this.particlePool.acquire(p.x, p.y, '#39ff14', 'spark'));
              }

              this.score += 100;
              this.processedCount++;
              this.comboCount++;
              this.updateHUD();

              this.soundManager.playExplosion();

              // Track word for Star Wars Cinematic Clear
              this.comboWords.push({ english: this.activeWord.english, turkish: this.activeWord.turkish });

              if (window.examEngine) {
                window.examEngine.registerAttempt(this.activeWord.english, true);
              }

              // Save to learned list
              const found = this.vocabulary.find(v => v.english === this.activeWord.english);
              if (found && !this.wordsLearnedThisRun.some(w => w.english === found.english)) {
                this.wordsLearnedThisRun.push(found);
              }

              const ft = this.floatingTextPool.acquire(p.x, p.y - 20, `COMBO x${this.comboCount}!`, '#39ff14');
              this.activeFloatingTexts.push(ft);

              // Clean up old off-screen platforms below camera
              this.platforms = this.platforms.filter(plat => plat.y < this.player.y + 600);

              // Trigger Combo rocket Mod or cinematic clear
              if (this.comboCount >= 3 && !this.rocketActive) {
                this.triggerSuperJump(landedFloor);
              } else {
                // Commit normal word transition and spawn the next floor dynamically
                this.selectNextWord();
                this.spawnFloorPlatforms(landedFloor + 1);
              }
            } else {
              // Already cleared floor correct platform
              this.soundManager.playGemTick();
            }
          } else {
            // Distractor / wrong platform
            if (p.floor <= this.maxClearedFloor) {
              // Already cleared floor: safe normal landing
              this.soundManager.playGemTick();
            } else {
              // Active wrong platform: punish!
              this.player.vy = -4.5; // Short collapse bounce
              this.player.grounded = false;
              this.player.standingOn = null;

              this.comboCount = 0;
              this.comboWords = [];
              this.triggerScreenShake(15, 4);
              this.soundManager.playDamage();
              
              const ft = this.floatingTextPool.acquire(p.x, p.y - 20, "WRONG!", '#ff0055');
              this.activeFloatingTexts.push(ft);

              if (window.examEngine) {
                window.examEngine.registerAttempt(this.activeWord.english, false);
              }

              // Deactivate the wrong platform so they fall
              p.active = false;
            }
          }

          // If a buffered jump exists, execute it immediately for snappy gameplay
          if (this.player.grounded && this.jumpBufferTimer > 0) {
            this.tryJump();
          }

          break;
        }
      }
    }

    // Scroll stars background matching climbing rate
    this.stars.forEach(star => {
      star.y += (this.player.vy < 0 ? -this.player.vy * 0.1 : 0);
      if (star.y > this.virtualHeight) {
        star.reset(this.virtualWidth, this.virtualHeight);
        star.y = 0;
      }
    });
  }

  triggerSuperJump(landedFloor) {
    this.rocketActive = true;
    this.rocketTimer = 150; // ~2.5 seconds rocket flight (scaled from 110)
    this.rocketStartFloor = landedFloor;
    this.maxClearedFloor = landedFloor + 5;
    this.score += 300;
    this.soundManager.playStageRiser();
    this.player.grounded = false;
    this.player.standingOn = null;
    this.player.lastStandingOn = null;

    const ft = this.floatingTextPool.acquire(this.player.x, this.player.y - 40, "HYPER ROCKET MOD!", '#00f0ff');
    this.activeFloatingTexts.push(ft);

    this.updateHUD();
  }

  triggerStarWarsCrawl() {
    // Collect the combo list words
    const words = [...this.comboWords];
    this.comboWords = [];

    if (words.length === 0) return;

    this.floatingFx = {
      active: true,
      words: words, // List of { english, turkish }
      y: 700,
      duration: 14.0 // 4x slower duration (scaled from 3.5)
    };
  }

  drawGame() {
    this.ctx.clearRect(0, 0, this.virtualWidth, this.virtualHeight);

    // Screen shake translation offsets
    this.ctx.save();
    if (this.screenShakeTimer > 0) {
      const dx = (Math.random() - 0.5) * this.screenShakeIntensity;
      const dy = (Math.random() - 0.5) * this.screenShakeIntensity;
      this.ctx.translate(dx, dy);
    }

    // 1. Draw Pavement & stars
    this.ctx.fillStyle = '#06030c';
    this.ctx.fillRect(0, 0, this.virtualWidth, this.virtualHeight);

    // Stars background
    this.stars.forEach(star => star.draw(this.ctx));

    // 2. Camera vertical coordinate translation bounds
    this.ctx.save();
    this.ctx.translate(0, this.cameraY);

    // Draw platforms
    this.platforms.forEach(p => p.draw(this.ctx));

    // Draw particles & floating texts
    this.activeParticles.forEach(p => p.draw(this.ctx));
    this.activeFloatingTexts.forEach(ft => ft.draw(this.ctx));

    // Draw Threat Laser Line
    this.drawLaserThreat(this.ctx);

    // Draw Player Character
    this.drawPlayer(this.ctx);

    this.ctx.restore();

    // 3. Draw Target HUD siber panel (Scoreboard Billboard Truck styled target box)
    this.drawTargetHUD(this.ctx);

    // 4. Draw Star Wars cinematic crawler overlay
    if (this.floatingFx && this.floatingFx.active) {
      this.drawStarWarsCrawl(this.ctx);
    }

    // 5. Draw damage screen flash overlay
    if (this.damageTimer > 0) {
      this.ctx.fillStyle = `rgba(255, 0, 85, ${this.damageTimer / 60})`;
      this.ctx.fillRect(0, 0, this.virtualWidth, this.virtualHeight);
    }

    // Restore screen shake translation
    this.ctx.restore();

    // 6. Draw Level Transition Overlay countdown
    if (this.isLevelTransitioning) {
      this.drawLevelTransition(this.ctx);
    }
  }

  drawTargetHUD(ctx) {
    ctx.save();
    
    const bob = Math.sin(Date.now() * 0.0035) * 2.5;
    const ty = 120 + bob;
    const tx = this.virtualWidth / 2;

    ctx.fillStyle = 'rgba(8, 6, 15, 0.95)';
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
      ctx.font = '900 30px "Orbitron", sans-serif';
      ctx.shadowColor = '#00f0ff';
      ctx.shadowBlur = 6;
      ctx.textAlign = 'center';
      ctx.textBaseline = 'middle';
      ctx.fillText(this.activeWord.english, tx, ty);
    }

    ctx.restore();
  }

  drawPlayer(ctx) {
    ctx.save();
    const px = this.player.x;
    const py = this.player.y;
    const pw = this.player.width;
    const ph = this.player.height;

    ctx.fillStyle = 'rgba(10, 8, 20, 0.9)';
    ctx.strokeStyle = this.rocketActive ? '#00f0ff' : '#ff0055';
    ctx.lineWidth = 3;
    ctx.shadowColor = this.rocketActive ? '#00f0ff' : '#ff0055';
    ctx.shadowBlur = this.rocketActive ? 16 : 8;

    if (this.rocketActive) {
      // Draw cyber rocket shape
      ctx.beginPath();
      ctx.moveTo(px, py - ph / 2);
      ctx.lineTo(px + pw / 2, py + ph / 2);
      ctx.lineTo(px - pw / 2, py + ph / 2);
      ctx.closePath();
      ctx.fill();
      ctx.stroke();

      // Rocket flame
      ctx.fillStyle = '#ffaa00';
      ctx.shadowColor = '#ffaa00';
      ctx.shadowBlur = 10;
      ctx.beginPath();
      ctx.moveTo(px - 10, py + ph / 2);
      ctx.lineTo(px, py + ph / 2 + 18);
      ctx.lineTo(px + 10, py + ph / 2);
      ctx.closePath();
      ctx.fill();
    } else {
      // Draw cyber block crawler shape
      ctx.beginPath();
      ctx.roundRect(px - pw / 2, py - ph / 2, pw, ph, 8);
      ctx.fill();
      ctx.stroke();

      // Draw vector-neon pilot cockpit glass
      ctx.strokeStyle = '#00f0ff';
      ctx.fillStyle = 'rgba(0, 240, 255, 0.25)';
      ctx.beginPath();
      ctx.roundRect(px - 12, py - 12, 24, 18, 4);
      ctx.fill();
      ctx.stroke();
    }

    ctx.restore();

    // Renders active target English word written directly on top of the player's car/block
    if (this.activeWord && !this.rocketActive) {
      ctx.save();
      ctx.fillStyle = 'rgba(10, 8, 20, 0.95)';
      ctx.strokeStyle = '#00f0ff';
      ctx.lineWidth = 2.0;
      ctx.shadowColor = '#00f0ff';
      ctx.shadowBlur = 6;
      ctx.font = 'bold 15px "Orbitron", Arial, sans-serif';
      
      const textWidth = ctx.measureText(this.activeWord.english).width + 16;
      ctx.beginPath();
      ctx.roundRect(px - textWidth / 2, py - ph / 2 - 26, textWidth, 22, 5);
      ctx.fill();
      ctx.stroke();

      ctx.fillStyle = '#ffffff';
      ctx.textAlign = 'center';
      ctx.textBaseline = 'middle';
      ctx.fillText(this.activeWord.english, px, py - ph / 2 - 15);
      ctx.restore();
    }

    // Super Jump combo meter bar directly above target word
    if (this.comboCount > 0 && !this.rocketActive) {
      this.drawComboMeter(ctx, px, py - ph / 2 - 32);
    }
  }

  drawComboMeter(ctx, x, y) {
    ctx.save();
    const w = 60;
    const h = 5;

    ctx.fillStyle = 'rgba(20, 20, 30, 0.8)';
    ctx.strokeStyle = 'rgba(255, 255, 255, 0.1)';
    ctx.lineWidth = 1;
    ctx.beginPath();
    ctx.roundRect(x - w / 2, y, w, h, 2);
    ctx.fill();
    ctx.stroke();

    // Renders the combo scale (combos limit at 3 for rocket)
    const pct = Math.min(1.0, this.comboCount / 3);
    const fillW = w * pct;
    
    let color = '#ff0055'; // red at 1 combo
    if (this.comboCount >= 3) {
      color = '#00f0ff'; // cyan ready
    } else if (this.comboCount === 2) {
      color = '#ffaa00'; // orange
    }

    ctx.fillStyle = color;
    ctx.shadowColor = color;
    ctx.shadowBlur = 6;
    ctx.beginPath();
    ctx.roundRect(x - w / 2, y, fillW, h, 2);
    ctx.fill();
    ctx.restore();
  }

  drawLaserThreat(ctx) {
    ctx.save();
    
    const ly = this.laserY;
    
    // Draw siber grid warning hazard glow
    const grad = ctx.createLinearGradient(0, ly, 0, ly + 60);
    grad.addColorStop(0, 'rgba(255, 0, 85, 0.6)');
    grad.addColorStop(1, 'rgba(255, 0, 85, 0.0)');
    ctx.fillStyle = grad;
    ctx.fillRect(0, ly, this.virtualWidth, 120);

    // Main laser hazard line
    ctx.strokeStyle = '#ff0055';
    ctx.lineWidth = 4;
    ctx.shadowColor = '#ff0055';
    ctx.shadowBlur = 10;
    ctx.beginPath();
    ctx.moveTo(0, ly);
    ctx.lineTo(this.virtualWidth, ly);
    ctx.stroke();

    // "WARNING: LASER RISING" text right above laser
    ctx.fillStyle = '#ff0055';
    ctx.font = 'bold 10px "Orbitron", sans-serif';
    ctx.textAlign = 'center';
    ctx.shadowBlur = 4;
    ctx.fillText("LASER THREAT BORDER", this.virtualWidth / 2, ly - 8);

    ctx.restore();
  }

  drawStarWarsCrawl(ctx) {
    ctx.save();
    const floatingFx = this.floatingFx;
    const progress = Math.max(0, floatingFx.duration / 14.0);

    // Perspective Y moves upward
    floatingFx.y -= 27.5 * (1 / 60);

    ctx.fillStyle = 'rgba(5, 2, 10, 0.7)';
    ctx.fillRect(0, 0, this.virtualWidth, this.virtualHeight);

    const words = floatingFx.words;

    // Renders the list of words sequentially
    words.forEach((w, idx) => {
      const textY = floatingFx.y + idx * 80;
      
      // Render only if on screen area
      if (textY > 100 && textY < 900) {
        ctx.save();
        
        // Star Wars 3D depth scaling
        const scale = Math.max(0.2, (textY - 50) / 700);
        ctx.translate(this.virtualWidth / 2, textY);
        ctx.scale(scale, scale);

        ctx.globalAlpha = progress;
        ctx.fillStyle = '#ffea00'; // Star Wars Yellow
        ctx.font = 'bold 26px "Orbitron", Arial, sans-serif';
        ctx.textAlign = 'center';
        ctx.shadowColor = '#ffea00';
        ctx.shadowBlur = 10;
        ctx.fillText(w.english, 0, -14);

        ctx.fillStyle = '#00f0ff'; // cyan meaning
        ctx.shadowColor = '#00f0ff';
        ctx.font = 'bold 18px Arial, sans-serif';
        ctx.fillText(w.turkish, 0, 14);

        ctx.restore();
      }
    });

    ctx.restore();
  }

  drawLevelTransition(ctx) {
    ctx.save();
    ctx.fillStyle = 'rgba(5, 2, 10, 0.75)';
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

window.WordAscentGame = WordAscentGame;
