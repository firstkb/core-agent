package tenantmanagement

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

func (h *Handler) OnboardTenant(ctx context.Context, _ *http.Request, req OnboardTenantInput) (*OnboardTenantOutput, error) {
	output, err := h.service.OnboardTenant(ctx, req)
	if err != nil {
		return nil, mapError(err)
	}
	return output, nil
}

func mapError(err error) *apperr.AppError {
	switch {
	case errors.Is(err, ErrTenantNameRequired), errors.Is(err, ErrTenantHostRequired):
		return apperr.New("TENANTMGMT_INVALID_INPUT", http.StatusBadRequest, err.Error())
	case errors.Is(err, ErrTenantConflict):
		return apperr.New("TENANTMGMT_CONFLICT", http.StatusConflict, err.Error())
	default:
		return apperr.New("TENANTMGMT_INTERNAL", http.StatusInternalServerError, "internal error")
	}
}
