package platformstudioformbuilder

import (
	"encoding/json"
	"sort"
	"strings"
)

const runtimeParentForeignKey = "_parent_id"

type runtimeApplyPlan struct {
	ModelID           string
	ModelRuntimeAlias string
	ModelSourceType   string
	RootScope         runtimeApplyScopePlan
	SubformScopes     []runtimeApplyScopePlan
}

type runtimeApplyLookupModelRef struct {
	ModelID      string
	ModelKey     string
	StorageKey   string
	DataViewName string
}

type runtimeApplyScopePlan struct {
	ScopeID                   string
	ScopeType                 string
	SubformType               string
	StorageKey                string
	TableName                 string
	DataViewName              string
	GridViews                 []runtimeApplyGridViewPlan
	ParentTableName           string
	ParentForeignKey          string
	MultiValueTableName       string
	MultiValueOwnerForeignKey string
	Fields                    []runtimeApplyFieldPlan
}

type runtimeApplyGridViewPlan struct {
	Name        string
	ColumnNames []string
	Projections []runtimeApplyGridColumnProjection
}

type runtimeApplyGridColumnProjection struct {
	AliasColumnName  string
	SourceColumnName string
}

type runtimeApplyFieldPlan struct {
	FieldID              string
	StorageKey           string
	Kind                 string
	Preset               string
	SelectionMode        string
	ColumnName           string
	PhysicalType         string
	MultiValue           bool
	Supported            bool
	WarningMessage       string
	LookupSourceModel    string
	LookupTargetName     string
	LookupTargetKind     string
	LookupTargetIDColumn string
	DisplayFields        []string
	LookupDerivedOutputs []runtimeApplyLookupOutputPlan
}

type runtimeApplyLookupOutputPlan struct {
	ColumnName string
	OutputKey  string
	DataType   string
}

func buildRuntimeApplyPlan(
	model *ModelRecord,
	views []ViewRecord,
	modelPayload map[string]any,
	lookupModels map[string]runtimeApplyLookupModelRef,
) runtimeApplyPlan {
	dataSchema := asMap(modelPayload["dataSchema"])
	rootRuntime := readRuntimeDataScopeMetadata(dataSchemaScope(dataSchema, rootSchemaScopeID))
	modelRuntimeAlias := chooseString(
		rootRuntime.RtAlias,
		buildGeneratedRuntimeModelAlias(chooseString(chooseString(modelStorageKey(model), normalizeString(modelPayload["storageKey"])), normalizeString(modelPayload["id"]))),
	)
	plan := runtimeApplyPlan{
		ModelID:           chooseString(model.ModelID, normalizeString(modelPayload["id"])),
		ModelRuntimeAlias: modelRuntimeAlias,
		ModelSourceType:   chooseString(model.SourceType, normalizeString(modelPayload["sourceType"])),
	}

	plan.RootScope = buildRuntimeApplyRootScopePlan(plan.ModelRuntimeAlias, views, dataSchema, lookupModels)

	subformScopes := make([]runtimeApplyScopePlan, 0)
	for _, rawScope := range asSlice(dataSchema["subformScopes"]) {
		scope := asMap(rawScope)
		scopeID := normalizeString(scope["schemaScopeId"])
		if scopeID == "" {
			continue
		}
		subformScopes = append(subformScopes, buildRuntimeApplySubformScopePlan(plan.RootScope.TableName, plan.ModelRuntimeAlias, views, scope, lookupModels))
	}
	plan.SubformScopes = subformScopes

	return plan
}

func buildRuntimeApplyRootScopePlan(
	modelRuntimeAlias string,
	views []ViewRecord,
	dataSchema map[string]any,
	lookupModels map[string]runtimeApplyLookupModelRef,
) runtimeApplyScopePlan {
	rootScope := asMap(dataSchema["rootScope"])
	rootRuntime := readRuntimeDataScopeMetadata(rootScope)
	storageKey := chooseString(rootRuntime.RtAlias, modelRuntimeAlias)
	fields := buildRuntimeApplyFieldPlans(asSlice(rootScope["fields"]), lookupModels)
	return runtimeApplyScopePlan{
		ScopeID:                   rootSchemaScopeID,
		ScopeType:                 "ROOT",
		StorageKey:                storageKey,
		TableName:                 chooseString(rootRuntime.TableName, buildGeneratedRuntimeTableName(storageKey)),
		DataViewName:              chooseString(rootRuntime.DataViewName, buildGeneratedRuntimeDataViewName(storageKey, "")),
		GridViews:                 buildRuntimeGridViews(modelRuntimeAlias, "", rootSchemaScopeID, "", fields, views),
		MultiValueTableName:       chooseString(rootRuntime.MVTableName, buildGeneratedRuntimeMVTableName(storageKey, "")),
		MultiValueOwnerForeignKey: storageKey + "_id",
		Fields:                    fields,
	}
}

