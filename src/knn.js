// K-nearest-neighbours: find the k recorded samples closest to the current
// pose and let them vote.

export function distance(a, b) {
  let sum = 0;
  for (let i = 0; i < a.length; i++) sum += (a[i] - b[i]) ** 2;
  return Math.sqrt(sum);
}

// samples: [{label, features}]
// Returns {label, confidence, distance} or null when there is nothing to compare.
export function classify(features, samples, k = 5) {
  if (!features || samples.length === 0) return null;
  const nearest = samples
    .map(s => ({ label: s.label, d: distance(features, s.features) }))
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
