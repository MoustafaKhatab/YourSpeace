const express = require('express');
const router = express.Router();
const sessionAuth = require('../middleware/session_auth');
const customerController = require('../controllers/customer.controller');

router.put('/me', sessionAuth, customerController.updateCustomer);

module.exports = router;    