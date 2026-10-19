// Jutsu, their seal sequences, and the elements they belong to.
// Sequences favour the seals that are recognised most reliably (亥 酉 午 丑
// 申 巳 卯); see samples/README.md.

// Each element beats the next one in this cycle, and the last beats the first.
export const ELEMENT_CYCLE = ['fire', 'wind', 'lightning', 'earth', 'water'];

export const ELEMENTS = {
  fire: { name: '火', colour: '#ff5a1f' },
  wind: { name: '風', colour: '#7fe0b0' },
  lightning: { name: '雷', colour: '#ffe14a' },
  earth: { name: '土', colour: '#c08a4a' },
  water: { name: '水', colour: '#3fa9ff' },
};

export const JUTSU = [
  { id: 'ember', name: '火遁・赤焰彈', element: 'fire', seals: ['snake', 'horse', 'boar'] },
  { id: 'gale', name: '風遁・裂空刃', element: 'wind', seals: ['rat', 'boar', 'bird'] },
  { id: 'spark', name: '雷遁・閃牙', element: 'lightning', seals: ['horse', 'bird', 'ox'] },
  { id: 'stone', name: '土遁・岩槍', element: 'earth', seals: ['boar', 'dog', 'snake'] },
  { id: 'tide', name: '水遁・潮渦', element: 'water', seals: ['ox', 'monkey', 'hare'] },
];

export const BASE_DAMAGE = 25;

// 2 when `attack` beats `defence`, 0.5 when it is beaten by it, 1 otherwise.
export function effectiveness(attack, defence) {
  const i = ELEMENT_CYCLE.indexOf(attack);
  const j = ELEMENT_CYCLE.indexOf(defence);
  if (i < 0 || j < 0) return 1;
  if ((i + 1) % ELEMENT_CYCLE.length === j) return 2;
  if ((j + 1) % ELEMENT_CYCLE.length === i) return 0.5;
  return 1;
}

// The element that beats `element`.
export function counterTo(element) {
  const j = ELEMENT_CYCLE.indexOf(element);
  return ELEMENT_CYCLE[(j - 1 + ELEMENT_CYCLE.length) % ELEMENT_CYCLE.length];
}

// How many seals of `jutsu` the end of `recent` already matches.
export function progress(recent, jutsu) {
  for (let n = Math.min(jutsu.seals.length, recent.length); n > 0; n--) {
    const tail = recent.slice(recent.length - n);
    if (tail.every((seal, i) => seal === jutsu.seals[i])) return n;
  }
  return 0;
}
