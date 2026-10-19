import { toFeatures } from './features.js';
import { classify, Stabiliser } from './knn.js';
import { SEALS, sealById } from './seals.js';
import * as store from './samples.js';

const VISION = 'https://cdn.jsdelivr.net/npm/@mediapipe/tasks-vision@0.10.14';
const WASM = `${VISION}/wasm`;
const MODEL = 'https://storage.googleapis.com/mediapipe-models/hand_landmarker/hand_landmarker/float16/1/hand_landmarker.task';
const SAMPLES_PER_RECORDING = 30;
const RECORD_EVERY_MS = 100;

const $ = id => document.getElementById(id);
const video = $('cam');
const canvas = $('view');
const ctx = canvas.getContext('2d');

let landmarker = null;
let samples = store.loadSaved();
let selected = SEALS[0].id;
let recording = null; // {left, lastAt}
let latestFeatures = null;
// Poses further than this from every sample are treated as "not a seal".
// Measured on the bundled photo samples: 95% of correct matches fall within
// 3.0, while open, relaxed hands sit at 7 or more.
const MAX_DISTANCE = 3.0;
const stabiliser = new Stabiliser({ maxDistance: MAX_DISTANCE });

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
      <span class="meta"><kbd>${seal.key}</kbd> ${counts[seal.id] ?? 0} 個樣本 · 我錄的 ${mine[seal.id] ?? 0}</span>
      <span class="hint">${seal.animal}</span>`;
    button.addEventListener('click', () => select(seal.id));
    return button;
  }));
  $('total').textContent = `${samples.length} 個樣本`;
}

function select(id) {
  selected = id;
  renderSealList();
}

function startRecording() {
  if (!landmarker) return;
  recording = { left: SAMPLES_PER_RECORDING, lastAt: 0 };
  $('record').disabled = true;
}

function recordFrame(now) {
  if (!recording || now - recording.lastAt < RECORD_EVERY_MS) return;
  if (!latestFeatures) {
    setStatus('看不到手，錄製暫停中…');
    return;
  }
  // "mine" tells the player's own samples apart from the bundled ones.
  samples.push({ label: selected, features: latestFeatures, source: 'mine' });
  recording.lastAt = now;
  recording.left--;
  setStatus(`錄製「${sealById(selected).name}」：還有 ${recording.left} 個`);
  if (recording.left === 0) {
    recording = null;
    $('record').disabled = false;
    store.save(samples);
    renderSealList();
    setStatus('錄好了。換個角度或距離再錄一次，辨識會更穩。');
  }
}

function drawHands(result) {
  const { width: w, height: h } = canvas;
  ctx.save();
  // Mirror the picture so it behaves like a mirror for the player.
  ctx.translate(w, 0);
  ctx.scale(-1, 1);
  ctx.drawImage(video, 0, 0, w, h);
  const colours = ['#ff7a1a', '#3fc1ff'];
  result.landmarks.forEach((hand, i) => {
    ctx.fillStyle = colours[i % 2];
    for (const p of hand) ctx.fillRect(p.x * w - 3, p.y * h - 3, 6, 6);
  });
  ctx.restore();
}

function showPrediction(prediction, locked) {
  const tooFar = prediction && prediction.distance > MAX_DISTANCE;
  const raw = prediction && !tooFar ? sealById(prediction.label) : null;
  $('guess').textContent = raw ? raw.name : tooFar ? '？' : '—';
  $('confidence').textContent = prediction
    ? `信心 ${Math.round(prediction.confidence * 100)}% · 距離 ${prediction.distance.toFixed(2)}`
    : samples.length ? '看不到手' : '先錄一些樣本';
  const lockedSeal = locked && locked !== 'none' ? sealById(locked) : null;
  $('locked').textContent = lockedSeal ? `結印：${lockedSeal.name}` : '';
}

function loop() {
  const now = performance.now();
  const result = landmarker.detectForVideo(video, now);
  latestFeatures = toFeatures(result.landmarks, result.handedness);
  drawHands(result);
  recordFrame(now);

  const prediction = classify(latestFeatures, samples);
  showPrediction(prediction, stabiliser.update(prediction));
  requestAnimationFrame(loop);
}

function download(list, filename) {
  if (list.length === 0) {
    setStatus('沒有可以匯出的樣本。');
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
    setStatus(`匯入了 ${samples.length} 個樣本。`);
  } catch (error) {
    setStatus(`匯入失敗：${error.message}`);
  }
}

// Samples shipped with the repo, used when this browser has none yet.
async function loadBundled() {
  if (samples.length) return;
  try {
    const response = await fetch('samples/seal-samples.json');
    if (response.ok) {
      samples = store.parseSamples(await response.text());
      renderSealList();
      setStatus(`載入了內建的 ${samples.length} 個樣本。用自己的手再錄一些會更準。`);
    }
  } catch {
    // No bundled samples yet.
  }
}

function bindControls() {
  $('record').addEventListener('click', startRecording);
  $('export').addEventListener('click', () => download(samples, 'seal-samples.json'));
  $('exportMine').addEventListener('click', () =>
    download(samples.filter(s => s.source === 'mine'), 'my-seal-samples.json'));
  $('import').addEventListener('change', e => e.target.files[0] && importFile(e.target.files[0]));
  $('clear').addEventListener('click', () => {
    const name = sealById(selected).name;
    if (!confirm(`刪除「${name}」的所有樣本？`)) return;
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
  renderSealList();
  bindControls();
  await loadBundled();
  try {
    setStatus('載入手部模型中…');
    // Loaded here rather than at the top so the page still shows its controls
    // and an error message when the CDN cannot be reached.
    const { FilesetResolver, HandLandmarker } = await import(`${VISION}/vision_bundle.mjs`);
    const vision = await FilesetResolver.forVisionTasks(WASM);
    landmarker = await HandLandmarker.createFromOptions(vision, {
      baseOptions: { modelAssetPath: MODEL },
      runningMode: 'VIDEO',
      numHands: 2,
    });
    setStatus('請允許使用鏡頭…');
    video.srcObject = await navigator.mediaDevices.getUserMedia({ video: { width: 640, height: 480 } });
    await video.play();
    setStatus('準備好了。選一個印，擺好手勢，按空白鍵或「錄 30 個樣本」。');
    $('record').disabled = false;
    loop();
  } catch (error) {
    setStatus(`無法啟動：${error.message}。請用 localhost 或 https 開啟，並允許鏡頭。`);
  }
}

start();
