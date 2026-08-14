const authService = require('../services/auth.service');

/**
 * Role-based authorization.
 * Required role is set in code (never from the client body).
 *
 * Usage:
 *   router.get('/seller/dashboard', sessionAuth, authorize('SELLER'), handler)
 *   router.get('/admin', sessionAuth, authorize('ADMIN'), handler)
 */
const authorize = (requiredRole) => {
    return async (req, res, next) => {
        try {
            if (!req.user) {
                return res.status(401).json({ message: 'Unauthorized' });
            }

            await authService.checkUserRole(req.user.user_id, requiredRole);
            next();
        } catch (error) {
            if (error.statusCode === 403) {
                return res.status(403).json({ message: error.message });
            }
            if (error.statusCode === 404) {
                return res.status(401).json({ message: error.message });
            }

            console.error('Authorize error:', error.message);
            return res.status(500).json({ message: 'Failed to authorize user' });
        }
    };
};

module.exports = authorize;
