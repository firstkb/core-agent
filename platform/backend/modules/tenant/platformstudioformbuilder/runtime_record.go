package platformstudioformbuilder

import (
	"context"
	"sort"
	"strings"

	"dtriton.com/platform/backend/internal/platform/httpx/requestctx"
	collectiontable "dtriton.com/platform/backend/modules/shared/collectiontable"
)

type runtimeViewRecordFieldMeta struct {
	ColumnName string
	FieldID    string
	Label      string
	Type       string
}

type runtimeViewRecordSubtableMeta struct {
	DataViewName string
	ID           string
	Title        string
	Columns      []collectiontable.ColumnDefinition
	Fields       []runtimeViewRecordFieldMeta
}

type runtimeViewRecordContext struct {
	CanView   bool
	DataView  string
	Fields    []runtimeViewRecordFieldMeta
	Subtables []runtimeViewRecordSubtableMeta
	Title     string
}

func (s *Service) LoadRuntimeViewRecord(
	ctx context.Context,
	modelID string,
	viewID string,
	docGuid string,
) (*RuntimeViewRecordResponse, error) {
	tenant, _, err := s.requireAuthoringContext(ctx)
	if err != nil {
		return nil, err
	}

	docGuid = strings.TrimSpace(docGuid)
	if docGuid == "" {
		return nil, ErrInvalidDraft
	}

	runtimeContext, err := s.loadRuntimeViewRecordContext(ctx, tenant, modelID, viewID)
	if err != nil {
		return nil, err
	}
	if !runtimeContext.CanView {
		return nil, ErrViewNotFound
	}

	rootColumnNames := []string{"_id"}
	for _, field := range runtimeContext.Fields {
		if field.ColumnName == "" {
			continue
		}
		rootColumnNames = appendUniqueString(rootColumnNames, field.ColumnName)
	}
	rows, totalItems, err := s.repo.QueryRuntimeRows(
		ctx,
		tenant,
		runtimeContext.DataView,
		rootColumnNames,
		`t."_guid"::text = $1`,
		[]any{docGuid},
		"_created_at",
		"DESC",
		1,
		1,
	)
	if err != nil {
		return nil, err
	}
	if totalItems == 0 || len(rows) == 0 {
		return nil, ErrRecordNotFound
	}

	rootRow := rows[0]
	parentID := rootRow.Cells["_id"]
	fields := make([]RuntimeViewRecordField, 0, len(runtimeContext.Fields))
	for _, field := range runtimeContext.Fields {
		fields = append(fields, RuntimeViewRecordField{
			ID:    field.FieldID,
			Label: field.Label,
			Type:  field.Type,
			Value: rootRow.Cells[field.ColumnName],
		})
	}

	subtables := make([]RuntimeViewRecordSubtable, 0, len(runtimeContext.Subtables))
	for _, subtable := range runtimeContext.Subtables {
		columnNames := make([]string, 0, len(subtable.Fields))
		for _, field := range subtable.Fields {
			if field.ColumnName == "" {
				continue
			}
			columnNames = append(columnNames, field.ColumnName)
		}
		if len(columnNames) == 0 {
			continue
		}
		rows, _, err := s.repo.QueryRuntimeRows(
			ctx,
			tenant,
			subtable.DataViewName,
			columnNames,
			`t."_parent_id"::text = $1`,
			[]any{parentID},
			"_created_at",
			"ASC",
			1,
			500,
		)
		if err != nil {
			return nil, err
		}
		tableRows := make([]collectiontable.TableRow, 0, len(rows))
		for _, row := range rows {
			cells := make(map[string]collectiontable.RowCell, len(subtable.Fields))
			for _, field := range subtable.Fields {
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
		subtables = append(subtables, RuntimeViewRecordSubtable{
			ID:      subtable.ID,
			Title:   subtable.Title,
			Columns: subtable.Columns,
			Rows:    tableRows,
		})
	}

	return &RuntimeViewRecordResponse{
		Fields:    fields,
		Subtables: subtables,
		SurfaceID: buildRuntimeViewListSurfaceID(modelID, viewID),
		Title:     runtimeContext.Title,
	}, nil
}

func (s *Service) loadRuntimeViewRecordContext(
	ctx context.Context,
	tenant requestctx.TenantInfo,
	modelID string,
	viewID string,
) (*runtimeViewRecordContext, error) {
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
	uiSchema := asMap(viewPayload["uiSchema"])
	rootScope := uiScope(uiSchema, rootSchemaScopeID)
	rootDataRuntime := readRuntimeDataScopeMetadata(dataSchemaScope(asMap(modelPayload["dataSchema"]), rootSchemaScopeID))
	dataViewName := strings.TrimSpace(rootDataRuntime.DataViewName)
	if dataViewName == "" {
		dataViewName = strings.TrimSpace(runtimePlan.RootScope.DataViewName)
	}
	if dataViewName == "" {
		return nil, ErrInvalidDraft
	}

	title := chooseString(normalizeString(viewPayload["title"]), view.DisplayName)
	if title == "" {
		title = chooseString(model.DisplayName, model.ModelID)
	}

	return &runtimeViewRecordContext{
		CanView:   readRuntimeViewCanView(uiSchema, viewPayload),
		DataView:  dataViewName,
		Fields:    buildRuntimeViewRecordFields(rootScope, runtimePlan.RootScope.Fields, buildRuntimeViewRecordFieldLabelsByID(asMap(modelPayload["dataSchema"]))),
		Subtables: buildRuntimeViewRecordSubtables(uiSchema, asMap(modelPayload["dataSchema"]), runtimePlan.SubformScopes),
		Title:     title,
	}, nil
}

func buildRuntimeViewRecordFields(
	scope map[string]any,
	fields []runtimeApplyFieldPlan,
	fieldLabels map[string]string,
) []runtimeViewRecordFieldMeta {
	fieldsByID := make(map[string]runtimeApplyFieldPlan, len(fields))
	for _, field := range fields {
		fieldsByID[field.FieldID] = field
	}

	visibleNodes := orderedVisibleRuntimeFieldNodes(scope)
	out := make([]runtimeViewRecordFieldMeta, 0, len(visibleNodes))
	for _, node := range visibleNodes {
		fieldID := normalizeString(node["fieldId"])
		field, ok := fieldsByID[fieldID]
		if !ok {
			continue
		}
		columnName := runtimeGridDefaultColumnForField(field)
		if columnName == "" {
			continue
		}
		label := chooseString(
			normalizeString(node["title"]),
			chooseString(fieldLabels[fieldID], humanizeIdentifier(field.StorageKey)),
		)
		out = append(out, runtimeViewRecordFieldMeta{
			ColumnName: columnName,
			FieldID:    fieldID,
			Label:      label,
			Type:       runtimeViewListFieldType(field.Kind),
		})
	}
	return out
}

func buildRuntimeViewRecordSubtables(
	uiSchema map[string]any,
	dataSchema map[string]any,
	subformScopes []runtimeApplyScopePlan,
) []runtimeViewRecordSubtableMeta {
	subformsByID := make(map[string]runtimeApplyScopePlan, len(subformScopes))
	for _, scope := range subformScopes {
		subformsByID[scope.ScopeID] = scope
	}

	rootNodes := orderedVisibleRuntimeNodes(uiScope(uiSchema, rootSchemaScopeID))
	uiSubformScopes := asSlice(uiSchema["subformScopes"])
	uiSubformScopeByID := make(map[string]map[string]any, len(uiSubformScopes))
	for _, rawScope := range uiSubformScopes {
		scope := asMap(rawScope)
		scopeID := normalizeString(scope["schemaScopeId"])
		if scopeID == "" {
			continue
		}
		uiSubformScopeByID[scopeID] = scope
	}
	fieldLabelsByScopeID := buildRuntimeViewRecordScopedFieldLabels(dataSchema)

	out := make([]runtimeViewRecordSubtableMeta, 0)
	for _, node := range rootNodes {
		if normalizeString(node["type"]) != "subform" {
			continue
		}
		scopeID := chooseString(normalizeString(node["schemaScopeId"]), normalizeString(node["tableKey"]))
		if scopeID == "" {
			continue
		}
		subform, ok := subformsByID[scopeID]
		if !ok || strings.TrimSpace(subform.DataViewName) == "" {
			continue
		}
		scope := uiSubformScopeByID[scopeID]
		fieldMetas := buildRuntimeViewRecordFields(scope, subform.Fields, fieldLabelsByScopeID[scopeID])
		if len(fieldMetas) == 0 {
			continue
		}
		columns := make([]collectiontable.ColumnDefinition, 0, len(fieldMetas))
		for _, field := range fieldMetas {
			columns = append(columns, collectiontable.ColumnDefinition{
				ID:             field.FieldID,
				Label:          field.Label,
				Type:           field.Type,
				FieldID:        field.FieldID,
				DefaultVisible: true,
			})
		}
		out = append(out, runtimeViewRecordSubtableMeta{
			DataViewName: subform.DataViewName,
			ID:           scopeID,
			Title:        chooseString(normalizeString(node["title"]), scopeID),
			Columns:      columns,
			Fields:       fieldMetas,
		})
	}

	return out
}

func buildRuntimeViewRecordFieldLabelsByID(dataSchema map[string]any) map[string]string {
	rootScope := asMap(dataSchema["rootScope"])
	rootFields := asSlice(rootScope["fields"])
	out := make(map[string]string, len(rootFields))
	for _, rawField := range rootFields {
		field := asMap(rawField)
		fieldID := chooseString(normalizeString(field["fieldId"]), chooseString(normalizeString(field["id"]), normalizeString(field["key"])))
		if fieldID == "" {
			continue
		}
		label := chooseString(normalizeString(field["label"]), normalizeString(field["displayName"]))
		if label == "" {
			continue
		}
		out[fieldID] = label
	}
	return out
}

func buildRuntimeViewRecordScopedFieldLabels(dataSchema map[string]any) map[string]map[string]string {
	subformScopes := asSlice(dataSchema["subformScopes"])
	if len(subformScopes) == 0 {
		return nil
	}

	out := make(map[string]map[string]string, len(subformScopes))
	for _, rawScope := range subformScopes {
		scope := asMap(rawScope)
		scopeID := chooseString(normalizeString(scope["schemaScopeId"]), normalizeString(scope["tableKey"]))
		if scopeID == "" {
			continue
		}
		fieldLabels := make(map[string]string)
		for _, rawField := range asSlice(scope["fields"]) {
			field := asMap(rawField)
			fieldID := chooseString(normalizeString(field["fieldId"]), chooseString(normalizeString(field["id"]), normalizeString(field["key"])))
			if fieldID == "" {
				continue
			}
			label := chooseString(normalizeString(field["label"]), normalizeString(field["displayName"]))
			if label == "" {
				continue
			}
			fieldLabels[fieldID] = label
		}
		if len(fieldLabels) > 0 {
			out[scopeID] = fieldLabels
		}
	}
	return out
}

func orderedVisibleRuntimeFieldNodes(scope map[string]any) []map[string]any {
	nodes := orderedVisibleRuntimeNodes(scope)
	out := make([]map[string]any, 0, len(nodes))
	for _, node := range nodes {
		if normalizeString(node["type"]) != "field" {
			continue
		}
		out = append(out, node)
	}
	return out
}

func orderedVisibleRuntimeNodes(scope map[string]any) []map[string]any {
	rawNodes := asSlice(scope["nodes"])
	type runtimeNode struct {
		order int64
		node  map[string]any
	}
	nodes := make([]runtimeNode, 0, len(rawNodes))
	for index, rawNode := range rawNodes {
		node := asMap(rawNode)
		if normalizeString(node["visibility"]) == "hidden" {
			continue
		}
		nodes = append(nodes, runtimeNode{
			order: getInt64Value(node, "order", int64(index)),
			node:  node,
		})
	}
	sort.SliceStable(nodes, func(i, j int) bool {
		return nodes[i].order < nodes[j].order
	})
	out := make([]map[string]any, 0, len(nodes))
	for _, node := range nodes {
		out = append(out, node.node)
	}
	return out
}

func readRuntimeViewCanView(uiSchema map[string]any, viewPayload map[string]any) bool {
	rootScope := uiScope(uiSchema, rootSchemaScopeID)
	viewSettings := asMap(rootScope["viewSettings"])
	if len(viewSettings) == 0 {
		rootView := asMap(viewPayload["rootView"])
		viewSettings = asMap(rootView["viewSettings"])
	}
	actions := asMap(viewSettings["actions"])
	return getBoolValue(actions, "canView", true)
}

func appendUniqueString(values []string, value string) []string {
	value = strings.TrimSpace(value)
	if value == "" {
		return values
	}
	for _, currentValue := range values {
		if strings.TrimSpace(currentValue) == value {
			return values
		}
	}
	return append(values, value)
}
