import { Battle, ENEMIES, PLAYER_HP, MAX_CHAKRA, BREATH_SECONDS } from './battle.js';
import { JUTSU, ELEMENTS, effectiveness, progress } from './jutsu.js';
import { SEALS, sealById } from './seals.js';
import { startCamera, SealReader, MAX_DISTANCE } from './camera.js';
import { loadSamples } from './samples.js';
import { unlock, sfx } from './sound.js';
import { t, getLang, applyI18n, mountLanguagePicker, onLangChange } from './i18n.js';
import { poseSVG, drawGhost } from './hint.js';
import { createEffects, effectFor } from './effects.js';
import { BodyTracker } from './bodyTracker.js';
import { Steady, JAW_OPEN, handsCentre } from './body.js';
import { drawSilhouette, toStage } from './silhouette.js';

const $ = id => document.getElementById(id);

let battle = new Battle();
let samples = [];
let cameraOn = false;
let cameraStarted = false;
let lastLocked = null;
let lastTime = 0;
let ending = null; // {titleKey, bodyKey, params} while the end screen shows
const reader = new SealReader();
const fx = createEffects($('fx'));

// Body moves in camera mode: blowing fire (face), guarding (pose) and the
// player's silhouette in the arena (segmentation). Each can be switched off.
const body = new BodyTracker();
const BODY_OPTIONS_KEY = 'seal-fighter.body';
const options = loadOptions();
const blow = new Steady(3); // mouth open for 3 frames in a row
const poseGuard = new Steady(2);
let poseGuarding = false;
let keyGuarding = false; // Space held
let lastHands = null; // the latest hand landmarks, for where jutsu start

function loadOptions() {
  const defaults = { face: true, pose: true, segment: true };
  try {
    return { ...defaults, ...JSON.parse(localStorage.getItem(BODY_OPTIONS_KEY) ?? '{}') };
  } catch {
    return defaults;
  }
}

function saveOptions() {
  try {
    localStorage.setItem(BODY_OPTIONS_KEY, JSON.stringify(options));
  } catch {
    // Not saved; the choice still applies to this visit.
  }
}

// Loads a body model in the background; the battle does not wait for it. If
// it fails, that move falls back to its key and the player is told why.
function enableBody(kind) {
  if (!cameraStarted || !options[kind] || body.ready(kind)) return;
  body.enable(kind).catch(error => {
    options[kind] = false;
    $(`opt${kind[0].toUpperCase()}${kind.slice(1)}`).checked = false;
    setStatus(() => t('body.failed', { feature: t(`feature.${kind}`), error: error.message }));
  });
}

const jutsuName = j => j.name[getLang()];
const enemyName = e => t(`enemy.${e.id}`);
const elementName = el => t(`el.${el}`);
const fighting = () => battle.state === 'fighting';

// Status and battle messages are kept as functions that produce the text, so
// they can be shown again in another language when the player switches.
let statusText = () => t('status.choose');
let messageText = () => '\u00a0';

function setStatus(text) {
  statusText = typeof text === 'function' ? text : () => text;
  $('status').textContent = statusText();
}

function say(text) {
  messageText = text;
  $('message').textContent = messageText();
}

// ---------- what to suggest next ----------

const canCast = j => battle.available.includes(j);

// The seal to show as a hint, and the jutsu it belongs to: carry on with the
// jutsu the player is furthest into; otherwise start 解 when caught, or the
// best attack against this enemy that chakra allows.
function hintTarget() {
  if (!fighting() || battle.breath) return null;
  const options = JUTSU.filter(canCast);
  let best = null;
  let bestProgress = 0;
  for (const j of options) {
    const p = progress(battle.recent, j);
    if (p > bestProgress) [best, bestProgress] = [j, p];
  }
  if (!best) {
    const affordable = options.filter(j => j.chakra <= battle.chakra);
    const score = j => (j.type === 'attack' ? effectiveness(j.element, battle.enemy.element) * 10 - j.seals.length : 0);
    best = [...(affordable.length ? affordable : options)].sort((a, b) => score(b) - score(a))[0];
    bestProgress = 0;
  }
  return best ? { jutsu: best, seal: best.seals[bestProgress] } : null;
}

