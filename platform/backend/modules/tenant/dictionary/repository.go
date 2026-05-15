package dictionary

import (
	"context"
	"database/sql"
	"encoding/json"
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

	var response *OptionsResponse
	if req.SourceModel != "" {
		response, err = listGenericOptionsTx(ctx, tx, req)
	} else {
		response, err = listOptionsTx(ctx, tx, req)
	}
	if err != nil {
		return nil, err
	}

	if err := tx.Commit(); err != nil {
		return nil, fmt.Errorf("dictionary: commit options tx: %w", err)
	}
	return response, nil
}

type modelDefinition struct {
	DataSchema struct {
		RootScope modelRootScope `json:"rootScope"`
	} `json:"dataSchema"`
}

type modelRootScope struct {
	Fields  []modelField      `json:"fields"`
	Runtime modelScopeRuntime `json:"runtime"`
}

type modelField struct {
	DisplayName string            `json:"displayName"`
	ID          string            `json:"id"`
	Label       string            `json:"label"`
	Runtime     modelFieldRuntime `json:"runtime"`
	StorageKey  string            `json:"storageKey"`
}

type modelFieldRuntime struct {
	SourceColumnName string `json:"sourceColumnName"`
}

type modelScopeRuntime struct {
	DataViewName          string `json:"dataViewName"`
	SourceCreatedAtColumn string `json:"sourceCreatedAtColumn"`
	SourceGUIDColumn      string `json:"sourceGuidColumn"`
	SourceIDColumn        string `json:"sourceIdColumn"`
	SourceUpdatedAtColumn string `json:"sourceUpdatedAtColumn"`
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
	source, label, filterColumns, err := optionsSource(req.Dictionary)
	if err != nil {
		return nil, err
	}

	conditions := []string{"TRUE"}
	args := []any{}
	for _, filter := range req.Filters {
		clause, err := genericFilterClause(filter, filterColumns, &args)
		if err != nil {
			return nil, err
		}
		if clause != "" {
			conditions = append(conditions, clause)
		}
	}
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

func listGenericOptionsTx(ctx context.Context, tx *sql.Tx, req OptionsRequest) (*OptionsResponse, error) {
	model, err := loadModelDefinitionTx(ctx, tx, req.SourceModel)
	if err != nil {
		return nil, err
	}

	source := model.DataSchema.RootScope
	dataViewName := strings.TrimSpace(source.Runtime.DataViewName)
	if dataViewName == "" {
		return nil, ErrInvalidDictionary
	}

	fieldColumns := buildModelFieldColumnMap(source)
	defaultField := defaultModelDisplayField(source)
	storedValueField := chooseRequestField(req.StoredValueField, "doc_id")
	storedValueColumn, ok := fieldColumns[storedValueField]
	if !ok {
		return nil, ErrInvalidDictionary
	}

	displayFields := req.DisplayFields
	if len(displayFields) == 0 {
		displayFields = []string{defaultField}
	}
	displayColumns, err := resolveModelFieldColumns(displayFields, fieldColumns)
	if err != nil {
		return nil, err
	}

	searchFields := req.SearchFields
	if len(searchFields) == 0 {
		searchFields = displayFields
	}
	searchColumns, err := resolveModelFieldColumns(searchFields, fieldColumns)
	if err != nil {
		return nil, err
	}

	sortField := chooseRequestField(req.SortField, displayFields[0])
	sortColumn, ok := fieldColumns[sortField]
	if !ok {
		return nil, ErrInvalidDictionary
	}

	args := []any{}
	sourceConditions := []string{"TRUE"}
	for _, filter := range req.Filters {
		clause, err := genericFilterClause(filter, fieldColumns, &args)
		if err != nil {
			return nil, err
		}
		if clause != "" {
			sourceConditions = append(sourceConditions, clause)
		}
	}

	outerConditions := []string{"TRUE"}
	if req.Search != "" {
		args = append(args, "%"+strings.ToLower(req.Search)+"%")
		outerConditions = append(outerConditions, fmt.Sprintf("LOWER(search_text) LIKE $%d", len(args)))
	}
	if len(req.IDs) > 0 {
		args = append(args, pq.Array(req.IDs))
		outerConditions = append(outerConditions, fmt.Sprintf("id = ANY($%d)", len(args)))
	}

	args = append(args, req.PageSize)
	limitArg := len(args)
	args = append(args, (req.Page-1)*req.PageSize)
	offsetArg := len(args)

	query := fmt.Sprintf(`
WITH source AS (
  SELECT COALESCE(%s::text, '') AS id,
         COALESCE(NULLIF(%s, ''), COALESCE(%s::text, '')) AS label,
         '' AS description,
         %s AS fields,
         concat_ws(' ', %s) AS search_text,
         COALESCE(%s::text, '') AS sort_text
    FROM %s
   WHERE %s
),
filtered AS (
  SELECT id, label, description, fields, sort_text
    FROM source
   WHERE %s
)
SELECT id,
       label,
       description,
       fields::text,
       COUNT(*) OVER() AS total
  FROM filtered
 ORDER BY lower(sort_text), lower(label), id
 LIMIT $%d OFFSET $%d`,
		quoteIdentifier(storedValueColumn),
		concatTextExpression(displayColumns, " "),
		quoteIdentifier(storedValueColumn),
		jsonFieldsExpression(unionFieldColumns(displayColumns, searchColumns, []string{sortColumn, storedValueColumn})),
		concatColumns(searchColumns),
		quoteIdentifier(sortColumn),
		qualifiedIdentifier(dataViewName),
		strings.Join(sourceConditions, " AND "),
		strings.Join(outerConditions, " AND "),
		limitArg,
		offsetArg,
	)

	rows, err := tx.QueryContext(ctx, query, args...)
	if err != nil {
		return nil, fmt.Errorf("dictionary: query model %s options: %w", req.SourceModel, err)
	}
	defer func() { _ = rows.Close() }()

	items := []Option{}
	total := 0
	for rows.Next() {
		var item Option
		var fieldsRaw string
		if err := rows.Scan(&item.ID, &item.Label, &item.Description, &fieldsRaw, &total); err != nil {
			return nil, fmt.Errorf("dictionary: scan model %s options: %w", req.SourceModel, err)
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
		return nil, fmt.Errorf("dictionary: iterate model %s options: %w", req.SourceModel, err)
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

func loadModelDefinitionTx(ctx context.Context, tx *sql.Tx, modelID string) (*modelDefinition, error) {
	const query = `
SELECT definition_json
  FROM ps_model
 WHERE model_id = $1
    OR model_key = $1
 LIMIT 1`

	var raw []byte
	if err := tx.QueryRowContext(ctx, query, modelID).Scan(&raw); err != nil {
		if errors.Is(err, sql.ErrNoRows) {
			return nil, ErrInvalidDictionary
		}
		return nil, fmt.Errorf("dictionary: load model %s definition: %w", modelID, err)
	}

	var out modelDefinition
	if err := json.Unmarshal(raw, &out); err != nil {
		return nil, fmt.Errorf("dictionary: decode model %s definition: %w", modelID, err)
	}
	return &out, nil
}

func buildModelFieldColumnMap(scope modelRootScope) map[string]string {
	fields := map[string]string{
		"_guid":    "_guid",
		"_id":      "_id",
		"doc_guid": "_guid",
		"doc_id":   "_id",
		"guid":     "_guid",
	}
	if strings.TrimSpace(scope.Runtime.SourceGUIDColumn) != "" {
		guidColumn := strings.TrimSpace(scope.Runtime.SourceGUIDColumn)
		fields["_guid"] = guidColumn
		fields["doc_guid"] = guidColumn
		fields["guid"] = guidColumn
	}
	if strings.TrimSpace(scope.Runtime.SourceCreatedAtColumn) != "" {
		fields["_created_at"] = "_created_at"
		fields["created_at"] = "_created_at"
	}
	if strings.TrimSpace(scope.Runtime.SourceUpdatedAtColumn) != "" {
		fields["_updated_at"] = "_updated_at"
		fields["updated_at"] = "_updated_at"
	}

	for _, field := range scope.Fields {
		storageKey := strings.TrimSpace(field.StorageKey)
		if storageKey == "" {
			storageKey = strings.TrimSpace(field.ID)
		}
		if storageKey == "" {
			continue
		}
		fields[storageKey] = storageKey
		if id := strings.TrimSpace(field.ID); id != "" {
			fields[id] = storageKey
		}
		if sourceColumnName := strings.TrimSpace(field.Runtime.SourceColumnName); sourceColumnName != "" {
			fields[sourceColumnName] = storageKey
		}
	}
	return fields
}

func defaultModelDisplayField(scope modelRootScope) string {
	for _, field := range scope.Fields {
		if storageKey := strings.TrimSpace(field.StorageKey); storageKey != "" {
			return storageKey
		}
		if id := strings.TrimSpace(field.ID); id != "" {
			return id
		}
	}
	return "doc_id"
}

func resolveModelFieldColumns(fields []string, fieldColumns map[string]string) ([]string, error) {
	out := make([]string, 0, len(fields))
	for _, field := range fields {
		key := strings.TrimSpace(field)
		if key == "" {
			continue
		}
		column, ok := fieldColumns[key]
		if !ok {
			return nil, ErrInvalidDictionary
		}
		out = append(out, column)
	}
	if len(out) == 0 {
		return nil, ErrInvalidDictionary
	}
	return out, nil
}

func genericFilterClause(filter LookupFilter, fieldColumns map[string]string, args *[]any) (string, error) {
	column, ok := fieldColumns[strings.TrimSpace(filter.Field)]
	if !ok {
		return "", ErrInvalidDictionary
	}
	columnExpr := quoteIdentifier(column)
	operator := strings.ToLower(strings.TrimSpace(filter.Operator))
	if operator == "" {
		operator = "eq"
	}

	switch operator {
	case "contains":
		*args = append(*args, "%"+strings.ToLower(fmt.Sprint(filter.Value))+"%")
		return fmt.Sprintf("LOWER(%s::text) LIKE $%d", columnExpr, len(*args)), nil
	case "eq":
		*args = append(*args, fmt.Sprint(filter.Value))
		return fmt.Sprintf("%s::text = $%d", columnExpr, len(*args)), nil
	case "in":
		values, ok := filter.Value.([]string)
		if !ok || len(values) == 0 {
			return "", ErrInvalidDictionary
		}
		*args = append(*args, pq.Array(values))
		return fmt.Sprintf("%s::text = ANY($%d)", columnExpr, len(*args)), nil
	case "is_empty":
		return fmt.Sprintf("(%s IS NULL OR btrim(%s::text) = '')", columnExpr, columnExpr), nil
	case "is_not_empty":
		return fmt.Sprintf("(%s IS NOT NULL AND btrim(%s::text) <> '')", columnExpr, columnExpr), nil
	case "not_eq":
		*args = append(*args, fmt.Sprint(filter.Value))
		return fmt.Sprintf("COALESCE(%s::text, '') <> $%d", columnExpr, len(*args)), nil
	case "starts_with":
		*args = append(*args, strings.ToLower(fmt.Sprint(filter.Value))+"%")
		return fmt.Sprintf("LOWER(%s::text) LIKE $%d", columnExpr, len(*args)), nil
	default:
		return "", ErrInvalidDictionary
	}
}

func chooseRequestField(value string, fallback string) string {
	if trimmed := strings.TrimSpace(value); trimmed != "" {
		return trimmed
	}
	return strings.TrimSpace(fallback)
}

func concatTextExpression(columns []string, separator string) string {
	parts := make([]string, 0, len(columns))
	for _, column := range columns {
		parts = append(parts, fmt.Sprintf("NULLIF(btrim(%s::text), '')", quoteIdentifier(column)))
	}
	return fmt.Sprintf("COALESCE(NULLIF(concat_ws(%s, %s), ''), '')", sqlStringLiteral(separator), strings.Join(parts, ", "))
}

func concatColumns(columns []string) string {
	parts := make([]string, 0, len(columns))
	for _, column := range columns {
		parts = append(parts, quoteIdentifier(column))
	}
	return strings.Join(parts, ", ")
}

func jsonFieldsExpression(columns []string) string {
	if len(columns) == 0 {
		return "jsonb_build_object()"
	}
	parts := make([]string, 0, len(columns)*2)
	for _, column := range columns {
		parts = append(parts, sqlStringLiteral(column), fmt.Sprintf("NULLIF(%s::text, '')", quoteIdentifier(column)))
	}
	return fmt.Sprintf("jsonb_strip_nulls(jsonb_build_object(%s))", strings.Join(parts, ", "))
}

func unionFieldColumns(groups ...[]string) []string {
	out := []string{}
	seen := map[string]struct{}{}
	for _, group := range groups {
		for _, column := range group {
			column = strings.TrimSpace(column)
			if column == "" {
				continue
			}
			if _, ok := seen[column]; ok {
				continue
			}
			seen[column] = struct{}{}
			out = append(out, column)
		}
	}
	return out
}

func optionsSource(dictionary string) (string, string, map[string]string, error) {
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
       concat_ws(' ', name, company_type__label, city, state__label, email::text, phone, contact_name) AS search_text,
       active AS active,
       company_type_id AS company_type_id,
       main_company_id AS main_company_id
  FROM vw_company
 WHERE active IS TRUE`, "companies", map[string]string{
				"active":          "active",
				"company_type_id": "company_type_id",
				"main_company_id": "main_company_id",
			}, nil
	case "companyTypes":
		return `
SELECT id::text AS id,
       name AS label,
       COALESCE(NULLIF(risk, ''), '') AS description,
       jsonb_strip_nulls(jsonb_build_object(
         'risk', NULLIF(risk, '')
       )) AS fields,
       concat_ws(' ', name, risk) AS search_text
  FROM companytype`, "company types", map[string]string{}, nil
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
         'company_name', NULLIF(company__label, ''),
         'company_id', NULLIF(company_id::text, ''),
         'email', NULLIF(email::text, ''),
         'phone', NULLIF(phone, ''),
         'title', NULLIF(job_type__label, '')
       )) AS fields,
       concat_ws(' ', first_name, last_name, employee_number, email::text, company__label, job_type__label, phone) AS search_text,
       active AS active,
       company_id AS company_id,
       job_type_id AS job_type_id
  FROM vw_users
 WHERE active IS TRUE`, "contacts", map[string]string{
				"active":      "active",
				"company_id":  "company_id",
				"job_type_id": "job_type_id",
			}, nil
	case "jobtypes":
		return `
SELECT id::text AS id,
       name AS label,
       '' AS description,
       jsonb_build_object() AS fields,
       name AS search_text,
       active AS active
  FROM jobtype
 WHERE active IS TRUE`, "job types", map[string]string{
				"active": "active",
			}, nil
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
       concat_ws(' ', project_number, name, city, company__label, status) AS search_text,
       active AS active,
       company_id AS company_id,
       contractor_company_id AS contractor_company_id,
       status AS status,
       subcontractor_company_id AS subcontractor_company_id
  FROM vw_projects
 WHERE active IS TRUE`, "projects", map[string]string{
				"active":                   "active",
				"company_id":               "company_id",
				"contractor_company_id":    "contractor_company_id",
				"status":                   "status",
				"subcontractor_company_id": "subcontractor_company_id",
			}, nil
	default:
		return "", "", nil, ErrInvalidDictionary
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

func quoteIdentifier(value string) string {
	return pq.QuoteIdentifier(value)
}

func qualifiedIdentifier(name string) string {
	return pq.QuoteIdentifier("public") + "." + quoteIdentifier(name)
}

func sqlStringLiteral(value string) string {
	return "'" + strings.ReplaceAll(value, "'", "''") + "'"
}
