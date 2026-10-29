import { test } from 'node:test';
import assert from 'node:assert/strict';
import { jawOpen, mouthPoint, isGuarding, handsCentre, Steady, JAW_OPEN } from '../src/body.js';

const face = (jaw, lips = [{ x: 0.5, y: 0.6 }, { x: 0.5, y: 0.64 }]) => {
  const landmarks = Array.from({ length: 478 }, () => ({ x: 0, y: 0 }));
  [landmarks[13], landmarks[14]] = lips;
  return {
    faceLandmarks: [landmarks],
    faceBlendshapes: [{ categories: [{ categoryName: 'mouthSmileLeft', score: 0.9 }, { categoryName: 'jawOpen', score: jaw }] }],
  };
};

// A standing pose: shoulders at y 0.4, wrists at the given heights.
const pose = (leftWrist, rightWrist, visibility = 0.9) => {
  const landmarks = Array.from({ length: 33 }, () => ({ x: 0.5, y: 0.5, visibility }));
  landmarks[11] = { x: 0.6, y: 0.4, visibility };
  landmarks[12] = { x: 0.4, y: 0.4, visibility };
  landmarks[15] = { x: 0.6, y: leftWrist, visibility };
  landmarks[16] = { x: 0.4, y: rightWrist, visibility };
  return { landmarks: [landmarks] };
};

test('jawOpen reads the blendshape score, 0 without a face', () => {
  assert.equal(jawOpen(face(0.7)), 0.7);
  assert.equal(jawOpen({ faceBlendshapes: [] }), 0);
  assert.equal(jawOpen(undefined), 0);
  assert.ok(JAW_OPEN > 0 && JAW_OPEN < 1);
});

test('the mouth is between the lips', () => {
  assert.deepEqual(mouthPoint(face(0.5)), { x: 0.5, y: 0.62 });
  assert.equal(mouthPoint({ faceLandmarks: [] }), null);
});

test('guarding needs both wrists above the shoulders', () => {
  assert.equal(isGuarding(pose(0.2, 0.2)), true);
  assert.equal(isGuarding(pose(0.2, 0.6)), false, 'one hand down');
  assert.equal(isGuarding(pose(0.37, 0.37)), false, 'only just above: within the margin');
  assert.equal(isGuarding(pose(0.2, 0.2, 0.3)), false, 'points not visible');
  assert.equal(isGuarding({ landmarks: [] }), false);
});

test('jutsu start from the middle of the hands', () => {
  const hand = (x, y) => Array.from({ length: 21 }, () => ({ x, y }));
  assert.deepEqual(handsCentre([hand(0.2, 0.5), hand(0.6, 0.7)]), { x: 0.4, y: 0.6 });
  assert.equal(handsCentre([]), null);
});

test('Steady changes only after holding', () => {
  const s = new Steady(3);
  assert.equal(s.update(true), false);
  assert.equal(s.update(true), false);
  assert.equal(s.update(true), true);
  assert.equal(s.update(false), true, 'one noisy frame does not stop it');
  assert.equal(s.update(true), true);
  s.update(false);
  s.update(false);
  assert.equal(s.update(false), false);
});
