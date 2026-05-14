package platformstudioformbuilder

import (
	"fmt"
	"regexp"
	"strings"
	"time"

	collectiontable "dtriton.com/platform/backend/modules/shared/collectiontable"
)

var runtimeViewListNow = time.Now

var runtimeFilterDateOnlyPattern = regexp.MustCompile(`^\d{4}-\d{2}-\d{2}$`)

type runtimeViewListWhereBuilder struct {
	args    []any
	clauses []string
}

type runtimeViewListFilterContext struct {
	CurrentUserCompanyID int64
	CurrentUserID        int64
	DataViewName         string
	RootActor            bool
}

func (b *runtimeViewListWhereBuilder) nextArgIndex() int {
	return len(b.args) + 1
}

func (b *runtimeViewListWhereBuilder) appendClause(clause string, args []any) {
	clause = strings.TrimSpace(clause)
	if clause == "" {
		return
	}
	b.clauses = append(b.clauses, clause)
	b.args = append(b.args, args...)
}

func (b *runtimeViewListWhereBuilder) build() (string, []any) {
	if len(b.clauses) == 0 {
		return "", nil
	}
	return strings.Join(b.clauses, " AND "), append([]any(nil), b.args...)
}

func buildRuntimeViewListWhereClause(
	quickFilters []collectiontable.QuickFilter,
	defaultFilters map[string]any,
	fields []collectiontable.FieldDefinition,
	fieldMeta []runtimeViewListFieldMeta,
	filterContext runtimeViewListFilterContext,
) (string, []any, error) {
	var builder runtimeViewListWhereBuilder

	defaultClause, defaultArgs, err := buildRuntimeViewListDefaultFiltersClause(defaultFilters, fieldMeta, builder.nextArgIndex(), filterContext)
	if err != nil {
		return "", nil, err
	}
	builder.appendClause(defaultClause, defaultArgs)

	quickClause, quickArgs, err := buildRuntimeViewListQuickFiltersClause(quickFilters, fields, builder.nextArgIndex())
	if err != nil {
		return "", nil, err
	}
	builder.appendClause(quickClause, quickArgs)

	clause, args := builder.build()
	return clause, args, nil
}

func buildRuntimeViewListDefaultFiltersClause(
	defaultFilters map[string]any,
	fields []runtimeViewListFieldMeta,
	baseArgIndex int,
	filterContext runtimeViewListFilterContext,
) (string, []any, error) {
	if len(defaultFilters) == 0 {
		return "", nil, nil
	}

	conditions := asSlice(defaultFilters["conditions"])
	if len(conditions) == 0 {
		return "", nil, nil
	}

	logic := normalizeString(defaultFilters["logic"])
	if logic == "" {
		logic = "and"
	}
	if logic != "and" {
		return "", nil, collectiontable.ErrInvalidQuery
	}

	fieldsByID := make(map[string]runtimeViewListFieldMeta, len(fields)*2)
	for _, field := range fields {
		if authoringFieldID := strings.TrimSpace(field.AuthoringFieldID); authoringFieldID != "" {
			fieldsByID[authoringFieldID] = field
		}
		if runtimeFieldID := strings.TrimSpace(field.FieldID); runtimeFieldID != "" {
			fieldsByID[runtimeFieldID] = field
		}
	}

	clauses := make([]string, 0, len(conditions))
	args := make([]any, 0)
	lookupGroups := make(map[string][]runtimeViewListFieldMeta)
	lookupGroupOrder := make([]string, 0)
	lookupGroupFieldSeen := make(map[string]struct{})
	for _, rawCondition := range conditions {
		condition := asMap(rawCondition)
		if normalizeString(condition["editorType"]) == "lookup" {
			groups, err := collectRuntimeViewListLookupFilterGroups(condition, fieldsByID, filterContext)
			if err != nil {
				return "", nil, err
			}
			for _, groupKey := range runtimeViewListLookupGroupKeys(groups) {
				groupFields := groups[groupKey]
				if _, ok := lookupGroups[groupKey]; !ok {
					lookupGroupOrder = append(lookupGroupOrder, groupKey)
				}
				for _, groupField := range groupFields {
					fieldKey := groupKey + "\x00" + chooseString(groupField.AuthoringFieldID, groupField.FieldID)
					if _, ok := lookupGroupFieldSeen[fieldKey]; ok {
						continue
					}
					lookupGroupFieldSeen[fieldKey] = struct{}{}
					lookupGroups[groupKey] = append(lookupGroups[groupKey], groupField)
				}
			}
			continue
		}
		clause, clauseArgs, err := buildRuntimeViewListDefaultFilterConditionClause(
			condition,
			fieldsByID,
			baseArgIndex+len(args),
		)
		if err != nil {
			return "", nil, err
		}
		if strings.TrimSpace(clause) == "" {
			continue
		}
		clauses = append(clauses, clause)
		args = append(args, clauseArgs...)
	}
	for _, groupKey := range lookupGroupOrder {
		clause, clauseArgs, err := buildRuntimeViewListLookupSemanticGroupClause(
			groupKey,
			lookupGroups[groupKey],
			filterContext,
			baseArgIndex+len(args),
		)
		if err != nil {
			return "", nil, err
		}
		if strings.TrimSpace(clause) == "" {
			continue
		}
		clauses = append(clauses, clause)
		args = append(args, clauseArgs...)
	}

	if len(clauses) == 0 {
		return "", nil, nil
	}
	return strings.Join(clauses, " AND "), args, nil
}

