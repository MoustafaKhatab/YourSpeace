const pool = require('../../Database/connection');

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

/** Variants for a product: [{ variant_id, color, size, stock, price }, ...] */
const variantsJsonAgg = `
    COALESCE(
        (
            SELECT json_agg(
                json_build_object(
                    'variant_id', v.variant_id,
                    'color', v.color,
                    'size', v.size,
                    'stock', v.stock,
                    'price', v.price
                )
                ORDER BY v.variant_id
            )
            FROM product_variants v
            WHERE v.product_id = p.product_id
        ),
        '[]'::json
    ) AS variants
`;

const productSelectFields = `
    p.product_id,
    p.store_id,
    p.title,
    p.description,
    p.hidden,
    p.created_at,
    p.updated_at,
    ${categoryJsonAgg},
    ${variantsJsonAgg}
`;

const insertVariants = async (client, product_id, variants) => {
    const inserted = [];
    for (const variant of variants) {
        const result = await client.query(
            `
            INSERT INTO product_variants (product_id, color, size, stock, price)
            VALUES ($1, $2, $3, $4, $5)
            RETURNING variant_id, product_id, color, size, stock, price, created_at, updated_at
            `,
            [
                product_id,
                variant.color,
                variant.size,
                variant.stock,
                variant.price,
            ]
        );
        inserted.push(result.rows[0]);
    }
    return inserted;
};

/**
 * Insert product + optional category + required variants in one transaction.
 */
const createProductWithDetails = async (
    store_id,
    title,
    description,
    hidden,
    category_id,
    variants
) => {
    const client = await pool.connect();
    try {
        await client.query('BEGIN');

        const productResult = await client.query(
            `
            INSERT INTO products (store_id, title, description, hidden)
            VALUES ($1, $2, $3, $4)
            RETURNING product_id, store_id, title, description, hidden, created_at, updated_at
            `,
            [store_id, title, description, hidden]
        );
        const product = productResult.rows[0];
        if (!product) {
            const error = new Error('Failed to create product');
            error.statusCode = 400;
            throw error;
        }

        let category = null;
        if (category_id !== null && category_id !== undefined) {
            const catResult = await client.query(
                `
                SELECT category_id, name
                FROM categories
                WHERE category_id = $1
                `,
                [category_id]
            );
            category = catResult.rows[0];
            if (!category) {
                const error = new Error('Category not found');
                error.statusCode = 404;
                throw error;
            }

            await client.query(
                `
                INSERT INTO product_categories (product_id, category_id)
                VALUES ($1, $2)
                `,
                [product.product_id, category.category_id]
            );
        }

        const savedVariants = await insertVariants(client, product.product_id, variants);
        if (!savedVariants.length) {
            const error = new Error('At least one product variant is required');
            error.statusCode = 400;
            throw error;
        }

        await client.query('COMMIT');

        return {
            ...product,
            categories: category
                ? [{ category_id: category.category_id, name: category.name }]
                : [],
            ...(category && {
                category_id: category.category_id,
                category_name: category.name,
            }),
            variants: savedVariants,
        };
    } catch (error) {
        await client.query('ROLLBACK');
        throw error;
    } finally {
        client.release();
    }
};

/**
 * Update product; optional category change; optional variants replace.
 * variantsChange: undefined = keep existing (must already have ≥1);
 *                 array = replace all (must be non-empty).
 */
