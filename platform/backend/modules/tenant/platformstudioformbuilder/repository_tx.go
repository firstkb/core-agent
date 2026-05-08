package platformstudioformbuilder

import (
	"context"
	"database/sql"
	"encoding/json"
	"errors"
	"fmt"
)

func loadModelsTx(ctx context.Context, tx *sql.Tx) ([]ModelRecord, error) {
	const query = `
SELECT guid,
       model_id,
       model_key,
       COALESCE(storage_key, '') AS storage_key,
       display_name,
       COALESCE(description, '') AS description,
       source_type,
       status,
       version,
       published_version,
       structure_version,
       COALESCE(model_locked, false) AS model_locked,
       definition_json
  FROM ps_model
 ORDER BY updated_at DESC, model_id ASC`

	rows, err := tx.QueryContext(ctx, query)
	if err != nil {
		return nil, fmt.Errorf("form builder: list models: %w", err)
	}
	defer rows.Close()

	records := make([]ModelRecord, 0)
	for rows.Next() {
		record, err := scanModelRecord(rows)
		if err != nil {
			return nil, fmt.Errorf("form builder: scan model: %w", err)
		}
		records = append(records, *record)
	}
	if err := rows.Err(); err != nil {
		return nil, fmt.Errorf("form builder: list models rows: %w", err)
	}
	return records, nil
}

func loadModelTx(ctx context.Context, tx *sql.Tx, modelID string) (*ModelRecord, error) {
	const query = `
SELECT guid,
       model_id,
       model_key,
       COALESCE(storage_key, '') AS storage_key,
       display_name,
       COALESCE(description, '') AS description,
       source_type,
       status,
       version,
       published_version,
       structure_version,
       COALESCE(model_locked, false) AS model_locked,
       definition_json
  FROM ps_model
 WHERE model_id = $1
    OR model_key = $1`

	row := tx.QueryRowContext(ctx, query, modelID)
	record, err := scanModelRecord(row)
	if errors.Is(err, sql.ErrNoRows) {
		return nil, nil
	}
	if err != nil {
		return nil, fmt.Errorf("form builder: load model: %w", err)
	}
	return record, nil
}

func loadAllViewsTx(ctx context.Context, tx *sql.Tx) ([]ViewRecord, error) {
	const query = `
SELECT guid,
       model_id,
       view_id,
       view_key,
       display_name,
       COALESCE(description, '') AS description,
       view_type,
       is_default,
       COALESCE(is_active, true) AS is_active,
       COALESCE(view_locked, false) AS view_locked,
       status,
       version,
       published_version,
       last_aligned_model_structure_version,
       definition_json,
       published_artifacts_json
  FROM ps_view
 ORDER BY model_id ASC, is_default DESC, updated_at DESC, view_id ASC`

	rows, err := tx.QueryContext(ctx, query)
	if err != nil {
		return nil, fmt.Errorf("form builder: load all views: %w", err)
	}
	defer rows.Close()

	records := make([]ViewRecord, 0)
	for rows.Next() {
		record, err := scanViewRecord(rows)
		if err != nil {
			return nil, fmt.Errorf("form builder: scan view: %w", err)
		}
		records = append(records, *record)
	}
	if err := rows.Err(); err != nil {
		return nil, fmt.Errorf("form builder: load all views rows: %w", err)
	}
	return records, nil
}

func loadViewsTx(ctx context.Context, tx *sql.Tx, modelID string) ([]ViewRecord, error) {
	const query = `
SELECT guid,
       model_id,
       view_id,
       view_key,
       display_name,
       COALESCE(description, '') AS description,
       view_type,
       is_default,
       COALESCE(is_active, true) AS is_active,
       COALESCE(view_locked, false) AS view_locked,
       status,
       version,
       published_version,
       last_aligned_model_structure_version,
       definition_json,
       published_artifacts_json
  FROM ps_view
 WHERE model_id = $1
 ORDER BY is_default DESC, updated_at DESC, view_id ASC`

	rows, err := tx.QueryContext(ctx, query, modelID)
	if err != nil {
		return nil, fmt.Errorf("form builder: load views: %w", err)
	}
	defer rows.Close()

	records := make([]ViewRecord, 0)
	for rows.Next() {
		record, err := scanViewRecord(rows)
		if err != nil {
			return nil, fmt.Errorf("form builder: scan view: %w", err)
		}
		records = append(records, *record)
	}
	if err := rows.Err(); err != nil {
		return nil, fmt.Errorf("form builder: load views rows: %w", err)
	}
	return records, nil
}