func buildRuntimeViewListDefaultFilterConditionClause(
	condition map[string]any,
	fieldsByID map[string]runtimeViewListFieldMeta,
	argIndex int,
) (string, []any, error) {
	if len(condition) == 0 {
		return "", nil, collectiontable.ErrInvalidQuery
	}
	if normalizeString(condition["editorType"]) == "lookup" {
		return "", nil, collectiontable.ErrInvalidQuery
	}

	fieldID := normalizeString(condition["fieldId"])
	if fieldID == "" {
		return "", nil, collectiontable.ErrInvalidQuery
	}
	field, ok := fieldsByID[fieldID]
	if !ok {
		return "", nil, collectiontable.ErrInvalidQuery
	}

	operator := normalizeRuntimeViewListAuthoringOperator(normalizeString(condition["operator"]))
	if operator == "" {
		return "", nil, collectiontable.ErrInvalidQuery
	}

	if operator == "is_empty" || operator == "is_not_empty" {
		return buildRuntimeViewListTypedFilterClause(
			runtimeViewListQueryColumnName(field),
			field.QueryKind,
			operator,
			argIndex,
			nil,
		)
	}

	valueSource := asMap(condition["valueSource"])
	if len(valueSource) == 0 {
		return "", nil, collectiontable.ErrInvalidQuery
	}

	switch normalizeString(valueSource["kind"]) {
	case "literal":
		return buildRuntimeViewListTypedFilterClause(
			runtimeViewListQueryColumnName(field),
			field.QueryKind,
			operator,
			argIndex,
			[]string{stringifyRuntimeFilterScalarValue(valueSource["value"])},
		)
	case "literal_array":
		values := make([]string, 0, len(asSlice(valueSource["value"])))
		for _, rawValue := range asSlice(valueSource["value"]) {
			value := stringifyRuntimeFilterScalarValue(rawValue)
			if value != "" {
				values = append(values, value)
			}
		}
		return buildRuntimeViewListTypedFilterClause(runtimeViewListQueryColumnName(field), field.QueryKind, operator, argIndex, values)
	case "scalar_range":
		start := stringifyRuntimeFilterScalarValue(valueSource["start"])
		end := stringifyRuntimeFilterScalarValue(valueSource["end"])
		return buildRuntimeViewListTypedFilterClause(runtimeViewListQueryColumnName(field), field.QueryKind, operator, argIndex, []string{start, end})
	case "relative_date":
		return buildRuntimeViewListTypedFilterClause(
			runtimeViewListQueryColumnName(field),
			field.QueryKind,
			operator,
			argIndex,
			[]string{normalizeString(valueSource["preset"])},
		)
	default:
		return "", nil, collectiontable.ErrInvalidQuery
	}
}

func runtimeViewListDefaultFiltersRequireActorContext(defaultFilters map[string]any) bool {
	for _, rawCondition := range asSlice(defaultFilters["conditions"]) {
		condition := asMap(rawCondition)
		if normalizeString(condition["editorType"]) != "lookup" {
			continue
		}
		for _, rawClause := range asSlice(condition["clauses"]) {
			clause := asMap(rawClause)
			if !runtimeViewListLookupClauseEnabled(clause) {
				continue
			}
			switch normalizeString(clause["clauseKey"]) {
			case "active_account", "by_user_company", "business_unit_is_user_company", "main_company_is_user_company", "project_in_user_access":
				return true
			}
		}
	}
	return false
}

