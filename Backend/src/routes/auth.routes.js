const express = require('express');
const authController = require('../controllers/auth.controller');
const sessionAuth = require('../middleware/session_auth');
const router = express.Router();

router.post('/register', authController.register);
router.post('/login', authController.login);
router.post('/forget-password', authController.forgetPassword);
// Forget/reset flow: email from body only (no session)
router.post('/reset-password/verify-code', authController.verifyResetPasswordCode);
router.post('/reset-password', authController.resetPassword);

// Change password (any logged-in role — CUSTOMER / SELLER / ADMIN)
router.post('/change-password/request', sessionAuth, authController.requestChangePassword);
router.post('/verify-code', sessionAuth, authController.verifyCode);
router.put('/change-password', sessionAuth, authController.changePassword);

router.post('/logout', authController.logout);

module.exports = router;
