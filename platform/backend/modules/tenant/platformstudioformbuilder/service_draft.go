package platformstudioformbuilder

import (
	"context"
	"encoding/json"
	"strings"

	"dtriton.com/platform/backend/internal/platform/httpx/requestctx"
)

func (s *Service) LoadDraft(ctx context.Context, modelID string, viewID string) (*LoadDraftResponse, error) {
	tenant, claims, err := s.requireAuthoringContext(ctx)
	if err != nil {
		return nil, err
	}

	modelID = strings.TrimSpace(modelID)
	viewID = strings.TrimSpace(viewID)
	if modelID == "" || viewID == "" {
		return nil, ErrInvalidDraft
	}

	model, err := s.repo.GetModel(ctx, tenant, modelID)
	if err != nil {
		return nil, err
	}
	if model == nil {
		return nil, ErrModelNotFound
	}
	if isStaticModelRestrictedForActor(claims, model) {
		return nil, ErrModelNotFound
	}

	view, err := s.repo.GetView(ctx, tenant, model.ModelID, viewID)
	if err != nil {
		return nil, err
	}
	if view == nil {
		return nil, ErrViewNotFound
	}
	if !canAccessViewAuthoring(claims, view) {
		return nil, ErrViewLocked
	}

	views, err := s.repo.ListViews(ctx, tenant, model.ModelID)
	if err != nil {
		return nil, err
	}

	return buildDraftResponse(model, views, view)
}

