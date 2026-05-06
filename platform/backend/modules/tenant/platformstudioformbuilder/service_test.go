package platformstudioformbuilder

import (
	"bytes"
	"context"
	"encoding/csv"
	"encoding/json"
	"errors"
	"reflect"
	"sort"
	"strings"
	"testing"

	"dtriton.com/platform/backend/internal/platform/httpx/requestctx"
	collectiontable "dtriton.com/platform/backend/modules/shared/collectiontable"
)

type memoryRepository struct {
	models                             map[string]*ModelRecord
	views                              map[string]map[string]*ViewRecord
	relationRowCounts                  map[string]int64
	runtimeRelations                   map[string]string
	runtimeRelationColumns             map[string]map[string]struct{}
	runtimeQueryRows                   map[string][]runtimeRelationQueryRow
	runtimeSuggestions                 map[string]map[string][]runtimeRelationSuggestion
	runtimeFavorites                   map[string]RuntimeFavoriteRecord
	runtimeSavedFilters                map[string][]collectiontable.SavedFilterSet
	lastRuntimePlan                    *runtimeApplyPlan
	lastExportRelationName             string
	lastExportColumnNames              []string
	lastExportOrderByColumn            string
	lastRuntimeWhereArgs               []any
	lastRuntimeWhereClause             string
	lastRuntimeSuggestionArgs          []any
	lastRuntimeSuggestionWhere         string
	lastRuntimeSavedFilterPrincipal    string
	lastRuntimeSavedFilterSurface      string
	lastRuntimeSavedFilterLabel        string
	lastRuntimeSavedFilterQuickFilters []collectiontable.QuickFilter
	lastRuntimeDeletedSavedFilterID    string
	lastRuntimeFavoritePrincipal       string
	lastRuntimeFavoriteSurface         string
	lastRuntimeFavoriteModelID         string
	lastRuntimeFavoriteViewID          string
	lastRuntimeOrderByColumn           string
	lastRuntimeOrderDirection          string
	exportRows                         [][]string
	runtimeApplyErr                    error
}

func newMemoryRepository() *memoryRepository {
	return &memoryRepository{
		models:                 map[string]*ModelRecord{},
		views:                  map[string]map[string]*ViewRecord{},
		relationRowCounts:      map[string]int64{},
		runtimeRelations:       map[string]string{},
		runtimeRelationColumns: map[string]map[string]struct{}{},
		runtimeQueryRows:       map[string][]runtimeRelationQueryRow{},
		runtimeSuggestions:     map[string]map[string][]runtimeRelationSuggestion{},
		runtimeFavorites:       map[string]RuntimeFavoriteRecord{},
		runtimeSavedFilters:    map[string][]collectiontable.SavedFilterSet{},
	}
}

func (r *memoryRepository) ListModels(_ context.Context, _ requestctx.TenantInfo) ([]ModelRecord, error) {
	items := make([]ModelRecord, 0, len(r.models))
	for _, record := range r.models {
		items = append(items, cloneModelRecord(record))
	}
	sort.Slice(items, func(i, j int) bool { return items[i].ModelID < items[j].ModelID })
	return items, nil
}

func (r *memoryRepository) GetModel(_ context.Context, _ requestctx.TenantInfo, modelID string) (*ModelRecord, error) {
	for _, record := range r.models {
		if record.ModelID == modelID || record.ModelKey == modelID {
			clone := cloneModelRecord(record)
			return &clone, nil
		}
	}
	return nil, nil
}

func (r *memoryRepository) ListViews(_ context.Context, _ requestctx.TenantInfo, modelID string) ([]ViewRecord, error) {
	entries := r.views[modelID]
	items := make([]ViewRecord, 0, len(entries))
	for _, record := range entries {
		items = append(items, cloneViewRecord(record))
	}
	sort.Slice(items, func(i, j int) bool {
		if items[i].IsDefault != items[j].IsDefault {
			return items[i].IsDefault
		}
		return items[i].ViewID < items[j].ViewID
	})
	return items, nil
}

func (r *memoryRepository) GetView(_ context.Context, _ requestctx.TenantInfo, modelID, viewID string) (*ViewRecord, error) {
	entries := r.views[modelID]
	if record := entries[viewID]; record != nil {
		clone := cloneViewRecord(record)
		return &clone, nil
	}
	return nil, nil
}

func (r *memoryRepository) CountRelationRows(_ context.Context, _ requestctx.TenantInfo, relationName string) (int64, error) {
	return r.relationRowCounts[relationName], nil
}

func (r *memoryRepository) ExportDataRows(_ context.Context, _ requestctx.TenantInfo, relationName string, columnNames []string, orderByColumn string) ([][]string, error) {
	r.lastExportRelationName = relationName
	r.lastExportColumnNames = append([]string(nil), columnNames...)
	r.lastExportOrderByColumn = orderByColumn

	rows := make([][]string, 0, len(r.exportRows))
	for _, row := range r.exportRows {
		rows = append(rows, append([]string(nil), row...))
	}
	return rows, nil
}

func (r *memoryRepository) QueryRuntimeRows(
	_ context.Context,
	_ requestctx.TenantInfo,
	relationName string,
	_ []string,
	whereClause string,
	whereArgs []any,
	orderByColumn string,
	orderDirection string,
	page int,
	pageSize int,
) ([]runtimeRelationQueryRow, int, error) {
	r.lastRuntimeOrderByColumn = orderByColumn
	r.lastRuntimeOrderDirection = orderDirection
	r.lastRuntimeWhereClause = whereClause
	r.lastRuntimeWhereArgs = append([]any(nil), whereArgs...)
	rows := r.runtimeQueryRows[relationName]
	totalItems := len(rows)
	if page < 1 {
		page = 1
	}
	if pageSize < 1 {
		pageSize = totalItems
	}
	start := (page - 1) * pageSize
	if start > totalItems {
		return []runtimeRelationQueryRow{}, totalItems, nil
	}
	end := start + pageSize
	if end > totalItems {
		end = totalItems
	}
	items := make([]runtimeRelationQueryRow, 0, end-start)
	for _, row := range rows[start:end] {
		items = append(items, runtimeRelationQueryRow{
			ID:    row.ID,
			Cells: cloneStringMap(row.Cells),
		})
	}
	return items, totalItems, nil
}

func (r *memoryRepository) ResolveRuntimeSourceGUIDColumn(
	_ context.Context,
	_ requestctx.TenantInfo,
	relationName string,
	configured string,
) (string, error) {
	return chooseExistingRelationColumn(r.runtimeRelationColumns[relationName], configured, "guid", relationName+"_guid"), nil
}

func (r *memoryRepository) LoadRuntimeSuggestions(
	_ context.Context,
	_ requestctx.TenantInfo,
	relationName string,
	columnName string,
	whereClause string,
	whereArgs []any,
	limit int,
) ([]runtimeRelationSuggestion, error) {
	r.lastRuntimeSuggestionWhere = whereClause
	r.lastRuntimeSuggestionArgs = append([]any(nil), whereArgs...)
	columns := r.runtimeSuggestions[relationName]
	if columns == nil {
		return nil, nil
	}
	items := columns[columnName]
	if limit > 0 && len(items) > limit {
		items = items[:limit]
	}
	out := make([]runtimeRelationSuggestion, 0, len(items))
	out = append(out, items...)
	return out, nil
}

func (r *memoryRepository) GetRuntimeFavoriteState(
	_ context.Context,
	_ requestctx.TenantInfo,
	principalID string,
	surfaceID string,
) (bool, error) {
	r.lastRuntimeFavoritePrincipal = principalID
	r.lastRuntimeFavoriteSurface = surfaceID
	_, ok := r.runtimeFavorites[surfaceID]
	return ok, nil
}

func (r *memoryRepository) ToggleRuntimeFavorite(
	_ context.Context,
	_ requestctx.TenantInfo,
	principalID string,
	surfaceID string,
	modelID string,
	viewID string,
) (bool, error) {
	r.lastRuntimeFavoritePrincipal = principalID
	r.lastRuntimeFavoriteSurface = surfaceID
	r.lastRuntimeFavoriteModelID = modelID
	r.lastRuntimeFavoriteViewID = viewID
	if _, ok := r.runtimeFavorites[surfaceID]; ok {
		delete(r.runtimeFavorites, surfaceID)
		return false, nil
	}

	modelTitle := modelID
	if record := r.models[modelID]; record != nil && strings.TrimSpace(record.DisplayName) != "" {
		modelTitle = strings.TrimSpace(record.DisplayName)
	}
	viewTitle := viewID
	if modelViews := r.views[modelID]; modelViews != nil {
		if record := modelViews[viewID]; record != nil && strings.TrimSpace(record.DisplayName) != "" {
			viewTitle = strings.TrimSpace(record.DisplayName)
		}
	}

	r.runtimeFavorites[surfaceID] = RuntimeFavoriteRecord{
		ID:         "favorite-1",
		ModelID:    modelID,
		ModelTitle: modelTitle,
		SurfaceID:  surfaceID,
		ViewID:     viewID,
		ViewTitle:  viewTitle,
	}
	return true, nil
}

func (r *memoryRepository) ListRuntimeFavorites(
	_ context.Context,
	_ requestctx.TenantInfo,
	principalID string,
) ([]RuntimeFavoriteRecord, error) {
	r.lastRuntimeFavoritePrincipal = principalID
	items := make([]RuntimeFavoriteRecord, 0, len(r.runtimeFavorites))
	for _, item := range r.runtimeFavorites {
		items = append(items, item)
	}
	sort.Slice(items, func(i, j int) bool {
		return items[i].ID < items[j].ID
	})
	return append([]RuntimeFavoriteRecord(nil), items...), nil
}

func (r *memoryRepository) ListRuntimeSavedFilters(
	_ context.Context,
	_ requestctx.TenantInfo,
	principalID string,
	surfaceID string,
) ([]collectiontable.SavedFilterSet, error) {
	r.lastRuntimeSavedFilterPrincipal = principalID
	r.lastRuntimeSavedFilterSurface = surfaceID
	items := r.runtimeSavedFilters[surfaceID]
	out := make([]collectiontable.SavedFilterSet, 0, len(items))
	out = append(out, items...)
	return out, nil
}

func (r *memoryRepository) CreateRuntimeSavedFilter(
	_ context.Context,
	_ requestctx.TenantInfo,
	principalID string,
	surfaceID string,
	label string,
	quickFilters []collectiontable.QuickFilter,
) (*collectiontable.SavedFilterSet, error) {
	r.lastRuntimeSavedFilterPrincipal = principalID
	r.lastRuntimeSavedFilterSurface = surfaceID
	r.lastRuntimeSavedFilterLabel = label
	r.lastRuntimeSavedFilterQuickFilters = append([]collectiontable.QuickFilter(nil), quickFilters...)
	created := collectiontable.SavedFilterSet{
		ID:           "saved-filter-1",
		Label:        label,
		QuickFilters: append([]collectiontable.QuickFilter(nil), quickFilters...),
	}
	r.runtimeSavedFilters[surfaceID] = append([]collectiontable.SavedFilterSet{created}, r.runtimeSavedFilters[surfaceID]...)
	return &created, nil
}

func (r *memoryRepository) DeleteRuntimeSavedFilter(
	_ context.Context,
	_ requestctx.TenantInfo,
	principalID string,
	surfaceID string,
	savedFilterID string,
) error {
	r.lastRuntimeSavedFilterPrincipal = principalID
	r.lastRuntimeSavedFilterSurface = surfaceID
	r.lastRuntimeDeletedSavedFilterID = savedFilterID
	items := r.runtimeSavedFilters[surfaceID]
	filtered := items[:0]
	for _, item := range items {
		if item.ID == savedFilterID {
			continue
		}
		filtered = append(filtered, item)
	}
	r.runtimeSavedFilters[surfaceID] = append([]collectiontable.SavedFilterSet(nil), filtered...)
	return nil
}

func (r *memoryRepository) ListExistingRuntimeRelations(_ context.Context, _ requestctx.TenantInfo, names []string) (map[string]string, error) {
	relations := make(map[string]string)
	for _, name := range names {
		if kind, ok := r.runtimeRelations[name]; ok {
			relations[name] = kind
		}
	}
	return relations, nil
}

func (r *memoryRepository) CreateModelWithFirstView(_ context.Context, _ requestctx.TenantInfo, model ModelRecord, firstView ViewRecord) (*ModelRecord, *ViewRecord, error) {
	modelClone := cloneModelRecord(&model)
	viewClone := cloneViewRecord(&firstView)
	if r.models == nil {
		r.models = map[string]*ModelRecord{}
	}
	if r.views == nil {
		r.views = map[string]map[string]*ViewRecord{}
	}
	r.models[modelClone.ModelID] = &modelClone
	if r.views[modelClone.ModelID] == nil {
		r.views[modelClone.ModelID] = map[string]*ViewRecord{}
	}
	r.views[modelClone.ModelID][viewClone.ViewID] = &viewClone
	return &modelClone, &viewClone, nil
}

func (r *memoryRepository) CreateView(_ context.Context, _ requestctx.TenantInfo, view ViewRecord) (*ViewRecord, error) {
	viewClone := cloneViewRecord(&view)
	if r.views == nil {
		r.views = map[string]map[string]*ViewRecord{}
	}
	if r.views[viewClone.ModelID] == nil {
		r.views[viewClone.ModelID] = map[string]*ViewRecord{}
	}
	r.views[viewClone.ModelID][viewClone.ViewID] = &viewClone
	return &viewClone, nil
}

func (r *memoryRepository) UpdateModel(_ context.Context, _ requestctx.TenantInfo, model ModelRecord, expectedVersion *int64) (*ModelRecord, error) {
	existing, ok := r.models[model.ModelID]
	if !ok {
		for key, record := range r.models {
			if record.ModelKey == model.ModelID {
				existing = record
				ok = true
				delete(r.models, key)
				break
			}
		}
	}
	if !ok {
		return nil, ErrModelNotFound
	}
	if expectedVersion != nil && existing.Version != *expectedVersion {
		return nil, ErrDraftConflict
	}
	clone := cloneModelRecord(&model)
	r.models[clone.ModelID] = &clone
	return &clone, nil
}

func (r *memoryRepository) UpdateView(_ context.Context, _ requestctx.TenantInfo, view ViewRecord, expectedVersion *int64) (*ViewRecord, error) {
	entries := r.views[view.ModelID]
	if entries == nil {
		return nil, ErrViewNotFound
	}
	existing := entries[view.ViewID]
	if existing == nil {
		return nil, ErrViewNotFound
	}
	if expectedVersion != nil && existing.Version != *expectedVersion {
		return nil, ErrDraftConflict
	}
	clone := cloneViewRecord(&view)
	entries[clone.ViewID] = &clone
	return &clone, nil
}

func (r *memoryRepository) UpdateDraft(_ context.Context, _ requestctx.TenantInfo, model ModelRecord, view ViewRecord, expectedVersions ExpectedVersions) (*ModelRecord, *ViewRecord, error) {
	existingModel, ok := r.models[model.ModelID]
	modelKeyToDelete := ""
	if !ok {
		for key, record := range r.models {
			if record.ModelKey == model.ModelID {
				existingModel = record
				ok = true
				modelKeyToDelete = key
				break
			}
		}
	}
	if !ok {
		return nil, nil, ErrModelNotFound
	}
	entries := r.views[view.ModelID]
	if entries == nil {
		return nil, nil, ErrViewNotFound
	}
	existingView := entries[view.ViewID]
	if existingView == nil {
		return nil, nil, ErrViewNotFound
	}
	if expectedVersions.Model != nil && existingModel.Version != *expectedVersions.Model {
		return nil, nil, ErrDraftConflict
	}
	if expectedVersions.View != nil && existingView.Version != *expectedVersions.View {
		return nil, nil, ErrDraftConflict
	}

	modelClone := cloneModelRecord(&model)
	viewClone := cloneViewRecord(&view)
	if modelKeyToDelete != "" {
		delete(r.models, modelKeyToDelete)
	}
	r.models[modelClone.ModelID] = &modelClone
	entries[viewClone.ViewID] = &viewClone
	return &modelClone, &viewClone, nil
}

func (r *memoryRepository) DeleteView(_ context.Context, _ requestctx.TenantInfo, modelID, viewID string) error {
	entries := r.views[modelID]
	if entries == nil {
		return ErrViewNotFound
	}
	target := entries[viewID]
	if target == nil {
		return ErrViewNotFound
	}
	if len(entries) == 1 {
		return ErrCannotDeleteLastView
	}
	delete(entries, viewID)
	if target.IsDefault {
		var promoted *ViewRecord
		for _, record := range entries {
			if promoted == nil || record.ViewID < promoted.ViewID {
				promoted = record
			}
		}
		promoted.IsDefault = true
		promoted.IsActive = true
	}
	return nil
}

func (r *memoryRepository) DeleteModel(_ context.Context, _ requestctx.TenantInfo, modelID string) error {
	if _, ok := r.models[modelID]; !ok {
		return ErrModelNotFound
	}
	delete(r.models, modelID)
	delete(r.views, modelID)
	return nil
}

func (r *memoryRepository) ApplyRuntime(_ context.Context, _ requestctx.TenantInfo, plan runtimeApplyPlan) (*RuntimeApplySummary, error) {
	r.lastRuntimePlan = &plan
	if r.runtimeApplyErr != nil {
		return nil, r.runtimeApplyErr
	}

	rootScope := RuntimeApplyScopeResult{
		ScopeID:       plan.RootScope.ScopeID,
		Table:         &RuntimeApplyArtifactResult{Name: plan.RootScope.TableName, Action: "create"},
		DataView:      &RuntimeApplyArtifactResult{Name: plan.RootScope.DataViewName, Action: "recreate"},
		GridViews:     []RuntimeApplyArtifactResult{},
		LookupOutputs: []RuntimeApplyLookupOutputResult{},
		Warnings:      []ValidationMessage{},
	}
	if plan.RootScope.MultiValueTableName != "" && len(filterRuntimeMultiValueFields(plan.RootScope.Fields)) > 0 {
		rootScope.MultiValueTable = &RuntimeApplyArtifactResult{Name: plan.RootScope.MultiValueTableName, Action: "create"}
	}
	for _, grid := range plan.RootScope.GridViews {
		rootScope.GridViews = append(rootScope.GridViews, RuntimeApplyArtifactResult{Name: grid.Name, Action: "recreate"})
	}
	for _, field := range plan.RootScope.Fields {
		for _, output := range field.LookupDerivedOutputs {
			rootScope.LookupOutputs = append(rootScope.LookupOutputs, RuntimeApplyLookupOutputResult{
				ColumnName: output.ColumnName,
				Action:     "recreate",
			})
		}
		if field.WarningMessage == "" {
			continue
		}
		rootScope.Warnings = append(rootScope.Warnings, ValidationMessage{
			Code:    "runtime_apply_field_warning",
			Message: field.WarningMessage,
			Target:  plan.RootScope.ScopeID,
		})
	}

	subformScopes := make([]RuntimeApplyScopeResult, 0, len(plan.SubformScopes))
	for _, scope := range plan.SubformScopes {
		scopeResult := RuntimeApplyScopeResult{
			ScopeID:       scope.ScopeID,
			Table:         &RuntimeApplyArtifactResult{Name: scope.TableName, Action: "create"},
			DataView:      &RuntimeApplyArtifactResult{Name: scope.DataViewName, Action: "recreate"},
			GridViews:     []RuntimeApplyArtifactResult{},
			LookupOutputs: []RuntimeApplyLookupOutputResult{},
			Warnings:      []ValidationMessage{},
		}
		if scope.MultiValueTableName != "" && len(filterRuntimeMultiValueFields(scope.Fields)) > 0 {
			scopeResult.MultiValueTable = &RuntimeApplyArtifactResult{Name: scope.MultiValueTableName, Action: "create"}
		}
		for _, grid := range scope.GridViews {
			scopeResult.GridViews = append(scopeResult.GridViews, RuntimeApplyArtifactResult{Name: grid.Name, Action: "recreate"})
		}
		for _, field := range scope.Fields {
			for _, output := range field.LookupDerivedOutputs {
				scopeResult.LookupOutputs = append(scopeResult.LookupOutputs, RuntimeApplyLookupOutputResult{
					ColumnName: output.ColumnName,
					Action:     "recreate",
				})
			}
			if field.WarningMessage == "" {
				continue
			}
			scopeResult.Warnings = append(scopeResult.Warnings, ValidationMessage{
				Code:    "runtime_apply_field_warning",
				Message: field.WarningMessage,
				Target:  scope.ScopeID,
			})
		}
		subformScopes = append(subformScopes, scopeResult)
	}

	return &RuntimeApplySummary{
		Status: "applied",
		StorageResults: &RuntimeApplyStorageResults{
			RootScope:     rootScope,
			SubformScopes: subformScopes,
		},
	}, nil
}

func cloneModelRecord(record *ModelRecord) ModelRecord {
	if record == nil {
		return ModelRecord{}
	}
	clone := *record
	if record.DataCount != nil {
		value := *record.DataCount
		clone.DataCount = &value
	}
	if len(record.DefinitionJSON) > 0 {
		clone.DefinitionJSON = append(json.RawMessage(nil), record.DefinitionJSON...)
	}
	return clone
}

func cloneViewRecord(record *ViewRecord) ViewRecord {
	if record == nil {
		return ViewRecord{}
	}
	clone := *record
	if len(record.DefinitionJSON) > 0 {
		clone.DefinitionJSON = append(json.RawMessage(nil), record.DefinitionJSON...)
	}
	if len(record.PublishedArtifactsJSON) > 0 {
		clone.PublishedArtifactsJSON = append(json.RawMessage(nil), record.PublishedArtifactsJSON...)
	}
	return clone
}

func cloneStringMap(source map[string]string) map[string]string {
	if len(source) == 0 {
		return map[string]string{}
	}
	out := make(map[string]string, len(source))
	for key, value := range source {
		out[key] = value
	}
	return out
}

func testContext() context.Context {
	return contextWithActor(20, "member")
}

func rootTestContext() context.Context {
	return contextWithActor(100, "root")
}

func contextWithActor(level int, role string) context.Context {
	ctx := context.Background()
	ctx = requestctx.WithClaims(ctx, requestctx.ClaimsInfo{
		TenantID: "101",
		UserID:   "11111111-1111-1111-1111-111111111111",
		Email:    "root@example.com",
		Level:    level,
		Role:     role,
	})
	ctx = requestctx.WithTenant(ctx, requestctx.TenantInfo{
		ID:             "101",
		Name:           "Demo Tenant",
		DBName:         "108-demo",
		DBInstanceCode: "default",
	})
	return ctx
}

func TestCreateModelSeedsFirstView(t *testing.T) {
	svc := NewService(newMemoryRepository())

	out, err := svc.CreateModel(testContext(), CreateModelRequest{Title: "Customer Profile"})
	if err != nil {
		t.Fatalf("CreateModel returned error: %v", err)
	}
	if out.ID != "customer-profile" {
		t.Fatalf("model id = %q, want %q", out.ID, "customer-profile")
	}
	if out.SelectedViewID != "view-default" {
		t.Fatalf("selected view id = %q, want %q", out.SelectedViewID, "view-default")
	}
	if len(out.Views) != 1 {
		t.Fatalf("expected one seeded view, got %d", len(out.Views))
	}
	if !out.Views[0].IsDefault || !out.Views[0].IsActive {
		t.Fatalf("seeded view should be active and default: %#v", out.Views[0])
	}
	if out.Views[0].ID != "view-default" {
		t.Fatalf("seeded view id = %q, want %q", out.Views[0].ID, "view-default")
	}
	if out.Views[0].Key != "default" {
		t.Fatalf("seeded view key = %q, want %q", out.Views[0].Key, "default")
	}
	if out.Views[0].ID == out.Views[0].Key {
		t.Fatalf("seeded view id and key must differ, got %#v", out.Views[0])
	}
}

func TestLoadDraftReturnsThreeSchemaSplitForSeededModel(t *testing.T) {
	repo := newMemoryRepository()
	svc := NewService(repo)

	created, err := svc.CreateModel(testContext(), CreateModelRequest{Title: "Customer Profile"})
	if err != nil {
		t.Fatalf("CreateModel returned error: %v", err)
	}

	draft, err := svc.LoadDraft(testContext(), created.ID, created.SelectedViewID)
	if err != nil {
		t.Fatalf("LoadDraft returned error: %v", err)
	}

	modelDraft := mustDecodeJSONMap(t, draft.Draft.Model)
	if _, ok := modelDraft["dataSchema"].(map[string]any); !ok {
		t.Fatalf("draft.model.dataSchema missing: %#v", modelDraft)
	}
	if _, ok := modelDraft["layoutBlueprint"].(map[string]any); !ok {
		t.Fatalf("draft.model.layoutBlueprint missing: %#v", modelDraft)
	}
	screens := asSlice(modelDraft["screens"])
	if len(screens) != 1 {
		t.Fatalf("draft.model.screens = %#v, want one screen", screens)
	}
	screen := asMap(screens[0])
	if normalizeString(screen["id"]) != "view-default" || normalizeString(screen["key"]) != "default" {
		t.Fatalf("draft.model.screens should preserve distinct id/key, got %#v", screen)
	}
	if !getBoolValue(screen, "isDefault", false) {
		t.Fatalf("draft.model.screens should expose default-view metadata, got %#v", screen)
	}

	viewDraft := mustDecodeJSONMap(t, draft.Draft.View)
	if _, ok := viewDraft["uiSchema"].(map[string]any); !ok {
		t.Fatalf("draft.view.uiSchema missing: %#v", viewDraft)
	}
	if _, ok := viewDraft["rootView"].(map[string]any); !ok {
		t.Fatalf("compatibility rootView missing from draft.view: %#v", viewDraft)
	}
}

func TestCreateViewSeedsFreshUISchemaFromBlueprint(t *testing.T) {
	repo := newMemoryRepository()
	model, _ := seedCanonicalModelAndDefaultView(t, repo)
	svc := NewService(repo)

	out, err := svc.CreateView(testContext(), model.ModelID, CreateViewRequest{Title: "Operations"})
	if err != nil {
		t.Fatalf("CreateView returned error: %v", err)
	}

	createdView := repo.views[model.ModelID][out.SelectedViewID]
	if createdView == nil {
		t.Fatalf("expected created view %q to be persisted", out.SelectedViewID)
	}
	if createdView.ViewID != "view-operations" {
		t.Fatalf("created view id = %q, want %q", createdView.ViewID, "view-operations")
	}
	if createdView.ViewKey != "operations" {
		t.Fatalf("created view key = %q, want %q", createdView.ViewKey, "operations")
	}

	viewPayload := mustDecodeJSONMap(t, createdView.DefinitionJSON)
	if _, ok := viewPayload["isActive"]; ok {
		t.Fatalf("created view config should not persist deprecated isActive: %#v", viewPayload)
	}
	uiSchema := asMap(viewPayload["uiSchema"])
	rootScope := asMap(uiSchema["rootScope"])
	rootNodes := asSlice(rootScope["nodes"])

	if !hasNodeWithFieldID(rootNodes, "site-name") {
		t.Fatalf("expected seeded root field node for site-name, got %#v", rootNodes)
	}
	rootSubformNode := findNodeByTypeAndScope(rootNodes, "subform", "pb_info")
	if rootSubformNode == nil {
		t.Fatalf("expected seeded root subform anchor for pb_info, got %#v", rootNodes)
	}

	infoScope := findUISubformScope(uiSchema, "pb_info")
	if infoScope == nil {
		t.Fatalf("expected seeded pb_info scope in uiSchema: %#v", uiSchema)
	}
	if got := normalizeString(infoScope["parentSubformNodeId"]); got != normalizeString(rootSubformNode["id"]) {
		t.Fatalf("parentSubformNodeId = %q, want %q", got, normalizeString(rootSubformNode["id"]))
	}
	if !hasNodeWithFieldID(asSlice(infoScope["nodes"]), "info-date") {
		t.Fatalf("expected seeded subform field node for info-date, got %#v", asSlice(infoScope["nodes"]))
	}
}

func TestCreateViewSeedsFreshUISchemaFromScopeRootPlacement(t *testing.T) {
	repo := newMemoryRepository()
	model, defaultView := seedCanonicalModelAndDefaultView(t, repo)
	modelPayload := mustDecodeJSONMap(t, model.DefinitionJSON)
	layoutBlueprint := asMap(modelPayload["layoutBlueprint"])
	rootBlueprint := asMap(layoutBlueprint["rootScope"])
	rootBlueprint["containers"] = []any{
		map[string]any{"containerKey": "root.subform.pb_info", "order": 0, "parentContainerKey": "", "schemaScopeId": "pb_info", "subformType": "DEFAULT", "tableKey": "pb_info", "title": "Info", "type": "subform"},
	}
	rootBlueprint["fieldPlacements"] = []any{
		map[string]any{"containerKey": scopeRootPlacementKey, "fieldId": "site-name", "order": 0},
	}
	rootBlueprint["unplacedFieldIds"] = []string{}
	modelPayload["layoutBlueprint"] = layoutBlueprint
	modelPayload["modelStructureVersion"] = int64(5)
	modelPayload["version"] = int64(5)
	model.DefinitionJSON = mustJSON(t, modelPayload)
	model.StructureVersion = 5
	model.Version = 5
	repo.models[model.ModelID] = model
	defaultView.LastAlignedModelStructureVersion = 4
	repo.views[model.ModelID][defaultView.ViewID] = defaultView

	svc := NewService(repo)
	out, err := svc.CreateView(testContext(), model.ModelID, CreateViewRequest{Title: "Operations"})
	if err != nil {
		t.Fatalf("CreateView returned error: %v", err)
	}

	createdView := repo.views[model.ModelID][out.SelectedViewID]
	if createdView == nil {
		t.Fatalf("expected created view %q to be persisted", out.SelectedViewID)
	}
	if createdView.ViewID != "view-operations" {
		t.Fatalf("created view id = %q, want %q", createdView.ViewID, "view-operations")
	}
	if createdView.ViewKey != "operations" {
		t.Fatalf("created view key = %q, want %q", createdView.ViewKey, "operations")
	}

	viewPayload := mustDecodeJSONMap(t, createdView.DefinitionJSON)
	uiSchema := asMap(viewPayload["uiSchema"])
	rootScope := asMap(uiSchema["rootScope"])
	rootFieldNode := findFieldNodeByID(asSlice(rootScope["nodes"]), "site-name")
	if rootFieldNode == nil {
		t.Fatalf("expected scope-root site-name field node, got %#v", asSlice(rootScope["nodes"]))
	}
	if rootFieldNode["parentId"] != nil {
		t.Fatalf("expected scope-root site-name parentId to stay nil, got %#v", rootFieldNode["parentId"])
	}
}

