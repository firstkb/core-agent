package platformstudioformruntime

import (
	"context"
	"database/sql"
	"errors"
	"fmt"
	"strings"

	"github.com/lib/pq"
)

func createRootRecordTx(
	ctx context.Context,
	tx *sql.Tx,
	scope runtimeRootScopePlan,
	values map[string]any,
	createDocGuid string,
) (*runtimeRecordMutationRow, error) {
	columnNames, args := mutationColumnsAndArgs(scope, values)
	if createDocGuid != "" && scope.SourceGUIDColumn != "" {
		columnNames = append(columnNames, scope.SourceGUIDColumn)
		args = append(args, createDocGuid)
	}
	returningClause, returningFields := buildReturningClause(scope)

	var query string
	if len(columnNames) == 0 {
		query = fmt.Sprintf(
			"INSERT INTO %s DEFAULT VALUES RETURNING %s",
			qualifiedIdentifier(scope.TableName),
			returningClause,
		)
	} else {
		placeholders := make([]string, 0, len(columnNames))
		for index := range columnNames {
			placeholders = append(placeholders, fmt.Sprintf("$%d", index+1))
		}
		quotedColumns := make([]string, 0, len(columnNames))
		for _, columnName := range columnNames {
			quotedColumns = append(quotedColumns, quoteIdentifier(columnName))
		}
		query = fmt.Sprintf(
			"INSERT INTO %s (%s) VALUES (%s) RETURNING %s",
			qualifiedIdentifier(scope.TableName),
			strings.Join(quotedColumns, ", "),
			strings.Join(placeholders, ", "),
			returningClause,
		)
	}

	row, err := scanMutationRow(tx.QueryRowContext(ctx, query, args...), returningFields)
	if err != nil {
		if createDocGuid != "" && isUniqueViolation(err) {
			return nil, ErrCreateTokenConflict
		}
		return nil, fmt.Errorf("form runtime: create root record: %w", err)
	}
	return row, nil
}

func isUniqueViolation(err error) bool {
	var pqErr *pq.Error
	return errors.As(err, &pqErr) && pqErr.Code == "23505"
}

func updateRootRecordTx(
	ctx context.Context,
	tx *sql.Tx,
	scope runtimeRootScopePlan,
	docGuid string,
	values map[string]any,
	expectedRevision string,
) (*runtimeRecordMutationRow, error) {
	if docGuid == "" {
		return nil, ErrInvalidRequest
	}
	if len(values) == 0 {
		return loadRootRecordTx(ctx, tx, scope, docGuid)
	}

	columnNames, args := mutationColumnsAndArgs(scope, values)
	if len(columnNames) == 0 {
		return loadRootRecordTx(ctx, tx, scope, docGuid)
	}

	setClauses := make([]string, 0, len(columnNames))
	for index, columnName := range columnNames {
		setClauses = append(setClauses, fmt.Sprintf("%s = $%d", quoteIdentifier(columnName), index+1))
	}

	whereArgs := append([]any{}, args...)
	docArgIndex := len(whereArgs) + 1
	whereArgs = append(whereArgs, docGuid)
	whereClause := fmt.Sprintf("%s::text = $%d", quoteIdentifier(scope.SourceGUIDColumn), docArgIndex)
	if scope.TenantScoped && scope.SourceTenantColumn != "" {
		whereClause += fmt.Sprintf(" AND %s = current_setting('app.tenant_id', true)::bigint", quoteIdentifier(scope.SourceTenantColumn))
	}
	if expectedRevision != "" && scope.SourceUpdatedColumn != "" {
		revisionArgIndex := len(whereArgs) + 1
		whereArgs = append(whereArgs, expectedRevision)
		whereClause += fmt.Sprintf(" AND %s::text = $%d", quoteIdentifier(scope.SourceUpdatedColumn), revisionArgIndex)
	}

	returningClause, returningFields := buildReturningClause(scope)
	query := fmt.Sprintf(
		"UPDATE %s SET %s WHERE %s RETURNING %s",
		qualifiedIdentifier(scope.TableName),
		strings.Join(setClauses, ", "),
		whereClause,
		returningClause,
	)

	row, err := scanMutationRow(tx.QueryRowContext(ctx, query, whereArgs...), returningFields)
	if err != nil {
		if errors.Is(err, sql.ErrNoRows) && expectedRevision != "" {
			return nil, ErrConflict
		}
		if errors.Is(err, sql.ErrNoRows) {
			return nil, ErrRecordNotFound
		}
		return nil, fmt.Errorf("form runtime: update root record: %w", err)
	}
	return row, nil
}

