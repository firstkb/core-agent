ALTER TABLE public.events
  ADD COLUMN IF NOT EXISTS guid UUID DEFAULT gen_random_uuid();

UPDATE public.events
SET guid = gen_random_uuid()
WHERE guid IS NULL;

ALTER TABLE public.events
  ALTER COLUMN guid SET DEFAULT gen_random_uuid();

ALTER TABLE public.events
  ALTER COLUMN guid SET NOT NULL;

ALTER TABLE public.events
  ADD COLUMN IF NOT EXISTS data JSONB;

UPDATE public.events
SET data = '{}'::jsonb
WHERE data IS NULL;

ALTER TABLE public.events
  ALTER COLUMN data SET DEFAULT '{}'::jsonb;

ALTER TABLE public.events
  ALTER COLUMN data SET NOT NULL;

ALTER TABLE public.events
  ADD COLUMN IF NOT EXISTS created_at TIMESTAMPTZ;

UPDATE public.events
SET created_at = now()
WHERE created_at IS NULL;

ALTER TABLE public.events
  ALTER COLUMN created_at SET DEFAULT now();

ALTER TABLE public.events
  ALTER COLUMN created_at SET NOT NULL;

ALTER TABLE public.events
  ADD COLUMN IF NOT EXISTS updated_at TIMESTAMPTZ;

UPDATE public.events
SET updated_at = created_at
WHERE updated_at IS NULL;

ALTER TABLE public.events
  ALTER COLUMN updated_at SET DEFAULT now();

ALTER TABLE public.events
  ALTER COLUMN updated_at SET NOT NULL;

ALTER TABLE public.events
  ADD COLUMN IF NOT EXISTS occurred_at TIMESTAMPTZ;

UPDATE public.events
SET occurred_at = created_at
WHERE occurred_at IS NULL;

DO $$
BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_trigger WHERE tgname = 'trg_events_updated_at') THEN
    CREATE TRIGGER trg_events_updated_at
      BEFORE UPDATE ON events
      FOR EACH ROW EXECUTE FUNCTION set_updated_at();
  END IF;
END $$;

CREATE INDEX IF NOT EXISTS ix_events_tenant_created
  ON events(tenant_id, created_at DESC);
CREATE INDEX IF NOT EXISTS ix_events_guid_created
  ON events(guid, created_at DESC);
CREATE INDEX IF NOT EXISTS ix_events_tenant_event_created
  ON events(tenant_id, event, created_at DESC);
CREATE INDEX IF NOT EXISTS ix_events_principal_created
  ON events(principal_guid, created_at DESC)
  WHERE principal_guid IS NOT NULL;
CREATE INDEX IF NOT EXISTS ix_events_module_created
  ON events(module, created_at DESC);
