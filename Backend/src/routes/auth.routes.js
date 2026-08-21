const express = require('express');
const authController = require('../controllers/auth.controller');
const sessionAuth = require('../middleware/session_auth');
const optionalSessionAuth = require('../middleware/optional_session_auth');
const authorize = require('../middleware/authorize');
const router = express.Router();

router.post('/register', authController.register);
router.post('/login', authController.login);
router.post('/forget-password', authController.forgetPassword);
router.post('/reset-password', authController.resetPassword);

// Change password (any logged-in role — CUSTOMER / SELLER / ADMIN)
router.post('/change-password/request', sessionAuth, authController.requestChangePassword);
router.post('/verify-code', optionalSessionAuth, authController.verifyCode);
router.put('/change-password', sessionAuth, authController.changePassword);

router.post('/logout', authController.logout);
router.get('/me', sessionAuth, authorize('CUSTOMER'), authController.me);

module.exports = router;
