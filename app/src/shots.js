// Fixed scenes for screenshots and deep links. Query parameters:
//   ?shot=cover   — the cover alone fills the window (used to capture exported-cover shots)
//   ?shot=editor  — the full editor with a composed scene loaded
//   ?sample=1     — auto-load the bundled samples into the editor
// Scene parameters: layout, title, sub, photos (comma list of sample names), fill=1 (one photo
// in every panel), grade, pos=top|bottom, w and h (cover pixel size for shot=cover).
// window.__shotReady is set once the scene is painted, and window.__shotError on failure.

/** Parses the current query string into a plain object of scene parameters. */
export function shotParams() {
  return new URLSearchParams(location.search);
}

/** Applies scene parameters to a cover state, loading the named sample photos. */
export async function applyScene(state, query, loadImage, setLayout) {
  const layoutId = query.get('layout') || state.layoutId;
  setLayout(layoutId);
  if (query.get('title') !== null) state.title = query.get('title');
  if (query.get('sub') !== null) state.subtitle = query.get('sub');
  if (query.get('grade')) state.gradeName = query.get('grade');
  if (query.get('pos')) state.captionPos = query.get('pos');
  if (query.get('titleColor')) state.titleColor = query.get('titleColor');
  if (query.get('accent')) state.accentColor = query.get('accent');
  const names = (query.get('photos') || query.get('photo') || '')
    .split(',')
    .map((s) => s.trim())
    .filter(Boolean);
  const fill = query.get('fill') === '1';
  const images = [];
  for (const name of names) images.push(await loadImage(`samples/${name}.jpg`));
  if (images.length) {
    state.panels.forEach((cell, i) => {
      cell.photo = fill ? images[0] : images[i % images.length];
      cell.zoom = 1;
      cell.ox = 0;
      cell.oy = 0;
    });
  }
  return images;
}

/** Marks the shot scene as painted (or failed) for the screenshot harness. */
export function markShotReady(ok) {
  requestAnimationFrame(() => requestAnimationFrame(() => {
    if (ok) window.__shotReady = true;
    else window.__shotError = true;
  }));
}