func loadRootRecordTx(
	ctx context.Context,
	tx *sql.Tx,
	scope runtimeRootScopePlan,
	docGuid string,
) (*runtimeRecordMutationRow, error) {
	if docGuid == "" {
		return nil, ErrInvalidRequest
	}

	returningClause, returningFields := buildReturningClause(scope)
	whereClause := fmt.Sprintf("%s::text = $1", quoteIdentifier(scope.SourceGUIDColumn))
	if scope.TenantScoped && scope.SourceTenantColumn != "" {
		whereClause += fmt.Sprintf(" AND %s = current_setting('app.tenant_id', true)::bigint", quoteIdentifier(scope.SourceTenantColumn))
	}
	query := fmt.Sprintf(
		"SELECT %s FROM %s WHERE %s LIMIT 1",
		returningClause,
		qualifiedIdentifier(scope.TableName),
		whereClause,
	)

	row, err := scanMutationRow(tx.QueryRowContext(ctx, query, docGuid), returningFields)
	if err != nil {
		if errors.Is(err, sql.ErrNoRows) {
			return nil, ErrRecordNotFound
		}
		return nil, fmt.Errorf("form runtime: load root record: %w", err)
	}
	return row, nil
}

func setRootRecordsActiveTx(
	ctx context.Context,
	tx *sql.Tx,
	scope runtimeRootScopePlan,
	docGuids []string,
	activeColumn string,
	active bool,
) error {
	if scope.SourceGUIDColumn == "" || strings.TrimSpace(activeColumn) == "" || len(docGuids) == 0 {
		return ErrInvalidRequest
	}

	whereClause := fmt.Sprintf("%s::text = ANY($2)", quoteIdentifier(scope.SourceGUIDColumn))
	if scope.TenantScoped && scope.SourceTenantColumn != "" {
		whereClause += fmt.Sprintf(" AND %s = current_setting('app.tenant_id', true)::bigint", quoteIdentifier(scope.SourceTenantColumn))
	}
	query := fmt.Sprintf(
		"UPDATE %s SET %s = $1 WHERE %s",
		qualifiedIdentifier(scope.TableName),
		quoteIdentifier(activeColumn),
		whereClause,
	)
	if _, err := tx.ExecContext(ctx, query, active, pq.Array(docGuids)); err != nil {
		return fmt.Errorf("form runtime: bulk active update: %w", err)
	}
	return nil
}

func deleteRootRecordsTx(
	ctx context.Context,
	tx *sql.Tx,
	scope runtimeRootScopePlan,
	docGuids []string,
) error {
	if scope.SourceGUIDColumn == "" || scope.SourceIDColumn == "" || len(docGuids) == 0 {
		return ErrInvalidRequest
	}

	if err := deleteSubformRecordsForRootDocGuidsTx(ctx, tx, scope, docGuids); err != nil {
		return err
	}

	whereClause := fmt.Sprintf("%s::text = ANY($1)", quoteIdentifier(scope.SourceGUIDColumn))
	if scope.TenantScoped && scope.SourceTenantColumn != "" {
		whereClause += fmt.Sprintf(" AND %s = current_setting('app.tenant_id', true)::bigint", quoteIdentifier(scope.SourceTenantColumn))
	}
	query := fmt.Sprintf(
		"DELETE FROM %s WHERE %s",
		qualifiedIdentifier(scope.TableName),
		whereClause,
	)
	if _, err := tx.ExecContext(ctx, query, pq.Array(docGuids)); err != nil {
		return fmt.Errorf("form runtime: bulk delete records: %w", err)
	}
	return nil
}

