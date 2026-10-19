// Original SVG illustrations of the enemies. Parts carry class names
// (eyes, arm, flame, wing, cracks, armour…) that style.css animates and that
// change with the enemy's state (charging, hurt, hardened, enraged…).

const golem = `
<svg viewBox="0 0 200 200" class="art golem" aria-hidden="true">
  <g class="body">
    <rect x="60" y="150" width="30" height="40" rx="6" fill="#6e5236"/>
    <rect x="110" y="150" width="30" height="40" rx="6" fill="#6e5236"/>
    <g class="arm arm-left">
      <rect x="18" y="80" width="32" height="66" rx="12" fill="#8a6a45" stroke="#4a3420" stroke-width="3"/>
      <circle cx="34" cy="150" r="18" fill="#7a5a3a" stroke="#4a3420" stroke-width="3"/>
    </g>
    <g class="arm arm-right">
      <rect x="150" y="80" width="32" height="66" rx="12" fill="#8a6a45" stroke="#4a3420" stroke-width="3"/>
      <circle cx="166" cy="150" r="18" fill="#7a5a3a" stroke="#4a3420" stroke-width="3"/>
    </g>
    <path d="M46 72 L154 72 L162 158 L38 158 Z" fill="#9a7650" stroke="#4a3420" stroke-width="3"/>
    <path d="M58 90 L80 86 M120 86 L142 92 M64 130 L86 136" stroke="#7a5a3a" stroke-width="4" stroke-linecap="round"/>
    <rect x="70" y="24" width="60" height="52" rx="8" fill="#a8845a" stroke="#4a3420" stroke-width="3"/>
    <g class="eyes">
      <rect class="eye" x="81" y="42" width="14" height="9" rx="2" fill="#ffd25a"/>
      <rect class="eye" x="105" y="42" width="14" height="9" rx="2" fill="#ffd25a"/>
    </g>
    <path d="M86 62 L114 62" stroke="#4a3420" stroke-width="4" stroke-linecap="round"/>
    <path class="rune" d="M100 92 L114 114 L100 136 L86 114 Z M100 104 L100 124" fill="none" stroke="#ffd25a" stroke-width="4" stroke-linejoin="round"/>
    <g class="cracks" fill="none" stroke="#2e1e10" stroke-width="3" stroke-linecap="round">
      <path class="crack-1" d="M58 78 l12 16 l-5 14 l9 10"/>
      <path class="crack-1" d="M88 26 l6 12 l-4 8"/>
      <path class="crack-2" d="M146 96 l-12 14 l7 16 l-8 12"/>
      <path class="crack-2" d="M120 140 l10 10"/>
    </g>
    <g class="armour" fill="#6b707a" stroke="#d6d9e0" stroke-width="2.5" stroke-linejoin="round">
      <path d="M42 70 L100 60 L158 70 L152 104 L48 104 Z"/>
      <path d="M64 20 L136 20 L140 40 L60 40 Z"/>
      <path d="M14 84 L52 84 L50 112 L16 112 Z"/>
      <path d="M148 84 L186 84 L184 112 L150 112 Z"/>
    </g>
  </g>
</svg>`;

const wraith = `
<svg viewBox="0 0 200 200" class="art wraith" aria-hidden="true">
  <defs>
    <radialGradient id="wraithBody" cx="40%" cy="32%" r="70%">
      <stop offset="0" stop-color="#e2f7ff"/>
      <stop offset="0.45" stop-color="#5ab8ff"/>
      <stop offset="1" stop-color="#174f9a"/>
    </radialGradient>
  </defs>
  <g class="body">
    <path class="tail" d="M58 96 C48 140 78 158 66 192 C92 172 102 178 98 198 C114 172 128 182 136 194 C128 160 152 142 142 96 Z"
      fill="url(#wraithBody)" opacity="0.85"/>
    <g class="arm arm-left"><path d="M58 92 C30 100 22 128 34 146" stroke="#7fd0ff" stroke-width="11" fill="none" stroke-linecap="round" opacity="0.9"/></g>
    <g class="arm arm-right"><path d="M142 92 C170 100 178 128 166 146" stroke="#7fd0ff" stroke-width="11" fill="none" stroke-linecap="round" opacity="0.9"/></g>
    <ellipse cx="100" cy="82" rx="50" ry="54" fill="url(#wraithBody)"/>
    <path d="M62 60 C76 40 124 40 138 60" stroke="#e2f7ff" stroke-width="4" fill="none" opacity="0.6" stroke-linecap="round"/>
    <path d="M68 66 L94 74 M132 66 L106 74" stroke="#0a2a50" stroke-width="5" stroke-linecap="round"/>
    <g class="eyes">
      <path class="eye" d="M70 78 Q84 70 96 82 Q84 90 70 78 Z" fill="#f0fcff"/>
      <path class="eye" d="M130 78 Q116 70 104 82 Q116 90 130 78 Z" fill="#f0fcff"/>
      <circle cx="86" cy="80" r="3.5" fill="#0a2a50"/>
      <circle cx="114" cy="80" r="3.5" fill="#0a2a50"/>
    </g>
    <path class="mouth" d="M80 108 Q88 102 94 110 Q100 116 106 110 Q112 102 120 108 Q112 124 100 124 Q88 124 80 108 Z" fill="#0a2a50"/>
    <path d="M90 112 l3 6 l3 -5 M104 113 l3 5 l3 -6" stroke="#e2f7ff" stroke-width="2" fill="none"/>
    <circle class="drop drop-1" cx="52" cy="40" r="5" fill="#bfe8ff"/>
    <circle class="drop drop-2" cx="150" cy="34" r="4" fill="#bfe8ff"/>
    <circle class="drop drop-3" cx="160" cy="70" r="3" fill="#bfe8ff"/>
  </g>
</svg>`;

