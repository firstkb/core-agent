package server

import (
	"context"
	"net/http"

	"dtriton.com/platform/backend/internal/platform/httpx/apperr"
	"dtriton.com/platform/backend/internal/platform/httpx/handler"
	"dtriton.com/platform/backend/internal/platform/httpx/router"
	dictionary "dtriton.com/platform/backend/modules/tenant/dictionary"
)

func (srv *Server) registerDictionaryRoutes(b *router.Builder) {
	b.Handle(
		"TENANT_DICTIONARY_OPTIONS_GET",
		http.MethodGet,
		"/app/dictionaries/{dictionaryKey}/options",
		router.TierSecure,
		handler.HandleJson(func(ctx context.Context, r *http.Request, _ struct{}) (*dictionary.OptionsResponse, error) {
			info, err := srv.dictionaryHTTP.ListOptions(ctx, r, struct{}{})
			if err != nil {
				return nil, apperr.WrapAndLog(
					srv.logger,
					ctx,
					"TENANT_DICTIONARY_OPTIONS_GET",
					http.StatusInternalServerError,
					"cannot load dictionary options",
					err,
					srv.FieldsForLog(ctx, r, summarizeDictionaryOptionsRequest(r))...,
				)
			}
			return info, nil
		}, srv.logger),
	)

	b.Handle(
		"TENANT_DICTIONARY_OPTIONS_QUERY",
		http.MethodPost,
		"/app/dictionaries/options/query",
		router.TierSecure,
		handler.HandleJson(func(ctx context.Context, r *http.Request, req dictionary.OptionsRequest) (*dictionary.OptionsResponse, error) {
			info, err := srv.dictionaryHTTP.QueryOptions(ctx, r, req)
			if err != nil {
				return nil, apperr.WrapAndLog(
					srv.logger,
					ctx,
					"TENANT_DICTIONARY_OPTIONS_QUERY",
					http.StatusInternalServerError,
					"cannot query dictionary options",
					err,
					srv.FieldsForLog(ctx, r, summarizeDictionaryOptionsQuery(req))...,
				)
			}
			return info, nil
		}, srv.logger),
	)
}

func summarizeDictionaryOptionsRequest(r *http.Request) map[string]any {
	query := r.URL.Query()
	return map[string]any{
		"dictionary": r.PathValue("dictionaryKey"),
		"ids_count":  len(query["ids"]),
		"page":       query.Get("page"),
		"page_size":  query.Get("pageSize"),
		"search_len": len(query.Get("search")),
	}
}

func summarizeDictionaryOptionsQuery(req dictionary.OptionsRequest) map[string]any {
	return map[string]any{
		"dictionary":     req.Dictionary,
		"source_model":   req.SourceModel,
		"display_fields": len(req.DisplayFields),
		"filters":        len(req.Filters),
		"ids_count":      len(req.IDs),
		"page":           req.Page,
		"page_size":      req.PageSize,
		"search_len":     len(req.Search),
		"search_fields":  len(req.SearchFields),
		"stored_value":   req.StoredValueField,
	}
}
