const express = require('express');
const { getInstanceId, getInstanceColor } = require('../config/instanceConfig');

const router = express.Router();

router.get('/', (req, res) => {
  res.json({
    status: 'ok',
    instanceId: getInstanceId(),
    color: getInstanceColor(),
    timestamp: new Date().toISOString(),
  });
});

module.exports = router;
