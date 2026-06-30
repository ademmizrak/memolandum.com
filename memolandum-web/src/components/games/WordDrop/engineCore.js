import { Star, SoundManager, WordDropObjectPool, WordDropParticle, WordDropFloatingText, TetrisPiece } from './engine';

export class WordDropGame {
  constructor(canvas, ctx, vocabulary, callbacks) {
    this.isWordDrop = true;
    this.canvas = canvas;
    this.ctx = ctx;

    this.vocabulary = vocabulary;
    this.callbacks = callbacks || {};

    this.virtualWidth = 600;
    this.virtualHeight = 1000;
    this.scaleX = 1;
    this.scaleY = 1;

    this.soundManager = new SoundManager();
    
    this.speedMultiplier = 1.0;

    // Grid states: 12 columns, up to 20 height
    this.grid = Array.from({ length: 12 }, () => Array(20).fill(null));

    // Game stats
    this.state = 'start';
    this.score = 0;
    this.shields = 3;
    this.wordsLearnedThisRun = [];

    this.currentLevel = 1;
    this.chunkIndex = 0;
    this.wordsPerLevel = 12;
    this.activeChunk = [];
    this.processedCount = 0;

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

    // Robust local fillers fallback
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
      { word: "boy", translation: "erkek çocuk" },
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

    // Start fetching extra fillers asynchronously, but don't block
    fetch('/data/fillers.json')
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
        // Fallback already assigned
      });
  }

  startGame() {
    this.soundManager.init();
    this.score = 0;
    this.shields = 3;
    this.wordsLearnedThisRun = [];
    this.currentLevel = 1;
    this.chunkIndex = 0;

    this.isLevelTransitioning = false;
    this.levelCompleteTimer = 0;
    this.damageTimer = 0;
    this.freezeTimer = 0;
    this.clearingRowIndex = -1;
    this.floatingFx = { active: false };

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

    this.lastTime = 0;
    if (this.loopId) {
      cancelAnimationFrame(this.loopId);
    }
    this.loopId = requestAnimationFrame((time) => this.gameLoop(time));
  }

  stopGame() {
    this.state = 'stopped';
    if (this.loopId) {
      cancelAnimationFrame(this.loopId);
      this.loopId = null;
    }
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
    this.fallTimer = interval * 0.8; 
    
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

    if (this.vocabulary && this.vocabulary.length > 0) {
      candidates = this.vocabulary.filter(w => w.english && w.english.length === L);
      if (candidates.length > 0) {
        const selected = candidates[Math.floor(Math.random() * candidates.length)];
        return {
          letters: selected.english.toUpperCase(),
          english: selected.english.toUpperCase(),
          turkish: selected.turkish ? selected.turkish.toUpperCase() : '',
          isFiller: false
        };
      }
    }

    if (this.fillers && this.fillers.length > 0) {
      candidates = this.fillers.filter(w => w.english && w.english.length === L);
      if (candidates.length > 0) {
        const selected = candidates[Math.floor(Math.random() * candidates.length)];
        return {
          letters: selected.english.toUpperCase(),
          english: selected.english.toUpperCase(),
          turkish: selected.turkish ? selected.turkish.toUpperCase() : '',
          isFiller: true
        };
      }
    }

    if (this.vocabulary && this.vocabulary.length > 0) {
      candidates = this.vocabulary.filter(w => w.english && w.english.length < L);
      if (candidates.length > 0) {
        const selected = candidates[Math.floor(Math.random() * candidates.length)];
        return {
          letters: padWord(selected.english, L),
          english: selected.english.toUpperCase(),
          turkish: selected.turkish ? selected.turkish.toUpperCase() : '',
          isFiller: false
        };
      }
    }

    if (this.fillers && this.fillers.length > 0) {
      candidates = this.fillers.filter(w => w.english && w.english.length < L);
      if (candidates.length > 0) {
        const selected = candidates[Math.floor(Math.random() * candidates.length)];
        return {
          letters: padWord(selected.english, L),
          english: selected.english.toUpperCase(),
          turkish: selected.turkish ? selected.turkish.toUpperCase() : '',
          isFiller: true
        };
      }
    }

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
    this.soundManager.playDamage();
    
    // Notify React component
    if (this.callbacks.onGameOver) {
      this.callbacks.onGameOver(this.score, this.wordsLearnedThisRun);
    }
  }

  triggerLevelComplete() {
    this.isLevelTransitioning = true;
    this.levelCompleteTimer = 3.0;
    this.riserPlayed = false;

    this.soundManager.playStageClear();
    this.updateHUD();
  }

  triggerFinalVictory() {
    this.state = 'victory';
    this.soundManager.playStageClear();
    
    // Notify React component
    if (this.callbacks.onVictory) {
      this.callbacks.onVictory(this.score, this.wordsLearnedThisRun);
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

  isGridCritical() {
    for (let c = 0; c < 12; c++) {
      if (this.grid[c][18] !== null) {
        return true;
      }
    }
    return false;
  }

  updateHUD() {
    if (this.callbacks.onStateUpdate) {
      const totalChunks = Math.max(1, Math.ceil(this.vocabulary.length / this.wordsPerLevel));
      this.callbacks.onStateUpdate({
        score: this.score,
        shields: this.shields,
        levelText: `${this.chunkIndex + 1}/${totalChunks}`,
        masteredCount: this.processedCount,
        masteredTotal: this.wordsPerLevel,
      });
    }
  }

  handleInput(action) {
    if (this.state !== 'playing' || this.isLevelTransitioning || this.freezeTimer > 0) return;

    if (action === 'left') {
      if (this.activePiece) this.activePiece.move(-1, 0, this.grid);
    } else if (action === 'right') {
      if (this.activePiece) this.activePiece.move(1, 0, this.grid);
    } else if (action === 'down') {
      if (this.activePiece) this.activePiece.move(0, -1, this.grid);
    } else if (action === 'rotate' || action === 'fire') {
      this.rotateActivePiece();
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
    
    this.debrisScan();
    this.checkRowClears();

    if (this.state === 'playing') {
      this.spawnBlock();
    }
  }

  debrisScan() {
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

      // Wait for at least 70% (9 blocks)
      if (occupiedCount >= 9 && emptyCount > 0) {
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
                cellBlock.color = '#00f0ff'; 
              }
            }
            transmutedAny = true;
          }
        });

        if (transmutedAny) {
          this.soundManager.playStageRiser();
          this.updateHUD();
          break; // only one row per scan tick
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

        let vocabWords = words.filter(w => !w.isFiller);
        let englishDisplay = "";
        let turkishDisplay = "";

        if (vocabWords.length === 0) {
          vocabWords = words; 
        }

        if (vocabWords.length > 0) {
          const englishParts = vocabWords.map(w => w.english);
          const turkishParts = vocabWords.map(w => w.turkish).filter(Boolean);
          englishDisplay = englishParts.join(' / ');
          turkishDisplay = turkishParts.join(' / ');
        }

        this.triggerRowClear(r, englishDisplay, turkishDisplay, words);
        return; 
      }
    }
  }

  triggerRowClear(r, englishWord, turkishWord, words = []) {
    this.freezeTimer = 0.5;
    this.clearingRowIndex = r;
    this.soundManager.playExplosion();

    for (let c = 0; c < 12; c++) {
      this.spawnExplosion(c * 50 + 25, 820 - (r + 0.5) * 50, '#39ff14'); // green
    }

    const vocabWords = words.filter(w => !w.isFiller);

    if (englishWord && englishWord.length > 0) {
      this.floatingFx = {
        active: true,
        y: 820 - (r + 0.5) * 50,
        english: englishWord,
        turkish: turkishWord,
        duration: 3.0
      };

      vocabWords.forEach(w => {
        const foundWord = this.vocabulary.find(vw => vw.english.toUpperCase() === w.english.toUpperCase());
        if (foundWord) {
          this.wordsLearnedThisRun.push(foundWord);
        }
      });

      this.score += 200 * vocabWords.length;
      this.processedCount += vocabWords.length;
      this.updateHUD();

      if (this.processedCount >= this.wordsPerLevel) {
        this.triggerLevelComplete();
      }
    } else {
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
    if (this.state === 'stopped') return;
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

    this.update(dt);
    this.draw();
  }

  update(dt) {
    this.stars.forEach(star => star.update(dt, this.virtualWidth, this.virtualHeight));

    if (this.freezeTimer > 0) {
      this.freezeTimer -= dt;
      if (this.freezeTimer <= 0) {
        this.clearRow(this.clearingRowIndex);
        this.clearingRowIndex = -1;
        this.debrisScan();
        this.checkRowClears();
        this.updateHUD();
      }
      
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
          this.processedCount = 0;
          this.spawnBlock();
          this.updateHUD();
        } else {
          this.triggerFinalVictory();
        }
      }
      return;
    }

    // Critical Zone Ceiling Check (Y=100)
    if (this.isGridCritical()) {
      this.damageTimer += dt;
      if (this.damageTimer >= 1.0) {
        this.damageTimer = 0;
        this.decreaseShields();
      }
    } else {
      this.damageTimer = 0;
    }

    // Descend falling blocks
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

    for (let i = this.activeParticles.length - 1; i >= 0; i--) {
      const p = this.activeParticles[i];
      p.update(dt);
      if (!p.active) {
        this.particlePool.release(p);
        this.activeParticles.splice(i, 1);
      }
    }

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
    this.ctx.save();
    this.ctx.scale(this.scaleX, this.scaleY);

    this.ctx.fillStyle = '#06030c';
    this.ctx.fillRect(0, 0, this.virtualWidth, this.virtualHeight);

    this.stars.forEach(star => star.draw(this.ctx));

    // Draw 12 track guidelines
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

    // Grid blocks
    this.ctx.save();
    for (let c = 0; c < 12; c++) {
      for (let r = 0; r < 20; r++) {
        const cell = this.grid[c][r];
        if (cell !== null) {
          const rx = c * 50;
          const ry = 820 - (r + 1) * 50;

          this.ctx.save();
          if (cell.letter !== null) {
            this.ctx.strokeStyle = '#00f0ff';
            this.ctx.fillStyle = 'rgba(0, 240, 255, 0.18)';
            this.ctx.shadowColor = '#00f0ff';
            this.ctx.shadowBlur = 6;
          } else {
            this.ctx.strokeStyle = 'rgba(150, 150, 150, 0.35)';
            this.ctx.fillStyle = 'rgba(25, 25, 28, 0.8)';
          }

          this.ctx.beginPath();
          this.ctx.roundRect(rx + 1, ry + 1, 48, 48, 4);
          this.ctx.fill();
          this.ctx.stroke();

          if (cell.letter === null) {
            this.ctx.strokeStyle = 'rgba(150, 150, 150, 0.15)';
            this.ctx.lineWidth = 1;
            this.ctx.beginPath();
            this.ctx.moveTo(rx + 6, ry + 6);
            this.ctx.lineTo(rx + 31, ry + 31);
            this.ctx.stroke();
          } else {
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

    // Active falling piece
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
    const time = Date.now() * 0.005;
    ctx.translate(x, y);
    ctx.rotate(time);
    
    ctx.fillStyle = '#ff0055';
    ctx.shadowColor = '#ff0055';
    ctx.shadowBlur = 15;
    
    ctx.beginPath();
    ctx.arc(0, 0, 8, 0, Math.PI * 2);
    ctx.fill();
    
    const grad = ctx.createLinearGradient(0, 0, 40, 0);
    grad.addColorStop(0, 'rgba(255, 0, 85, 0.6)');
    grad.addColorStop(1, 'rgba(255, 0, 85, 0)');
    
    ctx.fillStyle = grad;
    ctx.beginPath();
    ctx.moveTo(0, -4);
    ctx.lineTo(40, -15);
    ctx.lineTo(40, 15);
    ctx.lineTo(0, 4);
    ctx.fill();
    
    ctx.rotate(Math.PI);
    ctx.beginPath();
    ctx.moveTo(0, -4);
    ctx.lineTo(40, -15);
    ctx.lineTo(40, 15);
    ctx.lineTo(0, 4);
    ctx.fill();
    
    ctx.restore();
  }

  drawStarWarsCrawl(ctx) {
    ctx.save();
    const floatingFx = this.floatingFx;
    const progress = Math.max(0, floatingFx.duration / 3.0);
    floatingFx.y -= 27.5 * (1 / 60);

    ctx.fillStyle = 'rgba(5, 2, 10, 0.7)';
    ctx.fillRect(0, 0, this.virtualWidth, this.virtualHeight);

    ctx.textAlign = 'center';
    
    const textY = floatingFx.y;
    const fade = Math.min(1.0, progress * 2.0);
    ctx.globalAlpha = fade;

    ctx.font = '900 36px "Orbitron", sans-serif';
    ctx.fillStyle = '#00f0ff';
    ctx.shadowColor = '#00f0ff';
    ctx.shadowBlur = 10;
    ctx.fillText(floatingFx.english, this.virtualWidth / 2, textY);

    ctx.font = 'bold 24px "Space Grotesk", sans-serif';
    ctx.fillStyle = '#39ff14';
    ctx.shadowColor = '#39ff14';
    ctx.shadowBlur = 8;
    ctx.fillText(floatingFx.turkish, this.virtualWidth / 2, textY + 40);

    floatingFx.duration -= 1/60;
    if (floatingFx.duration <= 0) {
      floatingFx.active = false;
    }
    ctx.restore();
  }

  drawLevelCompleteBanner(ctx) {
    ctx.save();
    ctx.fillStyle = 'rgba(0, 0, 0, 0.7)';
    ctx.fillRect(0, 0, this.virtualWidth, this.virtualHeight);

    ctx.textAlign = 'center';
    ctx.textBaseline = 'middle';
    
    ctx.shadowColor = '#39ff14';
    ctx.shadowBlur = 15;
    ctx.fillStyle = '#39ff14';
    ctx.font = '900 48px "Orbitron", sans-serif';
    ctx.fillText('SECTOR CLEARED', this.virtualWidth / 2, this.virtualHeight / 2 - 20);
    
    ctx.shadowColor = '#00f0ff';
    ctx.shadowBlur = 10;
    ctx.fillStyle = '#00f0ff';
    ctx.font = 'bold 24px "Space Grotesk", sans-serif';
    ctx.fillText('ASCENDING TO NEXT LAYER', this.virtualWidth / 2, this.virtualHeight / 2 + 30);
    ctx.restore();
  }
}
