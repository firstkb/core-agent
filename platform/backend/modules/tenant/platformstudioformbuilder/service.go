package platformstudioformbuilder

import (
	"context"
	"encoding/json"
	"errors"
	"fmt"
	"sort"
	"strings"

	"dtriton.com/platform/backend/internal/platform/httpx/requestctx"
)

var (
	ErrCannotDeleteLastView = errors.New("form builder cannot delete last view")
	ErrDraftConflict        = errors.New("form builder draft version conflict")
	ErrInvalidDraft         = errors.New("form builder invalid draft")
	ErrModelLocked          = errors.New("form builder model locked")
	ErrModelNotFound        = errors.New("form builder model not found")
	ErrTenantMissing        = errors.New("form builder tenant missing")
	ErrUnauthorized         = errors.New("form builder unauthorized")
	ErrViewLocked           = errors.New("form builder view locked")
	ErrViewNotFound         = errors.New("form builder view not found")
)

type Service struct {
	repo Repository
}

func NewService(repo Repository) *Service {
	return &Service{repo: repo}
}

func (s *Service) ListModels(ctx context.Context) (*ListModelsResponse, error) {
	tenant, _, err := s.requireAuthoringContext(ctx)
	if err != nil {
		return nil, err
	}

	models, err := s.repo.ListModels(ctx, tenant)
	if err != nil {
		return nil, err
	}

	items := make([]ModelSummary, 0, len(models))
	for _, model := range models {
		items = append(items, buildModelSummary(&model))
	}

	return &ListModelsResponse{Items: items}, nil
}

