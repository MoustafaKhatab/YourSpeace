const authRepository = require('../rep/auth.repository');
const bcrypt = require('bcrypt');
const { v4: uuidv4 } = require('uuid');

const toSafeUser = (user) => {
    const { hashed_password, ...safeUser } = user;
    return safeUser;
};

const ALLOWED_REGISTER_ROLES = ['CUSTOMER', 'SELLER'];

const register = async (email, password, first_name, last_name, phone_number, role) => {
    const normalizedRole = (role || 'CUSTOMER').toUpperCase();

    if (!ALLOWED_REGISTER_ROLES.includes(normalizedRole)) {
        const error = new Error('role must be CUSTOMER or SELLER');
        error.statusCode = 400;
        throw error;
    }

    const hashedPassword = await bcrypt.hash(password, 10);

    let user;
    let seller;

    if (normalizedRole === 'SELLER') {
        const result = await authRepository.createSeller(
            email,
            hashedPassword,
            first_name,
            last_name,
            phone_number,
            normalizedRole
        );
        user = result.user;
        seller = result.seller;
    } else {
        user = await authRepository.createCustomer(
            email,
            hashedPassword,
            first_name,
            last_name,
            phone_number,
            'CUSTOMER'
        );
    }

    if (!user) {
        const error = new Error('User not created');
        error.statusCode = 400;
        throw error;
    }

    const session = await createSession(user.user_id);
    return {
        user: toSafeUser(user),
        session,
        ...(seller && { seller }),
    };
};

const login = async (email, password) => {
    const user = await authRepository.getUserByEmail(email);
    if (!user) {
        const error = new Error('Invalid email or password');
        error.statusCode = 401;
        throw error;
    }

    const isPasswordValid = await bcrypt.compare(password, user.hashed_password);
    if (!isPasswordValid) {
        const error = new Error('Invalid email or password');
        error.statusCode = 401;
        throw error;
    }

    const session = await createSession(user.user_id);
    return { user: toSafeUser(user), session };
};

const createSession = async (user_id) => {
    const session_id = uuidv4();
    const expires_at = new Date(Date.now() + 1000 * 60 * 60 * 24 * 30);
    return authRepository.createSession(user_id, session_id, expires_at);
};

const getUserBySessionId = async (session_id) => {
    const user = await authRepository.getUserBySessionId(session_id);
    if (!user) {
        const error = new Error('User with this session ID not found');
        error.statusCode = 404;
        throw error;
    }
    return { user: toSafeUser(user) };
};

const checkSessionExpiration = async (session_id) => {
    const session = await authRepository.getSessionBySessionId(session_id);
    if (!session) {
        const error = new Error('Invalid session');
        error.statusCode = 401;
        throw error;
    }

    if (new Date(session.expires_at) <= new Date()) {
        const error = new Error('Session expired');
        error.statusCode = 401;
        throw error;
    }

    return { user_id: session.user_id };
};

const getUserById = async (user_id) => {
    const user = await authRepository.getUserById(user_id);
    if (!user) {
        const error = new Error('User not found');
        error.statusCode = 404;
        throw error;
    }
    return { user: toSafeUser(user) };
};

const checkUserRole = async (user_id, requiredRole) => {
    const { user } = await getUserById(user_id);
    if (user.role !== requiredRole) {
        const error = new Error(`Forbidden: requires ${requiredRole} role`);
        error.statusCode = 403;
        throw error;
    }
    return { user };
};

const getUserByEmail = async (email) => {
    const user = await authRepository.getUserByEmail(email);
    if (!user) {
        const error = new Error('User with this email not found');
        error.statusCode = 404;
        throw error;
    }
    return { user: toSafeUser(user) };
};
const createCodeVerifier = async (email) => {
    const code_verifier = uuidv4();
    const expires_at = new Date(Date.now() + 1000 * 60 * 60 * 24);
    const code = await authRepository.createCodeVerifier(email, code_verifier, expires_at);
    return { code_verifier: code.code_verifier, expires_at: code.expires_at };
};

const resetPassword = async (email, code_verifier, newPassword) => {
    if (!newPassword || String(newPassword).length < 8) {
        const error = new Error('new_password must be at least 8 characters');
        error.statusCode = 400;
        throw error;
    }

    const hashedPassword = await bcrypt.hash(newPassword, 10);
    const user = await authRepository.resetPasswordWithCode(email, code_verifier, hashedPassword);
    if (!user) {
        const error = new Error('User not found');
        error.statusCode = 404;
        throw error;
    }

    return { user };
};

/** Logged-in change password — same secure transaction as reset; email must match session user. */
const changePassword = async (email, code_verifier, newPassword) => {
    return resetPassword(email, code_verifier, newPassword);
};

const verifyCode = async (email, code_verifier) => {
    const code = await authRepository.VerifierByEmailAndCodeVerifier(email, code_verifier);
    return {
        message: 'Code verified successfully',
        verified: code.verified,
        expires_at: code.expires_at,
    };
};

const logout = async (session_id) => {
    const user = await authRepository.getUserBySessionId(session_id);
    if (!user) {
        const error = new Error('User with this session ID not found');
        error.statusCode = 404;
        throw error;
    }

    await authRepository.deleteSessionBySessionId(session_id);
    return { message: 'Logged out successfully' };
};

module.exports = {
    register,
    login,
    getUserBySessionId,
    getUserById,
    getUserByEmail,
    checkSessionExpiration,
    checkUserRole,
    createCodeVerifier,
    resetPassword,
    changePassword,
    logout,
    verifyCode,
};
