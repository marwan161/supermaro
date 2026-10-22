import { SPR, exposeSpritesToCSS } from './sprites.js';
import { startGame } from './game.js';
import * as P from './progress.js';
import {
  popSprite, initCollectibles, registerBlockCoins, initOneUp, initTrack, initFinale, initSecret,
} from './world.js';

exposeSpritesToCSS();

const reducedMotion = matchMedia('(prefers-reduced-motion: reduce)').matches;

// ---------- Sound (off by default) ----------
let audio = null;
let soundOn = false;
const soundBtn = document.getElementById('sound');

function tone(freqs, step = 0.06, type = 'square', gain = 0.05) {
  if (!soundOn) return;
  audio ??= new AudioContext();
  const t0 = audio.currentTime;
  const g = audio.createGain();
  g.gain.setValueAtTime(gain, t0);
  g.gain.exponentialRampToValueAtTime(0.0001, t0 + step * freqs.length + 0.08);
  g.connect(audio.destination);
  const osc = audio.createOscillator();
  osc.type = type;
  freqs.forEach((f, i) => osc.frequency.setValueAtTime(f, t0 + i * step));
  osc.connect(g);
  osc.start(t0);
  osc.stop(t0 + step * freqs.length + 0.1);
}
// Schedule a short tune: each note is [frequency, startStep, lengthInSteps].
function song(notes, { step = 0.11, type = 'square', gain = 0.04 } = {}) {
  if (!soundOn) return;
  audio ??= new AudioContext();
  const t0 = audio.currentTime + 0.05;
  for (const [freq, at, len] of notes) {
    const start = t0 + at * step;
    const end = start + len * step;
    const g = audio.createGain();
    g.gain.setValueAtTime(gain, start);
    g.gain.setValueAtTime(gain, end - 0.03);
    g.gain.linearRampToValueAtTime(0.0001, end);
    g.connect(audio.destination);
    const osc = audio.createOscillator();
    osc.type = type;
    osc.frequency.setValueAtTime(freq, start);
    osc.connect(g);
    osc.start(start);
    osc.stop(end + 0.02);
  }
}

// Original entry jingle (lead + bass), about two seconds long
const N = { G2: 98, C3: 131, F3: 175, G3: 196, C5: 523, E5: 659, G5: 784, A5: 880, B5: 988, C6: 1047, D6: 1175, E6: 1319 };
function playIntro() {
  song([
    [N.C5, 0, 1], [N.E5, 1, 1], [N.G5, 2, 1], [N.C6, 3, 2], [N.G5, 5, 1], [N.C6, 6, 1], [N.E6, 7, 3],
    [N.D6, 11, 1], [N.C6, 12, 1], [N.B5, 13, 1], [N.C6, 14, 5],
  ], { type: 'square', gain: 0.035 });
  song([
    [N.C3, 0, 3], [N.G3, 3, 1], [N.C3, 4, 3], [N.F3, 7, 3], [N.G2, 10, 4], [N.C3, 14, 5],
  ], { type: 'triangle', gain: 0.09 });
}

const sfx = {
  coin: () => tone([988, 1319], 0.07),
  jump: () => tone([300, 420, 560, 700], 0.025, 'square', 0.035),
  bump: () => tone([140, 110], 0.04, 'triangle', 0.08),
  stomp: () => tone([220, 160, 110], 0.04, 'square', 0.06),
  world: () => tone([523, 659, 784, 1047], 0.08, 'square', 0.03),
  achievement: () => tone([784, 988, 1175, 1568], 0.07, 'square', 0.035),
  oneup: () => tone([659, 784, 1319, 1047, 1175, 1568], 0.08, 'square', 0.035),
  firework: () => tone([90, 60], 0.08, 'sawtooth', 0.03),
  fanfare: () => tone([392, 523, 659, 784, 659, 784, 1047], 0.11, 'square', 0.035),
};
P.setSfx(sfx);

function setSound(on) {
  soundOn = on;
  soundBtn.textContent = soundOn ? '♪ ON' : '♪ OFF';
  soundBtn.setAttribute('aria-pressed', String(soundOn));
}
soundBtn.addEventListener('click', () => {
  setSound(!soundOn);
  if (soundOn) sfx.coin();
});

