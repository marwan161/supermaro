// All pixel art is original and drawn in code. Each sprite is a small canvas
// that gets stretched with `image-rendering: pixelated`.

function canvas(w, h) {
  const c = document.createElement('canvas');
  c.width = w;
  c.height = h;
  return c;
}

// Build a sprite from rows of characters; '.' is transparent.
function fromRows(rows, pal) {
  const c = canvas(rows[0].length, rows.length);
  const ctx = c.getContext('2d');
  rows.forEach((row, y) => {
    [...row].forEach((ch, x) => {
      if (ch === '.') return;
      ctx.fillStyle = pal[ch];
      ctx.fillRect(x, y, 1, 1);
    });
  });
  return c;
}

function flip(src) {
  const c = canvas(src.width, src.height);
  const ctx = c.getContext('2d');
  ctx.translate(src.width, 0);
  ctx.scale(-1, 1);
  ctx.drawImage(src, 0, 0);
  return c;
}

// ---------- Player: Marwan in a teal hoodie ----------
const HERO_PAL = {
  K: '#111111', S: '#f4b384', H: '#3a2416', T: '#16b3a4', D: '#0b6d64',
  B: '#2a4795', Y: '#6b3a12',
};
const HEAD = [
  '................',
  '.....HHHHHH.....',
  '....HHHHHHHH....',
  '....HHHSSSSS....',
  '....HHSSSSKSS...',
  '....HSSSSSKSS...',
  '....HSSSSSSSSS..',
  '.....SSSSKKKS...',
  '......SSSSSS....',
];
const heroIdle = fromRows([...HEAD,
  '....TTTTTTTT....',
  '...TTTDTTDTTT...',
  '...SSTTTTTTSS...',
  '....BBBBBBBB....',
  '....BBB..BBB....',
  '....BBB..BBB....',
  '...YYYY..YYYY...',
], HERO_PAL);
const heroRun1 = fromRows([...HEAD,
  '....TTTTTTTT....',
  '...TTTDTTDTTT...',
  '...SSTTTTTTSS...',
  '....BBBBBBBB....',
  '...BBB....BBB...',
  '..BBB......BBB..',
  '.YYY........YYY.',
], HERO_PAL);
const heroRun2 = fromRows([...HEAD,
  '....TTTTTTTT....',
  '...TTTDTTDTTT...',
  '...SSTTTTTTSS...',
  '....BBBBBBBB....',
  '.....BBBBBB.....',
  '......BBBB......',
  '.....YYYYYY.....',
], HERO_PAL);
const heroJump = fromRows([...HEAD,
  '....TTTTTTTTSS..',
  '...TTTDTTDTTS...',
  '...SSTTTTTT.....',
  '....BBBBBBBB....',
  '...BBB...BBB....',
  '..BBB.....BBB...',
  '..YY.......YY...',
], HERO_PAL);

// ---------- Blocks & items ----------
const QBLOCK_PAL = { D: '#9c4a00', Y: '#fca044', K: '#111111', W: '#fff4d6' };
const qblock = fromRows([
  'DDDDDDDDDDDDDDDD',
  'DYYYYYYYYYYYYYYK',
  'DYKYYYYYYYYYYKYK',
  'DYYYYWWWWWYYYYYK',
  'DYYYWWKKKWWYYYYK',
  'DYYYWWKYYWWKYYYK',
  'DYYYYKKYYWWKYYYK',
  'DYYYYYYYWWWKYYYK',
  'DYYYYYYWWKKKYYYK',
  'DYYYYYYWWKYYYYYK',
  'DYYYYYYYKKYYYYYK',
  'DYYYYYYWWYYYYYYK',
  'DYYYYYYWWKYYYYYK',
  'DYKYYYYYKKYYYKYK',
  'DYYYYYYYYYYYYYYK',
  'KKKKKKKKKKKKKKKK',
], QBLOCK_PAL);
const usedBlock = fromRows([
  'KKKKKKKKKKKKKKKK',
  'KDDDDDDDDDDDDDDK',
  'KDKDDDDDDDDDDKDK',
  'KDDDDDDDDDDDDDDK',
  'KDDDDDDDDDDDDDDK',
  'KDDDDDDDDDDDDDDK',
  'KDDDDDDDDDDDDDDK',
  'KDDDDDDDDDDDDDDK',
  'KDDDDDDDDDDDDDDK',
  'KDDDDDDDDDDDDDDK',
  'KDDDDDDDDDDDDDDK',
  'KDDDDDDDDDDDDDDK',
  'KDDDDDDDDDDDDDDK',
  'KDKDDDDDDDDDDKDK',
  'KDDDDDDDDDDDDDDK',
  'KKKKKKKKKKKKKKKK',
], { K: '#111111', D: '#a0522d' });

