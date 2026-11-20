// Original procedural decorations for Leonida Cover Maker: every shape here is drawn in code
// (palm silhouettes, a striped sun disc, a skyline strip and a flamingo accent). No artwork is
// copied from any game or poster; these are simple vector silhouettes invented for this app.

/** Draws a palm tree silhouette with its trunk rooted at (x, y) and fronds spreading `s` px wide. */
export function drawPalm(ctx, x, y, s, flip, color) {
  ctx.save();
  ctx.strokeStyle = color;
  ctx.fillStyle = color;
  ctx.lineCap = 'round';
  const lean = 0.22 * s * flip;
  ctx.lineWidth = s * 0.072;
  ctx.beginPath();
  ctx.moveTo(x, y);
  ctx.quadraticCurveTo(x + lean * 0.3, y - s * 0.55, x + lean, y - s);
  ctx.stroke();
  const topX = x + lean;
  const topY = y - s;
  ctx.lineWidth = s * 0.036;
  // Fronds fan out from the crown: the middle ones lift, the outer ones droop past horizontal.
  for (let i = 0; i < 9; i++) {
    const t = -1 + (i / 8) * 2;
    const ex = topX + t * s * 0.62 * flip;
    const ey = topY - (1 - Math.abs(t)) * s * 0.14 + t * t * s * 0.34 + s * 0.03;
    ctx.beginPath();
    ctx.moveTo(topX, topY);
    ctx.quadraticCurveTo(topX + t * s * 0.32 * flip, topY - s * 0.26, ex, ey);
    ctx.stroke();
  }
  ctx.beginPath();
  ctx.arc(topX - s * 0.05, topY + s * 0.03, s * 0.045, 0, Math.PI * 2);
  ctx.arc(topX + s * 0.06, topY + s * 0.05, s * 0.038, 0, Math.PI * 2);
  ctx.fill();
  ctx.restore();
}

/** Draws a retro sun disc: a circle whose lower half is cut by horizontal stripes. The disc is
 *  composed on its own offscreen canvas first, so the stripe cuts never erase the cover below. */
export function drawSunDisc(ctx, cx, cy, r) {
  const d = Math.ceil(r * 2);
  const off = document.createElement('canvas');
  off.width = d;
  off.height = d;
  const o = off.getContext('2d');
  const grad = o.createLinearGradient(0, 0, 0, d);
  grad.addColorStop(0, '#ffd76a');
  grad.addColorStop(0.55, '#ff9a4d');
  grad.addColorStop(1, '#ff4d8d');
  o.fillStyle = grad;
  o.beginPath();
  o.arc(r, r, r, 0, Math.PI * 2);
  o.fill();
  o.globalCompositeOperation = 'destination-out';
  let y = r + r * 0.08;
  let gap = r * 0.05;
  while (y < r * 2) {
    o.fillRect(0, y, d, gap);
    y += gap + r * 0.17;
    gap *= 1.5;
  }
  ctx.save();
  ctx.globalAlpha = 0.96;
  ctx.drawImage(off, cx - r, cy - r);
  ctx.restore();
}

/** Draws a dark skyline strip along the bottom edge, with a few lit windows. */
export function drawSkyline(ctx, w, baseY, height, seed) {
  ctx.save();
  let rand = seed;
  const next = () => {
    rand = (rand * 16807) % 2147483647;
    return rand / 2147483647;
  };
  ctx.fillStyle = 'rgba(16, 6, 30, 0.88)';
  let x = -w * 0.02;
  const tops = [];
  while (x < w * 1.02) {
    const bw = w * (0.05 + next() * 0.07);
    const bh = height * (0.35 + next() * 0.65);
    ctx.fillRect(x, baseY - bh, bw, bh);
    tops.push([x, baseY - bh, bw, bh]);
    x += bw + w * 0.008;
  }
  ctx.fillStyle = 'rgba(255, 205, 92, 0.9)';
  const win = Math.max(3, height * 0.075);
  for (const [bx, by, bw, bh] of tops) {
    const cols = Math.max(1, Math.floor(bw / (win * 2.4)));
    const rows = Math.max(1, Math.floor(bh / (win * 2.6)));
    for (let c = 0; c < cols; c++) {
      for (let r = 0; r < rows; r++) {
        if (next() > 0.45) continue;
        ctx.fillRect(bx + win * 0.8 + c * win * 2.4, by + win * 0.8 + r * win * 2.6, win * 0.9, win * 1.1);
      }
    }
  }
  ctx.restore();
}

/** Draws a small flamingo accent: body, S-neck and two thin legs, in one flat colour. */
export function drawFlamingo(ctx, x, y, s, color) {
  ctx.save();
  ctx.strokeStyle = color;
  ctx.fillStyle = color;
  ctx.lineCap = 'round';
  ctx.beginPath();
  ctx.ellipse(x, y, s * 0.5, s * 0.24, -0.15, 0, Math.PI * 2);
  ctx.fill();
  ctx.lineWidth = s * 0.09;
  ctx.beginPath();
  ctx.moveTo(x + s * 0.36, y - s * 0.08);
  ctx.quadraticCurveTo(x + s * 0.66, y - s * 0.30, x + s * 0.52, y - s * 0.58);
  ctx.quadraticCurveTo(x + s * 0.46, y - s * 0.72, x + s * 0.34, y - s * 0.66);
  ctx.stroke();
  ctx.beginPath();
  ctx.arc(x + s * 0.30, y - s * 0.64, s * 0.075, 0, Math.PI * 2);
  ctx.fill();
  ctx.lineWidth = s * 0.05;
  ctx.beginPath();
  ctx.moveTo(x + s * 0.26, y - s * 0.62);
  ctx.lineTo(x + s * 0.10, y - s * 0.56);
  ctx.stroke();
  ctx.lineWidth = s * 0.045;
  ctx.beginPath();
  ctx.moveTo(x - s * 0.1, y + s * 0.2);
  ctx.lineTo(x - s * 0.14, y + s * 0.72);
  ctx.moveTo(x + s * 0.18, y + s * 0.2);
  ctx.lineTo(x + s * 0.3, y + s * 0.5);
  ctx.lineTo(x + s * 0.16, y + s * 0.74);
  ctx.stroke();
  ctx.restore();
}
