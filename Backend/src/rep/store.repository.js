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

const getStoreById = async (store_id) => {
    const query = `
        SELECT store_id, seller_id, name, description, logo_url, created_at, updated_at
        FROM stores
        WHERE store_id = $1
    `;
    const result = await pool.query(query, [store_id]);
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

const updateStore = async (seller_id, name, description, logo_url) => {
    const query = `
        UPDATE stores
        SET name = COALESCE($1, name),
            description = COALESCE($2, description),
            logo_url = COALESCE($3, logo_url),
            updated_at = NOW()
        WHERE seller_id = $4
        RETURNING store_id, seller_id, name, description, logo_url, created_at, updated_at
    `;
    const result = await pool.query(query, [name, description, logo_url, seller_id]);
    return result.rows[0];
};

module.exports = {
    getStoreByName,
    getStoreBySellerId,
    getStoreById,
    createStore,
    updateStore
};
