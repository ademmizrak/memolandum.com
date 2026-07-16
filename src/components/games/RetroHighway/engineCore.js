import { Star, SoundManager, HighwayObjectPool, HighwayParticle, HighwayFloatingText, HighwayGem, TrafficCar } from './engine';

export class HighwayGame {
  constructor(canvas, ctx, vocabulary, callbacks) {
    this.isHighwayGame = true;
    this.canvas = canvas;
    this.ctx = ctx;
    this.vocabulary = vocabulary;
    
    // React Callbacks
    this.onScore = callbacks.onScore;
    this.onLearned = callbacks.onLearned;
    this.onStateChange = callbacks.onStateChange;

    this.virtualWidth = 600;
    this.virtualHeight = 1000;
    this.scaleX = 1;
    this.scaleY = 1;

    this.soundManager = new SoundManager();
    this.soundManager.init();

    this.speedMultiplier = 1.0;

    // Road metrics
    this.roadOffset = 0;
    this.baseRoadSpeed = 1.0;
    this.roadSpeed = this.baseRoadSpeed;

    // Player metrics
    this.player = {
      lane: 1, // Start Sol-Orta (lane index 1)
      x: 225,
      y: 750,
      width: 56,
      height: 96,
      targetX: 225
    };

    // Stats
    this.state = 'start';
    this.score = 0;
    this.shields = 3;
    this.collectedGems = 0;
    this.wordsLearnedThisRun = [];
    
    this.processedCount = 0;
    this.wordsPerLevel = 12;

    // Entity collections
    this.trafficCars = [];
    this.activeParticles = [];
    this.activeFloatingTexts = [];
    this.activeGems = [];
    this.stars = [];

    // Object Pools
    this.particlePool = new HighwayObjectPool(
      () => new HighwayParticle(),
      (p, x, y, color, type) => p.reset(x, y, color, type)
    );

    this.floatingTextPool = new HighwayObjectPool(
      () => new HighwayFloatingText(),
      (ft, x, y, text, color) => ft.reset(x, y, text, color)
    );

    this.gemPool = new HighwayObjectPool(
      () => new HighwayGem(),
      (g, x, y, speed) => g.reset(x, y, speed)
    );

    const localFillers = [
      { word: "am", translation: "olmak" },
      { word: "as", translation: "gibi" },
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

    // Control parameters
    this.nitroActive = false;
    this.brakeActive = false;
    this.turboActive = false;
    this.turboTimer = 0;
    
    this.draftingCar = null;
    this.draftingTimer = 0; 
    
    this.floatingFx = { active: false };

    this.screenShakeTimer = 0;
    this.screenShakeIntensity = 0;

    for (let i = 0; i < 40; i++) {
      const star = new Star();
      star.reset(this.virtualWidth, this.virtualHeight);
      star.y = Math.random() * this.virtualHeight;
      this.stars.push(star);
    }
  }

  resize(width, height) {
    const dpr = window.devicePixelRatio || 1;
    this.canvas.width = width * dpr;
    this.canvas.height = height * dpr;
    this.ctx.setTransform(1, 0, 0, 1, 0, 0); // Reset transform
    this.ctx.scale(dpr, dpr);
    this.scaleX = width / this.virtualWidth;
    this.scaleY = height / this.virtualHeight;
  }

  startGame() {
    this.soundManager.init();
    this.score = 0;
    this.shields = 3;
    this.speedKmh = 40; 
    this.wordsLearnedThisRun = [];
    this.processedCount = 0;

    this.isLevelTransitioning = false;
    this.levelCompleteTimer = 0;
    this.damageTimer = 0;

    this.trafficCars = [];
    this.activeGems = [];
    
    this.activeParticles.forEach(p => this.particlePool.release(p));
    this.activeFloatingTexts.forEach(ft => this.floatingTextPool.release(ft));
    this.activeParticles = [];
    this.activeFloatingTexts = [];

    this.unprocessedWords = [...this.vocabulary];
    this.selectNextWord();

    this.state = 'playing';
    this.updateReactState();
  }

  selectNextWord() {
    if (this.unprocessedWords.length === 0) {
      this.triggerFinalVictory();
      return;
    }

    this.activeWord = this.unprocessedWords[Math.floor(Math.random() * this.unprocessedWords.length)];
    this.draftingCar = null;
    this.draftingTimer = 0;

    this.trafficCars = [];
    this.spawnTrafficWave();
  }

  spawnTrafficWave() {
    const targetLane = Math.floor(Math.random() * 4);
    
    const otherVocab = this.vocabulary.filter(w => w.english !== this.activeWord.english);
    const distractorWords = [];
    const maxDistractors = Math.min(3, otherVocab.length);
    while (distractorWords.length < maxDistractors) {
      const w = otherVocab[Math.floor(Math.random() * otherVocab.length)];
      if (!distractorWords.includes(w)) {
        distractorWords.push(w);
      }
    }

    for (let lane = 0; lane < 4; lane++) {
      const carY = -120 - Math.random() * 100; 
      
      if (lane === targetLane) {
        this.trafficCars.push(new TrafficCar(
          lane, 
          carY, 
          this.activeWord.english, 
          this.activeWord.turkish, 
          true, 
          false
        ));
      } else {
        const rand = Math.random();
        if (rand < 0.45 && distractorWords.length > 0) {
          const dWord = distractorWords.pop();
          this.trafficCars.push(new TrafficCar(lane, carY, dWord.english, dWord.turkish, false, false));
        } else if (rand < 0.85 && this.fillers.length > 0) {
          const fWord = this.fillers[Math.floor(Math.random() * this.fillers.length)];
          this.trafficCars.push(new TrafficCar(lane, carY, fWord.english, fWord.turkish, false, true));
        }
      }
    }
  }

  handleInput(action, active) {
    if (this.state !== 'playing') return;
    if (action === 'left' && active) {
      if (this.player.lane > 0) {
        this.player.lane--;
        this.soundManager.playGemTick();
      }
    } else if (action === 'right' && active) {
      if (this.player.lane < 3) {
        this.player.lane++;
        this.soundManager.playGemTick();
      }
    } else if (action === 'up') {
      this.nitroActive = active;
    } else if (action === 'down') {
      this.brakeActive = active;
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

  triggerFinalVictory() {
    this.state = 'victory';
    this.soundManager.playStageClear();
    this.updateReactState();
  }

  decreaseShields() {
    this.shields--;
    this.soundManager.playDamage();
    this.damageTimer = 30;
    this.updateReactState();
    
    if (this.shields <= 0) {
      this.gameOver();
    }
  }

  updateReactState() {
    if (this.onStateChange) {
      this.onStateChange({
        state: this.state,
        score: this.score,
        shields: this.shields,
        processedCount: this.processedCount,
        totalWords: this.vocabulary.length,
        learnedWords: this.wordsLearnedThisRun || []
      });
    }
  }

  gameLoop(time) {
    if (this.state !== 'playing') return;

    if (!this.lastTime) this.lastTime = time;
    let dt = (time - this.lastTime) / 16.6667;
    if (dt > 3) dt = 3;
    if (dt <= 0 || isNaN(dt)) dt = 1;
    this.lastTime = time;

    this.updateGame(dt);
    this.drawGame();
  }

  updateGame(dt = 1) {
    if (this.screenShakeTimer > 0) this.screenShakeTimer--;
    if (this.damageTimer > 0) this.damageTimer--;

    if (this.nitroActive) {
      this.speedKmh += 0.5 * dt; 
      if (this.speedKmh > 120) this.speedKmh = 120;
    } else if (this.brakeActive) {
      this.speedKmh -= 1.0 * dt; 
      if (this.speedKmh < 10) this.speedKmh = 10;
    } else {
      if (this.speedKmh > 40) {
        this.speedKmh -= 0.2 * dt;
      } else if (this.speedKmh < 40) {
        this.speedKmh += 0.2 * dt;
      }
    }
    
    let targetRoadSpeed = this.speedKmh * 0.035;
    targetRoadSpeed *= this.speedMultiplier;

    this.roadSpeed += (targetRoadSpeed - this.roadSpeed) * (0.1 * dt);
    this.roadOffset += this.roadSpeed * dt;

    this.stars.forEach(star => {
      star.y += this.roadSpeed * 0.5 * dt;
      if (star.y > this.virtualHeight) {
        star.reset(this.virtualWidth, this.virtualHeight);
        star.y = 0;
      }
    });

    this.player.targetX = this.player.lane * 150 + 75;
    this.player.x += (this.player.targetX - this.player.x) * (0.2 * dt);

    const relativeSpeed = this.roadSpeed * 0.85; 
    let correctCarFound = null;

    for (let i = this.trafficCars.length - 1; i >= 0; i--) {
      const car = this.trafficCars[i];
      if (!car) continue;

      car.update(relativeSpeed * dt);
      
      if (car.isCorrect) {
        correctCarFound = car;
      }

      if (car.y > this.virtualHeight + 150) {
        this.trafficCars.splice(i, 1);
        continue;
      }

      const dx = Math.abs(this.player.x - car.x);
      const dy = Math.abs(this.player.y - car.y);
      const overlapX = (this.player.width / 2 + car.width / 2) - 8;
      const overlapY = (this.player.height / 2 + car.height / 2) - 8;

      if (dx < overlapX && dy < overlapY) {
        if (car.isCorrect) {
          this.triggerTurboBlast(car);
          break;
        } else {
          this.triggerCrash(car);
          break;
        }
      }
    }

    if (this.trafficCars.length === 0 && !this.turboActive) {
      this.spawnTrafficWave();
    }

    if (correctCarFound && !this.turboActive) {
      const dy = this.player.y - correctCarFound.y;
      const sameLane = (this.player.lane === correctCarFound.lane);
      const inRange = (dy > 96 && dy < 220);

      if (sameLane && inRange) {
        this.draftingCar = correctCarFound;
        const chargeRate = this.nitroActive ? 1.5 : 1.0;
        this.draftingTimer += chargeRate * this.speedMultiplier;

        if (Math.random() < 0.4) {
          const px = this.player.x + (Math.random() - 0.5) * 40;
          const py = this.player.y - 60;
          this.activeParticles.push(this.particlePool.acquire(px, py, '#00f0ff', 'spark'));
        }

        if (this.draftingTimer >= 120) {
          this.triggerTurboBlast(correctCarFound);
        }
      } else {
        this.draftingTimer = Math.max(0, this.draftingTimer - 2 * dt);
      }
    } else {
      this.draftingTimer = Math.max(0, this.draftingTimer - 2 * dt);
    }

    for (let i = this.activeGems.length - 1; i >= 0; i--) {
      const gem = this.activeGems[i];
      gem.update(this.player.x, this.player.y, this.roadSpeed * dt, this.nitroActive);
      
      const dist = Math.hypot(this.player.x - gem.x, this.player.y - gem.y);
      if (dist < 40) {
        this.score += 20;
        if (this.onScore) this.onScore(20);
        this.soundManager.playGemTick();
        
        const ft = this.floatingTextPool.acquire(gem.x, gem.y, "+20", '#39ff14');
        this.activeFloatingTexts.push(ft);
        
        this.activeGems.splice(i, 1);
        this.gemPool.release(gem);
        this.updateReactState();
        continue;
      }

      if (gem.y > this.virtualHeight + 50) {
        this.activeGems.splice(i, 1);
        this.gemPool.release(gem);
      }
    }

    for (let i = this.activeParticles.length - 1; i >= 0; i--) {
      const p = this.activeParticles[i];
      p.update(dt);
      if (p.life <= 0) {
        this.activeParticles.splice(i, 1);
        this.particlePool.release(p);
      }
    }

    for (let i = this.activeFloatingTexts.length - 1; i >= 0; i--) {
      const ft = this.activeFloatingTexts[i];
      ft.update(dt);
      if (ft.life <= 0) {
        this.activeFloatingTexts.splice(i, 1);
        this.floatingTextPool.release(ft);
      }
    }

    if (this.floatingFx && this.floatingFx.active) {
      this.floatingFx.duration -= (1 / 60);
      if (this.floatingFx.duration <= 0) {
        this.floatingFx.active = false;
      }
    }
  }

  triggerTurboBlast(car) {
    this.soundManager.playGemTick();
    
    // Play target word pronunciation
    if (this.activeWord && this.activeWord.audioUrl) {
      this.soundManager.playWordAudio(this.activeWord.audioUrl);
    }
    
    for (let i = 0; i < 20; i++) {
      const px = car.x + (Math.random() - 0.5) * 40;
      const py = car.y + (Math.random() - 0.5) * 40;
      this.activeParticles.push(this.particlePool.acquire(px, py, '#00f0ff', 'spark'));
    }

    this.score += 200;
    if (this.onScore) this.onScore(200);

    for (let i = 0; i < 5; i++) {
      const gemX = car.x + (Math.random() - 0.5) * 80;
      const gemY = car.y - 150 - (i * 120);
      this.activeGems.push(this.gemPool.acquire(gemX, gemY, this.roadSpeed));
    }

    this.floatingFx = {
      active: true,
      english: this.activeWord.english,
      turkish: this.activeWord.turkish,
      y: 800,
      duration: 3.0
    };

    if (this.onLearned) {
      this.onLearned(this.activeWord);
    }

    this.trafficCars = this.trafficCars.filter(c => c !== car);
    
    this.unprocessedWords = this.unprocessedWords.filter(w => w.english !== this.activeWord.english);
    this.processedCount++;
    this.updateReactState();
    this.selectNextWord();
  }

  triggerCrash(car) {
    this.soundManager.playDamage();
    
    this.triggerScreenShake(30, 6);

    for (let i = 0; i < 20; i++) {
      const px = car.x + (Math.random() - 0.5) * 40;
      const py = car.y + (Math.random() - 0.5) * 40;
      this.activeParticles.push(this.particlePool.acquire(px, py, '#ff3300', 'spark'));
    }

    for (let i = 0; i < 8; i++) {
      const px = this.player.x + (Math.random() - 0.5) * 30;
      const py = this.player.y - 50;
      this.activeParticles.push(this.particlePool.acquire(px, py, '#333333', 'smoke'));
    }

    this.decreaseShields();

    this.trafficCars = [];
    this.draftingTimer = 0;
    this.spawnTrafficWave();
  }

  drawGame() {
    this.ctx.save();
    this.ctx.scale(this.scaleX, this.scaleY);
    this.ctx.clearRect(0, 0, this.virtualWidth, this.virtualHeight);
    
    this.ctx.save();
    if (this.screenShakeTimer > 0) {
      const dx = (Math.random() - 0.5) * this.screenShakeIntensity;
      const dy = (Math.random() - 0.5) * this.screenShakeIntensity;
      this.ctx.translate(dx, dy);
    }

    this.ctx.fillStyle = '#0a0a0f'; 
    this.ctx.fillRect(0, 0, this.virtualWidth, this.virtualHeight);

    this.stars.forEach(star => star.draw(this.ctx));

    this.ctx.save();
    this.ctx.strokeStyle = 'rgba(255, 255, 255, 0.25)';
    this.ctx.lineWidth = 4;
    
    if (this.turboActive) {
      this.ctx.strokeStyle = 'rgba(0, 240, 255, 0.6)';
      this.ctx.lineWidth = 6;
      this.ctx.setLineDash([80, 40]);
    } else {
      this.ctx.setLineDash([35, 45]);
    }

    this.ctx.lineDashOffset = -this.roadOffset;

    const lanes = [150, 300, 450];
    lanes.forEach(lx => {
      this.ctx.beginPath();
      this.ctx.moveTo(lx, 0);
      this.ctx.lineTo(lx, this.virtualHeight);
      this.ctx.stroke();
    });
    this.ctx.restore();

    this.ctx.save();
    this.ctx.lineWidth = 5;
    
    this.ctx.strokeStyle = '#d000ff';
    this.ctx.shadowColor = '#d000ff';
    this.ctx.shadowBlur = 8;
    this.ctx.beginPath();
    this.ctx.moveTo(8, 0);
    this.ctx.lineTo(8, this.virtualHeight);
    this.ctx.stroke();

    this.ctx.strokeStyle = '#d000ff';
    this.ctx.shadowColor = '#d000ff';
    this.ctx.beginPath();
    this.ctx.moveTo(this.virtualWidth - 8, 0);
    this.ctx.lineTo(this.virtualWidth - 8, this.virtualHeight);
    this.ctx.stroke();
    this.ctx.restore();

    this.drawBillboardTruck(this.ctx);

    this.trafficCars.forEach(car => car.draw(this.ctx));

    this.activeGems.forEach(gem => gem.draw(this.ctx));

    this.drawPlayerCar(this.ctx);

    this.activeParticles.forEach(p => p.draw(this.ctx));
    this.activeFloatingTexts.forEach(ft => ft.draw(this.ctx));

    if (this.floatingFx && this.floatingFx.active) {
      this.drawStarWarsCrawl(this.ctx);
    }

    if (this.damageTimer > 0) {
      this.ctx.fillStyle = `rgba(255, 0, 0, ${this.damageTimer / 60})`;
      this.ctx.fillRect(0, 0, this.virtualWidth, this.virtualHeight);
    }

    this.ctx.restore();

    this.drawSpeedometer(this.ctx);
    
    this.ctx.restore();
  }

  drawSpeedometer(ctx) {
    const cx = this.virtualWidth / 2;
    const cy = this.virtualHeight - 80;
    const radius = 55;

    ctx.save();
    
    ctx.beginPath();
    ctx.arc(cx, cy, radius, Math.PI * 0.75, Math.PI * 2.25);
    ctx.lineWidth = 8;
    ctx.strokeStyle = 'rgba(10, 10, 15, 0.8)';
    ctx.stroke();

    ctx.fillStyle = 'rgba(0, 0, 0, 0.6)';
    ctx.fill();

    let neonColor = '#00f0ff';
    if (this.speedKmh > 80) neonColor = '#ffaa00';
    if (this.speedKmh > 100) neonColor = '#ff0055';

    const maxSpeed = 120;
    const speedRatio = Math.max(0, Math.min(1, this.speedKmh / maxSpeed));
    const endAngle = Math.PI * 0.75 + (speedRatio * (Math.PI * 1.5));
    
    ctx.beginPath();
    ctx.arc(cx, cy, radius, Math.PI * 0.75, endAngle);
    ctx.lineWidth = 6;
    ctx.strokeStyle = neonColor;
    ctx.shadowColor = neonColor;
    ctx.shadowBlur = 12;
    ctx.stroke();

    ctx.shadowBlur = 0;
    ctx.fillStyle = '#ffffff';
    ctx.font = '900 24px "Orbitron", Arial, sans-serif';
    ctx.textAlign = 'center';
    ctx.textBaseline = 'middle';
    ctx.fillText(Math.floor(this.speedKmh).toString(), cx, cy - 5);

    ctx.font = '12px "Orbitron", Arial, sans-serif';
    ctx.fillStyle = 'rgba(255, 255, 255, 0.6)';
    ctx.fillText('KM/H', cx, cy + 18);

    ctx.restore();
  }

  drawBillboardTruck(ctx) {
    ctx.save();
    
    const bob = Math.sin(Date.now() * 0.003) * 3;
    const ty = 120 + bob;
    const tx = this.virtualWidth / 2;
    
    ctx.fillStyle = 'rgba(10, 10, 15, 0.95)';
    ctx.strokeStyle = '#00f0ff';
    ctx.lineWidth = 3;
    ctx.shadowColor = '#00f0ff';
    ctx.shadowBlur = 10;
    
    ctx.beginPath();
    ctx.roundRect(tx - 180, ty - 40, 360, 80, 8);
    ctx.fill();
    ctx.stroke();

    ctx.strokeStyle = 'rgba(0, 240, 255, 0.08)';
    ctx.lineWidth = 1;
    ctx.shadowBlur = 0;
    ctx.beginPath();
    for (let gx = tx - 170; gx < tx + 180; gx += 20) {
      ctx.moveTo(gx, ty - 35);
      ctx.lineTo(gx, ty + 35);
    }
    for (let gy = ty - 35; gy < ty + 35; gy += 15) {
      ctx.moveTo(tx - 175, gy);
      ctx.lineTo(tx + 175, gy);
    }
    ctx.stroke();

    if (this.activeWord) {
      ctx.shadowColor = '#00f0ff';
      ctx.shadowBlur = 8;
      ctx.textAlign = 'center';
      ctx.textBaseline = 'middle';

      if (this.activeWord.romanized) {
        ctx.fillStyle = '#ffffff';
        ctx.font = '900 24px "Orbitron", Arial, sans-serif';
        ctx.fillText(this.activeWord.english, tx, ty - 10);

        ctx.fillStyle = '#dddddd';
        ctx.font = 'normal 24px Arial, sans-serif';
        ctx.fillText(this.activeWord.romanized, tx, ty + 16);
      } else {
        ctx.fillStyle = '#ffffff';
        ctx.font = '900 26px "Orbitron", Arial, sans-serif';
        ctx.fillText(this.activeWord.english, tx, ty);
      }
    }

    ctx.restore();
  }

  drawPlayerCar(ctx) {
    ctx.save();

    if (this.damageTimer > 0) {
      ctx.fillStyle = '#ff0055';
    }

    const px = this.player.x;
    const py = this.player.y;
    const pw = this.player.width;
    const ph = this.player.height;

    ctx.strokeStyle = this.turboActive ? '#00f0ff' : '#ff0055'; 
    ctx.lineWidth = 3.5;
    ctx.shadowColor = this.turboActive ? '#00f0ff' : '#ff0055';
    ctx.shadowBlur = 14;
    ctx.fillStyle = 'rgba(10, 10, 12, 0.9)';

    ctx.beginPath();
    ctx.roundRect(px - pw / 2, py - ph / 2, pw, ph, 15);
    ctx.fill();
    ctx.stroke();

    ctx.strokeStyle = '#00f0ff';
    ctx.fillStyle = 'rgba(0, 240, 255, 0.2)';
    ctx.shadowBlur = 4;
    ctx.beginPath();
    ctx.roundRect(px - 20, py - 30, 40, 35, 6);
    ctx.fill();
    ctx.stroke();

    ctx.fillStyle = '#ff0000';
    ctx.shadowColor = '#ff0000';
    ctx.shadowBlur = 15;
    ctx.fillRect(px - 20, py + ph / 2 - 8, 12, 4);
    ctx.fillRect(px + 8, py + ph / 2 - 8, 12, 4);
    
    if (this.brakeActive) {
      ctx.fillStyle = '#ffffff';
      ctx.shadowColor = '#ffaa00';
      ctx.fillRect(px - 22, py + ph / 2 - 10, 16, 6);
      ctx.fillRect(px + 6, py + ph / 2 - 10, 16, 6);
    }

    // Draw active target word in front of the player car (above it)
    if (this.activeWord) {
      ctx.shadowColor = '#00f0ff';
      ctx.shadowBlur = 6;
      ctx.fillStyle = 'rgba(5, 5, 8, 0.85)';
      ctx.strokeStyle = '#00f0ff';
      ctx.lineWidth = 1.5;
      
      ctx.font = 'bold 19px "Orbitron", Arial, sans-serif';
      let textWidth = ctx.measureText(this.activeWord.english).width;
      
      if (this.activeWord.romanized) {
        ctx.font = 'normal 15px Arial, sans-serif';
        const romanWidth = ctx.measureText(this.activeWord.romanized).width;
        textWidth = Math.max(textWidth, romanWidth);
      }
      
      textWidth += 24; // Padding
      const boxHeight = this.activeWord.romanized ? 50 : 34;
      const boxY = py - ph / 2 - boxHeight - 12; // 12px gap from front bumper
      
      ctx.beginPath();
      ctx.roundRect(px - textWidth / 2, boxY, textWidth, boxHeight, 6);
      ctx.fill();
      ctx.stroke();
      
      ctx.textAlign = 'center';
      ctx.textBaseline = 'middle';
      
      if (this.activeWord.romanized) {
        ctx.fillStyle = '#ffffff';
        ctx.font = 'bold 19px "Orbitron", Arial, sans-serif';
        ctx.fillText(this.activeWord.english, px, boxY + 16);
        
        ctx.fillStyle = '#dddddd';
        ctx.font = 'normal 22px Arial, sans-serif';
        ctx.fillText(this.activeWord.romanized, px, boxY + 40);
      } else {
        ctx.fillStyle = '#ffffff';
        ctx.font = 'bold 19px "Orbitron", Arial, sans-serif';
        ctx.fillText(this.activeWord.english, px, boxY + 17);
      }
    }

    ctx.restore();
  }

  drawStarWarsCrawl(ctx) {
    ctx.save();
    
    this.floatingFx.y -= 3;
    
    const scale = Math.max(0.1, this.floatingFx.y / 1000);
    const alpha = Math.max(0, Math.min(1, this.floatingFx.duration / 1.5));
    
    ctx.translate(this.virtualWidth / 2, this.floatingFx.y);
    ctx.scale(scale, scale);
    
    ctx.globalAlpha = alpha;
    ctx.textAlign = 'center';
    
    ctx.fillStyle = '#00f0ff';
    ctx.shadowColor = '#00f0ff';
    ctx.shadowBlur = 20;
    ctx.font = '900 80px "Orbitron", Arial, sans-serif';
    ctx.fillText(this.floatingFx.english, 0, 0);
    
    ctx.fillStyle = '#ffffff';
    ctx.shadowBlur = 10;
    ctx.font = 'bold 40px Arial, sans-serif';
    ctx.fillText(this.floatingFx.turkish, 0, 60);

    ctx.restore();
  }
}
