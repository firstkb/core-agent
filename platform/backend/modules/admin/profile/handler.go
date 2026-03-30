package adminprofilesvc

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
		return apperr.New("ADMIN_PROFILE_UNAUTHORIZED", http.StatusUnauthorized, "unauthorized")
	case errors.Is(err, ErrInvalidScope):
		return apperr.New("ADMIN_PROFILE_FORBIDDEN", http.StatusForbidden, "forbidden")
	case errors.Is(err, ErrUserNotFound):
		return apperr.New("ADMIN_PROFILE_USER_NOT_FOUND", http.StatusNotFound, "user not found")
	case errors.Is(err, ErrUserInactive):
		return apperr.New("ADMIN_PROFILE_USER_INACTIVE", http.StatusForbidden, "user inactive")
	default:
		return apperr.New("ADMIN_PROFILE_INTERNAL", http.StatusInternalServerError, "internal error")
	}
}
