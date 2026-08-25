-- One-time: global categories (not store-owned). Unique name per parent (incl. roots).

ALTER TABLE categories DROP COLUMN IF EXISTS store_id;

CREATE UNIQUE INDEX IF NOT EXISTS categories_parent_name_unique
    ON categories (COALESCE(parent_id, 0), LOWER(name));
