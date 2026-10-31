// Webcam + MediaPipe hand tracking, shared by the trainer and the battle.
import { toFeatures } from './features.js';
import { classify, Stabiliser } from './knn.js';
import { t } from './i18n.js';

const VISION = 'https://cdn.jsdelivr.net/npm/@mediapipe/tasks-vision@0.10.14';
const MODEL = 'https://storage.googleapis.com/mediapipe-models/hand_landmarker/hand_landmarker/float16/1/hand_landmarker.task';

// Poses further than this from every sample are treated as "not a seal".
// It only catches poses far from any seal, such as open hands (7 or more);
// relaxed hands are recognised by the bundled 無 samples instead. With the
// author's 780 samples, a limit of 4 rejected 7% more of another person's
// correct seals than 6 did (60.5% vs 63.6% correct).
export const MAX_DISTANCE = 6.0;
// The player's own samples count as this much closer than bundled ones.
const MINE_WEIGHT = 0.7;

// Starts the camera and calls onFrame(features) on every video frame, where
// features is null when no hand is visible. drawOverlay(ctx), if given, draws
// over the video before the hand points, e.g. a seal hint. Throws if the
// model or the camera cannot be started.
export async function startCamera({ video, canvas, onFrame, onStatus = () => {}, drawOverlay = null }) {
  onStatus(t('status.loadingModel'));
  // Imported here rather than at the top so pages still show their controls
  // and an error message when the CDN cannot be reached.
  const { FilesetResolver, HandLandmarker } = await import(`${VISION}/vision_bundle.mjs`);
  const vision = await FilesetResolver.forVisionTasks(`${VISION}/wasm`);
  const landmarker = await HandLandmarker.createFromOptions(vision, {
    baseOptions: { modelAssetPath: MODEL },
    runningMode: 'VIDEO',
    numHands: 2,
  });
  onStatus(t('status.allowCamera'));
  video.srcObject = await navigator.mediaDevices.getUserMedia({ video: { width: 640, height: 480 } });
  await video.play();

  const ctx = canvas.getContext('2d');
  function loop() {
    const result = landmarker.detectForVideo(video, performance.now());
    drawHands(ctx, video, result, drawOverlay);
    onFrame(toFeatures(result.landmarks, result.handedness));
    requestAnimationFrame(loop);
  }
  loop();
}

function drawHands(ctx, video, result, drawOverlay) {
  const { width: w, height: h } = ctx.canvas;
  ctx.save();
  // Mirror the picture so it behaves like a mirror for the player.
  ctx.translate(w, 0);
  ctx.scale(-1, 1);
  ctx.drawImage(video, 0, 0, w, h);
  if (drawOverlay) {
    ctx.save();
    ctx.setTransform(1, 0, 0, 1, 0, 0); // the overlay is already mirrored
    drawOverlay(ctx);
    ctx.restore();
  }
  // Coloured by MediaPipe's left/right label, the same way the seal hints are
  // drawn, so the player can match orange to orange and blue to blue.
  result.landmarks.forEach((hand, i) => {
    const label = result.handedness?.[i]?.[0]?.categoryName;
    ctx.fillStyle = label === 'Right' ? '#3fc1ff' : '#ff7a1a';
    for (const p of hand) ctx.fillRect(p.x * w - 3, p.y * h - 3, 6, 6);
  });
  ctx.restore();
}

// Turns a stream of frames into seal readings.
export class SealReader {
  constructor() {
    this.stabiliser = new Stabiliser({ maxDistance: MAX_DISTANCE });
  }

  // Returns {prediction, locked, hold}: the raw nearest-neighbour answer for
  // this frame, the seal that has held steady long enough to count (or null),
  // and how far (0–1) the current seal is towards counting.
  read(features, samples) {
    const prediction = classify(features, samples, { mineWeight: MINE_WEIGHT });
    const locked = this.stabiliser.update(prediction);
    const { candidate, streak, frames } = this.stabiliser;
    const hold = candidate && candidate !== 'none' && candidate !== locked ? Math.min(1, streak / frames) : 0;
    return { prediction, locked, hold };
  }
}