func buildRuntimeApplySubformScopePlan(
	rootTableName string,
	modelRuntimeAlias string,
	views []ViewRecord,
	scope map[string]any,
	lookupModels map[string]runtimeApplyLookupModelRef,
) runtimeApplyScopePlan {
	scopeID := normalizeString(scope["schemaScopeId"])
	scopeRuntime := readRuntimeDataScopeMetadata(scope)
	scopeStorageKey := chooseString(scopeRuntime.RtAlias, buildGeneratedRuntimeScopeAlias(chooseString(normalizeString(scope["tableKey"]), scopeID)))
	subformType := chooseString(normalizeString(scope["subformType"]), "DEFAULT")
	fields := buildRuntimeApplyFieldPlans(asSlice(scope["fields"]), lookupModels)
	gridViews := []runtimeApplyGridViewPlan{}
	if subformType != "CHECKLIST" {
		gridViews = buildRuntimeGridViews(modelRuntimeAlias, scopeStorageKey, scopeID, runtimeParentForeignKey, fields, views)
	}
	return runtimeApplyScopePlan{
		ScopeID:                   scopeID,
		ScopeType:                 chooseString(normalizeString(scope["scopeType"]), "SUBFORM"),
		SubformType:               subformType,
		StorageKey:                scopeStorageKey,
		TableName:                 chooseString(scopeRuntime.TableName, buildGeneratedRuntimeTableName(modelRuntimeAlias, scopeStorageKey)),
		DataViewName:              chooseString(scopeRuntime.DataViewName, buildGeneratedRuntimeDataViewName(modelRuntimeAlias, scopeStorageKey)),
		GridViews:                 gridViews,
		ParentTableName:           rootTableName,
		ParentForeignKey:          runtimeParentForeignKey,
		MultiValueTableName:       chooseString(scopeRuntime.MVTableName, buildGeneratedRuntimeMVTableName(modelRuntimeAlias, scopeStorageKey)),
		MultiValueOwnerForeignKey: scopeStorageKey + "_id",
		Fields:                    fields,
	}
}

func buildRuntimeGridViews(
	modelRuntimeAlias string,
	scopeRuntimeAlias string,
	scopeID string,
	parentForeignKey string,
	fields []runtimeApplyFieldPlan,
	views []ViewRecord,
) []runtimeApplyGridViewPlan {
	plans := make([]runtimeApplyGridViewPlan, 0, len(views))
	seen := make(map[string]struct{}, len(views))
	fieldsByID := make(map[string]runtimeApplyFieldPlan, len(fields))
	for _, field := range fields {
		fieldsByID[field.FieldID] = field
	}
	for _, view := range views {
		name := runtimeGridViewName(view, modelRuntimeAlias, scopeRuntimeAlias, scopeID)
		if name == "" {
			continue
		}
		if _, ok := seen[name]; ok {
			continue
		}
		seen[name] = struct{}{}
		projections := buildRuntimeGridColumns(parentForeignKey, fieldsByID, runtimeGridColumnSelections(view, scopeID))
		columnNames := make([]string, 0, len(projections))
		for _, projection := range projections {
			columnNames = append(columnNames, projection.AliasColumnName)
		}
		plans = append(plans, runtimeApplyGridViewPlan{
			Name:        name,
			ColumnNames: columnNames,
			Projections: projections,
		})
	}
	return plans
}

type runtimeApplyGridColumnSelection struct {
	BindingType string
	FieldID     string
	OutputID    string
	ColumnName  string
	Visible     bool
	Order       int64
}

