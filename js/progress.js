// Score, collectibles and achievements, saved per visitor in localStorage.

const KEY = 'super-marwan-progress';

export const ACHIEVEMENTS = [
  { id: 'start', name: 'PRESS START', desc: 'Jump in the title-screen level' },
  { id: 'coin', name: 'FIRST COIN', desc: 'Collect your first coin' },
  { id: 'explorer', name: 'EXPLORER', desc: 'Visit every world' },
  { id: 'bugs', name: 'BUG HUNTER', desc: 'Squash every bug' },
  { id: 'coins', name: 'COIN COLLECTOR', desc: 'Collect every coin' },
  { id: 'oneup', name: '1-UP', desc: 'Find the extra life' },
  { id: 'cv', name: 'GOOD TASTE', desc: 'Download the CV' },
  { id: 'contact', name: 'SAY HI', desc: 'Open a contact link' },
  { id: 'clear', name: 'COURSE CLEAR', desc: 'Reach the final castle' },
  { id: 'secret', name: '2027 MODE', desc: 'Enter the classic cheat code (phones: tap "2027 EDITION" 5×)' },
];

const state = {
  score: 0,
  coins: new Set(),
  bugs: new Set(),
  ach: new Set(),
  visited: new Set(),
  neon: false,
  tipShown: false,
};
export const totals = { coins: 0, bugs: 0, worlds: 0 };

const listeners = new Set();
export function onChange(fn) { listeners.add(fn); fn(state); }
function changed() {
  listeners.forEach((fn) => fn(state));
  save();
}

function save() {
  try {
    localStorage.setItem(KEY, JSON.stringify({
      score: state.score,
      coins: [...state.coins],
      bugs: [...state.bugs],
      ach: [...state.ach],
      visited: [...state.visited],
      neon: state.neon,
      tipShown: state.tipShown,
    }));
  } catch { /* storage unavailable: progress just isn't kept */ }
}

function load() {
  try {
    const saved = JSON.parse(localStorage.getItem(KEY) || 'null');
    if (!saved) return;
    state.score = saved.score || 0;
    for (const key of ['coins', 'bugs', 'ach', 'visited']) state[key] = new Set(saved[key] || []);
    state.neon = !!saved.neon;
    state.tipShown = !!saved.tipShown;
  } catch { /* corrupt or blocked storage: start fresh */ }
}
load();

export function resetProgress() {
  try { localStorage.removeItem(KEY); } catch { /* ignore */ }
  location.reload();
}

export const get = () => state;

// ---------- Toasts ----------
const toastBox = document.getElementById('toasts');
export function toast(title, text, kind = '') {
  const el = document.createElement('div');
  el.className = `toast ${kind}`;
  el.innerHTML = `<strong></strong><span></span>`;
  el.querySelector('strong').textContent = title;
  el.querySelector('span').textContent = text;
  toastBox.append(el);
  while (toastBox.children.length > 3) toastBox.firstElementChild.remove();
  setTimeout(() => el.classList.add('out'), 3200);
  setTimeout(() => el.remove(), 3700);
}

// ---------- Actions ----------
let sfx = {};
export function setSfx(s) { sfx = s; }

export function addScore(n) {
  state.score += n;
  changed();
}

export function unlock(id) {
  if (state.ach.has(id)) return;
  state.ach.add(id);
  const a = ACHIEVEMENTS.find((x) => x.id === id);
  state.score += 500;
  toast('★ ACHIEVEMENT', a.name, 'ach');
  sfx.achievement?.();
  changed();
  if (state.ach.size === ACHIEVEMENTS.length) {
    setTimeout(() => toast('★ 100% COMPLETE', 'Thanks for playing! Now hire Marwan.', 'ach'), 1200);
  }
}

export function collectCoin(id) {
  if (state.coins.has(id)) return false;
  state.coins.add(id);
  state.score += 200;
  sfx.coin?.();
  changed();
  unlock('coin');
  if (totals.coins && state.coins.size >= totals.coins) unlock('coins');
  return true;
}

export function squashBug(id) {
  if (state.bugs.has(id)) return false;
  state.bugs.add(id);
  state.score += 100;
  sfx.stomp?.();
  changed();
  if (totals.bugs && state.bugs.size >= totals.bugs) unlock('bugs');
  return true;
}

export function visit(world) {
  if (state.visited.has(world)) return false;
  state.visited.add(world);
  if (state.visited.size > 1) state.score += 1000;
  changed();
  if (totals.worlds && state.visited.size >= totals.worlds) unlock('explorer');
  return true;
}

export function setNeon(on) {
  state.neon = on;
  changed();
}

export function markTipShown() {
  state.tipShown = true;
  save();
}
