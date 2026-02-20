export function hexToRgb(hex) {
  return {
    r: parseInt(hex.slice(1, 3), 16),
    g: parseInt(hex.slice(3, 5), 16),
    b: parseInt(hex.slice(5, 7), 16),
  };
}

export function rgbToHex(r, g, b) {
  return '#' + [r, g, b].map((v) => v.toString(16).padStart(2, '0')).join('');
}

export function mixColors(hex1, hex2) {
  const c1 = hexToRgb(hex1);
  const c2 = hexToRgb(hex2);
  return rgbToHex(
    Math.floor((c1.r + c2.r) / 2),
    Math.floor((c1.g + c2.g) / 2),
    Math.floor((c1.b + c2.b) / 2)
  );
}

// ITU-R BT.601 luminance
export function toGrayscale(hex) {
  const { r, g, b } = hexToRgb(hex);
  const gray = Math.floor(0.299 * r + 0.587 * g + 0.114 * b);
  return rgbToHex(gray, gray, gray);
}

export function grayscaleByInstance(pixels, targetInstanceId) {
  const updated = { ...pixels };
  for (const [key, pixel] of Object.entries(updated)) {
    if (pixel.instanceId === targetInstanceId) {
      updated[key] = { ...pixel, color: toGrayscale(pixel.color) };
    }
  }
  return updated;
}

// Apply brightness multiplier to a hex color
export function applyBrightness(hex, factor) {
  const { r, g, b } = hexToRgb(hex);
  return rgbToHex(
    Math.min(255, Math.floor(r * factor)),
    Math.min(255, Math.floor(g * factor)),
    Math.min(255, Math.floor(b * factor))
  );
}
