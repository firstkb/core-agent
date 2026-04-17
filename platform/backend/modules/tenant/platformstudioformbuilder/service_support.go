package platformstudioformbuilder

import (
	"context"
	"fmt"
	"strings"

	"dtriton.com/platform/backend/internal/platform/httpx/requestctx"
)

func (s *Service) resolveRuntimeLookupModels(
	ctx context.Context,
	tenant requestctx.TenantInfo,
	modelPayload map[string]any,
) (map[string]runtimeApplyLookupModelRef, error) {
	dataSchema := asMap(modelPayload["dataSchema"])
	candidateIDs := make(map[string]struct{})

	rootScope := asMap(dataSchema["rootScope"])
	appendRuntimeLookupSourceModelIDs(candidateIDs, asSlice(rootScope["fields"]))
	for _, rawScope := range asSlice(dataSchema["subformScopes"]) {
		scope := asMap(rawScope)
		appendRuntimeLookupSourceModelIDs(candidateIDs, asSlice(scope["fields"]))
	}

	out := make(map[string]runtimeApplyLookupModelRef)
	for sourceModelID := range candidateIDs {
		model, err := s.repo.GetModel(ctx, tenant, sourceModelID)
		if err != nil {
			return nil, err
		}
		if model == nil || strings.TrimSpace(model.StorageKey) == "" {
			continue
		}
		modelPayload := cloneJSONToMap(model.DefinitionJSON)
		dataViewName := ""
		if len(modelPayload) > 0 {
			dataSchema := asMap(modelPayload["dataSchema"])
			if len(dataSchema) > 0 {
				dataSchema = ensureDataSchemaRuntimeMetadata(dataSchema, modelPayload, model)
				rootRuntime := readRuntimeDataScopeMetadata(dataSchemaScope(dataSchema, rootSchemaScopeID))
				dataViewName = rootRuntime.DataViewName
			}
		}
		if strings.TrimSpace(dataViewName) == "" {
			dataViewName = buildGeneratedRuntimeDataViewName(buildGeneratedRuntimeModelAlias(model.StorageKey), "")
		}
		tenantScoped := true
		if isExternalRuntimeSourceType(model.SourceType) && len(modelPayload) > 0 {
			dataSchema := asMap(modelPayload["dataSchema"])
			rootRuntime := readRuntimeDataScopeMetadata(dataSchemaScope(dataSchema, rootSchemaScopeID))
			if rootRuntime.TenantScoped != nil {
				tenantScoped = *rootRuntime.TenantScoped
			}
		}
		ref := runtimeApplyLookupModelRef{
			ModelID:      model.ModelID,
			ModelKey:     model.ModelKey,
			StorageKey:   model.StorageKey,
			DataViewName: dataViewName,
			TenantScoped: tenantScoped,
		}
		out[model.ModelID] = ref
		if key := strings.TrimSpace(model.ModelKey); key != "" {
			out[key] = ref
		}
	}

	return out, nil
}

func appendRuntimeLookupSourceModelIDs(target map[string]struct{}, fields []any) {
	for _, rawField := range fields {
		field := asMap(rawField)
		if normalizeString(field["kind"]) != "db_lookup" {
			continue
		}
		sourceModelID := normalizeString(asMap(field["lookupConfig"])["sourceModel"])
		if sourceModelID == "" {
			continue
		}
		target[sourceModelID] = struct{}{}
	}
}

func (s *Service) requireAuthoringContext(ctx context.Context) (requestctx.TenantInfo, requestctx.ClaimsInfo, error) {
	claims, ok := requestctx.Claims(ctx)
	if !ok || strings.TrimSpace(claims.UserID) == "" {
		return requestctx.TenantInfo{}, requestctx.ClaimsInfo{}, ErrUnauthorized
	}

	tenant, ok := requestctx.Tenant(ctx)
	if !ok || strings.TrimSpace(tenant.ID) == "" {
		return requestctx.TenantInfo{}, requestctx.ClaimsInfo{}, ErrTenantMissing
	}

	return tenant, claims, nil
}

