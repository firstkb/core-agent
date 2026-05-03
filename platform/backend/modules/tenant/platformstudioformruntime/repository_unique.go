package platformstudioformruntime

import (
	"context"
	"database/sql"
	"fmt"
	"strings"

	"dtriton.com/platform/backend/internal/platform/httpx/requestctx"
)

func (r *repository) RootUniqueValueExists(
	ctx context.Context,
	tenant requestctx.TenantInfo,
	scope runtimeRootScopePlan,
	field runtimeFieldPlan,
	value string,
	excludeDocGuid string,
) (bool, error) {
	if !canCheckRuntimeUniqueValue(field, value) {
		return false, nil
	}

	db, err := r.client.OpenDBTenant(ctx, tenant.DBName, tenant.DBInstanceCode)
	if err != nil {
		return false, fmt.Errorf("form runtime: open tenant db: %w", err)
	}

	tx, err := db.BeginTx(ctx, &sql.TxOptions{ReadOnly: true})
	if err != nil {
		return false, fmt.Errorf("form runtime: begin root unique value tx: %w", err)
	}
	defer func() { _ = tx.Rollback() }()

	if err := setTenantContext(ctx, tx, tenant); err != nil {
		return false, err
	}

	exists, err := runtimeUniqueValueExistsTx(ctx, tx, scope, field, value, strings.TrimSpace(excludeDocGuid), nil)
	if err != nil {
		return false, err
	}
	if err := tx.Commit(); err != nil {
		return false, fmt.Errorf("form runtime: commit root unique value tx: %w", err)
	}
	return exists, nil
}

func (r *repository) SubformUniqueValueExists(
	ctx context.Context,
	tenant requestctx.TenantInfo,
	rootScope runtimeRootScopePlan,
	subformScope runtimeSubformScopePlan,
	parentDocGuid string,
	field runtimeFieldPlan,
	value string,
	excludeDocGuid string,
) (bool, error) {
	if strings.TrimSpace(parentDocGuid) == "" {
		return false, ErrInvalidRequest
	}
	if !canCheckRuntimeUniqueValue(field, value) {
		return false, nil
	}

	db, err := r.client.OpenDBTenant(ctx, tenant.DBName, tenant.DBInstanceCode)
	if err != nil {
		return false, fmt.Errorf("form runtime: open tenant db: %w", err)
	}

	tx, err := db.BeginTx(ctx, &sql.TxOptions{ReadOnly: true})
	if err != nil {
		return false, fmt.Errorf("form runtime: begin subform unique value tx: %w", err)
	}
	defer func() { _ = tx.Rollback() }()

	if err := setTenantContext(ctx, tx, tenant); err != nil {
		return false, err
	}

	parentRow, err := loadRootRecordTx(ctx, tx, rootScope, strings.TrimSpace(parentDocGuid))
	if err != nil {
		return false, err
	}

	recordScope := rootScopeFromSubform(rootScope, subformScope)
	exists, err := runtimeUniqueValueExistsTx(ctx, tx, recordScope, field, value, strings.TrimSpace(excludeDocGuid), []runtimeUniqueValueExtraClause{
		{
			ColumnName: subformScope.ParentForeignKey,
			Value:      parentRow.SourceID,
		},
	})
	if err != nil {
		return false, err
	}
	if err := tx.Commit(); err != nil {
		return false, fmt.Errorf("form runtime: commit subform unique value tx: %w", err)
	}
	return exists, nil
}

type runtimeUniqueValueExtraClause struct {
	ColumnName string
	Value      any
}

func canCheckRuntimeUniqueValue(field runtimeFieldPlan, value string) bool {
	return field.UniqueValue &&
		field.Supported &&
		!field.MultiValue &&
		strings.TrimSpace(field.ColumnName) != "" &&
		strings.TrimSpace(value) != ""
}

func runtimeUniqueValueExistsTx(
	ctx context.Context,
	tx *sql.Tx,
	scope runtimeRootScopePlan,
	field runtimeFieldPlan,
	value string,
	excludeDocGuid string,
	extraClauses []runtimeUniqueValueExtraClause,
) (bool, error) {
	if !canCheckRuntimeUniqueValue(field, value) {
		return false, nil
	}

	args := []any{strings.TrimSpace(value)}
	whereClauses := []string{
		runtimeUniqueValueComparisonClause(field, quoteIdentifier(field.ColumnName), "$1"),
	}
	for _, extraClause := range extraClauses {
		if strings.TrimSpace(extraClause.ColumnName) == "" {
			continue
		}
		args = append(args, extraClause.Value)
		whereClauses = append(whereClauses, fmt.Sprintf("%s = $%d", quoteIdentifier(extraClause.ColumnName), len(args)))
	}
	if scope.TenantScoped && strings.TrimSpace(scope.SourceTenantColumn) != "" {
		whereClauses = append(whereClauses, fmt.Sprintf("%s = current_setting('app.tenant_id', true)::bigint", quoteIdentifier(scope.SourceTenantColumn)))
	}
	if strings.TrimSpace(excludeDocGuid) != "" && strings.TrimSpace(scope.SourceGUIDColumn) != "" {
		args = append(args, strings.TrimSpace(excludeDocGuid))
		whereClauses = append(whereClauses, fmt.Sprintf("%s::text <> $%d", quoteIdentifier(scope.SourceGUIDColumn), len(args)))
	}

	query := fmt.Sprintf(
		"SELECT EXISTS (SELECT 1 FROM %s WHERE %s LIMIT 1)",
		qualifiedIdentifier(scope.TableName),
		strings.Join(whereClauses, " AND "),
	)
	var exists bool
	if err := tx.QueryRowContext(ctx, query, args...).Scan(&exists); err != nil {
		return false, fmt.Errorf("form runtime: check unique value for field %s: %w", field.FieldID, err)
	}
	return exists, nil
}

func runtimeUniqueValueComparisonClause(field runtimeFieldPlan, columnExpression string, placeholder string) string {
	if field.Preset == "phone" || field.Validation == "phone" {
		return fmt.Sprintf("regexp_replace(COALESCE(%s::text, ''), '[^0-9]', '', 'g') = BTRIM(%s::text)", columnExpression, placeholder)
	}
	if field.Preset == "email" || field.Validation == "email" {
		return fmt.Sprintf("LOWER(BTRIM(COALESCE(%s::text, ''))) = LOWER(BTRIM(%s::text))", columnExpression, placeholder)
	}
	return fmt.Sprintf("BTRIM(COALESCE(%s::text, '')) = BTRIM(%s::text)", columnExpression, placeholder)
}
