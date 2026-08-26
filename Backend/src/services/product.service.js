const productRepository = require('../rep/product.repository');
const storeRepository = require('../rep/store.repository');
const categoryRepository = require('../rep/category.repository');
const { getUserStoreBySellerId } = require('./store.service');

const createProduct = async (seller_id, title, description, hidden = false, category_id = null) => {
    const store = await getUserStoreBySellerId(seller_id);

    let category = null;
    if (category_id !== null && category_id !== undefined) {
        category = await categoryRepository.getCategoryById(category_id);
        if (!category) {
            const error = new Error('Category not found');
            error.statusCode = 404;
            throw error;
        }
    }

    let product;
    try {
        product = await productRepository.createProduct(
            store.store_id,
            title,
            description,
            hidden
        );
        if (!product) {
            const error = new Error('Failed to create product');
            error.statusCode = 400;
            throw error;
        }
    } catch (error) {
        if (error.statusCode) {
            throw error;
        }
        if (error.code === '23503') {
            const notFound = new Error('Store not found');
            notFound.statusCode = 404;
            throw notFound;
        }
        throw error;
    }

    if (!category) {
        return product;
    }

    try {
        await productRepository.addProductToCategory(product.product_id, category.category_id);
        return {
            ...product,
            category_id: category.category_id,
        };
    } catch (error) {
        if (error.code === '23505') {
            return {
                ...product,
                category_id: category.category_id,
            };
        }
        if (error.code === '23503') {
            const notFound = new Error('Category not found');
            notFound.statusCode = 404;
            throw notFound;
        }
        throw error;
    }
};

const getProductByStoreName = async (store_name) => {
    const store = await storeRepository.getStoreByName(store_name);
    if (!store) {
        const error = new Error('Store not found');
        error.statusCode = 404;
        throw error;
    }

    const products = await productRepository.getProductByStoreName(store_name);
    return products;
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

    const products = await productRepository.getProductByCategory(category_id);
    return products;
};

module.exports = {
    createProduct,
    getProductByStoreName,
    getProductByCategory,
};
