const pool = require('../../Database/connection');

const updateAdminProfile = async (user_id, first_name, last_name, phone_number) => {
    const query = `
        UPDATE users
        SET first_name = $1, last_name = $2, phone_number = $3
        WHERE user_id = $4
          AND role = 'ADMIN'
        RETURNING user_id, first_name, last_name, email, phone_number, role
    `;
    const result = await pool.query(query, [first_name, last_name, phone_number, user_id]);
    return result.rows[0];
};

module.exports = {
    updateAdminProfile,
};
