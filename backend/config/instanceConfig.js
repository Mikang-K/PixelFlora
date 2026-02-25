const axios = require('axios');
const { redisClient } = require('./redis');

const INSTANCE_COLOR_MAP = {
  A: { primary: '#FF4444', secondary: '#FF69B4', theme: 'red' },
  B: { primary: '#4444FF', secondary: '#00FFFF', theme: 'blue' },
  C: { primary: '#44FF44', secondary: '#ADFF2F', theme: 'green' },
  D: { primary: '#FFD700', secondary: '#FFA500', theme: 'yellow' },
};

// Map instance ID hash to a color key (fallback when all colors are taken)
function hashToColorKey(instanceId) {
  const chars = 'ABCD';
  let sum = 0;
  for (const c of instanceId) sum += c.charCodeAt(0);
  return chars[sum % chars.length];
}

// Pick a color key not already used by any active instance in Redis
async function pickAvailableColorKey(instanceId) {
  const allKeys = Object.keys(INSTANCE_COLOR_MAP);
  try {
    const raw = await redisClient.hgetall('instances');
    if (!raw) return allKeys[0];

    const usedKeys = new Set();
    for (const [id, value] of Object.entries(raw)) {
      if (id === instanceId) continue; // skip self in case of re-registration
      const data = JSON.parse(value);
      if (!data.active) continue;
      for (const [key, colorConfig] of Object.entries(INSTANCE_COLOR_MAP)) {
        if (data.color && data.color.primary === colorConfig.primary) {
          usedKeys.add(key);
          break;
        }
      }
    }

    const available = allKeys.filter((k) => !usedKeys.has(k));
    if (available.length > 0) return available[0];
  } catch (err) {
    console.warn('[Instance] Redis unavailable for color selection, falling back to hash:', err.message);
  }
  // All colors taken or Redis error: fall back to hash
  return hashToColorKey(instanceId);
}

async function fetchEC2InstanceId() {
  // IMDSv2: first get token, then use it to fetch instance-id
  const tokenRes = await axios.put(
    'http://169.254.169.254/latest/api/token',
    null,
    {
      headers: { 'X-aws-ec2-metadata-token-ttl-seconds': '21600' },
      timeout: 2000,
    }
  );
  const token = tokenRes.data;
  const idRes = await axios.get(
    'http://169.254.169.254/latest/meta-data/instance-id',
    {
      headers: { 'X-aws-ec2-metadata-token': token },
      timeout: 2000,
    }
  );
  return idRes.data;
}

let instanceId = null;
let instanceColor = null;

async function initInstanceConfig() {
  // 1. Local dev: use INSTANCE_COLOR env var
  if (process.env.INSTANCE_COLOR && INSTANCE_COLOR_MAP[process.env.INSTANCE_COLOR]) {
    const key = process.env.INSTANCE_COLOR;
    instanceId = `local-instance-${key}`;
    instanceColor = INSTANCE_COLOR_MAP[key];
    console.log(`[Instance] Local mode - ID: ${instanceId}, theme: ${instanceColor.theme}`);
    return;
  }

  // 2. AWS: fetch from EC2 metadata
  try {
    const id = await fetchEC2InstanceId();
    instanceId = id;
  } catch {
    instanceId = `fallback-${Date.now()}`;
    console.warn('[Instance] EC2 metadata unavailable, using fallback instance ID');
  }

  const colorKey = await pickAvailableColorKey(instanceId);
  instanceColor = INSTANCE_COLOR_MAP[colorKey];
  console.log(`[Instance] AWS mode - ID: ${instanceId}, theme: ${instanceColor.theme}`);
}

function getInstanceId() { return instanceId; }
function getInstanceColor() { return instanceColor; }

module.exports = { initInstanceConfig, getInstanceId, getInstanceColor };
