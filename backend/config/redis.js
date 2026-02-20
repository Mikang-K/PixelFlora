const Redis = require('ioredis');

const redisOptions = {
  host: process.env.REDIS_HOST || 'localhost',
  port: parseInt(process.env.REDIS_PORT || '6379'),
  retryStrategy: (times) => Math.min(times * 100, 3000),
};

// General-purpose client for commands (GET, SET, HSET, etc.)
const redisClient = new Redis(redisOptions);

// Dedicated client for SUBSCRIBE (cannot mix pub/sub with regular commands)
const subClient = new Redis(redisOptions);

redisClient.on('error', (err) => console.error('[Redis] Client error:', err));
subClient.on('error', (err) => console.error('[Redis] SubClient error:', err));
redisClient.on('connect', () => console.log('[Redis] Client connected'));

module.exports = { redisClient, subClient };
