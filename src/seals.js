// The seals this version recognises. Named after the twelve earthly branches.
// "none" is hands doing nothing in particular, so that resting hands are not
// mistaken for a seal.
export const SEALS = [
  { id: 'rat', name: '子', hint: '雙手合十', key: '1' },
  { id: 'tiger', name: '寅', hint: '雙手交扣，食指併攏向上', key: '2' },
  { id: 'monkey', name: '申', hint: '雙手掌心相疊', key: '3' },
  { id: 'boar', name: '亥', hint: '雙手握拳，拳面相對', key: '4' },
  { id: 'horse', name: '午', hint: '雙手拇指和食指圍成三角形', key: '5' },
  { id: 'none', name: '無', hint: '手隨意放鬆、揮動或擺不同姿勢', key: '0' },
];

export const sealById = id => SEALS.find(s => s.id === id);
