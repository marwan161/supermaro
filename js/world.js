import { SPR } from './sprites.js';
import * as P from './progress.js';

const reducedMotion = matchMedia('(prefers-reduced-motion: reduce)').matches;

// Float a sprite up from an element (coin, heart…) and fade it out.
export function popSprite(fromEl, sprite, cls = 'pop-coin') {
  const r = fromEl.getBoundingClientRect();
  const img = document.createElement('img');
  img.src = sprite.toDataURL();
  img.className = cls;
  img.alt = '';
  img.style.left = `${r.left + r.width / 2 - 8 + scrollX}px`;
  img.style.top = `${r.top - 24 + scrollY}px`;
  document.body.append(img);
  img.addEventListener('animationend', () => img.remove());
}

// ---------- Hidden coins & bugs ----------
// [left %, top %] inside each section, chosen to sit in margins and headers.
const COIN_SPOTS = {
  about: [[5, 18], [94, 64]],
  work: [[3, 30], [95, 74]],
  projects: [[6, 62], [93, 22]],
  skills: [[4, 50], [95, 86]],
  awards: [[93, 16], [5, 66]],
  contact: [[8, 26], [91, 20]],
};
const BUG_WORLDS = ['about', 'projects', 'skills', 'awards'];

export function initCollectibles() {
  const state = P.get();

  for (const [section, spots] of Object.entries(COIN_SPOTS)) {
    const host = document.getElementById(section);
    spots.forEach(([left, top], i) => {
      const id = `${section}-${i}`;
      P.totals.coins++;
      if (state.coins.has(id)) return;
      const btn = document.createElement('button');
      btn.type = 'button';
      btn.className = 'coin-pickup';
      btn.setAttribute('aria-label', 'Collect hidden coin');
      btn.style.left = `${left}%`;
      btn.style.top = `${top}%`;
      btn.style.animationDelay = `${-(i * 0.37 + left / 100)}s`;
      btn.addEventListener('click', () => {
        popSprite(btn, SPR.coin);
        P.collectCoin(id);
        btn.remove();
      });
      host.append(btn);
    });
  }

  for (const section of BUG_WORLDS) {
    const host = document.getElementById(section);
    const id = `bug-${section}`;
    P.totals.bugs++;
    if (state.bugs.has(id)) continue;
    const lane = document.createElement('div');
    lane.className = 'bug-lane';
    const bug = document.createElement('button');
    bug.type = 'button';
    bug.className = 'bug';
    bug.setAttribute('aria-label', 'Squash the bug');
    bug.style.animationDelay = `${-Math.random() * 12}s, 0s`;
    bug.addEventListener('click', () => {
      if (bug.classList.contains('squashed')) return;
      // Freeze where it was, since dropping the patrol animation resets `left`
      const cs = getComputedStyle(bug);
      bug.style.left = cs.left;
      bug.style.transform = cs.transform;
      bug.classList.add('squashed');
      P.squashBug(id);
      setTimeout(() => lane.remove(), 700);
    });
    lane.append(bug);
    host.append(lane);
  }
}

// Skill blocks and title-screen blocks are also coins (one each).
export function registerBlockCoins(count) {
  P.totals.coins += count;
}

// ---------- 1-UP behind the avatar ----------
export function initOneUp(avatar) {
  avatar.addEventListener('click', () => {
    avatar.classList.remove('wiggle');
    void avatar.offsetWidth;
    avatar.classList.add('wiggle');
    if (P.get().ach.has('oneup')) return;
    popSprite(avatar, SPR.heart, 'pop-heart');
    P.toast('1-UP!', 'An extra life. You found the secret.', 'oneup');
    P.unlock('oneup');
  });
}

// ---------- Bottom progress track ----------
export function initTrack(sections) {
  const track = document.getElementById('track');
  const line = track.querySelector('.track-line');
  const runner = track.querySelector('.runner');
  const markers = sections.map((section) => {
    const b = document.createElement('button');
    b.type = 'button';
    b.className = 'marker';
    b.dataset.world = section.dataset.world;
    b.title = `WORLD ${section.dataset.world}`;
    b.setAttribute('aria-label', `Go to world ${section.dataset.world}`);
    b.innerHTML = `<span>${section.dataset.world}</span>`;
    b.addEventListener('click', () => section.scrollIntoView({ behavior: reducedMotion ? 'auto' : 'smooth' }));
    line.append(b);
    return { b, section };
  });

  const maxScroll = () => Math.max(1, document.documentElement.scrollHeight - innerHeight);
  const place = (el, p) => { el.style.left = `calc(${(p * 100).toFixed(2)}% - 12px)`; };

  function layout() {
    for (const { b, section } of markers) place(b, Math.min(1, section.offsetTop / maxScroll()));
    update();
  }

  let lastY = scrollY;
  let stopTimer;
  function update() {
    place(runner, Math.min(1, scrollY / maxScroll()));
    if (scrollY !== lastY) {
      runner.classList.toggle('left', scrollY < lastY);
      runner.classList.add('running');
      clearTimeout(stopTimer);
      stopTimer = setTimeout(() => runner.classList.remove('running'), 160);
    }
    lastY = scrollY;
  }

  P.onChange((state) => {
    for (const { b } of markers) b.classList.toggle('visited', state.visited.has(b.dataset.world));
  });
  addEventListener('scroll', update, { passive: true });
  addEventListener('resize', layout);
  new ResizeObserver(layout).observe(document.body);
  layout();
}

