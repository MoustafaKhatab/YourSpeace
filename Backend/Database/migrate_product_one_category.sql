-- One category per product (assign on create; change later via update-product)
CREATE UNIQUE INDEX IF NOT EXISTS product_categories_one_per_product
    ON product_categories (product_id);
