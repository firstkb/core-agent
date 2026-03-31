DO $$
BEGIN
  IF EXISTS (
    SELECT 1
    FROM information_schema.columns
    WHERE table_schema = 'public'
      AND table_name = 'events'
      AND column_name = 'events_actor_guid'
  ) AND NOT EXISTS (
    SELECT 1
    FROM information_schema.columns
    WHERE table_schema = 'public'
      AND table_name = 'events'
      AND column_name = 'events_principal_guid'
  ) THEN
    ALTER TABLE public.events RENAME COLUMN events_actor_guid TO events_principal_guid;
  END IF;
END $$;

DO $$
BEGIN
  IF EXISTS (
    SELECT 1
    FROM pg_class
    WHERE relkind = 'i'
      AND relname = 'ix_events_tenant_actor_created'
  ) AND NOT EXISTS (
    SELECT 1
    FROM pg_class
    WHERE relkind = 'i'
      AND relname = 'ix_events_tenant_principal_created'
  ) THEN
    ALTER INDEX ix_events_tenant_actor_created RENAME TO ix_events_tenant_principal_created;
  END IF;
END $$;

CREATE INDEX IF NOT EXISTS ix_events_tenant_principal_created
  ON events(events_tenant_id, events_principal_guid, events_created_at DESC)
  WHERE events_principal_guid IS NOT NULL;
