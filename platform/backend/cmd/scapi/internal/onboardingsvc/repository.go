package onboardingsvc

import (
	"context"
	"database/sql"
	"errors"
	"fmt"
	"strings"

	"log/slog"

	"github.com/firstkb/sc-api/cmd/scapi/internal/repository"
	"github.com/firstkb/sc-api/internal/postgres"
)

type dbInstance struct {
	ID   int64
	Code string
}

type SandboxPool struct {
	ID           int64
	Code         string
	Plan         Plan
	DBName       string
	InstanceID   int64
	InstanceCode string
	IsDefault    bool
	Weight       int32
}

type DedicatedPool struct {
	ID           int64
	Code         string
	Plan         Plan
	DBPrefix     string
	InstanceID   int64
	InstanceCode string
	IsDefault    bool
}

// TenantRecord отражает агрегированные данные по тенанту.
type TenantRecord struct {
	ID           int64
	Name         string
	Host         string
	Plan         Plan
	Isolation    IsolationMode
	DBName       string
	InstanceCode string
	InstanceID   int64
}

type Repository struct {
	repository.Repository
}

func NewRepo(client *postgres.Client, logger *slog.Logger) *Repository {
	repository := repository.NewRepository(client, logger)
	return &Repository{
		Repository: repository,
	}
}

func (r *Repository) GetTenantByHost(ctx context.Context, host string) (*TenantRecord, error) {
	host = normalizeHost(host)
	if host == "" {
		return nil, errors.New("host required")
	}
	const q = `
SELECT tenant_id, tenant_name, host, plan, isolation, db_name, db_instance_code, db_instance_id
  FROM v_tenant_by_host
 WHERE host = $1
 ORDER BY updated_at DESC
 LIMIT 1`
	return r.fetchTenant(ctx, q, host)
}

func (r *Repository) GetTenantByDB(ctx context.Context, dbName string) (*TenantRecord, error) {
	dbName = strings.TrimSpace(dbName)
	if dbName == "" {
		return nil, errors.New("db name required")
	}
	const q = `
SELECT tenant_id, tenant_name, host, plan, isolation, db_name, db_instance_code, db_instance_id
  FROM v_tenant_by_host
 WHERE db_name = $1
 ORDER BY updated_at DESC
 LIMIT 1`
	return r.fetchTenant(ctx, q, dbName)
}

func (r *Repository) fetchTenant(ctx context.Context, query string, arg interface{}) (*TenantRecord, error) {
	db, err := r.OpenDBMaster(ctx)
	if err != nil {
		return nil, fmt.Errorf("open master db: %w", err)
	}

	row := db.QueryRow(query, arg)
	var rec TenantRecord
	var (
		plan       sql.NullString
		instanceID sql.NullInt64
	)
	if err := row.Scan(&rec.ID, &rec.Name, &rec.Host, &plan, &rec.Isolation, &rec.DBName, &rec.InstanceCode, &instanceID); err != nil {
		if errors.Is(err, sql.ErrNoRows) {
			return nil, nil
		}
		return nil, fmt.Errorf("query tenant: %w", err)
	}
	if plan.Valid {
		rec.Plan = Plan(plan.String)
	}
	if instanceID.Valid {
		rec.InstanceID = instanceID.Int64
	}
	return &rec, nil
}

func (r *Repository) GetTenantByID(ctx context.Context, tenantID int64) (*TenantRecord, error) {
	const q = `
SELECT tenant_id, tenant_name, host, plan, isolation, db_name, db_instance_code, db_instance_id
  FROM v_tenant_by_host
 WHERE tenant_id = $1`

	db, err := r.OpenDBMaster(ctx)
	if err != nil {
		return nil, fmt.Errorf("open master db: %w", err)
	}
	row := db.QueryRow(q, tenantID)
	var rec TenantRecord
	var (
		plan       sql.NullString
		instanceID sql.NullInt64
	)
	if err := row.Scan(&rec.ID, &rec.Name, &rec.Host, &plan, &rec.Isolation, &rec.DBName, &rec.InstanceCode, &instanceID); err != nil {
		return nil, fmt.Errorf("query tenant by id: %w", err)
	}
	if plan.Valid {
		rec.Plan = Plan(plan.String)
	}
	if instanceID.Valid {
		rec.InstanceID = instanceID.Int64
	}
	return &rec, nil
}

func (r *Repository) LookupInstance(ctx context.Context, code string) (*dbInstance, error) {
	code = strings.TrimSpace(code)
	if code == "" {
		return nil, errors.New("db instance code required")
	}

	db, err := r.Client.OpenDBMaster(ctx)
	if err != nil {
		return nil, fmt.Errorf("open master db: %w", err)
	}

	const q = `SELECT id, code FROM db_instance WHERE code = $1`
	row := db.QueryRow(q, code)
	var inst dbInstance
	if err := row.Scan(&inst.ID, &inst.Code); err != nil {
		if errors.Is(err, sql.ErrNoRows) {
			return nil, fmt.Errorf("db instance %s not found", code)
		}
		return nil, fmt.Errorf("lookup instance: %w", err)
	}
	return &inst, nil
}

