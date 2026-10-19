// The twelve seals, named after the earthly branches (子丑寅卯…), in the
// traditional order. "none" is hands doing nothing in particular, so that
// resting hands are not mistaken for a seal.
export const SEALS = [
  { id: 'rat', name: '子', animal: '鼠 Rat', key: '1' },
  { id: 'ox', name: '丑', animal: '牛 Ox', key: '2' },
  { id: 'tiger', name: '寅', animal: '虎 Tiger', key: '3' },
  { id: 'hare', name: '卯', animal: '兔 Hare', key: '4' },
  { id: 'dragon', name: '辰', animal: '龍 Dragon', key: '5' },
  { id: 'snake', name: '巳', animal: '蛇 Snake', key: '6' },
  { id: 'horse', name: '午', animal: '馬 Horse', key: '7' },
  { id: 'ram', name: '未', animal: '羊 Ram', key: '8' },
  { id: 'monkey', name: '申', animal: '猴 Monkey', key: '9' },
  { id: 'bird', name: '酉', animal: '雞 Bird', key: '0' },
  { id: 'dog', name: '戌', animal: '狗 Dog', key: '-' },
  { id: 'boar', name: '亥', animal: '豬 Boar', key: '=' },
  { id: 'none', name: '無', animal: '放鬆的手、揮手、不是印的姿勢', key: '`' },
];

export const sealById = id => SEALS.find(s => s.id === id);

// Folder names used by photo datasets, mapped to seal ids.
const ALIASES = {
  rooster: 'bird', sheep: 'ram', goat: 'ram', rabbit: 'hare', serpent: 'snake',
  pig: 'boar', mouse: 'rat', none: 'none', nothing: 'none',
};

export function labelFromFolder(folder) {
  const name = folder.trim().toLowerCase();
  if (sealById(name)) return name;
  if (ALIASES[name]) return ALIASES[name];
  const branch = SEALS.find(s => s.name === folder.trim());
  return branch ? branch.id : null;
}
