export class RetroBreakoutEngine {
  constructor(canvas, words, callbacks) {
    this.canvas = canvas;
    this.ctx = canvas.getContext('2d');
    
    // Callbacks: onScore(points), onUpdateLives(lives), onPlayVoice(word), onGameOver(won, score), onTargetWord(trWord)
    this.callbacks = callbacks || {};
    
    this.words = words; // List of foreign words and tr translations
    this.blocks = [];
    this.particles = [];
    this.floatingTexts = [];
    this.stars = [];
    
    this.state = 'start'; // start, playing, gameover, victory
    this.score = 0;
    this.lives = 3;
    
    // Target word mechanics
    this.targetWord = null;
    this.targetWordTr = null;

    // Paddle
    this.paddle = {
      x: 0,
      y: 0,
      width: 160,
      baseWidth: 160,
      height: 16,
      color: '#38bdf8',
      shrinkTimer: 0
    };
    
    // Ball
    this.ball = {
      x: 0,
      y: 0,
      radius: 8,
      dx: 0,
      dy: 0,
      baseSpeed: 7,
      speedMultiplier: 1,
      speedTimer: 0
    };
    
    // Grid Setup
    this.cols = 5;
    this.rows = 3;
    this.blockWidth = 0;
    this.blockHeight = 40;
    this.blockPadding = 10;
    this.edgePadding = 20; // Extra padding for left and right edges
    this.offsetTop = 80;

    this.lastTime = 0;
    this.animationId = null;

    this.initBackground();
    this.resize(this.canvas.width, this.canvas.height);
    this.setupLevel();
    
    this.bindEvents();
  }

  initBackground() {
    this.stars = [];
    for (let i = 0; i < 100; i++) {
      this.stars.push({
        x: Math.random() * this.canvas.width,
        y: Math.random() * this.canvas.height,
        size: Math.random() * 2,
        speed: Math.random() * 0.5 + 0.1,
        brightness: Math.random()
      });
    }
  }

  resize(width, height) {
    this.canvas.width = width;
    this.canvas.height = height;
    
    // Re-adjust paddle
    this.paddle.y = this.canvas.height - 40;
    if (this.paddle.x + this.paddle.width > this.canvas.width) {
      this.paddle.x = this.canvas.width - this.paddle.width;
    }
    
    // Re-adjust blocks width
    this.blockWidth = (this.canvas.width - (2 * this.edgePadding) - (this.blockPadding * (this.cols - 1))) / this.cols;
    this.updateBlockPositions();
  }
  
  updateBlockPositions() {
    let index = 0;
    for (let r = 0; r < this.rows; r++) {
      for (let c = 0; c < this.cols; c++) {
        if (this.blocks[index]) {
          this.blocks[index].x = this.edgePadding + (c * (this.blockWidth + this.blockPadding));
          this.blocks[index].y = (r * (this.blockHeight + this.blockPadding)) + this.offsetTop;
          this.blocks[index].width = this.blockWidth;
        }
        index++;
      }
    }
  }

  setupLevel() {
    // Select 3 random unique words
    let shuffledWords = [...this.words].sort(() => 0.5 - Math.random());
    let selected = shuffledWords.slice(0, 3);
    
    if (selected.length === 0) return;
    
    // We have 3 unique words. All of them will be targets eventually.
    this.wordPhases = selected; // Array of 3 word objects
    this.currentPhaseIndex = 0;
    
    this.setTargetWord(this.wordPhases[this.currentPhaseIndex]);
    
    let blockData = [];
    // 5 instances of each word
    for(let i=0; i<5; i++) blockData.push({ text: selected[0].english, trText: selected[0].turkish, wordId: 0, audioUrl: selected[0].audioUrl });
    for(let i=0; i<5; i++) blockData.push({ text: selected[1].english, trText: selected[1].turkish, wordId: 1, audioUrl: selected[1].audioUrl });
    for(let i=0; i<5; i++) blockData.push({ text: selected[2].english, trText: selected[2].turkish, wordId: 2, audioUrl: selected[2].audioUrl });
    
    // Shuffle block positions
    blockData.sort(() => 0.5 - Math.random());
    
    this.blocks = [];
    for (let i = 0; i < 15; i++) {
      this.blocks.push({
        ...blockData[i],
        active: true,
        x: 0, 
        y: 0,
        width: 0,
        height: this.blockHeight
      });
    }
    
    this.updateTargetFlags();
    
    this.updateBlockPositions();
    this.resetBall();
  }

