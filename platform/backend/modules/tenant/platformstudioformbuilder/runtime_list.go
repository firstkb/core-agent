package platformstudioformbuilder

import (
	"context"
	"fmt"
	"strings"

	"dtriton.com/platform/backend/internal/platform/httpx/requestctx"
	collectionprefs "dtriton.com/platform/backend/modules/shared/collectionprefs"
	collectiontable "dtriton.com/platform/backend/modules/shared/collectiontable"
)

const (
	runtimeViewListDefaultPageSize = 25
	runtimeViewListSurfacePrefix   = "form_builder_view"
)

var runtimeViewListPageSizeOptions = []int{10, 25, 50}

type runtimeViewListContext struct {
	CanAdd            bool
	CanDelete         bool
	CanEdit           bool
	CanView           bool
	DefaultFilters    map[string]any
	FieldDefinitions  []collectiontable.FieldDefinition
	Fields            []runtimeViewListFieldMeta
	GridViewName      string
	HasRecordGUID     bool
	Title             string
	ColumnDefinitions []collectiontable.ColumnDefinition
	DefaultFieldID    string
	DefaultSortColumn string
	DefaultSortDir    string
	SurfaceID         string
}

type runtimeViewListFieldMeta struct {
	AuthoringFieldID string
	ColumnName       string
	FieldID          string
	Label            string
	QueryKind        string
	Type             string
}

func (s *Service) LoadRuntimeViewListMeta(ctx context.Context, modelID string, viewID string) (*RuntimeViewListMetaResponse, error) {
	tenant, claims, err := s.requireAuthoringContext(ctx)
	if err != nil {
		return nil, err
	}

	runtimeContext, err := s.loadRuntimeViewListContext(ctx, tenant, modelID, viewID)
	if err != nil {
		return nil, err
	}
	isFavorite, err := s.repo.GetRuntimeFavoriteState(ctx, tenant, claims.UserID, runtimeContext.SurfaceID)
	if err != nil {
		return nil, err
	}
	savedFilterSets, err := s.repo.ListRuntimeSavedFilters(ctx, tenant, claims.UserID, runtimeContext.SurfaceID)
	if err != nil {
		return nil, err
	}
	bulkActions := buildRuntimeViewListBulkActions(runtimeContext)
	selectionEnabled := runtimeContext.HasRecordGUID && len(bulkActions) > 0

	return &RuntimeViewListMetaResponse{
		Actions: collectiontable.PageActions{
			Create:    collectiontable.VisibilityAction{Visible: runtimeContext.CanAdd && runtimeContext.HasRecordGUID},
			Reload:    collectiontable.VisibilityAction{Visible: true},
			ExportXLS: collectiontable.VisibilityAction{Visible: false},
			Favorite:  collectiontable.FavoriteAction{Visible: true, IsFavorite: isFavorite},
		},
		BulkActions: bulkActions,
		Columns:     runtimeContext.ColumnDefinitions,
		DefaultSort: collectiontable.SortRequest{
			ColumnID:  runtimeContext.DefaultSortColumn,
			Direction: collectiontable.NormalizeSortDirection(runtimeContext.DefaultSortDir),
		},
		Fields:          runtimeContext.FieldDefinitions,
		PageSizeOptions: append([]int(nil), runtimeViewListPageSizeOptions...),
		RowActions:      buildRuntimeViewListRowActions(runtimeContext.CanView, runtimeContext.CanEdit, runtimeContext.HasRecordGUID),
		RowLayout:       collectiontable.RowLayout{},
		SavedFilterSets: savedFilterSets,
		Search: collectiontable.SearchMeta{
			DefaultFieldID: runtimeContext.DefaultFieldID,
			Placeholder:    "Search rows",
		},
		Selection: collectiontable.SelectionMeta{
			ColumnPosition: "leading",
			Enabled:        selectionEnabled,
			Mode:           "multi",
		},
		SurfaceID: runtimeContext.SurfaceID,
		Title:     runtimeContext.Title,
	}, nil
}

