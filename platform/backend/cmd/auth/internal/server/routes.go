package server

import (
	"context"
	"net/http"

	"dtriton.com/platform/backend/internal/platform/httpx/apperr"
	"dtriton.com/platform/backend/internal/platform/httpx/handler"
	"dtriton.com/platform/backend/internal/platform/httpx/router"
	authsvc "dtriton.com/platform/backend/modules/shared/authentication"
)

func (srv *Server) buildRoutes() (*http.ServeMux, *router.Classifier) {
	b := router.NewBuilder()

	b.Handle("HEALTH_STATUS", "GET", "/status", router.TierHealth,
		http.HandlerFunc(func(w http.ResponseWriter, _ *http.Request) {
			w.Header().Set("Content-Type", "text/plain; charset=utf-8")
			w.Write([]byte("OK\n"))
		}))

	b.Handle("HEALTH_LIVE", "GET", "/healthz", router.TierHealth,
		http.HandlerFunc(func(w http.ResponseWriter, _ *http.Request) {
			w.Header().Set("Content-Type", "text/plain; charset=utf-8")
			w.Write([]byte("ok\n"))
		}))

	b.Handle("HEALTH_READY", "GET", "/readyz", router.TierHealth,
		http.HandlerFunc(func(w http.ResponseWriter, _ *http.Request) {
			w.Header().Set("Content-Type", "text/plain; charset=utf-8")
			w.Write([]byte("ready\n"))
		}))

	jwksHandler := http.HandlerFunc(func(w http.ResponseWriter, r *http.Request) {
		if srv.jwksEndpoint != nil {
			jwks, err := srv.jwksEndpoint.GetJWKS()
			if err != nil {
				http.Error(w, "failed to get JWKS", http.StatusInternalServerError)
				return
			}
			w.Header().Set("Content-Type", "application/json")
			_, err = w.Write(jwks)
			if err != nil {
				http.Error(w, "failed to write JWKS", http.StatusInternalServerError)
				return
			}
		} else {
			http.Error(w, "JWKS not available", http.StatusServiceUnavailable)
		}
	})

	b.Handle("JWKS_GET", "GET", "/.well-known/jwks.json", router.TierHealth, jwksHandler)
	b.Handle("JWKS2_GET", "GET", "/auth/jwks.json", router.TierHealth, jwksHandler)
	b.Handle("OTP_REQUEST", "POST", "/auth/otp/request", router.TierPublicTenant,
		handler.HandleJson(func(ctx context.Context, r *http.Request, req authsvc.OTPRequest) (any, error) {
			info, err := srv.authHTTP.RequestOTP(ctx, r, req)
			if err != nil {
				return nil, apperr.WrapAndLog(srv.logger, ctx, "OTP_REQUEST",
					http.StatusInternalServerError, "cannot request OTP", err, srv.FieldsForLog(ctx, r, req)...)
			}
			return info, nil
		}, srv.logger))
	b.Handle("OTP_VERIFY", "POST", "/auth/otp/verify", router.TierPublicTenant,
		srv.handleOTPVerifyCookie())
	b.Handle("ADMIN_OTP_REQUEST", "POST", "/auth/admin/otp/request", router.TierPublic,
		handler.HandleJson(func(ctx context.Context, r *http.Request, req authsvc.OTPRequest) (any, error) {
			info, err := srv.authHTTP.RequestAdminOTP(ctx, r, req)
			if err != nil {
				return nil, apperr.WrapAndLog(srv.logger, ctx, "ADMIN_OTP_REQUEST",
					http.StatusInternalServerError, "cannot request admin OTP", err, srv.FieldsForLog(ctx, r, req)...)
			}
			return info, nil
		}, srv.logger))
	b.Handle("ADMIN_OTP_VERIFY", "POST", "/auth/admin/otp/verify", router.TierPublic,
		srv.handleAdminOTPVerifyCookie())
	b.Handle("DELEGATED_TENANT_ROOT_LOGIN_GET", "GET", "/auth/delegated-root/{code}", router.TierPublicTenant,
		srv.handleDelegatedTenantRootLogin())
	b.Handle("REFRESH", "POST", "/auth/refresh", router.TierPublic,
		srv.handleRefreshCookie())
	b.Handle("LOGOUT", "POST", "/auth/logout", router.TierPublic,
		srv.handleLogoutCookie())

	return b.Mux(), b.Classifier()
}
