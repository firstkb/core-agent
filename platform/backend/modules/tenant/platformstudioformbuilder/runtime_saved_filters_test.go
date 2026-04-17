package platformstudioformbuilder

import (
	"testing"

	collectiontable "dtriton.com/platform/backend/modules/shared/collectiontable"
)

func TestLoadRuntimeViewListMetaIncludesSavedFilterSets(t *testing.T) {
	repo := newMemoryRepository()
	model, view := seedCanonicalModelAndDefaultView(t, repo)
	repo.runtimeSavedFilters["form_builder_view:"+model.ModelID+":"+view.ViewID] = []collectiontable.SavedFilterSet{
		{
			ID:    "filter-1",
			Label: "Only HQ",
			QuickFilters: []collectiontable.QuickFilter{
				{FieldID: "site_name", Operator: "contains", Value: "HQ"},
			},
		},
	}

	svc := NewService(repo)
	out, err := svc.LoadRuntimeViewListMeta(rootTestContext(), model.ModelID, view.ViewID)
	if err != nil {
		t.Fatalf("LoadRuntimeViewListMeta returned error: %v", err)
	}

	if len(out.SavedFilterSets) != 1 || out.SavedFilterSets[0].Label != "Only HQ" {
		t.Fatalf("saved filter sets = %#v, want Only HQ", out.SavedFilterSets)
	}
}

func TestCreateRuntimeViewListSavedFilterUsesRuntimeSurface(t *testing.T) {
	repo := newMemoryRepository()
	model, view := seedCanonicalModelAndDefaultView(t, repo)

	svc := NewService(repo)
	out, err := svc.CreateRuntimeViewListSavedFilter(rootTestContext(), model.ModelID, view.ViewID, RuntimeViewListCreateSavedFilterInput{
		Label: "Only HQ",
		QuickFilters: []collectiontable.QuickFilter{
			{FieldID: "site_name", Operator: "contains", Value: "HQ"},
		},
	})
	if err != nil {
		t.Fatalf("CreateRuntimeViewListSavedFilter returned error: %v", err)
	}

	if out == nil || out.Label != "Only HQ" {
		t.Fatalf("saved filter = %#v, want label Only HQ", out)
	}
	if repo.lastRuntimeSavedFilterSurface != "form_builder_view:"+model.ModelID+":"+view.ViewID {
		t.Fatalf("surface id = %q, want form_builder_view:%s:%s", repo.lastRuntimeSavedFilterSurface, model.ModelID, view.ViewID)
	}
	if repo.lastRuntimeSavedFilterPrincipal == "" {
		t.Fatal("expected saved filter principal to be captured")
	}
	if len(repo.lastRuntimeSavedFilterQuickFilters) != 1 || repo.lastRuntimeSavedFilterQuickFilters[0].Value != "HQ" {
		t.Fatalf("quick filters = %#v, want HQ filter", repo.lastRuntimeSavedFilterQuickFilters)
	}
}

func TestDeleteRuntimeViewListSavedFilterUsesRuntimeSurface(t *testing.T) {
	repo := newMemoryRepository()
	model, view := seedCanonicalModelAndDefaultView(t, repo)
	surfaceID := "form_builder_view:" + model.ModelID + ":" + view.ViewID
	repo.runtimeSavedFilters[surfaceID] = []collectiontable.SavedFilterSet{
		{ID: "filter-1", Label: "Only HQ"},
		{ID: "filter-2", Label: "Only Remote"},
	}

	svc := NewService(repo)
	out, err := svc.DeleteRuntimeViewListSavedFilter(rootTestContext(), model.ModelID, view.ViewID, "filter-1")
	if err != nil {
		t.Fatalf("DeleteRuntimeViewListSavedFilter returned error: %v", err)
	}

	if out == nil || !out.OK {
		t.Fatalf("delete response = %#v, want ok", out)
	}
	if repo.lastRuntimeSavedFilterSurface != surfaceID {
		t.Fatalf("surface id = %q, want %q", repo.lastRuntimeSavedFilterSurface, surfaceID)
	}
	if repo.lastRuntimeDeletedSavedFilterID != "filter-1" {
		t.Fatalf("deleted filter id = %q, want filter-1", repo.lastRuntimeDeletedSavedFilterID)
	}
	if len(repo.runtimeSavedFilters[surfaceID]) != 1 || repo.runtimeSavedFilters[surfaceID][0].ID != "filter-2" {
		t.Fatalf("saved filters after delete = %#v, want remaining filter-2", repo.runtimeSavedFilters[surfaceID])
	}
}
