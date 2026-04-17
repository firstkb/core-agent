package platformstudioformbuilder

import (
	"context"
	"fmt"
	"strings"

	"dtriton.com/platform/backend/internal/platform/httpx/requestctx"
	collectiontable "dtriton.com/platform/backend/modules/shared/collectiontable"
)

const (
	runtimeViewListDefaultPageSize = 25
	runtimeViewListSurfacePrefix   = "form_builder_view"
)

var runtimeViewListPageSizeOptions = []int{10, 25, 50}

type runtimeViewListContext struct {
	CanView           bool
	FieldDefinitions  []collectiontable.FieldDefinition
	Fields            []runtimeViewListFieldMeta
	GridViewName      string
	Title             string
	ColumnDefinitions []collectiontable.ColumnDefinition
	DefaultFieldID    string
	DefaultSortColumn string
	DefaultSortDir    string
	SurfaceID         string
}

type runtimeViewListFieldMeta struct {
	ColumnName string
	FieldID    string
	Label      string
	Type       string
}

func (s *Service) LoadRuntimeViewListMeta(ctx context.Context, modelID string, viewID string) (*RuntimeViewListMetaResponse, error) {
	tenant, _, err := s.requireAuthoringContext(ctx)
	if err != nil {
		return nil, err
	}

	runtimeContext, err := s.loadRuntimeViewListContext(ctx, tenant, modelID, viewID)
	if err != nil {
		return nil, err
	}

	return &RuntimeViewListMetaResponse{
		Actions: collectiontable.PageActions{
			Create:    collectiontable.VisibilityAction{Visible: false},
			Reload:    collectiontable.VisibilityAction{Visible: true},
			ExportXLS: collectiontable.VisibilityAction{Visible: false},
			Favorite:  collectiontable.FavoriteAction{Visible: false, IsFavorite: false},
		},
		BulkActions:     []collectiontable.BulkActionDefinition{},
		Columns:         runtimeContext.ColumnDefinitions,
		DefaultSort: collectiontable.SortRequest{
			ColumnID:  runtimeContext.DefaultSortColumn,
			Direction: collectiontable.NormalizeSortDirection(runtimeContext.DefaultSortDir),
		},
		Fields:          runtimeContext.FieldDefinitions,
		PageSizeOptions: append([]int(nil), runtimeViewListPageSizeOptions...),
		RowActions:      buildRuntimeViewListRowActions(runtimeContext.CanView),
		RowLayout:       collectiontable.RowLayout{},
		SavedFilterSets: []collectiontable.SavedFilterSet{},
		Search: collectiontable.SearchMeta{
			DefaultFieldID: runtimeContext.DefaultFieldID,
			Placeholder:    "Search rows",
		},
		Selection: collectiontable.SelectionMeta{
			Enabled: false,
		},
		SurfaceID: runtimeContext.SurfaceID,
		Title:     runtimeContext.Title,
	}, nil
}

