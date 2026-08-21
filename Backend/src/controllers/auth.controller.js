const authService = require('../services/auth.service');
const mailer = require('../utils/mailer');


const isValidEmail = (email) => {
    return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email);
};

const register = async (req, res) => {
    try {
        const { email, password, first_name, last_name, phone_number } = req.body;

        if (!email || !password || !first_name || !last_name) {
            return res.status(400).json({
                message: 'email, password, first_name, and last_name are required',
            });
        }
        if (!isValidEmail(email)) {
            return res.status(400).json({ message: 'Invalid email' });
        }

        const { user, session } = await authService.register(
            email,
            password,
            first_name,
            last_name,
            phone_number || null
        );

        return res.status(201).json({
            message: 'User created successfully',
            user,
            session,
        });
    } catch (error) {
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

        const { user } = await authService.getUserByEmail(email);
        if (!user) {
            return res.status(404).json({ message: 'User not found' });
        }

        const { code_verifier, expires_at } = await authService.createCodeVerifier(email);
        await mailer.sendMail({
            to: email,
            subject: 'Reset Password',
            text: `Your reset password code is ${code_verifier} and it will expire in ${ new Date(expires_at).toLocaleString()} minutes`,
            html: `<p>Your reset password code is ${code_verifier} and it will expire in ${ new Date(expires_at).toLocaleString()} minutes </p>`,
        });
        console.log('Email sent successfully');
        return res.status(200).json({ message: 'code_verifier and expires_at sent to email successfully' });
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

const me = async (req, res) => {
    try {
        // Prefer user attached by sessionAuth middleware
        if (req.user) {
            return res.status(200).json({ user: req.user });
        }

        const session_id = req.headers['x-session-id'];
        if (!session_id) {
            return res.status(400).json({
                message: 'Session ID is required',
            });
        }

        const { user } = await authService.getUserBySessionId(session_id);
        return res.status(200).json({ user });
    } catch (error) {
        if (error.statusCode === 404) {
            return res.status(404).json({ message: error.message });
        }

        console.error('Me error:', error.message);
        return res.status(500).json({ message: 'Failed to get current user' });
    }
};

module.exports = {
    register,
    login,
    forgetPassword,
    resetPassword,
    logout,
    me,
};
