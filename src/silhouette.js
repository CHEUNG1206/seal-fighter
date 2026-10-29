// Draws the player into the arena: the camera image, mirrored, with
// everything but the person made transparent using the segmentation mask.
// Nothing is recorded or uploaded; each frame replaces the last.

const WIDTH = 160; // working size; the canvas scales it up
const HEIGHT = 120;

const work = document.createElement('canvas');
work.width = WIDTH;
work.height = HEIGHT;
const workCtx = work.getContext('2d', { willReadFrequently: true });

// mask: {data: Float32Array of person confidence 0–1, width, height}, in the
// camera's own (unmirrored) orientation.
export function drawSilhouette(canvas, video, mask) {
  const ctx = canvas.getContext('2d');
  ctx.clearRect(0, 0, canvas.width, canvas.height);
  if (!mask || !video.videoWidth) return;

  workCtx.save();
  workCtx.translate(WIDTH, 0);
  workCtx.scale(-1, 1);
  workCtx.drawImage(video, 0, 0, WIDTH, HEIGHT);
  workCtx.restore();

  const image = workCtx.getImageData(0, 0, WIDTH, HEIGHT);
  const pixels = image.data;
  const { data, width, height } = mask;
  for (let y = 0; y < HEIGHT; y++) {
    const row = Math.floor((y * height) / HEIGHT) * width;
    for (let x = 0; x < WIDTH; x++) {
      // The image is mirrored, the mask is not.
      const confidence = data[row + Math.floor(((WIDTH - 1 - x) * width) / WIDTH)];
      // Soft edge between 0.35 and 0.65 confidence.
      const alpha = Math.min(1, Math.max(0, (confidence - 0.35) / 0.3));
      pixels[(y * WIDTH + x) * 4 + 3] = alpha * 255;
    }
  }
  workCtx.putImageData(image, 0, 0);
  ctx.drawImage(work, 0, 0, canvas.width, canvas.height);
}

// Where a point of the camera image (normalised, unmirrored) appears on the
// stage, given the silhouette canvas's box inside it.
export function toStage(point, box) {
  return { x: box.left + (1 - point.x) * box.width, y: box.top + point.y * box.height };
}
