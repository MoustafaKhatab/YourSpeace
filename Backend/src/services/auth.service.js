const authRepository = require('../rep/auth.repository');
const bcrypt = require('bcrypt');
const { v4: uuidv4 } = require('uuid');

const toSafeUser = (user) => {
    const { hashed_password, ...safeUser } = user;
    return safeUser;
};

const register = async (email, password, first_name, last_name, phone_number) => {
    const hashedPassword = await bcrypt.hash(password, 10);
    const user = await authRepository.createUser(
        email,
        hashedPassword,
        first_name,
        last_name,
        phone_number,
        'CUSTOMER'
    );
    const session = await createSession(user.user_id);
    return { user, session };
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
    const hashedPassword = await bcrypt.hash(newPassword, 10);
    const user = await authRepository.resetPasswordWithCode(email, code_verifier, hashedPassword);
    if (!user) {
        const error = new Error('User not found');
        error.statusCode = 404;
        throw error;
    }

    return { user };
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
    getUserByEmail,
    createCodeVerifier,
    resetPassword,
    logout,
};
