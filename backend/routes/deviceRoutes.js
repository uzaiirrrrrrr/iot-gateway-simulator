const express = require('express');
const router = express.Router();
const deviceController = require('../controllers/deviceController');
const { verifyToken, requireRole } = require('../middleware/auth');

router.use(verifyToken);

router.post('/', requireRole(['Admin', 'User']), deviceController.createDevice);
router.get('/', deviceController.getDevices);
router.patch('/:id/status', requireRole(['Admin', 'User']), deviceController.updateDeviceStatus);
router.patch('/:id/mapping', requireRole(['Admin', 'User']), deviceController.updateDeviceMapping);
router.patch('/:id/metadata', requireRole(['Admin', 'User']), deviceController.updateDeviceMetadata);
router.delete('/:id', requireRole(['Admin']), deviceController.deleteDevice);

module.exports = router;