func TestCreateViewClonesDefaultViewUISchemaIncludingViewOnlyNodes(t *testing.T) {
	repo := newMemoryRepository()
	model, defaultView := seedCanonicalModelAndDefaultView(t, repo)

	defaultPayload := mustDecodeJSONMap(t, defaultView.DefinitionJSON)
	uiSchema := asMap(defaultPayload["uiSchema"])
	rootScope := asMap(uiSchema["rootScope"])
	rootScope["nodes"] = append([]any{
		map[string]any{
			"helperText": "",
			"id":         "view-only-doc-id",
			"order":      -1,
			"parentId":   nil,
			"required":   false,
			"title":      "Doc.id",
			"type":       "view_only_field",
			"viewOnlyBinding": map[string]any{
				"kind": "root_record_id",
			},
			"visibility": "visible",
		},
	}, asSlice(rootScope["nodes"])...)
	defaultPayload["uiSchema"] = uiSchema
	defaultView.DefinitionJSON = mustJSON(t, defaultPayload)
	repo.views[model.ModelID][defaultView.ViewID] = defaultView

	svc := NewService(repo)
	out, err := svc.CreateView(testContext(), model.ModelID, CreateViewRequest{Title: "Operations"})
	if err != nil {
		t.Fatalf("CreateView returned error: %v", err)
	}

	createdView := repo.views[model.ModelID][out.SelectedViewID]
	if createdView == nil {
		t.Fatalf("expected created view %q to be persisted", out.SelectedViewID)
	}

	viewPayload := mustDecodeJSONMap(t, createdView.DefinitionJSON)
	createdRootNodes := asSlice(asMap(asMap(viewPayload["uiSchema"])["rootScope"])["nodes"])
	foundViewOnlyNode := false
	for _, rawNode := range createdRootNodes {
		node := asMap(rawNode)
		if normalizeString(node["type"]) != "view_only_field" {
			continue
		}
		if normalizeString(asMap(node["viewOnlyBinding"])["kind"]) != "root_record_id" {
			continue
		}
		foundViewOnlyNode = true
		break
	}
	if !foundViewOnlyNode {
		t.Fatalf("expected created view to keep default view-only nodes, got %#v", createdRootNodes)
	}
}

func TestCopyViewClonesSourceUISchemaExactly(t *testing.T) {
	repo := newMemoryRepository()
	model, sourceView := seedCanonicalModelAndDefaultView(t, repo)
	sourcePayload := mustDecodeJSONMap(t, sourceView.DefinitionJSON)
	uiSchema := asMap(sourcePayload["uiSchema"])
	rootScope := asMap(uiSchema["rootScope"])
	rootScope["unplacedFieldIds"] = []string{"site-name"}
	rootNodes := asSlice(rootScope["nodes"])
	if len(rootNodes) > 0 {
		asMap(rootNodes[0])["title"] = "Customized Summary"
	}
	sourcePayload["uiSchema"] = uiSchema
	sourceView.DefinitionJSON = mustJSON(t, sourcePayload)
	repo.views[model.ModelID][sourceView.ViewID] = sourceView
	sourcePayload = mustDecodeJSONMap(t, sourceView.DefinitionJSON)

	svc := NewService(repo)
	out, err := svc.CopyView(testContext(), model.ModelID, sourceView.ViewID, CopyViewRequest{Title: "Copied"})
	if err != nil {
		t.Fatalf("CopyView returned error: %v", err)
	}

	copiedView := repo.views[model.ModelID][out.SelectedViewID]
	if copiedView == nil {
		t.Fatalf("expected copied view %q to be persisted", out.SelectedViewID)
	}
	if copiedView.ViewID != "view-copied" {
		t.Fatalf("copied view id = %q, want %q", copiedView.ViewID, "view-copied")
	}
	if copiedView.ViewKey != "copied" {
		t.Fatalf("copied view key = %q, want %q", copiedView.ViewKey, "copied")
	}
	if copiedView.ViewID == sourceView.ViewID || copiedView.ViewID == copiedView.ViewKey {
		t.Fatalf("copied view should get a fresh id distinct from source and key: source=%q copied=%#v", sourceView.ViewID, copiedView)
	}

	copiedPayload := mustDecodeJSONMap(t, copiedView.DefinitionJSON)
	views, err := repo.ListViews(testContext(), requestctx.TenantInfo{}, model.ModelID)
	if err != nil {
		t.Fatalf("ListViews returned error: %v", err)
	}
	modelPayload, err := buildCanonicalModelPayload(model, views)
	if err != nil {
		t.Fatalf("buildCanonicalModelPayload returned error: %v", err)
	}
	canonicalSourcePayload, err := buildCanonicalViewPayload(model, sourceView, views, modelPayload)
	if err != nil {
		t.Fatalf("buildCanonicalViewPayload returned error: %v", err)
	}
	sourceUISchema := cloneJSONToMap(mustCanonicalJSON(asMap(canonicalSourcePayload["uiSchema"])))
	copiedUISchema := cloneJSONToMap(mustCanonicalJSON(asMap(copiedPayload["uiSchema"])))
	stripUISchemaRuntimeMetadata(sourceUISchema)
	stripUISchemaRuntimeMetadata(copiedUISchema)
	if !reflect.DeepEqual(sourceUISchema, copiedUISchema) {
		t.Fatalf("copied uiSchema does not match source when runtime is ignored:\nsource=%#v\ncopied=%#v", sourceUISchema, copiedUISchema)
	}

	copiedRootRuntime := asMap(asMap(asMap(copiedPayload["uiSchema"])["rootScope"])["runtime"])
	if normalizeString(copiedRootRuntime["viewRtAlias"]) != "copied" {
		t.Fatalf("copied view runtime alias = %#v, want copied", copiedRootRuntime)
	}
}

func TestCopyViewBlocksLockedViewForNonRoot(t *testing.T) {
	repo := newMemoryRepository()
	model, view := seedCanonicalModelAndDefaultView(t, repo)
	view.IsViewLocked = true
	viewPayload := mustDecodeJSONMap(t, view.DefinitionJSON)
	viewPayload["isViewLocked"] = true
	viewPayload["viewLocked"] = true
	view.DefinitionJSON = mustJSON(t, viewPayload)
	repo.views[model.ModelID][view.ViewID] = view
	svc := NewService(repo)

	_, err := svc.CopyView(testContext(), model.ModelID, view.ViewID, CopyViewRequest{Title: "Blocked copy"})
	if !errors.Is(err, ErrViewLocked) {
		t.Fatalf("expected ErrViewLocked when non-root copies locked view, got %v", err)
	}
}

func TestLoadDraftRejectsViewKeyWhenViewIDDiffers(t *testing.T) {
	repo := newMemoryRepository()
	model, view := seedCanonicalModelAndDefaultView(t, repo)
	svc := NewService(repo)

	_, err := svc.LoadDraft(testContext(), model.ModelID, view.ViewKey)
	if !errors.Is(err, ErrViewNotFound) {
		t.Fatalf("expected ErrViewNotFound when loading by view key, got %v", err)
	}
}

func TestGetViewRejectsViewKeyWhenViewIDDiffers(t *testing.T) {
	repo := newMemoryRepository()
	model, view := seedCanonicalModelAndDefaultView(t, repo)
	svc := NewService(repo)

	_, err := svc.GetView(testContext(), model.ModelID, view.ViewKey)
	if !errors.Is(err, ErrViewNotFound) {
		t.Fatalf("expected ErrViewNotFound when opening by view key, got %v", err)
	}
}

func TestLoadDraftBlocksLockedViewForNonRoot(t *testing.T) {
	repo := newMemoryRepository()
	model, view := seedCanonicalModelAndDefaultView(t, repo)
	view.IsViewLocked = true
	viewPayload := mustDecodeJSONMap(t, view.DefinitionJSON)
	viewPayload["isViewLocked"] = true
	viewPayload["viewLocked"] = true
	view.DefinitionJSON = mustJSON(t, viewPayload)
	repo.views[model.ModelID][view.ViewID] = view
	svc := NewService(repo)

	_, err := svc.LoadDraft(testContext(), model.ModelID, view.ViewID)
	if !errors.Is(err, ErrViewLocked) {
		t.Fatalf("expected ErrViewLocked when non-root loads locked view, got %v", err)
	}
}

func TestGetViewBlocksLockedViewForNonRoot(t *testing.T) {
	repo := newMemoryRepository()
	model, view := seedCanonicalModelAndDefaultView(t, repo)
	view.IsViewLocked = true
	viewPayload := mustDecodeJSONMap(t, view.DefinitionJSON)
	viewPayload["isViewLocked"] = true
	viewPayload["viewLocked"] = true
	view.DefinitionJSON = mustJSON(t, viewPayload)
	repo.views[model.ModelID][view.ViewID] = view
	svc := NewService(repo)

	_, err := svc.GetView(testContext(), model.ModelID, view.ViewID)
	if !errors.Is(err, ErrViewLocked) {
		t.Fatalf("expected ErrViewLocked when non-root opens locked view detail, got %v", err)
	}
}

func TestSaveDraftRejectsViewKeyWhenViewIDDiffers(t *testing.T) {
	repo := newMemoryRepository()
	model, view := seedCanonicalModelAndDefaultView(t, repo)
	svc := NewService(repo)

	modelPayload := mustDecodeJSONMap(t, model.DefinitionJSON)
	viewPayload := mustDecodeJSONMap(t, view.DefinitionJSON)
	viewPayload["id"] = view.ViewKey

	_, err := svc.SaveDraft(testContext(), model.ModelID, view.ViewKey, SaveDraftRequest{
		Draft: DraftPayload{
			Model: mustJSON(t, modelPayload),
			View:  mustJSON(t, viewPayload),
		},
		ExpectedVersions: ExpectedVersions{
			Model: int64Ptr(model.Version),
			View:  int64Ptr(view.Version),
		},
	})
	if !errors.Is(err, ErrViewNotFound) {
		t.Fatalf("expected ErrViewNotFound when saving by view key, got %v", err)
	}
}

func TestSaveDraftForNonDefaultViewPreservesCanonicalModelSchemas(t *testing.T) {
	repo := newMemoryRepository()
	model, view := seedCanonicalModelAndDefaultView(t, repo)
	svc := NewService(repo)

	copied, err := svc.CopyView(testContext(), model.ModelID, view.ViewID, CopyViewRequest{Title: "Inspection Copy"})
	if err != nil {
		t.Fatalf("CopyView returned error: %v", err)
	}

	loadOut, err := svc.LoadDraft(testContext(), model.ModelID, copied.SelectedViewID)
	if err != nil {
		t.Fatalf("LoadDraft returned error: %v", err)
	}

	modelDraft := mustDecodeJSONMap(t, loadOut.Draft.Model)
	modelDraft["layoutBlueprint"] = map[string]any{
		"rootScope": map[string]any{
			"containers":       []any{},
			"fieldPlacements":  []any{},
			"schemaScopeId":    "root",
			"unplacedFieldIds": []any{},
		},
		"subformScopes": []any{
			map[string]any{
				"containers":       []any{},
				"fieldPlacements":  []any{},
				"schemaScopeId":    "pb_info",
				"unplacedFieldIds": []any{},
			},
		},
	}

	viewDraft := mustDecodeJSONMap(t, loadOut.Draft.View)
	uiSchema := asMap(viewDraft["uiSchema"])
	rootScope := asMap(uiSchema["rootScope"])
	rootNodes := asSlice(rootScope["nodes"])
	asMap(rootNodes[0])["visibility"] = "hidden"
	viewDraft["uiSchema"] = uiSchema

	saveOut, err := svc.SaveDraft(testContext(), model.ModelID, copied.SelectedViewID, SaveDraftRequest{
		Draft: DraftPayload{
			Model: mustJSON(t, modelDraft),
			View:  mustJSON(t, viewDraft),
		},
		ExpectedVersions: ExpectedVersions{
			Model: int64Ptr(model.Version),
			View:  int64Ptr(1),
		},
	})
	if err != nil {
		t.Fatalf("SaveDraft returned error: %v", err)
	}

	savedModel := mustDecodeJSONMap(t, saveOut.Draft.Model)
	layoutBlueprint := asMap(savedModel["layoutBlueprint"])
	rootBlueprint := asMap(layoutBlueprint["rootScope"])
	if !hasContainerWithType(asSlice(rootBlueprint["containers"]), "section") {
		t.Fatalf("non-default save must preserve canonical section container, got %#v", rootBlueprint["containers"])
	}
	if len(asSlice(rootBlueprint["fieldPlacements"])) == 0 {
		t.Fatalf("non-default save must preserve root field placement, got %#v", rootBlueprint["fieldPlacements"])
	}
	if containsString(normalizeStringList(rootBlueprint["unplacedFieldIds"]), "site-name") {
		t.Fatalf("non-default save must not dump root fields into unplaced, got %#v", rootBlueprint["unplacedFieldIds"])
	}

	savedView := mustDecodeJSONMap(t, saveOut.Draft.View)
	savedUISchema := asMap(savedView["uiSchema"])
	savedRootScope := asMap(savedUISchema["rootScope"])
	savedRootNodes := asSlice(savedRootScope["nodes"])
	if normalizeString(asMap(savedRootNodes[0])["visibility"]) != "hidden" {
		t.Fatalf("expected non-default view override to persist, got %#v", asMap(savedRootNodes[0]))
	}
}

func TestSaveDraftForDefaultViewRenamesCanonicalLabelWithoutStructureDrift(t *testing.T) {
	repo := newMemoryRepository()
	model, defaultView := seedCanonicalModelAndDefaultView(t, repo)
	svc := NewService(repo)

	inheritedView := cloneViewRecord(defaultView)
	inheritedView.ViewID = "view-inherited"
	inheritedView.ViewKey = "inherited"
	inheritedView.DisplayName = "Inherited"
	inheritedView.IsDefault = false
	inheritedView.Version = 1
	inheritedView.LastAlignedModelStructureVersion = model.StructureVersion
	inheritedPayload := mustDecodeJSONMap(t, inheritedView.DefinitionJSON)
	inheritedPayload["id"] = inheritedView.ViewID
	inheritedPayload["key"] = inheritedView.ViewKey
	inheritedPayload["displayName"] = inheritedView.DisplayName
	inheritedPayload["title"] = inheritedView.DisplayName
	inheritedPayload["name"] = inheritedView.DisplayName
	inheritedPayload["isDefault"] = false
	setRootFieldNodeTitle(inheritedPayload, "site-name", "Site Name")
	inheritedView.DefinitionJSON = mustCanonicalJSON(inheritedPayload)
	repo.views[model.ModelID][inheritedView.ViewID] = &inheritedView

	overrideView := cloneViewRecord(defaultView)
	overrideView.ViewID = "view-override"
	overrideView.ViewKey = "override"
	overrideView.DisplayName = "Override"
	overrideView.IsDefault = false
	overrideView.Version = 1
	overrideView.LastAlignedModelStructureVersion = model.StructureVersion
	overridePayload := mustDecodeJSONMap(t, overrideView.DefinitionJSON)
	overridePayload["id"] = overrideView.ViewID
	overridePayload["key"] = overrideView.ViewKey
	overridePayload["displayName"] = overrideView.DisplayName
	overridePayload["title"] = overrideView.DisplayName
	overridePayload["name"] = overrideView.DisplayName
	overridePayload["isDefault"] = false
	setRootFieldNodeTitle(overridePayload, "site-name", "Local Site")
	overrideView.DefinitionJSON = mustCanonicalJSON(overridePayload)
	repo.views[model.ModelID][overrideView.ViewID] = &overrideView

	modelPayload := mustDecodeJSONMap(t, model.DefinitionJSON)
	rootFields := asSlice(asMap(asMap(modelPayload["dataSchema"])["rootScope"])["fields"])
	for _, rawField := range rootFields {
		field := asMap(rawField)
		if normalizeString(field["id"]) != "site-name" {
			continue
		}
		field["label"] = "Location Name"
		field["displayName"] = "Location Name"
	}

	defaultPayload := mustDecodeJSONMap(t, defaultView.DefinitionJSON)
	setRootFieldNodeTitle(defaultPayload, "site-name", "Location Name")

	out, err := svc.SaveDraft(testContext(), model.ModelID, defaultView.ViewID, SaveDraftRequest{
		Draft: DraftPayload{
			Model: mustJSON(t, modelPayload),
			View:  mustJSON(t, defaultPayload),
		},
		ExpectedVersions: ExpectedVersions{
			Model: int64Ptr(model.Version),
			View:  int64Ptr(defaultView.Version),
		},
	})
	if err != nil {
		t.Fatalf("SaveDraft returned error: %v", err)
	}

	if repo.models[model.ModelID].StructureVersion != model.StructureVersion {
		t.Fatalf("structure version = %d, want %d", repo.models[model.ModelID].StructureVersion, model.StructureVersion)
	}
	savedModel := mustDecodeJSONMap(t, out.Draft.Model)
	if got := getInt64Value(savedModel, "modelStructureVersion", 0); got != model.StructureVersion {
		t.Fatalf("draft model structure version = %d, want %d", got, model.StructureVersion)
	}
	if repo.views[model.ModelID][inheritedView.ViewID].LastAlignedModelStructureVersion != model.StructureVersion {
		t.Fatalf("inherited view aligned version = %d, want %d", repo.views[model.ModelID][inheritedView.ViewID].LastAlignedModelStructureVersion, model.StructureVersion)
	}
	if repo.views[model.ModelID][overrideView.ViewID].LastAlignedModelStructureVersion != model.StructureVersion {
		t.Fatalf("override view aligned version = %d, want %d", repo.views[model.ModelID][overrideView.ViewID].LastAlignedModelStructureVersion, model.StructureVersion)
	}

	if repo.views[model.ModelID][inheritedView.ViewID].Version != 2 {
		t.Fatalf("expected inherited view version bump, got %d", repo.views[model.ModelID][inheritedView.ViewID].Version)
	}
	if repo.views[model.ModelID][overrideView.ViewID].Version != 1 {
		t.Fatalf("expected override view version unchanged, got %d", repo.views[model.ModelID][overrideView.ViewID].Version)
	}

	inheritedSaved := mustDecodeJSONMap(t, repo.views[model.ModelID][inheritedView.ViewID].DefinitionJSON)
	if title := rootFieldNodeTitle(inheritedSaved, "site-name"); title != "Location Name" {
		t.Fatalf("expected inherited title to follow canonical rename, got %q", title)
	}
	overrideSaved := mustDecodeJSONMap(t, repo.views[model.ModelID][overrideView.ViewID].DefinitionJSON)
	if title := rootFieldNodeTitle(overrideSaved, "site-name"); title != "Local Site" {
		t.Fatalf("expected local override title to remain unchanged, got %q", title)
	}
}

func TestSaveDraftStoresSparseSchemasButReturnsCompatibilityFields(t *testing.T) {
	repo := newMemoryRepository()
	model, view := seedCanonicalModelAndDefaultView(t, repo)
	svc := NewService(repo)

	modelPayload := mustDecodeJSONMap(t, model.DefinitionJSON)
	viewPayload := mustDecodeJSONMap(t, view.DefinitionJSON)

	out, err := svc.SaveDraft(testContext(), model.ModelID, view.ViewID, SaveDraftRequest{
		Draft: DraftPayload{
			Model: mustJSON(t, modelPayload),
			View:  mustJSON(t, viewPayload),
		},
		ExpectedVersions: ExpectedVersions{
			Model: int64Ptr(model.Version),
			View:  int64Ptr(view.Version),
		},
	})
	if err != nil {
		t.Fatalf("SaveDraft returned error: %v", err)
	}

	storedModel := mustDecodeJSONMap(t, repo.models[model.ModelID].DefinitionJSON)
	storedRootFields := asSlice(asMap(asMap(storedModel["dataSchema"])["rootScope"])["fields"])
	if len(storedRootFields) == 0 {
		t.Fatalf("expected stored root fields, got %#v", storedModel["dataSchema"])
	}
	storedField := asMap(storedRootFields[0])
	for _, key := range []string{"displayName", "fieldId", "isPersisted", "key", "schemaScopeId", "schemaScopeKey"} {
		if _, ok := storedField[key]; ok {
			t.Fatalf("expected sparse stored field without %q, got %#v", key, storedField)
		}
	}

	storedView := mustDecodeJSONMap(t, repo.views[model.ModelID][view.ViewID].DefinitionJSON)
	if _, ok := storedView["isActive"]; ok {
		t.Fatalf("stored view config should strip deprecated isActive: %#v", storedView)
	}
	storedRootScope := asMap(asMap(storedView["uiSchema"])["rootScope"])
	for _, key := range []string{"filterDefinitions", "systemFields", "viewSettings", "unplacedFieldIds"} {
		if _, ok := storedRootScope[key]; ok {
			t.Fatalf("expected sparse stored root ui scope without %q, got %#v", key, storedRootScope)
		}
	}
	storedNodes := asSlice(storedRootScope["nodes"])
	if len(storedNodes) == 0 {
		t.Fatalf("expected stored ui nodes, got %#v", storedRootScope)
	}
	storedNode := asMap(storedNodes[0])
	for _, key := range []string{"helperText", "parentId", "required", "rules", "visibility"} {
		if _, ok := storedNode[key]; ok {
			t.Fatalf("expected sparse stored ui node without %q, got %#v", key, storedNode)
		}
	}

	draftModel := mustDecodeJSONMap(t, out.Draft.Model)
	draftView := mustDecodeJSONMap(t, out.Draft.View)
	if _, ok := draftView["isActive"]; ok {
		t.Fatalf("draft view config should not expose deprecated isActive: %#v", draftView)
	}
	compatFields := asSlice(draftModel["fields"])
	if len(compatFields) == 0 {
		t.Fatalf("expected compatibility fields in draft model, got %#v", draftModel)
	}
	compatField := asMap(compatFields[0])
	if compatField["displayName"] != "Site Name" || compatField["fieldId"] != "site-name" || compatField["schemaScopeId"] != "root" {
		t.Fatalf("expected compatibility field metadata in draft response, got %#v", compatField)
	}
}

func TestDeleteViewRejectsViewKeyWhenViewIDDiffers(t *testing.T) {
	repo := newMemoryRepository()
	model, view := seedCanonicalModelAndDefaultView(t, repo)
	repo.views[model.ModelID]["inspection-summary"] = &ViewRecord{
		ModelID:                          model.ModelID,
		ViewID:                           "inspection-summary",
		ViewKey:                          "inspection-summary",
		DisplayName:                      "Inspection Summary",
		ViewType:                         "detail",
		IsActive:                         false,
		IsDefault:                        false,
		Version:                          2,
		LastAlignedModelStructureVersion: model.StructureVersion,
		DefinitionJSON: mustJSON(t, map[string]any{
			"id":                               "inspection-summary",
			"isActive":                         false,
			"isDefault":                        false,
			"key":                              "inspection-summary",
			"kind":                             "detail",
			"lastAlignedModelStructureVersion": model.StructureVersion,
			"modelId":                          model.ModelID,
			"title":                            "Inspection Summary",
			"viewVersion":                      2,
		}),
		PublishedArtifactsJSON: mustJSON(t, map[string]any{}),
	}
	svc := NewService(repo)

	_, err := svc.DeleteView(testContext(), model.ModelID, view.ViewKey)
	if !errors.Is(err, ErrViewNotFound) {
		t.Fatalf("expected ErrViewNotFound when deleting by view key, got %v", err)
	}
	if repo.views[model.ModelID][view.ViewID] == nil {
		t.Fatalf("delete by view key should not remove the canonical default view")
	}
	if len(repo.views[model.ModelID]) != 2 {
		t.Fatalf("delete by view key should leave both views intact, got %#v", repo.views[model.ModelID])
	}
}

func TestDeleteViewBlocksLockedViewForNonRoot(t *testing.T) {
	repo := newMemoryRepository()
	model, view := seedCanonicalModelAndDefaultView(t, repo)
	view.IsViewLocked = true
	viewPayload := mustDecodeJSONMap(t, view.DefinitionJSON)
	viewPayload["isViewLocked"] = true
	viewPayload["viewLocked"] = true
	view.DefinitionJSON = mustJSON(t, viewPayload)
	repo.views[model.ModelID][view.ViewID] = view
	svc := NewService(repo)

	_, err := svc.DeleteView(testContext(), model.ModelID, view.ViewID)
	if !errors.Is(err, ErrViewLocked) {
		t.Fatalf("expected ErrViewLocked when non-root deletes locked view, got %v", err)
	}
}

func TestLoadDraftDerivesThreeSchemaFromLegacyDraft(t *testing.T) {
	repo := newMemoryRepository()
	model := &ModelRecord{
		ModelID:          "site-audit",
		ModelKey:         "site-audit",
		StorageKey:       "site_audit",
		DisplayName:      "Site Audit",
		SourceType:       "managed",
		Status:           "draft",
		Version:          3,
		PublishedVersion: 1,
		StructureVersion: 2,
		DefinitionJSON: mustJSON(t, map[string]any{
			"description": "Legacy model",
			"displayName": "Site Audit",
			"fields": []any{
				map[string]any{"displayName": "Site Name", "id": "site-name", "key": "site-name", "label": "Site Name", "schemaScopeKey": "root"},
				map[string]any{"displayName": "Info Date", "id": "info-date", "key": "info-date", "label": "Info Date", "schemaScopeKey": "pb_info"},
			},
			"id":   "site-audit",
			"key":  "site-audit",
			"name": "Site Audit",
			"schemaScopes": []any{
				map[string]any{"displayName": "Info", "key": "pb_info", "scopeType": "SUBFORM", "subformType": "DEFAULT"},
			},
			"sourceType": "managed",
			"storageKey": "site_audit",
			"title":      "Site Audit",
		}),
	}
	view := &ViewRecord{
		ModelID:                          "site-audit",
		ViewID:                           "view-default",
		ViewKey:                          "default",
		DisplayName:                      "Default",
		ViewType:                         "form",
		IsActive:                         true,
		IsDefault:                        true,
		Status:                           "draft",
		Version:                          2,
		PublishedVersion:                 1,
		LastAlignedModelStructureVersion: 2,
		DefinitionJSON: mustJSON(t, map[string]any{
			"description":       "Legacy default view",
			"displayName":       "Default",
			"filterDefinitions": map[string]any{},
			"id":                "default",
			"isActive":          true,
			"isDefault":         true,
			"isViewLocked":      false,
			"kind":              "form",
			"modelId":           "site-audit",
			"rootScope": map[string]any{
				"dataSchema": map[string]any{"fieldIds": []string{"site-name"}},
				"scopeId":    "root",
				"scopeType":  "ROOT",
				"uiSchema": map[string]any{
					"currentParentId": nil,
					"nodes": []any{
						map[string]any{"id": "section-1", "order": 0, "parentId": nil, "title": "Summary", "type": "section", "visibility": "visible"},
						map[string]any{"fieldId": "site-name", "id": "field-site-name", "order": 0, "parentId": "section-1", "type": "field", "visibility": "visible"},
						map[string]any{"id": "subform-1", "order": 1, "parentId": nil, "subformType": "DEFAULT", "title": "Info", "type": "subform", "visibility": "visible"},
					},
					"selectedNodeId": nil,
				},
			},
			"subformScopes": []any{
				map[string]any{
					"dataSchema":          map[string]any{"fieldIds": []string{"info-date"}},
					"filterDefinitions":   map[string]any{},
					"parentSubformNodeId": "subform-1",
					"scopeId":             "subform-1",
					"scopeType":           "SUBFORM",
					"subformType":         "DEFAULT",
					"tableKey":            "pb_info",
					"uiSchema": map[string]any{
						"currentParentId": nil,
						"nodes": []any{
							map[string]any{"id": "info-section-1", "order": 0, "parentId": nil, "title": "Details", "type": "section", "visibility": "visible"},
							map[string]any{"fieldId": "info-date", "id": "field-info-date", "order": 0, "parentId": "info-section-1", "type": "field", "visibility": "visible"},
						},
						"selectedNodeId": nil,
					},
					"viewSettings": map[string]any{},
				},
			},
			"systemFields":    map[string]any{},
			"title":           "Default",
			"viewDescription": "Legacy default view",
			"viewKind":        "form",
			"viewSettings":    map[string]any{},
			"viewTitle":       "Default",
			"viewVersion":     2,
		}),
		PublishedArtifactsJSON: mustJSON(t, map[string]any{}),
	}
	repo.models[model.ModelID] = model
	repo.views[model.ModelID] = map[string]*ViewRecord{view.ViewID: view}
	svc := NewService(repo)

	draft, err := svc.LoadDraft(testContext(), model.ModelID, view.ViewID)
	if err != nil {
		t.Fatalf("LoadDraft returned error: %v", err)
	}

	modelDraft := mustDecodeJSONMap(t, draft.Draft.Model)
	layoutBlueprint := asMap(modelDraft["layoutBlueprint"])
	rootBlueprint := asMap(layoutBlueprint["rootScope"])
	if !hasContainerWithType(asSlice(rootBlueprint["containers"]), "section") {
		t.Fatalf("expected derived section container in root blueprint, got %#v", rootBlueprint)
	}
	if !hasSubformBlueprintContainer(asSlice(rootBlueprint["containers"]), "pb_info") {
		t.Fatalf("expected derived subform anchor in root blueprint, got %#v", rootBlueprint)
	}

	viewDraft := mustDecodeJSONMap(t, draft.Draft.View)
	uiSchema := asMap(viewDraft["uiSchema"])
	rootUIScope := asMap(uiSchema["rootScope"])
	if !hasContainerKeyOnType(asSlice(rootUIScope["nodes"]), "section") {
		t.Fatalf("expected containerKey to be attached to legacy section node, got %#v", rootUIScope)
	}
}

func TestLoadDraftDerivesScopeRootPlacementFromLegacyRootField(t *testing.T) {
	repo := newMemoryRepository()
	model := &ModelRecord{
		ModelID:          "site-audit",
		ModelKey:         "site-audit",
		StorageKey:       "site_audit",
		DisplayName:      "Site Audit",
		SourceType:       "managed",
		Status:           "draft",
		Version:          3,
		PublishedVersion: 1,
		StructureVersion: 2,
		DefinitionJSON: mustJSON(t, map[string]any{
			"description": "Legacy model",
			"displayName": "Site Audit",
			"fields": []any{
				map[string]any{"displayName": "Site Name", "id": "site-name", "key": "site-name", "label": "Site Name", "schemaScopeKey": "root"},
			},
			"id":         "site-audit",
			"key":        "site-audit",
			"name":       "Site Audit",
			"sourceType": "managed",
			"storageKey": "site_audit",
			"title":      "Site Audit",
		}),
	}
	view := &ViewRecord{
		ModelID:                          "site-audit",
		ViewID:                           "view-default",
		ViewKey:                          "default",
		DisplayName:                      "Default",
		ViewType:                         "form",
		IsActive:                         true,
		IsDefault:                        true,
		Status:                           "draft",
		Version:                          2,
		PublishedVersion:                 1,
		LastAlignedModelStructureVersion: 2,
		DefinitionJSON: mustJSON(t, map[string]any{
			"description":       "Legacy default view",
			"displayName":       "Default",
			"filterDefinitions": map[string]any{},
			"id":                "default",
			"isActive":          true,
			"isDefault":         true,
			"isViewLocked":      false,
			"kind":              "form",
			"modelId":           "site-audit",
			"rootScope": map[string]any{
				"dataSchema": map[string]any{"fieldIds": []string{"site-name"}},
				"scopeId":    "root",
				"scopeType":  "ROOT",
				"uiSchema": map[string]any{
					"currentParentId": nil,
					"nodes": []any{
						map[string]any{"fieldId": "site-name", "id": "field-site-name", "order": 0, "parentId": nil, "type": "field", "visibility": "visible"},
					},
					"selectedNodeId": nil,
				},
			},
			"systemFields":    map[string]any{},
			"title":           "Default",
			"viewDescription": "Legacy default view",
			"viewKind":        "form",
			"viewSettings":    map[string]any{},
			"viewTitle":       "Default",
			"viewVersion":     2,
		}),
		PublishedArtifactsJSON: mustJSON(t, map[string]any{}),
	}
	repo.models[model.ModelID] = model
	repo.views[model.ModelID] = map[string]*ViewRecord{view.ViewID: view}
	svc := NewService(repo)

	draft, err := svc.LoadDraft(testContext(), model.ModelID, view.ViewID)
	if err != nil {
		t.Fatalf("LoadDraft returned error: %v", err)
	}

	modelDraft := mustDecodeJSONMap(t, draft.Draft.Model)
	layoutBlueprint := asMap(modelDraft["layoutBlueprint"])
	rootBlueprint := asMap(layoutBlueprint["rootScope"])
	if !hasFieldPlacementWithContainerKey(asSlice(rootBlueprint["fieldPlacements"]), "site-name", scopeRootPlacementKey) {
		t.Fatalf("expected scope-root placement for site-name, got %#v", asSlice(rootBlueprint["fieldPlacements"]))
	}
	if containsString(normalizeStringList(rootBlueprint["unplacedFieldIds"]), "site-name") {
		t.Fatalf("site-name should not be marked unplaced when authored at scope root: %#v", rootBlueprint["unplacedFieldIds"])
	}

	viewDraft := mustDecodeJSONMap(t, draft.Draft.View)
	uiSchema := asMap(viewDraft["uiSchema"])
	rootScope := asMap(uiSchema["rootScope"])
	rootFieldNode := findFieldNodeByID(asSlice(rootScope["nodes"]), "site-name")
	if rootFieldNode == nil {
		t.Fatalf("expected scope-root site-name field node, got %#v", asSlice(rootScope["nodes"]))
	}
	if rootFieldNode["parentId"] != nil {
		t.Fatalf("expected legacy scope-root site-name parentId to stay nil, got %#v", rootFieldNode["parentId"])
	}
}

