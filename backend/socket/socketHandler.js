const { getInstanceId, getInstanceColor } = require('../config/instanceConfig');
const pixelService = require('../services/pixelService');
const { startStorm, stopStorm } = require('../services/stormService');

// Returns a random color interpolated between primary and secondary theme colors
function randomThemeColor(primary, secondary) {
  const hex = (h) => [parseInt(h.slice(1, 3), 16), parseInt(h.slice(3, 5), 16), parseInt(h.slice(5, 7), 16)];
  const c1 = hex(primary);
  const c2 = hex(secondary);
  const t = Math.random();
  return '#' + c1.map((v, i) => Math.round(v + t * (c2[i] - v)).toString(16).padStart(2, '0')).join('');
}

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
      const color = randomThemeColor(instanceColor.primary, instanceColor.secondary);
      await pixelService.savePixel(x, y, color, instanceId);
      // Redis PUBLISH triggers redisSubscriber → io.emit('pixel:update')
    });

    socket.on('storm:start', () => {
      startStorm();
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
