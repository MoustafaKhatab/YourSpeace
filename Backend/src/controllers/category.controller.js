const categoryService = require('../services/category.service');

const MAX_NAME_LENGTH = 255;

const parseCategoryBody = (body, { partial = false } = {}) => {
    const errors = [];
    const fields = {};

    if (!partial || (body && Object.prototype.hasOwnProperty.call(body, 'name'))) {
        if (body?.name === undefined || body?.name === null || String(body.name).trim() === '') {
            if (!partial) {
                errors.push('name is required');
            }
        } else {
            const trimmedName = String(body.name).trim();
            if (trimmedName.length > MAX_NAME_LENGTH) {
                errors.push(`name must be at most ${MAX_NAME_LENGTH} characters`);
            } else {
                fields.name = trimmedName;
            }
        }
    }

    if (body && Object.prototype.hasOwnProperty.call(body, 'visible')) {
        if (typeof body.visible !== 'boolean') {
            errors.push('visible must be a boolean');
        } else {
            fields.visible = body.visible;
        }
    }

    if (body && Object.prototype.hasOwnProperty.call(body, 'metadata')) {
        if (body.metadata !== null && (typeof body.metadata !== 'object' || Array.isArray(body.metadata))) {
            errors.push('metadata must be an object');
        } else {
            fields.metadata = body.metadata;
        }
    }

    if (body && Object.prototype.hasOwnProperty.call(body, 'parent_id')) {
        if (body.parent_id === null || body.parent_id === '') {
            fields.parent_id = null;
        } else {
            const n = Number(body.parent_id);
            if (!Number.isInteger(n) || n <= 0) {
                errors.push('parent_id must be a positive integer or null');
            } else {
                fields.parent_id = n;
            }
        }
    }

    return { fields, errors };
};

const createCategory = async (req, res) => {
    try {
        if (!req.user) {
            return res.status(401).json({ message: 'Unauthorized' });
        }

        const { fields, errors } = parseCategoryBody(req.body || {}, { partial: false });
        if (errors.length) {
            return res.status(400).json({ message: errors[0] });
        }

        const category = await categoryService.createCategory(
            fields.name,
            fields.visible !== undefined ? fields.visible : true,
            fields.metadata !== undefined ? fields.metadata : null,
            fields.parent_id !== undefined ? fields.parent_id : null
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

const getCategories = async (req, res) => {
    try {
        const categories = await categoryService.getCategories();
        return res.status(200).json({ message: 'Categories retrieved successfully', categories });
    } catch (error) {
        console.error('Get categories error:', error.message);
        return res.status(500).json({ message: 'Failed to get categories' });
    }
};

const getCategory = async (req, res) => {
    try {
        const id = Number(req.params.category_id);
        if (!Number.isInteger(id) || id <= 0) {
            return res.status(400).json({ message: 'category_id must be a positive integer' });
        }

        const category = await categoryService.getCategory(id);
        return res.status(200).json({ message: 'Category retrieved successfully', category });
    } catch (error) {
        if (error.statusCode === 404) {
            return res.status(404).json({ message: error.message });
        }
        console.error('Get category error:', error.message);
        return res.status(500).json({ message: 'Failed to get category' });
    }
};

const updateCategory = async (req, res) => {
    try {
        if (!req.user) {
            return res.status(401).json({ message: 'Unauthorized' });
        }

        const id = Number(req.params.category_id);
        if (!Number.isInteger(id) || id <= 0) {
            return res.status(400).json({ message: 'category_id must be a positive integer' });
        }

        const body = req.body || {};
        if (Object.keys(body).length === 0) {
            return res.status(400).json({ message: 'At least one field is required' });
        }

        const { fields, errors } = parseCategoryBody(body, { partial: true });
        if (errors.length) {
            return res.status(400).json({ message: errors[0] });
        }
        if (Object.keys(fields).length === 0) {
            return res.status(400).json({ message: 'No valid fields to update' });
        }

        const category = await categoryService.updateCategory(id, fields);
        return res.status(200).json({ message: 'Category updated successfully', category });
    } catch (error) {
        if (error.statusCode === 400 || error.statusCode === 404 || error.statusCode === 409) {
            return res.status(error.statusCode).json({ message: error.message });
        }
        console.error('Update category error:', error.message);
        return res.status(500).json({ message: 'Failed to update category' });
    }
};

const deleteCategory = async (req, res) => {
    try {
        if (!req.user) {
            return res.status(401).json({ message: 'Unauthorized' });
        }

        const id = Number(req.params.category_id);
        if (!Number.isInteger(id) || id <= 0) {
            return res.status(400).json({ message: 'category_id must be a positive integer' });
        }

        const category = await categoryService.deleteCategory(id);
        return res.status(200).json({ message: 'Category deleted successfully', category });
    } catch (error) {
        if (error.statusCode === 404) {
            return res.status(404).json({ message: error.message });
        }
        console.error('Delete category error:', error.message);
        return res.status(500).json({ message: 'Failed to delete category' });
    }
};

module.exports = {
    createCategory,
    getCategories,
    getCategory,
    updateCategory,
    deleteCategory,
};
