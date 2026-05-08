package platformstudionavigationbuilder

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

func (r *repository) GetConfig(ctx context.Context, tenant requestctx.TenantInfo, configKey string) (*ConfigRecord, error) {
	db, err := r.client.OpenDBTenant(ctx, tenant.DBName, tenant.DBInstanceCode)
	if err != nil {
		return nil, fmt.Errorf("navigation builder: open tenant db: %w", err)
	}

	tx, err := db.BeginTx(ctx, &sql.TxOptions{ReadOnly: true})
	if err != nil {
		return nil, fmt.Errorf("navigation builder: begin get config tx: %w", err)
	}
	defer func() { _ = tx.Rollback() }()

	record, err := loadConfigTx(ctx, tx, configKey, false)
	if err != nil {
		return nil, err
	}
	if err := tx.Commit(); err != nil {
		return nil, fmt.Errorf("navigation builder: commit get config tx: %w", err)
	}
	return record, nil
}

func (r *repository) SaveConfig(ctx context.Context, tenant requestctx.TenantInfo, record ConfigRecord, definition NavigationDefinition, expectedVersion *int64) (*ConfigRecord, error) {
	db, err := r.client.OpenDBTenant(ctx, tenant.DBName, tenant.DBInstanceCode)
	if err != nil {
		return nil, fmt.Errorf("navigation builder: open tenant db: %w", err)
	}

	tx, err := db.BeginTx(ctx, nil)
	if err != nil {
		return nil, fmt.Errorf("navigation builder: begin save config tx: %w", err)
	}
	defer func() { _ = tx.Rollback() }()

	configKey := strings.TrimSpace(record.ConfigKey)
	if configKey == "" {
		configKey = ConfigKeyDefault
	}

	current, err := loadConfigTx(ctx, tx, configKey, true)
	if err != nil {
		return nil, err
	}

	if current == nil {
		if expectedVersion != nil && *expectedVersion != 0 {
			return nil, ErrConflict
		}
		inserted, err := insertConfigTx(ctx, tx, record)
		if err != nil {
			return nil, err
		}
		if err := syncDerivedNavigationTx(ctx, tx, inserted.ConfigKey, definition); err != nil {
			return nil, err
		}
		if err := tx.Commit(); err != nil {
			return nil, fmt.Errorf("navigation builder: commit insert config tx: %w", err)
		}
		return inserted, nil
	}

	if expectedVersion != nil && *expectedVersion != current.Version {
		return nil, ErrConflict
	}

	updated, err := updateConfigTx(ctx, tx, record, current.Version)
	if err != nil {
		return nil, err
	}
	if err := syncDerivedNavigationTx(ctx, tx, updated.ConfigKey, definition); err != nil {
		return nil, err
	}
	if err := tx.Commit(); err != nil {
		return nil, fmt.Errorf("navigation builder: commit update config tx: %w", err)
	}
	return updated, nil
}

func (r *repository) ListAccessOptions(ctx context.Context, tenant requestctx.TenantInfo) (*AccessOptionsResponse, error) {
	db, err := r.client.OpenDBTenant(ctx, tenant.DBName, tenant.DBInstanceCode)
	if err != nil {
		return nil, fmt.Errorf("navigation builder: open tenant db: %w", err)
	}

	tx, err := db.BeginTx(ctx, &sql.TxOptions{ReadOnly: true})
	if err != nil {
		return nil, fmt.Errorf("navigation builder: begin access options tx: %w", err)
	}
	defer func() { _ = tx.Rollback() }()

	if err := setTenantContextTx(ctx, tx, tenant); err != nil {
		return nil, err
	}

	users, err := listAccessUsersTx(ctx, tx)
	if err != nil {
		return nil, err
	}
	companies, err := listAccessCompaniesTx(ctx, tx)
	if err != nil {
		return nil, err
	}
	companyTypes, err := listAccessCompanyTypesTx(ctx, tx)
	if err != nil {
		return nil, err
	}
	jobTypes, err := listAccessJobTypesTx(ctx, tx)
	if err != nil {
		return nil, err
	}

	if err := tx.Commit(); err != nil {
		return nil, fmt.Errorf("navigation builder: commit access options tx: %w", err)
	}

	return &AccessOptionsResponse{
		Users:        users,
		Companies:    companies,
		CompanyTypes: companyTypes,
		JobTypes:     jobTypes,
	}, nil
}

