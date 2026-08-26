const pool = require('../../Database/connection');

const createProduct = async (store_id, title, description, hidden) => {
    const query = `
        INSERT INTO products (store_id, title, description, hidden)
        VALUES ($1, $2, $3, $4)
        RETURNING product_id, store_id, title, description, hidden, created_at, updated_at
    `;
    const result = await pool.query(query, [store_id, title, description, hidden]);
    return result.rows[0];
};

/** Public list: products for a store by store name (case-insensitive). Skips hidden products. */
const getProductByStoreName = async (store_name) => {
    const query = `
        SELECT
            p.product_id,
            p.store_id,
            p.title,
            p.description,
            p.hidden,
            p.created_at,
            p.updated_at
        FROM products p
        INNER JOIN stores s ON s.store_id = p.store_id
        WHERE LOWER(s.name) = LOWER($1)
          AND p.hidden = FALSE
        ORDER BY p.created_at DESC
    `;
    const result = await pool.query(query, [store_name]);
    return result.rows;
};

/** Public list: products linked to a category (by category_id). Skips hidden products. */
const getProductByCategory = async (category_id) => {
    const query = `
        SELECT
            p.product_id,
            p.store_id,
            p.title,
            p.description,
            p.hidden,
            p.created_at,
            p.updated_at
        FROM products p
        INNER JOIN product_categories pc ON pc.product_id = p.product_id
        WHERE pc.category_id = $1
          AND p.hidden = FALSE
        ORDER BY p.created_at DESC
    `;
    const result = await pool.query(query, [category_id]);
    return result.rows;
};

/** Assign a product to a category (product_categories join row). */
const addProductToCategory = async (product_id, category_id) => {
    const query = `
        INSERT INTO product_categories (product_id, category_id)
        VALUES ($1, $2)
        RETURNING product_id, category_id
    `;
    const result = await pool.query(query, [product_id, category_id]);
    return result.rows[0];
};

module.exports = {
    createProduct,
    getProductByStoreName,
    getProductByCategory,
    addProductToCategory,
};
