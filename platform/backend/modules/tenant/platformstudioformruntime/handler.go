package platformstudioformruntime

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

func (h *Handler) LoadForm(
	ctx context.Context,
	r *http.Request,
) (*RuntimeViewFormResponse, error) {
	out, err := h.service.LoadForm(
		ctx,
		strings.TrimSpace(r.PathValue("modelId")),
		strings.TrimSpace(r.PathValue("viewId")),
		strings.TrimSpace(r.PathValue("docGuid")),
	)
	if err != nil {
		return nil, mapError(err)
	}
	return out, nil
}

func (h *Handler) LoadSubform(
	ctx context.Context,
	r *http.Request,
) (*RuntimeViewFormResponse, error) {
	out, err := h.service.LoadSubform(
		ctx,
		strings.TrimSpace(r.PathValue("modelId")),
		strings.TrimSpace(r.PathValue("viewId")),
		strings.TrimSpace(r.PathValue("parentDocGuid")),
		strings.TrimSpace(r.PathValue("subformId")),
		strings.TrimSpace(r.PathValue("docGuid")),
	)
	if err != nil {
		return nil, mapError(err)
	}
	return out, nil
}

func (h *Handler) CreateRecord(
	ctx context.Context,
	r *http.Request,
	req RuntimeViewRecordMutationRequest,
) (*RuntimeViewRecordMutationResponse, error) {
	out, err := h.service.CreateRecord(
		ctx,
		strings.TrimSpace(r.PathValue("modelId")),
		strings.TrimSpace(r.PathValue("viewId")),
		req,
	)
	if err != nil {
		return nil, mapError(err)
	}
	return out, nil
}

func (h *Handler) CreateSubformRecord(
	ctx context.Context,
	r *http.Request,
	req RuntimeViewRecordMutationRequest,
) (*RuntimeViewRecordMutationResponse, error) {
	out, err := h.service.CreateSubformRecord(
		ctx,
		strings.TrimSpace(r.PathValue("modelId")),
		strings.TrimSpace(r.PathValue("viewId")),
		strings.TrimSpace(r.PathValue("parentDocGuid")),
		strings.TrimSpace(r.PathValue("subformId")),
		req,
	)
	if err != nil {
		return nil, mapError(err)
	}
	return out, nil
}

func (h *Handler) UpdateRecord(
	ctx context.Context,
	r *http.Request,
	req RuntimeViewRecordMutationRequest,
) (*RuntimeViewRecordMutationResponse, error) {
	out, err := h.service.UpdateRecord(
		ctx,
		strings.TrimSpace(r.PathValue("modelId")),
		strings.TrimSpace(r.PathValue("viewId")),
		strings.TrimSpace(r.PathValue("docGuid")),
		req,
	)
	if err != nil {
		return nil, mapError(err)
	}
	return out, nil
}

func (h *Handler) UpdateSubformRecord(
	ctx context.Context,
	r *http.Request,
	req RuntimeViewRecordMutationRequest,
) (*RuntimeViewRecordMutationResponse, error) {
	out, err := h.service.UpdateSubformRecord(
		ctx,
		strings.TrimSpace(r.PathValue("modelId")),
		strings.TrimSpace(r.PathValue("viewId")),
		strings.TrimSpace(r.PathValue("parentDocGuid")),
		strings.TrimSpace(r.PathValue("subformId")),
		strings.TrimSpace(r.PathValue("docGuid")),
		req,
	)
	if err != nil {
		return nil, mapError(err)
	}
	return out, nil
}

func (h *Handler) DeleteSubformRecord(
	ctx context.Context,
	r *http.Request,
) (*RuntimeViewDeleteResponse, error) {
	out, err := h.service.DeleteSubformRecord(
		ctx,
		strings.TrimSpace(r.PathValue("modelId")),
		strings.TrimSpace(r.PathValue("viewId")),
		strings.TrimSpace(r.PathValue("parentDocGuid")),
		strings.TrimSpace(r.PathValue("subformId")),
		strings.TrimSpace(r.PathValue("docGuid")),
	)
	if err != nil {
		return nil, mapError(err)
	}
	return out, nil
}

func (h *Handler) FinishRecord(
	ctx context.Context,
	r *http.Request,
	req RuntimeViewRecordFinishRequest,
) (*RuntimeViewRecordMutationResponse, error) {
	out, err := h.service.FinishRecord(
		ctx,
		strings.TrimSpace(r.PathValue("modelId")),
		strings.TrimSpace(r.PathValue("viewId")),
		strings.TrimSpace(r.PathValue("docGuid")),
		req,
	)
	if err != nil {
		return nil, mapError(err)
	}
	return out, nil
}

func (h *Handler) RunBulkAction(
	ctx context.Context,
	r *http.Request,
	req RuntimeViewBulkActionRequest,
) (*RuntimeViewBulkActionResponse, error) {
	out, err := h.service.RunBulkAction(
		ctx,
		strings.TrimSpace(r.PathValue("modelId")),
		strings.TrimSpace(r.PathValue("viewId")),
		strings.TrimSpace(r.PathValue("actionId")),
		req,
	)
	if err != nil {
		return nil, mapError(err)
	}
	return out, nil
}

func mapError(err error) *apperr.AppError {
	switch {
	case errors.Is(err, ErrUnauthorized):
		return apperr.New("FORM_RUNTIME_UNAUTHORIZED", http.StatusUnauthorized, "unauthorized")
	case errors.Is(err, ErrTenantMissing):
		return apperr.New("FORM_RUNTIME_TENANT_MISSING", http.StatusForbidden, "tenant context missing")
	case errors.Is(err, ErrInvalidRequest):
		return apperr.New("FORM_RUNTIME_INVALID", http.StatusBadRequest, "invalid request")
	case errors.Is(err, ErrConflict):
		return apperr.New("FORM_RUNTIME_CONFLICT", http.StatusConflict, "record version conflict")
	case errors.Is(err, ErrModelNotFound):
		return apperr.New("FORM_RUNTIME_MODEL_NOT_FOUND", http.StatusNotFound, "model not found")
	case errors.Is(err, ErrViewNotFound):
		return apperr.New("FORM_RUNTIME_VIEW_NOT_FOUND", http.StatusNotFound, "view not found")
	case errors.Is(err, ErrRecordNotFound):
		return apperr.New("FORM_RUNTIME_RECORD_NOT_FOUND", http.StatusNotFound, "record not found")
	case errors.Is(err, ErrRuntimeUnsupported):
		return apperr.New("FORM_RUNTIME_UNSUPPORTED", http.StatusConflict, "runtime writes are not supported for this view")
	default:
		return apperr.New("FORM_RUNTIME_INTERNAL", http.StatusInternalServerError, "internal error")
	}
}
