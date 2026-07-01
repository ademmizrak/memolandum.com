import { Star, SoundManager, AscentObjectPool, AscentParticle, AscentFloatingText, Platform } from './engine';

export class WordAscentGame {
  constructor(canvas, ctx, vocabulary, callbacks) {
    this.isWordAscentGame = true;
    this.canvas = canvas;
    this.ctx = ctx;
    this.vocabulary = vocabulary;
    this.callbacks = callbacks || {};

    this.virtualWidth = 600;
    this.virtualHeight = 1000;
    this.scaleX = 1;
    this.scaleY = 1;

    this.soundManager = new SoundManager();

    // Default speed
    this.speedMultiplier = 1.0;

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
    this.shields = 3;
    this.processedCount = 0;
    this.wordsLearnedThisRun = [];

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
    this.fillers = [
      { english: "AM", turkish: "OLMAK" },
      { english: "AS", turkish: "OLARAK" },
      { english: "BE", turkish: "OLMAK" },
      { english: "DO", turkish: "YAPMAK" },
      { english: "GO", turkish: "GITMEK" },
      { english: "HE", turkish: "O" },
      { english: "IF", turkish: "EĞER" },
      { english: "IN", turkish: "IÇINDE" },
      { english: "IS", turkish: "OLMAK" },
      { english: "IT", turkish: "O" },
      { english: "ME", turkish: "BENI" },
      { english: "MY", turkish: "BENIM" },
      { english: "NO", turkish: "HAYIR" },
      { english: "OF", turkish: "-IN" },
      { english: "ON", turkish: "ÜZERINDE" },
      { english: "OR", turkish: "VEYA" },
      { english: "SO", turkish: "BÖYLECE" },
      { english: "TO", turkish: "E DOĞRU" },
      { english: "UP", turkish: "YUKARI" },
      { english: "WE", turkish: "BIZ" }
    ];

    // Control parameters
    this.comboCount = 0;
    this.rocketActive = false;
    this.rocketTimer = 0;
    this.comboWords = [];
    this.maxClearedFloor = 0;

    // Removed Threat laser line
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
  }

