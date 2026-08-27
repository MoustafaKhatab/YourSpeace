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

const getCategory = async (category_id) => {
    const category = await categoryRepository.getCategoryById(category_id);
    if (!category) {
        const error = new Error('Category not found');
        error.statusCode = 404;
        throw error;
    }
    return category;
};

const updateCategory = async (category_id, fields) => {
    const existing = await categoryRepository.getCategoryById(category_id);
    if (!existing) {
        const error = new Error('Category not found');
        error.statusCode = 404;
        throw error;
    }

    const name = fields.name !== undefined ? fields.name : existing.name;
    const visible = fields.visible !== undefined ? fields.visible : existing.visible;
    const metadata = fields.metadata !== undefined ? fields.metadata : existing.metadata;
    let parent_id = existing.parent_id;
    if (fields.parent_id !== undefined) {
        parent_id = fields.parent_id;
    }

    if (parent_id !== null && parent_id !== undefined) {
        if (String(parent_id) === String(category_id)) {
            const error = new Error('Category cannot be its own parent');
            error.statusCode = 400;
            throw error;
        }
        const parent = await categoryRepository.getCategoryById(parent_id);
        if (!parent) {
            const error = new Error('Parent category not found');
            error.statusCode = 404;
            throw error;
        }
    }

    const sibling = await categoryRepository.getCategoryByParentAndName(parent_id, name);
    if (sibling && String(sibling.category_id) !== String(category_id)) {
        const error = new Error(
            parent_id
                ? 'A subcategory with this name already exists under this parent'
                : 'A category with this name already exists'
        );
        error.statusCode = 409;
        throw error;
    }

    try {
        const category = await categoryRepository.updateCategory(
            category_id,
            parent_id,
            name,
            visible,
            metadata
        );
        if (!category) {
            const error = new Error('Category not found');
            error.statusCode = 404;
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

const deleteCategory = async (category_id) => {
    const category = await categoryRepository.deleteCategory(category_id);
    if (!category) {
        const error = new Error('Category not found');
        error.statusCode = 404;
        throw error;
    }
    return category;
};

module.exports = {
    createCategory,
    getCategories,
    getCategory,
    updateCategory,
    deleteCategory,
};
