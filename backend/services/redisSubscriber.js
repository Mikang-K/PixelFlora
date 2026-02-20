const { subClient } = require('../config/redis');

const CHANNEL = 'pixel-events';

// initSubscriber: called once at startup.
// Subscribes to Redis Pub/Sub channel and broadcasts every message
// to ALL Socket.io clients — this is the key to multi-instance sync.
function initSubscriber(io) {
  subClient.subscribe(CHANNEL, (err) => {
    if (err) {
      console.error('[Redis] Subscribe error:', err);
      return;
    }
    console.log(`[Redis] Subscribed to channel: ${CHANNEL}`);
  });

  subClient.on('message', (channel, message) => {
    if (channel !== CHANNEL) return;
    try {
      const data = JSON.parse(message);
      io.emit('pixel:update', data);
    } catch (e) {
      console.error('[Redis] Failed to parse message:', e);
    }
  });
}

module.exports = { initSubscriber };
