const express = require('express');
const router = express.Router();
const adminController = require('../controllers/admin.controller');
const adminService = require('../services/admin.service');
const sessionAuth = require('../middleware/session_auth');
const authorize = require('../middleware/authorize');

/** First admin is public bootstrap; later creates require ADMIN session. */
const bootstrapOrAdmin = async (req, res, next) => {
    try {
        const count = await adminService.countAdmins();
        if (count === 0) {
            return next();
        }
        return sessionAuth(req, res, (err) => {
            if (err) {
                return next(err);
            }
            return authorize('ADMIN')(req, res, next);
        });
    } catch (error) {
        console.error('Admin bootstrap check error:', error.message);
        return res.status(500).json({ message: 'Failed to authorize admin create' });
    }
};

router.post('/create-admin', bootstrapOrAdmin, adminController.createAdmin);
router.get('/me', sessionAuth, authorize('ADMIN'), adminController.getAdminProfile);
router.put('/me', sessionAuth, authorize('ADMIN'), adminController.updateAdmin);

module.exports = router;