func loadViewTx(ctx context.Context, tx *sql.Tx, modelID string, viewID string) (*ViewRecord, error) {
	const query = `
SELECT guid,
       model_id,
       view_id,
       view_key,
       display_name,
       COALESCE(description, '') AS description,
       view_type,
       is_default,
       COALESCE(is_active, true) AS is_active,
       COALESCE(view_locked, false) AS view_locked,
       status,
       version,
       published_version,
       last_aligned_model_structure_version,
       definition_json,
       published_artifacts_json
  FROM ps_view
 WHERE model_id = $1
   AND view_id = $2`

	row := tx.QueryRowContext(ctx, query, modelID, viewID)
	record, err := scanViewRecord(row)
	if errors.Is(err, sql.ErrNoRows) {
		return nil, nil
	}
	if err != nil {
		return nil, fmt.Errorf("form builder: load view: %w", err)
	}
	return record, nil
}

func insertModelTx(ctx context.Context, tx *sql.Tx, model ModelRecord) (*ModelRecord, error) {
	const query = `
INSERT INTO ps_model (
  guid,
  model_id,
  model_key,
  storage_key,
  display_name,
  description,
  source_type,
  status,
  version,
  published_version,
  structure_version,
  model_locked,
  definition_json
) VALUES (COALESCE(NULLIF($1, '')::uuid, gen_random_uuid()), $2, $3, NULLIF($4, ''), $5, NULLIF($6, ''), $7, $8, $9, $10, $11, $12, $13::jsonb)
RETURNING guid,
          model_id,
          model_key,
          COALESCE(storage_key, '') AS storage_key,
          display_name,
          COALESCE(description, '') AS description,
          source_type,
          status,
          version,
          published_version,
          structure_version,
          COALESCE(model_locked, false) AS model_locked,
          definition_json`

	record, err := scanModelRecord(tx.QueryRowContext(
		ctx,
		query,
		model.GUID,
		model.ModelID,
		model.ModelKey,
		model.StorageKey,
		model.DisplayName,
		model.Description,
		model.SourceType,
		model.Status,
		model.Version,
		model.PublishedVersion,
		model.StructureVersion,
		model.IsStructureLocked,
		model.DefinitionJSON,
	))
	if err != nil {
		return nil, fmt.Errorf("form builder: insert model: %w", err)
	}
	return record, nil
}

func insertViewTx(ctx context.Context, tx *sql.Tx, view ViewRecord) (*ViewRecord, error) {
	const query = `
INSERT INTO ps_view (
  guid,
  model_id,
  view_id,
  view_key,
  display_name,
  description,
  view_type,
  is_default,
  is_active,
  status,
  version,
  published_version,
  last_aligned_model_structure_version,
  view_locked,
  definition_json,
  published_artifacts_json
) VALUES (COALESCE(NULLIF($1, '')::uuid, gen_random_uuid()), $2, $3, $4, $5, NULLIF($6, ''), $7, $8, $9, $10, $11, $12, $13, $14, $15::jsonb, $16::jsonb)
RETURNING guid,
          model_id,
          view_id,
          view_key,
          display_name,
          COALESCE(description, '') AS description,
          view_type,
          is_default,
          COALESCE(is_active, true) AS is_active,
          COALESCE(view_locked, false) AS view_locked,
          status,
          version,
          published_version,
          last_aligned_model_structure_version,
          definition_json,
          published_artifacts_json`

	record, err := scanViewRecord(tx.QueryRowContext(
		ctx,
		query,
		view.GUID,
		view.ModelID,
		view.ViewID,
		view.ViewKey,
		view.DisplayName,
		view.Description,
		view.ViewType,
		view.IsDefault,
		view.IsActive,
		view.Status,
		view.Version,
		view.PublishedVersion,
		view.LastAlignedModelStructureVersion,
		view.IsViewLocked,
		view.DefinitionJSON,
		view.PublishedArtifactsJSON,
	))
	if err != nil {
		return nil, fmt.Errorf("form builder: insert view: %w", err)
	}
	return record, nil
}

