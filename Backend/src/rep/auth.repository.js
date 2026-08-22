const pool = require('../../Database/connection');

const createCustomer = async (email, hashedPassword, first_name, last_name, phone_number, role) => {
    
    const query = `
        INSERT INTO users (email, hashed_password, first_name, last_name, phone_number, role)
        VALUES ($1, $2, $3, $4, $5, $6)
        RETURNING user_id, email, first_name, last_name, phone_number, role
    `;
    const values = [email, hashedPassword, first_name, last_name, phone_number, role];
    const result = await pool.query(query, values);
    return result.rows[0];
};

const createSeller = async (email, hashedPassword, first_name, last_name, phone_number, role) => {
    const client = await pool.connect();
    try {
        await client.query('BEGIN');
        const result = await client.query(
            `
            INSERT INTO users (email, hashed_password, first_name, last_name, phone_number, role)
            VALUES ($1, $2, $3, $4, $5, $6)
            RETURNING user_id, email, first_name, last_name, phone_number, role
            `, [email, hashedPassword, first_name, last_name, phone_number, role]
        );
        const user = result.rows[0];
        if(!user) {
            const error = new Error('User not created');
            error.statusCode = 400;
            throw error;
        }
        const sellerResult = await client.query(
            `
            INSERT INTO sellers (user_id)
            VALUES ($1)
            RETURNING seller_id
            `, [user.user_id]
        );
        const seller = sellerResult.rows[0];
        if(!seller) {
            const error = new Error('Seller not created');
            error.statusCode = 400;
            throw error;
        }
        await client.query('COMMIT');
        return { user, seller };
    } catch (error) {
        await client.query('ROLLBACK');
        throw error;
    } finally {
        client.release();
    }
};

const getUserByEmail = async (email) => {
    const query = `
        SELECT user_id, email, hashed_password, first_name, last_name, phone_number, role
        FROM users
        WHERE email = $1
    `;
    const values = [email];
    const result = await pool.query(query, values);
    return result.rows[0];
};

const getUserById = async (user_id, role = null) => {
    if (role === 'SELLER') {
        const query = `
            SELECT
                u.user_id,
                u.email,
                u.first_name,
                u.last_name,
                u.phone_number,
                u.role,
                s.seller_id,
                s.created_at AS seller_created_at,
                s.updated_at AS seller_updated_at
            FROM users u
            INNER JOIN sellers s ON s.user_id = u.user_id
            WHERE u.user_id = $1
              AND u.role = 'SELLER'
        `;
        const result = await pool.query(query, [user_id]);
        return result.rows[0];
    }

    const query = `
        SELECT user_id, email, first_name, last_name, phone_number, role
        FROM users
        WHERE user_id = $1
    `;
    const values = [user_id];
    const result = await pool.query(query, values);
    return result.rows[0];
};

const getUserBySessionId = async (session_id) => {
    const query = `
        SELECT
            u.user_id,
            u.email,
            u.first_name,
            u.last_name,
            u.phone_number,
            u.role
        FROM sessions s
        INNER JOIN users u ON u.user_id = s.user_id
        WHERE s.session_id = $1
          AND s.expires_at > NOW()
    `;
    const values = [session_id];
    const result = await pool.query(query, values);
    return result.rows[0];
};

const getSessionBySessionId = async (session_id) => {
    const query = `
        SELECT id, user_id, session_id, expires_at, created_at, updated_at
        FROM sessions
        WHERE session_id = $1
    `;
    const values = [session_id];
    const result = await pool.query(query, values);
    return result.rows[0];
};

const createSession = async (user_id, session_id, expires_at) => {
    const query = `
        INSERT INTO sessions (user_id, session_id, expires_at)
        VALUES ($1, $2, $3)
        RETURNING id, user_id, session_id, expires_at, created_at, updated_at
    `;
    const values = [user_id, session_id, expires_at];
    const result = await pool.query(query, values);
    return result.rows[0];
};

