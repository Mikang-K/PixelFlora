const { redisClient } = require('../config/redis');
const { redisPublisher } = require('./redisPublisher');

const PIXELS_KEY = 'pixels';
const INSTANCES_KEY = 'instances';

function hexToRgb(hex) {
  const r = parseInt(hex.slice(1, 3), 16);
  const g = parseInt(hex.slice(3, 5), 16);
  const b = parseInt(hex.slice(5, 7), 16);
  return { r, g, b };
}

function rgbToHex(r, g, b) {
  return '#' + [r, g, b].map((v) => v.toString(16).padStart(2, '0')).join('');
}

function mixColors(hex1, hex2) {
  const c1 = hexToRgb(hex1);
  const c2 = hexToRgb(hex2);
  return rgbToHex(
    Math.floor((c1.r + c2.r) / 2),
    Math.floor((c1.g + c2.g) / 2),
    Math.floor((c1.b + c2.b) / 2)
  );
}

function toGrayscale(hex) {
  const { r, g, b } = hexToRgb(hex);
  // ITU-R BT.601 luminance
  const gray = Math.floor(0.299 * r + 0.587 * g + 0.114 * b);
  return rgbToHex(gray, gray, gray);
}

async function savePixel(x, y, color, instanceId) {
  const field = `${x}:${y}`;
  const existing = await redisClient.hget(PIXELS_KEY, field);

  let finalColor = color;
  let type = 'PIXEL_PLACED';

  if (existing) {
    const existingData = JSON.parse(existing);
    if (existingData.color !== color) {
      finalColor = mixColors(existingData.color, color);
      type = 'PIXEL_MIXED';
    }
  }

  const pixelData = { color: finalColor, instanceId, timestamp: Date.now() };
  await redisClient.hset(PIXELS_KEY, field, JSON.stringify(pixelData));

  await redisPublisher({ type, x, y, ...pixelData });
}

async function getPixels() {
  const raw = await redisClient.hgetall(PIXELS_KEY);
  if (!raw) return {};
  const result = {};
  for (const [field, value] of Object.entries(raw)) {
    result[field] = JSON.parse(value);
  }
  return result;
}

async function grayscaleByInstance(instanceId) {
  const raw = await redisClient.hgetall(PIXELS_KEY);
  if (!raw) return;

  const updates = [];
  for (const [field, value] of Object.entries(raw)) {
    const data = JSON.parse(value);
    if (data.instanceId === instanceId) {
      data.color = toGrayscale(data.color);
      updates.push(field, JSON.stringify(data));
    }
  }

  if (updates.length > 0) {
    await redisClient.hset(PIXELS_KEY, ...updates);
  }

  await redisPublisher({ type: 'GRAYSCALE', instanceId });
}

async function registerInstance(instanceId, color) {
  const data = { color, lastSeen: Date.now(), active: true };
  await redisClient.hset(INSTANCES_KEY, instanceId, JSON.stringify(data));
}

async function deregisterInstance(instanceId) {
  const raw = await redisClient.hget(INSTANCES_KEY, instanceId);
  if (raw) {
    const data = JSON.parse(raw);
    data.active = false;
    await redisClient.hset(INSTANCES_KEY, instanceId, JSON.stringify(data));
  }
}

async function clearPixels() {
  await redisClient.del(PIXELS_KEY);
}

module.exports = {
  savePixel,
  getPixels,
  grayscaleByInstance,
  registerInstance,
  deregisterInstance,
  clearPixels,
};
