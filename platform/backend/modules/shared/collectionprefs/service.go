package collectionprefs

import (
	"context"
	"errors"
	"strings"

	"github.com/google/uuid"

	collectiontable "dtriton.com/platform/backend/modules/shared/collectiontable"
)

var (
	ErrLabelRequired      = errors.New("collection prefs label required")
	ErrInvalidSavedFilter = errors.New("collection prefs invalid saved filter")
)

type State struct {
	IsFavorite      bool
	SavedFilterSets []collectiontable.SavedFilterSet
}

type Repository interface {
	GetFavoriteState(ctx context.Context, principalID uuid.UUID, surfaceID string) (bool, error)
	ToggleFavorite(ctx context.Context, principalID uuid.UUID, surfaceID string) (bool, error)
	ListSavedFilters(ctx context.Context, principalID uuid.UUID, surfaceID string) ([]collectiontable.SavedFilterSet, error)
	CreateSavedFilter(ctx context.Context, principalID uuid.UUID, surfaceID string, label string, quickFilters []collectiontable.QuickFilter) (*collectiontable.SavedFilterSet, error)
}

type Service struct {
	repo Repository
}

func NewService(repo Repository) *Service {
	return &Service{repo: repo}
}

func (s *Service) LoadState(ctx context.Context, principalID uuid.UUID, surfaceID string) (*State, error) {
	isFavorite, err := s.repo.GetFavoriteState(ctx, principalID, surfaceID)
	if err != nil {
		return nil, err
	}
	savedFilters, err := s.repo.ListSavedFilters(ctx, principalID, surfaceID)
	if err != nil {
		return nil, err
	}

	return &State{
		IsFavorite:      isFavorite,
		SavedFilterSets: savedFilters,
	}, nil
}

func (s *Service) ToggleFavorite(ctx context.Context, principalID uuid.UUID, surfaceID string) (bool, error) {
	return s.repo.ToggleFavorite(ctx, principalID, surfaceID)
}

func (s *Service) CreateSavedFilter(ctx context.Context, principalID uuid.UUID, surfaceID string, req collectiontable.CreateSavedFilterInput) (*collectiontable.SavedFilterSet, error) {
	if strings.TrimSpace(req.Label) == "" {
		return nil, ErrLabelRequired
	}
	if err := collectiontable.ValidateQuickFilters(req.QuickFilters); err != nil {
		return nil, ErrInvalidSavedFilter
	}

	return s.repo.CreateSavedFilter(ctx, principalID, surfaceID, req.Label, req.QuickFilters)
}
