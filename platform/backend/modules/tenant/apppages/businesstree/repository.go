package businesstree

import (
	"context"
	"database/sql"
	"errors"
	"fmt"
	"strconv"
	"strings"

	"dtriton.com/platform/backend/internal/platform/httpx/requestctx"
	"dtriton.com/platform/backend/internal/platform/postgres"
)

type repository struct {
	client *postgres.Client
}

func NewRepository(client *postgres.Client) Repository {
	return &repository{client: client}
}

func (r *repository) GetCompany(ctx context.Context, tenant requestctx.TenantInfo, companyID int64) (*CompanyRecord, error) {
	var record *CompanyRecord
	err := r.readTx(ctx, tenant, func(tx *sql.Tx) error {
		const query = `
SELECT c.id,
       COALESCE(NULLIF(btrim(c.name), ''), 'Company ' || c.id::text) AS name,
       COALESCE(NULLIF(btrim(ct.name), ''), '') AS type_name,
       (SELECT COUNT(*) FROM company child WHERE child.active = true AND child.main_company_id = c.id) AS child_company_count,
       (SELECT COUNT(*) FROM users u WHERE u.active = true AND u.company_id = c.id) AS contact_count,
       (SELECT COUNT(*) FROM projects p WHERE p.active = true AND p.company_id = c.id) AS project_count
  FROM company c
  LEFT JOIN companytype ct ON ct.id = c.company_type_id
 WHERE c.active = true
   AND c.id = $1
 LIMIT 1`
		var next CompanyRecord
		if err := tx.QueryRowContext(ctx, query, companyID).Scan(
			&next.ID,
			&next.Name,
			&next.TypeName,
			&next.ChildCompanyCount,
			&next.ContactCount,
			&next.ProjectCount,
		); err != nil {
			if errors.Is(err, sql.ErrNoRows) {
				return nil
			}
			return fmt.Errorf("business tree: get company: %w", err)
		}
		record = &next
		return nil
	})
	if err != nil {
		return nil, err
	}
	return record, nil
}

func (r *repository) ListRootCompanies(ctx context.Context, tenant requestctx.TenantInfo) ([]CompanyRecord, error) {
	return r.listCompanies(ctx, tenant, nil)
}

func (r *repository) ListChildCompanies(ctx context.Context, tenant requestctx.TenantInfo, companyID int64) ([]CompanyRecord, error) {
	return r.listCompanies(ctx, tenant, &companyID)
}

func (r *repository) ListContacts(ctx context.Context, tenant requestctx.TenantInfo, companyID int64) ([]ContactRecord, error) {
	records := make([]ContactRecord, 0)
	err := r.readTx(ctx, tenant, func(tx *sql.Tx) error {
		const query = `
SELECT u.id,
       COALESCE(NULLIF(btrim(jt.name), ''), '') AS job_type_name,
       COALESCE(
         NULLIF(btrim(concat_ws(' ', NULLIF(btrim(u.first_name), ''), NULLIF(btrim(u.last_name), ''))), ''),
         NULLIF(btrim(u.email::text), ''),
         NULLIF(btrim(u.username), ''),
         'User ' || u.id::text
       ) AS display_name
  FROM users u
  LEFT JOIN jobtype jt ON jt.id = u.job_type_id
 WHERE u.active = true
   AND u.company_id = $1
 ORDER BY lower(COALESCE(NULLIF(btrim(jt.name), ''), '')),
          lower(COALESCE(
            NULLIF(btrim(concat_ws(' ', NULLIF(btrim(u.first_name), ''), NULLIF(btrim(u.last_name), ''))), ''),
            NULLIF(btrim(u.email::text), ''),
            NULLIF(btrim(u.username), ''),
            'User ' || u.id::text
          )),
          u.id`
		rows, err := tx.QueryContext(ctx, query, companyID)
		if err != nil {
			return fmt.Errorf("business tree: list contacts: %w", err)
		}
		defer rows.Close()

		for rows.Next() {
			var record ContactRecord
			if err := rows.Scan(&record.ID, &record.JobTypeName, &record.DisplayName); err != nil {
				return fmt.Errorf("business tree: scan contact: %w", err)
			}
			records = append(records, record)
		}
		if err := rows.Err(); err != nil {
			return fmt.Errorf("business tree: iterate contacts: %w", err)
		}
		return nil
	})
	if err != nil {
		return nil, err
	}
	return records, nil
}

