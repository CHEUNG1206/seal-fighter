# Bundled samples

`seal-samples.json` holds 780 hand-landmark samples recorded by the author with
the [trainer page](../trainer.html): 60 for each of the twelve seals and 60 of
relaxed hands (無), in two takes of 30 frames with a different angle and
distance. They let the game recognise seals for a new visitor before they record
their own. Only MediaPipe landmark coordinates are stored, after normalising; no
images.

## Why these and not a photo dataset

An earlier version bundled 1,851 samples extracted (with
[`tools/extract.html`](../tools/extract.html)) from the
[Naruto Hand Sign Dataset](https://www.kaggle.com/datasets/vikranthkanumuru/naruto-hand-sign-dataset).
That dataset does not state a licence and its photos show a person, so its
samples were replaced with the author's own, which can be shared. The dataset's
photos are still used, outside this repository, to measure how well the bundled
samples work on someone else's hands.

## How well they work

Accuracy per frame with the game's settings (k = 5, hand-by-hand comparison,
poses further than 6.0 from every sample ignored):

| Bundled samples | Tested on | Seal frames recognised |
| --- | --- | --- |
| the author, take 1 | the author, take 2 | 74.4% (360 frames) |
| the author, both takes | another person (the dataset's 1,851 photos) | 63.6% |
| for comparison: the dataset's person | the author | 69.7% (720 frames) |

The first version compared whole feature vectors and scored 52.4% on the
author's hands with the dataset's samples. Comparing hand by hand fixed most of
that: MediaPipe saw two hands in one take of a seal and one hand in the next
(戌: 0 of 30 frames versus 29 of 30), and sometimes swaps its left/right labels.
Rotating each hand upright was also tried and lowered the score to 57.9%, so it
is not used.

On another person, the easiest seals were 午 98%, 戌 94%, 酉 89% and 卯 85%; the
hardest 未 4%, 巳 8%, 子 43% and 亥 44%. The author's own samples have fewer
frames per seal (60) than the dataset had (about 150), which is one reason they
transfer less well to other hands.

The distance limit: with these samples, a limit of 4.0 recognised 60.5% of the
other person's seals and 6.0 recognised 63.6%. Three synthetic open-hand poses
were either read as 無 (distances 5.66 and 7.39) or ignored as too far (7.11).
Relaxed hands close to a seal are meant to be caught by the 無 samples, but only
10% of the author's second take of 無 was recognised as 無; resting hands can
still be read as a seal.

Recording your own samples in the trainer improves recognition the most.
