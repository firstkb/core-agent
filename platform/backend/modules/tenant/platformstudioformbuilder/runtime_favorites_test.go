package platformstudioformbuilder

import "testing"

func TestLoadRuntimeViewListMetaIncludesFavoriteState(t *testing.T) {
	repo := newMemoryRepository()
	model, view := seedCanonicalModelAndDefaultView(t, repo)
	surfaceID := buildRuntimeViewListSurfaceID(model.ModelID, view.ViewID)
	repo.runtimeFavorites[surfaceID] = RuntimeFavoriteRecord{
		ID:         "favorite-1",
		ModelID:    model.ModelID,
		ModelTitle: model.DisplayName,
		SurfaceID:  surfaceID,
		ViewID:     view.ViewID,
		ViewTitle:  view.DisplayName,
	}

	svc := NewService(repo)
	out, err := svc.LoadRuntimeViewListMeta(rootTestContext(), model.ModelID, view.ViewID)
	if err != nil {
		t.Fatalf("LoadRuntimeViewListMeta returned error: %v", err)
	}

	if !out.Actions.Favorite.Visible || !out.Actions.Favorite.IsFavorite {
		t.Fatalf("favorite action = %#v, want visible favorite=true", out.Actions.Favorite)
	}
}

func TestToggleRuntimeViewFavoriteUsesRuntimeSurface(t *testing.T) {
	repo := newMemoryRepository()
	model, view := seedCanonicalModelAndDefaultView(t, repo)
	surfaceID := buildRuntimeViewListSurfaceID(model.ModelID, view.ViewID)

	svc := NewService(repo)
	first, err := svc.ToggleRuntimeViewFavorite(rootTestContext(), model.ModelID, view.ViewID)
	if err != nil {
		t.Fatalf("ToggleRuntimeViewFavorite returned error: %v", err)
	}
	if first == nil || !first.IsFavorite {
		t.Fatalf("first toggle = %#v, want favorite=true", first)
	}
	if repo.lastRuntimeFavoriteSurface != surfaceID {
		t.Fatalf("surface id = %q, want %q", repo.lastRuntimeFavoriteSurface, surfaceID)
	}
	if repo.lastRuntimeFavoriteModelID != model.ModelID || repo.lastRuntimeFavoriteViewID != view.ViewID {
		t.Fatalf("toggle target = %q/%q, want %q/%q", repo.lastRuntimeFavoriteModelID, repo.lastRuntimeFavoriteViewID, model.ModelID, view.ViewID)
	}

	second, err := svc.ToggleRuntimeViewFavorite(rootTestContext(), model.ModelID, view.ViewID)
	if err != nil {
		t.Fatalf("second ToggleRuntimeViewFavorite returned error: %v", err)
	}
	if second == nil || second.IsFavorite {
		t.Fatalf("second toggle = %#v, want favorite=false", second)
	}
}

func TestListRuntimeFavoritesReturnsRuntimeRoutes(t *testing.T) {
	repo := newMemoryRepository()
	model, view := seedCanonicalModelAndDefaultView(t, repo)
	surfaceID := buildRuntimeViewListSurfaceID(model.ModelID, view.ViewID)
	repo.runtimeFavorites[surfaceID] = RuntimeFavoriteRecord{
		ID:         "favorite-1",
		ModelID:    model.ModelID,
		ModelTitle: model.DisplayName,
		SurfaceID:  surfaceID,
		ViewID:     view.ViewID,
		ViewTitle:  view.DisplayName,
	}

	svc := NewService(repo)
	out, err := svc.ListRuntimeFavorites(rootTestContext())
	if err != nil {
		t.Fatalf("ListRuntimeFavorites returned error: %v", err)
	}

	if len(out.Items) != 1 {
		t.Fatalf("items = %#v, want 1 favorite", out.Items)
	}
	if out.Items[0].TargetType != runtimeViewListSurfacePrefix {
		t.Fatalf("target type = %q, want %q", out.Items[0].TargetType, runtimeViewListSurfacePrefix)
	}
	if out.Items[0].RoutePath != buildRuntimeViewRoutePath(model.ModelID, view.ViewID) {
		t.Fatalf("route path = %q, want %q", out.Items[0].RoutePath, buildRuntimeViewRoutePath(model.ModelID, view.ViewID))
	}
}