func parseRuntimeGridColumnFieldID(fieldID string) (string, string, string) {
	trimmed := normalizeString(fieldID)
	if trimmed == "" {
		return "", "", ""
	}

	parts := strings.Split(trimmed, "::lookup_output::")
	if len(parts) != 2 {
		return "", trimmed, ""
	}

	sourceFieldID := normalizeString(parts[0])
	outputID := normalizeString(parts[1])
	if sourceFieldID == "" || outputID == "" {
		return "", trimmed, ""
	}

	return "lookup_output", sourceFieldID, outputID
}

func runtimeGridColumnSelections(view ViewRecord, scopeID string) []runtimeApplyGridColumnSelection {
	if len(view.DefinitionJSON) == 0 {
		return nil
	}

	var payload map[string]any
	if err := json.Unmarshal(view.DefinitionJSON, &payload); err != nil {
		return nil
	}

	uiSchema := asMap(payload["uiSchema"])
	scope := map[string]any{}
	if scopeID == rootSchemaScopeID {
		scope = asMap(uiSchema["rootScope"])
	} else {
		for _, raw := range asSlice(uiSchema["subformScopes"]) {
			candidate := asMap(raw)
			if normalizeString(candidate["schemaScopeId"]) != scopeID {
				continue
			}
			scope = candidate
			break
		}
	}

	viewSettings := asMap(scope["viewSettings"])
	if len(viewSettings) == 0 && scopeID == rootSchemaScopeID {
		rootView := asMap(payload["rootView"])
		viewSettings = asMap(rootView["viewSettings"])
	}
	listSettings := asMap(viewSettings["list"])
	rawColumns := asSlice(listSettings["columns"])
	selections := make([]runtimeApplyGridColumnSelection, 0, len(rawColumns))
	for index, raw := range rawColumns {
		column := asMap(raw)
		bindingType := normalizeString(column["bindingType"])
		fieldID := normalizeString(column["fieldId"])
		outputID := normalizeString(column["outputId"])
		if bindingType == "" && outputID == "" {
			derivedBindingType, derivedFieldID, derivedOutputID := parseRuntimeGridColumnFieldID(fieldID)
			if derivedBindingType != "" {
				bindingType = derivedBindingType
				fieldID = derivedFieldID
				outputID = derivedOutputID
			}
		}
		selections = append(selections, runtimeApplyGridColumnSelection{
			BindingType: bindingType,
			FieldID:     fieldID,
			OutputID:    outputID,
			ColumnName:  normalizeString(column["columnName"]),
			Visible:     getBoolValue(column, "visible", true),
			Order:       getInt64Value(column, "order", int64(index)),
		})
	}
	sort.SliceStable(selections, func(i, j int) bool {
		return selections[i].Order < selections[j].Order
	})
	return selections
}

func runtimeGridViewName(
	view ViewRecord,
	modelRuntimeAlias string,
	scopeRuntimeAlias string,
	scopeID string,
) string {
	if len(view.DefinitionJSON) > 0 {
		var payload map[string]any
		if err := json.Unmarshal(view.DefinitionJSON, &payload); err == nil {
			uiSchema := asMap(payload["uiSchema"])
			scope := uiScope(uiSchema, scopeID)
			scopeRuntime := readRuntimeViewScopeMetadata(scope)
			if strings.TrimSpace(scopeRuntime.GridViewName) != "" {
				return scopeRuntime.GridViewName
			}
			viewRtAlias := chooseString(scopeRuntime.ViewRtAlias, buildGeneratedRuntimeViewAlias(payload, &ModelRecord{ModelID: view.ModelID}))
			return buildGeneratedRuntimeGridViewName(modelRuntimeAlias, scopeRuntimeAlias, viewRtAlias)
		}
	}

	viewPayload := map[string]any{
		"id":        view.ViewID,
		"isDefault": view.IsDefault,
		"key":       view.ViewKey,
	}
	return buildGeneratedRuntimeGridViewName(modelRuntimeAlias, scopeRuntimeAlias, buildGeneratedRuntimeViewAlias(viewPayload, &ModelRecord{ModelID: view.ModelID}))
}

