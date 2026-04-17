package server

import (
	"context"
	"net/http"

	"dtriton.com/platform/backend/internal/platform/httpx/apperr"
	"dtriton.com/platform/backend/internal/platform/httpx/handler"
	"dtriton.com/platform/backend/internal/platform/httpx/router"
	moduleregistrylist "dtriton.com/platform/backend/modules/admin/moduleregistrylist"
)

func (srv *Server) registerModuleRegistryListRoutes(b *router.Builder) {
	register := func(id router.RouteID, method, path string, h http.Handler) {
		b.Handle(id, method, path, router.TierSecure, h)
	}

	register("ADMIN_MODULE_REGISTRY_META_GET", http.MethodGet, "/app/admin/module-registry/list/meta",
		handler.HandleJson(func(ctx context.Context, r *http.Request, _ struct{}) (*moduleregistrylist.MetaResponse, error) {
			info, err := srv.moduleRegistryListHT.GetMeta(ctx, r, struct{}{})
			if err != nil {
				return nil, apperr.WrapAndLog(srv.logger, ctx, "ADMIN_MODULE_REGISTRY_META_GET",
					http.StatusInternalServerError, "cannot get module registry meta", err, srv.FieldsForLog(ctx, r, nil)...)
			}
			return info, nil
		}, srv.logger))

	register("ADMIN_MODULE_REGISTRY_QUERY", http.MethodPost, "/app/admin/module-registry/list/query",
		handler.HandleJson(func(ctx context.Context, r *http.Request, req moduleregistrylist.QueryRequest) (*moduleregistrylist.QueryResponse, error) {
			info, err := srv.moduleRegistryListHT.Query(ctx, r, req)
			if err != nil {
				return nil, apperr.WrapAndLog(srv.logger, ctx, "ADMIN_MODULE_REGISTRY_QUERY",
					http.StatusInternalServerError, "cannot query module registry", err, srv.FieldsForLog(ctx, r, req)...)
			}
			return info, nil
		}, srv.logger))

	register("ADMIN_MODULE_REGISTRY_SEARCH_SUGGESTIONS_GET", http.MethodGet, "/app/admin/module-registry/list/search-suggestions",
		handler.HandleJson(func(ctx context.Context, r *http.Request, _ struct{}) (*moduleregistrylist.SearchSuggestionsResponse, error) {
			info, err := srv.moduleRegistryListHT.GetSearchSuggestions(ctx, r, struct{}{})
			if err != nil {
				return nil, apperr.WrapAndLog(srv.logger, ctx, "ADMIN_MODULE_REGISTRY_SEARCH_SUGGESTIONS_GET",
					http.StatusInternalServerError, "cannot get module registry search suggestions", err, srv.FieldsForLog(ctx, r, nil)...)
			}
			return info, nil
		}, srv.logger))

	register("ADMIN_MODULE_REGISTRY_FAVORITE_TOGGLE", http.MethodPost, "/app/admin/module-registry/list/favorite/toggle",
		handler.HandleJson(func(ctx context.Context, r *http.Request, _ struct{}) (*moduleregistrylist.FavoriteToggleResponse, error) {
			info, err := srv.moduleRegistryListHT.ToggleFavorite(ctx, r, struct{}{})
			if err != nil {
				return nil, apperr.WrapAndLog(srv.logger, ctx, "ADMIN_MODULE_REGISTRY_FAVORITE_TOGGLE",
					http.StatusInternalServerError, "cannot toggle module registry favorite", err, srv.FieldsForLog(ctx, r, nil)...)
			}
			return info, nil
		}, srv.logger))

	register("ADMIN_MODULE_REGISTRY_SAVED_FILTER_CREATE", http.MethodPost, "/app/admin/module-registry/list/saved-filters",
		handler.HandleJson(func(ctx context.Context, r *http.Request, req moduleregistrylist.CreateSavedFilterInput) (*moduleregistrylist.SavedFilterSet, error) {
			info, err := srv.moduleRegistryListHT.CreateSavedFilter(ctx, r, req)
			if err != nil {
				return nil, apperr.WrapAndLog(srv.logger, ctx, "ADMIN_MODULE_REGISTRY_SAVED_FILTER_CREATE",
					http.StatusInternalServerError, "cannot create module registry saved filter", err, srv.FieldsForLog(ctx, r, req)...)
			}
			return info, nil
		}, srv.logger))

	register("ADMIN_MODULE_REGISTRY_SAVED_FILTER_DELETE", http.MethodDelete, "/app/admin/module-registry/list/saved-filters/{savedFilterId}",
		handler.HandleJson(func(ctx context.Context, r *http.Request, _ struct{}) (*moduleregistrylist.DeleteSavedFilterResponse, error) {
			info, err := srv.moduleRegistryListHT.DeleteSavedFilter(ctx, r, struct{}{})
			if err != nil {
				return nil, apperr.WrapAndLog(srv.logger, ctx, "ADMIN_MODULE_REGISTRY_SAVED_FILTER_DELETE",
					http.StatusInternalServerError, "cannot delete module registry saved filter", err, srv.FieldsForLog(ctx, r, nil)...)
			}
			return info, nil
		}, srv.logger))

	register("ADMIN_MODULE_REGISTRY_BULK_ACTION", http.MethodPost, "/app/admin/module-registry/list/bulk-actions/{actionId}",
		handler.HandleJson(func(ctx context.Context, r *http.Request, req moduleregistrylist.BulkActionInput) (*moduleregistrylist.MutationResult, error) {
			info, err := srv.moduleRegistryListHT.RunBulkAction(ctx, r, req)
			if err != nil {
				return nil, apperr.WrapAndLog(srv.logger, ctx, "ADMIN_MODULE_REGISTRY_BULK_ACTION",
					http.StatusInternalServerError, "cannot run module registry bulk action", err, srv.FieldsForLog(ctx, r, req)...)
			}
			return info, nil
		}, srv.logger))

	register("ADMIN_MODULE_REGISTRY_ROW_ACTION", http.MethodPost, "/app/admin/module-registry/list/row-actions/{actionId}",
		handler.HandleJson(func(ctx context.Context, r *http.Request, req moduleregistrylist.RowActionInput) (*moduleregistrylist.MutationResult, error) {
			info, err := srv.moduleRegistryListHT.RunRowAction(ctx, r, req)
			if err != nil {
				return nil, apperr.WrapAndLog(srv.logger, ctx, "ADMIN_MODULE_REGISTRY_ROW_ACTION",
					http.StatusInternalServerError, "cannot run module registry row action", err, srv.FieldsForLog(ctx, r, req)...)
			}
			return info, nil
		}, srv.logger))

	register("ADMIN_MODULE_REGISTRY_EXPORT_XLS", http.MethodPost, "/app/admin/module-registry/list/export-xls",
		handler.HandleJson(func(ctx context.Context, r *http.Request, req moduleregistrylist.ExportRequest) (*moduleregistrylist.MutationResult, error) {
			info, err := srv.moduleRegistryListHT.ExportXLS(ctx, r, req)
			if err != nil {
				return nil, apperr.WrapAndLog(srv.logger, ctx, "ADMIN_MODULE_REGISTRY_EXPORT_XLS",
					http.StatusInternalServerError, "cannot export module registry xls", err, srv.FieldsForLog(ctx, r, req)...)
			}
			return info, nil
		}, srv.logger))
}