func TestSaveDraftRejectsInvalidBlueprintHierarchy(t *testing.T) {
	repo := newMemoryRepository()
	model, view := seedCanonicalModelAndDefaultView(t, repo)
	svc := NewService(repo)

	modelPayload := mustDecodeJSONMap(t, model.DefinitionJSON)
	layoutBlueprint := asMap(modelPayload["layoutBlueprint"])
	rootBlueprint := asMap(layoutBlueprint["rootScope"])
	rootBlueprint["containers"] = []any{
		map[string]any{"containerKey": "root.section.summary", "order": 0, "parentContainerKey": "", "title": "Summary", "type": "section"},
		map[string]any{"containerKey": "root.tab_item.invalid", "order": 1, "parentContainerKey": "root.section.summary", "title": "Invalid", "type": "tab_item"},
	}
	rootBlueprint["fieldPlacements"] = []any{}
	rootBlueprint["unplacedFieldIds"] = []string{"site-name"}
	modelPayload["layoutBlueprint"] = layoutBlueprint

	viewPayload := mustDecodeJSONMap(t, view.DefinitionJSON)

	_, err := svc.SaveDraft(testContext(), model.ModelID, view.ViewID, SaveDraftRequest{
		Draft: DraftPayload{
			Model: mustJSON(t, modelPayload),
			View:  mustJSON(t, viewPayload),
		},
		ExpectedVersions: ExpectedVersions{
			Model: int64Ptr(model.Version),
			View:  int64Ptr(view.Version),
		},
	})
	if !errors.Is(err, ErrInvalidDraft) {
		t.Fatalf("expected ErrInvalidDraft, got %v", err)
	}
}

func TestSaveDraftDoesNotUpdateModelWhenViewVersionConflicts(t *testing.T) {
	repo := newMemoryRepository()
	model, view := seedCanonicalModelAndDefaultView(t, repo)
	svc := NewService(repo)
	originalModelVersion := model.Version
	originalViewVersion := view.Version
	originalModelDisplayName := model.DisplayName
	originalModelDefinitionJSON := append([]byte(nil), model.DefinitionJSON...)

	modelPayload := mustDecodeJSONMap(t, model.DefinitionJSON)
	modelPayload["title"] = "Changed Inspection"
	modelPayload["displayName"] = "Changed Inspection"
	viewPayload := mustDecodeJSONMap(t, view.DefinitionJSON)
	repo.views[model.ModelID][view.ViewID].Version = originalViewVersion + 1

	_, err := svc.SaveDraft(testContext(), model.ModelID, view.ViewID, SaveDraftRequest{
		Draft: DraftPayload{
			Model: mustJSON(t, modelPayload),
			View:  mustJSON(t, viewPayload),
		},
		ExpectedVersions: ExpectedVersions{
			Model: int64Ptr(originalModelVersion),
			View:  int64Ptr(originalViewVersion),
		},
	})
	if !errors.Is(err, ErrDraftConflict) {
		t.Fatalf("expected ErrDraftConflict, got %v", err)
	}

	persistedModel := repo.models[model.ModelID]
	if persistedModel == nil {
		t.Fatalf("expected original model to remain")
	}
	if persistedModel.DisplayName != originalModelDisplayName {
		t.Fatalf("model display name = %q, want %q", persistedModel.DisplayName, originalModelDisplayName)
	}
	if persistedModel.Version != originalModelVersion {
		t.Fatalf("model version = %d, want %d", persistedModel.Version, originalModelVersion)
	}
	if string(persistedModel.DefinitionJSON) != string(originalModelDefinitionJSON) {
		t.Fatalf("model definition changed despite view conflict")
	}
}

func TestSaveDraftAcceptsExplicitScopeRootPlacements(t *testing.T) {
	repo := newMemoryRepository()
	model, view := seedCanonicalModelAndDefaultView(t, repo)
	svc := NewService(repo)

	modelPayload := mustDecodeJSONMap(t, model.DefinitionJSON)
	layoutBlueprint := asMap(modelPayload["layoutBlueprint"])
	rootBlueprint := asMap(layoutBlueprint["rootScope"])
	rootBlueprint["containers"] = []any{
		map[string]any{"containerKey": "root.subform.pb_info", "order": 0, "parentContainerKey": "", "schemaScopeId": "pb_info", "subformType": "DEFAULT", "tableKey": "pb_info", "title": "Info", "type": "subform"},
	}
	rootBlueprint["fieldPlacements"] = []any{
		map[string]any{"containerKey": scopeRootPlacementKey, "fieldId": "site-name", "order": 0},
	}
	rootBlueprint["unplacedFieldIds"] = []string{}
	subformScopes := asSlice(layoutBlueprint["subformScopes"])
	if len(subformScopes) == 0 {
		t.Fatalf("expected canonical subform scope in layout blueprint")
	}
	infoBlueprint := asMap(subformScopes[0])
	infoBlueprint["containers"] = []any{}
	infoBlueprint["fieldPlacements"] = []any{
		map[string]any{"containerKey": scopeRootPlacementKey, "fieldId": "info-date", "order": 0},
	}
	infoBlueprint["unplacedFieldIds"] = []string{}
	modelPayload["layoutBlueprint"] = layoutBlueprint

	viewPayload := mustDecodeJSONMap(t, view.DefinitionJSON)
	uiSchema := asMap(viewPayload["uiSchema"])
	rootScope := asMap(uiSchema["rootScope"])
	rootScope["nodes"] = []any{
		map[string]any{"containerKey": "root.subform.pb_info", "id": "root-subform-pb_info", "order": 0, "parentId": nil, "schemaScopeId": "pb_info", "subformType": "DEFAULT", "tableKey": "pb_info", "title": "Info", "type": "subform", "visibility": "visible"},
		map[string]any{"fieldId": "site-name", "id": "field-site-name", "order": 1, "parentId": nil, "type": "field", "visibility": "visible"},
	}
	infoScope := findUISubformScope(uiSchema, "pb_info")
	if infoScope == nil {
		t.Fatalf("expected canonical ui subform scope")
	}
	infoScope["nodes"] = []any{
		map[string]any{"fieldId": "info-date", "id": "field-info-date", "order": 0, "parentId": nil, "type": "field", "visibility": "visible"},
	}
	infoScope["unplacedFieldIds"] = []string{}
	viewPayload["uiSchema"] = uiSchema

	out, err := svc.SaveDraft(testContext(), model.ModelID, view.ViewID, SaveDraftRequest{
		Draft: DraftPayload{
			Model: mustJSON(t, modelPayload),
			View:  mustJSON(t, viewPayload),
		},
		ExpectedVersions: ExpectedVersions{
			Model: int64Ptr(model.Version),
			View:  int64Ptr(view.Version),
		},
	})
	if err != nil {
		t.Fatalf("SaveDraft returned error: %v", err)
	}

	savedModel := mustDecodeJSONMap(t, out.Draft.Model)
	savedLayoutBlueprint := asMap(savedModel["layoutBlueprint"])
	savedRootBlueprint := asMap(savedLayoutBlueprint["rootScope"])
	if !hasFieldPlacementWithContainerKey(asSlice(savedRootBlueprint["fieldPlacements"]), "site-name", scopeRootPlacementKey) {
		t.Fatalf("expected saved scope-root placement for site-name, got %#v", asSlice(savedRootBlueprint["fieldPlacements"]))
	}

	savedView := mustDecodeJSONMap(t, out.Draft.View)
	savedUISchema := asMap(savedView["uiSchema"])
	savedRootScope := asMap(savedUISchema["rootScope"])
	savedRootField := findFieldNodeByID(asSlice(savedRootScope["nodes"]), "site-name")
	if savedRootField == nil || savedRootField["parentId"] != nil {
		t.Fatalf("expected saved scope-root field node for site-name, got %#v", asSlice(savedRootScope["nodes"]))
	}
	savedInfoScope := findUISubformScope(savedUISchema, "pb_info")
	if savedInfoScope == nil {
		t.Fatalf("expected saved ui subform scope")
	}
	savedInfoField := findFieldNodeByID(asSlice(savedInfoScope["nodes"]), "info-date")
	if savedInfoField == nil || savedInfoField["parentId"] != nil {
		t.Fatalf("expected saved scope-root field node for info-date, got %#v", asSlice(savedInfoScope["nodes"]))
	}
}

func TestSaveDraftNormalizesDuplicateFieldStorageKeysPerScope(t *testing.T) {
	repo := newMemoryRepository()
	model, view := seedCanonicalModelAndDefaultView(t, repo)
	svc := NewService(repo)

	modelPayload := mustDecodeJSONMap(t, model.DefinitionJSON)
	dataSchema := asMap(modelPayload["dataSchema"])
	rootScope := asMap(dataSchema["rootScope"])
	rootScope["fields"] = append(asSlice(rootScope["fields"]), map[string]any{
		"displayName":   "Site Name Copy",
		"id":            "site-name-copy",
		"key":           "site-name-copy",
		"label":         "Site Name Copy",
		"schemaScopeId": "root",
		"storageKey":    "site_name",
	})
	subformScopes := asSlice(dataSchema["subformScopes"])
	if len(subformScopes) == 0 {
		t.Fatalf("expected canonical subform scope in data schema")
	}
	infoScope := asMap(subformScopes[0])
	infoFields := asSlice(infoScope["fields"])
	if len(infoFields) == 0 {
		t.Fatalf("expected canonical subform field in data schema")
	}
	infoField := asMap(infoFields[0])
	infoField["storageKey"] = "site_name"
	modelPayload["dataSchema"] = dataSchema

	layoutBlueprint := asMap(modelPayload["layoutBlueprint"])
	rootBlueprint := asMap(layoutBlueprint["rootScope"])
	rootBlueprint["fieldPlacements"] = append(asSlice(rootBlueprint["fieldPlacements"]), map[string]any{
		"containerKey": scopeRootPlacementKey,
		"fieldId":      "site-name-copy",
		"order":        1,
	})
	modelPayload["layoutBlueprint"] = layoutBlueprint

	viewPayload := mustDecodeJSONMap(t, view.DefinitionJSON)
	uiSchema := asMap(viewPayload["uiSchema"])
	rootUIScope := asMap(uiSchema["rootScope"])
	rootUIScope["nodes"] = append(asSlice(rootUIScope["nodes"]), map[string]any{
		"fieldId":    "site-name-copy",
		"id":         "field-site-name-copy",
		"order":      2,
		"parentId":   nil,
		"title":      "Site Name Copy",
		"type":       "field",
		"visibility": "visible",
	})
	viewPayload["uiSchema"] = uiSchema

	out, err := svc.SaveDraft(testContext(), model.ModelID, view.ViewID, SaveDraftRequest{
		Draft: DraftPayload{
			Model: mustJSON(t, modelPayload),
			View:  mustJSON(t, viewPayload),
		},
		ExpectedVersions: ExpectedVersions{
			Model: int64Ptr(model.Version),
			View:  int64Ptr(view.Version),
		},
	})
	if err != nil {
		t.Fatalf("SaveDraft returned error: %v", err)
	}

	savedModel := mustDecodeJSONMap(t, out.Draft.Model)
	savedDataSchema := asMap(savedModel["dataSchema"])
	savedRootFields := asSlice(asMap(savedDataSchema["rootScope"])["fields"])
	if storageKey := normalizeString(findDataSchemaFieldByID(savedRootFields, "site-name")["storageKey"]); storageKey != "site_name" {
		t.Fatalf("root site-name storage key = %q, want %q", storageKey, "site_name")
	}
	if storageKey := normalizeString(findDataSchemaFieldByID(savedRootFields, "site-name-copy")["storageKey"]); storageKey != "site_name_2" {
		t.Fatalf("root site-name-copy storage key = %q, want %q", storageKey, "site_name_2")
	}

	savedSubformScopes := asSlice(savedDataSchema["subformScopes"])
	if len(savedSubformScopes) == 0 {
		t.Fatalf("expected saved subform scopes")
	}
	savedInfoFields := asSlice(asMap(savedSubformScopes[0])["fields"])
	if storageKey := normalizeString(findDataSchemaFieldByID(savedInfoFields, "info-date")["storageKey"]); storageKey != "site_name" {
		t.Fatalf("subform info-date storage key = %q, want %q", storageKey, "site_name")
	}
}

func TestSaveDraftOnlyBumpsViewVersionWhenViewChanges(t *testing.T) {
	repo := newMemoryRepository()
	model := &ModelRecord{
		ModelID:          "site-audit",
		ModelKey:         "site-audit",
		StorageKey:       "site_audit",
		DisplayName:      "Site Audit",
		SourceType:       "managed",
		Status:           "draft",
		Version:          3,
		PublishedVersion: 1,
		StructureVersion: 2,
		DefinitionJSON: mustJSON(t, map[string]any{
			"canEditViewsOnly": false,
			"description":      "Site audit model",
			"displayName":      "Site Audit",
			"fields":           []any{},
			"id":               "site-audit",
			"key":              "site-audit",
			"name":             "Site Audit",
			"sourceType":       "managed",
			"storageKey":       "site_audit",
			"title":            "Site Audit",
		}),
	}
	view := &ViewRecord{
		ModelID:                          "site-audit",
		ViewID:                           "field-checklist",
		ViewKey:                          "field-checklist",
		DisplayName:                      "Field Checklist",
		ViewType:                         "form",
		IsActive:                         true,
		IsDefault:                        true,
		Status:                           "draft",
		Version:                          5,
		PublishedVersion:                 2,
		LastAlignedModelStructureVersion: 2,
		DefinitionJSON: mustJSON(t, map[string]any{
			"description":  "Checklist view",
			"displayName":  "Field Checklist",
			"id":           "field-checklist",
			"isActive":     true,
			"isDefault":    true,
			"isViewLocked": false,
			"kind":         "form",
			"modelId":      "site-audit",
			"name":         "Field Checklist",
			"title":        "Field Checklist",
		}),
		PublishedArtifactsJSON: mustJSON(t, map[string]any{}),
	}
	repo.models[model.ModelID] = model
	repo.views[model.ModelID] = map[string]*ViewRecord{view.ViewID: view}
	svc := NewService(repo)

	out, err := svc.SaveDraft(testContext(), "site-audit", "field-checklist", SaveDraftRequest{
		Draft: DraftPayload{
			Model: mustJSON(t, map[string]any{
				"canEditViewsOnly":      false,
				"description":           "Site audit model",
				"displayName":           "Site Audit",
				"fields":                []any{},
				"id":                    "site-audit",
				"key":                   "site-audit",
				"modelStructureVersion": 2,
				"name":                  "Site Audit",
				"sourceType":            "managed",
				"storageKey":            "site_audit",
				"title":                 "Site Audit",
			}),
			View: mustJSON(t, map[string]any{
				"description":                      "Checklist view updated",
				"displayName":                      "Field Checklist",
				"id":                               "field-checklist",
				"isActive":                         true,
				"isDefault":                        true,
				"isViewLocked":                     false,
				"kind":                             "form",
				"lastAlignedModelStructureVersion": 2,
				"modelId":                          "site-audit",
				"name":                             "Field Checklist",
				"title":                            "Field Checklist",
			}),
		},
		ExpectedVersions: ExpectedVersions{
			Model: int64Ptr(3),
			View:  int64Ptr(5),
		},
	})
	if err != nil {
		t.Fatalf("SaveDraft returned error: %v", err)
	}
	if out.PublishState.ModelVersion != 3 {
		t.Fatalf("model version = %d, want 3", out.PublishState.ModelVersion)
	}
	if out.PublishState.ViewVersion != 6 {
		t.Fatalf("view version = %d, want 6", out.PublishState.ViewVersion)
	}
	if repo.models["site-audit"].Version != 3 {
		t.Fatalf("model version should stay 3, got %d", repo.models["site-audit"].Version)
	}
	if repo.views["site-audit"]["field-checklist"].Version != 6 {
		t.Fatalf("view version should increment to 6, got %d", repo.views["site-audit"]["field-checklist"].Version)
	}
}

func TestSaveDraftBlocksLockedModelStructureChange(t *testing.T) {
	repo := newMemoryRepository()
	model := &ModelRecord{
		ModelID:           "site-audit",
		ModelKey:          "site-audit",
		StorageKey:        "site_audit",
		DisplayName:       "Site Audit",
		SourceType:        "managed",
		Status:            "draft",
		Version:           3,
		StructureVersion:  2,
		IsStructureLocked: true,
		DefinitionJSON: mustJSON(t, map[string]any{
			"canEditViewsOnly": true,
			"displayName":      "Site Audit",
			"fields": []any{
				map[string]any{"id": "site-name", "label": "Site name"},
			},
			"id":                "site-audit",
			"isStructureLocked": true,
			"key":               "site-audit",
			"modelLocked":       true,
			"sourceType":        "managed",
			"storageKey":        "site_audit",
			"title":             "Site Audit",
		}),
	}
	view := &ViewRecord{
		ModelID:                          "site-audit",
		ViewID:                           "field-checklist",
		ViewKey:                          "field-checklist",
		DisplayName:                      "Field Checklist",
		ViewType:                         "form",
		IsActive:                         true,
		IsDefault:                        true,
		Status:                           "draft",
		Version:                          5,
		LastAlignedModelStructureVersion: 2,
		DefinitionJSON: mustJSON(t, map[string]any{
			"displayName":                      "Field Checklist",
			"id":                               "field-checklist",
			"isActive":                         true,
			"isDefault":                        true,
			"isViewLocked":                     false,
			"kind":                             "form",
			"lastAlignedModelStructureVersion": 2,
			"modelId":                          "site-audit",
			"title":                            "Field Checklist",
			"viewVersion":                      5,
		}),
		PublishedArtifactsJSON: mustJSON(t, map[string]any{}),
	}
	repo.models[model.ModelID] = model
	repo.views[model.ModelID] = map[string]*ViewRecord{view.ViewID: view}
	svc := NewService(repo)

	_, err := svc.SaveDraft(testContext(), "site-audit", "field-checklist", SaveDraftRequest{
		Draft: DraftPayload{
			Model: mustJSON(t, map[string]any{
				"canEditViewsOnly": true,
				"displayName":      "Site Audit",
				"fields": []any{
					map[string]any{"id": "site-name", "label": "Site name"},
					map[string]any{"id": "new-field", "label": "New field"},
				},
				"id":                    "site-audit",
				"isStructureLocked":     true,
				"key":                   "site-audit",
				"modelStructureVersion": 3,
				"sourceType":            "managed",
				"storageKey":            "site_audit",
				"title":                 "Site Audit",
			}),
			View: mustJSON(t, map[string]any{
				"displayName":                      "Field Checklist",
				"id":                               "field-checklist",
				"isActive":                         true,
				"isDefault":                        true,
				"isViewLocked":                     false,
				"kind":                             "form",
				"lastAlignedModelStructureVersion": 3,
				"modelId":                          "site-audit",
				"title":                            "Field Checklist",
				"viewVersion":                      5,
			}),
		},
		ExpectedVersions: ExpectedVersions{
			Model: int64Ptr(3),
			View:  int64Ptr(5),
		},
	})
	if !errors.Is(err, ErrModelLocked) {
		t.Fatalf("expected ErrModelLocked, got %v", err)
	}
}

func TestSaveDraftRejectsNonRootModelLockToggle(t *testing.T) {
	repo := newMemoryRepository()
	model, view := seedCanonicalModelAndDefaultView(t, repo)
	svc := NewService(repo)

	modelPayload := mustDecodeJSONMap(t, model.DefinitionJSON)
	modelPayload["isStructureLocked"] = true
	modelPayload["modelLocked"] = true
	viewPayload := mustDecodeJSONMap(t, view.DefinitionJSON)

	_, err := svc.SaveDraft(testContext(), model.ModelID, view.ViewID, SaveDraftRequest{
		Draft: DraftPayload{
			Model: mustJSON(t, modelPayload),
			View:  mustJSON(t, viewPayload),
		},
		ExpectedVersions: ExpectedVersions{
			Model: int64Ptr(model.Version),
			View:  int64Ptr(view.Version),
		},
	})
	if !errors.Is(err, ErrModelLocked) {
		t.Fatalf("expected ErrModelLocked for non-root lock toggle, got %v", err)
	}
}

func TestSaveDraftRejectsNonRootViewLockToggle(t *testing.T) {
	repo := newMemoryRepository()
	model, view := seedCanonicalModelAndDefaultView(t, repo)
	svc := NewService(repo)

	modelPayload := mustDecodeJSONMap(t, model.DefinitionJSON)
	viewPayload := mustDecodeJSONMap(t, view.DefinitionJSON)
	viewPayload["isViewLocked"] = true
	viewPayload["viewLocked"] = true

	_, err := svc.SaveDraft(testContext(), model.ModelID, view.ViewID, SaveDraftRequest{
		Draft: DraftPayload{
			Model: mustJSON(t, modelPayload),
			View:  mustJSON(t, viewPayload),
		},
		ExpectedVersions: ExpectedVersions{
			Model: int64Ptr(model.Version),
			View:  int64Ptr(view.Version),
		},
	})
	if !errors.Is(err, ErrViewLocked) {
		t.Fatalf("expected ErrViewLocked for non-root view lock toggle, got %v", err)
	}
}

func TestSaveDraftLockingModelDoesNotAdvanceStructureVersion(t *testing.T) {
	repo := newMemoryRepository()
	model := &ModelRecord{
		ModelID:           "site-audit",
		ModelKey:          "site-audit",
		StorageKey:        "site_audit",
		DisplayName:       "Site Audit",
		SourceType:        "managed",
		Status:            "draft",
		Version:           7,
		StructureVersion:  4,
		IsStructureLocked: false,
		CanEditViewsOnly:  false,
		DefinitionJSON: mustJSON(t, map[string]any{
			"canEditViewsOnly":      false,
			"displayName":           "Site Audit",
			"fields":                []any{map[string]any{"id": "site-name", "label": "Site name"}},
			"id":                    "site-audit",
			"isStructureLocked":     false,
			"key":                   "site-audit",
			"modelLocked":           false,
			"modelStructureVersion": 4,
			"sourceType":            "managed",
			"storageKey":            "site_audit",
			"title":                 "Site Audit",
			"version":               7,
		}),
	}
	defaultView := &ViewRecord{
		ModelID:                          "site-audit",
		ViewID:                           "view-default",
		ViewKey:                          "default",
		DisplayName:                      "Site Audit",
		ViewType:                         "form",
		IsActive:                         true,
		IsDefault:                        true,
		Status:                           "draft",
		Version:                          3,
		LastAlignedModelStructureVersion: 4,
		DefinitionJSON: mustJSON(t, map[string]any{
			"displayName":                      "Site Audit",
			"id":                               "view-default",
			"isActive":                         true,
			"isDefault":                        true,
			"isViewLocked":                     false,
			"key":                              "default",
			"kind":                             "form",
			"lastAlignedModelStructureVersion": 4,
			"modelId":                          "site-audit",
			"title":                            "Site Audit",
			"viewVersion":                      3,
			"version":                          3,
		}),
		PublishedArtifactsJSON: mustJSON(t, map[string]any{}),
	}
	otherView := &ViewRecord{
		ModelID:                          "site-audit",
		ViewID:                           "inspection-summary",
		ViewKey:                          "inspection-summary",
		DisplayName:                      "Inspection Summary",
		ViewType:                         "form",
		IsActive:                         true,
		IsDefault:                        false,
		Status:                           "draft",
		Version:                          2,
		LastAlignedModelStructureVersion: 4,
		DefinitionJSON: mustJSON(t, map[string]any{
			"displayName":                      "Inspection Summary",
			"id":                               "inspection-summary",
			"isActive":                         true,
			"isDefault":                        false,
			"isViewLocked":                     false,
			"key":                              "inspection-summary",
			"kind":                             "form",
			"lastAlignedModelStructureVersion": 4,
			"modelId":                          "site-audit",
			"title":                            "Inspection Summary",
			"viewVersion":                      2,
			"version":                          2,
		}),
		PublishedArtifactsJSON: mustJSON(t, map[string]any{}),
	}
	repo.models[model.ModelID] = model
	repo.views[model.ModelID] = map[string]*ViewRecord{
		defaultView.ViewID: defaultView,
		otherView.ViewID:   otherView,
	}
	svc := NewService(repo)

	out, err := svc.SaveDraft(rootTestContext(), "site-audit", "view-default", SaveDraftRequest{
		Draft: DraftPayload{
			Model: mustJSON(t, map[string]any{
				"canEditViewsOnly":      false,
				"displayName":           "Site Audit",
				"fields":                []any{map[string]any{"id": "site-name", "label": "Site name"}},
				"id":                    "site-audit",
				"isStructureLocked":     true,
				"key":                   "site-audit",
				"modelStructureVersion": 4,
				"sourceType":            "managed",
				"storageKey":            "site_audit",
				"title":                 "Site Audit",
				"version":               7,
			}),
			View: mustJSON(t, map[string]any{
				"displayName":                      "Site Audit",
				"id":                               "view-default",
				"isActive":                         true,
				"isDefault":                        true,
				"isViewLocked":                     false,
				"key":                              "default",
				"kind":                             "form",
				"lastAlignedModelStructureVersion": 4,
				"modelId":                          "site-audit",
				"title":                            "Site Audit",
				"viewVersion":                      3,
				"version":                          3,
			}),
		},
		ExpectedVersions: ExpectedVersions{
			Model: int64Ptr(7),
			View:  int64Ptr(3),
		},
	})
	if err != nil {
		t.Fatalf("SaveDraft returned error: %v", err)
	}
	if repo.models["site-audit"].IsStructureLocked != true {
		t.Fatalf("model lock should persist")
	}
	if repo.models["site-audit"].CanEditViewsOnly != true {
		t.Fatalf("canEditViewsOnly should mirror locked structure")
	}
	if repo.models["site-audit"].StructureVersion != 4 {
		t.Fatalf("structure version = %d, want 4", repo.models["site-audit"].StructureVersion)
	}
	savedModelPayload := mustDecodeJSONMap(t, out.Draft.Model)
	if getInt64Value(savedModelPayload, "modelStructureVersion", 0) != 4 {
		t.Fatalf("draft model structure version = %d, want 4", getInt64Value(savedModelPayload, "modelStructureVersion", 0))
	}
	if repo.views["site-audit"]["inspection-summary"].LastAlignedModelStructureVersion != 4 {
		t.Fatalf("other view alignment should stay 4, got %d", repo.views["site-audit"]["inspection-summary"].LastAlignedModelStructureVersion)
	}
	if out.PublishState.ModelVersion != 8 {
		t.Fatalf("model version = %d, want 8", out.PublishState.ModelVersion)
	}
}

func TestSaveDraftFieldSettingsDoNotAdvanceStructureVersion(t *testing.T) {
	repo := newMemoryRepository()
	model, view := seedCanonicalModelAndDefaultView(t, repo)
	svc := NewService(repo)

	modelPayload := mustDecodeJSONMap(t, model.DefinitionJSON)
	dataSchema := asMap(modelPayload["dataSchema"])
	rootScope := asMap(dataSchema["rootScope"])
	rootFields := asSlice(rootScope["fields"])
	siteName := asMap(rootFields[0])
	siteName["autocomplete"] = "name"
	siteName["placeholder"] = "Updated placeholder"
	siteName["uniqueValue"] = true
	siteName["validation"] = "email"
	rootFields[0] = siteName
	rootScope["fields"] = rootFields
	dataSchema["rootScope"] = rootScope
	modelPayload["dataSchema"] = dataSchema

	viewPayload := mustDecodeJSONMap(t, view.DefinitionJSON)

	out, err := svc.SaveDraft(testContext(), model.ModelID, view.ViewID, SaveDraftRequest{
		Draft: DraftPayload{
			Model: mustJSON(t, modelPayload),
			View:  mustJSON(t, viewPayload),
		},
		ExpectedVersions: ExpectedVersions{
			Model: int64Ptr(model.Version),
			View:  int64Ptr(view.Version),
		},
	})
	if err != nil {
		t.Fatalf("SaveDraft returned error: %v", err)
	}
	if repo.models[model.ModelID].StructureVersion != model.StructureVersion {
		t.Fatalf("structure version = %d, want %d", repo.models[model.ModelID].StructureVersion, model.StructureVersion)
	}
	savedModelPayload := mustDecodeJSONMap(t, out.Draft.Model)
	if getInt64Value(savedModelPayload, "modelStructureVersion", 0) != model.StructureVersion {
		t.Fatalf("draft model structure version = %d, want %d", getInt64Value(savedModelPayload, "modelStructureVersion", 0), model.StructureVersion)
	}
}