func collectRuntimeViewListLookupFilterGroups(
	condition map[string]any,
	fieldsByID map[string]runtimeViewListFieldMeta,
	filterContext runtimeViewListFilterContext,
) (map[string][]runtimeViewListFieldMeta, error) {
	if len(condition) == 0 {
		return nil, collectiontable.ErrInvalidQuery
	}

	fieldID := normalizeString(condition["fieldId"])
	if fieldID == "" {
		return nil, collectiontable.ErrInvalidQuery
	}

	field, ok := fieldsByID[fieldID]
	if !ok {
		if runtimeViewListSupportsLookupFilterPreset(normalizeString(condition["lookupPreset"])) {
			return nil, nil
		}
		return nil, collectiontable.ErrInvalidQuery
	}

	lookupPreset := chooseString(normalizeString(condition["lookupPreset"]), field.Preset)
	if !runtimeViewListSupportsLookupFilterPreset(lookupPreset) {
		return nil, collectiontable.ErrInvalidQuery
	}
	if filterContext.RootActor {
		return nil, nil
	}
	if field.Kind != "db_lookup" || field.Preset != lookupPreset || field.SelectionMode == "multiple" {
		return nil, nil
	}

	out := make(map[string][]runtimeViewListFieldMeta)
	for _, rawClause := range asSlice(condition["clauses"]) {
		clause := asMap(rawClause)
		if !runtimeViewListLookupClauseEnabled(clause) {
			continue
		}
		switch clauseKey := normalizeString(clause["clauseKey"]); clauseKey {
		case "active_account", "by_user_company":
			if lookupPreset != "contact_lookup" {
				return nil, collectiontable.ErrInvalidQuery
			}
			out[clauseKey] = append(out[clauseKey], field)
		case "business_unit_is_user_company", "main_company_is_user_company":
			if lookupPreset != "company_lookup" {
				return nil, collectiontable.ErrInvalidQuery
			}
			out[clauseKey] = append(out[clauseKey], field)
		case "project_in_user_access":
			if lookupPreset != "project_lookup" {
				return nil, collectiontable.ErrInvalidQuery
			}
			out[clauseKey] = append(out[clauseKey], field)
		default:
			return nil, collectiontable.ErrInvalidQuery
		}
	}
	return out, nil
}

func runtimeViewListSupportsLookupFilterPreset(preset string) bool {
	switch strings.TrimSpace(preset) {
	case "contact_lookup", "company_lookup", "project_lookup":
		return true
	default:
		return false
	}
}

func runtimeViewListLookupGroupKeys(groups map[string][]runtimeViewListFieldMeta) []string {
	if len(groups) == 0 {
		return nil
	}
	ordered := make([]string, 0, len(groups))
	for _, groupKey := range []string{"active_account", "by_user_company", "business_unit_is_user_company", "main_company_is_user_company", "project_in_user_access"} {
		if _, ok := groups[groupKey]; ok {
			ordered = append(ordered, groupKey)
		}
	}
	for groupKey := range groups {
		if groupKey == "active_account" ||
			groupKey == "by_user_company" ||
			groupKey == "business_unit_is_user_company" ||
			groupKey == "main_company_is_user_company" ||
			groupKey == "project_in_user_access" {
			continue
		}
		ordered = append(ordered, groupKey)
	}
	return ordered
}

func buildRuntimeViewListLookupSemanticGroupClause(
	groupKey string,
	fields []runtimeViewListFieldMeta,
	filterContext runtimeViewListFilterContext,
	argIndex int,
) (string, []any, error) {
	if len(fields) == 0 || filterContext.RootActor {
		return "", nil, nil
	}
	if strings.TrimSpace(filterContext.DataViewName) == "" {
		return "", nil, collectiontable.ErrInvalidQuery
	}

	value := int64(0)
	predicates := make([]string, 0, len(fields))
	switch strings.TrimSpace(groupKey) {
	case "active_account":
		value = filterContext.CurrentUserID
		if value == 0 {
			return "FALSE", nil, nil
		}
		for _, field := range fields {
			columnName := strings.TrimSpace(field.DataColumnName)
			if columnName == "" {
				return "", nil, collectiontable.ErrInvalidQuery
			}
			predicates = append(predicates, fmt.Sprintf(`dv.%s = $%d::bigint`, quoteIdentifier(columnName), argIndex))
		}
	case "by_user_company":
		value = filterContext.CurrentUserCompanyID
		if value == 0 {
			return "FALSE", nil, nil
		}
		for _, field := range fields {
			columnName := strings.TrimSpace(field.LookupOutputs["company_id"])
			if columnName == "" {
				return "", nil, collectiontable.ErrInvalidQuery
			}
			predicates = append(predicates, fmt.Sprintf(`dv.%s = $%d::bigint`, quoteIdentifier(columnName), argIndex))
		}
	case "business_unit_is_user_company":
		value = filterContext.CurrentUserCompanyID
		if value == 0 {
			return "FALSE", nil, nil
		}
		for _, field := range fields {
			columnName := strings.TrimSpace(field.DataColumnName)
			if columnName == "" {
				return "", nil, collectiontable.ErrInvalidQuery
			}
			predicates = append(predicates, fmt.Sprintf(`dv.%s = $%d::bigint`, quoteIdentifier(columnName), argIndex))
		}
	case "main_company_is_user_company":
		value = filterContext.CurrentUserCompanyID
		if value == 0 {
			return "FALSE", nil, nil
		}
		for _, field := range fields {
			columnName := strings.TrimSpace(field.DataColumnName)
			if columnName == "" {
				return "", nil, collectiontable.ErrInvalidQuery
			}
			predicates = append(predicates, buildRuntimeViewListCompanyMainCompanyPredicate(columnName, argIndex))
		}
	case "project_in_user_access":
		value = filterContext.CurrentUserID
		if value == 0 {
			return "FALSE", nil, nil
		}
		for _, field := range fields {
			columnName := strings.TrimSpace(field.DataColumnName)
			if columnName == "" {
				return "", nil, collectiontable.ErrInvalidQuery
			}
			predicates = append(predicates, buildRuntimeViewListProjectAccessPredicate(columnName, argIndex))
		}
	default:
		return "", nil, collectiontable.ErrInvalidQuery
	}
	if len(predicates) == 0 {
		return "", nil, nil
	}

	groupClause := predicates[0]
	if len(predicates) > 1 {
		groupClause = "(" + strings.Join(predicates, " OR ") + ")"
	}
	return buildRuntimeViewListDataViewExistsClause(filterContext.DataViewName, groupClause), []any{value}, nil
}