func (s *Service) QueryRuntimeViewList(
	ctx context.Context,
	modelID string,
	viewID string,
	req RuntimeViewListQueryRequest,
) (*RuntimeViewListQueryResponse, error) {
	tenant, _, err := s.requireAuthoringContext(ctx)
	if err != nil {
		return nil, err
	}

	runtimeContext, err := s.loadRuntimeViewListContext(ctx, tenant, modelID, viewID)
	if err != nil {
		return nil, err
	}
	if err := collectiontable.ValidateQueryRequest(req, runtimeContext.FieldDefinitions); err != nil {
		return nil, err
	}

	page := req.Page
	if page < 1 {
		page = 1
	}
	pageSize := collectiontable.NormalizePageSize(req.PageSize, runtimeViewListPageSizeOptions, runtimeViewListDefaultPageSize)
	whereClause, whereArgs, err := buildRuntimeViewListWhereClause(req.QuickFilters, runtimeContext.FieldDefinitions)
	if err != nil {
		return nil, err
	}

	orderByColumn := strings.TrimSpace(req.Sort.ColumnID)
	orderDirection := collectiontable.NormalizeSortDirection(req.Sort.Direction)
	if orderByColumn == "" {
		orderByColumn = runtimeContext.DefaultSortColumn
		orderDirection = collectiontable.NormalizeSortDirection(runtimeContext.DefaultSortDir)
		if orderByColumn == "" {
			orderByColumn = "_created_at"
			orderDirection = collectiontable.SortDirectionDesc
		}
	}

	columnNames := make([]string, 0, len(runtimeContext.Fields))
	for _, field := range runtimeContext.Fields {
		columnNames = append(columnNames, field.ColumnName)
	}

	rows, totalItems, err := s.repo.QueryRuntimeRows(
		ctx,
		tenant,
		runtimeContext.GridViewName,
		columnNames,
		whereClause,
		whereArgs,
		orderByColumn,
		orderDirection,
		page,
		pageSize,
	)
	if err != nil {
		return nil, err
	}

	tableRows := make([]collectiontable.TableRow, 0, len(rows))
	for _, row := range rows {
		cells := make(map[string]collectiontable.RowCell, len(runtimeContext.Fields))
		for _, field := range runtimeContext.Fields {
			value := row.Cells[field.ColumnName]
			cells[field.FieldID] = collectiontable.RowCell{
				DisplayValue: value,
				Value:        value,
			}
		}
		tableRows = append(tableRows, collectiontable.TableRow{
			ID:         row.ID,
			Selectable: false,
			Cells:      cells,
		})
	}

	return &RuntimeViewListQueryResponse{
		Page:       page,
		PageSize:   pageSize,
		Rows:       tableRows,
		TotalItems: totalItems,
		TotalPages: collectiontable.TotalPageCount(totalItems, pageSize),
	}, nil
}

func (s *Service) LoadRuntimeViewListSearchSuggestions(
	ctx context.Context,
	modelID string,
	viewID string,
) (*RuntimeViewListSearchSuggestionsResponse, error) {
	tenant, _, err := s.requireAuthoringContext(ctx)
	if err != nil {
		return nil, err
	}

	runtimeContext, err := s.loadRuntimeViewListContext(ctx, tenant, modelID, viewID)
	if err != nil {
		return nil, err
	}

	groups := make([]collectiontable.SearchSuggestionGroup, 0)
	for _, field := range runtimeContext.FieldDefinitions {
		if !field.Suggestable {
			continue
		}
		suggestions, err := s.repo.LoadRuntimeSuggestions(
			ctx,
			tenant,
			runtimeContext.GridViewName,
			field.ID,
			collectiontable.SuggestionGroupLimit,
		)
		if err != nil {
			return nil, err
		}
		items := make([]collectiontable.SearchSuggestionItem, 0, len(suggestions))
		for _, suggestion := range suggestions {
			items = append(items, collectiontable.SearchSuggestionItem{
				Value: suggestion.Value,
				Count: suggestion.Count,
			})
		}
		if len(items) == 0 {
			continue
		}
		groups = append(groups, collectiontable.SearchSuggestionGroup{
			FieldID: field.ID,
			Label:   field.Label,
			Items:   items,
		})
	}

	return &RuntimeViewListSearchSuggestionsResponse{
		Groups: groups,
	}, nil
}

