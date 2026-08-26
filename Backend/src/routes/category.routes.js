const express = require('express');
const router = express.Router();
const categoryController = require('../controllers/category.controller');
const sessionAuth = require('../middleware/session_auth');
const authorize = require('../middleware/authorize');

router.post('/create-category', sessionAuth, authorize('SELLER'), categoryController.createCategory);
router.get('/get-categories', categoryController.getCategories);

// TODO when controllers exist:
// router.get('/get-category/:category_id', categoryController.getCategory);
// router.put('/update-category/:category_id', sessionAuth, authorize('SELLER'), categoryController.updateCategory);
// router.delete('/delete-category/:category_id', sessionAuth, authorize('SELLER'), categoryController.deleteCategory);

module.exports = router;
