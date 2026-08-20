const pool = require('../../Database/connection');

const updateCustomer = async (user_id, first_name, last_name, phone_number) => {
    const query = `
        UPDATE users
        SET first_name = $1, last_name = $2, phone_number = $3
        WHERE user_id = $4
        RETURNING user_id, first_name, last_name, email, phone_number
    `;
    const values = [first_name, last_name, phone_number, user_id];
    const result = await pool.query(query, values);
    return result.rows[0];
};

module.exports = {
    updateCustomer,
};
