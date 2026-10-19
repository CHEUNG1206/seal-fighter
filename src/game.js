import { Battle, ENEMIES, PLAYER_HP } from './battle.js';
import { JUTSU, ELEMENTS, effectiveness } from './jutsu.js';
import { SEALS, sealById } from './seals.js';
import { startCamera, SealReader, MAX_DISTANCE } from './camera.js';
import { loadSamples } from './samples.js';
import { unlock, sfx } from './sound.js';

const $ = id => document.getElementById(id);

let battle = new Battle();
let samples = [];
let cameraOn = false;
let cameraStarted = false;
let lastLocked = null;
let lastTime = 0;
const reader = new SealReader();

function setStatus(text) {
  $('status').textContent = text;
}

// ---------- drawing ----------

function sealGlyphs(ids, matched = 0) {
  return ids.map((id, i) => `<span class="glyph${i < matched ? ' done' : ''}">${sealById(id).name}</span>`).join('');
}

function renderScroll() {
  const progress = battle.state === 'fighting' ? battle.progressByJutsu : {};
  const enemy = battle.enemy;
  $('scroll').innerHTML = JUTSU.map(j => {
    const el = ELEMENTS[j.element];
    const strong = enemy && effectiveness(j.element, enemy.element) === 2;
    const weak = enemy && effectiveness(j.element, enemy.element) === 0.5;
    return `<li class="${strong ? 'strong' : ''}${weak ? ' weak' : ''}">
      <span class="element" style="--el:${el.colour}">${el.name}</span>
      <span class="jutsu-name">${j.name}${strong ? ' <em>剋制</em>' : ''}${weak ? ' <em>被剋</em>' : ''}</span>
      <span class="seq">${sealGlyphs(j.seals, progress[j.id] ?? 0)}</span>
    </li>`;
  }).join('');
}

function renderEnemy() {
  const e = battle.enemy;
  const el = ELEMENTS[e.element];
  $('enemyName').textContent = `${e.name} ${e.title}`;
  $('enemyElement').textContent = el.name;
  $('enemyElement').style.setProperty('--el', el.colour);
  $('stage').textContent = `第 ${battle.stage + 1} / ${ENEMIES.length} 戰`;
  $('enemy').style.setProperty('--el', el.colour);
  $('enemy').className = 'enemy appear';
}

function renderBars() {
  const e = battle.enemy;
  if (!e) return;
  $('enemyHp').style.width = `${(100 * e.hp) / e.maxHp}%`;
  $('enemyHpText').textContent = `${e.hp} / ${e.maxHp}`;
  $('charge').style.width = `${100 * battle.charge}%`;
  $('charge').parentElement.classList.toggle('danger', battle.charge > 0.75);
  $('playerHp').style.width = `${(100 * battle.playerHp) / PLAYER_HP}%`;
  $('playerHpText').textContent = `${battle.playerHp} / ${PLAYER_HP}`;
}

function renderRecent() {
  $('recent').innerHTML = battle.recent?.length
    ? sealGlyphs(battle.recent)
    : '<span class="muted">結出忍術的第一個印…</span>';
}

function say(text) {
  $('message').textContent = text;
}

// Restart a CSS animation on an element by toggling its class.
function flash(el, cls) {
  el.classList.remove(cls);
  void el.offsetWidth;
  el.classList.add(cls);
}

function floatText(text, colour) {
  const f = $('floater');
  f.textContent = text;
  f.style.color = colour;
  flash(f, 'show');
}

// ---------- events from the battle ----------

