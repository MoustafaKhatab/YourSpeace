const pool = require('../../Database/connection');

const createCategory = async (parent_id, name, visible, metadata) => {
    const query = `
        INSERT INTO categories (parent_id, name, visible, metadata)
        VALUES ($1, $2, $3, $4)
        RETURNING category_id, parent_id, name, visible, metadata, created_at, updated_at
    `;
    const result = await pool.query(query, [parent_id, name, visible, metadata]);
    return result.rows[0];
};

const getCategoryById = async (category_id) => {
    const query = `
        SELECT category_id, parent_id, name, visible, metadata, created_at, updated_at
        FROM categories
        WHERE category_id = $1
    `;
    const result = await pool.query(query, [category_id]);
    return result.rows[0];
};

/** Find sibling with same name (case-insensitive). parent_id null = root level. */
const getCategoryByParentAndName = async (parent_id, name) => {
    const query = `
        SELECT category_id, parent_id, name, visible, metadata, created_at, updated_at
        FROM categories
        WHERE COALESCE(parent_id, 0) = COALESCE($1, 0)
          AND LOWER(name) = LOWER($2)
    `;
    const result = await pool.query(query, [parent_id, name]);
    return result.rows[0];
};

module.exports = {
    createCategory,
    getCategoryById,
    getCategoryByParentAndName,
};
