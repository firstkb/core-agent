package server

import (
	"context"
	"errors"
	"fmt"
	"log/slog"
	"net/http"
	"time"

	authpkg "dtriton.com/platform/backend/internal/platform/auth"
	"dtriton.com/platform/backend/internal/platform/config"
	"dtriton.com/platform/backend/internal/platform/httpx/router"
	"dtriton.com/platform/backend/internal/platform/postgres"

	tenantsvc "dtriton.com/platform/backend/internal/platform/tenant"
	authsvc "dtriton.com/platform/backend/modules/shared/authentication"
)

type Config struct {
	HostApp string         `json:"hostapp"`
	Origin  string         `json:"origin"`
	Timeout int            `json:"timeout"` // seconds
	Token   TokenConfig    `json:"token"`
	Cookie  CookieConfig   `json:"cookie"`
	DB      DatabaseConfig `json:"db"`
	MW      MWConfig       `json:"mw"`
}

type CookieConfig struct {
	Name       string `json:"name"`
	Path       string `json:"path"`
	Domain     string `json:"domain"`
	SameSite   string `json:"samesite"`
	SecureMode string `json:"securemode"`
}

type MWConfig struct {
	AccessLog bool `json:"accesslog"`
}

type TokenConfig struct {
	Source   string `json:"source"`
	Validate string `json:"validate"`
}

type DatabaseConfig struct {
	Host       string     `json:"host"`
	Port       string     `json:"port"`
	Username   string     `json:"username"`
	Password   string     `json:"password"`
	MasterName string     `json:"mastername"`
	SSLMode    string     `json:"sslmode"`
	Debug      bool       `json:"debug"`
	PoolConfig PoolConfig `json:"pool"`
}

type PoolConfig struct {
	MaxIdle     int    `json:"maxidle"`
	MaxOpen     int    `json:"maxopen"`
	MaxLife     string `json:"maxlifetime"`
	MaxIdleTime string `json:"maxidletime"`
}

type Server struct {
	config     *Config
	logger     *slog.Logger
	httpServer *http.Server
	handler    http.Handler
	sqlClient  *postgres.Client
	classifier *router.Classifier
	tenants    *tenantsvc.ServiceTenantProvider

	authService  *authsvc.AuthService
	authHTTP     *authsvc.Handler
	jwksEndpoint *authpkg.JWKSEndpoint
}

func NewServer(cfg *config.Config, logger *slog.Logger) (*Server, error) {
	server, err := Bootstrap(cfg, logger)
	if err != nil {
		return nil, err
	}

	server.httpServer = &http.Server{
		Addr:    server.config.HostApp,
		Handler: server.handler,
	}

	return server, nil
}

func (srv *Server) Run(ctx context.Context) {
	srv.logger.Info(fmt.Sprintf("API server started, listening on %s", srv.httpServer.Addr))

	if err := srv.httpServer.ListenAndServe(); err != nil && err != http.ErrServerClosed {
		srv.logger.Error(fmt.Sprintf("Error listening and serving: %s", err))
	}

	ctx.Done()
}

func (srv *Server) Stop(ctx context.Context) {
	if srv.httpServer == nil {
		return
	}

	if err := srv.httpServer.Shutdown(ctx); err != nil {
		srv.logger.Error(fmt.Sprintf("Error shutting down API server: %s", err))
	}

}

func (srv *Server) initialize() error {
	if srv.config.DB.Host == "" || srv.config.DB.Port == "" || srv.config.DB.MasterName == "" || srv.config.DB.Username == "" || srv.config.DB.Password == "" {
		return errors.New("database connection vars must be specified")
	}

	conn := fmt.Sprintf("host=%s port=%s dbname=%s user=%s password=%s sslmode=disable", srv.config.DB.Host, srv.config.DB.Port, srv.config.DB.MasterName, srv.config.DB.Username, srv.config.DB.Password)

	// Resolve DB pool settings with sane defaults.
	const (
		defaultPoolMaxIdle     = 10
		defaultPoolMaxOpen     = 50
		defaultPoolMaxLife     = time.Minute * 30
		defaultPoolMaxIdleTime = time.Duration(0) // 0 = without idle time limit
	)

	poolMaxIdle := srv.config.DB.PoolConfig.MaxIdle
	if poolMaxIdle <= 0 {
		poolMaxIdle = defaultPoolMaxIdle
	}
	poolMaxOpen := srv.config.DB.PoolConfig.MaxOpen
	if poolMaxOpen <= 0 {
		poolMaxOpen = defaultPoolMaxOpen
	}

	poolLife := defaultPoolMaxLife
	if srv.config.DB.PoolConfig.MaxLife != "" {
		if d, err := time.ParseDuration(srv.config.DB.PoolConfig.MaxLife); err == nil {
			poolLife = d
		} else {
			srv.logger.Warn("invalid DB pool max lifetime, using default",
				"value", srv.config.DB.PoolConfig.MaxLife, "error", err)
		}
	}

	poolIdleTime := defaultPoolMaxIdleTime
	if srv.config.DB.PoolConfig.MaxIdleTime != "" {
		if d, err := time.ParseDuration(srv.config.DB.PoolConfig.MaxIdleTime); err == nil {
			poolIdleTime = d
		} else {
			srv.logger.Warn("invalid DB pool max idle time, using default",
				"value", srv.config.DB.PoolConfig.MaxIdleTime, "error", err)
		}
	}

	opts := []postgres.Option{
		postgres.WithPoolConfig(poolMaxIdle, poolMaxOpen, poolLife, poolIdleTime),
		postgres.WithDebug(srv.config.DB.Debug),
	}
	client, err := postgres.NewClient(conn, srv.logger, opts...)
	if err != nil {
		return fmt.Errorf("failed to create a PostgreSQL client: %v", err)
	}

	srv.sqlClient = client

	return nil
}
