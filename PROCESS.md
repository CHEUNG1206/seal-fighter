# Process

## Starting idea

I wanted a game where the input is something you act out, not a button: forming
Naruto-style hand seals in front of a webcam. Week 6's browser sketches showed a
game could run in a web page, and MediaPipe's in-browser hand tracking made
hand seals possible without a server (Week 8 later covered MediaPipe in class).
The loop: the enemy charges, I form a jutsu's seals in order, the jutsu hits,
and I watch the enemy's charge and my chakra to decide what to do next.

The first version only recognised seals, to prove the hard part worked before
building a game around it.

## Design and code changes

**Recognition that survived real hands.** The first classifier compared each
pose as one long list of numbers. When I recorded 780 samples of my own hands,
the bundled samples recognised only 52.4% of my frames. Looking at the data
showed why: MediaPipe saw interlocked fingers as one hand in one take and two
hands in the next (戌: 0 of 30 frames with two hands, then 29 of 30). Comparing
poses hand by hand, trying both left/right pairings, raised this to 69.7%.

**From five made-up seals to the twelve real ones.** Version 1 used five
simplified poses. I changed it to the twelve seals and the series' seal
sequences, so the jutsu feel like the ones fans know.

**Balance.** I found big jutsu too easy to repeat, so I slowed chakra recovery
from 5 to 2 per second.

**Licensed material only.** The first bundled samples came from a Kaggle photo
dataset with no stated licence. I replaced them with my own 780 recordings. They
transfer less well to other people (63.6% on another person's photos, against
69.7% the other way round), so I loosened the distance limit from 4 to 6 and
documented the hard seals.

## User trial

I asked a friend to try the game. Before he started I only told him briefly how
to play: form the seals shown on the scroll in front of the camera. I did not
explain how the recognition works.

**What I observed.** He followed the hand-pose hint carefully, but the game
often recognised his pose as a different seal, so the jutsu he was aiming for
did not come out. This matches what I had measured: the bundled samples are
only my hands, and on another person's hands they recognise 63.6% of seal
frames, with some seals (未, 巳) almost never recognised.

**His feedback afterwards:**

1. Recognition quality needed to improve.
2. The hint should show the jutsu's pose with both hands clearly.
3. In keyboard mode it was not clear which key belongs to each step of a jutsu.

**What I changed:**

- **Keys:** every seal on the scroll and in the recent-seals row now shows its
  key underneath, and the next-seal card says "press 4". Keyboard mode makes
  the keys larger.
- **Both hands in the hint:** the hint drawing is larger and redrawn from my own
  samples, so it shows the poses the game actually knows. The camera view now
  colours the tracked hands the same way as the hint (orange and blue), and a
  line explains that both are mirrored: match orange to orange and blue to blue.
- **Recognition:** when the game read the wrong seal, he could not tell why. The
  camera panel now says whether it sees no hands, one or both, a bar fills
  while a seal is being held, and after 3 seconds without hands it suggests
  more light or moving closer. I also loosened the distance limit from 4 to 6,
  which recognised more of another person's seals (60.5% to 63.6%).

**What I kept, and why.** I did not change the recognition method itself before
the deadline. The real fix is more varied samples, so the README now says
plainly that recognition works best after recording your own hands in the
trainer, and the keyboard mode stays as a way to play when the camera gets a
seal wrong.

## How I used AI

I used **Claude Code** (Anthropic) throughout, as a coding assistant: it wrote
most of the JavaScript, the tests, the photo-to-landmark tool, the accuracy
scripts, the Cantonese/English/Japanese text, and drafts of the README and this
file. It also searched the web for seal sequences; where sources disagreed or
only fan lists exist (解 = 寅), the README says so.

I decided what to build and tested it with my camera and hands: I recorded the
samples, judged when the game felt wrong, and chose what to keep.

**A suggestion I kept:** comparing poses hand by hand. It was the AI's idea
after I gave it my recordings, and the numbers (52.4% → 69.7%) showed it worked.

**Suggestions I changed or rejected:**

- The AI also tried rotating every hand upright. It lowered accuracy to 57.9%,
  so we dropped it.
- The AI drew the enemies as simple SVG shapes. I did not like them and plan to
  replace them with my own pixel-art characters (Aseprite).
- The first default samples came from a photo dataset found during the
  project. When we noticed its licence is not stated, I chose to replace them
  with my own recordings, even though they work less well on other people.
- Chakra recovery of 5 per second was the AI's number; I changed it to 2.

**What I had to check:** the AI could only test the camera with a photo as a
fake webcam, so I tested camera play with my own hands, and recorded the
samples it used to measure accuracy.

## What I would do next

- Record samples from more people (with their permission) so the defaults work
  for more hands, and ask my friend to record his own seals in the trainer and
  try again, to see how much that helps.
- Replace the placeholder enemies with my own pixel art.
- An experimental branch, `feature/body-input`, adds opening the mouth to
  breathe fire, raising both hands to guard, and the player's silhouette in the
  arena (MediaPipe face, pose and segmentation, from Week 8). It is not part of
  the submitted version until I have tested it with someone.