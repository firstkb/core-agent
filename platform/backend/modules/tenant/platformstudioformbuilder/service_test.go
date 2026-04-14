package platformstudioformbuilder

import (
	"context"
	"encoding/json"
	"errors"
	"reflect"
	"sort"
	"testing"

	"dtriton.com/platform/backend/internal/platform/httpx/requestctx"
)

type memoryRepository struct {
	models map[string]*ModelRecord
	views  map[string]map[string]*ViewRecord
}

func newMemoryRepository() *memoryRepository {
	return &memoryRepository{
		models: map[string]*ModelRecord{},
		views:  map[string]map[string]*ViewRecord{},
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

func cloneModelRecord(record *ModelRecord) ModelRecord {
	if record == nil {
		return ModelRecord{}
	}
	clone := *record
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

func testContext() context.Context {
	ctx := context.Background()
	ctx = requestctx.WithClaims(ctx, requestctx.ClaimsInfo{
		TenantID: "101",
		UserID:   "11111111-1111-1111-1111-111111111111",
		Level:    20,
		Role:     "member",
	})
	ctx = requestctx.WithTenant(ctx, requestctx.TenantInfo{
		ID:             "101",
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
	if !reflect.DeepEqual(asMap(copiedPayload["uiSchema"]), asMap(sourcePayload["uiSchema"])) {
		t.Fatalf("copied uiSchema does not match source:\nsource=%#v\ncopied=%#v", asMap(sourcePayload["uiSchema"]), asMap(copiedPayload["uiSchema"]))
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

	out, err := svc.SaveDraft(testContext(), "site-audit", "view-default", SaveDraftRequest{
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

func seedCanonicalModelAndDefaultView(t *testing.T, repo *memoryRepository) (*ModelRecord, *ViewRecord) {
	t.Helper()

	dataSchema := map[string]any{
		"modelId":    "site-audit",
		"modelTitle": "Site Audit",
		"rootScope": map[string]any{
			"fields": []any{
				map[string]any{"displayName": "Site Name", "id": "site-name", "key": "site-name", "label": "Site Name", "schemaScopeId": "root"},
			},
			"schemaScopeId": "root",
			"scopeType":     "ROOT",
		},
		"subformScopes": []any{
			map[string]any{
				"displayName":   "Info",
				"fields":        []any{map[string]any{"displayName": "Info Date", "id": "info-date", "key": "info-date", "label": "Info Date", "schemaScopeId": "pb_info"}},
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
