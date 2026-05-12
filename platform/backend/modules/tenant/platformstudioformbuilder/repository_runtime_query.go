package platformstudioformbuilder

import (
	"context"
	"database/sql"
	"errors"
	"fmt"
	"strconv"
	"strings"

	"dtriton.com/platform/backend/internal/platform/httpx/requestctx"
	"github.com/lib/pq"
)

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

func (r *repository) CountRelationRows(
	ctx context.Context,
	tenant requestctx.TenantInfo,
	relationName string,
) (int64, error) {
	relationName = strings.TrimSpace(relationName)
	if relationName == "" {
		return 0, nil
	}

	db, err := r.client.OpenDBTenant(ctx, tenant.DBName, tenant.DBInstanceCode)
	if err != nil {
		return 0, fmt.Errorf("form builder: open tenant db: %w", err)
	}

	tx, err := db.BeginTx(ctx, &sql.TxOptions{ReadOnly: true})
	if err != nil {
		return 0, fmt.Errorf("form builder: begin count relation rows tx: %w", err)
	}
	defer func() { _ = tx.Rollback() }()

	var count int64
	query := fmt.Sprintf(`SELECT COUNT(*) FROM %s`, qualifiedIdentifier(relationName))
	if err := tx.QueryRowContext(ctx, query).Scan(&count); err != nil {
		return 0, fmt.Errorf("form builder: count relation rows %s: %w", relationName, err)
	}
	if err := tx.Commit(); err != nil {
		return 0, fmt.Errorf("form builder: commit count relation rows tx: %w", err)
	}

	return count, nil
}