func buildRuntimeViewListCompanyMainCompanyPredicate(companyColumnName string, argIndex int) string {
	return fmt.Sprintf(
		`EXISTS (SELECT 1 FROM %s lookup_company WHERE lookup_company.%s = dv.%s AND lookup_company.%s IS NOT DISTINCT FROM dv.%s AND lookup_company.%s = $%d::bigint)`,
		qualifiedIdentifier("company"),
		quoteIdentifier("id"),
		quoteIdentifier(strings.TrimSpace(companyColumnName)),
		quoteIdentifier("tenant_id"),
		quoteIdentifier("tenant_id"),
		quoteIdentifier("main_company_id"),
		argIndex,
	)
}

func buildRuntimeViewListProjectAccessPredicate(projectColumnName string, argIndex int) string {
	return fmt.Sprintf(
		`EXISTS (SELECT 1 FROM %s project_access WHERE project_access.%s = dv.%s AND project_access.%s IS NOT DISTINCT FROM dv.%s AND project_access.%s = $%d::bigint)`,
		qualifiedIdentifier("projectsaccess"),
		quoteIdentifier("project_id"),
		quoteIdentifier(strings.TrimSpace(projectColumnName)),
		quoteIdentifier("tenant_id"),
		quoteIdentifier("tenant_id"),
		quoteIdentifier("user_id"),
		argIndex,
	)
}

func buildRuntimeViewListDataViewExistsClause(dataViewName string, predicate string) string {
	return fmt.Sprintf(
		`EXISTS (SELECT 1 FROM %s dv WHERE dv.%s = t.%s AND dv.%s IS NOT DISTINCT FROM t.%s AND %s)`,
		qualifiedIdentifier(strings.TrimSpace(dataViewName)),
		quoteIdentifier("_id"),
		quoteIdentifier("_id"),
		quoteIdentifier("tenant_id"),
		quoteIdentifier("tenant_id"),
		predicate,
	)
}

func runtimeViewListLookupClauseEnabled(clause map[string]any) bool {
	if normalizeString(clause["valueMode"]) != "boolean_flag" {
		return false
	}
	value, ok := clause["value"].(bool)
	return ok && value
}

func normalizeRuntimeViewListAuthoringOperator(operator string) string {
	switch strings.TrimSpace(operator) {
	case "between":
		return "between"
	case "contains":
		return "contains"
	case "eq":
		return "is_equal_to"
	case "is_equal_to":
		return "is_equal_to"
	case "gt":
		return "is_greater_than"
	case "is_greater_than":
		return "is_greater_than"
	case "gte":
		return "is_greater_or_equal_to"
	case "is_greater_or_equal_to":
		return "is_greater_or_equal_to"
	case "in":
		return "in"
	case "is_empty":
		return "is_empty"
	case "is_not_empty":
		return "is_not_empty"
	case "lt":
		return "is_less_than"
	case "is_less_than":
		return "is_less_than"
	case "lte":
		return "is_less_or_equal_to"
	case "is_less_or_equal_to":
		return "is_less_or_equal_to"
	case "neq":
		return "is_not_equal_to"
	case "is_not_equal_to":
		return "is_not_equal_to"
	case "not_contains":
		return "not_contains"
	case "relative_date":
		return "relative_date"
	default:
		return ""
	}
}

