import {
  containsRtlScript,
  drawLocalizedText,
  getLocalizedBoxMetrics,
} from "../../../../lib/i18n/canvasTextHelper";

const STARS = [];
(function seedStars() {
  let s = 1337;
  const rnd = () => {
    s = s * 16807 % 2147483647;
    return (s - 1) / 2147483646;
  };
  for (let i = 0; i < 160; i++) {
    STARS.push({
      x: (rnd() - 0.5) * 1200,
      y: (rnd() - 0.5) * 1200,
      s: 0.6 + rnd() * 1.6,
      a: 0.25 + rnd() * 0.55
    });
  }
})();
let camX = 0;
let camY = 0;
export function projectWorld(x, y, canvasW, canvasH, dpr) {
  const view = 430;
  const scale = Math.min(canvasW, canvasH) / (view * 2);
  return {
    x: (canvasW / 2 + (x - camX) * scale) / dpr,
    y: (canvasH / 2 + (y - camY) * scale) / dpr
  };
}
function blit(ctx, img, x, y, w, h, rot = 0, flipX = false) {
  ctx.save();
  ctx.translate(x, y);
  ctx.rotate(rot);
  if (flipX) ctx.scale(-1, 1);
  ctx.drawImage(img, -w / 2, -h / 2, w, h);
  ctx.restore();
}
function safeRoundRect(ctx, x, y, w, h, r) {
  if (typeof ctx.roundRect === "function") {
    ctx.roundRect(x, y, w, h, r);
  } else {
    ctx.rect(x, y, w, h);
  }
}
export function drawWorld(ctx, st) {
  const {
    canvasW: W,
    canvasH: H,
    sprites: sp,
    player: p,
    time
  } = st;
  ctx.setTransform(1, 0, 0, 1, 0, 0);
  ctx.clearRect(0, 0, W, H);
  if (st.isLowSpec) {
    ctx.fillStyle = "#0c0e16";
    ctx.fillRect(0, 0, W, H);
  } else {
    const g = ctx.createRadialGradient(W * 0.5, H * 0.45, 0, W * 0.5, H * 0.5, Math.max(W, H) * 0.7);
    g.addColorStop(0, "#141824");
    g.addColorStop(0.55, "#0c0e16");
    g.addColorStop(1, "#07080d");
    ctx.fillStyle = g;
    ctx.fillRect(0, 0, W, H);
  }
  const view = 430;
  const scale = Math.min(W, H) / (view * 2);
  camX += (p.x * 0.18 - camX) * 0.08;
  camY += (p.y * 0.18 - camY) * 0.08;
  const jx = (Math.random() * 2 - 1) * st.shake * 14;
  const jy = (Math.random() * 2 - 1) * st.shake * 14;
  ctx.save();
  ctx.translate(W / 2 + jx, H / 2 + jy);
  ctx.scale(scale, scale);
  ctx.translate(-camX, -camY);
  const starCount = st.isLowSpec ? Math.ceil(STARS.length * 0.3) : STARS.length;
  for (let sIdx = 0; sIdx < starCount; sIdx++) {
    const star = STARS[sIdx];
    ctx.globalAlpha = star.a * (0.7 + 0.3 * Math.sin(time * 1.4 + star.x));
    ctx.fillStyle = "#e8e6df";
    ctx.beginPath();
    ctx.arc(star.x * 0.85, star.y * 0.85, star.s, 0, Math.PI * 2);
    ctx.fill();
  }
  ctx.globalAlpha = 1;
  ctx.strokeStyle = "rgba(183,192,204,0.08)";
  ctx.lineWidth = 1.2;
  for (const r of [st.planetR + 70, st.planetR + 140, st.planetR + 220]) {
    ctx.beginPath();
    ctx.arc(0, 0, r, 0, Math.PI * 2);
    ctx.stroke();
  }
  if (!st.isLowSpec) {
    const glow = ctx.createRadialGradient(0, 0, st.planetR * 0.2, 0, 0, st.planetR * 1.55);
    glow.addColorStop(0, "rgba(215,196,163,0.22)");
    glow.addColorStop(1, "rgba(215,196,163,0)");
    ctx.fillStyle = glow;
    ctx.beginPath();
    ctx.arc(0, 0, st.planetR * 1.55, 0, Math.PI * 2);
    ctx.fill();
  }
  const pr = st.planetR * 2.12;
  blit(ctx, sp.planet, 0, 0, pr, pr);
  ctx.textAlign = "center";
  ctx.textBaseline = "middle";
  const fontSize = clampFont(st.word.length, st.planetR);
  ctx.font = `600 ${fontSize}px Fraunces, Georgia, serif`;
  ctx.lineJoin = "round";
  ctx.miterLimit = 2;
  drawLocalizedText(ctx, st.word, 0, -2, {
    stroke: true,
    fill: true,
    strokeStyle: "rgba(9,11,16,0.72)",
    lineWidth: 5,
    fillStyle: "#f4efe4",
  });
  if (st.magnet > 0) {
    ctx.strokeStyle = `rgba(215,196,163,${0.25 + st.magnet})`;
    ctx.lineWidth = 2;
    ctx.beginPath();
    ctx.arc(0, 0, st.planetR + 10 + (0.7 - st.magnet) * 28, 0, Math.PI * 2);
    ctx.stroke();
  }
  for (const plat of st.platforms) {
    if (!plat.alive) continue;
    const dmg = 1 - plat.hp / plat.maxHp;
    ctx.globalAlpha = 1;
    blit(ctx, sp.platform, plat.x, plat.y, plat.w + 8, plat.h + 10);
    if (dmg > 0.02) {
      ctx.strokeStyle = `rgba(9,11,16,${0.25 + dmg * 0.55})`;
      ctx.lineWidth = 1.4;
      const hw = plat.w * 0.4;
      const hh = plat.h * 0.28;
      ctx.beginPath();
      ctx.moveTo(plat.x - hw, plat.y - hh * dmg);
      ctx.lineTo(plat.x + hw * 0.2, plat.y + hh);
      if (dmg > 0.35) {
        ctx.moveTo(plat.x - hw * 0.2, plat.y + hh);
        ctx.lineTo(plat.x + hw, plat.y - hh);
      }
      if (dmg > 0.65) {
        ctx.moveTo(plat.x - hw * 0.6, plat.y);
        ctx.lineTo(plat.x + hw * 0.6, plat.y + hh * 0.4);
      }
      ctx.stroke();
    }
    if (plat.flash > 0) {
      ctx.globalAlpha = plat.flash * 4;
      ctx.fillStyle = "#f4efe4";
      ctx.fillRect(plat.x - plat.w / 2, plat.y - plat.h / 2, plat.w, plat.h);
      ctx.globalAlpha = 1;
    }
    const pip = 3.2;
    const span = (plat.maxHp - 1) * 5;
    for (let i = 0; i < plat.maxHp; i++) {
      ctx.fillStyle = i < plat.hp ? "#d7c4a3" : "rgba(236,238,242,0.18)";
      ctx.beginPath();
      ctx.arc(plat.x - span / 2 + i * 5, plat.y + plat.h / 2 + 8, pip / 2, 0, Math.PI * 2);
      ctx.fill();
    }
  }
  for (const spk of st.spikes) {
    blit(ctx, sp.spike, spk.x, spk.y, 28, 20, spk.a + Math.PI / 2);
  }
  const ci = Math.floor(time * 8) % 4;
  for (const c of st.coins) {
    if (c.taken) continue;
    const bob = Math.sin(time * 3 + c.phase) * 3;
    ctx.save();
    ctx.shadowColor = "#facc15";
    ctx.shadowBlur = 8;
    blit(ctx, sp.coin[ci], c.x, c.y + bob, 16, 16);
    ctx.restore();
  }
  for (const g of st.gems) {
    if (g.taken) continue;
    const bob = Math.sin(time * 5 + g.bob) * 3;
    ctx.save();
    ctx.shadowColor = "#22d3ee";
    ctx.shadowBlur = 8;
    blit(ctx, sp.crystal[ci], g.x, g.y + bob, 18, 18);
    ctx.restore();
  }
  for (const b of st.beacons) {
    const pulse = b.armed ? 1 : 0.55 + 0.15 * Math.sin(time * 3);
    ctx.globalAlpha = pulse;
    blit(ctx, sp.checkpoint, b.x, b.y, 14, 36);
    ctx.globalAlpha = 1;
    if (b.armed) {
      ctx.strokeStyle = "rgba(34,211,238,0.6)";
      ctx.lineWidth = 1.5;
      ctx.beginPath();
      ctx.arc(b.x, b.y - 10, 10 + Math.sin(time * 4) * 2, 0, Math.PI * 2);
      ctx.stroke();
    }
  }
  ctx.globalAlpha = st.flagReady ? 1 : 0.38;
  blit(ctx, sp.flag, st.flag.x, st.flag.y, 22, 40);
  ctx.globalAlpha = 1;
  if (st.flagReady) {
    ctx.save();
    ctx.shadowColor = "#10b981";
    ctx.shadowBlur = 12;
    ctx.strokeStyle = "rgba(16,185,129,0.8)";
    ctx.lineWidth = 1.6;
    ctx.beginPath();
    ctx.arc(st.flag.x, st.flag.y - 8, 14 + Math.sin(time * 5) * 2, 0, Math.PI * 2);
    ctx.stroke();
    ctx.restore();
  }
  for (const c of st.crystals) {
    if (!c.released || c.collected) continue;
    const bob = Math.sin(time * 4 + c.bob) * 4;
    ctx.save();
    if (c.type === "antonym") {
      ctx.shadowColor = "#ef4444";
      ctx.shadowBlur = 16;
    } else {
      ctx.shadowColor = "#22c55e";
      ctx.shadowBlur = 16;
    }
    blit(ctx, sp.crystal[ci], c.x, c.y + bob, 22, 22);
    ctx.restore();
  }
  const bi = Math.floor(time * 12) % 4;
  for (const b of st.bullets) {
    const rot = Math.atan2(b.vy, b.vx);
    blit(ctx, sp.bolt[bi], b.x, b.y, 18, 10, rot);
  }
  const hidden = p.invuln > 0 && Math.floor(time * 16) % 2 === 0;
  if (!hidden) {
    const si = Math.floor(time * (p.thrusting ? 12 : 6)) % 4;
    const rot = -p.yaw;
    const sh = 30 * p.squash;
    const sw = 30 / p.squash;
    blit(ctx, sp.ship[si], p.x, p.y, sw, sh, rot);
    const fx = -Math.sin(p.yaw);
    const fy = -Math.cos(p.yaw);
    ctx.fillStyle = "#d7c4a3";
    ctx.beginPath();
    ctx.arc(p.x + fx * 16, p.y + fy * 16, 2.1, 0, Math.PI * 2);
    ctx.fill();
    if (p.aboutFlash > 0) {
      ctx.strokeStyle = `rgba(215,196,163,${p.aboutFlash * 2.2})`;
      ctx.lineWidth = 2;
      ctx.beginPath();
      ctx.arc(p.x, p.y, 20 + (0.28 - p.aboutFlash) * 40, 0, Math.PI * 2);
      ctx.stroke();
    }
    const pd = Math.hypot(p.x, p.y) || 1;
    ctx.strokeStyle = "rgba(215,196,163,0.22)";
    ctx.lineWidth = 1;
    ctx.setLineDash([4, 6]);
    ctx.beginPath();
    ctx.moveTo(p.x - p.x / pd * 18, p.y - p.y / pd * 18);
    ctx.lineTo(p.x * 0.12, p.y * 0.12);
    ctx.stroke();
    ctx.setLineDash([]);
  }
  for (const pt of st.particles) {
    ctx.globalAlpha = Math.max(0, pt.life / pt.max);
    ctx.fillStyle = pt.color;
    ctx.beginPath();
    ctx.arc(pt.x, pt.y, pt.size, 0, Math.PI * 2);
    ctx.fill();
  }
  ctx.globalAlpha = 1;
  ctx.font = "600 12px Outfit, sans-serif";
  ctx.textAlign = "center";
  ctx.textBaseline = "middle";
  for (const f of st.floaters) {
    if (f.kind === "word") continue;
    ctx.globalAlpha = Math.max(0, f.life / f.max);
    ctx.fillStyle = "#f4efe4";
    ctx.fillText(f.text, f.x, f.y);
  }
  ctx.globalAlpha = 1;
  ctx.restore();

  // Screen-Space Overlays (Star Wars Crawl, Exploding & Gliding Word Chips)
  if (st.introAnim && st.introAnim.active) {
    drawIntroCinematic(ctx, st.introAnim, W, H);
  }
  if (st.flies && st.flies.length) {
    drawFlies(ctx, st.flies, W, H);
  }

  if (st.deathFlash > 0) {
    ctx.fillStyle = `rgba(196,92,92,${st.deathFlash * 0.35})`;
    ctx.fillRect(0, 0, W, H);
  }
}

