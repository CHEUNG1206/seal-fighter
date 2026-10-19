// Small synthesised sound effects, so the game needs no audio files.
// Browsers only allow audio after a click, so call unlock() from one.

let ctx = null;

export function unlock() {
  if (ctx) return;
  try {
    ctx = new AudioContext();
  } catch {
    ctx = null; // No audio; the game still works.
  }
}

function tone(freq, start, length, { type = 'sine', gain = 0.15, slideTo = null } = {}) {
  const osc = ctx.createOscillator();
  const amp = ctx.createGain();
  const t = ctx.currentTime + start;
  osc.type = type;
  osc.frequency.setValueAtTime(freq, t);
  if (slideTo) osc.frequency.exponentialRampToValueAtTime(slideTo, t + length);
  amp.gain.setValueAtTime(gain, t);
  amp.gain.exponentialRampToValueAtTime(0.001, t + length);
  osc.connect(amp).connect(ctx.destination);
  osc.start(t);
  osc.stop(t + length);
}

const notes = (list, gap, length, opts) => list.forEach((f, i) => tone(f, i * gap, length, opts));

export const sfx = {
  seal(step) {
    if (ctx) tone(440 * 2 ** (step / 6), 0, 0.12, { type: 'triangle' });
  },
  jutsu(type, strong = false) {
    if (!ctx) return;
    if (type === 'attack') {
      tone(220, 0, 0.5, { type: 'sawtooth', gain: 0.12, slideTo: strong ? 1760 : 880 });
      tone(330, 0.05, 0.45, { type: 'square', gain: 0.05, slideTo: strong ? 2640 : 1320 });
    } else if (type === 'heal') {
      notes([523, 659, 784, 1047, 1319], 0.08, 0.4, { type: 'sine', gain: 0.1 });
    } else if (type === 'genjutsu') {
      tone(300, 0, 1.0, { type: 'sine', gain: 0.12, slideTo: 150 });
      tone(310, 0, 1.0, { type: 'sine', gain: 0.12, slideTo: 140 });
    } else if (type === 'clone') {
      tone(900, 0, 0.25, { type: 'triangle', gain: 0.08, slideTo: 300 });
    } else if (type === 'release') {
      notes([1568, 2093], 0.06, 0.3, { type: 'triangle', gain: 0.1 });
    }
  },
  fail() {
    if (ctx) tone(110, 0, 0.3, { type: 'square', gain: 0.1 });
  },
  hit() {
    if (ctx) tone(120, 0, 0.35, { type: 'square', gain: 0.2, slideTo: 40 });
  },
  win() {
    if (ctx) notes([523, 659, 784, 1047], 0.12, 0.3, { type: 'triangle' });
  },
  lose() {
    if (ctx) notes([392, 330, 262, 196], 0.18, 0.35, { type: 'sine' });
  },
};