func buildRuntimeGridColumns(
	parentForeignKey string,
	fieldsByID map[string]runtimeApplyFieldPlan,
	selections []runtimeApplyGridColumnSelection,
) []runtimeApplyGridColumnProjection {
	columns := runtimeGridSystemColumns(parentForeignKey)
	projections := make([]runtimeApplyGridColumnProjection, 0, len(columns)+len(selections))
	seen := make(map[string]struct{}, len(columns)+len(selections))
	for _, columnName := range columns {
		projections = append(projections, runtimeApplyGridColumnProjection{
			AliasColumnName:  columnName,
			SourceColumnName: columnName,
		})
		seen[columnName] = struct{}{}
	}

	for _, selection := range selections {
		if !selection.Visible {
			continue
		}
		sourceColumnName, aliasColumnName := runtimeGridColumnProjectionForSelection(selection, fieldsByID)
		if sourceColumnName == "" || aliasColumnName == "" {
			continue
		}
		if _, ok := seen[aliasColumnName]; ok {
			continue
		}
		seen[aliasColumnName] = struct{}{}
		projections = append(projections, runtimeApplyGridColumnProjection{
			AliasColumnName:  aliasColumnName,
			SourceColumnName: sourceColumnName,
		})
	}
	return projections
}

func runtimeGridSystemColumns(parentForeignKey string) []string {
	columns := []string{"_id", "tenant_id", "_guid", "_created_at", "_updated_at", "_row_version"}
	if strings.TrimSpace(parentForeignKey) != "" {
		columns = append(columns, parentForeignKey)
	}
	return columns
}

func runtimeGridColumnProjectionForSelection(
	selection runtimeApplyGridColumnSelection,
	fieldsByID map[string]runtimeApplyFieldPlan,
) (string, string) {
	if selection.ColumnName != "" {
		return selection.ColumnName, selection.ColumnName
	}
	field, ok := fieldsByID[selection.FieldID]
	if !ok {
		return "", ""
	}
	if selection.BindingType == "lookup_output" {
		if outputColumn := runtimeLookupOutputColumn(field, selection.OutputID); outputColumn != "" {
			return outputColumn, outputColumn
		}
		if len(field.LookupDerivedOutputs) > 0 {
			return field.LookupDerivedOutputs[0].ColumnName, field.LookupDerivedOutputs[0].ColumnName
		}
	}
	return runtimeGridDefaultColumnForField(field), runtimeGridDefaultAliasForField(field)
}

func runtimeGridDefaultColumnForField(field runtimeApplyFieldPlan) string {
	if !field.Supported {
		return ""
	}
	if field.MultiValue {
		if labelsColumn := runtimeLookupOutputColumn(field, "labels"); labelsColumn != "" {
			return labelsColumn
		}
		return ""
	}
	if field.Kind == "db_lookup" && field.Preset != "db_lookup_value" {
		if labelColumn := runtimeLookupOutputColumn(field, "label"); labelColumn != "" {
			return labelColumn
		}
		if len(field.LookupDerivedOutputs) > 0 {
			return field.LookupDerivedOutputs[0].ColumnName
		}
	}
	return field.ColumnName
}

func runtimeGridDefaultAliasForField(field runtimeApplyFieldPlan) string {
	if !field.Supported {
		return ""
	}
	if field.Kind == "db_lookup" && field.Preset != "db_lookup_value" {
		if strings.TrimSpace(field.StorageKey) != "" {
			return runtimeFieldColumnIdentifier(field.StorageKey)
		}
		return strings.TrimSuffix(field.ColumnName, "_id")
	}
	if field.MultiValue && strings.TrimSpace(field.StorageKey) != "" {
		return runtimeFieldColumnIdentifier(field.StorageKey)
	}
	return field.ColumnName
}

func runtimeLookupOutputColumn(field runtimeApplyFieldPlan, outputKey string) string {
	for _, output := range field.LookupDerivedOutputs {
		if output.OutputKey == outputKey {
			return output.ColumnName
		}
	}
	return ""
}

func runtimeViewIdentifier(raw string) string {
	return runtimeIdentifier(raw)
}

func buildRuntimeApplyFieldPlans(entries []any, lookupModels map[string]runtimeApplyLookupModelRef) []runtimeApplyFieldPlan {
	plans := make([]runtimeApplyFieldPlan, 0, len(entries))
	for _, raw := range entries {
		field := asMap(raw)
		plans = append(plans, buildRuntimeApplyFieldPlan(field, lookupModels))
	}
	return plans
}

