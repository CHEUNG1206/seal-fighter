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

export const sfx = {
  seal(step) {
    if (ctx) tone(440 * 2 ** (step / 6), 0, 0.12, { type: 'triangle' });
  },
  cast(strong) {
    if (!ctx) return;
    tone(220, 0, 0.5, { type: 'sawtooth', gain: 0.12, slideTo: strong ? 1760 : 880 });
    tone(330, 0.05, 0.45, { type: 'square', gain: 0.05, slideTo: strong ? 2640 : 1320 });
  },
  hit() {
    if (ctx) tone(120, 0, 0.35, { type: 'square', gain: 0.2, slideTo: 40 });
  },
  win() {
    if (ctx) [523, 659, 784, 1047].forEach((f, i) => tone(f, i * 0.12, 0.3, { type: 'triangle' }));
  },
  lose() {
    if (ctx) [392, 330, 262, 196].forEach((f, i) => tone(f, i * 0.18, 0.35, { type: 'sine' }));
  },
};
