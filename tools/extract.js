// Turn a folder of labelled photos into samples, using the same hand model
// and normalising as the game, so the numbers are directly comparable.
import { toFeatures } from '../src/features.js';
import { labelFromFolder } from '../src/seals.js';
import { toJSON } from '../src/samples.js';

const VISION = 'https://cdn.jsdelivr.net/npm/@mediapipe/tasks-vision@0.10.14';
const MODEL = 'https://storage.googleapis.com/mediapipe-models/hand_landmarker/hand_landmarker/float16/1/hand_landmarker.task';

const $ = id => document.getElementById(id);
let samples = [];
let landmarker = null;

async function getLandmarker() {
  if (landmarker) return landmarker;
  $('status').textContent = '載入手部模型中…';
  const { FilesetResolver, HandLandmarker } = await import(`${VISION}/vision_bundle.mjs`);
  const vision = await FilesetResolver.forVisionTasks(`${VISION}/wasm`);
  landmarker = await HandLandmarker.createFromOptions(vision, {
    baseOptions: { modelAssetPath: MODEL },
    runningMode: 'IMAGE',
    numHands: 2,
  });
  return landmarker;
}

function report(stats) {
  const rows = Object.entries(stats).sort(([a], [b]) => a.localeCompare(b));
  $('report').innerHTML = '<tr><th>印</th><th>照片</th><th>兩隻手</th><th>一隻手</th><th>沒偵測到</th><th>保留</th></tr>'
    + rows.map(([label, s]) => `<tr><td>${label}</td><td>${s.total}</td><td>${s.two}</td>
      <td>${s.one}</td><td>${s.none}</td><td>${s.kept}</td></tr>`).join('');
}

async function extract(files) {
  const model = await getLandmarker();
  const twoOnly = $('twoHands').checked;
  const images = files.filter(f => f.type.startsWith('image/'));
  const stats = {};
  samples = [];
  let skipped = 0;

  for (const [i, file] of images.entries()) {
    const parts = file.webkitRelativePath.split('/');
    const label = labelFromFolder(parts[parts.length - 2] ?? '');
    if (!label) {
      skipped++;
      continue;
    }
    const s = stats[label] ??= { total: 0, two: 0, one: 0, none: 0, kept: 0 };
    s.total++;
    const bitmap = await createImageBitmap(file);
    const result = model.detect(bitmap);
    bitmap.close();
    const hands = result.landmarks.length;
    s[hands >= 2 ? 'two' : hands === 1 ? 'one' : 'none']++;
    if (hands > 0 && (!twoOnly || hands >= 2)) {
      samples.push({ label, features: toFeatures(result.landmarks, result.handedness) });
      s.kept++;
    }
    if (i % 10 === 0) {
      $('status').textContent = `處理中 ${i + 1} / ${images.length}…`;
      report(stats);
    }
  }
  report(stats);
  $('status').textContent = `完成：保留 ${samples.length} 個樣本`
    + (skipped ? `，${skipped} 張照片的資料夾名稱認不得，已略過。` : '。');
  $('export').disabled = samples.length === 0;
}

$('folder').addEventListener('change', e => {
  extract([...e.target.files]).catch(error => {
    $('status').textContent = `失敗：${error.message}`;
  });
});

$('export').addEventListener('click', () => {
  const blob = new Blob([toJSON(samples)], { type: 'application/json' });
  const link = document.createElement('a');
  link.href = URL.createObjectURL(blob);
  link.download = 'seal-samples.json';
  link.click();
  URL.revokeObjectURL(link.href);
});

// Exposed for automated runs.
window.sealExtract = { extract, getSamples: () => samples };
