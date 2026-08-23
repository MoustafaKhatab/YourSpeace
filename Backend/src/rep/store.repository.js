const pool = require('../../Database/connection');

const getStoreByName = async (name) => {
    const query = `
        SELECT store_id, seller_id, name, description, logo_url, created_at, updated_at
        FROM stores
        WHERE LOWER(name) = LOWER($1)
    `;
    const result = await pool.query(query, [name]);
    return result.rows[0];
};

const getStoreBySellerId = async (seller_id) => {
    const query = `
        SELECT store_id, seller_id, name, description, logo_url, created_at, updated_at
        FROM stores
        WHERE seller_id = $1
    `;
    const result = await pool.query(query, [seller_id]);
    return result.rows[0];
};

const createStore = async (seller_id, name, description) => {
    const query = `
        INSERT INTO stores (seller_id, name, description)
        VALUES ($1, $2, $3)
        RETURNING store_id, seller_id, name, description, logo_url, created_at, updated_at
    `;
    const result = await pool.query(query, [seller_id, name, description]);
    return result.rows[0];
};

module.exports = {
    getStoreByName,
    getStoreBySellerId,
    createStore,
};
