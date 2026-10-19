# Seal Fighter · 結印之戰

A browser game where you fight enemies by forming hand seals in front of your
webcam. Make the right sequence of seals and your jutsu fires; the enemy
reacts, and you answer with the next sequence.

> Inspired by the hand seals in *Naruto*. All names, art and sounds here are
> original; the seals are named after the twelve earthly branches (子丑寅卯…).

**Status: version 1 — seal trainer.** The battle comes next. This version
proves the hard part works: the webcam sees both hands, you record examples
of each seal, and the page recognises which seal you are making in real time.

## The interaction loop

```
enemy charges an attack
  → you form seals in front of the camera (e.g. 子 → 寅 → 申)
  → the page recognises each seal and shows your progress
  → the right sequence casts a jutsu; the enemy takes damage or counters
  → next round
```

Version 1 already has a smaller loop: pose → the page names the seal and how
sure it is → adjust your hands → it locks the seal.

## How it works

1. **[MediaPipe Hand Landmarker](https://ai.google.dev/edge/mediapipe/solutions/vision/hand_landmarker)**
   finds up to two hands in each video frame and gives 21 points per hand.
2. **Normalising** (`src/features.js`) moves each hand so its wrist is the
   origin and divides by the hand's size, so the same seal gives similar
   numbers anywhere in the frame and at any distance. The offset between the
   two wrists is kept, because two-handed seals depend on it.
3. **K-nearest neighbours** (`src/knn.js`) compares the current pose with every
   recorded sample and lets the 5 closest vote. A seal only *locks* after the
   same confident answer holds for 8 frames, so flicker does not count.

Everything runs in the browser. Video never leaves your computer.

## Run it

The webcam only works on `localhost` or `https`, so open the page through a
small local server rather than double-clicking `index.html`:

```bash
npm run serve        # then open http://localhost:8000
# or
python -m http.server 8000
```

VS Code's *Live Server* extension also works.

## Train your seals

| Seal | Key | Pose |
| --- | --- | --- |
| 子 | 1 | palms pressed together |
| 寅 | 2 | fingers interlocked, index fingers up |
| 申 | 3 | palms stacked |
| 亥 | 4 | fists, knuckles facing |
| 午 | 5 | thumbs and index fingers form a triangle |
| 無 | 0 | relaxed hands, waving, anything that is *not* a seal |

1. Press a number key (or click a seal).
2. Hold the pose and press **Space**. It records 30 samples in about 3 seconds.
3. Repeat 2–3 times per seal, changing angle, distance and position slightly.
4. Record **無** too, so resting hands are not mistaken for a seal.
5. **Export JSON** to keep your samples. Saving it as
   `samples/seal-samples.json` makes it the default for new visitors.

Samples are also kept in your browser's local storage between visits.

## Tests

```bash
npm test
```

Checks normalising, hand ordering, KNN voting, the stabiliser, and sample
import/export, using fake landmarks (no camera needed).

## Files

```
index.html           page layout
style.css            styles
src/app.js           camera, MediaPipe, recording, drawing
src/features.js      landmarks → normalised numbers
src/knn.js           nearest-neighbour vote and stabiliser
src/samples.js       saving, loading, import/export
src/seals.js         the list of seals
test/                unit tests (node --test)
PROCESS.md           how AI was used
```
