// K-nearest-neighbours: find the k recorded samples closest to the current
// pose and let them vote.

export function distance(a, b) {
  let sum = 0;
  for (let i = 0; i < a.length; i++) sum += (a[i] - b[i]) ** 2;
  return Math.sqrt(sum);
}

// Feature layout from features.js: first hand, second hand, wrist offset,
// presence flags.
const HAND = 42;
const handsOf = f => (f[87] > 0 ? [f.slice(0, HAND), f.slice(HAND, 2 * HAND)] : [f.slice(0, HAND)]);
const OFFSET_WEIGHT = 0.5;
// Added when one pose has one hand detected and the other has two.
const HAND_COUNT_PENALTY = 1;

// Compare poses hand by hand. MediaPipe often sees interlocked hands as a
// single hand, and sometimes swaps its left/right labels, so a plain distance
// between the two vectors treats the same seal as two very different poses.
// Measured on a player's own samples, this raised accuracy from 48% to 74%.
export function poseDistance(a, b) {
  const [ha, hb] = [handsOf(a), handsOf(b)];
  if (ha.length === 2 && hb.length === 2) {
    const same = (distance(ha[0], hb[0]) + distance(ha[1], hb[1])) / 2
      + OFFSET_WEIGHT * Math.hypot(a[84] - b[84], a[85] - b[85]);
    const swapped = (distance(ha[0], hb[1]) + distance(ha[1], hb[0])) / 2
      + OFFSET_WEIGHT * Math.hypot(a[84] + b[84], a[85] + b[85]);
    return Math.min(same, swapped);
  }
  if (ha.length === 1 && hb.length === 1) return distance(ha[0], hb[0]);
  const [one, two] = ha.length === 1 ? [ha[0], hb] : [hb[0], ha];
  return Math.min(distance(one, two[0]), distance(one, two[1])) + HAND_COUNT_PENALTY;
}

// samples: [{label, features, source?}]
// mineWeight < 1 makes the player's own samples count as closer than the
// bundled ones.
// Returns {label, confidence, distance} or null when there is nothing to compare.
export function classify(features, samples, { k = 5, mineWeight = 1 } = {}) {
  if (!features || samples.length === 0) return null;
  const nearest = samples
    .map(s => ({
      label: s.label,
      d: poseDistance(features, s.features) * (s.source === 'mine' ? mineWeight : 1),
    }))
    .sort((x, y) => x.d - y.d)
    .slice(0, Math.min(k, samples.length));

  const votes = new Map();
  for (const n of nearest) votes.set(n.label, (votes.get(n.label) ?? 0) + 1);
  let label = null;
  let count = 0;
  for (const [l, c] of votes) {
    if (c > count) [label, count] = [l, c];
  }
  const closest = nearest.find(n => n.label === label).d;
  return { label, confidence: count / nearest.length, distance: closest };
}

// Raw predictions flicker between frames. A seal only "locks" after the same
// confident answer has been seen for `frames` frames in a row.
export class Stabiliser {
  constructor({ frames = 8, minConfidence = 0.6, maxDistance = Infinity } = {}) {
    Object.assign(this, { frames, minConfidence, maxDistance });
    this.reset();
  }

  reset() {
    this.candidate = null;
    this.streak = 0;
    this.locked = null;
  }

  // Returns the locked label (or null) after taking this frame into account.
  update(prediction) {
    const ok = prediction
      && prediction.confidence >= this.minConfidence
      && prediction.distance <= this.maxDistance;
    const label = ok ? prediction.label : null;
    if (label === this.candidate) {
      this.streak++;
    } else {
      this.candidate = label;
      this.streak = 1;
    }
    if (this.streak >= this.frames) this.locked = this.candidate;
    return this.locked;
  }
}
