// Highway Survivor (Shell #4) - Retro Cyber-Adrenaline Driving Game
// Decoupled architecture with Lerp shifting, tailgating risk-reward drafting,
// AABB collision matrix, and Star Wars holographic perspective crawl.

class HighwayObjectPool {
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

class HighwayParticle {
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
    ctx.shadowBlur = this.type === 'spark' ? 8 : 0;
    ctx.beginPath();
    if (this.type === 'spark') {
      ctx.arc(this.x, this.y, this.size, 0, Math.PI * 2);
    } else {
      // Cloud puff
      ctx.arc(this.x, this.y, this.size, 0, Math.PI * 2);
    }
    ctx.fill();
    ctx.restore();
  }
}

class HighwayFloatingText {
  reset(x, y, text, color = '#ffea00') {
    this.x = x;
    this.y = y;
    this.text = text;
    this.color = color;
    this.alpha = 1.0;
    this.life = 60;
  }

  update() {
    this.y -= 1.5;
    this.life--;
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

class HighwayGem {
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

class TrafficCar {
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
    ctx.font = 'bold 14px "Orbitron", Arial, sans-serif';
    
    const textWidth = ctx.measureText(this.wordTranslation).width + 16;
    ctx.beginPath();
    ctx.roundRect(this.x - textWidth / 2, this.y - this.height / 2 - 32, textWidth, 24, 6);
    ctx.fill();
    ctx.stroke();
    
    // Text value
    ctx.fillStyle = '#ffffff';
    ctx.textAlign = 'center';
    ctx.textBaseline = 'middle';
    ctx.fillText(this.wordTranslation, this.x, this.y - this.height / 2 - 20);
    
    ctx.restore();
  }
}

class HighwayGame {
  constructor(vocabulary, jsonFileName) {
    this.isHighwayGame = true;
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

    // Road metrics
    this.roadOffset = 0;
    this.baseRoadSpeed = 1.0;
    this.roadSpeed = this.baseRoadSpeed;

    // Player metrics
    this.player = {
      lane: 1, // Start Sol-Orta (lane index 1)
      x: 225,
      y: 830,
      width: 56,
      height: 96,
      targetX: 225
    };

    // Stats
    this.state = 'start';
    this.score = 0;
    this.highScore = parseInt(localStorage.getItem('memolandum_high_score')) || 0;
    this.shields = 3;
    this.collectedGems = parseInt(localStorage.getItem('memolandum_collected_gems')) || 0;
    this.wordsLearnedThisRun = [];
    this.gemsCollectedThisLevel = 0;

    this.currentLevel = 1;
    this.chunkIndex = 0;
    this.wordsPerLevel = 10;
    this.activeChunk = [];

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

    // preloaded fillers to prevent deadlock / CORS errors
    const localFillers = [
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
      { word: "elude", translation: "kurnazca kaçmak/sıyrılmak" }
    ];

    this.fillers = localFillers.map(w => ({
      english: w.word.toUpperCase(),
      turkish: w.translation.toUpperCase()
    }));

    // Load fillers asynchronously to update list
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
    this.nitroActive = false;
    this.brakeActive = false;
    this.turboActive = false;
    this.turboTimer = 0;
    
    this.draftingCar = null;
    this.draftingTimer = 0; // 0 to 120 frames
    
    // Star Wars Crawl FX
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

    this.trafficCars = [];
    this.activeGems = [];
    
    this.activeParticles.forEach(p => this.particlePool.release(p));
    this.activeFloatingTexts.forEach(ft => this.floatingTextPool.release(ft));
    this.activeParticles = [];
    this.activeFloatingTexts = [];

    this.loadLevelChunk();
    this.selectNextWord();

    this.state = 'playing';

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

  selectNextWord() {
    // Check if level completed
    const unprocessed = this.activeChunk.filter(w => !w.processed);
    if (unprocessed.length === 0 || this.processedCount >= this.wordsPerLevel) {
      this.triggerLevelComplete();
      return;
    }

    // Select next vocabulary word
    this.activeWord = unprocessed[Math.floor(Math.random() * unprocessed.length)];
    this.draftingCar = null;
    this.draftingTimer = 0;

    // Clear previous traffic and spawn a fresh wave
    this.trafficCars = [];
    this.spawnTrafficWave();
  }

  spawnTrafficWave() {
    const targetLane = Math.floor(Math.random() * 4);
    
    // Generate distractors
    const otherVocab = this.vocabulary.filter(w => w.english !== this.activeWord.english);
    const distractorWords = [];
    while (distractorWords.length < 3 && otherVocab.length > 0) {
      const w = otherVocab[Math.floor(Math.random() * otherVocab.length)];
      if (!distractorWords.includes(w)) {
        distractorWords.push(w);
      }
    }

    // Spawn cars in lanes
    for (let lane = 0; lane < 4; lane++) {
      const carY = -120 - Math.random() * 100; // staggered spawn Y
      
      if (lane === targetLane) {
        // Spawn correct target translation car
        this.trafficCars.push(new TrafficCar(
          lane, 
          carY, 
          this.activeWord.english, 
          this.activeWord.turkish, 
          true, 
          false
        ));
      } else {
        // Spawn distractor car, filler car, or empty lane
        const rand = Math.random();
        if (rand < 0.45 && distractorWords.length > 0) {
          const dWord = distractorWords.pop();
          this.trafficCars.push(new TrafficCar(lane, carY, dWord.english, dWord.turkish, false, false));
        } else if (rand < 0.85 && this.fillers.length > 0) {
          const fWord = this.fillers[Math.floor(Math.random() * this.fillers.length)];
          this.trafficCars.push(new TrafficCar(lane, carY, fWord.english, fWord.turkish, false, true));
        }
        // remaining lanes stay empty to let player navigate
      }
    }
  }

  bindEvents() {
    window.addEventListener('resize', this.resizeHandler);
    // Keyboard bindings
    if (!window.highwayKeydownBound) {
      window.highwayKeydownBound = true;
      window.addEventListener('keydown', (e) => {
        if (window.game && window.game.isHighwayGame && window.game.state === 'playing') {
          window.game.handleKeyDown(e);
        }
      });
      window.addEventListener('keyup', (e) => {
        if (window.game && window.game.isHighwayGame && window.game.state === 'playing') {
          window.game.handleKeyUp(e);
        }
      });
    }

    // Pointer controls on canvas (unified touch and mouse)
    this.canvas.addEventListener('pointerdown', (e) => {
      if (this.state !== 'playing' || this.isPaused) return;
      if (e.cancelable) e.preventDefault();
      const touchX = e.clientX;
      const rect = this.canvas.getBoundingClientRect();
      const canvasX = (touchX - rect.left) / this.scaleX;
      
      // Horizontal lane division based touch inputs
      const targetLane = Math.floor(canvasX / 150);
      if (targetLane >= 0 && targetLane <= 3) {
        this.player.lane = targetLane;
        this.soundManager.playGemTick();
      }
    });

    // Mobile Virtual buttons
    const btnLeft = document.getElementById('btn-left');
    const btnRight = document.getElementById('btn-right');
    const btnFire = document.getElementById('btn-fire'); // Used for Nitro on mobile

    const bindButton = (btn, onDown, onUp) => {
      if (!btn) return;
      
      btn.onclick = null;
      btn.ontouchstart = null;
      btn.ontouchend = null;
      btn.onmousedown = null;
      btn.onmouseup = null;

      const downHandler = (e) => {
        if (e.cancelable) e.preventDefault();
        onDown();
      };
      const upHandler = (e) => {
        if (e.cancelable) e.preventDefault();
        if (onUp) onUp();
      };
      
      btn.addEventListener('touchstart', downHandler, { passive: false });
      btn.addEventListener('touchend', upHandler, { passive: false });
      btn.addEventListener('touchcancel', upHandler, { passive: false });
      btn.addEventListener('mousedown', downHandler);
      btn.addEventListener('mouseup', upHandler);
      btn.addEventListener('mouseleave', upHandler);
    };

    bindButton(btnLeft, () => {
      if (this.state === 'playing' && this.player.lane > 0) {
        this.player.lane--;
        this.soundManager.playGemTick();
      }
    });

    bindButton(btnRight, () => {
      if (this.state === 'playing' && this.player.lane < 3) {
        this.player.lane++;
        this.soundManager.playGemTick();
      }
    });

    bindButton(btnFire, 
      () => { this.nitroActive = true; },
      () => { this.nitroActive = false; }
    );

    // Pause UI hooks
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
  }

  handleKeyDown(e) {
    if (e.key === 'ArrowLeft') {
      if (this.player.lane > 0) {
        this.player.lane--;
        this.soundManager.playGemTick();
      }
      e.preventDefault();
    } else if (e.key === 'ArrowRight') {
      if (this.player.lane < 3) {
        this.player.lane++;
        this.soundManager.playGemTick();
      }
      e.preventDefault();
    } else if (e.key === 'ArrowUp') {
      this.nitroActive = true;
      e.preventDefault();
    } else if (e.key === 'ArrowDown' || e.key === ' ') {
      this.brakeActive = true;
      e.preventDefault();
    } else if (e.key === 'Escape' || e.key === 'p' || e.key === 'P') {
      this.togglePause();
      e.preventDefault();
    }
  }

  handleKeyUp(e) {
    if (e.key === 'ArrowUp') {
      this.nitroActive = false;
    } else if (e.key === 'ArrowDown' || e.key === ' ') {
      this.brakeActive = false;
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

    const restartBtn = document.getElementById('restart-btn');
    if (restartBtn) {
      restartBtn.onclick = () => {
        gameOverScreen.classList.add('hidden');
        this.startGame();
      };
    }
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

    const victoryRestartBtn = document.getElementById('victory-restart-btn');
    if (victoryRestartBtn) {
      victoryRestartBtn.onclick = () => {
        victoryScreen.classList.add('hidden');
        this.startGame();
      };
    }
  }

  nextLevel() {
    this.chunkIndex++;
    const nextExists = this.loadLevelChunk();
    if (nextExists) {
      this.processedCount = 0;
      this.isLevelTransitioning = false;
      this.selectNextWord();
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
    this.damageTimer = 30; // 30 frames red hit flash
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

    // Restore standard labels (e.g. from Shooter Exam Core)
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
    this.trafficCars = [];
    this.activeParticles = [];
    this.activeFloatingTexts = [];
    this.activeGems = [];
    this.stars = [];
    this.soundManager = null;
  }

  gameLoop(currentTime) {
    if (window.game !== this) return;
    this.loopId = requestAnimationFrame((time) => this.gameLoop(time));

    this.ctx.save();
    this.ctx.scale(this.scaleX, this.scaleY);

    if (this.state === 'playing') {
      this.updateGame();
    }
    this.drawGame();
    this.ctx.restore();
  }

  updateGame() {
    const dt = 1;

    // Handle screen shake timer
    if (this.screenShakeTimer > 0) {
      this.screenShakeTimer--;
    }

    // Handle damage hit red flash
    if (this.damageTimer > 0) {
      this.damageTimer--;
    }

    // Handle level complete counting countdown
    if (this.isLevelTransitioning) {
      this.levelCompleteTimer -= (1 / 60);
      if (this.levelCompleteTimer <= 0) {
        this.nextLevel();
      }
    }

    // Determine road speed based on inputs & states (starts slow, speeds up smoothly by choice - extra slow for maximum reading comfort)
    let targetRoadSpeed = 4.0;
    if (this.turboActive) {
      targetRoadSpeed = 40.0;
    } else if (this.nitroActive) {
      targetRoadSpeed = 25.0;
    } else if (this.brakeActive) {
      targetRoadSpeed = 1.5;
    }

    // Apply difficulty speed multiplier
    targetRoadSpeed *= this.speedMultiplier;

    // Lerp road speed for smoothness (0.05 creates a smooth automatic gear transition feel)
    this.roadSpeed += (targetRoadSpeed - this.roadSpeed) * 0.05;
    this.roadOffset += this.roadSpeed;

    // Stars background scrolling speed matching road
    this.stars.forEach(star => {
      star.y += this.roadSpeed * 0.5;
      if (star.y > this.virtualHeight) {
        star.reset(this.virtualWidth, this.virtualHeight);
        star.y = 0;
      }
    });

    // Update Player Car Lerp lane shifting
    this.player.targetX = this.player.lane * 150 + 75;
    this.player.x += (this.player.targetX - this.player.x) * 0.2;

    // Update Traffic Cars
    const relativeSpeed = this.roadSpeed * 1.0; // simulate traffic moving slightly slower
    let correctCarFound = null;

    for (let i = this.trafficCars.length - 1; i >= 0; i--) {
      const car = this.trafficCars[i];
      car.update(relativeSpeed);
      
      if (car.isCorrect) {
        correctCarFound = car;
      }

      // Remove off-screen cars
      if (car.y > this.virtualHeight + 150) {
        this.trafficCars.splice(i, 1);
        continue;
      }

      // Rubbing / side lane-changing collisions
      const dx = Math.abs(this.player.x - car.x);
      const dy = Math.abs(this.player.y - car.y);
      const overlapX = (this.player.width / 2 + car.width / 2) - 8;
      const overlapY = (this.player.height / 2 + car.height / 2) - 8;

      if (dx < overlapX && dy < overlapY) {
        // Direct Collision!
        if (car.isCorrect) {
          // Doğru araca çarpmak her zaman doğru kabul edilecek (Turbo patlaması)
          this.triggerTurboBlast(car);
        } else {
          // Yanlış araca çarpmak hasar verir!
          this.triggerCrash(car);
        }
      }
    }

    // Spawn another wave if the correct car was missed/passed off-screen
    if (this.trafficCars.length > 0 && !correctCarFound && !this.turboActive) {
      this.trafficCars = [];
      this.spawnTrafficWave();
    }

    // Drafting (Tampon Takibi) Logic
    if (correctCarFound && !this.turboActive) {
      const dy = this.player.y - correctCarFound.y;
      
      // Check if tailgating in the same lane within bumper-to-bumper range (96px to 220px centers)
      const sameLane = (this.player.lane === correctCarFound.lane);
      const inRange = (dy > 96 && dy < 220);

      if (sameLane && inRange) {
        this.draftingCar = correctCarFound;
        
        // Accumulate charge (faster if Up Arrow Nitro is active)
        const chargeRate = this.nitroActive ? 1.5 : 1.0;
        this.draftingTimer += chargeRate * this.speedMultiplier;

        // Emit blue neon spark drafting particles from the bumper gap
        if (Math.random() < 0.4) {
          const px = this.player.x + (Math.random() - 0.5) * 40;
          const py = this.player.y - 60;
          this.activeParticles.push(this.particlePool.acquire(px, py, '#00f0ff', 'spark'));
        }

        // Automatic Turbo trigger once charge bar reaches 120 frames (2 seconds)
        if (this.draftingTimer >= 120) {
          this.triggerTurboBlast(correctCarFound);
        }
      } else {
        // Decay charge gradually when out of zone
        this.draftingTimer = Math.max(0, this.draftingTimer - 2);
      }
    } else {
      this.draftingTimer = Math.max(0, this.draftingTimer - 2);
    }

    // Handle Turbo Nitro timer & speed boost fading
    if (this.turboActive) {
      this.turboTimer--;
      
      // Spawn engine fire boost particles
      if (Math.random() < 0.6) {
        const px = this.player.x + (Math.random() - 0.5) * 20;
        const py = this.player.y + 60;
        this.activeParticles.push(this.particlePool.acquire(px, py, 'rgba(0, 240, 255, 0.8)', 'spark'));
      }

      if (this.turboTimer <= 0) {
        this.turboActive = false;
        
        // Commit word progression at the end of the turbo boost
        this.activeWord.processed = true;
        this.processedCount++;
        this.updateHUD();
        
        this.selectNextWord();
      }
    }

    // Update Gems
    for (let i = this.activeGems.length - 1; i >= 0; i--) {
      const gem = this.activeGems[i];
      gem.update(this.player.x, this.player.y, this.roadSpeed, this.turboActive);
      
      // Magnet collection threshold check
      const dist = Math.hypot(this.player.x - gem.x, this.player.y - gem.y);
      if (dist < 40) {
        this.score += 20;
        this.collectedGems += 1;
        this.gemsCollectedThisLevel++;
        localStorage.setItem('memolandum_collected_gems', this.collectedGems);
        
        this.soundManager.playGemTick();
        
        const ft = this.floatingTextPool.acquire(gem.x, gem.y, "+20", '#39ff14');
        this.activeFloatingTexts.push(ft);
        
        this.activeGems.splice(i, 1);
        this.gemPool.release(gem);
        this.updateHUD();
        continue;
      }

      // Remove out of bounds gems
      if (gem.y > this.virtualHeight + 50) {
        this.activeGems.splice(i, 1);
        this.gemPool.release(gem);
      }
    }

    // Update Particles
    for (let i = this.activeParticles.length - 1; i >= 0; i--) {
      const p = this.activeParticles[i];
      p.update();
      if (p.life <= 0) {
        this.activeParticles.splice(i, 1);
        this.particlePool.release(p);
      }
    }

    // Update Floating Text alerts
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
      }
    }
  }

  triggerTurboBlast(car) {
    this.soundManager.playExplosion();
    
    // Spawn massive cyan neon particles at the explosion point
    for (let i = 0; i < 40; i++) {
      const px = car.x + (Math.random() - 0.5) * 60;
      const py = car.y + (Math.random() - 0.5) * 60;
      this.activeParticles.push(this.particlePool.acquire(px, py, '#00f0ff', 'spark'));
    }

    // Set Turbo active
    this.turboActive = true;
    this.turboTimer = 180; // 3 seconds at 60fps
    this.score += 200;

    // Trigger freeze frames (10 frames)
    this.state = 'freeze';
    setTimeout(() => {
      if (window.game === this) {
        this.state = 'playing';
      }
    }, 166); // 10 frames of 16.6ms freeze

    // Spawn 5 scrolling road gems ahead of the player to absorb
    for (let i = 0; i < 5; i++) {
      const gemX = car.x + (Math.random() - 0.5) * 80;
      const gemY = car.y - 150 - (i * 120);
      this.activeGems.push(this.gemPool.acquire(gemX, gemY, this.roadSpeed));
    }

    // Establish Star Wars Crawl FX
    this.floatingFx = {
      active: true,
      english: this.activeWord.english,
      turkish: this.activeWord.turkish,
      y: 800,
      duration: 3.0
    };

    if (window.examEngine) {
      window.examEngine.registerAttempt(this.activeWord.english, true);
    }
    
    // Push correct vocab item into learned list
    const foundWord = this.vocabulary.find(vw => vw.english.toUpperCase() === this.activeWord.english.toUpperCase());
    if (foundWord) {
      this.wordsLearnedThisRun.push(foundWord);
    }

    // Remove exploded correct car
    this.trafficCars = this.trafficCars.filter(c => c !== car);
  }

  triggerCrash(car) {
    this.soundManager.playDamage();
    
    // screen shake: 30 frames, intensity 6
    this.triggerScreenShake(30, 6);

    // Spawn dark red / orange flame sparks
    for (let i = 0; i < 20; i++) {
      const px = car.x + (Math.random() - 0.5) * 40;
      const py = car.y + (Math.random() - 0.5) * 40;
      this.activeParticles.push(this.particlePool.acquire(px, py, '#ff3300', 'spark'));
    }

    // Emit black smoke exhaust clouds from player hood
    for (let i = 0; i < 8; i++) {
      const px = this.player.x + (Math.random() - 0.5) * 30;
      const py = this.player.y - 50;
      this.activeParticles.push(this.particlePool.acquire(px, py, '#333333', 'smoke'));
    }

    // Decrement shields
    this.decreaseShields();

    if (window.examEngine) {
      window.examEngine.registerAttempt(this.activeWord.english, false);
    }

    // Clean up collision wave and spawn a fresh try
    this.trafficCars = [];
    this.draftingTimer = 0;
    this.spawnTrafficWave();
  }

  drawGame() {
    this.ctx.clearRect(0, 0, this.virtualWidth, this.virtualHeight);
    
    // Save state for screen shake offsets
    this.ctx.save();
    if (this.screenShakeTimer > 0) {
      const dx = (Math.random() - 0.5) * this.screenShakeIntensity;
      const dy = (Math.random() - 0.5) * this.screenShakeIntensity;
      this.ctx.translate(dx, dy);
    }

    // 1. Draw highway pavement & scrolling stars
    this.ctx.fillStyle = '#0a0a0f'; // cyber-dark pavement background
    this.ctx.fillRect(0, 0, this.virtualWidth, this.virtualHeight);

    // Draw scrolling background stars
    this.stars.forEach(star => star.draw(this.ctx));

    // 2. Draw Scrolling lane dividers
    this.ctx.save();
    this.ctx.strokeStyle = 'rgba(255, 255, 255, 0.25)';
    this.ctx.lineWidth = 4;
    
    if (this.turboActive) {
      // cyan motion blur line styling
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

    // 3. Draw Side Road Neon Barriers (Glowing Hazard lines)
    this.ctx.save();
    this.ctx.lineWidth = 5;
    
    // Left Barrier
    this.ctx.strokeStyle = '#d000ff';
    this.ctx.shadowColor = '#d000ff';
    this.ctx.shadowBlur = 8;
    this.ctx.beginPath();
    this.ctx.moveTo(8, 0);
    this.ctx.lineTo(8, this.virtualHeight);
    this.ctx.stroke();

    // Right Barrier
    this.ctx.strokeStyle = '#d000ff';
    this.ctx.shadowColor = '#d000ff';
    this.ctx.beginPath();
    this.ctx.moveTo(this.virtualWidth - 8, 0);
    this.ctx.lineTo(this.virtualWidth - 8, this.virtualHeight);
    this.ctx.stroke();
    this.ctx.restore();

    // 4. Draw Scoreboard Billboard Truck (Target HUD Trailer)
    this.drawBillboardTruck(this.ctx);

    // 5. Draw Traffic vehicles
    this.trafficCars.forEach(car => car.draw(this.ctx));

    // 6. Draw Gems
    this.activeGems.forEach(gem => gem.draw(this.ctx));

    // 7. Draw Player vehicle
    this.drawPlayerCar(this.ctx);

    // 8. Draw particles & floating texts
    this.activeParticles.forEach(p => p.draw(this.ctx));
    this.activeFloatingTexts.forEach(ft => ft.draw(this.ctx));

    // 9. Draw Star Wars perspective holographic text
    if (this.floatingFx && this.floatingFx.active) {
      this.drawStarWarsCrawl(this.ctx);
    }

    // 10. Damage Screen Flash
    if (this.damageTimer > 0) {
      this.ctx.fillStyle = `rgba(255, 0, 0, ${this.damageTimer / 60})`;
      this.ctx.fillRect(0, 0, this.virtualWidth, this.virtualHeight);
    }

    // Restore screen shake offset
    this.ctx.restore();

    // 11. Draw Level Transition overlay loading countdown
    if (this.isLevelTransitioning) {
      this.drawLevelTransition(this.ctx);
    }
  }

  drawBillboardTruck(ctx) {
    ctx.save();
    
    // Cabin trailer bobbing up/down to feel organic
    const bob = Math.sin(Date.now() * 0.003) * 3;
    const ty = 120 + bob;
    const tx = this.virtualWidth / 2;
    
    // Draw billboard scoreboard frame
    ctx.fillStyle = 'rgba(10, 10, 15, 0.95)';
    ctx.strokeStyle = '#00f0ff';
    ctx.lineWidth = 3;
    ctx.shadowColor = '#00f0ff';
    ctx.shadowBlur = 10;
    
    // Draw wide horizontal display panel
    ctx.beginPath();
    ctx.roundRect(tx - 180, ty - 40, 360, 80, 8);
    ctx.fill();
    ctx.stroke();

    // Cyber-Grid pattern inside billboard
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

    // Draw active target English word value
    if (this.activeWord) {
      ctx.shadowColor = '#00f0ff';
      ctx.shadowBlur = 8;
      ctx.fillStyle = '#ffffff';
      ctx.font = '900 24px "Orbitron", Arial, sans-serif';
      ctx.textAlign = 'center';
      ctx.textBaseline = 'middle';
      ctx.fillText(this.activeWord.english, tx, ty);
    }

    ctx.restore();
  }

  drawPlayerCar(ctx) {
    ctx.save();

    // Red tint if damaged
    if (this.damageTimer > 0) {
      ctx.fillStyle = '#ff0055';
    }

    const px = this.player.x;
    const py = this.player.y;
    const pw = this.player.width;
    const ph = this.player.height;

    // Draw cyber-neon sports car
    ctx.strokeStyle = this.turboActive ? '#00f0ff' : '#ff0055'; // Cyan if turbo, magenta if normal
    ctx.lineWidth = 3.5;
    ctx.shadowColor = this.turboActive ? '#00f0ff' : '#ff0055';
    ctx.shadowBlur = 14;
    ctx.fillStyle = 'rgba(10, 10, 12, 0.9)';

    // Chassis outline round rect
    ctx.beginPath();
    ctx.roundRect(px - pw / 2, py - ph / 2, pw, ph, 15);
    ctx.fill();
    ctx.stroke();

    // Windshield glass cockpit
    ctx.strokeStyle = '#00f0ff';
    ctx.fillStyle = 'rgba(0, 240, 255, 0.2)';
    ctx.shadowBlur = 4;
    ctx.beginPath();
    ctx.roundRect(px - 20, py - 30, 40, 35, 6);
    ctx.fill();
    ctx.stroke();

    // Tail Brake lights
    ctx.fillStyle = '#ff0000';
    ctx.shadowColor = '#ff0000';
    ctx.shadowBlur = 8;
    ctx.fillRect(px - pw / 2 + 10, py + ph / 2 - 10, 12, 6);
    ctx.fillRect(px + pw / 2 - 22, py + ph / 2 - 10, 12, 6);

    ctx.restore();

    // Target English word text tag directly above the player's car for clear reading
    if (this.activeWord) {
      ctx.save();
      ctx.fillStyle = 'rgba(10, 10, 15, 0.9)';
      ctx.strokeStyle = '#00f0ff';
      ctx.lineWidth = 2;
      ctx.shadowColor = '#00f0ff';
      ctx.shadowBlur = 6;
      ctx.font = 'bold 13px "Orbitron", Arial, sans-serif';
      
      const textWidth = ctx.measureText(this.activeWord.english).width + 16;
      ctx.beginPath();
      ctx.roundRect(px - textWidth / 2, py - ph / 2 - 24, textWidth, 20, 5);
      ctx.fill();
      ctx.stroke();

      ctx.fillStyle = '#ffffff';
      ctx.textAlign = 'center';
      ctx.textBaseline = 'middle';
      ctx.fillText(this.activeWord.english, px, py - ph / 2 - 14);
      ctx.restore();
    }

    // Draw drafting progress/charge bar right above the target word tag
    if (this.draftingTimer > 0) {
      this.drawDraftingBar(ctx, px, py - ph / 2 - 40);
    }
  }

  drawDraftingBar(ctx, x, y) {
    ctx.save();
    
    const w = 100;
    const h = 8;
    
    // Draw background track
    ctx.fillStyle = 'rgba(20, 20, 30, 0.8)';
    ctx.strokeStyle = 'rgba(255, 255, 255, 0.15)';
    ctx.lineWidth = 1;
    ctx.beginPath();
    ctx.roundRect(x - w / 2, y, w, h, 3);
    ctx.fill();
    ctx.stroke();

    // Draw filled portion matching progress
    const pct = Math.min(1.0, this.draftingTimer / 120);
    const fillW = w * pct;
    
    // Color transitions from blue -> orange -> green when full
    let barColor = '#00f0ff';
    if (pct >= 1.0) {
      barColor = '#39ff14'; // full green
    } else if (pct > 0.6) {
      barColor = '#ffaa00'; // high charge orange
    }

    ctx.fillStyle = barColor;
    ctx.shadowColor = barColor;
    ctx.shadowBlur = 8;
    ctx.beginPath();
    ctx.roundRect(x - w / 2, y, fillW, h, 3);
    ctx.fill();
    
    ctx.restore();
  }

  drawStarWarsCrawl(ctx) {
    ctx.save();
    const floatingFx = this.floatingFx;
    const progress = Math.max(0, floatingFx.duration / 3.0);
    
    // Perspective spatial offset
    floatingFx.y -= 130 * (1 / 60); // moves upwards 130px/s
    
    const scale = Math.max(0.15, (floatingFx.y - 100) / 800);
    ctx.translate(this.virtualWidth / 2, floatingFx.y);
    ctx.scale(scale, scale);
    
    ctx.globalAlpha = progress;
    ctx.fillStyle = '#ffea00'; // Star Wars yellow
    ctx.font = 'bold 28px "Orbitron", Arial, sans-serif';
    ctx.textAlign = 'center';
    ctx.shadowColor = '#ffea00';
    ctx.shadowBlur = 12;
    ctx.fillText(floatingFx.english, 0, -15);
    
    if (floatingFx.turkish) {
      ctx.fillStyle = '#00f0ff'; // Cyan translation meaning
      ctx.shadowColor = '#00f0ff';
      ctx.font = 'bold 20px Arial, sans-serif';
      ctx.fillText(floatingFx.turkish, 0, 15);
    }
    
    ctx.restore();
  }

  drawLevelTransition(ctx) {
    ctx.save();
    ctx.fillStyle = 'rgba(5, 2, 10, 0.6)';
    ctx.fillRect(0, 0, this.virtualWidth, this.virtualHeight);

    const cx = this.virtualWidth / 2;
    const cy = this.virtualHeight / 2 - 30;
    const timeSpent = 3.0 - this.levelCompleteTimer;

    // Glowing stage cleared HUD banner
    ctx.textAlign = 'center';
    ctx.textBaseline = 'middle';
    ctx.fillStyle = '#39ff14';
    ctx.font = '900 38px "Orbitron", sans-serif';
    ctx.shadowColor = '#39ff14';
    ctx.shadowBlur = 15;
    ctx.fillText("STAGE COMPLETED", cx, cy - 40);

    // Score details
    ctx.fillStyle = '#ffffff';
    ctx.font = '700 18px "Orbitron", sans-serif';
    ctx.shadowBlur = 0;
    ctx.fillText(`BONUS GEMS COLLECTED: +${this.gemsCollectedThisLevel}`, cx, cy + 20);

    // Countdown timer loading next sector
    const countdown = Math.max(1, Math.ceil(this.levelCompleteTimer));
    ctx.save();
    ctx.shadowColor = '#39ff14';
    ctx.shadowBlur = 8;
    ctx.fillStyle = '#39ff14';
    ctx.font = '900 18px "Orbitron", sans-serif';
    ctx.fillText(`LOADING ROADWAY MATRIX ... ${countdown}`, cx, cy + 80);
    ctx.restore();

    ctx.restore();
  }
}

window.HighwayGame = HighwayGame;