func (r *Repository) GetDefaultSandboxPool(ctx context.Context) (*SandboxPool, error) {
	pool, err := r.querySandboxPool(ctx, "WHERE sp.is_default = true")
	if err != nil {
		if errors.Is(err, sql.ErrNoRows) {
			return nil, errors.New("default sandbox pool not configured")
		}
		return nil, fmt.Errorf("load default sandbox pool: %w", err)
	}
	return pool, nil
}

func (r *Repository) GetSandboxPoolByPlan(ctx context.Context, plan Plan) (*SandboxPool, error) {
	pool, err := r.querySandboxPool(ctx, "WHERE sp.plan = $1 AND sp.is_default = true", string(plan))
	if err != nil {
		if errors.Is(err, sql.ErrNoRows) {
			return nil, fmt.Errorf("sandbox pool for plan %s not configured", plan)
		}
		return nil, fmt.Errorf("load sandbox pool for plan %s: %w", plan, err)
	}
	return pool, nil
}

func (r *Repository) GetSandboxPoolByCode(ctx context.Context, code string) (*SandboxPool, error) {
	code = strings.TrimSpace(code)
	if code == "" {
		return nil, errors.New("sandbox pool code required")
	}
	pool, err := r.querySandboxPool(ctx, "WHERE sp.code = $1", code)
	if err != nil {
		if errors.Is(err, sql.ErrNoRows) {
			return nil, fmt.Errorf("sandbox pool %s not found", code)
		}
		return nil, fmt.Errorf("load sandbox pool %s: %w", code, err)
	}
	return pool, nil
}

func (r *Repository) GetDedicatedPoolByPlan(ctx context.Context, plan Plan) (*DedicatedPool, error) {
	pool, err := r.queryDedicatedPool(ctx, "WHERE dp.plan = $1 AND dp.is_default = true", string(plan))
	if err != nil {
		if errors.Is(err, sql.ErrNoRows) {
			return nil, fmt.Errorf("dedicated pool for plan %s not configured", plan)
		}
		return nil, fmt.Errorf("load dedicated pool for plan %s: %w", plan, err)
	}
	return pool, nil
}

func (r *Repository) GetDedicatedPoolByCode(ctx context.Context, code string) (*DedicatedPool, error) {
	code = strings.TrimSpace(code)
	if code == "" {
		return nil, errors.New("dedicated pool code required")
	}
	pool, err := r.queryDedicatedPool(ctx, "WHERE dp.code = $1", code)
	if err != nil {
		if errors.Is(err, sql.ErrNoRows) {
			return nil, fmt.Errorf("dedicated pool %s not found", code)
		}
		return nil, fmt.Errorf("load dedicated pool %s: %w", code, err)
	}
	return pool, nil
}

const sandboxPoolSelect = `
SELECT sp.id, sp.code, sp.plan, sp.db_name, sp.is_default, sp.weight,
       di.id, di.code
  FROM tenant_sandbox_pool sp
  JOIN db_instance di ON di.id = sp.db_instance_id
`

func (r *Repository) querySandboxPool(ctx context.Context, clause string, args ...interface{}) (*SandboxPool, error) {
	db, err := r.OpenDBMaster(ctx)
	if err != nil {
		return nil, fmt.Errorf("open master db: %w", err)
	}
	query := sandboxPoolSelect + " " + clause + " ORDER BY sp.updated_at DESC LIMIT 1"
	row := db.QueryRow(query, args...)
	return scanSandboxPool(row)
}

func scanSandboxPool(row *sql.Row) (*SandboxPool, error) {
	var (
		pool SandboxPool
		plan string
	)
	if err := row.Scan(&pool.ID, &pool.Code, &plan, &pool.DBName, &pool.IsDefault, &pool.Weight, &pool.InstanceID, &pool.InstanceCode); err != nil {
		if errors.Is(err, sql.ErrNoRows) {
			return nil, sql.ErrNoRows
		}
		return nil, fmt.Errorf("scan sandbox pool: %w", err)
	}
	pool.Plan = Plan(plan)
	return &pool, nil
}

const dedicatedPoolSelect = `
SELECT dp.id, dp.code, dp.plan, dp.db_prefix, dp.is_default,
       di.id, di.code
  FROM tenant_dedicated_pool dp
  JOIN db_instance di ON di.id = dp.db_instance_id
`

