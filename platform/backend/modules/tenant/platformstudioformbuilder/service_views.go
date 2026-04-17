package platformstudioformbuilder

import (
	"context"
	"strings"

	"dtriton.com/platform/backend/internal/platform/httpx/requestctx"
)

func (s *Service) ListViews(ctx context.Context, modelID string) (*ListViewsResponse, error) {
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
	tenant, claims, err := s.requireAuthoringContext(ctx)
	if err != nil {
		return nil, err
	}

	model, err := s.resolveModel(ctx, tenant, modelID)
	if err != nil {
		return nil, err
	}
	if isStaticModelRestrictedForActor(claims, model) {
		return nil, ErrModelNotFound
	}

	viewRecord, err := s.createViewRecord(ctx, tenant, model, req, false)
	if err != nil {
		return nil, err
	}

	views, err := s.repo.ListViews(ctx, tenant, model.ModelID)
	if err != nil {
		return nil, err
	}

	return s.buildModelDetailResponseWithRuntime(ctx, tenant, model, views, viewRecord.ViewID)
}

func (s *Service) CopyView(ctx context.Context, modelID, viewID string, req CopyViewRequest) (*ModelDetailResponse, error) {
	tenant, claims, err := s.requireAuthoringContext(ctx)
	if err != nil {
		return nil, err
	}

	model, err := s.resolveModel(ctx, tenant, modelID)
	if err != nil {
		return nil, err
	}
	if isStaticModelRestrictedForActor(claims, model) {
		return nil, ErrModelNotFound
	}

	sourceView, err := s.repo.GetView(ctx, tenant, model.ModelID, viewID)
	if err != nil {
		return nil, err
	}
	if sourceView == nil {
		return nil, ErrViewNotFound
	}
	if !canAccessViewAuthoring(claims, sourceView) {
		return nil, ErrViewLocked
	}

	viewRecord, err := s.createViewRecordFromCopy(ctx, tenant, model, sourceView, req)
	if err != nil {
		return nil, err
	}

	views, err := s.repo.ListViews(ctx, tenant, model.ModelID)
	if err != nil {
		return nil, err
	}

	return s.buildModelDetailResponseWithRuntime(ctx, tenant, model, views, viewRecord.ViewID)
}

func (s *Service) DeleteView(ctx context.Context, modelID, viewID string) (*ModelDetailResponse, error) {
	tenant, claims, err := s.requireAuthoringContext(ctx)
	if err != nil {
		return nil, err
	}

	model, err := s.resolveModel(ctx, tenant, modelID)
	if err != nil {
		return nil, err
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

	viewPayload := map[string]any{}
	if !isDefault {
		if defaultView := findDefaultView(views); defaultView != nil {
			if defaultView.LastAlignedModelStructureVersion == model.StructureVersion {
				defaultPayload, err := buildCanonicalViewPayload(model, defaultView, views, modelPayload)
				if err != nil {
					return nil, err
				}
				viewPayload = cloneJSONToMap(mustCanonicalJSON(defaultPayload))
			}
		}
	}
	if len(viewPayload) == 0 {
		viewPayload = map[string]any{
			"uiSchema": buildFreshUISchema(asMap(modelPayload["dataSchema"]), asMap(modelPayload["layoutBlueprint"])),
		}
	} else {
		stripUISchemaRuntimeMetadata(asMap(viewPayload["uiSchema"]))
	}
	viewPayload["description"] = strings.TrimSpace(req.Description)
	viewPayload["displayName"] = title
	viewPayload["id"] = viewID
	viewPayload["isActive"] = chooseBool(req.IsActive, true)
	viewPayload["isDefault"] = isDefault
	viewPayload["isViewLocked"] = false
	viewPayload["key"] = key
	viewPayload["kind"] = normalizeViewKind(req.Kind)
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
	stripUISchemaRuntimeMetadata(asMap(viewPayload["uiSchema"]))
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
