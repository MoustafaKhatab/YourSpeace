const storeService = require('../services/store.service');

const MAX_NAME_LENGTH = 255;
const MAX_DESCRIPTION_LENGTH = 5000;
const MAX_LOGO_URL_LENGTH = 500;

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

        if (!user.seller_id) {
            return res.status(404).json({ message: 'Seller profile not found' });
        }

        const store = await storeService.createStore(user.seller_id, trimmedName, trimmedDescription);
        return res.status(201).json({ message: 'Store created successfully', store });
    } catch (error) {
        if (error.statusCode === 400 || error.statusCode === 404 || error.statusCode === 409) {
            return res.status(error.statusCode).json({ message: error.message });
        }

        console.error('Create store error:', error.message);
        return res.status(500).json({ message: 'Failed to create store' });
    }
};

const getUserStore = async (req, res) => {
    try {
        const user = req.user;
        if (!user) {
            return res.status(401).json({ message: 'Unauthorized' });
        }
        if (!user.seller_id) {
            return res.status(404).json({ message: 'Seller profile not found' });
        }

        const store = await storeService.getUserStoreBySellerId(user.seller_id);
        return res.status(200).json({ message: 'User store retrieved successfully', store });
    } catch (error) {
        if (error.statusCode === 404) {
            return res.status(404).json({ message: error.message });
        }

        console.error('Get user store error:', error.message);
        return res.status(500).json({ message: 'Failed to get user store' });
    }
};

const updateUserStore = async (req, res) => {
    try {
        const user = req.user;
        if (!user) {
            return res.status(401).json({ message: 'Unauthorized' });
        }
        if (!user.seller_id) {
            return res.status(404).json({ message: 'Seller profile not found' });
        }

        const { name, description, logo_url } = req.body || {};
        const hasName = name !== undefined;
        const hasDescription = description !== undefined;
        const hasLogoUrl = logo_url !== undefined;

        if (!hasName && !hasDescription && !hasLogoUrl) {
            return res.status(400).json({
                message: 'At least one of name, description, or logo_url is required',
            });
        }

        let trimmedName = undefined;
        if (hasName) {
            if (name === null || String(name).trim() === '') {
                return res.status(400).json({ message: 'name cannot be empty' });
            }
            trimmedName = String(name).trim();
            if (trimmedName.length > MAX_NAME_LENGTH) {
                return res.status(400).json({
                    message: `name must be at most ${MAX_NAME_LENGTH} characters`,
                });
            }
        }

        let trimmedDescription = undefined;
        if (hasDescription) {
            if (description === null || String(description).trim() === '') {
                return res.status(400).json({ message: 'description cannot be empty' });
            }
            trimmedDescription = String(description).trim();
            if (trimmedDescription.length > MAX_DESCRIPTION_LENGTH) {
                return res.status(400).json({
                    message: `description must be at most ${MAX_DESCRIPTION_LENGTH} characters`,
                });
            }
        }

        let trimmedLogoUrl = undefined;
        if (hasLogoUrl) {
            if (logo_url === null || String(logo_url).trim() === '') {
                return res.status(400).json({ message: 'logo_url cannot be empty' });
            }
            trimmedLogoUrl = String(logo_url).trim();
            if (trimmedLogoUrl.length > MAX_LOGO_URL_LENGTH) {
                return res.status(400).json({
                    message: `logo_url must be at most ${MAX_LOGO_URL_LENGTH} characters`,
                });
            }
            if (
                !trimmedLogoUrl.startsWith('https://') &&
                !trimmedLogoUrl.startsWith('http://')
            ) {
                return res.status(400).json({ message: 'logo_url must start with http:// or https://' });
            }
        }

        const store = await storeService.updateUserStoreBySellerId(
            user.seller_id,
            trimmedName,
            trimmedDescription,
            trimmedLogoUrl
        );
        return res.status(200).json({ message: 'User store updated successfully', store });
    } catch (error) {
        if (error.statusCode === 400 || error.statusCode === 404 || error.statusCode === 409) {
            return res.status(error.statusCode).json({ message: error.message });
        }

        console.error('Update user store error:', error.message);
        return res.status(500).json({ message: 'Failed to update user store' });
    }
};

module.exports = {
    createStore,
    getUserStore,
    updateUserStore,
};
