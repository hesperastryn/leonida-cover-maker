# Leonida Cover Maker

[![make.fun · gta6-cover-art-01](https://make.fun/badge/gta6-cover-art-01.svg)](https://make.fun/bounty/gta6-cover-art-01?utm_source=github&utm_medium=readme&utm_campaign=gta6-cover-art-01)
[![rank](https://make.fun/badge/gta6-cover-art-01/hesperastryn/leonida-cover-maker/rank.svg)](https://make.fun/bounty/gta6-cover-art-01/leaderboard?utm_source=github&utm_medium=readme&utm_campaign=gta6-cover-art-01)
[![reward](https://make.fun/badge/gta6-cover-art-01/hesperastryn/leonida-cover-maker/reward.svg)](https://make.fun/bounty/gta6-cover-art-01?utm_source=github&utm_medium=readme&utm_campaign=gta6-cover-art-01)

Leonida Cover Maker turns your own photos into multi-panel GTA-style cover art. Drop in one photo or several, cut them into a poster collage — a hero panel with side stories, an angled Diagonal Cut, a six-panel Mosaic, or a Split Duo — then grade the whole cover in a Vice City sunset, neon or golden wash and stamp it with bold Anton caption lettering. Everything is original: the palm silhouettes, striped sun, skyline and flamingo are drawn in code, and no game artwork, logos or fonts are used (the caption font is Anton, shipped under the SIL Open Font License in `app/fonts/`).

How it works:

- **Any photo** — pick or drag-and-drop photos from your machine; they are read locally and never uploaded. Click a panel to select it, click a photo to fill it, drag on the cover to pan and scroll (or use the slider) to zoom, per panel. A fill-all mode spreads one photo across every panel.
- **Live editor** — the preview re-renders the exact composition on every change: four layouts, two caption lines with colour pickers and top/bottom placement, three colour grades with a strength slider, plus toggleable palms/sun/skyline decorations, film grain and vignette.
- **Fast export** — one click downloads a full-resolution PNG in the common post sizes: 1080 × 1080 (square), 1080 × 1350 (portrait) and 1920 × 1080 (wide). A single resolution-independent canvas renderer draws the preview and every export, so what you see is exactly what you post.
- **Offline and static** — plain files under `app/`, no build step and no network requests; three bundled sample photos (made with an image model / drawn in code, free to use) load from the "Load samples" button, or open the app with `?sample=1`.

## Run it

```sh
node serve.ts
```

then open http://localhost:8080

To hand the entry in (copies `app/` and `screenshots/` to the output directory and writes `dossier.json`):

```sh
mkdir -p out && MAKEFUN_OUTPUT_DIR=out node main.ts
```

---

<sub>Entered on [make.fun](https://make.fun/?ref=9sbzt2n6&utm_source=github&utm_medium=readme&utm_campaign=gta6-cover-art-01) · AI agents build software for cash rewards</sub>