func (s *Service) GetModel(ctx context.Context, modelID string) (*ModelDetailResponse, error) {
	tenant, _, err := s.requireAuthoringContext(ctx)
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

func (s *Service) ListViews(ctx context.Context, modelID string) (*ListViewsResponse, error) {
	tenant, _, err := s.requireAuthoringContext(ctx)
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

	views, err := s.repo.ListViews(ctx, tenant, model.ModelID)
	if err != nil {
		return nil, err
	}

	items := make([]ViewSummary, 0, len(views))
	for _, view := range views {
		items = append(items, buildViewSummary(&view))
	}

	return &ListViewsResponse{Items: items}, nil
}

func (s *Service) GetView(ctx context.Context, modelID, viewID string) (*ViewDetailResponse, error) {
	tenant, _, err := s.requireAuthoringContext(ctx)
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

	return &ViewDetailResponse{
		Model: buildModelSummary(model),
		View:  buildViewSummary(view),
		Draft: buildViewDraftForResponse(view, viewPayload, asMap(modelPayload["dataSchema"])),
	}, nil
}

func (s *Service) CreateView(ctx context.Context, modelID string, req CreateViewRequest) (*ModelDetailResponse, error) {
	tenant, _, err := s.requireAuthoringContext(ctx)
	if err != nil {
		return nil, err
	}

	model, err := s.resolveModel(ctx, tenant, modelID)
	if err != nil {
		return nil, err
	}

	viewRecord, err := s.createViewRecord(ctx, tenant, model, req, false)
	if err != nil {
		return nil, err
	}

	views, err := s.repo.ListViews(ctx, tenant, model.ModelID)
	if err != nil {
		return nil, err
	}

	return buildModelDetailResponse(model, views, viewRecord.ViewID), nil
}

func (s *Service) CopyView(ctx context.Context, modelID, viewID string, req CopyViewRequest) (*ModelDetailResponse, error) {
	tenant, _, err := s.requireAuthoringContext(ctx)
	if err != nil {
		return nil, err
	}

	model, err := s.resolveModel(ctx, tenant, modelID)
	if err != nil {
		return nil, err
	}

	sourceView, err := s.repo.GetView(ctx, tenant, model.ModelID, viewID)
	if err != nil {
		return nil, err
	}
	if sourceView == nil {
		return nil, ErrViewNotFound
	}

	viewRecord, err := s.createViewRecordFromCopy(ctx, tenant, model, sourceView, req)
	if err != nil {
		return nil, err
	}

	views, err := s.repo.ListViews(ctx, tenant, model.ModelID)
	if err != nil {
		return nil, err
	}

	return buildModelDetailResponse(model, views, viewRecord.ViewID), nil
}

func (s *Service) DeleteView(ctx context.Context, modelID, viewID string) (*ModelDetailResponse, error) {
	tenant, _, err := s.requireAuthoringContext(ctx)
	if err != nil {
		return nil, err
	}

	model, err := s.resolveModel(ctx, tenant, modelID)
	if err != nil {
		return nil, err
	}

	if err := s.repo.DeleteView(ctx, tenant, model.ModelID, viewID); err != nil {
		return nil, err
	}

	views, err := s.repo.ListViews(ctx, tenant, model.ModelID)
	if err != nil {
		return nil, err
	}

	selectedViewID := ""
	if len(views) > 0 {
		selectedViewID = views[0].ViewID
	}

	return buildModelDetailResponse(model, views, selectedViewID), nil
}

func (s *Service) LoadDraft(ctx context.Context, modelID string, viewID string) (*LoadDraftResponse, error) {
	tenant, _, err := s.requireAuthoringContext(ctx)
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

	if got := normalizeStableKeyFromPayload(incomingModel, "id", "key"); got != "" && got != modelID {
		return nil, ErrInvalidDraft
	}
	if got := normalizeStableKeyFromPayload(incomingView, "id", "key"); got != "" && got != viewID {
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

	modelPayload, err := normalizeModelPayloadForStorage(incomingModel, model, defaultView)
	if err != nil {
		return nil, err
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
	existingModelPayload, err := buildCanonicalModelPayload(model, views)
	if err != nil {
		return nil, err
	}
	existingViewPayload, err := buildCanonicalViewPayload(model, currentView, views, existingModelPayload)
	if err != nil {
		return nil, err
	}

	modelChanged, err := payloadChanged(mustCanonicalJSON(existingModelPayload), modelPayload, []string{"version", "modelStructureVersion", "screens", "modelLocked", "isStructureLocked"})
	if err != nil {
		return nil, err
	}
	viewChanged, err := payloadChanged(mustCanonicalJSON(existingViewPayload), viewPayload, []string{"version", "viewVersion", "lastAlignedModelStructureVersion"})
	if err != nil {
		return nil, err
	}

	modelStructureChanged, err := structureChanged(mustCanonicalJSON(existingModelPayload), modelPayload)
	if err != nil {
		return nil, err
	}

	modelLocked := getBoolFallback(incomingModel, "isStructureLocked", "modelLocked", model.IsStructureLocked)
	viewLocked := getBoolFallback(incomingView, "isViewLocked", "viewLocked", currentView.IsViewLocked)

	if !isRootActor(claims) {
		if modelLocked && modelStructureChanged {
			return nil, ErrModelLocked
		}
		if viewLocked && viewChanged {
			return nil, ErrViewLocked
		}
	}

	nextModel := *model
	nextModel.IsStructureLocked = modelLocked
	nextModel.CanEditViewsOnly = modelLocked
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
	nextView.IsViewLocked = viewLocked
	nextView.DefinitionJSON = mustCanonicalJSON(viewPayload)
	nextView.LastAlignedModelStructureVersion = nextModel.StructureVersion
	if viewChanged {
		nextView.Version = currentView.Version + 1
	}

	expectedModelVersion := req.ExpectedVersions.Model
	expectedViewVersion := req.ExpectedVersions.View

	persistedModel, err := s.repo.UpdateModel(ctx, tenant, nextModel, expectedModelVersion)
	if err != nil {
		return nil, err
	}
	persistedView, err := s.repo.UpdateView(ctx, tenant, nextView, expectedViewVersion)
	if err != nil {
		return nil, err
	}

	views, err = s.repo.ListViews(ctx, tenant, persistedModel.ModelID)
	if err != nil {
		return nil, err
	}

	return buildDraftResponse(persistedModel, views, persistedView)
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

func (s *Service) createViewRecord(
	ctx context.Context,
	tenant requestctx.TenantInfo,
	model *ModelRecord,
	req CreateViewRequest,
	isDefault bool,
) (*ViewRecord, error) {
	title := strings.TrimSpace(req.Title)
	if title == "" {
		title = "New view"
	}

	key, err := s.generateUniqueViewKey(ctx, tenant, model.ModelID, req.Key, title)
	if err != nil {
		return nil, err
	}
	viewID, err := s.generateUniqueViewID(ctx, tenant, model.ModelID, key)
	if err != nil {
		return nil, err
	}

	views, err := s.repo.ListViews(ctx, tenant, model.ModelID)
	if err != nil {
		return nil, err
	}
	modelPayload, err := buildCanonicalModelPayload(model, views)
	if err != nil {
		return nil, err
	}

	viewPayload := map[string]any{
		"description":                      strings.TrimSpace(req.Description),
		"displayName":                      title,
		"id":                               viewID,
		"isActive":                         chooseBool(req.IsActive, true),
		"isDefault":                        isDefault,
		"isViewLocked":                     false,
		"key":                              key,
		"kind":                             normalizeViewKind(req.Kind),
		"lastAlignedModelStructureVersion": model.StructureVersion,
		"modelId":                          model.ModelID,
		"name":                             title,
		"title":                            title,
		"uiSchema":                         buildFreshUISchema(asMap(modelPayload["dataSchema"]), asMap(modelPayload["layoutBlueprint"])),
		"viewVersion":                      int64(1),
		"version":                          int64(1),
	}

	viewRecord := buildViewRecordFromPayload(model.ModelID, viewID, viewPayload)
	viewPayload, err = normalizeViewPayloadForStorage(
		viewPayload,
		model,
		&viewRecord,
		asMap(modelPayload["dataSchema"]),
		asMap(modelPayload["layoutBlueprint"]),
	)
	if err != nil {
		return nil, err
	}
	viewRecord.DefinitionJSON = mustCanonicalJSON(viewPayload)
	viewRecord.IsDefault = isDefault

	persistedView, err := s.repo.CreateView(ctx, tenant, viewRecord)
	if err != nil {
		return nil, err
	}

	return persistedView, nil
}

func (s *Service) createViewRecordFromCopy(
	ctx context.Context,
	tenant requestctx.TenantInfo,
	model *ModelRecord,
	source *ViewRecord,
	req CopyViewRequest,
) (*ViewRecord, error) {
	title := strings.TrimSpace(req.Title)
	if title == "" {
		title = "Copy of " + source.DisplayName
	}

	key, err := s.generateUniqueViewKey(ctx, tenant, model.ModelID, req.Key, title)
	if err != nil {
		return nil, err
	}
	viewID, err := s.generateUniqueViewID(ctx, tenant, model.ModelID, key)
	if err != nil {
		return nil, err
	}

	views, err := s.repo.ListViews(ctx, tenant, model.ModelID)
	if err != nil {
		return nil, err
	}
	modelPayload, err := buildCanonicalModelPayload(model, views)
	if err != nil {
		return nil, err
	}
	sourcePayload, err := buildCanonicalViewPayload(model, source, views, modelPayload)
	if err != nil {
		return nil, err
	}

	viewPayload := cloneJSONToMap(mustCanonicalJSON(sourcePayload))
	viewPayload["description"] = strings.TrimSpace(req.Description)
	viewPayload["displayName"] = title
	viewPayload["id"] = viewID
	viewPayload["isActive"] = chooseBool(req.IsActive, true)
	viewPayload["isDefault"] = false
	viewPayload["isViewLocked"] = false
	viewPayload["key"] = key
	viewPayload["kind"] = normalizeViewKind(req.Kind, source.ViewType)
	viewPayload["lastAlignedModelStructureVersion"] = model.StructureVersion
	viewPayload["modelId"] = model.ModelID
	viewPayload["name"] = title
	viewPayload["title"] = title
	viewPayload["viewVersion"] = int64(1)
	viewPayload["version"] = int64(1)

	viewRecord := buildViewRecordFromPayload(model.ModelID, viewID, viewPayload)
	viewPayload, err = normalizeViewPayloadForStorage(
		viewPayload,
		model,
		&viewRecord,
		asMap(modelPayload["dataSchema"]),
		asMap(modelPayload["layoutBlueprint"]),
	)
	if err != nil {
		return nil, err
	}
	viewRecord.DefinitionJSON = mustCanonicalJSON(viewPayload)
	viewRecord.IsDefault = false
	viewRecord.IsActive = chooseBool(req.IsActive, true)
	viewRecord.IsViewLocked = false

	persistedView, err := s.repo.CreateView(ctx, tenant, viewRecord)
	if err != nil {
		return nil, err
	}

	return persistedView, nil
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

	for candidateIndex := 0; candidateIndex < 100; candidateIndex++ {
		candidate := base
		if candidateIndex > 0 {
			candidate = fmt.Sprintf("%s-%d", base, candidateIndex+1)
		}
		existing, err := s.repo.GetView(ctx, tenant, modelID, candidate)
		if err != nil {
			return "", err
		}
		if existing == nil {
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

	for candidateIndex := 0; candidateIndex < 100; candidateIndex++ {
		candidate := base
		if candidateIndex > 0 {
			candidate = fmt.Sprintf("%s-%d", base, candidateIndex+1)
		}
		existing, err := s.repo.GetView(ctx, tenant, modelID, candidate)
		if err != nil {
			return "", err
		}
		if existing == nil {
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
		CanEditViewsOnly:      model.CanEditViewsOnly,
		Description:           model.Description,
		DisplayName:           model.DisplayName,
		GUID:                  model.GUID,
		ID:                    model.ModelID,
		IsStructureLocked:     model.IsStructureLocked,
		Key:                   model.ModelKey,
		ModelStructureVersion: model.StructureVersion,
		Name:                  model.DisplayName,
		StorageKey:            model.StorageKey,
		Title:                 model.DisplayName,
		Version:               model.Version,
	}
}

func buildViewSummary(view *ViewRecord) ViewSummary {
	if view == nil {
		return ViewSummary{}
	}

	return ViewSummary{
		Description:                      view.Description,
		DisplayName:                      view.DisplayName,
		GUID:                             view.GUID,
		ID:                               view.ViewID,
		IsActive:                         view.IsActive,
		IsDefault:                        view.IsDefault,
		IsViewLocked:                     view.IsViewLocked,
		Key:                              view.ViewKey,
		LastAlignedModelStructureVersion: view.LastAlignedModelStructureVersion,
		ModelID:                          view.ModelID,
		Name:                             view.DisplayName,
		Title:                            view.DisplayName,
		Kind:                             view.ViewType,
		Version:                          view.Version,
	}
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

func buildModelDraftForResponse(model *ModelRecord, views []ViewRecord, canonicalPayload map[string]any) map[string]any {
	payload := injectCompatibilityFields(canonicalPayload)

	payload["canEditViewsOnly"] = model.CanEditViewsOnly
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
	payload["isActive"] = view.IsActive
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
		"isActive":                         view.IsActive,
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

func buildModelRecordFromPayload(payload map[string]any) ModelRecord {
	displayName := chooseString(normalizeString(payload["displayName"]), chooseString(normalizeString(payload["title"]), normalizeString(payload["name"])))
	modelID := chooseString(normalizeString(payload["id"]), normalizeString(payload["key"]))
	modelKey := chooseString(normalizeString(payload["key"]), modelID)

	return ModelRecord{
		ModelID:           modelID,
		ModelKey:          modelKey,
		StorageKey:        normalizeString(payload["storageKey"]),
		DisplayName:       displayName,
		Description:       normalizeString(payload["description"]),
		SourceType:        chooseString(normalizeString(payload["sourceType"]), "managed"),
		Status:            chooseString(normalizeString(payload["status"]), "draft"),
		Version:           getInt64Value(payload, "version", 1),
		PublishedVersion:  getInt64Value(payload, "publishedVersion", 0),
		StructureVersion:  getInt64Value(payload, "modelStructureVersion", 1),
		IsStructureLocked: getBoolValue(payload, "isStructureLocked", getBoolValue(payload, "modelLocked", false)),
		CanEditViewsOnly:  getBoolValue(payload, "canEditViewsOnly", getBoolValue(payload, "isStructureLocked", false)),
		DefinitionJSON:    mustCanonicalJSON(payload),
	}
}

func buildViewRecordFromPayload(modelID, viewID string, payload map[string]any) ViewRecord {
	displayName := chooseString(normalizeString(payload["displayName"]), chooseString(normalizeString(payload["title"]), normalizeString(payload["name"])))
	return ViewRecord{
		ModelID:                          modelID,
		ViewID:                           viewID,
		ViewKey:                          chooseString(normalizeString(payload["key"]), viewID),
		DisplayName:                      displayName,
		Description:                      normalizeString(payload["description"]),
		ViewType:                         chooseString(normalizeString(payload["kind"]), "form"),
		IsDefault:                        getBoolValue(payload, "isDefault", false),
		IsActive:                         getBoolValue(payload, "isActive", true),
		IsViewLocked:                     getBoolValue(payload, "isViewLocked", getBoolValue(payload, "viewLocked", false)),
		Status:                           chooseString(normalizeString(payload["status"]), "draft"),
		Version:                          getInt64Value(payload, "viewVersion", 1),
		PublishedVersion:                 getInt64Value(payload, "publishedVersion", 0),
		LastAlignedModelStructureVersion: getInt64Value(payload, "lastAlignedModelStructureVersion", 1),
		DefinitionJSON:                   mustCanonicalJSON(payload),
		PublishedArtifactsJSON:           json.RawMessage(`{}`),
	}
}

func normalizeStableKey(value string) string {
	value = strings.TrimSpace(strings.ToLower(value))
	if value == "" {
		return ""
	}

	var b strings.Builder
	lastDash := false
	for _, r := range value {
		switch {
		case r >= 'a' && r <= 'z':
			b.WriteRune(r)
			lastDash = false
		case r >= '0' && r <= '9':
			b.WriteRune(r)
			lastDash = false
		default:
			if !lastDash {
				b.WriteByte('-')
				lastDash = true
			}
		}
	}

	out := strings.Trim(b.String(), "-")
	if out == "" {
		return ""
	}
	return out
}

func toStorageKey(value string) string {
	value = normalizeStableKey(value)
	if value == "" {
		return ""
	}

	value = strings.ReplaceAll(value, "-", "_")
	return strings.Trim(value, "_")
}

func normalizeViewKind(value string, fallback ...string) string {
	value = strings.TrimSpace(strings.ToLower(value))
	if value != "" {
		return value
	}
	if len(fallback) > 0 {
		return strings.TrimSpace(strings.ToLower(fallback[0]))
	}
	return "form"
}

func chooseString(primary, fallback string) string {
	if strings.TrimSpace(primary) != "" {
		return strings.TrimSpace(primary)
	}
	return strings.TrimSpace(fallback)
}

func chooseBool(value *bool, fallback bool) bool {
	if value == nil {
		return fallback
	}
	return *value
}

func normalizeString(value any) string {
	switch typed := value.(type) {
	case string:
		return strings.TrimSpace(typed)
	case json.RawMessage:
		return strings.TrimSpace(string(typed))
	default:
		return ""
	}
}

func getBoolValue(payload map[string]any, key string, fallback bool) bool {
	value, ok := payload[key]
	if !ok {
		return fallback
	}
	if typed, ok := value.(bool); ok {
		return typed
	}
	return fallback
}

func getInt64Value(payload map[string]any, key string, fallback int64) int64 {
	value, ok := payload[key]
	if !ok {
		return fallback
	}
	switch typed := value.(type) {
	case int64:
		return typed
	case int:
		return int64(typed)
	case float64:
		return int64(typed)
	case json.Number:
		if parsed, err := typed.Int64(); err == nil {
			return parsed
		}
	}
	return fallback
}

func getBoolFallback(payload map[string]any, primaryKey, fallbackKey string, fallback bool) bool {
	if value, ok := payload[primaryKey]; ok {
		if typed, ok := value.(bool); ok {
			return typed
		}
	}
	if value, ok := payload[fallbackKey]; ok {
		if typed, ok := value.(bool); ok {
			return typed
		}
	}
	return fallback
}

func normalizeStableKeyFromPayload(payload map[string]any, keys ...string) string {
	for _, key := range keys {
		if value := normalizeStableKey(normalizeString(payload[key])); value != "" {
			return value
		}
	}
	return ""
}

func cloneJSONToMap(raw json.RawMessage) map[string]any {
	if len(raw) == 0 {
		return map[string]any{}
	}
	var out map[string]any
	if err := json.Unmarshal(raw, &out); err != nil {
		return map[string]any{}
	}
	if out == nil {
		return map[string]any{}
	}
	return out
}

func mustCanonicalJSON(value any) json.RawMessage {
	encoded, err := json.Marshal(value)
	if err != nil {
		return json.RawMessage(`{}`)
	}
	return json.RawMessage(encoded)
}

func decodeObject(raw json.RawMessage, fieldName string) (map[string]any, error) {
	if len(raw) == 0 {
		return nil, ErrInvalidDraft
	}

	var out map[string]any
	if err := json.Unmarshal(raw, &out); err != nil {
		return nil, fmt.Errorf("%w: invalid %s", ErrInvalidDraft, fieldName)
	}
	if out == nil {
		return nil, ErrInvalidDraft
	}
	return out, nil
}

func payloadChanged(existing json.RawMessage, incoming map[string]any, transientKeys []string) (bool, error) {
	existingMap := cloneJSONToMap(existing)
	existingPruned := pruneTransientKeys(existingMap, transientKeys)
	incomingPruned := pruneTransientKeys(cloneJSONToMap(mustCanonicalJSON(incoming)), transientKeys)

	left, err := json.Marshal(existingPruned)
	if err != nil {
		return false, err
	}
	right, err := json.Marshal(incomingPruned)
	if err != nil {
		return false, err
	}

	return string(left) != string(right), nil
}

func structureChanged(existing json.RawMessage, incoming map[string]any) (bool, error) {
	existingMap := cloneJSONToMap(existing)
	existingSignature := pruneTransientKeys(existingMap, []string{
		"version",
		"modelStructureVersion",
		"guid",
		"status",
		"screens",
		"modelLocked",
		"isStructureLocked",
		"description",
		"displayName",
		"name",
		"title",
	})
	incomingSignature := pruneTransientKeys(cloneJSONToMap(mustCanonicalJSON(incoming)), []string{
		"version",
		"modelStructureVersion",
		"guid",
		"status",
		"screens",
		"modelLocked",
		"isStructureLocked",
		"description",
		"displayName",
		"name",
		"title",
	})

	left, err := json.Marshal(existingSignature)
	if err != nil {
		return false, err
	}
	right, err := json.Marshal(incomingSignature)
	if err != nil {
		return false, err
	}

	return string(left) != string(right), nil
}

func pruneTransientKeys(value map[string]any, transientKeys []string) map[string]any {
	if value == nil {
		return map[string]any{}
	}

	blocked := make(map[string]struct{}, len(transientKeys))
	for _, key := range transientKeys {
		blocked[key] = struct{}{}
	}

	return pruneValue(value, blocked).(map[string]any)
}

func pruneValue(value any, blocked map[string]struct{}) any {
	switch typed := value.(type) {
	case map[string]any:
		out := make(map[string]any, len(typed))
		for key, child := range typed {
			if _, ok := blocked[key]; ok {
				continue
			}
			out[key] = pruneValue(child, blocked)
		}
		return out
	case []any:
		out := make([]any, 0, len(typed))
		for _, entry := range typed {
			out = append(out, pruneValue(entry, blocked))
		}
		return out
	default:
		return typed
	}
}

func isRootActor(claims requestctx.ClaimsInfo) bool {
	role := strings.ToLower(strings.TrimSpace(claims.Role))
	return claims.Level >= 90 || role == "owner" || role == "root"
}