const coin = fromRows([
  '..KKKK..',
  '.KYYYYK.',
  'KYWYYYOK',
  'KYWYYYOK',
  'KYWYOYOK',
  'KYWYOYOK',
  'KYWYOYOK',
  'KYWYOYOK',
  'KYWYOYOK',
  'KYWYOYOK',
  'KYWYYYOK',
  'KYWYYYOK',
  '.KYYYYK.',
  '..KKKK..',
], { K: '#111111', Y: '#fcc419', W: '#fff9db', O: '#c27c0e' });

const star = fromRows([
  '.......KK.......',
  '......KYYK......',
  '......KYYK......',
  '.....KYYYYK.....',
  'KKKKKKYYYYKKKKKK',
  'KYYYYYYYYYYYYYYK',
  '.KYYYKYYYYKYYYK.',
  '..KYYKYYYYKYYK..',
  '...KYYYYYYYYK...',
  '...KYYYYYYYYK...',
  '..KYYYYYYYYYYK..',
  '..KYYYYKKYYYYK..',
  '.KYYYKK..KKYYYK.',
  '.KYYK......KYYK.',
  'KYKK........KKYK',
  'KK............KK',
], { K: '#111111', Y: '#fcc419' });

// ---------- Tiles ----------
function bricks(base, dark, light) {
  const c = canvas(16, 16);
  const ctx = c.getContext('2d');
  ctx.fillStyle = base;
  ctx.fillRect(0, 0, 16, 16);
  ctx.fillStyle = dark;
  ctx.fillRect(0, 7, 16, 1);
  ctx.fillRect(0, 15, 16, 1);
  ctx.fillRect(15, 0, 1, 7);
  ctx.fillRect(7, 8, 1, 7);
  ctx.fillStyle = light;
  ctx.fillRect(0, 0, 15, 1);
  ctx.fillRect(0, 8, 7, 1);
  ctx.fillRect(8, 8, 8, 1);
  return c;
}

function groundTile(base, dark, light) {
  const c = canvas(16, 16);
  const ctx = c.getContext('2d');
  ctx.fillStyle = base;
  ctx.fillRect(0, 0, 16, 16);
  ctx.fillStyle = light;
  ctx.fillRect(0, 0, 16, 1);
  ctx.fillRect(0, 0, 1, 16);
  ctx.fillRect(9, 1, 1, 6);
  ctx.fillStyle = dark;
  ctx.fillRect(15, 0, 1, 16);
  ctx.fillRect(0, 15, 16, 1);
  ctx.fillRect(8, 0, 1, 9);
  ctx.fillRect(1, 9, 8, 1);
  ctx.fillRect(10, 10, 5, 1);
  ctx.fillRect(10, 7, 1, 3);
  return c;
}

// Pixelated blob (clouds, bushes, hills): a union of circles with a 1px outline.
function blob(w, h, circles, fill, outline, spots) {
  const c = canvas(w, h);
  const ctx = c.getContext('2d');
  const inside = (x, y) =>
    circles.some(([cx, cy, r]) => (x + 0.5 - cx) ** 2 + (y + 0.5 - cy) ** 2 <= r * r);
  for (let y = 0; y < h; y++) {
    for (let x = 0; x < w; x++) {
      if (!inside(x, y)) continue;
      const edge = !inside(x - 1, y) || !inside(x + 1, y) || !inside(x, y - 1) || !inside(x, y + 1);
      ctx.fillStyle = edge ? outline : fill;
      ctx.fillRect(x, y, 1, 1);
    }
  }
  if (spots) {
    ctx.fillStyle = outline;
    spots.forEach(([x, y, sw, sh]) => ctx.fillRect(x, y, sw, sh));
  }
  return c;
}

const cloud = blob(48, 24, [[12, 15, 8], [24, 10, 10], [36, 15, 8], [24, 17, 7]], '#ffffff', '#111111');
const bush = blob(48, 16, [[12, 12, 8], [24, 8, 10], [36, 12, 8], [24, 16, 8]], '#5ad13a', '#0b5e12');
const hill = blob(80, 40, [[40, 40, 38]], '#2e9e3a', '#0b4d14', [[30, 14, 2, 6], [46, 20, 2, 6], [38, 28, 2, 6]]);

function castle() {
  const c = canvas(80, 80);
  const ctx = c.getContext('2d');
  const tile = bricks('#c84c0c', '#111111', '#fcbcb0');
  for (let y = 16; y < 80; y += 16) for (let x = 0; x < 80; x += 16) ctx.drawImage(tile, x, y);
  ctx.clearRect(0, 16, 16, 16);
  ctx.clearRect(64, 16, 16, 16);
  for (let x = 16; x < 64; x += 16) ctx.drawImage(tile, x, 0);
  // Crenellations
  for (let x = 0; x < 80; x += 8) {
    if ((x / 8) % 2 === 1) {
      ctx.clearRect(x, x < 16 || x >= 64 ? 32 : 0, 8, 6);
    }
  }
  ctx.fillStyle = '#111111';
  ctx.fillRect(34, 56, 12, 24);
  ctx.fillRect(36, 54, 8, 2);
  ctx.fillRect(28, 6, 6, 8);
  ctx.fillRect(46, 6, 6, 8);
  ctx.fillStyle = '#fcc419';
  ctx.fillRect(29, 8, 4, 5);
  ctx.fillRect(47, 8, 4, 5);
  return c;
}

