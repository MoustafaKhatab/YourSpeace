-- One-time: add verified flag for password_reset_codes
ALTER TABLE password_reset_codes
ADD COLUMN IF NOT EXISTS verified BOOLEAN NOT NULL DEFAULT FALSE;