func upsertModelTx(ctx context.Context, tx *sql.Tx, model ModelRecord, expectedVersion *int64) (*ModelRecord, error) {
	if expectedVersion == nil {
		const query = `
UPDATE ps_model
   SET model_key = $2,
       storage_key = NULLIF($3, ''),
       display_name = $4,
       description = NULLIF($5, ''),
       source_type = $6,
       status = $7,
       version = $8,
       published_version = $9,
       structure_version = $10,
       model_locked = $11,
       definition_json = $12::jsonb
 WHERE model_id = $1
    OR model_key = $1
RETURNING guid,
          model_id,
          model_key,
          COALESCE(storage_key, '') AS storage_key,
          display_name,
          COALESCE(description, '') AS description,
          source_type,
          status,
          version,
          published_version,
          structure_version,
          COALESCE(model_locked, false) AS model_locked,
          definition_json`

		record, err := scanModelRecord(tx.QueryRowContext(
			ctx,
			query,
			model.ModelID,
			model.ModelKey,
			model.StorageKey,
			model.DisplayName,
			model.Description,
			model.SourceType,
			model.Status,
			model.Version,
			model.PublishedVersion,
			model.StructureVersion,
			model.IsStructureLocked,
			model.DefinitionJSON,
		))
		if errors.Is(err, sql.ErrNoRows) {
			return nil, ErrModelNotFound
		}
		if err != nil {
			return nil, fmt.Errorf("form builder: upsert model: %w", err)
		}
		return record, nil
	}

	const query = `
UPDATE ps_model
   SET model_key = $2,
       storage_key = NULLIF($3, ''),
       display_name = $4,
       description = NULLIF($5, ''),
       source_type = $6,
       status = $7,
       version = $8,
       published_version = $9,
       structure_version = $10,
       model_locked = $11,
       definition_json = $12::jsonb
 WHERE (model_id = $1 OR model_key = $1)
   AND version = $13
RETURNING guid,
          model_id,
          model_key,
          COALESCE(storage_key, '') AS storage_key,
          display_name,
          COALESCE(description, '') AS description,
          source_type,
          status,
          version,
          published_version,
          structure_version,
          COALESCE(model_locked, false) AS model_locked,
          definition_json`

	record, err := scanModelRecord(tx.QueryRowContext(
		ctx,
		query,
		model.ModelID,
		model.ModelKey,
		model.StorageKey,
		model.DisplayName,
		model.Description,
		model.SourceType,
		model.Status,
		model.Version,
		model.PublishedVersion,
		model.StructureVersion,
		model.IsStructureLocked,
		model.DefinitionJSON,
		*expectedVersion,
	))
	if errors.Is(err, sql.ErrNoRows) {
		return nil, ErrDraftConflict
	}
	if err != nil {
		return nil, fmt.Errorf("form builder: upsert model: %w", err)
	}
	return record, nil
}