// ---------- drawing ----------

function sealGlyphs(ids, matched = 0) {
  return ids.map((id, i) => `<span class="glyph${i < matched ? ' done' : ''}">${sealById(id).name}</span>`).join('');
}

function renderScroll() {
  const prog = fighting() ? battle.progressByJutsu : {};
  const enemy = battle.enemy;
  $('scroll').innerHTML = JUTSU.map(j => {
    const factor = enemy && j.type === 'attack' ? effectiveness(j.element, enemy.element) : 1;
    const badge = j.type === 'attack'
      ? `<span class="element" style="--el:${ELEMENTS[j.element].colour}">${elementName(j.element)}</span>`
      : `<span class="element type-${j.type}">${t(`type.${j.type}`)}</span>`;
    const tags = [
      factor === 2 ? `<em>${t('tag.counter')}</em>` : '',
      factor === 0.5 ? `<em class="weak">${t('tag.weak')}</em>` : '',
      j.type === 'release' ? `<em>${t('tag.caughtOnly')}</em>` : '',
      j.breath ? `<em class="breath">${t('tag.breath')}</em>` : '',
    ].join('');
    const classes = [
      factor === 2 ? 'strong' : '',
      factor === 0.5 ? 'weak' : '',
      fighting() && !canCast(j) ? 'disabled' : '',
      fighting() && j.chakra > battle.chakra ? 'poor' : '',
    ].join(' ');
    return `<li class="${classes}">
      ${badge}
      <span class="jutsu-name">${jutsuName(j)} ${tags}</span>
      <span class="seq">${sealGlyphs(j.seals, prog[j.id] ?? 0)}</span>
      <span class="cost">${t('label.cost', { n: j.chakra })}</span>
    </li>`;
  }).join('');
}

function renderHint() {
  const target = hintTarget();
  if (!target) {
    $('hint').innerHTML = '';
    return;
  }
  const seal = sealById(target.seal);
  $('hint').innerHTML = `<div class="hint-label">${t('label.next')}</div>
    <div class="hint-body">
      <span class="hint-glyph">${seal.name}</span>
      ${poseSVG(seal.id, 96)}
    </div>
    <div class="hint-meta">${t(`animal.${seal.id}`)}<br>${t('label.for', { jutsu: jutsuName(target.jutsu) })}</div>`;
}

function renderEnemy() {
  const e = battle.enemy;
  if (!e) return;
  const colour = ELEMENTS[e.element].colour;
  $('enemyName').textContent = enemyName(e);
  $('enemyElement').textContent = elementName(e.element);
  $('enemyElement').style.setProperty('--el', colour);
  $('stage').textContent = t('label.stage', { n: battle.stage + 1, total: ENEMIES.length });
  $('enemy').style.setProperty('--el', colour);
}

function renderBars() {
  const e = battle.enemy;
  if (!e) return;
  $('enemyHp').style.width = `${(100 * e.hp) / e.maxHp}%`;
  $('enemyHpText').textContent = `${e.hp} / ${e.maxHp}`;
  $('charge').style.width = `${100 * battle.charge}%`;
  $('charge').parentElement.classList.toggle('danger', battle.charge > 0.75 && !battle.stunned);
  $('charge').parentElement.classList.toggle('frozen', battle.stunned > 0);
  $('playerHp').style.width = `${(100 * battle.playerHp) / PLAYER_HP}%`;
  $('playerHpText').textContent = `${battle.playerHp} / ${PLAYER_HP}`;
  const chakra = Math.floor(battle.chakra);
  $('chakra').style.width = `${(100 * battle.chakra) / MAX_CHAKRA}%`;
  $('chakraText').textContent = `${t('label.chakra')} ${chakra} / ${MAX_CHAKRA}`;
  document.body.classList.toggle('caught', battle.caught > 0);
  $('enemy').classList.toggle('stunned', battle.stunned > 0);
  document.body.classList.toggle('clone-ready', Boolean(battle.cloneReady));
  renderBody();
}

