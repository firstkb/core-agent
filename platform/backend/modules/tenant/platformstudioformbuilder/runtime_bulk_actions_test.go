package platformstudioformbuilder

import (
	"net/http"
	"net/http/httptest"
	"testing"

	"dtriton.com/platform/backend/internal/platform/httpx/requestctx"
	collectiontable "dtriton.com/platform/backend/modules/shared/collectiontable"
)

func TestLoadRuntimeViewListMetaEnablesBulkActionsForVisibleActiveAndDelete(t *testing.T) {
	repo := newMemoryRepository()
	model, view := seedCanonicalModelAndDefaultView(t, repo)
	addActiveRuntimeListColumn(t, model, view, true, true, true)

	svc := NewService(repo)
	out, err := svc.LoadRuntimeViewListMeta(rootTestContext(), model.ModelID, view.ViewID)
	if err != nil {
		t.Fatalf("LoadRuntimeViewListMeta returned error: %v", err)
	}

	if !out.Selection.Enabled || out.Selection.Mode != "multi" || out.Selection.ColumnPosition != "leading" {
		t.Fatalf("selection = %#v, want leading multi selection", out.Selection)
	}
	if len(out.BulkActions) != 3 {
		t.Fatalf("bulk actions = %#v, want active/inactive/delete", out.BulkActions)
	}
	if out.BulkActions[0].ID != "active" || out.BulkActions[0].Label != "Active" || out.BulkActions[0].Tone != "success" {
		t.Fatalf("active action = %#v", out.BulkActions[0])
	}
	if out.BulkActions[1].ID != "inactive" || out.BulkActions[1].Label != "No active" {
		t.Fatalf("inactive action = %#v", out.BulkActions[1])
	}
	if out.BulkActions[2].ID != "delete" || out.BulkActions[2].Tone != "danger" || out.BulkActions[2].Confirmation == nil {
		t.Fatalf("delete action = %#v, want danger with confirmation", out.BulkActions[2])
	}
}

func TestPreviewRuntimeListMetaKeepsBulkActions(t *testing.T) {
	repo := newMemoryRepository()
	model, view := seedCanonicalModelAndDefaultView(t, repo)
	addActiveRuntimeListColumn(t, model, view, true, true, true)

	handler := NewHandler(NewService(repo))
	req := httptest.NewRequest(http.MethodGet, "/app/platform-studio/forms/"+model.ModelID+"/views/"+view.ViewID+"/runtime/meta", nil)
	req.SetPathValue("modelId", model.ModelID)
	req.SetPathValue("viewId", view.ViewID)

	out, err := handler.LoadRuntimeViewListMeta(rootTestContext(), req, struct{}{})
	if err != nil {
		t.Fatalf("LoadRuntimeViewListMeta returned error: %v", err)
	}

	if !out.Selection.Enabled {
		t.Fatalf("selection = %#v, want enabled preview selection", out.Selection)
	}
	if len(out.BulkActions) != 3 {
		t.Fatalf("bulk actions = %#v, want active/inactive/delete in preview meta", out.BulkActions)
	}
}

func TestLoadRuntimeViewListMetaDoesNotEnableActiveWhenActiveIsNotVisible(t *testing.T) {
	repo := newMemoryRepository()
	model, view := seedCanonicalModelAndDefaultView(t, repo)
	addActiveRuntimeListColumn(t, model, view, false, true, false)

	svc := NewService(repo)
	out, err := svc.LoadRuntimeViewListMeta(rootTestContext(), model.ModelID, view.ViewID)
	if err != nil {
		t.Fatalf("LoadRuntimeViewListMeta returned error: %v", err)
	}

	if out.Selection.Enabled {
		t.Fatalf("selection = %#v, want disabled", out.Selection)
	}
	if len(out.BulkActions) != 0 {
		t.Fatalf("bulk actions = %#v, want none", out.BulkActions)
	}
}

func TestQueryRuntimeViewListMarksRowsSelectableWhenBulkActionsAvailable(t *testing.T) {
	repo := newMemoryRepository()
	model, view := seedCanonicalModelAndDefaultView(t, repo)
	addActiveRuntimeListColumn(t, model, view, true, true, false)

	svc := NewService(repo)
	runtimeContext, err := svc.loadRuntimeViewListContext(rootTestContext(), requestctx.TenantInfo{ID: "101"}, model.ModelID, view.ViewID)
	if err != nil {
		t.Fatalf("loadRuntimeViewListContext returned error: %v", err)
	}
	repo.runtimeQueryRows[runtimeContext.GridViewName] = []runtimeRelationQueryRow{
		{ID: "row-guid", Cells: map[string]string{"active": "true"}},
	}

	out, err := svc.QueryRuntimeViewList(rootTestContext(), model.ModelID, view.ViewID, RuntimeViewListQueryRequest{
		Page:     1,
		PageSize: 25,
		Sort: collectiontable.SortRequest{
			ColumnID:  "active",
			Direction: "asc",
		},
	})
	if err != nil {
		t.Fatalf("QueryRuntimeViewList returned error: %v", err)
	}
	if len(out.Rows) != 1 || !out.Rows[0].Selectable {
		t.Fatalf("rows = %#v, want selectable row", out.Rows)
	}
}

func addActiveRuntimeListColumn(t *testing.T, model *ModelRecord, view *ViewRecord, activeVisible bool, canEdit bool, canDelete bool) {
	t.Helper()

	modelPayload := mustDecodeJSONMap(t, model.DefinitionJSON)
	dataSchema := asMap(modelPayload["dataSchema"])
	rootScope := asMap(dataSchema["rootScope"])
	rootScope["fields"] = append(asSlice(rootScope["fields"]), map[string]any{
		"displayName": "Active",
		"id":          "active",
		"key":         "active",
		"kind":        "boolean",
		"label":       "Active",
		"storageKey":  "active",
	})
	dataSchema["rootScope"] = rootScope
	modelPayload["dataSchema"] = dataSchema
	model.DefinitionJSON = mustJSON(t, modelPayload)

	viewPayload := mustDecodeJSONMap(t, view.DefinitionJSON)
	uiSchema := asMap(viewPayload["uiSchema"])
	rootUIScope := asMap(uiSchema["rootScope"])
	rootUIScope["viewSettings"] = map[string]any{
		"actions": map[string]any{
			"canAdd":    true,
			"canDelete": canDelete,
			"canEdit":   canEdit,
			"canView":   true,
		},
		"list": map[string]any{
			"columns": []any{
				map[string]any{
					"fieldId": "active",
					"id":      "grid-column-active",
					"order":   0,
					"visible": activeVisible,
				},
			},
		},
	}
	uiSchema["rootScope"] = rootUIScope
	viewPayload["uiSchema"] = uiSchema
	view.DefinitionJSON = mustJSON(t, viewPayload)
}
