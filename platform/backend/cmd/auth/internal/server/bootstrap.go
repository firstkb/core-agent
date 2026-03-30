package server

import (
	"errors"
	"log/slog"
	"net/http"
	"strings"
	"time"

	"dtriton.com/platform/backend/internal/platform/config"
	appmw "dtriton.com/platform/backend/internal/platform/httpx/middleware"
	"dtriton.com/platform/backend/internal/platform/httpx/mw"
	tenantsvc "dtriton.com/platform/backend/internal/platform/tenant"
	authsvc "dtriton.com/platform/backend/modules/shared/authentication"
)

func Bootstrap(cfg *config.Config, logger *slog.Logger) (*Server, error) {
	if cfg == nil {
		return nil, errors.New("config must not be nil")
	}

	var c Config
	if err := cfg.Unmarshal("", &c); err != nil {
		return nil, err
	}

	server := &Server{
		logger: logger,
		config: &c,
	}

	if err := server.initialize(); err != nil {
		return nil, err
	}

	tenant, err := tenantsvc.NewService(server.sqlClient, cfg, logger)
	if err != nil {
		return nil, err
	}
	server.tenants = tenant

	// Initialize auth service
	authService, err := authsvc.NewService(
		server.sqlClient, cfg, server.logger, server.tenants,
	)
	if err != nil {
		return nil, err
	}

	server.jwksEndpoint = authService.NewJWKSEndpoint()

	server.authService = authService
	server.authHTTP = authsvc.NewHandler(authService)

	// Build routes

	mux, class := server.buildRoutes()
	server.classifier = class
	server.handler = server.buildHTTPHandler(mux)

	return server, nil
}

func (srv *Server) buildHTTPHandler(mux http.Handler) http.Handler {
	claimSource := appmw.NormalizeClaimSource(srv.config.Token.Source)

	handler := appmw.Recover(srv.logger)(mux)
	handler = appmw.RequestID()(handler)
	handler = appmw.Timeout(time.Duration(srv.config.Timeout) * time.Second)(handler)
	handler = appmw.AccessLog(srv.logger, srv.config.MW.AccessLog)(handler)
	handler = appmw.TenantGuard(srv.logger, srv.tenants)(handler)
	handler = appmw.Claims(srv.logger, claimSource)(handler)

	if strings.EqualFold(strings.TrimSpace(srv.config.Token.Validate), "internal") && claimSource == appmw.ClaimSourceBearer && srv.authService != nil {
		handler = appmw.ValidatedClaims(srv.logger, srv.authService)(handler)
	}

	if srv.config.Origin != "" {
		corsCfg := appmw.CORSConfig{
			AllowedOrigins:   []string{srv.config.Origin},
			AllowedMethods:   []string{http.MethodGet, http.MethodPost, http.MethodPut, http.MethodDelete, http.MethodOptions},
			AllowedHeaders:   []string{"Content-Type", "Authorization", "X-Requested-With"},
			AllowCredentials: true,
			Debug:            false,
		}
		handler = appmw.CORS(srv.logger, corsCfg)(handler)
	}

	return mw.Classifier(srv.classifier)(handler)
}

func (srv *Server) Handler() http.Handler {
	return srv.handler
}