func (r *repository) ListAccessOptionPage(ctx context.Context, tenant requestctx.TenantInfo, req AccessOptionsPageRequest) (*AccessOptionsPageResponse, error) {
	db, err := r.client.OpenDBTenant(ctx, tenant.DBName, tenant.DBInstanceCode)
	if err != nil {
		return nil, fmt.Errorf("navigation builder: open tenant db: %w", err)
	}

	tx, err := db.BeginTx(ctx, &sql.TxOptions{ReadOnly: true})
	if err != nil {
		return nil, fmt.Errorf("navigation builder: begin access option page tx: %w", err)
	}
	defer func() { _ = tx.Rollback() }()

	if err := setTenantContextTx(ctx, tx, tenant); err != nil {
		return nil, err
	}

	page, err := listAccessOptionPageTx(ctx, tx, req)
	if err != nil {
		return nil, err
	}

	if err := tx.Commit(); err != nil {
		return nil, fmt.Errorf("navigation builder: commit access option page tx: %w", err)
	}
	return page, nil
}

func loadConfigTx(ctx context.Context, tx *sql.Tx, configKey string, forUpdate bool) (*ConfigRecord, error) {
	query := `
SELECT config_key,
       version,
       definition_json,
       COALESCE(updated_by, '') AS updated_by,
       updated_at
  FROM ps_navigation_config
 WHERE config_key = $1`
	if forUpdate {
		query += " FOR UPDATE"
	}

	var record ConfigRecord
	err := tx.QueryRowContext(ctx, query, strings.TrimSpace(configKey)).Scan(
		&record.ConfigKey,
		&record.Version,
		&record.DefinitionJSON,
		&record.UpdatedBy,
		&record.UpdatedAt,
	)
	if err != nil {
		if err == sql.ErrNoRows {
			return nil, nil
		}
		return nil, fmt.Errorf("navigation builder: load config: %w", err)
	}
	return &record, nil
}

func insertConfigTx(ctx context.Context, tx *sql.Tx, record ConfigRecord) (*ConfigRecord, error) {
	const query = `
INSERT INTO ps_navigation_config (config_key, version, definition_json, updated_by)
VALUES ($1, 1, $2::jsonb, NULLIF($3, ''))
RETURNING config_key,
          version,
          definition_json,
          COALESCE(updated_by, '') AS updated_by,
          updated_at`

	var inserted ConfigRecord
	err := tx.QueryRowContext(
		ctx,
		query,
		configKeyOrDefault(record.ConfigKey),
		record.DefinitionJSON,
		strings.TrimSpace(record.UpdatedBy),
	).Scan(
		&inserted.ConfigKey,
		&inserted.Version,
		&inserted.DefinitionJSON,
		&inserted.UpdatedBy,
		&inserted.UpdatedAt,
	)
	if err != nil {
		return nil, fmt.Errorf("navigation builder: insert config: %w", err)
	}
	return &inserted, nil
}

func updateConfigTx(ctx context.Context, tx *sql.Tx, record ConfigRecord, currentVersion int64) (*ConfigRecord, error) {
	const query = `
UPDATE ps_navigation_config
   SET version = version + 1,
       definition_json = $2::jsonb,
       updated_by = NULLIF($3, '')
 WHERE config_key = $1
   AND version = $4
RETURNING config_key,
          version,
          definition_json,
          COALESCE(updated_by, '') AS updated_by,
          updated_at`

	var updated ConfigRecord
	err := tx.QueryRowContext(
		ctx,
		query,
		configKeyOrDefault(record.ConfigKey),
		record.DefinitionJSON,
		strings.TrimSpace(record.UpdatedBy),
		currentVersion,
	).Scan(
		&updated.ConfigKey,
		&updated.Version,
		&updated.DefinitionJSON,
		&updated.UpdatedBy,
		&updated.UpdatedAt,
	)
	if err != nil {
		if err == sql.ErrNoRows {
			return nil, ErrConflict
		}
		return nil, fmt.Errorf("navigation builder: update config: %w", err)
	}
	return &updated, nil
}

