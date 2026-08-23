const authService = require('../services/auth.service');

/**
 * Role-based authorization.
 * Required role is set in code (never from the client body).
 *
 * For SELLER routes, also sets req.seller_id (server-side JOIN — never from client).
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

            const context = await authService.authorizeRole(req.user, requiredRole);
            if (context.seller_id) {
                req.seller_id = context.seller_id;
            }

            next();
        } catch (error) {
            if (error.statusCode === 403) {
                return res.status(403).json({ message: error.message });
            }
            if (error.statusCode === 404) {
                return res.status(404).json({ message: error.message });
            }

            console.error('Authorize error:', error.message);
            return res.status(500).json({ message: 'Failed to authorize user' });
        }
    };
};

module.exports = authorize;
