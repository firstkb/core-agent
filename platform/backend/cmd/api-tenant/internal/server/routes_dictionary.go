package server

import (
	"context"
	"net/http"

	"dtriton.com/platform/backend/internal/platform/httpx/apperr"
	"dtriton.com/platform/backend/internal/platform/httpx/handler"
	"dtriton.com/platform/backend/internal/platform/httpx/router"
	dictionarysvc "dtriton.com/platform/backend/modules/tenant/dictionarysvc"
)

func (srv *Server) registerDictionaryRoutes(b *router.Builder) {
	b.Handle(
		"TENANT_DICTIONARY_OPTIONS_GET",
		http.MethodGet,
		"/app/dictionaries/{dictionaryKey}/options",
		router.TierSecure,
		handler.HandleJson(func(ctx context.Context, r *http.Request, _ struct{}) (*dictionarysvc.OptionsResponse, error) {
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
