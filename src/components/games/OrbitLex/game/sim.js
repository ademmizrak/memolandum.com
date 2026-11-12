import { createAudio } from "./audio.js";
import { createInput } from "./input.js";
import { getLevel, levelWord } from "./levels.js";
import { drawWorld, projectWorld } from "./render.js";
import {
  attachAdaptiveCanvasGuard,
  createCanvasFpsMonitor,
  getAdaptiveDevicePixelRatio,
  scaleParticleCount,
} from "../../../../lib/performance/canvasFpsGuard.js";
const FIXED = 1 / 60;
const MAX_FRAME = 0.1;
const PLAYER_R = 14;
const ACCEL = 920;
const MAX_SPEED = 250;
const DRAG = 3.2;
const ABOUT_CD = 0.38;
const FIRE_CD = 0.15;
const CORE_HIT_CD = 0.42;
const INVULN = 1.2;
const VOID_R = 560;
const BULLET_SPEED = 520;
const PLAT_HP = 6;
const GEMS_EACH = 2;
const MAGNET = 0.5;
const PULL = 180;
const PULL_R = 140;
const FLY_T = 1.7;
function polar(deg, r) {
  const a = deg * Math.PI / 180;
  return {
    x: Math.cos(a) * r,
    y: Math.sin(a) * r,
    a
  };
}
function clamp(v, lo, hi) {
  return Math.max(lo, Math.min(hi, v));
}
function heading(yaw) {
  const fx = -Math.sin(yaw);
  const fy = -Math.cos(yaw);
  return {
    fx,
    fy,
    rx: -fy,
    ry: fx
  };
}
export function createGame(canvas, sprites, levelId, hooks, muted0, session) {
  const gfx = canvas.getContext("2d");
  if (!gfx) throw new Error("No 2D context");
  const ctx = attachAdaptiveCanvasGuard(gfx);
  const fpsMonitor = createCanvasFpsMonitor({
    sampleSize: 60,
    fpsThreshold: 35,
    onLowSpec: () => {
      resize();
    },
  });
  const input = createInput();
  input.attach(canvas);
  const audio = createAudio();
  function resolveLevel(id) {
    if (session?.level) return session.level;
    return getLevel(id);
  }
  function resolveWord(lv) {
    if (session?.word) return session.word;
    return levelWord(lv);
  }
  let level = resolveLevel(levelId);
  let word = resolveWord(level);
  let running = true;
  let paused = false;
  let won = false;
  let acc = 0;
  let last = performance.now();
  let time = 0;
  let anim = 0;
  let freeze = 0;
  let trauma = 0;
  let fireCd = 0;
  let coreCd = 0;
  let aboutCd = 0;
  let magnet = 0;
  let hudClock = 0;
  const reduced = window.matchMedia?.("(prefers-reduced-motion: reduce)").matches ?? false;
  const player = {
    x: 0,
    y: 0,
    vx: 0,
    vy: 0,
    yaw: 0,
    r: PLAYER_R,
    gx: 0,
    gy: 1,
    invuln: 0,
    squash: 1,
    thrusting: false,
    aboutFlash: 0
  };
  let spawn = {
    x: 0,
    y: 0,
    yaw: 0
  };
  let platforms = [];
  let coins = [];
  let spikes = [];
  let beacons = [];
  let crystals = [];
  let gems = [];
  let bullets = [];
  let particles = [];
  let floaters = [];
  let flies = [];
  let flag = {
    x: 0,
    y: 0
  };
  let coinCount = 0;
  let diamondCount = 0;
  let totalDiamonds = 0;
  let deathFlash = 0;
  let popped = null;
  let popLife = 0;
  let dpr = 1;
  let introAnim = null;
  function resetLevel(id) {
    level = resolveLevel(id);
    word = resolveWord(level);
    time = 0;
    won = false;
    paused = false;
    fireCd = 0;
    coreCd = 0;
    aboutCd = 0;
    magnet = 0;
    freeze = 0;
    trauma = 0;
    coinCount = 0;
    diamondCount = 0;
    popped = null;
    popLife = 0;
    bullets = [];
    particles = [];
    floaters = [];
    flies = [];
    deathFlash = 0;
    const s = polar(90, level.planetR + 92);
    spawn = {
      x: s.x,
      y: s.y,
      yaw: 0
    };
    player.x = s.x;
    player.y = s.y;
    player.vx = 0;
    player.vy = 0;
    player.yaw = spawn.yaw;
    player.invuln = 0.4;
    player.squash = 1;
    player.thrusting = false;
    player.aboutFlash = 0;
    platforms = level.platforms.map(def => {
      const p = polar(def.a, def.r);
      return {
        x: p.x,
        y: p.y,
        w: def.w,
        h: def.h,
        vx: 0,
        vy: 0,
        a: def.a,
        r: def.r,
        hp: PLAT_HP,
        maxHp: PLAT_HP,
        flash: 0,
        alive: true,
        def
      };
    });
    totalDiamonds = platforms.length * GEMS_EACH;
    gems = [];
    coins = level.coins.map((c, i) => {
      const p = polar(c.a, c.r);
      return {
        x: p.x,
        y: p.y,
        taken: false,
        phase: i * 0.4
      };
    });
    spikes = level.spikes.map(sp => {
      const p = polar(sp.a, sp.r);
      return {
        x: p.x,
        y: p.y,
        a: p.a,
        r: sp.r
      };
    });
    beacons = level.checkpoints.map((c, i) => {
      const p = polar(c.a, c.r);
      return {
        x: p.x,
        y: p.y,
        armed: i === 0
      };
    });
    const f = polar(level.flag.a, level.flag.r);
    flag = {
      x: f.x,
      y: f.y
    };
    const mode = session?.mode || "mixed";
    let targetTokens = [];
    const syns = (Array.isArray(word.synonyms) && word.synonyms.length ? word.synonyms : ["alike", "similar", "kindred"])
      .slice(0, 3).map(wrd => ({ word: wrd, type: "synonym" }));
    const ants = (Array.isArray(word.antonyms) && word.antonyms.length ? word.antonyms : ["opposite", "contrary", "reverse"])
      .slice(0, 3).map(wrd => ({ word: wrd, type: "antonym" }));

    if (mode === "antonyms") {
      targetTokens = ants;
    } else if (mode === "synonyms") {
      targetTokens = syns;
    } else {
      // mode === "mixed" / "all": HEM EŞ HEM ZIT ANLAM (3 Eş Anlamlı + 3 Zıt Anlamlı = 6 Kelime)
      targetTokens = [...syns, ...ants];
    }

    crystals = targetTokens.map((item, i) => {
      const a = (i / targetTokens.length) * 360 + 20;
      const r = level.planetR + 115 + ((i % 2) * 55);
      const p = polar(a, r);
      return {
        word: item.word,
        type: item.type,
        x: p.x,
        y: p.y,
        vx: 0,
        vy: 0,
        released: true,
        collected: false,
        landed: false,
        bob: i
      };
    });

    const chips = targetTokens.map((item, i) => {
      const isAnt = item.type === "antonym";
      const subIdx = i % 3;
      const angle = isAnt
        ? Math.PI * 0.15 + subIdx * 0.65
        : Math.PI * 1.05 + subIdx * 0.65;
      const dist = 145 + (i % 2) * 35;
      return {
        word: item.word,
        type: item.type,
        slotIndex: i,
        apexWx: Math.cos(angle) * dist,
        apexWy: Math.sin(angle) * dist,
        landed: false
      };
    });

    introAnim = {
      active: true,
      time: 0,
      duration: 2.8,
      word: word.word,
      turkish: word.definitionTr,
      burstTriggered: false,
      chips
    };
  }
  resetLevel(levelId);
  function burst(x, y, n, color, speed) {
    const count = scaleParticleCount(n, fpsMonitor.isLowSpec);
    for (let i = 0; i < count; i++) {
      const a = Math.random() * Math.PI * 2;
      const s = speed * (0.4 + Math.random());
      particles.push({
        x,
        y,
        vx: Math.cos(a) * s,
        vy: Math.sin(a) * s,
        life: 0.35 + Math.random() * 0.35,
        max: 0.7,
        size: 1.6 + Math.random() * 2.4,
        color
      });
    }
  }
  function hud() {
    const mode = session?.mode || "synonyms";
    return {
      word: word.word,
      definition: word.definition,
      definitionTr: word.definitionTr,
      mode,
      coins: coinCount,
      totalCoins: coins.length,
      diamonds: diamondCount,
      totalDiamonds,
      tokens: crystals.map(c => ({
        word: c.word,
        type: c.type || "synonym",
        collected: c.collected,
        released: c.released,
        landed: c.landed
      })),
      synonyms: crystals.filter(c => c.type !== "antonym").map(c => ({
        word: c.word,
        type: "synonym",
        collected: c.collected,
        released: c.released,
        landed: c.landed
      })),
      antonyms: crystals.filter(c => c.type === "antonym").map(c => ({
        word: c.word,
        type: "antonym",
        collected: c.collected,
        released: c.released,
        landed: c.landed
      })),
      popped: popLife > 0 ? popped : null,
      flies: flies.map(f => {
        const p = projectWorld(f.wx, f.wy, canvas.width, canvas.height, dpr);
        return {
          word: f.word,
          type: f.type || "synonym",
          slot: f.slot,
          x: p.x,
          y: p.y,
          t: f.t
        };
      }),
      flagReady: crystals.every(c => c.collected),
      stars: rate(),
      won,
      time,
      muted: audio.isMuted()
    };
  }
  function rate() {
    let n = 0;
    if (crystals.every(c => c.collected)) n += 1;
    if (coins.length > 0 && coinCount >= coins.length) n += 1;
    if (totalDiamonds > 0 && diamondCount >= totalDiamonds) n += 1;else if (totalDiamonds === 0 && coins.length > 0 && coinCount >= coins.length) n += 1;
    return n;
  }
  function kill() {
    if (player.invuln > 0 || won) return;
    audio.death();
    trauma = Math.min(1, trauma + 0.55);
    deathFlash = 0.45;
    burst(player.x, player.y, 22, "#c45c5c", 180);
    player.x = spawn.x;
    player.y = spawn.y;
    player.vx = 0;
    player.vy = 0;
    player.yaw = spawn.yaw;
    player.invuln = INVULN;
  }
  function circleAabb(cx, cy, cr, ax, ay, aw, ah) {
    const hx = aw / 2;
    const hy = ah / 2;
    const left = ax - hx;
    const right = ax + hx;
    const top = ay - hy;
    const bot = ay + hy;
    const qx = clamp(cx, left, right);
    const qy = clamp(cy, top, bot);
    const dx = cx - qx;
    const dy = cy - qy;
    const inside = cx > left && cx < right && cy > top && cy < bot;
    if (inside) {
      const dl = cx - left;
      const dr = right - cx;
      const dt = cy - top;
      const db = bot - cy;
      const m = Math.min(dl, dr, dt, db);
      if (m === dl) return {
        nx: -1,
        ny: 0,
        pen: cr + dl
      };
      if (m === dr) return {
        nx: 1,
        ny: 0,
        pen: cr + dr
      };
      if (m === dt) return {
        nx: 0,
        ny: -1,
        pen: cr + dt
      };
      return {
        nx: 0,
        ny: 1,
        pen: cr + db
      };
    }
    const d2 = dx * dx + dy * dy;
    if (d2 > cr * cr) return null;
    const d = Math.sqrt(d2) || 0.0001;
    return {
      nx: dx / d,
      ny: dy / d,
      pen: cr - d
    };
  }
  function updatePlatforms(dt) {
    for (const p of platforms) {
      if (!p.alive) continue;
      p.flash = Math.max(0, p.flash - dt);
      const ox = p.x;
      const oy = p.y;
      if (p.def.orbit) {
        p.a += p.def.orbit * dt;
        const q = polar(p.a, p.def.r);
        p.x = q.x;
        p.y = q.y;
      } else if (p.def.radial) {
        const rr = p.def.r + Math.sin(time * p.def.radial.speed + p.def.a) * p.def.radial.amp;
        const q = polar(p.def.a, rr);
        p.x = q.x;
        p.y = q.y;
        p.r = rr;
      }
      p.vx = (p.x - ox) / dt;
      p.vy = (p.y - oy) / dt;
    }
  }
  function shatter(p) {
    p.alive = false;
    p.hp = 0;
    audio.shatter();
    freeze = 0.055;
    trauma = Math.min(1, trauma + 0.45);
    burst(p.x, p.y, 26, "#d7c4a3", 180);
    burst(p.x, p.y, 10, "#9eb4c8", 120);
    for (let i = 0; i < GEMS_EACH; i++) {
      const ang = Math.atan2(p.y, p.x) + (i === 0 ? -0.5 : 0.5);
      gems.push({
        x: p.x,
        y: p.y,
        vx: Math.cos(ang) * 90,
        vy: Math.sin(ang) * 90,
        taken: false,
        bob: i * 0.7
      });
    }
  }
  function pullToward(dt, x, y) {
    const dx = player.x - x;
    const dy = player.y - y;
    const d = Math.hypot(dx, dy) || 1;
    if (d > PULL_R) return {
      x,
      y
    };
    const k = PULL * dt;
    return {
      x: x + dx / d * k,
      y: y + dy / d * k
    };
  }
  function step(dt, act) {
    if (won) return;
    time += dt;

    if (introAnim && introAnim.active) {
      introAnim.time += dt;
      const it = introAnim.time;

      if (it >= 0.45 && !introAnim.burstTriggered) {
        introAnim.burstTriggered = true;
        for (const chip of introAnim.chips) {
          const color = chip.type === "antonym" ? "#ef4444" : "#22c55e";
          burst(0, 0, 18, color, 150);
        }
      }

      for (const chip of introAnim.chips) {
        if (!chip.landed && it >= 2.15) {
          chip.landed = true;
          if (crystals[chip.slotIndex]) {
            crystals[chip.slotIndex].landed = true;
          }
          const color = chip.type === "antonym" ? "#ef4444" : "#22c55e";
          burst(chip.apexWx * 0.25, chip.apexWy * 0.25, 8, color, 70);
          hooks.onHud(hud());
        }
      }

      if (introAnim.time >= introAnim.duration) {
        introAnim.active = false;
        crystals.forEach(c => { c.landed = true; });
        hooks.onHud(hud());
      }
    }
    fireCd = Math.max(0, fireCd - dt);
    coreCd = Math.max(0, coreCd - dt);
    aboutCd = Math.max(0, aboutCd - dt);
    popLife = Math.max(0, popLife - dt);
    magnet = Math.max(0, magnet - dt);
    player.invuln = Math.max(0, player.invuln - dt);
    player.aboutFlash = Math.max(0, player.aboutFlash - dt);
    deathFlash = Math.max(0, deathFlash - dt);
    trauma = Math.max(0, trauma - dt * 1.8);
    player.squash += (1 - player.squash) * (1 - Math.exp(-12 * dt));
    updatePlatforms(dt);
    const dist = Math.hypot(player.x, player.y) || 1;
    player.gx = player.x / dist;
    player.gy = player.y / dist;
    if (act.aboutFace && aboutCd <= 0) {
      player.yaw += Math.PI;
      player.vx *= -1;
      player.vy *= -1;
      aboutCd = ABOUT_CD;
      player.aboutFlash = 0.28;
      player.squash = 1.28;
      audio.aboutFace();
      const {
        fx,
        fy
      } = heading(player.yaw);
      burst(player.x - fx * 10, player.y - fy * 10, 10, "#d7c4a3", 110);
      trauma = Math.min(1, trauma + 0.16);
    }
    const {
      fx,
      fy
    } = heading(player.yaw);
    player.thrusting = Math.abs(act.moveX) + Math.abs(act.moveY) > 0.08;
    player.vx += act.moveX * ACCEL * dt;
    player.vy -= act.moveY * ACCEL * dt;
    const damp = Math.exp(-DRAG * dt);
    player.vx *= damp;
    player.vy *= damp;
    const sp = Math.hypot(player.vx, player.vy);
    if (sp > MAX_SPEED) {
      player.vx *= MAX_SPEED / sp;
      player.vy *= MAX_SPEED / sp;
    }
    player.x += player.vx * dt;
    player.y += player.vy * dt;
    if (player.thrusting) {
      particles.push({
        x: player.x - fx * 12,
        y: player.y - fy * 12,
        vx: -fx * 40 + (Math.random() - 0.5) * 24,
        vy: -fy * 40 + (Math.random() - 0.5) * 24,
        life: 0.22,
        max: 0.22,
        size: 1.4 + Math.random(),
        color: "#9eb4c8"
      });
    }
    const d2 = Math.hypot(player.x, player.y) || 1;
    const min = level.planetR + player.r;
    if (d2 < min) {
      const nx = player.x / d2;
      const ny = player.y / d2;
      player.x = nx * min;
      player.y = ny * min;
      const vn = player.vx * nx + player.vy * ny;
      if (vn < 0) {
        player.vx -= vn * nx;
        player.vy -= vn * ny;
        player.squash = 0.86;
      }
    }
    for (let i = 0; i < platforms.length; i++) {
      const p = platforms[i];
      if (!p.alive) continue;
      const hit = circleAabb(player.x, player.y, player.r, p.x, p.y, p.w, p.h);
      if (!hit) continue;
      player.x += hit.nx * hit.pen;
      player.y += hit.ny * hit.pen;
      const vn = player.vx * hit.nx + player.vy * hit.ny;
      if (vn < 0) {
        player.vx -= vn * hit.nx;
        player.vy -= vn * hit.ny;
        player.squash = 0.88;
      }
    }
    if (Math.hypot(player.x, player.y) > VOID_R) kill();
    for (const spk of spikes) {
      if (player.invuln > 0) break;
      const dx = player.x - spk.x;
      const dy = player.y - spk.y;
      if (dx * dx + dy * dy < (player.r + 12) * (player.r + 12)) kill();
    }
    for (const c of coins) {
      if (c.taken) continue;
      const dx = player.x - c.x;
      const dy = player.y - c.y;
      if (dx * dx + dy * dy < 26 * 26) {
        c.taken = true;
        coinCount += 1;
        audio.coin();
        const syn = crystals[(coinCount - 1) % crystals.length];
        burst(c.x, c.y, 16, syn?.type === "antonym" ? "#ef4444" : "#22c55e", 120);
        if (syn) {
          const slot = (coinCount - 1) % crystals.length;
          const first = !syn.collected;
          syn.released = true;
          syn.collected = true;
          syn.x = c.x;
          syn.y = c.y;
          flies.push({
            word: syn.word,
            type: syn.type,
            wx: c.x,
            wy: c.y,
            t: 0,
            slot
          });
          if (syn.type === "antonym") {
            if (typeof audio.antonym === "function") audio.antonym();
            else audio.synonym();
          } else {
            audio.synonym();
          }
          trauma = Math.min(1, trauma + 0.16);
          hooks.onHud(hud());
          if (first && crystals.every(s => s.collected)) audio.flag();
          hooks.onWordCollect?.({
            word: syn.word,
            type: syn.type,
            headword: word.word
          });
        }
        floaters.push({
          x: c.x,
          y: c.y,
          text: "+1",
          life: 0.55,
          max: 0.55,
          kind: "gold"
        });
      }
    }
    for (const b of beacons) {
      const dx = player.x - b.x;
      const dy = player.y - b.y;
      if (dx * dx + dy * dy < 26 * 26) {
        if (!b.armed) {
          b.armed = true;
          audio.checkpoint();
          burst(b.x, b.y, 12, "#7a9e7e", 80);
        }
        spawn = {
          x: b.x,
          y: b.y,
          yaw: player.yaw
        };
      }
    }
    if (magnet > 0) {
      for (const c of coins) {
        if (c.taken) continue;
        const n = pullToward(dt, c.x, c.y);
        c.x = n.x;
        c.y = n.y;
      }
      for (const g of gems) {
        if (g.taken) continue;
        const n = pullToward(dt, g.x, g.y);
        g.x = n.x;
        g.y = n.y;
      }
    }
    if (act.fire && fireCd <= 0) {
      fireCd = FIRE_CD;
      const pd = Math.hypot(player.x, player.y) || 1;
      const bx = -player.x / pd;
      const by = -player.y / pd;
      bullets.push({
        x: player.x + bx * 18,
        y: player.y + by * 18,
        vx: bx * BULLET_SPEED + player.vx * 0.15,
        vy: by * BULLET_SPEED + player.vy * 0.15,
        life: 1.15
      });
      audio.shoot();
      trauma = Math.min(1, trauma + 0.08);
    }
    for (const b of bullets) {
      b.x += b.vx * dt;
      b.y += b.vy * dt;
      b.life -= dt;
      let dead = false;
      for (const p of platforms) {
        if (!p.alive) continue;
        if (!circleAabb(b.x, b.y, 5, p.x, p.y, p.w, p.h)) continue;
        b.life = 0;
        dead = true;
        p.hp -= 1;
        p.flash = 0.12;
        audio.crack();
        burst(b.x, b.y, 8, "#d7c4a3", 90);
        trauma = Math.min(1, trauma + 0.12);
        if (p.hp <= 0) shatter(p);
        break;
      }
      if (dead) continue;
      const bd = Math.hypot(b.x, b.y);
      if (bd < level.planetR + 6 && coreCd <= 0) {
        b.life = 0;
        coreCd = CORE_HIT_CD;
        freeze = 0.04;
        trauma = Math.min(1, trauma + 0.28);
        magnet = MAGNET;
        audio.planetHit();
        burst(b.x, b.y, 16, "#d7c4a3", 150);
      }
    }
    bullets = bullets.filter(b => b.life > 0);
    for (const g of gems) {
      if (g.taken) continue;
      g.bob += dt;
      g.vx *= 1 - 1.4 * dt;
      g.vy *= 1 - 1.4 * dt;
      g.x += g.vx * dt;
      g.y += g.vy * dt;
      const gd = Math.hypot(g.x, g.y) || 1;
      if (gd < level.planetR + 14) {
        const nx = g.x / gd;
        const ny = g.y / gd;
        g.x = nx * (level.planetR + 14);
        g.y = ny * (level.planetR + 14);
      }
      const dx = player.x - g.x;
      const dy = player.y - g.y;
      if (dx * dx + dy * dy < 28 * 28) {
        g.taken = true;
        diamondCount += 1;
        audio.diamond();
        burst(g.x, g.y, 12, "#9eb4c8", 110);
        trauma = Math.min(1, trauma + 0.14);
        hooks.onHud(hud());
      }
    }
    for (const c of crystals) {
      if (!c.released || c.collected) continue;
      c.bob += dt;
      c.vx *= 1 - 1.2 * dt;
      c.vy *= 1 - 1.2 * dt;
      c.x += c.vx * dt;
      c.y += c.vy * dt;
      const cd = Math.hypot(c.x, c.y) || 1;
      if (cd < level.planetR + 16) {
        const nx = c.x / cd;
        const ny = c.y / cd;
        c.x = nx * (level.planetR + 16);
        c.y = ny * (level.planetR + 16);
      }
      const dx = player.x - c.x;
      const dy = player.y - c.y;
      if (dx * dx + dy * dy < 40 * 40) {
        c.collected = true;
        flies.push({
          word: c.word,
          type: c.type,
          wx: c.x,
          wy: c.y,
          t: 0,
          slot: crystals.indexOf(c)
        });
        if (c.type === "antonym") {
          if (typeof audio.antonym === "function") audio.antonym();
          else audio.synonym();
        } else {
          audio.synonym();
        }
        burst(c.x, c.y, 16, c.type === "antonym" ? "#ef4444" : "#22c55e", 110);
        popped = c.word;
        popLife = 2.6;
        trauma = Math.min(1, trauma + 0.2);
        if (crystals.every(s => s.collected)) audio.flag();
        hooks.onWordCollect?.({
          word: c.word,
          type: c.type,
          headword: word.word
        });
      }
    }
    const ready = crystals.every(c => c.collected);
    if (ready) {
      const dx = player.x - flag.x;
      const dy = player.y - flag.y;
      if (dx * dx + dy * dy < 28 * 28) {
        won = true;
        audio.win();
        trauma = 0.4;
        burst(flag.x, flag.y, 28, "#d7c4a3", 150);
        hooks.onWin(hud());
      }
    }
    for (const p of particles) {
      p.x += p.vx * dt;
      p.y += p.vy * dt;
      p.vx *= 0.96;
      p.vy *= 0.96;
      p.life -= dt;
    }
    particles = particles.filter(p => p.life > 0);
    for (const f of floaters) {
      f.y -= (f.kind === "word" ? 18 : 28) * dt;
      f.life -= dt;
    }
    floaters = floaters.filter(f => f.life > 0);
    for (const fly of flies) {
      fly.t += dt / FLY_T;
      if (fly.t >= 1) {
        const syn = crystals[fly.slot];
        if (syn) syn.landed = true;
        popped = fly.word;
        popLife = 1.4;
        hooks.onHud(hud());
      }
    }
    flies = flies.filter(f => f.t < 1);
  }
  function resize() {
    const parent = canvas.parentElement ?? (typeof document !== "undefined" ? document.body : null);
    const w = (parent && parent.clientWidth) || (typeof window !== "undefined" ? window.innerWidth : 800) || 800;
    const h = (parent && parent.clientHeight) || (typeof window !== "undefined" ? window.innerHeight : 600) || 600;
    const dprNow = getAdaptiveDevicePixelRatio(fpsMonitor.isLowSpec);
    dpr = dprNow;
    canvas.width = Math.max(1, Math.floor(w * dprNow));
    canvas.height = Math.max(1, Math.floor(h * dprNow));
    if (canvas.style) {
      canvas.style.width = `${w}px`;
      canvas.style.height = `${h}px`;
    }
  }
  resize();
  window.addEventListener("resize", resize);
  function frame(now) {
    if (!running) return;
    fpsMonitor.tick(now);
    const raw = Math.min(MAX_FRAME, (now - last) / 1000);
    last = now;
    const act = input.sample();
    if (act.pausePressed && !won) {
      paused = !paused;
      hooks.onPause(paused);
    }
    if (!paused && !won) {
      if (freeze > 0) freeze -= raw;else {
        acc += raw;
        while (acc >= FIXED) {
          step(FIXED, act);
          acc -= FIXED;
        }
      }
    }
    anim = now / 1000;
    const shake = reduced ? 0 : trauma * trauma;
    drawWorld(ctx, {
      sprites,
      player,
      platforms,
      coins,
      spikes,
      beacons,
      crystals,
      gems,
      bullets,
      particles,
      floaters,
      flag,
      flagReady: crystals.every(c => c.collected),
      planetR: level.planetR,
      word: word.word,
      magnet,
      time: anim,
      shake,
      deathFlash,
      canvasW: canvas.width,
      canvasH: canvas.height,
      isLowSpec: fpsMonitor.isLowSpec,
      introAnim,
      flies: flies.map(f => {
        const p = projectWorld(f.wx, f.wy, canvas.width, canvas.height, dpr);
        return {
          word: f.word,
          type: f.type || "synonym",
          slot: f.slot,
          x: p.x,
          y: p.y,
          t: f.t
        };
      })
    });
    hudClock += raw;
    if (hudClock > (flies.length ? 0.032 : 0.08)) {
      hudClock = 0;
      hooks.onHud(hud());
    }
    window.__orbitLex = {
      coins: coinCount,
      synonyms: crystals.filter(c => c.collected).length,
      released: crystals.filter(c => c.released).length,
      yaw: player.yaw,
      speed: Math.hypot(player.vx, player.vy),
      fireCd,
      bullets: bullets.length,
      diamonds: diamondCount,
      magnet,
      platHp: platforms.filter(p => p.alive).map(p => p.hp)
    };
    requestAnimationFrame(frame);
  }
  window.__controlsTest = {
    getYaw: () => player.yaw,
    getSpeed: () => Math.hypot(player.vx, player.vy),
    getX: () => player.x,
    getY: () => player.y,
    setKeys: codes => input.setKeys(codes),
    setSteer: v => input.setKeys(v > 0.2 ? ["KeyA"] : v < -0.2 ? ["KeyD"] : []),
    aboutFace: () => input.queueAboutFace()
  };
  requestAnimationFrame(t => {
    last = t;
    requestAnimationFrame(frame);
  });
  return {
    destroy() {
      running = false;
      input.destroy();
      window.removeEventListener("resize", resize);
      if (window.__controlsTest) delete window.__controlsTest;
    },
    pause() {
      paused = true;
    },
    resume() {
      paused = false;
    },
    restart() {
      resetLevel(level.id);
      paused = false;
      hooks.onHud(hud());
    },
    setMuted(m) {
      audio.setMuted(m);
    },
    setMode(newMode) {
      if (session) session.mode = newMode;
      resetLevel(level.id);
      paused = false;
      hooks.onHud(hud());
    },
    unlockAudio() {
      audio.unlock();
    },
    setTouch: input.setTouch,
    setStick: input.setStick,
    queueAboutFace: input.queueAboutFace,
    getHud: hud
  };
}