// ---------- PRESS START screen (once per session; also unlocks audio) ----------
const intro = document.getElementById('intro');
let introOpen = false;
let afterIntro = [];
try { introOpen = !sessionStorage.getItem('intro-seen'); } catch { introOpen = false; }

function closeIntro(withSound) {
  if (!introOpen) return;
  introOpen = false;
  try { sessionStorage.setItem('intro-seen', '1'); } catch { /* ignore */ }
  if (withSound) {
    setSound(true);
    playIntro();
  }
  intro.classList.add('leaving');
  setTimeout(() => { intro.hidden = true; }, 650);
  document.body.style.overflow = '';
  afterIntro.forEach((fn) => fn());
  afterIntro = [];
}
if (introOpen) {
  intro.hidden = false;
  document.body.style.overflow = 'hidden';
  document.getElementById('intro-start').focus();
  intro.addEventListener('click', (e) => closeIntro(!e.target.closest('#intro-mute')));
  addEventListener('keydown', (e) => {
    if (!introOpen) return;
    e.preventDefault();
    e.stopImmediatePropagation();
    closeIntro(e.code !== 'Escape');
  }, { capture: true });
}
const whenStarted = (fn) => (introOpen ? afterIntro.push(fn) : fn());

// ---------- Collectibles ----------
const skillBlocks = [...document.querySelectorAll('.qbtn')];
const heroBlocks = [
  { label: 'ABOUT', target: '#about' },
  { label: 'WORK', target: '#work' },
  { label: 'PROJECTS', target: '#projects' },
  { label: 'SKILLS', target: '#skills' },
  { label: 'CONTACT', target: '#contact' },
];
initCollectibles();
registerBlockCoins(skillBlocks.length + heroBlocks.length);

skillBlocks.forEach((btn, i) => {
  const id = `skill-${i}`;
  if (P.get().coins.has(id)) btn.classList.add('used');
  btn.addEventListener('click', () => {
    if (btn.classList.contains('used')) return;
    btn.classList.add('used', 'bump');
    popSprite(btn, SPR.coin);
    P.collectCoin(id);
    setTimeout(() => btn.classList.remove('bump'), 200);
  });
});

initOneUp(document.querySelector('.avatar'));

// Achievements for the real-world actions recruiters take
document.querySelectorAll('a[download]').forEach((a) => a.addEventListener('click', () => P.unlock('cv')));
document.querySelectorAll('.contact-links a:not([download])')
  .forEach((a) => a.addEventListener('click', () => P.unlock('contact')));

// ---------- HUD ----------
const scoreEl = document.getElementById('score');
const coinsEl = document.getElementById('coins');
const worldEl = document.getElementById('world');
const starsEl = document.getElementById('stars');
P.onChange((state) => {
  scoreEl.textContent = String(state.score).padStart(6, '0');
  coinsEl.textContent = '×' + String(state.coins.size).padStart(2, '0');
  starsEl.textContent = `★ ${state.ach.size}/${P.ACHIEVEMENTS.length}`;
});

const sections = [...document.querySelectorAll('section[data-world]')];
P.totals.worlds = sections.length;
const sectionObserver = new IntersectionObserver((entries) => {
  for (const entry of entries) {
    if (!entry.isIntersecting) continue;
    const world = entry.target.dataset.world;
    worldEl.textContent = world;
    if (P.visit(world) && P.get().visited.size > 1) sfx.world();
  }
}, { rootMargin: '-45% 0px -45% 0px' });
sections.forEach((s) => sectionObserver.observe(s));

// ---------- Pause menu ----------
const menu = document.getElementById('menu');
const achList = document.getElementById('ach-list');
const menuStats = document.getElementById('menu-stats');

