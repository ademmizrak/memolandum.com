import { useMemolandumStore } from '../../../store/useMemolandumStore';
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

  playStageRiser() {
    playHyperdriveSound(); // reusing for super jump
  }

  playExplosion() {
    playCoinSound(); // reusing for combo correct hit
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

export class AscentObjectPool {
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

export class AscentParticle {
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
    ctx.shadowBlur = this.type === 'spark' ? 6 : 0;
    ctx.beginPath();
    ctx.arc(this.x, this.y, this.size, 0, Math.PI * 2);
    ctx.fill();
    ctx.restore();
  }
}

export class AscentFloatingText {
  reset(x, y, text, color = '#ffea00') {
    this.x = x;
    this.y = y;
    this.text = text;
    this.color = color;
    this.alpha = 1.0;
    this.life = 45;
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
    ctx.font = 'bold 16px "Orbitron", sans-serif';
    ctx.textAlign = 'center';
    ctx.shadowColor = this.color;
    ctx.shadowBlur = 5;
    ctx.fillText(this.text, this.x, this.y);
    ctx.restore();
  }
}

export class Platform {
  constructor(x, y, width, text, isCorrect, isFiller, isGround = false, floor = 0) {
    this.x = x; // center X
    this.y = y; // center Y
    this.width = width;
    this.text = text;
    
    this.lines = [this.text];
    if (this.text.includes('\\n')) {
      this.lines = this.text.split('\\n');
    } else if (this.text.length > 14 && this.text.includes(' ')) {
      const words = this.text.split(' ');
      const mid = Math.ceil(words.length / 2);
      this.lines = [words.slice(0, mid).join(' '), words.slice(mid).join(' ')];
    }
    
    this.height = this.lines.length > 1 ? 46 : 28;

    this.isCorrect = isCorrect;
    this.isFiller = isFiller;
    this.isGround = isGround;
    this.floor = floor;

    // Theme color
    const isChallengeMode = useMemolandumStore.getState().isChallengeMode;
    if (isGround) {
      this.color = '#777777';
    } else if (isChallengeMode) {
      this.color = '#00f0ff'; // Cyan neutral
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

      let fontSize = this.lines.length > 1 ? 16 : 21;
      ctx.font = `bold ${fontSize}px Arial, sans-serif`;
      
      let maxLineWidth = Math.max(...this.lines.map(line => ctx.measureText(line).width));
      const maxWidth = this.width - 10;
      while (maxLineWidth > maxWidth && fontSize > 10) {
        fontSize--;
        ctx.font = `bold ${fontSize}px Arial, sans-serif`;
        maxLineWidth = Math.max(...this.lines.map(line => ctx.measureText(line).width));
      }

      ctx.textAlign = 'center';
      ctx.textBaseline = 'middle';
      if (this.lines.length > 1) {
        ctx.font = `bold ${fontSize + 2}px Arial, sans-serif`;
        ctx.fillText(this.lines[0], this.x, this.y - 10);
        ctx.font = `bold ${fontSize}px Arial, sans-serif`;
        ctx.fillText(this.lines[1], this.x, this.y + 10);
      } else {
        ctx.fillText(this.lines[0], this.x, this.y + 1);
      }
    }

    ctx.restore();
  }
}
