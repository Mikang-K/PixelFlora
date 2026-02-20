const { workerData } = require('worker_threads');

// CPU-intensive work: runs for the specified duration
const end = Date.now() + (workerData.durationMs || 30000);

while (Date.now() < end) {
  // Fibonacci calculation to burn CPU cycles
  let a = 0, b = 1;
  for (let i = 0; i < 1e6; i++) {
    [a, b] = [b, a + b];
  }
}
