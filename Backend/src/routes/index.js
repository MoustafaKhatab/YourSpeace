const express = require('express');
const healthRoutes = require('./health.routes');
const authRoutes = require('./auth.routes');
const addressRoutes = require('./address.routes');
const customerRoutes = require('./customer.routes');
const sellerRoutes = require('./seller.routes');
const storeRoutes = require('./store.routes');
const router = express.Router();


router.use('/health', healthRoutes);
router.use('/auth', authRoutes);
router.use('/address', addressRoutes);
router.use('/customer', customerRoutes);
router.use('/seller', sellerRoutes);
router.use('/store', storeRoutes);

module.exports = router;
