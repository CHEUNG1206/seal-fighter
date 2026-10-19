import { startCamera, SealReader, MAX_DISTANCE } from './camera.js';
import { SEALS, sealById } from './seals.js';
import * as store from './samples.js';
import { t, applyI18n, mountLanguagePicker, onLangChange } from './i18n.js';
import { poseSVG } from './hint.js';

const SAMPLES_PER_RECORDING = 30;
const RECORD_EVERY_MS = 100;

const $ = id => document.getElementById(id);

let samples = [];
let selected = SEALS[0].id;
let recording = null; // {left, lastAt}
let ready = false;
const reader = new SealReader();

function setStatus(text) {
  $('status').textContent = text;
}

function renderSealList() {
  const counts = store.countByLabel(samples);
  const mine = store.countByLabel(samples.filter(s => s.source === 'mine'));
  $('seals').replaceChildren(...SEALS.map(seal => {
    const button = document.createElement('button');
    button.className = 'seal' + (seal.id === selected ? ' selected' : '');
    button.innerHTML = `<span class="glyph">${seal.name}</span>
      <span class="meta"><kbd>${seal.key}</kbd> ${t('trainer.sealMeta', { n: counts[seal.id] ?? 0, mine: mine[seal.id] ?? 0 })}</span>
      <span class="animal">${t(`animal.${seal.id}`)}</span>
      <span class="thumb">${poseSVG(seal.id, 52)}</span>`;
    button.addEventListener('click', () => select(seal.id));
    return button;
  }));
  $('total').textContent = t('trainer.samples', { n: samples.length });
}

function select(id) {
  selected = id;
  renderSealList();
}

function startRecording() {
  if (!ready) return;
  recording = { left: SAMPLES_PER_RECORDING, lastAt: 0 };
  $('record').disabled = true;
}

function recordFrame(features) {
  const now = performance.now();
  if (!recording || now - recording.lastAt < RECORD_EVERY_MS) return;
  if (!features) {
    setStatus(t('trainer.paused'));
    return;
  }
  // "mine" tells the player's own samples apart from the bundled ones.
  samples.push({ label: selected, features, source: 'mine' });
  recording.lastAt = now;
  recording.left--;
  setStatus(t('trainer.recording', { seal: sealById(selected).name, n: recording.left }));
  if (recording.left === 0) {
    recording = null;
    $('record').disabled = false;
    store.save(samples);
    renderSealList();
    setStatus(t('trainer.done'));
  }
}

function showPrediction({ prediction, locked }) {
  const tooFar = prediction && prediction.distance > MAX_DISTANCE;
  const raw = prediction && !tooFar ? sealById(prediction.label) : null;
  $('guess').textContent = raw ? raw.name : tooFar ? '？' : '—';
  $('confidence').textContent = prediction
    ? t('trainer.confidence', { c: Math.round(prediction.confidence * 100), d: prediction.distance.toFixed(2) })
    : t(samples.length ? 'trainer.noHand' : 'trainer.needSamples');
  const lockedSeal = locked && locked !== 'none' ? sealById(locked) : null;
  $('locked').textContent = lockedSeal ? t('trainer.locked', { seal: lockedSeal.name }) : '';
}

function onFrame(features) {
  recordFrame(features);
  showPrediction(reader.read(features, samples));
}

function download(list, filename) {
  if (list.length === 0) {
    setStatus(t('trainer.nothingToExport'));
    return;
  }
  const blob = new Blob([store.toJSON(list)], { type: 'application/json' });
  const link = document.createElement('a');
  link.href = URL.createObjectURL(blob);
  link.download = filename;
  link.click();
  URL.revokeObjectURL(link.href);
}

async function importFile(file) {
  try {
    samples = store.parseSamples(await file.text());
    store.save(samples);
    renderSealList();
    setStatus(t('trainer.imported', { n: samples.length }));
  } catch (error) {
    setStatus(t('trainer.importFailed', { error: error.message }));
  }
}

function bindControls() {
  $('record').addEventListener('click', startRecording);
  $('export').addEventListener('click', () => download(samples, 'seal-samples.json'));
  $('exportMine').addEventListener('click', () =>
    download(samples.filter(s => s.source === 'mine'), 'my-seal-samples.json'));
  $('import').addEventListener('change', e => e.target.files[0] && importFile(e.target.files[0]));
  $('clear').addEventListener('click', () => {
    if (!confirm(t('trainer.confirmClear', { seal: sealById(selected).name }))) return;
    samples = samples.filter(s => s.label !== selected);
    store.save(samples);
    renderSealList();
  });
  window.addEventListener('keydown', e => {
    if (e.target.tagName === 'INPUT') return;
    const seal = SEALS.find(s => s.key === e.key);
    if (seal) select(seal.id);
    if (e.code === 'Space') {
      e.preventDefault();
      startRecording();
    }
  });
}

async function start() {
  bindControls();
  mountLanguagePicker($('lang'));
  onLangChange(renderSealList);
  applyI18n();
  const loaded = await store.loadSamples();
  samples = loaded.samples;
  renderSealList();
  if (loaded.bundled) setStatus(t('trainer.bundled', { n: samples.length }));
  try {
    await startCamera({ video: $('cam'), canvas: $('view'), onFrame, onStatus: setStatus });
    ready = true;
    setStatus(t('trainer.ready'));
    $('record').disabled = false;
  } catch (error) {
    setStatus(t('trainer.failed', { error: error.message }));
  }
}

start();
