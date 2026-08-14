-- One-time helper (like set_password.sql).
-- Use only if an old DB still has users.role as VARCHAR.
-- Fresh installs get user_role from schema.sql already.

ALTER TABLE users
    ALTER COLUMN role DROP DEFAULT,
    ALTER COLUMN role TYPE user_role USING role::user_role,
    ALTER COLUMN role SET DEFAULT 'CUSTOMER'::user_role;
