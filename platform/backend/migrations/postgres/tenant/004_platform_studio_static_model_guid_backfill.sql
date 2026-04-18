BEGIN;

ALTER TABLE public.state
  ADD COLUMN IF NOT EXISTS guid UUID;

UPDATE public.state
   SET guid = gen_random_uuid()
 WHERE guid IS NULL;

ALTER TABLE public.state
  ALTER COLUMN guid SET DEFAULT gen_random_uuid();

ALTER TABLE public.state
  ALTER COLUMN guid SET NOT NULL;

CREATE UNIQUE INDEX IF NOT EXISTS ux_state_guid
  ON public.state(guid);

ALTER TABLE public.timezone
  ADD COLUMN IF NOT EXISTS guid UUID;

UPDATE public.timezone
   SET guid = gen_random_uuid()
 WHERE guid IS NULL;

ALTER TABLE public.timezone
  ALTER COLUMN guid SET DEFAULT gen_random_uuid();

ALTER TABLE public.timezone
  ALTER COLUMN guid SET NOT NULL;

CREATE UNIQUE INDEX IF NOT EXISTS ux_timezone_guid
  ON public.timezone(guid);

UPDATE ps_model
   SET definition_json = jsonb_set(
         definition_json,
         '{dataSchema,rootScope,runtime,sourceGuidColumn}',
         to_jsonb('guid'::text),
         true
       )
 WHERE model_id IN ('state', 'timezone');

CREATE OR REPLACE VIEW public.vw_state AS
SELECT t.id AS _id,
       NULL::bigint AS tenant_id,
       t.guid AS _guid,
       NULL::timestamptz AS _created_at,
       NULL::timestamptz AS _updated_at,
       t.code AS code,
       t.name AS name
  FROM public.state t;

CREATE OR REPLACE VIEW public.vw_timezone AS
SELECT t.id AS _id,
       NULL::bigint AS tenant_id,
       t.guid AS _guid,
       NULL::timestamptz AS _created_at,
       NULL::timestamptz AS _updated_at,
       t.name AS name
  FROM public.timezone t;

COMMIT;
