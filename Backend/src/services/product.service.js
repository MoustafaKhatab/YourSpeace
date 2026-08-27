const productRepository = require('../rep/product.repository');
const storeRepository = require('../rep/store.repository');
const categoryRepository = require('../rep/category.repository');
const { getUserStoreBySellerId } = require('./store.service');

/**
 * Create product for a store. Requires variants (sellable units).
 * Product + category + variants run in one DB transaction.
 */
const createProduct = async (actor, data) => {
    let store;
    if (actor.role === 'SELLER') {
        store = await getUserStoreBySellerId(actor.seller_id);
    } else if (actor.role === 'ADMIN') {
        if (data.store_id === null || data.store_id === undefined) {
            const error = new Error('store_id is required when creating a product as ADMIN');
            error.statusCode = 400;
            throw error;
        }
        store = await storeRepository.getStoreById(data.store_id);
        if (!store) {
            const error = new Error('Store not found');
            error.statusCode = 404;
            throw error;
        }
    } else {
        const error = new Error('Forbidden');
        error.statusCode = 403;
        throw error;
    }

    if (!data.variants || !Array.isArray(data.variants) || data.variants.length === 0) {
        const error = new Error('variants is required and must contain at least one variant');
        error.statusCode = 400;
        throw error;
    }

    if (data.category_id !== null && data.category_id !== undefined) {
        const category = await categoryRepository.getCategoryById(data.category_id);
        if (!category) {
            const error = new Error('Category not found');
            error.statusCode = 404;
            throw error;
        }
    }

    try {
        return await productRepository.createProductWithDetails(
            store.store_id,
            data.title,
            data.description,
            data.hidden ?? false,
            data.category_id ?? null,
            data.variants
        );
    } catch (error) {
        if (error.statusCode) {
            throw error;
        }
        if (error.code === '23503') {
            const notFound = new Error('Store or category not found');
            notFound.statusCode = 404;
            throw notFound;
        }
        if (error.code === '23505') {
            const conflict = new Error(
                'Duplicate variant (same color/size) or product already has a category'
            );
            conflict.statusCode = 400;
            throw conflict;
        }
        throw error;
    }
};

/**
 * Update product by id. Seller: own store only. Admin: any.
 * variants: omit = keep existing (must already have ≥1); array = replace (must be non-empty).
 */
const updateProduct = async (actor, product_id, fields) => {
    const existing = await productRepository.getProductById(product_id);
    if (!existing) {
        const error = new Error('Product not found');
        error.statusCode = 404;
        throw error;
    }

    if (actor.role === 'SELLER') {
        const store = await getUserStoreBySellerId(actor.seller_id);
        if (String(existing.store_id) !== String(store.store_id)) {
            const error = new Error('Forbidden: product does not belong to your store');
            error.statusCode = 403;
            throw error;
        }
    } else if (actor.role !== 'ADMIN') {
        const error = new Error('Forbidden');
        error.statusCode = 403;
        throw error;
    }

    const categoryChange = Object.prototype.hasOwnProperty.call(fields, 'category_id')
        ? fields.category_id
        : undefined;

    if (categoryChange !== undefined && categoryChange !== null) {
        const category = await categoryRepository.getCategoryById(categoryChange);
        if (!category) {
            const error = new Error('Category not found');
            error.statusCode = 404;
            throw error;
        }
    }

    const variantsChange = Object.prototype.hasOwnProperty.call(fields, 'variants')
        ? fields.variants
        : undefined;

    if (variantsChange !== undefined) {
        if (!Array.isArray(variantsChange) || variantsChange.length === 0) {
            const error = new Error('variants must contain at least one variant');
            error.statusCode = 400;
            throw error;
        }
    }

    try {
        return await productRepository.updateProductWithDetails(
            product_id,
            {
                title: fields.title,
                description: fields.description,
                hidden: fields.hidden,
            },
            categoryChange,
            variantsChange
        );
    } catch (error) {
        if (error.statusCode) {
            throw error;
        }
        if (error.code === '23503') {
            const notFound = new Error('Category not found');
            notFound.statusCode = 404;
            throw notFound;
        }
        if (error.code === '23505') {
            const conflict = new Error(
                'Duplicate variant (same color/size) or product already has a category'
            );
            conflict.statusCode = 400;
            throw conflict;
        }
        throw error;
    }
};

const getProductById = async (product_id) => {
    const product = await productRepository.getProductById(product_id);
    if (!product || product.hidden) {
        const error = new Error('Product not found');
        error.statusCode = 404;
        throw error;
    }
    return product;
};

const DEFAULT_FEED_LIMIT = 20;
const MAX_FEED_LIMIT = 100;

const getProducts = async (limit = DEFAULT_FEED_LIMIT, offset = 0) => {
    return productRepository.getProducts(limit, offset);
};

const getProductByStoreName = async (store_name) => {
    const store = await storeRepository.getStoreByName(store_name);
    if (!store) {
        const error = new Error('Store not found');
        error.statusCode = 404;
        throw error;
    }

    return productRepository.getProductByStoreName(store_name);
};

const getProductByCategory = async (category_id) => {
    const category = await categoryRepository.getCategoryById(category_id);
    if (!category) {
        const error = new Error('Category not found');
        error.statusCode = 404;
        throw error;
    }

    if (!category.visible) {
        const error = new Error('Category not found');
        error.statusCode = 404;
        throw error;
    }

    return productRepository.getProductByCategory(category_id);
};

module.exports = {
    createProduct,
    updateProduct,
    getProductById,
    getProducts,
    getProductByStoreName,
    getProductByCategory,
    DEFAULT_FEED_LIMIT,
    MAX_FEED_LIMIT,
};