func (s *Service) resolveModel(ctx context.Context, tenant requestctx.TenantInfo, modelID string) (*ModelRecord, error) {
	modelID = strings.TrimSpace(modelID)
	if modelID == "" {
		return nil, ErrInvalidDraft
	}

	model, err := s.repo.GetModel(ctx, tenant, modelID)
	if err != nil {
		return nil, err
	}
	if model == nil {
		return nil, ErrModelNotFound
	}

	return model, nil
}

func (s *Service) generateUniqueModelKey(ctx context.Context, tenant requestctx.TenantInfo, explicitKey string, title string) (string, error) {
	base := normalizeStableKey(explicitKey)
	if base == "" {
		base = normalizeStableKey(title)
	}
	if base == "" {
		base = "model"
	}

	for candidateIndex := 0; candidateIndex < 100; candidateIndex++ {
		candidate := base
		if candidateIndex > 0 {
			candidate = fmt.Sprintf("%s-%d", base, candidateIndex+1)
		}
		existing, err := s.repo.GetModel(ctx, tenant, candidate)
		if err != nil {
			return "", err
		}
		if existing == nil {
			return candidate, nil
		}
	}

	return "", ErrInvalidDraft
}

func (s *Service) generateUniqueViewKey(ctx context.Context, tenant requestctx.TenantInfo, modelID string, explicitKey string, title string) (string, error) {
	base := normalizeStableKey(explicitKey)
	if base == "" {
		base = normalizeStableKey(title)
	}
	if base == "" {
		base = "view"
	}

	views, err := s.repo.ListViews(ctx, tenant, modelID)
	if err != nil {
		return "", err
	}
	existingKeys := make(map[string]struct{}, len(views))
	for _, view := range views {
		if key := normalizeStableKey(view.ViewKey); key != "" {
			existingKeys[key] = struct{}{}
		}
	}

	for candidateIndex := 0; candidateIndex < 100; candidateIndex++ {
		candidate := base
		if candidateIndex > 0 {
			candidate = fmt.Sprintf("%s-%d", base, candidateIndex+1)
		}
		if _, exists := existingKeys[candidate]; !exists {
			return candidate, nil
		}
	}

	return "", ErrInvalidDraft
}

func (s *Service) generateUniqueViewID(ctx context.Context, tenant requestctx.TenantInfo, modelID string, viewKey string) (string, error) {
	base := normalizeStableKey("view-" + viewKey)
	if base == "" {
		base = "view"
	}

	views, err := s.repo.ListViews(ctx, tenant, modelID)
	if err != nil {
		return "", err
	}
	existingIDs := make(map[string]struct{}, len(views))
	for _, view := range views {
		if id := normalizeStableKey(view.ViewID); id != "" {
			existingIDs[id] = struct{}{}
		}
	}

	for candidateIndex := 0; candidateIndex < 100; candidateIndex++ {
		candidate := base
		if candidateIndex > 0 {
			candidate = fmt.Sprintf("%s-%d", base, candidateIndex+1)
		}
		if _, exists := existingIDs[candidate]; !exists {
			return candidate, nil
		}
	}

	return "", ErrInvalidDraft
}

func buildCanonicalModelPayload(model *ModelRecord, views []ViewRecord) (map[string]any, error) {
	if model == nil {
		return map[string]any{}, nil
	}
	return normalizeModelPayloadForStorage(cloneJSONToMap(model.DefinitionJSON), model, findDefaultView(views))
}

func buildCanonicalViewPayload(model *ModelRecord, view *ViewRecord, views []ViewRecord, modelPayload map[string]any) (map[string]any, error) {
	_ = views
	if model == nil || view == nil {
		return map[string]any{}, nil
	}
	return normalizeViewPayloadForStorage(
		cloneJSONToMap(view.DefinitionJSON),
		model,
		view,
		asMap(modelPayload["dataSchema"]),
		asMap(modelPayload["layoutBlueprint"]),
	)
}

