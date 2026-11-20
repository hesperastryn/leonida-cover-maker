// Leonida Cover Maker — editor wiring. Owns the cover state, loads the person's photos locally
// (file picker, drag-and-drop and bundled samples), handles per-panel select / pan / zoom on the
// preview canvas, and exports the composition as a full-resolution PNG through the same
// resolution-independent renderer the preview uses (./cover.js). Shot scenes live in ./shots.js.

import { drawCover } from './cover.js';
import { LAYOUTS, getLayout, pointInPanel } from './layouts.js';
import { applyScene, markShotReady, shotParams } from './shots.js';

const $ = (id) => document.getElementById(id);
const canvas = $('cover');
const ctx = canvas.getContext('2d');
const status = $('status');

const FORMATS = {
  '1080x1080': { w: 1080, h: 1080, label: 'Square' },
  '1080x1350': { w: 1080, h: 1350, label: 'Portrait' },
  '1920x1080': { w: 1920, h: 1080, label: 'Wide' },
};
let formatKey = '1080x1080';

export const state = {
  layoutId: 'hero',
  title: 'Vice Nights',
  subtitle: 'Leonida • Est. 2026',
  titleColor: '#ffd23e',
  accentColor: '#ff5da2',
  captionPos: 'bottom',
  gradeName: 'sunset',
  gradeAmt: 0.9,
  grain: true,
  vignette: true,
  decor: true,
  fillAll: false,
  panels: [],
  photos: [],
};
let selected = 0;
let activePhoto = -1;

/** Creates the empty per-panel cells for a layout, keeping photos where the panel still exists. */
function setLayout(id) {
  const layout = getLayout(id);
  const old = state.panels;
  state.layoutId = layout.id;
  state.panels = layout.panels.map((_, i) => old[i] ?? { photo: null, zoom: 1, ox: 0, oy: 0 });
  if (selected >= state.panels.length) selected = 0;
  document.querySelectorAll('#layoutBtns button').forEach((b) => {
    b.classList.toggle('on', b.dataset.layout === layout.id);
  });
  syncPanelUi();
}

/** Loads an image from a URL or object URL, resolving once it can be drawn. */
export function loadImage(url) {
  return new Promise((resolve, reject) => {
    const img = new Image();
    img.onload = () => resolve(img);
    img.onerror = reject;
    img.src = url;
  });
}

/** Redraws the live preview at the current format's aspect ratio. */
function redraw() {
  const f = FORMATS[formatKey];
  const scale = Math.min(940 / f.w, 940 / f.h);
  canvas.width = Math.round(f.w * scale);
  canvas.height = Math.round(f.h * scale);
  drawCover(ctx, canvas.width, canvas.height, state, selected);
}

/** Keeps the panel label and zoom slider in step with the selected panel. */
function syncPanelUi() {
  $('panelLabel').textContent = `Panel ${selected + 1} of ${state.panels.length} selected`;
  const cell = state.panels[selected];
  if (cell) $('zoom').value = String(cell.zoom || 1);
}

/** Assigns a loaded photo to the selected panel — or to every panel in fill-all mode. */
function assignPhoto(index) {
  const img = state.photos[index];
  if (!img) return;
  activePhoto = index;
  if (state.fillAll) {
    state.panels.forEach((cell) => { cell.photo = img; });
  } else {
    state.panels[selected].photo = img;
  }
  renderThumbs();
  redraw();
}

/** Rebuilds the photo thumbnail strip, marking the photo used by the selected panel. */
function renderThumbs() {
  const box = $('thumbs');
  box.innerHTML = '';
  state.photos.forEach((img, i) => {
    const b = document.createElement('button');
    b.type = 'button';
    b.className = 'thumb' + (state.panels[selected] && state.panels[selected].photo === img ? ' on' : '');
    const t = document.createElement('img');
    t.src = img.src;
    t.alt = `Photo ${i + 1}`;
    b.appendChild(t);
    b.addEventListener('click', () => assignPhoto(i));
    box.appendChild(b);
  });
}