func TestDeleteViewPromotesRemainingView(t *testing.T) {
	repo := newMemoryRepository()
	model := &ModelRecord{
		ModelID:          "site-audit",
		ModelKey:         "site-audit",
		DisplayName:      "Site Audit",
		SourceType:       "managed",
		Version:          3,
		StructureVersion: 2,
		DefinitionJSON:   mustJSON(t, map[string]any{"fields": []any{}}),
	}
	first := &ViewRecord{
		ModelID:                          "site-audit",
		ViewID:                           "view-default",
		ViewKey:                          "default",
		DisplayName:                      "Default",
		ViewType:                         "form",
		IsActive:                         true,
		IsDefault:                        true,
		Version:                          5,
		LastAlignedModelStructureVersion: 2,
		DefinitionJSON: mustJSON(t, map[string]any{
			"id":                               "view-default",
			"isActive":                         true,
			"isDefault":                        true,
			"key":                              "default",
			"kind":                             "form",
			"lastAlignedModelStructureVersion": 2,
			"modelId":                          "site-audit",
			"title":                            "Default",
			"viewVersion":                      5,
		}),
		PublishedArtifactsJSON: mustJSON(t, map[string]any{}),
	}
	second := &ViewRecord{
		ModelID:                          "site-audit",
		ViewID:                           "inspection-summary",
		ViewKey:                          "inspection-summary",
		DisplayName:                      "Inspection Summary",
		ViewType:                         "detail",
		IsActive:                         false,
		IsDefault:                        false,
		Version:                          2,
		LastAlignedModelStructureVersion: 2,
		DefinitionJSON: mustJSON(t, map[string]any{
			"id":                               "inspection-summary",
			"isActive":                         false,
			"isDefault":                        false,
			"kind":                             "detail",
			"lastAlignedModelStructureVersion": 2,
			"modelId":                          "site-audit",
			"title":                            "Inspection Summary",
			"viewVersion":                      2,
		}),
		PublishedArtifactsJSON: mustJSON(t, map[string]any{}),
	}
	repo.models[model.ModelID] = model
	repo.views[model.ModelID] = map[string]*ViewRecord{
		first.ViewID:  first,
		second.ViewID: second,
	}
	svc := NewService(repo)

	out, err := svc.DeleteView(testContext(), "site-audit", "view-default")
	if err != nil {
		t.Fatalf("DeleteView returned error: %v", err)
	}
	if out.SelectedViewID != "inspection-summary" {
		t.Fatalf("selected view id = %q, want inspection-summary", out.SelectedViewID)
	}
	if len(out.Views) != 1 {
		t.Fatalf("expected one remaining view, got %d", len(out.Views))
	}
	if !out.Views[0].IsDefault || !out.Views[0].IsActive {
		t.Fatalf("remaining view should be promoted to active default: %#v", out.Views[0])
	}
}

func TestListModelsHidesStaticModelsForNonRoot(t *testing.T) {
	repo := newMemoryRepository()
	managedModel, _ := seedCanonicalModelAndDefaultView(t, repo)
	staticModel, _ := seedExternalModelAndDefaultView(t, repo, "state-directory")
	svc := NewService(repo)

	out, err := svc.ListModels(testContext())
	if err != nil {
		t.Fatalf("ListModels returned error: %v", err)
	}
	if len(out.Items) != 1 {
		t.Fatalf("expected only managed model for non-root, got %#v", out.Items)
	}
	if out.Items[0].ID != managedModel.ModelID {
		t.Fatalf("visible model id = %q, want %q", out.Items[0].ID, managedModel.ModelID)
	}
	for _, item := range out.Items {
		if item.ID == staticModel.ModelID {
			t.Fatalf("static model %q should be hidden from non-root", staticModel.ModelID)
		}
	}
}

func TestListModelsShowsStaticModelsForRoot(t *testing.T) {
	repo := newMemoryRepository()
	managedModel, _ := seedCanonicalModelAndDefaultView(t, repo)
	staticModel, _ := seedExternalModelAndDefaultView(t, repo, "state-directory")
	repo.relationRowCounts[resolveModelDataCountRelationName(managedModel)] = 12
	repo.relationRowCounts[resolveModelDataCountRelationName(staticModel)] = 64
	svc := NewService(repo)

	out, err := svc.ListModels(rootTestContext())
	if err != nil {
		t.Fatalf("ListModels returned error: %v", err)
	}
	if len(out.Items) != 2 {
		t.Fatalf("expected managed and static models for root, got %#v", out.Items)
	}
	ids := []string{out.Items[0].ID, out.Items[1].ID}
	sort.Strings(ids)
	expected := []string{managedModel.ModelID, staticModel.ModelID}
	sort.Strings(expected)
	if !reflect.DeepEqual(ids, expected) {
		t.Fatalf("visible model ids = %#v, want %#v", ids, expected)
	}
	counts := map[string]int64{}
	for _, item := range out.Items {
		if item.DataCount == nil {
			t.Fatalf("model %q missing dataCount", item.ID)
		}
		counts[item.ID] = *item.DataCount
	}
	if counts[managedModel.ModelID] != 12 {
		t.Fatalf("managed model dataCount = %d, want %d", counts[managedModel.ModelID], 12)
	}
	if counts[staticModel.ModelID] != 64 {
		t.Fatalf("static model dataCount = %d, want %d", counts[staticModel.ModelID], 64)
	}
}

func TestGetModelIncludesDataCountWhenAvailable(t *testing.T) {
	repo := newMemoryRepository()
	model, _ := seedCanonicalModelAndDefaultView(t, repo)
	repo.relationRowCounts[resolveModelDataCountRelationName(model)] = 7
	svc := NewService(repo)

	out, err := svc.GetModel(rootTestContext(), model.ModelID)
	if err != nil {
		t.Fatalf("GetModel returned error: %v", err)
	}
	if out.DataCount == nil || *out.DataCount != 7 {
		t.Fatalf("detail dataCount = %#v, want %d", out.DataCount, 7)
	}
}

func TestGetModelRejectsStaticModelForNonRoot(t *testing.T) {
	repo := newMemoryRepository()
	staticModel, _ := seedExternalModelAndDefaultView(t, repo, "state-directory")
	svc := NewService(repo)

	_, err := svc.GetModel(testContext(), staticModel.ModelID)
	if !errors.Is(err, ErrModelNotFound) {
		t.Fatalf("expected ErrModelNotFound for non-root static model detail, got %v", err)
	}
}

func TestGetModelAllowsStaticModelForRoot(t *testing.T) {
	repo := newMemoryRepository()
	staticModel, _ := seedExternalModelAndDefaultView(t, repo, "state-directory")
	svc := NewService(repo)

	out, err := svc.GetModel(rootTestContext(), staticModel.ModelID)
	if err != nil {
		t.Fatalf("GetModel returned error: %v", err)
	}
	if out.ID != staticModel.ModelID {
		t.Fatalf("model id = %q, want %q", out.ID, staticModel.ModelID)
	}
	if out.SourceType != "external" {
		t.Fatalf("model source type = %q, want %q", out.SourceType, "external")
	}
	if !out.CanEditViewsOnly {
		t.Fatalf("static model should always expose canEditViewsOnly=true")
	}
}

func TestLoadDraftForRootForcesViewsOnlyForStaticModel(t *testing.T) {
	repo := newMemoryRepository()
	staticModel, view := seedExternalModelAndDefaultView(t, repo, "state-directory")
	svc := NewService(repo)

	out, err := svc.LoadDraft(rootTestContext(), staticModel.ModelID, view.ViewID)
	if err != nil {
		t.Fatalf("LoadDraft returned error: %v", err)
	}

	modelPayload := mustDecodeJSONMap(t, out.Draft.Model)
	if !getBoolValue(modelPayload, "canEditViewsOnly", false) {
		t.Fatalf("draft model should expose canEditViewsOnly=true for static model")
	}
}

func TestExportModelDataUsesCanonicalLabelsAndRawTableColumns(t *testing.T) {
	repo := newMemoryRepository()
	model, _ := seedCanonicalModelAndDefaultView(t, repo)
	modelPayload := mustDecodeJSONMap(t, model.DefinitionJSON)
	rootScope := asMap(asMap(modelPayload["dataSchema"])["rootScope"])
	rootScope["fields"] = append(asSlice(rootScope["fields"]), map[string]any{
		"displayFields": []any{"Full name", "Email"},
		"id":            "reported-by",
		"kind":          "db_lookup",
		"label":         "Reported By",
		"preset":        "contact_lookup",
		"selectionMode": "single",
		"storageKey":    "reported_by",
	})
	model.DefinitionJSON = mustJSON(t, modelPayload)
	repo.models[model.ModelID] = model

	repo.exportRows = [][]string{
		{"101", "Plant A", "42"},
		{"102", "Plant B", "84"},
	}

	svc := NewService(repo)
	out, err := svc.ExportModelData(testContext(), model.ModelID)
	if err != nil {
		t.Fatalf("ExportModelData returned error: %v", err)
	}

	if repo.lastExportRelationName != "ps_site_audit" {
		t.Fatalf("export relation = %q, want %q", repo.lastExportRelationName, "ps_site_audit")
	}
	if repo.lastExportOrderByColumn != "_id" {
		t.Fatalf("export order by = %q, want %q", repo.lastExportOrderByColumn, "_id")
	}
	if !reflect.DeepEqual(repo.lastExportColumnNames, []string{"_id", "site_name", "reported_by_id"}) {
		t.Fatalf("export columns = %#v, want %#v", repo.lastExportColumnNames, []string{"_id", "site_name", "reported_by_id"})
	}
	if out.FileName != "site-audit-data.csv" {
		t.Fatalf("export file name = %q, want %q", out.FileName, "site-audit-data.csv")
	}
	if out.ContentType != "text/csv; charset=utf-8" {
		t.Fatalf("export content type = %q, want csv", out.ContentType)
	}

	reader := csv.NewReader(bytes.NewReader(out.Content))
	records, err := reader.ReadAll()
	if err != nil {
		t.Fatalf("ReadAll returned error: %v", err)
	}
	expected := [][]string{
		{"Doc.id", "Site Name", "Reported By"},
		{"101", "Plant A", "42"},
		{"102", "Plant B", "84"},
	}
	if !reflect.DeepEqual(records, expected) {
		t.Fatalf("csv records = %#v, want %#v", records, expected)
	}
}

func TestExportModelDataRejectsStaticModel(t *testing.T) {
	repo := newMemoryRepository()
	model, _ := seedExternalModelAndDefaultView(t, repo, "state-directory")
	svc := NewService(repo)

	_, err := svc.ExportModelData(rootTestContext(), model.ModelID)
	if !errors.Is(err, ErrExportUnsupported) {
		t.Fatalf("ExportModelData error = %v, want %v", err, ErrExportUnsupported)
	}
}

func TestExportModelBundleRejectsStaticModel(t *testing.T) {
	repo := newMemoryRepository()
	model, _ := seedExternalModelAndDefaultView(t, repo, "state-directory")
	svc := NewService(repo)

	_, err := svc.ExportModelBundle(rootTestContext(), model.ModelID)
	if !errors.Is(err, ErrExportUnsupported) {
		t.Fatalf("ExportModelBundle error = %v, want %v", err, ErrExportUnsupported)
	}
}

func TestExportModelBundleIncludesCanonicalModelAndAllViews(t *testing.T) {
	repo := newMemoryRepository()
	model, defaultView := seedCanonicalModelAndDefaultView(t, repo)
	modelPayload := mustDecodeJSONMap(t, model.DefinitionJSON)
	rootScope := asMap(asMap(modelPayload["dataSchema"])["rootScope"])
	rootScope["fields"] = append(asSlice(rootScope["fields"]), map[string]any{
		"displayFields": []any{"Full name", "Email"},
		"id":            "reported-by",
		"kind":          "db_lookup",
		"label":         "Reported By",
		"preset":        "contact_lookup",
		"selectionMode": "single",
		"storageKey":    "reported_by",
	})
	model.DefinitionJSON = mustJSON(t, modelPayload)
	repo.models[model.ModelID] = model

	secondaryView := cloneViewRecord(defaultView)
	secondaryView.ViewID = "view-operations"
	secondaryView.ViewKey = "operations"
	secondaryView.DisplayName = "Operations"
	secondaryView.IsDefault = false
	viewPayload := mustDecodeJSONMap(t, secondaryView.DefinitionJSON)
	viewPayload["id"] = secondaryView.ViewID
	viewPayload["key"] = secondaryView.ViewKey
	viewPayload["displayName"] = secondaryView.DisplayName
	viewPayload["title"] = secondaryView.DisplayName
	viewPayload["name"] = secondaryView.DisplayName
	viewPayload["isDefault"] = false
	secondaryView.DefinitionJSON = mustJSON(t, viewPayload)
	repo.views[model.ModelID][secondaryView.ViewID] = &secondaryView

	svc := NewService(repo)
	out, err := svc.ExportModelBundle(rootTestContext(), model.ModelID)
	if err != nil {
		t.Fatalf("ExportModelBundle returned error: %v", err)
	}
	if out.FileName != "site-audit-model.json" {
		t.Fatalf("export file name = %q, want %q", out.FileName, "site-audit-model.json")
	}

	bundle := mustDecodeJSONMap(t, out.Content)
	if got := normalizeString(bundle["exportKind"]); got != "form_builder_model" {
		t.Fatalf("exportKind = %q, want %q", got, "form_builder_model")
	}
	if got := normalizeString(bundle["formatVersion"]); got != "v1" {
		t.Fatalf("formatVersion = %q, want %q", got, "v1")
	}
	exportMeta := asMap(bundle["exportMeta"])
	if got := normalizeString(exportMeta["sourceTenantId"]); got != "101" {
		t.Fatalf("sourceTenantId = %q, want %q", got, "101")
	}
	if got := normalizeString(exportMeta["sourceTenantName"]); got != "Demo Tenant" {
		t.Fatalf("sourceTenantName = %q, want %q", got, "Demo Tenant")
	}
	exportedBy := asMap(exportMeta["exportedBy"])
	if got := normalizeString(exportedBy["userId"]); got != "11111111-1111-1111-1111-111111111111" {
		t.Fatalf("exportedBy.userId = %q, want root user id", got)
	}
	if got := normalizeString(exportedBy["email"]); got != "root@example.com" {
		t.Fatalf("exportedBy.email = %q, want %q", got, "root@example.com")
	}

	importPolicy := asMap(bundle["importPolicy"])
	if got := normalizeString(importPolicy["conflictMode"]); got != "reject" {
		t.Fatalf("conflictMode = %q, want %q", got, "reject")
	}

	runtimePolicy := asMap(bundle["runtimePolicy"])
	if got := normalizeString(runtimePolicy["sourceType"]); got != "managed" {
		t.Fatalf("runtimePolicy.sourceType = %q, want %q", got, "managed")
	}
	if got := normalizeString(runtimePolicy["onImport"]); got != "reapply_runtime" {
		t.Fatalf("runtimePolicy.onImport = %q, want %q", got, "reapply_runtime")
	}

	dependencies := asMap(bundle["dependencies"])
	if !reflect.DeepEqual(dependencies["models"], []any{
		map[string]any{
			"modelId":  "users",
			"reasons":  []any{"contact_lookup"},
			"required": true,
		},
	}) {
		t.Fatalf("dependencies.models = %#v, want users/contact_lookup", dependencies["models"])
	}

	exportedModel := asMap(bundle["model"])
	if len(asMap(exportedModel["dataSchema"])) == 0 || len(asMap(exportedModel["layoutBlueprint"])) == 0 {
		t.Fatalf("expected exported model payload with dataSchema/layoutBlueprint, got %#v", exportedModel)
	}

	exportedViews := asSlice(bundle["views"])
	if len(exportedViews) != 2 {
		t.Fatalf("expected all views in export bundle, got %#v", exportedViews)
	}
	for _, rawView := range exportedViews {
		exportedView := asMap(rawView)
		if len(asMap(exportedView["uiSchema"])) == 0 {
			t.Fatalf("expected exported view payload with uiSchema, got %#v", exportedView)
		}
	}
}

func TestExportModelBundleRejectsLockedViewForNonRoot(t *testing.T) {
	repo := newMemoryRepository()
	model, view := seedCanonicalModelAndDefaultView(t, repo)
	view.IsViewLocked = true
	viewPayload := mustDecodeJSONMap(t, view.DefinitionJSON)
	viewPayload["isViewLocked"] = true
	viewPayload["viewLocked"] = true
	view.DefinitionJSON = mustJSON(t, viewPayload)
	repo.views[model.ModelID][view.ViewID] = view
	svc := NewService(repo)

	_, err := svc.ExportModelBundle(testContext(), model.ModelID)
	if !errors.Is(err, ErrViewLocked) {
		t.Fatalf("expected ErrViewLocked when non-root exports model with locked view, got %v", err)
	}
}

func TestRuntimeGridViewNamesForViewIncludesRootAndSubformGridViews(t *testing.T) {
	repo := newMemoryRepository()
	model, view := seedCanonicalModelAndDefaultView(t, repo)

	views, err := repo.ListViews(testContext(), requestctx.TenantInfo{}, model.ModelID)
	if err != nil {
		t.Fatalf("ListViews returned error: %v", err)
	}
	names, err := runtimeGridViewNamesForView(model, view, views)
	if err != nil {
		t.Fatalf("runtimeGridViewNamesForView returned error: %v", err)
	}

	scopeRtAlias := buildGeneratedRuntimeScopeAlias("pb_info")
	want := []string{
		"vg_site_audit__default",
		"vg_site_audit__" + scopeRtAlias + "__default",
	}
	if !reflect.DeepEqual(names, want) {
		t.Fatalf("runtime grid view names = %#v, want %#v", names, want)
	}
}

func TestRuntimeViewNamesForModelIncludesGridAndDataViews(t *testing.T) {
	repo := newMemoryRepository()
	model, _ := seedCanonicalModelAndDefaultView(t, repo)
	_, err := NewService(repo).CreateView(testContext(), model.ModelID, CreateViewRequest{Title: "Operations"})
	if err != nil {
		t.Fatalf("CreateView returned error: %v", err)
	}

	views, err := repo.ListViews(testContext(), requestctx.TenantInfo{}, model.ModelID)
	if err != nil {
		t.Fatalf("ListViews returned error: %v", err)
	}
	names, err := runtimeViewNamesForModel(model, views)
	if err != nil {
		t.Fatalf("runtimeViewNamesForModel returned error: %v", err)
	}

	scopeRtAlias := buildGeneratedRuntimeScopeAlias("pb_info")
	want := []string{
		"vg_site_audit__default",
		"vg_site_audit__" + scopeRtAlias + "__default",
		"vg_site_audit__operations",
		"vg_site_audit__" + scopeRtAlias + "__operations",
		"vw_site_audit",
		"vw_site_audit__" + scopeRtAlias,
	}
	if !reflect.DeepEqual(names, want) {
		t.Fatalf("runtime view names = %#v, want %#v", names, want)
	}
}

func TestCreateViewAppliesRuntimeImmediately(t *testing.T) {
	repo := newMemoryRepository()
	model, _ := seedCanonicalModelAndDefaultView(t, repo)
	svc := NewService(repo)

	out, err := svc.CreateView(testContext(), model.ModelID, CreateViewRequest{Title: "Operations"})
	if err != nil {
		t.Fatalf("CreateView returned error: %v", err)
	}
	if out.RuntimeApply == nil || out.RuntimeApply.Status != "applied" {
		t.Fatalf("expected applied runtime summary, got %#v", out.RuntimeApply)
	}
	if repo.lastRuntimePlan == nil {
		t.Fatalf("expected runtime plan to be applied on create view")
	}
	if !containsGridViewPlan(repo.lastRuntimePlan.RootScope.GridViews, "vg_site_audit__operations") {
		t.Fatalf("expected operations root grid view, got %#v", repo.lastRuntimePlan.RootScope.GridViews)
	}

	scopeRtAlias := buildGeneratedRuntimeScopeAlias("pb_info")
	if len(repo.lastRuntimePlan.SubformScopes) != 1 {
		t.Fatalf("expected one subform scope, got %#v", repo.lastRuntimePlan.SubformScopes)
	}
	if !containsGridViewPlan(repo.lastRuntimePlan.SubformScopes[0].GridViews, "vg_site_audit__"+scopeRtAlias+"__operations") {
		t.Fatalf("expected operations subform grid view, got %#v", repo.lastRuntimePlan.SubformScopes[0].GridViews)
	}
}

func TestCopyViewAppliesRuntimeImmediately(t *testing.T) {
	repo := newMemoryRepository()
	model, sourceView := seedCanonicalModelAndDefaultView(t, repo)
	svc := NewService(repo)

	out, err := svc.CopyView(testContext(), model.ModelID, sourceView.ViewID, CopyViewRequest{Title: "Copied"})
	if err != nil {
		t.Fatalf("CopyView returned error: %v", err)
	}
	if out.RuntimeApply == nil || out.RuntimeApply.Status != "applied" {
		t.Fatalf("expected applied runtime summary, got %#v", out.RuntimeApply)
	}
	if repo.lastRuntimePlan == nil {
		t.Fatalf("expected runtime plan to be applied on copy view")
	}
	if !containsGridViewPlan(repo.lastRuntimePlan.RootScope.GridViews, "vg_site_audit__copied") {
		t.Fatalf("expected copied root grid view, got %#v", repo.lastRuntimePlan.RootScope.GridViews)
	}

	scopeRtAlias := buildGeneratedRuntimeScopeAlias("pb_info")
	if len(repo.lastRuntimePlan.SubformScopes) != 1 {
		t.Fatalf("expected one subform scope, got %#v", repo.lastRuntimePlan.SubformScopes)
	}
	if !containsGridViewPlan(repo.lastRuntimePlan.SubformScopes[0].GridViews, "vg_site_audit__"+scopeRtAlias+"__copied") {
		t.Fatalf("expected copied subform grid view, got %#v", repo.lastRuntimePlan.SubformScopes[0].GridViews)
	}
}

func TestDeleteModelRemovesModelAndViews(t *testing.T) {
	repo := newMemoryRepository()
	model := &ModelRecord{
		ModelID:          "site-audit",
		ModelKey:         "site-audit",
		DisplayName:      "Site Audit",
		Version:          2,
		StructureVersion: 2,
		DefinitionJSON: mustJSON(t, map[string]any{
			"id":                    "site-audit",
			"key":                   "site-audit",
			"title":                 "Site Audit",
			"displayName":           "Site Audit",
			"modelStructureVersion": 2,
			"version":               2,
		}),
	}
	view := &ViewRecord{
		ModelID:                          "site-audit",
		ViewID:                           "view-default",
		ViewKey:                          "default",
		DisplayName:                      "Site Audit",
		ViewType:                         "form",
		IsActive:                         true,
		IsDefault:                        true,
		Version:                          2,
		LastAlignedModelStructureVersion: 2,
		DefinitionJSON: mustJSON(t, map[string]any{
			"id":                               "view-default",
			"isActive":                         true,
			"isDefault":                        true,
			"kind":                             "form",
			"lastAlignedModelStructureVersion": 2,
			"modelId":                          "site-audit",
			"title":                            "Site Audit",
			"viewVersion":                      2,
		}),
	}
	repo.models[model.ModelID] = model
	repo.views[model.ModelID] = map[string]*ViewRecord{
		view.ViewID: view,
	}
	svc := NewService(repo)

	out, err := svc.DeleteModel(testContext(), "site-audit")
	if err != nil {
		t.Fatalf("DeleteModel returned error: %v", err)
	}
	if out.DeletedModelID != "site-audit" {
		t.Fatalf("deleted model id = %q, want site-audit", out.DeletedModelID)
	}
	if _, ok := repo.models["site-audit"]; ok {
		t.Fatalf("model was not removed from repository")
	}
	if _, ok := repo.views["site-audit"]; ok {
		t.Fatalf("views were not removed with deleted model")
	}
}

func TestDeleteModelRejectsStaticModelForNonRoot(t *testing.T) {
	repo := newMemoryRepository()
	staticModel, _ := seedExternalModelAndDefaultView(t, repo, "state-directory")
	svc := NewService(repo)

	_, err := svc.DeleteModel(testContext(), staticModel.ModelID)
	if !errors.Is(err, ErrModelNotFound) {
		t.Fatalf("expected ErrModelNotFound when non-root deletes static model, got %v", err)
	}
}

func TestDeleteModelRejectsStaticModelForRoot(t *testing.T) {
	repo := newMemoryRepository()
	staticModel, _ := seedExternalModelAndDefaultView(t, repo, "state-directory")
	svc := NewService(repo)

	_, err := svc.DeleteModel(rootTestContext(), staticModel.ModelID)
	if !errors.Is(err, ErrDeleteUnsupported) {
		t.Fatalf("expected ErrDeleteUnsupported when root deletes static model, got %v", err)
	}
}

func TestSaveDraftIgnoresStaticModelSchemaChangesForRoot(t *testing.T) {
	repo := newMemoryRepository()
	model, view := seedRootOnlyExternalModelAndDefaultView(t, repo, "state-directory")
	repo.runtimeRelations[model.StorageKey] = "table"
	svc := NewService(repo)

	modelPayload := mustDecodeJSONMap(t, model.DefinitionJSON)
	modelPayload["displayName"] = "Renamed directory"
	modelPayload["title"] = "Renamed directory"
	viewPayload := mustDecodeJSONMap(t, view.DefinitionJSON)

	out, err := svc.SaveDraft(rootTestContext(), model.ModelID, view.ViewID, SaveDraftRequest{
		Draft: DraftPayload{
			Model: mustJSON(t, modelPayload),
			View:  mustJSON(t, viewPayload),
		},
		ExpectedVersions: ExpectedVersions{
			Model: int64Ptr(model.Version),
			View:  int64Ptr(view.Version),
		},
	})
	if err != nil {
		t.Fatalf("SaveDraft returned error: %v", err)
	}
	if repo.models[model.ModelID].DisplayName != model.DisplayName {
		t.Fatalf("static model display name changed to %q, want %q", repo.models[model.ModelID].DisplayName, model.DisplayName)
	}
	savedModelPayload := mustDecodeJSONMap(t, out.Draft.Model)
	if got := normalizeString(savedModelPayload["displayName"]); got != model.DisplayName {
		t.Fatalf("saved draft model display name = %q, want %q", got, model.DisplayName)
	}
}

func TestSaveDraftAllowsStaticModelViewChangesForRoot(t *testing.T) {
	repo := newMemoryRepository()
	model, view := seedRootOnlyExternalModelAndDefaultView(t, repo, "state-directory")
	repo.runtimeRelations[model.StorageKey] = "table"
	svc := NewService(repo)

	modelPayload := mustDecodeJSONMap(t, model.DefinitionJSON)
	modelPayload["dataCount"] = 27
	modelPayload["displayName"] = "Hydrated Events"
	modelPayload["title"] = "Hydrated Events"
	modelPayload["owner"] = ""
	viewPayload := mustDecodeJSONMap(t, view.DefinitionJSON)
	viewPayload["displayName"] = "Directory View"
	viewPayload["title"] = "Directory View"

	out, err := svc.SaveDraft(rootTestContext(), model.ModelID, view.ViewID, SaveDraftRequest{
		Draft: DraftPayload{
			Model: mustJSON(t, modelPayload),
			View:  mustJSON(t, viewPayload),
		},
		ExpectedVersions: ExpectedVersions{
			Model: int64Ptr(model.Version),
			View:  int64Ptr(view.Version),
		},
	})
	if err != nil {
		t.Fatalf("SaveDraft returned error: %v", err)
	}
	if !repo.models[model.ModelID].CanEditViewsOnly {
		t.Fatalf("static model should remain views-only after view save")
	}
	if repo.views[model.ModelID][view.ViewID].DisplayName != "Directory View" {
		t.Fatalf("view display name = %q, want Directory View", repo.views[model.ModelID][view.ViewID].DisplayName)
	}
	if repo.models[model.ModelID].DisplayName != model.DisplayName {
		t.Fatalf("static model display name changed to %q, want %q", repo.models[model.ModelID].DisplayName, model.DisplayName)
	}
	savedModelPayload := mustDecodeJSONMap(t, out.Draft.Model)
	if !getBoolValue(savedModelPayload, "canEditViewsOnly", false) {
		t.Fatalf("saved draft model should expose canEditViewsOnly=true for static model")
	}
}

func TestLoadRuntimeViewListMetaPreservesDateTimeFieldType(t *testing.T) {
	repo := newMemoryRepository()
	model, view := seedRootOnlyExternalModelAndDefaultView(t, repo, "events")
	repo.runtimeRelations[model.StorageKey] = "table"

	modelPayload := mustDecodeJSONMap(t, model.DefinitionJSON)
	modelPayload["displayName"] = "Events"
	modelPayload["title"] = "Events"
	modelPayload["dataSchema"] = map[string]any{
		"modelId":    "events",
		"modelTitle": "Events",
		"rootScope": map[string]any{
			"schemaScopeId": "root",
			"fields": []any{
				map[string]any{
					"id":         "occurred_at",
					"kind":       "date_time",
					"label":      "Occurred At",
					"storageKey": "occurred_at",
					"runtime": map[string]any{
						"sourceColumnName": "occurred_at",
						"sourceValueKind":  "scalar",
					},
				},
			},
			"runtime": map[string]any{
				"dataViewName": "vw_events",
				"rtAlias":      "events",
				"tableName":    "events",
			},
		},
		"subformScopes": []any{},
	}
	modelPayload["layoutBlueprint"] = map[string]any{
		"rootScope": map[string]any{
			"schemaScopeId": "root",
			"containers":    []any{},
			"fieldPlacements": []any{
				map[string]any{
					"containerKey": "__scope_root__",
					"fieldId":      "occurred_at",
					"order":        0,
				},
			},
			"unplacedFieldIds": []any{},
		},
		"subformScopes": []any{},
	}
	modelPayload["layoutBlueprint"] = map[string]any{
		"rootScope": map[string]any{
			"schemaScopeId": "root",
			"containers":    []any{},
			"fieldPlacements": []any{
				map[string]any{
					"containerKey": "__scope_root__",
					"fieldId":      "occurred_at",
					"order":        0,
				},
			},
			"unplacedFieldIds": []any{},
		},
		"subformScopes": []any{},
	}
	model.DefinitionJSON = mustJSON(t, modelPayload)

	viewPayload := mustDecodeJSONMap(t, view.DefinitionJSON)
	viewPayload["displayName"] = "Events"
	viewPayload["title"] = "Events"
	viewPayload["uiSchema"] = map[string]any{
		"rootScope": map[string]any{
			"schemaScopeId": "root",
			"runtime": map[string]any{
				"dataViewName": "vw_events",
				"gridViewName": "vg_events__default",
				"viewRtAlias":  "default",
			},
			"nodes": []any{
				map[string]any{
					"id":      "field-occurred-at",
					"type":    "field",
					"fieldId": "occurred_at",
					"order":   0,
				},
			},
			"viewSettings": map[string]any{
				"list": map[string]any{
					"columns": []any{
						map[string]any{
							"fieldId": "occurred_at",
							"id":      "grid-column-occurred-at",
							"order":   0,
						},
					},
				},
			},
		},
		"subformScopes": []any{},
	}
	view.DefinitionJSON = mustJSON(t, viewPayload)

	svc := NewService(repo)
	out, err := svc.LoadRuntimeViewListMeta(rootTestContext(), model.ModelID, view.ViewID)
	if err != nil {
		t.Fatalf("LoadRuntimeViewListMeta returned error: %v", err)
	}
	if len(out.Fields) != 1 {
		t.Fatalf("field count = %d, want 1", len(out.Fields))
	}
	if out.Fields[0].Type != "date_time" {
		t.Fatalf("field type = %q, want %q", out.Fields[0].Type, "date_time")
	}
	if len(out.Columns) != 1 {
		t.Fatalf("column count = %d, want 1", len(out.Columns))
	}
	if out.Columns[0].Type != "date_time" {
		t.Fatalf("column type = %q, want %q", out.Columns[0].Type, "date_time")
	}
}