func deleteSubformRecordsForRootDocGuidsTx(
	ctx context.Context,
	tx *sql.Tx,
	scope runtimeRootScopePlan,
	docGuids []string,
) error {
	if len(scope.SubformScopes) == 0 {
		return nil
	}

	rootWhereClause := fmt.Sprintf("root.%s::text = ANY($1)", quoteIdentifier(scope.SourceGUIDColumn))
	if scope.TenantScoped && scope.SourceTenantColumn != "" {
		rootWhereClause += fmt.Sprintf(" AND root.%s = current_setting('app.tenant_id', true)::bigint", quoteIdentifier(scope.SourceTenantColumn))
	}
	for _, subformScope := range scope.SubformScopes {
		if strings.TrimSpace(subformScope.TableName) == "" || strings.TrimSpace(subformScope.ParentForeignKey) == "" {
			continue
		}
		query := fmt.Sprintf(
			`DELETE FROM %s
 WHERE %s IN (
       SELECT root.%s
         FROM %s root
        WHERE %s
       )`,
			qualifiedIdentifier(subformScope.TableName),
			quoteIdentifier(subformScope.ParentForeignKey),
			quoteIdentifier(scope.SourceIDColumn),
			qualifiedIdentifier(scope.TableName),
			rootWhereClause,
		)
		if _, err := tx.ExecContext(ctx, query, pq.Array(docGuids)); err != nil {
			return fmt.Errorf("form runtime: bulk delete subform records: %w", err)
		}
	}
	return nil
}

func mutationColumnsAndArgs(scope runtimeRootScopePlan, values map[string]any) ([]string, []any) {
	columnNames := []string{}
	args := []any{}
	fieldsByID := make(map[string]runtimeFieldPlan, len(scope.Fields))
	for _, field := range scope.Fields {
		if !field.Supported || field.ColumnName == "" {
			continue
		}
		fieldsByID[field.FieldID] = field
	}

	for _, field := range scope.Fields {
		if _, ok := fieldsByID[field.FieldID]; !ok {
			continue
		}
		value, ok := values[field.FieldID]
		if !ok {
			continue
		}
		columnNames = append(columnNames, field.ColumnName)
		args = append(args, value)
	}
	return columnNames, args
}

func buildReturningClause(scope runtimeRootScopePlan) (string, []runtimeFieldPlan) {
	selectList := []string{
		fmt.Sprintf("COALESCE(%s::text, '') AS __doc_guid", quoteIdentifier(scope.SourceGUIDColumn)),
	}
	if scope.SourceUpdatedColumn != "" {
		selectList = append(selectList, fmt.Sprintf("COALESCE(%s::text, '') AS __revision", quoteIdentifier(scope.SourceUpdatedColumn)))
	} else {
		selectList = append(selectList, "'' AS __revision")
	}

	fields := make([]runtimeFieldPlan, 0, len(scope.Fields))
	for _, field := range scope.Fields {
		if !field.Supported || field.ColumnName == "" {
			continue
		}
		fields = append(fields, field)
		selectList = append(selectList, fmt.Sprintf(
			"COALESCE(%s::text, '') AS %s",
			quoteIdentifier(field.ColumnName),
			quoteIdentifier(field.FieldID),
		))
	}
	return strings.Join(selectList, ", "), fields
}

func scanMutationRow(row *sql.Row, fields []runtimeFieldPlan) (*runtimeRecordMutationRow, error) {
	values := make([]sql.NullString, len(fields)+2)
	scanTargets := make([]any, len(values))
	for index := range values {
		scanTargets[index] = &values[index]
	}
	if err := row.Scan(scanTargets...); err != nil {
		return nil, err
	}

	out := &runtimeRecordMutationRow{
		Values: map[string]any{},
	}
	if values[0].Valid {
		out.DocGuid = values[0].String
	}
	if values[1].Valid {
		out.Revision = values[1].String
	}
	for index, field := range fields {
		if values[index+2].Valid {
			out.Values[field.FieldID] = values[index+2].String
		} else {
			out.Values[field.FieldID] = nil
		}
	}
	return out, nil
}

func quoteIdentifier(value string) string {
	return `"` + strings.ReplaceAll(value, `"`, `""`) + `"`
}

func qualifiedIdentifier(name string) string {
	return `"public".` + quoteIdentifier(name)
}
