package dictionarysvc

import (
	"context"
	"database/sql"
	"encoding/json"
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

func (r *repository) ListOptions(ctx context.Context, tenant requestctx.TenantInfo, req OptionsRequest) (*OptionsResponse, error) {
	db, err := r.client.OpenDBTenant(ctx, tenant.DBName, tenant.DBInstanceCode)
	if err != nil {
		return nil, fmt.Errorf("dictionary: open tenant db: %w", err)
	}

	tx, err := db.BeginTx(ctx, &sql.TxOptions{ReadOnly: true})
	if err != nil {
		return nil, fmt.Errorf("dictionary: begin options tx: %w", err)
	}
	defer func() { _ = tx.Rollback() }()

	if err := setTenantContextTx(ctx, tx, tenant); err != nil {
		return nil, err
	}

	response, err := listOptionsTx(ctx, tx, req)
	if err != nil {
		return nil, err
	}

	if err := tx.Commit(); err != nil {
		return nil, fmt.Errorf("dictionary: commit options tx: %w", err)
	}
	return response, nil
}

func setTenantContextTx(ctx context.Context, tx *sql.Tx, tenant requestctx.TenantInfo) error {
	tenantID, err := strconv.ParseInt(strings.TrimSpace(tenant.ID), 10, 64)
	if err != nil || tenantID <= 0 {
		return ErrTenantMissing
	}
	if _, err := tx.ExecContext(ctx, `SELECT set_config('app.tenant_id', $1, true)`, strconv.FormatInt(tenantID, 10)); err != nil {
		return fmt.Errorf("dictionary: set tenant context: %w", err)
	}
	return nil
}

func listOptionsTx(ctx context.Context, tx *sql.Tx, req OptionsRequest) (*OptionsResponse, error) {
	source, label, err := optionsSource(req.Dictionary)
	if err != nil {
		return nil, err
	}

	conditions := []string{"TRUE"}
	args := []any{}
	if req.Search != "" {
		args = append(args, "%"+strings.ToLower(req.Search)+"%")
		conditions = append(conditions, fmt.Sprintf("LOWER(search_text) LIKE $%d", len(args)))
	}
	if len(req.IDs) > 0 {
		args = append(args, pq.Array(req.IDs))
		conditions = append(conditions, fmt.Sprintf("id = ANY($%d)", len(args)))
	}

	args = append(args, req.PageSize)
	limitArg := len(args)
	args = append(args, (req.Page-1)*req.PageSize)
	offsetArg := len(args)

	query := fmt.Sprintf(`
WITH source AS (
%s
),
filtered AS (
  SELECT id, label, description, fields
    FROM source
   WHERE %s
)
SELECT id,
       label,
       description,
       fields::text,
       COUNT(*) OVER() AS total
  FROM filtered
 ORDER BY lower(label), id
 LIMIT $%d OFFSET $%d`,
		source,
		strings.Join(conditions, " AND "),
		limitArg,
		offsetArg,
	)

	rows, err := tx.QueryContext(ctx, query, args...)
	if err != nil {
		return nil, fmt.Errorf("dictionary: query %s options: %w", label, err)
	}
	defer func() { _ = rows.Close() }()

	items := []Option{}
	total := 0
	for rows.Next() {
		var item Option
		var fieldsRaw string
		if err := rows.Scan(&item.ID, &item.Label, &item.Description, &fieldsRaw, &total); err != nil {
			return nil, fmt.Errorf("dictionary: scan %s options: %w", label, err)
		}
		item.ID = strings.TrimSpace(item.ID)
		item.Value = item.ID
		item.Label = strings.TrimSpace(item.Label)
		item.Description = strings.TrimSpace(item.Description)
		item.Fields = normalizeOptionFields(fieldsRaw)
		if item.ID == "" || item.Label == "" {
			continue
		}
		items = append(items, item)
	}
	if err := rows.Err(); err != nil {
		return nil, fmt.Errorf("dictionary: iterate %s options: %w", label, err)
	}

	return &OptionsResponse{
		Dictionary: req.Dictionary,
		HasMore:    req.Page*req.PageSize < total,
		Items:      items,
		Page:       req.Page,
		PageSize:   req.PageSize,
		Total:      total,
	}, nil
}

func optionsSource(dictionary string) (string, string, error) {
	switch dictionary {
	case "companies":
		return `
SELECT _id::text AS id,
       name AS label,
       COALESCE(NULLIF(concat_ws(' · ', NULLIF(company_type__label, ''), NULLIF(city, ''), NULLIF(state__label, '')), ''), '') AS description,
       jsonb_strip_nulls(jsonb_build_object(
         'type', NULLIF(company_type__label, ''),
         'city', NULLIF(city, ''),
         'state', NULLIF(state__label, ''),
         'email', NULLIF(email::text, ''),
         'phone', NULLIF(phone, ''),
         'contact', NULLIF(contact_name, '')
       )) AS fields,
       concat_ws(' ', name, company_type__label, city, state__label, email::text, phone, contact_name) AS search_text
  FROM vw_company
 WHERE active IS TRUE`, "companies", nil
	case "companyTypes":
		return `
SELECT id::text AS id,
       name AS label,
       COALESCE(NULLIF(risk, ''), '') AS description,
       jsonb_strip_nulls(jsonb_build_object(
         'risk', NULLIF(risk, '')
       )) AS fields,
       concat_ws(' ', name, risk) AS search_text
  FROM companytype`, "company types", nil
	case "contacts":
		return `
SELECT _id::text AS id,
       COALESCE(
         NULLIF(btrim(concat_ws(' ', first_name, last_name)), ''),
         NULLIF(email::text, ''),
         _id::text
       ) AS label,
       COALESCE(
         NULLIF(concat_ws(' · ', NULLIF(employee_number, ''), NULLIF(job_type__label, ''), NULLIF(company__label, ''), NULLIF(email::text, '')), ''),
         ''
       ) AS description,
       jsonb_strip_nulls(jsonb_build_object(
         'employeeNumber', NULLIF(employee_number, ''),
         'jobType', NULLIF(job_type__label, ''),
         'company', NULLIF(company__label, ''),
         'email', NULLIF(email::text, ''),
         'phone', NULLIF(phone, '')
       )) AS fields,
       concat_ws(' ', first_name, last_name, employee_number, email::text, company__label, job_type__label, phone) AS search_text
  FROM vw_users
 WHERE active IS TRUE`, "contacts", nil
	case "jobtypes":
		return `
SELECT id::text AS id,
       name AS label,
       '' AS description,
       jsonb_build_object() AS fields,
       name AS search_text
  FROM jobtype
 WHERE active IS TRUE`, "job types", nil
	case "projects":
		return `
SELECT _id::text AS id,
       COALESCE(
         NULLIF(concat_ws(', ', NULLIF(project_number, ''), NULLIF(name, '')), ''),
         _id::text
       ) AS label,
       COALESCE(
         NULLIF(concat_ws(' · ', NULLIF(city, ''), NULLIF(company__label, ''), NULLIF(status, '')), ''),
         ''
       ) AS description,
       jsonb_strip_nulls(jsonb_build_object(
         'projectNumber', NULLIF(project_number, ''),
         'name', NULLIF(name, ''),
         'company', NULLIF(company__label, ''),
         'status', NULLIF(status, ''),
         'city', NULLIF(city, '')
       )) AS fields,
       concat_ws(' ', project_number, name, city, company__label, status) AS search_text
  FROM vw_projects
 WHERE active IS TRUE`, "projects", nil
	default:
		return "", "", ErrInvalidDictionary
	}
}

func normalizeOptionFields(raw string) map[string]string {
	values := map[string]string{}
	if strings.TrimSpace(raw) == "" {
		return values
	}
	var decoded map[string]any
	if err := json.Unmarshal([]byte(raw), &decoded); err != nil {
		return values
	}
	for key, value := range decoded {
		text, ok := value.(string)
		if !ok {
			continue
		}
		text = strings.TrimSpace(text)
		if text != "" {
			values[key] = text
		}
	}
	if len(values) == 0 {
		return nil
	}
	return values
}
