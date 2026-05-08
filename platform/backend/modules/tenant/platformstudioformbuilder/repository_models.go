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

	records, err := loadModelsTx(ctx, tx)
	if err != nil {
		return nil, err
	}
	if err := tx.Commit(); err != nil {
		return nil, fmt.Errorf("form builder: commit list models tx: %w", err)
	}

	return records, nil
}

func (r *repository) ListModelCatalog(ctx context.Context, tenant requestctx.TenantInfo) ([]ModelRecord, map[string][]ViewRecord, error) {
	db, err := r.client.OpenDBTenant(ctx, tenant.DBName, tenant.DBInstanceCode)
	if err != nil {
		return nil, nil, fmt.Errorf("form builder: open tenant db: %w", err)
	}

	tx, err := db.BeginTx(ctx, &sql.TxOptions{ReadOnly: true})
	if err != nil {
		return nil, nil, fmt.Errorf("form builder: begin list model catalog tx: %w", err)
	}
	defer func() { _ = tx.Rollback() }()

	models, err := loadModelsTx(ctx, tx)
	if err != nil {
		return nil, nil, err
	}
	views, err := loadAllViewsTx(ctx, tx)
	if err != nil {
		return nil, nil, err
	}

	viewsByModel := make(map[string][]ViewRecord, len(models))
	for _, view := range views {
		viewsByModel[view.ModelID] = append(viewsByModel[view.ModelID], view)
	}

	if err := tx.Commit(); err != nil {
		return nil, nil, fmt.Errorf("form builder: commit list model catalog tx: %w", err)
	}

	return models, viewsByModel, nil
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
