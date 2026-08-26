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

/** Categories for a product: [{ category_id, name }, ...] */
const categoryJsonAgg = `
    COALESCE(
        (
            SELECT json_agg(
                json_build_object(
                    'category_id', c.category_id,
                    'name', c.name
                )
                ORDER BY c.category_id
            )
            FROM product_categories pc
            INNER JOIN categories c ON c.category_id = pc.category_id
            WHERE pc.product_id = p.product_id
        ),
        '[]'::json
    ) AS categories
`;

/**
 * Public feed: newest visible products across all stores (main page).
 * @param {number} limit
 * @param {number} offset
 */
const getProducts = async (limit, offset) => {
    const query = `
        SELECT
            p.product_id,
            p.store_id,
            s.name AS store_name,
            p.title,
            p.description,
            p.hidden,
            p.created_at,
            p.updated_at,
            ${categoryJsonAgg}
        FROM products p
        INNER JOIN stores s ON s.store_id = p.store_id
        WHERE p.hidden = FALSE
        ORDER BY p.created_at DESC
        LIMIT $1 OFFSET $2
    `;
    const result = await pool.query(query, [limit, offset]);
    return result.rows;
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
            p.updated_at,
            ${categoryJsonAgg}
        FROM products p
        INNER JOIN stores s ON s.store_id = p.store_id
        WHERE LOWER(s.name) = LOWER($1)
          AND p.hidden = FALSE
        ORDER BY p.created_at DESC
    `;
    const result = await pool.query(query, [store_name]);
    return result.rows;
};

/**
 * Public list: products in this category or any visible descendant (recursive tree).
 * Skips hidden products.
 */
const getProductByCategory = async (category_id) => {
    const query = `
        WITH RECURSIVE category_tree AS (
            SELECT category_id
            FROM categories
            WHERE category_id = $1

            UNION ALL

            SELECT c.category_id
            FROM categories c
            INNER JOIN category_tree ct ON c.parent_id = ct.category_id
            WHERE c.visible = TRUE
        )
        SELECT
            p.product_id,
            p.store_id,
            p.title,
            p.description,
            p.hidden,
            p.created_at,
            p.updated_at,
            ${categoryJsonAgg}
        FROM products p
        WHERE p.hidden = FALSE
          AND EXISTS (
              SELECT 1
              FROM product_categories pc_filter
              INNER JOIN category_tree ct ON ct.category_id = pc_filter.category_id
              WHERE pc_filter.product_id = p.product_id
          )
        ORDER BY p.created_at DESC
    `;
    const result = await pool.query(query, [category_id]);
    return result.rows;
};

/** True if the product already has a category assigned. */
const productHasCategory = async (product_id) => {
    const query = `
        SELECT 1
        FROM product_categories
        WHERE product_id = $1
        LIMIT 1
    `;
    const result = await pool.query(query, [product_id]);
    return result.rowCount > 0;
};

/** Assign a product to a category (one category per product). */
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
    getProducts,
    getProductByStoreName,
    getProductByCategory,
    productHasCategory,
    addProductToCategory,
};