func TestLoadRuntimeViewListMetaUsesViewFieldTitleOverride(t *testing.T) {
	repo := newMemoryRepository()
	model, view := seedRootOnlyExternalModelAndDefaultView(t, repo, "events")
	repo.runtimeRelations[model.StorageKey] = "table"

	modelPayload := mustDecodeJSONMap(t, model.DefinitionJSON)
	modelPayload["displayName"] = "Events"
	modelPayload["title"] = "Events"
	modelPayload["dataSchema"] = map[string]any{
		"modelId":    "events",
		"modelTitle": "Events",
		"rootScope": map[string]any{
			"schemaScopeId": "root",
			"fields": []any{
				map[string]any{
					"id":         "occurred_at",
					"kind":       "date_time",
					"label":      "Occurred At",
					"storageKey": "occurred_at",
					"runtime": map[string]any{
						"sourceColumnName": "occurred_at",
						"sourceValueKind":  "scalar",
					},
				},
			},
			"runtime": map[string]any{
				"dataViewName": "vw_events",
				"rtAlias":      "events",
				"tableName":    "events",
			},
		},
		"subformScopes": []any{},
	}
	modelPayload["layoutBlueprint"] = map[string]any{
		"rootScope": map[string]any{
			"schemaScopeId": "root",
			"containers":    []any{},
			"fieldPlacements": []any{
				map[string]any{
					"containerKey": "__scope_root__",
					"fieldId":      "occurred_at",
					"order":        0,
				},
			},
			"unplacedFieldIds": []any{},
		},
		"subformScopes": []any{},
	}
	model.DefinitionJSON = mustJSON(t, modelPayload)

	viewPayload := mustDecodeJSONMap(t, view.DefinitionJSON)
	viewPayload["displayName"] = "Events"
	viewPayload["title"] = "Events"
	viewPayload["uiSchema"] = map[string]any{
		"rootScope": map[string]any{
			"schemaScopeId": "root",
			"runtime": map[string]any{
				"dataViewName": "vw_events",
				"gridViewName": "vg_events__default",
				"viewRtAlias":  "default",
			},
			"nodes": []any{
				map[string]any{
					"id":      "field-occurred-at",
					"type":    "field",
					"fieldId": "occurred_at",
					"title":   "When happened",
					"order":   0,
				},
			},
			"viewSettings": map[string]any{
				"list": map[string]any{
					"columns": []any{
						map[string]any{
							"fieldId": "occurred_at",
							"id":      "grid-column-occurred-at",
							"order":   0,
						},
					},
				},
			},
		},
		"subformScopes": []any{},
	}
	view.DefinitionJSON = mustJSON(t, viewPayload)

	svc := NewService(repo)
	out, err := svc.LoadRuntimeViewListMeta(rootTestContext(), model.ModelID, view.ViewID)
	if err != nil {
		t.Fatalf("LoadRuntimeViewListMeta returned error: %v", err)
	}
	if len(out.Fields) != 1 {
		t.Fatalf("field count = %d, want 1", len(out.Fields))
	}
	if out.Fields[0].Label != "When happened" {
		t.Fatalf("field label = %q, want %q", out.Fields[0].Label, "When happened")
	}
	if len(out.Columns) != 1 {
		t.Fatalf("column count = %d, want 1", len(out.Columns))
	}
	if out.Columns[0].Label != "When happened" {
		t.Fatalf("column label = %q, want %q", out.Columns[0].Label, "When happened")
	}
}

func TestLoadRuntimeViewListMetaAddsViewRowActionWhenCanViewEnabled(t *testing.T) {
	repo := newMemoryRepository()
	model, view := seedRootOnlyExternalModelAndDefaultView(t, repo, "events")
	repo.runtimeRelations[model.StorageKey] = "table"
	repo.runtimeRelationColumns[model.StorageKey] = map[string]struct{}{"guid": {}}

	modelPayload := mustDecodeJSONMap(t, model.DefinitionJSON)
	modelPayload["displayName"] = "Events"
	modelPayload["title"] = "Events"
	modelPayload["dataSchema"] = map[string]any{
		"modelId":    "events",
		"modelTitle": "Events",
		"rootScope": map[string]any{
			"schemaScopeId": "root",
			"fields": []any{
				map[string]any{
					"id":         "event",
					"kind":       "short_text",
					"label":      "Event",
					"storageKey": "event",
					"runtime": map[string]any{
						"sourceColumnName": "event",
						"sourceValueKind":  "scalar",
					},
				},
			},
			"runtime": map[string]any{
				"dataViewName":     "vw_events",
				"rtAlias":          "events",
				"tableName":        "events",
				"sourceGuidColumn": "guid",
			},
		},
		"subformScopes": []any{},
	}
	modelPayload["layoutBlueprint"] = map[string]any{
		"rootScope": map[string]any{
			"schemaScopeId": "root",
			"containers":    []any{},
			"fieldPlacements": []any{
				map[string]any{
					"containerKey": "__scope_root__",
					"fieldId":      "event",
					"order":        0,
				},
			},
			"unplacedFieldIds": []any{},
		},
		"subformScopes": []any{},
	}
	model.DefinitionJSON = mustJSON(t, modelPayload)

	viewPayload := mustDecodeJSONMap(t, view.DefinitionJSON)
	viewPayload["displayName"] = "Events"
	viewPayload["title"] = "Events"
	viewPayload["uiSchema"] = map[string]any{
		"rootScope": map[string]any{
			"schemaScopeId": "root",
			"runtime": map[string]any{
				"dataViewName": "vw_events",
				"gridViewName": "vg_events__default",
				"viewRtAlias":  "default",
			},
			"nodes": []any{
				map[string]any{
					"id":      "field-event",
					"type":    "field",
					"fieldId": "event",
					"order":   0,
				},
			},
			"viewSettings": map[string]any{
				"actions": map[string]any{
					"canView": true,
				},
				"list": map[string]any{
					"columns": []any{
						map[string]any{
							"fieldId": "event",
							"id":      "grid-column-event",
							"order":   0,
						},
					},
				},
			},
		},
		"subformScopes": []any{},
	}
	view.DefinitionJSON = mustJSON(t, viewPayload)

	svc := NewService(repo)
	out, err := svc.LoadRuntimeViewListMeta(rootTestContext(), model.ModelID, view.ViewID)
	if err != nil {
		t.Fatalf("LoadRuntimeViewListMeta returned error: %v", err)
	}
	if !out.Actions.Create.Visible {
		t.Fatal("create action should be visible when add is allowed and source guid is available")
	}
	if len(out.RowActions) != 2 {
		t.Fatalf("row action count = %d, want 2", len(out.RowActions))
	}
	if out.RowActions[0].ID != "edit" {
		t.Fatalf("row action id = %q, want %q", out.RowActions[0].ID, "edit")
	}
	if out.RowActions[0].Execution != "frontend" {
		t.Fatalf("row action execution = %q, want %q", out.RowActions[0].Execution, "frontend")
	}
	if out.RowActions[1].ID != "view" {
		t.Fatalf("row action id = %q, want %q", out.RowActions[1].ID, "view")
	}
	if out.RowActions[1].Execution != "frontend" {
		t.Fatalf("row action execution = %q, want %q", out.RowActions[1].Execution, "frontend")
	}
}

func TestLoadRuntimeViewListMetaHidesViewRowActionWithoutGuidEnabledSource(t *testing.T) {
	repo := newMemoryRepository()
	model, view := seedRootOnlyExternalModelAndDefaultView(t, repo, "events")
	repo.runtimeRelations[model.StorageKey] = "table"

	modelPayload := mustDecodeJSONMap(t, model.DefinitionJSON)
	modelPayload["displayName"] = "Events"
	modelPayload["title"] = "Events"
	modelPayload["dataSchema"] = map[string]any{
		"modelId":    "events",
		"modelTitle": "Events",
		"rootScope": map[string]any{
			"schemaScopeId": "root",
			"fields": []any{
				map[string]any{
					"id":         "event",
					"kind":       "short_text",
					"label":      "Event",
					"storageKey": "event",
					"runtime": map[string]any{
						"sourceColumnName": "event",
						"sourceValueKind":  "scalar",
					},
				},
			},
			"runtime": map[string]any{
				"dataViewName": "vw_events",
				"rtAlias":      "events",
				"tableName":    "events",
			},
		},
		"subformScopes": []any{},
	}
	modelPayload["layoutBlueprint"] = map[string]any{
		"rootScope": map[string]any{
			"schemaScopeId": "root",
			"containers":    []any{},
			"fieldPlacements": []any{
				map[string]any{
					"containerKey": "__scope_root__",
					"fieldId":      "event",
					"order":        0,
				},
			},
			"unplacedFieldIds": []any{},
		},
		"subformScopes": []any{},
	}
	model.DefinitionJSON = mustJSON(t, modelPayload)

	viewPayload := mustDecodeJSONMap(t, view.DefinitionJSON)
	viewPayload["displayName"] = "Events"
	viewPayload["title"] = "Events"
	viewPayload["uiSchema"] = map[string]any{
		"rootScope": map[string]any{
			"schemaScopeId": "root",
			"runtime": map[string]any{
				"dataViewName": "vw_events",
				"gridViewName": "vg_events__default",
				"viewRtAlias":  "default",
			},
			"nodes": []any{
				map[string]any{
					"id":      "field-event",
					"type":    "field",
					"fieldId": "event",
					"order":   0,
				},
			},
			"viewSettings": map[string]any{
				"actions": map[string]any{
					"canView": true,
				},
				"list": map[string]any{
					"columns": []any{
						map[string]any{
							"fieldId": "event",
							"id":      "grid-column-event",
							"order":   0,
						},
					},
				},
			},
		},
		"subformScopes": []any{},
	}
	view.DefinitionJSON = mustJSON(t, viewPayload)

	svc := NewService(repo)
	out, err := svc.LoadRuntimeViewListMeta(rootTestContext(), model.ModelID, view.ViewID)
	if err != nil {
		t.Fatalf("LoadRuntimeViewListMeta returned error: %v", err)
	}
	if out.Actions.Create.Visible {
		t.Fatal("create action should be hidden when source guid is unavailable")
	}
	if len(out.RowActions) != 0 {
		t.Fatalf("row action count = %d, want 0 when source guid is unavailable", len(out.RowActions))
	}
}

func TestLoadRuntimeViewRecordRequiresGuidEnabledSource(t *testing.T) {
	repo := newMemoryRepository()
	model, view := seedRootOnlyExternalModelAndDefaultView(t, repo, "events")
	repo.runtimeRelations[model.StorageKey] = "table"

	modelPayload := mustDecodeJSONMap(t, model.DefinitionJSON)
	modelPayload["displayName"] = "Events"
	modelPayload["title"] = "Events"
	modelPayload["dataSchema"] = map[string]any{
		"modelId":    "events",
		"modelTitle": "Events",
		"rootScope": map[string]any{
			"schemaScopeId": "root",
			"fields": []any{
				map[string]any{
					"id":         "event",
					"kind":       "short_text",
					"label":      "Event",
					"storageKey": "event",
					"runtime": map[string]any{
						"sourceColumnName": "event",
						"sourceValueKind":  "scalar",
					},
				},
			},
			"runtime": map[string]any{
				"dataViewName": "vw_events",
				"rtAlias":      "events",
				"tableName":    "events",
			},
		},
		"subformScopes": []any{},
	}
	modelPayload["layoutBlueprint"] = map[string]any{
		"rootScope": map[string]any{
			"schemaScopeId": "root",
			"containers":    []any{},
			"fieldPlacements": []any{
				map[string]any{
					"containerKey": "__scope_root__",
					"fieldId":      "event",
					"order":        0,
				},
			},
			"unplacedFieldIds": []any{},
		},
		"subformScopes": []any{},
	}
	model.DefinitionJSON = mustJSON(t, modelPayload)

	viewPayload := mustDecodeJSONMap(t, view.DefinitionJSON)
	viewPayload["displayName"] = "Events"
	viewPayload["title"] = "Events"
	viewPayload["uiSchema"] = map[string]any{
		"rootScope": map[string]any{
			"schemaScopeId": "root",
			"runtime": map[string]any{
				"dataViewName": "vw_events",
				"gridViewName": "vg_events__default",
				"viewRtAlias":  "default",
			},
			"nodes": []any{
				map[string]any{
					"id":      "field-event",
					"type":    "field",
					"fieldId": "event",
					"order":   0,
				},
			},
			"viewSettings": map[string]any{
				"actions": map[string]any{
					"canView": true,
				},
				"list": map[string]any{
					"columns": []any{
						map[string]any{
							"fieldId": "event",
							"id":      "grid-column-event",
							"order":   0,
						},
					},
				},
			},
		},
		"subformScopes": []any{},
	}
	view.DefinitionJSON = mustJSON(t, viewPayload)

	svc := NewService(repo)
	_, err := svc.LoadRuntimeViewRecord(rootTestContext(), model.ModelID, view.ViewID, "11111111-1111-1111-1111-111111111111")
	if !errors.Is(err, ErrRecordViewRequiresGUID) {
		t.Fatalf("LoadRuntimeViewRecord error = %v, want %v", err, ErrRecordViewRequiresGUID)
	}
}

func TestBuildRuntimeViewListDefaultSortUsesViewSorting(t *testing.T) {
	uiSchema := map[string]any{
		"rootScope": map[string]any{
			"schemaScopeId": "root",
			"viewSettings": map[string]any{
				"list": map[string]any{
					"sorting": map[string]any{
						"fieldId":   "occurred_at",
						"direction": "desc",
					},
				},
			},
		},
	}
	fields := []runtimeApplyFieldPlan{
		{
			FieldID:    "occurred_at",
			ColumnName: "occurred_at",
			StorageKey: "occurred_at",
			Kind:       "date_time",
			Supported:  true,
		},
	}
	gridPlan := &runtimeApplyGridViewPlan{
		Projections: []runtimeApplyGridColumnProjection{
			{AliasColumnName: "occurred_at"},
		},
	}

	column, direction := buildRuntimeViewListDefaultSort(uiSchema, fields, gridPlan)
	if column != "occurred_at" {
		t.Fatalf("column = %q, want %q", column, "occurred_at")
	}
	if direction != "desc" {
		t.Fatalf("direction = %q, want %q", direction, "desc")
	}
}

func TestBuildRuntimeViewListDefaultSortIgnoresFieldOutsideGridOutput(t *testing.T) {
	uiSchema := map[string]any{
		"rootScope": map[string]any{
			"schemaScopeId": "root",
			"viewSettings": map[string]any{
				"list": map[string]any{
					"sorting": map[string]any{
						"fieldId":   "hidden_field",
						"direction": "desc",
					},
				},
			},
		},
	}
	fields := []runtimeApplyFieldPlan{
		{FieldID: "visible_field", ColumnName: "visible_field", StorageKey: "visible_field", Kind: "short_text", Supported: true},
		{FieldID: "hidden_field", ColumnName: "hidden_field", StorageKey: "hidden_field", Kind: "short_text", Supported: true},
	}
	gridPlan := &runtimeApplyGridViewPlan{
		Projections: []runtimeApplyGridColumnProjection{
			{AliasColumnName: "visible_field"},
		},
	}

	column, direction := buildRuntimeViewListDefaultSort(uiSchema, fields, gridPlan)
	if column != "" {
		t.Fatalf("column = %q, want empty", column)
	}
	if direction != "" {
		t.Fatalf("direction = %q, want empty", direction)
	}
}

func TestRuntimeViewListFieldTypePreservesBoolean(t *testing.T) {
	if got := runtimeViewListFieldType("boolean"); got != "boolean" {
		t.Fatalf("runtimeViewListFieldType(boolean) = %q, want boolean", got)
	}
}

func TestBuildRuntimeViewRecordFieldsAndSubtablesUseVisibleNodesOnly(t *testing.T) {
	rootScope := map[string]any{
		"nodes": []any{
			map[string]any{"id": "field-visible", "type": "field", "fieldId": "visible_field", "title": "Visible Override", "order": 0},
			map[string]any{"id": "field-hidden", "type": "field", "fieldId": "hidden_field", "visibility": "hidden", "order": 1},
			map[string]any{"id": "subform-notes", "type": "subform", "schemaScopeId": "notes_scope", "title": "Notes", "order": 2},
		},
	}
	rootFields := []runtimeApplyFieldPlan{
		{FieldID: "visible_field", ColumnName: "visible_field", StorageKey: "visible_field", Kind: "short_text", Supported: true},
		{FieldID: "hidden_field", ColumnName: "hidden_field", StorageKey: "hidden_field", Kind: "short_text", Supported: true},
	}
	rootLabels := map[string]string{
		"visible_field": "Visible Label",
		"hidden_field":  "Hidden Label",
	}

	fields := buildRuntimeViewRecordFields(rootScope, rootFields, rootLabels)
	if len(fields) != 1 {
		t.Fatalf("record field count = %d, want 1", len(fields))
	}
	if fields[0].FieldID != "visible_field" {
		t.Fatalf("record field id = %q, want %q", fields[0].FieldID, "visible_field")
	}
	if fields[0].Label != "Visible Override" {
		t.Fatalf("record field label = %q, want %q", fields[0].Label, "Visible Override")
	}

	uiSchema := map[string]any{
		"rootScope": rootScope,
		"subformScopes": []any{
			map[string]any{
				"schemaScopeId": "notes_scope",
				"nodes": []any{
					map[string]any{"id": "field-note", "type": "field", "fieldId": "note_text", "title": "Note", "order": 0},
					map[string]any{"id": "field-secret", "type": "field", "fieldId": "secret_note", "visibility": "hidden", "order": 1},
				},
			},
		},
	}
	dataSchema := map[string]any{
		"subformScopes": []any{
			map[string]any{
				"schemaScopeId": "notes_scope",
				"fields": []any{
					map[string]any{"id": "note_text", "label": "Note Text"},
					map[string]any{"id": "secret_note", "label": "Secret Note"},
				},
			},
		},
	}
	subtables := buildRuntimeViewRecordSubtables(uiSchema, dataSchema, []runtimeApplyScopePlan{
		{
			ScopeID:      "notes_scope",
			DataViewName: "vw_example__notes",
			Fields: []runtimeApplyFieldPlan{
				{FieldID: "note_text", ColumnName: "note_text", StorageKey: "note_text", Kind: "long_text", Supported: true},
				{FieldID: "secret_note", ColumnName: "secret_note", StorageKey: "secret_note", Kind: "long_text", Supported: true},
			},
		},
	})
	if len(subtables) != 1 {
		t.Fatalf("subtable count = %d, want 1", len(subtables))
	}
	if subtables[0].Title != "Notes" {
		t.Fatalf("subtable title = %q, want %q", subtables[0].Title, "Notes")
	}
	if len(subtables[0].Columns) != 1 {
		t.Fatalf("subtable column count = %d, want 1", len(subtables[0].Columns))
	}
	if subtables[0].Columns[0].FieldID != "note_text" {
		t.Fatalf("subtable column fieldId = %q, want %q", subtables[0].Columns[0].FieldID, "note_text")
	}
}

func TestSaveDraftBuildsRuntimeApplyPlanForManagedRootAndSubformScopes(t *testing.T) {
	repo := newMemoryRepository()
	model, view := seedCanonicalModelAndDefaultView(t, repo)
	svc := NewService(repo)

	if _, err := svc.CreateView(testContext(), model.ModelID, CreateViewRequest{Title: "Operations"}); err != nil {
		t.Fatalf("CreateView returned error: %v", err)
	}

	modelPayload := mustDecodeJSONMap(t, model.DefinitionJSON)
	viewPayload := mustDecodeJSONMap(t, view.DefinitionJSON)

	out, err := svc.SaveDraft(testContext(), model.ModelID, view.ViewID, SaveDraftRequest{
		Draft: DraftPayload{
			Model: mustJSON(t, modelPayload),
			View:  mustJSON(t, viewPayload),
		},
		ExpectedVersions: ExpectedVersions{
			Model: int64Ptr(model.Version),
			View:  int64Ptr(view.Version),
		},
	})
	if err != nil {
		t.Fatalf("SaveDraft returned error: %v", err)
	}

	if out.RuntimeApply == nil {
		t.Fatalf("expected runtime apply summary in save response")
	}
	if out.RuntimeApply.Status != "applied" {
		t.Fatalf("runtime apply status = %q, want %q", out.RuntimeApply.Status, "applied")
	}
	if repo.lastRuntimePlan == nil {
		t.Fatalf("expected runtime plan to be captured by memory repo")
	}

	plan := repo.lastRuntimePlan
	if plan.ModelRuntimeAlias != "site_audit" {
		t.Fatalf("runtime plan model runtime alias = %q, want %q", plan.ModelRuntimeAlias, "site_audit")
	}
	if plan.RootScope.TableName != "ps_site_audit" {
		t.Fatalf("root table name = %q, want %q", plan.RootScope.TableName, "ps_site_audit")
	}
	if plan.RootScope.DataViewName != "vw_site_audit" {
		t.Fatalf("root data view = %q, want %q", plan.RootScope.DataViewName, "vw_site_audit")
	}
	if !containsGridViewPlan(plan.RootScope.GridViews, "vg_site_audit__default") {
		t.Fatalf("expected default root grid view, got %#v", plan.RootScope.GridViews)
	}
	if !containsGridViewPlan(plan.RootScope.GridViews, "vg_site_audit__operations") {
		t.Fatalf("expected operations root grid view, got %#v", plan.RootScope.GridViews)
	}
	if len(plan.SubformScopes) != 1 {
		t.Fatalf("expected one subform scope in runtime plan, got %#v", plan.SubformScopes)
	}

	subform := plan.SubformScopes[0]
	scopeRtAlias := buildGeneratedRuntimeScopeAlias("pb_info")
	if subform.TableName != "ps_site_audit__"+scopeRtAlias {
		t.Fatalf("subform table name = %q, want %q", subform.TableName, "ps_site_audit__"+scopeRtAlias)
	}
	if subform.ParentForeignKey != "_parent_id" {
		t.Fatalf("subform parent foreign key = %q, want %q", subform.ParentForeignKey, "_parent_id")
	}
	if subform.DataViewName != "vw_site_audit__"+scopeRtAlias {
		t.Fatalf("subform data view = %q, want %q", subform.DataViewName, "vw_site_audit__"+scopeRtAlias)
	}
	if !containsGridViewPlan(subform.GridViews, "vg_site_audit__"+scopeRtAlias+"__default") {
		t.Fatalf("expected default subform grid view, got %#v", subform.GridViews)
	}
	if !containsGridViewPlan(subform.GridViews, "vg_site_audit__"+scopeRtAlias+"__operations") {
		t.Fatalf("expected operations subform grid view, got %#v", subform.GridViews)
	}

	savedModel := mustDecodeJSONMap(t, out.Draft.Model)
	savedRootRuntime := asMap(asMap(asMap(savedModel["dataSchema"])["rootScope"])["runtime"])
	if normalizeString(savedRootRuntime["dataViewName"]) != "vw_site_audit" {
		t.Fatalf("saved root runtime data view = %#v", savedRootRuntime)
	}
	savedSubformRuntime := asMap(asMap(asSlice(asMap(savedModel["dataSchema"])["subformScopes"])[0])["runtime"])
	if normalizeString(savedSubformRuntime["rtAlias"]) != scopeRtAlias {
		t.Fatalf("saved subform runtime = %#v, want alias %q", savedSubformRuntime, scopeRtAlias)
	}
	savedView := mustDecodeJSONMap(t, out.Draft.View)
	savedViewRootRuntime := asMap(asMap(asMap(savedView["uiSchema"])["rootScope"])["runtime"])
	if normalizeString(savedViewRootRuntime["gridViewName"]) != "vg_site_audit__default" {
		t.Fatalf("saved root ui runtime = %#v", savedViewRootRuntime)
	}

	rootFieldFound := false
	for _, field := range plan.RootScope.Fields {
		if field.FieldID != "site-name" {
			continue
		}
		rootFieldFound = true
		if field.ColumnName != "site_name" || field.PhysicalType != "text" || !field.Supported {
			t.Fatalf("unexpected root field runtime plan: %#v", field)
		}
	}
	if !rootFieldFound {
		t.Fatalf("expected site-name root field in runtime plan, got %#v", plan.RootScope.Fields)
	}

	subformFieldFound := false
	for _, field := range subform.Fields {
		if field.FieldID != "info-date" {
			continue
		}
		subformFieldFound = true
		if field.ColumnName != "info_date" || field.PhysicalType != "date" || !field.Supported {
			t.Fatalf("unexpected subform field runtime plan: %#v", field)
		}
	}
	if !subformFieldFound {
		t.Fatalf("expected info-date subform field in runtime plan, got %#v", subform.Fields)
	}
}

func TestSaveDraftBuildsRuntimeApplyPlanForManagedCompactSubformPayload(t *testing.T) {
	repo := newMemoryRepository()
	svc := NewService(repo)

	modelPayload := map[string]any{
		"id":          "test-inspection",
		"key":         "test-inspection",
		"storageKey":  "test_inspection",
		"displayName": "Test Inspection",
		"sourceType":  "managed",
		"dataSchema": map[string]any{
			"modelId":    "test-inspection",
			"modelTitle": "Test Inspection",
			"rootScope": map[string]any{
				"fields": []any{
					map[string]any{"id": "short-text", "kind": "short_text", "label": "First Name", "storageKey": "first_name"},
					map[string]any{"id": "short-text-2", "kind": "short_text", "label": "Last Name", "storageKey": "last_name"},
					map[string]any{"id": "long-text", "kind": "long_text", "label": "Information", "storageKey": "long_text"},
					map[string]any{
						"id":            "reported-by",
						"kind":          "db_lookup",
						"label":         "Reported By",
						"preset":        "contact_lookup",
						"selectionMode": "single",
						"semanticRole":  "reportedBy",
						"storageKey":    "reported_by",
						"displayFields": []any{"Full name", "Email"},
						"sourceFilters": []any{"Only active contacts"},
						"sourceLabel":   "Contacts",
					},
					map[string]any{
						"id":          "suggest-text",
						"kind":        "short_text",
						"label":       "City",
						"preset":      "suggest_text",
						"storageKey":  "city",
						"placeholder": "Start typing",
						"suggestConfig": map[string]any{
							"allowCustomValue": true,
							"maxResults":       int64(20),
							"minQueryLength":   int64(1),
							"searchMode":       "contains",
							"sourceMode":       "same_field_distinct_values",
						},
					},
				},
				"runtime": map[string]any{
					"dataViewName": "vw_test_inspection",
					"rtAlias":      "test_inspection",
					"tableName":    "ps_test_inspection",
					"mvTableName":  "ps_test_inspection__mv",
				},
				"schemaScopeId": "root",
			},
			"subformScopes": []any{
				map[string]any{
					"displayName": "List",
					"fields": []any{
						map[string]any{
							"id":           "email",
							"kind":         "short_text",
							"label":        "Email",
							"autocomplete": "email",
							"inputMode":    "email",
							"placeholder":  "name@example.com",
							"preset":       "email",
							"storageKey":   "email",
							"validation":   "email",
						},
						map[string]any{
							"id":           "phone",
							"kind":         "short_text",
							"label":        "Phone",
							"autocomplete": "tel",
							"inputMode":    "tel",
							"mask":         "(999) 999-9999",
							"placeholder":  "(555) 555-5555",
							"preset":       "phone",
							"storageKey":   "phone",
							"validation":   "phone",
						},
					},
					"runtime": map[string]any{
						"dataViewName": "vw_test_inspection__sf_9bcecc",
						"rtAlias":      "sf_9bcecc",
						"tableName":    "ps_test_inspection__sf_9bcecc",
						"mvTableName":  "ps_test_inspection__sf_9bcecc__mv",
					},
					"schemaScopeId": "subform-1776345591409-hhu9uz",
					"subformType":   "DEFAULT",
					"tableKey":      "subform-1776345591409-hhu9uz",
				},
			},
		},
		"layoutBlueprint": map[string]any{
			"rootScope": map[string]any{
				"containers": []any{
					map[string]any{
						"containerKey":  "root.subform.list",
						"order":         int64(5),
						"title":         "List",
						"type":          "subform",
						"displayName":   "List",
						"schemaScopeId": "subform-1776345591409-hhu9uz",
						"subformType":   "DEFAULT",
						"tableKey":      "subform-1776345591409-hhu9uz",
					},
				},
				"fieldPlacements": []any{
					map[string]any{"containerKey": "__scope_root__", "fieldId": "short-text", "order": int64(0)},
					map[string]any{"containerKey": "__scope_root__", "fieldId": "short-text-2", "order": int64(1)},
					map[string]any{"containerKey": "__scope_root__", "fieldId": "long-text", "order": int64(2)},
					map[string]any{"containerKey": "__scope_root__", "fieldId": "reported-by", "order": int64(3)},
					map[string]any{"containerKey": "__scope_root__", "fieldId": "suggest-text", "order": int64(4)},
				},
				"schemaScopeId": "root",
			},
			"subformScopes": []any{
				map[string]any{
					"containers": []any{},
					"fieldPlacements": []any{
						map[string]any{"containerKey": "__scope_root__", "fieldId": "email", "order": int64(0)},
						map[string]any{"containerKey": "__scope_root__", "fieldId": "phone", "order": int64(1)},
					},
					"schemaScopeId": "subform-1776345591409-hhu9uz",
				},
			},
		},
	}
	viewPayload := map[string]any{
		"id":          "view-default",
		"key":         "default",
		"modelId":     "test-inspection",
		"displayName": "Test Inspection",
		"kind":        "form",
		"isDefault":   true,
		"isActive":    true,
		"uiSchema": map[string]any{
			"rootScope": map[string]any{
				"nodes": []any{
					map[string]any{"fieldId": "short-text", "id": "field-1", "order": int64(0), "type": "field"},
					map[string]any{"fieldId": "short-text-2", "id": "field-2", "order": int64(1), "type": "field"},
					map[string]any{"fieldId": "long-text", "id": "field-3", "order": int64(2), "type": "field"},
					map[string]any{"fieldId": "reported-by", "id": "field-4", "order": int64(3), "type": "field"},
					map[string]any{"fieldId": "suggest-text", "id": "field-5", "order": int64(4), "type": "field"},
					map[string]any{
						"containerKey":  "root.subform.list",
						"id":            "subform-1776345591409-hhu9uz",
						"order":         int64(5),
						"schemaScopeId": "subform-1776345591409-hhu9uz",
						"subformType":   "DEFAULT",
						"tableKey":      "subform-1776345591409-hhu9uz",
						"title":         "List",
						"type":          "subform",
					},
				},
				"schemaScopeId": "root",
				"runtime": map[string]any{
					"dataViewName": "vw_test_inspection",
					"gridViewName": "vg_test_inspection__default",
					"viewRtAlias":  "default",
				},
				"systemFields": map[string]any{
					"reportedBy": map[string]any{"fieldId": "reported-by"},
					"version":    int64(1),
				},
				"viewSettings": map[string]any{
					"list": map[string]any{
						"columns": []any{
							map[string]any{"fieldId": "short-text", "id": "grid-column-1", "order": int64(0)},
							map[string]any{"fieldId": "short-text-2", "id": "grid-column-2", "order": int64(1)},
							map[string]any{"fieldId": "long-text", "id": "grid-column-3", "order": int64(2)},
							map[string]any{"fieldId": "reported-by", "id": "grid-column-4", "order": int64(3)},
							map[string]any{"fieldId": "reported-by::lookup_output::label", "id": "grid-column-5", "order": int64(4)},
							map[string]any{"fieldId": "reported-by::lookup_output::title", "id": "grid-column-6", "order": int64(5)},
							map[string]any{"fieldId": "reported-by::lookup_output::phone", "id": "grid-column-7", "order": int64(6)},
							map[string]any{"fieldId": "suggest-text", "id": "grid-column-8", "order": int64(7)},
						},
					},
				},
			},
			"subformScopes": []any{
				map[string]any{
					"nodes": []any{
						map[string]any{"id": "field-sub-1", "order": int64(0), "type": "field", "fieldId": "email"},
						map[string]any{"id": "field-sub-2", "order": int64(1), "type": "field", "fieldId": "phone"},
					},
					"schemaScopeId":       "subform-1776345591409-hhu9uz",
					"parentSubformNodeId": "subform-1776345591409-hhu9uz",
					"runtime": map[string]any{
						"dataViewName": "vw_test_inspection__sf_9bcecc",
						"gridViewName": "vg_test_inspection__sf_9bcecc__default",
						"viewRtAlias":  "default",
					},
					"subformType": "DEFAULT",
					"tableKey":    "subform-1776345591409-hhu9uz",
				},
			},
		},
	}

	model := &ModelRecord{
		ModelID:          "test-inspection",
		ModelKey:         "test-inspection",
		StorageKey:       "test_inspection",
		DisplayName:      "Test Inspection",
		SourceType:       "managed",
		Version:          1,
		StructureVersion: 1,
		DefinitionJSON:   mustJSON(t, modelPayload),
	}
	view := &ViewRecord{
		ModelID:                          model.ModelID,
		ViewID:                           "view-default",
		ViewKey:                          "default",
		DisplayName:                      "Test Inspection",
		ViewType:                         "form",
		IsActive:                         true,
		IsDefault:                        true,
		Version:                          1,
		LastAlignedModelStructureVersion: 1,
		DefinitionJSON:                   mustJSON(t, viewPayload),
	}
	repo.models[model.ModelID] = model
	repo.views[model.ModelID] = map[string]*ViewRecord{view.ViewID: view}

	out, err := svc.SaveDraft(testContext(), model.ModelID, view.ViewID, SaveDraftRequest{
		Draft: DraftPayload{
			Model: mustJSON(t, modelPayload),
			View:  mustJSON(t, viewPayload),
		},
		ExpectedVersions: ExpectedVersions{
			Model: int64Ptr(model.Version),
			View:  int64Ptr(view.Version),
		},
	})
	if err != nil {
		t.Fatalf("SaveDraft returned error: %v", err)
	}
	if out.RuntimeApply == nil || out.RuntimeApply.Status != "applied" {
		t.Fatalf("runtime apply summary = %#v, want applied", out.RuntimeApply)
	}
	if repo.lastRuntimePlan == nil {
		t.Fatalf("expected runtime plan to be captured")
	}
	if len(repo.lastRuntimePlan.SubformScopes) != 1 {
		t.Fatalf("expected one subform scope, got %#v", repo.lastRuntimePlan.SubformScopes)
	}
	subform := repo.lastRuntimePlan.SubformScopes[0]
	if subform.TableName != "ps_test_inspection__sf_9bcecc" {
		t.Fatalf("subform table name = %q, want %q", subform.TableName, "ps_test_inspection__sf_9bcecc")
	}
	if subform.DataViewName != "vw_test_inspection__sf_9bcecc" {
		t.Fatalf("subform data view = %q, want %q", subform.DataViewName, "vw_test_inspection__sf_9bcecc")
	}
	if !containsGridViewPlan(subform.GridViews, "vg_test_inspection__sf_9bcecc__default") {
		t.Fatalf("expected default subform grid view, got %#v", subform.GridViews)
	}
}

