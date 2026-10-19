// Text in three languages: written Cantonese (yue), English (en), Japanese (ja).
// Pages mark static text with data-i18n="key" (or data-i18n-html for markup);
// scripts call t('key', {name: value}) for text with values in it.

export const LANGUAGES = [
  { id: 'yue', label: '粵語', htmlLang: 'zh-Hant-HK' },
  { id: 'en', label: 'English', htmlLang: 'en' },
  { id: 'ja', label: '日本語', htmlLang: 'ja' },
];

const KEYS_LINE = '1 子 · 2 丑 · 3 寅 · 4 卯 · 5 辰 · 6 巳 · 7 午 · 8 未 · 9 申 · 0 酉 · - 戌 · = 亥';

export const STRINGS = {
  yue: {
    'title.game': '結印之戰',
    'title.trainer': '結印訓練',
    'nav.trainer': '結印訓練 →',
    'nav.game': '← 返去戰鬥',
    'status.choose': '揀一個開始方法。',
    'status.loadingModel': '載入緊手部模型…',
    'status.allowCamera': '請允許使用鏡頭…',
    'status.camera': '鏡頭模式：結印啦！鍵盤都用得。',
    'status.keys': '鍵盤模式：撳印嘅按鍵結印。',
    'status.noSamples': '冇樣本可以辨識，請先去結印訓練錄低。',
    'status.cameraFailed': '鏡頭開唔到：{error}。可以改用鍵盤玩。',
    'intro.p1': '敵人儲緊力。喺佢出手之前，<strong>按次序結出忍術嘅印</strong>，打低三個敵人。',
    'intro.p2': '每個忍術都要用查克拉，查克拉會慢慢回復。有啲敵人會用幻術，中咗就要結「寅」印「解」。',
    'intro.p3': '結印嗰陣雙手放喺鏡頭前面，每個印企穩一陣。「下一個印」會畫出手勢提示。',
    'start.camera': '用鏡頭開始',
    'start.keys': '淨係用鍵盤',
    'again.camera': '再玩一次（鏡頭）',
    'again.keys': '再玩一次（鍵盤）',
    'privacy': '鏡頭畫面只喺你部瀏覽器度處理，唔會上載。',
    'label.you': '你',
    'label.charge': '儲力',
    'label.chakra': '查克拉',
    'label.stage': '第 {n} / {total} 戰',
    'label.scroll': '忍術卷軸',
    'label.next': '下一個印',
    'label.for': '→ {jutsu}',
    'label.cameraOff': '鍵盤模式：冇用鏡頭',
    'label.recentEmpty': '結出忍術嘅第一個印…',
    'label.cost': '{n} 查克拉',
    'label.language': '語言',
    'tag.counter': '剋制',
    'tag.weak': '被剋',
    'tag.caughtOnly': '中幻術先用得',
    'type.attack': '攻擊',
    'type.heal': '醫療',
    'type.genjutsu': '幻術',
    'type.clone': '分身',
    'type.release': '解',
    'el.fire': '火',
    'el.wind': '風',
    'el.lightning': '雷',
    'el.earth': '土',
    'el.water': '水',
    'enemy.golem': '泥偶',
    'enemy.wraith': '水妖',
    'enemy.oni': '炎鬼',
    'enemy.tengu': '雷天狗',
    'tip.elements': '元素相剋：火 → 風 → 雷 → 土 → 水 → 火。用剋制敵人嘅忍術，傷害加倍兼打斷佢儲力。',
    'tip.keys': `鍵盤：${KEYS_LINE}`,
    'msg.enemy': '{enemy}出現咗！屬性：{element}',
    'msg.cast': '{jutsu}！',
    'msg.strong': '{jutsu}！效果超好，打斷咗佢儲力',
    'msg.weak': '{jutsu}！效果唔係幾好…',
    'msg.heal': '{jutsu}！回復 {n} 點血',
    'msg.genjutsu': '{jutsu}！{enemy}中咗幻術，{n} 秒郁唔到',
    'msg.clone': '{jutsu}！下一招由分身頂',
    'msg.release': '解！幻術破咗',
    'msg.noChakra': '查克拉唔夠（要 {need}，得返 {have}）',
    'msg.hit': '{enemy}出手！你受咗 {n} 點傷害',
    'msg.dodged': '{enemy}打中嘅只係分身！',
    'msg.enemyGenjutsu': '你中咗{enemy}嘅幻術！結「寅」印「解」',
    'msg.genjutsuFaded': '幻術散咗',
    'msg.stunEnded': '{enemy}由幻術醒返',
    'msg.defeated': '打低咗{enemy}！',
    'end.won.title': '勝利！',
    'end.won.body': '三個敵人全部打低晒。<br>用咗 {casts} 個忍術、{seconds} 秒，仲有 {hp} 點血。',
    'end.lost.title': '落敗…',
    'end.lost.body': '你喺{enemy}面前倒低咗。<br>提示：用卷軸上標住「剋制」嘅忍術；血少就用掌仙術；中幻術就結「寅」。',
    'trainer.heading': '印',
    'trainer.samples': '{n} 個樣本',
    'trainer.sealMeta': '{n} 個樣本 · 我錄嘅 {mine}',
    'trainer.record': '錄 30 個樣本',
    'trainer.clear': '刪除呢個印嘅樣本',
    'trainer.exportAll': '匯出全部 JSON',
    'trainer.exportMine': '淨係匯出我錄嘅',
    'trainer.import': '匯入 JSON',
    'trainer.tip': '撳鍵揀印（1–9、0、-、=，「無」係 `）。每個印錄 2–3 次，每次轉少少角度、距離同左右位置。記得錄「無」，等放鬆嘅手唔會畀人當成印。',
    'trainer.ready': '準備好。揀一個印，擺好手勢，撳空白鍵或者「錄 30 個樣本」。',
    'trainer.bundled': '載入咗內建嘅 {n} 個樣本。用自己對手再錄多啲會更準。',
    'trainer.recording': '錄緊「{seal}」：仲有 {n} 個',
    'trainer.paused': '睇唔到手，暫停錄影…',
    'trainer.done': '錄好咗。轉個角度或者距離再錄一次，辨識會穩啲。',
    'trainer.confidence': '信心 {c}% · 距離 {d}',
    'trainer.noHand': '睇唔到手',
    'trainer.needSamples': '先錄啲樣本',
    'trainer.locked': '結印：{seal}',
    'trainer.nothingToExport': '冇樣本可以匯出。',
    'trainer.imported': '匯入咗 {n} 個樣本。',
    'trainer.importFailed': '匯入失敗：{error}',
    'trainer.confirmClear': '刪除「{seal}」嘅所有樣本？',
    'trainer.failed': '開唔到：{error}。請用 localhost 或者 https 打開，並允許鏡頭。',
    'animal.rat': '鼠', 'animal.ox': '牛', 'animal.tiger': '虎', 'animal.hare': '兔',
    'animal.dragon': '龍', 'animal.snake': '蛇', 'animal.horse': '馬', 'animal.ram': '羊',
    'animal.monkey': '猴', 'animal.bird': '雞', 'animal.dog': '狗', 'animal.boar': '豬',
    'animal.none': '放鬆嘅手、揮手、唔係印嘅姿勢',
  },
  en: {
    'title.game': 'Seal Fighter',
    'title.trainer': 'Seal Trainer',
    'nav.trainer': 'Seal trainer →',
    'nav.game': '← Back to battle',
    'status.choose': 'Choose how to start.',
    'status.loadingModel': 'Loading the hand model…',
    'status.allowCamera': 'Please allow camera access…',
    'status.camera': 'Camera mode: form your seals! The keyboard works too.',
    'status.keys': 'Keyboard mode: press a seal\'s key to form it.',
    'status.noSamples': 'No samples to recognise seals with. Record some in the seal trainer first.',
    'status.cameraFailed': 'The camera could not start: {error}. You can play with the keyboard.',
    'intro.p1': 'The enemy is charging up. Before it strikes, <strong>form a jutsu\'s seals in order</strong> and defeat all three enemies.',
    'intro.p2': 'Every jutsu costs chakra, which slowly recovers. Some enemies cast genjutsu on you: form the 寅 seal to Release it.',
    'intro.p3': 'Hold your hands in front of the camera and keep each seal steady for a moment. "Next seal" shows how to hold your hands.',
    'start.camera': 'Start with camera',
    'start.keys': 'Keyboard only',
    'again.camera': 'Play again (camera)',
    'again.keys': 'Play again (keyboard)',
    'privacy': 'Camera video is processed only in your browser and never uploaded.',
    'label.you': 'You',
    'label.charge': 'Charge',
    'label.chakra': 'Chakra',
    'label.stage': 'Battle {n} / {total}',
    'label.scroll': 'Jutsu scroll',
    'label.next': 'Next seal',
    'label.for': '→ {jutsu}',
    'label.cameraOff': 'Keyboard mode: camera not used',
    'label.recentEmpty': 'Form the first seal of a jutsu…',
    'label.cost': '{n} chakra',
    'label.language': 'Language',
    'tag.counter': 'strong',
    'tag.weak': 'weak',
    'tag.caughtOnly': 'only in genjutsu',
    'type.attack': 'Attack',
    'type.heal': 'Heal',
    'type.genjutsu': 'Genjutsu',
    'type.clone': 'Clone',
    'type.release': 'Release',
    'el.fire': 'Fire',
    'el.wind': 'Wind',
    'el.lightning': 'Lightning',
    'el.earth': 'Earth',
    'el.water': 'Water',
    'enemy.golem': 'Clay Golem',
    'enemy.wraith': 'Water Wraith',
    'enemy.oni': 'Flame Oni',
    'enemy.tengu': 'Thunder Tengu',
    'tip.elements': 'Elements: fire → wind → lightning → earth → water → fire. A jutsu that counters the enemy does double damage and breaks its charge.',
    'tip.keys': `Keys: ${KEYS_LINE}`,
    'msg.enemy': '{enemy} appears! Element: {element}',
    'msg.cast': '{jutsu}!',
    'msg.strong': '{jutsu}! Super effective: its charge is broken',
    'msg.weak': '{jutsu}! Not very effective…',
    'msg.heal': '{jutsu}! Restored {n} health',
    'msg.genjutsu': '{jutsu}! {enemy} is trapped for {n} seconds',
    'msg.clone': '{jutsu}! A clone will take the next attack',
    'msg.release': 'Release! The genjutsu is broken',
    'msg.noChakra': 'Not enough chakra (needs {need}, you have {have})',
    'msg.hit': '{enemy} strikes! You take {n} damage',
    'msg.dodged': '{enemy} only hit your clone!',
    'msg.enemyGenjutsu': 'You are caught in {enemy}\'s genjutsu! Form 寅 to Release',
    'msg.genjutsuFaded': 'The genjutsu wears off',
    'msg.stunEnded': '{enemy} breaks free of the illusion',
    'msg.defeated': '{enemy} defeated!',
    'end.won.title': 'Victory!',
    'end.won.body': 'All three enemies are defeated.<br>{casts} jutsu, {seconds} seconds, {hp} health left.',
    'end.lost.title': 'Defeated…',
    'end.lost.body': 'You fell before {enemy}.<br>Tip: use the jutsu marked "strong"; heal with Mystical Palm when low; form 寅 to escape genjutsu.',
    'trainer.heading': 'Seals',
    'trainer.samples': '{n} samples',
    'trainer.sealMeta': '{n} samples · mine {mine}',
    'trainer.record': 'Record 30 samples',
    'trainer.clear': 'Delete this seal\'s samples',
    'trainer.exportAll': 'Export all JSON',
    'trainer.exportMine': 'Export mine only',
    'trainer.import': 'Import JSON',
    'trainer.tip': 'Press a key to choose a seal (1–9, 0, -, =; ` for "none"). Record each seal 2–3 times, changing angle, distance and position a little. Record "none" too, so relaxed hands are not read as a seal.',
    'trainer.ready': 'Ready. Choose a seal, hold the pose, and press Space or "Record 30 samples".',
    'trainer.bundled': 'Loaded {n} bundled samples. Recording your own hands makes recognition better.',
    'trainer.recording': 'Recording {seal}: {n} to go',
    'trainer.paused': 'No hands in view, recording paused…',
    'trainer.done': 'Done. Record again from another angle or distance for steadier recognition.',
    'trainer.confidence': 'confidence {c}% · distance {d}',
    'trainer.noHand': 'no hands in view',
    'trainer.needSamples': 'record some samples first',
    'trainer.locked': 'Seal: {seal}',
    'trainer.nothingToExport': 'There are no samples to export.',
    'trainer.imported': 'Imported {n} samples.',
    'trainer.importFailed': 'Import failed: {error}',
    'trainer.confirmClear': 'Delete all samples of {seal}?',
    'trainer.failed': 'Could not start: {error}. Open the page on localhost or https and allow the camera.',
    'animal.rat': 'Rat', 'animal.ox': 'Ox', 'animal.tiger': 'Tiger', 'animal.hare': 'Hare',
    'animal.dragon': 'Dragon', 'animal.snake': 'Snake', 'animal.horse': 'Horse', 'animal.ram': 'Ram',
    'animal.monkey': 'Monkey', 'animal.bird': 'Bird', 'animal.dog': 'Dog', 'animal.boar': 'Boar',
    'animal.none': 'Relaxed hands, waving, anything that is not a seal',
  },
  ja: {
    'title.game': '結印の戦い',
    'title.trainer': '結印の修行',
    'nav.trainer': '結印の修行 →',
    'nav.game': '← 戦いへ戻る',
    'status.choose': '始め方を選んでください。',
    'status.loadingModel': '手のモデルを読み込み中…',
    'status.allowCamera': 'カメラへのアクセスを許可してください…',
    'status.camera': 'カメラモード：印を結べ！キーボードも使えます。',
    'status.keys': 'キーボードモード：印のキーを押して結ぶ。',
    'status.noSamples': '印を認識するサンプルがありません。先に結印の修行で記録してください。',
    'status.cameraFailed': 'カメラを起動できません：{error}。キーボードで遊べます。',
    'intro.p1': '敵が力を溜めている。攻撃される前に<strong>忍術の印を順番に結び</strong>、三体の敵を倒せ。',
    'intro.p2': '忍術にはチャクラが必要で、チャクラは少しずつ回復する。幻術をかけてくる敵もいる。かかったら「寅」の印で「解」！',
    'intro.p3': 'カメラの前で両手を構え、印を少しの間保つこと。「次の印」に手の形が表示される。',
    'start.camera': 'カメラで始める',
    'start.keys': 'キーボードだけ',
    'again.camera': 'もう一度（カメラ）',
    'again.keys': 'もう一度（キーボード）',
    'privacy': 'カメラの映像はブラウザ内だけで処理され、アップロードされません。',
    'label.you': 'あなた',
    'label.charge': '溜め',
    'label.chakra': 'チャクラ',
    'label.stage': '第 {n} / {total} 戦',
    'label.scroll': '忍術の巻物',
    'label.next': '次の印',
    'label.for': '→ {jutsu}',
    'label.cameraOff': 'キーボードモード：カメラ未使用',
    'label.recentEmpty': '忍術の最初の印を結ぼう…',
    'label.cost': 'チャクラ {n}',
    'label.language': '言語',
    'tag.counter': '有利',
    'tag.weak': '不利',
    'tag.caughtOnly': '幻術中のみ',
    'type.attack': '攻撃',
    'type.heal': '医療',
    'type.genjutsu': '幻術',
    'type.clone': '分身',
    'type.release': '解',
    'el.fire': '火',
    'el.wind': '風',
    'el.lightning': '雷',
    'el.earth': '土',
    'el.water': '水',
    'enemy.golem': '泥人形',
    'enemy.wraith': '水妖',
    'enemy.oni': '炎鬼',
    'enemy.tengu': '雷天狗',
    'tip.elements': '相性：火 → 風 → 雷 → 土 → 水 → 火。有利な忍術はダメージ二倍で、敵の溜めを崩す。',
    'tip.keys': `キー：${KEYS_LINE}`,
    'msg.enemy': '{enemy}が現れた！属性：{element}',
    'msg.cast': '{jutsu}！',
    'msg.strong': '{jutsu}！効果は抜群、溜めを崩した',
    'msg.weak': '{jutsu}！あまり効いていない…',
    'msg.heal': '{jutsu}！体力が {n} 回復',
    'msg.genjutsu': '{jutsu}！{enemy}は幻術にかかり {n} 秒動けない',
    'msg.clone': '{jutsu}！次の攻撃は分身が受ける',
    'msg.release': '解！幻術を破った',
    'msg.noChakra': 'チャクラが足りない（必要 {need}、残り {have}）',
    'msg.hit': '{enemy}の攻撃！{n} のダメージ',
    'msg.dodged': '{enemy}が攻撃したのは分身だった！',
    'msg.enemyGenjutsu': '{enemy}の幻術にかかった！「寅」の印で「解」',
    'msg.genjutsuFaded': '幻術が解けた',
    'msg.stunEnded': '{enemy}が幻術から覚めた',
    'msg.defeated': '{enemy}を倒した！',
    'end.won.title': '勝利！',
    'end.won.body': '三体の敵をすべて倒した。<br>忍術 {casts} 回、{seconds} 秒、残り体力 {hp}。',
    'end.lost.title': '敗北…',
    'end.lost.body': '{enemy}の前に倒れた。<br>ヒント：「有利」の忍術を使おう。体力が減ったら掌仙術、幻術には「寅」。',
    'trainer.heading': '印',
    'trainer.samples': 'サンプル {n} 個',
    'trainer.sealMeta': 'サンプル {n} 個 · 自分の {mine}',
    'trainer.record': '30 個記録する',
    'trainer.clear': 'この印のサンプルを削除',
    'trainer.exportAll': 'すべて JSON で書き出す',
    'trainer.exportMine': '自分の分だけ書き出す',
    'trainer.import': 'JSON を読み込む',
    'trainer.tip': 'キーで印を選ぶ（1–9、0、-、=、「無」は `）。各印を 2〜3 回、角度・距離・位置を少し変えて記録する。力を抜いた手が印と間違われないよう「無」も記録しよう。',
    'trainer.ready': '準備完了。印を選んで手を構え、スペースキーか「30 個記録する」を押す。',
    'trainer.bundled': '内蔵サンプル {n} 個を読み込みました。自分の手で記録するともっと正確になります。',
    'trainer.recording': '「{seal}」を記録中：残り {n} 個',
    'trainer.paused': '手が見えません。記録を一時停止中…',
    'trainer.done': '記録完了。別の角度や距離でもう一度記録すると安定します。',
    'trainer.confidence': '信頼度 {c}% · 距離 {d}',
    'trainer.noHand': '手が見えません',
    'trainer.needSamples': 'まずサンプルを記録してください',
    'trainer.locked': '結印：{seal}',
    'trainer.nothingToExport': '書き出すサンプルがありません。',
    'trainer.imported': 'サンプル {n} 個を読み込みました。',
    'trainer.importFailed': '読み込み失敗：{error}',
    'trainer.confirmClear': '「{seal}」のサンプルをすべて削除しますか？',
    'trainer.failed': '起動できません：{error}。localhost か https で開き、カメラを許可してください。',
    'animal.rat': 'ね（鼠）', 'animal.ox': 'うし（牛）', 'animal.tiger': 'とら（虎）', 'animal.hare': 'う（兎）',
    'animal.dragon': 'たつ（竜）', 'animal.snake': 'み（蛇）', 'animal.horse': 'うま（馬）', 'animal.ram': 'ひつじ（羊）',
    'animal.monkey': 'さる（猿）', 'animal.bird': 'とり（鳥）', 'animal.dog': 'いぬ（犬）', 'animal.boar': 'い（猪）',
    'animal.none': '力を抜いた手・手を振る・印ではない姿勢',
  },
};

