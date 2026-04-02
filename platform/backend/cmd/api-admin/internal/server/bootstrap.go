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

	if shouldValidateTokensLocally(c.Token.Validate) {
		tokenValidator, err := newTokenValidator(cfg)
		if err != nil {
			return nil, err
		}
		server.tokenValidator = tokenValidator
	}

	tenantManagementHT, err := buildTenantManagementModule(server.sqlClient, cfg, logger)
	if err != nil {
		return nil, err
	}
	server.tenantManagementHT = tenantManagementHT
	server.adminProfileHT = buildAdminProfileModule(server.sqlClient)
	server.logStartupState(cfg)

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
	handler = appmw.RequireScope(srv.logger, authpkg.AccessScopeAdminAPI)(handler)

	if shouldValidateTokensLocally(srv.config.Token.Validate) && claimSource == appmw.ClaimSourceBearer && srv.tokenValidator != nil {
		handler = appmw.ValidatedClaims(srv.logger, srv.tokenValidator)(handler)
	}

	handler = appmw.Claims(srv.logger, claimSource)(handler)

	if srv.config.Origin != "" {
		corsCfg := appmw.CORSConfig{
			AllowedOrigins:   splitAllowedOrigins(srv.config.Origin),
			AllowedMethods:   []string{http.MethodGet, http.MethodPost, http.MethodPut, http.MethodDelete, http.MethodOptions},
			AllowedHeaders:   []string{"Content-Type", "Authorization", "X-Requested-With", authpkg.HeaderAuthTenantID, authpkg.HeaderAuthUserID, authpkg.HeaderAuthEmail, authpkg.HeaderAuthPhone, authpkg.HeaderAuthLevel, authpkg.HeaderAuthRole, authpkg.HeaderAuthScope},
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
	Audience                string `json:"audience"`
	Issuer                  string `json:"issuer"`
	JWTAlgorithm            string `json:"jwtalg"`
	JWTKeySource            string `json:"keysource"`
	JWTPrivateKeyPath       string `json:"jwtprivatepempath"`
	JWTPublicKeyPath        string `json:"jwtpublicpempath"`
	JWTPrivateKeySecretName string `json:"jwtprivatepemsecretname"`
	JWTPublicKeySecretName  string `json:"jwtpublicpemsecretname"`
	JWTAWSRegion            string `json:"jwtawsregion"`
	JWTKMSKeyID             string `json:"jwtkmskeyid"`
}

func newTokenValidator(cfg *config.Config) (authpkg.JWTIssuer, error) {
	var c authConfigEnvelope
	_ = cfg.Unmarshal("", &c)

	jwtCfg := authpkg.JWTConfig{
		Algorithm:            strings.ToLower(c.Auth.JWTAlgorithm),
		KeySource:            c.Auth.JWTKeySource,
		PrivateKeyPath:       c.Auth.JWTPrivateKeyPath,
		PublicKeyPath:        c.Auth.JWTPublicKeyPath,
		PrivateKeySecretName: c.Auth.JWTPrivateKeySecretName,
		PublicKeySecretName:  c.Auth.JWTPublicKeySecretName,
		AWSRegion:            c.Auth.JWTAWSRegion,
		KMSKeyID:             c.Auth.JWTKMSKeyID,
		Issuer:               c.Auth.Issuer,
		Audience:             c.Auth.Audience,
	}

	return authpkg.NewJWTIssuer(jwtCfg)
}

func shouldValidateTokensLocally(mode string) bool {
	return strings.EqualFold(strings.TrimSpace(mode), "internal")
}

func splitAllowedOrigins(value string) []string {
	parts := strings.Split(value, ",")
	origins := make([]string, 0, len(parts))
	for _, part := range parts {
		part = strings.TrimSpace(part)
		if part == "" {
			continue
		}
		origins = append(origins, part)
	}
	return origins
}

func (srv *Server) logStartupState(cfg *config.Config) {
	if srv == nil || srv.logger == nil || srv.sqlClient == nil || srv.config == nil || cfg == nil {
		return
	}

	var authCfg authConfigEnvelope
	_ = cfg.Unmarshal("", &authCfg)
	instances := srv.sqlClient.LoadedInstanceSummaries()

	jwtAlg := "n/a"
	jwtKeySource := "n/a"
	if shouldValidateTokensLocally(srv.config.Token.Validate) {
		jwtAlg = strings.ToLower(strings.TrimSpace(authCfg.Auth.JWTAlgorithm))
		jwtKeySource = strings.TrimSpace(authCfg.Auth.JWTKeySource)
	}

	srv.logger.Info("admin api startup configuration",
		"token_validate", strings.TrimSpace(srv.config.Token.Validate),
		"jwt_alg", jwtAlg,
		"jwt_key_source", jwtKeySource,
		"db_instance_count", len(instances),
		"db_instances", instances,
	)
}