func (s *Service) SaveDraft(ctx context.Context, modelID string, viewID string, req SaveDraftRequest) (*SaveDraftResponse, error) {
	tenant, claims, err := s.requireAuthoringContext(ctx)
	if err != nil {
		return nil, err
	}

	modelID = strings.TrimSpace(modelID)
	viewID = strings.TrimSpace(viewID)
	if modelID == "" || viewID == "" {
		return nil, ErrInvalidDraft
	}

	incomingModel, err := decodeObject(req.Draft.Model, "draft.model")
	if err != nil {
		return nil, err
	}
	incomingView, err := decodeObject(req.Draft.View, "draft.view")
	if err != nil {
		return nil, err
	}

	if got := normalizeStableKeyFromPayload(incomingModel, "id", "key"); got != "" && got != normalizeStableKey(modelID) {
		return nil, ErrInvalidDraft
	}
	if got := normalizeStableKeyFromPayload(incomingView, "id", "key"); got != "" && got != normalizeStableKey(viewID) {
		return nil, ErrInvalidDraft
	}

	model, err := s.repo.GetModel(ctx, tenant, modelID)
	if err != nil {
		return nil, err
	}
	if model == nil {
		return nil, ErrModelNotFound
	}

	currentView, err := s.repo.GetView(ctx, tenant, model.ModelID, viewID)
	if err != nil {
		return nil, err
	}
	if currentView == nil {
		return nil, ErrViewNotFound
	}

	views, err := s.repo.ListViews(ctx, tenant, model.ModelID)
	if err != nil {
		return nil, err
	}
	defaultView := findDefaultView(views)
	existingModelPayload, err := buildCanonicalModelPayload(model, views)
	if err != nil {
		return nil, err
	}
	existingViewPayload, err := buildCanonicalViewPayload(model, currentView, views, existingModelPayload)
	if err != nil {
		return nil, err
	}

	modelStructureReadOnly := isModelStructureReadOnly(model)
	modelPayload := existingModelPayload
	if currentView.IsDefault && !modelStructureReadOnly {
		modelPayload, err = normalizeModelPayloadForStorage(incomingModel, model, defaultView)
		if err != nil {
			return nil, err
		}
	}
	viewPayload, err := normalizeViewPayloadForStorage(
		incomingView,
		model,
		currentView,
		asMap(modelPayload["dataSchema"]),
		asMap(modelPayload["layoutBlueprint"]),
	)
	if err != nil {
		return nil, err
	}
	if err := s.validateRuntimeRelationConflicts(ctx, tenant, model.ModelID, currentView.ViewID, modelPayload, viewPayload, existingModelPayload, existingViewPayload); err != nil {
		return nil, err
	}

	modelChanged := false
	modelStructureChanged := false
	if currentView.IsDefault {
		modelChanged, err = payloadChanged(mustCanonicalJSON(existingModelPayload), modelPayload, []string{"version", "modelStructureVersion", "screens", "modelLocked", "isStructureLocked"})
		if err != nil {
			return nil, err
		}
		modelStructureChanged, err = structureChanged(mustCanonicalJSON(existingModelPayload), modelPayload)
		if err != nil {
			return nil, err
		}
	}
	viewChanged, err := payloadChanged(mustCanonicalJSON(existingViewPayload), viewPayload, []string{"version", "viewVersion", "lastAlignedModelStructureVersion"})
	if err != nil {
		return nil, err
	}

	modelLocked := model.IsStructureLocked
	if !modelStructureReadOnly {
		modelLocked = getBoolFallback(incomingModel, "isStructureLocked", "modelLocked", model.IsStructureLocked)
	}
	viewLocked := getBoolFallback(incomingView, "isViewLocked", "viewLocked", currentView.IsViewLocked)
	modelLockChanged := modelLocked != model.IsStructureLocked
	viewLockChanged := viewLocked != currentView.IsViewLocked

	if currentView.IsDefault && modelStructureReadOnly && (modelChanged || modelStructureChanged || modelLockChanged) {
		return nil, ErrModelStructureReadOnly
	}

	if !isRootActor(claims) {
		if modelLockChanged {
			return nil, ErrModelLocked
		}
		if viewLockChanged || currentView.IsViewLocked {
			return nil, ErrViewLocked
		}
		if modelLocked && modelStructureChanged {
			return nil, ErrModelLocked
		}
		if viewLocked && viewChanged {
			return nil, ErrViewLocked
		}
	}

	nextModel := *model
	normalizedNextModel := buildModelRecordFromPayload(modelPayload)
	nextModel.ModelKey = normalizedNextModel.ModelKey
	nextModel.StorageKey = normalizedNextModel.StorageKey
	nextModel.DisplayName = normalizedNextModel.DisplayName
	nextModel.Description = normalizedNextModel.Description
	nextModel.SourceType = normalizedNextModel.SourceType
	nextModel.Status = normalizedNextModel.Status
	nextModel.IsStructureLocked = modelLocked
	nextModel.CanEditViewsOnly = effectiveCanEditViewsOnlyForSourceType(nextModel.SourceType, modelLocked)
	nextModel.DefinitionJSON = mustCanonicalJSON(modelPayload)
	if modelChanged {
		nextModel.Version = model.Version + 1
	}
	if modelStructureChanged {
		nextModel.StructureVersion = model.StructureVersion + 1
		if !viewChanged {
			viewChanged = true
		}
	}

	nextView := *currentView
	normalizedNextView := buildViewRecordFromPayload(currentView.ModelID, currentView.ViewID, viewPayload)
	nextView.ViewKey = normalizedNextView.ViewKey
	nextView.DisplayName = normalizedNextView.DisplayName
	nextView.Description = normalizedNextView.Description
	nextView.ViewType = normalizedNextView.ViewType
	nextView.IsDefault = normalizedNextView.IsDefault
	nextView.IsActive = currentView.IsActive
	nextView.Status = normalizedNextView.Status
	nextView.IsViewLocked = viewLocked
	nextView.DefinitionJSON = normalizedNextView.DefinitionJSON
	nextView.LastAlignedModelStructureVersion = nextModel.StructureVersion
	if viewChanged {
		nextView.Version = currentView.Version + 1
	}

	persistedModel, persistedView, err := s.repo.UpdateDraft(ctx, tenant, nextModel, nextView, req.ExpectedVersions)
	if err != nil {
		return nil, err
	}
	if currentView.IsDefault {
		if err := s.propagateDefaultViewFieldLabelRenames(ctx, tenant, persistedModel, views, currentView.ViewID, existingModelPayload, modelPayload); err != nil {
			return nil, err
		}
	}

	views, err = s.repo.ListViews(ctx, tenant, persistedModel.ModelID)
	if err != nil {
		return nil, err
	}

	response, err := buildDraftResponse(persistedModel, views, persistedView)
	if err != nil {
		return nil, err
	}

	lookupModels, err := s.resolveRuntimeLookupModels(ctx, tenant, modelPayload)
	if err != nil {
		return nil, err
	}
	runtimePlan := buildRuntimeApplyPlan(persistedModel, views, modelPayload, lookupModels)
	runtimeSummary, runtimeErr := s.repo.ApplyRuntime(ctx, tenant, runtimePlan)
	if runtimeErr != nil {
		response.RuntimeApply = buildFailedRuntimeApplySummary(tenant, persistedModel.ModelID, currentView.ViewID, runtimeErr)
		response.ValidationSummary.Warnings = append(response.ValidationSummary.Warnings, buildRuntimeApplyFailedWarning(response.RuntimeApply))
		return response, nil
	}

	response.RuntimeApply = withRuntimeApplyContext(runtimeSummary, tenant, persistedModel.ModelID, currentView.ViewID)
	response.ValidationSummary.Warnings = append(response.ValidationSummary.Warnings, runtimeApplyWarnings(runtimeSummary)...)
	return response, nil
}

