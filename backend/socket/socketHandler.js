const { getInstanceId, getInstanceColor } = require('../config/instanceConfig');
const pixelService = require('../services/pixelService');
const { startStorm, stopStorm } = require('../services/stormService');

module.exports = function registerSocketHandlers(io) {
  io.on('connection', async (socket) => {
    const instanceId = getInstanceId();
    const instanceColor = getInstanceColor();

    console.log(`[Socket] Client connected: ${socket.id}`);

    // Send this server's identity to the newly connected client
    socket.emit('server:info', { instanceId, color: instanceColor });

    // Send the full current pixel map so the client can render existing flowers
    const pixels = await pixelService.getPixels();
    socket.emit('pixels:init', pixels);

    // Notify everyone that a new connection arrived (used to update legend)
    io.emit('instance:activity', { instanceId, color: instanceColor });

    socket.on('pixel:place', async ({ x, y }) => {
      if (typeof x !== 'number' || typeof y !== 'number') return;
      await pixelService.savePixel(x, y, instanceColor.primary, instanceId);
      // Redis PUBLISH triggers redisSubscriber → io.emit('pixel:update')
    });

    socket.on('storm:start', ({ durationMs } = {}) => {
      startStorm(durationMs || 30000);
      io.emit('storm:status', { active: true, instanceId });
    });

    socket.on('storm:stop', () => {
      stopStorm();
      io.emit('storm:status', { active: false, instanceId });
    });

    socket.on('disconnect', () => {
      console.log(`[Socket] Client disconnected: ${socket.id}`);
    });
  });
};
