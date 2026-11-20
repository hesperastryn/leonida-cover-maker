// The cover renderer for Leonida Cover Maker. One resolution-independent draw function paints
// the whole composition — panel collage, colour grade, procedural decorations and caption —
// onto any canvas at any size, so the live preview and every PNG export share the same art.
//
// State shape (built by main.js):
//   { layoutId, title, subtitle, titleColor, accentColor, captionPos: 'bottom' | 'top',
//     gradeName: 'sunset' | 'neon' | 'golden', gradeAmt: 0..1, grain, vignette, decor,
//     panels: [{ photo: HTMLImageElement | null, zoom, ox, oy }] }
// ox / oy are pan offsets as a fraction of the panel's bounding box; zoom multiplies cover-fit.

import { drawFlamingo, drawPalm, drawSkyline, drawSunDisc } from './decor.js';
import { getLayout, panelBounds } from './layouts.js';

export const GRADES = {
  sunset: { top: 'rgba(255, 122, 61, 0.20)', mid: 'rgba(255, 45, 120, 0.16)', foot: 'rgba(46, 8, 84, 0.55)', sat: 1.28, con: 1.10, warm: 'rgba(255, 140, 60, 0.10)' },
  neon: { top: 'rgba(0, 229, 255, 0.14)', mid: 'rgba(150, 0, 255, 0.18)', foot: 'rgba(4, 10, 48, 0.60)', sat: 1.42, con: 1.14, warm: 'rgba(255, 0, 170, 0.08)' },
  golden: { top: 'rgba(255, 196, 64, 0.16)', mid: 'rgba(255, 110, 40, 0.12)', foot: 'rgba(60, 20, 4, 0.50)', sat: 1.18, con: 1.06, warm: 'rgba(255, 180, 60, 0.12)' },
};

let grainTile = null;

/** Builds (once) a small tile of random grey noise used for the film-grain overlay. */
function getGrainTile() {
  if (grainTile) return grainTile;
  grainTile = document.createElement('canvas');
  grainTile.width = 180;
  grainTile.height = 180;
  const g = grainTile.getContext('2d');
  const data = g.createImageData(180, 180);
  for (let i = 0; i < data.data.length; i += 4) {
    const v = 96 + Math.floor(Math.random() * 96);
    data.data[i] = v;
    data.data[i + 1] = v;
    data.data[i + 2] = v;
    data.data[i + 3] = 255;
  }
  g.putImageData(data, 0, 0);
  return grainTile;
}

/** Traces a panel polygon (normalised) as the current path, scaled to w x h. */
function tracePanel(ctx, p, w, h) {
  ctx.beginPath();
  p.forEach((pt, i) => {
    if (i === 0) ctx.moveTo(pt.x * w, pt.y * h);
    else ctx.lineTo(pt.x * w, pt.y * h);
  });
  ctx.closePath();
}

/** Draws one photo into one clipped panel with cover-fit, per-panel zoom and pan, plus grade. */
function drawPanelPhoto(ctx, p, cell, w, h, grade) {
  const img = cell.photo;
  const b = panelBounds(p);
  const bx = b.x * w, by = b.y * h, bw = b.w * w, bh = b.h * h;
  ctx.save();
  tracePanel(ctx, p, w, h);
  ctx.clip();
  if (!img) {
    const ph = ctx.createLinearGradient(bx, by, bx + bw, by + bh);
    ph.addColorStop(0, '#3a1454');
    ph.addColorStop(1, '#12081f');
    ctx.fillStyle = ph;
    ctx.fillRect(bx - w * 0.05, by - h * 0.05, bw + w * 0.1, bh + h * 0.1);
    ctx.fillStyle = 'rgba(255,255,255,0.55)';
    ctx.font = `600 ${Math.max(13, w * 0.016)}px system-ui, sans-serif`;
    ctx.textAlign = 'center';
    ctx.fillText('CLICK TO ADD A PHOTO', bx + bw / 2, by + bh / 2);
    ctx.restore();
    return;
  }
  const scale = Math.max(bw / img.naturalWidth, bh / img.naturalHeight) * (cell.zoom || 1);
  const dw = img.naturalWidth * scale;
  const dh = img.naturalHeight * scale;
  const dx = bx + (bw - dw) / 2 + (cell.ox || 0) * bw;
  const dy = by + (bh - dh) / 2 + (cell.oy || 0) * bh;
  ctx.filter = `saturate(${grade.sat}) contrast(${grade.con}) brightness(1.04)`;
  // Overscan the draw so diagonal clips never show the panel background at the slanted edge.
  ctx.drawImage(img, dx, dy, dw, dh);
  ctx.filter = 'none';
  const sheen = ctx.createLinearGradient(bx, by, bx, by + bh);
  sheen.addColorStop(0, 'rgba(255,255,255,0.10)');
  sheen.addColorStop(0.4, 'rgba(255,255,255,0)');
  sheen.addColorStop(1, 'rgba(10,0,30,0.18)');
  ctx.fillStyle = sheen;
  ctx.fillRect(bx - w * 0.05, by - h * 0.05, bw + w * 0.1, bh + h * 0.1);
  ctx.restore();
}

