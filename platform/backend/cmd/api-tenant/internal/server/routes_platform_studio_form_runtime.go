package server

import (
	"context"
	"net/http"
	"strings"

	"dtriton.com/platform/backend/internal/platform/httpx/apperr"
	"dtriton.com/platform/backend/internal/platform/httpx/handler"
	"dtriton.com/platform/backend/internal/platform/httpx/router"
	formruntime "dtriton.com/platform/backend/modules/tenant/platformstudioformruntime"
)

func (srv *Server) registerPlatformStudioFormRuntimeRoutes(b *router.Builder) {
	register := func(id router.RouteID, method, path string, h http.Handler) {
		if strings.HasPrefix(path, "/app/platform-studio/") {
			h = srv.withPlatformStudioAccess(h)
		} else if strings.HasPrefix(path, "/app/forms/") {
			h = srv.withRuntimeFormViewAccess(h)
		}
		b.Handle(id, method, path, router.TierSecure, h)
	}

	loadFormHandler := handler.HandleJson(func(ctx context.Context, r *http.Request, _ struct{}) (*formruntime.RuntimeViewFormResponse, error) {
		info, err := srv.platformStudioFormRuntimeHTTP.LoadForm(ctx, r)
		if err != nil {
			return nil, apperr.WrapAndLog(
				srv.logger,
				ctx,
				"FORM_RUNTIME_FORM_LOAD",
				http.StatusInternalServerError,
				"cannot load form runtime form",
				err,
				srv.FieldsForLog(ctx, r, nil)...,
			)
		}
		return info, nil
	}, srv.logger)

	register(
		"FORM_RUNTIME_FORM_LOAD",
		http.MethodGet,
		"/app/forms/{modelId}/views/{viewId}/form",
		loadFormHandler,
	)

	register(
		"FORM_RUNTIME_PREVIEW_FORM_LOAD",
		http.MethodGet,
		"/app/platform-studio/forms/{modelId}/views/{viewId}/runtime/form",
		loadFormHandler,
	)

	register(
		"FORM_RUNTIME_RECORD_FORM_LOAD",
		http.MethodGet,
		"/app/forms/{modelId}/views/{viewId}/records/{docGuid}/form",
		loadFormHandler,
	)

	register(
		"FORM_RUNTIME_PREVIEW_RECORD_FORM_LOAD",
		http.MethodGet,
		"/app/platform-studio/forms/{modelId}/views/{viewId}/runtime/records/{docGuid}/form",
		loadFormHandler,
	)

	loadSubformHandler := handler.HandleJson(func(ctx context.Context, r *http.Request, _ struct{}) (*formruntime.RuntimeViewFormResponse, error) {
		info, err := srv.platformStudioFormRuntimeHTTP.LoadSubform(ctx, r)
		if err != nil {
			return nil, apperr.WrapAndLog(
				srv.logger,
				ctx,
				"FORM_RUNTIME_SUBFORM_LOAD",
				http.StatusInternalServerError,
				"cannot load form runtime subform",
				err,
				srv.FieldsForLog(ctx, r, nil)...,
			)
		}
		return info, nil
	}, srv.logger)

	register(
		"FORM_RUNTIME_SUBFORM_CREATE_FORM_LOAD",
		http.MethodGet,
		"/app/forms/{modelId}/views/{viewId}/records/{parentDocGuid}/subforms/{subformId}/form",
		loadSubformHandler,
	)

	register(
		"FORM_RUNTIME_PREVIEW_SUBFORM_CREATE_FORM_LOAD",
		http.MethodGet,
		"/app/platform-studio/forms/{modelId}/views/{viewId}/runtime/records/{parentDocGuid}/subforms/{subformId}/form",
		loadSubformHandler,
	)

	register(
		"FORM_RUNTIME_SUBFORM_RECORD_FORM_LOAD",
		http.MethodGet,
		"/app/forms/{modelId}/views/{viewId}/records/{parentDocGuid}/subforms/{subformId}/records/{docGuid}/form",
		loadSubformHandler,
	)

	register(
		"FORM_RUNTIME_PREVIEW_SUBFORM_RECORD_FORM_LOAD",
		http.MethodGet,
		"/app/platform-studio/forms/{modelId}/views/{viewId}/runtime/records/{parentDocGuid}/subforms/{subformId}/records/{docGuid}/form",
		loadSubformHandler,
	)

	createRecordHandler := handler.HandleJson(func(ctx context.Context, r *http.Request, req formruntime.RuntimeViewRecordMutationRequest) (*formruntime.RuntimeViewRecordMutationResponse, error) {
		info, err := srv.platformStudioFormRuntimeHTTP.CreateRecord(ctx, r, req)
		if err != nil {
			return nil, apperr.WrapAndLog(
				srv.logger,
				ctx,
				"FORM_RUNTIME_RECORD_CREATE",
				http.StatusInternalServerError,
				"cannot create form runtime record",
				err,
				srv.FieldsForLog(ctx, r, req)...,
			)
		}
		return info, nil
	}, srv.logger)

	register(
		"FORM_RUNTIME_RECORD_CREATE",
		http.MethodPost,
		"/app/forms/{modelId}/views/{viewId}/records",
		createRecordHandler,
	)

	register(
		"FORM_RUNTIME_PREVIEW_RECORD_CREATE",
		http.MethodPost,
		"/app/platform-studio/forms/{modelId}/views/{viewId}/runtime/records",
		createRecordHandler,
	)

	updateRecordHandler := handler.HandleJson(func(ctx context.Context, r *http.Request, req formruntime.RuntimeViewRecordMutationRequest) (*formruntime.RuntimeViewRecordMutationResponse, error) {
		info, err := srv.platformStudioFormRuntimeHTTP.UpdateRecord(ctx, r, req)
		if err != nil {
			return nil, apperr.WrapAndLog(
				srv.logger,
				ctx,
				"FORM_RUNTIME_RECORD_UPDATE",
				http.StatusInternalServerError,
				"cannot update form runtime record",
				err,
				srv.FieldsForLog(ctx, r, req)...,
			)
		}
		return info, nil
	}, srv.logger)

	register(
		"FORM_RUNTIME_RECORD_UPDATE",
		http.MethodPatch,
		"/app/forms/{modelId}/views/{viewId}/records/{docGuid}",
		updateRecordHandler,
	)

	register(
		"FORM_RUNTIME_PREVIEW_RECORD_UPDATE",
		http.MethodPatch,
		"/app/platform-studio/forms/{modelId}/views/{viewId}/runtime/records/{docGuid}",
		updateRecordHandler,
	)

	createSubformRecordHandler := handler.HandleJson(func(ctx context.Context, r *http.Request, req formruntime.RuntimeViewRecordMutationRequest) (*formruntime.RuntimeViewRecordMutationResponse, error) {
		info, err := srv.platformStudioFormRuntimeHTTP.CreateSubformRecord(ctx, r, req)
		if err != nil {
			return nil, apperr.WrapAndLog(
				srv.logger,
				ctx,
				"FORM_RUNTIME_SUBFORM_RECORD_CREATE",
				http.StatusInternalServerError,
				"cannot create form runtime subform record",
				err,
				srv.FieldsForLog(ctx, r, req)...,
			)
		}
		return info, nil
	}, srv.logger)

	register(
		"FORM_RUNTIME_SUBFORM_RECORD_CREATE",
		http.MethodPost,
		"/app/forms/{modelId}/views/{viewId}/records/{parentDocGuid}/subforms/{subformId}/records",
		createSubformRecordHandler,
	)

	register(
		"FORM_RUNTIME_PREVIEW_SUBFORM_RECORD_CREATE",
		http.MethodPost,
		"/app/platform-studio/forms/{modelId}/views/{viewId}/runtime/records/{parentDocGuid}/subforms/{subformId}/records",
		createSubformRecordHandler,
	)

	updateSubformRecordHandler := handler.HandleJson(func(ctx context.Context, r *http.Request, req formruntime.RuntimeViewRecordMutationRequest) (*formruntime.RuntimeViewRecordMutationResponse, error) {
		info, err := srv.platformStudioFormRuntimeHTTP.UpdateSubformRecord(ctx, r, req)
		if err != nil {
			return nil, apperr.WrapAndLog(
				srv.logger,
				ctx,
				"FORM_RUNTIME_SUBFORM_RECORD_UPDATE",
				http.StatusInternalServerError,
				"cannot update form runtime subform record",
				err,
				srv.FieldsForLog(ctx, r, req)...,
			)
		}
		return info, nil
	}, srv.logger)

	register(
		"FORM_RUNTIME_SUBFORM_RECORD_UPDATE",
		http.MethodPatch,
		"/app/forms/{modelId}/views/{viewId}/records/{parentDocGuid}/subforms/{subformId}/records/{docGuid}",
		updateSubformRecordHandler,
	)

	register(
		"FORM_RUNTIME_PREVIEW_SUBFORM_RECORD_UPDATE",
		http.MethodPatch,
		"/app/platform-studio/forms/{modelId}/views/{viewId}/runtime/records/{parentDocGuid}/subforms/{subformId}/records/{docGuid}",
		updateSubformRecordHandler,
	)

	deleteSubformRecordHandler := handler.HandleJson(func(ctx context.Context, r *http.Request, _ struct{}) (*formruntime.RuntimeViewDeleteResponse, error) {
		info, err := srv.platformStudioFormRuntimeHTTP.DeleteSubformRecord(ctx, r)
		if err != nil {
			return nil, apperr.WrapAndLog(
				srv.logger,
				ctx,
				"FORM_RUNTIME_SUBFORM_RECORD_DELETE",
				http.StatusInternalServerError,
				"cannot delete form runtime subform record",
				err,
				srv.FieldsForLog(ctx, r, nil)...,
			)
		}
		return info, nil
	}, srv.logger)

	register(
		"FORM_RUNTIME_SUBFORM_RECORD_DELETE",
		http.MethodDelete,
		"/app/forms/{modelId}/views/{viewId}/records/{parentDocGuid}/subforms/{subformId}/records/{docGuid}",
		deleteSubformRecordHandler,
	)

	register(
		"FORM_RUNTIME_PREVIEW_SUBFORM_RECORD_DELETE",
		http.MethodDelete,
		"/app/platform-studio/forms/{modelId}/views/{viewId}/runtime/records/{parentDocGuid}/subforms/{subformId}/records/{docGuid}",
		deleteSubformRecordHandler,
	)

	finishRecordHandler := handler.HandleJson(func(ctx context.Context, r *http.Request, req formruntime.RuntimeViewRecordFinishRequest) (*formruntime.RuntimeViewRecordMutationResponse, error) {
		info, err := srv.platformStudioFormRuntimeHTTP.FinishRecord(ctx, r, req)
		if err != nil {
			return nil, apperr.WrapAndLog(
				srv.logger,
				ctx,
				"FORM_RUNTIME_RECORD_FINISH",
				http.StatusInternalServerError,
				"cannot finish form runtime record",
				err,
				srv.FieldsForLog(ctx, r, req)...,
			)
		}
		return info, nil
	}, srv.logger)

	register(
		"FORM_RUNTIME_RECORD_FINISH",
		http.MethodPost,
		"/app/forms/{modelId}/views/{viewId}/records/{docGuid}/finish",
		finishRecordHandler,
	)

	register(
		"FORM_RUNTIME_PREVIEW_RECORD_FINISH",
		http.MethodPost,
		"/app/platform-studio/forms/{modelId}/views/{viewId}/runtime/records/{docGuid}/finish",
		finishRecordHandler,
	)

	register(
		"FORM_RUNTIME_BULK_ACTION",
		http.MethodPost,
		"/app/forms/{modelId}/views/{viewId}/bulk-actions/{actionId}",
		handler.HandleJson(func(ctx context.Context, r *http.Request, req formruntime.RuntimeViewBulkActionRequest) (*formruntime.RuntimeViewBulkActionResponse, error) {
			info, err := srv.platformStudioFormRuntimeHTTP.RunBulkAction(ctx, r, req)
			if err != nil {
				return nil, apperr.WrapAndLog(
					srv.logger,
					ctx,
					"FORM_RUNTIME_BULK_ACTION",
					http.StatusInternalServerError,
					"cannot run form runtime bulk action",
					err,
					srv.FieldsForLog(ctx, r, req)...,
				)
			}
			return info, nil
		}, srv.logger),
	)

	register(
		"FORM_RUNTIME_PREVIEW_BULK_ACTION",
		http.MethodPost,
		"/app/platform-studio/forms/{modelId}/views/{viewId}/runtime/bulk-actions/{actionId}",
		handler.HandleJson(func(ctx context.Context, r *http.Request, req formruntime.RuntimeViewBulkActionRequest) (*formruntime.RuntimeViewBulkActionResponse, error) {
			info, err := srv.platformStudioFormRuntimeHTTP.RunBulkAction(ctx, r, req)
			if err != nil {
				return nil, apperr.WrapAndLog(
					srv.logger,
					ctx,
					"FORM_RUNTIME_PREVIEW_BULK_ACTION",
					http.StatusInternalServerError,
					"cannot run form runtime preview bulk action",
					err,
					srv.FieldsForLog(ctx, r, req)...,
				)
			}
			return info, nil
		}, srv.logger),
	)
}
