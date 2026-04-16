package platformstudioformbuilder

import (
	"context"
	"database/sql"
	"encoding/json"
	"errors"
	"fmt"
	"strings"

	"dtriton.com/platform/backend/internal/platform/httpx/requestctx"
	"dtriton.com/platform/backend/internal/platform/postgres"
	"github.com/lib/pq"
)

type repository struct {
	client *postgres.Client
}

func NewRepository(client *postgres.Client) Repository {
	return &repository{client: client}
}

type Repository interface {
	ListModels(ctx context.Context, tenant requestctx.TenantInfo) ([]ModelRecord, error)
	GetModel(ctx context.Context, tenant requestctx.TenantInfo, modelID string) (*ModelRecord, error)
	ListViews(ctx context.Context, tenant requestctx.TenantInfo, modelID string) ([]ViewRecord, error)
	GetView(ctx context.Context, tenant requestctx.TenantInfo, modelID, viewID string) (*ViewRecord, error)
	ExportDataRows(ctx context.Context, tenant requestctx.TenantInfo, relationName string, columnNames []string, orderByColumn string) ([][]string, error)
	ListExistingRuntimeRelations(ctx context.Context, tenant requestctx.TenantInfo, names []string) (map[string]string, error)
	CreateModelWithFirstView(ctx context.Context, tenant requestctx.TenantInfo, model ModelRecord, firstView ViewRecord) (*ModelRecord, *ViewRecord, error)
	CreateView(ctx context.Context, tenant requestctx.TenantInfo, view ViewRecord) (*ViewRecord, error)
	UpdateModel(ctx context.Context, tenant requestctx.TenantInfo, model ModelRecord, expectedVersion *int64) (*ModelRecord, error)
	UpdateView(ctx context.Context, tenant requestctx.TenantInfo, view ViewRecord, expectedVersion *int64) (*ViewRecord, error)
	DeleteModel(ctx context.Context, tenant requestctx.TenantInfo, modelID string) error
	DeleteView(ctx context.Context, tenant requestctx.TenantInfo, modelID, viewID string) error
	ApplyRuntime(ctx context.Context, tenant requestctx.TenantInfo, plan runtimeApplyPlan) (*RuntimeApplySummary, error)
}

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

func (r *repository) ExportDataRows(
	ctx context.Context,
	tenant requestctx.TenantInfo,
	relationName string,
	columnNames []string,
	orderByColumn string,
) ([][]string, error) {
	relationName = strings.TrimSpace(relationName)
	columnNames = normalizeExportColumnNames(columnNames)
	orderByColumn = strings.TrimSpace(orderByColumn)
	if relationName == "" {
		return nil, fmt.Errorf("form builder: export relation name is required")
	}
	if len(columnNames) == 0 {
		return [][]string{}, nil
	}

	db, err := r.client.OpenDBTenant(ctx, tenant.DBName, tenant.DBInstanceCode)
	if err != nil {
		return nil, fmt.Errorf("form builder: open tenant db: %w", err)
	}

	tx, err := db.BeginTx(ctx, &sql.TxOptions{ReadOnly: true})
	if err != nil {
		return nil, fmt.Errorf("form builder: begin export data tx: %w", err)
	}
	defer func() { _ = tx.Rollback() }()

	selectList := make([]string, 0, len(columnNames))
	for _, columnName := range columnNames {
		selectList = append(selectList, fmt.Sprintf(
			"COALESCE(t.%s::text, '') AS %s",
			quoteIdentifier(columnName),
			quoteIdentifier(columnName),
		))
	}

	query := fmt.Sprintf(
		`SELECT %s
   FROM %s t`,
		strings.Join(selectList, ", "),
		qualifiedIdentifier(relationName),
	)
	if orderByColumn != "" {
		query += fmt.Sprintf(
			`
  ORDER BY t.%s ASC NULLS LAST`,
			quoteIdentifier(orderByColumn),
		)
	}

	rows, err := tx.QueryContext(ctx, query)
	if err != nil {
		return nil, fmt.Errorf("form builder: export data rows: %w", err)
	}
	defer rows.Close()

	records := make([][]string, 0)
	values := make([]sql.NullString, len(columnNames))
	scanTargets := make([]any, len(columnNames))
	for index := range values {
		scanTargets[index] = &values[index]
	}

	for rows.Next() {
		if err := rows.Scan(scanTargets...); err != nil {
			return nil, fmt.Errorf("form builder: scan export row: %w", err)
		}
		record := make([]string, len(columnNames))
		for index, value := range values {
			if value.Valid {
				record[index] = value.String
			}
		}
		records = append(records, record)
	}
	if err := rows.Err(); err != nil {
		return nil, fmt.Errorf("form builder: export data rows result: %w", err)
	}
	if err := tx.Commit(); err != nil {
		return nil, fmt.Errorf("form builder: commit export data tx: %w", err)
	}

	return records, nil
}