function handle(events) {
  for (const ev of events) {
    if (ev.type === 'enemy') {
      renderEnemy();
      say(`${ev.enemy.name}出現了！屬性：${ELEMENTS[ev.enemy.element].name}`);
    } else if (ev.type === 'seal') {
      const best = Math.max(0, ...Object.values(ev.progress));
      sfx.seal(best);
    } else if (ev.type === 'cast') {
      const el = ELEMENTS[ev.jutsu.element];
      sfx.cast(ev.factor > 1);
      $('effect').style.setProperty('--el', el.colour);
      flash($('effect'), 'burst');
      flash($('enemy'), 'hurt');
      floatText(`−${ev.damage}`, el.colour);
      const note = ev.factor > 1 ? '效果絕佳！蓄力被打斷' : ev.factor < 1 ? '效果不好…' : '';
      say(`${ev.jutsu.name}！ ${note}`);
    } else if (ev.type === 'hit') {
      sfx.hit();
      flash(document.body, 'shake');
      say(`${battle.enemy.name}出手了！你受到 ${ev.damage} 點傷害`);
    } else if (ev.type === 'defeated') {
      $('enemy').className = 'enemy gone';
      say(`擊敗了${ev.enemy.name}！`);
    } else if (ev.type === 'won') {
      sfx.win();
      showEnd('勝利！', `三個敵人都被你擊敗了。<br>用了 ${ev.casts} 個忍術、${Math.round(ev.seconds)} 秒，剩下 ${ev.playerHp} 點生命。`);
    } else if (ev.type === 'lost') {
      sfx.lose();
      showEnd('落敗…', `你倒在${battle.enemy.name}面前。<br>提示：看卷軸上標著「剋制」的忍術，傷害加倍還能打斷蓄力。`);
    }
  }
  renderScroll();
  renderRecent();
}

function inputSeal(id) {
  handle(battle.seal(id));
}

// ---------- loop ----------

function frame(now) {
  const dt = Math.min(0.1, (now - lastTime) / 1000);
  lastTime = now;
  handle(battle.tick(dt));
  renderBars();
  requestAnimationFrame(frame);
}

function onCameraFrame(features) {
  const { prediction, locked } = reader.read(features, samples);
  const tooFar = prediction && prediction.distance > MAX_DISTANCE;
  const shown = prediction && !tooFar && prediction.label !== 'none' ? sealById(prediction.label).name : '—';
  $('guess').textContent = shown;
  $('guess').classList.toggle('locked', Boolean(locked && locked !== 'none'));
  // A seal counts once when it locks. To use the same seal twice in a row,
  // the hands have to leave it first.
  if (locked !== lastLocked) {
    lastLocked = locked;
    if (cameraOn && locked && locked !== 'none') inputSeal(locked);
  }
}

// ---------- start and end ----------

function showEnd(title, body) {
  $('overlayTitle').textContent = title;
  $('overlayBody').innerHTML = `<p>${body}</p>`;
  $('startCamera').textContent = cameraStarted ? '再玩一次（鏡頭）' : '用鏡頭開始';
  $('startKeys').textContent = '再玩一次（鍵盤）';
  $('overlay').hidden = false;
}

function begin() {
  $('overlay').hidden = true;
  battle = new Battle();
  handle(battle.start());
}

async function beginWithCamera() {
  unlock();
  if (!cameraStarted) {
    $('startCamera').disabled = true;
    try {
      const loaded = await loadSamples();
      samples = loaded.samples;
      await startCamera({ video: $('cam'), canvas: $('view'), onFrame: onCameraFrame, onStatus: setStatus });
      cameraStarted = true;
    } catch (error) {
      setStatus(`鏡頭無法啟動：${error.message}。可以改用鍵盤玩。`);
      $('startCamera').disabled = false;
      return;
    }
  }
  cameraOn = true;
  document.body.classList.add('camera-on');
  setStatus(samples.length ? '鏡頭模式：結印吧！鍵盤也可以用。' : '沒有樣本可以辨識，請先到結印訓練錄製。');
  begin();
}

function beginWithKeys() {
  unlock();
  cameraOn = false;
  document.body.classList.remove('camera-on');
  setStatus('鍵盤模式：按印的按鍵結印。');
  begin();
}

window.addEventListener('keydown', e => {
  if (!$('overlay').hidden) return;
  const seal = SEALS.find(s => s.key === e.key && s.id !== 'none');
  if (seal) inputSeal(seal.id);
});

$('startCamera').addEventListener('click', beginWithCamera);
$('startKeys').addEventListener('click', beginWithKeys);
renderScroll();
renderRecent();
requestAnimationFrame(t => {
  lastTime = t;
  frame(t);
});

// Exposed for automated checks.
window.sealFighter = { get battle() { return battle; }, inputSeal };
