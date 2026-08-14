const express = require('express');
const authController = require('../controllers/auth.controller');
const sessionAuth = require('../middleware/session_auth');
const authorize = require('../middleware/authorize');
const router = express.Router();

router.post('/register', authController.register);
router.post('/login', authController.login);
router.post('/forget-password', authController.forgetPassword);
router.post('/reset-password', authController.resetPassword);
router.post('/logout', authController.logout);
router.get('/me', sessionAuth, authorize('CUSTOMER'), authController.me);

module.exports = router;