func TestSaveDraftPreservesPersistedRuntimeMetadataWhenRequestOmitsRuntime(t *testing.T) {
	repo := newMemoryRepository()
	model, view := seedCanonicalModelAndDefaultView(t, repo)
	svc := NewService(repo)

	storedModelPayload := mustDecodeJSONMap(t, model.DefinitionJSON)
	storedDataSchema := asMap(storedModelPayload["dataSchema"])
	storedRootScope := asMap(storedDataSchema["rootScope"])
	storedRootScope["runtime"] = map[string]any{
		"rtAlias":      "site_audit_live",
		"tableName":    "ps_site_audit_live",
		"mvTableName":  "ps_site_audit_live__mv",
		"dataViewName": "vw_site_audit_live",
	}
	storedSubformScope := asMap(asSlice(storedDataSchema["subformScopes"])[0])
	storedSubformScope["runtime"] = map[string]any{
		"rtAlias":      "sf_custom9a",
		"tableName":    "ps_site_audit_live__sf_custom9a",
		"mvTableName":  "ps_site_audit_live__sf_custom9a__mv",
		"dataViewName": "vw_site_audit_live__sf_custom9a",
	}
	model.DefinitionJSON = mustJSON(t, storedModelPayload)
	repo.models[model.ModelID] = model

	storedViewPayload := mustDecodeJSONMap(t, view.DefinitionJSON)
	storedUISchema := asMap(storedViewPayload["uiSchema"])
	asMap(storedUISchema["rootScope"])["runtime"] = map[string]any{
		"viewRtAlias":  "default",
		"dataViewName": "vw_site_audit_live",
		"gridViewName": "vg_site_audit_live__default",
	}
	asMap(asSlice(storedUISchema["subformScopes"])[0])["runtime"] = map[string]any{
		"viewRtAlias":  "default",
		"dataViewName": "vw_site_audit_live__sf_custom9a",
		"gridViewName": "vg_site_audit_live__sf_custom9a__default",
	}
	view.DefinitionJSON = mustJSON(t, storedViewPayload)
	repo.views[model.ModelID][view.ViewID] = view

	incomingModelPayload := mustDecodeJSONMap(t, model.DefinitionJSON)
	incomingDataSchema := asMap(incomingModelPayload["dataSchema"])
	delete(asMap(incomingDataSchema["rootScope"]), "runtime")
	delete(asMap(asSlice(incomingDataSchema["subformScopes"])[0]), "runtime")

	incomingViewPayload := mustDecodeJSONMap(t, view.DefinitionJSON)
	incomingUISchema := asMap(incomingViewPayload["uiSchema"])
	delete(asMap(incomingUISchema["rootScope"]), "runtime")
	delete(asMap(asSlice(incomingUISchema["subformScopes"])[0]), "runtime")

	out, err := svc.SaveDraft(testContext(), model.ModelID, view.ViewID, SaveDraftRequest{
		Draft: DraftPayload{
			Model: mustJSON(t, incomingModelPayload),
			View:  mustJSON(t, incomingViewPayload),
		},
		ExpectedVersions: ExpectedVersions{
			Model: int64Ptr(model.Version),
			View:  int64Ptr(view.Version),
		},
	})
	if err != nil {
		t.Fatalf("SaveDraft returned error: %v", err)
	}

	savedModel := mustDecodeJSONMap(t, out.Draft.Model)
	savedRootRuntime := asMap(asMap(asMap(savedModel["dataSchema"])["rootScope"])["runtime"])
	if normalizeString(savedRootRuntime["tableName"]) != "ps_site_audit_live" {
		t.Fatalf("saved root runtime = %#v", savedRootRuntime)
	}
	savedSubformRuntime := asMap(asMap(asSlice(asMap(savedModel["dataSchema"])["subformScopes"])[0])["runtime"])
	if normalizeString(savedSubformRuntime["tableName"]) != "ps_site_audit_live__sf_custom9a" {
		t.Fatalf("saved subform runtime = %#v", savedSubformRuntime)
	}

	savedView := mustDecodeJSONMap(t, out.Draft.View)
	savedRootViewRuntime := asMap(asMap(asMap(savedView["uiSchema"])["rootScope"])["runtime"])
	if normalizeString(savedRootViewRuntime["gridViewName"]) != "vg_site_audit_live__default" {
		t.Fatalf("saved root ui runtime = %#v", savedRootViewRuntime)
	}
	savedSubformViewRuntime := asMap(asMap(asSlice(asMap(savedView["uiSchema"])["subformScopes"])[0])["runtime"])
	if normalizeString(savedSubformViewRuntime["gridViewName"]) != "vg_site_audit_live__sf_custom9a__default" {
		t.Fatalf("saved subform ui runtime = %#v", savedSubformViewRuntime)
	}

	if repo.lastRuntimePlan == nil {
		t.Fatalf("expected runtime plan to be captured")
	}
	if repo.lastRuntimePlan.RootScope.TableName != "ps_site_audit_live" {
		t.Fatalf("runtime plan root table = %q, want %q", repo.lastRuntimePlan.RootScope.TableName, "ps_site_audit_live")
	}
	if repo.lastRuntimePlan.SubformScopes[0].ParentForeignKey != "_parent_id" {
		t.Fatalf("runtime plan subform parent fk = %q, want %q", repo.lastRuntimePlan.SubformScopes[0].ParentForeignKey, "_parent_id")
	}
}

func TestSaveDraftRejectsRuntimeRelationNameConflicts(t *testing.T) {
	repo := newMemoryRepository()
	model, view := seedCanonicalModelAndDefaultView(t, repo)
	svc := NewService(repo)

	conflictingModel := cloneModelRecord(model)
	conflictingModel.ModelID = "other-audit"
	conflictingModel.ModelKey = "other-audit"
	conflictingModel.StorageKey = "other_audit"
	conflictingModel.DisplayName = "Other Audit"
	conflictingModel.DefinitionJSON = mustJSON(t, map[string]any{
		"id":          "other-audit",
		"key":         "other-audit",
		"storageKey":  "other_audit",
		"displayName": "Other Audit",
		"sourceType":  "managed",
		"dataSchema": map[string]any{
			"modelId":    "other-audit",
			"modelTitle": "Other Audit",
			"rootScope": map[string]any{
				"fields":        []any{},
				"schemaScopeId": "root",
				"scopeType":     "ROOT",
				"runtime": map[string]any{
					"rtAlias":      "conflict_alias",
					"tableName":    "ps_site_audit",
					"mvTableName":  "ps_site_audit__mv",
					"dataViewName": "vw_conflict_alias",
				},
			},
			"subformScopes": []any{},
		},
		"layoutBlueprint": emptyLayoutBlueprint(),
	})
	repo.models[conflictingModel.ModelID] = &conflictingModel

	conflictingView := cloneViewRecord(view)
	conflictingView.ModelID = conflictingModel.ModelID
	conflictingView.ViewID = "view-other-default"
	conflictingView.ViewKey = "default"
	conflictingView.DisplayName = "Other Default"
	conflictingView.DefinitionJSON = mustJSON(t, map[string]any{
		"id":          conflictingView.ViewID,
		"key":         "default",
		"modelId":     conflictingModel.ModelID,
		"displayName": conflictingView.DisplayName,
		"kind":        "form",
		"isDefault":   true,
		"isActive":    true,
		"uiSchema": map[string]any{
			"rootScope": map[string]any{
				"schemaScopeId": "root",
				"nodes":         []any{},
				"runtime": map[string]any{
					"viewRtAlias":  "default",
					"dataViewName": "vw_conflict_alias",
					"gridViewName": "vg_other_audit__default",
				},
			},
			"subformScopes": []any{},
		},
	})
	repo.views[conflictingModel.ModelID] = map[string]*ViewRecord{
		conflictingView.ViewID: &conflictingView,
	}

	modelPayload := mustDecodeJSONMap(t, model.DefinitionJSON)
	viewPayload := mustDecodeJSONMap(t, view.DefinitionJSON)

	_, err := svc.SaveDraft(testContext(), model.ModelID, view.ViewID, SaveDraftRequest{
		Draft: DraftPayload{
			Model: mustJSON(t, modelPayload),
			View:  mustJSON(t, viewPayload),
		},
		ExpectedVersions: ExpectedVersions{
			Model: int64Ptr(model.Version),
			View:  int64Ptr(view.Version),
		},
	})
	if !errors.Is(err, ErrRuntimeNameConflict) {
		t.Fatalf("SaveDraft error = %v, want %v", err, ErrRuntimeNameConflict)
	}
}

func TestSaveDraftRejectsPhysicalRuntimeRelationConflictsOutsideManagedMetadata(t *testing.T) {
	repo := newMemoryRepository()
	model, view := seedCanonicalModelAndDefaultView(t, repo)
	svc := NewService(repo)

	repo.runtimeRelations["ps_external_conflict"] = "table"
	repo.runtimeRelations["vw_external_conflict"] = "view"
	repo.runtimeRelations["vg_external_conflict__default"] = "view"

	modelPayload := mustDecodeJSONMap(t, model.DefinitionJSON)
	rootScope := asMap(asMap(modelPayload["dataSchema"])["rootScope"])
	rootScope["runtime"] = map[string]any{
		"rtAlias":      "external_conflict",
		"tableName":    "ps_external_conflict",
		"mvTableName":  "ps_external_conflict__mv",
		"dataViewName": "vw_external_conflict",
	}

	viewPayload := mustDecodeJSONMap(t, view.DefinitionJSON)
	asMap(asMap(viewPayload["uiSchema"])["rootScope"])["runtime"] = map[string]any{
		"viewRtAlias":  "default",
		"dataViewName": "vw_external_conflict",
		"gridViewName": "vg_external_conflict__default",
	}

	_, err := svc.SaveDraft(testContext(), model.ModelID, view.ViewID, SaveDraftRequest{
		Draft: DraftPayload{
			Model: mustJSON(t, modelPayload),
			View:  mustJSON(t, viewPayload),
		},
		ExpectedVersions: ExpectedVersions{
			Model: int64Ptr(model.Version),
			View:  int64Ptr(view.Version),
		},
	})
	if !errors.Is(err, ErrRuntimeNameConflict) {
		t.Fatalf("SaveDraft error = %v, want %v", err, ErrRuntimeNameConflict)
	}
}

func TestSaveDraftAllowsExternalSourceTableReuse(t *testing.T) {
	repo := newMemoryRepository()
	model := &ModelRecord{
		ModelID:          "users-model",
		ModelKey:         "users-model",
		StorageKey:       "users",
		DisplayName:      "Users",
		SourceType:       "managed",
		Version:          1,
		StructureVersion: 1,
		DefinitionJSON: mustJSON(t, map[string]any{
			"id":          "users-model",
			"key":         "users-model",
			"storageKey":  "users",
			"displayName": "Users",
			"sourceType":  "managed",
			"dataSchema": map[string]any{
				"modelId":    "users-model",
				"modelTitle": "Users",
				"rootScope": map[string]any{
					"fields":        []any{},
					"schemaScopeId": "root",
					"scopeType":     "ROOT",
				},
				"subformScopes": []any{},
			},
			"layoutBlueprint": emptyLayoutBlueprint(),
		}),
	}
	view := &ViewRecord{
		ModelID:                          model.ModelID,
		ViewID:                           "view-default",
		ViewKey:                          "default",
		DisplayName:                      "Users",
		ViewType:                         "form",
		IsActive:                         true,
		IsDefault:                        true,
		Version:                          1,
		LastAlignedModelStructureVersion: 1,
		DefinitionJSON: mustJSON(t, map[string]any{
			"id":          "view-default",
			"key":         "default",
			"modelId":     "users-model",
			"displayName": "Users",
			"kind":        "form",
			"isDefault":   true,
			"isActive":    true,
			"uiSchema": map[string]any{
				"rootScope": map[string]any{
					"schemaScopeId": "root",
					"nodes":         []any{},
				},
				"subformScopes": []any{},
			},
		}),
	}
	repo.models[model.ModelID] = model
	repo.views[model.ModelID] = map[string]*ViewRecord{view.ViewID: view}
	svc := NewService(repo)

	repo.runtimeRelations["users"] = "table"

	modelPayload := mustDecodeJSONMap(t, model.DefinitionJSON)
	modelPayload["sourceType"] = "external"
	rootScope := asMap(asMap(modelPayload["dataSchema"])["rootScope"])
	rootScope["runtime"] = map[string]any{
		"rtAlias":      "users",
		"tableName":    "users",
		"mvTableName":  "",
		"dataViewName": "vw_users",
	}

	viewPayload := mustDecodeJSONMap(t, view.DefinitionJSON)
	asMap(asMap(viewPayload["uiSchema"])["rootScope"])["runtime"] = map[string]any{
		"viewRtAlias":  "default",
		"dataViewName": "vw_users",
		"gridViewName": "vg_users__default",
	}

	out, err := svc.SaveDraft(testContext(), model.ModelID, view.ViewID, SaveDraftRequest{
		Draft: DraftPayload{
			Model: mustJSON(t, modelPayload),
			View:  mustJSON(t, viewPayload),
		},
		ExpectedVersions: ExpectedVersions{
			Model: int64Ptr(model.Version),
			View:  int64Ptr(view.Version),
		},
	})
	if err != nil {
		t.Fatalf("SaveDraft returned error: %v", err)
	}
	if repo.lastRuntimePlan == nil {
		t.Fatalf("expected runtime plan to be captured")
	}
	if repo.lastRuntimePlan.ModelSourceType != "external" {
		t.Fatalf("runtime source type = %q, want %q", repo.lastRuntimePlan.ModelSourceType, "external")
	}
	if repo.lastRuntimePlan.RootScope.TableName != "users" {
		t.Fatalf("runtime table name = %q, want %q", repo.lastRuntimePlan.RootScope.TableName, "users")
	}
	if repo.lastRuntimePlan.RootScope.SourceTenantIDColumn != "tenant_id" {
		t.Fatalf("runtime tenant source column = %q, want %q", repo.lastRuntimePlan.RootScope.SourceTenantIDColumn, "tenant_id")
	}
	if out.RuntimeApply == nil || out.RuntimeApply.Status != "applied" {
		t.Fatalf("runtime apply summary = %#v, want applied", out.RuntimeApply)
	}
}

func TestSaveDraftBuildsRuntimeApplyPlanForExternalGlobalSourceTable(t *testing.T) {
	repo := newMemoryRepository()
	model := &ModelRecord{
		ModelID:          "state-model",
		ModelKey:         "state-model",
		StorageKey:       "state",
		DisplayName:      "State",
		SourceType:       "managed",
		Version:          1,
		StructureVersion: 1,
		DefinitionJSON: mustJSON(t, map[string]any{
			"id":          "state-model",
			"key":         "state-model",
			"storageKey":  "state",
			"displayName": "State",
			"sourceType":  "managed",
			"dataSchema": map[string]any{
				"modelId":    "state-model",
				"modelTitle": "State",
				"rootScope": map[string]any{
					"fields": []any{
						map[string]any{"displayName": "Name", "id": "name", "key": "name", "kind": "short_text", "label": "Name", "schemaScopeId": "root", "storageKey": "name"},
					},
					"schemaScopeId": "root",
					"scopeType":     "ROOT",
				},
				"subformScopes": []any{},
			},
			"layoutBlueprint": emptyLayoutBlueprint(),
		}),
	}
	view := &ViewRecord{
		ModelID:                          model.ModelID,
		ViewID:                           "view-default",
		ViewKey:                          "default",
		DisplayName:                      "State",
		ViewType:                         "form",
		IsActive:                         true,
		IsDefault:                        true,
		Version:                          1,
		LastAlignedModelStructureVersion: 1,
		DefinitionJSON: mustJSON(t, map[string]any{
			"id":          "view-default",
			"key":         "default",
			"modelId":     "state-model",
			"displayName": "State",
			"kind":        "form",
			"isDefault":   true,
			"isActive":    true,
			"uiSchema": map[string]any{
				"rootScope": map[string]any{
					"schemaScopeId": "root",
					"nodes":         []any{},
				},
				"subformScopes": []any{},
			},
		}),
	}
	repo.models[model.ModelID] = model
	repo.views[model.ModelID] = map[string]*ViewRecord{view.ViewID: view}
	repo.runtimeRelations["state"] = "table"
	svc := NewService(repo)

	modelPayload := mustDecodeJSONMap(t, model.DefinitionJSON)
	modelPayload["sourceType"] = "external"
	rootScope := asMap(asMap(modelPayload["dataSchema"])["rootScope"])
	rootScope["runtime"] = map[string]any{
		"rtAlias":        "state",
		"tableName":      "state",
		"dataViewName":   "vw_state",
		"tenantScoped":   false,
		"sourceIdColumn": "id",
	}

	viewPayload := mustDecodeJSONMap(t, view.DefinitionJSON)
	asMap(asMap(viewPayload["uiSchema"])["rootScope"])["runtime"] = map[string]any{
		"viewRtAlias":  "default",
		"dataViewName": "vw_state",
		"gridViewName": "vg_state__default",
	}

	out, err := svc.SaveDraft(testContext(), model.ModelID, view.ViewID, SaveDraftRequest{
		Draft: DraftPayload{
			Model: mustJSON(t, modelPayload),
			View:  mustJSON(t, viewPayload),
		},
		ExpectedVersions: ExpectedVersions{
			Model: int64Ptr(model.Version),
			View:  int64Ptr(view.Version),
		},
	})
	if err != nil {
		t.Fatalf("SaveDraft returned error: %v", err)
	}
	if repo.lastRuntimePlan == nil {
		t.Fatalf("expected runtime plan to be captured")
	}
	if repo.lastRuntimePlan.RootScope.SourceIDColumn != "id" {
		t.Fatalf("runtime id source column = %q, want %q", repo.lastRuntimePlan.RootScope.SourceIDColumn, "id")
	}
	if repo.lastRuntimePlan.RootScope.SourceTenantIDColumn != "" {
		t.Fatalf("runtime tenant source column = %q, want empty", repo.lastRuntimePlan.RootScope.SourceTenantIDColumn)
	}
	if repo.lastRuntimePlan.RootScope.SourceGUIDColumn != "" {
		t.Fatalf("runtime guid source column = %q, want empty", repo.lastRuntimePlan.RootScope.SourceGUIDColumn)
	}
	if repo.lastRuntimePlan.RootScope.SourceCreatedAtColumn != "" {
		t.Fatalf("runtime created_at source column = %q, want empty", repo.lastRuntimePlan.RootScope.SourceCreatedAtColumn)
	}
	if repo.lastRuntimePlan.RootScope.SourceUpdatedAtColumn != "" {
		t.Fatalf("runtime updated_at source column = %q, want empty", repo.lastRuntimePlan.RootScope.SourceUpdatedAtColumn)
	}

	savedModelPayload := mustDecodeJSONMap(t, out.Draft.Model)
	savedRuntime := asMap(asMap(asMap(savedModelPayload["dataSchema"])["rootScope"])["runtime"])
	tenantScoped, ok := savedRuntime["tenantScoped"].(bool)
	if !ok || tenantScoped {
		t.Fatalf("saved tenantScoped = %#v, want false", savedRuntime["tenantScoped"])
	}
	if _, ok := savedRuntime["sourceTenantIdColumn"]; ok {
		t.Fatalf("saved runtime unexpectedly retained sourceTenantIdColumn: %#v", savedRuntime)
	}
	if out.RuntimeApply == nil || out.RuntimeApply.Status != "applied" {
		t.Fatalf("runtime apply summary = %#v, want applied", out.RuntimeApply)
	}
}

func TestSaveDraftRejectsMissingExternalSourceTable(t *testing.T) {
	repo := newMemoryRepository()
	model := &ModelRecord{
		ModelID:          "users-model",
		ModelKey:         "users-model",
		StorageKey:       "users",
		DisplayName:      "Users",
		SourceType:       "managed",
		Version:          1,
		StructureVersion: 1,
		DefinitionJSON: mustJSON(t, map[string]any{
			"id":          "users-model",
			"key":         "users-model",
			"storageKey":  "users",
			"displayName": "Users",
			"sourceType":  "managed",
			"dataSchema": map[string]any{
				"modelId":    "users-model",
				"modelTitle": "Users",
				"rootScope": map[string]any{
					"fields":        []any{},
					"schemaScopeId": "root",
					"scopeType":     "ROOT",
				},
				"subformScopes": []any{},
			},
			"layoutBlueprint": emptyLayoutBlueprint(),
		}),
	}
	view := &ViewRecord{
		ModelID:                          model.ModelID,
		ViewID:                           "view-default",
		ViewKey:                          "default",
		DisplayName:                      "Users",
		ViewType:                         "form",
		IsActive:                         true,
		IsDefault:                        true,
		Version:                          1,
		LastAlignedModelStructureVersion: 1,
		DefinitionJSON: mustJSON(t, map[string]any{
			"id":          "view-default",
			"key":         "default",
			"modelId":     "users-model",
			"displayName": "Users",
			"kind":        "form",
			"isDefault":   true,
			"isActive":    true,
			"uiSchema": map[string]any{
				"rootScope": map[string]any{
					"schemaScopeId": "root",
					"nodes":         []any{},
				},
				"subformScopes": []any{},
			},
		}),
	}
	repo.models[model.ModelID] = model
	repo.views[model.ModelID] = map[string]*ViewRecord{view.ViewID: view}
	svc := NewService(repo)

	modelPayload := mustDecodeJSONMap(t, model.DefinitionJSON)
	modelPayload["sourceType"] = "external"
	rootScope := asMap(asMap(modelPayload["dataSchema"])["rootScope"])
	rootScope["runtime"] = map[string]any{
		"rtAlias":      "users",
		"tableName":    "users",
		"mvTableName":  "",
		"dataViewName": "vw_users",
	}

	viewPayload := mustDecodeJSONMap(t, view.DefinitionJSON)
	asMap(asMap(viewPayload["uiSchema"])["rootScope"])["runtime"] = map[string]any{
		"viewRtAlias":  "default",
		"dataViewName": "vw_users",
		"gridViewName": "vg_users__default",
	}

	_, err := svc.SaveDraft(testContext(), model.ModelID, view.ViewID, SaveDraftRequest{
		Draft: DraftPayload{
			Model: mustJSON(t, modelPayload),
			View:  mustJSON(t, viewPayload),
		},
		ExpectedVersions: ExpectedVersions{
			Model: int64Ptr(model.Version),
			View:  int64Ptr(view.Version),
		},
	})
	if !errors.Is(err, ErrRuntimeNameConflict) {
		t.Fatalf("SaveDraft error = %v, want %v", err, ErrRuntimeNameConflict)
	}
}

func TestBuildRuntimeScopeDataViewSQLForExternalTableAliasesCanonicalColumns(t *testing.T) {
	scope := runtimeApplyScopePlan{
		ScopeID:               "root",
		SourceType:            "external",
		TableName:             "users",
		DataViewName:          "vw_users",
		SourceIDColumn:        "id",
		SourceTenantIDColumn:  "tenant_id",
		SourceGUIDColumn:      "guid",
		SourceCreatedAtColumn: "created_at",
		SourceUpdatedAtColumn: "updated_at",
		Fields: []runtimeApplyFieldPlan{
			{
				FieldID:          "first-name",
				StorageKey:       "firstname",
				Kind:             "short_text",
				ColumnName:       "firstname",
				SourceColumnName: "first_name",
				Supported:        true,
			},
			{
				FieldID:              "company",
				StorageKey:           "company_id",
				Kind:                 "db_lookup",
				Preset:               "company_lookup",
				ColumnName:           "company_id",
				SourceColumnName:     "company_id",
				Supported:            true,
				LookupTargetName:     "company",
				LookupTargetKind:     "table",
				LookupTargetIDColumn: "id",
				LookupDerivedOutputs: buildRuntimeLookupOutputPlans(runtimeApplyFieldPlan{
					StorageKey: "company_id",
					Kind:       "db_lookup",
					Preset:     "company_lookup",
				}),
			},
		},
	}

	statement, _ := buildRuntimeScopeDataViewSQL(scope)

	for _, fragment := range []string{
		`CREATE OR REPLACE VIEW "public"."vw_users" AS SELECT`,
		`t."id" AS "_id"`,
		`t."tenant_id" AS "tenant_id"`,
		`t."guid" AS "_guid"`,
		`t."created_at" AS "_created_at"`,
		`t."updated_at" AS "_updated_at"`,
		`t."first_name" AS "firstname"`,
		`t."company_id" AS "company_id"`,
	} {
		if !strings.Contains(statement, fragment) {
			t.Fatalf("runtime data view SQL missing fragment %q:\n%s", fragment, statement)
		}
	}
}

func TestBuildRuntimeScopeDataViewSQLForExternalGlobalTableUsesNullCanonicalColumns(t *testing.T) {
	scope := runtimeApplyScopePlan{
		ScopeID:        "root",
		SourceType:     "external",
		TableName:      "state",
		DataViewName:   "vw_state",
		SourceIDColumn: "id",
		Fields: []runtimeApplyFieldPlan{
			{
				FieldID:          "name",
				StorageKey:       "name",
				Kind:             "short_text",
				ColumnName:       "name",
				SourceColumnName: "name",
				Supported:        true,
			},
		},
	}

	statement, _ := buildRuntimeScopeDataViewSQL(scope)

	for _, fragment := range []string{
		`CREATE OR REPLACE VIEW "public"."vw_state" AS SELECT`,
		`t."id" AS "_id"`,
		`NULL::bigint AS "tenant_id"`,
		`NULL::uuid AS "_guid"`,
		`NULL::timestamptz AS "_created_at"`,
		`NULL::timestamptz AS "_updated_at"`,
		`t."name" AS "name"`,
	} {
		if !strings.Contains(statement, fragment) {
			t.Fatalf("runtime data view SQL missing fragment %q:\n%s", fragment, statement)
		}
	}
}

func TestBuildRuntimeScopeDataViewSQLForMultiSelectAggregatesValueLabels(t *testing.T) {
	field := runtimeApplyFieldPlan{
		FieldID:    "categories",
		StorageKey: "categories",
		Kind:       "multi_select",
		MultiValue: true,
		Supported:  true,
		LookupDerivedOutputs: []runtimeApplyLookupOutputPlan{
			{ColumnName: "categories", OutputKey: "labels", DataType: "text"},
			{ColumnName: "categories__count", OutputKey: "count", DataType: "bigint"},
		},
	}
	scope := runtimeApplyScopePlan{
		ScopeID:                   "root",
		SourceType:                "managed",
		TableName:                 "ps_sor",
		DataViewName:              "vw_sor",
		SourceIDColumn:            "_id",
		SourceTenantIDColumn:      "tenant_id",
		SourceGUIDColumn:          "_guid",
		SourceCreatedAtColumn:     "_created_at",
		SourceUpdatedAtColumn:     "_updated_at",
		MultiValueTableName:       "ps_sor__mv",
		MultiValueOwnerForeignKey: "sor_id",
		Fields:                    []runtimeApplyFieldPlan{field},
	}

	statement, lookupOutputs := buildRuntimeScopeDataViewSQL(scope)

	for _, fragment := range []string{
		`"public"."ps_sor__mv"`,
		`mv."value_label"`,
		`mv."field_key" = 'categories'`,
		`AS "categories"`,
		`AS "categories__count"`,
	} {
		if !strings.Contains(statement, fragment) {
			t.Fatalf("runtime data view SQL missing fragment %q:\n%s", fragment, statement)
		}
	}
	if runtimeGridDefaultColumnForField(field) != "categories" {
		t.Fatalf("grid default column = %q, want categories", runtimeGridDefaultColumnForField(field))
	}
	if !containsRuntimeLookupOutputResult(lookupOutputs, "categories") || !containsRuntimeLookupOutputResult(lookupOutputs, "categories__count") {
		t.Fatalf("expected multivalue outputs, got %#v", lookupOutputs)
	}
}

