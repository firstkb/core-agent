ALTER TABLE public.events
  ADD COLUMN IF NOT EXISTS events_guid UUID DEFAULT gen_random_uuid();

UPDATE public.events
SET events_guid = gen_random_uuid()
WHERE events_guid IS NULL;

ALTER TABLE public.events
  ALTER COLUMN events_guid SET DEFAULT gen_random_uuid();

ALTER TABLE public.events
  ALTER COLUMN events_guid SET NOT NULL;

CREATE INDEX IF NOT EXISTS ix_events_guid_created
  ON events(events_guid, events_created_at DESC);
