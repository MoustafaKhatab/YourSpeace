const storeRepository = require('../rep/store.repository');

const createStore = async (seller_id, name, description) => {
    const existingBySeller = await storeRepository.getStoreBySellerId(seller_id);
    if (existingBySeller) {
        const error = new Error('Seller already has a store');
        error.statusCode = 409;
        throw error;
    }

    const existingByName = await storeRepository.getStoreByName(name);
    if (existingByName) {
        const error = new Error('Store name already exists');
        error.statusCode = 409;
        throw error;
    }

    try {
        const newStore = await storeRepository.createStore(seller_id, name, description);
        if (!newStore) {
            const error = new Error('Failed to create store');
            error.statusCode = 400;
            throw error;
        }
        return newStore;
    } catch (error) {
        if (error.code === '23505') {
            const conflict = new Error('Store already exists for this seller or name is taken');
            conflict.statusCode = 409;
            throw conflict;
        }
        throw error;
    }
};

const getUserStoreBySellerId = async (seller_id) => {
    const store = await storeRepository.getStoreBySellerId(seller_id);
    if (!store) {
        const error = new Error('Store not found');
        error.statusCode = 404;
        throw error;
    }
    return store;
};

const updateUserStoreBySellerId = async (seller_id, name, description, logo_url) => {
    const existingStore = await storeRepository.getStoreBySellerId(seller_id);
    if (!existingStore) {
        const error = new Error('Store not found');
        error.statusCode = 404;
        throw error;
    }

    if (name !== undefined) {
        const existingByName = await storeRepository.getStoreByName(name);
        if (existingByName && String(existingByName.seller_id) !== String(seller_id)) {
            const error = new Error('Store name already exists');
            error.statusCode = 409;
            throw error;
        }
    }

    try {
        const store = await storeRepository.updateStore(seller_id, name, description, logo_url);
        if (!store) {
            const error = new Error('Store not found');
            error.statusCode = 404;
            throw error;
        }
        return store;
    } catch (error) {
        if (error.code === '23505') {
            const conflict = new Error('Store name already exists');
            conflict.statusCode = 409;
            throw conflict;
        }
        throw error;
    }
};

module.exports = {
    createStore,
    getUserStoreBySellerId,
    updateUserStoreBySellerId,
};