func TestBuildRuntimeScopeDataViewSQLForExternalGlobalTableUsesConfiguredGuidColumn(t *testing.T) {
	scope := runtimeApplyScopePlan{
		ScopeID:          "root",
		SourceType:       "external",
		TableName:        "state",
		DataViewName:     "vw_state",
		SourceIDColumn:   "id",
		SourceGUIDColumn: "guid",
		Fields: []runtimeApplyFieldPlan{
			{
				FieldID:          "name",
				StorageKey:       "name",
				Kind:             "short_text",
				ColumnName:       "name",
				SourceColumnName: "name",
				Supported:        true,
			},
		},
	}

	statement, _ := buildRuntimeScopeDataViewSQL(scope)

	for _, fragment := range []string{
		`CREATE OR REPLACE VIEW "public"."vw_state" AS SELECT`,
		`t."id" AS "_id"`,
		`NULL::bigint AS "tenant_id"`,
		`t."guid" AS "_guid"`,
		`NULL::timestamptz AS "_created_at"`,
		`NULL::timestamptz AS "_updated_at"`,
		`t."name" AS "name"`,
	} {
		if !strings.Contains(statement, fragment) {
			t.Fatalf("runtime data view SQL missing fragment %q:\n%s", fragment, statement)
		}
	}
}

func TestBuildRuntimeScopeDataViewSQLKeepsLookupOutputsBeforeLaterAddedScalarFields(t *testing.T) {
	scope := runtimeApplyScopePlan{
		ScopeID:               "root",
		SourceType:            "managed",
		TableName:             "ps_test_inspection",
		DataViewName:          "vw_test_inspection",
		SourceIDColumn:        "_id",
		SourceTenantIDColumn:  "tenant_id",
		SourceGUIDColumn:      "_guid",
		SourceCreatedAtColumn: "_created_at",
		SourceUpdatedAtColumn: "_updated_at",
		Fields: []runtimeApplyFieldPlan{
			{
				FieldID:      "short-text",
				StorageKey:   "first_name",
				Kind:         "short_text",
				ColumnName:   "first_name",
				PhysicalType: "text",
				Supported:    true,
			},
			{
				FieldID:              "reported-by",
				StorageKey:           "reported_by",
				Kind:                 "db_lookup",
				Preset:               "contact_lookup",
				SelectionMode:        "single",
				ColumnName:           "reported_by_id",
				PhysicalType:         "bigint",
				Supported:            true,
				LookupTargetName:     "users",
				LookupTargetKind:     "table",
				LookupTargetIDColumn: "id",
				LookupDerivedOutputs: buildRuntimeLookupOutputPlans(runtimeApplyFieldPlan{
					StorageKey: "reported_by",
					Kind:       "db_lookup",
					Preset:     "contact_lookup",
				}),
			},
			{
				FieldID:      "suggest-text",
				StorageKey:   "city",
				Kind:         "short_text",
				ColumnName:   "city",
				PhysicalType: "text",
				Supported:    true,
			},
		},
	}

	statement, _ := buildRuntimeScopeDataViewSQL(scope)
	reportedByLabelPos := strings.Index(statement, `"reported_by__label"`)
	cityPos := strings.Index(statement, `"city"`)
	if reportedByLabelPos == -1 || cityPos == -1 {
		t.Fatalf("expected reported_by__label and city in data view SQL, got %s", statement)
	}
	if reportedByLabelPos > cityPos {
		t.Fatalf("expected lookup outputs to stay before later-added city column, got %s", statement)
	}
}

func TestSaveDraftBuildsRuntimeRootGridViewFromVisibleGridColumns(t *testing.T) {
	repo := newMemoryRepository()
	model, view := seedCanonicalModelAndDefaultView(t, repo)
	svc := NewService(repo)

	modelPayload := mustDecodeJSONMap(t, model.DefinitionJSON)
	dataSchema := asMap(modelPayload["dataSchema"])
	rootScope := asMap(dataSchema["rootScope"])
	rootScope["fields"] = append(asSlice(rootScope["fields"]), map[string]any{
		"displayName":   "Site Code",
		"id":            "site-code",
		"key":           "site-code",
		"kind":          "short_text",
		"label":         "Site Code",
		"schemaScopeId": "root",
		"storageKey":    "site_code",
	})
	layoutBlueprint := asMap(modelPayload["layoutBlueprint"])
	rootBlueprint := asMap(layoutBlueprint["rootScope"])
	rootBlueprint["fieldPlacements"] = append(asSlice(rootBlueprint["fieldPlacements"]), map[string]any{
		"containerKey": "root.section.summary",
		"fieldId":      "site-code",
		"order":        1,
	})

	viewPayload := mustDecodeJSONMap(t, view.DefinitionJSON)
	uiSchema := asMap(viewPayload["uiSchema"])
	rootUIScope := asMap(uiSchema["rootScope"])
	rootUIScope["nodes"] = append(asSlice(rootUIScope["nodes"]), map[string]any{
		"fieldId":    "site-code",
		"id":         "field-site-code",
		"order":      1,
		"parentId":   "root-section-summary",
		"title":      "Site Code",
		"type":       "field",
		"visibility": "visible",
	})
	rootUIScope["viewSettings"] = map[string]any{
		"list": map[string]any{
			"columns": []any{
				map[string]any{
					"id":      "grid-column-site-name",
					"fieldId": "site-name",
					"order":   1,
					"visible": true,
				},
			},
		},
	}

	out, err := svc.SaveDraft(testContext(), model.ModelID, view.ViewID, SaveDraftRequest{
		Draft: DraftPayload{
			Model: mustJSON(t, modelPayload),
			View:  mustJSON(t, viewPayload),
		},
		ExpectedVersions: ExpectedVersions{
			Model: int64Ptr(model.Version),
			View:  int64Ptr(view.Version),
		},
	})
	if err != nil {
		t.Fatalf("SaveDraft returned error: %v", err)
	}
	if repo.lastRuntimePlan == nil {
		t.Fatalf("expected runtime plan to be captured")
	}
	if out.RuntimeApply == nil || out.RuntimeApply.StorageResults == nil {
		t.Fatalf("expected runtime apply summary, got %#v", out.RuntimeApply)
	}

	grid := findGridViewPlan(repo.lastRuntimePlan.RootScope.GridViews, "vg_site_audit__default")
	if grid == nil {
		t.Fatalf("expected default root grid plan, got %#v", repo.lastRuntimePlan.RootScope.GridViews)
	}
	wantColumns := []string{"_id", "tenant_id", "_guid", "_created_at", "_updated_at", "site_name"}
	if !reflect.DeepEqual(grid.ColumnNames, wantColumns) {
		t.Fatalf("root grid columns = %#v, want %#v", grid.ColumnNames, wantColumns)
	}

	gridSQL := buildRuntimeGridViewSQL(repo.lastRuntimePlan.RootScope.DataViewName, *grid)
	if !strings.Contains(gridSQL, `v."site_name"`) {
		t.Fatalf("expected site_name in root grid SQL, got %s", gridSQL)
	}
	if strings.Contains(gridSQL, `v."site_code"`) {
		t.Fatalf("did not expect site_code in root grid SQL, got %s", gridSQL)
	}
}

func TestSaveDraftBuildsRuntimeSubformGridViewWithSystemColumnsWhenGridColumnsEmpty(t *testing.T) {
	repo := newMemoryRepository()
	model, view := seedCanonicalModelAndDefaultView(t, repo)
	svc := NewService(repo)

	modelPayload := mustDecodeJSONMap(t, model.DefinitionJSON)
	viewPayload := mustDecodeJSONMap(t, view.DefinitionJSON)

	out, err := svc.SaveDraft(testContext(), model.ModelID, view.ViewID, SaveDraftRequest{
		Draft: DraftPayload{
			Model: mustJSON(t, modelPayload),
			View:  mustJSON(t, viewPayload),
		},
		ExpectedVersions: ExpectedVersions{
			Model: int64Ptr(model.Version),
			View:  int64Ptr(view.Version),
		},
	})
	if err != nil {
		t.Fatalf("SaveDraft returned error: %v", err)
	}
	if repo.lastRuntimePlan == nil {
		t.Fatalf("expected runtime plan to be captured")
	}
	if out.RuntimeApply == nil || out.RuntimeApply.StorageResults == nil {
		t.Fatalf("expected runtime apply summary, got %#v", out.RuntimeApply)
	}

	if len(repo.lastRuntimePlan.SubformScopes) != 1 {
		t.Fatalf("expected one subform scope, got %#v", repo.lastRuntimePlan.SubformScopes)
	}
	grid := findGridViewPlan(repo.lastRuntimePlan.SubformScopes[0].GridViews, "vg_site_audit__"+buildGeneratedRuntimeScopeAlias("pb_info")+"__default")
	if grid == nil {
		t.Fatalf("expected default subform grid plan, got %#v", repo.lastRuntimePlan.SubformScopes[0].GridViews)
	}
	wantColumns := []string{"_id", "tenant_id", "_guid", "_created_at", "_updated_at", "_parent_id"}
	if !reflect.DeepEqual(grid.ColumnNames, wantColumns) {
		t.Fatalf("subform grid columns = %#v, want %#v", grid.ColumnNames, wantColumns)
	}

	gridSQL := buildRuntimeGridViewSQL(repo.lastRuntimePlan.SubformScopes[0].DataViewName, *grid)
	if strings.Contains(gridSQL, `v."info_date"`) {
		t.Fatalf("did not expect info_date in empty subform grid SQL, got %s", gridSQL)
	}
}

func TestBuildRuntimeGridViewsShortensOverlongNamesDeterministically(t *testing.T) {
	fields := []runtimeApplyFieldPlan{
		{
			FieldID:      "email",
			ColumnName:   "email",
			Kind:         "short_text",
			PhysicalType: "text",
			Supported:    true,
		},
	}
	views := []ViewRecord{
		{ViewKey: "default"},
		{ViewKey: "test-inspection-copy"},
		{ViewKey: "test-inspection-copy-2"},
		{ViewKey: "test-inspection-for-gc"},
	}

	plans := buildRuntimeGridViews("test_inspection_for_auto_82af", buildGeneratedRuntimeScopeAlias("subform-1776131757551-y3h9k3"), "subform-1776131757551-y3h9k3", "test_inspection_for_auto_82af_id", fields, views)
	if len(plans) != 4 {
		t.Fatalf("expected four grid view plans, got %#v", plans)
	}

	seen := map[string]struct{}{}
	for _, plan := range plans {
		if len(plan.Name) > 63 {
			t.Fatalf("grid view name exceeds postgres identifier limit: %q (%d)", plan.Name, len(plan.Name))
		}
		if _, ok := seen[plan.Name]; ok {
			t.Fatalf("expected unique shortened grid view names, got duplicate %q in %#v", plan.Name, plans)
		}
		seen[plan.Name] = struct{}{}
	}
}

func TestBuildRuntimeApplyFieldPlanShortensOverlongColumnNames(t *testing.T) {
	longStorageKey := strings.Repeat("very_long_field_name_", 5)
	lookupPlan := buildRuntimeApplyFieldPlan(map[string]any{
		"id":            "vendor-contact",
		"fieldId":       "vendor-contact",
		"kind":          "db_lookup",
		"preset":        "contact_lookup",
		"selectionMode": "single",
		"storageKey":    longStorageKey,
	}, nil, "managed", "")

	if len(lookupPlan.ColumnName) > 63 {
		t.Fatalf("lookup column name exceeds postgres identifier limit: %q (%d)", lookupPlan.ColumnName, len(lookupPlan.ColumnName))
	}
	if alias := runtimeGridDefaultAliasForField(lookupPlan); len(alias) > 63 {
		t.Fatalf("lookup grid alias exceeds postgres identifier limit: %q (%d)", alias, len(alias))
	}
	for _, output := range lookupPlan.LookupDerivedOutputs {
		if len(output.ColumnName) > 63 {
			t.Fatalf("lookup output column exceeds postgres identifier limit: %q (%d)", output.ColumnName, len(output.ColumnName))
		}
	}
}

func TestSaveDraftBuildsRuntimeApplyLookupOutputsForContactLookup(t *testing.T) {
	repo := newMemoryRepository()
	model, view := seedCanonicalModelAndDefaultView(t, repo)
	svc := NewService(repo)

	modelPayload := mustDecodeJSONMap(t, model.DefinitionJSON)
	dataSchema := asMap(modelPayload["dataSchema"])
	rootScope := asMap(dataSchema["rootScope"])
	rootScope["fields"] = append(asSlice(rootScope["fields"]), map[string]any{
		"displayName":   "Reported By",
		"id":            "reported-by",
		"key":           "reported-by",
		"kind":          "db_lookup",
		"label":         "Reported By",
		"lookupConfig":  map[string]any{"sourceModel": "contacts"},
		"preset":        "contact_lookup",
		"schemaScopeId": "root",
		"selectionMode": "single",
		"storageKey":    "reported_by",
	})
	layoutBlueprint := asMap(modelPayload["layoutBlueprint"])
	rootBlueprint := asMap(layoutBlueprint["rootScope"])
	rootBlueprint["fieldPlacements"] = append(asSlice(rootBlueprint["fieldPlacements"]), map[string]any{
		"containerKey": scopeRootPlacementKey,
		"fieldId":      "reported-by",
		"order":        1,
	})

	viewPayload := mustDecodeJSONMap(t, view.DefinitionJSON)
	uiSchema := asMap(viewPayload["uiSchema"])
	rootUIScope := asMap(uiSchema["rootScope"])
	rootUIScope["nodes"] = append(asSlice(rootUIScope["nodes"]), map[string]any{
		"fieldId":    "reported-by",
		"id":         "field-reported-by",
		"order":      2,
		"parentId":   nil,
		"title":      "Reported By",
		"type":       "field",
		"visibility": "visible",
	})

	out, err := svc.SaveDraft(testContext(), model.ModelID, view.ViewID, SaveDraftRequest{
		Draft: DraftPayload{
			Model: mustJSON(t, modelPayload),
			View:  mustJSON(t, viewPayload),
		},
		ExpectedVersions: ExpectedVersions{
			Model: int64Ptr(model.Version),
			View:  int64Ptr(view.Version),
		},
	})
	if err != nil {
		t.Fatalf("SaveDraft returned error: %v", err)
	}
	if repo.lastRuntimePlan == nil {
		t.Fatalf("expected runtime plan to be captured")
	}

	field := findRuntimeFieldPlanByID(repo.lastRuntimePlan.RootScope.Fields, "reported-by")
	if field == nil {
		t.Fatalf("expected reported-by field in runtime plan, got %#v", repo.lastRuntimePlan.RootScope.Fields)
	}
	if field.ColumnName != "reported_by_id" {
		t.Fatalf("reported-by column name = %q, want %q", field.ColumnName, "reported_by_id")
	}
	if field.LookupTargetName != "users" {
		t.Fatalf("reported-by lookup target = %q, want %q", field.LookupTargetName, "users")
	}
	if !containsLookupOutputColumn(field.LookupDerivedOutputs, "reported_by__label") {
		t.Fatalf("expected reported_by__label output, got %#v", field.LookupDerivedOutputs)
	}
	if !containsLookupOutputColumn(field.LookupDerivedOutputs, "reported_by__company_name") {
		t.Fatalf("expected reported_by__company_name output, got %#v", field.LookupDerivedOutputs)
	}

	viewSQL, lookupOutputs := buildRuntimeScopeDataViewSQL(repo.lastRuntimePlan.RootScope)
	if !strings.Contains(viewSQL, `t."tenant_id" AS "tenant_id"`) {
		t.Fatalf("expected tenant_id in data view SQL, got %s", viewSQL)
	}
	if !strings.Contains(viewSQL, `"public"."users" "lk_reported_by"`) {
		t.Fatalf("expected users join in data view SQL, got %s", viewSQL)
	}
	if !strings.Contains(viewSQL, `"t"."tenant_id" = "lk_reported_by"."tenant_id"`) {
		t.Fatalf("expected tenant-scoped users join in data view SQL, got %s", viewSQL)
	}
	if !strings.Contains(viewSQL, `"reported_by__company_name"`) {
		t.Fatalf("expected reported_by__company_name in data view SQL, got %s", viewSQL)
	}
	if !containsRuntimeLookupOutputResult(lookupOutputs, "reported_by__title") {
		t.Fatalf("expected reported_by__title runtime output, got %#v", lookupOutputs)
	}
	if out.RuntimeApply == nil || out.RuntimeApply.StorageResults == nil {
		t.Fatalf("expected runtime apply summary, got %#v", out.RuntimeApply)
	}
	if !containsRuntimeLookupOutputResult(out.RuntimeApply.StorageResults.RootScope.LookupOutputs, "reported_by__phone") {
		t.Fatalf("expected reported_by__phone in runtime summary, got %#v", out.RuntimeApply.StorageResults.RootScope.LookupOutputs)
	}
}

func TestSaveDraftRuntimeDataViewIncludesHiddenCanvasFields(t *testing.T) {
	repo := newMemoryRepository()
	model, view := seedCanonicalModelAndDefaultView(t, repo)
	svc := NewService(repo)

	modelPayload := mustDecodeJSONMap(t, model.DefinitionJSON)
	viewPayload := mustDecodeJSONMap(t, view.DefinitionJSON)
	uiSchema := asMap(viewPayload["uiSchema"])
	rootScope := asMap(uiSchema["rootScope"])
	rootFieldNode := findFieldNodeByID(asSlice(rootScope["nodes"]), "site-name")
	if rootFieldNode == nil {
		t.Fatalf("expected site-name node in root ui scope, got %#v", rootScope["nodes"])
	}
	rootFieldNode["visibility"] = "hidden"

	var infoScope map[string]any
	for _, raw := range asSlice(uiSchema["subformScopes"]) {
		candidate := asMap(raw)
		if normalizeString(candidate["schemaScopeId"]) == "pb_info" {
			infoScope = candidate
			break
		}
	}
	if len(infoScope) == 0 {
		t.Fatalf("expected pb_info ui scope, got %#v", uiSchema["subformScopes"])
	}
	infoFieldNode := findFieldNodeByID(asSlice(infoScope["nodes"]), "info-date")
	if infoFieldNode == nil {
		t.Fatalf("expected info-date node in subform ui scope, got %#v", infoScope["nodes"])
	}
	infoFieldNode["visibility"] = "hidden"

	out, err := svc.SaveDraft(testContext(), model.ModelID, view.ViewID, SaveDraftRequest{
		Draft: DraftPayload{
			Model: mustJSON(t, modelPayload),
			View:  mustJSON(t, viewPayload),
		},
		ExpectedVersions: ExpectedVersions{
			Model: int64Ptr(model.Version),
			View:  int64Ptr(view.Version),
		},
	})
	if err != nil {
		t.Fatalf("SaveDraft returned error: %v", err)
	}
	if repo.lastRuntimePlan == nil {
		t.Fatalf("expected runtime plan to be captured")
	}

	rootViewSQL, _ := buildRuntimeScopeDataViewSQL(repo.lastRuntimePlan.RootScope)
	if !strings.Contains(rootViewSQL, `t."site_name" AS "site_name"`) {
		t.Fatalf("expected hidden root canvas field in data view SQL, got %s", rootViewSQL)
	}
	if len(repo.lastRuntimePlan.SubformScopes) != 1 {
		t.Fatalf("expected one subform scope in runtime plan, got %#v", repo.lastRuntimePlan.SubformScopes)
	}
	subformViewSQL, _ := buildRuntimeScopeDataViewSQL(repo.lastRuntimePlan.SubformScopes[0])
	if !strings.Contains(subformViewSQL, `t."info_date" AS "info_date"`) {
		t.Fatalf("expected hidden subform canvas field in data view SQL, got %s", subformViewSQL)
	}
	if out.RuntimeApply == nil || out.RuntimeApply.StorageResults == nil || out.RuntimeApply.StorageResults.RootScope.DataView == nil {
		t.Fatalf("expected runtime apply data view summary, got %#v", out.RuntimeApply)
	}
}

func TestSaveDraftBuildsRuntimeApplyLookupOutputsForManagedModelLookup(t *testing.T) {
	repo := newMemoryRepository()
	model, view := seedCanonicalModelAndDefaultView(t, repo)
	repo.models["company-directory"] = &ModelRecord{
		ModelID:          "company-directory",
		ModelKey:         "company-directory",
		StorageKey:       "company_directory",
		DisplayName:      "Company Directory",
		SourceType:       "managed",
		Version:          1,
		StructureVersion: 1,
		DefinitionJSON: mustJSON(t, map[string]any{
			"id":         "company-directory",
			"key":        "company-directory",
			"storageKey": "company_directory",
			"sourceType": "managed",
		}),
	}
	svc := NewService(repo)

	modelPayload := mustDecodeJSONMap(t, model.DefinitionJSON)
	dataSchema := asMap(modelPayload["dataSchema"])
	rootScope := asMap(dataSchema["rootScope"])
	rootScope["fields"] = append(asSlice(rootScope["fields"]), map[string]any{
		"displayFields": []any{"company_name"},
		"displayName":   "Vendor Company",
		"id":            "vendor-company",
		"key":           "vendor-company",
		"kind":          "db_lookup",
		"label":         "Vendor Company",
		"lookupConfig": map[string]any{
			"displayMode":      "search_select",
			"searchFields":     []any{"company_name"},
			"sourceModel":      "company-directory",
			"storedValueField": "doc_id",
		},
		"schemaScopeId": "root",
		"selectionMode": "single",
		"storageKey":    "vendor_company",
	})
	layoutBlueprint := asMap(modelPayload["layoutBlueprint"])
	rootBlueprint := asMap(layoutBlueprint["rootScope"])
	rootBlueprint["fieldPlacements"] = append(asSlice(rootBlueprint["fieldPlacements"]), map[string]any{
		"containerKey": scopeRootPlacementKey,
		"fieldId":      "vendor-company",
		"order":        1,
	})

	viewPayload := mustDecodeJSONMap(t, view.DefinitionJSON)
	uiSchema := asMap(viewPayload["uiSchema"])
	rootUIScope := asMap(uiSchema["rootScope"])
	rootUIScope["nodes"] = append(asSlice(rootUIScope["nodes"]), map[string]any{
		"fieldId":    "vendor-company",
		"id":         "field-vendor-company",
		"order":      2,
		"parentId":   nil,
		"title":      "Vendor Company",
		"type":       "field",
		"visibility": "visible",
	})

	out, err := svc.SaveDraft(testContext(), model.ModelID, view.ViewID, SaveDraftRequest{
		Draft: DraftPayload{
			Model: mustJSON(t, modelPayload),
			View:  mustJSON(t, viewPayload),
		},
		ExpectedVersions: ExpectedVersions{
			Model: int64Ptr(model.Version),
			View:  int64Ptr(view.Version),
		},
	})
	if err != nil {
		t.Fatalf("SaveDraft returned error: %v", err)
	}
	if repo.lastRuntimePlan == nil {
		t.Fatalf("expected runtime plan to be captured")
	}

	field := findRuntimeFieldPlanByID(repo.lastRuntimePlan.RootScope.Fields, "vendor-company")
	if field == nil {
		t.Fatalf("expected vendor-company field in runtime plan, got %#v", repo.lastRuntimePlan.RootScope.Fields)
	}
	if field.LookupTargetName != "vw_company_directory" {
		t.Fatalf("vendor-company lookup target = %q, want %q", field.LookupTargetName, "vw_company_directory")
	}
	if !reflect.DeepEqual(field.DisplayFields, []string{"company_name"}) {
		t.Fatalf("vendor-company display fields = %#v, want %#v", field.DisplayFields, []string{"company_name"})
	}
	if !containsLookupOutputColumn(field.LookupDerivedOutputs, "vendor_company__label") {
		t.Fatalf("expected vendor_company__label output, got %#v", field.LookupDerivedOutputs)
	}

	viewSQL, lookupOutputs := buildRuntimeScopeDataViewSQL(repo.lastRuntimePlan.RootScope)
	if !strings.Contains(viewSQL, `"public"."vw_company_directory" "lk_vendor_company"`) {
		t.Fatalf("expected managed lookup join in data view SQL, got %s", viewSQL)
	}
	if !strings.Contains(viewSQL, `"t"."tenant_id" = "lk_vendor_company"."tenant_id"`) {
		t.Fatalf("expected tenant-scoped managed lookup join in data view SQL, got %s", viewSQL)
	}
	if !strings.Contains(viewSQL, `"lk_vendor_company"."company_name"`) || !strings.Contains(viewSQL, `"vendor_company__label"`) {
		t.Fatalf("expected vendor_company label expression in data view SQL, got %s", viewSQL)
	}
	if !containsRuntimeLookupOutputResult(lookupOutputs, "vendor_company__label") {
		t.Fatalf("expected vendor_company__label runtime output, got %#v", lookupOutputs)
	}
	if out.RuntimeApply == nil || out.RuntimeApply.StorageResults == nil {
		t.Fatalf("expected runtime apply summary, got %#v", out.RuntimeApply)
	}
	if !containsRuntimeLookupOutputResult(out.RuntimeApply.StorageResults.RootScope.LookupOutputs, "vendor_company__label") {
		t.Fatalf("expected vendor_company__label in runtime summary, got %#v", out.RuntimeApply.StorageResults.RootScope.LookupOutputs)
	}
}

func TestSaveDraftBuildsRuntimeApplyLookupOutputsForGlobalLookupModel(t *testing.T) {
	repo := newMemoryRepository()
	model, view := seedCanonicalModelAndDefaultView(t, repo)
	repo.models["state-directory"] = &ModelRecord{
		ModelID:          "state-directory",
		ModelKey:         "state-directory",
		StorageKey:       "state",
		DisplayName:      "State",
		SourceType:       "external",
		Version:          1,
		StructureVersion: 1,
		DefinitionJSON: mustJSON(t, map[string]any{
			"id":          "state-directory",
			"key":         "state-directory",
			"storageKey":  "state",
			"displayName": "State",
			"sourceType":  "external",
			"dataSchema": map[string]any{
				"modelId":    "state-directory",
				"modelTitle": "State",
				"rootScope": map[string]any{
					"fields": []any{
						map[string]any{"displayName": "Name", "id": "name", "key": "name", "kind": "short_text", "label": "Name", "schemaScopeId": "root", "storageKey": "name"},
					},
					"schemaScopeId": "root",
					"scopeType":     "ROOT",
					"runtime": map[string]any{
						"rtAlias":        "state",
						"tableName":      "state",
						"dataViewName":   "vw_state",
						"tenantScoped":   false,
						"sourceIdColumn": "id",
					},
				},
				"subformScopes": []any{},
			},
			"layoutBlueprint": emptyLayoutBlueprint(),
		}),
	}
	svc := NewService(repo)

	modelPayload := mustDecodeJSONMap(t, model.DefinitionJSON)
	dataSchema := asMap(modelPayload["dataSchema"])
	rootScope := asMap(dataSchema["rootScope"])
	rootScope["fields"] = append(asSlice(rootScope["fields"]), map[string]any{
		"displayFields": []any{"name"},
		"displayName":   "State",
		"id":            "state",
		"key":           "state",
		"kind":          "db_lookup",
		"label":         "State",
		"lookupConfig": map[string]any{
			"displayMode":      "search_select",
			"searchFields":     []any{"name"},
			"sourceModel":      "state-directory",
			"storedValueField": "doc_id",
		},
		"schemaScopeId": "root",
		"selectionMode": "single",
		"storageKey":    "state",
	})
	layoutBlueprint := asMap(modelPayload["layoutBlueprint"])
	rootBlueprint := asMap(layoutBlueprint["rootScope"])
	rootBlueprint["fieldPlacements"] = append(asSlice(rootBlueprint["fieldPlacements"]), map[string]any{
		"containerKey": scopeRootPlacementKey,
		"fieldId":      "state",
		"order":        1,
	})

	viewPayload := mustDecodeJSONMap(t, view.DefinitionJSON)
	uiSchema := asMap(viewPayload["uiSchema"])
	rootUIScope := asMap(uiSchema["rootScope"])
	rootUIScope["nodes"] = append(asSlice(rootUIScope["nodes"]), map[string]any{
		"fieldId":    "state",
		"id":         "field-state",
		"order":      2,
		"parentId":   nil,
		"title":      "State",
		"type":       "field",
		"visibility": "visible",
	})

	out, err := svc.SaveDraft(testContext(), model.ModelID, view.ViewID, SaveDraftRequest{
		Draft: DraftPayload{
			Model: mustJSON(t, modelPayload),
			View:  mustJSON(t, viewPayload),
		},
		ExpectedVersions: ExpectedVersions{
			Model: int64Ptr(model.Version),
			View:  int64Ptr(view.Version),
		},
	})
	if err != nil {
		t.Fatalf("SaveDraft returned error: %v", err)
	}
	if repo.lastRuntimePlan == nil {
		t.Fatalf("expected runtime plan to be captured")
	}

	field := findRuntimeFieldPlanByID(repo.lastRuntimePlan.RootScope.Fields, "state")
	if field == nil {
		t.Fatalf("expected state field in runtime plan, got %#v", repo.lastRuntimePlan.RootScope.Fields)
	}
	if field.LookupTargetName != "vw_state" {
		t.Fatalf("state lookup target = %q, want %q", field.LookupTargetName, "vw_state")
	}
	if field.LookupTargetTenantScoped {
		t.Fatalf("state lookup target tenant scope = %v, want false", field.LookupTargetTenantScoped)
	}

	viewSQL, lookupOutputs := buildRuntimeScopeDataViewSQL(repo.lastRuntimePlan.RootScope)
	if !strings.Contains(viewSQL, `"public"."vw_state" "lk_state"`) {
		t.Fatalf("expected global lookup join in data view SQL, got %s", viewSQL)
	}
	if strings.Contains(viewSQL, `"t"."tenant_id" = "lk_state"."tenant_id"`) {
		t.Fatalf("expected no tenant-scoped lookup join for global state lookup, got %s", viewSQL)
	}
	if !strings.Contains(viewSQL, `"lk_state"."name"`) || !strings.Contains(viewSQL, `"state__label"`) {
		t.Fatalf("expected state label expression in data view SQL, got %s", viewSQL)
	}
	if !containsRuntimeLookupOutputResult(lookupOutputs, "state__label") {
		t.Fatalf("expected state__label runtime output, got %#v", lookupOutputs)
	}
	if out.RuntimeApply == nil || out.RuntimeApply.StorageResults == nil {
		t.Fatalf("expected runtime apply summary, got %#v", out.RuntimeApply)
	}
	if !containsRuntimeLookupOutputResult(out.RuntimeApply.StorageResults.RootScope.LookupOutputs, "state__label") {
		t.Fatalf("expected state__label in runtime summary, got %#v", out.RuntimeApply.StorageResults.RootScope.LookupOutputs)
	}
}

