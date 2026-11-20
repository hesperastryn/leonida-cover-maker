// Panel collage layouts for Leonida Cover Maker. Each layout is a list of panels in normalised
// 0..1 coordinates; cover.js scales them to any output size, so one composition renders at
// 1080x1080, 1080x1350 and 1920x1080 alike. Panels are polygons, which is what allows the
// diagonal layout's angled cuts.

/** A polygon panel from [x, y] corner pairs in normalised cover coordinates. */
function panel(points) {
  return points.map(([x, y]) => ({ x, y }));
}

export const LAYOUTS = [
  {
    id: 'hero',
    name: 'Hero Grid',
    panels: [
      panel([[0, 0], [0.575, 0], [0.575, 1], [0, 1]]),
      panel([[0.60, 0], [1, 0], [1, 0.315], [0.60, 0.315]]),
      panel([[0.60, 0.34], [0.79, 0.34], [0.79, 0.655], [0.60, 0.655]]),
      panel([[0.815, 0.34], [1, 0.34], [1, 0.655], [0.815, 0.655]]),
      panel([[0.60, 0.68], [1, 0.68], [1, 1], [0.60, 1]]),
    ],
  },
  {
    id: 'diagonal',
    name: 'Diagonal Cut',
    panels: [
      panel([[0, 0], [0.615, 0], [0.475, 0.545], [0, 0.545]]),
      panel([[0.645, 0], [1, 0], [1, 0.545], [0.505, 0.545]]),
      panel([[0, 0.575], [0.445, 0.575], [0.385, 1], [0, 1]]),
      panel([[0.475, 0.575], [1, 0.575], [1, 1], [0.415, 1]]),
    ],
  },
  {
    id: 'mosaic',
    name: 'Mosaic Six',
    panels: [
      panel([[0, 0], [0.49, 0], [0.49, 0.575], [0, 0.575]]),
      panel([[0.51, 0], [1, 0], [1, 0.275], [0.51, 0.275]]),
      panel([[0.51, 0.295], [1, 0.295], [1, 0.575], [0.51, 0.575]]),
      panel([[0, 0.595], [0.32, 0.595], [0.32, 1], [0, 1]]),
      panel([[0.34, 0.595], [0.66, 0.595], [0.66, 1], [0.34, 1]]),
      panel([[0.68, 0.595], [1, 0.595], [1, 1], [0.68, 1]]),
    ],
  },
  {
    id: 'duo',
    name: 'Split Duo',
    panels: [
      panel([[0, 0], [0.49, 0], [0.49, 1], [0, 1]]),
      panel([[0.51, 0], [1, 0], [1, 0.49], [0.51, 0.49]]),
      panel([[0.51, 0.51], [1, 0.51], [1, 1], [0.51, 1]]),
    ],
  },
];

/** Returns the layout with this id, or the first layout when the id is unknown. */
export function getLayout(id) {
  return LAYOUTS.find((l) => l.id === id) ?? LAYOUTS[0];
}

/** The axis-aligned bounding box of a normalised panel, in normalised coordinates. */
export function panelBounds(p) {
  const xs = p.map((pt) => pt.x);
  const ys = p.map((pt) => pt.y);
  return {
    x: Math.min(...xs),
    y: Math.min(...ys),
    w: Math.max(...xs) - Math.min(...xs),
    h: Math.max(...ys) - Math.min(...ys),
  };
}

/** True when the normalised point (x, y) falls inside the polygon panel. */
export function pointInPanel(p, x, y) {
  let inside = false;
  for (let i = 0, j = p.length - 1; i < p.length; j = i++) {
    const xi = p[i].x, yi = p[i].y, xj = p[j].x, yj = p[j].y;
    if ((yi > y) !== (yj > y) && x < ((xj - xi) * (y - yi)) / (yj - yi) + xi) inside = !inside;
  }
  return inside;
}
