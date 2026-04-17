package platformstudioformbuilder

import (
	"context"
	"database/sql"
	"fmt"

	"dtriton.com/platform/backend/internal/platform/httpx/requestctx"
)

func (r *repository) CreateModelWithFirstView(
	ctx context.Context,
	tenant requestctx.TenantInfo,
	model ModelRecord,
	firstView ViewRecord,
) (*ModelRecord, *ViewRecord, error) {
	db, err := r.client.OpenDBTenant(ctx, tenant.DBName, tenant.DBInstanceCode)
	if err != nil {
		return nil, nil, fmt.Errorf("form builder: open tenant db: %w", err)
	}

	tx, err := db.BeginTx(ctx, &sql.TxOptions{})
	if err != nil {
		return nil, nil, fmt.Errorf("form builder: begin create tx: %w", err)
	}
	defer func() { _ = tx.Rollback() }()

	persistedModel, err := insertModelTx(ctx, tx, model)
	if err != nil {
		return nil, nil, err
	}
	firstView.ModelID = persistedModel.ModelID
	persistedView, err := insertViewTx(ctx, tx, firstView)
	if err != nil {
		return nil, nil, err
	}

	if err := tx.Commit(); err != nil {
		return nil, nil, fmt.Errorf("form builder: commit create tx: %w", err)
	}

	return persistedModel, persistedView, nil
}

func (r *repository) CreateView(ctx context.Context, tenant requestctx.TenantInfo, view ViewRecord) (*ViewRecord, error) {
	db, err := r.client.OpenDBTenant(ctx, tenant.DBName, tenant.DBInstanceCode)
	if err != nil {
		return nil, fmt.Errorf("form builder: open tenant db: %w", err)
	}

	tx, err := db.BeginTx(ctx, &sql.TxOptions{})
	if err != nil {
		return nil, fmt.Errorf("form builder: begin create view tx: %w", err)
	}
	defer func() { _ = tx.Rollback() }()

	persistedView, err := insertViewTx(ctx, tx, view)
	if err != nil {
		return nil, err
	}

	if err := tx.Commit(); err != nil {
		return nil, fmt.Errorf("form builder: commit create view tx: %w", err)
	}

	return persistedView, nil
}

func (r *repository) UpdateModel(
	ctx context.Context,
	tenant requestctx.TenantInfo,
	model ModelRecord,
	expectedVersion *int64,
) (*ModelRecord, error) {
	db, err := r.client.OpenDBTenant(ctx, tenant.DBName, tenant.DBInstanceCode)
	if err != nil {
		return nil, fmt.Errorf("form builder: open tenant db: %w", err)
	}

	tx, err := db.BeginTx(ctx, &sql.TxOptions{})
	if err != nil {
		return nil, fmt.Errorf("form builder: begin update model tx: %w", err)
	}
	defer func() { _ = tx.Rollback() }()

	persisted, err := upsertModelTx(ctx, tx, model, expectedVersion)
	if err != nil {
		return nil, err
	}

	if err := tx.Commit(); err != nil {
		return nil, fmt.Errorf("form builder: commit update model tx: %w", err)
	}

	return persisted, nil
}

func (r *repository) UpdateView(
	ctx context.Context,
	tenant requestctx.TenantInfo,
	view ViewRecord,
	expectedVersion *int64,
) (*ViewRecord, error) {
	db, err := r.client.OpenDBTenant(ctx, tenant.DBName, tenant.DBInstanceCode)
	if err != nil {
		return nil, fmt.Errorf("form builder: open tenant db: %w", err)
	}

	tx, err := db.BeginTx(ctx, &sql.TxOptions{})
	if err != nil {
		return nil, fmt.Errorf("form builder: begin update view tx: %w", err)
	}
	defer func() { _ = tx.Rollback() }()

	persisted, err := upsertViewTx(ctx, tx, view, expectedVersion)
	if err != nil {
		return nil, err
	}

	if err := tx.Commit(); err != nil {
		return nil, fmt.Errorf("form builder: commit update view tx: %w", err)
	}

	return persisted, nil
}

