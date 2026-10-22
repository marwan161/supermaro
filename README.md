# Super Marwan · 2027 portfolio

A Super-Mario-style portfolio: a playable mini level on the title screen (each ? block jumps to a section), followed by a scrolling site of "worlds". All pixel art is original and drawn in code; no Nintendo assets are used.

Plain static HTML/CSS/JS, so there's no build step.

## Run locally

```sh
python3 -m http.server 5173
# open http://localhost:5173
```

(Opening `index.html` straight from disk won't work, because ES modules need a server.)

## Edit content

Everything you read is in `index.html`, one `<section>` per world. To change the CV, replace `assets/Marwan_Amr_CV.pdf`.

| File | What it is |
|---|---|
| `index.html` | All page content |
| `styles.css` | Look and layout |
| `js/sprites.js` | Pixel art (character, blocks, castle…) |
| `js/game.js` | Title-screen mini level |
| `js/main.js` | Wires everything up: HUD, sound, pause menu, controls |
| `js/progress.js` | Score, coins, bugs, achievements (saved in the visitor's browser) |
| `js/world.js` | Hidden coins, bugs, bottom progress track, castle finale, secret 2027 mode |

Hidden coin positions are in `COIN_SPOTS` and the bug worlds are in `BUG_WORLDS`, both at the top of `js/world.js`. Achievements are listed in `js/progress.js`.

## Deploy (GitHub → Vercel)

1. Push this folder to a GitHub repo.
2. On vercel.com: **Add New → Project → Import** the repo.
3. Framework preset: **Other**. Leave the build command empty and the output directory as `.`.
4. Deploy. Every push to `main` redeploys automatically.
