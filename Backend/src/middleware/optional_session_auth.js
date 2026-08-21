const authService = require('../services/auth.service');

/** Attaches req.user when x-session-id is present; allows unauthenticated access otherwise. */
const optionalSessionAuth = async (req, res, next) => {
    try {
        const session_id = req.headers['x-session-id'];

        if (!session_id) {
            return next();
        }

        const { user_id } = await authService.checkSessionExpiration(session_id);
        const { user } = await authService.getUserById(user_id);

        req.user = user;
        req.session_id = session_id;
        return next();
    } catch (error) {
        if (error.statusCode === 401 || error.statusCode === 404) {
            return res.status(401).json({ message: error.message });
        }

        console.error('Optional session auth error:', error.message);
        return res.status(500).json({ message: 'Failed to authenticate session' });
    }
};

module.exports = optionalSessionAuth;
