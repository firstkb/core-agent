package adminnavigationsvc

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

func (h *Handler) GetNavigation(ctx context.Context, _ *http.Request, _ struct{}) (*Navigation, error) {
	navigation, err := h.service.GetNavigation(ctx)
	if err != nil {
		return nil, mapError(err)
	}
	return navigation, nil
}

func mapError(err error) *apperr.AppError {
	switch {
	case errors.Is(err, ErrUnauthorized):
		return apperr.New("ADMIN_NAVIGATION_UNAUTHORIZED", http.StatusUnauthorized, "unauthorized")
	case errors.Is(err, ErrInvalidScope):
		return apperr.New("ADMIN_NAVIGATION_FORBIDDEN", http.StatusForbidden, "forbidden")
	case errors.Is(err, ErrUserNotFound):
		return apperr.New("ADMIN_NAVIGATION_USER_NOT_FOUND", http.StatusNotFound, "user not found")
	case errors.Is(err, ErrUserInactive):
		return apperr.New("ADMIN_NAVIGATION_USER_INACTIVE", http.StatusForbidden, "user inactive")
	default:
		return apperr.New("ADMIN_NAVIGATION_INTERNAL", http.StatusInternalServerError, "internal error")
	}
}