func findDefaultView(views []ViewRecord) *ViewRecord {
	for index := range views {
		if views[index].IsDefault {
			return &views[index]
		}
	}
	if len(views) == 0 {
		return nil
	}
	return &views[0]
}

func emptyDataSchema(modelID string, modelTitle string) map[string]any {
	return map[string]any{
		"modelId":    modelID,
		"modelTitle": modelTitle,
		"rootScope": map[string]any{
			"fields":        []any{},
			"schemaScopeId": rootSchemaScopeID,
			"scopeType":     "ROOT",
		},
		"subformScopes": []any{},
	}
}

func emptyLayoutBlueprint() map[string]any {
	return map[string]any{
		"rootScope": map[string]any{
			"containers":       []any{},
			"fieldPlacements":  []any{},
			"schemaScopeId":    rootSchemaScopeID,
			"unplacedFieldIds": []string{},
		},
		"subformScopes": []any{},
	}
}

func runtimeApplyWarnings(summary *RuntimeApplySummary) []ValidationMessage {
	if summary == nil || summary.StorageResults == nil {
		return nil
	}

	warnings := make([]ValidationMessage, 0)
	warnings = append(warnings, summary.StorageResults.RootScope.Warnings...)
	for _, scope := range summary.StorageResults.SubformScopes {
		warnings = append(warnings, scope.Warnings...)
	}
	return warnings
}

func withRuntimeApplyContext(
	summary *RuntimeApplySummary,
	tenant requestctx.TenantInfo,
	modelID string,
	viewID string,
) *RuntimeApplySummary {
	if summary == nil {
		return nil
	}

	next := *summary
	next.Context = &RuntimeApplyContext{
		TenantID: strings.TrimSpace(tenant.ID),
		ModelID:  strings.TrimSpace(modelID),
		ViewID:   strings.TrimSpace(viewID),
	}
	return &next
}

func buildFailedRuntimeApplySummary(
	tenant requestctx.TenantInfo,
	modelID string,
	viewID string,
	err error,
) *RuntimeApplySummary {
	context := RuntimeApplyContext{
		TenantID: strings.TrimSpace(tenant.ID),
		ModelID:  strings.TrimSpace(modelID),
		ViewID:   strings.TrimSpace(viewID),
	}

	return &RuntimeApplySummary{
		Status:  "failed",
		Message: formatRuntimeApplyFailureMessage(context, err),
		Context: &context,
	}
}

func buildRuntimeApplyFailedWarning(summary *RuntimeApplySummary) ValidationMessage {
	message := "Authoring was saved, but runtime apply failed."
	if summary != nil && strings.TrimSpace(summary.Message) != "" {
		message = fmt.Sprintf("Authoring was saved, but %s", summary.Message)
	}

	return ValidationMessage{
		Code:    "runtime_apply_failed",
		Message: message,
		Target:  "runtime",
	}
}

func formatRuntimeApplyFailureMessage(context RuntimeApplyContext, err error) string {
	parts := make([]string, 0, 3)
	if context.TenantID != "" {
		parts = append(parts, fmt.Sprintf("tenant_id=%s", context.TenantID))
	}
	if context.ModelID != "" {
		parts = append(parts, fmt.Sprintf("model_id=%s", context.ModelID))
	}
	if context.ViewID != "" {
		parts = append(parts, fmt.Sprintf("view_id=%s", context.ViewID))
	}

	message := "runtime apply failed"
	if len(parts) > 0 {
		message = fmt.Sprintf("%s for %s", message, strings.Join(parts, " "))
	}
	if err == nil {
		return message
	}
	return fmt.Sprintf("%s: %s", message, err.Error())
}
