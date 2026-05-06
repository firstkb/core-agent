package server

import (
	"context"
	"net/http"

	"dtriton.com/platform/backend/internal/platform/httpx/apperr"
	"dtriton.com/platform/backend/internal/platform/httpx/handler"
	"dtriton.com/platform/backend/internal/platform/httpx/router"
	businesstree "dtriton.com/platform/backend/modules/tenant/businesstree"
)

func (srv *Server) registerBusinessTreeRoutes(b *router.Builder) {
	// TODO: Replace authenticated-only access with Navigation Builder module permissions.
	b.Handle(
		"BUSINESS_TREE_NODES",
		http.MethodGet,
		"/app/modules/business-tree/nodes",
		router.TierSecure,
		handler.HandleJson(func(ctx context.Context, r *http.Request, _ struct{}) (*businesstree.NodesResponse, error) {
			info, err := srv.businessTreeHTTP.ListNodes(ctx, r, struct{}{})
			if err != nil {
				return nil, apperr.WrapAndLog(
					srv.logger,
					ctx,
					"BUSINESS_TREE_NODES",
					http.StatusInternalServerError,
					"cannot load business tree nodes",
					err,
					srv.FieldsForLog(ctx, r, nil)...,
				)
			}
			return info, nil
		}, srv.logger),
	)
}
