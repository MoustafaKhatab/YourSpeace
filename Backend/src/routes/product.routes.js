const express = require('express');
const router = express.Router();
const productController = require('../controllers/product.controller');
const sessionAuth = require('../middleware/session_auth');
const authorize = require('../middleware/authorize');

router.post('/create-product', sessionAuth, authorize('SELLER'), productController.createProduct);
router.get('/by-store/:store_name', productController.getProductByStoreName);
router.get('/by-category/:category_id', productController.getProductByCategory);

module.exports = router;
