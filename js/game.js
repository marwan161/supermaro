import { SPR } from './sprites.js';

// The title-screen mini level. Each ? block is a section link: hit it from
// below and the page scrolls to that section.

const BASE_H = 224;     // logical height in pixels (NES-ish)
const MIN_W = 240;      // narrowest logical width before we add sky instead
const GRAVITY = 0.45;
const JUMP_V = -7.6;
const ACCEL = 0.32;
const MAX_V = 2.3;

export function startGame(canvas, { blocks, onHit, onCoin, onJump, onBump }) {
  const ctx = canvas.getContext('2d');
  const keys = { left: false, right: false, jump: false };
  const coins = [];
  const clouds = [{ x: 20, y: 18 }, { x: 150, y: 40 }, { x: 290, y: 12 }, { x: 420, y: 34 }];
  const player = { x: 24, y: 0, w: 12, h: 16, vx: 0, vy: 0, onGround: true, facing: 1, anim: 0 };
  let H = BASE_H;
  let GROUND = H - 32;  // top of the ground
  let BLOCK_Y = GROUND - 68;
  let viewW = 256;
  let worldW = 256;
  let cam = 0;
  let solids = [];
  let running = true;
  let jumpHeld = false;
  let last = performance.now();
  let sky = '#6b8cff';

  function layout() {
    const rect = canvas.getBoundingClientRect();
    const aspect = rect.width / Math.max(rect.height, 1);
    H = BASE_H;
    viewW = Math.round(H * aspect);
    if (viewW < MIN_W) {
      viewW = MIN_W;
      H = Math.round(MIN_W / aspect);
    }
    GROUND = H - 32;
    BLOCK_Y = GROUND - 68;
    canvas.width = viewW;
    canvas.height = H;
    ctx.imageSmoothingEnabled = false;
    const spacing = 64;
    worldW = Math.max(viewW, 72 + blocks.length * spacing);
    const start = (worldW - (blocks.length - 1) * spacing) / 2 - 8;
    solids = blocks.map((b, i) => ({
      ...b, x: Math.round(start + i * spacing), y: BLOCK_Y, w: 16, h: 16, bump: 0, used: 0,
    }));
    // Start just left of the first block so the player sees what to do
    player.x = Math.max(8, solids[0].x - 40);
    player.y = GROUND - player.h;
    player.vx = player.vy = 0;
  }

  const overlaps = (a, b) => a.x < b.x + b.w && a.x + a.w > b.x && a.y < b.y + b.h && a.y + a.h > b.y;

  function hit(block) {
    if (block.used > 0) return;
    block.bump = 8;
    block.used = 50;
    coins.push({ x: block.x + 4, y: block.y - 14, vy: -4.5, life: 34 });
    onBump?.();
    onCoin?.(block);
    setTimeout(() => onHit?.(block), 420);
  }

  function update(dt) {
    if (keys.left) { player.vx -= ACCEL * dt; player.facing = -1; }
    if (keys.right) { player.vx += ACCEL * dt; player.facing = 1; }
    if (!keys.left && !keys.right) player.vx *= Math.pow(0.78, dt);
    player.vx = Math.max(-MAX_V, Math.min(MAX_V, player.vx));
    if (Math.abs(player.vx) < 0.05) player.vx = 0;

    if (keys.jump && !jumpHeld && player.onGround) {
      player.vy = JUMP_V;
      player.onGround = false;
      onJump?.();
    }
    jumpHeld = keys.jump;
    // Short hop when the jump key is released early
    if (!keys.jump && player.vy < -3) player.vy = -3;

    player.x += player.vx * dt;
    player.x = Math.max(0, Math.min(worldW - player.w, player.x));
    for (const s of solids) {
      if (!overlaps(player, s)) continue;
      player.x = player.vx > 0 ? s.x - player.w : s.x + s.w;
      player.vx = 0;
    }

    player.vy = Math.min(player.vy + GRAVITY * dt, 8);
    player.y += player.vy * dt;
    player.onGround = false;
    for (const s of solids) {
      if (!overlaps(player, s)) continue;
      if (player.vy > 0) {
        player.y = s.y - player.h;
        player.onGround = true;
      } else {
        player.y = s.y + s.h;
        hit(s);
      }
      player.vy = 0;
    }
    if (player.y + player.h >= GROUND) {
      player.y = GROUND - player.h;
      player.vy = 0;
      player.onGround = true;
    }

    player.anim += Math.abs(player.vx) * dt * 0.12;
    for (const s of solids) {
      if (s.bump > 0) s.bump -= dt;
      if (s.used > 0) s.used -= dt;
    }
    for (const c of coins) { c.y += c.vy * dt; c.vy += 0.3 * dt; c.life -= dt; }
    while (coins.length && coins[0].life <= 0) coins.shift();
    for (const c of clouds) c.x = (c.x - 0.08 * dt + worldW + 60) % (worldW + 60);

    const target = player.x + player.w / 2 - viewW / 2;
    cam = Math.max(0, Math.min(worldW - viewW, target));
  }

  function draw() {
    ctx.fillStyle = sky;
    ctx.fillRect(0, 0, viewW, H);

    const px = (x, factor) => Math.round(x - cam * factor);
    for (let x = -40; x < worldW + 80; x += 220) ctx.drawImage(SPR.hill, px(x, 0.5), GROUND - 40);
    for (const c of clouds) ctx.drawImage(SPR.cloud, px(c.x - 60, 0.3), c.y + (H - BASE_H) * 0.6);
    for (let x = 100; x < worldW + 80; x += 190) ctx.drawImage(SPR.bush, px(x, 1), GROUND - 16);

    for (let x = 0; x < worldW; x += 16) {
      ctx.drawImage(SPR.ground, px(x, 1), GROUND);
      ctx.drawImage(SPR.ground, px(x, 1), GROUND + 16);
    }

    for (const c of coins) ctx.drawImage(SPR.coin, px(c.x, 1), Math.round(c.y));

    ctx.font = '8px "Press Start 2P", monospace';
    ctx.textAlign = 'center';
    for (const s of solids) {
      const y = s.y - (s.bump > 0 ? Math.round(Math.sin((s.bump / 8) * Math.PI) * 5) : 0);
      ctx.drawImage(s.used > 0 ? SPR.usedBlock : SPR.qblock, px(s.x, 1), y);
      const tx = px(s.x + 8, 1);
      ctx.fillStyle = '#111111';
      ctx.fillText(s.label, tx + 1, s.y + 31);
      ctx.fillStyle = '#ffffff';
      ctx.fillText(s.label, tx, s.y + 30);
    }

    const left = player.facing < 0 ? 'L' : '';
    let sprite = SPR['heroIdle' + left];
    if (!player.onGround) sprite = SPR['heroJump' + left];
    else if (Math.abs(player.vx) > 0.2) sprite = SPR[(Math.floor(player.anim) % 2 ? 'heroRun1' : 'heroRun2') + left];
    ctx.drawImage(sprite, px(player.x - 2, 1), Math.round(player.y));
  }

  function frame(now) {
    const dt = Math.min((now - last) / (1000 / 60), 3);
    last = now;
    if (running) {
      update(dt);
      draw();
    }
    requestAnimationFrame(frame);
  }

  layout();
  new ResizeObserver(layout).observe(canvas);
  document.fonts?.load('8px "Press Start 2P"').then(draw);
  requestAnimationFrame(frame);

  return {
    keys,
    setSky(color) {
      sky = color;
      draw();
    },
    setRunning(value) {
      running = value;
      last = performance.now();
    },
  };
}