type fieldLabelRename struct {
	Old string
	New string
}

func (s *Service) propagateDefaultViewFieldLabelRenames(
	ctx context.Context,
	tenant requestctx.TenantInfo,
	model *ModelRecord,
	views []ViewRecord,
	defaultViewID string,
	previousModelPayload map[string]any,
	nextModelPayload map[string]any,
) error {
	renames := diffCanonicalFieldLabelRenames(previousModelPayload, nextModelPayload)
	if len(renames) == 0 {
		return nil
	}

	for _, candidate := range views {
		if candidate.ViewID == defaultViewID {
			continue
		}

		viewPayload, err := buildCanonicalViewPayload(model, &candidate, views, previousModelPayload)
		if err != nil {
			return err
		}
		if !applyFieldLabelRenamesToViewPayload(viewPayload, renames) {
			continue
		}

		nextView := candidate
		nextView.DefinitionJSON = mustCanonicalJSON(viewPayload)
		nextView.Version = candidate.Version + 1
		if _, err := s.repo.UpdateView(ctx, tenant, nextView, nil); err != nil {
			return err
		}
	}

	return nil
}

func diffCanonicalFieldLabelRenames(previousModelPayload map[string]any, nextModelPayload map[string]any) map[string]fieldLabelRename {
	previousLabels := canonicalFieldLabels(asMap(previousModelPayload["dataSchema"]))
	nextLabels := canonicalFieldLabels(asMap(nextModelPayload["dataSchema"]))
	renames := make(map[string]fieldLabelRename)

	for fieldID, nextLabel := range nextLabels {
		previousLabel, ok := previousLabels[fieldID]
		if !ok || previousLabel == nextLabel {
			continue
		}
		renames[fieldID] = fieldLabelRename{Old: previousLabel, New: nextLabel}
	}

	return renames
}

func canonicalFieldLabels(dataSchema map[string]any) map[string]string {
	labels := make(map[string]string)
	for _, rawField := range flattenDataSchemaFields(dataSchema) {
		field := asMap(rawField)
		fieldID := chooseString(
			normalizeString(field["fieldId"]),
			chooseString(normalizeString(field["id"]), normalizeString(field["key"])),
		)
		if fieldID == "" {
			continue
		}
		labels[fieldID] = chooseString(
			normalizeString(field["label"]),
			chooseString(normalizeString(field["displayName"]), humanizeIdentifier(fieldID)),
		)
	}
	return labels
}

func applyFieldLabelRenamesToViewPayload(viewPayload map[string]any, renames map[string]fieldLabelRename) bool {
	uiSchema := asMap(viewPayload["uiSchema"])
	changed := applyFieldLabelRenamesToScope(asMap(uiSchema["rootScope"]), renames)
	for _, rawScope := range asSlice(uiSchema["subformScopes"]) {
		if applyFieldLabelRenamesToScope(asMap(rawScope), renames) {
			changed = true
		}
	}
	return changed
}

func applyFieldLabelRenamesToScope(scope map[string]any, renames map[string]fieldLabelRename) bool {
	changed := false
	for _, rawNode := range asSlice(scope["nodes"]) {
		node := asMap(rawNode)
		if normalizeString(node["type"]) != "field" {
			continue
		}
		fieldID := normalizeString(node["fieldId"])
		rename, ok := renames[fieldID]
		if !ok {
			continue
		}
		title := normalizeString(node["title"])
		if title != "" && title != rename.Old {
			continue
		}
		if title == rename.New {
			continue
		}
		node["title"] = rename.New
		changed = true
	}
	return changed
}

