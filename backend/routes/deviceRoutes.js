const express = require('express');
const router = express.Router();
const deviceController = require('../controllers/deviceController');
const { verifyToken, requireRole } = require('../middleware/auth');

router.use(verifyToken);

router.post('/', requireRole(['Admin', 'User']), deviceController.createDevice);
router.get('/', deviceController.getDevices);
router.delete('/:id', requireRole(['Admin']), deviceController.deleteDevice);

module.exports = router;