func upsertViewTx(ctx context.Context, tx *sql.Tx, view ViewRecord, expectedVersion *int64) (*ViewRecord, error) {
	if expectedVersion == nil {
		const query = `
UPDATE ps_view
   SET view_key = $3,
       display_name = $4,
       description = NULLIF($5, ''),
       view_type = $6,
       is_default = $7,
       is_active = $8,
       status = $9,
       version = $10,
       published_version = $11,
       last_aligned_model_structure_version = $12,
       view_locked = $13,
       definition_json = $14::jsonb,
       published_artifacts_json = $15::jsonb
 WHERE model_id = $1
   AND view_id = $2
RETURNING guid,
          model_id,
          view_id,
          view_key,
          display_name,
          COALESCE(description, '') AS description,
          view_type,
          is_default,
          COALESCE(is_active, true) AS is_active,
          COALESCE(view_locked, false) AS view_locked,
          status,
          version,
          published_version,
          last_aligned_model_structure_version,
          definition_json,
          published_artifacts_json`

		record, err := scanViewRecord(tx.QueryRowContext(
			ctx,
			query,
			view.ModelID,
			view.ViewID,
			view.ViewKey,
			view.DisplayName,
			view.Description,
			view.ViewType,
			view.IsDefault,
			view.IsActive,
			view.Status,
			view.Version,
			view.PublishedVersion,
			view.LastAlignedModelStructureVersion,
			view.IsViewLocked,
			view.DefinitionJSON,
			view.PublishedArtifactsJSON,
		))
		if errors.Is(err, sql.ErrNoRows) {
			return nil, ErrViewNotFound
		}
		if err != nil {
			return nil, fmt.Errorf("form builder: upsert view: %w", err)
		}
		return record, nil
	}

	const query = `
UPDATE ps_view
   SET view_key = $3,
       display_name = $4,
       description = NULLIF($5, ''),
       view_type = $6,
       is_default = $7,
       is_active = $8,
       status = $9,
       version = $10,
       published_version = $11,
       last_aligned_model_structure_version = $12,
       view_locked = $13,
       definition_json = $14::jsonb,
       published_artifacts_json = $15::jsonb
 WHERE model_id = $1
   AND view_id = $2
   AND version = $16
RETURNING guid,
          model_id,
          view_id,
          view_key,
          display_name,
          COALESCE(description, '') AS description,
          view_type,
          is_default,
          COALESCE(is_active, true) AS is_active,
          COALESCE(view_locked, false) AS view_locked,
          status,
          version,
          published_version,
          last_aligned_model_structure_version,
          definition_json,
          published_artifacts_json`

	record, err := scanViewRecord(tx.QueryRowContext(
		ctx,
		query,
		view.ModelID,
		view.ViewID,
		view.ViewKey,
		view.DisplayName,
		view.Description,
		view.ViewType,
		view.IsDefault,
		view.IsActive,
		view.Status,
		view.Version,
		view.PublishedVersion,
		view.LastAlignedModelStructureVersion,
		view.IsViewLocked,
		view.DefinitionJSON,
		view.PublishedArtifactsJSON,
		*expectedVersion,
	))
	if errors.Is(err, sql.ErrNoRows) {
		return nil, ErrDraftConflict
	}
	if err != nil {
		return nil, fmt.Errorf("form builder: upsert view: %w", err)
	}
	return record, nil
}

type modelScanner interface {
	Scan(dest ...any) error
}

func scanModelRecord(scanner modelScanner) (*ModelRecord, error) {
	var record ModelRecord
	var rawDefinition []byte
	if err := scanner.Scan(
		&record.GUID,
		&record.ModelID,
		&record.ModelKey,
		&record.StorageKey,
		&record.DisplayName,
		&record.Description,
		&record.SourceType,
		&record.Status,
		&record.Version,
		&record.PublishedVersion,
		&record.StructureVersion,
		&record.IsStructureLocked,
		&rawDefinition,
	); err != nil {
		return nil, err
	}
	record.CanEditViewsOnly = record.IsStructureLocked
	record.DefinitionJSON = json.RawMessage(rawDefinition)
	return &record, nil
}

func scanViewRecord(scanner modelScanner) (*ViewRecord, error) {
	var record ViewRecord
	var rawDefinition []byte
	var rawArtifacts []byte
	if err := scanner.Scan(
		&record.GUID,
		&record.ModelID,
		&record.ViewID,
		&record.ViewKey,
		&record.DisplayName,
		&record.Description,
		&record.ViewType,
		&record.IsDefault,
		&record.IsActive,
		&record.IsViewLocked,
		&record.Status,
		&record.Version,
		&record.PublishedVersion,
		&record.LastAlignedModelStructureVersion,
		&rawDefinition,
		&rawArtifacts,
	); err != nil {
		return nil, err
	}
	record.DefinitionJSON = json.RawMessage(rawDefinition)
	record.PublishedArtifactsJSON = json.RawMessage(rawArtifacts)
	return &record, nil
}