func buildRuntimeApplyFieldPlan(field map[string]any, lookupModels map[string]runtimeApplyLookupModelRef) runtimeApplyFieldPlan {
	lookupConfig := asMap(field["lookupConfig"])
	plan := runtimeApplyFieldPlan{
		FieldID:           chooseString(normalizeString(field["fieldId"]), normalizeString(field["id"])),
		StorageKey:        normalizeString(field["storageKey"]),
		Kind:              normalizeString(field["kind"]),
		Preset:            normalizeString(field["preset"]),
		SelectionMode:     normalizeString(field["selectionMode"]),
		LookupSourceModel: normalizeString(lookupConfig["sourceModel"]),
		DisplayFields:     normalizeStringList(field["displayFields"]),
	}

	if plan.StorageKey == "" {
		plan.WarningMessage = "field has no storage key"
		return plan
	}

	switch {
	case plan.Kind == "short_text",
		plan.Kind == "long_text",
		plan.Kind == "rich_text",
		plan.Kind == "single_select":
		plan.ColumnName = runtimeFieldColumnIdentifier(plan.StorageKey)
		plan.PhysicalType = "text"
		plan.Supported = true
	case plan.Kind == "integer":
		plan.ColumnName = runtimeFieldColumnIdentifier(plan.StorageKey)
		plan.PhysicalType = "bigint"
		plan.Supported = true
	case plan.Kind == "decimal", plan.Kind == "currency":
		plan.ColumnName = runtimeFieldColumnIdentifier(plan.StorageKey)
		plan.PhysicalType = "numeric"
		plan.Supported = true
	case plan.Kind == "boolean":
		plan.ColumnName = runtimeFieldColumnIdentifier(plan.StorageKey)
		plan.PhysicalType = "boolean"
		plan.Supported = true
	case plan.Kind == "date":
		plan.ColumnName = runtimeFieldColumnIdentifier(plan.StorageKey)
		plan.PhysicalType = "date"
		plan.Supported = true
	case plan.Kind == "date_time":
		plan.ColumnName = runtimeFieldColumnIdentifier(plan.StorageKey)
		plan.PhysicalType = "timestamptz"
		plan.Supported = true
	case plan.Kind == "db_lookup" && plan.Preset == "db_lookup_value":
		plan.ColumnName = runtimeFieldColumnIdentifier(plan.StorageKey)
		plan.PhysicalType = "text"
		plan.Supported = true
	case plan.Kind == "db_lookup" && plan.SelectionMode == "multiple":
		plan.MultiValue = true
		plan.Supported = true
		plan.LookupDerivedOutputs = []runtimeApplyLookupOutputPlan{
			{ColumnName: runtimeFieldColumnIdentifier(plan.StorageKey + "__labels"), OutputKey: "labels", DataType: "text"},
			{ColumnName: runtimeFieldColumnIdentifier(plan.StorageKey + "__count"), OutputKey: "count", DataType: "bigint"},
		}
		applyRuntimeLookupSourceMetadata(&plan, lookupModels)
	case plan.Kind == "db_lookup":
		plan.ColumnName = runtimeFieldColumnIdentifier(plan.StorageKey + "_id")
		plan.PhysicalType = "bigint"
		plan.Supported = true
		applyRuntimeLookupSourceMetadata(&plan, lookupModels)
	case plan.Kind == "multi_select", plan.Kind == "tags":
		plan.MultiValue = true
		plan.WarningMessage = "multivalue storage is deferred to the multivalue bridge table slice"
	default:
		plan.WarningMessage = "field kind is not yet supported by runtime apply"
	}

	return plan
}

