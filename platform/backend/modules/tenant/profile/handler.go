package profilesvc

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

func (h *Handler) GetProfile(ctx context.Context, _ *http.Request, _ struct{}) (*Profile, error) {
	profile, err := h.service.GetProfile(ctx)
	if err != nil {
		return nil, mapError(err)
	}
	return profile, nil
}

func mapError(err error) *apperr.AppError {
	switch {
	case errors.Is(err, ErrUnauthorized):
		return apperr.New("PROFILE_UNAUTHORIZED", http.StatusUnauthorized, "unauthorized")
	case errors.Is(err, ErrTenantMissing):
		return apperr.New("PROFILE_TENANT_MISSING", http.StatusForbidden, "tenant context missing")
	default:
		return apperr.New("PROFILE_INTERNAL", http.StatusInternalServerError, "internal error")
	}
}