func normalizeExportColumnNames(columnNames []string) []string {
	normalized := make([]string, 0, len(columnNames))
	seen := make(map[string]struct{}, len(columnNames))
	for _, columnName := range columnNames {
		columnName = strings.TrimSpace(columnName)
		if columnName == "" {
			continue
		}
		if _, ok := seen[columnName]; ok {
			continue
		}
		seen[columnName] = struct{}{}
		normalized = append(normalized, columnName)
	}
	return normalized
}

func (r *repository) ListExistingRuntimeRelations(ctx context.Context, tenant requestctx.TenantInfo, names []string) (map[string]string, error) {
	names = normalizeRuntimeRelationNames(names)
	if len(names) == 0 {
		return map[string]string{}, nil
	}

	db, err := r.client.OpenDBTenant(ctx, tenant.DBName, tenant.DBInstanceCode)
	if err != nil {
		return nil, fmt.Errorf("form builder: open tenant db: %w", err)
	}

	tx, err := db.BeginTx(ctx, &sql.TxOptions{ReadOnly: true})
	if err != nil {
		return nil, fmt.Errorf("form builder: begin runtime relation lookup tx: %w", err)
	}
	defer func() { _ = tx.Rollback() }()

	rows, err := tx.QueryContext(ctx, `
SELECT c.relname,
       CASE
           WHEN c.relkind IN ('r', 'p') THEN 'table'
           WHEN c.relkind = 'v' THEN 'view'
           WHEN c.relkind = 'm' THEN 'materialized view'
           ELSE c.relkind::text
       END AS relation_kind
  FROM pg_class c
  JOIN pg_namespace n
    ON n.oid = c.relnamespace
 WHERE n.nspname = 'public'
   AND c.relname = ANY($1)`, pq.Array(names))
	if err != nil {
		return nil, fmt.Errorf("form builder: list runtime relations: %w", err)
	}
	defer rows.Close()

	relations := make(map[string]string, len(names))
	for rows.Next() {
		var relationName string
		var relationKind string
		if err := rows.Scan(&relationName, &relationKind); err != nil {
			return nil, fmt.Errorf("form builder: scan runtime relation: %w", err)
		}
		relations[relationName] = relationKind
	}
	if err := rows.Err(); err != nil {
		return nil, fmt.Errorf("form builder: runtime relation rows: %w", err)
	}
	if err := tx.Commit(); err != nil {
		return nil, fmt.Errorf("form builder: commit runtime relation lookup tx: %w", err)
	}

	return relations, nil
}

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

func normalizeRuntimeRelationNames(names []string) []string {
	if len(names) == 0 {
		return nil
	}
	seen := make(map[string]struct{}, len(names))
	normalized := make([]string, 0, len(names))
	for _, name := range names {
		name = normalizeString(name)
		if name == "" {
			continue
		}
		if _, ok := seen[name]; ok {
			continue
		}
		seen[name] = struct{}{}
		normalized = append(normalized, name)
	}
	return normalized
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
