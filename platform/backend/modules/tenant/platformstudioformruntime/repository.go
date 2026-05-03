package platformstudioformruntime

import (
	"context"
	"database/sql"
	"errors"
	"fmt"
	"strconv"
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

func (r *repository) GetModel(ctx context.Context, tenant requestctx.TenantInfo, modelID string) (*ModelRecord, error) {
	db, err := r.client.OpenDBTenant(ctx, tenant.DBName, tenant.DBInstanceCode)
	if err != nil {
		return nil, fmt.Errorf("form runtime: open tenant db: %w", err)
	}

	tx, err := db.BeginTx(ctx, &sql.TxOptions{ReadOnly: true})
	if err != nil {
		return nil, fmt.Errorf("form runtime: begin get model tx: %w", err)
	}
	defer func() { _ = tx.Rollback() }()

	const query = `
SELECT model_id,
       model_key,
       COALESCE(storage_key, '') AS storage_key,
       display_name,
       source_type,
       definition_json
  FROM ps_model
 WHERE model_id = $1
 LIMIT 1`

	var record ModelRecord
	if err := tx.QueryRowContext(ctx, query, strings.TrimSpace(modelID)).Scan(
		&record.ModelID,
		&record.ModelKey,
		&record.StorageKey,
		&record.DisplayName,
		&record.SourceType,
		&record.DefinitionJSON,
	); err != nil {
		if errors.Is(err, sql.ErrNoRows) {
			return nil, nil
		}
		return nil, fmt.Errorf("form runtime: get model: %w", err)
	}
	if err := tx.Commit(); err != nil {
		return nil, fmt.Errorf("form runtime: commit get model tx: %w", err)
	}
	return &record, nil
}

func (r *repository) GetView(ctx context.Context, tenant requestctx.TenantInfo, modelID string, viewID string) (*ViewRecord, error) {
	db, err := r.client.OpenDBTenant(ctx, tenant.DBName, tenant.DBInstanceCode)
	if err != nil {
		return nil, fmt.Errorf("form runtime: open tenant db: %w", err)
	}

	tx, err := db.BeginTx(ctx, &sql.TxOptions{ReadOnly: true})
	if err != nil {
		return nil, fmt.Errorf("form runtime: begin get view tx: %w", err)
	}
	defer func() { _ = tx.Rollback() }()

	const query = `
SELECT model_id,
       view_id,
       view_key,
       display_name,
       definition_json
  FROM ps_view
 WHERE model_id = $1
   AND view_id = $2
 LIMIT 1`

	var record ViewRecord
	if err := tx.QueryRowContext(ctx, query, strings.TrimSpace(modelID), strings.TrimSpace(viewID)).Scan(
		&record.ModelID,
		&record.ViewID,
		&record.ViewKey,
		&record.DisplayName,
		&record.DefinitionJSON,
	); err != nil {
		if errors.Is(err, sql.ErrNoRows) {
			return nil, nil
		}
		return nil, fmt.Errorf("form runtime: get view: %w", err)
	}
	if err := tx.Commit(); err != nil {
		return nil, fmt.Errorf("form runtime: commit get view tx: %w", err)
	}
	return &record, nil
}

func (r *repository) CreateRootRecord(
	ctx context.Context,
	tenant requestctx.TenantInfo,
	scope runtimeRootScopePlan,
	values map[string]any,
	docGuid string,
) (*runtimeRecordMutationRow, error) {
	db, err := r.client.OpenDBTenant(ctx, tenant.DBName, tenant.DBInstanceCode)
	if err != nil {
		return nil, fmt.Errorf("form runtime: open tenant db: %w", err)
	}

	tx, err := db.BeginTx(ctx, &sql.TxOptions{})
	if err != nil {
		return nil, fmt.Errorf("form runtime: begin create record tx: %w", err)
	}
	defer func() { _ = tx.Rollback() }()

	if err := setTenantContext(ctx, tx, tenant); err != nil {
		return nil, err
	}

	row, err := createRootRecordTx(ctx, tx, scope, values, strings.TrimSpace(docGuid))
	if err != nil {
		return nil, err
	}
	if err := tx.Commit(); err != nil {
		return nil, fmt.Errorf("form runtime: commit create record tx: %w", err)
	}
	return row, nil
}

func (r *repository) CreateSubformRecord(
	ctx context.Context,
	tenant requestctx.TenantInfo,
	rootScope runtimeRootScopePlan,
	subformScope runtimeSubformScopePlan,
	parentDocGuid string,
	values map[string]any,
	docGuid string,
) (*runtimeRecordMutationRow, error) {
	db, err := r.client.OpenDBTenant(ctx, tenant.DBName, tenant.DBInstanceCode)
	if err != nil {
		return nil, fmt.Errorf("form runtime: open tenant db: %w", err)
	}

	tx, err := db.BeginTx(ctx, &sql.TxOptions{})
	if err != nil {
		return nil, fmt.Errorf("form runtime: begin create subform record tx: %w", err)
	}
	defer func() { _ = tx.Rollback() }()

	if err := setTenantContext(ctx, tx, tenant); err != nil {
		return nil, err
	}

	row, err := createSubformRecordTx(ctx, tx, rootScope, subformScope, strings.TrimSpace(parentDocGuid), values, strings.TrimSpace(docGuid))
	if err != nil {
		return nil, err
	}
	if err := tx.Commit(); err != nil {
		return nil, fmt.Errorf("form runtime: commit create subform record tx: %w", err)
	}
	return row, nil
}

func (r *repository) UpdateRootRecord(
	ctx context.Context,
	tenant requestctx.TenantInfo,
	scope runtimeRootScopePlan,
	docGuid string,
	values map[string]any,
	expectedRevision string,
) (*runtimeRecordMutationRow, error) {
	db, err := r.client.OpenDBTenant(ctx, tenant.DBName, tenant.DBInstanceCode)
	if err != nil {
		return nil, fmt.Errorf("form runtime: open tenant db: %w", err)
	}

	tx, err := db.BeginTx(ctx, &sql.TxOptions{})
	if err != nil {
		return nil, fmt.Errorf("form runtime: begin update record tx: %w", err)
	}
	defer func() { _ = tx.Rollback() }()

	if err := setTenantContext(ctx, tx, tenant); err != nil {
		return nil, err
	}

	row, err := updateRootRecordTx(ctx, tx, scope, strings.TrimSpace(docGuid), values, strings.TrimSpace(expectedRevision))
	if err != nil {
		return nil, err
	}
	if err := tx.Commit(); err != nil {
		return nil, fmt.Errorf("form runtime: commit update record tx: %w", err)
	}
	return row, nil
}

func (r *repository) UpdateSubformRecord(
	ctx context.Context,
	tenant requestctx.TenantInfo,
	rootScope runtimeRootScopePlan,
	subformScope runtimeSubformScopePlan,
	parentDocGuid string,
	docGuid string,
	values map[string]any,
	expectedRevision string,
) (*runtimeRecordMutationRow, error) {
	db, err := r.client.OpenDBTenant(ctx, tenant.DBName, tenant.DBInstanceCode)
	if err != nil {
		return nil, fmt.Errorf("form runtime: open tenant db: %w", err)
	}

	tx, err := db.BeginTx(ctx, &sql.TxOptions{})
	if err != nil {
		return nil, fmt.Errorf("form runtime: begin update subform record tx: %w", err)
	}
	defer func() { _ = tx.Rollback() }()

	if err := setTenantContext(ctx, tx, tenant); err != nil {
		return nil, err
	}

	row, err := updateSubformRecordTx(ctx, tx, rootScope, subformScope, strings.TrimSpace(parentDocGuid), strings.TrimSpace(docGuid), values, strings.TrimSpace(expectedRevision))
	if err != nil {
		return nil, err
	}
	if err := tx.Commit(); err != nil {
		return nil, fmt.Errorf("form runtime: commit update subform record tx: %w", err)
	}
	return row, nil
}

func (r *repository) SetRootRecordsActive(
	ctx context.Context,
	tenant requestctx.TenantInfo,
	scope runtimeRootScopePlan,
	docGuids []string,
	activeColumn string,
	active bool,
) error {
	db, err := r.client.OpenDBTenant(ctx, tenant.DBName, tenant.DBInstanceCode)
	if err != nil {
		return fmt.Errorf("form runtime: open tenant db: %w", err)
	}

	tx, err := db.BeginTx(ctx, &sql.TxOptions{})
	if err != nil {
		return fmt.Errorf("form runtime: begin bulk active tx: %w", err)
	}
	defer func() { _ = tx.Rollback() }()

	if err := setTenantContext(ctx, tx, tenant); err != nil {
		return err
	}
	if err := setRootRecordsActiveTx(ctx, tx, scope, docGuids, activeColumn, active); err != nil {
		return err
	}
	if err := tx.Commit(); err != nil {
		return fmt.Errorf("form runtime: commit bulk active tx: %w", err)
	}
	return nil
}

func (r *repository) DeleteRootRecords(
	ctx context.Context,
	tenant requestctx.TenantInfo,
	scope runtimeRootScopePlan,
	docGuids []string,
) error {
	db, err := r.client.OpenDBTenant(ctx, tenant.DBName, tenant.DBInstanceCode)
	if err != nil {
		return fmt.Errorf("form runtime: open tenant db: %w", err)
	}

	tx, err := db.BeginTx(ctx, &sql.TxOptions{})
	if err != nil {
		return fmt.Errorf("form runtime: begin bulk delete tx: %w", err)
	}
	defer func() { _ = tx.Rollback() }()

	if err := setTenantContext(ctx, tx, tenant); err != nil {
		return err
	}
	if err := deleteRootRecordsTx(ctx, tx, scope, docGuids); err != nil {
		return err
	}
	if err := tx.Commit(); err != nil {
		return fmt.Errorf("form runtime: commit bulk delete tx: %w", err)
	}
	return nil
}

func (r *repository) DeleteSubformRecord(
	ctx context.Context,
	tenant requestctx.TenantInfo,
	rootScope runtimeRootScopePlan,
	subformScope runtimeSubformScopePlan,
	parentDocGuid string,
	docGuid string,
) error {
	db, err := r.client.OpenDBTenant(ctx, tenant.DBName, tenant.DBInstanceCode)
	if err != nil {
		return fmt.Errorf("form runtime: open tenant db: %w", err)
	}

	tx, err := db.BeginTx(ctx, &sql.TxOptions{})
	if err != nil {
		return fmt.Errorf("form runtime: begin delete subform record tx: %w", err)
	}
	defer func() { _ = tx.Rollback() }()

	if err := setTenantContext(ctx, tx, tenant); err != nil {
		return err
	}
	if err := deleteSubformRecordTx(ctx, tx, rootScope, subformScope, strings.TrimSpace(parentDocGuid), strings.TrimSpace(docGuid)); err != nil {
		return err
	}
	if err := tx.Commit(); err != nil {
		return fmt.Errorf("form runtime: commit delete subform record tx: %w", err)
	}
	return nil
}

func (r *repository) LoadRootRecord(
	ctx context.Context,
	tenant requestctx.TenantInfo,
	scope runtimeRootScopePlan,
	docGuid string,
) (*runtimeRecordMutationRow, error) {
	db, err := r.client.OpenDBTenant(ctx, tenant.DBName, tenant.DBInstanceCode)
	if err != nil {
		return nil, fmt.Errorf("form runtime: open tenant db: %w", err)
	}

	tx, err := db.BeginTx(ctx, &sql.TxOptions{ReadOnly: true})
	if err != nil {
		return nil, fmt.Errorf("form runtime: begin load record tx: %w", err)
	}
	defer func() { _ = tx.Rollback() }()

	if err := setTenantContext(ctx, tx, tenant); err != nil {
		return nil, err
	}

	row, err := loadRootRecordTx(ctx, tx, scope, strings.TrimSpace(docGuid))
	if err != nil {
		return nil, err
	}
	if err := tx.Commit(); err != nil {
		return nil, fmt.Errorf("form runtime: commit load record tx: %w", err)
	}
	return row, nil
}

func (r *repository) LoadSubformRecord(
	ctx context.Context,
	tenant requestctx.TenantInfo,
	rootScope runtimeRootScopePlan,
	subformScope runtimeSubformScopePlan,
	parentDocGuid string,
	docGuid string,
) (*runtimeRecordMutationRow, error) {
	db, err := r.client.OpenDBTenant(ctx, tenant.DBName, tenant.DBInstanceCode)
	if err != nil {
		return nil, fmt.Errorf("form runtime: open tenant db: %w", err)
	}

	tx, err := db.BeginTx(ctx, &sql.TxOptions{ReadOnly: true})
	if err != nil {
		return nil, fmt.Errorf("form runtime: begin load subform record tx: %w", err)
	}
	defer func() { _ = tx.Rollback() }()

	if err := setTenantContext(ctx, tx, tenant); err != nil {
		return nil, err
	}

	row, err := loadSubformRecordTx(ctx, tx, rootScope, subformScope, strings.TrimSpace(parentDocGuid), strings.TrimSpace(docGuid))
	if err != nil {
		return nil, err
	}
	if err := tx.Commit(); err != nil {
		return nil, fmt.Errorf("form runtime: commit load subform record tx: %w", err)
	}
	return row, nil
}

func (r *repository) ResolveContactLookupLabels(
	ctx context.Context,
	tenant requestctx.TenantInfo,
	ids []int64,
) (map[int64]string, error) {
	out := map[int64]string{}
	if len(ids) == 0 {
		return out, nil
	}

	db, err := r.client.OpenDBTenant(ctx, tenant.DBName, tenant.DBInstanceCode)
	if err != nil {
		return nil, fmt.Errorf("form runtime: open tenant db: %w", err)
	}

	tx, err := db.BeginTx(ctx, &sql.TxOptions{ReadOnly: true})
	if err != nil {
		return nil, fmt.Errorf("form runtime: begin resolve contact lookup tx: %w", err)
	}
	defer func() { _ = tx.Rollback() }()

	if err := setTenantContext(ctx, tx, tenant); err != nil {
		return nil, err
	}

	const query = `
SELECT id,
       COALESCE(NULLIF(BTRIM(CONCAT_WS(' ', first_name, last_name)), ''), NULLIF(email, ''), id::text) AS label
  FROM users
 WHERE tenant_id = current_setting('app.tenant_id', true)::bigint
   AND id = ANY($1)`
	rows, err := tx.QueryContext(ctx, query, pq.Array(ids))
	if err != nil {
		return nil, fmt.Errorf("form runtime: resolve contact lookup labels: %w", err)
	}
	defer func() { _ = rows.Close() }()

	for rows.Next() {
		var id int64
		var label string
		if err := rows.Scan(&id, &label); err != nil {
			return nil, fmt.Errorf("form runtime: scan contact lookup label: %w", err)
		}
		out[id] = strings.TrimSpace(label)
	}
	if err := rows.Err(); err != nil {
		return nil, fmt.Errorf("form runtime: read contact lookup labels: %w", err)
	}
	if err := tx.Commit(); err != nil {
		return nil, fmt.Errorf("form runtime: commit resolve contact lookup tx: %w", err)
	}
	return out, nil
}

func (r *repository) ResolveCurrentUserBusinessID(
	ctx context.Context,
	tenant requestctx.TenantInfo,
	userGUID string,
) (int64, error) {
	db, err := r.client.OpenDBTenant(ctx, tenant.DBName, tenant.DBInstanceCode)
	if err != nil {
		return 0, fmt.Errorf("form runtime: open tenant db: %w", err)
	}

	tx, err := db.BeginTx(ctx, &sql.TxOptions{ReadOnly: true})
	if err != nil {
		return 0, fmt.Errorf("form runtime: begin resolve user tx: %w", err)
	}
	defer func() { _ = tx.Rollback() }()

	if err := setTenantContext(ctx, tx, tenant); err != nil {
		return 0, err
	}

	var userID int64
	const query = `
SELECT id
  FROM users
 WHERE tenant_id = current_setting('app.tenant_id', true)::bigint
   AND guid = $1
 LIMIT 1`
	if err := tx.QueryRowContext(ctx, query, strings.TrimSpace(userGUID)).Scan(&userID); err != nil {
		if errors.Is(err, sql.ErrNoRows) {
			return 0, nil
		}
		return 0, fmt.Errorf("form runtime: resolve current user: %w", err)
	}
	if err := tx.Commit(); err != nil {
		return 0, fmt.Errorf("form runtime: commit resolve user tx: %w", err)
	}
	return userID, nil
}

func setTenantContext(ctx context.Context, tx *sql.Tx, tenant requestctx.TenantInfo) error {
	tenantID, err := strconv.ParseInt(strings.TrimSpace(tenant.ID), 10, 64)
	if err != nil || tenantID == 0 {
		return ErrTenantMissing
	}
	if _, err := tx.ExecContext(ctx, `SELECT set_config('app.tenant_id', $1, true)`, strconv.FormatInt(tenantID, 10)); err != nil {
		return fmt.Errorf("form runtime: set tenant context: %w", err)
	}
	return nil
}