  setTargetWord(wordObj) {
    this.targetWord = wordObj.english;
    this.targetWordTr = wordObj.turkish;
    if (this.callbacks.onTargetWord) this.callbacks.onTargetWord(this.targetWordTr);
  }

  updateTargetFlags() {
    this.blocks.forEach(b => {
      b.isTarget = (b.wordId === this.currentPhaseIndex);
    });
  }

  resetBall() {
    this.ball.x = this.paddle.x + this.paddle.width / 2;
    this.ball.y = this.paddle.y - this.ball.radius - 1;
    this.ball.dx = (Math.random() > 0.5 ? 1 : -1) * this.ball.baseSpeed * 0.7;
    this.ball.dy = -this.ball.baseSpeed;
    this.ball.speedMultiplier = 1;
  }

  bindEvents() {
    this.handleMouseMove = (e) => {
      if (this.state !== 'playing') return;
      const rect = this.canvas.getBoundingClientRect();
      const relativeX = e.clientX - rect.left;
      if (relativeX > 0 && relativeX < this.canvas.width) {
        this.paddle.x = relativeX - this.paddle.width / 2;
      }
    };
    
    this.handleTouchMove = (e) => {
      if (this.state !== 'playing') return;
      e.preventDefault(); // Prevent scrolling
      const rect = this.canvas.getBoundingClientRect();
      const relativeX = e.touches[0].clientX - rect.left;
      if (relativeX > 0 && relativeX < this.canvas.width) {
        this.paddle.x = relativeX - this.paddle.width / 2;
      }
    };

    this.canvas.addEventListener('mousemove', this.handleMouseMove);
    this.canvas.addEventListener('touchmove', this.handleTouchMove, { passive: false });
  }

  startGame() {
    if (this.state === 'start' || this.state === 'gameover' || this.state === 'victory') {
      this.score = 0;
      this.lives = 3;
      if (this.callbacks.onScore) this.callbacks.onScore(this.score);
      if (this.callbacks.onUpdateLives) this.callbacks.onUpdateLives(this.lives);
      this.setupLevel();
      this.state = 'playing';
      this.lastTime = performance.now();
      if (!this.animationId) {
        this.loop(this.lastTime);
      }
    } else if (this.state === 'paused') {
      this.state = 'playing';
      this.lastTime = performance.now();
      this.loop(this.lastTime);
    }
  }

  stopGame() {
    this.state = 'paused';
    if (this.animationId) {
      cancelAnimationFrame(this.animationId);
      this.animationId = null;
    }
  }

  createParticles(x, y, color) {
    for (let i = 0; i < 15; i++) {
      this.particles.push({
        x: x,
        y: y,
        dx: (Math.random() - 0.5) * 10,
        dy: (Math.random() - 0.5) * 10,
        life: 1.0,
        color: color
      });
    }
  }

