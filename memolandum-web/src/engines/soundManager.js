export class SoundManager {
  constructor() {
    this.audioCtx = null;
    this.isMuted = false;
    this.isAudioEnabled = true;
    this.wordAudio = new Audio();
    this.wordAudio.volume = 1.0;
  }

  setMuted(muted) {
    this.isMuted = muted;
  }

  setAudioEnabled(enabled) {
    this.isAudioEnabled = enabled;
  }

  init() {
    if (this.isMuted) return;
    if (!this.audioCtx) {
      try {
        this.audioCtx = new (window.AudioContext || window.webkitAudioContext)();
      } catch (e) {
        console.warn("Web Audio API not supported or blocked in this browser:", e);
        this.audioCtx = null;
      }
    }
    if (this.audioCtx && this.audioCtx.state === 'suspended') {
      this.audioCtx.resume();
    }
    if (this.wordAudio && this.wordAudio.paused && !this.wordAudio.src) {
      // Small trick to unlock audio on first interaction
      this.wordAudio.play().then(() => {
        this.wordAudio.pause();
        this.wordAudio.currentTime = 0;
      }).catch(e => {});
    }
  }

  stop() {
    if (this.audioCtx && this.audioCtx.state !== 'closed') {
      try {
        this.audioCtx.suspend();
      } catch (e) {}
    }
  }

  playWordAudio(url) {
    if (!this.isAudioEnabled || !url) return;
    
    try {
      this.wordAudio.src = url;
      this.wordAudio.load();
      this.wordAudio.currentTime = 0;
      this.wordAudio.play().catch(e => console.warn("Audio play failed:", e));
    } catch (e) {
      console.error("Audio playback error:", e);
    }
  }

  playLaser() {
    if (this.isMuted) return;
    this.init();
    if (!this.audioCtx) return;

    const time = this.audioCtx.currentTime;
    const osc = this.audioCtx.createOscillator();
    const gain = this.audioCtx.createGain();

    osc.type = 'sawtooth';
    osc.frequency.setValueAtTime(750, time);
    osc.frequency.exponentialRampToValueAtTime(80, time + 0.12);

    gain.gain.setValueAtTime(0.12, time);
    gain.gain.linearRampToValueAtTime(0.01, time + 0.12);

    osc.connect(gain);
    gain.connect(this.audioCtx.destination);

    osc.start(time);
    osc.stop(time + 0.12);
  }

  playExplosion() {
    if (this.isMuted) return;
    this.init();
    if (!this.audioCtx) return;

    const time = this.audioCtx.currentTime;
    const duration = 0.35;

    // White noise node logic for gritty texture
    const bufferSize = this.audioCtx.sampleRate * duration;
    const buffer = this.audioCtx.createBuffer(1, bufferSize, this.audioCtx.sampleRate);
    const data = buffer.getChannelData(0);
    for (let i = 0; i < bufferSize; i++) {
      data[i] = Math.random() * 2 - 1;
    }

    const noiseNode = this.audioCtx.createBufferSource();
    noiseNode.buffer = buffer;

    const filter = this.audioCtx.createBiquadFilter();
    filter.type = 'bandpass';
    filter.frequency.setValueAtTime(250, time);
    filter.frequency.exponentialRampToValueAtTime(45, time + duration);

    const gainNode = this.audioCtx.createGain();
    gainNode.gain.setValueAtTime(0.25, time);
    gainNode.gain.exponentialRampToValueAtTime(0.01, time + duration);

    noiseNode.connect(filter);
    filter.connect(gainNode);
    gainNode.connect(this.audioCtx.destination);

    noiseNode.start(time);
    noiseNode.stop(time + duration);

    // Sub-synth bass frequency sweep for depth/impact
    const bassOsc = this.audioCtx.createOscillator();
    const bassGain = this.audioCtx.createGain();
    bassOsc.type = 'triangle';
    bassOsc.frequency.setValueAtTime(100, time);
    bassOsc.frequency.linearRampToValueAtTime(20, time + duration);

    bassGain.gain.setValueAtTime(0.35, time);
    bassGain.gain.exponentialRampToValueAtTime(0.01, time + duration);

    bassOsc.connect(bassGain);
    bassGain.connect(this.audioCtx.destination);

    bassOsc.start(time);
    bassOsc.stop(time + duration);
  }

  playDamage() {
    if (this.isMuted) return;
    this.init();
    if (!this.audioCtx) return;

    const time = this.audioCtx.currentTime;
    const osc = this.audioCtx.createOscillator();
    const gain = this.audioCtx.createGain();

    osc.type = 'sawtooth';
    osc.frequency.setValueAtTime(180, time);
    osc.frequency.setValueAtTime(90, time + 0.12);

    gain.gain.setValueAtTime(0.25, time);
    gain.gain.linearRampToValueAtTime(0.01, time + 0.25);

    osc.connect(gain);
    gain.connect(this.audioCtx.destination);

    osc.start(time);
    osc.stop(time + 0.25);
  }

  playGameOver() {
    if (this.isMuted) return;
    this.init();
    if (!this.audioCtx) return;

    const time = this.audioCtx.currentTime;
    const notes = [220, 165, 110];

    notes.forEach((freq, i) => {
      const osc = this.audioCtx.createOscillator();
      const gain = this.audioCtx.createGain();

      osc.type = 'sawtooth';
      osc.frequency.setValueAtTime(freq, time + i * 0.2);

      gain.gain.setValueAtTime(0.2, time + i * 0.2);
      gain.gain.linearRampToValueAtTime(0.01, time + (i + 1) * 0.2);

      osc.connect(gain);
      gain.connect(this.audioCtx.destination);

      osc.start(time + i * 0.2);
      osc.stop(time + (i + 1) * 0.2);
    });
  }

  playStageClear() {
    if (this.isMuted) return;
    this.init();
    if (!this.audioCtx) return;

    const time = this.audioCtx.currentTime;
    // Ascending notes arpeggio
    const freqs = [261.63, 329.63, 392.00, 523.25, 659.25, 783.99];
    freqs.forEach((freq, i) => {
      const noteTime = time + i * 0.08;
      const osc = this.audioCtx.createOscillator();
      const gain = this.audioCtx.createGain();

      osc.type = 'triangle';
      osc.frequency.setValueAtTime(freq, noteTime);

      gain.gain.setValueAtTime(0.2, noteTime);
      gain.gain.linearRampToValueAtTime(0.01, noteTime + 0.25);

      osc.connect(gain);
      gain.connect(this.audioCtx.destination);

      osc.start(noteTime);
      osc.stop(noteTime + 0.25);
    });

    // Add a long, bright glowing synth pad at the end
    const padOsc = this.audioCtx.createOscillator();
    const padGain = this.audioCtx.createGain();
    padOsc.type = 'sine';
    padOsc.frequency.setValueAtTime(1046.50, time + 0.48); // High C6
    padGain.gain.setValueAtTime(0, time + 0.48);
    padGain.gain.linearRampToValueAtTime(0.15, time + 0.55);
    padGain.gain.linearRampToValueAtTime(0.01, time + 1.5);
    
    padOsc.connect(padGain);
    padGain.connect(this.audioCtx.destination);
    
    padOsc.start(time + 0.48);
    padOsc.stop(time + 1.5);
  }

  playStageRiser() {
    if (this.isMuted) return;
    this.init();
    if (!this.audioCtx) return;

    const time = this.audioCtx.currentTime;
    const osc = this.audioCtx.createOscillator();
    const gain = this.audioCtx.createGain();

    osc.type = 'sawtooth';
    osc.frequency.setValueAtTime(150, time);
    osc.frequency.exponentialRampToValueAtTime(800, time + 1.2);

    gain.gain.setValueAtTime(0.01, time);
    gain.gain.linearRampToValueAtTime(0.08, time + 0.8);
    gain.gain.exponentialRampToValueAtTime(0.001, time + 1.2);

    osc.connect(gain);
    gain.connect(this.audioCtx.destination);

    osc.start(time);
    osc.stop(time + 1.2);
  }

  playGemTick() {
    if (this.isMuted) return;
    this.init();
    if (!this.audioCtx) return;

    const time = this.audioCtx.currentTime;
    const osc = this.audioCtx.createOscillator();
    const gain = this.audioCtx.createGain();

    osc.type = 'sine';
    osc.frequency.setValueAtTime(600, time);
    osc.frequency.exponentialRampToValueAtTime(1200, time + 0.05);

    gain.gain.setValueAtTime(0.08, time);
    gain.gain.linearRampToValueAtTime(0.001, time + 0.05);

    osc.connect(gain);
    gain.connect(this.audioCtx.destination);

    osc.start(time);
    osc.stop(time + 0.05);
  }

  playCoinCollect() {
    if (this.isMuted) return;
    this.init();
    if (!this.audioCtx) return;

    const time = this.audioCtx.currentTime;
    
    // Play a retro arpeggio chime
    const osc1 = this.audioCtx.createOscillator();
    const gain1 = this.audioCtx.createGain();
    osc1.type = 'square';
    osc1.frequency.setValueAtTime(987.77, time); // B5
    osc1.frequency.setValueAtTime(1318.51, time + 0.08); // E6
    
    gain1.gain.setValueAtTime(0.08, time);
    gain1.gain.linearRampToValueAtTime(0.08, time + 0.08);
    gain1.gain.linearRampToValueAtTime(0.001, time + 0.25);
    
    osc1.connect(gain1);
    gain1.connect(this.audioCtx.destination);
    
    osc1.start(time);
    osc1.stop(time + 0.25);
  }
}
