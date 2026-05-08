package platformstudioformbuilder

import (
	"context"
	"errors"
	"net/http"
	"strings"

	"dtriton.com/platform/backend/internal/platform/httpx/apperr"
	collectionprefs "dtriton.com/platform/backend/modules/shared/collectionprefs"
	collectiontable "dtriton.com/platform/backend/modules/shared/collectiontable"
)

type Handler struct {
	service *Service
}

func NewHandler(service *Service) *Handler {
	return &Handler{service: service}
}

func (h *Handler) ListModels(ctx context.Context, _ *http.Request, _ struct{}) (*ListModelsResponse, error) {
	out, err := h.service.ListModels(ctx)
	if err != nil {
		return nil, mapError(err)
	}
	return out, nil
}

func (h *Handler) ListCatalog(ctx context.Context, _ *http.Request, _ struct{}) (*ListCatalogResponse, error) {
	out, err := h.service.ListCatalog(ctx)
	if err != nil {
		return nil, mapError(err)
	}
	return out, nil
}

func (h *Handler) CreateModel(ctx context.Context, _ *http.Request, req CreateModelRequest) (*ModelDetailResponse, error) {
	out, err := h.service.CreateModel(ctx, req)
	if err != nil {
		return nil, mapError(err)
	}
	return out, nil
}

func (h *Handler) DeleteModel(ctx context.Context, r *http.Request, _ struct{}) (*DeleteModelResponse, error) {
	out, err := h.service.DeleteModel(ctx, strings.TrimSpace(r.PathValue("modelId")))
	if err != nil {
		return nil, mapError(err)
	}
	return out, nil
}

func (h *Handler) GetModel(ctx context.Context, r *http.Request, _ struct{}) (*ModelDetailResponse, error) {
	out, err := h.service.GetModel(ctx, strings.TrimSpace(r.PathValue("modelId")))
	if err != nil {
		return nil, mapError(err)
	}
	return out, nil
}

func (h *Handler) ExportModelData(ctx context.Context, r *http.Request, _ struct{}) (*ExportFile, error) {
	out, err := h.service.ExportModelData(ctx, strings.TrimSpace(r.PathValue("modelId")))
	if err != nil {
		return nil, mapError(err)
	}
	return out, nil
}

func (h *Handler) ExportModelBundle(ctx context.Context, r *http.Request, _ struct{}) (*ExportFile, error) {
	out, err := h.service.ExportModelBundle(ctx, strings.TrimSpace(r.PathValue("modelId")))
	if err != nil {
		return nil, mapError(err)
	}
	return out, nil
}

func (h *Handler) LoadRuntimeViewListMeta(ctx context.Context, r *http.Request, _ struct{}) (*RuntimeViewListMetaResponse, error) {
	out, err := h.service.LoadRuntimeViewListMeta(
		ctx,
		strings.TrimSpace(r.PathValue("modelId")),
		strings.TrimSpace(r.PathValue("viewId")),
	)
	if err != nil {
		return nil, mapError(err)
	}
	return out, nil
}

func (h *Handler) ToggleRuntimeViewFavorite(ctx context.Context, r *http.Request, _ struct{}) (*RuntimeViewListFavoriteToggleResponse, error) {
	out, err := h.service.ToggleRuntimeViewFavorite(
		ctx,
		strings.TrimSpace(r.PathValue("modelId")),
		strings.TrimSpace(r.PathValue("viewId")),
	)
	if err != nil {
		return nil, mapError(err)
	}
	return out, nil
}

func (h *Handler) ListRuntimeFavorites(ctx context.Context, _ *http.Request, _ struct{}) (*RuntimeFavoritesResponse, error) {
	out, err := h.service.ListRuntimeFavorites(ctx)
	if err != nil {
		return nil, mapError(err)
	}
	return out, nil
}