function renderBody() {
  const breathing = Boolean(battle.breath) && fighting();
  $('breathPrompt').hidden = !breathing;
  if (breathing) $('breathTime').style.width = `${(100 * battle.breath.left) / BREATH_SECONDS}%`;
  document.body.classList.toggle('face-on', cameraOn && options.face && body.ready('face'));
  document.body.classList.toggle('silhouette-on', cameraOn && options.segment && body.ready('segment'));
  document.body.classList.toggle('guarding', Boolean(battle.guarding));
  $('guardBadge').hidden = !battle.guarding;
}

// Where a jutsu starts on the stage: the player's hands (or mouth, for fire
// breath) on the silhouette when it is shown, otherwise the bottom middle.
function originFor(part) {
  if (!document.body.classList.contains('silhouette-on')) return undefined;
  const canvas = $('silhouette');
  const box = { left: canvas.offsetLeft, top: canvas.offsetTop, width: canvas.offsetWidth, height: canvas.offsetHeight };
  const point = part === 'mouth' ? body.latest.mouth : handsCentre(lastHands);
  return point ? toStage(point, box) : { x: box.left + box.width / 2, y: box.top + box.height * 0.5 };
}

function renderRecent() {
  $('recent').innerHTML = battle.recent?.length
    ? sealGlyphs(battle.recent)
    : `<span class="muted">${t('label.recentEmpty')}</span>`;
}

