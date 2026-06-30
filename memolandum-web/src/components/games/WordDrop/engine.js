import { playCoinSound, playCrashSound, playHyperdriveSound } from '../../../utils/retroAudio';

export class Star {
  reset(virtualWidth, virtualHeight) {
    this.x = Math.random() * virtualWidth;
    this.y = Math.random() * virtualHeight;
    this.size = Math.random() * 2 + 1;
    this.speed = Math.random() * 1.5 + 0.5;
    this.alpha = Math.random();
  }
  
  update(dt, virtualWidth, virtualHeight) {
    this.y += this.speed * dt * 60; // scale speed by 60fps
    if (this.y > virtualHeight) {
      this.reset(virtualWidth, virtualHeight);
      this.y = 0;
    }
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
  init() {}
  
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
    playHyperdriveSound(); 
  }

  playExplosion() {
    playCoinSound(); 
  }

  playWordAudio(url) {
    if (!url) return;
    try {
      const audio = new Audio(url);
      audio.volume = 1.0;
      audio.play().catch(e => console.warn("Audio play blocked or failed:", e));
    } catch (e) {
      console.error("Audio creation failed:", e);
    }
  }
}

export class WordDropObjectPool {
  constructor(createFn, resetFn) {
    this.createFn = createFn;
    this.resetFn = resetFn;
    this.pool = [];
  }
  acquire(...args) {
    let obj;
    if (this.pool.length > 0) {
      obj = this.pool.pop();
    } else {
      obj = this.createFn();
    }
    this.resetFn(obj, ...args);
    return obj;
  }
  release(obj) {
    this.pool.push(obj);
  }
}

export class WordDropParticle {
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
  }
  reset(x, y, color) {
    this.x = x;
    this.y = y;
    this.color = color;
    this.alpha = 1;
    this.active = true;
    
    const angle = Math.random() * Math.PI * 2;
    const speed = Math.random() * 180 + 60;
    this.vx = Math.cos(angle) * speed;
    this.vy = Math.sin(angle) * speed;
    this.size = Math.random() * 4 + 2;
    this.life = Math.random() * 400 + 300;
    this.maxLife = this.life;
  }
  update(dt) {
    this.x += this.vx * dt;
    this.y += this.vy * dt;
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
    ctx.shadowBlur = 8;
    ctx.fillRect(Math.round(this.x - this.size / 2), Math.round(this.y - this.size / 2), this.size, this.size);
    ctx.restore();
  }
}

export class WordDropFloatingText {
  constructor() {
    this.x = 0;
    this.y = 0;
    this.text = '';
    this.active = false;
    this.opacity = 1.0;
    this.life = 2.0;
  }
  reset(x, y, text) {
    this.x = x;
    this.y = y;
    this.text = text;
    this.active = true;
    this.opacity = 1.0;
    this.life = 2.0;
  }
  update(dt) {
    if (!this.active) return;
    this.y -= 30 * dt;
    this.life -= dt;
    this.opacity = Math.max(0, this.life / 2.0);
    if (this.life <= 0) {
      this.active = false;
    }
  }
  draw(ctx) {
    if (!this.active) return;
    ctx.save();
    ctx.globalAlpha = this.opacity;
    ctx.fillStyle = '#ffea00';
    ctx.font = 'bold 14px "Space Grotesk", sans-serif';
    ctx.shadowColor = '#ffea00';
    ctx.shadowBlur = 8;
    ctx.textAlign = 'center';
    ctx.textBaseline = 'middle';
    ctx.fillText(this.text, Math.round(this.x), Math.round(this.y));
    ctx.restore();
  }
}

export class TetrisPiece {
  constructor(shapeType) {
    this.shapeType = shapeType;
    this.x = 6; // Center column (0 to 11 grid is 12 columns, center is 6)
    this.y = 19; // Top row
    
    // Relative coordinate offsets for standard Tetrominoes
    const shapeTemplates = {
      'O': [[0,0], [1,0], [0,-1], [1,-1]],
      'I': [[-1,0], [0,0], [1,0], [2,0]],
      'T': [[-1,-1], [0,-1], [1,-1], [0,0]],
      'L': [[-1,-1], [0,-1], [1,-1], [-1,0]],
      'J': [[-1,-1], [0,-1], [1,-1], [1,0]],
      'S': [[-1,-1], [0,-1], [0,0], [1,0]],
      'Z': [[-1,0], [0,0], [0,-1], [1,-1]]
    };

    const offsets = shapeTemplates[shapeType] || shapeTemplates['O'];
    
    this.blocks = offsets.map(([ox, oy]) => ({
      x: this.x + ox,
      y: this.y + oy
    }));
  }

  move(dx, dy, grid) {
    const newBlocks = this.blocks.map(b => ({
      x: b.x + dx,
      y: b.y + dy
    }));

    if (this.isValid(newBlocks, grid)) {
      this.blocks = newBlocks;
      this.x += dx;
      this.y += dy;
      return true;
    }
    return false;
  }

  isValid(blocks, grid) {
    for (const b of blocks) {
      if (b.x < 0 || b.x >= 12) return false;
      if (b.y < 0) return false;
      if (grid[b.x] && grid[b.x][b.y] !== null) return false;
    }
    return true;
  }
}
