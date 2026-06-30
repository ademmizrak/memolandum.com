// 1980s Arcade Synthwave Audio Generator
// Generates sounds using the Web Audio API without needing external files.

let audioCtx = null;

const initAudio = () => {
  if (typeof window === 'undefined') return;
  if (!audioCtx) {
    const AudioContext = window.AudioContext || window.webkitAudioContext;
    if (AudioContext) {
      audioCtx = new AudioContext();
    }
  }
};

// Resume context if suspended (browser autoplay policy)
const ensureAudioContext = async () => {
  initAudio();
  if (!audioCtx) return false;
  if (audioCtx.state === 'suspended') {
    await audioCtx.resume();
  }
  return true;
};

// Play a classic coin/pickup sound (Correct Hit)
export const playCoinSound = async () => {
  if (!(await ensureAudioContext())) return;
  
  const osc = audioCtx.createOscillator();
  const gainNode = audioCtx.createGain();
  
  osc.type = 'square';
  
  // Frequency envelope: jump from B5 to E6
  osc.frequency.setValueAtTime(987.77, audioCtx.currentTime); // B5
  osc.frequency.setValueAtTime(1318.51, audioCtx.currentTime + 0.1); // E6
  
  // Volume envelope
  gainNode.gain.setValueAtTime(0.1, audioCtx.currentTime);
  gainNode.gain.exponentialRampToValueAtTime(0.01, audioCtx.currentTime + 0.3);
  
  osc.connect(gainNode);
  gainNode.connect(audioCtx.destination);
  
  osc.start();
  osc.stop(audioCtx.currentTime + 0.3);
};

// Play a harsh error buzz (Wrong Hit)
export const playCrashSound = async () => {
  if (!(await ensureAudioContext())) return;
  
  const osc = audioCtx.createOscillator();
  const gainNode = audioCtx.createGain();
  
  osc.type = 'sawtooth';
  
  // Low harsh frequency
  osc.frequency.setValueAtTime(150, audioCtx.currentTime);
  osc.frequency.exponentialRampToValueAtTime(40, audioCtx.currentTime + 0.3);
  
  // Volume envelope
  gainNode.gain.setValueAtTime(0.15, audioCtx.currentTime);
  gainNode.gain.exponentialRampToValueAtTime(0.01, audioCtx.currentTime + 0.3);
  
  osc.connect(gainNode);
  gainNode.connect(audioCtx.destination);
  
  osc.start();
  osc.stop(audioCtx.currentTime + 0.3);
};

// Hyperdrive activation sound (Sweep up)
export const playHyperdriveSound = async () => {
  if (!(await ensureAudioContext())) return;
  
  const osc = audioCtx.createOscillator();
  const gainNode = audioCtx.createGain();
  
  osc.type = 'sine';
  
  // Sweep frequency up
  osc.frequency.setValueAtTime(200, audioCtx.currentTime);
  osc.frequency.exponentialRampToValueAtTime(2000, audioCtx.currentTime + 0.5);
  
  // Volume envelope
  gainNode.gain.setValueAtTime(0, audioCtx.currentTime);
  gainNode.gain.linearRampToValueAtTime(0.2, audioCtx.currentTime + 0.2);
  gainNode.gain.exponentialRampToValueAtTime(0.01, audioCtx.currentTime + 0.5);
  
  osc.connect(gainNode);
  gainNode.connect(audioCtx.destination);
  
  osc.start();
  osc.stop(audioCtx.currentTime + 0.5);
};