func TestSaveDraftBuildsRuntimeApplyLookupOutputsForCompanyLookupStateName(t *testing.T) {
	repo := newMemoryRepository()
	model, view := seedCanonicalModelAndDefaultView(t, repo)
	svc := NewService(repo)

	modelPayload := mustDecodeJSONMap(t, model.DefinitionJSON)
	dataSchema := asMap(modelPayload["dataSchema"])
	rootScope := asMap(dataSchema["rootScope"])
	rootScope["fields"] = append(asSlice(rootScope["fields"]), map[string]any{
		"displayName":   "Company",
		"id":            "company",
		"key":           "company",
		"kind":          "db_lookup",
		"label":         "Company",
		"lookupConfig":  map[string]any{"sourceModel": "companies"},
		"preset":        "company_lookup",
		"schemaScopeId": "root",
		"selectionMode": "single",
		"storageKey":    "company",
	})
	layoutBlueprint := asMap(modelPayload["layoutBlueprint"])
	rootBlueprint := asMap(layoutBlueprint["rootScope"])
	rootBlueprint["fieldPlacements"] = append(asSlice(rootBlueprint["fieldPlacements"]), map[string]any{
		"containerKey": scopeRootPlacementKey,
		"fieldId":      "company",
		"order":        1,
	})

	viewPayload := mustDecodeJSONMap(t, view.DefinitionJSON)
	uiSchema := asMap(viewPayload["uiSchema"])
	rootUIScope := asMap(uiSchema["rootScope"])
	rootUIScope["nodes"] = append(asSlice(rootUIScope["nodes"]), map[string]any{
		"fieldId":    "company",
		"id":         "field-company",
		"order":      2,
		"parentId":   nil,
		"title":      "Company",
		"type":       "field",
		"visibility": "visible",
	})

	out, err := svc.SaveDraft(testContext(), model.ModelID, view.ViewID, SaveDraftRequest{
		Draft: DraftPayload{
			Model: mustJSON(t, modelPayload),
			View:  mustJSON(t, viewPayload),
		},
		ExpectedVersions: ExpectedVersions{
			Model: int64Ptr(model.Version),
			View:  int64Ptr(view.Version),
		},
	})
	if err != nil {
		t.Fatalf("SaveDraft returned error: %v", err)
	}
	if repo.lastRuntimePlan == nil {
		t.Fatalf("expected runtime plan to be captured")
	}

	field := findRuntimeFieldPlanByID(repo.lastRuntimePlan.RootScope.Fields, "company")
	if field == nil {
		t.Fatalf("expected company field in runtime plan, got %#v", repo.lastRuntimePlan.RootScope.Fields)
	}
	if !containsLookupOutputColumn(field.LookupDerivedOutputs, "company__state") {
		t.Fatalf("expected company__state output, got %#v", field.LookupDerivedOutputs)
	}

	viewSQL, lookupOutputs := buildRuntimeScopeDataViewSQL(repo.lastRuntimePlan.RootScope)
	if !strings.Contains(viewSQL, `"public"."state" "lk_company_state"`) {
		t.Fatalf("expected state join in company data view SQL, got %s", viewSQL)
	}
	if !strings.Contains(viewSQL, `"t"."tenant_id" = "lk_company"."tenant_id"`) {
		t.Fatalf("expected tenant-scoped company join in data view SQL, got %s", viewSQL)
	}
	if !strings.Contains(viewSQL, `"company__state"`) {
		t.Fatalf("expected company__state projection in data view SQL, got %s", viewSQL)
	}
	if !containsRuntimeLookupOutputResult(lookupOutputs, "company__state") {
		t.Fatalf("expected company__state runtime output, got %#v", lookupOutputs)
	}
	if out.RuntimeApply == nil || out.RuntimeApply.StorageResults == nil {
		t.Fatalf("expected runtime apply summary, got %#v", out.RuntimeApply)
	}
	if !containsRuntimeLookupOutputResult(out.RuntimeApply.StorageResults.RootScope.LookupOutputs, "company__state") {
		t.Fatalf("expected company__state in runtime summary, got %#v", out.RuntimeApply.StorageResults.RootScope.LookupOutputs)
	}
}

func TestSaveDraftBuildsRuntimeApplyLookupOutputsForMultiLookupGridColumns(t *testing.T) {
	repo := newMemoryRepository()
	model, view := seedCanonicalModelAndDefaultView(t, repo)
	svc := NewService(repo)

	modelPayload := mustDecodeJSONMap(t, model.DefinitionJSON)
	dataSchema := asMap(modelPayload["dataSchema"])
	rootScope := asMap(dataSchema["rootScope"])
	rootScope["fields"] = append(asSlice(rootScope["fields"]), map[string]any{
		"displayName":   "Assigned Contacts",
		"id":            "assigned-contacts",
		"key":           "assigned-contacts",
		"kind":          "db_lookup",
		"label":         "Assigned Contacts",
		"lookupConfig":  map[string]any{"sourceModel": "contacts"},
		"preset":        "contact_lookup",
		"schemaScopeId": "root",
		"selectionMode": "multiple",
		"storageKey":    "assigned_contacts",
	})
	layoutBlueprint := asMap(modelPayload["layoutBlueprint"])
	rootBlueprint := asMap(layoutBlueprint["rootScope"])
	rootBlueprint["unplacedFieldIds"] = append(normalizeStringList(rootBlueprint["unplacedFieldIds"]), "assigned-contacts")

	viewPayload := mustDecodeJSONMap(t, view.DefinitionJSON)

	out, err := svc.SaveDraft(testContext(), model.ModelID, view.ViewID, SaveDraftRequest{
		Draft: DraftPayload{
			Model: mustJSON(t, modelPayload),
			View:  mustJSON(t, viewPayload),
		},
		ExpectedVersions: ExpectedVersions{
			Model: int64Ptr(model.Version),
			View:  int64Ptr(view.Version),
		},
	})
	if err != nil {
		t.Fatalf("SaveDraft returned error: %v", err)
	}
	if repo.lastRuntimePlan == nil {
		t.Fatalf("expected runtime plan to be captured")
	}

	field := findRuntimeFieldPlanByID(repo.lastRuntimePlan.RootScope.Fields, "assigned-contacts")
	if field == nil {
		t.Fatalf("expected assigned-contacts field in runtime plan, got %#v", repo.lastRuntimePlan.RootScope.Fields)
	}
	if !field.MultiValue {
		t.Fatalf("expected assigned-contacts to use multivalue storage, got %#v", field)
	}
	if !containsLookupOutputColumn(field.LookupDerivedOutputs, "assigned_contacts__labels") || !containsLookupOutputColumn(field.LookupDerivedOutputs, "assigned_contacts__count") {
		t.Fatalf("expected labels/count lookup outputs, got %#v", field.LookupDerivedOutputs)
	}

	viewSQL, lookupOutputs := buildRuntimeScopeDataViewSQL(repo.lastRuntimePlan.RootScope)
	if !strings.Contains(viewSQL, `"public"."ps_site_audit__mv"`) {
		t.Fatalf("expected multivalue bridge table reference in data view SQL, got %s", viewSQL)
	}
	if !strings.Contains(viewSQL, `mv."tenant_id" = t."tenant_id"`) {
		t.Fatalf("expected tenant-scoped multivalue subquery in data view SQL, got %s", viewSQL)
	}
	if !strings.Contains(viewSQL, `"assigned_contacts__labels"`) || !strings.Contains(viewSQL, `"assigned_contacts__count"`) {
		t.Fatalf("expected multivalue lookup outputs in data view SQL, got %s", viewSQL)
	}
	if !containsRuntimeLookupOutputResult(lookupOutputs, "assigned_contacts__labels") || !containsRuntimeLookupOutputResult(lookupOutputs, "assigned_contacts__count") {
		t.Fatalf("expected multivalue runtime outputs, got %#v", lookupOutputs)
	}
	if out.RuntimeApply == nil || out.RuntimeApply.StorageResults == nil {
		t.Fatalf("expected runtime apply summary, got %#v", out.RuntimeApply)
	}
	if out.RuntimeApply.StorageResults.RootScope.MultiValueTable == nil {
		t.Fatalf("expected multivalue table artifact in runtime summary")
	}
}

func TestSaveDraftBuildsRuntimeRootGridViewFromLookupOutputPseudoFieldIDs(t *testing.T) {
	repo := newMemoryRepository()
	model, view := seedCanonicalModelAndDefaultView(t, repo)
	svc := NewService(repo)

	modelPayload := mustDecodeJSONMap(t, model.DefinitionJSON)
	dataSchema := asMap(modelPayload["dataSchema"])
	rootScope := asMap(dataSchema["rootScope"])
	rootScope["fields"] = append(asSlice(rootScope["fields"]), map[string]any{
		"displayName":   "Reported By",
		"id":            "reported-by",
		"key":           "reported-by",
		"kind":          "db_lookup",
		"label":         "Reported By",
		"lookupConfig":  map[string]any{"sourceModel": "contacts"},
		"preset":        "contact_lookup",
		"schemaScopeId": "root",
		"selectionMode": "single",
		"storageKey":    "reported_by",
	})
	layoutBlueprint := asMap(modelPayload["layoutBlueprint"])
	rootBlueprint := asMap(layoutBlueprint["rootScope"])
	rootBlueprint["fieldPlacements"] = append(asSlice(rootBlueprint["fieldPlacements"]), map[string]any{
		"containerKey": scopeRootPlacementKey,
		"fieldId":      "reported-by",
		"order":        1,
	})

	viewPayload := mustDecodeJSONMap(t, view.DefinitionJSON)
	uiSchema := asMap(viewPayload["uiSchema"])
	rootUIScope := asMap(uiSchema["rootScope"])
	rootUIScope["nodes"] = append(asSlice(rootUIScope["nodes"]), map[string]any{
		"fieldId":    "reported-by",
		"id":         "field-reported-by",
		"order":      2,
		"parentId":   nil,
		"title":      "Reported By",
		"type":       "field",
		"visibility": "visible",
	})
	rootUIScope["viewSettings"] = map[string]any{
		"list": map[string]any{
			"columns": []any{
				map[string]any{
					"fieldId": "reported-by",
					"id":      "grid-column-reported-by",
					"order":   1,
					"visible": true,
				},
				map[string]any{
					"fieldId": "reported-by::lookup_output::company_name",
					"id":      "grid-column-reported-by-company-name",
					"order":   2,
					"visible": true,
				},
			},
		},
	}

	out, err := svc.SaveDraft(testContext(), model.ModelID, view.ViewID, SaveDraftRequest{
		Draft: DraftPayload{
			Model: mustJSON(t, modelPayload),
			View:  mustJSON(t, viewPayload),
		},
		ExpectedVersions: ExpectedVersions{
			Model: int64Ptr(model.Version),
			View:  int64Ptr(view.Version),
		},
	})
	if err != nil {
		t.Fatalf("SaveDraft returned error: %v", err)
	}
	if repo.lastRuntimePlan == nil {
		t.Fatalf("expected runtime plan to be captured")
	}

	grid := findGridViewPlan(repo.lastRuntimePlan.RootScope.GridViews, "vg_site_audit__default")
	if grid == nil {
		t.Fatalf("expected default root grid view in runtime plan")
	}
	wantColumns := []string{
		"_id",
		"tenant_id",
		"_guid",
		"_created_at",
		"_updated_at",
		"reported_by",
		"reported_by__company_name",
	}
	if !reflect.DeepEqual(grid.ColumnNames, wantColumns) {
		t.Fatalf("root lookup-output grid columns = %#v, want %#v", grid.ColumnNames, wantColumns)
	}
	gridSQL := buildRuntimeGridViewSQL(repo.lastRuntimePlan.RootScope.DataViewName, *grid)
	if !strings.Contains(gridSQL, `v."reported_by__label" AS "reported_by"`) {
		t.Fatalf("expected reported_by label alias in grid SQL, got %s", gridSQL)
	}
	if !strings.Contains(gridSQL, `v."reported_by__company_name"`) {
		t.Fatalf("expected company_name lookup output in grid SQL, got %s", gridSQL)
	}
	if out.RuntimeApply == nil || out.RuntimeApply.StorageResults == nil {
		t.Fatalf("expected runtime apply summary, got %#v", out.RuntimeApply)
	}
	foundDefaultGridArtifact := false
	for _, artifact := range out.RuntimeApply.StorageResults.RootScope.GridViews {
		if artifact.Name == "vg_site_audit__default" {
			foundDefaultGridArtifact = true
			break
		}
	}
	if !foundDefaultGridArtifact {
		t.Fatalf("expected default grid artifact in runtime summary, got %#v", out.RuntimeApply.StorageResults.RootScope.GridViews)
	}
}

func TestSaveDraftReturnsSuccessWhenRuntimeApplyFails(t *testing.T) {
	repo := newMemoryRepository()
	repo.runtimeApplyErr = errors.New("runtime apply exploded")
	model, view := seedCanonicalModelAndDefaultView(t, repo)
	svc := NewService(repo)

	modelPayload := mustDecodeJSONMap(t, model.DefinitionJSON)
	viewPayload := mustDecodeJSONMap(t, view.DefinitionJSON)

	out, err := svc.SaveDraft(testContext(), model.ModelID, view.ViewID, SaveDraftRequest{
		Draft: DraftPayload{
			Model: mustJSON(t, modelPayload),
			View:  mustJSON(t, viewPayload),
		},
		ExpectedVersions: ExpectedVersions{
			Model: int64Ptr(model.Version),
			View:  int64Ptr(view.Version),
		},
	})
	if err != nil {
		t.Fatalf("SaveDraft returned error: %v", err)
	}
	if out.RuntimeApply == nil {
		t.Fatalf("expected failed runtime summary in save response")
	}
	if out.RuntimeApply.Status != "failed" {
		t.Fatalf("runtime apply status = %q, want %q", out.RuntimeApply.Status, "failed")
	}
	if out.RuntimeApply.Context == nil {
		t.Fatalf("expected runtime apply context in save response")
	}
	if out.RuntimeApply.Context.TenantID != "101" {
		t.Fatalf("runtime tenant id = %q, want %q", out.RuntimeApply.Context.TenantID, "101")
	}
	if out.RuntimeApply.Context.ModelID != model.ModelID {
		t.Fatalf("runtime model id = %q, want %q", out.RuntimeApply.Context.ModelID, model.ModelID)
	}
	if out.RuntimeApply.Context.ViewID != view.ViewID {
		t.Fatalf("runtime view id = %q, want %q", out.RuntimeApply.Context.ViewID, view.ViewID)
	}
	if !strings.Contains(out.RuntimeApply.Message, "tenant_id=101") {
		t.Fatalf("runtime apply message = %q, want tenant context", out.RuntimeApply.Message)
	}
	if !strings.Contains(out.RuntimeApply.Message, "model_id="+model.ModelID) {
		t.Fatalf("runtime apply message = %q, want model context", out.RuntimeApply.Message)
	}
	if !strings.Contains(out.RuntimeApply.Message, "view_id="+view.ViewID) {
		t.Fatalf("runtime apply message = %q, want view context", out.RuntimeApply.Message)
	}
	if !containsValidationCode(out.ValidationSummary.Warnings, "runtime_apply_failed") {
		t.Fatalf("expected runtime apply warning in validation summary, got %#v", out.ValidationSummary.Warnings)
	}
	if !containsValidationMessage(out.ValidationSummary.Warnings, "tenant_id=101") {
		t.Fatalf("expected runtime apply warning message with tenant context, got %#v", out.ValidationSummary.Warnings)
	}

	persistedModel := repo.models[model.ModelID]
	if persistedModel == nil {
		t.Fatalf("expected saved model to remain persisted after runtime failure")
	}
	if persistedModel.Version != model.Version {
		t.Fatalf("expected saved authoring version to remain %d, got %d", model.Version, persistedModel.Version)
	}
}

func int64Ptr(v int64) *int64 {
	return &v
}

func mustJSON(t *testing.T, value any) json.RawMessage {
	t.Helper()
	encoded, err := json.Marshal(value)
	if err != nil {
		t.Fatalf("marshal json: %v", err)
	}
	return json.RawMessage(encoded)
}

func mustDecodeJSONMap(t *testing.T, raw json.RawMessage) map[string]any {
	t.Helper()
	var out map[string]any
	if err := json.Unmarshal(raw, &out); err != nil {
		t.Fatalf("decode json map: %v", err)
	}
	return out
}

func setRootFieldNodeTitle(viewPayload map[string]any, fieldID, title string) {
	uiSchema := asMap(viewPayload["uiSchema"])
	rootScope := asMap(uiSchema["rootScope"])
	for _, rawNode := range asSlice(rootScope["nodes"]) {
		node := asMap(rawNode)
		if normalizeString(node["type"]) != "field" {
			continue
		}
		if normalizeString(node["fieldId"]) != fieldID {
			continue
		}
		node["title"] = title
		return
	}
}

func rootFieldNodeTitle(viewPayload map[string]any, fieldID string) string {
	uiSchema := asMap(viewPayload["uiSchema"])
	rootScope := asMap(uiSchema["rootScope"])
	for _, rawNode := range asSlice(rootScope["nodes"]) {
		node := asMap(rawNode)
		if normalizeString(node["type"]) != "field" {
			continue
		}
		if normalizeString(node["fieldId"]) != fieldID {
			continue
		}
		return normalizeString(node["title"])
	}
	return ""
}

func containsValidationCode(messages []ValidationMessage, code string) bool {
	for _, message := range messages {
		if message.Code == code {
			return true
		}
	}
	return false
}

func containsValidationMessage(messages []ValidationMessage, needle string) bool {
	for _, message := range messages {
		if strings.Contains(message.Message, needle) {
			return true
		}
	}
	return false
}

func findRuntimeFieldPlanByID(fields []runtimeApplyFieldPlan, fieldID string) *runtimeApplyFieldPlan {
	for index := range fields {
		if fields[index].FieldID == fieldID {
			return &fields[index]
		}
	}
	return nil
}

func containsLookupOutputColumn(outputs []runtimeApplyLookupOutputPlan, columnName string) bool {
	for _, output := range outputs {
		if output.ColumnName == columnName {
			return true
		}
	}
	return false
}

func containsRuntimeLookupOutputResult(outputs []RuntimeApplyLookupOutputResult, columnName string) bool {
	for _, output := range outputs {
		if output.ColumnName == columnName {
			return true
		}
	}
	return false
}

func seedCanonicalModelAndDefaultView(t *testing.T, repo *memoryRepository) (*ModelRecord, *ViewRecord) {
	t.Helper()

	dataSchema := map[string]any{
		"modelId":    "site-audit",
		"modelTitle": "Site Audit",
		"rootScope": map[string]any{
			"fields": []any{
				map[string]any{"displayName": "Site Name", "id": "site-name", "key": "site-name", "kind": "short_text", "label": "Site Name", "schemaScopeId": "root", "storageKey": "site_name"},
			},
			"schemaScopeId": "root",
			"scopeType":     "ROOT",
		},
		"subformScopes": []any{
			map[string]any{
				"displayName":   "Info",
				"fields":        []any{map[string]any{"displayName": "Info Date", "id": "info-date", "key": "info-date", "kind": "date", "label": "Info Date", "schemaScopeId": "pb_info", "storageKey": "info_date"}},
				"schemaScopeId": "pb_info",
				"scopeType":     "SUBFORM",
				"subformType":   "DEFAULT",
				"tableKey":      "pb_info",
			},
		},
	}
	layoutBlueprint := map[string]any{
		"rootScope": map[string]any{
			"containers": []any{
				map[string]any{"containerKey": "root.section.summary", "order": 0, "parentContainerKey": "", "title": "Summary", "type": "section"},
				map[string]any{"containerKey": "root.subform.pb_info", "order": 1, "parentContainerKey": "", "schemaScopeId": "pb_info", "subformType": "DEFAULT", "tableKey": "pb_info", "title": "Info", "type": "subform"},
			},
			"fieldPlacements": []any{
				map[string]any{"containerKey": "root.section.summary", "fieldId": "site-name", "order": 0},
			},
			"schemaScopeId":    "root",
			"unplacedFieldIds": []string{},
		},
		"subformScopes": []any{
			map[string]any{
				"containers": []any{
					map[string]any{"containerKey": "pb_info.section.details", "order": 0, "parentContainerKey": "", "title": "Details", "type": "section"},
				},
				"fieldPlacements": []any{
					map[string]any{"containerKey": "pb_info.section.details", "fieldId": "info-date", "order": 0},
				},
				"schemaScopeId":    "pb_info",
				"unplacedFieldIds": []string{},
			},
		},
	}
	modelPayload := map[string]any{
		"canEditViewsOnly":      false,
		"dataSchema":            dataSchema,
		"description":           "Site audit model",
		"displayName":           "Site Audit",
		"id":                    "site-audit",
		"isStructureLocked":     false,
		"key":                   "site-audit",
		"layoutBlueprint":       layoutBlueprint,
		"modelLocked":           false,
		"modelStructureVersion": 4,
		"name":                  "Site Audit",
		"sourceType":            "managed",
		"storageKey":            "site_audit",
		"title":                 "Site Audit",
		"version":               4,
	}
	viewPayload := map[string]any{
		"description":                      "Default view",
		"displayName":                      "Default",
		"id":                               "view-default",
		"isActive":                         true,
		"isDefault":                        true,
		"isViewLocked":                     false,
		"key":                              "default",
		"kind":                             "form",
		"lastAlignedModelStructureVersion": 4,
		"modelId":                          "site-audit",
		"name":                             "Default",
		"title":                            "Default",
		"uiSchema":                         buildFreshUISchema(dataSchema, layoutBlueprint),
		"viewVersion":                      2,
		"version":                          2,
	}

	model := &ModelRecord{
		ModelID:           "site-audit",
		ModelKey:          "site-audit",
		StorageKey:        "site_audit",
		DisplayName:       "Site Audit",
		Description:       "Site audit model",
		SourceType:        "managed",
		Status:            "draft",
		Version:           4,
		PublishedVersion:  1,
		StructureVersion:  4,
		IsStructureLocked: false,
		CanEditViewsOnly:  false,
		DefinitionJSON:    mustJSON(t, modelPayload),
	}
	view := &ViewRecord{
		ModelID:                          "site-audit",
		ViewID:                           "view-default",
		ViewKey:                          "default",
		DisplayName:                      "Default",
		Description:                      "Default view",
		ViewType:                         "form",
		IsDefault:                        true,
		IsActive:                         true,
		IsViewLocked:                     false,
		Status:                           "draft",
		Version:                          2,
		PublishedVersion:                 1,
		LastAlignedModelStructureVersion: 4,
		DefinitionJSON:                   mustJSON(t, viewPayload),
		PublishedArtifactsJSON:           mustJSON(t, map[string]any{}),
	}

	repo.models[model.ModelID] = model
	if repo.views[model.ModelID] == nil {
		repo.views[model.ModelID] = map[string]*ViewRecord{}
	}
	repo.views[model.ModelID][view.ViewID] = view
	return model, view
}

func seedExternalModelAndDefaultView(t *testing.T, repo *memoryRepository, modelID string) (*ModelRecord, *ViewRecord) {
	t.Helper()

	tempRepo := newMemoryRepository()
	model, view := seedCanonicalModelAndDefaultView(t, tempRepo)

	model.ModelID = modelID
	model.ModelKey = modelID
	model.StorageKey = strings.ReplaceAll(modelID, "-", "_")
	model.DisplayName = modelID
	model.SourceType = "external"
	modelPayload := mustDecodeJSONMap(t, model.DefinitionJSON)
	modelPayload["id"] = modelID
	modelPayload["key"] = modelID
	modelPayload["storageKey"] = model.StorageKey
	modelPayload["displayName"] = modelID
	modelPayload["title"] = modelID
	modelPayload["name"] = modelID
	modelPayload["sourceType"] = "external"
	model.DefinitionJSON = mustJSON(t, modelPayload)

	view.ModelID = modelID
	viewPayload := mustDecodeJSONMap(t, view.DefinitionJSON)
	viewPayload["modelId"] = modelID
	view.DefinitionJSON = mustJSON(t, viewPayload)

	repo.models[model.ModelID] = model
	repo.views[model.ModelID] = map[string]*ViewRecord{view.ViewID: view}
	return model, view
}

func seedRootOnlyExternalModelAndDefaultView(t *testing.T, repo *memoryRepository, modelID string) (*ModelRecord, *ViewRecord) {
	t.Helper()

	storageKey := strings.ReplaceAll(modelID, "-", "_")
	modelPayload := map[string]any{
		"id":                    modelID,
		"key":                   modelID,
		"displayName":           modelID,
		"title":                 modelID,
		"name":                  modelID,
		"description":           "",
		"storageKey":            storageKey,
		"sourceType":            "external",
		"isStructureLocked":     false,
		"canEditViewsOnly":      false,
		"modelStructureVersion": 1,
		"version":               1,
		"dataSchema": map[string]any{
			"modelId":    modelID,
			"modelTitle": modelID,
			"rootScope": map[string]any{
				"schemaScopeId": "root",
				"fields": []any{
					map[string]any{
						"id":         "state-name",
						"kind":       "short_text",
						"label":      "State Name",
						"storageKey": "state_name",
					},
				},
				"runtime": map[string]any{
					"tableName":            storageKey,
					"dataViewName":         "vw_" + storageKey,
					"rtAlias":              storageKey,
					"sourceIdColumn":       "id",
					"tenantScoped":         false,
					"sourceTenantIdColumn": "",
				},
			},
			"subformScopes": []any{},
		},
		"layoutBlueprint": map[string]any{
			"rootScope": map[string]any{
				"schemaScopeId": "root",
				"containers":    []any{},
				"fieldPlacements": []any{
					map[string]any{
						"containerKey": "__scope_root__",
						"fieldId":      "state-name",
						"order":        0,
					},
				},
				"unplacedFieldIds": []any{},
			},
			"subformScopes": []any{},
		},
	}
	viewPayload := map[string]any{
		"id":                               "view-default",
		"key":                              "default",
		"modelId":                          modelID,
		"displayName":                      modelID,
		"title":                            modelID,
		"name":                             modelID,
		"description":                      "",
		"kind":                             "form",
		"isDefault":                        true,
		"isActive":                         true,
		"isViewLocked":                     false,
		"lastAlignedModelStructureVersion": 1,
		"viewVersion":                      1,
		"version":                          1,
		"uiSchema": map[string]any{
			"isDefault": true,
			"isActive":  true,
			"viewId":    "view-default",
			"viewKey":   "default",
			"rootScope": map[string]any{
				"schemaScopeId": "root",
				"nodes": []any{
					map[string]any{
						"id":      "field-state-name",
						"type":    "field",
						"fieldId": "state-name",
						"order":   0,
					},
				},
				"runtime": map[string]any{
					"dataViewName": "vw_" + storageKey,
					"gridViewName": "vg_" + storageKey + "__default",
					"viewRtAlias":  "default",
				},
				"viewSettings": map[string]any{
					"list": map[string]any{
						"columns": []any{
							map[string]any{
								"id":      "column-state-name",
								"fieldId": "state-name",
								"order":   0,
							},
						},
					},
				},
			},
			"subformScopes": []any{},
		},
	}

	model := &ModelRecord{
		ModelID:          modelID,
		ModelKey:         modelID,
		StorageKey:       storageKey,
		DisplayName:      modelID,
		SourceType:       "external",
		Status:           "draft",
		Version:          1,
		StructureVersion: 1,
		DefinitionJSON:   mustJSON(t, modelPayload),
	}
	view := &ViewRecord{
		ModelID:                          modelID,
		ViewID:                           "view-default",
		ViewKey:                          "default",
		DisplayName:                      modelID,
		ViewType:                         "form",
		IsActive:                         true,
		IsDefault:                        true,
		Status:                           "draft",
		Version:                          1,
		LastAlignedModelStructureVersion: 1,
		DefinitionJSON:                   mustJSON(t, viewPayload),
		PublishedArtifactsJSON:           mustJSON(t, map[string]any{}),
	}

	repo.models[model.ModelID] = model
	if repo.views[model.ModelID] == nil {
		repo.views[model.ModelID] = map[string]*ViewRecord{}
	}
	repo.views[model.ModelID][view.ViewID] = view
	return model, view
}

func hasNodeWithFieldID(nodes []any, fieldID string) bool {
	for _, rawNode := range nodes {
		node := asMap(rawNode)
		if normalizeString(node["type"]) == "field" && normalizeString(node["fieldId"]) == fieldID {
			return true
		}
	}
	return false
}

func findFieldNodeByID(nodes []any, fieldID string) map[string]any {
	for _, rawNode := range nodes {
		node := asMap(rawNode)
		if normalizeString(node["type"]) == "field" && normalizeString(node["fieldId"]) == fieldID {
			return node
		}
	}
	return nil
}

func findDataSchemaFieldByID(fields []any, fieldID string) map[string]any {
	for _, rawField := range fields {
		field := asMap(rawField)
		if normalizeString(field["id"]) == fieldID || normalizeString(field["fieldId"]) == fieldID {
			return field
		}
	}
	return nil
}

func findNodeByTypeAndScope(nodes []any, nodeType string, scopeID string) map[string]any {
	for _, rawNode := range nodes {
		node := asMap(rawNode)
		if normalizeString(node["type"]) != nodeType {
			continue
		}
		if chooseString(normalizeString(node["schemaScopeId"]), normalizeString(node["tableKey"])) == scopeID {
			return node
		}
	}
	return nil
}

func findUISubformScope(uiSchema map[string]any, scopeID string) map[string]any {
	for _, rawScope := range asSlice(uiSchema["subformScopes"]) {
		scope := asMap(rawScope)
		if normalizeString(scope["schemaScopeId"]) == scopeID {
			return scope
		}
	}
	return nil
}

func hasContainerWithType(containers []any, containerType string) bool {
	for _, rawContainer := range containers {
		if normalizeString(asMap(rawContainer)["type"]) == containerType {
			return true
		}
	}
	return false
}

func hasSubformBlueprintContainer(containers []any, scopeID string) bool {
	for _, rawContainer := range containers {
		container := asMap(rawContainer)
		if normalizeString(container["type"]) != "subform" {
			continue
		}
		if chooseString(normalizeString(container["schemaScopeId"]), normalizeString(container["tableKey"])) == scopeID {
			return true
		}
	}
	return false
}

func hasFieldPlacementWithContainerKey(placements []any, fieldID string, containerKey string) bool {
	for _, rawPlacement := range placements {
		placement := asMap(rawPlacement)
		if normalizeString(placement["fieldId"]) == fieldID && normalizeString(placement["containerKey"]) == containerKey {
			return true
		}
	}
	return false
}

func hasContainerKeyOnType(nodes []any, nodeType string) bool {
	for _, rawNode := range nodes {
		node := asMap(rawNode)
		if normalizeString(node["type"]) == nodeType && normalizeString(node["containerKey"]) != "" {
			return true
		}
	}
	return false
}

func containsGridViewPlan(plans []runtimeApplyGridViewPlan, name string) bool {
	return findGridViewPlan(plans, name) != nil
}

func findGridViewPlan(plans []runtimeApplyGridViewPlan, name string) *runtimeApplyGridViewPlan {
	for i := range plans {
		if plans[i].Name == name {
			return &plans[i]
		}
	}
	return nil
}
