package platformstudionavigationbuilder

import (
	"context"
	"errors"
	"net/http"
	"strconv"
	"strings"

	"dtriton.com/platform/backend/internal/platform/httpx/apperr"
)

type Handler struct {
	service *Service
}

func NewHandler(service *Service) *Handler {
	return &Handler{service: service}
}

func (h *Handler) LoadConfig(ctx context.Context, _ *http.Request, _ struct{}) (*LoadConfigResponse, error) {
	out, err := h.service.LoadConfig(ctx)
	if err != nil {
		return nil, mapError(err)
	}
	return out, nil
}

func (h *Handler) LoadAccessOptions(ctx context.Context, _ *http.Request, _ struct{}) (*AccessOptionsResponse, error) {
	out, err := h.service.LoadAccessOptions(ctx)
	if err != nil {
		return nil, mapError(err)
	}
	return out, nil
}

func (h *Handler) LoadAccessOptionPage(ctx context.Context, r *http.Request, _ struct{}) (*AccessOptionsPageResponse, error) {
	out, err := h.service.LoadAccessOptionPage(ctx, parseAccessOptionsPageRequest(r))
	if err != nil {
		return nil, mapError(err)
	}
	return out, nil
}

func (h *Handler) SaveConfig(ctx context.Context, _ *http.Request, req SaveConfigRequest) (*SaveConfigResponse, error) {
	out, err := h.service.SaveConfig(ctx, req)
	if err != nil {
		return nil, mapError(err)
	}
	return out, nil
}

func (h *Handler) LoadRuntimeNavigation(ctx context.Context, _ *http.Request, _ struct{}) (*RuntimeNavigationResponse, error) {
	out, err := h.service.LoadRuntimeNavigation(ctx)
	if err != nil {
		return nil, mapError(err)
	}
	return out, nil
}

func (h *Handler) AuthorizeRuntimeTarget(ctx context.Context, req RuntimeTargetAccessRequest) error {
	if err := h.service.AuthorizeRuntimeTarget(ctx, req); err != nil {
		return mapError(err)
	}
	return nil
}

func parseAccessOptionsPageRequest(r *http.Request) AccessOptionsPageRequest {
	query := r.URL.Query()
	return AccessOptionsPageRequest{
		Category: strings.TrimSpace(query.Get("category")),
		IDs:      parseAccessOptionsIDs(query["ids"]),
		Page:     parsePositiveInt(query.Get("page")),
		PageSize: parsePositiveInt(query.Get("pageSize")),
		Search:   strings.TrimSpace(query.Get("search")),
	}
}

func parseAccessOptionsIDs(values []string) []string {
	ids := []string{}
	for _, value := range values {
		for _, part := range strings.Split(value, ",") {
			id := strings.TrimSpace(part)
			if id != "" {
				ids = append(ids, id)
			}
		}
	}
	return ids
}

func parsePositiveInt(value string) int {
	parsed, err := strconv.Atoi(strings.TrimSpace(value))
	if err != nil || parsed < 1 {
		return 0
	}
	return parsed
}

func mapError(err error) *apperr.AppError {
	switch {
	case errors.Is(err, ErrAccessDenied):
		return apperr.New("NAVIGATION_BUILDER_ACCESS_DENIED", http.StatusForbidden, "navigation access denied")
	case errors.Is(err, ErrInvalidAccessTarget):
		return apperr.New("NAVIGATION_BUILDER_ACCESS_TARGET_INVALID", http.StatusBadRequest, "invalid navigation access target")
	case errors.Is(err, ErrUnauthorized):
		return apperr.New("NAVIGATION_BUILDER_UNAUTHORIZED", http.StatusUnauthorized, "unauthorized")
	case errors.Is(err, ErrTenantMissing):
		return apperr.New("NAVIGATION_BUILDER_TENANT_MISSING", http.StatusForbidden, "tenant context missing")
	case errors.Is(err, ErrInvalidAccessOptions):
		return apperr.New("NAVIGATION_BUILDER_ACCESS_OPTIONS_INVALID", http.StatusBadRequest, "invalid access options request")
	case errors.Is(err, ErrInvalidDefinition):
		return apperr.New("NAVIGATION_BUILDER_INVALID", http.StatusBadRequest, "invalid navigation definition")
	case errors.Is(err, ErrRootAccessRequired):
		return apperr.New("NAVIGATION_BUILDER_ROOT_ACCESS_REQUIRED", http.StatusForbidden, "root access is required to save root-only navigation items")
	case errors.Is(err, ErrConflict):
		return apperr.New("NAVIGATION_BUILDER_CONFLICT", http.StatusConflict, "navigation definition version conflict")
	default:
		return apperr.New("NAVIGATION_BUILDER_INTERNAL", http.StatusInternalServerError, "internal error")
	}
}
