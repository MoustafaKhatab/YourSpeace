const authService = require('../services/auth.service');

/**
 * Role-based authorization for a single required role.
 * Sets req.user.seller_id (SELLER) or req.user.admin_id (ADMIN) from server JOIN.
 */
const authorize = (requiredRole) => {
    return async (req, res, next) => {
        try {
            if (!req.user) {
                return res.status(401).json({ message: 'Unauthorized' });
            }

            const context = await authService.authorizeRole(req.user, requiredRole);
            if (context.seller_id) {
                req.user.seller_id = context.seller_id;
            }
            if (context.admin_id) {
                req.user.admin_id = context.admin_id;
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

/**
 * Allow any of the given roles (e.g. SELLER or ADMIN for product write).
 * Loads seller_id / admin_id for the matching role.
 */
const authorizeAny = (...allowedRoles) => {
    return async (req, res, next) => {
        try {
            if (!req.user) {
                return res.status(401).json({ message: 'Unauthorized' });
            }

            if (!allowedRoles.includes(req.user.role)) {
                return res.status(403).json({
                    message: `Forbidden: requires ${allowedRoles.join(' or ')}`,
                });
            }

            const context = await authService.authorizeRole(req.user, req.user.role);
            if (context.seller_id) {
                req.user.seller_id = context.seller_id;
            }
            if (context.admin_id) {
                req.user.admin_id = context.admin_id;
            }

            next();
        } catch (error) {
            if (error.statusCode === 403) {
                return res.status(403).json({ message: error.message });
            }
            if (error.statusCode === 404) {
                return res.status(404).json({ message: error.message });
            }

            console.error('AuthorizeAny error:', error.message);
            return res.status(500).json({ message: 'Failed to authorize user' });
        }
    };
};

module.exports = authorize;
module.exports.authorizeAny = authorizeAny;