const updateProductWithDetails = async (product_id, fields, categoryChange, variantsChange) => {
    const client = await pool.connect();
    try {
        await client.query('BEGIN');

        const existingResult = await client.query(
            `
            SELECT product_id, store_id, title, description, hidden, created_at, updated_at
            FROM products
            WHERE product_id = $1
            FOR UPDATE
            `,
            [product_id]
        );
        const existing = existingResult.rows[0];
        if (!existing) {
            const error = new Error('Product not found');
            error.statusCode = 404;
            throw error;
        }

        const title = fields.title !== undefined ? fields.title : existing.title;
        const description =
            fields.description !== undefined ? fields.description : existing.description;
        const hidden = fields.hidden !== undefined ? fields.hidden : existing.hidden;

        const updatedResult = await client.query(
            `
            UPDATE products
            SET title = $1,
                description = $2,
                hidden = $3,
                updated_at = NOW()
            WHERE product_id = $4
            RETURNING product_id, store_id, title, description, hidden, created_at, updated_at
            `,
            [title, description, hidden, product_id]
        );
        const product = updatedResult.rows[0];

        let category = null;
        if (categoryChange !== undefined) {
            await client.query(`DELETE FROM product_categories WHERE product_id = $1`, [
                product_id,
            ]);

            if (categoryChange !== null) {
                const catResult = await client.query(
                    `
                    SELECT category_id, name
                    FROM categories
                    WHERE category_id = $1
                    `,
                    [categoryChange]
                );
                category = catResult.rows[0];
                if (!category) {
                    const error = new Error('Category not found');
                    error.statusCode = 404;
                    throw error;
                }
                await client.query(
                    `
                    INSERT INTO product_categories (product_id, category_id)
                    VALUES ($1, $2)
                    `,
                    [product_id, category.category_id]
                );
            }
        } else {
            const catResult = await client.query(
                `
                SELECT c.category_id, c.name
                FROM product_categories pc
                INNER JOIN categories c ON c.category_id = pc.category_id
                WHERE pc.product_id = $1
                LIMIT 1
                `,
                [product_id]
            );
            category = catResult.rows[0] || null;
        }

        let savedVariants;
        if (variantsChange !== undefined) {
            if (!Array.isArray(variantsChange) || variantsChange.length === 0) {
                const error = new Error('At least one product variant is required');
                error.statusCode = 400;
                throw error;
            }
            await client.query(`DELETE FROM product_variants WHERE product_id = $1`, [product_id]);
            savedVariants = await insertVariants(client, product_id, variantsChange);
        } else {
            const existingVariants = await client.query(
                `
                SELECT variant_id, product_id, color, size, stock, price, created_at, updated_at
                FROM product_variants
                WHERE product_id = $1
                ORDER BY variant_id
                `,
                [product_id]
            );
            if (!existingVariants.rows.length) {
                const error = new Error(
                    'Product has no variants; send variants array to add at least one'
                );
                error.statusCode = 400;
                throw error;
            }
            savedVariants = existingVariants.rows;
        }

        await client.query('COMMIT');

        return {
            ...product,
            categories: category
                ? [{ category_id: category.category_id, name: category.name }]
                : [],
            ...(category && {
                category_id: category.category_id,
                category_name: category.name,
            }),
            variants: savedVariants,
        };
    } catch (error) {
        await client.query('ROLLBACK');
        throw error;
    } finally {
        client.release();
    }
};

const getProductById = async (product_id) => {
    const query = `
        SELECT
            ${productSelectFields}
        FROM products p
        WHERE p.product_id = $1
    `;
    const result = await pool.query(query, [product_id]);
    return result.rows[0];
};

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
            ${categoryJsonAgg},
            ${variantsJsonAgg}
        FROM products p
        INNER JOIN stores s ON s.store_id = p.store_id
        WHERE p.hidden = FALSE
        ORDER BY p.created_at DESC
        LIMIT $1 OFFSET $2
    `;
    const result = await pool.query(query, [limit, offset]);
    return result.rows;
};

const getProductByStoreName = async (store_name) => {
    const query = `
        SELECT
            ${productSelectFields}
        FROM products p
        INNER JOIN stores s ON s.store_id = p.store_id
        WHERE LOWER(s.name) = LOWER($1)
          AND p.hidden = FALSE
        ORDER BY p.created_at DESC
    `;
    const result = await pool.query(query, [store_name]);
    return result.rows;
};

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
            ${productSelectFields}
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

module.exports = {
    createProductWithDetails,
    updateProductWithDetails,
    getProductById,
    getProducts,
    getProductByStoreName,
    getProductByCategory,
};
