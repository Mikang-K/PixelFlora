const { Worker } = require('worker_threads');
const os = require('os');
const path = require('path');

const STRESS_SCRIPT = path.join(__dirname, '../scripts/stressCpu.js');

let activeWorkers = [];
let stormActive = false;

function startStorm(durationMs = 30000) {
  if (stormActive) return false;
  stormActive = true;

  const cpuCount = os.cpus().length;
  console.log(`[Storm] Starting CPU stress on ${cpuCount} cores for ${durationMs}ms`);

  for (let i = 0; i < cpuCount; i++) {
    const worker = new Worker(STRESS_SCRIPT, { workerData: { durationMs } });
    worker.on('exit', () => {
      activeWorkers = activeWorkers.filter((w) => w !== worker);
      if (activeWorkers.length === 0) {
        stormActive = false;
        console.log('[Storm] All workers finished');
      }
    });
    activeWorkers.push(worker);
  }

  return true;
}

function stopStorm() {
  if (!stormActive) return false;
  for (const worker of activeWorkers) {
    worker.terminate();
  }
  activeWorkers = [];
  stormActive = false;
  console.log('[Storm] Stopped manually');
  return true;
}

function isStormActive() {
  return stormActive;
}

module.exports = { startStorm, stopStorm, isStormActive };
