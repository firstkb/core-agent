package platformstudioformruntime

import (
	"encoding/json"
	"strconv"
)

func buildMutationResponse(created bool, scope runtimeRootScopePlan, row *runtimeRecordMutationRow) *RuntimeViewRecordMutationResponse {
	if row == nil {
		row = &runtimeRecordMutationRow{Values: map[string]any{}}
	}
	values := row.Values
	if values == nil {
		values = map[string]any{}
	}
	return &RuntimeViewRecordMutationResponse{
		Created:  created,
		DocGuid:  row.DocGuid,
		RecordID: runtimeRecordID(row.SourceID),
		Revision: row.Revision,
		Status:   statusValue(scope, values),
		Values:   values,
	}
}

func buildRuntimeViewFormResponse(
	scopeContext runtimeRootScopeContext,
	docGuid string,
	recordID string,
	revision string,
	values map[string]any,
) *RuntimeViewFormResponse {
	if values == nil {
		values = map[string]any{}
	}
	dataSchema := asMap(scopeContext.ModelPayload["dataSchema"])
	uiSchema := asMap(scopeContext.ViewPayload["uiSchema"])
	title := chooseString(
		normalizeString(scopeContext.ViewPayload["viewTitle"]),
		chooseString(normalizeString(scopeContext.ViewPayload["title"]), scopeContext.View.DisplayName),
	)
	description := chooseString(
		normalizeString(scopeContext.ViewPayload["viewDescription"]),
		normalizeString(scopeContext.ViewPayload["description"]),
	)

	return &RuntimeViewFormResponse{
		DataSchema:  dataSchema,
		Description: description,
		DocGuid:     docGuid,
		ModelID:     scopeContext.Scope.ModelID,
		RecordID:    recordID,
		Revision:    revision,
		SourceType:  scopeContext.Scope.SourceType,
		SurfaceID:   "form-runtime:" + scopeContext.Scope.ModelID + ":" + scopeContext.Scope.ViewID,
		Title:       title,
		UISchema:    uiSchema,
		Values:      values,
		ViewID:      scopeContext.Scope.ViewID,
	}
}

func buildRuntimeSubformFormResponse(
	scopeContext runtimeRootScopeContext,
	subformScope runtimeSubformScopePlan,
	docGuid string,
	recordID string,
	revision string,
	values map[string]any,
) *RuntimeViewFormResponse {
	if values == nil {
		values = map[string]any{}
	}

	modelDataSchema := asMap(scopeContext.ModelPayload["dataSchema"])
	viewUISchema := asMap(scopeContext.ViewPayload["uiSchema"])
	dataScope := cloneMap(dataSchemaScope(modelDataSchema, subformScope.ScopeID))
	uiScope := cloneMap(uiSubformScope(viewUISchema, subformScope.ScopeID))
	dataScope["schemaScopeId"] = rootSchemaScopeID
	uiScope["schemaScopeId"] = rootSchemaScopeID
	delete(uiScope, "systemFields")

	title := chooseString(
		runtimeSubformNodeTitle(viewUISchema, subformScope.ScopeID),
		chooseString(normalizeString(dataScope["displayName"]), chooseString(subformScope.TableKey, "Subform")),
	)

	return &RuntimeViewFormResponse{
		DataSchema: map[string]any{
			"rootScope":     dataScope,
			"subformScopes": []any{},
		},
		DocGuid:    docGuid,
		ModelID:    scopeContext.Scope.ModelID,
		RecordID:   recordID,
		Revision:   revision,
		SourceType: scopeContext.Scope.SourceType,
		SurfaceID:  "form-runtime:" + scopeContext.Scope.ModelID + ":" + scopeContext.Scope.ViewID + ":subform:" + subformScope.ScopeID,
		Title:      title,
		UISchema: map[string]any{
			"rootScope": uiScope,
		},
		Values: values,
		ViewID: scopeContext.Scope.ViewID,
	}
}

func runtimeRecordID(sourceID int64) string {
	if sourceID <= 0 {
		return ""
	}
	return strconv.FormatInt(sourceID, 10)
}

func cloneMap(value map[string]any) map[string]any {
	if value == nil {
		return map[string]any{}
	}
	raw, err := json.Marshal(value)
	if err != nil {
		return map[string]any{}
	}
	var out map[string]any
	if err := json.Unmarshal(raw, &out); err != nil || out == nil {
		return map[string]any{}
	}
	return out
}

func uiSubformScope(uiSchema map[string]any, scopeID string) map[string]any {
	for _, rawScope := range asSlice(uiSchema["subformScopes"]) {
		scope := asMap(rawScope)
		if normalizeString(scope["schemaScopeId"]) == scopeID || normalizeString(scope["tableKey"]) == scopeID {
			return scope
		}
	}
	return map[string]any{}
}

func runtimeSubformNodeTitle(uiSchema map[string]any, scopeID string) string {
	for _, rawNode := range asSlice(asMap(uiSchema["rootScope"])["nodes"]) {
		node := asMap(rawNode)
		if normalizeString(node["type"]) != "subform" {
			continue
		}
		if normalizeString(node["schemaScopeId"]) == scopeID || normalizeString(node["tableKey"]) == scopeID {
			return normalizeString(node["title"])
		}
	}
	return ""
}

func makeRuntimeFieldEditable(dataSchema map[string]any, uiSchema map[string]any, fieldID string) {
	fieldID = normalizeString(fieldID)
	if fieldID == "" {
		return
	}

	rootDataScope := asMap(dataSchema["rootScope"])
	for _, rawField := range asSlice(rootDataScope["fields"]) {
		field := asMap(rawField)
		currentFieldID := chooseString(normalizeString(field["fieldId"]), chooseString(normalizeString(field["id"]), normalizeString(field["key"])))
		if currentFieldID != fieldID {
			continue
		}
		field["readonly"] = false
	}

	rootUIScope := asMap(uiSchema["rootScope"])
	for _, rawNode := range asSlice(rootUIScope["nodes"]) {
		node := asMap(rawNode)
		if normalizeString(node["fieldId"]) != fieldID {
			continue
		}
		if normalizeString(node["visibility"]) == "readonly" {
			delete(node, "visibility")
		}
		node["readonly"] = false
	}
}
