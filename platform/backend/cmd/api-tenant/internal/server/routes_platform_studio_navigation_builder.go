package server

import (
	"context"
	"net/http"

	"dtriton.com/platform/backend/internal/platform/httpx/apperr"
	"dtriton.com/platform/backend/internal/platform/httpx/handler"
	"dtriton.com/platform/backend/internal/platform/httpx/router"
	navigationbuilder "dtriton.com/platform/backend/modules/tenant/platformstudionavigationbuilder"
)

func (srv *Server) registerPlatformStudioNavigationBuilderRoutes(b *router.Builder) {
	register := func(id router.RouteID, method, path string, h http.Handler) {
		b.Handle(id, method, path, router.TierSecure, h)
	}

	register(
		"TENANT_RUNTIME_NAVIGATION_GET",
		http.MethodGet,
		"/app/navigation",
		handler.HandleJson(func(ctx context.Context, r *http.Request, _ struct{}) (*navigationbuilder.RuntimeNavigationResponse, error) {
			info, err := srv.platformStudioNavigationBuilderHTTP.LoadRuntimeNavigation(ctx, r, struct{}{})
			if err != nil {
				return nil, apperr.WrapAndLog(
					srv.logger,
					ctx,
					"TENANT_RUNTIME_NAVIGATION_GET",
					http.StatusInternalServerError,
					"cannot load tenant runtime navigation",
					err,
					srv.FieldsForLog(ctx, r, nil)...,
				)
			}
			return info, nil
		}, srv.logger),
	)

	register(
		"NAVIGATION_BUILDER_CONFIG_GET",
		http.MethodGet,
		"/app/platform-studio/navigation",
		handler.HandleJson(func(ctx context.Context, r *http.Request, _ struct{}) (*navigationbuilder.LoadConfigResponse, error) {
			info, err := srv.platformStudioNavigationBuilderHTTP.LoadConfig(ctx, r, struct{}{})
			if err != nil {
				return nil, apperr.WrapAndLog(
					srv.logger,
					ctx,
					"NAVIGATION_BUILDER_CONFIG_GET",
					http.StatusInternalServerError,
					"cannot load navigation builder config",
					err,
					srv.FieldsForLog(ctx, r, nil)...,
				)
			}
			return info, nil
		}, srv.logger),
	)

	register(
		"NAVIGATION_BUILDER_ACCESS_OPTIONS_GET",
		http.MethodGet,
		"/app/platform-studio/navigation/access-options",
		handler.HandleJson(func(ctx context.Context, r *http.Request, _ struct{}) (*navigationbuilder.AccessOptionsResponse, error) {
			info, err := srv.platformStudioNavigationBuilderHTTP.LoadAccessOptions(ctx, r, struct{}{})
			if err != nil {
				return nil, apperr.WrapAndLog(
					srv.logger,
					ctx,
					"NAVIGATION_BUILDER_ACCESS_OPTIONS_GET",
					http.StatusInternalServerError,
					"cannot load navigation builder access options",
					err,
					srv.FieldsForLog(ctx, r, nil)...,
				)
			}
			return info, nil
		}, srv.logger),
	)

	register(
		"NAVIGATION_BUILDER_ACCESS_OPTIONS_PAGE_GET",
		http.MethodGet,
		"/app/platform-studio/navigation/access-options/page",
		handler.HandleJson(func(ctx context.Context, r *http.Request, _ struct{}) (*navigationbuilder.AccessOptionsPageResponse, error) {
			info, err := srv.platformStudioNavigationBuilderHTTP.LoadAccessOptionPage(ctx, r, struct{}{})
			if err != nil {
				return nil, apperr.WrapAndLog(
					srv.logger,
					ctx,
					"NAVIGATION_BUILDER_ACCESS_OPTIONS_PAGE_GET",
					http.StatusInternalServerError,
					"cannot load navigation builder access option page",
					err,
					srv.FieldsForLog(ctx, r, nil)...,
				)
			}
			return info, nil
		}, srv.logger),
	)

	register(
		"NAVIGATION_BUILDER_CONFIG_SAVE",
		http.MethodPut,
		"/app/platform-studio/navigation",
		handler.HandleJson(func(ctx context.Context, r *http.Request, req navigationbuilder.SaveConfigRequest) (*navigationbuilder.SaveConfigResponse, error) {
			info, err := srv.platformStudioNavigationBuilderHTTP.SaveConfig(ctx, r, req)
			if err != nil {
				return nil, apperr.WrapAndLog(
					srv.logger,
					ctx,
					"NAVIGATION_BUILDER_CONFIG_SAVE",
					http.StatusInternalServerError,
					"cannot save navigation builder config",
					err,
					srv.FieldsForLog(ctx, r, summarizeNavigationBuilderSaveConfigRequest(req))...,
				)
			}
			return info, nil
		}, srv.logger),
	)
}

func summarizeNavigationBuilderSaveConfigRequest(req navigationbuilder.SaveConfigRequest) map[string]any {
	summary := map[string]any{
		"app_menu_count":     len(req.Definition.AppMenu),
		"utility_rail_count": len(req.Definition.UtilityRail),
		"schema_version":     req.Definition.SchemaVersion,
	}
	if req.ExpectedVersion != nil {
		summary["expected_version"] = *req.ExpectedVersion
	}
	return summary
}
