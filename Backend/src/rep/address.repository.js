const pool = require('../../Database/connection');

const createAddress = async (user_id, address_line1, address_line2, city, state, country, postal_code) => {
    const query = `
        INSERT INTO addresses (user_id, address_line1, address_line2, city, state, country, postal_code)
        VALUES ($1, $2, $3, $4, $5, $6, $7)
        RETURNING address_id, user_id, address_line1, address_line2, city, state, country, postal_code
    `;
    const values = [user_id, address_line1, address_line2, city, state, country, postal_code];
    const result = await pool.query(query, values);
    return result.rows[0];
};

const getAddressByUserId = async (user_id) => {
    const query = `
        SELECT address_id, user_id, address_line1, address_line2, city, state, country, postal_code
        FROM addresses
        WHERE user_id = $1
    `;
    const values = [user_id];
    const result = await pool.query(query, values);
    return result.rows;
};

const deleteAddress = async (user_id, address_id) => {
    const query = `
        DELETE FROM addresses
        WHERE address_id = $1
          AND user_id = $2
        RETURNING address_id
    `;
    const values = [address_id, user_id];
    const result = await pool.query(query, values);
    return result.rows[0];
};

const updateAddressByAddressIdAndUserId = async (user_id, address_id, address_line1, address_line2, city, state, country, postal_code) =>{
    const query = `
    UPDATE addresses 
    SET address_line1 =$1, 
    address_line2 = $2, 
    city = $3,
    state = $4,
    country = $5,
    postal_code = $6
    WHERE address_id = $7 AND user_id = $8
    RETURNING address_id, user_id, address_line1, address_line2, city, state, country, postal_code
    `
    const values = [address_line1, address_line2, city, state, country, postal_code, address_id, user_id];
    const result = await pool.query(query, values);
    return result.rows[0];

}

module.exports = {
    createAddress,
    getAddressByUserId,
    deleteAddress,
    updateAddressByAddressIdAndUserId
};
