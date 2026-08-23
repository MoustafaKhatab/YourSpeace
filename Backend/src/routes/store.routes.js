const express = require('express');
const router = express.Router();
const storeController = require('../controllers/store.controller');
const sessionAuth = require('../middleware/session_auth');
const authorize = require('../middleware/authorize');

router.post('/create-store', sessionAuth, authorize('SELLER'), storeController.createStore);

module.exports = router;