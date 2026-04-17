package tenantlist

import (
	"context"
	"errors"
	"net/http"
	"strings"

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

func (h *Handler) DeleteSavedFilter(ctx context.Context, r *http.Request, _ struct{}) (*DeleteSavedFilterResponse, error) {
	out, err := h.service.DeleteSavedFilter(ctx, strings.TrimSpace(r.PathValue("savedFilterId")))
	if err != nil {
		return nil, mapError(err)
	}
	return out, nil
}

func (h *Handler) RunRowAction(ctx context.Context, r *http.Request, req RowActionInput) (*MutationResult, error) {
	out, err := h.service.RunRowAction(
		ctx,
		strings.TrimSpace(r.PathValue("actionId")),
		req,
		resolveRequestScheme(r),
	)
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
	case errors.Is(err, ErrInvalidAction):
		return apperr.New("TENANT_LIST_INVALID_ACTION", http.StatusBadRequest, "invalid action")
	case errors.Is(err, ErrInvalidQuery):
		return apperr.New("TENANT_LIST_INVALID_QUERY", http.StatusBadRequest, "invalid query")
	case errors.Is(err, collectionprefs.ErrLabelRequired):
		return apperr.New("TENANT_LIST_LABEL_REQUIRED", http.StatusBadRequest, "label required")
	case errors.Is(err, collectionprefs.ErrInvalidSavedFilter):
		return apperr.New("TENANT_LIST_INVALID_SAVED_FILTER", http.StatusBadRequest, "invalid saved filter")
	case errors.Is(err, collectionprefs.ErrSavedFilterNotFound):
		return apperr.New("TENANT_LIST_SAVED_FILTER_NOT_FOUND", http.StatusNotFound, "saved filter not found")
	default:
		return apperr.Wrap(err, "TENANT_LIST_INTERNAL", http.StatusInternalServerError, "internal error")
	}
}

func resolveRequestScheme(r *http.Request) string {
	if r == nil {
		return "https"
	}
	if r.TLS != nil {
		return "https"
	}

	forwardedProto := strings.TrimSpace(strings.Split(r.Header.Get("X-Forwarded-Proto"), ",")[0])
	if strings.EqualFold(forwardedProto, "http") {
		return "http"
	}

	return "https"
}
