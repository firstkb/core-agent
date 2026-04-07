package server

import (
	"context"
	"net/http"

	"dtriton.com/platform/backend/internal/platform/httpx/apperr"
	"dtriton.com/platform/backend/internal/platform/httpx/handler"
	"dtriton.com/platform/backend/internal/platform/httpx/router"
	employeeslist "dtriton.com/platform/backend/modules/admin/employeeslist"
)

func (srv *Server) registerEmployeesListRoutes(b *router.Builder) {
	register := func(id router.RouteID, method, path string, h http.Handler) {
		b.Handle(id, method, path, router.TierSecure, h)
	}

	register("ADMIN_EMPLOYEES_LIST_META_GET", http.MethodGet, "/app/admin/employees/list/meta",
		handler.HandleJson(func(ctx context.Context, r *http.Request, _ struct{}) (*employeeslist.MetaResponse, error) {
			info, err := srv.employeesListHT.GetMeta(ctx, r, struct{}{})
			if err != nil {
				return nil, apperr.WrapAndLog(srv.logger, ctx, "ADMIN_EMPLOYEES_LIST_META_GET",
					http.StatusInternalServerError, "cannot get employees list meta", err, srv.FieldsForLog(ctx, r, nil)...)
			}
			return info, nil
		}, srv.logger))

	register("ADMIN_EMPLOYEES_LIST_QUERY", http.MethodPost, "/app/admin/employees/list/query",
		handler.HandleJson(func(ctx context.Context, r *http.Request, req employeeslist.QueryRequest) (*employeeslist.QueryResponse, error) {
			info, err := srv.employeesListHT.Query(ctx, r, req)
			if err != nil {
				return nil, apperr.WrapAndLog(srv.logger, ctx, "ADMIN_EMPLOYEES_LIST_QUERY",
					http.StatusInternalServerError, "cannot query employees list", err, srv.FieldsForLog(ctx, r, req)...)
			}
			return info, nil
		}, srv.logger))

	register("ADMIN_EMPLOYEES_LIST_SEARCH_SUGGESTIONS_GET", http.MethodGet, "/app/admin/employees/list/search-suggestions",
		handler.HandleJson(func(ctx context.Context, r *http.Request, _ struct{}) (*employeeslist.SearchSuggestionsResponse, error) {
			info, err := srv.employeesListHT.GetSearchSuggestions(ctx, r, struct{}{})
			if err != nil {
				return nil, apperr.WrapAndLog(srv.logger, ctx, "ADMIN_EMPLOYEES_LIST_SEARCH_SUGGESTIONS_GET",
					http.StatusInternalServerError, "cannot get employees list search suggestions", err, srv.FieldsForLog(ctx, r, nil)...)
			}
			return info, nil
		}, srv.logger))

	register("ADMIN_EMPLOYEES_LIST_FAVORITE_TOGGLE", http.MethodPost, "/app/admin/employees/list/favorite/toggle",
		handler.HandleJson(func(ctx context.Context, r *http.Request, _ struct{}) (*employeeslist.FavoriteToggleResponse, error) {
			info, err := srv.employeesListHT.ToggleFavorite(ctx, r, struct{}{})
			if err != nil {
				return nil, apperr.WrapAndLog(srv.logger, ctx, "ADMIN_EMPLOYEES_LIST_FAVORITE_TOGGLE",
					http.StatusInternalServerError, "cannot toggle employees list favorite", err, srv.FieldsForLog(ctx, r, nil)...)
			}
			return info, nil
		}, srv.logger))

	register("ADMIN_EMPLOYEES_LIST_SAVED_FILTER_CREATE", http.MethodPost, "/app/admin/employees/list/saved-filters",
		handler.HandleJson(func(ctx context.Context, r *http.Request, req employeeslist.CreateSavedFilterInput) (*employeeslist.SavedFilterSet, error) {
			info, err := srv.employeesListHT.CreateSavedFilter(ctx, r, req)
			if err != nil {
				return nil, apperr.WrapAndLog(srv.logger, ctx, "ADMIN_EMPLOYEES_LIST_SAVED_FILTER_CREATE",
					http.StatusInternalServerError, "cannot create employees list saved filter", err, srv.FieldsForLog(ctx, r, req)...)
			}
			return info, nil
		}, srv.logger))

	register("ADMIN_EMPLOYEES_LIST_BULK_ACTION", http.MethodPost, "/app/admin/employees/list/bulk-actions/{actionId}",
		handler.HandleJson(func(ctx context.Context, r *http.Request, req employeeslist.BulkActionInput) (*employeeslist.MutationResult, error) {
			info, err := srv.employeesListHT.RunBulkAction(ctx, r, req)
			if err != nil {
				return nil, apperr.WrapAndLog(srv.logger, ctx, "ADMIN_EMPLOYEES_LIST_BULK_ACTION",
					http.StatusInternalServerError, "cannot run employees list bulk action", err, srv.FieldsForLog(ctx, r, req)...)
			}
			return info, nil
		}, srv.logger))

	register("ADMIN_EMPLOYEES_DETAIL_GET", http.MethodGet, "/app/admin/employees/{employeeId}",
		handler.HandleJson(func(ctx context.Context, r *http.Request, _ struct{}) (*employeeslist.EmployeeDetailResponse, error) {
			info, err := srv.employeesListHT.GetEmployee(ctx, r, struct{}{})
			if err != nil {
				return nil, apperr.WrapAndLog(srv.logger, ctx, "ADMIN_EMPLOYEES_DETAIL_GET",
					http.StatusInternalServerError, "cannot get employee detail", err, srv.FieldsForLog(ctx, r, nil)...)
			}
			return info, nil
		}, srv.logger))

	register("ADMIN_EMPLOYEES_UPDATE", http.MethodPut, "/app/admin/employees/{employeeId}",
		handler.HandleJson(func(ctx context.Context, r *http.Request, req employeeslist.UpdateEmployeeInput) (*employeeslist.EmployeeDetailResponse, error) {
			info, err := srv.employeesListHT.UpdateEmployee(ctx, r, req)
			if err != nil {
				return nil, apperr.WrapAndLog(srv.logger, ctx, "ADMIN_EMPLOYEES_UPDATE",
					http.StatusInternalServerError, "cannot update employee", err, srv.FieldsForLog(ctx, r, req)...)
			}
			return info, nil
		}, srv.logger))
}
