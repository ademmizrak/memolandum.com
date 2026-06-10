// ----------------------------------------------------
// Memolandum - Unified Exam Engine (Nihai Sınav Modülü)
// ----------------------------------------------------
class ExamEngine {
  constructor() {
    this.db = {};
    this.isActive = false;
    this.currentWord = null;
    this.sessionPool = [];
    this.currentIndex = 0;
    this.score = 0;
    this.results = []; // Array of { word, hit }
    this.lives = 10;
    this.options = []; // Array of { x, y, width, height, text, isCorrect, hp, maxHp, active, isFading, opacity, animState, animTimer }
    this.targetWordRect = null; // { x, y, width, height, text, active }
    this.inTransition = false;
    this.transitionTimer = 0;
    
    this.loadDatabase();
  }

  loadDatabase() {
    try {
      const dbStr = localStorage.getItem('memolandum_mastery_db');
      this.db = dbStr ? JSON.parse(dbStr) : {};
    } catch (e) {
      console.error("Failed to load mastery database:", e);
      this.db = {};
    }
  }

  saveDatabaseAsync() {
    // Zero-lag async local storage write
    setTimeout(() => {
      try {
        localStorage.setItem('memolandum_mastery_db', JSON.stringify(this.db));
      } catch (e) {
        console.error("Failed to save mastery database:", e);
      }
    }, 0);
  }

  registerAttempt(wordId, hit) {
    if (!wordId) return;
    
    const wId = wordId.toUpperCase();
    if (!this.db[wId]) {
      this.db[wId] = {
        totalHits: 0,
        missCount: 0,
        difficultyLevel: 3,
        lastAttempt: ""
      };
    }
    
    const entry = this.db[wId];
    entry.lastAttempt = new Date().toISOString().split('T')[0];
    
    if (hit) {
      entry.totalHits++;
      if (entry.missCount > 0) {
        entry.missCount = Math.max(0, entry.missCount - 1);
      }
      // Calibration: reduce difficulty if they get it right consistently
      if (entry.totalHits >= 3 && entry.difficultyLevel === 5 && entry.missCount === 0) {
        entry.difficultyLevel = 3;
      }
    } else {
      entry.missCount++;
      // If critical misses occur, promote difficulty to Special Question (Level 5)
      if (entry.missCount > 2) {
        entry.difficultyLevel = 5;
      }
    }
    
    this.saveDatabaseAsync();
  }

  startSession(vocabulary, gameInstance, mode = 'adaptive') {
    this.isActive = true;
    this.game = gameInstance;
    this.vocabulary = vocabulary;
    this.currentIndex = 0;
    this.score = 0;
    this.lives = 10;
    this.results = [];
    this.inTransition = false;
    this.transitionTimer = 0;
    this.currentQuestionMissed = false;
    
    if (mode === 'retry' && this.sessionPool && this.sessionPool.length > 0) {
      // Re-use the existing sessionPool
      this.sessionPool = this.sessionPool.map(item => {
        return {
          english: item.english,
          turkish: item.turkish,
          difficultyLevel: item.difficultyLevel,
          isSpecial: item.isSpecial
        };
      });
    } else if (mode === 'new_words' && this.sessionPool && this.sessionPool.length > 0) {
      const excludeWords = new Set(this.sessionPool.map(w => w.english.toUpperCase()));
      this.buildExamPool(excludeWords);
    } else {
      this.buildExamPool();
    }
    
    // Clear regular shell elements
    this.game.activeLasers = [];
    this.game.activeMeteors = [];
    this.game.activeParticles = [];
    this.game.activeGems = [];
    this.game.bossSpawned = false;
    this.game.isLevelTransitioning = false;
    
    this.game.screenShake = 0;

    this.spawnNextWord();
    this.updateHUD();
  }