func configKeyOrDefault(configKey string) string {
	configKey = strings.TrimSpace(configKey)
	if configKey == "" {
		return ConfigKeyDefault
	}
	return configKey
}

func setTenantContextTx(ctx context.Context, tx *sql.Tx, tenant requestctx.TenantInfo) error {
	tenantID, err := strconv.ParseInt(strings.TrimSpace(tenant.ID), 10, 64)
	if err != nil || tenantID <= 0 {
		return ErrTenantMissing
	}
	if _, err := tx.ExecContext(ctx, `SELECT set_config('app.tenant_id', $1, true)`, strconv.FormatInt(tenantID, 10)); err != nil {
		return fmt.Errorf("navigation builder: set tenant context: %w", err)
	}
	return nil
}

func listAccessUsersTx(ctx context.Context, tx *sql.Tx) ([]AccessRecipientOption, error) {
	const query = `
SELECT _id::text,
       COALESCE(
         NULLIF(btrim(concat_ws(' ', first_name, last_name)), ''),
         NULLIF(email::text, ''),
         _id::text
       ) AS label,
       COALESCE(
         NULLIF(concat_ws(' · ', NULLIF(email::text, ''), NULLIF(company__label, ''), NULLIF(job_type__label, '')), ''),
         ''
       ) AS subtitle
  FROM vw_users
 WHERE active IS TRUE
 ORDER BY label ASC
 LIMIT 500`

	return scanAccessOptionsTx(ctx, tx, query, "users")
}

func listAccessCompaniesTx(ctx context.Context, tx *sql.Tx) ([]AccessRecipientOption, error) {
	const query = `
SELECT _id::text,
       name AS label,
       COALESCE(NULLIF(company_type__label, ''), '') AS subtitle
  FROM vw_company
 WHERE active IS TRUE
 ORDER BY label ASC
 LIMIT 500`

	return scanAccessOptionsTx(ctx, tx, query, "companies")
}

func listAccessCompanyTypesTx(ctx context.Context, tx *sql.Tx) ([]AccessRecipientOption, error) {
	const query = `
SELECT id::text,
       name AS label,
       COALESCE(NULLIF(risk, ''), '') AS subtitle
  FROM companytype
 ORDER BY label ASC
 LIMIT 500`

	return scanAccessOptionsTx(ctx, tx, query, "company types")
}

func listAccessJobTypesTx(ctx context.Context, tx *sql.Tx) ([]AccessRecipientOption, error) {
	const query = `
SELECT id::text,
       name AS label,
       '' AS subtitle
  FROM jobtype
 WHERE active IS TRUE
 ORDER BY label ASC
 LIMIT 500`

	return scanAccessOptionsTx(ctx, tx, query, "job types")
}

func scanAccessOptionsTx(ctx context.Context, tx *sql.Tx, query string, label string) ([]AccessRecipientOption, error) {
	rows, err := tx.QueryContext(ctx, query)
	if err != nil {
		return nil, fmt.Errorf("navigation builder: query access %s: %w", label, err)
	}
	defer func() { _ = rows.Close() }()

	options := []AccessRecipientOption{}
	for rows.Next() {
		var option AccessRecipientOption
		if err := rows.Scan(&option.ID, &option.Label, &option.Subtitle); err != nil {
			return nil, fmt.Errorf("navigation builder: scan access %s: %w", label, err)
		}
		option.ID = strings.TrimSpace(option.ID)
		option.Label = strings.TrimSpace(option.Label)
		option.Subtitle = strings.TrimSpace(option.Subtitle)
		if option.ID == "" || option.Label == "" {
			continue
		}
		options = append(options, option)
	}
	if err := rows.Err(); err != nil {
		return nil, fmt.Errorf("navigation builder: iterate access %s: %w", label, err)
	}
	return options, nil
}