// ---------- Course clear: flag slide + fireworks ----------
export function initFinale(section, sfx) {
  const flagpole = section.querySelector('.flagpole');
  const canvas = document.createElement('canvas');
  canvas.className = 'fireworks';
  canvas.setAttribute('aria-hidden', 'true');
  section.prepend(canvas);
  const ctx = canvas.getContext('2d');
  let fired = false;

  function fireworks() {
    if (reducedMotion) return;
    const scale = 4;
    canvas.width = Math.ceil(section.clientWidth / scale);
    canvas.height = Math.ceil(section.clientHeight / scale);
    const colors = ['#fcc419', '#ff4fd8', '#16b3a4', '#ffffff', '#6d9cff', '#5ad13a'];
    const parts = [];
    const burst = (n) => {
      const x = canvas.width * (0.2 + Math.random() * 0.6);
      const y = canvas.height * (0.12 + Math.random() * 0.25);
      const color = colors[n % colors.length];
      for (let i = 0; i < 28; i++) {
        const a = (i / 28) * Math.PI * 2;
        const v = 0.9 + Math.random() * 0.6;
        parts.push({ x, y, vx: Math.cos(a) * v, vy: Math.sin(a) * v, life: 60 + Math.random() * 20, color });
      }
      sfx.firework?.();
    };
    for (let i = 0; i < 5; i++) setTimeout(() => burst(i), i * 450);
    const start = performance.now();
    (function tick(now) {
      ctx.clearRect(0, 0, canvas.width, canvas.height);
      for (const p of parts) {
        if (p.life <= 0) continue;
        p.x += p.vx; p.y += p.vy; p.vy += 0.03; p.vx *= 0.98; p.life--;
        ctx.globalAlpha = Math.min(1, p.life / 30);
        ctx.fillStyle = p.color;
        ctx.fillRect(Math.round(p.x), Math.round(p.y), 1, 1);
      }
      ctx.globalAlpha = 1;
      if (now - start < 4500) requestAnimationFrame(tick);
      else ctx.clearRect(0, 0, canvas.width, canvas.height);
    })(start);
  }

  new IntersectionObserver(([entry]) => {
    if (!entry.isIntersecting || fired) return;
    fired = true;
    flagpole.classList.add('cleared');
    sfx.fanfare?.();
    fireworks();
    if (!P.get().ach.has('clear')) {
      P.addScore(5000);
      P.toast('COURSE CLEAR!', 'Time bonus +5000', 'clear');
      P.unlock('clear');
    }
  }, { threshold: 0.35 }).observe(section);
}

// ---------- Secret 2027 mode ----------
const KONAMI = ['ArrowUp', 'ArrowUp', 'ArrowDown', 'ArrowDown', 'ArrowLeft', 'ArrowRight', 'ArrowLeft', 'ArrowRight', 'KeyB', 'KeyA'];

export function initSecret(tapTarget, onToggle) {
  const apply = (on) => {
    document.documentElement.classList.toggle('neon', on);
    onToggle?.(on);
  };
  apply(P.get().neon);

  const toggle = () => {
    const on = !P.get().neon;
    P.setNeon(on);
    apply(on);
    P.toast(on ? '2027 MODE: ON' : '2027 MODE: OFF', on ? 'Welcome to the future.' : 'Back to classic.', 'secret');
    P.unlock('secret');
  };

  let pos = 0;
  addEventListener('keydown', (e) => {
    pos = e.code === KONAMI[pos] ? pos + 1 : (e.code === KONAMI[0] ? 1 : 0);
    if (pos === KONAMI.length) { pos = 0; toggle(); }
  });

  let taps = [];
  tapTarget.addEventListener('click', () => {
    const now = Date.now();
    taps = taps.filter((t) => now - t < 2000).concat(now);
    if (taps.length >= 5) { taps = []; toggle(); }
  });
}