  buildExamPool(excludeWords = null) {
    const db = this.db;
    
    // Filter out previous session words if requested
    let filteredVocabulary = this.vocabulary;
    if (excludeWords) {
      const candidates = this.vocabulary.filter(w => !excludeWords.has(w.english.toUpperCase()));
      // Fallback in case the vocabulary size is extremely small
      if (candidates.length >= 10) {
        filteredVocabulary = candidates;
      }
    }
    
    // Map words to DB values
    const mapped = filteredVocabulary.map(w => {
      const dbEntry = db[w.english.toUpperCase()] || {
        totalHits: 0,
        missCount: 0,
        difficultyLevel: 3,
        lastAttempt: ""
      };
      return {
        word: w,
        missCount: dbEntry.missCount,
        difficultyLevel: dbEntry.difficultyLevel
      };
    });

    // Priority Queue: Sort critical words first (highest miss count)
    mapped.sort((a, b) => b.missCount - a.missCount);

    // Pull top 10 test candidates
    this.sessionPool = mapped.slice(0, 10).map(item => {
      return {
        ...item.word,
        difficultyLevel: item.difficultyLevel,
        isSpecial: item.difficultyLevel === 5
      };
    });
  }

  generateOptionsForWord(word) {
    const correctText = word.turkish;
    
    // Get unique other translations from vocabulary
    const otherTranslations = [...new Set(
      this.vocabulary
        .map(w => w.turkish)
        .filter(t => t !== correctText)
    )];

    // Shuffle other translations and take 2
    const shuffledOthers = otherTranslations.sort(() => 0.5 - Math.random());
    const incorrect1 = shuffledOthers[0] || "DUMMY 1";
    const incorrect2 = shuffledOthers[1] || "DUMMY 2";

    // Combine and shuffle
    const choices = [
      { text: correctText, isCorrect: true },
      { text: incorrect1, isCorrect: false },
      { text: incorrect2, isCorrect: false }
    ];

    return choices.sort(() => 0.5 - Math.random());
  }

  spawnNextWord() {
    if (this.currentIndex >= this.sessionPool.length) {
      this.endSession();
      return;
    }

    const word = this.sessionPool[this.currentIndex];
    this.currentWord = word;
    this.inTransition = false;
    this.transitionTimer = 0;
    this.currentQuestionMissed = false;

    // Create target word (stationary at top below HUD)
    const targetText = word.english;
    const targetWidth = Math.max(180, targetText.length * 14 + 50);
    this.targetWordRect = {
      x: this.game.virtualWidth / 2 - targetWidth / 2,
      y: 95,
      width: targetWidth,
      height: 45,
      text: targetText,
      active: true
    };

    // Get 3 options (1 correct, 2 incorrect)
    const optionsData = this.generateOptionsForWord(word);

    // X spacing coordinates for 3 options (each option is 160px wide to fit inside 600px virtual width)
    const optWidth = 160;
    const optHeight = 45;
    const xCoords = [30, 220, 410];

    this.options = optionsData.map((opt, idx) => {
      const isCorrect = opt.isCorrect;
      const hp = (isCorrect && word.isSpecial) ? 5 : 1;
      return {
        x: xCoords[idx],
        y: 160, // Starting height below target word
        width: optWidth,
        height: optHeight,
        text: opt.text,
        isCorrect: isCorrect,
        hp: hp,
        maxHp: hp,
        active: true,
        isFading: false,
        opacity: 1.0,
        animState: null, // 'green_delay', 'merging', 'done'
        animTimer: 0
      };
    });

    // Make sure game has no active meteors so nothing overlaps
    this.game.activeMeteors = [];

    if (this.game && this.game.isBreakout) {
      this.game.setupExamQuestion(word, this.options);
    }
  }

  checkLaserOptionCollision(laser, option) {
    const lMinX = laser.x - laser.width / 2;
    const lMaxX = laser.x + laser.width / 2;
    const lMinY = laser.y;
    const lMaxY = laser.y + laser.height;

    const oMinX = option.x;
    const oMaxX = option.x + option.width;
    const oMinY = option.y;
    const oMaxY = option.y + option.height;

    return lMinX < oMaxX &&
           lMaxX > oMinX &&
           lMinY < oMaxY &&
           lMaxY > oMinY;
  }

