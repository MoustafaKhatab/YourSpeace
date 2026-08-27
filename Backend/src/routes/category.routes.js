const express = require('express');
const router = express.Router();
const categoryController = require('../controllers/category.controller');
const sessionAuth = require('../middleware/session_auth');
const authorize = require('../middleware/authorize');

// Management: ADMIN only
router.post('/create-category', sessionAuth, authorize('ADMIN'), categoryController.createCategory);
router.put('/update-category/:category_id', sessionAuth, authorize('ADMIN'), categoryController.updateCategory);
router.delete('/delete-category/:category_id', sessionAuth, authorize('ADMIN'), categoryController.deleteCategory);
router.get('/get-category/:category_id', sessionAuth, authorize('ADMIN'), categoryController.getCategory);

// Public catalog browse (visible only)
router.get('/get-categories', categoryController.getCategories);

module.exports = router;
