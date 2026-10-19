// Draws a seal's hand pose as a skeleton, from the representative poses in
// poses.js, so players can see how to hold their hands.
import { POSES } from './poses.js';

// Pairs of landmark indices joined by a bone (MediaPipe's hand layout).
export const BONES = [
  [0, 1], [1, 2], [2, 3], [3, 4],
  [0, 5], [5, 6], [6, 7], [7, 8],
  [5, 9], [9, 10], [10, 11], [11, 12],
  [9, 13], [13, 14], [14, 15], [15, 16],
  [13, 17], [0, 17], [17, 18], [18, 19], [19, 20],
];
const COLOURS = ['#ff7a1a', '#3fc1ff'];
// Wrist and finger roots, filled lightly so the palm reads as a surface.
const PALM = [0, 1, 5, 9, 13, 17];

// The pose mirrored horizontally (the player sees a mirrored camera image)
// and scaled to fit a box of the given size. Returns [[x, y], ...] per hand.
export function fittedPose(sealId, width, height, padding = 0.12) {
  const pose = POSES[sealId];
  if (!pose) return null;
  const mirrored = pose.map(h => h.map(([x, y]) => [-x, y]));
  const all = mirrored.flat();
  const xs = all.map(p => p[0]);
  const ys = all.map(p => p[1]);
  const [minX, maxX, minY, maxY] = [Math.min(...xs), Math.max(...xs), Math.min(...ys), Math.max(...ys)];
  const scale = Math.min(width * (1 - 2 * padding) / (maxX - minX || 1), height * (1 - 2 * padding) / (maxY - minY || 1));
  const ox = (width - (maxX - minX) * scale) / 2 - minX * scale;
  const oy = (height - (maxY - minY) * scale) / 2 - minY * scale;
  return mirrored.map(h => h.map(([x, y]) => [x * scale + ox, y * scale + oy]));
}

export function poseSVG(sealId, size = 120) {
  const hands = fittedPose(sealId, size, size);
  if (!hands) return '';
  const stroke = Math.max(1.5, size / 45);
  const body = hands.map((h, i) => {
    const lines = BONES.map(([a, b]) =>
      `<line x1="${h[a][0].toFixed(1)}" y1="${h[a][1].toFixed(1)}" x2="${h[b][0].toFixed(1)}" y2="${h[b][1].toFixed(1)}"/>`).join('');
    const tips = [4, 8, 12, 16, 20].map(t =>
      `<circle cx="${h[t][0].toFixed(1)}" cy="${h[t][1].toFixed(1)}" r="${stroke * 1.3}"/>`).join('');
    const palm = `<polygon points="${PALM.map(p => h[p].map(v => v.toFixed(1)).join(',')).join(' ')}" fill-opacity="0.25" stroke="none"/>`;
    return `<g stroke="${COLOURS[i]}" fill="${COLOURS[i]}" stroke-width="${stroke}" stroke-linecap="round">${palm}${lines}${tips}</g>`;
  }).join('');
  return `<svg class="pose" viewBox="0 0 ${size} ${size}" width="${size}" height="${size}" aria-hidden="true">${body}</svg>`;
}

// Draws the pose faintly onto a canvas context, e.g. behind the camera image.
export function drawGhost(ctx, sealId, alpha = 0.35) {
  const { width, height } = ctx.canvas;
  const hands = fittedPose(sealId, width, height, 0.2);
  if (!hands) return;
  ctx.save();
  ctx.globalAlpha = alpha;
  ctx.lineWidth = Math.max(2, width / 90);
  ctx.lineCap = 'round';
  hands.forEach((h, i) => {
    ctx.fillStyle = COLOURS[i];
    ctx.globalAlpha = alpha * 0.4;
    ctx.beginPath();
    PALM.forEach((p, k) => (k ? ctx.lineTo(...h[p]) : ctx.moveTo(...h[p])));
    ctx.fill();
    ctx.globalAlpha = alpha;
    ctx.strokeStyle = COLOURS[i];
    ctx.beginPath();
    for (const [a, b] of BONES) {
      ctx.moveTo(h[a][0], h[a][1]);
      ctx.lineTo(h[b][0], h[b][1]);
    }
    ctx.stroke();
  });
  ctx.restore();
}