func buildRuntimeViewListQuickFiltersClause(
	filters []collectiontable.QuickFilter,
	fields []collectiontable.FieldDefinition,
	baseArgIndex int,
) (string, []any, error) {
	if len(filters) == 0 {
		return "", nil, nil
	}

	fieldsByID := make(map[string]collectiontable.FieldDefinition, len(fields))
	searchableFields := make([]collectiontable.FieldDefinition, 0, len(fields))
	for _, field := range fields {
		fieldID := strings.TrimSpace(field.ID)
		if fieldID == "" {
			continue
		}
		fieldsByID[fieldID] = field
		if field.Searchable {
			searchableFields = append(searchableFields, field)
		}
	}

	filterGroups := groupRuntimeViewListQuickFilters(filters)
	clauses := make([]string, 0, len(filterGroups))
	args := make([]any, 0)
	for _, group := range filterGroups {
		groupClauses := make([]string, 0, len(group))
		for _, filter := range group {
			fieldID := strings.TrimSpace(filter.FieldID)
			if fieldID == "all" {
				clause, clauseArgs, err := buildRuntimeViewListAllQuickFilterClause(
					searchableFields,
					filter,
					baseArgIndex+len(args),
				)
				if err != nil {
					return "", nil, err
				}
				groupClauses = append(groupClauses, clause)
				args = append(args, clauseArgs...)
				continue
			}

			field, ok := fieldsByID[fieldID]
			if !ok || !field.Searchable {
				return "", nil, collectiontable.ErrInvalidQuery
			}
			clause, clauseArgs, err := buildRuntimeViewListQuickFilterClause(field, filter, baseArgIndex+len(args))
			if err != nil {
				return "", nil, err
			}
			groupClauses = append(groupClauses, clause)
			args = append(args, clauseArgs...)
		}
		if len(groupClauses) == 1 {
			clauses = append(clauses, groupClauses[0])
			continue
		}
		clauses = append(clauses, "("+strings.Join(groupClauses, " OR ")+")")
	}

	if len(clauses) == 0 {
		return "", nil, nil
	}
	return strings.Join(clauses, " AND "), args, nil
}

func buildRuntimeViewListAllQuickFilterClause(
	fields []collectiontable.FieldDefinition,
	filter collectiontable.QuickFilter,
	argIndex int,
) (string, []any, error) {
	if strings.TrimSpace(filter.Operator) != "contains" {
		return "", nil, collectiontable.ErrInvalidQuery
	}

	searchableColumns := make([]string, 0, len(fields))
	for _, field := range fields {
		if !field.Searchable {
			continue
		}
		searchableColumns = append(searchableColumns, fmt.Sprintf(
			"LOWER(COALESCE(t.%s::text, '')) LIKE $%d",
			quoteIdentifier(runtimeViewListQueryColumnForFieldID(field.ID)),
			argIndex,
		))
	}
	if len(searchableColumns) == 0 {
		return "", nil, collectiontable.ErrInvalidQuery
	}

	return "(" + strings.Join(searchableColumns, " OR ") + ")", []any{"%" + strings.ToLower(strings.TrimSpace(filter.Value)) + "%"}, nil
}

func buildRuntimeViewListQuickFilterClause(
	field collectiontable.FieldDefinition,
	filter collectiontable.QuickFilter,
	argIndex int,
) (string, []any, error) {
	return buildRuntimeViewListTypedFilterClause(
		runtimeViewListQueryColumnForFieldID(field.ID),
		field.Type,
		strings.TrimSpace(filter.Operator),
		argIndex,
		[]string{strings.TrimSpace(filter.Value)},
	)
}

func buildRuntimeViewListTypedFilterClause(
	columnName string,
	queryKind string,
	operator string,
	argIndex int,
	values []string,
) (string, []any, error) {
	quotedColumnName := quoteIdentifier(strings.TrimSpace(columnName))
	operator = strings.TrimSpace(operator)
	queryKind = strings.TrimSpace(queryKind)

	switch queryKind {
	case "date", "date_time":
		return buildRuntimeViewListDateFilterClause(quotedColumnName, queryKind, operator, argIndex, values)
	case "number":
		return buildRuntimeViewListNumberFilterClause(quotedColumnName, operator, argIndex, values)
	case "boolean":
		return buildRuntimeViewListBooleanFilterClause(quotedColumnName, operator, argIndex, values)
	default:
		return buildRuntimeViewListTextFilterClause(quotedColumnName, operator, argIndex, values)
	}
}

