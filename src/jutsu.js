// Jutsu, their seal sequences, and the elements they belong to.
//
// Sequences follow the series. Sources: setting/jutsu.csv in
// Kazuhito00/NARUTO-HandSignDetection (MIT licence) for 豪火球, 龍火, 水乱破,
// 水鮫弾, 追牙 and 分身; fan wikis for 千鳥 (丑卯申), 大突破 (寅丑戌卯巳),
// 奈落見 (巳子), 掌仙術 (丑寅, a modified ox then tiger) and 解 (寅).
// See README.md for links.

// Each element beats the next one in this cycle, and the last beats the first.
export const ELEMENT_CYCLE = ['fire', 'wind', 'lightning', 'earth', 'water'];

export const ELEMENTS = {
  fire: { colour: '#ff5a1f' },
  wind: { colour: '#7fe0b0' },
  lightning: { colour: '#ffe14a' },
  earth: { colour: '#c08a4a' },
  water: { colour: '#3fa9ff' },
};

// type: attack (damage), heal (restore health), genjutsu (freeze the enemy's
// charge), clone (dodge the next attack), release (break a genjutsu cast on
// you; only works while you are caught in one).
// power: damage for attacks, health for heals, seconds for genjutsu.
export const JUTSU = [
  { id: 'chidori', type: 'attack', element: 'lightning', seals: ['ox', 'hare', 'monkey'], chakra: 30, power: 30,
    name: { yue: '千鳥', en: 'Chidori', ja: '千鳥' } },
  { id: 'waterTrumpet', type: 'attack', element: 'water', seals: ['dragon', 'tiger', 'hare'], chakra: 25, power: 25,
    name: { yue: '水遁・水亂破', en: 'Water Release: Water Trumpet', ja: '水遁・水乱破' } },
  { id: 'dragonFlame', type: 'attack', element: 'fire', seals: ['snake', 'dragon', 'hare', 'tiger'], chakra: 35, power: 35,
    name: { yue: '火遁・龍火之術', en: 'Fire Release: Dragon Flame Technique', ja: '火遁・龍火の術' } },
  { id: 'fangedPursuit', type: 'attack', element: 'earth', seals: ['tiger', 'snake', 'dragon', 'dog'], chakra: 35, power: 35,
    name: { yue: '通靈・土遁・追牙之術', en: 'Summoning: Earth Release: Fanged Pursuit', ja: '口寄せ・土遁・追牙の術' } },
  { id: 'breakthrough', type: 'attack', element: 'wind', seals: ['tiger', 'ox', 'dog', 'hare', 'snake'], chakra: 40, power: 40,
    name: { yue: '風遁・大突破', en: 'Wind Release: Great Breakthrough', ja: '風遁・大突破' } },
  { id: 'fireball', type: 'attack', element: 'fire', seals: ['snake', 'ram', 'monkey', 'boar', 'horse', 'tiger'], chakra: 50, power: 55,
    name: { yue: '火遁・豪火球之術', en: 'Fire Release: Great Fireball Technique', ja: '火遁・豪火球の術' } },
  { id: 'waterShark', type: 'attack', element: 'water', seals: ['tiger', 'ox', 'dragon', 'hare', 'bird', 'dragon', 'ram'], chakra: 60, power: 65,
    name: { yue: '水遁・水鮫彈之術', en: 'Water Release: Water Shark Bullet', ja: '水遁・水鮫弾の術' } },
  { id: 'mysticalPalm', type: 'heal', seals: ['ox', 'tiger'], chakra: 30, power: 25,
    name: { yue: '掌仙術', en: 'Mystical Palm Technique', ja: '掌仙術' } },
  { id: 'hellViewing', type: 'genjutsu', seals: ['snake', 'rat'], chakra: 25, power: 6,
    name: { yue: '魔幻・奈落見之術', en: 'Demonic Illusion: Hell Viewing', ja: '魔幻・奈落見の術' } },
  { id: 'clone', type: 'clone', seals: ['ram', 'snake', 'tiger'], chakra: 20, power: 1,
    name: { yue: '分身術', en: 'Clone Technique', ja: '分身の術' } },
  { id: 'release', type: 'release', seals: ['tiger'], chakra: 10, power: 0,
    name: { yue: '解', en: 'Release', ja: '解' } },
];

export const jutsuById = id => JUTSU.find(j => j.id === id);

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

// The jutsu that `recent` has just completed, preferring the longest when one
// sequence ends another (火龍炎弾-style overlaps), or undefined.
export function completed(recent, list) {
  return list
    .filter(j => progress(recent, j) === j.seals.length)
    .sort((a, b) => b.seals.length - a.seals.length)[0];
}