function drawIntroCinematic(ctx, intro, W, H) {
  const cx = W / 2;
  const cy = H / 2;
  const t = intro.time;

  // 1. Target word in center
  ctx.save();
  const wordPulse = 1.0 + 0.03 * Math.sin(t * 5);
  let wordAlpha = Math.min(1.0, t * 5.0);
  if (t > 2.3) {
    wordAlpha = Math.max(0, (2.8 - t) / 0.5);
  }
  ctx.translate(cx, cy - 12);
  ctx.scale(wordPulse, wordPulse);
  ctx.globalAlpha = wordAlpha;
  ctx.textAlign = "center";
  ctx.textBaseline = "middle";

  ctx.font = '900 36px "Orbitron", Fraunces, sans-serif';
  ctx.shadowColor = "#38bdf8";
  ctx.shadowBlur = 24;
  ctx.fillStyle = "#ffffff";
  drawLocalizedText(ctx, intro.word, 0, 0);
  ctx.restore();

  // 2. Turkish/Translated meaning in Star Wars 3D crawl (completely silent)
  if (intro.turkish && t < 2.5) {
    const crawlProgress = Math.min(1.0, t / 2.3);
    const startY = cy + 42;
    const endY = cy - 220;
    const curY = startY + (endY - startY) * crawlProgress;
    const scale = Math.max(0.18, 1.0 - crawlProgress * 0.76);

    let crawlAlpha = 1.0;
    if (crawlProgress < 0.12) crawlAlpha = crawlProgress / 0.12;
    else if (crawlProgress > 0.6) crawlAlpha = Math.max(0, (1.0 - crawlProgress) / 0.4);

    ctx.save();
    ctx.translate(cx, curY);
    ctx.scale(scale, scale * 0.82);
    ctx.globalAlpha = crawlAlpha;
    ctx.textAlign = "center";
    ctx.textBaseline = "middle";

    ctx.font = 'bold 30px "Space Grotesk", Arial, sans-serif';
    ctx.fillStyle = "#fbbf24";
    ctx.shadowColor = "#f59e0b";
    ctx.shadowBlur = 16;
    drawLocalizedText(ctx, intro.turkish, 0, 0);
    ctx.restore();
  }

  // 3. Synonyms & Antonyms burst and glide to HUD slots
  if (t >= 0.45 && intro.chips && intro.chips.length) {
    for (const chip of intro.chips) {
      const isAnt = chip.type === "antonym";
      const glowColor = isAnt ? "#f87171" : "#4ade80";
      const bgFill = isAnt ? "rgba(136, 19, 55, 0.92)" : "rgba(6, 78, 59, 0.92)";
      const borderStroke = isAnt ? "rgba(239, 68, 68, 0.9)" : "rgba(34, 197, 94, 0.9)";

      const targetX = Math.min(W * 0.22, 110);
      const subIdx = chip.slotIndex % 3;
      const targetY = isAnt
        ? (intro.chips.length > 3 ? 248 : 148) + subIdx * 28
        : 148 + subIdx * 28;

      let curX = cx;
      let curY = cy;
      let chipAlpha = 1.0;
      let chipScale = 1.0;

      if (t < 0.95) {
        // Burst phase
        const bp = (t - 0.45) / 0.5;
        const easeBurst = 1 - Math.pow(1 - bp, 3);
        curX = cx + chip.apexWx * easeBurst;
        curY = cy + chip.apexWy * easeBurst;
        chipScale = 0.6 + 0.5 * easeBurst;
        chipAlpha = Math.min(1.0, bp * 2.2);
      } else if (t < 2.15) {
        // Glide phase towards slot
        const gp = (t - 0.95) / 1.2;
        const easeGlide = gp < 0.5 ? 4 * gp * gp * gp : 1 - Math.pow(-2 * gp + 2, 3) / 2;

        const startX = cx + chip.apexWx;
        const startY = cy + chip.apexWy;

        curX = startX + (targetX - startX) * easeGlide;
        curY = startY + (targetY - startY) * easeGlide;
        chipScale = 1.1 - 0.2 * easeGlide;
        chipAlpha = 1.0;
      } else {
        // Landed phase
        const lp = Math.min(1.0, (t - 2.15) / 0.35);
        curX = targetX;
        curY = targetY;
        chipAlpha = Math.max(0, 1.0 - lp);
        chipScale = 0.9;
      }

      if (chipAlpha <= 0) continue;

      ctx.save();
      ctx.translate(curX, curY);
      ctx.scale(chipScale, chipScale);
      ctx.globalAlpha = chipAlpha;

      ctx.font = 'bold 15px "Space Grotesk", sans-serif';
      ctx.textAlign = "center";
      ctx.textBaseline = "middle";

      const labelText = (isAnt ? "🔴 " : "🟢 ") + chip.word;
      const boxMetrics = getLocalizedBoxMetrics(ctx, labelText, 15, 13, 6.5);
      const bw = boxMetrics.width;
      const bh = boxMetrics.height;

      ctx.shadowColor = glowColor;
      ctx.shadowBlur = 18;

      ctx.fillStyle = bgFill;
      ctx.beginPath();
      safeRoundRect(ctx, -bw / 2, -bh / 2, bw, bh, 8);
      ctx.fill();

      ctx.strokeStyle = borderStroke;
      ctx.lineWidth = 2;
      ctx.stroke();

      ctx.fillStyle = "#ffffff";
      ctx.shadowBlur = 8;
      drawLocalizedText(ctx, labelText, 0, 1 + boxMetrics.verticalOffset);
      ctx.restore();
    }
  }
}

