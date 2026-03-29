-- ============================================
-- Golden Schema Bundle: app_schema_full.sql
-- ============================================
--
-- This file contains all app database migrations
-- concatenated in order for fast database provisioning.
--
-- Generated: 2025-11-30T11:23:21-05:00
-- Source: migrations from archive/ and app/ directories
--
-- Usage:
--   1. CREATE DATABASE new_db;
--   2. psql -d new_db -f bundle/app_schema_full.sql
--   3. Run migrations to catch up if bundle is behind HEAD
--
-- Checksum: e7db66e9a4d323a53374c8de6ffe6de1df4947f3f890cfc13713c0f8eb4ea9f3
--
-- Migrations included:
--   - 010_app_template.sql (archive)
--   - 011_rls.sql (archive)
--   - 012_email_ci.sql (archive)
--   - 015_public_code_app.sql (archive)
--   - 022_notification_templates.sql (archive)
--   - 026_event_log.sql (archive)
--   - 027_default_notify_template.sql (archive)
--   - test_table.sql (app)
-- ============================================


-- ============================================
-- Migration: 010_app_template.sql (archive)
-- ============================================

-- 010_app_template.sql
-- App schema template (applied to public sandbox or per-tenant schema)

CREATE EXTENSION IF NOT EXISTS pgcrypto;
CREATE EXTENSION IF NOT EXISTS citext;

