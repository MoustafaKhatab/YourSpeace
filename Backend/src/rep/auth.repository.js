const pool = require('../../Database/connection');

const createUser = async (email, hashedPassword, first_name, last_name, phone_number, role = 'CUSTOMER') => {
    const query = `
        INSERT INTO users (email, hashed_password, first_name, last_name, phone_number, role)
        VALUES ($1, $2, $3, $4, $5, $6)
        RETURNING user_id, email, first_name, last_name, phone_number, role
    `;
    const values = [email, hashedPassword, first_name, last_name, phone_number, role];
    const result = await pool.query(query, values);
    return result.rows[0];
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
        RETURNING id, email, code_verifier, used, expires_at, created_at
    `;
    const values = [email, code_verifier, expires_at];
    const result = await pool.query(query, values);
    return result.rows[0];
};

const resetPasswordWithCode = async (email, code_verifier, hashedPassword) => {
    const client = await pool.connect();

    try {
        await client.query('BEGIN');

        const codeResult = await client.query(
            `
            SELECT id, email, code_verifier, used, expires_at
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
            const error = new Error('Reset code already used');
            error.statusCode = 400;
            throw error;
        }
        if (new Date(codeRow.expires_at) <= new Date()) {
            const error = new Error('Reset code expired');
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
    createUser,
    getUserByEmail,
    getUserBySessionId,
    createSession,
    createCodeVerifier,
    resetPasswordWithCode,
    deleteSessionBySessionId,
};
