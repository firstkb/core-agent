package collectionprefs

import (
	"context"
	"testing"

	"github.com/google/uuid"

	collectiontable "dtriton.com/platform/backend/modules/shared/collectiontable"
)

type fakeRepository struct {
	favoriteState     bool
	toggleFavoriteOut bool
	savedFilters      []collectiontable.SavedFilterSet
	createdFilter     *collectiontable.SavedFilterSet

	lastPrincipalID uuid.UUID
	lastSurfaceID   string
	lastLabel       string
	lastQuickFilter []collectiontable.QuickFilter
}

func (f *fakeRepository) GetFavoriteState(_ context.Context, principalID uuid.UUID, surfaceID string) (bool, error) {
	f.lastPrincipalID = principalID
	f.lastSurfaceID = surfaceID
	return f.favoriteState, nil
}

func (f *fakeRepository) ToggleFavorite(_ context.Context, principalID uuid.UUID, surfaceID string) (bool, error) {
	f.lastPrincipalID = principalID
	f.lastSurfaceID = surfaceID
	return f.toggleFavoriteOut, nil
}

func (f *fakeRepository) ListSavedFilters(_ context.Context, principalID uuid.UUID, surfaceID string) ([]collectiontable.SavedFilterSet, error) {
	f.lastPrincipalID = principalID
	f.lastSurfaceID = surfaceID
	return f.savedFilters, nil
}

func (f *fakeRepository) CreateSavedFilter(_ context.Context, principalID uuid.UUID, surfaceID string, label string, quickFilters []collectiontable.QuickFilter) (*collectiontable.SavedFilterSet, error) {
	f.lastPrincipalID = principalID
	f.lastSurfaceID = surfaceID
	f.lastLabel = label
	f.lastQuickFilter = quickFilters
	return f.createdFilter, nil
}

func TestLoadStateReturnsFavoriteAndFilters(t *testing.T) {
	principalID := uuid.MustParse("95a36693-0f6a-4917-b4f0-f1ca20ea5f73")
	repo := &fakeRepository{
		favoriteState: true,
		savedFilters: []collectiontable.SavedFilterSet{
			{ID: "1", Label: "Active"},
		},
	}
	svc := NewService(repo)

	state, err := svc.LoadState(context.Background(), principalID, "module-registry.list")
	if err != nil {
		t.Fatalf("unexpected error: %v", err)
	}
	if !state.IsFavorite {
		t.Fatalf("expected favorite state")
	}
	if len(state.SavedFilterSets) != 1 {
		t.Fatalf("expected one saved filter, got %d", len(state.SavedFilterSets))
	}
}

func TestCreateSavedFilterRequiresLabel(t *testing.T) {
	svc := NewService(&fakeRepository{})

	if _, err := svc.CreateSavedFilter(context.Background(), uuid.New(), "module-registry.list", collectiontable.CreateSavedFilterInput{}); err != ErrLabelRequired {
		t.Fatalf("expected ErrLabelRequired, got %v", err)
	}
}

func TestCreateSavedFilterValidatesQuickFilters(t *testing.T) {
	svc := NewService(&fakeRepository{})

	_, err := svc.CreateSavedFilter(context.Background(), uuid.New(), "module-registry.list", collectiontable.CreateSavedFilterInput{
		Label: "Bad",
		QuickFilters: []collectiontable.QuickFilter{
			{FieldID: "status", Operator: "", Value: "active"},
		},
	})
	if err != ErrInvalidSavedFilter {
		t.Fatalf("expected ErrInvalidSavedFilter, got %v", err)
	}
}