CREATE TABLE IF NOT EXISTS contacts (
  id           uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  tenant_id    BIGINT NOT NULL,
  name         text NOT NULL,
  email        text,
  phone        text,
  tags         text[],
  created_at   timestamptz NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_contacts_tenant ON contacts(tenant_id);
CREATE INDEX IF NOT EXISTS idx_contacts_email ON contacts(tenant_id, email);

CREATE TABLE IF NOT EXISTS users (
  id             uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  tenant_id      BIGINT NOT NULL,
  email          text NOT NULL,
  phone          text,
  password_hash  text,
  active         boolean NOT NULL DEFAULT true,
  created_at     timestamptz NOT NULL DEFAULT now()
);

CREATE UNIQUE INDEX IF NOT EXISTS ux_users_email ON users(tenant_id, email);
CREATE INDEX IF NOT EXISTS idx_users_phone ON users(tenant_id, phone);


-- ============================================
-- Migration: 011_rls.sql (archive)
-- ============================================

-- 011_rls.sql
-- Enable row level security for sandbox tables

ALTER TABLE users ENABLE ROW LEVEL SECURITY;
ALTER TABLE users FORCE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS p_users_tenant ON users;
CREATE POLICY p_users_tenant ON users
  USING (tenant_id = current_setting('app.tenant_id', true)::bigint)
  WITH CHECK (tenant_id = current_setting('app.tenant_id', true)::bigint);

ALTER TABLE contacts ENABLE ROW LEVEL SECURITY;
ALTER TABLE contacts FORCE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS p_contacts_tenant ON contacts;
CREATE POLICY p_contacts_tenant ON contacts
  USING (tenant_id = current_setting('app.tenant_id', true)::bigint)
  WITH CHECK (tenant_id = current_setting('app.tenant_id', true)::bigint);

--ALTER TABLE public_code ENABLE ROW LEVEL SECURITY;
--ALTER TABLE public_code FORCE ROW LEVEL SECURITY;
--DROP POLICY IF EXISTS p_public_code_tenant ON public_code;
--CREATE POLICY p_public_code_tenant ON public_code
--  USING (tenant_id = current_setting('app.tenant_id', true)::bigint)
--  WITH CHECK (tenant_id = current_setting('app.tenant_id', true)::bigint);


-- ============================================
-- Migration: 012_email_ci.sql (archive)
-- ============================================

-- 012_email_ci.sql
-- Convert users.email to citext and enforce case-insensitive uniqueness

CREATE EXTENSION IF NOT EXISTS citext;

ALTER TABLE users
  ALTER COLUMN email TYPE citext
  USING email::citext;

DROP INDEX IF EXISTS ux_users_email;
DROP INDEX IF EXISTS ux_users_tenant_email;
DROP INDEX IF EXISTS ux_users_tenant_email_lower;
CREATE UNIQUE INDEX IF NOT EXISTS ux_users_tenant_email_ci ON users(tenant_id, email);


-- ============================================
-- Migration: 015_public_code_app.sql (archive)
-- ============================================

-- 015_public_code_app.sql
-- Public code table in app databases (sc-app, sc-first, etc.)
-- Codes are stored in tenant's app database for data isolation
-- IMPORTANT: This migration MUST be executed in app databases (sc-app, sc-first, etc.)

CREATE TABLE IF NOT EXISTS public_code (
  code text PRIMARY KEY,
  tenant_id BIGINT NOT NULL,
  resource_id uuid,
  expires_at timestamptz,
  metadata jsonb,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_public_code_tenant ON public_code(tenant_id);
CREATE INDEX IF NOT EXISTS idx_public_code_expires ON public_code(expires_at) WHERE expires_at IS NOT NULL;
CREATE INDEX IF NOT EXISTS idx_public_code_resource ON public_code(resource_id) WHERE resource_id IS NOT NULL;

COMMENT ON TABLE public_code IS 'Public codes stored in tenant app database for data isolation';
COMMENT ON COLUMN public_code.code IS 'Public identifier (e.g., survey code)';
COMMENT ON COLUMN public_code.tenant_id IS 'Tenant that owns this code';
COMMENT ON COLUMN public_code.resource_id IS 'Optional resource identifier (e.g., survey ID)';
COMMENT ON COLUMN public_code.expires_at IS 'Optional expiration time for temporary codes';
COMMENT ON COLUMN public_code.metadata IS 'Additional metadata (JSON)';


-- ============================================
-- Migration: 022_notification_templates.sql (archive)
-- ============================================

-- 022_notification_templates.sql
-- Notification templates table for email/SMS templates with tenant-specific overrides
-- Applied to app databases (sc-app, sc-first, etc.)

CREATE TABLE IF NOT EXISTS notification_template(
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  tenant_id BIGINT NULL,              -- NULL = global template, BIGINT for compatibility
  kind text NOT NULL CHECK (kind IN ('email','sms')),
  key text NOT NULL,                  -- 'otp', 'high_risk', 'invite', etc.
  locale text NOT NULL DEFAULT 'default',
  subject text NULL,                   -- only for email
  html text NULL,                      -- email HTML body
  text text NULL,                      -- email text body & SMS
  updated_at timestamptz NOT NULL DEFAULT now(),
  UNIQUE(tenant_id, kind, key, locale)
);

CREATE INDEX IF NOT EXISTS ix_notification_template_tenant ON notification_template(tenant_id);
CREATE INDEX IF NOT EXISTS ix_notification_template_key ON notification_template(kind, key);

COMMENT ON TABLE notification_template IS 'Email/SMS notification templates with tenant-specific overrides';
COMMENT ON COLUMN notification_template.tenant_id IS 'NULL for global templates, tenant_id for tenant-specific overrides';
COMMENT ON COLUMN notification_template.kind IS 'Template type: email or sms';
COMMENT ON COLUMN notification_template.key IS 'Template key identifier (e.g., otp, high_risk, invite)';
COMMENT ON COLUMN notification_template.locale IS 'Locale code (e.g., en, ru, default)';


-- ============================================
-- Migration: 026_event_log.sql (archive)
-- ============================================

-- 026_event_log.sql
-- Event logging table for user events (auth, user actions, etc.)
-- Applied to app databases (sc-app, sc-first, etc.)

CREATE TABLE IF NOT EXISTS event_log (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  tenant_id BIGINT NOT NULL,
  user_id uuid NULL,                    -- NULL if event is not user-specific
  event_type text NOT NULL,             -- 'otp_request', 'otp_verify', 'login', 'logout', etc.
  event_data jsonb NULL,                 -- additional event data (JSON)
  ip_address inet NULL,                 -- client IP address
  user_agent text NULL,                 -- User-Agent header
  created_at timestamptz NOT NULL DEFAULT now()
);

-- Indexes for fast lookups
CREATE INDEX IF NOT EXISTS ix_event_log_tenant_created ON event_log(tenant_id, created_at DESC);
CREATE INDEX IF NOT EXISTS ix_event_log_user_created ON event_log(user_id, created_at DESC) WHERE user_id IS NOT NULL;
CREATE INDEX IF NOT EXISTS ix_event_log_type_created ON event_log(event_type, created_at DESC);
CREATE INDEX IF NOT EXISTS ix_event_log_tenant_type_created ON event_log(tenant_id, event_type, created_at DESC);

-- RLS for tenant isolation
ALTER TABLE event_log ENABLE ROW LEVEL SECURITY;
ALTER TABLE event_log FORCE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS p_event_log_tenant ON event_log;
CREATE POLICY p_event_log_tenant ON event_log
  USING (tenant_id = current_setting('app.tenant_id', true)::bigint)
  WITH CHECK (tenant_id = current_setting('app.tenant_id', true)::bigint);

COMMENT ON TABLE event_log IS 'Event log for user actions and authentication events';
COMMENT ON COLUMN event_log.user_id IS 'User ID (NULL if event is not user-specific)';
COMMENT ON COLUMN event_log.event_type IS 'Event type: otp_request, otp_verify, login, logout, user_create, etc.';
COMMENT ON COLUMN event_log.event_data IS 'Additional event data as JSON (may contain masked PII)';
COMMENT ON COLUMN event_log.ip_address IS 'Client IP address for security tracking';


-- ============================================
-- Migration: 027_default_notify_template.sql (archive)
-- ============================================


INSERT INTO notification_template
(tenant_id, kind, key, locale, subject, html, text)
VALUES
(NULL, 'email', 'otp', 'default',
 'Our OTP Code',
 '<p>Hello!</p><p>Your OTP code: <b>{{ code }}</b></p><p>Code valid for {{ ttl }} minutes.</p>',
 'Hello!\nYour OTP code: {{ code }}\nCode valid for {{ ttl }} minutes.');

 INSERT INTO notification_template
(tenant_id, kind, key, locale, subject, html, text)
VALUES
(NULL, 'sms', 'otp', 'default',
 NULL,
 NULL,
 'Your code {{ code }}, valid for {{ ttl }} minutes.');

-- ============================================
-- Migration: test_table.sql (app)
-- ============================================

-- test_table.sql
-- test table for testing migrations

CREATE TABLE IF NOT EXISTS test_table (
  id          BIGSERIAL PRIMARY KEY,
  payload     JSONB,
  created_at  TIMESTAMPTZ NOT NULL DEFAULT now()
);


-- ============================================
-- Bundle End
-- ============================================
--
-- Total migrations: 8
-- Versions: 010_app_template, 011_rls, 012_email_ci, 015_public_code_app, 022_notification_templates, 026_event_log, 027_default_notify_template, test_table
--
-- After applying this bundle, check schema_migrations table
-- and apply any additional migrations if needed.
-- ============================================