/** Paints the full-cover colour grade: three-stop wash, warm glow and a caption scrim. */
function applyGrade(ctx, w, h, grade, amt, captionPos) {
  const g = ctx.createLinearGradient(0, 0, 0, h);
  g.addColorStop(0, grade.top);
  g.addColorStop(0.5, grade.mid);
  g.addColorStop(1, grade.foot);
  ctx.save();
  ctx.globalAlpha = amt;
  ctx.fillStyle = g;
  ctx.fillRect(0, 0, w, h);
  ctx.globalCompositeOperation = 'overlay';
  ctx.fillStyle = grade.warm;
  ctx.fillRect(0, 0, w, h);
  ctx.globalCompositeOperation = 'source-over';
  ctx.globalAlpha = 1;
  const scrimH = h * 0.32;
  const sy = captionPos === 'top' ? 0 : h - scrimH;
  const scrim = ctx.createLinearGradient(0, sy, 0, sy + scrimH);
  if (captionPos === 'top') {
    scrim.addColorStop(0, 'rgba(8, 2, 20, 0.74)');
    scrim.addColorStop(1, 'rgba(8, 2, 20, 0)');
  } else {
    scrim.addColorStop(0, 'rgba(8, 2, 20, 0)');
    scrim.addColorStop(1, 'rgba(8, 2, 20, 0.80)');
  }
  ctx.fillStyle = scrim;
  ctx.fillRect(0, sy, w, scrimH);
  ctx.restore();
}

/** Draws the toggleable procedural decorations over the graded panels. */
function applyDecor(ctx, w, h, captionPos) {
  const u = Math.min(w, h);
  ctx.save();
  drawSunDisc(ctx, w * 0.90, h * 0.10, u * 0.115);
  ctx.restore();
  const ink = 'rgba(12, 4, 24, 0.92)';
  drawSkyline(ctx, w, h * 0.995, u * 0.082, 1234567);
  const groundY = captionPos === 'top' ? h * 0.90 : h * 0.78;
  drawPalm(ctx, w * 0.045, groundY + u * 0.10, u * 0.26, 1, ink);
  drawPalm(ctx, w * 0.965, groundY + u * 0.10, u * 0.21, -1, ink);
  drawFlamingo(ctx, w * 0.155, groundY + u * 0.015, u * 0.075, '#ff5da2');
}

/** Fits Anton capitals into maxW, shrinking from startSize until the text fits. */
function fitFont(ctx, text, startSize, maxW) {
  let size = startSize;
  const set = () => { ctx.font = `${size}px Anton, sans-serif`; };
  set();
  while (ctx.measureText(text).width > maxW && size > 10) {
    size -= 2;
    set();
  }
  return size;
}

/** Draws the two-line caption: skewed Anton title with thick outline and shadow, then subtitle. */
function drawCaption(ctx, w, h, state) {
  const title = (state.title || '').trim().toUpperCase();
  const sub = (state.subtitle || '').trim().toUpperCase();
  if (!title && !sub) return;
  const atTop = state.captionPos === 'top';
  const u = Math.min(w, h);
  ctx.save();
  ctx.textAlign = 'center';
  const titleSize = title ? fitFont(ctx, title, u * 0.148, w * 0.92) : 0;
  const baseY = atTop ? u * 0.155 : h - u * 0.135;
  if (title) {
    ctx.save();
    ctx.translate(w / 2, baseY);
    ctx.transform(1, 0, -0.07, 1, 0, 0);
    ctx.font = `${titleSize}px Anton, sans-serif`;
    ctx.lineJoin = 'round';
    ctx.shadowColor = 'rgba(10, 0, 24, 0.65)';
    ctx.shadowBlur = titleSize * 0.16;
    ctx.shadowOffsetY = titleSize * 0.05;
    ctx.strokeStyle = '#160428';
    ctx.lineWidth = titleSize * 0.16;
    ctx.strokeText(title, 0, 0);
    ctx.shadowBlur = 0;
    ctx.shadowOffsetY = 0;
    const fill = ctx.createLinearGradient(0, -titleSize, 0, titleSize * 0.25);
    fill.addColorStop(0, '#ffffff');
    fill.addColorStop(0.55, state.titleColor);
    fill.addColorStop(1, state.titleColor);
    ctx.fillStyle = fill;
    ctx.fillText(title, 0, 0);
    ctx.restore();
  }
  if (sub) {
    const subSize = fitFont(ctx, sub, u * 0.040, w * 0.8);
    const subY = atTop ? baseY + u * 0.062 : baseY + u * 0.068;
    ctx.save();
    ctx.translate(w / 2, subY);
    ctx.transform(1, 0, -0.07, 1, 0, 0);
    ctx.font = `${subSize}px Anton, sans-serif`;
    try { ctx.letterSpacing = `${Math.round(subSize * 0.32)}px`; } catch { /* older canvas */ }
    ctx.lineJoin = 'round';
    ctx.strokeStyle = 'rgba(16, 3, 32, 0.9)';
    ctx.lineWidth = subSize * 0.18;
    ctx.strokeText(sub, 0, 0);
    ctx.fillStyle = state.accentColor;
    ctx.fillText(sub, 0, 0);
    ctx.restore();
    const ruleW = Math.min(w * 0.34, w * 0.3);
    ctx.fillStyle = state.accentColor;
    const ruleY = subY + u * 0.020;
    ctx.fillRect(w / 2 - ruleW / 2, ruleY, ruleW, Math.max(2, u * 0.006));
  }
  ctx.restore();
}