func (r *repository) DeleteView(ctx context.Context, tenant requestctx.TenantInfo, modelID, viewID string) error {
	db, err := r.client.OpenDBTenant(ctx, tenant.DBName, tenant.DBInstanceCode)
	if err != nil {
		return fmt.Errorf("form builder: open tenant db: %w", err)
	}

	tx, err := db.BeginTx(ctx, &sql.TxOptions{})
	if err != nil {
		return fmt.Errorf("form builder: begin delete view tx: %w", err)
	}
	defer func() { _ = tx.Rollback() }()

	viewRecord, err := loadViewTx(ctx, tx, modelID, viewID)
	if err != nil {
		return err
	}
	if viewRecord == nil {
		return ErrViewNotFound
	}
	modelRecord, err := loadModelTx(ctx, tx, modelID)
	if err != nil {
		return err
	}
	if modelRecord == nil {
		return ErrModelNotFound
	}

	remaining, err := loadViewsTx(ctx, tx, modelID)
	if err != nil {
		return err
	}
	gridViewNames, err := runtimeGridViewNamesForView(modelRecord, viewRecord, remaining)
	if err != nil {
		return err
	}

	nextViews := make([]ViewRecord, 0, len(remaining))
	for _, candidate := range remaining {
		if candidate.ViewID == viewRecord.ViewID {
			continue
		}
		nextViews = append(nextViews, candidate)
	}
	if len(nextViews) == 0 {
		return ErrCannotDeleteLastView
	}

	const deleteQuery = `
DELETE FROM ps_view
 WHERE model_id = $1
   AND view_id = $2`
	if _, err := tx.ExecContext(ctx, deleteQuery, modelID, viewID); err != nil {
		return fmt.Errorf("form builder: delete view: %w", err)
	}
	for _, gridViewName := range gridViewNames {
		if _, err := tx.ExecContext(ctx, fmt.Sprintf("DROP VIEW IF EXISTS %s", qualifiedIdentifier(gridViewName))); err != nil {
			return fmt.Errorf("form builder: drop runtime grid view %s during delete: %w", gridViewName, err)
		}
	}

	if viewRecord.IsDefault {
		if _, err := tx.ExecContext(ctx, `
UPDATE ps_view
   SET is_default = true,
       is_active = true
 WHERE model_id = $1
   AND view_id = $2`, modelID, nextViews[0].ViewID); err != nil {
			return fmt.Errorf("form builder: promote default view: %w", err)
		}
	} else {
		var activeCount int
		if err := tx.QueryRowContext(ctx, `
SELECT count(*)
  FROM ps_view
 WHERE model_id = $1
   AND is_active = true`, modelID).Scan(&activeCount); err != nil {
			return fmt.Errorf("form builder: count active views: %w", err)
		}
		if activeCount == 0 {
			if _, err := tx.ExecContext(ctx, `
UPDATE ps_view
   SET is_active = true
 WHERE model_id = $1
   AND view_id = $2`, modelID, nextViews[0].ViewID); err != nil {
				return fmt.Errorf("form builder: restore active view: %w", err)
			}
		}
	}

	if err := tx.Commit(); err != nil {
		return fmt.Errorf("form builder: commit delete view tx: %w", err)
	}
	return nil
}

func runtimeGridViewNamesForView(model *ModelRecord, view *ViewRecord, views []ViewRecord) ([]string, error) {
	if model == nil || view == nil {
		return nil, nil
	}
	modelPayload, err := buildCanonicalModelPayload(model, views)
	if err != nil {
		return nil, err
	}
	viewPayload, err := buildCanonicalViewPayload(model, view, views, modelPayload)
	if err != nil {
		return nil, err
	}

	refs := collectUISchemaGridRelationRefs(asMap(viewPayload["uiSchema"]), "view "+view.ViewID)
	names := make([]string, 0, len(refs))
	seen := make(map[string]struct{}, len(refs))
	for _, ref := range refs {
		if _, ok := seen[ref.Name]; ok {
			continue
		}
		seen[ref.Name] = struct{}{}
		names = append(names, ref.Name)
	}
	return names, nil
}

func runtimeViewNamesForModel(model *ModelRecord, views []ViewRecord) ([]string, error) {
	if model == nil {
		return nil, nil
	}

	modelPayload, err := buildCanonicalModelPayload(model, views)
	if err != nil {
		return nil, err
	}

	names := make([]string, 0)
	seen := make(map[string]struct{})

	for _, view := range views {
		view := view
		gridViewNames, err := runtimeGridViewNamesForView(model, &view, views)
		if err != nil {
			return nil, err
		}
		for _, name := range gridViewNames {
			if _, ok := seen[name]; ok {
				continue
			}
			seen[name] = struct{}{}
			names = append(names, name)
		}
	}

	for _, ref := range collectDataSchemaRuntimeRelationRefs(asMap(modelPayload["dataSchema"]), "model "+model.ModelID) {
		if ref.Kind != "data view" {
			continue
		}
		if _, ok := seen[ref.Name]; ok {
			continue
		}
		seen[ref.Name] = struct{}{}
		names = append(names, ref.Name)
	}

	return names, nil
}

func (r *repository) DeleteModel(ctx context.Context, tenant requestctx.TenantInfo, modelID string) error {
	db, err := r.client.OpenDBTenant(ctx, tenant.DBName, tenant.DBInstanceCode)
	if err != nil {
		return fmt.Errorf("form builder: open tenant db: %w", err)
	}

	tx, err := db.BeginTx(ctx, &sql.TxOptions{})
	if err != nil {
		return fmt.Errorf("form builder: begin delete model tx: %w", err)
	}
	defer func() { _ = tx.Rollback() }()

	modelRecord, err := loadModelTx(ctx, tx, modelID)
	if err != nil {
		return err
	}
	if modelRecord == nil {
		return ErrModelNotFound
	}
	views, err := loadViewsTx(ctx, tx, modelRecord.ModelID)
	if err != nil {
		return err
	}
	viewNames, err := runtimeViewNamesForModel(modelRecord, views)
	if err != nil {
		return err
	}

	for _, viewName := range viewNames {
		if _, err := tx.ExecContext(ctx, fmt.Sprintf("DROP VIEW IF EXISTS %s", qualifiedIdentifier(viewName))); err != nil {
			return fmt.Errorf("form builder: drop runtime view %s during delete model: %w", viewName, err)
		}
	}

	if _, err := tx.ExecContext(ctx, `
DELETE FROM ps_view
 WHERE model_id = $1`, modelID); err != nil {
		return fmt.Errorf("form builder: delete model views: %w", err)
	}

	if _, err := tx.ExecContext(ctx, `
DELETE FROM ps_model
 WHERE model_id = $1`, modelID); err != nil {
		return fmt.Errorf("form builder: delete model: %w", err)
	}

	if err := tx.Commit(); err != nil {
		return fmt.Errorf("form builder: commit delete model tx: %w", err)
	}
	return nil
}