/** Adds photos from File objects (picker or drop) — read locally, never uploaded. */
async function addFiles(files) {
  for (const file of files) {
    if (!file.type.startsWith('image/')) continue;
    const img = await loadImage(URL.createObjectURL(file));
    state.photos.push(img);
    if (activePhoto < 0 || state.fillAll) assignPhoto(state.photos.length - 1);
  }
  renderThumbs();
  redraw();
  status.textContent = `${state.photos.length} photo(s) loaded — nothing leaves this page.`;
}

/** Loads the three bundled sample photos (free to use, made with an image model / in code). */
async function loadSamples() {
  for (const name of ['pier', 'boulevard', 'neonbeach']) {
    state.photos.push(await loadImage(`samples/${name}.jpg`));
  }
  state.panels.forEach((cell, i) => {
    if (!state.fillAll) cell.photo = state.photos[i % state.photos.length];
  });
  if (state.fillAll && state.photos.length) assignPhoto(0);
  activePhoto = 0;
  renderThumbs();
  redraw();
}

/** Renders the composition on an offscreen canvas at full size and downloads it as a PNG. */
function exportPng() {
  const f = FORMATS[formatKey];
  const out = document.createElement('canvas');
  out.width = f.w;
  out.height = f.h;
  drawCover(out.getContext('2d'), f.w, f.h, state, -1);
  out.toBlob((blob) => {
    const a = document.createElement('a');
    a.href = URL.createObjectURL(blob);
    a.download = `leonida-cover-${f.w}x${f.h}.png`;
    a.click();
    setTimeout(() => URL.revokeObjectURL(a.href), 4000);
    status.textContent = `Saved leonida-cover-${f.w}x${f.h}.png`;
  }, 'image/png');
}

/** Sets the export format (and therefore the preview's aspect ratio). */
function setFormat(key) {
  formatKey = key;
  const f = FORMATS[key];
  $('exportBtn').textContent = `Export PNG · ${f.w} × ${f.h}`;
  document.querySelectorAll('[data-size]').forEach((b) => {
    b.classList.toggle('on', b.dataset.size === key);
  });
  redraw();
}

// ---- Controls ---------------------------------------------------------------

for (const layout of LAYOUTS) {
  const b = document.createElement('button');
  b.type = 'button';
  b.textContent = layout.name;
  b.dataset.layout = layout.id;
  b.addEventListener('click', () => { setLayout(layout.id); redraw(); });
  $('layoutBtns').appendChild(b);
}
$('photoInput').addEventListener('change', (e) => addFiles([...e.target.files]));
const drop = $('dropZone');
['dragover', 'dragenter'].forEach((ev) => drop.addEventListener(ev, (e) => { e.preventDefault(); drop.classList.add('over'); }));
['dragleave', 'drop'].forEach((ev) => drop.addEventListener(ev, (e) => { e.preventDefault(); drop.classList.remove('over'); }));
drop.addEventListener('drop', (e) => addFiles([...e.dataTransfer.files]));
$('sampleBtn').addEventListener('click', loadSamples);
$('fillAll').addEventListener('change', (e) => {
  state.fillAll = e.target.checked;
  if (state.fillAll && activePhoto >= 0) assignPhoto(activePhoto);
  redraw();
});
$('clearPanel').addEventListener('click', () => { state.panels[selected].photo = null; renderThumbs(); redraw(); });
$('zoom').addEventListener('input', (e) => { state.panels[selected].zoom = Number(e.target.value); redraw(); });
$('title').addEventListener('input', (e) => { state.title = e.target.value; redraw(); });
$('subtitle').addEventListener('input', (e) => { state.subtitle = e.target.value; redraw(); });
$('titleColor').addEventListener('input', (e) => { state.titleColor = e.target.value; redraw(); });
$('accentColor').addEventListener('input', (e) => { state.accentColor = e.target.value; redraw(); });
$('gradeAmt').addEventListener('input', (e) => { state.gradeAmt = Number(e.target.value); redraw(); });
$('decorTgl').addEventListener('change', (e) => { state.decor = e.target.checked; redraw(); });
$('grainTgl').addEventListener('change', (e) => { state.grain = e.target.checked; redraw(); });
$('vigTgl').addEventListener('change', (e) => { state.vignette = e.target.checked; redraw(); });
$('posBottom').addEventListener('click', () => setCaptionPos('bottom'));
$('posTop').addEventListener('click', () => setCaptionPos('top'));
document.querySelectorAll('[data-grade]').forEach((b) => {
  b.addEventListener('click', () => {
    state.gradeName = b.dataset.grade;
    document.querySelectorAll('[data-grade]').forEach((x) => x.classList.toggle('on', x === b));
    redraw();
  });
});
document.querySelectorAll('[data-size]').forEach((b) => {
  b.addEventListener('click', () => setFormat(b.dataset.size));
});
$('exportBtn').addEventListener('click', exportPng);