func (s *Service) CreateRuntimeViewListSavedFilter(
	ctx context.Context,
	modelID string,
	viewID string,
	req RuntimeViewListCreateSavedFilterInput,
) (*RuntimeViewListSavedFilterSet, error) {
	tenant, claims, err := s.requireAuthoringContext(ctx)
	if err != nil {
		return nil, err
	}
	if strings.TrimSpace(req.Label) == "" {
		return nil, collectionprefs.ErrLabelRequired
	}
	if err := collectiontable.ValidateQuickFilters(req.QuickFilters); err != nil {
		return nil, collectionprefs.ErrInvalidSavedFilter
	}

	runtimeContext, err := s.loadRuntimeViewListContext(ctx, tenant, modelID, viewID)
	if err != nil {
		return nil, err
	}

	out, err := s.repo.CreateRuntimeSavedFilter(
		ctx,
		tenant,
		claims.UserID,
		runtimeContext.SurfaceID,
		req.Label,
		req.QuickFilters,
	)
	if err != nil {
		return nil, err
	}
	return out, nil
}

func (s *Service) DeleteRuntimeViewListSavedFilter(
	ctx context.Context,
	modelID string,
	viewID string,
	savedFilterID string,
) (*RuntimeViewListDeleteSavedFilterResponse, error) {
	tenant, claims, err := s.requireAuthoringContext(ctx)
	if err != nil {
		return nil, err
	}
	if strings.TrimSpace(savedFilterID) == "" {
		return nil, collectionprefs.ErrSavedFilterNotFound
	}

	runtimeContext, err := s.loadRuntimeViewListContext(ctx, tenant, modelID, viewID)
	if err != nil {
		return nil, err
	}

	if err := s.repo.DeleteRuntimeSavedFilter(
		ctx,
		tenant,
		claims.UserID,
		runtimeContext.SurfaceID,
		savedFilterID,
	); err != nil {
		return nil, err
	}

	return &RuntimeViewListDeleteSavedFilterResponse{OK: true}, nil
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
	whereClause, whereArgs, err := buildRuntimeViewListWhereClause(
		req.QuickFilters,
		runtimeContext.DefaultFilters,
		runtimeContext.FieldDefinitions,
		runtimeContext.Fields,
	)
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
	selectableRows := runtimeContext.HasRecordGUID && len(buildRuntimeViewListBulkActions(runtimeContext)) > 0
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
			Selectable: selectableRows && strings.TrimSpace(row.ID) != "",
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
	whereClause, whereArgs, err := buildRuntimeViewListWhereClause(
		nil,
		runtimeContext.DefaultFilters,
		runtimeContext.FieldDefinitions,
		runtimeContext.Fields,
	)
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
			whereClause,
			whereArgs,
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
	rootDataRuntime := readRuntimeDataScopeMetadata(dataSchemaScope(asMap(modelPayload["dataSchema"]), rootSchemaScopeID))
	hasRecordGUID, err := s.resolveRuntimeRecordGUIDSupport(ctx, tenant, model.SourceType, rootDataRuntime)
	if err != nil {
		return nil, err
	}
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
	defaultSortColumn, defaultSortDir := buildRuntimeViewListDefaultSort(asMap(viewPayload["uiSchema"]), rootScope.Fields, gridPlan)
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
		CanAdd:            readRuntimeViewAction(asMap(viewPayload["uiSchema"]), viewPayload, "canAdd", true),
		CanDelete:         readRuntimeViewAction(asMap(viewPayload["uiSchema"]), viewPayload, "canDelete", true),
		CanEdit:           readRuntimeViewAction(asMap(viewPayload["uiSchema"]), viewPayload, "canEdit", true),
		CanView:           readRuntimeViewCanView(asMap(viewPayload["uiSchema"]), viewPayload),
		DefaultFilters:    readRuntimeViewListDefaultFilters(asMap(viewPayload["uiSchema"])),
		FieldDefinitions:  fieldDefinitions,
		Fields:            fields,
		GridViewName:      gridViewName,
		HasRecordGUID:     hasRecordGUID,
		Title:             title,
		ColumnDefinitions: columnDefinitions,
		DefaultFieldID:    defaultFieldID,
		DefaultSortColumn: defaultSortColumn,
		DefaultSortDir:    defaultSortDir,
		SurfaceID:         buildRuntimeViewListSurfaceID(model.ModelID, view.ViewID),
	}, nil
}