func buildDraftResponse(model *ModelRecord, views []ViewRecord, currentView *ViewRecord) (*LoadDraftResponse, error) {
	if model == nil || currentView == nil {
		return nil, nil
	}

	modelPayload, err := buildCanonicalModelPayload(model, views)
	if err != nil {
		return nil, err
	}
	viewPayload, err := buildCanonicalViewPayload(model, currentView, views, modelPayload)
	if err != nil {
		return nil, err
	}

	modelDraft := buildModelDraftForResponse(model, views, modelPayload)
	viewDraft := buildViewDraftForResponse(currentView, viewPayload, asMap(modelPayload["dataSchema"]))

	return &LoadDraftResponse{
		Draft: DraftPayload{
			Model: mustCanonicalJSON(modelDraft),
			View:  viewDraft,
		},
		PublishState: PublishState{
			HasUnpublishedChanges: model.Version > model.PublishedVersion || currentView.Version > currentView.PublishedVersion,
			ModelPublishedVersion: model.PublishedVersion,
			ModelVersion:          model.Version,
			ViewPublishedVersion:  currentView.PublishedVersion,
			ViewVersion:           currentView.Version,
		},
		ValidationSummary: ValidationSummary{
			CanPublish: false,
			CanSave:    true,
			Errors:     []ValidationMessage{},
			Warnings:   []ValidationMessage{},
		},
	}, nil
}

func buildModelDraftForResponse(model *ModelRecord, views []ViewRecord, canonicalPayload map[string]any) map[string]any {
	payload := injectCompatibilityFields(canonicalPayload)

	payload["canEditViewsOnly"] = effectiveCanEditViewsOnly(model)
	payload["description"] = model.Description
	payload["displayName"] = model.DisplayName
	payload["id"] = model.ModelID
	payload["isStructureLocked"] = model.IsStructureLocked
	payload["modelLocked"] = model.IsStructureLocked
	payload["key"] = model.ModelKey
	payload["modelStructureVersion"] = model.StructureVersion
	payload["publishedVersion"] = model.PublishedVersion
	payload["name"] = model.DisplayName
	payload["sourceType"] = model.SourceType
	payload["storageKey"] = model.StorageKey
	payload["title"] = model.DisplayName
	payload["version"] = model.Version

	screens := make([]map[string]any, 0, len(views))
	for _, view := range views {
		screens = append(screens, buildScreenPayload(&view))
	}
	payload["screens"] = screens

	return payload
}

func buildViewDraftForResponse(view *ViewRecord, canonicalPayload map[string]any, dataSchema map[string]any) json.RawMessage {
	payload := injectCompatibilityViewDocument(canonicalPayload, dataSchema)

	payload["description"] = view.Description
	payload["displayName"] = view.DisplayName
	payload["id"] = view.ViewID
	payload["isDefault"] = view.IsDefault
	payload["isViewLocked"] = view.IsViewLocked
	payload["key"] = view.ViewKey
	payload["viewLocked"] = view.IsViewLocked
	payload["kind"] = view.ViewType
	payload["lastAlignedModelStructureVersion"] = view.LastAlignedModelStructureVersion
	payload["modelId"] = view.ModelID
	payload["publishedVersion"] = view.PublishedVersion
	payload["name"] = view.DisplayName
	payload["title"] = view.DisplayName
	payload["viewVersion"] = view.Version
	payload["version"] = view.Version

	return mustCanonicalJSON(payload)
}

func buildScreenPayload(view *ViewRecord) map[string]any {
	if view == nil {
		return map[string]any{}
	}
	return map[string]any{
		"description":                      view.Description,
		"displayName":                      view.DisplayName,
		"guid":                             view.GUID,
		"id":                               view.ViewID,
		"isDefault":                        view.IsDefault,
		"isViewLocked":                     view.IsViewLocked,
		"key":                              view.ViewKey,
		"kind":                             view.ViewType,
		"lastAlignedModelStructureVersion": view.LastAlignedModelStructureVersion,
		"publishedVersion":                 view.PublishedVersion,
		"title":                            view.DisplayName,
		"viewVersion":                      view.Version,
		"version":                          view.Version,
	}
}
