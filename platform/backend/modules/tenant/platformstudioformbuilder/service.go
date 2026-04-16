package platformstudioformbuilder

import (
	"bytes"
	"context"
	"encoding/csv"
	"encoding/json"
	"errors"
	"fmt"
	"sort"
	"strings"
	"time"

	"dtriton.com/platform/backend/internal/platform/httpx/requestctx"
)

var (
	ErrCannotDeleteLastView = errors.New("form builder cannot delete last view")
	ErrDraftConflict        = errors.New("form builder draft version conflict")
	ErrInvalidDraft         = errors.New("form builder invalid draft")
	ErrDeleteUnsupported    = errors.New("form builder delete unsupported")
	ErrModelLocked          = errors.New("form builder model locked")
	ErrModelNotFound        = errors.New("form builder model not found")
	ErrExportUnsupported    = errors.New("form builder export unsupported")
	ErrRuntimeNameConflict  = errors.New("form builder runtime name conflict")
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

func (s *Service) ExportModelData(ctx context.Context, modelID string) (*ExportFile, error) {
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
		return nil, ErrExportUnsupported
	}

	views, err := s.repo.ListViews(ctx, tenant, model.ModelID)
	if err != nil {
		return nil, err
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
	columns := buildModelDataExportColumns(
		asMap(modelPayload["dataSchema"]),
		runtimePlan.RootScope.SourceIDColumn,
		runtimePlan.RootScope.Fields,
	)
	columnNames := make([]string, 0, len(columns))
	for _, column := range columns {
		columnNames = append(columnNames, column.ColumnName)
	}

	rows, err := s.repo.ExportDataRows(
		ctx,
		tenant,
		runtimePlan.RootScope.TableName,
		columnNames,
		runtimePlan.RootScope.SourceIDColumn,
	)
	if err != nil {
		return nil, err
	}
	content, err := encodeModelDataCSV(columns, rows)
	if err != nil {
		return nil, err
	}

	return &ExportFile{
		FileName:    buildModelExportFileName(model, "data.csv"),
		ContentType: "text/csv; charset=utf-8",
		Content:     content,
	}, nil
}

func (s *Service) ExportModelBundle(ctx context.Context, modelID string) (*ExportFile, error) {
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
		return nil, ErrExportUnsupported
	}

	views, err := s.repo.ListViews(ctx, tenant, model.ModelID)
	if err != nil {
		return nil, err
	}
	if !isRootActor(claims) {
		for index := range views {
			if !canAccessViewAuthoring(claims, &views[index]) {
				return nil, ErrViewLocked
			}
		}
	}

	modelPayload, err := buildCanonicalModelPayload(model, views)
	if err != nil {
		return nil, err
	}
	exportedAt := time.Now().UTC().Format(time.RFC3339)
	sourceType := chooseString(model.SourceType, normalizeString(modelPayload["sourceType"]))

	viewPayloads := make([]any, 0, len(views))
	for index := range views {
		viewPayload, err := buildCanonicalViewPayload(model, &views[index], views, modelPayload)
		if err != nil {
			return nil, err
		}
		viewPayloads = append(viewPayloads, viewPayload)
	}

	bundle := map[string]any{
		"dependencies":  buildExportModelDependencies(asMap(modelPayload["dataSchema"])),
		"exportKind":    "form_builder_model",
		"exportMeta":    buildExportMeta(tenant, claims, exportedAt),
		"exportedAt":    exportedAt,
		"formatVersion": "v1",
		"importPolicy": map[string]any{
			"conflictMode": "reject",
		},
		"model":         modelPayload,
		"runtimePolicy": buildExportRuntimePolicy(sourceType),
		"views":         viewPayloads,
	}
	content, err := json.MarshalIndent(bundle, "", "  ")
	if err != nil {
		return nil, fmt.Errorf("form builder: marshal model export bundle: %w", err)
	}

	return &ExportFile{
		FileName:    buildModelExportFileName(model, "model.json"),
		ContentType: "application/json; charset=utf-8",
		Content:     content,
	}, nil
}