function renderMenu() {
  const s = P.get();
  const pct = Math.round((s.ach.size / P.ACHIEVEMENTS.length) * 100);
  menuStats.innerHTML = '';
  for (const [label, value] of [
    ['SCORE', String(s.score).padStart(6, '0')],
    ['COINS', `${s.coins.size}/${P.totals.coins}`],
    ['BUGS', `${s.bugs.size}/${P.totals.bugs}`],
    ['WORLDS', `${s.visited.size}/${P.totals.worlds}`],
    ['COMPLETE', `${pct}%`],
  ]) {
    const li = document.createElement('li');
    li.innerHTML = '<span></span><strong></strong>';
    li.firstChild.textContent = label;
    li.lastChild.textContent = value;
    menuStats.append(li);
  }
  achList.innerHTML = '';
  for (const a of P.ACHIEVEMENTS) {
    const got = s.ach.has(a.id);
    const li = document.createElement('li');
    li.className = got ? 'got' : '';
    li.innerHTML = '<i aria-hidden="true"></i><div><strong></strong><span></span></div>';
    li.querySelector('i').textContent = got ? '★' : '?';
    li.querySelector('strong').textContent = got || a.id !== 'secret' ? a.name : '???';
    li.querySelector('span').textContent = a.desc;
    li.setAttribute('aria-label', `${a.name}: ${got ? 'unlocked' : 'locked'}`);
    achList.append(li);
  }
}

function openMenu() {
  renderMenu();
  menu.showModal();
  menu.scrollTop = 0;
  game.setRunning(false);
}
document.getElementById('stars').addEventListener('click', openMenu);
document.getElementById('menu-resume').addEventListener('click', () => menu.close());
document.getElementById('menu-reset').addEventListener('click', () => P.resetProgress());
menu.addEventListener('close', () => game.setRunning(heroVisible));
menu.addEventListener('click', (e) => { if (e.target === menu) menu.close(); });
addEventListener('keydown', (e) => {
  if (e.code !== 'KeyP' || e.target.closest?.('input, textarea')) return;
  menu.open ? menu.close() : openMenu();
});

// ---------- Title-screen mini level ----------
const canvas = document.getElementById('game');
const hero = document.getElementById('start');
const hint = document.getElementById('hint');

const game = startGame(canvas, {
  blocks: heroBlocks,
  onCoin: (block) => P.collectCoin(`hero-${block.label}`),
  onJump: () => { sfx.jump(); P.unlock('start'); },
  onBump: sfx.bump,
  onHit: (block) => {
    document.querySelector(block.target)
      .scrollIntoView({ behavior: reducedMotion ? 'auto' : 'smooth' });
  },
});

let heroVisible = true;
new IntersectionObserver(([entry]) => {
  heroVisible = entry.isIntersecting;
  game.setRunning(heroVisible && !menu.open);
}, { threshold: 0.15 }).observe(hero);

const KEYMAP = {
  ArrowLeft: 'left', KeyA: 'left',
  ArrowRight: 'right', KeyD: 'right',
  ArrowUp: 'jump', KeyW: 'jump', Space: 'jump',
};
function onKey(e, down) {
  const key = KEYMAP[e.code];
  if (!key || !heroVisible || menu.open || introOpen) return;
  // Leave keys alone while the user is on a link, button or form field
  if (e.target.closest?.('a, button, input, textarea, select')) return;
  // Arrow keys should still scroll the page once the player stops playing
  if (scrollY > hero.offsetHeight * 0.5) return;
  e.preventDefault();
  game.keys[key] = down;
  if (down) hint.classList.add('played');
}
addEventListener('keydown', (e) => onKey(e, true));
addEventListener('keyup', (e) => onKey(e, false));
addEventListener('blur', () => { game.keys.left = game.keys.right = game.keys.jump = false; });

// Touch controls
document.querySelectorAll('.touchpad button').forEach((btn) => {
  const key = btn.dataset.key;
  const set = (v) => (e) => { e.preventDefault(); game.keys[key] = v; btn.classList.toggle('down', v); };
  btn.addEventListener('pointerdown', set(true));
  btn.addEventListener('pointerup', set(false));
  btn.addEventListener('pointercancel', set(false));
  btn.addEventListener('pointerleave', set(false));
});

// ---------- World extras ----------
initTrack(sections);
initFinale(document.getElementById('contact'), sfx);
initSecret(document.querySelector('.eyebrow'), (on) => {
  game.setSky(on ? '#2a0c08' : '#6b8cff');
});

// First visit: tell people there's a game to play
if (!P.get().tipShown) {
  whenStarted(() => setTimeout(() => {
    P.toast('PLAYER 1, READY?', `Find ${P.totals.coins} coins and ${P.totals.bugs} bugs. ★ shows your progress.`, 'tip');
    P.markTipShown();
  }, 2200));
}
