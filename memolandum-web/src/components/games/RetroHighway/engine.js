import { playCoinSound, playCrashSound, playHyperdriveSound } from '../../../utils/retroAudio';

export class Star {
  reset(virtualWidth, virtualHeight) {
    this.x = Math.random() * virtualWidth;
    this.y = Math.random() * -virtualHeight;
    this.size = Math.random() * 2 + 1;
    this.speed = Math.random() * 3 + 1;
    this.alpha = Math.random();
  }
  
  draw(ctx) {
    ctx.save();
    ctx.globalAlpha = this.alpha;
    ctx.fillStyle = '#ffffff';
    ctx.shadowBlur = 5;
    ctx.shadowColor = '#ffffff';
    ctx.beginPath();
    ctx.arc(this.x, this.y, this.size, 0, Math.PI * 2);
    ctx.fill();
    ctx.restore();
  }
}

export class SoundManager {
  init() {
    this.wordAudio = new Audio();
    this.wordAudio.volume = 1.0;
  }
  
  warmUp() {
    if (this.wordAudio) {
      // Play and immediately pause a silent or empty audio to unlock AudioContext on mobile
      this.wordAudio.play().then(() => {
        this.wordAudio.pause();
        this.wordAudio.currentTime = 0;
      }).catch(e => console.warn("Warmup play blocked:", e));
    }
  }
  
  playGemTick() {
    playCoinSound();
  }
  
  playDamage() {
    playCrashSound();
  }
  
  playStageClear() {
    playHyperdriveSound();
  }

  playWordAudio(url) {
    if (!url) return;
    try {
      if (!this.wordAudio) {
        this.wordAudio = new Audio();
        this.wordAudio.volume = 1.0;
      }
      this.wordAudio.src = url;
      this.wordAudio.load();
      this.wordAudio.currentTime = 0;
      this.wordAudio.play().catch(e => console.warn("Audio play blocked or failed:", e));
    } catch (e) {
      console.error("Audio creation failed:", e);
    }
  }
}

export class HighwayObjectPool {
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

export class HighwayParticle {
  reset(x, y, color, type = 'spark') {
    this.x = x;
    this.y = y;
    this.type = type; // 'spark' or 'smoke'
    
    if (type === 'spark') {
      const angle = Math.random() * Math.PI * 2;
      const speed = 2 + Math.random() * 5;
      this.vx = Math.cos(angle) * speed;
      this.vy = Math.sin(angle) * speed + 2; // slow fall
      this.size = 2 + Math.random() * 3;
      this.color = color || '#00f0ff';
      this.alpha = 1.0;
      this.maxLife = 30 + Math.random() * 20;
    } else {
      // Smoke
      this.vx = (Math.random() - 0.5) * 1.5;
      this.vy = -1 - Math.random() * 2; // rise up
      this.size = 6 + Math.random() * 8;
      this.color = '#333333';
      this.alpha = 0.8;
      this.maxLife = 40 + Math.random() * 30;
    }
    this.life = this.maxLife;
  }

  update(dt = 1) {
    this.x += this.vx * dt;
    this.y += this.vy * dt;
    this.life -= 1 * dt;
    this.alpha = Math.max(0, this.life / this.maxLife);
  }

  draw(ctx) {
    ctx.save();
    ctx.globalAlpha = this.alpha;
    ctx.fillStyle = this.color;
    ctx.shadowColor = this.color;
    ctx.shadowBlur = this.type === 'spark' ? 8 : 0;
    ctx.beginPath();
    if (this.type === 'spark') {
      ctx.arc(this.x, this.y, this.size, 0, Math.PI * 2);
    } else {
      ctx.arc(this.x, this.y, this.size, 0, Math.PI * 2);
    }
    ctx.fill();
    ctx.restore();
  }
}

export class HighwayFloatingText {
  reset(x, y, text, color = '#ffea00') {
    this.x = x;
    this.y = y;
    this.text = text;
    this.color = color;
    this.alpha = 1.0;
    this.life = 60;
  }

  update(dt = 1) {
    this.y -= 1.5 * dt;
    this.life -= 1 * dt;
    this.alpha = Math.max(0, this.life / 60);
  }

  draw(ctx) {
    ctx.save();
    ctx.globalAlpha = this.alpha;
    ctx.fillStyle = this.color;
    ctx.font = 'bold 20px "Orbitron", sans-serif';
    ctx.textAlign = 'center';
    ctx.shadowColor = this.color;
    ctx.shadowBlur = 6;
    ctx.fillText(this.text, this.x, this.y);
    ctx.restore();
  }
}

export class HighwayGem {
  reset(x, y, speed = 8) {
    this.x = x;
    this.y = y;
    this.vy = speed;
    this.size = 12;
    this.collected = false;
    this.color = '#39ff14'; // neon green gems
  }