const createCodeVerifier = async (email, code_verifier, expires_at) => {
    const query = `
        INSERT INTO password_reset_codes (email, code_verifier, expires_at)
        VALUES ($1, $2, $3)
        RETURNING id, email, code_verifier, used, verified, expires_at, created_at
    `;
    const values = [email, code_verifier, expires_at];
    const result = await pool.query(query, values);
    return result.rows[0];
};

/**
 * Applies new password only if the code was already verified via /auth/verify-code.
 * Does not re-run expiry validation — that belongs to verify-code only.
 */
const resetPasswordWithCode = async (email, code_verifier, hashedPassword) => {
    const client = await pool.connect();

    try {
        await client.query('BEGIN');

        const codeResult = await client.query(
            `
            SELECT id, email, code_verifier, used, verified
            FROM password_reset_codes
            WHERE email = $1
              AND code_verifier = $2
            FOR UPDATE
            `,
            [email, code_verifier]
        );

        const codeRow = codeResult.rows[0];
        if (!codeRow) {
            const error = new Error('Invalid email or code');
            error.statusCode = 400;
            throw error;
        }
        if (codeRow.used) {
            const error = new Error('Code already used');
            error.statusCode = 400;
            throw error;
        }
        if (!codeRow.verified) {
            const error = new Error('Code not verified. Call /api/auth/verify-code first');
            error.statusCode = 400;
            throw error;
        }

        const userResult = await client.query(
            `
            UPDATE users
            SET hashed_password = $1
            WHERE email = $2
            RETURNING user_id, email, first_name, last_name, phone_number, role
            `,
            [hashedPassword, email]
        );

        const user = userResult.rows[0];
        if (!user) {
            const error = new Error('User not found');
            error.statusCode = 404;
            throw error;
        }

        await client.query(`DELETE FROM sessions WHERE user_id = $1`, [user.user_id]);

        await client.query(
            `
            UPDATE password_reset_codes
            SET used = TRUE
            WHERE id = $1
            `,
            [codeRow.id]
        );

        await client.query('COMMIT');
        return user;
    } catch (error) {
        await client.query('ROLLBACK');
        throw error;
    } finally {
        client.release();
    }
};

/**
 * Only place that validates expiry/used. Marks code as verified for the next password step.
 */
const VerifierByEmailAndCodeVerifier = async (email, code_verifier) => {
    const client = await pool.connect();

    try {
        await client.query('BEGIN');

        const result = await client.query(
            `
            SELECT id, email, code_verifier, used, verified, expires_at, created_at
            FROM password_reset_codes
            WHERE email = $1 AND code_verifier = $2
            FOR UPDATE
            `,
            [email, code_verifier]
        );
        const codeRow = result.rows[0];

        if (!codeRow) {
            const error = new Error('Invalid email or code');
            error.statusCode = 400;
            throw error;
        }
        if (codeRow.used) {
            const error = new Error('Code already used');
            error.statusCode = 400;
            throw error;
        }
        if (new Date(codeRow.expires_at) <= new Date()) {
            const error = new Error('Code expired');
            error.statusCode = 400;
            throw error;
        }

        const updated = await client.query(
            `
            UPDATE password_reset_codes
            SET verified = TRUE
            WHERE id = $1
            RETURNING id, email, code_verifier, used, verified, expires_at, created_at
            `,
            [codeRow.id]
        );

        await client.query('COMMIT');
        return updated.rows[0];
    } catch (error) {
        await client.query('ROLLBACK');
        throw error;
    } finally {
        client.release();
    }
};

const deleteSessionBySessionId = async (session_id) => {
    const query = `
        DELETE FROM sessions
        WHERE session_id = $1
        RETURNING id, user_id, session_id
    `;
    const result = await pool.query(query, [session_id]);
    return result.rows[0];
};

module.exports = {
    createSeller,
    createCustomer,
    getUserByEmail,
    getUserById,
    getUserBySessionId,
    getSessionBySessionId,
    createSession,
    createCodeVerifier,
    resetPasswordWithCode,
    deleteSessionBySessionId,
    VerifierByEmailAndCodeVerifier,
};
