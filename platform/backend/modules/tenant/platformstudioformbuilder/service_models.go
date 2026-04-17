package platformstudioformbuilder

import (
	"context"
	"encoding/json"
	"sort"
	"strings"

	"dtriton.com/platform/backend/internal/platform/httpx/requestctx"
)

func (s *Service) ListModels(ctx context.Context) (*ListModelsResponse, error) {
	tenant, claims, err := s.requireAuthoringContext(ctx)
	if err != nil {
		return nil, err
	}

	models, err := s.repo.ListModels(ctx, tenant)
	if err != nil {
		return nil, err
	}

	items := make([]ModelSummary, 0, len(models))
	for _, model := range models {
		if isStaticModelRestrictedForActor(claims, &model) {
			continue
		}
		summary := buildModelSummary(&model)
		if dataCount, ok := s.loadModelDataCount(ctx, tenant, &model); ok {
			summary.DataCount = &dataCount
		}
		items = append(items, summary)
	}

	return &ListModelsResponse{Items: items}, nil
}

func (s *Service) GetModel(ctx context.Context, modelID string) (*ModelDetailResponse, error) {
	tenant, claims, err := s.requireAuthoringContext(ctx)
	if err != nil {
		return nil, err
	}

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
	if isStaticModelRestrictedForActor(claims, model) {
		return nil, ErrModelNotFound
	}
	if dataCount, ok := s.loadModelDataCount(ctx, tenant, model); ok {
		model.DataCount = &dataCount
	}

	views, err := s.repo.ListViews(ctx, tenant, model.ModelID)
	if err != nil {
		return nil, err
	}

	return buildModelDetailResponse(model, views, ""), nil
}

func (s *Service) CreateModel(ctx context.Context, req CreateModelRequest) (*ModelDetailResponse, error) {
	tenant, _, err := s.requireAuthoringContext(ctx)
	if err != nil {
		return nil, err
	}

	title := strings.TrimSpace(req.Title)
	if title == "" {
		return nil, ErrInvalidDraft
	}

	modelKey, err := s.generateUniqueModelKey(ctx, tenant, req.Key, title)
	if err != nil {
		return nil, err
	}

	modelDisplayName := title
	modelStorageKey := toStorageKey(modelKey)

	modelPayload := map[string]any{
		"canEditViewsOnly":      false,
		"description":           strings.TrimSpace(req.Description),
		"dataSchema":            emptyDataSchema(modelKey, modelDisplayName),
		"displayName":           modelDisplayName,
		"id":                    modelKey,
		"key":                   modelKey,
		"layoutBlueprint":       emptyLayoutBlueprint(),
		"modelStructureVersion": int64(1),
		"name":                  modelDisplayName,
		"sourceType":            "managed",
		"storageKey":            modelStorageKey,
		"title":                 modelDisplayName,
		"version":               int64(1),
	}

	modelRecord := buildModelRecordFromPayload(modelPayload)
	modelPayload, err = normalizeModelPayloadForStorage(modelPayload, &modelRecord, nil)
	if err != nil {
		return nil, err
	}
	modelRecord.DefinitionJSON = mustCanonicalJSON(modelPayload)
	modelRecord.StructureVersion = 1
	modelRecord.Version = 1
	modelRecord.IsStructureLocked = false
	modelRecord.CanEditViewsOnly = false

	firstViewKey, err := s.generateUniqueViewKey(ctx, tenant, modelKey, "default", "Default view")
	if err != nil {
		return nil, err
	}
	firstViewID, err := s.generateUniqueViewID(ctx, tenant, modelKey, firstViewKey)
	if err != nil {
		return nil, err
	}

	viewPayload := map[string]any{
		"description":                      strings.TrimSpace(req.Description),
		"displayName":                      modelDisplayName,
		"id":                               firstViewID,
		"isActive":                         true,
		"isDefault":                        true,
		"isViewLocked":                     false,
		"key":                              firstViewKey,
		"kind":                             "form",
		"lastAlignedModelStructureVersion": int64(1),
		"modelId":                          modelKey,
		"name":                             modelDisplayName,
		"title":                            modelDisplayName,
		"uiSchema":                         buildFreshUISchema(asMap(modelPayload["dataSchema"]), asMap(modelPayload["layoutBlueprint"])),
		"viewVersion":                      int64(1),
		"version":                          int64(1),
	}

	viewRecord := buildViewRecordFromPayload(modelKey, firstViewID, viewPayload)
	viewPayload, err = normalizeViewPayloadForStorage(
		viewPayload,
		&modelRecord,
		&viewRecord,
		asMap(modelPayload["dataSchema"]),
		asMap(modelPayload["layoutBlueprint"]),
	)
	if err != nil {
		return nil, err
	}
	viewRecord.DefinitionJSON = mustCanonicalJSON(viewPayload)

	persistedModel, persistedView, err := s.repo.CreateModelWithFirstView(ctx, tenant, modelRecord, viewRecord)
	if err != nil {
		return nil, err
	}

	views, err := s.repo.ListViews(ctx, tenant, persistedModel.ModelID)
	if err != nil {
		return nil, err
	}

	return buildModelDetailResponse(persistedModel, views, persistedView.ViewID), nil
}

func (s *Service) DeleteModel(ctx context.Context, modelID string) (*DeleteModelResponse, error) {
	tenant, claims, err := s.requireAuthoringContext(ctx)
	if err != nil {
		return nil, err
	}

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
	if isStaticModelRestrictedForActor(claims, model) {
		return nil, ErrModelNotFound
	}
	if !isManagedRuntimeSourceType(model.SourceType) {
		return nil, ErrDeleteUnsupported
	}

	if err := s.repo.DeleteModel(ctx, tenant, model.ModelID); err != nil {
		return nil, err
	}

	return &DeleteModelResponse{DeletedModelID: model.ModelID}, nil
}

