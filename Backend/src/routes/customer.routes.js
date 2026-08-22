const express = require('express');
const router = express.Router();
const sessionAuth = require('../middleware/session_auth');
const authorize = require('../middleware/authorize');
const customerController = require('../controllers/customer.controller');

router.get('/me', sessionAuth, authorize('CUSTOMER'), customerController.getCustomerProfile);
router.put('/me', sessionAuth, authorize('CUSTOMER'), customerController.updateCustomer);

module.exports = router;