func buildRuntimeViewListRowActions(canView bool, canEdit bool, hasRecordGUID bool) []collectiontable.RowActionDefinition {
	if !hasRecordGUID {
		return []collectiontable.RowActionDefinition{}
	}

	actions := []collectiontable.RowActionDefinition{}
	if canEdit {
		actions = append(actions, collectiontable.RowActionDefinition{
			ID:        "edit",
			Kind:      "button",
			Execution: "frontend",
		})
	}
	if canView {
		actions = append(actions, collectiontable.RowActionDefinition{
			ID:        "view",
			Kind:      "button",
			Execution: "frontend",
		})
	}
	return actions
}

func buildRuntimeViewListBulkActions(runtimeContext *runtimeViewListContext) []collectiontable.BulkActionDefinition {
	if runtimeContext == nil || !runtimeContext.HasRecordGUID {
		return []collectiontable.BulkActionDefinition{}
	}

	actions := []collectiontable.BulkActionDefinition{}
	if runtimeContext.CanEdit && runtimeViewListHasVisibleActiveField(runtimeContext.Fields) {
		actions = append(actions,
			collectiontable.BulkActionDefinition{
				ID:    "active",
				Kind:  "state-change",
				Label: "Active",
				Tone:  "success",
			},
			collectiontable.BulkActionDefinition{
				ID:    "inactive",
				Kind:  "state-change",
				Label: "No active",
				Tone:  "neutral",
			},
		)
	}
	if runtimeContext.CanDelete {
		actions = append(actions, collectiontable.BulkActionDefinition{
			Confirmation: &collectiontable.BulkActionConfirmation{
				CancelLabel:  "Cancel",
				ConfirmLabel: "Delete",
				Description:  "Selected records will be permanently deleted.",
				Title:        "Delete selected records?",
			},
			ID:    "delete",
			Kind:  "custom",
			Label: "Delete",
			Tone:  "danger",
		})
	}
	return actions
}

func runtimeViewListHasVisibleActiveField(fields []runtimeViewListFieldMeta) bool {
	for _, field := range fields {
		if field.Type != "boolean" {
			continue
		}
		if field.ColumnName == "active" || field.FieldID == "active" || field.AuthoringFieldID == "active" {
			return true
		}
	}
	return false
}

