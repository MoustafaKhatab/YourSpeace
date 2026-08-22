const express = require('express');
const router = express.Router();
const sessionAuth = require('../middleware/session_auth');
const authorize = require('../middleware/authorize');
const sellerController = require('../controllers/seller.controller');

router.get('/me', sessionAuth, authorize('SELLER'), sellerController.getSellerProfile);

module.exports = router;