/** Soft dark vignette around the edges. */
function applyVignette(ctx, w, h) {
  const r = Math.hypot(w, h) * 0.62;
  const v = ctx.createRadialGradient(w / 2, h / 2, r * 0.55, w / 2, h / 2, r);
  v.addColorStop(0, 'rgba(0,0,0,0)');
  v.addColorStop(1, 'rgba(5,0,16,0.42)');
  ctx.fillStyle = v;
  ctx.fillRect(0, 0, w, h);
}

/** Tiled film grain at low opacity. */
function applyGrain(ctx, w, h) {
  ctx.save();
  ctx.globalAlpha = 0.10;
  ctx.globalCompositeOperation = 'overlay';
  const tile = getGrainTile();
  ctx.fillStyle = ctx.createPattern(tile, 'repeat');
  ctx.fillRect(0, 0, w, h);
  ctx.restore();
}

/**
 * Renders the full cover described by `state` onto ctx at w x h.
 * `highlight` (editor only) is a panel index to outline, or -1 for none.
 */
export function drawCover(ctx, w, h, state, highlight = -1) {
  const layout = getLayout(state.layoutId);
  const grade = GRADES[state.gradeName] ?? GRADES.sunset;
  ctx.save();
  ctx.fillStyle = '#170a28';
  ctx.fillRect(0, 0, w, h);
  layout.panels.forEach((p, i) => {
    drawPanelPhoto(ctx, p, state.panels[i] ?? { photo: null }, w, h, grade);
  });
  // Panel gutters: deep plum strokes along every panel edge read as the classic collage cuts.
  ctx.strokeStyle = '#14041f';
  ctx.lineWidth = Math.max(3, Math.min(w, h) * 0.007);
  ctx.lineJoin = 'round';
  for (const p of layout.panels) {
    tracePanel(ctx, p, w, h);
    ctx.stroke();
  }
  ctx.strokeStyle = 'rgba(255, 120, 190, 0.35)';
  ctx.lineWidth = Math.max(1, Math.min(w, h) * 0.0016);
  for (const p of layout.panels) {
    tracePanel(ctx, p, w, h);
    ctx.stroke();
  }
  applyGrade(ctx, w, h, grade, state.gradeAmt, state.captionPos);
  if (state.decor) applyDecor(ctx, w, h, state.captionPos);
  if (state.vignette) applyVignette(ctx, w, h);
  drawCaption(ctx, w, h, state);
  if (state.grain) applyGrain(ctx, w, h);
  ctx.strokeStyle = 'rgba(10, 2, 20, 0.9)';
  ctx.lineWidth = Math.max(4, Math.min(w, h) * 0.010);
  ctx.strokeRect(0, 0, w, h);
  ctx.strokeStyle = state.accentColor;
  ctx.lineWidth = Math.max(1.5, Math.min(w, h) * 0.0022);
  const inset = ctx.lineWidth * 2.2;
  ctx.strokeRect(inset, inset, w - inset * 2, h - inset * 2);
  if (highlight >= 0 && layout.panels[highlight]) {
    tracePanel(ctx, layout.panels[highlight], w, h);
    ctx.strokeStyle = '#00e5ff';
    ctx.lineWidth = Math.max(3, Math.min(w, h) * 0.006);
    ctx.setLineDash([Math.min(w, h) * 0.02, Math.min(w, h) * 0.012]);
    ctx.stroke();
    ctx.setLineDash([]);
  }
  ctx.restore();
}
