// CPU-intensive work: runs until the worker is terminated
while (true) {
  // Fibonacci calculation to burn CPU cycles
  let a = 0, b = 1;
  for (let i = 0; i < 1e6; i++) {
    [a, b] = [b, a + b];
  }
}
