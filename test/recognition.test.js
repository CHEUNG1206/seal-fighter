import { test } from 'node:test';
import assert from 'node:assert/strict';
import { toFeatures, FEATURE_LENGTH, orderHands } from '../src/features.js';
import { classify, distance, Stabiliser } from '../src/knn.js';
import { parseSamples, toJSON, countByLabel } from '../src/samples.js';

// A fake hand: wrist at (x, y), knuckles spread by `size`, fingers by `spread`.
function hand(x, y, size = 0.1, spread = 0) {
  return Array.from({ length: 21 }, (_, i) => ({
    x: x + (i % 5) * size * 0.2 + spread * (i % 4),
    y: y - Math.floor(i / 5) * size * 0.25,
    z: 0,
  }));
}
const labels = (...names) => names.map(n => [{ categoryName: n }]);

test('no hands gives no features', () => {
  assert.equal(toFeatures([], []), null);
  assert.equal(toFeatures(undefined), null);
});

test('features have a fixed length for one or two hands', () => {
  assert.equal(toFeatures([hand(0.3, 0.6)], labels('Left')).length, FEATURE_LENGTH);
  assert.equal(toFeatures([hand(0.3, 0.6), hand(0.6, 0.6)], labels('Left', 'Right')).length, FEATURE_LENGTH);
});

test('moving or scaling the hands does not change the features', () => {
  const near = toFeatures([hand(0.2, 0.7, 0.1), hand(0.4, 0.7, 0.1)], labels('Left', 'Right'));
  const far = toFeatures([hand(0.5, 0.4, 0.05), hand(0.6, 0.4, 0.05)], labels('Left', 'Right'));
  assert.ok(distance(near, far) < 1e-9);
});

test('hands are ordered by label, or by position when labels clash', () => {
  const a = hand(0.7, 0.5);
  const b = hand(0.2, 0.5);
  assert.deepEqual(orderHands([a, b], labels('Left', 'Right')), [a, b]);
  assert.deepEqual(orderHands([a, b], labels('Right', 'Left')), [b, a]);
  assert.deepEqual(orderHands([a, b], labels('Right', 'Right')), [b, a]);
});

test('one hand is never close to two hands', () => {
  const one = toFeatures([hand(0.3, 0.6)], labels('Left'));
  const two = toFeatures([hand(0.3, 0.6), hand(0.31, 0.6)], labels('Left', 'Right'));
  assert.ok(distance(one, two) > 2);
});

test('knn votes for the nearest label', () => {
  const samples = [
    ...[0, 0.01, 0.02].map(d => ({ label: 'rat', features: [d, 0] })),
    ...[5, 5.01].map(d => ({ label: 'tiger', features: [d, 5] })),
  ];
  const result = classify([0.005, 0], samples, 3);
  assert.equal(result.label, 'rat');
  assert.equal(result.confidence, 1);
  assert.equal(classify([5, 5], samples, 3).label, 'tiger');
  assert.equal(classify(null, samples), null);
  assert.equal(classify([0, 0], []), null);
});

test('k larger than the sample count still works', () => {
  const result = classify([0, 0], [{ label: 'rat', features: [1, 0] }], 5);
  assert.deepEqual(result, { label: 'rat', confidence: 1, distance: 1 });
});

test('stabiliser locks only after a steady confident streak', () => {
  const s = new Stabiliser({ frames: 3, minConfidence: 0.6 });
  const rat = { label: 'rat', confidence: 0.8, distance: 1 };
  assert.equal(s.update(rat), null);
  assert.equal(s.update(rat), null);
  assert.equal(s.update(rat), 'rat');
  // A flicker does not unlock immediately.
  assert.equal(s.update({ label: 'tiger', confidence: 0.8, distance: 1 }), 'rat');
  // Low confidence counts as "nothing".
  const unsure = { label: 'tiger', confidence: 0.4, distance: 1 };
  s.update(unsure); s.update(unsure);
  assert.equal(s.update(unsure), null);
});

test('samples round-trip through JSON and bad rows are dropped', () => {
  const good = { label: 'rat', features: new Array(FEATURE_LENGTH).fill(0.5) };
  const text = toJSON([good, { label: 'rat', features: [1, 2] }, { label: '', features: good.features }]);
  assert.deepEqual(parseSamples(text), [good]);
  assert.throws(() => parseSamples('{"samples": []}'), /No valid samples/);
  assert.deepEqual(countByLabel([good, good]), { rat: 2 });
});

test('photo folders map to seal ids', async () => {
  const { labelFromFolder, SEALS } = await import('../src/seals.js');
  assert.equal(labelFromFolder('tiger'), 'tiger');
  assert.equal(labelFromFolder('Rooster'), 'bird');
  assert.equal(labelFromFolder('寅'), 'tiger');
  assert.equal(labelFromFolder('zero'), null);
  assert.equal(new Set(SEALS.map(s => s.key)).size, SEALS.length, 'keys are unique');
});

test('bundled samples load and cover all twelve seals', async () => {
  const { readFile } = await import('node:fs/promises');
  const { SEALS } = await import('../src/seals.js');
  const samples = parseSamples(await readFile(new URL('../samples/seal-samples.json', import.meta.url), 'utf8'));
  const labels = new Set(samples.map(s => s.label));
  for (const seal of SEALS.filter(s => s.id !== 'none')) assert.ok(labels.has(seal.id), seal.id);
});
