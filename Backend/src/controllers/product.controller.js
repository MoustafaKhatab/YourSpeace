const productService = require('../services/product.service');

const MAX_TITLE_LENGTH = 255;
const MAX_DESCRIPTION_LENGTH = 5000;

const createProduct = async (req, res) => {
    try {
        const user = req.user;
        if (!user) {
            return res.status(401).json({ message: 'Unauthorized' });
        }
        if (!user.seller_id) {
            return res.status(404).json({ message: 'Seller profile not found' });
        }

        const { title, description, hidden, category_id } = req.body || {};

        if (title === undefined || title === null || String(title).trim() === '') {
            return res.status(400).json({ message: 'title is required' });
        }

        const trimmedTitle = String(title).trim();
        if (trimmedTitle.length > MAX_TITLE_LENGTH) {
            return res.status(400).json({
                message: `title must be at most ${MAX_TITLE_LENGTH} characters`,
            });
        }

        let trimmedDescription = null;
        if (description !== undefined && description !== null && String(description).trim() !== '') {
            trimmedDescription = String(description).trim();
            if (trimmedDescription.length > MAX_DESCRIPTION_LENGTH) {
                return res.status(400).json({
                    message: `description must be at most ${MAX_DESCRIPTION_LENGTH} characters`,
                });
            }
        }

        let parsedHidden = false;
        if (hidden !== undefined) {
            if (typeof hidden !== 'boolean') {
                return res.status(400).json({ message: 'hidden must be a boolean' });
            }
            parsedHidden = hidden;
        }

        let parsedCategoryId = null;
        if (category_id !== undefined && category_id !== null && category_id !== '') {
            const n = Number(category_id);
            if (!Number.isInteger(n) || n <= 0) {
                return res.status(400).json({ message: 'category_id must be a positive integer' });
            }
            parsedCategoryId = n;
        }

        const product = await productService.createProduct(
            user.seller_id,
            trimmedTitle,
            trimmedDescription,
            parsedHidden,
            parsedCategoryId
        );

        return res.status(201).json({ message: 'Product created successfully', product });
    } catch (error) {
        if (error.statusCode === 400 || error.statusCode === 404 || error.statusCode === 409) {
            return res.status(error.statusCode).json({ message: error.message });
        }

        console.error('Create product error:', error.message);
        return res.status(500).json({ message: 'Failed to create product' });
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
    getProducts,
    getProductByStoreName,
    getProductByCategory,
};