func (s *Service) resolveRuntimeRecordGUIDSupport(
	ctx context.Context,
	tenant requestctx.TenantInfo,
	sourceType string,
	runtime runtimeDataScopeMetadata,
) (bool, error) {
	if !isExternalRuntimeSourceType(sourceType) {
		return true, nil
	}
	if strings.TrimSpace(runtime.TableName) == "" {
		return false, nil
	}
	columnName, err := s.repo.ResolveRuntimeSourceGUIDColumn(ctx, tenant, runtime.TableName, runtime.SourceGUIDColumn)
	if err != nil {
		return false, err
	}
	return strings.TrimSpace(columnName) != "", nil
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

	fieldAuthoringIDs := make(map[string]string, len(fields)*2)
	fieldLabels := make(map[string]string, len(fields)*2)
	fieldQueryKinds := make(map[string]string, len(fields)*2)
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
		fieldAuthoringIDs[field.ColumnName] = field.FieldID
		fieldTypes[field.ColumnName] = runtimeViewListFieldType(field.Kind)
		fieldLabels[field.ColumnName] = label
		fieldQueryKinds[field.ColumnName] = runtimeViewListFieldQueryKind(field.Kind)

		defaultAlias := runtimeGridDefaultAliasForField(field)
		defaultColumn := runtimeGridDefaultColumnForField(field)
		if defaultAlias != "" {
			fieldAuthoringIDs[defaultAlias] = field.FieldID
			fieldTypes[defaultAlias] = runtimeViewListFieldType(field.Kind)
			fieldLabels[defaultAlias] = label
			fieldQueryKinds[defaultAlias] = runtimeViewListFieldQueryKind(field.Kind)
		}
		if defaultColumn != "" {
			fieldAuthoringIDs[defaultColumn] = field.FieldID
			fieldTypes[defaultColumn] = runtimeViewListFieldType(field.Kind)
			fieldLabels[defaultColumn] = label
			fieldQueryKinds[defaultColumn] = runtimeViewListFieldQueryKind(field.Kind)
		}
		for _, output := range field.LookupDerivedOutputs {
			fieldAuthoringIDs[output.ColumnName] = buildRuntimeLookupOutputBindingID(field.FieldID, output.OutputKey)
			fieldTypes[output.ColumnName] = runtimeViewListLookupOutputType(output.OutputKey, output.DataType)
			fieldLabels[output.ColumnName] = strings.TrimSpace(label + " " + humanizeIdentifier(output.OutputKey))
			fieldQueryKinds[output.ColumnName] = runtimeViewListLookupOutputQueryKind(output.DataType)
		}
	}

	out := make([]runtimeViewListFieldMeta, 0, len(gridPlan.Projections))
	for _, projection := range gridPlan.Projections {
		columnName := strings.TrimSpace(projection.AliasColumnName)
		if isRuntimeViewListSystemColumn(columnName) {
			continue
		}
		out = append(out, runtimeViewListFieldMeta{
			AuthoringFieldID: chooseString(fieldAuthoringIDs[columnName], columnName),
			ColumnName:       columnName,
			FieldID:          columnName,
			Label:            chooseString(fieldLabels[columnName], humanizeIdentifier(columnName)),
			QueryKind:        chooseString(fieldQueryKinds[columnName], "text"),
			Type:             chooseString(fieldTypes[columnName], "text"),
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

func readRuntimeViewListDefaultFilters(uiSchema map[string]any) map[string]any {
	rootScope := uiScope(uiSchema, rootSchemaScopeID)
	filterDefinitions := asMap(rootScope["filterDefinitions"])
	return asMap(filterDefinitions["defaultFilters"])
}

func buildRuntimeViewListDefaultSort(
	uiSchema map[string]any,
	fields []runtimeApplyFieldPlan,
	gridPlan *runtimeApplyGridViewPlan,
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
	if !runtimeGridViewPlanHasProjection(gridPlan, aliasColumnName) {
		return "", ""
	}

	return aliasColumnName, collectiontable.NormalizeSortDirection(normalizeString(sorting["direction"]))
}

func runtimeGridViewPlanHasProjection(gridPlan *runtimeApplyGridViewPlan, aliasColumnName string) bool {
	aliasColumnName = strings.TrimSpace(aliasColumnName)
	if gridPlan == nil || aliasColumnName == "" {
		return false
	}

	for _, projection := range gridPlan.Projections {
		if strings.TrimSpace(projection.AliasColumnName) == aliasColumnName {
			return true
		}
	}

	return false
}

func runtimeViewListFieldType(kind string) string {
	switch strings.TrimSpace(kind) {
	case "boolean":
		return "boolean"
	case "date":
		return "date"
	case "date_time":
		return "date_time"
	default:
		return "text"
	}
}

func runtimeViewListFieldQueryKind(kind string) string {
	switch strings.TrimSpace(kind) {
	case "boolean":
		return "boolean"
	case "currency", "decimal", "integer":
		return "number"
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

func runtimeViewListLookupOutputQueryKind(dataType string) string {
	switch strings.TrimSpace(dataType) {
	case "bigint", "decimal", "double precision", "integer", "numeric", "real", "smallint":
		return "number"
	case "date":
		return "date"
	case "timestamp", "timestamp with time zone", "timestamp without time zone", "timestamptz":
		return "date_time"
	default:
		return "text"
	}
}

func buildRuntimeLookupOutputBindingID(fieldID string, outputKey string) string {
	return strings.TrimSpace(fieldID) + "::lookup_output::" + strings.TrimSpace(outputKey)
}

func isRuntimeViewListSystemColumn(columnName string) bool {
	switch strings.TrimSpace(columnName) {
	case "_id", "tenant_id", "_guid", "_created_at", "_updated_at", runtimeParentForeignKey:
		return true
	default:
		return false
	}
}
