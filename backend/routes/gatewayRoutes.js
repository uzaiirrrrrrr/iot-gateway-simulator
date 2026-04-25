const express = require('express');
const router = express.Router();
const gatewayController = require('../controllers/gatewayController');
const { verifyToken, requireRole } = require('../middleware/auth');

router.use(verifyToken); // Protect all gateway routes

router.post('/', requireRole(['Admin']), gatewayController.createGateway);
router.get('/', gatewayController.getGateways);
router.patch('/:id', requireRole(['Admin']), gatewayController.updateGatewayStatus);
router.patch('/:id/settings', requireRole(['Admin']), gatewayController.updateSettings);
router.get('/:id/logs', gatewayController.getGatewayLogs);
router.delete('/:id', requireRole(['Admin']), gatewayController.deleteGateway);

module.exports = router;
