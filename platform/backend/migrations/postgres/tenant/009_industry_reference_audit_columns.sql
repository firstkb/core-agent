BEGIN;

-- Correct industry reference tables to match tenant schema audit-column policy.
-- Migration 008 introduced the tables; this migration backfills existing tenant
-- DBs that already applied it and keeps fresh bundles coherent.

ALTER TABLE industry_size
  ADD COLUMN IF NOT EXISTS guid UUID;
ALTER TABLE industry_size
  ADD COLUMN IF NOT EXISTS created_at TIMESTAMPTZ;
ALTER TABLE industry_size
  ADD COLUMN IF NOT EXISTS updated_at TIMESTAMPTZ;

UPDATE industry_size
   SET guid = gen_random_uuid()
 WHERE guid IS NULL;

UPDATE industry_size
   SET created_at = now()
 WHERE created_at IS NULL;

UPDATE industry_size
   SET updated_at = created_at
 WHERE updated_at IS NULL;

ALTER TABLE industry_size
  ALTER COLUMN guid SET DEFAULT gen_random_uuid(),
  ALTER COLUMN guid SET NOT NULL,
  ALTER COLUMN created_at SET DEFAULT now(),
  ALTER COLUMN created_at SET NOT NULL,
  ALTER COLUMN updated_at SET DEFAULT now(),
  ALTER COLUMN updated_at SET NOT NULL;

CREATE UNIQUE INDEX IF NOT EXISTS ux_industry_size_guid
  ON industry_size(guid);
CREATE INDEX IF NOT EXISTS ix_industry_size_updated_at
  ON industry_size(updated_at DESC);

DO $$
BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_trigger WHERE tgname = 'trg_industry_size_updated_at') THEN
    CREATE TRIGGER trg_industry_size_updated_at
      BEFORE UPDATE ON industry_size
      FOR EACH ROW EXECUTE FUNCTION set_updated_at();
  END IF;
END $$;

ALTER TABLE industry_type
  ADD COLUMN IF NOT EXISTS guid UUID;
ALTER TABLE industry_type
  ADD COLUMN IF NOT EXISTS created_at TIMESTAMPTZ;
ALTER TABLE industry_type
  ADD COLUMN IF NOT EXISTS updated_at TIMESTAMPTZ;

UPDATE industry_type
   SET guid = gen_random_uuid()
 WHERE guid IS NULL;

UPDATE industry_type
   SET created_at = now()
 WHERE created_at IS NULL;

UPDATE industry_type
   SET updated_at = created_at
 WHERE updated_at IS NULL;

ALTER TABLE industry_type
  ALTER COLUMN guid SET DEFAULT gen_random_uuid(),
  ALTER COLUMN guid SET NOT NULL,
  ALTER COLUMN created_at SET DEFAULT now(),
  ALTER COLUMN created_at SET NOT NULL,
  ALTER COLUMN updated_at SET DEFAULT now(),
  ALTER COLUMN updated_at SET NOT NULL;

CREATE UNIQUE INDEX IF NOT EXISTS ux_industry_type_guid
  ON industry_type(guid);
CREATE INDEX IF NOT EXISTS ix_industry_type_updated_at
  ON industry_type(updated_at DESC);

DO $$
BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_trigger WHERE tgname = 'trg_industry_type_updated_at') THEN
    CREATE TRIGGER trg_industry_type_updated_at
      BEFORE UPDATE ON industry_type
      FOR EACH ROW EXECUTE FUNCTION set_updated_at();
  END IF;
END $$;

UPDATE ps_model
   SET definition_json =
       jsonb_set(
         jsonb_set(
           jsonb_set(
             definition_json,
             '{dataSchema,rootScope,runtime,sourceGuidColumn}',
             to_jsonb('guid'::text),
             true
           ),
           '{dataSchema,rootScope,runtime,sourceCreatedAtColumn}',
           to_jsonb('created_at'::text),
           true
         ),
         '{dataSchema,rootScope,runtime,sourceUpdatedAtColumn}',
         to_jsonb('updated_at'::text),
         true
       )
 WHERE model_id IN ('industry_size', 'industry_type');

CREATE OR REPLACE VIEW public.vw_industry_size AS
SELECT
  t.id AS _id,
  NULL::bigint AS tenant_id,
  t.guid AS _guid,
  t.created_at AS _created_at,
  t.updated_at AS _updated_at,
  t.name AS name
FROM public.industry_size t;

CREATE OR REPLACE VIEW public.vg_industry_size__default AS
SELECT
  _id,
  tenant_id,
  _guid,
  _created_at,
  _updated_at,
  name
FROM public.vw_industry_size;

CREATE OR REPLACE VIEW public.vw_industry_type AS
SELECT
  t.id AS _id,
  NULL::bigint AS tenant_id,
  t.guid AS _guid,
  t.created_at AS _created_at,
  t.updated_at AS _updated_at,
  t.name AS name
FROM public.industry_type t;

CREATE OR REPLACE VIEW public.vg_industry_type__default AS
SELECT
  _id,
  tenant_id,
  _guid,
  _created_at,
  _updated_at,
  name
FROM public.vw_industry_type;

COMMIT;
