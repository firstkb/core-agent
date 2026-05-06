package platformstudionavigationbuilder

import (
	"context"
	"errors"
	"net/http"

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

func mapError(err error) *apperr.AppError {
	switch {
	case errors.Is(err, ErrUnauthorized):
		return apperr.New("NAVIGATION_BUILDER_UNAUTHORIZED", http.StatusUnauthorized, "unauthorized")
	case errors.Is(err, ErrTenantMissing):
		return apperr.New("NAVIGATION_BUILDER_TENANT_MISSING", http.StatusForbidden, "tenant context missing")
	case errors.Is(err, ErrInvalidDefinition):
		return apperr.New("NAVIGATION_BUILDER_INVALID", http.StatusBadRequest, "invalid navigation definition")
	case errors.Is(err, ErrConflict):
		return apperr.New("NAVIGATION_BUILDER_CONFLICT", http.StatusConflict, "navigation definition version conflict")
	default:
		return apperr.New("NAVIGATION_BUILDER_INTERNAL", http.StatusInternalServerError, "internal error")
	}
}
