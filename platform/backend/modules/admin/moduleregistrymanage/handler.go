package moduleregistrymanage

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

func (h *Handler) GetModule(ctx context.Context, r *http.Request, _ struct{}) (*ModuleDetailOutput, error) {
	out, err := h.service.GetModule(ctx, strings.TrimSpace(r.PathValue("moduleId")))
	if err != nil {
		return nil, mapError(err)
	}
	return out, nil
}

func (h *Handler) CreateModule(ctx context.Context, _ *http.Request, req CreateModuleInput) (*ModuleDetailOutput, error) {
	out, err := h.service.CreateModule(ctx, req)
	if err != nil {
		return nil, mapError(err)
	}
	return out, nil
}

func (h *Handler) UpdateModule(ctx context.Context, r *http.Request, req UpdateModuleInput) (*ModuleDetailOutput, error) {
	out, err := h.service.UpdateModule(ctx, strings.TrimSpace(r.PathValue("moduleId")), req)
	if err != nil {
		return nil, mapError(err)
	}
	return out, nil
}

func (h *Handler) ArchiveModule(ctx context.Context, r *http.Request, _ struct{}) (*MutationResult, error) {
	out, err := h.service.ArchiveModule(ctx, strings.TrimSpace(r.PathValue("moduleId")))
	if err != nil {
		return nil, mapError(err)
	}
	return out, nil
}

func (h *Handler) CreateSection(ctx context.Context, r *http.Request, req CreateSectionInput) (*SectionDetailOutput, error) {
	out, err := h.service.CreateSection(ctx, strings.TrimSpace(r.PathValue("moduleId")), req)
	if err != nil {
		return nil, mapError(err)
	}
	return out, nil
}

func (h *Handler) UpdateSection(ctx context.Context, r *http.Request, req UpdateSectionInput) (*SectionDetailOutput, error) {
	out, err := h.service.UpdateSection(ctx, strings.TrimSpace(r.PathValue("sectionId")), req)
	if err != nil {
		return nil, mapError(err)
	}
	return out, nil
}

func (h *Handler) ArchiveSection(ctx context.Context, r *http.Request, _ struct{}) (*MutationResult, error) {
	out, err := h.service.ArchiveSection(ctx, strings.TrimSpace(r.PathValue("sectionId")))
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
		errors.Is(err, ErrModuleKeyRequired),
		errors.Is(err, ErrSectionKeyRequired),
		errors.Is(err, ErrTitleRequired),
		errors.Is(err, ErrInvalidStatus),
		errors.Is(err, ErrInvalidRoutePath):
		return apperr.New("MODULE_REGISTRY_INVALID_INPUT", http.StatusBadRequest, err.Error())
	case errors.Is(err, ErrModuleNotFound):
		return apperr.New("MODULE_REGISTRY_MODULE_NOT_FOUND", http.StatusNotFound, "module not found")
	case errors.Is(err, ErrSectionNotFound):
		return apperr.New("MODULE_REGISTRY_SECTION_NOT_FOUND", http.StatusNotFound, "section not found")
	case errors.Is(err, ErrRegistryConflict):
		return apperr.New("MODULE_REGISTRY_CONFLICT", http.StatusConflict, "module registry conflict")
	default:
		return apperr.New("MODULE_REGISTRY_INTERNAL", http.StatusInternalServerError, "internal error")
	}
}