const oni = `
<svg viewBox="0 0 200 200" class="art oni" aria-hidden="true">
  <g class="body">
    <g class="flames">
      <path class="flame flame-1" d="M40 110 C20 70 50 50 44 18 C70 40 72 60 66 80 Z" fill="#ff7a1a"/>
      <path class="flame flame-2" d="M160 110 C180 70 150 50 156 18 C130 40 128 60 134 80 Z" fill="#ff7a1a"/>
      <path class="flame flame-3" d="M70 52 C64 24 90 18 100 0 C110 18 136 24 130 52 Z" fill="#ffb020"/>
      <path class="flame flame-4" d="M84 46 C82 28 96 22 100 10 C104 22 118 28 116 46 Z" fill="#fff0a0"/>
    </g>
    <path d="M46 96 Q46 44 100 44 Q154 44 154 96 Q154 156 100 166 Q46 156 46 96 Z" fill="#c8321e" stroke="#4a0a04" stroke-width="3"/>
    <path class="horn" d="M64 60 L46 16 L82 50 Z" fill="#f2e2c2" stroke="#4a0a04" stroke-width="2"/>
    <path class="horn" d="M136 60 L154 16 L118 50 Z" fill="#f2e2c2" stroke="#4a0a04" stroke-width="2"/>
    <path class="brow" d="M66 76 L94 86" stroke="#2a0602" stroke-width="7" stroke-linecap="round"/>
    <path class="brow" d="M134 76 L106 86" stroke="#2a0602" stroke-width="7" stroke-linecap="round"/>
    <g class="eyes">
      <ellipse class="eye" cx="82" cy="96" rx="10" ry="8" fill="#ffe14a"/>
      <ellipse class="eye" cx="118" cy="96" rx="10" ry="8" fill="#ffe14a"/>
      <circle class="pupil" cx="84" cy="97" r="4" fill="#2a0602"/>
      <circle class="pupil" cx="116" cy="97" r="4" fill="#2a0602"/>
    </g>
    <path d="M96 104 L100 116 L104 104" fill="none" stroke="#4a0a04" stroke-width="3"/>
    <path class="mouth" d="M70 126 Q100 144 130 126 L126 136 Q100 154 74 136 Z" fill="#2a0602"/>
    <path d="M78 128 l5 11 l5 -8 Z M112 132 l5 8 l5 -11 Z" fill="#fff"/>
  </g>
</svg>`;

const tengu = `
<svg viewBox="0 0 200 200" class="art tengu" aria-hidden="true">
  <g class="body">
    <g class="wing wing-left">
      <path d="M92 96 C44 50 12 74 4 128 C26 114 40 124 54 140 C64 120 80 116 92 112 Z" style="fill:var(--wing)"/>
      <path d="M20 112 L46 104 M30 128 L56 116 M44 138 L66 124" stroke="#00000055" stroke-width="3"/>
    </g>
    <g class="wing wing-right">
      <path d="M108 96 C156 50 188 74 196 128 C174 114 160 124 146 140 C136 120 120 116 108 112 Z" style="fill:var(--wing)"/>
      <path d="M180 112 L154 104 M170 128 L144 116 M156 138 L134 124" stroke="#00000055" stroke-width="3"/>
    </g>
    <path d="M70 100 L130 100 L148 190 L52 190 Z" style="fill:var(--robe)" stroke="#120e24" stroke-width="3"/>
    <path d="M100 100 L100 190 M80 104 L100 130 L120 104" stroke="#e8e0c8" stroke-width="4" fill="none"/>
    <g class="staff">
      <path d="M156 70 L150 186" stroke="#7a5a3a" stroke-width="5" stroke-linecap="round"/>
      <path class="fan" d="M156 70 C140 50 146 30 160 22 C176 30 180 50 162 70 Z" style="fill:var(--accent)"/>
    </g>
    <circle cx="100" cy="72" r="30" fill="#e8d5b0" stroke="#120e24" stroke-width="3"/>
    <path d="M70 66 Q100 50 130 66 L128 88 Q100 98 72 88 Z" fill="#c8202a" stroke="#4a0a0e" stroke-width="2"/>
    <path class="nose" d="M96 74 C110 76 132 84 146 96 C128 94 108 90 96 84 Z" fill="#d82a34" stroke="#4a0a0e" stroke-width="2"/>
    <g class="eyes">
      <path class="eye" d="M78 70 L94 74 L80 78 Z" fill="#ffe14a"/>
      <path class="eye" d="M122 70 L106 74 L120 78 Z" fill="#ffe14a"/>
    </g>
    <rect x="90" y="36" width="20" height="14" rx="2" fill="#111"/>
    <path d="M70 48 Q100 30 130 48" stroke="#eee" stroke-width="5" fill="none" stroke-linecap="round"/>
    <g class="sparks" fill="none" style="stroke:var(--accent)" stroke-width="3" stroke-linecap="round" stroke-linejoin="round">
      <path class="spark spark-1" d="M30 40 l8 10 l-6 4 l10 12"/>
      <path class="spark spark-2" d="M176 34 l-8 10 l6 4 l-10 12"/>
      <path class="spark spark-3" d="M20 160 l10 -6 l2 8 l12 -6"/>
    </g>
  </g>
</svg>`;

const ART = { golem, wraith, oni, tengu };

export function enemySVG(id) {
  return ART[id] ?? '';
}
