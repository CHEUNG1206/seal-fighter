# Process

<!-- Draft written with Claude Code from my project notes and our chat.
Read it, correct anything that is not how I remember it, and put it in my own
words before submitting. Delete this comment afterwards. -->

## Starting idea

I wanted a game where the input is something you act out, not a button: forming
Naruto-style hand seals in front of a webcam. Week 6's browser sketches showed a
game could run in a web page, and MediaPipe's in-browser hand tracking made
hand seals possible without a server (Week 8 later covered MediaPipe in class). The loop: the enemy charges, I form a jutsu's seals in order, the
jutsu hits, and I watch the enemy's charge and my chakra to decide what to do
next.

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

I asked a friend to try the game. <!-- Add: did he try it before I explained
anything? What did he try first, and where did he hesitate? -->

His feedback:

1. Recognition quality needed to improve.
2. The hint should show the jutsu's pose with both hands clearly.
3. In keyboard mode it was not clear which key belongs to each step of a jutsu.

What I changed:

- **Keys:** every seal on the scroll and in the recent-seals row now shows its
  key underneath, and the next-seal card says "press 4". Keyboard mode makes
  the keys larger.
- **Both hands in the hint:** the hint drawing is larger and redrawn from my own
  samples. The camera view now colours the tracked hands the same way as the
  hint (orange and blue), and a line explains that both are mirrored, so he can
  match orange to orange and blue to blue.
- **Recognition:** I could not make the model itself much better before the
  deadline, so I made it easier to work with: the camera panel says whether it
  sees no hands, one or both, a bar fills while a seal is being held, and after
  3 seconds without hands it suggests more light or moving closer. I also
  changed the distance limit (above) and kept the keyboard as a fallback.

<!-- Add: did you ask him to try again? Did it help? -->

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
  for more hands.
- Replace the placeholder enemies with my own pixel art.
- An experimental branch, `feature/body-input`, adds opening the mouth to
  breathe fire, raising both hands to guard, and the player's silhouette in the
  arena (MediaPipe face, pose and segmentation, from Week 8). It is not part of
  the submitted version until I have tested it with someone.
