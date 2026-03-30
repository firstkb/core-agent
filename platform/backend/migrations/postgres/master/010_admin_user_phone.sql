ALTER TABLE admin_user
  ADD COLUMN IF NOT EXISTS phone text;

CREATE UNIQUE INDEX IF NOT EXISTS ux_admin_user_phone
  ON admin_user(phone)
  WHERE phone IS NOT NULL;
