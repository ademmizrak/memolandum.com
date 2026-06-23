// ----------------------------------------------------
// Reverse Word Drop Protocol V2 (Dikey Tetris) Learning Shell
// ----------------------------------------------------

class WordDropObjectPool {
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

// Particle class for visual explosions
class WordDropParticle {
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

// Floating text class for feedback
class WordDropFloatingText {
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

// Tetris tetromino active piece representation
class TetrisPiece {
  constructor(shapeType) {
    this.shapeType = shapeType;
    this.x = 7; // Middle spawn column (0 to 15 columns)
    this.y = 19; // Spawn row (top of the grid)
    
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

// Main WordDropGame Class
class WordDropGame {
  constructor(vocabulary, jsonFileName) {
    this.isWordDrop = true;
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

    // Grid states: 16 columns of tracks, up to 20 height
    this.grid = Array.from({ length: 12 }, () => Array(20).fill(null));

    // Game stats
    this.state = 'start';
    this.score = 0;
    this.highScore = parseInt(localStorage.getItem('memolandum_high_score')) || 0;
    this.shields = 3;
    this.collectedGems = parseInt(localStorage.getItem('memolandum_collected_gems')) || 0;
    this.wordsLearnedThisRun = [];
    this.gemsCollectedThisLevel = 0;

    this.currentLevel = 1;
    this.chunkIndex = 0;
    this.wordsPerLevel = 12;
    this.activeChunk = [];

    // Falling Active Tetris block
    this.activePiece = null;

    // Line clearing animation context
    this.freezeTimer = 0;
    this.clearingRowIndex = -1;
    this.floatingFx = { active: false };

    this.damageTimer = 0;
    this.isLevelTransitioning = false;
    this.levelCompleteTimer = 0;
    this.riserPlayed = false;
    this.fallTimer = 0;

    // Active arrays
    this.activeParticles = [];
    this.activeFloatingTexts = [];
    this.stars = [];

    // Pools
    this.particlePool = new WordDropObjectPool(
      () => new WordDropParticle(),
      (p, x, y, color) => p.reset(x, y, color)
    );

    this.floatingTextPool = new WordDropObjectPool(
      () => new WordDropFloatingText(),
      (ft, x, y, text) => ft.reset(x, y, text)
    );

    // Setup stars
    for (let i = 0; i < 60; i++) {
      const star = new Star();
      star.reset(this.virtualWidth, this.virtualHeight);
      star.y = Math.random() * this.virtualHeight;
      this.stars.push(star);
    }

    // Robust local fillers fallback to ensure "Dummy Translation OLMAYACAK" and CORS safety
    const localFillers = [
      // 2 letters
      { word: "am", translation: "olmak (1. tekil)" },
      { word: "as", translation: "olarak/gibi" },
      { word: "be", translation: "olmak" },
      { word: "do", translation: "yapmak" },
      { word: "go", translation: "gitmek" },
      { word: "he", translation: "o (erkek)" },
      { word: "if", translation: "eğer" },
      { word: "in", translation: "içinde" },
      { word: "is", translation: "olmak (3. tekil)" },
      { word: "it", translation: "o (cansız/hayvan)" },
      { word: "me", translation: "beni/bana" },
      { word: "my", translation: "benim" },
      { word: "no", translation: "hayır" },
      { word: "of", translation: "-in/-ın" },
      { word: "on", translation: "üzerinde" },
      { word: "or", translation: "veya" },
      { word: "so", translation: "bu yüzden/öyleyse" },
      { word: "to", translation: "e/-a doğru" },
      { word: "up", translation: "yukarı" },
      { word: "we", translation: "biz" },

      // 3 letters
      { word: "act", translation: "hareket etmek/eylem" },
      { word: "add", translation: "eklemek" },
      { word: "age", translation: "yaş/çağ" },
      { word: "aim", translation: "amaçlamak/hedef" },
      { word: "air", translation: "hava" },
      { word: "art", translation: "sanat" },
      { word: "ask", translation: "sormak/istemek" },
      { word: "bad", translation: "kötü" },
      { word: "bar", translation: "çubuk/engel" },
      { word: "beg", translation: "yalvarmak/dilenmek" },
      { word: "big", translation: "büyük" },
      { word: "box", translation: "kutu" },
      { word: "boy", translation: "erkek child" },
      { word: "bus", translation: "otobüs" },
      { word: "buy", translation: "satın almak" },
      { word: "cry", translation: "ağlamak/haykırmak" },
      { word: "cut", translation: "kesmek" },
      { word: "day", translation: "gün" },
      { word: "die", translation: "ölmek" },
      { word: "dig", translation: "kazmak" },
      { word: "dry", translation: "kurutmak/kuru" },
      { word: "due", translation: "vadesi dolmuş/beklenen" },
      { word: "ear", translation: "kulak" },
      { word: "eat", translation: "yemek yemek" },
      { word: "end", translation: "son/bitirmek" },
      { word: "era", translation: "dönem/çağ" },
      { word: "fly", translation: "uçmak/sinek" },
      { word: "gas", translation: "gaz/yakıt" },
      { word: "gem", translation: "mücevher/değerli taş" },
      { word: "get", translation: "almak/edinmek" },

      // 4 letters
      { word: "acid", translation: "asit" },
      { word: "ally", translation: "müttefik" },
      { word: "apex", translation: "zirve/doruk" },
      { word: "axis", translation: "eksen" },
      { word: "bale", translation: "balya/büyük paket" },
      { word: "bias", translation: "ön yargı/taraf tutma" },
      { word: "blur", translation: "bulanıklaştırmak" },
      { word: "bold", translation: "cesur/kalın (yazı)" },
      { word: "bulk", translation: "toptan/büyük gövde" },
      { word: "clay", translation: "kil/balçık" },
      { word: "core", translation: "çekirdek/öz" },
      { word: "curb", translation: "kontrol altına almak/kaldırım" },
      { word: "dawn", translation: "şafak vakti" },
      { word: "deed", translation: "eylem/tapu senedi" },
      { word: "defy", translation: "meydan okumak" },
      { word: "doom", translation: "kötü kader/kıyamet" },
      { word: "echo", translation: "yankı/yankılanmak" },
      { word: "envy", translation: "kıskanmak/gıpta etmek" },
      { word: "fade", translation: "solmak/yavaşça yok olmak" },
      { word: "flaw", translation: "kusur/hata" },
      { word: "fuse", translation: "sigorta/eriterek birleştirmek" },
      { word: "grim", translation: "karamsar/zalim" },
      { word: "heir", translation: "mirasçı/varis" },
      { word: "hint", translation: "ipucu/ima etmek" },
      { word: "icon", translation: "simge/ikon" },
      { word: "iron", translation: "demir/ütülemek" },
      { word: "keen", translation: "keskin/hevesli" },
      { word: "leap", translation: "sıçramak/büyük adım" },
      { word: "lurk", translation: "pusuda beklemek/gizlenmek" },
      { word: "myth", translation: "efsane/mit" },

      // 5 letters
      { word: "abide", translation: "kurallara uymak/katlanmak" },
      { word: "acute", translation: "keskin/şiddetli" },
      { word: "adapt", translation: "uyum sağlamak" },
      { word: "amend", translation: "yasa değiştirmek/düzeltmek" },
      { word: "ample", translation: "bol/geniş/yeterli" },
      { word: "array", translation: "dizi/göz alıcı düzen" },
      { word: "audit", translation: "denetlemek (mali)" },
      { word: "blend", translation: "karıştırmak/harmanlamak" },
      { word: "bribe", translation: "rüşvet vermek" },
      { word: "brisk", translation: "canlı/hareketli/hızlı" },
      { word: "chaos", translation: "kaos/kargaşa" },
      { word: "clash", translation: "çatışmak/fikir ayrılığı" },
      { word: "crude", translation: "ham/işlenmemiş" },
      { word: "decay", translation: "çürümek/bozulmak" },
      { word: "drift", translation: "sürüklenmek/akıntıya kapılmak" },
      { word: "elude", translation: "kurnazca kaçmak/sıyrılmak" },

      // 6 letters
      { word: "active", translation: "aktif" },
      { word: "target", translation: "hedef" },
      { word: "system", translation: "sistem" },
      { word: "energy", translation: "enerji" },
      { word: "update", translation: "güncelleme" },
      { word: "player", translation: "oyuncu" },

      // 7 letters
      { word: "gravity", translation: "yerçekimi" },
      { word: "counter", translation: "sayaç/tezgah" },
      { word: "dynamic", translation: "dinamik" },
      { word: "correct", translation: "doğru/düzeltmek" },
      { word: "initial", translation: "ilk/başlangıç" },
      { word: "element", translation: "öğe/element" },

      // 8 letters
      { word: "platform", translation: "platform" },
      { word: "database", translation: "veritabanı" },
      { word: "standard", translation: "standart" },
      { word: "absolute", translation: "mutlak/kesin" },
      { word: "terminal", translation: "terminal/uç" },

      // 9 letters
      { word: "structure", translation: "yapı/bünye" },
      { word: "algorithm", translation: "algoritma" },
      { word: "interface", translation: "arayüz" },
      { word: "collision", translation: "çarpışma" },
      { word: "execution", translation: "yürütme/infaz" },

      // 10 letters
      { word: "translation", translation: "çeviri/tercüme" },
      { word: "management", translation: "yönetim" },
      { word: "connection", translation: "bağlantı" },
      { word: "transition", translation: "geçiş" },
      { word: "responsive", translation: "duyarlı/esnek" }
    ];

    this.fillers = localFillers.map(w => ({
      english: w.word.toUpperCase(),
      turkish: w.translation.toUpperCase()
    }));

    // Fetch '/data/fillers.json' asynchronously to merge/override if available
    fetch('/data/fillers.json')
      .then(res => res.json())
      .then(data => {
        if (Array.isArray(data)) {
          const fetched = data.map(w => ({
            english: w.word.toUpperCase(),
            turkish: w.translation.toUpperCase()
          }));
          // Merge fetched into preloaded fillers, keeping the preloaded ones as fallbacks
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
        console.error("Failed to load fillers from file, using local preloaded fillers:", err);
      });

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
    this.freezeTimer = 0;
    this.clearingRowIndex = -1;
    this.floatingFx = { active: false };

    localStorage.setItem('memolandum_saved_stage', this.jsonFileName);
    localStorage.setItem('memolandum_saved_level', this.chunkIndex + 1);
    localStorage.setItem('memolandum_saved_score', this.score);
    updateMainMenuResumeUI();

    // Clear grid matrix
    this.grid = Array.from({ length: 12 }, () => Array(20).fill(null));

    this.activeParticles.forEach(p => this.particlePool.release(p));
    this.activeFloatingTexts.forEach(ft => this.floatingTextPool.release(ft));
    this.activeParticles = [];
    this.activeFloatingTexts = [];

    this.loadLevelChunk();
    this.processedCount = 0;
    this.state = 'playing';
    this.spawnBlock();
    this.updateHUD();

    document.getElementById('start-screen').classList.add('hidden');
    document.getElementById('game-over-screen').classList.add('hidden');
    document.getElementById('victory-screen').classList.add('hidden');
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

  spawnBlock() {
    if (this.state !== 'playing' || this.isLevelTransitioning) return;
    
    const SHAPES = ['I', 'O', 'T', 'L', 'J', 'S', 'Z'];
    const randomShape = SHAPES[Math.floor(Math.random() * SHAPES.length)];
    this.activePiece = new TetrisPiece(randomShape);
    
    // Make new piece spawn fast without awkward delay
    const speed = this.isGridCritical() ? 1.6 : 1.0;
    const interval = (0.8 / this.speedMultiplier) / speed;
    this.fallTimer = interval * 0.8; // Give it an 80% head start to fall quickly
    
    // Check if spawn blocked -> Game Over
    if (!this.activePiece.isValid(this.activePiece.blocks, this.grid)) {
      this.gameOver();
    }
  }

  getWordOfLength(L) {
    let candidates = [];
    
    const padWord = (wordStr, targetLen) => {
      let padded = wordStr.toUpperCase();
      const chars = "ABCDEFGHIJKLMNOPQRSTUVWXYZ";
      while (padded.length < targetLen) {
        padded += chars.charAt(Math.floor(Math.random() * chars.length));
      }
      return padded;
    };

    // Priority 1: Use words from the user's selected level vocabulary (.json file) first
    if (this.vocabulary && this.vocabulary.length > 0) {
      candidates = this.vocabulary.filter(w => w.english.length === L);
      if (candidates.length > 0) {
        const selected = candidates[Math.floor(Math.random() * candidates.length)];
        return {
          letters: selected.english.toUpperCase(),
          english: selected.english.toUpperCase(),
          turkish: selected.turkish.toUpperCase(),
          isFiller: false
        };
      }
    }

    // Priority 2: Fall back to fillers.json (level-independent) if not found in level vocabulary
    if (this.fillers && this.fillers.length > 0) {
      candidates = this.fillers.filter(w => w.english.length === L);
      if (candidates.length > 0) {
        const selected = candidates[Math.floor(Math.random() * candidates.length)];
        return {
          letters: selected.english.toUpperCase(),
          english: selected.english.toUpperCase(),
          turkish: selected.turkish.toUpperCase(),
          isFiller: true
        };
      }
    }

    // Priority 3: Try vocabulary with shorter words and pad them
    if (this.vocabulary && this.vocabulary.length > 0) {
      candidates = this.vocabulary.filter(w => w.english.length < L);
      if (candidates.length > 0) {
        const selected = candidates[Math.floor(Math.random() * candidates.length)];
        return {
          letters: padWord(selected.english, L),
          english: selected.english.toUpperCase(),
          turkish: selected.turkish.toUpperCase(),
          isFiller: false
        };
      }
    }

    // Priority 4: Try fillers with shorter words and pad them
    if (this.fillers && this.fillers.length > 0) {
      candidates = this.fillers.filter(w => w.english.length < L);
      if (candidates.length > 0) {
        const selected = candidates[Math.floor(Math.random() * candidates.length)];
        return {
          letters: padWord(selected.english, L),
          english: selected.english.toUpperCase(),
          turkish: selected.turkish.toUpperCase(),
          isFiller: true
        };
      }
    }

    // Absolutely ultimate fallback just in case
    return { letters: padWord("X", L), english: "SYSTEM", turkish: "SİSTEM", isFiller: true };
  }

  spawnExplosion(x, y, color) {
    for (let i = 0; i < 15; i++) {
      const p = this.particlePool.acquire(x, y, color);
      this.activeParticles.push(p);
    }
  }

  decreaseShields() {
    this.shields--;
    this.soundManager.playDamage();
    this.updateHUD();

    if (this.shields <= 0) {
      this.gameOver();
    }
  }

  gameOver() {
    this.state = 'gameover';
    this.soundManager.playGameOver();

    // Central Database Sync: un-erased words on screen process failure stamp
    const unErasedWords = new Set();
    for (let c = 0; c < 12; c++) {
      for (let r = 0; r < 20; r++) {
        if (this.grid[c][r] && this.grid[c][r].wordText) {
          unErasedWords.add(this.grid[c][r].wordText);
        }
      }
    }
    unErasedWords.forEach(wordText => {
      if (window.examEngine) {
        window.examEngine.registerAttempt(wordText, false);
      }
    });

    document.getElementById('hud').classList.add('hidden');
    document.getElementById('gameCanvas').classList.add('hidden');
    document.querySelector('.controls-container').classList.add('hidden');

    const gameOverScreen = document.getElementById('game-over-screen');
    const finalScoreEl = document.getElementById('final-score');
    const learnedListEl = document.getElementById('learned-list');

    if (finalScoreEl) {
      finalScoreEl.textContent = this.score;
    }

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
    this.riserPlayed = false;

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

    if (victoryScoreEl) {
      victoryScoreEl.textContent = this.score;
    }

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
    updateMainMenuResumeUI();
  }

  isGridCritical() {
    for (let c = 0; c < 12; c++) {
      if (this.grid[c][18] !== null) {
        return true;
      }
    }
    return false;
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

    if (levelLabelEl) levelLabelEl.textContent = 'LEVEL';
    if (masteredLabelEl) masteredLabelEl.textContent = 'MASTERED';
    if (scoreLabelEl) scoreLabelEl.textContent = 'SCORE';

    if (shieldsEl) {
      let shieldsStr = '';
      for (let i = 0; i < 3; i++) {
        shieldsStr += (i < this.shields) ? '🛡️ ' : '💀 ';
      }
      shieldsEl.textContent = shieldsStr;
    }

    if (levelValEl) {
      const code = this.getSectorShortCode(this.jsonFileName);
      const totalChunks = Math.max(1, Math.ceil(this.vocabulary.length / this.wordsPerLevel));
      levelValEl.textContent = `${code} (${this.chunkIndex + 1}/${totalChunks})`;
    }

    if (masteredValEl) {
      masteredValEl.textContent = `${this.processedCount}/${this.wordsPerLevel}`;
    }

    if (scoreValEl) {
      scoreValEl.textContent = this.score;
    }

    if (gemsValEl) {
      gemsValEl.textContent = `💎 ${this.collectedGems}`;
    }
  }

  getSectorShortCode(jsonFileName) {
    const codeMap = {
      'a1_words.json': 'A1',
      'a2_words.json': 'A2',
      'b1_words.json': 'B1',
      'b2_words.json': 'B2',
      'phrasal_verbs.json': 'PHR',
      'conjunctions.json': 'CONJ',
      'academic_verbs.json': 'VERB',
      'prepositions.json': 'PREP',
      'abstract_adjectives.json': 'ADJ'
    };
    return codeMap[jsonFileName] || 'VOC';
  }

  togglePause() {
    if (this.state !== 'playing') return;

    this.isPaused = !this.isPaused;

    const pauseScreen = document.getElementById('pause-screen');
    const pauseBtn = document.getElementById('btn-pause');
    const pauseExamBtn = document.getElementById('pause-exam-btn');

    if (this.isPaused) {
      pauseScreen.classList.remove('hidden');
      pauseBtn.textContent = '▶';
      pauseBtn.style.color = 'var(--glow-yellow)';
      pauseBtn.style.borderColor = 'var(--glow-yellow)';
      if (pauseExamBtn) pauseExamBtn.classList.remove('hidden');
    } else {
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

  resize() {
    const rect = this.canvas.parentElement.getBoundingClientRect();
    const dpr = window.devicePixelRatio || 1;
    this.canvas.width = rect.width * dpr;
    this.canvas.height = rect.height * dpr;
    this.ctx.scale(dpr, dpr);
    this.scaleX = rect.width / this.virtualWidth;
    this.scaleY = rect.height / this.virtualHeight;
  }

  bindEvents() {
    window.addEventListener('resize', () => this.resize());

    // Keyboard controls
    window.addEventListener('keydown', (e) => {
      if (this.state !== 'playing' || this.isPaused || this.freezeTimer > 0) return;
      
      // Arrow controls for falling Tetris piece
      if (e.key === 'ArrowLeft') {
        if (this.activePiece) this.activePiece.move(-1, 0, this.grid);
        e.preventDefault();
      }
      if (e.key === 'ArrowRight') {
        if (this.activePiece) this.activePiece.move(1, 0, this.grid);
        e.preventDefault();
      }
      if (e.key === 'ArrowDown') {
        // Soft drop
        if (this.activePiece) this.activePiece.move(0, -1, this.grid);
        e.preventDefault();
      }
      if (e.key === ' ' || e.code === 'Space') {
        // Space rotates active piece
        this.rotateActivePiece();
        e.preventDefault();
      }

      if (e.key === 'Escape' || e.key === 'p' || e.key === 'P') {
        this.togglePause();
        e.preventDefault();
      }
    });

    // Virtual controllers
    const btnLeft = document.getElementById('btn-left');
    const btnRight = document.getElementById('btn-right');
    const btnFire = document.getElementById('btn-fire');

    if (btnLeft && btnRight) {
      btnLeft.onclick = (e) => {
        if (this.state === 'playing' && !this.isPaused && this.freezeTimer <= 0) {
          if (this.activePiece) this.activePiece.move(-1, 0, this.grid);
        }
        e.preventDefault();
      };
      btnRight.onclick = (e) => {
        if (this.state === 'playing' && !this.isPaused && this.freezeTimer <= 0) {
          if (this.activePiece) this.activePiece.move(1, 0, this.grid);
        }
        e.preventDefault();
      };
    }

    if (btnFire) {
      btnFire.onclick = (e) => {
        if (this.state === 'playing' && !this.isPaused && this.freezeTimer <= 0) {
          this.rotateActivePiece();
        }
        e.preventDefault();
      };
    }

    // Pointer controls on canvas
    this.canvas.addEventListener('pointerdown', (e) => {
      if (this.state !== 'playing' || this.isPaused || this.freezeTimer > 0) return;
      this.touchStartX = e.clientX;
      this.touchStartY = e.clientY;
      try {
        this.canvas.setPointerCapture(e.pointerId);
      } catch (err) {}
    });

    this.canvas.addEventListener('pointerup', (e) => {
      if (this.state !== 'playing' || this.isPaused || this.freezeTimer > 0) return;
      try {
        this.canvas.releasePointerCapture(e.pointerId);
      } catch (err) {}

      const diffX = e.clientX - this.touchStartX;
      const diffY = e.clientY - this.touchStartY;
      
      if (Math.abs(diffX) > 40) {
        // Swipe left/right slides the active piece
        if (diffX > 0) {
          if (this.activePiece) this.activePiece.move(1, 0, this.grid);
        } else {
          if (this.activePiece) this.activePiece.move(-1, 0, this.grid);
        }
        this.soundManager.playGemTick();
      } else if (Math.abs(diffY) > 40 && diffY > 0) {
        // Swipe down is Soft Drop
        if (this.activePiece) this.activePiece.move(0, -1, this.grid);
      } else {
        // Tap on canvas controls
        const rect = this.canvas.getBoundingClientRect();
        const canvasX = (e.clientX - rect.left) / this.scaleX;
        const canvasY = (e.clientY - rect.top) / this.scaleY;

        if (canvasY < 400) {
          // Tap top rotates piece
          this.rotateActivePiece();
        } else {
          // Tap bottom moves piece directly to column
          const targetCol = Math.floor(canvasX / 50);
          if (this.activePiece) {
            const dx = targetCol - this.activePiece.x;
            const step = Math.sign(dx);
            const limit = Math.abs(dx);
            for (let i = 0; i < limit; i++) {
              if (!this.activePiece.move(step, 0, this.grid)) break;
            }
          }
        }
      }
    });

    // Pause menu overlay listeners
    const btnPause = document.getElementById('btn-pause');
    if (btnPause) btnPause.onclick = () => this.togglePause();

    const btnResume = document.getElementById('resume-btn');
    if (btnResume) btnResume.onclick = () => this.togglePause();

    const btnPauseExam = document.getElementById('pause-exam-btn');
    if (btnPauseExam) {
      btnPauseExam.onclick = () => {
        cancelAnimationFrame(this.loopId);
        const vocabulary = this.vocabulary;
        const jsonFileName = this.jsonFileName;
        this.cleanup();

        this.isPaused = false;
        document.getElementById('pause-screen').classList.add('hidden');

        window.game = new Game(vocabulary, jsonFileName);
        window.game.state = 'exam';

        if (!window.examEngine) {
          window.examEngine = new ExamEngine();
        }
        window.examEngine.startSession(vocabulary, window.game);
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
            window.examEngine.targetWordRect = null;
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
  }

  rotateActivePiece() {
    if (!this.activePiece) return;
    const px = this.activePiece.x;
    const py = this.activePiece.y;
    
    const newBlocks = this.activePiece.blocks.map(b => {
      const rx = b.x - px;
      const ry = b.y - py;
      return {
        x: px - ry,
        y: py + rx
      };
    });

    if (this.activePiece.isValid(newBlocks, this.grid)) {
      this.activePiece.blocks = newBlocks;
      this.soundManager.playGemTick();
    }
  }

  lockActivePiece() {
    if (!this.activePiece) return;

    this.activePiece.blocks.forEach(b => {
      if (b.y >= 0 && b.y < 20) {
        this.grid[b.x][b.y] = {
          x: b.x * 50,
          y: 820 - (b.y + 1) * 50,
          letter: null,
          wordText: null,
          wordTranslation: null,
          color: 'rgba(100, 100, 100, 0.4)'
        };
      }
    });

    this.activePiece = null;
    
    // Scan horizontal rows for contiguous block transmutations (No Word Splitting)
    this.debrisScan();

    // Check for 100% full rows (12/12 blocks)
    this.checkRowClears();

    if (this.state === 'playing') {
      this.spawnBlock();
    }
  }

  debrisScan() {
    // Scan horizontal rows from bottom up (row 0 to 18)
    for (let r = 0; r < 19; r++) {
      let occupiedCount = 0;
      let emptyCount = 0;

      for (let c = 0; c < 12; c++) {
        if (this.grid[c][r] !== null) {
          occupiedCount++;
        } else {
          emptyCount++;
        }
      }

      // Scan Metric: Wait for at least 70% of the row to be filled (12 * 0.75 = 9 -> at least 9 blocks)
      if (occupiedCount >= 9 && emptyCount > 0) {
        // Find contiguous segments of occupied cells in this row
        const segments = [];
        let currentSeg = null;

        for (let c = 0; c < 12; c++) {
          if (this.grid[c][r] !== null) {
            if (currentSeg === null) {
              currentSeg = { start: c, end: c, hasLetters: (this.grid[c][r].letter !== null) };
            } else {
              currentSeg.end = c;
              if (this.grid[c][r].letter !== null) {
                currentSeg.hasLetters = true;
              }
            }
          } else {
            if (currentSeg !== null) {
              segments.push(currentSeg);
              currentSeg = null;
            }
          }
        }
        if (currentSeg !== null) {
          segments.push(currentSeg);
        }

        // Transmute any segment of length >= 2 that does NOT have letters yet
        let transmutedAny = false;
        segments.forEach(seg => {
          const len = seg.end - seg.start + 1;
          if (len >= 2 && !seg.hasLetters) {
            const word = this.getWordOfLength(len);
            for (let i = 0; i < len; i++) {
              const col = seg.start + i;
              const cellBlock = this.grid[col][r];
                if (cellBlock) {
                  cellBlock.letter = word.letters ? word.letters[i] : word.english[i];
                cellBlock.wordText = word.english;
                cellBlock.wordTranslation = word.turkish;
                cellBlock.isFiller = word.isFiller;
                cellBlock.color = 'var(--glow-cyan)'; // cyan pulse theme
              }
            }
            transmutedAny = true;
          }
        });

        if (transmutedAny) {
          this.soundManager.playStageRiser();
          this.updateHUD();
          break; // Only inject one row per scan tick to prevent conflicts
        }
      }
    }
  }

  checkRowClears() {
    if (this.freezeTimer > 0) return;

    for (let r = 0; r < 19; r++) {
      let isFull = true;
      for (let c = 0; c < 12; c++) {
        if (this.grid[c][r] === null) {
          isFull = false;
          break;
        }
      }

      if (isFull) {
        // Collect words from the row
        let words = [];
        let currentWordText = null;
        for (let c = 0; c < 12; c++) {
          const cell = this.grid[c][r];
          if (cell && cell.letter !== null && cell.wordText) {
            if (cell.wordText !== currentWordText) {
              words.push({
                english: cell.wordText,
                turkish: cell.wordTranslation,
                isFiller: cell.isFiller || false
              });
              currentWordText = cell.wordText;
            }
          } else {
            currentWordText = null;
          }
        }

        // Construct display texts
        // ONLY show vocabulary (non-filler) words in the Star Wars crawl!
        let vocabWords = words.filter(w => !w.isFiller);

        let englishDisplay = "";
        let turkishDisplay = "";

        if (vocabWords.length === 0) {
          vocabWords = words; // If no vocab words exist, fallback to showing filler meanings!
        }

        if (vocabWords.length > 0) {
          const englishParts = vocabWords.map(w => w.english);
          const turkishParts = vocabWords.map(w => w.turkish).filter(Boolean);

          englishDisplay = englishParts.join(' / ');
          turkishDisplay = turkishParts.join(' / ');
        }

        this.triggerRowClear(r, englishDisplay, turkishDisplay, words);
        return; // Clear one row at a time to prevent overlapping freeze animations
      }
    }
  }

  triggerRowClear(r, englishWord, turkishWord, words = []) {
    this.freezeTimer = 0.5;
    this.clearingRowIndex = r;
    this.soundManager.playExplosion();

    // Spawn green explosion particles across the row
    for (let c = 0; c < 12; c++) {
      this.spawnExplosion(c * 50 + 25, 820 - (r + 0.5) * 50, 'var(--glow-green)');
    }

    const vocabWords = words.filter(w => !w.isFiller);

    if (englishWord && englishWord.length > 0) {
      // Star Wars Crawl FX
      this.floatingFx = {
        active: true,
        y: 820 - (r + 0.5) * 50,
        english: englishWord,
        turkish: turkishWord,
        duration: 3.0
      };

      vocabWords.forEach(w => {
        if (window.examEngine) {
          window.examEngine.registerAttempt(w.english, true);
        }
        
        // Find vocabulary object to add to learned list
        const foundWord = this.vocabulary.find(vw => vw.english.toUpperCase() === w.english.toUpperCase());
        if (foundWord) {
          this.wordsLearnedThisRun.push(foundWord);
        }
      });

      this.score += 200 * vocabWords.length;
      this.collectedGems += 10 * vocabWords.length;
      localStorage.setItem('memolandum_collected_gems', this.collectedGems);
      
      this.processedCount += vocabWords.length;
      this.updateHUD();

      if (this.processedCount >= this.wordsPerLevel) {
        this.triggerLevelComplete();
      }
    } else {
      // Plain geometric clear OR row cleared with only filler words
      this.score += 50;
      this.updateHUD();
    }
  }

  clearRow(R) {
    for (let c = 0; c < 12; c++) {
      for (let r = R; r < 19; r++) {
        this.grid[c][r] = this.grid[c][r + 1] || null;
        if (this.grid[c][r] !== null) {
          this.grid[c][r].y = 820 - (r + 1) * 50;
        }
      }
      this.grid[c][19] = null;
    }
  }

  gameLoop(currentTime) {
    if (window.game !== this) return;

    this.loopId = requestAnimationFrame((time) => this.gameLoop(time));

    if (!this.lastTime) this.lastTime = Math.max(0, currentTime - 16.6);
    let dt = (currentTime - this.lastTime) / 1000;
    this.lastTime = currentTime;

    if (dt > 0.1) dt = 0.1;

    if (this.state !== 'playing') {
      this.stars.forEach(star => star.update(dt, this.virtualWidth, this.virtualHeight));
      this.draw();
      return;
    }

    if (this.isPaused) {
      this.draw();
      return;
    }

    this.update(dt);
    this.draw();
  }

  update(dt) {
    this.stars.forEach(star => star.update(dt, this.virtualWidth, this.virtualHeight));

    // Handle Freeze pauses
    if (this.freezeTimer > 0) {
      this.freezeTimer -= dt;
      if (this.freezeTimer <= 0) {
        this.clearRow(this.clearingRowIndex);
        this.clearingRowIndex = -1;
        this.activeWordRowIndex = -1;
        this.activeWord = null;

        this.debrisScan();
        this.checkRowClears();
        this.updateHUD();
      }
      
      // Update particles
      for (let i = this.activeParticles.length - 1; i >= 0; i--) {
        const p = this.activeParticles[i];
        p.update(dt);
        if (!p.active) {
          this.particlePool.release(p);
          this.activeParticles.splice(i, 1);
        }
      }
      return;
    }

    if (this.isLevelTransitioning) {
      this.levelCompleteTimer -= dt;
      
      for (let i = this.activeParticles.length - 1; i >= 0; i--) {
        const p = this.activeParticles[i];
        p.update(dt);
        if (!p.active) {
          this.particlePool.release(p);
          this.activeParticles.splice(i, 1);
        }
      }

      if (this.levelCompleteTimer <= 1.2 && !this.riserPlayed) {
        this.soundManager.playStageRiser();
        this.riserPlayed = true;
      }

      if (this.levelCompleteTimer <= 0) {
        this.isLevelTransitioning = false;

        this.chunkIndex++;
        const hasNext = this.loadLevelChunk();
        if (hasNext) {
          this.grid = Array.from({ length: 12 }, () => Array(20).fill(null));
          this.activeWordRowIndex = -1;
          this.activeWord = null;
          this.processedCount = 0;
          this.spawnBlock();
          this.updateHUD();

          localStorage.setItem('memolandum_saved_level', this.chunkIndex + 1);
          localStorage.setItem('memolandum_saved_score', this.score);
          updateMainMenuResumeUI();
        } else {
          this.triggerFinalVictory();
        }
      }
      return;
    }

    // Critical Zone Ceiling Check (Y=100 / Row 19)
    if (this.isGridCritical()) {
      this.damageTimer += dt;
      if (this.damageTimer >= 1.0) {
        this.damageTimer = 0;
        this.decreaseShields();
      }
    } else {
      this.damageTimer = 0;
    }

    // Descend falling geometric blocks
    if (this.activePiece) {
      this.fallTimer += dt;
      const speed = this.isGridCritical() ? 1.6 : 1.0;
      const interval = (0.8 / this.speedMultiplier) / speed;
      
      if (this.fallTimer >= interval) {
        this.fallTimer = 0;
        const moved = this.activePiece.move(0, -1, this.grid);
        if (!moved) {
          this.lockActivePiece();
        }
      }
    }

    // Update active particles
    for (let i = this.activeParticles.length - 1; i >= 0; i--) {
      const p = this.activeParticles[i];
      p.update(dt);
      if (!p.active) {
        this.particlePool.release(p);
        this.activeParticles.splice(i, 1);
      }
    }

    // Update active floating texts
    for (let i = this.activeFloatingTexts.length - 1; i >= 0; i--) {
      const ft = this.activeFloatingTexts[i];
      ft.update(dt);
      if (!ft.active) {
        this.floatingTextPool.release(ft);
        this.activeFloatingTexts.splice(i, 1);
      }
    }
  }

  draw() {
    this.ctx.fillStyle = '#000000';
    this.ctx.fillRect(0, 0, this.canvas.width, this.canvas.height);

    this.ctx.save();
    this.ctx.scale(this.scaleX, this.scaleY);

    this.stars.forEach(star => star.draw(this.ctx));

    // Draw 16 track guidelines
    this.ctx.save();
    this.ctx.strokeStyle = 'rgba(0, 240, 255, 0.05)';
    this.ctx.lineWidth = 1.0;
    for (let i = 1; i < 12; i++) {
      this.ctx.beginPath();
      this.ctx.moveTo(i * 50, 100);
      this.ctx.lineTo(i * 50, 820);
      this.ctx.stroke();
    }
    this.ctx.restore();

    // Draw Critical Line at Y: 100
    this.ctx.save();
    const isCrit = this.isGridCritical();
    const blinkOn = Math.floor(performance.now() / 250) % 2 === 0;
    this.ctx.strokeStyle = (isCrit && blinkOn) ? '#ff0055' : 'rgba(255, 0, 85, 0.45)';
    this.ctx.lineWidth = isCrit ? 3.5 : 2.0;
    if (isCrit) {
      this.ctx.shadowColor = '#ff0055';
      this.ctx.shadowBlur = 10;
    }
    this.ctx.beginPath();
    this.ctx.moveTo(0, 100);
    this.ctx.lineTo(600, 100);
    this.ctx.stroke();
    this.ctx.restore();

    // Flashing rotating sirens at corners
    if (isCrit) {
      this.drawSiren(this.ctx, 15, 100);
      this.drawSiren(this.ctx, 585, 100);
      
      // Scroll warning alert
      this.ctx.save();
      this.ctx.fillStyle = '#ff0055';
      this.ctx.shadowColor = '#ff0055';
      this.ctx.shadowBlur = 8;
      this.ctx.font = '900 12px "Orbitron", sans-serif';
      const text = "⚠️ WARNING: TOWER COLLAPSE IMMINENT - HIGH ACCELERATION DETECTED ⚠️";
      const scrollOffset = (performance.now() * 0.08) % 600;
      this.ctx.fillText(text, 600 - scrollOffset, 122);
      this.ctx.restore();
    }

    // Draw Static Debris Grid blocks
    this.ctx.save();
    for (let c = 0; c < 12; c++) {
      for (let r = 0; r < 20; r++) {
        const cell = this.grid[c][r];
        if (cell !== null) {
          const rx = c * 50;
          const ry = 820 - (r + 1) * 50;

          this.ctx.save();
          if (cell.letter !== null) {
            // Transmutated cyan letter block
            this.ctx.strokeStyle = '#00f0ff';
            this.ctx.fillStyle = 'rgba(0, 240, 255, 0.18)';
            this.ctx.shadowColor = '#00f0ff';
            this.ctx.shadowBlur = 6;
          } else {
            // Raw geometric grey block
            this.ctx.strokeStyle = 'rgba(150, 150, 150, 0.35)';
            this.ctx.fillStyle = 'rgba(25, 25, 28, 0.8)';
          }

          this.ctx.beginPath();
          this.ctx.roundRect(rx + 1, ry + 1, 48, 48, 4);
          this.ctx.fill();
          this.ctx.stroke();

          // Pattern detail for raw block
          if (cell.letter === null) {
            this.ctx.strokeStyle = 'rgba(150, 150, 150, 0.15)';
            this.ctx.lineWidth = 1;
            this.ctx.beginPath();
            this.ctx.moveTo(rx + 6, ry + 6);
            this.ctx.lineTo(rx + 31, ry + 31);
            this.ctx.stroke();
          } else {
            // Letter overlay
            this.ctx.shadowBlur = 0;
            this.ctx.fillStyle = '#ffffff';
            this.ctx.font = 'bold 15px "Orbitron", Arial, sans-serif';
            this.ctx.textAlign = 'center';
            this.ctx.textBaseline = 'middle';
            this.ctx.fillText(cell.letter, rx + 25, ry + 25);
          }
          this.ctx.restore();
        }
      }
    }
    this.ctx.restore();

    // Draw active falling piece (raw translucent tetromino)
    if (this.activePiece) {
      this.ctx.save();
      this.ctx.strokeStyle = 'rgba(0, 240, 255, 0.7)';
      this.ctx.fillStyle = 'rgba(0, 240, 255, 0.25)';
      this.ctx.lineWidth = 2.0;
      this.ctx.shadowColor = '#00f0ff';
      this.ctx.shadowBlur = 8;
      
      this.activePiece.blocks.forEach(b => {
        if (b.y >= 0 && b.y < 20) {
          const rx = b.x * 50;
          const ry = 820 - (b.y + 1) * 50;
          this.ctx.beginPath();
          this.ctx.roundRect(rx + 1, ry + 1, 48, 48, 4);
          this.ctx.fill();
          this.ctx.stroke();
        }
      });
      this.ctx.restore();
    }

    this.activeParticles.forEach(p => p.draw(this.ctx));
    this.activeFloatingTexts.forEach(ft => ft.draw(this.ctx));

    // Star Wars Crawl FX
    if (this.floatingFx && this.floatingFx.active) {
      this.drawStarWarsCrawl(this.ctx);
    }

    if (this.isLevelTransitioning) {
      this.drawLevelCompleteBanner(this.ctx);
    }

    this.ctx.restore();
  }

  drawSiren(ctx, x, y) {
    ctx.save();
    // Base dome
    ctx.fillStyle = '#1c1c24';
    ctx.strokeStyle = '#ff0055';
    ctx.lineWidth = 2;
    ctx.beginPath();
    ctx.arc(x, y + 10, 12, Math.PI, 0);
    ctx.fill();
    ctx.stroke();

    // Red bulb
    ctx.fillStyle = '#ff0055';
    ctx.beginPath();
    ctx.arc(x, y + 3, 5, 0, Math.PI * 2);
    ctx.fill();

    // Flashing beams
    const angle = (performance.now() * 0.005);
    ctx.globalAlpha = 0.25;
    for (let i = 0; i < 2; i++) {
      const beamAngle = angle + (i * Math.PI);
      ctx.beginPath();
      ctx.moveTo(x, y + 3);
      ctx.arc(x, y + 3, 60, beamAngle - 0.35, beamAngle + 0.35);
      ctx.closePath();
      const grad = ctx.createRadialGradient(x, y + 3, 0, x, y + 3, 60);
      grad.addColorStop(0, 'rgba(255, 0, 85, 0.8)');
      grad.addColorStop(1, 'rgba(255, 0, 85, 0.0)');
      ctx.fillStyle = grad;
      ctx.fill();
    }
    ctx.restore();
  }

  drawStarWarsCrawl(ctx) {
    // Spatial Perspective Simulation Formula for Crawl Render
    ctx.save();
    const floatingFx = this.floatingFx;
    const progress = Math.max(0, floatingFx.duration / 3.0);
    
    // Animate coordinates
    floatingFx.y -= 110 * (this.ctx.canvas.height / 1000) * (1 / 60); // 110px/s upward scaling
    
    const scale = Math.max(0.1, floatingFx.y / 800);
    ctx.translate(this.virtualWidth / 2, floatingFx.y);
    ctx.scale(scale, scale);
    
    ctx.globalAlpha = progress;
    ctx.fillStyle = '#ffea00'; // Star Wars yellow
    ctx.font = 'bold 26px "Orbitron", Arial, sans-serif';
    ctx.textAlign = 'center';
    ctx.shadowColor = '#ffea00';
    ctx.shadowBlur = 12;
    
    ctx.fillText(floatingFx.english, 0, -12);
    
    ctx.fillStyle = '#00f0ff'; // Cyan for translation
    ctx.shadowColor = '#00f0ff';
    ctx.font = 'bold 18px Arial, sans-serif';
    ctx.fillText(floatingFx.turkish, 0, 16);
    
    ctx.restore();
  }

  drawLevelCompleteBanner(ctx) {
    ctx.save();
    ctx.fillStyle = 'rgba(5, 2, 10, 0.55)';
    ctx.fillRect(0, 0, this.virtualWidth, this.virtualHeight);

    const cx = this.virtualWidth / 2;
    const cy = this.virtualHeight / 2 - 30;
    const timeSpent = 3.0 - this.levelCompleteTimer;

    if (timeSpent < 1.5) {
      const p = timeSpent / 1.5;
      let scale = 1.0;
      if (p < 0.3) {
        scale = (p / 0.3) * 1.3;
      } else if (p < 0.6) {
        scale = 1.3 - ((p - 0.3) / 0.3) * 0.4;
      } else {
        scale = 0.9 + ((p - 0.6) / 0.9) * 0.1;
      }
      
      const swayAngle = Math.sin(timeSpent * 8) * 0.03;
      ctx.translate(cx, cy);
      ctx.scale(scale, scale);
      ctx.rotate(swayAngle);

      ctx.shadowColor = '#00f0ff';
      ctx.shadowBlur = 20;
      ctx.fillStyle = '#00f0ff';
      ctx.font = '900 32px "Orbitron", sans-serif';
      ctx.textAlign = 'center';
      ctx.textBaseline = 'middle';
      ctx.fillText(`SECTOR ${this.chunkIndex + 1} CLEARED!`, 0, -20);

      ctx.shadowColor = '#39ff14';
      ctx.shadowBlur = 10;
      ctx.fillStyle = '#39ff14';
      ctx.font = '700 14px "Orbitron", sans-serif';
      ctx.fillText("GRID DECRYPTION OPTIMIZED", 0, 20);
    } else {
      const countdown = Math.max(1, Math.ceil(this.levelCompleteTimer));
      const scale = 1.0 + Math.abs(Math.sin(timeSpent * Math.PI * 2)) * 0.08;

      ctx.translate(cx, cy);
      ctx.scale(scale, scale);

      ctx.shadowColor = '#ffea00';
      ctx.shadowBlur = 15;
      ctx.fillStyle = '#ffea00';
      ctx.font = '900 24px "Orbitron", sans-serif';
      ctx.textAlign = 'center';
      ctx.textBaseline = 'middle';
      ctx.fillText(`INITIALIZING GRID ${this.chunkIndex + 2}`, 0, -20);

      ctx.shadowColor = '#39ff14';
      ctx.shadowBlur = 8;
      ctx.fillStyle = '#39ff14';
      ctx.font = '900 18px "Orbitron", sans-serif';
      ctx.fillText(`LOADING MATRIX ... ${countdown}`, 0, 18);
    }
    ctx.restore();
  }

  cleanup() {
    this.activePiece = null;
    this.grid = Array.from({ length: 12 }, () => Array(20).fill(null));

    this.activeParticles.forEach(p => this.particlePool.release(p));
    this.activeFloatingTexts.forEach(ft => this.floatingTextPool.release(ft));
    this.activeParticles = [];
    this.activeFloatingTexts = [];
    this.stars = [];
    this.soundManager = null;
  }
}

window.WordDropGame = WordDropGame;