const STORAGE_KEY = 'seal-fighter.lang';

function initialLanguage() {
  try {
    const saved = localStorage.getItem(STORAGE_KEY);
    if (STRINGS[saved]) return saved;
  } catch {
    // Storage may be blocked; fall back to the browser language.
  }
  const browser = (globalThis.navigator?.language ?? '').toLowerCase();
  if (browser.startsWith('ja')) return 'ja';
  if (browser.startsWith('en')) return 'en';
  return 'yue';
}

let current = initialLanguage();
const listeners = new Set();

export const getLang = () => current;

export function setLang(id) {
  if (!STRINGS[id] || id === current) return;
  current = id;
  try {
    localStorage.setItem(STORAGE_KEY, id);
  } catch {
    // Not saved; still switches for this visit.
  }
  applyI18n();
  for (const fn of listeners) fn(id);
}

export const onLangChange = fn => listeners.add(fn);

export function t(key, params = {}) {
  const text = STRINGS[current][key] ?? STRINGS.en[key] ?? key;
  return text.replace(/\{(\w+)\}/g, (_, name) => (name in params ? params[name] : `{${name}}`));
}

export function applyI18n(root = globalThis.document) {
  if (!root) return;
  const lang = LANGUAGES.find(l => l.id === current);
  root.documentElement.lang = lang.htmlLang;
  for (const el of root.querySelectorAll('[data-i18n]')) el.textContent = t(el.dataset.i18n);
  for (const el of root.querySelectorAll('[data-i18n-html]')) el.innerHTML = t(el.dataset.i18nHtml);
  const title = root.querySelector('[data-i18n-title]');
  if (title) root.title = `Seal Fighter · ${t(title.dataset.i18nTitle)}`;
}

// Fills `container` with one button per language.
export function mountLanguagePicker(container) {
  const render = () => {
    container.replaceChildren(...LANGUAGES.map(l => {
      const button = document.createElement('button');
      button.textContent = l.label;
      button.lang = l.htmlLang;
      button.className = l.id === current ? 'active' : '';
      button.setAttribute('aria-pressed', String(l.id === current));
      button.addEventListener('click', () => setLang(l.id));
      return button;
    }));
  };
  render();
  onLangChange(render);
}
