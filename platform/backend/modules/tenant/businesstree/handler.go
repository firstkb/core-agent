package businesstree

import (
	"context"
	"errors"
	"net/http"
	"strings"

	"dtriton.com/platform/backend/internal/platform/httpx/apperr"
)

type Handler struct {
	service *Service
}

func NewHandler(service *Service) *Handler {
	return &Handler{service: service}
}

func (h *Handler) ListNodes(ctx context.Context, r *http.Request, _ struct{}) (*NodesResponse, error) {
	parentID := strings.TrimSpace(r.URL.Query().Get("parent"))
	out, err := h.service.ListNodes(ctx, parentID)
	if err != nil {
		return nil, mapError(err)
	}
	return out, nil
}

func mapError(err error) *apperr.AppError {
	switch {
	case errors.Is(err, ErrUnauthorized):
		return apperr.New("BUSINESS_TREE_UNAUTHORIZED", http.StatusUnauthorized, "unauthorized")
	case errors.Is(err, ErrTenantMissing):
		return apperr.New("BUSINESS_TREE_TENANT_MISSING", http.StatusForbidden, "tenant context missing")
	case errors.Is(err, ErrInvalidParent):
		return apperr.New("BUSINESS_TREE_INVALID_PARENT", http.StatusBadRequest, "invalid tree parent")
	default:
		return apperr.New("BUSINESS_TREE_INTERNAL", http.StatusInternalServerError, "internal error")
	}
}
