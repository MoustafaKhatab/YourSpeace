const categoryService = require('../services/category.service');

const MAX_NAME_LENGTH = 255;

const createCategory = async (req, res) => {
    try {
        if (!req.user) {
            return res.status(401).json({ message: 'Unauthorized' });
        }

        const { name, visible, metadata, parent_id } = req.body || {};

        if (name === undefined || name === null || String(name).trim() === '') {
            return res.status(400).json({ message: 'name is required' });
        }

        const trimmedName = String(name).trim();
        if (trimmedName.length > MAX_NAME_LENGTH) {
            return res.status(400).json({
                message: `name must be at most ${MAX_NAME_LENGTH} characters`,
            });
        }

        let parsedVisible = true;
        if (visible !== undefined) {
            if (typeof visible !== 'boolean') {
                return res.status(400).json({ message: 'visible must be a boolean' });
            }
            parsedVisible = visible;
        }

        let parsedMetadata = null;
        if (metadata !== undefined && metadata !== null) {
            if (typeof metadata !== 'object' || Array.isArray(metadata)) {
                return res.status(400).json({ message: 'metadata must be an object' });
            }
            parsedMetadata = metadata;
        }

        let parsedParentId = null;
        if (parent_id !== undefined && parent_id !== null && parent_id !== '') {
            const n = Number(parent_id);
            if (!Number.isInteger(n) || n <= 0) {
                return res.status(400).json({ message: 'parent_id must be a positive integer' });
            }
            parsedParentId = n;
        }

        const category = await categoryService.createCategory(
            trimmedName,
            parsedVisible,
            parsedMetadata,
            parsedParentId
        );

        return res.status(201).json({ message: 'Category created successfully', category });
    } catch (error) {
        if (error.statusCode === 400 || error.statusCode === 404 || error.statusCode === 409) {
            return res.status(error.statusCode).json({ message: error.message });
        }

        console.error('Create category error:', error.message);
        return res.status(500).json({ message: 'Failed to create category' });
    }
};

module.exports = {
    createCategory,
};
