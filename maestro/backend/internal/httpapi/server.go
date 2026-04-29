package httpapi

import (
	"context"
	"database/sql"
	"encoding/json"
	"errors"
	"log/slog"
	"net/http"
	"time"

	"firstkb.dev/maestro/backend/internal/store"
)

type Server struct {
	addr         string
	db           *sql.DB
	store        DataStore
	artifactRoot string
	logger       *slog.Logger
	httpServer   *http.Server
}

type DataStore interface {
	CreateWork(context.Context, store.WorkInput, store.Actor, string) (store.Work, error)
	ListWork(context.Context, store.WorkFilters) ([]store.Work, error)
	GetWork(context.Context, string) (store.Work, error)
	UpdateWork(context.Context, string, store.WorkPatch, store.Actor, string) (store.Work, error)
	CreateTask(context.Context, store.TaskInput, store.Actor, string) (store.Task, error)
	ListTasks(context.Context, store.TaskFilters) ([]store.Task, error)
	GetTask(context.Context, string) (store.Task, error)
	UpdateTask(context.Context, string, store.TaskPatch, store.Actor, string) (store.Task, error)
	CreateStage(context.Context, store.StageInput, store.Actor, string) (store.Stage, error)
	ListStages(context.Context, string) ([]store.Stage, error)
	GetStage(context.Context, string) (store.Stage, error)
	StartStage(context.Context, string, store.Actor, string) (store.Stage, error)
	PauseStage(context.Context, string, store.Actor, string) (store.Stage, error)
	ResumeStage(context.Context, string, store.Actor, string) (store.Stage, error)
	CancelStage(context.Context, string, store.Actor, string) (store.Stage, error)
	ReviewStage(context.Context, string, string, store.Actor, string) (store.Stage, error)
	CreateAttempt(context.Context, store.AttemptInput, store.Actor, string) (store.Attempt, error)
	ListAttempts(context.Context, string) ([]store.Attempt, error)
	GetAttempt(context.Context, string) (store.Attempt, error)
	SubmitAttempt(context.Context, string, store.AttemptSubmitInput, store.Actor, string) (store.Attempt, error)
	AttachEvidence(context.Context, store.EvidenceInput, store.Actor, string) (store.Evidence, error)
	ListTaskEvidence(context.Context, string) ([]store.Evidence, error)
	ListAttemptEvidence(context.Context, string) ([]store.Evidence, error)
	RequestApproval(context.Context, store.ApprovalInput, store.Actor, string) (store.Approval, error)
	ListTaskApprovals(context.Context, string) ([]store.Approval, error)
	GetApproval(context.Context, string) (store.Approval, error)
	DecideApproval(context.Context, string, store.ApprovalDecision, store.Actor, string) (store.Approval, error)
	CreateAgentRun(context.Context, store.AgentRunInput, store.Actor, string) (store.AgentRun, error)
	ListAgentRuns(context.Context, store.AgentRunFilters) ([]store.AgentRun, error)
	GetAgentRun(context.Context, string) (store.AgentRun, error)
	StartAgentRun(context.Context, string, store.Actor, string) (store.AgentRun, error)
	PauseAgentRun(context.Context, string, store.Actor, string) (store.AgentRun, error)
	ResumeAgentRun(context.Context, string, store.Actor, string) (store.AgentRun, error)
	CancelAgentRun(context.Context, string, store.Actor, string) (store.AgentRun, error)
	CheckpointAgentRun(context.Context, string, store.AgentRunCheckpointInput, store.Actor, string) (store.AgentRun, error)
	HeartbeatAgentRun(context.Context, string, store.AgentRunCheckpointInput, store.Actor, string) (store.AgentRun, error)
}

type Options struct {
	Addr         string
	DB           *sql.DB
	Store        DataStore
	ArtifactRoot string
	Logger       *slog.Logger
}

func New(options Options) *Server {
	logger := options.Logger
	if logger == nil {
		logger = slog.Default()
	}
	dataStore := options.Store
	if dataStore == nil && options.DB != nil {
		dataStore = store.New(options.DB)
	}

	srv := &Server{
		addr:         options.Addr,
		db:           options.DB,
		store:        dataStore,
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
	s.registerAPIRoutes(mux)
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