func buildRuntimeViewListTextFilterClause(
	columnName string,
	operator string,
	argIndex int,
	values []string,
) (string, []any, error) {
	switch operator {
	case "contains":
		return fmt.Sprintf("LOWER(COALESCE(t.%s::text, '')) LIKE $%d", columnName, argIndex), []any{"%" + strings.ToLower(firstRuntimeFilterValue(values)) + "%"}, nil
	case "not_contains":
		return fmt.Sprintf("LOWER(COALESCE(t.%s::text, '')) NOT LIKE $%d", columnName, argIndex), []any{"%" + strings.ToLower(firstRuntimeFilterValue(values)) + "%"}, nil
	case "is_equal_to":
		return fmt.Sprintf("LOWER(COALESCE(t.%s::text, '')) = $%d", columnName, argIndex), []any{strings.ToLower(firstRuntimeFilterValue(values))}, nil
	case "is_not_equal_to":
		return fmt.Sprintf("LOWER(COALESCE(t.%s::text, '')) <> $%d", columnName, argIndex), []any{strings.ToLower(firstRuntimeFilterValue(values))}, nil
	case "in":
		if len(values) == 0 {
			return "", nil, collectiontable.ErrInvalidQuery
		}
		placeholders := make([]string, 0, len(values))
		args := make([]any, 0, len(values))
		for index, value := range values {
			placeholders = append(placeholders, fmt.Sprintf("$%d", argIndex+index))
			args = append(args, strings.ToLower(value))
		}
		return fmt.Sprintf("LOWER(COALESCE(t.%s::text, '')) IN (%s)", columnName, strings.Join(placeholders, ", ")), args, nil
	case "is_empty":
		return fmt.Sprintf("NULLIF(BTRIM(COALESCE(t.%s::text, '')), '') IS NULL", columnName), nil, nil
	case "is_not_empty":
		return fmt.Sprintf("NULLIF(BTRIM(COALESCE(t.%s::text, '')), '') IS NOT NULL", columnName), nil, nil
	default:
		return "", nil, collectiontable.ErrInvalidQuery
	}
}

func buildRuntimeViewListNumberFilterClause(
	columnName string,
	operator string,
	argIndex int,
	values []string,
) (string, []any, error) {
	switch operator {
	case "is_empty":
		return fmt.Sprintf("t.%s IS NULL", columnName), nil, nil
	case "is_not_empty":
		return fmt.Sprintf("t.%s IS NOT NULL", columnName), nil, nil
	case "is_equal_to":
		return fmt.Sprintf("t.%s::numeric = $%d::numeric", columnName, argIndex), []any{firstRuntimeFilterValue(values)}, nil
	case "is_not_equal_to":
		return fmt.Sprintf("t.%s::numeric <> $%d::numeric", columnName, argIndex), []any{firstRuntimeFilterValue(values)}, nil
	case "is_less_than":
		return fmt.Sprintf("t.%s::numeric < $%d::numeric", columnName, argIndex), []any{firstRuntimeFilterValue(values)}, nil
	case "is_less_or_equal_to":
		return fmt.Sprintf("t.%s::numeric <= $%d::numeric", columnName, argIndex), []any{firstRuntimeFilterValue(values)}, nil
	case "is_greater_than":
		return fmt.Sprintf("t.%s::numeric > $%d::numeric", columnName, argIndex), []any{firstRuntimeFilterValue(values)}, nil
	case "is_greater_or_equal_to":
		return fmt.Sprintf("t.%s::numeric >= $%d::numeric", columnName, argIndex), []any{firstRuntimeFilterValue(values)}, nil
	case "between":
		if len(values) < 2 {
			return "", nil, collectiontable.ErrInvalidQuery
		}
		return fmt.Sprintf("t.%s::numeric BETWEEN $%d::numeric AND $%d::numeric", columnName, argIndex, argIndex+1), []any{values[0], values[1]}, nil
	case "in":
		if len(values) == 0 {
			return "", nil, collectiontable.ErrInvalidQuery
		}
		placeholders := make([]string, 0, len(values))
		args := make([]any, 0, len(values))
		for index, value := range values {
			placeholders = append(placeholders, fmt.Sprintf("$%d::numeric", argIndex+index))
			args = append(args, value)
		}
		return fmt.Sprintf("t.%s::numeric IN (%s)", columnName, strings.Join(placeholders, ", ")), args, nil
	default:
		return "", nil, collectiontable.ErrInvalidQuery
	}
}

func buildRuntimeViewListBooleanFilterClause(
	columnName string,
	operator string,
	argIndex int,
	values []string,
) (string, []any, error) {
	switch operator {
	case "is_empty":
		return fmt.Sprintf("t.%s IS NULL", columnName), nil, nil
	case "is_not_empty":
		return fmt.Sprintf("t.%s IS NOT NULL", columnName), nil, nil
	case "is_equal_to":
		return fmt.Sprintf("t.%s = $%d::boolean", columnName, argIndex), []any{firstRuntimeFilterValue(values)}, nil
	case "is_not_equal_to":
		return fmt.Sprintf("t.%s <> $%d::boolean", columnName, argIndex), []any{firstRuntimeFilterValue(values)}, nil
	default:
		return "", nil, collectiontable.ErrInvalidQuery
	}
}