  update(dt) {
    if (this.state !== 'playing') return;

    // Boundary paddle
    if (this.paddle.x < 0) this.paddle.x = 0;
    if (this.paddle.x + this.paddle.width > this.canvas.width) {
      this.paddle.x = this.canvas.width - this.paddle.width;
    }

    // Paddle shrink timer
    if (this.paddle.shrinkTimer > 0) {
      this.paddle.shrinkTimer -= dt;
      if (this.paddle.shrinkTimer <= 0) {
        this.paddle.width = this.paddle.baseWidth;
      }
    }

    // Ball speed timer
    if (this.ball.speedTimer > 0) {
      this.ball.speedTimer -= dt;
      if (this.ball.speedTimer <= 0) {
        this.ball.speedMultiplier = 1;
      }
    }

    // Move ball
    let currentSpeedX = this.ball.dx * this.ball.speedMultiplier;
    let currentSpeedY = this.ball.dy * this.ball.speedMultiplier;
    
    // Scale by dt for smooth movement if needed, but for simplicity assuming ~60FPS base
    let timeScale = dt / 16.6667;
    timeScale = Math.min(timeScale, 3.0); // Clamp to prevent teleportation on lag/background
    
    this.ball.x += currentSpeedX * timeScale;
    this.ball.y += currentSpeedY * timeScale;

    // Wall collisions
    if (this.ball.x + this.ball.radius > this.canvas.width) {
      this.ball.x = this.canvas.width - this.ball.radius;
      this.ball.dx = -Math.abs(this.ball.dx);
    } else if (this.ball.x - this.ball.radius < 0) {
      this.ball.x = this.ball.radius;
      this.ball.dx = Math.abs(this.ball.dx);
    }
    
    if (this.ball.y - this.ball.radius < 0) {
      this.ball.y = this.ball.radius;
      this.ball.dy = Math.abs(this.ball.dy);
    } else if (this.ball.y + this.ball.radius > this.canvas.height) {
      // Life lost
      this.lives--;
      if (this.callbacks.onUpdateLives) this.callbacks.onUpdateLives(this.lives);
      
      if (this.lives <= 0) {
        this.state = 'gameover';
        if (this.callbacks.onGameOver) this.callbacks.onGameOver(false, this.score);
      } else {
        this.resetBall();
      }
    }

    // Paddle collision
    if (
      this.ball.y + this.ball.radius >= this.paddle.y &&
      this.ball.y - this.ball.radius <= this.paddle.y + this.paddle.height &&
      this.ball.x + this.ball.radius >= this.paddle.x &&
      this.ball.x - this.ball.radius <= this.paddle.x + this.paddle.width &&
      this.ball.dy > 0
    ) {
      this.ball.y = this.paddle.y - this.ball.radius;
      this.ball.dy = -this.ball.dy;
      
      // DX-Ball Physics: Angle based on where it hit the paddle
      let hitPoint = this.ball.x - (this.paddle.x + this.paddle.width / 2);
      // Normalize to -1 to 1
      let normalizedHit = hitPoint / (this.paddle.width / 2);
      
      // Max bounce angle ~ 60 degrees
      const MAX_BOUNCE_ANGLE = Math.PI / 3;
      let bounceAngle = normalizedHit * MAX_BOUNCE_ANGLE;
      
      let speed = Math.sqrt(this.ball.dx * this.ball.dx + this.ball.dy * this.ball.dy);
      // Limit min/max speed to maintain consistency
      if (speed < this.ball.baseSpeed) speed = this.ball.baseSpeed;
      if (speed > this.ball.baseSpeed * 1.5) speed = this.ball.baseSpeed * 1.5;
      
      this.ball.dx = speed * Math.sin(bounceAngle);
      this.ball.dy = -speed * Math.cos(bounceAngle);
    }

    // Block collision
    let activeTargetsLeft = 0;
    
    for (let i = 0; i < this.blocks.length; i++) {
      let b = this.blocks[i];
      if (b.active) {
        if (b.isTarget) activeTargetsLeft++;
        
        // Simple AABB
        if (
          this.ball.x + this.ball.radius > b.x &&
          this.ball.x - this.ball.radius < b.x + this.blockWidth &&
          this.ball.y + this.ball.radius > b.y &&
          this.ball.y - this.ball.radius < b.y + b.height
        ) {
          // Collision detected
          b.active = false;
          
          // Determine bounce direction
          // Check from which side the ball came by analyzing previous position
          let prevX = this.ball.x - currentSpeedX * timeScale;
          let prevY = this.ball.y - currentSpeedY * timeScale;
          
          let hitLeftOrRight = (prevX + this.ball.radius < b.x) || (prevX - this.ball.radius > b.x + this.blockWidth);
          if (hitLeftOrRight) {
            this.ball.dx = -this.ball.dx;
          } else {
            this.ball.dy = -this.ball.dy;
          }

          if (this.callbacks.onPlayVoice) this.callbacks.onPlayVoice(b.text, b.isTarget, b.audioUrl);
          
          if (b.isTarget) {
            this.score += 100;
            this.createParticles(b.x + this.blockWidth/2, b.y + b.height/2, '#a855f7');
            this.floatingTexts.push({ startX: b.x + this.blockWidth/2, startY: b.y + b.height/2, text: b.trText, engText: b.text, life: 1.0, color: '#a855f7' });
          } else {
            this.score = Math.max(0, this.score - 20);
            this.createParticles(b.x + this.blockWidth/2, b.y + b.height/2, '#ef4444');
            this.floatingTexts.push({ startX: b.x + this.blockWidth/2, startY: b.y + b.height/2, text: b.trText, engText: b.text, life: 1.0, color: '#ef4444' });
            // Penalty: shrink paddle and speed up ball
            this.paddle.width = this.paddle.baseWidth * 0.6;
            this.paddle.shrinkTimer = 3000; // 3 seconds
            this.ball.speedMultiplier = 1.3;
            this.ball.speedTimer = 3000;
          }
          
          if (this.callbacks.onScore) this.callbacks.onScore(this.score);
        }
      }
    }
    
    // Victory condition or Next Phase
    if (activeTargetsLeft === 0 && this.state === 'playing') {
      this.currentPhaseIndex++;
      if (this.currentPhaseIndex < 3) {
        // Next phase
        this.setTargetWord(this.wordPhases[this.currentPhaseIndex]);
        this.updateTargetFlags();
      } else {
        // All 3 words completed, game won
        this.state = 'victory';
        if (this.callbacks.onGameOver) this.callbacks.onGameOver(true, this.score);
      }
    }

    // Update particles
    for (let i = this.particles.length - 1; i >= 0; i--) {
      let p = this.particles[i];
      p.x += p.dx;
      p.y += p.dy;
      p.life -= 0.02 * timeScale;
      if (p.life <= 0) {
        this.particles.splice(i, 1);
      }
    }
    
    // Update floating texts
    for (let i = this.floatingTexts.length - 1; i >= 0; i--) {
      let ft = this.floatingTexts[i];
      ft.life -= 0.007 * timeScale; // Fade out slowly (approx 2.4s)
      if (ft.life <= 0) {
        this.floatingTexts.splice(i, 1);
      }
    }
    
    // Update stars
    this.stars.forEach(star => {
      star.y += star.speed * timeScale;
      if (star.y > this.canvas.height) {
        star.y = 0;
        star.x = Math.random() * this.canvas.width;
      }
      star.brightness += (Math.random() - 0.5) * 0.1;
      if(star.brightness > 1) star.brightness = 1;
      if(star.brightness < 0) star.brightness = 0;
    });
  }

