package tenantlist

import (
	"context"
	"fmt"
	"strings"
	"time"

	"dtriton.com/platform/backend/internal/platform/postgres"
)

type TenantRecord struct {
	ID           int64
	Name         string
	Host         string
	Plan         string
	Isolation    string
	Status       string
	DBName       string
	InstanceCode string
	UpdatedAt    time.Time
}

type Repository interface {
	GetTenantByID(ctx context.Context, tenantID int64) (*TenantRecord, error)
	ListTenants(ctx context.Context) ([]TenantRecord, error)
}

type repository struct {
	client *postgres.Client
}

func NewRepository(client *postgres.Client) Repository {
	return &repository{client: client}
}

func (r *repository) ListTenants(ctx context.Context) ([]TenantRecord, error) {
	db, err := r.client.OpenDBMaster(ctx)
	if err != nil {
		return nil, fmt.Errorf("tenant list: open master db: %w", err)
	}

	const query = `
SELECT
  tenant_id,
  tenant_name,
  host,
  plan,
  isolation,
  status,
  db_name,
  db_instance_code,
  updated_at
FROM (
  SELECT DISTINCT ON (tenant_id)
    tenant_id,
    COALESCE(tenant_name, '') AS tenant_name,
    COALESCE(host, '') AS host,
    COALESCE(plan::text, '') AS plan,
    COALESCE(isolation::text, '') AS isolation,
    COALESCE(status::text, '') AS status,
    COALESCE(db_name, '') AS db_name,
    COALESCE(db_instance_code, '') AS db_instance_code,
    updated_at
  FROM v_tenant_by_host
  ORDER BY tenant_id, lower(COALESCE(host, '')), updated_at DESC
) tenant_index
ORDER BY
  CASE WHEN COALESCE(btrim(tenant_name), '') = '' THEN 1 ELSE 0 END,
  lower(COALESCE(tenant_name, '')),
  lower(COALESCE(host, '')),
  updated_at DESC`

	rows, err := db.Query(query)
	if err != nil {
		return nil, fmt.Errorf("tenant list: query tenants: %w", err)
	}
	defer rows.Close()

	records := make([]TenantRecord, 0)
	for rows.Next() {
		var record TenantRecord
		if err := rows.Scan(
			&record.ID,
			&record.Name,
			&record.Host,
			&record.Plan,
			&record.Isolation,
			&record.Status,
			&record.DBName,
			&record.InstanceCode,
			&record.UpdatedAt,
		); err != nil {
			return nil, fmt.Errorf("tenant list: scan tenant: %w", err)
		}

		record.Name = strings.TrimSpace(record.Name)
		record.Host = strings.TrimSpace(record.Host)
		record.Plan = strings.TrimSpace(record.Plan)
		record.Isolation = strings.TrimSpace(record.Isolation)
		record.Status = strings.TrimSpace(record.Status)
		record.DBName = strings.TrimSpace(record.DBName)
		record.InstanceCode = strings.TrimSpace(record.InstanceCode)
		records = append(records, record)
	}
	if err := rows.Err(); err != nil {
		return nil, fmt.Errorf("tenant list: iterate tenants: %w", err)
	}

	return records, nil
}

func (r *repository) GetTenantByID(ctx context.Context, tenantID int64) (*TenantRecord, error) {
	if tenantID <= 0 {
		return nil, fmt.Errorf("tenant list: invalid tenant id")
	}

	db, err := r.client.OpenDBMaster(ctx)
	if err != nil {
		return nil, fmt.Errorf("tenant list: open master db: %w", err)
	}

	const query = `
SELECT
  tenant_id,
  tenant_name,
  host,
  plan,
  isolation,
  status,
  db_name,
  db_instance_code,
  updated_at
FROM (
  SELECT DISTINCT ON (tenant_id)
    tenant_id,
    COALESCE(tenant_name, '') AS tenant_name,
    COALESCE(host, '') AS host,
    COALESCE(plan::text, '') AS plan,
    COALESCE(isolation::text, '') AS isolation,
    COALESCE(status::text, '') AS status,
    COALESCE(db_name, '') AS db_name,
    COALESCE(db_instance_code, '') AS db_instance_code,
    updated_at
  FROM v_tenant_by_host
  WHERE tenant_id = $1
  ORDER BY tenant_id, lower(COALESCE(host, '')), updated_at DESC
) tenant_index`

	var record TenantRecord
	if err := db.QueryRow(query, tenantID).Scan(
		&record.ID,
		&record.Name,
		&record.Host,
		&record.Plan,
		&record.Isolation,
		&record.Status,
		&record.DBName,
		&record.InstanceCode,
		&record.UpdatedAt,
	); err != nil {
		return nil, fmt.Errorf("tenant list: query tenant by id: %w", err)
	}

	record.Name = strings.TrimSpace(record.Name)
	record.Host = strings.TrimSpace(record.Host)
	record.Plan = strings.TrimSpace(record.Plan)
	record.Isolation = strings.TrimSpace(record.Isolation)
	record.Status = strings.TrimSpace(record.Status)
	record.DBName = strings.TrimSpace(record.DBName)
	record.InstanceCode = strings.TrimSpace(record.InstanceCode)

	return &record, nil
}