func listAccessOptionPageTx(ctx context.Context, tx *sql.Tx, req AccessOptionsPageRequest) (*AccessOptionsPageResponse, error) {
	source, label, err := accessOptionPageSource(req.Category)
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
  SELECT id, label, subtitle, fields
    FROM source
   WHERE %s
)
SELECT id,
       label,
       subtitle,
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
		return nil, fmt.Errorf("navigation builder: query access %s page: %w", label, err)
	}
	defer func() { _ = rows.Close() }()

	items := []AccessRecipientOption{}
	total := 0
	for rows.Next() {
		var option AccessRecipientOption
		var fieldsRaw string
		if err := rows.Scan(&option.ID, &option.Label, &option.Subtitle, &fieldsRaw, &total); err != nil {
			return nil, fmt.Errorf("navigation builder: scan access %s page: %w", label, err)
		}
		option.ID = strings.TrimSpace(option.ID)
		option.Label = strings.TrimSpace(option.Label)
		option.Subtitle = strings.TrimSpace(option.Subtitle)
		option.Fields = normalizeAccessOptionFields(fieldsRaw)
		if option.ID == "" || option.Label == "" {
			continue
		}
		items = append(items, option)
	}
	if err := rows.Err(); err != nil {
		return nil, fmt.Errorf("navigation builder: iterate access %s page: %w", label, err)
	}

	return &AccessOptionsPageResponse{
		Category: req.Category,
		HasMore:  req.Page*req.PageSize < total,
		Items:    items,
		Page:     req.Page,
		PageSize: req.PageSize,
		Total:    total,
	}, nil
}

func accessOptionPageSource(category string) (string, string, error) {
	switch category {
	case "users":
		return `
SELECT _id::text AS id,
       COALESCE(
         NULLIF(btrim(concat_ws(' ', first_name, last_name)), ''),
         NULLIF(email::text, ''),
         _id::text
       ) AS label,
       COALESCE(
         NULLIF(concat_ws(' · ', NULLIF(email::text, ''), NULLIF(company__label, ''), NULLIF(job_type__label, '')), ''),
         ''
       ) AS subtitle,
       jsonb_strip_nulls(jsonb_build_object(
         'email', NULLIF(email::text, ''),
         'company', NULLIF(company__label, ''),
         'jobType', NULLIF(job_type__label, '')
       )) AS fields,
       concat_ws(' ', first_name, last_name, email::text, company__label, job_type__label) AS search_text
  FROM vw_users
 WHERE active IS TRUE`, "users", nil
	case "companies":
		return `
SELECT _id::text AS id,
       name AS label,
       COALESCE(NULLIF(company_type__label, ''), '') AS subtitle,
       jsonb_strip_nulls(jsonb_build_object(
         'type', NULLIF(company_type__label, ''),
         'email', NULLIF(email::text, ''),
         'phone', NULLIF(phone, ''),
         'contact', NULLIF(contact_name, '')
       )) AS fields,
       concat_ws(' ', name, company_type__label, email::text, phone, contact_name) AS search_text
  FROM vw_company
 WHERE active IS TRUE`, "companies", nil
	case "companyTypes":
		return `
SELECT id::text AS id,
       name AS label,
       COALESCE(NULLIF(risk, ''), '') AS subtitle,
       jsonb_strip_nulls(jsonb_build_object(
         'risk', NULLIF(risk, '')
       )) AS fields,
       concat_ws(' ', name, risk) AS search_text
  FROM companytype`, "company types", nil
	case "jobtypes":
		return `
SELECT id::text AS id,
       name AS label,
       '' AS subtitle,
       jsonb_build_object() AS fields,
       name AS search_text
  FROM jobtype
 WHERE active IS TRUE`, "job types", nil
	default:
		return "", "", ErrInvalidAccessOptions
	}
}

func normalizeAccessOptionFields(raw string) map[string]string {
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
