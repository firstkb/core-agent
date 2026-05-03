package platformstudioformruntime

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
		Revision: row.Revision,
		Status:   statusValue(scope, values),
		Values:   values,
	}
}

func buildRuntimeViewFormResponse(
	scopeContext runtimeRootScopeContext,
	docGuid string,
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
		Revision:    revision,
		SourceType:  scopeContext.Scope.SourceType,
		SurfaceID:   "form-runtime:" + scopeContext.Scope.ModelID + ":" + scopeContext.Scope.ViewID,
		Title:       title,
		UISchema:    uiSchema,
		Values:      values,
		ViewID:      scopeContext.Scope.ViewID,
	}
}
