# Bundled samples

`seal-samples.json` holds 1,851 hand-landmark samples for the twelve seals, so
the game recognises seals for a new visitor before they record any of their own.

## Where they come from

The numbers were extracted with [`tools/extract.html`](../tools/extract.html)
from the photos in the
[Naruto Hand Sign Dataset](https://www.kaggle.com/datasets/vikranthkanumuru/naruto-hand-sign-dataset)
by Vikranth Kanumuru: webcam photos of one person making the twelve seals.

**No photos are included in this repository**, only MediaPipe landmark
coordinates after normalising. The dataset lists its licence as unknown, and
the photos show a person's face, so they are not redistributed here.

The dataset's extra `zero` class (a sign of the author's own) was skipped.

## How well they work

Accuracy per frame, with the game's settings (k = 5, hand-by-hand comparison,
poses further than 4.0 from every sample ignored):

| Trained on | Tested on | Accuracy |
| --- | --- | --- |
| dataset `train` folder | dataset `test` folder (68 photos, same person) | 76.5% |
| these bundled samples | a new player's hands (720 frames, 12 seals) | 69.7% |
| bundled + the player's first recording round | the player's second round | 77.8% |

The first version compared whole feature vectors and scored 52.4% on the new
player. Comparing hand by hand fixed most of that: MediaPipe saw two hands in
one recording round of a seal and one hand in the next (戌 Dog: 0 of 30 frames
versus 29 of 30), and sometimes swaps its left/right labels. Rotating each
hand upright was also tried and lowered the new-player score to 57.9%, so it
is not used. In the game a seal must also hold for 8 frames before it counts.

Hardest for the new player with these samples alone: 寅 Tiger 2% (mostly read
as 未 Ram), 未 Ram 33% and 辰 Dragon 45%; easiest: 亥 Boar 100%, 酉 Bird 98%,
午 Horse 97%. Recording your own samples helps most for the hard ones.

Things to know:

- MediaPipe often sees **interlocked hands as a single hand**. Of the 1,960
  training photos of the twelve seals, 978 had two hands detected, 805 one
  hand and 177 none. One-hand detections are kept because the finger shape
  still carries the seal.
- All photos are of **one person**. Your own hands will match less well.
  Recording your own samples in the trainer improves recognition a lot.
- There are no "not a seal" photos. The game ignores poses further than 4.0
  from every sample, which catches open hands (7 or more) but not relaxed
  hands that happen to look like a seal: the new player's relaxed-hand frames
  had a median distance of 1.67 to the nearest seal. Recording 無 samples is
  what handles those.