func buildExportMeta(
	tenant requestctx.TenantInfo,
	claims requestctx.ClaimsInfo,
	exportedAt string,
) map[string]any {
	meta := map[string]any{
		"exportedAt": exportedAt,
	}
	if tenantID := strings.TrimSpace(tenant.ID); tenantID != "" {
		meta["sourceTenantId"] = tenantID
	}
	if tenantName := strings.TrimSpace(tenant.Name); tenantName != "" {
		meta["sourceTenantName"] = tenantName
	}

	exportedBy := map[string]any{}
	if userID := strings.TrimSpace(claims.UserID); userID != "" {
		exportedBy["userId"] = userID
	}
	if email := strings.TrimSpace(claims.Email); email != "" {
		exportedBy["email"] = email
	}
	if len(exportedBy) > 0 {
		meta["exportedBy"] = exportedBy
	}

	return meta
}

func buildExportRuntimePolicy(sourceType string) map[string]any {
	sourceType = chooseString(strings.TrimSpace(sourceType), runtimeSourceTypeManaged)
	if isManagedRuntimeSourceType(sourceType) {
		return map[string]any{
			"onImport":   "reapply_runtime",
			"sourceType": sourceType,
		}
	}
	return map[string]any{
		"onImport":   "validate_runtime_metadata",
		"sourceType": sourceType,
	}
}

func buildExportModelDependencies(dataSchema map[string]any) map[string]any {
	type dependencyAccumulator struct {
		ModelID string
		Reasons map[string]struct{}
	}

	dependencies := make(map[string]*dependencyAccumulator)
	for _, rawField := range flattenDataSchemaFields(dataSchema) {
		field := asMap(rawField)
		modelID, reason := resolveExportDependency(field)
		if modelID == "" {
			continue
		}

		entry, ok := dependencies[modelID]
		if !ok {
			entry = &dependencyAccumulator{
				ModelID: modelID,
				Reasons: map[string]struct{}{},
			}
			dependencies[modelID] = entry
		}
		if reason != "" {
			entry.Reasons[reason] = struct{}{}
		}
	}

	models := make([]string, 0, len(dependencies))
	for modelID := range dependencies {
		models = append(models, modelID)
	}
	sort.Strings(models)

	items := make([]any, 0, len(models))
	for _, modelID := range models {
		entry := dependencies[modelID]
		reasons := make([]string, 0, len(entry.Reasons))
		for reason := range entry.Reasons {
			reasons = append(reasons, reason)
		}
		sort.Strings(reasons)
		items = append(items, map[string]any{
			"modelId":  entry.ModelID,
			"reasons":  reasons,
			"required": true,
		})
	}

	return map[string]any{
		"models": items,
	}
}

