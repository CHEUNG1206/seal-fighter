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

Checked by training on the dataset's `train` folder and predicting its
separate `test` folder (68 photos where MediaPipe found hands):

| k | accuracy per photo |
| --- | --- |
| 1 | 80.9% |
| 5 | 76.5% (used by the game) |
| 9 | 69.1% |

Most confused at k = 5: 戌 Dog → 申 Monkey, 申 Monkey → 丑 Ox, 寅 Tiger → 未 Ram.
In the game a seal must hold for 8 frames before it counts, which helps.

Things to know:

- MediaPipe often sees **interlocked hands as a single hand**. Of the 1,960
  training photos of the twelve seals, 978 had two hands detected, 805 one
  hand and 177 none. One-hand detections are kept because the finger shape
  still carries the seal.
- All photos are of **one person**. Your own hands will match less well.
  Recording your own samples in the trainer improves recognition a lot.
- There are no "not a seal" photos. Instead the game ignores any pose further
  than 3.0 from every sample (95% of correct test matches were within 3.0;
  open relaxed hands measured 7 or more).
