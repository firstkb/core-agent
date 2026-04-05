package moduleregistrylist

import (
	"context"
	"errors"
	"net/http"
	"strings"

	"dtriton.com/platform/backend/internal/platform/httpx/apperr"
	moduleregistrymanage "dtriton.com/platform/backend/modules/admin/moduleregistrymanage"
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

func (h *Handler) RunBulkAction(ctx context.Context, r *http.Request, req BulkActionInput) (*MutationResult, error) {
	out, err := h.service.RunBulkAction(ctx, strings.TrimSpace(r.PathValue("actionId")), req)
	if err != nil {
		return nil, mapError(err)
	}
	return out, nil
}

func (h *Handler) RunRowAction(ctx context.Context, r *http.Request, req RowActionInput) (*MutationResult, error) {
	out, err := h.service.RunRowAction(ctx, strings.TrimSpace(r.PathValue("actionId")), req)
	if err != nil {
		return nil, mapError(err)
	}
	return out, nil
}

func (h *Handler) ExportXLS(ctx context.Context, _ *http.Request, req ExportRequest) (*MutationResult, error) {
	out, err := h.service.ExportXLS(ctx, req)
	if err != nil {
		return nil, mapError(err)
	}
	return out, nil
}

func mapError(err error) *apperr.AppError {
	switch {
	case errors.Is(err, ErrUnauthorized):
		return apperr.New("MODULE_REGISTRY_UNAUTHORIZED", http.StatusUnauthorized, "unauthorized")
	case errors.Is(err, ErrForbidden):
		return apperr.New("MODULE_REGISTRY_FORBIDDEN", http.StatusForbidden, "forbidden")
	case errors.Is(err, ErrInvalidQuery):
		return apperr.New("MODULE_REGISTRY_INVALID_QUERY", http.StatusBadRequest, "invalid query")
	case errors.Is(err, ErrInvalidAction):
		return apperr.New("MODULE_REGISTRY_INVALID_ACTION", http.StatusBadRequest, "invalid action")
	case errors.Is(err, collectionprefs.ErrLabelRequired):
		return apperr.New("MODULE_REGISTRY_LABEL_REQUIRED", http.StatusBadRequest, "label required")
	case errors.Is(err, collectionprefs.ErrInvalidSavedFilter):
		return apperr.New("MODULE_REGISTRY_INVALID_SAVED_FILTER", http.StatusBadRequest, "invalid saved filter")
	case errors.Is(err, moduleregistrymanage.ErrInvalidInput),
		errors.Is(err, moduleregistrymanage.ErrModuleNotFound),
		errors.Is(err, moduleregistrymanage.ErrSectionNotFound),
		errors.Is(err, moduleregistrymanage.ErrRegistryConflict):
		return mapManageError(err)
	default:
		return apperr.New("MODULE_REGISTRY_INTERNAL", http.StatusInternalServerError, "internal error")
	}
}

func mapManageError(err error) *apperr.AppError {
	switch {
	case errors.Is(err, moduleregistrymanage.ErrInvalidInput):
		return apperr.New("MODULE_REGISTRY_INVALID_INPUT", http.StatusBadRequest, err.Error())
	case errors.Is(err, moduleregistrymanage.ErrModuleNotFound):
		return apperr.New("MODULE_REGISTRY_MODULE_NOT_FOUND", http.StatusNotFound, "module not found")
	case errors.Is(err, moduleregistrymanage.ErrSectionNotFound):
		return apperr.New("MODULE_REGISTRY_SECTION_NOT_FOUND", http.StatusNotFound, "section not found")
	case errors.Is(err, moduleregistrymanage.ErrRegistryConflict):
		return apperr.New("MODULE_REGISTRY_CONFLICT", http.StatusConflict, "module registry conflict")
	default:
		return apperr.New("MODULE_REGISTRY_INTERNAL", http.StatusInternalServerError, "internal error")
	}
}
