package platformstudioformbuilder

import (
	"context"
	"database/sql"
	"fmt"

	"dtriton.com/platform/backend/internal/platform/httpx/requestctx"
)

func (r *repository) ListViews(ctx context.Context, tenant requestctx.TenantInfo, modelID string) ([]ViewRecord, error) {
	db, err := r.client.OpenDBTenant(ctx, tenant.DBName, tenant.DBInstanceCode)
	if err != nil {
		return nil, fmt.Errorf("form builder: open tenant db: %w", err)
	}

	tx, err := db.BeginTx(ctx, &sql.TxOptions{ReadOnly: true})
	if err != nil {
		return nil, fmt.Errorf("form builder: begin list views tx: %w", err)
	}
	defer func() { _ = tx.Rollback() }()

	records, err := loadViewsTx(ctx, tx, modelID)
	if err != nil {
		return nil, err
	}
	if err := tx.Commit(); err != nil {
		return nil, fmt.Errorf("form builder: commit list views tx: %w", err)
	}
	return records, nil
}

func (r *repository) GetView(ctx context.Context, tenant requestctx.TenantInfo, modelID, viewID string) (*ViewRecord, error) {
	db, err := r.client.OpenDBTenant(ctx, tenant.DBName, tenant.DBInstanceCode)
	if err != nil {
		return nil, fmt.Errorf("form builder: open tenant db: %w", err)
	}

	tx, err := db.BeginTx(ctx, &sql.TxOptions{ReadOnly: true})
	if err != nil {
		return nil, fmt.Errorf("form builder: begin get view tx: %w", err)
	}
	defer func() { _ = tx.Rollback() }()

	record, err := loadViewTx(ctx, tx, modelID, viewID)
	if err != nil {
		return nil, err
	}
	if err := tx.Commit(); err != nil {
		return nil, fmt.Errorf("form builder: commit get view tx: %w", err)
	}
	return record, nil
}
