const express = require('express');
const addressController = require('../controllers/address.controller');
const sessionAuth = require('../middleware/session_auth');
const authorize = require('../middleware/authorize');
const router = express.Router();

router.post('/create', sessionAuth, authorize('CUSTOMER'), addressController.createAddress);
router.get('/get', sessionAuth, authorize('CUSTOMER'), addressController.getAddressByUserId);
router.delete('/delete/:address_id', sessionAuth, authorize('CUSTOMER'), addressController.deleteAddress);

module.exports = router;