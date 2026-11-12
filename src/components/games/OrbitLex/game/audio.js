let shared = null;
let master = null;
let sfx = null;
export function unlockAudio() {
  if (!shared) {
    const AC = window.AudioContext || window.webkitAudioContext;
    shared = new AC({
      latencyHint: "interactive"
    });
    master = shared.createGain();
    sfx = shared.createGain();
    sfx.gain.value = 0.7;
    sfx.connect(master);
    master.connect(shared.destination);
  }
  if (shared.state === "suspended") void shared.resume();
}
export function createAudio() {
  let muted = false;
  function setMuted(next) {
    muted = next;
    if (master && shared) {
      master.gain.setTargetAtTime(next ? 0 : 1, shared.currentTime, 0.02);
    }
  }
  function envGain(duration, peak) {
    if (!shared || !sfx || muted) return null;
    const g = shared.createGain();
    const t = shared.currentTime;
    g.gain.setValueAtTime(0.0001, t);
    g.gain.exponentialRampToValueAtTime(peak, t + 0.012);
    g.gain.exponentialRampToValueAtTime(0.0001, t + duration);
    g.connect(sfx);
    return {
      g,
      t,
      ctx: shared
    };
  }
  function tone(freq, duration, type, peak = 0.12) {
    const e = envGain(duration, peak);
    if (!e) return;
    const o = e.ctx.createOscillator();
    o.type = type;
    o.frequency.setValueAtTime(freq, e.t);
    o.connect(e.g);
    o.start(e.t);
    o.stop(e.t + duration + 0.02);
    o.onended = () => {
      o.disconnect();
      e.g.disconnect();
    };
  }
  function sweep(from, to, duration, type, peak = 0.12) {
    const e = envGain(duration, peak);
    if (!e) return;
    const o = e.ctx.createOscillator();
    o.type = type;
    o.frequency.setValueAtTime(from, e.t);
    o.frequency.exponentialRampToValueAtTime(Math.max(40, to), e.t + duration);
    o.connect(e.g);
    o.start(e.t);
    o.stop(e.t + duration + 0.02);
    o.onended = () => {
      o.disconnect();
      e.g.disconnect();
    };
  }
  function noise(duration, peak = 0.08) {
    const e = envGain(duration, peak);
    if (!e) return;
    const n = Math.floor(e.ctx.sampleRate * duration);
    const buf = e.ctx.createBuffer(1, n, e.ctx.sampleRate);
    const data = buf.getChannelData(0);
    for (let i = 0; i < n; i++) data[i] = Math.random() * 2 - 1;
    const src = e.ctx.createBufferSource();
    src.buffer = buf;
    const f = e.ctx.createBiquadFilter();
    f.type = "lowpass";
    f.frequency.value = 900;
    src.connect(f);
    f.connect(e.g);
    src.start(e.t);
    src.stop(e.t + duration);
    src.onended = () => {
      src.disconnect();
      f.disconnect();
      e.g.disconnect();
    };
  }
  return {
    unlock: unlockAudio,
    setMuted,
    isMuted: () => muted,
    jump: () => sweep(520, 280, 0.12, "square", 0.07),
    doubleJump: () => sweep(640, 420, 0.1, "square", 0.07),
    land: () => noise(0.08, 0.05),
    shoot: () => {
      sweep(420, 140, 0.09, "sawtooth", 0.05);
      noise(0.05, 0.04);
    },
    coin: () => {
      tone(880, 0.07, "sine", 0.07);
      window.setTimeout(() => tone(1320, 0.1, "sine", 0.06), 50);
    },
    synonym: () => {
      tone(523, 0.16, "triangle", 0.07);
      tone(659, 0.18, "triangle", 0.06);
      tone(784, 0.22, "triangle", 0.05);
    },
    antonym: () => {
      tone(784, 0.14, "sawtooth", 0.06);
      window.setTimeout(() => tone(659, 0.16, "triangle", 0.06), 60);
      window.setTimeout(() => tone(523, 0.22, "triangle", 0.07), 130);
    },
    planetHit: () => {
      noise(0.07, 0.06);
      sweep(180, 90, 0.12, "sine", 0.08);
    },
    crack: () => {
      noise(0.05, 0.05);
      sweep(320, 140, 0.08, "square", 0.05);
    },
    shatter: () => {
      noise(0.12, 0.08);
      sweep(220, 70, 0.18, "sawtooth", 0.08);
    },
    diamond: () => {
      tone(988, 0.08, "sine", 0.07);
      window.setTimeout(() => tone(1480, 0.12, "sine", 0.06), 45);
    },
    checkpoint: () => {
      tone(660, 0.1, "triangle", 0.07);
      window.setTimeout(() => tone(880, 0.14, "triangle", 0.06), 70);
    },
    death: () => sweep(220, 55, 0.32, "sawtooth", 0.1),
    win: () => {
      tone(523, 0.16, "triangle", 0.08);
      window.setTimeout(() => tone(659, 0.16, "triangle", 0.07), 90);
      window.setTimeout(() => tone(784, 0.22, "triangle", 0.07), 180);
      window.setTimeout(() => tone(1046, 0.3, "triangle", 0.06), 280);
    },
    flag: () => sweep(400, 720, 0.2, "triangle", 0.07),
    aboutFace: () => {
      sweep(240, 520, 0.12, "square", 0.08);
      noise(0.07, 0.05);
    }
  };
}