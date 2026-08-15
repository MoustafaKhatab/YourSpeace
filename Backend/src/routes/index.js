const express = require('express');
const healthRoutes = require('./health.routes');
const authRoutes = require('./auth.routes');
const addressRoutes = require('./address.routes');

const router = express.Router();

router.use('/health', healthRoutes);
router.use('/auth', authRoutes);
router.use('/address', addressRoutes);

module.exports = router;
