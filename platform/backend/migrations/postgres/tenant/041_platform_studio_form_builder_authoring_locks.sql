ALTER TABLE ps_model
  ADD COLUMN IF NOT EXISTS model_locked BOOLEAN NOT NULL DEFAULT false;

UPDATE ps_model
SET model_locked = COALESCE((definition_json ->> 'isStructureLocked')::boolean, model_locked)
WHERE model_locked IS DISTINCT FROM COALESCE((definition_json ->> 'isStructureLocked')::boolean, model_locked);

ALTER TABLE ps_view
  ADD COLUMN IF NOT EXISTS is_active BOOLEAN NOT NULL DEFAULT true;

ALTER TABLE ps_view
  ADD COLUMN IF NOT EXISTS view_locked BOOLEAN NOT NULL DEFAULT false;

UPDATE ps_view
SET is_active = COALESCE((definition_json ->> 'isActive')::boolean, is_active),
    view_locked = COALESCE((definition_json ->> 'isViewLocked')::boolean, view_locked)
WHERE is_active IS DISTINCT FROM COALESCE((definition_json ->> 'isActive')::boolean, is_active)
   OR view_locked IS DISTINCT FROM COALESCE((definition_json ->> 'isViewLocked')::boolean, view_locked);
