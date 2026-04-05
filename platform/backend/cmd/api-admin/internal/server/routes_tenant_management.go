package server

import (
	"context"
	"net/http"

	"dtriton.com/platform/backend/internal/platform/httpx/apperr"
	"dtriton.com/platform/backend/internal/platform/httpx/handler"
	"dtriton.com/platform/backend/internal/platform/httpx/router"
	tenantmanagement "dtriton.com/platform/backend/modules/admin/tenantmanagement"
)

func (srv *Server) registerTenantManagementRoutes(b *router.Builder) {
	b.Handle("ADMIN_TENANT_CREATE", http.MethodPost, "/app/admin/tenants", router.TierSecure,
		handler.HandleJson(func(ctx context.Context, r *http.Request, req tenantmanagement.OnboardTenantInput) (*tenantmanagement.OnboardTenantOutput, error) {
			info, err := srv.tenantManagementHT.OnboardTenant(ctx, r, req)
			if err != nil {
				return nil, apperr.WrapAndLog(srv.logger, ctx, "ADMIN_TENANT_CREATE",
					http.StatusInternalServerError, "cannot onboard tenant", err, srv.FieldsForLog(ctx, r, req)...)
			}
			return info, nil
		}, srv.logger))
}
