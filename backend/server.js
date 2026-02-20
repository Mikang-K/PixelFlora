require('dotenv').config();
const express = require('express');
const http = require('http');
const { Server } = require('socket.io');
const cors = require('cors');

const { initInstanceConfig, getInstanceId, getInstanceColor } = require('./config/instanceConfig');
const { initSubscriber } = require('./services/redisSubscriber');
const { grayscaleByInstance, registerInstance, deregisterInstance } = require('./services/pixelService');
const { stopStorm } = require('./services/stormService');

const app = express();
const server = http.createServer(app);
const io = new Server(server, {
  cors: { origin: '*', methods: ['GET', 'POST'] },
});

app.use(cors());
app.use(express.json());

// Routes
app.use('/health', require('./routes/health'));
app.use('/api', require('./routes/api'));

async function main() {
  await initInstanceConfig();

  const instanceId = getInstanceId();
  const instanceColor = getInstanceColor();

  // Register this instance in Redis
  await registerInstance(instanceId, instanceColor);

  // Subscribe to Redis Pub/Sub → broadcast to all Socket.io clients
  initSubscriber(io);

  // Register Socket.io event handlers
  require('./socket/socketHandler')(io);

  const PORT = process.env.PORT || 3001;
  server.listen(PORT, () => {
    console.log(`[Server] Running on port ${PORT} | Instance: ${instanceId} | Theme: ${instanceColor.theme}`);
  });

  // Graceful shutdown: grayscale this instance's flowers before exiting
  async function shutdown(signal) {
    console.log(`[Server] ${signal} received. Starting graceful shutdown...`);
    try {
      await grayscaleByInstance(instanceId);
      await deregisterInstance(instanceId);
      io.emit('instance:leave', { instanceId });
      console.log('[Server] Graceful shutdown complete');
    } catch (e) {
      console.error('[Server] Shutdown error:', e);
    } finally {
      stopStorm();
      setTimeout(() => process.exit(0), 2000);
    }
  }

  process.on('SIGTERM', () => shutdown('SIGTERM'));
  process.on('SIGINT', () => shutdown('SIGINT'));
}

main().catch((err) => {
  console.error('[Server] Startup failed:', err);
  process.exit(1);
});
