package server

import (
	"context"
	"net/http"

	"dtriton.com/platform/backend/internal/platform/httpx/apperr"
	"dtriton.com/platform/backend/internal/platform/httpx/handler"
	"dtriton.com/platform/backend/internal/platform/httpx/router"
	tenantlist "dtriton.com/platform/backend/modules/admin/tenantlist"
)

func (srv *Server) registerTenantListRoutes(b *router.Builder) {
	register := func(id router.RouteID, method, path string, h http.Handler) {
		b.Handle(id, method, path, router.TierSecure, h)
	}

	register("ADMIN_TENANTS_LIST_META_GET", http.MethodGet, "/app/admin/tenants/list/meta",
		handler.HandleJson(func(ctx context.Context, r *http.Request, _ struct{}) (*tenantlist.MetaResponse, error) {
			info, err := srv.tenantListHT.GetMeta(ctx, r, struct{}{})
			if err != nil {
				return nil, apperr.WrapAndLog(srv.logger, ctx, "ADMIN_TENANTS_LIST_META_GET",
					http.StatusInternalServerError, "cannot get tenant list meta", err, srv.FieldsForLog(ctx, r, nil)...)
			}
			return info, nil
		}, srv.logger))

	register("ADMIN_TENANTS_LIST_QUERY", http.MethodPost, "/app/admin/tenants/list/query",
		handler.HandleJson(func(ctx context.Context, r *http.Request, req tenantlist.QueryRequest) (*tenantlist.QueryResponse, error) {
			info, err := srv.tenantListHT.Query(ctx, r, req)
			if err != nil {
				return nil, apperr.WrapAndLog(srv.logger, ctx, "ADMIN_TENANTS_LIST_QUERY",
					http.StatusInternalServerError, "cannot query tenant list", err, srv.FieldsForLog(ctx, r, req)...)
			}
			return info, nil
		}, srv.logger))

	register("ADMIN_TENANTS_LIST_SEARCH_SUGGESTIONS_GET", http.MethodGet, "/app/admin/tenants/list/search-suggestions",
		handler.HandleJson(func(ctx context.Context, r *http.Request, _ struct{}) (*tenantlist.SearchSuggestionsResponse, error) {
			info, err := srv.tenantListHT.GetSearchSuggestions(ctx, r, struct{}{})
			if err != nil {
				return nil, apperr.WrapAndLog(srv.logger, ctx, "ADMIN_TENANTS_LIST_SEARCH_SUGGESTIONS_GET",
					http.StatusInternalServerError, "cannot get tenant list search suggestions", err, srv.FieldsForLog(ctx, r, nil)...)
			}
			return info, nil
		}, srv.logger))

	register("ADMIN_TENANTS_LIST_FAVORITE_TOGGLE", http.MethodPost, "/app/admin/tenants/list/favorite/toggle",
		handler.HandleJson(func(ctx context.Context, r *http.Request, _ struct{}) (*tenantlist.FavoriteToggleResponse, error) {
			info, err := srv.tenantListHT.ToggleFavorite(ctx, r, struct{}{})
			if err != nil {
				return nil, apperr.WrapAndLog(srv.logger, ctx, "ADMIN_TENANTS_LIST_FAVORITE_TOGGLE",
					http.StatusInternalServerError, "cannot toggle tenant list favorite", err, srv.FieldsForLog(ctx, r, nil)...)
			}
			return info, nil
		}, srv.logger))

	register("ADMIN_TENANTS_LIST_SAVED_FILTER_CREATE", http.MethodPost, "/app/admin/tenants/list/saved-filters",
		handler.HandleJson(func(ctx context.Context, r *http.Request, req tenantlist.CreateSavedFilterInput) (*tenantlist.SavedFilterSet, error) {
			info, err := srv.tenantListHT.CreateSavedFilter(ctx, r, req)
			if err != nil {
				return nil, apperr.WrapAndLog(srv.logger, ctx, "ADMIN_TENANTS_LIST_SAVED_FILTER_CREATE",
					http.StatusInternalServerError, "cannot create tenant list saved filter", err, srv.FieldsForLog(ctx, r, req)...)
			}
			return info, nil
		}, srv.logger))
}
