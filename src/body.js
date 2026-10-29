// Turning face and pose landmarks into game input: an open mouth breathes
// fire, both hands raised above the shoulders guard. Plain functions of the
// MediaPipe results, so they can be tested without a camera.

// How far the jaw must open (MediaPipe's jawOpen blendshape, 0–1) to count
// as blowing.
export const JAW_OPEN = 0.45;

// Pose landmark indices (MediaPipe Pose): shoulders and wrists.
const LEFT_SHOULDER = 11;
const RIGHT_SHOULDER = 12;
const LEFT_WRIST = 15;
const RIGHT_WRIST = 16;

// The jawOpen score of the first face, or 0 when there is none.
export function jawOpen(faceResult) {
  const categories = faceResult?.faceBlendshapes?.[0]?.categories ?? [];
  return categories.find(c => c.categoryName === 'jawOpen')?.score ?? 0;
}

// The middle of the lips (face mesh points 13 and 14), normalised to the
// camera image, or null without a face.
export function mouthPoint(faceResult) {
  const face = faceResult?.faceLandmarks?.[0];
  if (!face) return null;
  return { x: (face[13].x + face[14].x) / 2, y: (face[13].y + face[14].y) / 2 };
}

// Both wrists clearly above both shoulders. y grows downwards in image
// coordinates, so "above" means a smaller y. Points the model cannot see well
// (visibility below 0.5) do not count.
export function isGuarding(poseResult, margin = 0.05) {
  const pose = poseResult?.landmarks?.[0];
  if (!pose) return false;
  const points = [LEFT_SHOULDER, RIGHT_SHOULDER, LEFT_WRIST, RIGHT_WRIST];
  if (!points.every(i => pose[i] && (pose[i].visibility ?? 1) >= 0.5)) return false;
  const shoulders = Math.min(pose[LEFT_SHOULDER].y, pose[RIGHT_SHOULDER].y);
  return pose[LEFT_WRIST].y < shoulders - margin && pose[RIGHT_WRIST].y < shoulders - margin;
}

// The middle of the visible hands (wrists and index fingertips), where a
// jutsu should start from, or null without hands.
export function handsCentre(handLandmarks) {
  const points = (handLandmarks ?? []).flatMap(hand => [hand[0], hand[8]]);
  if (points.length === 0) return null;
  return {
    x: points.reduce((sum, p) => sum + p.x, 0) / points.length,
    y: points.reduce((sum, p) => sum + p.y, 0) / points.length,
  };
}

// A yes/no reading that only changes after holding for `frames` updates in a
// row, so one noisy frame neither starts nor stops it.
export class Steady {
  constructor(frames = 3) {
    this.frames = frames;
    this.value = false;
    this.streak = 0;
  }

  update(reading) {
    if (Boolean(reading) === this.value) {
      this.streak = 0;
    } else if (++this.streak >= this.frames) {
      this.value = Boolean(reading);
      this.streak = 0;
    }
    return this.value;
  }

  reset() {
    this.value = false;
    this.streak = 0;
  }
}