  draw() {
    this.ctx.fillStyle = '#0f172a';
    this.ctx.fillRect(0, 0, this.canvas.width, this.canvas.height);

    // Stars
    this.stars.forEach(star => {
      this.ctx.fillStyle = `rgba(255, 255, 255, ${star.brightness})`;
      this.ctx.beginPath();
      this.ctx.arc(star.x, star.y, star.size, 0, Math.PI * 2);
      this.ctx.fill();
    });

    // Paddle
    this.ctx.fillStyle = this.paddle.shrinkTimer > 0 ? '#ef4444' : this.paddle.color;
    this.ctx.shadowColor = this.paddle.shrinkTimer > 0 ? '#ef4444' : this.paddle.color;
    this.ctx.shadowBlur = 15;
    this.ctx.beginPath();
    this.ctx.roundRect(this.paddle.x, this.paddle.y, this.paddle.width, this.paddle.height, 8);
    this.ctx.fill();
    this.ctx.shadowBlur = 0;

    // Ball
    this.ctx.fillStyle = this.ball.speedMultiplier > 1 ? '#f59e0b' : '#c084fc';
    this.ctx.shadowColor = this.ball.speedMultiplier > 1 ? '#f59e0b' : '#c084fc';
    this.ctx.shadowBlur = 10;
    this.ctx.beginPath();
    this.ctx.arc(this.ball.x, this.ball.y, this.ball.radius, 0, Math.PI * 2);
    this.ctx.fill();
    this.ctx.shadowBlur = 0;

    // Blocks
    for (let i = 0; i < this.blocks.length; i++) {
      let b = this.blocks[i];
      if (b.active) {
        // Glassmorphism Neon Brick
        this.ctx.fillStyle = b.isTarget ? 'rgba(168, 85, 247, 0.2)' : 'rgba(14, 165, 233, 0.2)';
        this.ctx.strokeStyle = b.isTarget ? '#a855f7' : '#0ea5e9';
        this.ctx.lineWidth = 2;
        this.ctx.shadowColor = b.isTarget ? '#a855f7' : '#0ea5e9';
        this.ctx.shadowBlur = 15;
        
        this.ctx.beginPath();
        this.ctx.roundRect(b.x, b.y, this.blockWidth, b.height, 6);
        this.ctx.fill();
        this.ctx.stroke();
        this.ctx.shadowBlur = 0;

        // Text
        this.ctx.fillStyle = '#ffffff';
        this.ctx.font = 'bold 14px monospace';
        this.ctx.textAlign = 'center';
        this.ctx.textBaseline = 'middle';
        // Add ellipsis if text is too long for the block
        let text = b.text || '';
        if (this.ctx.measureText(text).width > this.blockWidth - 10) {
          text = text.substring(0, 8) + '..';
        }
        this.ctx.fillText(text, b.x + this.blockWidth / 2, b.y + b.height / 2);
      }
    }

    // Particles
    this.particles.forEach(p => {
      this.ctx.fillStyle = p.color;
      this.ctx.globalAlpha = p.life;
      this.ctx.beginPath();
      this.ctx.arc(p.x, p.y, 3, 0, Math.PI * 2);
      this.ctx.fill();
      this.ctx.globalAlpha = 1.0;
    });

    // Floating Texts (Star Wars Effect)
    this.floatingTexts.forEach(ft => {
      this.ctx.save();
      
      const p = 1.0 - ft.life; // 0 to 1
      const cx = ft.startX; 
      const cy = ft.startY - p * 150; // Move up by 150px over time
      const scale = 1.1 - p * 0.5; // Shrink from 1.1 to 0.6
      const opacity = Math.min(1.0, ft.life / 0.2); // Fade out at end
      
      this.ctx.globalAlpha = opacity;
      
      // Star Wars Trapezoid Card
      this.ctx.fillStyle = 'rgba(5, 1, 10, 0.92)';
      const glowColor = '#39ff14'; // Always green as requested
      this.ctx.shadowColor = glowColor;
      this.ctx.shadowBlur = 12 * scale;
      
      const W = 220;
      const H = 70;
      const topW = W * scale * 0.78;
      const bottomW = W * scale * 1.22;
      const topY = cy - (H / 2) * scale;
      const bottomY = cy + (H / 2) * scale;
      
      this.ctx.beginPath();
      this.ctx.moveTo(cx - topW / 2, topY);
      this.ctx.lineTo(cx + topW / 2, topY);
      this.ctx.lineTo(cx + bottomW / 2, bottomY);
      this.ctx.lineTo(cx - bottomW / 2, bottomY);
      this.ctx.closePath();
      this.ctx.fill();

      // Meaning Text
      this.ctx.fillStyle = glowColor;
      this.ctx.shadowColor = glowColor;
      this.ctx.shadowBlur = 14 * scale;
      const turkishSize = Math.max(10, Math.round(18 * scale));
      this.ctx.font = `900 ${turkishSize}px "Orbitron", sans-serif`;
      this.ctx.textAlign = 'center';
      this.ctx.textBaseline = 'middle';
      this.ctx.fillText(ft.text, cx, cy - 6 * scale);

      // Original Word Text
      this.ctx.fillStyle = '#ffffff';
      this.ctx.shadowBlur = 0;
      const englishSize = Math.max(8, Math.round(10 * scale));
      this.ctx.font = `500 ${englishSize}px "Courier New", monospace`;
      this.ctx.fillText(`MATCHED: ${ft.engText}`, cx, cy + 18 * scale);
      
      this.ctx.restore();
    });
  }

