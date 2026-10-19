// The twelve seals, named after the earthly branches (子丑寅卯…), in the
// traditional order. "none" is hands doing nothing in particular, so that
// resting hands are not mistaken for a seal. Animal names are in i18n.js.
export const SEALS = [
  { id: 'rat', name: '子', key: '1' },
  { id: 'ox', name: '丑', key: '2' },
  { id: 'tiger', name: '寅', key: '3' },
  { id: 'hare', name: '卯', key: '4' },
  { id: 'dragon', name: '辰', key: '5' },
  { id: 'snake', name: '巳', key: '6' },
  { id: 'horse', name: '午', key: '7' },
  { id: 'ram', name: '未', key: '8' },
  { id: 'monkey', name: '申', key: '9' },
  { id: 'bird', name: '酉', key: '0' },
  { id: 'dog', name: '戌', key: '-' },
  { id: 'boar', name: '亥', key: '=' },
  { id: 'none', name: '無', key: '`' },
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
