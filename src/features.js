// Turn MediaPipe hand landmarks into a fixed-length list of numbers.
// The same seal should give similar numbers wherever the hands are in the
// frame and however far they are from the camera.

export const POINTS = 21;
const PER_HAND = POINTS * 2;            // x and y for each landmark
export const FEATURE_LENGTH = PER_HAND * 2 + 2 + 2; // two hands, offset, presence

function handSize(hand) {
  // Wrist (0) to middle-finger knuckle (9): stable while fingers bend.
  return Math.hypot(hand[9].x - hand[0].x, hand[9].y - hand[0].y) || 1e-6;
}

function normaliseHand(hand) {
  const wrist = hand[0];
  const size = handSize(hand);
  return hand.flatMap(p => [(p.x - wrist.x) / size, (p.y - wrist.y) / size]);
}

// MediaPipe labels each hand "Left" or "Right". The label can flip, or both
// hands can get the same one, so fall back to screen position.
export function orderHands(landmarks, handedness = []) {
  const hands = landmarks.map((points, i) => ({
    points,
    label: handedness[i]?.[0]?.categoryName ?? '',
  }));
  if (hands.length === 2) {
    const labels = new Set(hands.map(h => h.label));
    if (labels.has('Left') && labels.has('Right')) {
      return hands.sort((a, b) => (a.label === 'Left' ? -1 : 1) - (b.label === 'Left' ? -1 : 1))
        .map(h => h.points);
    }
    return hands.sort((a, b) => a.points[0].x - b.points[0].x).map(h => h.points);
  }
  return hands.map(h => h.points);
}

// Returns null when no hand is visible.
export function toFeatures(landmarks, handedness) {
  if (!landmarks || landmarks.length === 0) return null;
  const hands = orderHands(landmarks.slice(0, 2), handedness);
  const [first, second] = hands;
  const empty = new Array(PER_HAND).fill(0);

  const a = normaliseHand(first);
  const b = second ? normaliseHand(second) : empty;

  // Where the second hand is relative to the first, in hand-size units.
  // Two-handed seals depend on this as much as on finger shape.
  let offset = [0, 0];
  if (second) {
    const size = (handSize(first) + handSize(second)) / 2;
    offset = [(second[0].x - first[0].x) / size, (second[0].y - first[0].y) / size];
  }
  // Presence flags are scaled up so a one-hand pose is never confused with
  // a two-hand pose.
  const presence = [3, second ? 3 : 0];
  return [...a, ...b, ...offset, ...presence];
}
