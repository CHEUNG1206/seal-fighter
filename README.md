# Seal Fighter · 結印之戰

A browser game where you fight enemies by forming hand seals in front of your
webcam. Make the right sequence of seals and your jutsu fires; the enemy
reacts, and you answer with the next sequence.

> A non-commercial fan project inspired by *Naruto*; it is not affiliated with
> or endorsed by the series' creators. Jutsu names and seal sequences follow
> the series (sources below). Enemies, art, effects and sounds are original.

**Status: playable.** Three enemies, eleven jutsu (attack, healing, genjutsu,
clone, release), chakra, webcam or keyboard, in 粵語, English and 日本語.
A separate trainer page lets you record your own hands for better recognition.

## How to play

1. Open the page, pick a language (top right), and choose **用鏡頭開始**
   (camera) or **淨係用鍵盤** (keyboard).
2. An enemy appears and its **儲力** (charge) bar starts filling. When it fills,
   the enemy attacks.
3. Form a jutsu's seals **in order**. The scroll lights up each seal as you
   match it, and the **下一個印** (next seal) card shows the pose to make. With
   the camera, the same pose is drawn faintly behind your hands.
4. Every jutsu costs **chakra** (maximum 100, recovering 5 per second). Without
   enough chakra the seals are wasted.
5. Elements counter each other: 火 → 風 → 雷 → 土 → 水 → 火. An attack marked
   **剋制** does double damage and resets the enemy's charge; **被剋** does half.
6. The 水妖 and 炎鬼 sometimes cast **genjutsu** on you instead of attacking: the
   screen warps, chakra stops recovering, and nothing works except **解**
   (form 寅). It wears off by itself after 10 seconds.
7. Beat all three enemies (泥偶 earth, 水妖 water, 炎鬼 fire) before your health
   runs out.

| Jutsu | Type | Seals | Chakra | Effect |
| --- | --- | --- | --- | --- |
| 千鳥 Chidori | 雷 attack | 丑 卯 申 | 30 | 30 damage |
| 水遁・水亂破 Water Trumpet | 水 attack | 辰 寅 卯 | 25 | 25 damage |
| 火遁・龍火之術 Dragon Flame | 火 attack | 巳 辰 卯 寅 | 35 | 35 damage |
| 通靈・土遁・追牙之術 Fanged Pursuit | 土 attack | 寅 巳 辰 戌 | 35 | 35 damage |
| 風遁・大突破 Great Breakthrough | 風 attack | 寅 丑 戌 卯 巳 | 40 | 40 damage |
| 火遁・豪火球之術 Great Fireball | 火 attack | 巳 未 申 亥 午 寅 | 50 | 55 damage |
| 水遁・水鮫彈之術 Water Shark Bullet | 水 attack | 寅 丑 辰 卯 酉 辰 未 | 60 | 65 damage |
| 掌仙術 Mystical Palm | healing | 丑 寅 | 30 | +25 health |
| 魔幻・奈落見之術 Hell Viewing | genjutsu | 巳 子 | 25 | enemy frozen 6 s |
| 分身術 Clone | clone | 未 巳 寅 | 20 | dodge the next attack |
| 解 Release | release | 寅 | 10 | break the enemy's genjutsu |

Many sequences use 寅, 未 and 辰, which the bundled samples recognise poorly
(see [`samples/README.md`](samples/README.md)). Recording your own hands in the
trainer helps most for these. A short sequence that appears inside a longer
one would fire early, so the tests check that none does.

**Keyboard:** 1 子 · 2 丑 · 3 寅 · 4 卯 · 5 辰 · 6 巳 · 7 午 · 8 未 · 9 申 · 0 酉 · `-` 戌 · `=` 亥.
The keyboard also works in camera mode.

With the camera, a seal counts once when it locks. To use the same seal twice
in a row (水鮫彈 has 辰 twice, but not in a row), move your hands out of it first.

### Where the seal sequences come from

- 豪火球, 龍火, 水乱破, 水鮫弾, 追牙 and 分身: `setting/jutsu.csv` in
  [Kazuhito00/NARUTO-HandSignDetection](https://github.com/Kazuhito00/NARUTO-HandSignDetection)
  (MIT licence).
- 千鳥 (丑 卯 申): [Anime Magics wiki](https://animemagics.fandom.com/wiki/Chidori), several guides agree.
- 大突破 (寅 丑 戌 卯 巳): [Naruto wiki](https://naruto.fandom.com/wiki/Wind_Release:_Great_Breakthrough)
  and fan wikis.
- 奈落見 (巳 子): [Naruto Fanon wiki](https://narutofanon.fandom.com/wiki/Demonic_Illusion:_Hell_Viewing_Technique)
  and other fan wikis; one source gives a different count.
- 掌仙術 (a modified 丑, then 寅): [Naruto Fanon wiki](https://narutofanon.fandom.com/wiki/Mystical_Palm_Technique).
- 解 (寅): fan-compiled jutsu lists only; treat it as the least certain.

### Languages

Every piece of text is in `src/i18n.js` in written Cantonese (粵語), English and
Japanese; jutsu names are in `src/jutsu.js`. The choice is remembered in the
browser. Tests check that all three languages have every key.

### Seal hints and effects

The hint drawings are hand skeletons built from the bundled landmark samples
(`tools/make-poses.mjs` picks the most typical two-hand sample of each seal),
so they are original drawings, not copied pictures. Interlocked fingers confuse
the hand tracker, so 子, 辰 and 未 look messier than the others.

Each jutsu plays a canvas effect (`src/effects.js`): lightning bolts, a
fireball and explosion, a water spiral, wind blades with leaves, rock spikes,
rising green light for healing, a ring of leaves for genjutsu, smoke for
clones, and a shockwave for release. Sound effects are synthesised
(`src/sound.js`).

## The interaction loop

```
enemy charges an attack (or a genjutsu)
  → you form seals in front of the camera, guided by the next-seal hint
  → the page recognises each seal and lights it up on the scroll
  → the full sequence casts a jutsu if you have the chakra: damage, healing,
    freezing the enemy, a clone, or releasing a genjutsu
  → if its charge fills first, it attacks or traps you in a genjutsu
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

Checks the battle rules (chakra, element damage, healing, both kinds of
genjutsu, release, clones, winning and losing), that no jutsu fires inside
another, that all three languages are complete, sequence matching,
normalising, hand-by-hand comparison, the stabiliser and sample import/export,
using fake landmarks (no camera needed).

## Files

```
index.html           the battle
trainer.html         record and check your own seals
style.css            styles for both pages
src/game.js          battle page: drawing, input, hints, messages
src/battle.js        battle rules (enemies, charge, chakra, genjutsu, win/lose)
src/jutsu.js         jutsu, elements, sequence matching, names in 3 languages
src/i18n.js          all other text in 粵語 / English / 日本語
src/effects.js       canvas special effects for each jutsu
src/hint.js          draws a seal's hand pose (cards, thumbnails, camera ghost)
src/poses.js         one typical pose per seal (generated)
src/sound.js         synthesised sound effects
src/trainer.js       trainer page: recording, import/export
src/camera.js        webcam, MediaPipe, seal reading (shared)
src/features.js      landmarks → normalised numbers
src/knn.js           hand-by-hand nearest-neighbour vote and stabiliser
src/samples.js       saving, loading, import/export
src/seals.js         the twelve seals and folder-name aliases
samples/             bundled samples and where they come from
tools/extract.*      photo folder → samples
tools/make-poses.mjs bundled samples → src/poses.js
test/                unit tests (node --test)
PROCESS.md           how AI was used
```