func buildRuntimeViewListDateFilterClause(
	columnName string,
	queryKind string,
	operator string,
	argIndex int,
	values []string,
) (string, []any, error) {
	switch operator {
	case "is_empty":
		return fmt.Sprintf("t.%s IS NULL", columnName), nil, nil
	case "is_not_empty":
		return fmt.Sprintf("t.%s IS NOT NULL", columnName), nil, nil
	case "relative_date":
		start, end, err := resolveRuntimeRelativeDatePreset(firstRuntimeFilterValue(values), runtimeViewListNow())
		if err != nil {
			return "", nil, err
		}
		switch {
		case start != "" && end != "":
			return fmt.Sprintf("t.%s::date BETWEEN $%d::date AND $%d::date", columnName, argIndex, argIndex+1), []any{start, end}, nil
		case start != "":
			return fmt.Sprintf("t.%s::date >= $%d::date", columnName, argIndex), []any{start}, nil
		case end != "":
			return fmt.Sprintf("t.%s::date <= $%d::date", columnName, argIndex), []any{end}, nil
		default:
			return "", nil, collectiontable.ErrInvalidQuery
		}
	case "between":
		if len(values) < 2 {
			return "", nil, collectiontable.ErrInvalidQuery
		}
		if queryKind == "date_time" && (!isRuntimeDateOnlyValue(values[0]) || !isRuntimeDateOnlyValue(values[1])) {
			return fmt.Sprintf("t.%s::timestamp BETWEEN $%d::timestamp AND $%d::timestamp", columnName, argIndex, argIndex+1), []any{values[0], values[1]}, nil
		}
		return fmt.Sprintf("t.%s::date BETWEEN $%d::date AND $%d::date", columnName, argIndex, argIndex+1), []any{values[0], values[1]}, nil
	default:
		value := firstRuntimeFilterValue(values)
		if queryKind == "date_time" && !isRuntimeDateOnlyValue(value) {
			switch operator {
			case "is_equal_to":
				return fmt.Sprintf("t.%s::timestamp = $%d::timestamp", columnName, argIndex), []any{value}, nil
			case "is_not_equal_to":
				return fmt.Sprintf("t.%s::timestamp <> $%d::timestamp", columnName, argIndex), []any{value}, nil
			case "is_less_than":
				return fmt.Sprintf("t.%s::timestamp < $%d::timestamp", columnName, argIndex), []any{value}, nil
			case "is_less_or_equal_to":
				return fmt.Sprintf("t.%s::timestamp <= $%d::timestamp", columnName, argIndex), []any{value}, nil
			case "is_greater_than":
				return fmt.Sprintf("t.%s::timestamp > $%d::timestamp", columnName, argIndex), []any{value}, nil
			case "is_greater_or_equal_to":
				return fmt.Sprintf("t.%s::timestamp >= $%d::timestamp", columnName, argIndex), []any{value}, nil
			default:
				return "", nil, collectiontable.ErrInvalidQuery
			}
		}
		switch operator {
		case "is_equal_to":
			return fmt.Sprintf("t.%s::date = $%d::date", columnName, argIndex), []any{value}, nil
		case "is_not_equal_to":
			return fmt.Sprintf("t.%s::date <> $%d::date", columnName, argIndex), []any{value}, nil
		case "is_less_than":
			return fmt.Sprintf("t.%s::date < $%d::date", columnName, argIndex), []any{value}, nil
		case "is_less_or_equal_to":
			return fmt.Sprintf("t.%s::date <= $%d::date", columnName, argIndex), []any{value}, nil
		case "is_greater_than":
			return fmt.Sprintf("t.%s::date > $%d::date", columnName, argIndex), []any{value}, nil
		case "is_greater_or_equal_to":
			return fmt.Sprintf("t.%s::date >= $%d::date", columnName, argIndex), []any{value}, nil
		default:
			return "", nil, collectiontable.ErrInvalidQuery
		}
	}
}