func (r *repository) QueryRuntimeRows(
	ctx context.Context,
	tenant requestctx.TenantInfo,
	relationName string,
	columnNames []string,
	whereClause string,
	whereArgs []any,
	orderByColumn string,
	orderDirection string,
	page int,
	pageSize int,
) ([]runtimeRelationQueryRow, int, error) {
	relationName = strings.TrimSpace(relationName)
	columnNames = normalizeExportColumnNames(columnNames)
	whereClause = strings.TrimSpace(whereClause)
	orderByColumn = strings.TrimSpace(orderByColumn)
	orderDirection = strings.TrimSpace(strings.ToUpper(orderDirection))
	if relationName == "" {
		return nil, 0, fmt.Errorf("form builder: runtime relation name is required")
	}
	if orderByColumn == "" {
		orderByColumn = "_created_at"
	}
	if orderDirection != "DESC" {
		orderDirection = "ASC"
	}
	if page < 1 {
		page = 1
	}
	if pageSize < 1 {
		pageSize = 25
	}

	db, err := r.client.OpenDBTenant(ctx, tenant.DBName, tenant.DBInstanceCode)
	if err != nil {
		return nil, 0, fmt.Errorf("form builder: open tenant db: %w", err)
	}

	tx, err := db.BeginTx(ctx, &sql.TxOptions{ReadOnly: true})
	if err != nil {
		return nil, 0, fmt.Errorf("form builder: begin runtime query tx: %w", err)
	}
	defer func() { _ = tx.Rollback() }()

	columnSet, err := relationColumnsTx(ctx, tx, relationName)
	if err != nil {
		return nil, 0, err
	}
	columnNames = filterExistingRuntimeColumns(columnNames, columnSet)

	countQuery := fmt.Sprintf(`SELECT COUNT(*) FROM %s t`, qualifiedIdentifier(relationName))
	if whereClause != "" {
		countQuery += "\n WHERE " + whereClause
	}

	var totalItems int
	if err := tx.QueryRowContext(ctx, countQuery, whereArgs...).Scan(&totalItems); err != nil {
		return nil, 0, fmt.Errorf("form builder: count runtime rows %s: %w", relationName, err)
	}

	selectList := []string{
		`COALESCE(t."_guid"::text, t."_id"::text, '') AS "__row_id"`,
	}
	for _, columnName := range columnNames {
		selectList = append(selectList, fmt.Sprintf(
			`COALESCE(t.%s::text, '') AS %s`,
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
	if whereClause != "" {
		query += "\n WHERE " + whereClause
	}
	query += fmt.Sprintf(
		"\n ORDER BY t.%s %s NULLS LAST",
		quoteIdentifier(orderByColumn),
		orderDirection,
	)
	query += fmt.Sprintf("\n LIMIT %d OFFSET %d", pageSize, (page-1)*pageSize)

	rows, err := tx.QueryContext(ctx, query, whereArgs...)
	if err != nil {
		return nil, 0, fmt.Errorf("form builder: query runtime rows %s: %w", relationName, err)
	}
	defer rows.Close()

	values := make([]sql.NullString, len(columnNames)+1)
	scanTargets := make([]any, len(values))
	for index := range values {
		scanTargets[index] = &values[index]
	}

	records := make([]runtimeRelationQueryRow, 0)
	for rows.Next() {
		if err := rows.Scan(scanTargets...); err != nil {
			return nil, 0, fmt.Errorf("form builder: scan runtime row: %w", err)
		}
		rowID := ""
		if values[0].Valid {
			rowID = values[0].String
		}
		cells := make(map[string]string, len(columnNames))
		for index, columnName := range columnNames {
			value := ""
			if values[index+1].Valid {
				value = values[index+1].String
			}
			cells[columnName] = value
		}
		records = append(records, runtimeRelationQueryRow{
			ID:    rowID,
			Cells: cells,
		})
	}
	if err := rows.Err(); err != nil {
		return nil, 0, fmt.Errorf("form builder: runtime rows result: %w", err)
	}
	if err := tx.Commit(); err != nil {
		return nil, 0, fmt.Errorf("form builder: commit runtime query tx: %w", err)
	}

	return records, totalItems, nil
}

func (r *repository) ResolveRuntimeViewListActorContext(
	ctx context.Context,
	tenant requestctx.TenantInfo,
	userGUID string,
) (runtimeViewListActorContext, error) {
	userGUID = strings.TrimSpace(userGUID)
	if userGUID == "" {
		return runtimeViewListActorContext{}, nil
	}
	tenantID, err := strconv.ParseInt(strings.TrimSpace(tenant.ID), 10, 64)
	if err != nil || tenantID == 0 {
		return runtimeViewListActorContext{}, ErrTenantMissing
	}

	db, err := r.client.OpenDBTenant(ctx, tenant.DBName, tenant.DBInstanceCode)
	if err != nil {
		return runtimeViewListActorContext{}, fmt.Errorf("form builder: open tenant db: %w", err)
	}

	tx, err := db.BeginTx(ctx, &sql.TxOptions{ReadOnly: true})
	if err != nil {
		return runtimeViewListActorContext{}, fmt.Errorf("form builder: begin runtime actor context tx: %w", err)
	}
	defer func() { _ = tx.Rollback() }()

	const query = `
SELECT id,
       company_id
  FROM users
 WHERE tenant_id = $1
   AND guid = $2
 LIMIT 1`
	var out runtimeViewListActorContext
	var companyID sql.NullInt64
	if err := tx.QueryRowContext(ctx, query, tenantID, userGUID).Scan(&out.UserID, &companyID); err != nil {
		if errors.Is(err, sql.ErrNoRows) {
			return runtimeViewListActorContext{}, nil
		}
		return runtimeViewListActorContext{}, fmt.Errorf("form builder: resolve runtime actor context: %w", err)
	}
	if companyID.Valid {
		out.CompanyID = companyID.Int64
	}
	if err := tx.Commit(); err != nil {
		return runtimeViewListActorContext{}, fmt.Errorf("form builder: commit runtime actor context tx: %w", err)
	}
	return out, nil
}

func filterExistingRuntimeColumns(columnNames []string, columnSet map[string]struct{}) []string {
	if len(columnSet) == 0 {
		return columnNames
	}
	out := make([]string, 0, len(columnNames))
	for _, columnName := range columnNames {
		columnName = strings.TrimSpace(columnName)
		if columnName == "" {
			continue
		}
		if _, ok := columnSet[columnName]; ok {
			out = append(out, columnName)
		}
	}
	return out
}

func (r *repository) ResolveRuntimeSourceGUIDColumn(
	ctx context.Context,
	tenant requestctx.TenantInfo,
	relationName string,
	configured string,
) (string, error) {
	relationName = strings.TrimSpace(relationName)
	if relationName == "" {
		return "", nil
	}

	db, err := r.client.OpenDBTenant(ctx, tenant.DBName, tenant.DBInstanceCode)
	if err != nil {
		return "", fmt.Errorf("form builder: open tenant db: %w", err)
	}

	tx, err := db.BeginTx(ctx, &sql.TxOptions{ReadOnly: true})
	if err != nil {
		return "", fmt.Errorf("form builder: begin runtime guid lookup tx: %w", err)
	}
	defer func() { _ = tx.Rollback() }()

	columnSet, err := relationColumnsTx(ctx, tx, relationName)
	if err != nil {
		return "", err
	}
	if err := tx.Commit(); err != nil {
		return "", fmt.Errorf("form builder: commit runtime guid lookup tx: %w", err)
	}

	return chooseExistingRelationColumn(columnSet, configured, "guid", relationName+"_guid"), nil
}

func (r *repository) LoadRuntimeSuggestions(
	ctx context.Context,
	tenant requestctx.TenantInfo,
	relationName string,
	columnName string,
	whereClause string,
	whereArgs []any,
	limit int,
) ([]runtimeRelationSuggestion, error) {
	relationName = strings.TrimSpace(relationName)
	columnName = strings.TrimSpace(columnName)
	whereClause = strings.TrimSpace(whereClause)
	if relationName == "" || columnName == "" {
		return nil, nil
	}
	if limit <= 0 {
		limit = 10
	}

	db, err := r.client.OpenDBTenant(ctx, tenant.DBName, tenant.DBInstanceCode)
	if err != nil {
		return nil, fmt.Errorf("form builder: open tenant db: %w", err)
	}

	tx, err := db.BeginTx(ctx, &sql.TxOptions{ReadOnly: true})
	if err != nil {
		return nil, fmt.Errorf("form builder: begin runtime suggestions tx: %w", err)
	}
	defer func() { _ = tx.Rollback() }()

	query := fmt.Sprintf(
		`SELECT value, count(*)
   FROM (
         SELECT NULLIF(BTRIM(t.%s::text), '') AS value
           FROM %s t
`,
		quoteIdentifier(columnName),
		qualifiedIdentifier(relationName),
	)
	if whereClause != "" {
		query += "\n          WHERE " + whereClause
	}
	query += fmt.Sprintf(
		`        ) src
  WHERE value IS NOT NULL
  GROUP BY value
  ORDER BY count(*) DESC, LOWER(value) ASC
  LIMIT %d`,
		limit,
	)
	rows, err := tx.QueryContext(ctx, query, whereArgs...)
	if err != nil {
		return nil, fmt.Errorf("form builder: query runtime suggestions %s.%s: %w", relationName, columnName, err)
	}
	defer rows.Close()

	suggestions := make([]runtimeRelationSuggestion, 0)
	for rows.Next() {
		var suggestion runtimeRelationSuggestion
		if err := rows.Scan(&suggestion.Value, &suggestion.Count); err != nil {
			return nil, fmt.Errorf("form builder: scan runtime suggestion: %w", err)
		}
		suggestions = append(suggestions, suggestion)
	}
	if err := rows.Err(); err != nil {
		return nil, fmt.Errorf("form builder: runtime suggestions result: %w", err)
	}
	if err := tx.Commit(); err != nil {
		return nil, fmt.Errorf("form builder: commit runtime suggestions tx: %w", err)
	}

	return suggestions, nil
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
