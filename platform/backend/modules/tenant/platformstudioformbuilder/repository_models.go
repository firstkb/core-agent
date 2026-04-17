package platformstudioformbuilder

import (
	"context"
	"database/sql"
	"fmt"

	"dtriton.com/platform/backend/internal/platform/httpx/requestctx"
)

func (r *repository) ListModels(ctx context.Context, tenant requestctx.TenantInfo) ([]ModelRecord, error) {
	db, err := r.client.OpenDBTenant(ctx, tenant.DBName, tenant.DBInstanceCode)
	if err != nil {
		return nil, fmt.Errorf("form builder: open tenant db: %w", err)
	}

	tx, err := db.BeginTx(ctx, &sql.TxOptions{ReadOnly: true})
	if err != nil {
		return nil, fmt.Errorf("form builder: begin list models tx: %w", err)
	}
	defer func() { _ = tx.Rollback() }()

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
	if err := tx.Commit(); err != nil {
		return nil, fmt.Errorf("form builder: commit list models tx: %w", err)
	}

	return records, nil
}

func (r *repository) GetModel(ctx context.Context, tenant requestctx.TenantInfo, modelID string) (*ModelRecord, error) {
	db, err := r.client.OpenDBTenant(ctx, tenant.DBName, tenant.DBInstanceCode)
	if err != nil {
		return nil, fmt.Errorf("form builder: open tenant db: %w", err)
	}

	tx, err := db.BeginTx(ctx, &sql.TxOptions{ReadOnly: true})
	if err != nil {
		return nil, fmt.Errorf("form builder: begin get model tx: %w", err)
	}
	defer func() { _ = tx.Rollback() }()

	record, err := loadModelTx(ctx, tx, modelID)
	if err != nil {
		return nil, err
	}
	if err := tx.Commit(); err != nil {
		return nil, fmt.Errorf("form builder: commit get model tx: %w", err)
	}
	return record, nil
}
