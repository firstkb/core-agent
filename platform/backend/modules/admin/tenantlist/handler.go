package tenantlist

import (
	"context"
	"errors"
	"net/http"

	"dtriton.com/platform/backend/internal/platform/httpx/apperr"
	collectionprefs "dtriton.com/platform/backend/modules/shared/collectionprefs"
)

type Handler struct {
	service *Service
}

func NewHandler(service *Service) *Handler {
	return &Handler{service: service}
}

func (h *Handler) GetMeta(ctx context.Context, _ *http.Request, _ struct{}) (*MetaResponse, error) {
	out, err := h.service.LoadMeta(ctx)
	if err != nil {
		return nil, mapError(err)
	}
	return out, nil
}

func (h *Handler) Query(ctx context.Context, _ *http.Request, req QueryRequest) (*QueryResponse, error) {
	out, err := h.service.Query(ctx, req)
	if err != nil {
		return nil, mapError(err)
	}
	return out, nil
}

func (h *Handler) GetSearchSuggestions(ctx context.Context, _ *http.Request, _ struct{}) (*SearchSuggestionsResponse, error) {
	out, err := h.service.LoadSearchSuggestions(ctx)
	if err != nil {
		return nil, mapError(err)
	}
	return out, nil
}

func (h *Handler) ToggleFavorite(ctx context.Context, _ *http.Request, _ struct{}) (*FavoriteToggleResponse, error) {
	out, err := h.service.ToggleFavorite(ctx)
	if err != nil {
		return nil, mapError(err)
	}
	return out, nil
}

func (h *Handler) CreateSavedFilter(ctx context.Context, _ *http.Request, req CreateSavedFilterInput) (*SavedFilterSet, error) {
	out, err := h.service.CreateSavedFilter(ctx, req)
	if err != nil {
		return nil, mapError(err)
	}
	return out, nil
}

func mapError(err error) *apperr.AppError {
	switch {
	case errors.Is(err, ErrUnauthorized):
		return apperr.New("TENANT_LIST_UNAUTHORIZED", http.StatusUnauthorized, "unauthorized")
	case errors.Is(err, ErrForbidden):
		return apperr.New("TENANT_LIST_FORBIDDEN", http.StatusForbidden, "forbidden")
	case errors.Is(err, ErrInvalidQuery):
		return apperr.New("TENANT_LIST_INVALID_QUERY", http.StatusBadRequest, "invalid query")
	case errors.Is(err, collectionprefs.ErrLabelRequired):
		return apperr.New("TENANT_LIST_LABEL_REQUIRED", http.StatusBadRequest, "label required")
	case errors.Is(err, collectionprefs.ErrInvalidSavedFilter):
		return apperr.New("TENANT_LIST_INVALID_SAVED_FILTER", http.StatusBadRequest, "invalid saved filter")
	default:
		return apperr.Wrap(err, "TENANT_LIST_INTERNAL", http.StatusInternalServerError, "internal error")
	}
}
