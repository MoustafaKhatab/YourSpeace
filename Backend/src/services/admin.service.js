const bcrypt = require('bcrypt');
const authRepository = require('../rep/auth.repository');
const adminRepository = require('../rep/admin.repository');
const { createSession } = require('./auth.service');

const toSafeUser = (user) => {
    const { hashed_password, ...safeUser } = user;
    return safeUser;
};

/**
 * Create admin account (user + admins row).
 * First admin: open (bootstrap). Later: only an existing ADMIN may call this (enforced in controller).
 */
const createAdmin = async (email, password, first_name, last_name, phone_number) => {
    const hashedPassword = await bcrypt.hash(password, 10);

    let result;
    try {
        result = await authRepository.createAdmin(
            email,
            hashedPassword,
            first_name,
            last_name,
            phone_number
        );
    } catch (error) {
        if (error.code === '23505') {
            const conflict = new Error('Email already registered');
            conflict.statusCode = 409;
            throw conflict;
        }
        throw error;
    }

    if (!result?.user || !result?.admin) {
        const error = new Error('Failed to create admin');
        error.statusCode = 400;
        throw error;
    }

    const session = await createSession(result.user.user_id);
    return {
        user: toSafeUser(result.user),
        admin: result.admin,
        session,
    };
};

const countAdmins = async () => authRepository.countAdmins();

const getAdminProfile = async (user_id) => {
    const row = await authRepository.getUserById(user_id, 'ADMIN');
    if (!row) {
        const error = new Error('Admin profile not found');
        error.statusCode = 404;
        throw error;
    }

    return {
        user: {
            user_id: row.user_id,
            email: row.email,
            first_name: row.first_name,
            last_name: row.last_name,
            phone_number: row.phone_number,
            role: row.role,
        },
        admin: {
            admin_id: row.admin_id,
            created_at: row.admin_created_at,
            updated_at: row.admin_updated_at,
        },
    };
};

const updateAdmin = async (user_id, first_name, last_name, phone_number) => {
    const admin = await adminRepository.updateAdminProfile(
        user_id,
        first_name,
        last_name,
        phone_number
    );
    if (!admin) {
        const error = new Error('Admin profile not found');
        error.statusCode = 404;
        throw error;
    }
    return admin;
};

module.exports = {
    createAdmin,
    countAdmins,
    getAdminProfile,
    updateAdmin,
};
