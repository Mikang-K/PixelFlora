import { applyBrightness } from './colorMixer';

// 5x5 flower pattern: [dx, dy, brightnessMultiplier]
// Center (0,0) is the pistil; petals radiate outward
const FLOWER_PATTERN = [
  // Petals
  [0, -2, 0.75],
  [0, 2, 0.75],
  [-2, 0, 0.75],
  [2, 0, 0.75],
  // Inner petals
  [-1, -1, 0.9],
  [1, -1, 0.9],
  [-1, 1, 0.9],
  [1, 1, 0.9],
  // Pistil (center)
  [0, 0, 1.0],
];

export function drawFlower(ctx, x, y, color, pixelSize) {
  for (const [dx, dy, brightness] of FLOWER_PATTERN) {
    const px = (x + dx) * pixelSize;
    const py = (y + dy) * pixelSize;
    // Skip pixels that would be out of canvas bounds
    if (px < 0 || py < 0) continue;
    ctx.fillStyle = applyBrightness(color, brightness);
    ctx.fillRect(px, py, pixelSize, pixelSize);
  }
}
