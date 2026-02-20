const axios = require('axios');

const INSTANCE_COLOR_MAP = {
  A: { primary: '#FF4444', secondary: '#FF69B4', theme: 'red' },
  B: { primary: '#4444FF', secondary: '#00FFFF', theme: 'blue' },
  C: { primary: '#44FF44', secondary: '#ADFF2F', theme: 'green' },
  D: { primary: '#FFD700', secondary: '#FFA500', theme: 'yellow' },
};

// Map instance ID hash to a color key
function hashToColorKey(instanceId) {
  const chars = 'ABCD';
  let sum = 0;
  for (const c of instanceId) sum += c.charCodeAt(0);
  return chars[sum % chars.length];
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
    const colorKey = hashToColorKey(id);
    instanceColor = INSTANCE_COLOR_MAP[colorKey];
    console.log(`[Instance] AWS mode - ID: ${instanceId}, theme: ${instanceColor.theme}`);
  } catch {
    // Fallback to A if metadata not available
    instanceId = `fallback-${Date.now()}`;
    instanceColor = INSTANCE_COLOR_MAP['A'];
    console.warn('[Instance] Metadata unavailable, using fallback color: red');
  }
}

function getInstanceId() { return instanceId; }
function getInstanceColor() { return instanceColor; }

module.exports = { initInstanceConfig, getInstanceId, getInstanceColor };
