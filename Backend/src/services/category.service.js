const categoryRepository = require('../rep/category.repository');

const createCategory = async (name, visible = true, metadata = null, parent_id = null) => {
    if (parent_id !== null && parent_id !== undefined) {
        const parent = await categoryRepository.getCategoryById(parent_id);
        if (!parent) {
            const error = new Error('Parent category not found');
            error.statusCode = 404;
            throw error;
        }
    }

    const existing = await categoryRepository.getCategoryByParentAndName(parent_id, name);
    if (existing) {
        const error = new Error(
            parent_id
                ? 'A subcategory with this name already exists under this parent'
                : 'A category with this name already exists'
        );
        error.statusCode = 409;
        throw error;
    }

    try {
        const category = await categoryRepository.createCategory(
            parent_id,
            name,
            visible,
            metadata
        );
        if (!category) {
            const error = new Error('Failed to create category');
            error.statusCode = 400;
            throw error;
        }
        return category;
    } catch (error) {
        if (error.code === '23505') {
            const conflict = new Error(
                parent_id
                    ? 'A subcategory with this name already exists under this parent'
                    : 'A category with this name already exists'
            );
            conflict.statusCode = 409;
            throw conflict;
        }
        throw error;
    }
};

const getCategories = async () => {
    return categoryRepository.getCategories();
};

module.exports = {
    createCategory,
    getCategories,
};
