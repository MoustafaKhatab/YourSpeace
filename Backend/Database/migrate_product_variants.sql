-- Product variants (sellable SKU: color, size, stock, price)
CREATE TABLE IF NOT EXISTS product_variants (
    variant_id BIGSERIAL PRIMARY KEY,
    product_id BIGINT NOT NULL REFERENCES products(product_id) ON DELETE CASCADE,
    color VARCHAR(100),
    size VARCHAR(100),
    stock INT NOT NULL DEFAULT 0 CHECK (stock >= 0),
    price NUMERIC(12, 2) NOT NULL CHECK (price >= 0),
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE UNIQUE INDEX IF NOT EXISTS product_variants_product_color_size_unique
    ON product_variants (product_id, COALESCE(LOWER(color), ''), COALESCE(LOWER(size), ''));