func (r *repository) ListProjects(ctx context.Context, tenant requestctx.TenantInfo, companyID int64) ([]ProjectRecord, error) {
	records := make([]ProjectRecord, 0)
	err := r.readTx(ctx, tenant, func(tx *sql.Tx) error {
		const query = `
SELECT p.id,
       COALESCE(NULLIF(btrim(p.name), ''), 'Project ' || p.id::text) AS name,
       COALESCE(NULLIF(btrim(p.project_number), ''), '') AS project_number
  FROM projects p
 WHERE p.active = true
   AND p.company_id = $1
 ORDER BY lower(COALESCE(NULLIF(btrim(p.project_number), ''), '')),
          lower(COALESCE(NULLIF(btrim(p.name), ''), 'Project ' || p.id::text)),
          p.id`
		rows, err := tx.QueryContext(ctx, query, companyID)
		if err != nil {
			return fmt.Errorf("business tree: list projects: %w", err)
		}
		defer rows.Close()

		for rows.Next() {
			var record ProjectRecord
			if err := rows.Scan(&record.ID, &record.Name, &record.ProjectNumber); err != nil {
				return fmt.Errorf("business tree: scan project: %w", err)
			}
			records = append(records, record)
		}
		if err := rows.Err(); err != nil {
			return fmt.Errorf("business tree: iterate projects: %w", err)
		}
		return nil
	})
	if err != nil {
		return nil, err
	}
	return records, nil
}

func (r *repository) listCompanies(ctx context.Context, tenant requestctx.TenantInfo, parentCompanyID *int64) ([]CompanyRecord, error) {
	records := make([]CompanyRecord, 0)
	err := r.readTx(ctx, tenant, func(tx *sql.Tx) error {
		query := `
SELECT c.id,
       COALESCE(NULLIF(btrim(c.name), ''), 'Company ' || c.id::text) AS name,
       COALESCE(NULLIF(btrim(ct.name), ''), '') AS type_name,
       (SELECT COUNT(*) FROM company child WHERE child.active = true AND child.main_company_id = c.id) AS child_company_count,
       (SELECT COUNT(*) FROM users u WHERE u.active = true AND u.company_id = c.id) AS contact_count,
       (SELECT COUNT(*) FROM projects p WHERE p.active = true AND p.company_id = c.id) AS project_count
  FROM company c
  LEFT JOIN companytype ct ON ct.id = c.company_type_id
 WHERE c.active = true`
		args := []any{}
		if parentCompanyID == nil {
			query += `
   AND c.main_company_id IS NULL`
		} else {
			query += `
   AND c.main_company_id = $1`
			args = append(args, *parentCompanyID)
		}
		query += `
 ORDER BY lower(COALESCE(NULLIF(btrim(ct.name), ''), '')),
          lower(COALESCE(NULLIF(btrim(c.name), ''), 'Company ' || c.id::text)),
          c.id`

		rows, err := tx.QueryContext(ctx, query, args...)
		if err != nil {
			return fmt.Errorf("business tree: list companies: %w", err)
		}
		defer rows.Close()

		for rows.Next() {
			var record CompanyRecord
			if err := rows.Scan(
				&record.ID,
				&record.Name,
				&record.TypeName,
				&record.ChildCompanyCount,
				&record.ContactCount,
				&record.ProjectCount,
			); err != nil {
				return fmt.Errorf("business tree: scan company: %w", err)
			}
			records = append(records, record)
		}
		if err := rows.Err(); err != nil {
			return fmt.Errorf("business tree: iterate companies: %w", err)
		}
		return nil
	})
	if err != nil {
		return nil, err
	}
	return records, nil
}

func (r *repository) readTx(ctx context.Context, tenant requestctx.TenantInfo, fn func(*sql.Tx) error) error {
	if r == nil || r.client == nil {
		return fmt.Errorf("business tree repository is not configured")
	}
	db, err := r.client.OpenDBTenant(ctx, tenant.DBName, tenant.DBInstanceCode)
	if err != nil {
		return fmt.Errorf("business tree: open tenant db: %w", err)
	}

	tx, err := db.BeginTx(ctx, &sql.TxOptions{ReadOnly: true})
	if err != nil {
		return fmt.Errorf("business tree: begin read tx: %w", err)
	}
	defer func() { _ = tx.Rollback() }()

	if err := setTenantContext(ctx, tx, tenant); err != nil {
		return err
	}
	if err := fn(tx); err != nil {
		return err
	}
	if err := tx.Commit(); err != nil {
		return fmt.Errorf("business tree: commit read tx: %w", err)
	}
	return nil
}

func setTenantContext(ctx context.Context, tx *sql.Tx, tenant requestctx.TenantInfo) error {
	tenantID, err := strconv.ParseInt(strings.TrimSpace(tenant.ID), 10, 64)
	if err != nil || tenantID <= 0 {
		return ErrTenantMissing
	}
	if _, err := tx.ExecContext(ctx, `SELECT set_config('app.tenant_id', $1, true)`, strconv.FormatInt(tenantID, 10)); err != nil {
		return fmt.Errorf("business tree: set tenant context: %w", err)
	}
	return nil
}
