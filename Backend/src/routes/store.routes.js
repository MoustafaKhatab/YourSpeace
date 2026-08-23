const express = require('express');
const router = express.Router();
const storeController = require('../controllers/store.controller');
const sessionAuth = require('../middleware/session_auth');
const authorize = require('../middleware/authorize');

router.post('/create-store', sessionAuth, authorize('SELLER'), storeController.createStore);
router.get('/get-user-store', sessionAuth, authorize('SELLER'), storeController.getUserStore);
router.put('/update-user-store', sessionAuth, authorize('SELLER'), storeController.updateUserStore);

module.exports = router;
