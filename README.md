# Seal Fighter · 結印之戰

A browser game where you fight enemies by forming hand seals in front of your
webcam. Make the right sequence of seals and your jutsu fires; the enemy
reacts, and you answer with the next sequence.

> Inspired by the hand seals in *Naruto*. All names, art and sounds here are
> original; the seals are named after the twelve earthly branches (子丑寅卯…).

**Status: playable.** Three enemies, five jutsu, webcam or keyboard. A
separate trainer page lets you record your own hands for better recognition.

## How to play

1. Open the page and choose **用鏡頭開始** (camera) or **只用鍵盤開始** (keyboard).
2. An enemy appears and its **蓄力** (charge) bar starts filling. When it fills,
   the enemy hits you.
3. Form a jutsu's seals **in order**. The scroll on the right lights up each
   seal as you match it; finishing the sequence casts the jutsu.
4. Elements counter each other: 火 → 風 → 雷 → 土 → 水 → 火. A jutsu marked
   **剋制** does double damage and resets the enemy's charge; **被剋** does half.
5. Beat all three enemies (泥偶 earth, 水妖 water, 炎鬼 fire) before your health
   runs out.

| Jutsu | Element | Seals |
| --- | --- | --- |
| 火遁・赤焰彈 | 火 fire | 巳 午 亥 |
| 風遁・裂空刃 | 風 wind | 子 亥 酉 |
| 雷遁・閃牙 | 雷 lightning | 午 酉 丑 |
| 土遁・岩槍 | 土 earth | 亥 戌 巳 |
| 水遁・潮渦 | 水 water | 丑 申 卯 |

The sequences use the seals that are recognised most reliably (see
[`samples/README.md`](samples/README.md)); 寅, 未 and 辰 are left out.

**Keyboard:** 1 子 · 2 丑 · 3 寅 · 4 卯 · 5 辰 · 6 巳 · 7 午 · 8 未 · 9 申 · 0 酉 · `-` 戌 · `=` 亥.
The keyboard also works in camera mode.

With the camera, a seal counts once when it locks. To use the same seal twice
in a row, move your hands out of it first.

## The interaction loop

```
enemy charges an attack
  → you form seals in front of the camera (e.g. 午 → 酉 → 丑)
  → the page recognises each seal and lights it up on the scroll
  → the full sequence casts a jutsu; the enemy takes damage and is pushed back
  → if its charge fills first, it hits you
  → keep going until one side falls; then the next enemy
```

## How it works

1. **[MediaPipe Hand Landmarker](https://ai.google.dev/edge/mediapipe/solutions/vision/hand_landmarker)**
   finds up to two hands in each video frame and gives 21 points per hand.
2. **Normalising** (`src/features.js`) moves each hand so its wrist is the
   origin and divides by the hand's size, so the same seal gives similar
   numbers anywhere in the frame and at any distance. The offset between the
   two wrists is kept, because two-handed seals depend on it.
3. **K-nearest neighbours** (`src/knn.js`) compares the current pose with every
   recorded sample and lets the 5 closest vote. Poses are compared hand by
   hand: MediaPipe often sees interlocked fingers as one hand and sometimes
   swaps left and right, and comparing whole vectors treated those as different
   poses. Your own samples count as closer than the bundled ones. A seal only
   *locks* after the same confident answer holds for 8 frames, so flicker does
   not count.

Everything runs in the browser. Video never leaves your computer.

## Run it

The webcam only works on `localhost` or `https`, so open the page through a
small local server rather than double-clicking `index.html`:

```bash
python -m http.server 8000 --bind 127.0.0.1    # then open http://127.0.0.1:8000
# or
npm run serve
```

`--bind 127.0.0.1` keeps the server private to your computer; without it,
Python shares the folder with your whole network. Start it inside this folder
(or add `--directory path/to/seal-fighter`): if the browser shows a list of
files, it is serving the wrong folder, so stop it with Ctrl+C.

VS Code's *Live Server* extension also works.

## Train your seals

Open [`trainer.html`](trainer.html) (the **結印訓練** link).

The twelve seals, keys in brackets:

子 Rat (1) · 丑 Ox (2) · 寅 Tiger (3) · 卯 Hare (4) · 辰 Dragon (5) · 巳 Snake (6) ·
午 Horse (7) · 未 Ram (8) · 申 Monkey (9) · 酉 Bird (0) · 戌 Dog (-) · 亥 Boar (=) ·
and 無 (`) for relaxed hands that are *not* a seal.

The page starts with 1,851 bundled samples (see
[`samples/README.md`](samples/README.md) for where they come from and how
accurate they are). They are one person's hands, so adding your own helps:

1. Press a seal's key (or click it).
2. Hold the pose and press **Space**. It records 30 samples in about 3 seconds.
3. Repeat 2–3 times per seal, changing angle, distance and position slightly.
4. Record **無** too, so resting hands are not mistaken for a seal.
5. **只匯出我錄的** exports only your own samples; **匯出全部** exports
   everything, bundled samples included.

Samples are also kept in your browser's local storage between visits.

### Samples from photos

[`tools/extract.html`](tools/extract.html) turns a folder of photos into
samples with the same hand model and normalising as the game. Put each seal's
photos in a sub-folder named after it (`rat/`, `tiger/`, … or `子/`, `寅/`, …),
choose the parent folder, and export. Photos never leave the browser.

## Tests

```bash
npm test
```

Checks the battle rules (casting, element damage, enemy attacks, winning and
losing), sequence matching, normalising, hand-by-hand comparison, the
stabiliser and sample import/export, using fake landmarks (no camera needed).

## Files

```
index.html           the battle
trainer.html         record and check your own seals
style.css            styles for both pages
src/game.js          battle page: drawing, input, sound cues
src/battle.js        battle rules (enemies, charge, damage, win/lose)
src/jutsu.js         jutsu, elements and sequence matching
src/sound.js         synthesised sound effects
src/trainer.js       trainer page: recording, import/export
src/camera.js        webcam, MediaPipe, seal reading (shared)
src/features.js      landmarks → normalised numbers
src/knn.js           hand-by-hand nearest-neighbour vote and stabiliser
src/samples.js       saving, loading, import/export
src/seals.js         the twelve seals and folder-name aliases
samples/             bundled samples and where they come from
tools/extract.*      photo folder → samples
test/                unit tests (node --test)
PROCESS.md           how AI was used
```
