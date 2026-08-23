const storeService = require('../services/store.service');

const MAX_NAME_LENGTH = 255;
const MAX_DESCRIPTION_LENGTH = 5000;

const createStore = async (req, res) => {
    try {
        const user = req.user;
        if (!user) {
            return res.status(401).json({ message: 'Unauthorized' });
        }

        const { name, description } = req.body || {};

        if (name === undefined || name === null || String(name).trim() === '') {
            return res.status(400).json({ message: 'name is required' });
        }

        const trimmedName = String(name).trim();
        if (trimmedName.length > MAX_NAME_LENGTH) {
            return res.status(400).json({
                message: `name must be at most ${MAX_NAME_LENGTH} characters`,
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

        if (!req.seller_id) {
            return res.status(404).json({ message: 'Seller profile not found' });
        }

        const store = await storeService.createStore(req.seller_id, trimmedName, trimmedDescription);
        return res.status(201).json({ message: 'Store created successfully', store });
    } catch (error) {
        if (error.statusCode === 400 || error.statusCode === 404 || error.statusCode === 409) {
            return res.status(error.statusCode).json({ message: error.message });
        }

        console.error('Create store error:', error.message);
        return res.status(500).json({ message: 'Failed to create store' });
    }
};

module.exports = {
    createStore,
};