func (s *Service) buildModelDetailResponseWithRuntime(
	ctx context.Context,
	tenant requestctx.TenantInfo,
	model *ModelRecord,
	views []ViewRecord,
	selectedViewID string,
) (*ModelDetailResponse, error) {
	response := buildModelDetailResponse(model, views, selectedViewID)
	if response == nil || model == nil {
		return response, nil
	}

	modelPayload, err := buildCanonicalModelPayload(model, views)
	if err != nil {
		return nil, err
	}
	lookupModels, err := s.resolveRuntimeLookupModels(ctx, tenant, modelPayload)
	if err != nil {
		return nil, err
	}

	runtimePlan := buildRuntimeApplyPlan(model, views, modelPayload, lookupModels)
	runtimeSummary, runtimeErr := s.repo.ApplyRuntime(ctx, tenant, runtimePlan)
	if runtimeErr != nil {
		response.RuntimeApply = buildFailedRuntimeApplySummary(tenant, model.ModelID, selectedViewID, runtimeErr)
		return response, nil
	}

	response.RuntimeApply = withRuntimeApplyContext(runtimeSummary, tenant, model.ModelID, selectedViewID)
	return response, nil
}

func buildModelDetailResponse(model *ModelRecord, views []ViewRecord, selectedViewID string) *ModelDetailResponse {
	if model == nil {
		return nil
	}

	fields := buildFieldSummaries(model.DefinitionJSON)
	viewSummaries := make([]ViewSummary, 0, len(views))
	for _, view := range views {
		viewSummaries = append(viewSummaries, buildViewSummary(&view))
	}

	sort.SliceStable(viewSummaries, func(i, j int) bool {
		if viewSummaries[i].IsDefault != viewSummaries[j].IsDefault {
			return viewSummaries[i].IsDefault
		}
		return viewSummaries[i].Title < viewSummaries[j].Title
	})

	return &ModelDetailResponse{
		ModelSummary:   buildModelSummary(model),
		Fields:         fields,
		Views:          viewSummaries,
		SelectedViewID: selectedViewID,
	}
}

func buildModelSummary(model *ModelRecord) ModelSummary {
	if model == nil {
		return ModelSummary{}
	}

	return ModelSummary{
		CanEditViewsOnly:      effectiveCanEditViewsOnly(model),
		DataCount:             model.DataCount,
		Description:           model.Description,
		DisplayName:           model.DisplayName,
		GUID:                  model.GUID,
		ID:                    model.ModelID,
		IsStructureLocked:     model.IsStructureLocked,
		Key:                   model.ModelKey,
		ModelStructureVersion: model.StructureVersion,
		Name:                  model.DisplayName,
		SourceType:            model.SourceType,
		StorageKey:            model.StorageKey,
		Title:                 model.DisplayName,
		Version:               model.Version,
	}
}

func (s *Service) loadModelDataCount(
	ctx context.Context,
	tenant requestctx.TenantInfo,
	model *ModelRecord,
) (int64, bool) {
	relationName := resolveModelDataCountRelationName(model)
	if relationName == "" {
		return 0, false
	}

	count, err := s.repo.CountRelationRows(ctx, tenant, relationName)
	if err != nil {
		return 0, false
	}

	return count, true
}

func resolveModelDataCountRelationName(model *ModelRecord) string {
	if model == nil {
		return ""
	}

	modelPayload := cloneJSONToMap(model.DefinitionJSON)
	if len(modelPayload) > 0 {
		dataSchema := asMap(modelPayload["dataSchema"])
		if len(dataSchema) > 0 {
			dataSchema = ensureDataSchemaRuntimeMetadata(dataSchema, modelPayload, model)
			rootRuntime := readRuntimeDataScopeMetadata(dataSchemaScope(dataSchema, rootSchemaScopeID))
			if relationName := strings.TrimSpace(rootRuntime.TableName); relationName != "" {
				return relationName
			}
		}
	}

	if !isManagedRuntimeSourceType(model.SourceType) {
		return ""
	}

	modelAlias := buildGeneratedRuntimeModelAlias(chooseString(modelStorageKey(model), model.ModelID))
	return buildGeneratedRuntimeTableName(modelAlias)
}

func buildFieldSummaries(raw json.RawMessage) []ModelFieldSummary {
	modelPayload, err := decodeObject(raw, "model.definition")
	if err != nil {
		return []ModelFieldSummary{}
	}

	rawFields := flattenDataSchemaFields(asMap(modelPayload["dataSchema"]))
	if len(rawFields) == 0 {
		rawFields, _ = modelPayload["fields"].([]any)
	}
	out := make([]ModelFieldSummary, 0, len(rawFields))
	for _, rawField := range rawFields {
		field, ok := rawField.(map[string]any)
		if !ok {
			continue
		}
		id := normalizeString(field["id"])
		if id == "" {
			continue
		}
		label := normalizeString(field["label"])
		displayName := normalizeString(field["displayName"])
		if displayName == "" {
			displayName = label
		}
		out = append(out, ModelFieldSummary{
			DisplayName: displayName,
			ID:          id,
			IsLocked:    getBoolValue(field, "isLocked", false),
			IsPersisted: getBoolValue(field, "isPersisted", true),
			Key:         chooseString(normalizeString(field["key"]), id),
			Label:       chooseString(label, displayName),
			Status:      normalizeString(field["status"]),
			StorageKey:  normalizeString(field["storageKey"]),
		})
	}
	return out
}
