// Keep recorded samples in the browser and move them in and out as JSON.
import { FEATURE_LENGTH } from './features.js';

const KEY = 'seal-fighter.samples.v1';

export function isValidSample(s) {
  return s && typeof s.label === 'string' && s.label.length > 0
    && Array.isArray(s.features) && s.features.length === FEATURE_LENGTH
    && s.features.every(Number.isFinite);
}

export function parseSamples(text) {
  const data = JSON.parse(text);
  const list = Array.isArray(data) ? data : data.samples;
  if (!Array.isArray(list)) throw new Error('Expected a list of samples.');
  const valid = list.filter(isValidSample);
  if (valid.length === 0) throw new Error('No valid samples in this file.');
  return valid;
}

export function toJSON(samples) {
  return JSON.stringify({ version: 1, featureLength: FEATURE_LENGTH, samples });
}

export function loadSaved() {
  try {
    const text = localStorage.getItem(KEY);
    return text ? parseSamples(text) : [];
  } catch {
    return [];
  }
}

export function save(samples) {
  try {
    localStorage.setItem(KEY, toJSON(samples));
  } catch {
    // Private windows can refuse storage; export still works.
  }
}

// The samples saved in this browser, or the ones shipped with the game when
// there are none yet. `bundled` is true for the latter.
export async function loadSamples(url = 'samples/seal-samples.json') {
  const saved = loadSaved();
  if (saved.length) return { samples: saved, bundled: false };
  try {
    const response = await fetch(url);
    if (response.ok) return { samples: parseSamples(await response.text()), bundled: true };
  } catch {
    // Offline or missing: fall through.
  }
  return { samples: [], bundled: false };
}

export function countByLabel(samples) {
  const counts = {};
  for (const s of samples) counts[s.label] = (counts[s.label] ?? 0) + 1;
  return counts;
}
