package server

import (
	"context"
	"net/http"

	"dtriton.com/platform/backend/internal/platform/httpx/apperr"
	"dtriton.com/platform/backend/internal/platform/httpx/handler"
	"dtriton.com/platform/backend/internal/platform/httpx/router"
)

func (srv *Server) registerAdminNavigationRoutes(b *router.Builder) {
	b.Handle("ADMIN_NAVIGATION_GET", http.MethodGet, "/app/me/navigation", router.TierSecure,
		handler.HandleJson(func(ctx context.Context, r *http.Request, _ struct{}) (any, error) {
			info, err := srv.adminNavigationHT.GetNavigation(ctx, r, struct{}{})
			if err != nil {
				return nil, apperr.WrapAndLog(srv.logger, ctx, "ADMIN_NAVIGATION_GET",
					http.StatusInternalServerError, "cannot get admin navigation", err, srv.FieldsForLog(ctx, r, nil)...)
			}
			return info, nil
		}, srv.logger))
}
