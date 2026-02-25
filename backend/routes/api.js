const express = require('express');
const { getInstanceId, getInstanceColor } = require('../config/instanceConfig');
const pixelService = require('../services/pixelService');
const { startStorm, stopStorm, isStormActive } = require('../services/stormService');

const router = express.Router();

router.get('/server-info', (req, res) => {
  res.json({ instanceId: getInstanceId(), color: getInstanceColor() });
});

router.get('/pixels', async (req, res) => {
  const pixels = await pixelService.getPixels();
  res.json(pixels);
});

router.post('/storm/start', (req, res) => {
  const started = startStorm();
  res.json({ status: started ? 'started' : 'already_active' });
});

router.post('/storm/stop', (req, res) => {
  const stopped = stopStorm();
  res.json({ status: stopped ? 'stopped' : 'not_active' });
});

router.get('/storm/status', (req, res) => {
  res.json({ active: isStormActive(), instanceId: getInstanceId() });
});

router.delete('/pixels', async (req, res) => {
  await pixelService.clearPixels();
  res.json({ status: 'cleared' });
});

module.exports = router;
