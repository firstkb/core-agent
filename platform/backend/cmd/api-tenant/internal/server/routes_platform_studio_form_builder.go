package server

import (
	"context"
	"encoding/json"
	"net/http"
	"strings"

	"dtriton.com/platform/backend/internal/platform/httpx/apperr"
	"dtriton.com/platform/backend/internal/platform/httpx/handler"
	"dtriton.com/platform/backend/internal/platform/httpx/router"
	formbuilder "dtriton.com/platform/backend/modules/tenant/platformstudioformbuilder"
)

func (srv *Server) registerPlatformStudioFormBuilderRoutes(b *router.Builder) {
	register := func(id router.RouteID, method, path string, h http.Handler) {
		b.Handle(id, method, path, router.TierSecure, h)
	}

	loadAuthoringStateHandler := handler.HandleJson(func(ctx context.Context, r *http.Request, _ struct{}) (*formbuilder.LoadDraftResponse, error) {
		info, err := srv.platformStudioFormBuilderHTTP.LoadDraft(ctx, r, struct{}{})
		if err != nil {
			return nil, apperr.WrapAndLog(
				srv.logger,
				ctx,
				"FORM_BUILDER_AUTHORING_LOAD",
				http.StatusInternalServerError,
				"cannot load form builder authoring state",
				err,
				srv.FieldsForLog(ctx, r, nil)...,
			)
		}
		return info, nil
	}, srv.logger)

	saveAuthoringStateHandler := handler.HandleJson(func(ctx context.Context, r *http.Request, req formbuilder.SaveDraftRequest) (*formbuilder.SaveDraftResponse, error) {
		info, err := srv.platformStudioFormBuilderHTTP.SaveDraft(ctx, r, req)
		if err != nil {
			return nil, apperr.WrapAndLog(
				srv.logger,
				ctx,
				"FORM_BUILDER_AUTHORING_SAVE",
				http.StatusInternalServerError,
				"cannot save form builder authoring state",
				err,
				srv.FieldsForLog(ctx, r, summarizeFormBuilderSaveDraftRequest(r, req))...,
			)
		}
		return info, nil
	}, srv.logger)

	exportModelDataHandler := http.HandlerFunc(func(w http.ResponseWriter, r *http.Request) {
		info, err := srv.platformStudioFormBuilderHTTP.ExportModelData(r.Context(), r, struct{}{})
		if err != nil {
			writePlatformStudioFormBuilderError(w, err)
			return
		}

		w.Header().Set("Cache-Control", "no-store")
		w.Header().Set("Content-Disposition", `attachment; filename="`+info.FileName+`"`)
		w.Header().Set("Content-Type", info.ContentType)
		w.Header().Set("X-Content-Type-Options", "nosniff")
		w.WriteHeader(http.StatusOK)
		_, _ = w.Write(info.Content)
	})

	exportModelBundleHandler := http.HandlerFunc(func(w http.ResponseWriter, r *http.Request) {
		info, err := srv.platformStudioFormBuilderHTTP.ExportModelBundle(r.Context(), r, struct{}{})
		if err != nil {
			writePlatformStudioFormBuilderError(w, err)
			return
		}

		w.Header().Set("Cache-Control", "no-store")
		w.Header().Set("Content-Disposition", `attachment; filename="`+info.FileName+`"`)
		w.Header().Set("Content-Type", info.ContentType)
		w.Header().Set("X-Content-Type-Options", "nosniff")
		w.WriteHeader(http.StatusOK)
		_, _ = w.Write(info.Content)
	})

	loadRuntimeViewListMetaHandler := handler.HandleJson(func(ctx context.Context, r *http.Request, _ struct{}) (*formbuilder.RuntimeViewListMetaResponse, error) {
		info, err := srv.platformStudioFormBuilderHTTP.LoadRuntimeViewListMeta(ctx, r, struct{}{})
		if err != nil {
			return nil, apperr.WrapAndLog(
				srv.logger,
				ctx,
				"FORM_BUILDER_RUNTIME_LIST_META",
				http.StatusInternalServerError,
				"cannot load form builder runtime list meta",
				err,
				srv.FieldsForLog(ctx, r, nil)...,
			)
		}
		return info, nil
	}, srv.logger)

	queryRuntimeViewListHandler := handler.HandleJson(func(ctx context.Context, r *http.Request, req formbuilder.RuntimeViewListQueryRequest) (*formbuilder.RuntimeViewListQueryResponse, error) {
		info, err := srv.platformStudioFormBuilderHTTP.QueryRuntimeViewList(ctx, r, req)
		if err != nil {
			return nil, apperr.WrapAndLog(
				srv.logger,
				ctx,
				"FORM_BUILDER_RUNTIME_LIST_QUERY",
				http.StatusInternalServerError,
				"cannot query form builder runtime list",
				err,
				srv.FieldsForLog(ctx, r, req)...,
			)
		}
		return info, nil
	}, srv.logger)

	loadRuntimeViewListSearchSuggestionsHandler := handler.HandleJson(func(ctx context.Context, r *http.Request, _ struct{}) (*formbuilder.RuntimeViewListSearchSuggestionsResponse, error) {
		info, err := srv.platformStudioFormBuilderHTTP.LoadRuntimeViewListSearchSuggestions(ctx, r, struct{}{})
		if err != nil {
			return nil, apperr.WrapAndLog(
				srv.logger,
				ctx,
				"FORM_BUILDER_RUNTIME_LIST_SEARCH_SUGGESTIONS",
				http.StatusInternalServerError,
				"cannot load form builder runtime search suggestions",
				err,
				srv.FieldsForLog(ctx, r, nil)...,
			)
		}
		return info, nil
	}, srv.logger)

	createRuntimeViewListSavedFilterHandler := handler.HandleJson(func(ctx context.Context, r *http.Request, req formbuilder.RuntimeViewListCreateSavedFilterInput) (*formbuilder.RuntimeViewListSavedFilterSet, error) {
		info, err := srv.platformStudioFormBuilderHTTP.CreateRuntimeViewListSavedFilter(ctx, r, req)
		if err != nil {
			return nil, apperr.WrapAndLog(
				srv.logger,
				ctx,
				"FORM_BUILDER_RUNTIME_LIST_SAVED_FILTER_CREATE",
				http.StatusInternalServerError,
				"cannot create form builder runtime saved filter",
				err,
				srv.FieldsForLog(ctx, r, req)...,
			)
		}
		return info, nil
	}, srv.logger)

	loadRuntimeViewRecordHandler := handler.HandleJson(func(ctx context.Context, r *http.Request, _ struct{}) (*formbuilder.RuntimeViewRecordResponse, error) {
		info, err := srv.platformStudioFormBuilderHTTP.LoadRuntimeViewRecord(ctx, r, struct{}{})
		if err != nil {
			return nil, apperr.WrapAndLog(
				srv.logger,
				ctx,
				"FORM_BUILDER_RUNTIME_RECORD_DETAIL",
				http.StatusInternalServerError,
				"cannot load form builder runtime record detail",
				err,
				srv.FieldsForLog(ctx, r, nil)...,
			)
		}
		return info, nil
	}, srv.logger)

	register(
		"FORM_BUILDER_MODEL_LIST",
		http.MethodGet,
		"/app/platform-studio/forms/models",
		handler.HandleJson(func(ctx context.Context, r *http.Request, _ struct{}) (*formbuilder.ListModelsResponse, error) {
			info, err := srv.platformStudioFormBuilderHTTP.ListModels(ctx, r, struct{}{})
			if err != nil {
				return nil, apperr.WrapAndLog(srv.logger, ctx, "FORM_BUILDER_MODEL_LIST",
					http.StatusInternalServerError, "cannot list form builder models", err, srv.FieldsForLog(ctx, r, nil)...)
			}
			return info, nil
		}, srv.logger),
	)

	register(
		"FORM_BUILDER_MODEL_CREATE",
		http.MethodPost,
		"/app/platform-studio/forms/models",
		handler.HandleJson(func(ctx context.Context, r *http.Request, req formbuilder.CreateModelRequest) (*formbuilder.ModelDetailResponse, error) {
			info, err := srv.platformStudioFormBuilderHTTP.CreateModel(ctx, r, req)
			if err != nil {
				return nil, apperr.WrapAndLog(srv.logger, ctx, "FORM_BUILDER_MODEL_CREATE",
					http.StatusInternalServerError, "cannot create form builder model", err, srv.FieldsForLog(ctx, r, req)...)
			}
			return info, nil
		}, srv.logger),
	)

	register(
		"FORM_BUILDER_MODEL_DETAIL",
		http.MethodGet,
		"/app/platform-studio/forms/models/{modelId}",
		handler.HandleJson(func(ctx context.Context, r *http.Request, _ struct{}) (*formbuilder.ModelDetailResponse, error) {
			info, err := srv.platformStudioFormBuilderHTTP.GetModel(ctx, r, struct{}{})
			if err != nil {
				return nil, apperr.WrapAndLog(srv.logger, ctx, "FORM_BUILDER_MODEL_DETAIL",
					http.StatusInternalServerError, "cannot get form builder model", err, srv.FieldsForLog(ctx, r, nil)...)
			}
			return info, nil
		}, srv.logger),
	)

	register(
		"FORM_BUILDER_MODEL_EXPORT_DATA",
		http.MethodGet,
		"/app/platform-studio/forms/models/{modelId}/export/data",
		exportModelDataHandler,
	)

	register(
		"FORM_BUILDER_MODEL_EXPORT_BUNDLE",
		http.MethodGet,
		"/app/platform-studio/forms/models/{modelId}/export/model",
		exportModelBundleHandler,
	)

	// TODO(form-builder-runtime-access-v1): after Navigation Builder ACL exists, enforce
	// runtime/navigation grants on the `/app/forms/...` runtime endpoints below. Keep that guard
	// attached to the runtime route namespace and the `form_builder_view` target, not to a
	// request payload source flag. Until that ACL model exists, keep runtime routes on the
	// current tenant-auth baseline; do not invent a temporary grants policy.
	register(
		"FORM_BUILDER_RUNTIME_LIST_META",
		http.MethodGet,
		"/app/forms/{modelId}/views/{viewId}/meta",
		loadRuntimeViewListMetaHandler,
	)

	register(
		"FORM_BUILDER_PREVIEW_RUNTIME_LIST_META",
		http.MethodGet,
		"/app/platform-studio/forms/models/{modelId}/views/{viewId}/runtime/meta",
		loadRuntimeViewListMetaHandler,
	)

	register(
		"FORM_BUILDER_RUNTIME_LIST_QUERY",
		http.MethodPost,
		"/app/forms/{modelId}/views/{viewId}/query",
		queryRuntimeViewListHandler,
	)

	register(
		"FORM_BUILDER_PREVIEW_RUNTIME_LIST_QUERY",
		http.MethodPost,
		"/app/platform-studio/forms/models/{modelId}/views/{viewId}/runtime/query",
		queryRuntimeViewListHandler,
	)

	register(
		"FORM_BUILDER_RUNTIME_LIST_SEARCH_SUGGESTIONS",
		http.MethodGet,
		"/app/forms/{modelId}/views/{viewId}/search-suggestions",
		loadRuntimeViewListSearchSuggestionsHandler,
	)

	register(
		"FORM_BUILDER_PREVIEW_RUNTIME_LIST_SEARCH_SUGGESTIONS",
		http.MethodGet,
		"/app/platform-studio/forms/models/{modelId}/views/{viewId}/runtime/search-suggestions",
		loadRuntimeViewListSearchSuggestionsHandler,
	)

	register(
		"FORM_BUILDER_RUNTIME_LIST_SAVED_FILTER_CREATE",
		http.MethodPost,
		"/app/forms/{modelId}/views/{viewId}/saved-filters",
		createRuntimeViewListSavedFilterHandler,
	)

	register(
		"FORM_BUILDER_PREVIEW_RUNTIME_LIST_SAVED_FILTER_CREATE",
		http.MethodPost,
		"/app/platform-studio/forms/models/{modelId}/views/{viewId}/runtime/saved-filters",
		createRuntimeViewListSavedFilterHandler,
	)

	register(
		"FORM_BUILDER_RUNTIME_LIST_SAVED_FILTER_DELETE",
		http.MethodDelete,
		"/app/forms/{modelId}/views/{viewId}/saved-filters/{savedFilterId}",
		handler.HandleJson(func(ctx context.Context, r *http.Request, _ struct{}) (*formbuilder.RuntimeViewListDeleteSavedFilterResponse, error) {
			info, err := srv.platformStudioFormBuilderHTTP.DeleteRuntimeViewListSavedFilter(ctx, r, struct{}{})
			if err != nil {
				return nil, apperr.WrapAndLog(srv.logger, ctx, "FORM_BUILDER_RUNTIME_LIST_SAVED_FILTER_DELETE",
					http.StatusInternalServerError, "cannot delete form builder runtime saved filter", err, srv.FieldsForLog(ctx, r, nil)...)
			}
			return info, nil
		}, srv.logger),
	)

	register(
		"FORM_BUILDER_PREVIEW_RUNTIME_LIST_SAVED_FILTER_DELETE",
		http.MethodDelete,
		"/app/platform-studio/forms/models/{modelId}/views/{viewId}/runtime/saved-filters/{savedFilterId}",
		handler.HandleJson(func(ctx context.Context, r *http.Request, _ struct{}) (*formbuilder.RuntimeViewListDeleteSavedFilterResponse, error) {
			info, err := srv.platformStudioFormBuilderHTTP.DeleteRuntimeViewListSavedFilter(ctx, r, struct{}{})
			if err != nil {
				return nil, apperr.WrapAndLog(srv.logger, ctx, "FORM_BUILDER_PREVIEW_RUNTIME_LIST_SAVED_FILTER_DELETE",
					http.StatusInternalServerError, "cannot delete form builder preview runtime saved filter", err, srv.FieldsForLog(ctx, r, nil)...)
			}
			return info, nil
		}, srv.logger),
	)

	register(
		"FORM_BUILDER_RUNTIME_RECORD_DETAIL",
		http.MethodGet,
		"/app/forms/{modelId}/views/{viewId}/records/{docGuid}",
		loadRuntimeViewRecordHandler,
	)

	register(
		"FORM_BUILDER_PREVIEW_RUNTIME_RECORD_DETAIL",
		http.MethodGet,
		"/app/platform-studio/forms/models/{modelId}/views/{viewId}/runtime/records/{docGuid}",
		loadRuntimeViewRecordHandler,
	)

	// TODO(form-builder-preview-access-v1): enforce Platform Studio access on the mirrored preview
	// runtime endpoints under `/app/platform-studio/forms/models/{modelId}/views/{viewId}/runtime/*`.
	// Keep that guard attached to the preview API namespace. Do not multiplex preview vs runtime
	// access through an extra request-source parameter; the API route namespace is the contract.
	// If a future helper seam such as `authorizeRuntimeViewAccess(...)` is added before the full
	// ACL model lands, keep it allow-by-default rather than inventing a temporary policy.

	register(
		"FORM_BUILDER_MODEL_DELETE",
		http.MethodDelete,
		"/app/platform-studio/forms/models/{modelId}",
		handler.HandleJson(func(ctx context.Context, r *http.Request, _ struct{}) (*formbuilder.DeleteModelResponse, error) {
			info, err := srv.platformStudioFormBuilderHTTP.DeleteModel(ctx, r, struct{}{})
			if err != nil {
				return nil, apperr.WrapAndLog(srv.logger, ctx, "FORM_BUILDER_MODEL_DELETE",
					http.StatusInternalServerError, "cannot delete form builder model", err, srv.FieldsForLog(ctx, r, nil)...)
			}
			return info, nil
		}, srv.logger),
	)

	register(
		"FORM_BUILDER_VIEW_LIST",
		http.MethodGet,
		"/app/platform-studio/forms/models/{modelId}/views",
		handler.HandleJson(func(ctx context.Context, r *http.Request, _ struct{}) (*formbuilder.ListViewsResponse, error) {
			info, err := srv.platformStudioFormBuilderHTTP.ListViews(ctx, r, struct{}{})
			if err != nil {
				return nil, apperr.WrapAndLog(srv.logger, ctx, "FORM_BUILDER_VIEW_LIST",
					http.StatusInternalServerError, "cannot list form builder views", err, srv.FieldsForLog(ctx, r, nil)...)
			}
			return info, nil
		}, srv.logger),
	)

	register(
		"FORM_BUILDER_VIEW_CREATE",
		http.MethodPost,
		"/app/platform-studio/forms/models/{modelId}/views",
		handler.HandleJson(func(ctx context.Context, r *http.Request, req formbuilder.CreateViewRequest) (*formbuilder.ModelDetailResponse, error) {
			info, err := srv.platformStudioFormBuilderHTTP.CreateView(ctx, r, req)
			if err != nil {
				return nil, apperr.WrapAndLog(srv.logger, ctx, "FORM_BUILDER_VIEW_CREATE",
					http.StatusInternalServerError, "cannot create form builder view", err, srv.FieldsForLog(ctx, r, req)...)
			}
			return info, nil
		}, srv.logger),
	)

	register(
		"FORM_BUILDER_VIEW_DETAIL",
		http.MethodGet,
		"/app/platform-studio/forms/models/{modelId}/views/{viewId}",
		handler.HandleJson(func(ctx context.Context, r *http.Request, _ struct{}) (*formbuilder.ViewDetailResponse, error) {
			info, err := srv.platformStudioFormBuilderHTTP.GetView(ctx, r, struct{}{})
			if err != nil {
				return nil, apperr.WrapAndLog(srv.logger, ctx, "FORM_BUILDER_VIEW_DETAIL",
					http.StatusInternalServerError, "cannot get form builder view", err, srv.FieldsForLog(ctx, r, nil)...)
			}
			return info, nil
		}, srv.logger),
	)

	register(
		"FORM_BUILDER_VIEW_COPY",
		http.MethodPost,
		"/app/platform-studio/forms/models/{modelId}/views/{viewId}/copy",
		handler.HandleJson(func(ctx context.Context, r *http.Request, req formbuilder.CopyViewRequest) (*formbuilder.ModelDetailResponse, error) {
			info, err := srv.platformStudioFormBuilderHTTP.CopyView(ctx, r, req)
			if err != nil {
				return nil, apperr.WrapAndLog(srv.logger, ctx, "FORM_BUILDER_VIEW_COPY",
					http.StatusInternalServerError, "cannot copy form builder view", err, srv.FieldsForLog(ctx, r, req)...)
			}
			return info, nil
		}, srv.logger),
	)

	register(
		"FORM_BUILDER_VIEW_DELETE",
		http.MethodDelete,
		"/app/platform-studio/forms/models/{modelId}/views/{viewId}",
		handler.HandleJson(func(ctx context.Context, r *http.Request, _ struct{}) (*formbuilder.ModelDetailResponse, error) {
			info, err := srv.platformStudioFormBuilderHTTP.DeleteView(ctx, r, struct{}{})
			if err != nil {
				return nil, apperr.WrapAndLog(srv.logger, ctx, "FORM_BUILDER_VIEW_DELETE",
					http.StatusInternalServerError, "cannot delete form builder view", err, srv.FieldsForLog(ctx, r, nil)...)
			}
			return info, nil
		}, srv.logger),
	)

	register(
		"FORM_BUILDER_AUTHORING_LOAD",
		http.MethodGet,
		"/app/platform-studio/forms/models/{modelId}/views/{viewId}/authoring",
		loadAuthoringStateHandler,
	)

	register(
		"FORM_BUILDER_DRAFT_LOAD_LEGACY",
		http.MethodGet,
		"/app/platform-studio/forms/models/{modelId}/views/{viewId}/draft",
		loadAuthoringStateHandler,
	)

	register(
		"FORM_BUILDER_AUTHORING_SAVE",
		http.MethodPut,
		"/app/platform-studio/forms/models/{modelId}/views/{viewId}/authoring",
		saveAuthoringStateHandler,
	)

	register(
		"FORM_BUILDER_DRAFT_SAVE_LEGACY",
		http.MethodPut,
		"/app/platform-studio/forms/models/{modelId}/views/{viewId}/draft",
		saveAuthoringStateHandler,
	)
}

func writePlatformStudioFormBuilderError(w http.ResponseWriter, err error) {
	appErr := apperr.ToHTTP(err)
	w.Header().Set("Content-Type", "application/json")
	w.WriteHeader(appErr.StatusCode)
	_ = json.NewEncoder(w).Encode(handler.Response{
		Status:  "error",
		Code:    appErr.Code,
		Message: appErr.Message,
	})
}

func summarizeFormBuilderSaveDraftRequest(r *http.Request, req formbuilder.SaveDraftRequest) map[string]any {
	summary := map[string]any{
		"expectedVersions": req.ExpectedVersions,
		"modelBytes":       len(req.Draft.Model),
		"modelId":          strings.TrimSpace(r.PathValue("modelId")),
		"viewBytes":        len(req.Draft.View),
		"viewId":           strings.TrimSpace(r.PathValue("viewId")),
	}

	return summary
}
