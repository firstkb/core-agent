package server

import (
	"context"
	"net/http"

	"dtriton.com/platform/backend/internal/platform/httpx/apperr"
	"dtriton.com/platform/backend/internal/platform/httpx/handler"
	"dtriton.com/platform/backend/internal/platform/httpx/router"
	formruntime "dtriton.com/platform/backend/modules/tenant/platformstudioformruntime"
)

func (srv *Server) registerPlatformStudioFormRuntimeRoutes(b *router.Builder) {
	register := func(id router.RouteID, method, path string, h http.Handler) {
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
		"FORM_RUNTIME_RECORD_FORM_LOAD",
		http.MethodGet,
		"/app/forms/{modelId}/views/{viewId}/records/{docGuid}/form",
		loadFormHandler,
	)

	register(
		"FORM_RUNTIME_RECORD_CREATE",
		http.MethodPost,
		"/app/forms/{modelId}/views/{viewId}/records",
		handler.HandleJson(func(ctx context.Context, r *http.Request, req formruntime.RuntimeViewRecordMutationRequest) (*formruntime.RuntimeViewRecordMutationResponse, error) {
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
		}, srv.logger),
	)

	register(
		"FORM_RUNTIME_RECORD_UPDATE",
		http.MethodPatch,
		"/app/forms/{modelId}/views/{viewId}/records/{docGuid}",
		handler.HandleJson(func(ctx context.Context, r *http.Request, req formruntime.RuntimeViewRecordMutationRequest) (*formruntime.RuntimeViewRecordMutationResponse, error) {
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
		}, srv.logger),
	)

	register(
		"FORM_RUNTIME_RECORD_FINISH",
		http.MethodPost,
		"/app/forms/{modelId}/views/{viewId}/records/{docGuid}/finish",
		handler.HandleJson(func(ctx context.Context, r *http.Request, req formruntime.RuntimeViewRecordFinishRequest) (*formruntime.RuntimeViewRecordMutationResponse, error) {
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
		}, srv.logger),
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
}
