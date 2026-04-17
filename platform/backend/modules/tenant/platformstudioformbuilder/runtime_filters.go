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
) (string, []any, error) {
	var builder runtimeViewListWhereBuilder

	defaultClause, defaultArgs, err := buildRuntimeViewListDefaultFiltersClause(defaultFilters, fieldMeta, builder.nextArgIndex())
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
	for _, rawCondition := range conditions {
		clause, clauseArgs, err := buildRuntimeViewListDefaultFilterConditionClause(
			asMap(rawCondition),
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
			field.ColumnName,
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
			field.ColumnName,
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
		return buildRuntimeViewListTypedFilterClause(field.ColumnName, field.QueryKind, operator, argIndex, values)
	case "scalar_range":
		start := stringifyRuntimeFilterScalarValue(valueSource["start"])
		end := stringifyRuntimeFilterScalarValue(valueSource["end"])
		return buildRuntimeViewListTypedFilterClause(field.ColumnName, field.QueryKind, operator, argIndex, []string{start, end})
	case "relative_date":
		return buildRuntimeViewListTypedFilterClause(
			field.ColumnName,
			field.QueryKind,
			operator,
			argIndex,
			[]string{normalizeString(valueSource["preset"])},
		)
	default:
		return "", nil, collectiontable.ErrInvalidQuery
	}
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
			quoteIdentifier(strings.TrimSpace(field.ID)),
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
		field.ID,
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
