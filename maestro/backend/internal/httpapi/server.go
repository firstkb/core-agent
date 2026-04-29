package httpapi

import (
	"context"
	"database/sql"
	"encoding/json"
	"errors"
	"log/slog"
	"net/http"
	"time"
)

type Server struct {
	addr         string
	db           *sql.DB
	artifactRoot string
	logger       *slog.Logger
	httpServer   *http.Server
}

type Options struct {
	Addr         string
	DB           *sql.DB
	ArtifactRoot string
	Logger       *slog.Logger
}

func New(options Options) *Server {
	logger := options.Logger
	if logger == nil {
		logger = slog.Default()
	}

	srv := &Server{
		addr:         options.Addr,
		db:           options.DB,
		artifactRoot: options.ArtifactRoot,
		logger:       logger,
	}
	srv.httpServer = &http.Server{
		Addr:              options.Addr,
		Handler:           srv.routes(),
		ReadHeaderTimeout: 5 * time.Second,
	}
	return srv
}

func (s *Server) ListenAndServe() error {
	s.logger.Info("Maestro API started", "addr", s.addr)
	return s.httpServer.ListenAndServe()
}

func (s *Server) Shutdown(ctx context.Context) error {
	return s.httpServer.Shutdown(ctx)
}

func (s *Server) routes() http.Handler {
	mux := http.NewServeMux()
	mux.HandleFunc("GET /status", s.handleStatus)
	mux.HandleFunc("GET /healthz", s.handleHealth)
	mux.HandleFunc("GET /readyz", s.handleReady)
	mux.HandleFunc("GET /api/health", s.handleAPIHealth)
	return mux
}

func (s *Server) handleStatus(w http.ResponseWriter, _ *http.Request) {
	w.Header().Set("Content-Type", "text/plain; charset=utf-8")
	_, _ = w.Write([]byte("OK\n"))
}

func (s *Server) handleHealth(w http.ResponseWriter, _ *http.Request) {
	w.Header().Set("Content-Type", "text/plain; charset=utf-8")
	_, _ = w.Write([]byte("ok\n"))
}

func (s *Server) handleReady(w http.ResponseWriter, r *http.Request) {
	if err := s.ping(r.Context()); err != nil {
		writeJSON(w, http.StatusServiceUnavailable, map[string]any{
			"ok":    false,
			"error": "database_unavailable",
		})
		return
	}

	writeJSON(w, http.StatusOK, map[string]any{"ok": true})
}

func (s *Server) handleAPIHealth(w http.ResponseWriter, r *http.Request) {
	dbOK := true
	if err := s.ping(r.Context()); err != nil {
		dbOK = false
	}

	writeJSON(w, http.StatusOK, map[string]any{
		"ok":            dbOK,
		"service":       "maestro-api",
		"artifact_root": s.artifactRoot,
	})
}

func (s *Server) ping(ctx context.Context) error {
	if s.db == nil {
		return errors.New("database is not configured")
	}
	pingCtx, cancel := context.WithTimeout(ctx, 2*time.Second)
	defer cancel()
	return s.db.PingContext(pingCtx)
}

func writeJSON(w http.ResponseWriter, status int, body any) {
	w.Header().Set("Content-Type", "application/json; charset=utf-8")
	w.WriteHeader(status)
	_ = json.NewEncoder(w).Encode(body)
}