  startGame() {
    this.soundManager.init();
    this.score = 0;
    this.shields = 3;
    this.processedCount = 0;
    this.wordsLearnedThisRun = [];
    this.chunkIndex = 0;
    
    this.isLevelTransitioning = false;
    this.levelCompleteTimer = 0;
    this.damageTimer = 0;

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
    this.damageCoolDown = 0;
 
    this.loadLevelChunk();
    this.selectNextWord();
    
    // Generate Floor 0 ground and Floor 1 platforms dynamically
    this.currentFloor = 0;
    this.platforms.push(new Platform(300, 920, 600, "START CLIMBING!", false, false, true, 0));
    this.spawnFloorPlatforms(1);
 
    this.state = 'playing';
    this.updateReactState();
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
        const wWidth = Math.min(200, Math.max(100, wordObj.turkish.length * 10 + 26));
        const plat = new Platform(x, y, wWidth, wordObj.turkish, true, false, false, floorIndex);
        plat.englishMatch = wordObj.english; 
        this.platforms.push(plat);
      } else {
        // Distractor platform
        const dObj = distractorWords.pop();
        const dText = dObj ? dObj.turkish : "DUMMY";
        const wWidth = Math.min(200, Math.max(100, dText.length * 10 + 26));
        const plat = new Platform(x, y, wWidth, dText, false, false, false, floorIndex);
        this.platforms.push(plat);
      }
    }
  }

  handleInput(action) {
    if (this.state !== 'playing' || this.isLevelTransitioning) return;

    if (action === 'left') {
      this.player.targetVx = -6.5;
    } else if (action === 'right') {
      this.player.targetVx = 6.5;
    } else if (action === 'stopX') {
      this.player.targetVx = 0;
    } else if (action === 'jump') {
      if (this.comboCount >= 10 && !this.rocketActive) {
        const currentFloor = this.player.standingOn ? this.player.standingOn.floor : (this.maxClearedFloor || 0);
        this.triggerSuperJump(currentFloor);
      } else {
        this.jumpBufferTimer = 6;
        this.tryJump();
      }
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

  triggerScreenShake(duration, intensity) {
    this.screenShakeTimer = duration;
    this.screenShakeIntensity = intensity;
  }

  gameOver() {
    this.state = 'gameover';
    this.soundManager.playDamage();
    this.updateReactState();
  }

  triggerLevelComplete() {
    this.isLevelTransitioning = true;
    this.levelCompleteTimer = 3.0;
    this.soundManager.playStageClear();
    this.updateReactState();
  }

  triggerFinalVictory() {
    this.state = 'victory';
    this.soundManager.playStageClear();
    this.updateReactState();
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

      this.selectNextWord();
      
      this.platforms = [];
      this.platforms.push(new Platform(300, 920, 600, "START CLIMBING!", false, false, true, 0));
      this.spawnFloorPlatforms(1);

      this.updateReactState();
    } else {
      this.triggerFinalVictory();
    }
  }

  decreaseShields() {
    this.shields--;
    this.soundManager.playDamage();
    this.damageTimer = 30; // red damage screen flash
    this.triggerScreenShake(20, 5);
    this.updateReactState();

    if (this.shields <= 0) {
      this.gameOver();
    }
  }

  updateReactState() {
    if (this.callbacks.onStateChange) {
      this.callbacks.onStateChange({
        state: this.state,
        shields: this.shields,
        processedCount: this.processedCount,
        totalWords: this.wordsPerLevel
      });
    }
  }

  resize(width, height) {
    const dpr = window.devicePixelRatio || 1;
    this.canvas.width = width * dpr;
    this.canvas.height = height * dpr;
    this.ctx.scale(dpr, dpr);
    this.scaleX = width / this.virtualWidth;
    this.scaleY = height / this.virtualHeight;
  }

  gameLoop(currentTime) {
    if (!this.lastTime) this.lastTime = currentTime;
    let dt = (currentTime - this.lastTime) / 16.6667;
    if (dt > 3.0) dt = 3.0; // clamp
    if (dt <= 0 || isNaN(dt)) dt = 1.0;
    this.lastTime = currentTime;

    if (this.state === 'playing') {
      this.updateGame(dt);
    }
    this.drawGame();
  }

  updateGame(dt = 1.0) {
    // Decrement input helper timers
    if (this.coyoteTimer > 0) this.coyoteTimer -= dt;
    if (this.jumpBufferTimer > 0) this.jumpBufferTimer -= dt;

    if (this.floatingFx && this.floatingFx.active) {
      dt = dt * 0.2; 
    }

    if (this.screenShakeTimer > 0) {
      this.screenShakeTimer--;
    }

    if (this.damageTimer > 0) {
      this.damageTimer--;
    }

    if (this.isLevelTransitioning) {
      this.levelCompleteTimer -= (1 / 60) * dt;
      if (this.levelCompleteTimer <= 0) {
        this.nextLevel();
      }
    }

    for (let i = this.activeParticles.length - 1; i >= 0; i--) {
      const p = this.activeParticles[i];
      p.update();
      if (p.life <= 0) {
        this.activeParticles.splice(i, 1);
        this.particlePool.release(p);
      }
    }

    for (let i = this.activeFloatingTexts.length - 1; i >= 0; i--) {
      const ft = this.activeFloatingTexts[i];
      ft.update();
      if (ft.life <= 0) {
        this.activeFloatingTexts.splice(i, 1);
        this.floatingTextPool.release(ft);
      }
    }

    if (this.floatingFx && this.floatingFx.active) {
      this.floatingFx.duration -= (1 / 60);
      if (this.floatingFx.duration <= 0) {
        this.floatingFx.active = false;
        const lastFloor = this.rocketStartFloor + 5;
        this.selectNextWord();
        this.spawnFloorPlatforms(lastFloor + 1);
      }
      return;
    }

    if (this.rocketActive) {
      this.rocketTimer -= dt;
      this.player.vy = -22.0; 
      this.player.vx = 0;
      this.player.y += this.player.vy * dt;

      if (Math.random() < 0.6) {
        const px = this.player.x + (Math.random() - 0.5) * 16;
        const py = this.player.y + 20;
        this.activeParticles.push(this.particlePool.acquire(px, py, '#00f0ff', 'smoke'));
      }

      if (this.rocketTimer <= 0) {
        this.rocketActive = false;
        this.comboCount = 0; 
        
        const targetFloor = this.rocketStartFloor + 5;
        const targetY = 920 - targetFloor * 140;
        this.player.y = targetY - 30; 
        this.player.vy = 0;
        
        const cp = new Platform(300, targetY, 600, "CHECKPOINT REACHED", false, false, true, targetFloor);
        this.platforms.push(cp);
        
        this.player.grounded = true;
        this.player.standingOn = cp;
        
        this.selectNextWord();
        this.spawnFloorPlatforms(targetFloor + 1);
      }
    } else {
      if (this.player.targetVx !== 0) {
        this.player.vx += (this.player.targetVx - this.player.vx) * 0.22;
      } else {
        this.player.vx *= 0.88;
      }
      this.player.x += this.player.vx * dt;

      if (this.player.x < 20) {
        this.player.x = 20;
        this.player.vx = 0;
      }
      if (this.player.x > 580) {
        this.player.x = 580;
        this.player.vx = 0;
      }

      if (this.player.grounded && this.player.standingOn) {
        const p = this.player.standingOn;
        const dx = Math.abs(this.player.x - p.x);
        if (dx >= (p.width / 2 + 6)) {
          this.player.grounded = false;
          this.player.standingOn = null;
          this.coyoteTimer = 6;
        }
      }

      if (!this.player.grounded) {
        this.player.vy += this.player.gravity * dt;
        this.player.y += this.player.vy * dt;
      } else {
        this.player.vy = 0;
      }
    }

    // If player falls below the starting point
    if (this.player.y > 1100 && this.state === 'playing') {
       this.shields = 0;
       this.gameOver();
    }

    if (this.damageCoolDown > 0) {
      this.damageCoolDown--;
    }

    const targetCam = 600 - this.player.y;
    this.cameraY += (targetCam - this.cameraY) * 0.1;

    if (this.player.vy > 0 && !this.rocketActive && !this.player.grounded) {
      const pyBottom = this.player.y + this.player.height / 2;
      
      for (let i = 0; i < this.platforms.length; i++) {
        const p = this.platforms[i];
        if (!p.active) continue;

        const pyTop = p.y - p.height / 2;
        const dx = Math.abs(this.player.x - p.x);
        
        const overlapX = dx < (p.width / 2 + 6);
        const overlapY = pyBottom >= pyTop && (pyBottom - this.player.vy <= pyTop + 12);

        if (overlapX && overlapY) {
          this.player.y = pyTop - this.player.height / 2;
          this.player.vy = 0;
          this.player.grounded = true;
          this.player.standingOn = p;
          this.player.lastStandingOn = p; 
          this.coyoteTimer = 0;
          
          if (p.isGround) {
            this.soundManager.playGemTick();
          } else if (p.isCorrect) {
            const landedFloor = p.floor;
            
            if (landedFloor > this.maxClearedFloor) {
              this.maxClearedFloor = landedFloor;
              this.activeWord.processed = true;
              
              for (let k = 0; k < 25; k++) {
                this.activeParticles.push(this.particlePool.acquire(p.x, p.y, '#39ff14', 'spark'));
              }

              this.score += 100;
              this.processedCount++;
              this.comboCount++;
              
              if (this.callbacks.onScore) {
                  this.callbacks.onScore(100);
              }
              if (this.callbacks.onLearned) {
                  this.callbacks.onLearned(this.activeWord);
              }

              this.updateReactState();
              this.soundManager.playExplosion();
              if (this.activeWord.audioUrl) {
                  this.soundManager.playWordAudio(this.activeWord.audioUrl);
              }

              this.comboWords.push({ english: this.activeWord.english, turkish: this.activeWord.turkish });

              const ft = this.floatingTextPool.acquire(p.x, p.y - 20, `COMBO x${this.comboCount}!`, '#39ff14');
              this.activeFloatingTexts.push(ft);

              if (this.comboCount >= 10 && !this.rocketActive) {
                this.triggerSuperJump(landedFloor);
              } else {
                this.selectNextWord();
                this.spawnFloorPlatforms(landedFloor + 1);
              }
            } else {
              this.soundManager.playGemTick();
            }
          } else {
            if (p.floor <= this.maxClearedFloor) {
              this.soundManager.playGemTick();
            } else {
              this.player.vy = -4.5; 
              this.player.grounded = false;
              this.player.standingOn = null;

              this.comboCount = 0;
              this.comboWords = [];
              this.triggerScreenShake(15, 4);
              this.soundManager.playDamage();
              
              const ft = this.floatingTextPool.acquire(p.x, p.y - 20, "WRONG!", '#ff0055');
              this.activeFloatingTexts.push(ft);

              p.active = false;
            }
          }

          if (this.player.grounded && this.jumpBufferTimer > 0) {
            this.tryJump();
          }

          break;
        }
      }
    }

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
    this.rocketTimer = 150; 
    this.rocketStartFloor = landedFloor;
    this.maxClearedFloor = landedFloor + 5;
    
    this.score += 300;
    if (this.callbacks.onScore) {
        this.callbacks.onScore(300);
    }

    this.soundManager.playStageRiser();
    this.player.grounded = false;
    this.player.standingOn = null;
    this.player.lastStandingOn = null;

    const ft = this.floatingTextPool.acquire(this.player.x, this.player.y - 40, "HYPER ROCKET MOD!", '#00f0ff');
    this.activeFloatingTexts.push(ft);

    this.updateReactState();
  }

  drawGame() {
    this.ctx.save();
    this.ctx.scale(this.scaleX, this.scaleY);
    this.ctx.clearRect(0, 0, this.virtualWidth, this.virtualHeight);

    if (this.screenShakeTimer > 0) {
      const dx = (Math.random() - 0.5) * this.screenShakeIntensity;
      const dy = (Math.random() - 0.5) * this.screenShakeIntensity;
      this.ctx.translate(dx, dy);
    }

    this.ctx.fillStyle = '#06030c';
    this.ctx.fillRect(0, 0, this.virtualWidth, this.virtualHeight);

    this.stars.forEach(star => star.draw(this.ctx));

    this.ctx.save();
    this.ctx.translate(0, this.cameraY);

    this.platforms.forEach(p => p.draw(this.ctx));
    this.activeParticles.forEach(p => p.draw(this.ctx));
    this.activeFloatingTexts.forEach(ft => ft.draw(this.ctx));

    this.drawPlayer(this.ctx);

    this.ctx.restore();

    this.drawTargetHUD(this.ctx);

    if (this.floatingFx && this.floatingFx.active) {
      this.drawStarWarsCrawl(this.ctx);
    }

    if (this.damageTimer > 0) {
      this.ctx.fillStyle = `rgba(255, 0, 85, ${this.damageTimer / 60})`;
      this.ctx.fillRect(0, 0, this.virtualWidth, this.virtualHeight);
    }

    if (this.isLevelTransitioning) {
      this.drawLevelTransition(this.ctx);
    }
    
    this.ctx.restore();
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
    ctx.roundRect(tx - 175, ty - 42, 350, 84, 8);
    ctx.fill();
    ctx.stroke();

    ctx.strokeStyle = 'rgba(0, 240, 255, 0.08)';
    ctx.lineWidth = 1;
    ctx.shadowBlur = 0;
    ctx.beginPath();
    for (let gx = tx - 165; gx < tx + 175; gx += 22) {
      ctx.moveTo(gx, ty - 35);
      ctx.lineTo(gx, ty + 35);
    }
    ctx.stroke();

    if (this.activeWord) {
      ctx.fillStyle = '#ffffff';
      ctx.textAlign = 'center';
      ctx.textBaseline = 'middle';
      
      if (this.activeWord.romanized) {
        ctx.font = '900 33px "Orbitron", sans-serif';
        ctx.shadowColor = '#00f0ff';
        ctx.shadowBlur = 6;
        ctx.fillText(this.activeWord.english, tx, ty - 12);
        
        ctx.font = 'normal 18px Arial, sans-serif';
        ctx.fillStyle = 'rgba(255, 255, 255, 0.8)';
        ctx.shadowBlur = 0;
        ctx.fillText(`[${this.activeWord.romanized}]`, tx, ty + 20);
      } else {
        ctx.font = '900 33px "Orbitron", sans-serif';
        ctx.shadowColor = '#00f0ff';
        ctx.shadowBlur = 6;
        ctx.fillText(this.activeWord.english, tx, ty);
      }
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
      ctx.beginPath();
      ctx.moveTo(px, py - ph / 2);
      ctx.lineTo(px + pw / 2, py + ph / 2);
      ctx.lineTo(px - pw / 2, py + ph / 2);
      ctx.closePath();
      ctx.fill();
      ctx.stroke();

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
      ctx.beginPath();
      ctx.roundRect(px - pw / 2, py - ph / 2, pw, ph, 8);
      ctx.fill();
      ctx.stroke();

      ctx.strokeStyle = '#00f0ff';
      ctx.fillStyle = 'rgba(0, 240, 255, 0.25)';
      ctx.beginPath();
      ctx.roundRect(px - 12, py - 12, 24, 18, 4);
      ctx.fill();
      ctx.stroke();
    }

    ctx.restore();

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
      
      // Also add the romanized text below the english text, smaller.
      if (this.activeWord.romanized) {
          ctx.font = 'normal 14px Arial, sans-serif';
          ctx.fillStyle = 'rgba(255, 255, 255, 0.8)';
          ctx.fillText(`[${this.activeWord.romanized}]`, px, py - ph / 2 + 7);
      }

      ctx.restore();
    }

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

    const pct = Math.min(1.0, this.comboCount / 10);
    const fillW = w * pct;
    
    let color = '#ff0055'; 
    if (this.comboCount >= 10) {
      color = '#00f0ff'; 
    } else if (this.comboCount >= 7) {
      color = '#ffaa00'; 
    }

    ctx.fillStyle = color;
    ctx.shadowColor = color;
    ctx.shadowBlur = 6;
    ctx.beginPath();
    ctx.roundRect(x - w / 2, y, fillW, h, 2);
    ctx.fill();
    ctx.restore();
  }

  drawStarWarsCrawl(ctx) {
    ctx.save();
    const floatingFx = this.floatingFx;
    const progress = Math.max(0, floatingFx.duration / 14.0);

    floatingFx.y -= 27.5 * (1 / 60);

    ctx.fillStyle = 'rgba(5, 2, 10, 0.7)';
    ctx.fillRect(0, 0, this.virtualWidth, this.virtualHeight);

    const words = floatingFx.words;

    words.forEach((w, idx) => {
      const textY = floatingFx.y + idx * 80;
      
      if (textY > 100 && textY < 900) {
        ctx.save();
        
        const scale = Math.max(0.2, (textY - 50) / 700);
        ctx.translate(this.virtualWidth / 2, textY);
        ctx.scale(scale, scale);

        ctx.globalAlpha = progress;
        ctx.fillStyle = '#ffea00';
        ctx.font = 'bold 26px "Orbitron", Arial, sans-serif';
        ctx.textAlign = 'center';
        ctx.shadowColor = '#ffea00';
        ctx.shadowBlur = 10;
        ctx.fillText(w.english, 0, -14);

        ctx.fillStyle = '#00f0ff';
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
    const cy = this.virtualHeight / 2;

    ctx.fillStyle = '#39ff14';
    ctx.font = 'bold 40px "Orbitron", sans-serif';
    ctx.textAlign = 'center';
    ctx.textBaseline = 'middle';
    ctx.shadowColor = '#39ff14';
    ctx.shadowBlur = 15;
    ctx.fillText("LEVEL CLEARED!", cx, cy - 40);

    ctx.fillStyle = '#ffffff';
    ctx.font = 'bold 20px "Orbitron", sans-serif';
    ctx.shadowBlur = 0;
    ctx.fillText("GET READY...", cx, cy + 20);

    ctx.restore();
  }
}