  pauseGame() {
    this.isPaused = true;
  }

  resumeGame() {
    this.isPaused = false;
  }

  stopGame() {
    if (this.animationId) {
      cancelAnimationFrame(this.animationId);
      this.animationId = null;
    }
  }

  startGame() {
    this.score = 0;
    this.lives = 3;
    if (this.callbacks.onScore) this.callbacks.onScore(this.score);
    if (this.callbacks.onUpdateLives) this.callbacks.onUpdateLives(this.lives);
    this.setupLevel();
    this.state = 'playing';
    this.isPaused = false;
    this.lastTime = performance.now();
    if (!this.animationId) {
      this.loop(this.lastTime);
    }
  }

  handleMouseMove(e) {
    if (this.state !== 'playing' || this.isPaused) return;
    const rect = this.canvas.getBoundingClientRect();
    const x = e.clientX - rect.left;
    this.paddle.x = Math.max(this.edgePadding, Math.min(x - this.paddle.width / 2, this.canvas.width - this.edgePadding - this.paddle.width));
  }

  handleTouchMove(e) {
    if (this.state !== 'playing' || this.isPaused) return;
    e.preventDefault();
    const rect = this.canvas.getBoundingClientRect();
    const touch = e.touches[0];
    const x = touch.clientX - rect.left;
    this.paddle.x = Math.max(this.edgePadding, Math.min(x - this.paddle.width / 2, this.canvas.width - this.edgePadding - this.paddle.width));
  }

  loop(timestamp) {
    if (!this.lastTime) this.lastTime = timestamp;
    const dt = timestamp - this.lastTime;
    this.lastTime = timestamp;

    if (!this.isPaused) {
      this.update(dt);
    }
    this.draw();

    this.animationId = requestAnimationFrame((ts) => this.loop(ts));
  }

  destroy() {
    if (this.animationId) {
      cancelAnimationFrame(this.animationId);
    }
    this.canvas.removeEventListener('mousemove', this.handleMouseMove);
    this.canvas.removeEventListener('touchmove', this.handleTouchMove);
  }
}