  update(dt) {
    if (!this.isActive) return;

    if (this.game && this.game.isBreakout) {
      this.game.updateExam(dt);
      return;
    }

    // Update background stars
    this.game.stars.forEach(star => star.update(dt, this.game.virtualWidth, this.game.virtualHeight));

    // 1. Update player movements
    this.game.player.update(dt, this.game.input);

    // 2. Handle firing
    if (this.game.input.fire && this.game.player.canFire()) {
      this.game.soundManager.playLaser();
      const laserLeft = this.game.laserPool.acquire(this.game.player.x - 18, this.game.player.y - 10);
      const laserRight = this.game.laserPool.acquire(this.game.player.x + 18, this.game.player.y - 10);
      this.game.activeLasers.push(laserLeft, laserRight);
      this.game.player.resetCooldown();
    }

    // 3. Update active lasers
    for (let i = this.game.activeLasers.length - 1; i >= 0; i--) {
      const laser = this.game.activeLasers[i];
      laser.update(dt);
      if (!laser.active) {
        this.game.laserPool.release(laser);
        this.game.activeLasers.splice(i, 1);
      }
    }

    // 4. Update falling options
    const speed = 55 * this.game.speedMultiplier;
    
    if (!this.inTransition) {
      let reachedBottom = false;
      this.options.forEach(opt => {
        if (opt.active) {
          opt.y += speed * dt;
          if (opt.y > 830) {
            reachedBottom = true;
          }
        }
      });

      if (reachedBottom) {
        this.game.soundManager.playDamage();
        this.options.forEach(opt => {
          if (opt.active) {
            this.game.spawnExplosion(opt.x + opt.width / 2, opt.y + opt.height / 2, '#ff0055');
          }
        });
        
        if (!this.currentQuestionMissed) {
          this.currentQuestionMissed = true;
          this.registerAttempt(this.currentWord.english, false);
          this.results.push({ word: this.currentWord, hit: false });
          this.lives--;
        }

        this.targetWordRect.active = false;
        this.inTransition = true;
        this.transitionTimer = 0.8;
      }
    } else {
      // Transition countdown and option fading
      const correctOpt = this.options.find(o => o.isCorrect);
      
      this.options.forEach(opt => {
        if (opt.isFading) {
          opt.opacity = Math.max(0, opt.opacity - dt * 2.0); // Fades out over 0.5s
        }
      });

      if (correctOpt && correctOpt.animState) {
        if (correctOpt.animState === 'green_delay') {
          correctOpt.animTimer -= dt;
          if (correctOpt.animTimer <= 0) {
            correctOpt.animState = 'merging';
          }
        } else if (correctOpt.animState === 'merging') {
          // Travel towards target word position
          const targetX = this.targetWordRect.x + this.targetWordRect.width / 2 - correctOpt.width / 2;
          const targetY = this.targetWordRect.y;

          // Smooth interpolation
          correctOpt.x += (targetX - correctOpt.x) * 12 * dt;
          correctOpt.y += (targetY - correctOpt.y) * 12 * dt;

          const dist = Math.hypot(targetX - correctOpt.x, targetY - correctOpt.y);
          if (dist < 8) {
            // Merged!
            correctOpt.active = false;
            this.targetWordRect.active = false;
            
            // Explode target word and correct option
            this.game.soundManager.playExplosion();
            const expColor = this.currentWord.isSpecial ? '#ffea00' : '#39ff14';
            
            this.game.spawnExplosion(this.targetWordRect.x + this.targetWordRect.width / 2, this.targetWordRect.y + this.targetWordRect.height / 2, expColor);
            this.game.spawnExplosion(correctOpt.x + correctOpt.width / 2, correctOpt.y + correctOpt.height / 2, expColor);
            this.game.screenShake = 8;
            this.game.hitPauseUntil = performance.now() + 200;

            // Wait a brief moment before spawning next word
            correctOpt.animState = 'done';
            this.transitionTimer = 0.5; // Short delay after explosion before next word
          }
        } else if (correctOpt.animState === 'done') {
          this.transitionTimer -= dt;
          if (this.transitionTimer <= 0) {
            this.currentIndex++;
            this.updateHUD();
            this.spawnNextWord();
            return;
          }
        }
      } else {
        // If wrong option hit or bottom leak
        this.transitionTimer -= dt;
        if (this.transitionTimer <= 0) {
          this.currentIndex++;
          this.updateHUD();
          this.spawnNextWord();
          return;
        }
      }
    }

    // 5. Collision checks (Lasers vs Options)
    if (this.options && this.options.length > 0 && !this.inTransition) {
      for (let i = this.game.activeLasers.length - 1; i >= 0; i--) {
        const laser = this.game.activeLasers[i];
        
        for (let j = 0; j < this.options.length; j++) {
          const opt = this.options[j];
          if (opt.active && !opt.isFading && opt.y > 50 && this.checkLaserOptionCollision(laser, opt)) {
            // Remove laser
            this.game.laserPool.release(laser);
            this.game.activeLasers.splice(i, 1);

            opt.hp--;

            if (opt.hp > 0) {
              this.game.soundManager.playExplosion();
              this.game.spawnExplosion(laser.x, laser.y, '#00f0ff');
              this.game.screenShake = 3;
              this.game.hitPauseUntil = performance.now() + 50;
            } else {
              // Destroyed!
              if (opt.isCorrect) {
                // Correct choice shot - trigger animState
                this.game.soundManager.playExplosion();
                this.game.screenShake = 4;
                this.game.hitPauseUntil = performance.now() + 100;

                if (!this.currentQuestionMissed) {
                  this.registerAttempt(this.currentWord.english, true);
                  this.results.push({ word: this.currentWord, hit: true });
                  this.score++;
                }

                // Correct chosen option turns green and pauses for 1 second
                opt.animState = 'green_delay';
                opt.animTimer = 1.0;

                // Incorrect options fade out from their current color
                this.options.forEach(o => {
                  if (!o.isCorrect) {
                    o.isFading = true;
                  }
                });
                
                this.inTransition = true;
              } else {
                // Incorrect choice shot
                this.game.soundManager.playDamage();
                this.game.spawnExplosion(opt.x + opt.width / 2, opt.y + opt.height / 2, '#ff0055');
                this.game.screenShake = 12;
                this.game.hitPauseUntil = performance.now() + 200;

                opt.active = false;

                if (!this.currentQuestionMissed) {
                  this.currentQuestionMissed = true;
                  this.registerAttempt(this.currentWord.english, false);
                  this.results.push({ word: this.currentWord, hit: false });
                  this.lives--;
                  this.updateHUD();
                }
              }
            }
            break;
          }
        }
      }
    }

    // 6. Update explosion particles
    for (let i = this.game.activeParticles.length - 1; i >= 0; i--) {
      const particle = this.game.activeParticles[i];
      particle.update(dt);
      if (!particle.active) {
        this.game.particlePool.release(particle);
        this.game.activeParticles.splice(i, 1);
      }
    }
  }