func (s *Service) loadRuntimeViewListContext(
	ctx context.Context,
	tenant requestctx.TenantInfo,
	modelID string,
	viewID string,
) (*runtimeViewListContext, error) {
	model, err := s.resolveModel(ctx, tenant, modelID)
	if err != nil {
		return nil, err
	}

	viewID = strings.TrimSpace(viewID)
	if viewID == "" {
		return nil, ErrViewNotFound
	}
	view, err := s.repo.GetView(ctx, tenant, model.ModelID, viewID)
	if err != nil {
		return nil, err
	}
	if view == nil {
		return nil, ErrViewNotFound
	}

	views, err := s.repo.ListViews(ctx, tenant, model.ModelID)
	if err != nil {
		return nil, err
	}

	modelPayload, err := buildCanonicalModelPayload(model, views)
	if err != nil {
		return nil, err
	}
	viewPayload, err := buildCanonicalViewPayload(model, view, views, modelPayload)
	if err != nil {
		return nil, err
	}
	lookupModels, err := s.resolveRuntimeLookupModels(ctx, tenant, modelPayload)
	if err != nil {
		return nil, err
	}

	runtimePlan := buildRuntimeApplyPlan(model, views, modelPayload, lookupModels)
	rootScope := runtimePlan.RootScope
	rootViewRuntime := readRuntimeViewScopeMetadata(uiScope(asMap(viewPayload["uiSchema"]), rootSchemaScopeID))
	gridViewName := strings.TrimSpace(rootViewRuntime.GridViewName)
	if gridViewName == "" {
		return nil, ErrInvalidDraft
	}

	var gridPlan *runtimeApplyGridViewPlan
	for index := range rootScope.GridViews {
		if strings.TrimSpace(rootScope.GridViews[index].Name) == gridViewName {
			gridPlan = &rootScope.GridViews[index]
			break
		}
	}
	if gridPlan == nil {
		return nil, ErrInvalidDraft
	}

	dataSchema := asMap(modelPayload["dataSchema"])
	fields := buildRuntimeViewListFields(dataSchema, asMap(viewPayload["uiSchema"]), rootScope.Fields, gridPlan)
	defaultSortColumn, defaultSortDir := buildRuntimeViewListDefaultSort(asMap(viewPayload["uiSchema"]), rootScope.Fields)
	fieldDefinitions := make([]collectiontable.FieldDefinition, 0, len(fields))
	columnDefinitions := make([]collectiontable.ColumnDefinition, 0, len(fields))
	defaultFieldID := ""
	for _, field := range fields {
		searchable := field.Type == "text" || field.Type == "date" || field.Type == "date_time"
		suggestable := field.Type == "text"
		fieldDefinitions = append(fieldDefinitions, collectiontable.FieldDefinition{
			ID:          field.FieldID,
			Label:       field.Label,
			Type:        field.Type,
			Searchable:  searchable,
			Sortable:    true,
			Suggestable: suggestable,
		})
		columnDefinitions = append(columnDefinitions, collectiontable.ColumnDefinition{
			ID:             field.FieldID,
			Label:          field.Label,
			Type:           field.Type,
			FieldID:        field.FieldID,
			DefaultVisible: true,
		})
		if defaultFieldID == "" && searchable {
			defaultFieldID = field.FieldID
		}
	}

	title := chooseString(normalizeString(viewPayload["title"]), view.DisplayName)
	if title == "" {
		title = chooseString(model.DisplayName, model.ModelID)
	}

	return &runtimeViewListContext{
		CanView:           readRuntimeViewCanView(asMap(viewPayload["uiSchema"]), viewPayload),
		FieldDefinitions:  fieldDefinitions,
		Fields:            fields,
		GridViewName:      gridViewName,
		Title:             title,
		ColumnDefinitions: columnDefinitions,
		DefaultFieldID:    defaultFieldID,
		DefaultSortColumn: defaultSortColumn,
		DefaultSortDir:    defaultSortDir,
		SurfaceID:         buildRuntimeViewListSurfaceID(model.ModelID, view.ViewID),
	}, nil
}

func buildRuntimeViewListRowActions(canView bool) []collectiontable.RowActionDefinition {
	if !canView {
		return []collectiontable.RowActionDefinition{}
	}

	return []collectiontable.RowActionDefinition{
		{
			ID:        "view",
			Kind:      "button",
			Execution: "frontend",
		},
	}
}

func buildRuntimeViewListSurfaceID(modelID string, viewID string) string {
	return fmt.Sprintf("%s:%s:%s", runtimeViewListSurfacePrefix, strings.TrimSpace(modelID), strings.TrimSpace(viewID))
}