func (r *Repository) queryDedicatedPool(ctx context.Context, clause string, args ...interface{}) (*DedicatedPool, error) {
	db, err := r.OpenDBMaster(ctx)
	if err != nil {
		return nil, fmt.Errorf("open master db: %w", err)
	}
	query := dedicatedPoolSelect + " " + clause + " ORDER BY dp.updated_at DESC LIMIT 1"
	row := db.QueryRow(query, args...)
	return scanDedicatedPool(row)
}

func scanDedicatedPool(row *sql.Row) (*DedicatedPool, error) {
	var (
		pool DedicatedPool
		plan string
	)
	if err := row.Scan(&pool.ID, &pool.Code, &plan, &pool.DBPrefix, &pool.IsDefault, &pool.InstanceID, &pool.InstanceCode); err != nil {
		if errors.Is(err, sql.ErrNoRows) {
			return nil, sql.ErrNoRows
		}
		return nil, fmt.Errorf("scan dedicated pool: %w", err)
	}
	pool.Plan = Plan(plan)
	return &pool, nil
}

type createTenantParams struct {
	Name       string
	Host       string
	Isolation  IsolationMode
	Plan       Plan
	DBName     string
	InstanceID int64
}

func (r *Repository) CreateTenant(ctx context.Context, tx *sql.Tx, params createTenantParams) (int64, error) {
	if tx == nil {
		return 0, errors.New("tx required")
	}

	var tenantID int64
	err := tx.QueryRowContext(ctx,
		`INSERT INTO tenant (name, isolation, status) VALUES ($1, $2, 'active') RETURNING id`,
		params.Name, string(params.Isolation),
	).Scan(&tenantID)
	if err != nil {
		return 0, fmt.Errorf("insert tenant: %w", err)
	}

	_, err = tx.ExecContext(ctx,
		`INSERT INTO tenant_domain (tenant_id, host) VALUES ($1, $2)`,
		tenantID, normalizeHost(params.Host),
	)
	if err != nil {
		return 0, fmt.Errorf("insert tenant_domain: %w", err)
	}

	_, err = tx.ExecContext(ctx,
		`INSERT INTO tenant_db (tenant_id, db_instance_id, db_name) VALUES ($1, $2, $3)`,
		tenantID, params.InstanceID, params.DBName,
	)
	if err != nil {
		return 0, fmt.Errorf("insert tenant_db: %w", err)
	}

	if err := r.insertPlanHistory(ctx, tx, tenantID, params.Plan); err != nil {
		return 0, err
	}

	return tenantID, nil
}

func (r *Repository) insertPlanHistory(ctx context.Context, tx *sql.Tx, tenantID int64, plan Plan) error {
	_, err := tx.ExecContext(ctx,
		`INSERT INTO tenant_plan_history (tenant_id, plan, valid_from) VALUES ($1, $2, now())`,
		tenantID, string(plan),
	)
	if err != nil {
		return fmt.Errorf("insert tenant_plan_history: %w", err)
	}
	return nil
}

type upgradeTenantParams struct {
	TenantID      int64
	NewPlan       Plan
	NewIsolation  IsolationMode
	NewDBName     string
	NewInstanceID int64
}

func (r *Repository) UpgradeTenant(ctx context.Context, tx *sql.Tx, params upgradeTenantParams) error {
	if tx == nil {
		return errors.New("tx required")
	}

	if _, err := tx.ExecContext(ctx,
		`UPDATE tenant SET isolation = $1 WHERE id = $2`,
		string(params.NewIsolation), params.TenantID,
	); err != nil {
		return fmt.Errorf("update tenant isolation: %w", err)
	}

	if _, err := tx.ExecContext(ctx,
		`UPDATE tenant_db SET db_instance_id = $1, db_name = $2 WHERE tenant_id = $3`,
		params.NewInstanceID, params.NewDBName, params.TenantID,
	); err != nil {
		return fmt.Errorf("update tenant_db: %w", err)
	}

	if _, err := tx.ExecContext(ctx,
		`UPDATE tenant_plan_history SET valid_to = now() WHERE tenant_id = $1 AND valid_to IS NULL`,
		params.TenantID,
	); err != nil {
		return fmt.Errorf("close existing plan: %w", err)
	}

	if err := r.insertPlanHistory(ctx, tx, params.TenantID, params.NewPlan); err != nil {
		return err
	}

	return nil
}

func (r *Repository) DeleteTenant(ctx context.Context, tenantID int64) error {
	db, err := r.Client.OpenDBMaster(ctx)
	if err != nil {
		return fmt.Errorf("open master db: %w", err)
	}
	if _, err := db.Exec(`DELETE FROM tenant WHERE id = $1`, tenantID); err != nil {
		return fmt.Errorf("delete tenant: %w", err)
	}
	return nil
}
