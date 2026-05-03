package platformstudioformruntime

import (
	"context"
	"database/sql"
	"errors"
	"fmt"
	"strconv"
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
	if err := replaceMultiValueFieldsTx(ctx, tx, scope, row.SourceID, values); err != nil {
		return nil, err
	}
	mergeChangedMultiValueValues(scope, row.Values, values)
	return row, nil
}

func createSubformRecordTx(
	ctx context.Context,
	tx *sql.Tx,
	rootScope runtimeRootScopePlan,
	subformScope runtimeSubformScopePlan,
	parentDocGuid string,
	values map[string]any,
	createDocGuid string,
) (*runtimeRecordMutationRow, error) {
	parentRow, err := loadRootRecordTx(ctx, tx, rootScope, parentDocGuid)
	if err != nil {
		return nil, err
	}
	recordScope := rootScopeFromSubform(rootScope, subformScope)
	columnNames, args := mutationColumnsAndArgs(recordScope, values)
	columnNames = append(columnNames, subformScope.ParentForeignKey)
	args = append(args, parentRow.SourceID)
	if createDocGuid != "" && recordScope.SourceGUIDColumn != "" {
		columnNames = append(columnNames, recordScope.SourceGUIDColumn)
		args = append(args, createDocGuid)
	}
	returningClause, returningFields := buildReturningClause(recordScope)

	placeholders := make([]string, 0, len(columnNames))
	for index := range columnNames {
		placeholders = append(placeholders, fmt.Sprintf("$%d", index+1))
	}
	quotedColumns := make([]string, 0, len(columnNames))
	for _, columnName := range columnNames {
		quotedColumns = append(quotedColumns, quoteIdentifier(columnName))
	}
	query := fmt.Sprintf(
		"INSERT INTO %s (%s) VALUES (%s) RETURNING %s",
		qualifiedIdentifier(recordScope.TableName),
		strings.Join(quotedColumns, ", "),
		strings.Join(placeholders, ", "),
		returningClause,
	)

	row, err := scanMutationRow(tx.QueryRowContext(ctx, query, args...), returningFields)
	if err != nil {
		if createDocGuid != "" && isUniqueViolation(err) {
			return nil, ErrCreateTokenConflict
		}
		return nil, fmt.Errorf("form runtime: create subform record: %w", err)
	}
	if err := replaceMultiValueFieldsTx(ctx, tx, recordScope, row.SourceID, values); err != nil {
		return nil, err
	}
	mergeChangedMultiValueValues(recordScope, row.Values, values)
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
	hasMultiValueMutation := hasMultiValueMutation(scope, values)
	if len(columnNames) == 0 && !hasMultiValueMutation {
		return loadRootRecordTx(ctx, tx, scope, docGuid)
	}

	setClauses := make([]string, 0, len(columnNames))
	for index, columnName := range columnNames {
		setClauses = append(setClauses, fmt.Sprintf("%s = $%d", quoteIdentifier(columnName), index+1))
	}
	if len(setClauses) == 0 && scope.SourceUpdatedColumn != "" {
		setClauses = append(setClauses, fmt.Sprintf("%s = now()", quoteIdentifier(scope.SourceUpdatedColumn)))
	}
	if len(setClauses) == 0 {
		row, err := loadRootRecordTx(ctx, tx, scope, docGuid)
		if err != nil {
			return nil, err
		}
		if err := replaceMultiValueFieldsTx(ctx, tx, scope, row.SourceID, values); err != nil {
			return nil, err
		}
		return loadRootRecordTx(ctx, tx, scope, docGuid)
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
	if err := replaceMultiValueFieldsTx(ctx, tx, scope, row.SourceID, values); err != nil {
		return nil, err
	}
	mergeChangedMultiValueValues(scope, row.Values, values)
	return row, nil
}

func updateSubformRecordTx(
	ctx context.Context,
	tx *sql.Tx,
	rootScope runtimeRootScopePlan,
	subformScope runtimeSubformScopePlan,
	parentDocGuid string,
	docGuid string,
	values map[string]any,
	expectedRevision string,
) (*runtimeRecordMutationRow, error) {
	if parentDocGuid == "" || docGuid == "" {
		return nil, ErrInvalidRequest
	}
	parentRow, err := loadRootRecordTx(ctx, tx, rootScope, parentDocGuid)
	if err != nil {
		return nil, err
	}
	recordScope := rootScopeFromSubform(rootScope, subformScope)
	if len(values) == 0 {
		return loadSubformRecordTx(ctx, tx, rootScope, subformScope, parentDocGuid, docGuid)
	}

	columnNames, args := mutationColumnsAndArgs(recordScope, values)
	hasMultiValueMutation := hasMultiValueMutation(recordScope, values)
	if len(columnNames) == 0 && !hasMultiValueMutation {
		return loadSubformRecordTx(ctx, tx, rootScope, subformScope, parentDocGuid, docGuid)
	}

	setClauses := make([]string, 0, len(columnNames))
	for index, columnName := range columnNames {
		setClauses = append(setClauses, fmt.Sprintf("%s = $%d", quoteIdentifier(columnName), index+1))
	}
	if len(setClauses) == 0 && recordScope.SourceUpdatedColumn != "" {
		setClauses = append(setClauses, fmt.Sprintf("%s = now()", quoteIdentifier(recordScope.SourceUpdatedColumn)))
	}
	if len(setClauses) == 0 {
		row, err := loadSubformRecordTx(ctx, tx, rootScope, subformScope, parentDocGuid, docGuid)
		if err != nil {
			return nil, err
		}
		if err := replaceMultiValueFieldsTx(ctx, tx, recordScope, row.SourceID, values); err != nil {
			return nil, err
		}
		return loadSubformRecordTx(ctx, tx, rootScope, subformScope, parentDocGuid, docGuid)
	}

	whereArgs := append([]any{}, args...)
	docArgIndex := len(whereArgs) + 1
	whereArgs = append(whereArgs, docGuid)
	parentArgIndex := len(whereArgs) + 1
	whereArgs = append(whereArgs, parentRow.SourceID)
	whereClause := fmt.Sprintf(
		"%s::text = $%d AND %s = $%d",
		quoteIdentifier(recordScope.SourceGUIDColumn),
		docArgIndex,
		quoteIdentifier(subformScope.ParentForeignKey),
		parentArgIndex,
	)
	if recordScope.TenantScoped && recordScope.SourceTenantColumn != "" {
		whereClause += fmt.Sprintf(" AND %s = current_setting('app.tenant_id', true)::bigint", quoteIdentifier(recordScope.SourceTenantColumn))
	}
	if expectedRevision != "" && recordScope.SourceUpdatedColumn != "" {
		revisionArgIndex := len(whereArgs) + 1
		whereArgs = append(whereArgs, expectedRevision)
		whereClause += fmt.Sprintf(" AND %s::text = $%d", quoteIdentifier(recordScope.SourceUpdatedColumn), revisionArgIndex)
	}

	returningClause, returningFields := buildReturningClause(recordScope)
	query := fmt.Sprintf(
		"UPDATE %s SET %s WHERE %s RETURNING %s",
		qualifiedIdentifier(recordScope.TableName),
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
		return nil, fmt.Errorf("form runtime: update subform record: %w", err)
	}
	if err := replaceMultiValueFieldsTx(ctx, tx, recordScope, row.SourceID, values); err != nil {
		return nil, err
	}
	mergeChangedMultiValueValues(recordScope, row.Values, values)
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
	if err := loadMultiValueValuesTx(ctx, tx, scope, row.SourceID, row.Values); err != nil {
		return nil, err
	}
	return row, nil
}

func loadSubformRecordTx(
	ctx context.Context,
	tx *sql.Tx,
	rootScope runtimeRootScopePlan,
	subformScope runtimeSubformScopePlan,
	parentDocGuid string,
	docGuid string,
) (*runtimeRecordMutationRow, error) {
	if parentDocGuid == "" || docGuid == "" {
		return nil, ErrInvalidRequest
	}
	parentRow, err := loadRootRecordTx(ctx, tx, rootScope, parentDocGuid)
	if err != nil {
		return nil, err
	}
	recordScope := rootScopeFromSubform(rootScope, subformScope)
	returningClause, returningFields := buildReturningClause(recordScope)
	whereClause := fmt.Sprintf(
		"%s::text = $1 AND %s = $2",
		quoteIdentifier(recordScope.SourceGUIDColumn),
		quoteIdentifier(subformScope.ParentForeignKey),
	)
	if recordScope.TenantScoped && recordScope.SourceTenantColumn != "" {
		whereClause += fmt.Sprintf(" AND %s = current_setting('app.tenant_id', true)::bigint", quoteIdentifier(recordScope.SourceTenantColumn))
	}
	query := fmt.Sprintf(
		"SELECT %s FROM %s WHERE %s LIMIT 1",
		returningClause,
		qualifiedIdentifier(recordScope.TableName),
		whereClause,
	)

	row, err := scanMutationRow(tx.QueryRowContext(ctx, query, docGuid, parentRow.SourceID), returningFields)
	if err != nil {
		if errors.Is(err, sql.ErrNoRows) {
			return nil, ErrRecordNotFound
		}
		return nil, fmt.Errorf("form runtime: load subform record: %w", err)
	}
	if err := loadMultiValueValuesTx(ctx, tx, recordScope, row.SourceID, row.Values); err != nil {
		return nil, err
	}
	return row, nil
}

func deleteSubformRecordTx(
	ctx context.Context,
	tx *sql.Tx,
	rootScope runtimeRootScopePlan,
	subformScope runtimeSubformScopePlan,
	parentDocGuid string,
	docGuid string,
) error {
	parentRow, err := loadRootRecordTx(ctx, tx, rootScope, parentDocGuid)
	if err != nil {
		return err
	}
	row, err := loadSubformRecordTx(ctx, tx, rootScope, subformScope, parentDocGuid, docGuid)
	if err != nil {
		return err
	}
	recordScope := rootScopeFromSubform(rootScope, subformScope)
	if err := deleteMultiValueRowsForOwnerTx(ctx, tx, recordScope, row.SourceID); err != nil {
		return err
	}

	query := fmt.Sprintf(
		"DELETE FROM %s WHERE %s::text = $1 AND %s = $2",
		qualifiedIdentifier(recordScope.TableName),
		quoteIdentifier(recordScope.SourceGUIDColumn),
		quoteIdentifier(subformScope.ParentForeignKey),
	)
	if recordScope.TenantScoped && recordScope.SourceTenantColumn != "" {
		query += fmt.Sprintf(" AND %s = current_setting('app.tenant_id', true)::bigint", quoteIdentifier(recordScope.SourceTenantColumn))
	}
	if _, err := tx.ExecContext(ctx, query, docGuid, parentRow.SourceID); err != nil {
		return fmt.Errorf("form runtime: delete subform record: %w", err)
	}
	return nil
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
	if err := deleteRootMultiValueRowsForDocGuidsTx(ctx, tx, scope, docGuids); err != nil {
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
		if err := deleteSubformMultiValueRowsForRootDocGuidsTx(ctx, tx, scope, subformScope, docGuids, rootWhereClause); err != nil {
			return err
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

func deleteSubformMultiValueRowsForRootDocGuidsTx(
	ctx context.Context,
	tx *sql.Tx,
	rootScope runtimeRootScopePlan,
	subformScope runtimeSubformScopePlan,
	docGuids []string,
	rootWhereClause string,
) error {
	if strings.TrimSpace(subformScope.MultiValueTableName) == "" ||
		strings.TrimSpace(subformScope.MultiValueOwnerForeignKey) == "" ||
		strings.TrimSpace(subformScope.SourceIDColumn) == "" ||
		strings.TrimSpace(subformScope.ParentForeignKey) == "" {
		return nil
	}

	query := fmt.Sprintf(
		`DELETE FROM %s mv
		  USING %s child, %s root
		  WHERE mv.%s = current_setting('app.tenant_id', true)::bigint
		    AND child.%s = mv.%s
		    AND child.%s = root.%s
		    AND %s`,
		qualifiedIdentifier(subformScope.MultiValueTableName),
		qualifiedIdentifier(subformScope.TableName),
		qualifiedIdentifier(rootScope.TableName),
		quoteIdentifier("tenant_id"),
		quoteIdentifier(subformScope.SourceIDColumn),
		quoteIdentifier(subformScope.MultiValueOwnerForeignKey),
		quoteIdentifier(subformScope.ParentForeignKey),
		quoteIdentifier(rootScope.SourceIDColumn),
		rootWhereClause,
	)
	if subformScope.TenantScoped && subformScope.SourceTenantColumn != "" {
		query += fmt.Sprintf(" AND child.%s = current_setting('app.tenant_id', true)::bigint", quoteIdentifier(subformScope.SourceTenantColumn))
	}
	if _, err := tx.ExecContext(ctx, query, pq.Array(docGuids)); err != nil {
		return fmt.Errorf("form runtime: bulk delete subform multivalue rows: %w", err)
	}
	return nil
}

func mutationColumnsAndArgs(scope runtimeRootScopePlan, values map[string]any) ([]string, []any) {
	columnNames := []string{}
	args := []any{}
	fieldsByID := make(map[string]runtimeFieldPlan, len(scope.Fields))
	for _, field := range scope.Fields {
		if !field.Supported || field.MultiValue || field.ColumnName == "" {
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
		fmt.Sprintf("COALESCE(%s::text, '') AS __record_id", quoteIdentifier(scope.SourceIDColumn)),
		fmt.Sprintf("COALESCE(%s::text, '') AS __doc_guid", quoteIdentifier(scope.SourceGUIDColumn)),
	}
	if scope.SourceUpdatedColumn != "" {
		selectList = append(selectList, fmt.Sprintf("COALESCE(%s::text, '') AS __revision", quoteIdentifier(scope.SourceUpdatedColumn)))
	} else {
		selectList = append(selectList, "'' AS __revision")
	}

	fields := make([]runtimeFieldPlan, 0, len(scope.Fields))
	for _, field := range scope.Fields {
		if !field.Supported || field.MultiValue || field.ColumnName == "" {
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
	values := make([]sql.NullString, len(fields)+3)
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
		if sourceID, err := strconv.ParseInt(strings.TrimSpace(values[0].String), 10, 64); err == nil {
			out.SourceID = sourceID
		}
	}
	if values[1].Valid {
		out.DocGuid = values[1].String
	}
	if values[2].Valid {
		out.Revision = values[2].String
	}
	for index, field := range fields {
		if values[index+3].Valid {
			out.Values[field.FieldID] = values[index+3].String
		} else {
			out.Values[field.FieldID] = nil
		}
	}
	return out, nil
}

func hasMultiValueMutation(scope runtimeRootScopePlan, values map[string]any) bool {
	for _, field := range scope.Fields {
		if !field.Supported || !field.MultiValue {
			continue
		}
		if _, ok := values[field.FieldID]; ok {
			return true
		}
	}
	return false
}

func replaceMultiValueFieldsTx(
	ctx context.Context,
	tx *sql.Tx,
	scope runtimeRootScopePlan,
	ownerID int64,
	values map[string]any,
) error {
	if ownerID == 0 || strings.TrimSpace(scope.MultiValueTableName) == "" || strings.TrimSpace(scope.MultiValueOwnerForeignKey) == "" {
		return nil
	}

	for _, field := range scope.Fields {
		if !field.Supported || !field.MultiValue || strings.TrimSpace(field.StorageKey) == "" {
			continue
		}
		rawValue, ok := values[field.FieldID]
		if !ok {
			continue
		}
		selectedValues := normalizeRuntimeStringArray(rawValue)
		if err := replaceMultiValueFieldTx(ctx, tx, scope, field, ownerID, selectedValues); err != nil {
			return err
		}
	}
	return nil
}

func replaceMultiValueFieldTx(
	ctx context.Context,
	tx *sql.Tx,
	scope runtimeRootScopePlan,
	field runtimeFieldPlan,
	ownerID int64,
	selectedValues []string,
) error {
	deleteQuery := fmt.Sprintf(
		`DELETE FROM %s
		  WHERE %s = current_setting('app.tenant_id', true)::bigint
		    AND %s = $1
		    AND %s = $2`,
		qualifiedIdentifier(scope.MultiValueTableName),
		quoteIdentifier("tenant_id"),
		quoteIdentifier(scope.MultiValueOwnerForeignKey),
		quoteIdentifier("field_key"),
	)
	if _, err := tx.ExecContext(ctx, deleteQuery, ownerID, field.StorageKey); err != nil {
		return fmt.Errorf("form runtime: delete multivalue field %s: %w", field.FieldID, err)
	}

	if len(selectedValues) == 0 {
		return nil
	}

	insertQuery := fmt.Sprintf(
		`INSERT INTO %s (%s, %s, %s, %s, %s, %s)
		 VALUES ($1, $2, $3, $4, $5, $6)`,
		qualifiedIdentifier(scope.MultiValueTableName),
		quoteIdentifier(scope.MultiValueOwnerForeignKey),
		quoteIdentifier("field_key"),
		quoteIdentifier("value_kind"),
		quoteIdentifier("value_key"),
		quoteIdentifier("value_label"),
		quoteIdentifier("sort_order"),
	)
	for index, value := range selectedValues {
		label := field.OptionLabel[value]
		if strings.TrimSpace(label) == "" {
			label = value
		}
		if _, err := tx.ExecContext(ctx, insertQuery, ownerID, field.StorageKey, "option", value, label, int64(index)); err != nil {
			return fmt.Errorf("form runtime: insert multivalue field %s: %w", field.FieldID, err)
		}
	}
	return nil
}

func loadMultiValueValuesTx(
	ctx context.Context,
	tx *sql.Tx,
	scope runtimeRootScopePlan,
	ownerID int64,
	values map[string]any,
) error {
	fieldsByStorageKey := map[string]runtimeFieldPlan{}
	for _, field := range scope.Fields {
		if !field.Supported || !field.MultiValue || strings.TrimSpace(field.StorageKey) == "" {
			continue
		}
		fieldsByStorageKey[field.StorageKey] = field
		values[field.FieldID] = []string{}
	}
	if ownerID == 0 || len(fieldsByStorageKey) == 0 || strings.TrimSpace(scope.MultiValueTableName) == "" || strings.TrimSpace(scope.MultiValueOwnerForeignKey) == "" {
		return nil
	}

	query := fmt.Sprintf(
		`SELECT %s, COALESCE(%s, '')
		   FROM %s
		  WHERE %s = current_setting('app.tenant_id', true)::bigint
		    AND %s = $1
		  ORDER BY %s, %s, %s`,
		quoteIdentifier("field_key"),
		quoteIdentifier("value_key"),
		qualifiedIdentifier(scope.MultiValueTableName),
		quoteIdentifier("tenant_id"),
		quoteIdentifier(scope.MultiValueOwnerForeignKey),
		quoteIdentifier("field_key"),
		quoteIdentifier("sort_order"),
		quoteIdentifier("_id"),
	)
	rows, err := tx.QueryContext(ctx, query, ownerID)
	if err != nil {
		return fmt.Errorf("form runtime: load multivalue fields: %w", err)
	}
	defer func() { _ = rows.Close() }()

	for rows.Next() {
		var fieldKey string
		var value string
		if err := rows.Scan(&fieldKey, &value); err != nil {
			return fmt.Errorf("form runtime: scan multivalue field: %w", err)
		}
		field, ok := fieldsByStorageKey[strings.TrimSpace(fieldKey)]
		if !ok || strings.TrimSpace(value) == "" {
			continue
		}
		current, _ := values[field.FieldID].([]string)
		values[field.FieldID] = append(current, strings.TrimSpace(value))
	}
	if err := rows.Err(); err != nil {
		return fmt.Errorf("form runtime: read multivalue fields: %w", err)
	}
	return nil
}

func mergeChangedMultiValueValues(scope runtimeRootScopePlan, values map[string]any, changedValues map[string]any) {
	for _, field := range scope.Fields {
		if !field.Supported || !field.MultiValue {
			continue
		}
		rawValue, ok := changedValues[field.FieldID]
		if !ok {
			continue
		}
		values[field.FieldID] = normalizeRuntimeStringArray(rawValue)
	}
}

func deleteRootMultiValueRowsForDocGuidsTx(
	ctx context.Context,
	tx *sql.Tx,
	scope runtimeRootScopePlan,
	docGuids []string,
) error {
	if strings.TrimSpace(scope.MultiValueTableName) == "" || strings.TrimSpace(scope.MultiValueOwnerForeignKey) == "" {
		return nil
	}

	query := fmt.Sprintf(
		`DELETE FROM %s mv
		  USING %s root
		  WHERE mv.%s = current_setting('app.tenant_id', true)::bigint
		    AND root.%s = mv.%s
		    AND root.%s::text = ANY($1)`,
		qualifiedIdentifier(scope.MultiValueTableName),
		qualifiedIdentifier(scope.TableName),
		quoteIdentifier("tenant_id"),
		quoteIdentifier(scope.SourceIDColumn),
		quoteIdentifier(scope.MultiValueOwnerForeignKey),
		quoteIdentifier(scope.SourceGUIDColumn),
	)
	if scope.TenantScoped && scope.SourceTenantColumn != "" {
		query += fmt.Sprintf(" AND root.%s = current_setting('app.tenant_id', true)::bigint", quoteIdentifier(scope.SourceTenantColumn))
	}
	if _, err := tx.ExecContext(ctx, query, pq.Array(docGuids)); err != nil {
		return fmt.Errorf("form runtime: delete root multivalue rows: %w", err)
	}
	return nil
}

func deleteMultiValueRowsForOwnerTx(
	ctx context.Context,
	tx *sql.Tx,
	scope runtimeRootScopePlan,
	ownerID int64,
) error {
	if ownerID == 0 || strings.TrimSpace(scope.MultiValueTableName) == "" || strings.TrimSpace(scope.MultiValueOwnerForeignKey) == "" {
		return nil
	}

	query := fmt.Sprintf(
		`DELETE FROM %s
		  WHERE %s = current_setting('app.tenant_id', true)::bigint
		    AND %s = $1`,
		qualifiedIdentifier(scope.MultiValueTableName),
		quoteIdentifier("tenant_id"),
		quoteIdentifier(scope.MultiValueOwnerForeignKey),
	)
	if _, err := tx.ExecContext(ctx, query, ownerID); err != nil {
		return fmt.Errorf("form runtime: delete multivalue rows for owner: %w", err)
	}
	return nil
}

func quoteIdentifier(value string) string {
	return `"` + strings.ReplaceAll(value, `"`, `""`) + `"`
}

func qualifiedIdentifier(name string) string {
	return `"public".` + quoteIdentifier(name)
}