func resolveExportDependency(field map[string]any) (string, string) {
	if normalizeString(field["kind"]) != "db_lookup" {
		return "", ""
	}

	switch normalizeString(field["preset"]) {
	case "contact_lookup":
		return "users", "contact_lookup"
	case "company_lookup":
		return "company", "company_lookup"
	case "project_lookup":
		return "projects", "project_lookup"
	}

	sourceModel := normalizeString(asMap(field["lookupConfig"])["sourceModel"])
	if sourceModel == "" {
		return "", ""
	}
	return sourceModel, chooseString(normalizeString(field["preset"]), "lookup_source_model")
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
	existingModelPayload, err := buildCanonicalModelPayload(model, views)
	if err != nil {
		return nil, err
	}
	existingViewPayload, err := buildCanonicalViewPayload(model, currentView, views, existingModelPayload)
	if err != nil {
		return nil, err
	}

	modelPayload := existingModelPayload
	if currentView.IsDefault {
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

	modelLocked := getBoolFallback(incomingModel, "isStructureLocked", "modelLocked", model.IsStructureLocked)
	viewLocked := getBoolFallback(incomingView, "isViewLocked", "viewLocked", currentView.IsViewLocked)
	modelLockChanged := modelLocked != model.IsStructureLocked
	viewLockChanged := viewLocked != currentView.IsViewLocked

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
	normalizedNextView := buildViewRecordFromPayload(currentView.ModelID, currentView.ViewID, viewPayload)
	nextView.ViewKey = normalizedNextView.ViewKey
	nextView.DisplayName = normalizedNextView.DisplayName
	nextView.Description = normalizedNextView.Description
	nextView.ViewType = normalizedNextView.ViewType
	nextView.IsDefault = normalizedNextView.IsDefault
	nextView.IsActive = normalizedNextView.IsActive
	nextView.Status = normalizedNextView.Status
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

type modelDataExportColumn struct {
	ColumnName string
	Header     string
}

func buildModelDataExportColumns(dataSchema map[string]any, sourceIDColumn string, fields []runtimeApplyFieldPlan) []modelDataExportColumn {
	rootScope := asMap(dataSchema["rootScope"])
	rootFields := asSlice(rootScope["fields"])
	fieldsByID := make(map[string]runtimeApplyFieldPlan, len(fields))
	for _, field := range fields {
		fieldsByID[field.FieldID] = field
	}

	columns := make([]modelDataExportColumn, 0, len(rootFields)+1)
	if strings.TrimSpace(sourceIDColumn) != "" {
		columns = append(columns, modelDataExportColumn{
			ColumnName: sourceIDColumn,
			Header:     "Doc.id",
		})
	}
	for _, rawField := range rootFields {
		field := asMap(rawField)
		fieldID := chooseString(
			normalizeString(field["fieldId"]),
			chooseString(normalizeString(field["id"]), normalizeString(field["key"])),
		)
		if fieldID == "" {
			continue
		}
		fieldPlan, ok := fieldsByID[fieldID]
		if !ok || !fieldPlan.Supported {
			continue
		}
		columnName := runtimeDataExportColumnForField(fieldPlan)
		if strings.TrimSpace(columnName) == "" {
			continue
		}
		header := chooseString(
			normalizeString(field["label"]),
			chooseString(normalizeString(field["displayName"]), humanizeIdentifier(fieldPlan.StorageKey)),
		)
		columns = append(columns, modelDataExportColumn{
			ColumnName: columnName,
			Header:     header,
		})
	}

	return columns
}

func runtimeDataExportColumnForField(field runtimeApplyFieldPlan) string {
	if strings.TrimSpace(field.SourceColumnName) != "" {
		return field.SourceColumnName
	}
	return strings.TrimSpace(field.ColumnName)
}

func encodeModelDataCSV(columns []modelDataExportColumn, rows [][]string) ([]byte, error) {
	buffer := &bytes.Buffer{}
	writer := csv.NewWriter(buffer)

	headers := make([]string, 0, len(columns))
	for _, column := range columns {
		headers = append(headers, column.Header)
	}
	if err := writer.Write(headers); err != nil {
		return nil, fmt.Errorf("form builder: write export csv header: %w", err)
	}

	for _, row := range rows {
		record := make([]string, len(columns))
		copy(record, row)
		if err := writer.Write(record); err != nil {
			return nil, fmt.Errorf("form builder: write export csv row: %w", err)
		}
	}

	writer.Flush()
	if err := writer.Error(); err != nil {
		return nil, fmt.Errorf("form builder: finalize export csv: %w", err)
	}
	return buffer.Bytes(), nil
}

func buildModelExportFileName(model *ModelRecord, suffix string) string {
	base := normalizeStableKey(chooseString(model.ModelKey, model.ModelID))
	if base == "" {
		base = "model"
	}
	return fmt.Sprintf("%s-%s", base, suffix)
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
		CanEditViewsOnly:      model.CanEditViewsOnly,
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
		"canEditViewsOnly",
		"modelLocked",
		"isStructureLocked",
		"description",
		"displayName",
		"label",
		"modelTitle",
		"name",
		"title",
	})
	incomingSignature := pruneTransientKeys(cloneJSONToMap(mustCanonicalJSON(incoming)), []string{
		"version",
		"modelStructureVersion",
		"guid",
		"status",
		"screens",
		"canEditViewsOnly",
		"modelLocked",
		"isStructureLocked",
		"description",
		"displayName",
		"label",
		"modelTitle",
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
	return claims.Level == 100
}

func canAccessViewAuthoring(claims requestctx.ClaimsInfo, view *ViewRecord) bool {
	if view == nil {
		return false
	}
	return isRootActor(claims) || !view.IsViewLocked
}

func isStaticModelRestrictedForActor(claims requestctx.ClaimsInfo, model *ModelRecord) bool {
	if model == nil {
		return false
	}
	return !isRootActor(claims) && isExternalRuntimeSourceType(model.SourceType)
}
