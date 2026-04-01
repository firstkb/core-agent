package server

import (
	"context"
	"net/http"

	"dtriton.com/platform/backend/internal/platform/httpx/apperr"
	"dtriton.com/platform/backend/internal/platform/httpx/handler"
	"dtriton.com/platform/backend/internal/platform/httpx/router"
	tenantmanagement "dtriton.com/platform/backend/modules/admin/tenantmanagement"
)

func (srv *Server) buildRoutes() (*http.ServeMux, *router.Classifier) {
	b := router.NewBuilder()

	b.Handle("HEALTH_STATUS", "GET", "/status", router.TierHealth,
		http.HandlerFunc(func(w http.ResponseWriter, _ *http.Request) {
			w.Header().Set("Content-Type", "text/plain; charset=utf-8")
			_, _ = w.Write([]byte("OK\n"))
		}))

	b.Handle("HEALTH_LIVE", "GET", "/healthz", router.TierHealth,
		http.HandlerFunc(func(w http.ResponseWriter, _ *http.Request) {
			w.Header().Set("Content-Type", "text/plain; charset=utf-8")
			_, _ = w.Write([]byte("ok\n"))
		}))

	b.Handle("HEALTH_READY", "GET", "/readyz", router.TierHealth,
		http.HandlerFunc(func(w http.ResponseWriter, _ *http.Request) {
			w.Header().Set("Content-Type", "text/plain; charset=utf-8")
			_, _ = w.Write([]byte("ready\n"))
		}))

	b.Handle("ADMIN_PROFILE_GET", "GET", "/profile", router.TierSecure,
		handler.HandleJson(func(ctx context.Context, r *http.Request, _ struct{}) (any, error) {
			info, err := srv.adminProfileHT.GetProfile(ctx, r, struct{}{})
			if err != nil {
				return nil, apperr.WrapAndLog(srv.logger, ctx, "ADMIN_PROFILE_GET",
					http.StatusInternalServerError, "cannot get admin profile", err, srv.FieldsForLog(ctx, r, nil)...)
			}
			return info, nil
		}, srv.logger))
	b.Handle("ADMIN_PROFILE_GET_APP", "GET", "/app/profile", router.TierSecure,
		handler.HandleJson(func(ctx context.Context, r *http.Request, _ struct{}) (any, error) {
			info, err := srv.adminProfileHT.GetProfile(ctx, r, struct{}{})
			if err != nil {
				return nil, apperr.WrapAndLog(srv.logger, ctx, "ADMIN_PROFILE_GET_APP",
					http.StatusInternalServerError, "cannot get admin profile", err, srv.FieldsForLog(ctx, r, nil)...)
			}
			return info, nil
		}, srv.logger))

	b.Handle("ADMIN_TENANT_CREATE", "POST", "/admin/tenants", router.TierSecure,
		handler.HandleJson(func(ctx context.Context, r *http.Request, req tenantmanagement.OnboardTenantInput) (*tenantmanagement.OnboardTenantOutput, error) {
			info, err := srv.tenantManagementHT.OnboardTenant(ctx, r, req)
			if err != nil {
				return nil, apperr.WrapAndLog(srv.logger, ctx, "ADMIN_TENANT_CREATE",
					http.StatusInternalServerError, "cannot onboard tenant", err, srv.FieldsForLog(ctx, r, req)...)
			}
			return info, nil
		}, srv.logger))
	b.Handle("ADMIN_TENANT_CREATE_APP", "POST", "/app/admin/tenants", router.TierSecure,
		handler.HandleJson(func(ctx context.Context, r *http.Request, req tenantmanagement.OnboardTenantInput) (*tenantmanagement.OnboardTenantOutput, error) {
			info, err := srv.tenantManagementHT.OnboardTenant(ctx, r, req)
			if err != nil {
				return nil, apperr.WrapAndLog(srv.logger, ctx, "ADMIN_TENANT_CREATE_APP",
					http.StatusInternalServerError, "cannot onboard tenant", err, srv.FieldsForLog(ctx, r, req)...)
			}
			return info, nil
		}, srv.logger))

	return b.Mux(), b.Classifier()
}
