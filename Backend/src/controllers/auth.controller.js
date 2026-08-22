const authService = require('../services/auth.service');
const mailer = require('../utils/mailer');
const { buildEmail } = require('../utils/emailTemplates');

const isValidEmail = (email) => {
    return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email);
};

const MIN_PASSWORD_LENGTH = 8;

const register = async (req, res) => {
    try {
        const { email, password, first_name, last_name, phone_number, role } = req.body;

        if (!email || !password || !first_name || !last_name) {
            return res.status(400).json({
                message: 'email, password, first_name, and last_name are required',
            });
        }
        if (!isValidEmail(email)) {
            return res.status(400).json({ message: 'Invalid email' });
        }
        if (role !== undefined && role !== null && String(role).trim() !== '') {
            const allowed = ['CUSTOMER', 'SELLER'];
            if (!allowed.includes(String(role).toUpperCase())) {
                return res.status(400).json({ message: 'role must be CUSTOMER or SELLER' });
            }
        }

        const result = await authService.register(
            email,
            password,
            first_name,
            last_name,
            phone_number || null,
            role
        );

        return res.status(201).json({
            message: 'User created successfully',
            user: result.user,
            session: result.session,
            ...(result.seller && { seller: result.seller }),
        });
    } catch (error) {
        if (error.statusCode === 400) {
            return res.status(400).json({ message: error.message });
        }
        if (error.code === '23505') {
            return res.status(409).json({ message: 'Email already registered' });
        }

        console.error('Register error:', error.message);
        return res.status(500).json({ message: 'Failed to register user' });
    }
};

const login = async (req, res) => {
    try {
        const { email, password } = req.body;

        if (!email || !password) {
            return res.status(400).json({ message: 'Email and password are required' });
        }
        if (!isValidEmail(email)) {
            return res.status(400).json({ message: 'Invalid email' });
        }

        const { user, session } = await authService.login(email, password);

        return res.status(200).json({
            message: 'Login successful',
            user,
            session,
        });
    } catch (error) {
        if (error.statusCode === 401) {
            return res.status(401).json({ message: error.message });
        }

        console.error('Login error:', error.message);
        return res.status(500).json({ message: 'Failed to login' });
    }
};

const forgetPassword = async (req, res) => {
    try {
        const { email } = req.body;
        if (!email) {
            return res.status(400).json({ message: 'Email is required' });
        }
        if (!isValidEmail(email)) {
            return res.status(400).json({ message: 'Invalid email' });
        }

        const { user } = await authService.getUserByEmail(email);
        if (!user) {
            return res.status(404).json({ message: 'User not found' });
        }

        const { code_verifier, expires_at } = await authService.createCodeVerifier(email);
        const mail = buildEmail('forgetPassword', {
            code_verifier,
            expires_at,
            first_name: user.first_name,
        });

        await mailer.sendMail({
            to: email,
            subject: mail.subject,
            text: mail.text,
            html: mail.html,
        });

        return res.status(200).json({ message: 'Reset code sent to email successfully' });
    } catch (error) {
        if (error.statusCode === 400 || error.statusCode === 404) {
            return res.status(error.statusCode).json({ message: error.message });
        }

        console.error('Forget password error:', error.message);
        return res.status(500).json({ message: 'Failed to forget password' });
    }
};

const resetPassword = async (req, res) => {
    try {
        const { email, code_verifier, new_password } = req.body;

        if (!email || !code_verifier || !new_password) {
            return res.status(400).json({
                message: 'email, code_verifier, and new_password are required',
            });
        }
        if (!isValidEmail(email)) {
            return res.status(400).json({ message: 'Invalid email' });
        }
        if (String(new_password).length < MIN_PASSWORD_LENGTH) {
            return res.status(400).json({
                message: `new_password must be at least ${MIN_PASSWORD_LENGTH} characters`,
            });
        }

        const { user } = await authService.resetPassword(email, code_verifier, new_password);

        return res.status(200).json({
            message: 'Password reset successfully',
            user,
        });
    } catch (error) {
        if (error.statusCode === 400 || error.statusCode === 404) {
            return res.status(error.statusCode).json({ message: error.message });
        }

        console.error('Reset password error:', error.message);
        return res.status(500).json({ message: 'Failed to reset password' });
    }
};

