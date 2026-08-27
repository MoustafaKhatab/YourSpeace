const express = require('express');
const router = express.Router();
const productController = require('../controllers/product.controller');
const sessionAuth = require('../middleware/session_auth');
const authorize = require('../middleware/authorize');
const { authorizeAny } = authorize;

// Write: SELLER or ADMIN
router.post(
    '/create-product',
    sessionAuth,
    authorizeAny('SELLER', 'ADMIN'),
    productController.createProduct
);
router.put(
    '/update-product/:product_id',
    sessionAuth,
    authorizeAny('SELLER', 'ADMIN'),
    productController.updateProduct
);

// Public reads (ids returned for client round-trips)
router.get('/get-product/:product_id', productController.getProductById);
router.get('/get-products', productController.getProducts);
router.get('/by-store/:store_name', productController.getProductByStoreName);
router.get('/by-category/:category_id', productController.getProductByCategory);

module.exports = router;
