package server

import (
	"errors"
	"log/slog"
	"net/http"
	"strings"
	"time"

	authpkg "dtriton.com/platform/backend/internal/platform/auth"
	"dtriton.com/platform/backend/internal/platform/config"
	appmw "dtriton.com/platform/backend/internal/platform/httpx/middleware"
	"dtriton.com/platform/backend/internal/platform/httpx/mw"
	tenantsvc "dtriton.com/platform/backend/internal/platform/tenant"
	profilesvc "dtriton.com/platform/backend/modules/tenant/profile"
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

	if shouldValidateTokensLocally(c.Token.Validate) {
		tokenValidator, err := newTokenValidator(cfg)
		if err != nil {
			return nil, err
		}
		server.tokenValidator = tokenValidator
	}

	profileService := profilesvc.NewService()
	server.profileHTTP = profilesvc.NewHandler(profileService)

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

	if shouldValidateTokensLocally(srv.config.Token.Validate) && claimSource == appmw.ClaimSourceBearer && srv.tokenValidator != nil {
		handler = appmw.ValidatedClaims(srv.logger, srv.tokenValidator)(handler)
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

type authConfigEnvelope struct {
	Auth authConfig `json:"auth"`
}

type authConfig struct {
	Audience          string `json:"audience"`
	Issuer            string `json:"issuer"`
	JWTAlgorithm      string `json:"jwtalg"`
	JWTPrivateKeyPath string `json:"jwtprivatepempath"`
	JWTPublicKeyPath  string `json:"jwtpublicpempath"`
}

func newTokenValidator(cfg *config.Config) (authpkg.JWTIssuer, error) {
	var c authConfigEnvelope
	_ = cfg.Unmarshal("", &c)

	jwtCfg := authpkg.JWTConfig{
		Algorithm:      strings.ToLower(c.Auth.JWTAlgorithm),
		PrivateKeyPath: c.Auth.JWTPrivateKeyPath,
		PublicKeyPath:  c.Auth.JWTPublicKeyPath,
		Issuer:         c.Auth.Issuer,
		Audience:       c.Auth.Audience,
	}

	return authpkg.NewJWTIssuer(jwtCfg)
}

func shouldValidateTokensLocally(mode string) bool {
	return strings.EqualFold(strings.TrimSpace(mode), "internal")
}
