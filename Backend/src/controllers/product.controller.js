const productService = require('../services/product.service');

const MAX_TITLE_LENGTH = 255;
const MAX_DESCRIPTION_LENGTH = 5000;

const parsePositiveInt = (value, fieldName) => {
    const n = Number(value);
    if (!Number.isInteger(n) || n <= 0) {
        const error = new Error(`${fieldName} must be a positive integer`);
        error.statusCode = 400;
        throw error;
    }
    return n;
};

const parseCreateOrUpdateBody = (body, { partial = false } = {}) => {
    const fields = {};
    const errors = [];

    if (!partial || (body && Object.prototype.hasOwnProperty.call(body, 'title'))) {
        if (body?.title === undefined || body?.title === null || String(body.title).trim() === '') {
            if (!partial) {
                errors.push('title is required');
            }
        } else {
            const trimmedTitle = String(body.title).trim();
            if (trimmedTitle.length > MAX_TITLE_LENGTH) {
                errors.push(`title must be at most ${MAX_TITLE_LENGTH} characters`);
            } else {
                fields.title = trimmedTitle;
            }
        }
    }

    if (body && Object.prototype.hasOwnProperty.call(body, 'description')) {
        if (body.description === null || String(body.description).trim() === '') {
            fields.description = null;
        } else {
            const trimmedDescription = String(body.description).trim();
            if (trimmedDescription.length > MAX_DESCRIPTION_LENGTH) {
                errors.push(`description must be at most ${MAX_DESCRIPTION_LENGTH} characters`);
            } else {
                fields.description = trimmedDescription;
            }
        }
    } else if (!partial) {
        fields.description = null;
    }

    if (body && Object.prototype.hasOwnProperty.call(body, 'hidden')) {
        if (typeof body.hidden !== 'boolean') {
            errors.push('hidden must be a boolean');
        } else {
            fields.hidden = body.hidden;
        }
    } else if (!partial) {
        fields.hidden = false;
    }

    if (body && Object.prototype.hasOwnProperty.call(body, 'category_id')) {
        if (body.category_id === null || body.category_id === '') {
            fields.category_id = null;
        } else {
            const n = Number(body.category_id);
            if (!Number.isInteger(n) || n <= 0) {
                errors.push('category_id must be a positive integer or null');
            } else {
                fields.category_id = n;
            }
        }
    }

    if (body && Object.prototype.hasOwnProperty.call(body, 'store_id')) {
        const n = Number(body.store_id);
        if (!Number.isInteger(n) || n <= 0) {
            errors.push('store_id must be a positive integer');
        } else {
            fields.store_id = n;
        }
    }

    return { fields, errors };
};

const createProduct = async (req, res) => {
    try {
        const user = req.user;
        if (!user) {
            return res.status(401).json({ message: 'Unauthorized' });
        }

        const { fields, errors } = parseCreateOrUpdateBody(req.body || {}, { partial: false });
        if (errors.length) {
            return res.status(400).json({ message: errors[0] });
        }

        const product = await productService.createProduct(
            { role: user.role, seller_id: user.seller_id, admin_id: user.admin_id },
            fields
        );

        return res.status(201).json({ message: 'Product created successfully', product });
    } catch (error) {
        if (
            error.statusCode === 400 ||
            error.statusCode === 403 ||
            error.statusCode === 404 ||
            error.statusCode === 409
        ) {
            return res.status(error.statusCode).json({ message: error.message });
        }

        console.error('Create product error:', error.message);
        return res.status(500).json({ message: 'Failed to create product' });
    }
};