const flag = fromRows([
  'KKKKKKKKKKKK....',
  'KTTTTTTTTTTTKK..',
  'KTWTTTTTWTTTTTK.',
  'KTWWTTTWWTTTTTTK',
  'KTWTWTWTWTTTTTK.',
  'KTWTTWTTWTTTKK..',
  'KTWTTTTTWTKK....',
  'KKKKKKKKKKK.....',
], { K: '#111111', T: '#16b3a4', W: '#ffffff' });

// ---------- Enemies & extras ----------
const BUG_PAL = { K: '#111111', P: '#8e44ad', L: '#d7a6ef', W: '#ffffff' };
const BUG_BODY = [
  '...K........K...',
  '....K......K....',
  '.....KKKKKK.....',
  '...KKPPPPPPKK...',
  '..KPPWWPPWWPPK..',
  '..KPPWKPPWKPPK..',
  '.KPPPPPPPPPPPPK.',
  '.KPLPPPPPPPPLPK.',
  '.KPPPPLLLLPPPPK.',
  '..KPPPPPPPPPPK..',
  '...KKKKKKKKKK...',
];
const bugA = fromRows([...BUG_BODY,
  '..K..K....K..K..',
  '.K..K......K..K.',
  '................',
], BUG_PAL);
const bugB = fromRows([...BUG_BODY,
  '...K.K....K.K...',
  '...K..K..K..K...',
  '................',
], BUG_PAL);
const bugSquashed = fromRows([
  '................',
  '................',
  '................',
  '................',
  '................',
  '................',
  '................',
  '................',
  '.KKKKKKKKKKKKKK.',
  'KPPWKPPPPWKPPPPK',
  'KPPPPPPPPPPPPPPK',
  '.KKKKKKKKKKKKKK.',
  '..K..K....K..K..',
  '................',
], BUG_PAL);

const heart = fromRows([
  '.KKK...KKK.',
  'KGGGK.KGGGK',
  'KGWGGKGGGGK',
  'KGWGGGGGGGK',
  'KGGGGGGGGGK',
  '.KGGGGGGGK.',
  '..KGGGGGK..',
  '...KGGGK...',
  '....KGK....',
  '.....K.....',
], { K: '#111111', G: '#3ad15a', W: '#e6ffe9' });

// Two frames side by side, for CSS `steps(2)` walk cycles
function sheet(...frames) {
  const c = canvas(frames.reduce((w, f) => w + f.width, 0), frames[0].height);
  const ctx = c.getContext('2d');
  let x = 0;
  for (const f of frames) { ctx.drawImage(f, x, 0); x += f.width; }
  return c;
}

export const SPR = {
  bugSheet: sheet(bugA, bugB), bugSquashed, heart,
  heroRunSheet: sheet(heroRun1, heroRun2),
  heroIdle, heroRun1, heroRun2, heroJump,
  heroIdleL: flip(heroIdle), heroRun1L: flip(heroRun1),
  heroRun2L: flip(heroRun2), heroJumpL: flip(heroJump),
  qblock, usedBlock, coin, star, cloud, bush, hill, flag,
  ground: groundTile('#c84c0c', '#111111', '#fcbcb0'),
  brick: bricks('#c84c0c', '#111111', '#fcbcb0'),
  undergroundBrick: bricks('#1f4fa8', '#071a3d', '#6d9cff'),
  undergroundFloor: groundTile('#1f4fa8', '#071a3d', '#6d9cff'),
  castle: castle(),
};

// Publish sprites as CSS custom properties so stylesheets can use them.
export function exposeSpritesToCSS() {
  const root = document.documentElement.style;
  const names = {
    ground: 'ground', brick: 'brick', 'ug-brick': 'undergroundBrick', 'ug-floor': 'undergroundFloor',
    qblock: 'qblock', 'used-block': 'usedBlock', coin: 'coin', star: 'star', cloud: 'cloud',
    bush: 'bush', hill: 'hill', castle: 'castle', flag: 'flag', hero: 'heroIdle',
    'hero-jump': 'heroJump', 'hero-run': 'heroRunSheet', bug: 'bugSheet',
    'bug-squashed': 'bugSquashed', heart: 'heart',
  };
  for (const [cssName, key] of Object.entries(names)) {
    root.setProperty(`--img-${cssName}`, `url(${SPR[key].toDataURL()})`);
  }
}
