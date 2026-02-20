const { redisClient } = require('../config/redis');

const CHANNEL = 'pixel-events';

async function redisPublisher(message) {
  await redisClient.publish(CHANNEL, JSON.stringify(message));
}

module.exports = { redisPublisher };