  draw(ctx) {
    if (!this.isActive) return;

    if (this.game && this.game.isBreakout) {
      this.game.drawExam(ctx);
      return;
    }

    const drawOptionText = (text, x, y, width, height, color, isSpecialSubText = false) => {
      ctx.save();
      ctx.shadowBlur = 0; // Prevent text blurriness from box glow!
      ctx.fillStyle = color;
      
      const words = text.split(' ');
      const roundedX = Math.round(x);
      const roundedY = Math.round(y);
      const roundedWidth = Math.round(width);
      const roundedHeight = Math.round(height);

      if (words.length > 1 && !isSpecialSubText) {
        ctx.font = 'bold 12px Arial, sans-serif';
        ctx.textBaseline = 'middle';
        const mid = Math.ceil(words.length / 2);
        const line1 = words.slice(0, mid).join(' ');
        const line2 = words.slice(mid).join(' ');
        ctx.fillText(line1, roundedX + roundedWidth / 2, roundedY + roundedHeight / 2 - 9);
        ctx.fillText(line2, roundedX + roundedWidth / 2, roundedY + roundedHeight / 2 + 9);
      } else {
        let fontSize = 15;
        ctx.font = `bold ${fontSize}px Arial, sans-serif`;
        let textWidth = ctx.measureText(text).width;
        const maxWidth = roundedWidth - 16;
        while (textWidth > maxWidth && fontSize > 10) {
          fontSize--;
          ctx.font = `bold ${fontSize}px Arial, sans-serif`;
          textWidth = ctx.measureText(text).width;
        }
        ctx.textBaseline = 'middle';
        ctx.fillText(text, roundedX + roundedWidth / 2, roundedY + roundedHeight / 2 + (isSpecialSubText ? 10 : 0));
      }
      ctx.restore();
    };

    // Draw starfield
    this.game.stars.forEach(star => star.draw(ctx));

    // Draw lasers
    this.game.activeLasers.forEach(laser => laser.draw(ctx));

    // Draw stationary target word
    if (this.targetWordRect && this.targetWordRect.active) {
      ctx.save();
      const rect = this.targetWordRect;

      if (this.currentWord.isSpecial) {
        // Gold theme for Special target word
        ctx.strokeStyle = '#ffea00';
        ctx.lineWidth = 4;
        ctx.shadowColor = '#ffea00';
        ctx.shadowBlur = 15;
        ctx.fillStyle = 'rgba(15, 12, 2, 0.95)';
        
        ctx.beginPath();
        ctx.roundRect(rect.x, rect.y, rect.width, rect.height, 12);
        ctx.fill();
        ctx.stroke();

        ctx.fillStyle = '#ffea00';
        ctx.font = '900 11px "Orbitron", sans-serif';
        ctx.textAlign = 'center';
        ctx.fillText("⭐ SPECIAL TARGET ⭐", rect.x + rect.width / 2, rect.y + 14);

        ctx.fillStyle = '#ffffff';
        ctx.font = 'bold 18px Arial, sans-serif';
        ctx.textAlign = 'center';
        ctx.textBaseline = 'middle';
        ctx.fillText(rect.text, rect.x + rect.width / 2, rect.y + rect.height / 2 + 10);
      } else {
        // Cyan theme for normal target word
        ctx.strokeStyle = '#00f0ff';
        ctx.lineWidth = 2.5;
        ctx.shadowColor = '#00f0ff';
        ctx.shadowBlur = 10;
        ctx.fillStyle = 'rgba(2, 8, 15, 0.9)';

        ctx.beginPath();
        ctx.roundRect(rect.x, rect.y, rect.width, rect.height, 8);
        ctx.fill();
        ctx.stroke();

        ctx.fillStyle = '#ffffff';
        ctx.font = 'bold 17px Arial, sans-serif';
        ctx.textAlign = 'center';
        ctx.textBaseline = 'middle';
        ctx.fillText(rect.text, rect.x + rect.width / 2, rect.y + rect.height / 2);
      }
      ctx.restore();
    }

    // Draw options
    this.options.forEach(opt => {
      if (!opt.active && !opt.isFading) return;

      ctx.save();
      ctx.globalAlpha = opt.opacity;

      const isPlayZone = opt.y > 50;
      const roundedX = Math.round(opt.x);
      const roundedY = Math.round(opt.y);
      const roundedWidth = Math.round(opt.width);
      const roundedHeight = Math.round(opt.height);
      
      if (opt.isCorrect && opt.animState && opt.animState !== 'done') {
        // Green theme for correctly hit option
        ctx.strokeStyle = '#39ff14';
        ctx.lineWidth = 3;
        ctx.shadowColor = '#39ff14';
        ctx.shadowBlur = 15;
        ctx.fillStyle = 'rgba(5, 20, 5, 0.95)';
      } else if (opt.isCorrect && this.currentQuestionMissed) {
        // Blinking hint theme for correct option when missed
        const isBlinkOn = Math.floor(performance.now() / 250) % 2 === 0;
        if (isBlinkOn) {
          ctx.strokeStyle = '#ffea00'; // Neon yellow highlight
          ctx.lineWidth = 4;
          ctx.shadowColor = '#ffea00';
          ctx.shadowBlur = 15;
          ctx.fillStyle = 'rgba(25, 25, 5, 0.95)';
        } else {
          ctx.strokeStyle = '#00f0ff'; // Soft cyan
          ctx.lineWidth = 2.5;
          ctx.shadowColor = '#00f0ff';
          ctx.shadowBlur = 5;
          ctx.fillStyle = 'rgba(2, 8, 15, 0.85)';
        }
      } else if (opt.isCorrect && this.currentWord.isSpecial) {
        // Gold glowing visual theme for Special correct option
        ctx.strokeStyle = isPlayZone ? '#ffea00' : 'rgba(255, 234, 0, 0.35)';
        ctx.lineWidth = 4;
        ctx.shadowColor = '#ffea00';
        ctx.shadowBlur = isPlayZone ? 15 : 0;
        ctx.fillStyle = isPlayZone ? 'rgba(15, 12, 2, 0.95)' : 'rgba(15, 12, 2, 0.5)';
      } else {
        // Cyan theme for normal options
        ctx.strokeStyle = isPlayZone ? '#00f0ff' : 'rgba(0, 240, 255, 0.35)';
        ctx.lineWidth = 2.5;
        ctx.shadowColor = '#00f0ff';
        ctx.shadowBlur = isPlayZone ? 10 : 0;
        ctx.fillStyle = isPlayZone ? 'rgba(2, 8, 15, 0.85)' : 'rgba(2, 8, 15, 0.35)';
      }

      ctx.beginPath();
      ctx.roundRect(roundedX, roundedY, roundedWidth, roundedHeight, 8);
      ctx.fill();
      ctx.stroke();

      ctx.textAlign = 'center';

      if (opt.isCorrect && opt.animState && opt.animState !== 'done') {
        drawOptionText(opt.text, opt.x, opt.y, opt.width, opt.height, '#39ff14');
      } else if (opt.isCorrect && this.currentQuestionMissed && !opt.isFading) {
        const isBlinkOn = Math.floor(performance.now() / 250) % 2 === 0;
        drawOptionText(opt.text, opt.x, opt.y, opt.width, opt.height, isBlinkOn ? '#ffea00' : '#ffffff');
      } else if (opt.isCorrect && this.currentWord.isSpecial && !opt.isFading) {
        ctx.fillStyle = '#ffea00';
        ctx.font = '900 11px "Orbitron", sans-serif';
        ctx.fillText("⭐ HP: " + opt.hp + " ⭐", roundedX + roundedWidth / 2, roundedY + 15);
        drawOptionText(opt.text, opt.x, opt.y, opt.width, opt.height, '#ffffff', true);
      } else {
        drawOptionText(opt.text, opt.x, opt.y, opt.width, opt.height, '#ffffff');
      }

      ctx.restore();
    });

    // Draw particles
    this.game.activeParticles.forEach(particle => particle.draw(ctx));

    // Draw player
    this.game.player.draw(ctx);
  }