func buildRuntimeViewListFields(
	dataSchema map[string]any,
	uiSchema map[string]any,
	fields []runtimeApplyFieldPlan,
	gridPlan *runtimeApplyGridViewPlan,
) []runtimeViewListFieldMeta {
	if gridPlan == nil {
		return nil
	}

	fieldLabels := make(map[string]string, len(fields)*2)
	fieldTypes := make(map[string]string, len(fields)*2)
	rootFields := asSlice(asMap(dataSchema["rootScope"])["fields"])
	fieldSchemaByID := make(map[string]map[string]any, len(rootFields))
	for _, rawField := range rootFields {
		field := asMap(rawField)
		fieldID := chooseString(normalizeString(field["fieldId"]), chooseString(normalizeString(field["id"]), normalizeString(field["key"])))
		if fieldID == "" {
			continue
		}
		fieldSchemaByID[fieldID] = field
	}
	viewFieldTitlesByID := buildRuntimeViewListFieldTitlesByID(uiSchema)

	for _, field := range fields {
		if !field.Supported {
			continue
		}
		schemaField := fieldSchemaByID[field.FieldID]
		label := chooseString(
			viewFieldTitlesByID[field.FieldID],
			chooseString(
				normalizeString(schemaField["label"]),
				chooseString(normalizeString(schemaField["displayName"]), humanizeIdentifier(field.StorageKey)),
			),
		)
		fieldTypes[field.ColumnName] = runtimeViewListFieldType(field.Kind)
		fieldLabels[field.ColumnName] = label

		defaultAlias := runtimeGridDefaultAliasForField(field)
		defaultColumn := runtimeGridDefaultColumnForField(field)
		if defaultAlias != "" {
			fieldTypes[defaultAlias] = runtimeViewListFieldType(field.Kind)
			fieldLabels[defaultAlias] = label
		}
		if defaultColumn != "" {
			fieldTypes[defaultColumn] = runtimeViewListFieldType(field.Kind)
			fieldLabels[defaultColumn] = label
		}
		for _, output := range field.LookupDerivedOutputs {
			fieldTypes[output.ColumnName] = runtimeViewListLookupOutputType(output.OutputKey, output.DataType)
			fieldLabels[output.ColumnName] = strings.TrimSpace(label + " " + humanizeIdentifier(output.OutputKey))
		}
	}

	out := make([]runtimeViewListFieldMeta, 0, len(gridPlan.Projections))
	for _, projection := range gridPlan.Projections {
		columnName := strings.TrimSpace(projection.AliasColumnName)
		if isRuntimeViewListSystemColumn(columnName) {
			continue
		}
		out = append(out, runtimeViewListFieldMeta{
			ColumnName: columnName,
			FieldID:    columnName,
			Label:      chooseString(fieldLabels[columnName], humanizeIdentifier(columnName)),
			Type:       chooseString(fieldTypes[columnName], "text"),
		})
	}
	return out
}

func buildRuntimeViewListFieldTitlesByID(uiSchema map[string]any) map[string]string {
	rootScope := uiScope(uiSchema, rootSchemaScopeID)
	nodes := asSlice(asMap(rootScope)["nodes"])
	if len(nodes) == 0 {
		return nil
	}

	out := make(map[string]string, len(nodes))
	for _, rawNode := range nodes {
		node := asMap(rawNode)
		if normalizeString(node["type"]) != "field" {
			continue
		}
		fieldID := normalizeString(node["fieldId"])
		title := normalizeString(node["title"])
		if fieldID == "" || title == "" {
			continue
		}
		out[fieldID] = title
	}
	return out
}

func buildRuntimeViewListDefaultSort(
	uiSchema map[string]any,
	fields []runtimeApplyFieldPlan,
) (string, string) {
	rootScope := uiScope(uiSchema, rootSchemaScopeID)
	viewSettings := asMap(rootScope["viewSettings"])
	listSettings := asMap(viewSettings["list"])
	sorting := asMap(listSettings["sorting"])
	fieldID := normalizeString(sorting["fieldId"])
	if fieldID == "" {
		return "", ""
	}

	fieldsByID := make(map[string]runtimeApplyFieldPlan, len(fields))
	for _, field := range fields {
		fieldsByID[field.FieldID] = field
	}
	bindingType, resolvedFieldID, outputID := parseRuntimeGridColumnFieldID(fieldID)
	if resolvedFieldID == "" {
		resolvedFieldID = fieldID
	}
	_, aliasColumnName := runtimeGridColumnProjectionForSelection(runtimeApplyGridColumnSelection{
		BindingType: bindingType,
		FieldID:     resolvedFieldID,
		OutputID:    outputID,
	}, fieldsByID)
	if aliasColumnName == "" {
		return "", ""
	}

	return aliasColumnName, collectiontable.NormalizeSortDirection(normalizeString(sorting["direction"]))
}

