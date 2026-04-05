package server

import (
	"context"
	"net/http"

	"dtriton.com/platform/backend/internal/platform/httpx/apperr"
	"dtriton.com/platform/backend/internal/platform/httpx/handler"
	"dtriton.com/platform/backend/internal/platform/httpx/router"
)

func (srv *Server) registerAdminProfileRoutes(b *router.Builder) {
	b.Handle("ADMIN_PROFILE_GET", http.MethodGet, "/app/profile", router.TierSecure,
		handler.HandleJson(func(ctx context.Context, r *http.Request, _ struct{}) (any, error) {
			info, err := srv.adminProfileHT.GetProfile(ctx, r, struct{}{})
			if err != nil {
				return nil, apperr.WrapAndLog(srv.logger, ctx, "ADMIN_PROFILE_GET",
					http.StatusInternalServerError, "cannot get admin profile", err, srv.FieldsForLog(ctx, r, nil)...)
			}
			return info, nil
		}, srv.logger))
}