func (h *Handler) QueryRuntimeViewList(ctx context.Context, r *http.Request, req RuntimeViewListQueryRequest) (*RuntimeViewListQueryResponse, error) {
	out, err := h.service.QueryRuntimeViewList(
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

func (h *Handler) LoadRuntimeViewListSearchSuggestions(ctx context.Context, r *http.Request, _ struct{}) (*RuntimeViewListSearchSuggestionsResponse, error) {
	out, err := h.service.LoadRuntimeViewListSearchSuggestions(
		ctx,
		strings.TrimSpace(r.PathValue("modelId")),
		strings.TrimSpace(r.PathValue("viewId")),
	)
	if err != nil {
		return nil, mapError(err)
	}
	return out, nil
}

func (h *Handler) CreateRuntimeViewListSavedFilter(ctx context.Context, r *http.Request, req RuntimeViewListCreateSavedFilterInput) (*RuntimeViewListSavedFilterSet, error) {
	out, err := h.service.CreateRuntimeViewListSavedFilter(
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

func (h *Handler) DeleteRuntimeViewListSavedFilter(ctx context.Context, r *http.Request, _ struct{}) (*RuntimeViewListDeleteSavedFilterResponse, error) {
	out, err := h.service.DeleteRuntimeViewListSavedFilter(
		ctx,
		strings.TrimSpace(r.PathValue("modelId")),
		strings.TrimSpace(r.PathValue("viewId")),
		strings.TrimSpace(r.PathValue("savedFilterId")),
	)
	if err != nil {
		return nil, mapError(err)
	}
	return out, nil
}

func (h *Handler) LoadRuntimeViewRecord(ctx context.Context, r *http.Request, _ struct{}) (*RuntimeViewRecordResponse, error) {
	out, err := h.service.LoadRuntimeViewRecord(
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

func (h *Handler) ListViews(ctx context.Context, r *http.Request, _ struct{}) (*ListViewsResponse, error) {
	out, err := h.service.ListViews(ctx, strings.TrimSpace(r.PathValue("modelId")))
	if err != nil {
		return nil, mapError(err)
	}
	return out, nil
}

func (h *Handler) CreateView(ctx context.Context, r *http.Request, req CreateViewRequest) (*ModelDetailResponse, error) {
	out, err := h.service.CreateView(ctx, strings.TrimSpace(r.PathValue("modelId")), req)
	if err != nil {
		return nil, mapError(err)
	}
	return out, nil
}

func (h *Handler) CopyView(ctx context.Context, r *http.Request, req CopyViewRequest) (*ModelDetailResponse, error) {
	out, err := h.service.CopyView(ctx, strings.TrimSpace(r.PathValue("modelId")), strings.TrimSpace(r.PathValue("viewId")), req)
	if err != nil {
		return nil, mapError(err)
	}
	return out, nil
}

func (h *Handler) GetView(ctx context.Context, r *http.Request, _ struct{}) (*ViewDetailResponse, error) {
	out, err := h.service.GetView(ctx, strings.TrimSpace(r.PathValue("modelId")), strings.TrimSpace(r.PathValue("viewId")))
	if err != nil {
		return nil, mapError(err)
	}
	return out, nil
}

func (h *Handler) DeleteView(ctx context.Context, r *http.Request, _ struct{}) (*ModelDetailResponse, error) {
	out, err := h.service.DeleteView(ctx, strings.TrimSpace(r.PathValue("modelId")), strings.TrimSpace(r.PathValue("viewId")))
	if err != nil {
		return nil, mapError(err)
	}
	return out, nil
}

func (h *Handler) LoadDraft(ctx context.Context, r *http.Request, _ struct{}) (*LoadDraftResponse, error) {
	out, err := h.service.LoadDraft(
		ctx,
		strings.TrimSpace(r.PathValue("modelId")),
		strings.TrimSpace(r.PathValue("viewId")),
	)
	if err != nil {
		return nil, mapError(err)
	}
	return out, nil
}

func (h *Handler) SaveDraft(ctx context.Context, r *http.Request, req SaveDraftRequest) (*SaveDraftResponse, error) {
	out, err := h.service.SaveDraft(
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

func mapError(err error) *apperr.AppError {
	switch {
	case errors.Is(err, ErrUnauthorized):
		return apperr.New("FORM_BUILDER_UNAUTHORIZED", http.StatusUnauthorized, "unauthorized")
	case errors.Is(err, ErrTenantMissing):
		return apperr.New("FORM_BUILDER_TENANT_MISSING", http.StatusForbidden, "tenant context missing")
	case errors.Is(err, ErrInvalidDraft):
		return apperr.New("FORM_BUILDER_INVALID", http.StatusBadRequest, "invalid payload")
	case errors.Is(err, collectiontable.ErrInvalidQuery):
		return apperr.New("FORM_BUILDER_RUNTIME_INVALID_QUERY", http.StatusBadRequest, "invalid query")
	case errors.Is(err, collectionprefs.ErrLabelRequired):
		return apperr.New("FORM_BUILDER_RUNTIME_LABEL_REQUIRED", http.StatusBadRequest, "label required")
	case errors.Is(err, collectionprefs.ErrInvalidSavedFilter):
		return apperr.New("FORM_BUILDER_RUNTIME_INVALID_SAVED_FILTER", http.StatusBadRequest, "invalid saved filter")
	case errors.Is(err, collectionprefs.ErrSavedFilterNotFound):
		return apperr.New("FORM_BUILDER_RUNTIME_SAVED_FILTER_NOT_FOUND", http.StatusNotFound, "saved filter not found")
	case errors.Is(err, ErrDeleteUnsupported):
		return apperr.New("FORM_BUILDER_DELETE_UNSUPPORTED", http.StatusBadRequest, "delete is not supported for this model type")
	case errors.Is(err, ErrExportUnsupported):
		return apperr.New("FORM_BUILDER_EXPORT_UNSUPPORTED", http.StatusBadRequest, "export is not supported for this model type")
	case errors.Is(err, ErrModelStructureReadOnly):
		return apperr.New("FORM_BUILDER_MODEL_STRUCTURE_READ_ONLY", http.StatusForbidden, "model structure is read-only for this model type")
	case errors.Is(err, ErrModelLocked):
		return apperr.New("FORM_BUILDER_MODEL_LOCKED", http.StatusForbidden, "model is locked")
	case errors.Is(err, ErrViewLocked):
		return apperr.New("FORM_BUILDER_VIEW_LOCKED", http.StatusForbidden, "view is locked")
	case errors.Is(err, ErrDraftConflict):
		return apperr.New("FORM_BUILDER_CONFLICT", http.StatusConflict, "draft version conflict")
	case errors.Is(err, ErrModelNotFound):
		return apperr.New("FORM_BUILDER_MODEL_NOT_FOUND", http.StatusNotFound, "model not found")
	case errors.Is(err, ErrViewNotFound):
		return apperr.New("FORM_BUILDER_VIEW_NOT_FOUND", http.StatusNotFound, "view not found")
	case errors.Is(err, ErrRecordNotFound):
		return apperr.New("FORM_BUILDER_RECORD_NOT_FOUND", http.StatusNotFound, "record not found")
	case errors.Is(err, ErrRecordViewRequiresGUID):
		return apperr.New("FORM_BUILDER_RECORD_VIEW_GUID_REQUIRED", http.StatusConflict, "record view requires guid-enabled source table")
	case errors.Is(err, ErrCannotDeleteLastView):
		return apperr.New("FORM_BUILDER_VIEW_DELETE_BLOCKED", http.StatusConflict, "cannot delete last view")
	default:
		return apperr.New("FORM_BUILDER_INTERNAL", http.StatusInternalServerError, "internal error")
	}
}
