const express = require('express');
const router = express.Router();
const analyticsController = require('../controllers/analyticsController');
const { verifyToken, requireRole } = require('../middleware/auth');

router.use(verifyToken);

router.get('/traffic', analyticsController.getTrafficStats);
router.get('/alerts', analyticsController.getAlerts);
router.get('/audit', requireRole(['Admin']), analyticsController.getAuditLogs);
router.post('/attack', requireRole(['Admin']), analyticsController.triggerAttack);
router.post('/scenario', requireRole(['Admin', 'User']), analyticsController.runScenario);
router.post('/clear', requireRole(['Admin']), analyticsController.clearLogs);

module.exports = router;
