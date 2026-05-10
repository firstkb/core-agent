package dictionary

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

func (h *Handler) ListOptions(ctx context.Context, r *http.Request, _ struct{}) (*OptionsResponse, error) {
	out, err := h.service.ListOptions(ctx, parseOptionsRequest(r))
	if err != nil {
		return nil, mapError(err)
	}
	return out, nil
}

func (h *Handler) QueryOptions(ctx context.Context, _ *http.Request, req OptionsRequest) (*OptionsResponse, error) {
	out, err := h.service.ListOptions(ctx, req)
	if err != nil {
		return nil, mapError(err)
	}
	return out, nil
}

func parseOptionsRequest(r *http.Request) OptionsRequest {
	query := r.URL.Query()

	return OptionsRequest{
		Dictionary: strings.TrimSpace(r.PathValue("dictionaryKey")),
		IDs:        append([]string(nil), query["ids"]...),
		Page:       parsePositiveInt(query.Get("page")),
		PageSize:   parsePositiveInt(query.Get("pageSize")),
		Search:     strings.TrimSpace(query.Get("search")),
	}
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
	case errors.Is(err, ErrInvalidDictionary):
		return apperr.New("DICTIONARY_INVALID", http.StatusBadRequest, "invalid dictionary")
	case errors.Is(err, ErrTenantMissing):
		return apperr.New("DICTIONARY_TENANT_MISSING", http.StatusForbidden, "tenant context missing")
	case errors.Is(err, ErrUnauthorized):
		return apperr.New("DICTIONARY_UNAUTHORIZED", http.StatusUnauthorized, "unauthorized")
	default:
		return apperr.New("DICTIONARY_INTERNAL", http.StatusInternalServerError, "internal error")
	}
}