func runtimeViewListFieldType(kind string) string {
	switch strings.TrimSpace(kind) {
	case "date":
		return "date"
	case "date_time":
		return "date_time"
	default:
		return "text"
	}
}

func runtimeViewListLookupOutputType(outputKey string, dataType string) string {
	switch strings.TrimSpace(dataType) {
	case "timestamp":
		return "date_time"
	case "date":
		return "date"
	}
	if strings.TrimSpace(outputKey) == "date" {
		return "date"
	}
	return "text"
}

func isRuntimeViewListSystemColumn(columnName string) bool {
	switch strings.TrimSpace(columnName) {
	case "_id", "tenant_id", "_guid", "_created_at", "_updated_at", runtimeParentForeignKey:
		return true
	default:
		return false
	}
}

func buildRuntimeViewListWhereClause(
	filters []collectiontable.QuickFilter,
	fields []collectiontable.FieldDefinition,
) (string, []any, error) {
	if len(filters) == 0 {
		return "", nil, nil
	}

	fieldsByID := make(map[string]collectiontable.FieldDefinition, len(fields))
	for _, field := range fields {
		fieldsByID[strings.TrimSpace(field.ID)] = field
	}

	filterGroups := groupRuntimeViewListQuickFilters(filters)
	clauses := make([]string, 0, len(filterGroups))
	args := make([]any, 0)
	for _, group := range filterGroups {
		groupClauses := make([]string, 0, len(group))
		for _, filter := range group {
			fieldID := strings.TrimSpace(filter.FieldID)
			field, ok := fieldsByID[fieldID]
			if !ok || !field.Searchable {
				return "", nil, collectiontable.ErrInvalidQuery
			}
			clause, clauseArgs, err := buildRuntimeViewListFilterClause(field, filter, len(args)+1)
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

	return strings.Join(clauses, " AND "), args, nil
}

func buildRuntimeViewListFilterClause(
	field collectiontable.FieldDefinition,
	filter collectiontable.QuickFilter,
	argIndex int,
) (string, []any, error) {
	columnName := quoteIdentifier(strings.TrimSpace(field.ID))
	operator := strings.TrimSpace(filter.Operator)
	value := strings.TrimSpace(filter.Value)

	if field.Type == "date" || field.Type == "date_time" {
		switch operator {
		case "is_empty":
			return fmt.Sprintf("t.%s IS NULL", columnName), nil, nil
		case "is_not_empty":
			return fmt.Sprintf("t.%s IS NOT NULL", columnName), nil, nil
		case "is_equal_to":
			return fmt.Sprintf("t.%s::date = $%d::date", columnName, argIndex), []any{value}, nil
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

	switch operator {
	case "contains":
		return fmt.Sprintf("LOWER(COALESCE(t.%s::text, '')) LIKE $%d", columnName, argIndex), []any{"%" + strings.ToLower(value) + "%"}, nil
	case "is_equal_to":
		return fmt.Sprintf("LOWER(COALESCE(t.%s::text, '')) = $%d", columnName, argIndex), []any{strings.ToLower(value)}, nil
	case "is_not_equal_to":
		return fmt.Sprintf("LOWER(COALESCE(t.%s::text, '')) <> $%d", columnName, argIndex), []any{strings.ToLower(value)}, nil
	case "is_empty":
		return fmt.Sprintf("NULLIF(BTRIM(COALESCE(t.%s::text, '')), '') IS NULL", columnName), nil, nil
	case "is_not_empty":
		return fmt.Sprintf("NULLIF(BTRIM(COALESCE(t.%s::text, '')), '') IS NOT NULL", columnName), nil, nil
	default:
		return "", nil, collectiontable.ErrInvalidQuery
	}
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