func resolveRuntimeRelativeDatePreset(preset string, now time.Time) (string, string, error) {
	today := time.Date(now.Year(), now.Month(), now.Day(), 0, 0, 0, 0, now.Location())
	switch strings.TrimSpace(preset) {
	case "current_month":
		start := time.Date(today.Year(), today.Month(), 1, 0, 0, 0, 0, today.Location())
		return start.Format(time.DateOnly), start.AddDate(0, 1, -1).Format(time.DateOnly), nil
	case "current_quarter":
		startMonth := time.Month(((int(today.Month()) - 1) / 3 * 3) + 1)
		start := time.Date(today.Year(), startMonth, 1, 0, 0, 0, 0, today.Location())
		return start.Format(time.DateOnly), start.AddDate(0, 3, -1).Format(time.DateOnly), nil
	case "current_week":
		start := startOfRuntimeWeek(today)
		return start.Format(time.DateOnly), start.AddDate(0, 0, 6).Format(time.DateOnly), nil
	case "current_year":
		start := time.Date(today.Year(), time.January, 1, 0, 0, 0, 0, today.Location())
		return start.Format(time.DateOnly), time.Date(today.Year(), time.December, 31, 0, 0, 0, 0, today.Location()).Format(time.DateOnly), nil
	case "last_12_months":
		return today.AddDate(-1, 0, 0).Format(time.DateOnly), today.Format(time.DateOnly), nil
	case "last_month":
		start := time.Date(today.Year(), today.Month(), 1, 0, 0, 0, 0, today.Location()).AddDate(0, -1, 0)
		return start.Format(time.DateOnly), start.AddDate(0, 1, -1).Format(time.DateOnly), nil
	case "last_quarter":
		startMonth := time.Month(((int(today.Month()) - 1) / 3 * 3) + 1)
		start := time.Date(today.Year(), startMonth, 1, 0, 0, 0, 0, today.Location()).AddDate(0, -3, 0)
		return start.Format(time.DateOnly), start.AddDate(0, 3, -1).Format(time.DateOnly), nil
	case "last_week":
		start := startOfRuntimeWeek(today).AddDate(0, 0, -7)
		return start.Format(time.DateOnly), start.AddDate(0, 0, 6).Format(time.DateOnly), nil
	case "last_year":
		start := time.Date(today.Year()-1, time.January, 1, 0, 0, 0, 0, today.Location())
		return start.Format(time.DateOnly), time.Date(today.Year()-1, time.December, 31, 0, 0, 0, 0, today.Location()).Format(time.DateOnly), nil
	case "next_3_days":
		return today.Format(time.DateOnly), today.AddDate(0, 0, 2).Format(time.DateOnly), nil
	case "next_5_days":
		return today.Format(time.DateOnly), today.AddDate(0, 0, 4).Format(time.DateOnly), nil
	case "next_7_days":
		return today.Format(time.DateOnly), today.AddDate(0, 0, 6).Format(time.DateOnly), nil
	case "next_month":
		start := time.Date(today.Year(), today.Month(), 1, 0, 0, 0, 0, today.Location()).AddDate(0, 1, 0)
		return start.Format(time.DateOnly), start.AddDate(0, 1, -1).Format(time.DateOnly), nil
	case "next_quarter":
		startMonth := time.Month(((int(today.Month()) - 1) / 3 * 3) + 1)
		start := time.Date(today.Year(), startMonth, 1, 0, 0, 0, 0, today.Location()).AddDate(0, 3, 0)
		return start.Format(time.DateOnly), start.AddDate(0, 3, -1).Format(time.DateOnly), nil
	case "next_week":
		start := startOfRuntimeWeek(today).AddDate(0, 0, 7)
		return start.Format(time.DateOnly), start.AddDate(0, 0, 6).Format(time.DateOnly), nil
	case "next_year":
		start := time.Date(today.Year()+1, time.January, 1, 0, 0, 0, 0, today.Location())
		return start.Format(time.DateOnly), time.Date(today.Year()+1, time.December, 31, 0, 0, 0, 0, today.Location()).Format(time.DateOnly), nil
	case "today_or_earlier":
		return "", today.Format(time.DateOnly), nil
	case "today_or_later":
		return today.Format(time.DateOnly), "", nil
	default:
		return "", "", collectiontable.ErrInvalidQuery
	}
}

func startOfRuntimeWeek(value time.Time) time.Time {
	weekday := int(value.Weekday())
	if weekday == 0 {
		weekday = 7
	}
	return value.AddDate(0, 0, -(weekday - 1))
}

func isRuntimeDateOnlyValue(value string) bool {
	return runtimeFilterDateOnlyPattern.MatchString(strings.TrimSpace(value))
}

func stringifyRuntimeFilterScalarValue(value any) string {
	switch typed := value.(type) {
	case nil:
		return ""
	case string:
		return strings.TrimSpace(typed)
	case fmt.Stringer:
		return strings.TrimSpace(typed.String())
	default:
		return strings.TrimSpace(fmt.Sprintf("%v", typed))
	}
}

func firstRuntimeFilterValue(values []string) string {
	if len(values) == 0 {
		return ""
	}
	return strings.TrimSpace(values[0])
}

func groupRuntimeViewListQuickFilters(filters []collectiontable.QuickFilter) [][]collectiontable.QuickFilter {
	groups := make([][]collectiontable.QuickFilter, 0, len(filters))
	containsGroupIndexes := make(map[string]int)
	for _, filter := range filters {
		normalized := collectiontable.QuickFilter{
			FieldID:  strings.TrimSpace(filter.FieldID),
			Operator: strings.TrimSpace(filter.Operator),
			Value:    strings.TrimSpace(filter.Value),
		}
		if normalized.Operator == "contains" {
			groupKey := normalized.FieldID + "\x00" + normalized.Operator
			if existingIndex, ok := containsGroupIndexes[groupKey]; ok {
				groups[existingIndex] = append(groups[existingIndex], normalized)
				continue
			}
			containsGroupIndexes[groupKey] = len(groups)
		}
		groups = append(groups, []collectiontable.QuickFilter{normalized})
	}
	return groups
}
