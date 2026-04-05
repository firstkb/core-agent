package moduleregistrygrants

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

func (h *Handler) ListSectionGrants(ctx context.Context, r *http.Request, _ struct{}) (*SectionGrantListOutput, error) {
	out, err := h.service.ListSectionGrants(ctx, strings.TrimSpace(r.PathValue("sectionId")))
	if err != nil {
		return nil, mapError(err)
	}
	return out, nil
}

func (h *Handler) UpsertSectionGrant(ctx context.Context, r *http.Request, req UpsertSectionGrantInput) (*SectionGrantOutput, error) {
	out, err := h.service.UpsertSectionGrant(ctx, strings.TrimSpace(r.PathValue("sectionId")), strings.TrimSpace(r.PathValue("adminUserId")), req)
	if err != nil {
		return nil, mapError(err)
	}
	return out, nil
}

func (h *Handler) RevokeSectionGrant(ctx context.Context, r *http.Request, _ struct{}) (*MutationResult, error) {
	out, err := h.service.RevokeSectionGrant(ctx, strings.TrimSpace(r.PathValue("sectionId")), strings.TrimSpace(r.PathValue("adminUserId")))
	if err != nil {
		return nil, mapError(err)
	}
	return out, nil
}

func (h *Handler) UpsertModuleGrants(ctx context.Context, r *http.Request, req UpsertSectionGrantInput) (*GrantMutationOutput, error) {
	out, err := h.service.UpsertModuleGrants(ctx, strings.TrimSpace(r.PathValue("moduleId")), strings.TrimSpace(r.PathValue("adminUserId")), req)
	if err != nil {
		return nil, mapError(err)
	}
	return out, nil
}

func (h *Handler) RevokeModuleGrants(ctx context.Context, r *http.Request, _ struct{}) (*GrantMutationOutput, error) {
	out, err := h.service.RevokeModuleGrants(ctx, strings.TrimSpace(r.PathValue("moduleId")), strings.TrimSpace(r.PathValue("adminUserId")))
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
	case errors.Is(err, ErrInvalidInput),
		errors.Is(err, ErrInvalidGrantAccess),
		errors.Is(err, ErrGrantTargetRoot),
		errors.Is(err, ErrGrantTargetInactive):
		return apperr.New("MODULE_REGISTRY_INVALID_INPUT", http.StatusBadRequest, err.Error())
	case errors.Is(err, ErrModuleNotFound):
		return apperr.New("MODULE_REGISTRY_MODULE_NOT_FOUND", http.StatusNotFound, "module not found")
	case errors.Is(err, ErrSectionNotFound):
		return apperr.New("MODULE_REGISTRY_SECTION_NOT_FOUND", http.StatusNotFound, "section not found")
	case errors.Is(err, ErrAdminUserNotFound):
		return apperr.New("MODULE_REGISTRY_ADMIN_USER_NOT_FOUND", http.StatusNotFound, "admin user not found")
	case errors.Is(err, ErrRegistryConflict):
		return apperr.New("MODULE_REGISTRY_CONFLICT", http.StatusConflict, "module registry conflict")
	default:
		return apperr.New("MODULE_REGISTRY_INTERNAL", http.StatusInternalServerError, "internal error")
	}
}