/** Moves the caption between the foot and the head of the cover. */
function setCaptionPos(pos) {
  state.captionPos = pos;
  $('posBottom').classList.toggle('on', pos === 'bottom');
  $('posTop').classList.toggle('on', pos === 'top');
  redraw();
}

// ---- Canvas interaction: click to select a panel, drag to pan, wheel to zoom --

let drag = null;
function canvasPoint(e) {
  const r = canvas.getBoundingClientRect();
  return { x: (e.clientX - r.left) / r.width, y: (e.clientY - r.top) / r.height };
}
canvas.addEventListener('pointerdown', (e) => {
  const pt = canvasPoint(e);
  const layout = getLayout(state.layoutId);
  const hit = layout.panels.findIndex((p) => pointInPanel(p, pt.x, pt.y));
  if (hit >= 0) {
    selected = hit;
    syncPanelUi();
    renderThumbs();
  }
  drag = { x: e.clientX, y: e.clientY };
  canvas.setPointerCapture(e.pointerId);
  redraw();
});
canvas.addEventListener('pointermove', (e) => {
  if (!drag) return;
  const r = canvas.getBoundingClientRect();
  const cell = state.panels[selected];
  cell.ox = Math.max(-0.6, Math.min(0.6, cell.ox + (e.clientX - drag.x) / r.width));
  cell.oy = Math.max(-0.6, Math.min(0.6, cell.oy + (e.clientY - drag.y) / r.height));
  drag = { x: e.clientX, y: e.clientY };
  redraw();
});
canvas.addEventListener('pointerup', () => { drag = null; });
canvas.addEventListener('wheel', (e) => {
  e.preventDefault();
  const cell = state.panels[selected];
  cell.zoom = Math.max(1, Math.min(3, cell.zoom * (e.deltaY < 0 ? 1.06 : 0.94)));
  $('zoom').value = String(cell.zoom);
  redraw();
}, { passive: false });

// ---- Boot: plain editor, ?sample=1 demo, or a ?shot= screenshot scene ---------

setLayout('hero');
redraw();
if (document.fonts && document.fonts.load) {
  document.fonts.load('40px Anton').then(() => redraw()).catch(() => {});
}

const query = shotParams();
const shot = query.get('shot');
if (shot) {
  (async () => {
    try {
      if (document.fonts && document.fonts.load) await document.fonts.load('80px Anton');
      if (shot === 'cover') {
        document.body.classList.add('shot-cover');
        const w = Number(query.get('w') || 1080);
        const h = Number(query.get('h') || 1080);
        canvas.width = w;
        canvas.height = h;
        await applyScene(state, query, loadImage, setLayout);
        drawCover(ctx, w, h, state, -1);
      } else {
        if (query.get('size')) setFormat(query.get('size'));
        const scenePhotos = await applyScene(state, query, loadImage, setLayout);
        // Reflect the scene in the visible controls so the editor shot looks real.
        state.photos = scenePhotos;
        activePhoto = scenePhotos.length ? 0 : -1;
        $('title').value = state.title;
        $('subtitle').value = state.subtitle;
        renderThumbs();
        redraw();
      }
      markShotReady(true);
    } catch (err) {
      console.error(err);
      markShotReady(false);
    }
  })();
} else if (query.get('sample') === '1') {
  loadSamples().catch((err) => console.error(err));
}