  updateHUD() {
    const shieldsEl = document.getElementById('hud-shields');
    const levelValEl = document.getElementById('level-val');
    const masteredValEl = document.getElementById('mastered-val');
    const scoreValEl = document.getElementById('score-val');
    const gemsValEl = document.getElementById('gems-val');

    const levelLabelEl = document.getElementById('level-label');
    const masteredLabelEl = document.getElementById('mastered-label');
    const scoreLabelEl = document.getElementById('score-label');

    // 1. Lives update (uses shields instead of hearts for consistency)
    if (shieldsEl) {
      shieldsEl.style.fontSize = '10px';
      shieldsEl.style.letterSpacing = '1px';
      let shieldsStr = '';
      for (let i = 0; i < 10; i++) {
        shieldsStr += (i < this.lives) ? '🛡️' : '💀';
      }
      shieldsEl.textContent = shieldsStr;
    }

    // 2. Exam Mode Label & Header
    if (levelLabelEl) {
      levelLabelEl.textContent = 'MODE';
    }
    if (levelValEl) {
      levelValEl.textContent = 'EXAM';
    }

    // 3. Question counter instead of mastered
    if (masteredLabelEl) {
      masteredLabelEl.textContent = 'QUESTION';
    }
    if (masteredValEl) {
      const displayIndex = Math.min(this.sessionPool.length, this.currentIndex + 1);
      masteredValEl.textContent = `${displayIndex}/${this.sessionPool.length}`;
    }

    // 4. Correct counter instead of score
    if (scoreLabelEl) {
      scoreLabelEl.textContent = 'CORRECT';
    }
    if (scoreValEl) {
      scoreValEl.textContent = this.score;
    }

    // 5. Gem counter
    if (gemsValEl) {
      const collectedGems = parseInt(localStorage.getItem('memolandum_collected_gems')) || 0;
      gemsValEl.textContent = `💎 ${collectedGems}`;
    }
  }

