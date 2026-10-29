// The extra camera models: face (for blowing fire), pose (for guarding) and
// person segmentation (for the player's silhouette in the arena). Each loads
// only when switched on, and runs only on the frames that need it, because
// running several models every frame slows a laptop down (Week 8).
import { loadVision } from './camera.js';
import { jawOpen, mouthPoint, isGuarding } from './body.js';

const MODELS = {
  face: 'https://storage.googleapis.com/mediapipe-models/face_landmarker/face_landmarker/float16/1/face_landmarker.task',
  pose: 'https://storage.googleapis.com/mediapipe-models/pose_landmarker/pose_landmarker_lite/float16/1/pose_landmarker_lite.task',
  segment: 'https://storage.googleapis.com/mediapipe-models/image_segmenter/selfie_segmenter/float16/1/selfie_segmenter.tflite',
};

// Pose and segmentation change slowly enough to skip frames.
const POSE_EVERY = 3;
const SEGMENT_EVERY = 2;

// WebGL drawn by software (no graphics hardware, or acceleration switched
// off) makes MediaPipe's GPU mode several times slower than its CPU mode:
// measured 417 ms against 67 ms per pose frame on SwiftShader.
function softwareGraphics() {
  try {
    const gl = document.createElement('canvas').getContext('webgl2');
    if (!gl) return true;
    const info = gl.getExtension('WEBGL_debug_renderer_info');
    const renderer = String(gl.getParameter(info ? info.UNMASKED_RENDERER_WEBGL : gl.RENDERER));
    return /swiftshader|llvmpipe|software|basic render/i.test(renderer);
  } catch {
    return true;
  }
}

const DELEGATE = softwareGraphics() ? 'CPU' : 'GPU';

// Use the GPU when there is real graphics hardware, falling back to the CPU
// if the GPU mode fails to start.
async function create(Task, files, model, options) {
  const make = delegate => Task.createFromOptions(files, { ...options, baseOptions: { modelAssetPath: model, delegate } });
  if (DELEGATE === 'CPU') return make('CPU');
  try {
    return await make('GPU');
  } catch {
    return make('CPU');
  }
}

export class BodyTracker {
  constructor() {
    this.tasks = {};
    this.loading = {};
    this.frame = 0;
    this.latest = { jaw: 0, mouth: null, guard: false, mask: null };
  }

  ready(kind) {
    return Boolean(this.tasks[kind]);
  }

  // Loads one model. Rejects if it cannot be loaded; the game then carries on
  // without that feature.
  enable(kind) {
    this.loading[kind] ??= (async () => {
      const { lib, files } = await loadVision();
      const video = { runningMode: 'VIDEO' };
      if (kind === 'face') {
        this.tasks.face = await create(lib.FaceLandmarker, files, MODELS.face,
          { ...video, numFaces: 1, outputFaceBlendshapes: true });
      } else if (kind === 'pose') {
        this.tasks.pose = await create(lib.PoseLandmarker, files, MODELS.pose, { ...video, numPoses: 1 });
      } else if (kind === 'segment') {
        this.tasks.segment = await create(lib.ImageSegmenter, files, MODELS.segment,
          { ...video, outputConfidenceMasks: true, outputCategoryMask: false });
      }
    })().catch(error => {
      delete this.loading[kind];
      throw error;
    });
    return this.loading[kind];
  }

  // Runs the models asked for in `wants` ({face, pose, segment}) on this video
  // frame and returns the latest readings.
  update(video, wants) {
    this.frame++;
    const now = performance.now();
    const latest = this.latest;
    if (wants.face && this.tasks.face) {
      const result = this.tasks.face.detectForVideo(video, now);
      latest.jaw = jawOpen(result);
      latest.mouth = mouthPoint(result);
    } else {
      latest.jaw = 0;
    }
    if (wants.pose && this.tasks.pose && this.frame % POSE_EVERY === 0) {
      latest.guard = isGuarding(this.tasks.pose.detectForVideo(video, now));
    } else if (!wants.pose) {
      latest.guard = false;
    }
    if (wants.segment && this.tasks.segment && this.frame % SEGMENT_EVERY === 0) {
      // The masks are only valid inside the callback, so copy them out.
      this.tasks.segment.segmentForVideo(video, now, result => {
        const masks = result.confidenceMasks ?? [];
        // One mask is the person; with two, the second is the person.
        const mask = masks[masks.length - 1];
        if (mask) {
          latest.mask = { data: mask.getAsFloat32Array().slice(), width: mask.width, height: mask.height };
        }
      });
    }
    return latest;
  }
}
