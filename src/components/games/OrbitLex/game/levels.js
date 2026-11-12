import { getWord } from "./lexicon.js";
export const LEVELS = [{
  id: "l1",
  wordId: "abundant",
  blurb: "Gold teaches the word. Fire through the slab — six hits, diamonds. Then the flag.",
  planetR: 102,
  platforms: [{
    a: 90,
    r: 148,
    w: 96,
    h: 16
  }, {
    a: 270,
    r: 220,
    w: 120,
    h: 20
  }],
  coins: [{
    a: 0,
    r: 168
  }, {
    a: 180,
    r: 168
  }, {
    a: 40,
    r: 188
  }, {
    a: 140,
    r: 188
  }, {
    a: 320,
    r: 188
  }, {
    a: 270,
    r: 188
  }],
  spikes: [],
  checkpoints: [{
    a: 90,
    r: 124
  }],
  flag: {
    a: 270,
    r: 242
  }
}, {
  id: "l2",
  wordId: "achieve",
  blurb: "Moving ledges orbit the word. Ride one to the outer coins.",
  planetR: 100,
  platforms: [{
    a: 0,
    r: 210,
    w: 100,
    h: 18,
    orbit: 28
  }, {
    a: 180,
    r: 210,
    w: 100,
    h: 18,
    orbit: 28
  }, {
    a: 270,
    r: 270,
    w: 110,
    h: 18
  }],
  coins: [{
    a: 45,
    r: 170
  }, {
    a: 135,
    r: 170
  }, {
    a: 225,
    r: 170
  }, {
    a: 315,
    r: 170
  }, {
    a: 0,
    r: 250
  }, {
    a: 180,
    r: 250
  }, {
    a: 270,
    r: 240
  }],
  spikes: [],
  checkpoints: [{
    a: 90,
    r: 122
  }, {
    a: 270,
    r: 250
  }],
  flag: {
    a: 270,
    r: 292
  }
}, {
  id: "l3",
  wordId: "adverse",
  blurb: "Spikes bite the inner ring. Strafe wide. Do not graze the crust.",
  planetR: 104,
  platforms: [{
    a: 20,
    r: 200,
    w: 80,
    h: 16
  }, {
    a: 160,
    r: 200,
    w: 80,
    h: 16
  }, {
    a: 270,
    r: 240,
    w: 100,
    h: 18
  }],
  coins: [{
    a: 20,
    r: 168
  }, {
    a: 160,
    r: 168
  }, {
    a: 70,
    r: 210
  }, {
    a: 110,
    r: 210
  }, {
    a: 270,
    r: 210
  }, {
    a: 300,
    r: 186
  }],
  spikes: [{
    a: 20,
    r: 118
  }, {
    a: 160,
    r: 118
  }, {
    a: 250,
    r: 118
  }],
  checkpoints: [{
    a: 90,
    r: 126
  }, {
    a: 200,
    r: 126
  }],
  flag: {
    a: 270,
    r: 262
  }
}, {
  id: "l4",
  wordId: "beneficial",
  blurb: "A ring of ledges. Gold waits on the far side of each hull.",
  planetR: 96,
  platforms: [{
    a: 0,
    r: 200,
    w: 90,
    h: 16
  }, {
    a: 90,
    r: 230,
    w: 90,
    h: 16
  }, {
    a: 180,
    r: 200,
    w: 90,
    h: 16
  }, {
    a: 270,
    r: 250,
    w: 110,
    h: 18
  }],
  coins: [{
    a: 0,
    r: 168
  }, {
    a: 45,
    r: 210
  }, {
    a: 90,
    r: 200
  }, {
    a: 135,
    r: 210
  }, {
    a: 180,
    r: 168
  }, {
    a: 225,
    r: 210
  }, {
    a: 315,
    r: 210
  }, {
    a: 270,
    r: 220
  }],
  spikes: [{
    a: 45,
    r: 110
  }, {
    a: 135,
    r: 110
  }, {
    a: 225,
    r: 110
  }],
  checkpoints: [{
    a: 90,
    r: 118
  }, {
    a: 180,
    r: 218
  }],
  flag: {
    a: 270,
    r: 272
  }
}, {
  id: "l5",
  wordId: "consequence",
  blurb: "Orbiting iron. Time the gaps. The flag sits past the last saw.",
  planetR: 100,
  platforms: [{
    a: 40,
    r: 220,
    w: 88,
    h: 16,
    orbit: -36
  }, {
    a: 220,
    r: 220,
    w: 88,
    h: 16,
    orbit: -36
  }, {
    a: 300,
    r: 280,
    w: 100,
    h: 18
  }],
  coins: [{
    a: 10,
    r: 170
  }, {
    a: 80,
    r: 190
  }, {
    a: 150,
    r: 170
  }, {
    a: 210,
    r: 190
  }, {
    a: 270,
    r: 170
  }, {
    a: 330,
    r: 250
  }, {
    a: 300,
    r: 250
  }],
  spikes: [{
    a: 0,
    r: 114
  }, {
    a: 90,
    r: 180
  }, {
    a: 180,
    r: 114
  }, {
    a: 270,
    r: 180
  }],
  checkpoints: [{
    a: 90,
    r: 122
  }, {
    a: 220,
    r: 238
  }],
  flag: {
    a: 300,
    r: 302
  }
}, {
  id: "l6",
  wordId: "significant",
  blurb: "The outer ring needs a long strafe. Reverse if you overshoot.",
  planetR: 92,
  platforms: [{
    a: 60,
    r: 190,
    w: 70,
    h: 14
  }, {
    a: 120,
    r: 190,
    w: 70,
    h: 14
  }, {
    a: 0,
    r: 250,
    w: 80,
    h: 16
  }, {
    a: 180,
    r: 250,
    w: 80,
    h: 16
  }, {
    a: 270,
    r: 310,
    w: 120,
    h: 18
  }],
  coins: [{
    a: 60,
    r: 160
  }, {
    a: 120,
    r: 160
  }, {
    a: 0,
    r: 220
  }, {
    a: 180,
    r: 220
  }, {
    a: 90,
    r: 270
  }, {
    a: 270,
    r: 270
  }, {
    a: 310,
    r: 280
  }, {
    a: 230,
    r: 280
  }],
  spikes: [{
    a: 30,
    r: 108
  }, {
    a: 150,
    r: 108
  }, {
    a: 210,
    r: 108
  }, {
    a: 330,
    r: 108
  }, {
    a: 90,
    r: 208
  }],
  checkpoints: [{
    a: 90,
    r: 114
  }, {
    a: 0,
    r: 268
  }, {
    a: 180,
    r: 268
  }],
  flag: {
    a: 270,
    r: 332
  }
}, {
  id: "l7",
  wordId: "persistent",
  blurb: "Breathing ledges. Stay with the pulse. Do not fall into the dark.",
  planetR: 98,
  platforms: [{
    a: 0,
    r: 210,
    w: 86,
    h: 16,
    radial: {
      amp: 36,
      speed: 1.6
    }
  }, {
    a: 120,
    r: 230,
    w: 86,
    h: 16,
    radial: {
      amp: 40,
      speed: 1.3
    }
  }, {
    a: 240,
    r: 230,
    w: 86,
    h: 16,
    radial: {
      amp: 40,
      speed: 1.3
    }
  }, {
    a: 300,
    r: 300,
    w: 100,
    h: 18
  }],
  coins: [{
    a: 0,
    r: 168
  }, {
    a: 60,
    r: 200
  }, {
    a: 120,
    r: 180
  }, {
    a: 180,
    r: 200
  }, {
    a: 240,
    r: 180
  }, {
    a: 300,
    r: 260
  }, {
    a: 330,
    r: 270
  }],
  spikes: [{
    a: 70,
    r: 114
  }, {
    a: 190,
    r: 114
  }, {
    a: 310,
    r: 114
  }, {
    a: 0,
    r: 260
  }],
  checkpoints: [{
    a: 90,
    r: 120
  }, {
    a: 240,
    r: 248
  }],
  flag: {
    a: 300,
    r: 322
  }
}, {
  id: "l8",
  wordId: "essential",
  blurb: "Narrow gold, mean iron. The flag will not wake until the last synonym.",
  planetR: 94,
  platforms: [{
    a: 20,
    r: 200,
    w: 64,
    h: 14,
    orbit: 40
  }, {
    a: 140,
    r: 220,
    w: 64,
    h: 14,
    orbit: -32
  }, {
    a: 260,
    r: 250,
    w: 70,
    h: 14,
    orbit: 24
  }, {
    a: 310,
    r: 320,
    w: 96,
    h: 16
  }],
  coins: [{
    a: 20,
    r: 168
  }, {
    a: 80,
    r: 210
  }, {
    a: 140,
    r: 180
  }, {
    a: 200,
    r: 220
  }, {
    a: 260,
    r: 200
  }, {
    a: 310,
    r: 280
  }, {
    a: 350,
    r: 290
  }, {
    a: 40,
    r: 280
  }],
  spikes: [{
    a: 50,
    r: 110
  }, {
    a: 110,
    r: 110
  }, {
    a: 170,
    r: 110
  }, {
    a: 230,
    r: 110
  }, {
    a: 80,
    r: 230
  }, {
    a: 200,
    r: 240
  }],
  checkpoints: [{
    a: 90,
    r: 116
  }, {
    a: 140,
    r: 238
  }, {
    a: 260,
    r: 268
  }],
  flag: {
    a: 310,
    r: 342
  }
}, {
  id: "l9",
  wordId: "comprehend",
  blurb: "Read the orbit. Two rings, opposite spins.",
  planetR: 100,
  platforms: [{
    a: 0,
    r: 190,
    w: 72,
    h: 14,
    orbit: 50
  }, {
    a: 180,
    r: 190,
    w: 72,
    h: 14,
    orbit: 50
  }, {
    a: 90,
    r: 260,
    w: 72,
    h: 14,
    orbit: -34
  }, {
    a: 270,
    r: 260,
    w: 72,
    h: 14,
    orbit: -34
  }, {
    a: 200,
    r: 330,
    w: 110,
    h: 18
  }],
  coins: [{
    a: 0,
    r: 160
  }, {
    a: 90,
    r: 160
  }, {
    a: 180,
    r: 160
  }, {
    a: 270,
    r: 160
  }, {
    a: 45,
    r: 230
  }, {
    a: 135,
    r: 230
  }, {
    a: 225,
    r: 230
  }, {
    a: 315,
    r: 230
  }, {
    a: 200,
    r: 300
  }],
  spikes: [{
    a: 45,
    r: 114
  }, {
    a: 135,
    r: 114
  }, {
    a: 225,
    r: 114
  }, {
    a: 315,
    r: 114
  }, {
    a: 0,
    r: 230
  }, {
    a: 180,
    r: 230
  }],
  checkpoints: [{
    a: 90,
    r: 122
  }, {
    a: 270,
    r: 278
  }],
  flag: {
    a: 200,
    r: 352
  }
}, {
  id: "l10",
  wordId: "acquire",
  blurb: "Final paper. Take every synonym. Leave nothing in the dark.",
  planetR: 96,
  platforms: [{
    a: 30,
    r: 200,
    w: 60,
    h: 14,
    orbit: 22
  }, {
    a: 90,
    r: 240,
    w: 60,
    h: 14,
    radial: {
      amp: 30,
      speed: 1.8
    }
  }, {
    a: 150,
    r: 200,
    w: 60,
    h: 14,
    orbit: -22
  }, {
    a: 210,
    r: 250,
    w: 70,
    h: 14,
    orbit: 30
  }, {
    a: 300,
    r: 300,
    w: 70,
    h: 14,
    radial: {
      amp: 26,
      speed: 1.4
    }
  }, {
    a: 340,
    r: 360,
    w: 120,
    h: 18
  }],
  coins: [{
    a: 30,
    r: 168
  }, {
    a: 90,
    r: 200
  }, {
    a: 150,
    r: 168
  }, {
    a: 210,
    r: 210
  }, {
    a: 270,
    r: 220
  }, {
    a: 300,
    r: 260
  }, {
    a: 330,
    r: 320
  }, {
    a: 0,
    r: 300
  }, {
    a: 60,
    r: 300
  }],
  spikes: [{
    a: 0,
    r: 112
  }, {
    a: 60,
    r: 112
  }, {
    a: 120,
    r: 112
  }, {
    a: 180,
    r: 112
  }, {
    a: 240,
    r: 112
  }, {
    a: 90,
    r: 210
  }, {
    a: 210,
    r: 280
  }],
  checkpoints: [{
    a: 90,
    r: 118
  }, {
    a: 150,
    r: 218
  }, {
    a: 300,
    r: 318
  }],
  flag: {
    a: 340,
    r: 382
  }
}];
export function getLevel(id) {
  const found = LEVELS.find(l => l.id === id);
  if (!found) {
    return LEVELS[0];
  }
  return found;
}
export function levelWord(level) {
  if (!level) return null;
  try {
    return getWord(level.wordId);
  } catch {
    return null;
  }
}
export function nextLevelId(id) {
  const i = LEVELS.findIndex(l => l.id === id);
  if (i < 0 || i >= LEVELS.length - 1) return null;
  return LEVELS[i + 1].id;
}