const express = require('express');
const router = express.Router();
const analyticsController = require('../controllers/analyticsController');
const { verifyToken, requireRole } = require('../middleware/auth');

router.use(verifyToken);

router.get('/traffic', analyticsController.getTrafficStats);
router.get('/traffic-logs', analyticsController.getTrafficLogs);
router.get('/alerts', analyticsController.getAlerts);
router.get('/audit', requireRole(['Admin']), analyticsController.getAuditLogs);
router.post('/attack', requireRole(['Admin']), analyticsController.triggerAttack);
router.post('/scenario', requireRole(['Admin', 'User']), analyticsController.runScenario);
router.post('/clear', requireRole(['Admin']), analyticsController.clearLogs);

// Cloud Pipelines Endpoint
router.get('/pipelines', analyticsController.getPipelines);
router.post('/pipelines', requireRole(['Admin', 'User']), analyticsController.createPipeline);
router.delete('/pipelines/:id', requireRole(['Admin']), analyticsController.deletePipeline);
router.patch('/pipelines/:id/status', requireRole(['Admin', 'User']), analyticsController.updatePipelineStatus);

module.exports = router;