function renderAll() {
  renderEnemy();
  renderScroll();
  renderRecent();
  renderHint();
  renderBars();
  $('status').textContent = statusText();
  $('message').textContent = messageText();
  if (ending) showEnd(ending);
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

function onCast(ev) {
  const j = ev.jutsu;
  const enemy = battle.enemy;
  fx.play(ev.breathed ? 'breathFire' : effectFor(j), { origin: originFor(ev.breathed ? 'mouth' : 'hands') });
  if (ev.breathed) sfx.breath();
  else sfx.jutsu(j.type, ev.factor > 1);
  if (j.type === 'attack') {
    flash($('enemy'), 'hurt');
    floatText(`−${ev.damage}`, ELEMENTS[j.element].colour);
    // A weak breath keeps the "too weak" message from breathFaded.
    if (ev.breathed === false) return;
    say(() => t(ev.breathed ? 'msg.breathed'
      : ev.factor > 1 ? 'msg.strong' : ev.factor < 1 ? 'msg.weak' : 'msg.cast', { jutsu: jutsuName(j) }));
  } else if (j.type === 'heal') {
    floatText(`+${ev.healed}`, '#5fdc8a');
    say(() => t('msg.heal', { jutsu: jutsuName(j), n: ev.healed }));
  } else if (j.type === 'genjutsu') {
    say(() => t('msg.genjutsu', { jutsu: jutsuName(j), enemy: enemyName(enemy), n: ev.seconds }));
  } else if (j.type === 'clone') {
    say(() => t('msg.clone', { jutsu: jutsuName(j) }));
  } else if (j.type === 'release') {
    say(() => t('msg.release'));
  }
}

function handle(events) {
  for (const ev of events) {
    const enemy = battle.enemy;
    if (ev.type === 'enemy') {
      renderEnemy();
      flash($('enemy'), 'appear');
      $('enemy').classList.remove('gone');
      say(() => t('msg.enemy', { enemy: enemyName(ev.enemy), element: elementName(ev.enemy.element) }));
    } else if (ev.type === 'seal') {
      sfx.seal(Math.max(0, ...Object.values(ev.progress)));
    } else if (ev.type === 'cast') {
      onCast(ev);
    } else if (ev.type === 'breathReady') {
      sfx.inhale();
      blow.reset();
      say(() => t('msg.breathReady', { jutsu: jutsuName(ev.jutsu) }));
    } else if (ev.type === 'breathFaded') {
      say(() => t('msg.breathFaded', { jutsu: jutsuName(ev.jutsu) }));
    } else if (ev.type === 'hit' && ev.guarded) {
      sfx.guard();
      fx.play('guard', { origin: originFor('hands') });
      say(() => t('msg.guarded', { enemy: enemyName(enemy), n: ev.damage }));
    } else if (ev.type === 'noChakra') {
      sfx.fail();
      say(() => t('msg.noChakra', { need: ev.jutsu.chakra, have: Math.floor(ev.chakra) }));
    } else if (ev.type === 'hit') {
      sfx.hit();
      fx.play('enemyHit');
      flash(document.body, 'shake');
      say(() => t('msg.hit', { enemy: enemyName(enemy), n: ev.damage }));
    } else if (ev.type === 'dodged') {
      sfx.jutsu('clone');
      fx.play('clone');
      say(() => t('msg.dodged', { enemy: enemyName(enemy) }));
    } else if (ev.type === 'enemyGenjutsu') {
      sfx.jutsu('genjutsu');
      fx.play('enemyGenjutsu');
      say(() => t('msg.enemyGenjutsu', { enemy: enemyName(enemy) }));
    } else if (ev.type === 'genjutsuFaded') {
      say(() => t('msg.genjutsuFaded'));
    } else if (ev.type === 'stunEnded') {
      say(() => t('msg.stunEnded', { enemy: enemyName(enemy) }));
    } else if (ev.type === 'defeated') {
      $('enemy').classList.add('gone');
      say(() => t('msg.defeated', { enemy: enemyName(ev.enemy) }));
    } else if (ev.type === 'won') {
      sfx.win();
      showEnd({ titleKey: 'end.won.title', bodyKey: 'end.won.body',
        params: { casts: ev.casts, seconds: Math.round(ev.seconds), hp: ev.playerHp } });
    } else if (ev.type === 'lost') {
      sfx.lose();
      showEnd({ titleKey: 'end.lost.title', bodyKey: 'end.lost.body', params: { enemyId: enemy.id } });
    }
  }
  if (events.length) {
    renderScroll();
    renderRecent();
    renderHint();
  }
}

function inputSeal(id) {
  handle(battle.seal(id));
}

// ---------- loop ----------

let hintClock = 0;
function frame(now) {
  // Capped so that returning to a hidden tab does not jump the battle ahead,
  // but loose enough that timers keep real time on a slow computer.
  const dt = Math.min(0.25, (now - lastTime) / 1000);
  lastTime = now;
  battle.setGuard(keyGuarding || poseGuarding);
  handle(battle.tick(dt));
  renderBars();
  // Chakra changes which jutsu are affordable; refresh the scroll now and then.
  hintClock += dt;
  if (hintClock > 0.5 && fighting()) {
    hintClock = 0;
    renderScroll();
    renderHint();
  }
  requestAnimationFrame(frame);
}

function onCameraFrame(features, result) {
  lastHands = result?.landmarks?.length ? result.landmarks : null;
  const { prediction, locked } = reader.read(features, samples);
  const tooFar = prediction && prediction.distance > MAX_DISTANCE;
  $('guess').textContent = prediction && !tooFar && prediction.label !== 'none' ? sealById(prediction.label).name : '—';
  $('guess').classList.toggle('locked', Boolean(locked && locked !== 'none'));
  // A seal counts once when it locks. To use the same seal twice in a row,
  // the hands have to leave it first.
  if (locked !== lastLocked) {
    lastLocked = locked;
    if (cameraOn && locked && locked !== 'none') inputSeal(locked);
  }
  if (cameraOn) readBody();
}

function readBody() {
  const video = $('cam');
  const latest = body.update(video, {
    face: options.face && Boolean(battle.breath),
    pose: options.pose && fighting(),
    segment: options.segment,
  });
  if (battle.breath && body.ready('face')) {
    $('jawMeter').style.width = `${Math.min(1, latest.jaw / JAW_OPEN) * 100}%`;
    if (blow.update(latest.jaw >= JAW_OPEN)) {
      blow.reset();
      handle(battle.breathe());
    }
  }
  poseGuarding = options.pose && body.ready('pose') && poseGuard.update(latest.guard);
  if (options.segment && body.ready('segment')) drawSilhouette($('silhouette'), video, latest.mask);
}

// The next seal's pose, faintly behind the player's hands.
function drawCameraHint(ctx) {
  const target = hintTarget();
  if (target) drawGhost(ctx, target.seal, 0.4);
}

// ---------- start and end ----------

function showEnd(end) {
  ending = end;
  const params = { ...end.params };
  if (params.enemyId) params.enemy = t(`enemy.${params.enemyId}`);
  $('overlayTitle').textContent = t(end.titleKey);
  $('overlayBody').innerHTML = `<p>${t(end.bodyKey, params)}</p>`;
  $('startCamera').textContent = t(cameraStarted ? 'again.camera' : 'start.camera');
  $('startKeys').textContent = t('again.keys');
  $('overlay').hidden = false;
}

function begin() {
  ending = null;
  $('overlay').hidden = true;
  battle = new Battle();
  handle(battle.start());
  renderAll();
}

async function beginWithCamera() {
  unlock();
  if (!cameraStarted) {
    $('startCamera').disabled = true;
    try {
      samples = (await loadSamples()).samples;
      await startCamera({ video: $('cam'), canvas: $('view'), onFrame: onCameraFrame,
        onStatus: setStatus, drawOverlay: drawCameraHint });
      cameraStarted = true;
      for (const kind of ['face', 'pose', 'segment']) enableBody(kind);
    } catch (error) {
      setStatus(() => t('status.cameraFailed', { error: error.message }));
      $('startCamera').disabled = false;
      return;
    }
  }
  cameraOn = true;
  document.body.classList.add('camera-on');
  setStatus(() => t(samples.length ? 'status.camera' : 'status.noSamples'));
  begin();
}

function beginWithKeys() {
  unlock();
  cameraOn = false;
  document.body.classList.remove('camera-on');
  setStatus(() => t('status.keys'));
  begin();
}

window.addEventListener('keydown', e => {
  if (!$('overlay').hidden) return;
  if (e.code === 'Space') {
    e.preventDefault(); // hold to guard, without scrolling the page
    keyGuarding = true;
    return;
  }
  if (e.key === 'f' || e.key === 'F') {
    handle(battle.breathe());
    return;
  }
  const seal = SEALS.find(s => s.key === e.key && s.id !== 'none');
  if (seal) inputSeal(seal.id);
});
window.addEventListener('keyup', e => {
  if (e.code === 'Space') keyGuarding = false;
});
// Letting go of the window should not leave the guard stuck on.
window.addEventListener('blur', () => {
  keyGuarding = false;
});

for (const kind of ['face', 'pose', 'segment']) {
  const box = $(`opt${kind[0].toUpperCase()}${kind.slice(1)}`);
  box.checked = options[kind];
  box.addEventListener('change', () => {
    options[kind] = box.checked;
    saveOptions();
    enableBody(kind);
    renderBody();
  });
}

$('startCamera').addEventListener('click', beginWithCamera);
$('startKeys').addEventListener('click', beginWithKeys);
mountLanguagePicker($('lang'));
onLangChange(renderAll);
applyI18n();
renderAll();
requestAnimationFrame(time => {
  lastTime = time;
  frame(time);
});

// Exposed for automated checks.
window.sealFighter = { get battle() { return battle; }, inputSeal, fx, body, options };