  update(playerX, playerY, actualSpeed, magnetActive) {
    if (magnetActive) {
      // Pull to player
      const dx = playerX - this.x;
      const dy = playerY - this.y;
      const dist = Math.hypot(dx, dy);
      if (dist > 5) {
        this.x += (dx / dist) * 15;
        this.y += (dy / dist) * 15;
      } else {
        this.y += actualSpeed;
      }
    } else {
      this.y += actualSpeed;
    }
  }

  draw(ctx) {
    ctx.save();
    ctx.fillStyle = this.color;
    ctx.shadowColor = this.color;
    ctx.shadowBlur = 10;
    
    // Draw diamond shape
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

export class TrafficCar {
  constructor(lane, y, wordText, wordTranslation, isCorrect, isFiller) {
    this.lane = lane;
    this.x = lane * 150 + 75;
    this.y = y;
    this.width = 56;
    this.height = 96;
    
    this.wordText = wordText;
    this.wordTranslation = wordTranslation;
    this.isCorrect = isCorrect;
    this.isFiller = isFiller;
    
    // Theme styling colors
    if (isCorrect) {
      this.color = '#39ff14'; // neon green correct target
    } else if (isFiller) {
      this.color = '#ffaa00'; // orange filler vehicles
    } else {
      this.color = '#ff0055'; // magenta wrong distractors
    }
    
    this.flashTimer = 0;
  }

  update(relativeSpeed) {
    this.y += relativeSpeed;
    this.x = this.lane * 150 + 75; // Lock to lane center
    this.flashTimer += 0.05;
  }

  draw(ctx) {
    ctx.save();
    
    // Drawing a futuristic neon vehicle chassis
    ctx.strokeStyle = this.color;
    ctx.lineWidth = 3;
    
    // Vehicle shadow/glow
    ctx.shadowColor = this.color;
    ctx.shadowBlur = 12;
    ctx.fillStyle = 'rgba(15, 15, 20, 0.9)';
    
    // Draw car outline rectangle with rounded edges
    ctx.beginPath();
    ctx.roundRect(this.x - this.width / 2, this.y - this.height / 2, this.width, this.height, 12);
    ctx.fill();
    ctx.stroke();
    
    // Draw spoiler
    ctx.fillStyle = this.color;
    ctx.fillRect(this.x - this.width / 2 + 5, this.y + this.height / 2 - 12, this.width - 10, 8);
    
    // Draw headlights
    ctx.fillStyle = '#ffffff';
    ctx.shadowBlur = 8;
    ctx.shadowColor = '#ffffff';
    ctx.fillRect(this.x - this.width / 2 + 8, this.y - this.height / 2 + 4, 10, 5);
    ctx.fillRect(this.x + this.width / 2 - 18, this.y - this.height / 2 + 4, 10, 5);
    
    // Draw wheels
    ctx.fillStyle = '#333333';
    ctx.shadowBlur = 0;
    ctx.fillRect(this.x - this.width / 2 - 4, this.y - this.height / 3, 4, 20);
    ctx.fillRect(this.x + this.width / 2, this.y - this.height / 3, 4, 20);
    ctx.fillRect(this.x - this.width / 2 - 4, this.y + this.height / 4, 4, 20);
    ctx.fillRect(this.x + this.width / 2, this.y + this.height / 4, 4, 20);
    
    ctx.restore();

    // Floating text label displaying the Turkish meaning above the vehicle
    ctx.save();
    ctx.shadowColor = this.color;
    ctx.shadowBlur = 6;
    
    // Background tag box
    ctx.fillStyle = 'rgba(5, 5, 8, 0.85)';
    ctx.strokeStyle = this.color;
    ctx.lineWidth = 1.5;
    ctx.font = 'bold 16px "Orbitron", Arial, sans-serif';
    
    const textWidth = ctx.measureText(this.wordTranslation).width + 20;
    ctx.beginPath();
    ctx.roundRect(this.x - textWidth / 2, this.y - this.height / 2 - 36, textWidth, 28, 6);
    ctx.fill();
    ctx.stroke();
    
    // Text value
    ctx.fillStyle = '#ffffff';
    ctx.textAlign = 'center';
    ctx.textBaseline = 'middle';
    ctx.fillText(this.wordTranslation, this.x, this.y - this.height / 2 - 22);
    
    ctx.restore();
  }
}