const logout = async (req, res) => {
    try {
        const session_id = req.headers['x-session-id'];
        if (!session_id) {
            return res.status(400).json({ message: 'Session ID is required (x-session-id header)' });
        }

        const result = await authService.logout(session_id);
        return res.status(200).json(result);
    } catch (error) {
        if (error.statusCode === 404) {
            return res.status(404).json({ message: error.message });
        }

        console.error('Logout error:', error.message);
        return res.status(500).json({ message: 'Failed to logout' });
    }
};

// Marks code as verified (required before change-password / reset-password).
// Logged-in: email from session. Not logged-in (forget flow): email from body.
const verifyCode = async (req, res) => {
    try {
        const { code_verifier, email: bodyEmail } = req.body || {};
        let email;

        if (req.user) {
            email = req.user.email;
        } else if (bodyEmail) {
            if (!isValidEmail(bodyEmail)) {
                return res.status(400).json({ message: 'Invalid email' });
            }
            email = bodyEmail;
        } else {
            return res.status(400).json({
                message: 'Email is required when not logged in (or send x-session-id)',
            });
        }

        if (!code_verifier) {
            return res.status(400).json({ message: 'Code verifier is required' });
        }

        const result = await authService.verifyCode(email, code_verifier);
        return res.status(200).json(result);
    } catch (error) {
        if (error.statusCode === 400 || error.statusCode === 404) {
            return res.status(error.statusCode).json({ message: error.message });
        }

        console.error('Verify code error:', error.message);
        return res.status(500).json({ message: 'Failed to verify code' });
    }
};

/** Any logged-in role: send change-password code to session user's email only. */
const requestChangePassword = async (req, res) => {
    try {
        const user = req.user;
        if (!user) {
            return res.status(401).json({ message: 'Unauthorized' });
        }

        const { code_verifier, expires_at } = await authService.createCodeVerifier(user.email);
        const mail = buildEmail('changePassword', {
            code_verifier,
            expires_at,
            first_name: user.first_name,
        });

        await mailer.sendMail({
            to: user.email,
            subject: mail.subject,
            text: mail.text,
            html: mail.html,
        });

        return res.status(200).json({
            message: 'Change password code sent to your email successfully',
        });
    } catch (error) {
        if (error.statusCode === 400 || error.statusCode === 404) {
            return res.status(error.statusCode).json({ message: error.message });
        }

        console.error('Request change password error:', error.message);
        return res.status(500).json({ message: 'Failed to send change password code' });
    }
};

/**
 * Any logged-in role: apply new password with verified code.
 * Email always from session (never from body). Invalidates all sessions.
 */
const changePassword = async (req, res) => {
    try {
        const user = req.user;
        if (!user) {
            return res.status(401).json({ message: 'Unauthorized' });
        }

        const { code_verifier, new_password, confirm_password } = req.body;

        if (!code_verifier || !new_password) {
            return res.status(400).json({
                message: 'code_verifier and new_password are required',
            });
        }
        if (confirm_password !== undefined && confirm_password !== new_password) {
            return res.status(400).json({ message: 'new_password and confirm_password do not match' });
        }
        if (String(new_password).length < MIN_PASSWORD_LENGTH) {
            return res.status(400).json({
                message: `new_password must be at least ${MIN_PASSWORD_LENGTH} characters`,
            });
        }

        const { user: updatedUser } = await authService.changePassword(
            user.email,
            code_verifier,
            new_password
        );

        try {
            const mail = buildEmail('passwordChanged', { first_name: updatedUser.first_name });
            await mailer.sendMail({
                to: updatedUser.email,
                subject: mail.subject,
                text: mail.text,
                html: mail.html,
            });
        } catch (mailError) {
            console.error('Password-changed notification email failed:', mailError.message);
        }

        return res.status(200).json({
            message: 'Password changed successfully. Please log in again.',
            user: updatedUser,
        });
    } catch (error) {
        if (error.statusCode === 400 || error.statusCode === 404) {
            return res.status(error.statusCode).json({ message: error.message });
        }

        console.error('Change password error:', error.message);
        return res.status(500).json({ message: 'Failed to change password' });
    }
};

module.exports = {
    register,
    login,
    forgetPassword,
    resetPassword,
    logout,
    verifyCode,
    requestChangePassword,
    changePassword,
};