  endSession() {
    this.isActive = false;

    // Show pause button again
    const pauseBtn = document.getElementById('btn-pause');
    if (pauseBtn) pauseBtn.classList.remove('hidden');

    // Clean up
    this.options = [];
    this.targetWordRect = null;
    this.game.activeLasers.forEach(l => this.game.laserPool.release(l));
    this.game.activeLasers = [];

    this.onComplete();
  }

  onComplete() {
    document.getElementById('hud').classList.add('hidden');
    document.getElementById('gameCanvas').classList.add('hidden');
    document.querySelector('.controls-container').classList.add('hidden');

    const resultsScreen = document.getElementById('exam-results-screen');
    const examScoreEl = document.getElementById('exam-score');
    const examListEl = document.getElementById('exam-details-list');

    if (examScoreEl) {
      examScoreEl.textContent = `${this.score}/${this.sessionPool.length}`;
    }

    if (examListEl) {
      examListEl.innerHTML = '';
      this.results.forEach(res => {
        const item = document.createElement('li');
        item.style.display = 'flex';
        item.style.justify = 'space-between';
        item.style.padding = '8px 12px';
        item.style.borderRadius = '6px';
        item.style.background = 'rgba(255, 255, 255, 0.03)';
        item.style.border = '1px solid rgba(255, 255, 255, 0.05)';
        item.style.fontSize = '13px';
        
        const textSpan = document.createElement('span');
        textSpan.innerHTML = `<strong>${res.word.english}</strong>: ${res.word.turkish}`;
        textSpan.style.color = '#ffffff';

        const statusSpan = document.createElement('span');
        if (res.hit) {
          statusSpan.textContent = 'CORRECT';
          statusSpan.style.color = 'var(--glow-green)';
          statusSpan.style.fontWeight = 'bold';
        } else {
          statusSpan.textContent = 'MISSED';
          statusSpan.style.color = 'var(--glow-magenta)';
          statusSpan.style.fontWeight = 'bold';
        }

        item.appendChild(textSpan);
        item.appendChild(statusSpan);
        examListEl.appendChild(item);
      });
    }

    if (resultsScreen) {
      resultsScreen.classList.remove('hidden');
    }

    const retryBtn = document.getElementById('exam-retry-btn');
    const newBtn = document.getElementById('exam-new-btn');
    const closeBtn = document.getElementById('exam-close-btn');

    if (retryBtn) {
      retryBtn.onclick = () => {
        resultsScreen.classList.add('hidden');
        if (typeof restartExam === 'function') {
          restartExam('retry');
        }
      };
    }

    if (newBtn) {
      newBtn.onclick = () => {
        resultsScreen.classList.add('hidden');
        if (typeof restartExam === 'function') {
          restartExam('new_words');
        }
      };
    }

    closeBtn.onclick = () => {
      resultsScreen.classList.add('hidden');
      if (this.game) {
        cancelAnimationFrame(this.game.loopId);
        this.game.cleanup();
        window.game = null;
      }
      showMainMenu();
      updateMainMenuResumeUI();
    };
  }
}