const updateProduct = async (req, res) => {
    try {
        const user = req.user;
        if (!user) {
            return res.status(401).json({ message: 'Unauthorized' });
        }

        let productId;
        try {
            productId = parsePositiveInt(req.params.product_id, 'product_id');
        } catch (error) {
            return res.status(400).json({ message: error.message });
        }

        const body = req.body || {};
        if (Object.keys(body).length === 0) {
            return res.status(400).json({ message: 'At least one field is required' });
        }

        const { fields, errors } = parseCreateOrUpdateBody(body, { partial: true });
        if (errors.length) {
            return res.status(400).json({ message: errors[0] });
        }
        if (Object.keys(fields).length === 0) {
            return res.status(400).json({ message: 'No valid fields to update' });
        }

        // store_id is create-only for ADMIN
        delete fields.store_id;

        const product = await productService.updateProduct(
            { role: user.role, seller_id: user.seller_id, admin_id: user.admin_id },
            productId,
            fields
        );

        return res.status(200).json({ message: 'Product updated successfully', product });
    } catch (error) {
        if (
            error.statusCode === 400 ||
            error.statusCode === 403 ||
            error.statusCode === 404 ||
            error.statusCode === 409
        ) {
            return res.status(error.statusCode).json({ message: error.message });
        }

        console.error('Update product error:', error.message);
        return res.status(500).json({ message: 'Failed to update product' });
    }
};

const getProductById = async (req, res) => {
    try {
        let productId;
        try {
            productId = parsePositiveInt(req.params.product_id, 'product_id');
        } catch (error) {
            return res.status(400).json({ message: error.message });
        }

        const product = await productService.getProductById(productId);
        return res.status(200).json({ message: 'Product retrieved successfully', product });
    } catch (error) {
        if (error.statusCode === 400 || error.statusCode === 404) {
            return res.status(error.statusCode).json({ message: error.message });
        }

        console.error('Get product by id error:', error.message);
        return res.status(500).json({ message: 'Failed to get product' });
    }
};

const getProducts = async (req, res) => {
    try {
        const { limit: limitRaw, offset: offsetRaw } = req.query;

        let limit = productService.DEFAULT_FEED_LIMIT;
        if (limitRaw !== undefined && limitRaw !== null && limitRaw !== '') {
            const n = Number(limitRaw);
            if (!Number.isInteger(n) || n <= 0) {
                return res.status(400).json({ message: 'limit must be a positive integer' });
            }
            if (n > productService.MAX_FEED_LIMIT) {
                return res.status(400).json({
                    message: `limit must be at most ${productService.MAX_FEED_LIMIT}`,
                });
            }
            limit = n;
        }

        let offset = 0;
        if (offsetRaw !== undefined && offsetRaw !== null && offsetRaw !== '') {
            const n = Number(offsetRaw);
            if (!Number.isInteger(n) || n < 0) {
                return res.status(400).json({ message: 'offset must be a non-negative integer' });
            }
            offset = n;
        }

        const products = await productService.getProducts(limit, offset);
        return res.status(200).json({ message: 'Products retrieved successfully', products });
    } catch (error) {
        console.error('Get products feed error:', error.message);
        return res.status(500).json({ message: 'Failed to get products' });
    }
};

const getProductByStoreName = async (req, res) => {
    try {
        const { store_name } = req.params;

        if (!store_name || String(store_name).trim() === '') {
            return res.status(400).json({ message: 'store_name is required' });
        }

        const products = await productService.getProductByStoreName(String(store_name).trim());
        return res.status(200).json({ message: 'Products retrieved successfully', products });
    } catch (error) {
        if (error.statusCode === 400 || error.statusCode === 404) {
            return res.status(error.statusCode).json({ message: error.message });
        }

        console.error('Get products by store name error:', error.message);
        return res.status(500).json({ message: 'Failed to get products' });
    }
};

const getProductByCategory = async (req, res) => {
    try {
        const { category_id } = req.params;
        const id = Number(category_id);

        if (!Number.isInteger(id) || id <= 0) {
            return res.status(400).json({ message: 'category_id must be a positive integer' });
        }

        const products = await productService.getProductByCategory(id);
        return res.status(200).json({ message: 'Products retrieved successfully', products });
    } catch (error) {
        if (error.statusCode === 400 || error.statusCode === 404) {
            return res.status(error.statusCode).json({ message: error.message });
        }

        console.error('Get products by category error:', error.message);
        return res.status(500).json({ message: 'Failed to get products' });
    }
};

module.exports = {
    createProduct,
    updateProduct,
    getProductById,
    getProducts,
    getProductByStoreName,
    getProductByCategory,
};