function drawFlies(ctx, flies, W, H) {
  if (!flies || !flies.length) return;
  for (const f of flies) {
    const isAnt = f.type === "antonym";
    const glowColor = isAnt ? "#f87171" : "#4ade80";
    const bgFill = isAnt ? "rgba(136, 19, 55, 0.92)" : "rgba(6, 78, 59, 0.92)";
    const borderStroke = isAnt ? "rgba(239, 68, 68, 0.9)" : "rgba(34, 197, 94, 0.9)";

    const targetX = Math.min(W * 0.22, 110);
    const subIdx = (f.slot || 0) % 3;
    const targetY = isAnt ? 248 + subIdx * 28 : 148 + subIdx * 28;

    const t = Math.min(1.0, f.t);
    const ease = t < 0.5 ? 4 * t * t * t : 1 - Math.pow(-2 * t + 2, 3) / 2;

    const curX = f.x + (targetX - f.x) * ease;
    const curY = f.y + (targetY - f.y) * ease;
    const scale = 1.1 - 0.2 * ease;

    ctx.save();
    ctx.translate(curX, curY);
    ctx.scale(scale, scale);

    ctx.font = 'bold 15px "Space Grotesk", sans-serif';
    ctx.textAlign = "center";
    ctx.textBaseline = "middle";

    const labelText = (isAnt ? "🔴 " : "🟢 ") + f.word;
    const boxMetrics = getLocalizedBoxMetrics(ctx, labelText, 15, 12, 6.5);
    const bw = boxMetrics.width;
    const bh = boxMetrics.height;

    ctx.shadowColor = glowColor;
    ctx.shadowBlur = 16;
    ctx.fillStyle = bgFill;
    ctx.beginPath();
    safeRoundRect(ctx, -bw / 2, -bh / 2, bw, bh, 8);
    ctx.fill();

    ctx.strokeStyle = borderStroke;
    ctx.lineWidth = 2;
    ctx.stroke();

    ctx.fillStyle = "#ffffff";
    drawLocalizedText(ctx, labelText, 0, 1 + boxMetrics.verticalOffset);
    ctx.restore();
  }
}
function clampFont(len, planetR) {
  const max = planetR * 0.42;
  const byLen = planetR * 1.7 / Math.max(6, len);
  return Math.max(14, Math.min(max, byLen));
}
function drawWordChip(ctx, x, y, text, fontPx, alpha) {
  ctx.save();
  ctx.globalAlpha = Math.max(0, Math.min(1, alpha));
  ctx.font = `600 ${Math.round(fontPx)}px Fraunces, Georgia, serif`;
  ctx.textAlign = "center";
  ctx.textBaseline = "middle";
  const isRtl = containsRtlScript(text);
  const rtlScale = isRtl ? 1.15 : 1.0;
  const boxMetrics = getLocalizedBoxMetrics(
    ctx,
    text,
    fontPx,
    fontPx * 0.48,
    fontPx * 0.36
  );
  const bw = boxMetrics.width;
  const bh = Math.round((fontPx + fontPx * 0.36 * 2) * rtlScale);
  ctx.fillStyle = "rgba(9,11,16,0.38)";
  ctx.beginPath();
  safeRoundRect(ctx, x - bw / 2, y - bh / 2, bw, bh, Math.min(14, fontPx * 0.28));
  ctx.fill();
  ctx.strokeStyle = "rgba(215,196,163,0.28)";
  ctx.lineWidth = 1.2;
  ctx.stroke();
  ctx.fillStyle = "#f4efe4";
  drawLocalizedText(ctx, text, x, y + 1 + boxMetrics.verticalOffset);
  ctx.restore();
}