func applyRuntimeLookupSourceMetadata(plan *runtimeApplyFieldPlan, lookupModels map[string]runtimeApplyLookupModelRef) {
	if plan.Kind != "db_lookup" || plan.Preset == "db_lookup_value" {
		return
	}

	if plan.SelectionMode != "multiple" {
		plan.LookupDerivedOutputs = buildRuntimeLookupOutputPlans(*plan)
	} else {
		return
	}

	switch plan.Preset {
	case "contact_lookup":
		plan.LookupTargetName = "users"
		plan.LookupTargetKind = "table"
		plan.LookupTargetIDColumn = "users_id"
	case "company_lookup":
		plan.LookupTargetName = "company"
		plan.LookupTargetKind = "table"
		plan.LookupTargetIDColumn = "company_id"
	case "project_lookup":
		plan.LookupTargetName = "projects"
		plan.LookupTargetKind = "table"
		plan.LookupTargetIDColumn = "projects_id"
	default:
		sourceModel := strings.TrimSpace(plan.LookupSourceModel)
		if sourceModel == "" {
			plan.WarningMessage = chooseString(plan.WarningMessage, "lookup source model is not configured")
			return
		}
		sourceRef, ok := lookupModels[sourceModel]
		if !ok || strings.TrimSpace(sourceRef.DataViewName) == "" {
			plan.WarningMessage = chooseString(plan.WarningMessage, "lookup source model runtime storage is unavailable")
			return
		}
		plan.LookupTargetName = sourceRef.DataViewName
		plan.LookupTargetKind = "view"
		plan.LookupTargetIDColumn = "_id"
		if len(plan.DisplayFields) == 0 {
			plan.DisplayFields = []string{"_guid"}
		}
	}
}

func buildRuntimeLookupOutputPlans(field runtimeApplyFieldPlan) []runtimeApplyLookupOutputPlan {
	if field.Kind != "db_lookup" || field.Preset == "db_lookup_value" {
		return nil
	}
	if field.SelectionMode == "multiple" {
		return []runtimeApplyLookupOutputPlan{
			{ColumnName: runtimeFieldColumnIdentifier(field.StorageKey + "__labels"), OutputKey: "labels", DataType: "text"},
			{ColumnName: runtimeFieldColumnIdentifier(field.StorageKey + "__count"), OutputKey: "count", DataType: "bigint"},
		}
	}

	switch field.Preset {
	case "contact_lookup":
		return []runtimeApplyLookupOutputPlan{
			{ColumnName: runtimeFieldColumnIdentifier(field.StorageKey + "__label"), OutputKey: "label", DataType: "text"},
			{ColumnName: runtimeFieldColumnIdentifier(field.StorageKey + "__company_name"), OutputKey: "company_name", DataType: "text"},
			{ColumnName: runtimeFieldColumnIdentifier(field.StorageKey + "__company_id"), OutputKey: "company_id", DataType: "bigint"},
			{ColumnName: runtimeFieldColumnIdentifier(field.StorageKey + "__title"), OutputKey: "title", DataType: "text"},
			{ColumnName: runtimeFieldColumnIdentifier(field.StorageKey + "__phone"), OutputKey: "phone", DataType: "text"},
		}
	case "company_lookup":
		return []runtimeApplyLookupOutputPlan{
			{ColumnName: runtimeFieldColumnIdentifier(field.StorageKey + "__label"), OutputKey: "label", DataType: "text"},
			{ColumnName: runtimeFieldColumnIdentifier(field.StorageKey + "__type"), OutputKey: "type", DataType: "text"},
			{ColumnName: runtimeFieldColumnIdentifier(field.StorageKey + "__main_company_name"), OutputKey: "main_company_name", DataType: "text"},
			{ColumnName: runtimeFieldColumnIdentifier(field.StorageKey + "__state"), OutputKey: "state", DataType: "text"},
		}
	case "project_lookup":
		return []runtimeApplyLookupOutputPlan{
			{ColumnName: runtimeFieldColumnIdentifier(field.StorageKey + "__label"), OutputKey: "label", DataType: "text"},
			{ColumnName: runtimeFieldColumnIdentifier(field.StorageKey + "__num"), OutputKey: "num", DataType: "text"},
			{ColumnName: runtimeFieldColumnIdentifier(field.StorageKey + "__name"), OutputKey: "name", DataType: "text"},
			{ColumnName: runtimeFieldColumnIdentifier(field.StorageKey + "__company_name"), OutputKey: "company_name", DataType: "text"},
		}
	default:
		return []runtimeApplyLookupOutputPlan{
			{ColumnName: runtimeFieldColumnIdentifier(field.StorageKey + "__label"), OutputKey: "label", DataType: "text"},
		}
	}
}

func runtimeFieldColumnIdentifier(raw string) string {
	return runtimeIdentifier(raw)
}
