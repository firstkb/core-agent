package httpapi

import (
	"encoding/json"
	"errors"
	"net/http"

	"firstkb.dev/maestro/backend/internal/store"
)

type commandEnvelope[T any] struct {
	Changes  T           `json:"changes"`
	Actor    store.Actor `json:"actor"`
	Reason   string      `json:"reason"`
	Command  string      `json:"command"`
	Decision string      `json:"decision"`
}

func (s *Server) registerAPIRoutes(mux *http.ServeMux) {
	mux.HandleFunc("GET /api/work", s.handleListWork)
	mux.HandleFunc("POST /api/work", s.handleCreateWork)
	mux.HandleFunc("GET /api/work/{id}", s.handleGetWork)
	mux.HandleFunc("POST /api/work/{id}/update", s.handleUpdateWork)

	mux.HandleFunc("GET /api/tasks", s.handleListTasks)
	mux.HandleFunc("POST /api/tasks", s.handleCreateTask)
	mux.HandleFunc("GET /api/tasks/{id}", s.handleGetTask)
	mux.HandleFunc("POST /api/tasks/{id}/update", s.handleUpdateTask)
	mux.HandleFunc("GET /api/tasks/{id}/stages", s.handleListStages)
	mux.HandleFunc("POST /api/tasks/{id}/stages", s.handleCreateStage)
	mux.HandleFunc("GET /api/tasks/{id}/attempts", s.handleListAttempts)
	mux.HandleFunc("POST /api/tasks/{id}/attempts", s.handleCreateAttempt)
	mux.HandleFunc("GET /api/tasks/{id}/evidence", s.handleListTaskEvidence)
	mux.HandleFunc("POST /api/tasks/{id}/evidence", s.handleAttachTaskEvidence)
	mux.HandleFunc("GET /api/tasks/{id}/approvals", s.handleListTaskApprovals)
	mux.HandleFunc("POST /api/tasks/{id}/approvals", s.handleRequestTaskApproval)

	mux.HandleFunc("GET /api/stages/{id}", s.handleGetStage)
	mux.HandleFunc("POST /api/stages/{id}/start", s.handleStartStage)
	mux.HandleFunc("POST /api/stages/{id}/pause", s.handlePauseStage)
	mux.HandleFunc("POST /api/stages/{id}/resume", s.handleResumeStage)
	mux.HandleFunc("POST /api/stages/{id}/cancel", s.handleCancelStage)
	mux.HandleFunc("POST /api/stages/{id}/review", s.handleReviewStage)

	mux.HandleFunc("GET /api/attempts/{id}", s.handleGetAttempt)
	mux.HandleFunc("POST /api/attempts/{id}/submit", s.handleSubmitAttempt)
	mux.HandleFunc("GET /api/attempts/{id}/evidence", s.handleListAttemptEvidence)
	mux.HandleFunc("POST /api/attempts/{id}/evidence", s.handleAttachAttemptEvidence)

	mux.HandleFunc("GET /api/approvals/{id}", s.handleGetApproval)
	mux.HandleFunc("POST /api/approvals/{id}/decide", s.handleDecideApproval)

	mux.HandleFunc("GET /api/agent-runs", s.handleListAgentRuns)
	mux.HandleFunc("POST /api/agent-runs", s.handleCreateAgentRun)
	mux.HandleFunc("GET /api/agent-runs/{id}", s.handleGetAgentRun)
	mux.HandleFunc("POST /api/agent-runs/{id}/start", s.handleStartAgentRun)
	mux.HandleFunc("POST /api/agent-runs/{id}/pause", s.handlePauseAgentRun)
	mux.HandleFunc("POST /api/agent-runs/{id}/resume", s.handleResumeAgentRun)
	mux.HandleFunc("POST /api/agent-runs/{id}/cancel", s.handleCancelAgentRun)
	mux.HandleFunc("POST /api/agent-runs/{id}/checkpoint", s.handleCheckpointAgentRun)
	mux.HandleFunc("POST /api/agent-runs/{id}/heartbeat", s.handleHeartbeatAgentRun)
}

func (s *Server) handleCreateWork(w http.ResponseWriter, r *http.Request) {
	var input store.WorkInput
	if !decodeJSON(w, r, &input) {
		return
	}
	work, err := s.store.CreateWork(r.Context(), input, actorFromRequest(r), "")
	writeResult(w, work, err)
}

func (s *Server) handleListWork(w http.ResponseWriter, r *http.Request) {
	q := r.URL.Query()
	work, err := s.store.ListWork(r.Context(), store.WorkFilters{
		Status:    q.Get("status"),
		Type:      q.Get("type"),
		RiskLevel: q.Get("riskLevel"),
		Owner:     q.Get("owner"),
	})
	writeResult(w, work, err)
}

func (s *Server) handleGetWork(w http.ResponseWriter, r *http.Request) {
	work, err := s.store.GetWork(r.Context(), r.PathValue("id"))
	writeResult(w, work, err)
}

func (s *Server) handleUpdateWork(w http.ResponseWriter, r *http.Request) {
	var input commandEnvelope[store.WorkPatch]
	if !decodeJSON(w, r, &input) {
		return
	}
	work, err := s.store.UpdateWork(r.Context(), r.PathValue("id"), input.Changes, input.Actor, input.Reason)
	writeResult(w, work, err)
}

func (s *Server) handleCreateTask(w http.ResponseWriter, r *http.Request) {
	var input store.TaskInput
	if !decodeJSON(w, r, &input) {
		return
	}
	task, err := s.store.CreateTask(r.Context(), input, actorFromRequest(r), "")
	writeResult(w, task, err)
}

func (s *Server) handleListTasks(w http.ResponseWriter, r *http.Request) {
	q := r.URL.Query()
	tasks, err := s.store.ListTasks(r.Context(), store.TaskFilters{
		WorkID:    q.Get("workId"),
		FeatureID: q.Get("featureId"),
		Status:    q.Get("status"),
		Lane:      q.Get("lane"),
		RiskLevel: q.Get("riskLevel"),
	})
	writeResult(w, tasks, err)
}

func (s *Server) handleGetTask(w http.ResponseWriter, r *http.Request) {
	task, err := s.store.GetTask(r.Context(), r.PathValue("id"))
	writeResult(w, task, err)
}

func (s *Server) handleUpdateTask(w http.ResponseWriter, r *http.Request) {
	var input commandEnvelope[store.TaskPatch]
	if !decodeJSON(w, r, &input) {
		return
	}
	task, err := s.store.UpdateTask(r.Context(), r.PathValue("id"), input.Changes, input.Actor, input.Reason)
	writeResult(w, task, err)
}

func (s *Server) handleCreateStage(w http.ResponseWriter, r *http.Request) {
	var input store.StageInput
	if !decodeJSON(w, r, &input) {
		return
	}
	input.TaskID = r.PathValue("id")
	stage, err := s.store.CreateStage(r.Context(), input, actorFromRequest(r), "")
	writeResult(w, stage, err)
}

func (s *Server) handleListStages(w http.ResponseWriter, r *http.Request) {
	stages, err := s.store.ListStages(r.Context(), r.PathValue("id"))
	writeResult(w, stages, err)
}

func (s *Server) handleGetStage(w http.ResponseWriter, r *http.Request) {
	stage, err := s.store.GetStage(r.Context(), r.PathValue("id"))
	writeResult(w, stage, err)
}

func (s *Server) handleStartStage(w http.ResponseWriter, r *http.Request) {
	input := decodeCommand(w, r)
	if input == nil {
		return
	}
	stage, err := s.store.StartStage(r.Context(), r.PathValue("id"), input.Actor, input.Reason)
	writeResult(w, stage, err)
}

func (s *Server) handlePauseStage(w http.ResponseWriter, r *http.Request) {
	input := decodeCommand(w, r)
	if input == nil {
		return
	}
	stage, err := s.store.PauseStage(r.Context(), r.PathValue("id"), input.Actor, input.Reason)
	writeResult(w, stage, err)
}

func (s *Server) handleResumeStage(w http.ResponseWriter, r *http.Request) {
	input := decodeCommand(w, r)
	if input == nil {
		return
	}
	stage, err := s.store.ResumeStage(r.Context(), r.PathValue("id"), input.Actor, input.Reason)
	writeResult(w, stage, err)
}

func (s *Server) handleCancelStage(w http.ResponseWriter, r *http.Request) {
	input := decodeCommand(w, r)
	if input == nil {
		return
	}
	stage, err := s.store.CancelStage(r.Context(), r.PathValue("id"), input.Actor, input.Reason)
	writeResult(w, stage, err)
}

func (s *Server) handleReviewStage(w http.ResponseWriter, r *http.Request) {
	input := decodeCommand(w, r)
	if input == nil {
		return
	}
	stage, err := s.store.ReviewStage(r.Context(), r.PathValue("id"), input.Decision, input.Actor, input.Reason)
	writeResult(w, stage, err)
}

func (s *Server) handleCreateAttempt(w http.ResponseWriter, r *http.Request) {
	var input store.AttemptInput
	if !decodeJSON(w, r, &input) {
		return
	}
	input.TaskID = r.PathValue("id")
	attempt, err := s.store.CreateAttempt(r.Context(), input, actorFromRequest(r), "")
	writeResult(w, attempt, err)
}

func (s *Server) handleListAttempts(w http.ResponseWriter, r *http.Request) {
	attempts, err := s.store.ListAttempts(r.Context(), r.PathValue("id"))
	writeResult(w, attempts, err)
}

func (s *Server) handleGetAttempt(w http.ResponseWriter, r *http.Request) {
	attempt, err := s.store.GetAttempt(r.Context(), r.PathValue("id"))
	writeResult(w, attempt, err)
}

func (s *Server) handleSubmitAttempt(w http.ResponseWriter, r *http.Request) {
	var input commandEnvelope[store.AttemptSubmitInput]
	if !decodeJSON(w, r, &input) {
		return
	}
	attempt, err := s.store.SubmitAttempt(r.Context(), r.PathValue("id"), input.Changes, input.Actor, input.Reason)
	writeResult(w, attempt, err)
}

func (s *Server) handleAttachTaskEvidence(w http.ResponseWriter, r *http.Request) {
	var input store.EvidenceInput
	if !decodeJSON(w, r, &input) {
		return
	}
	taskID := r.PathValue("id")
	input.TaskID = &taskID
	evidence, err := s.store.AttachEvidence(r.Context(), input, actorFromRequest(r), "")
	writeResult(w, evidence, err)
}

func (s *Server) handleListTaskEvidence(w http.ResponseWriter, r *http.Request) {
	evidence, err := s.store.ListTaskEvidence(r.Context(), r.PathValue("id"))
	writeResult(w, evidence, err)
}

func (s *Server) handleAttachAttemptEvidence(w http.ResponseWriter, r *http.Request) {
	var input store.EvidenceInput
	if !decodeJSON(w, r, &input) {
		return
	}
	attemptID := r.PathValue("id")
	input.AttemptID = &attemptID
	evidence, err := s.store.AttachEvidence(r.Context(), input, actorFromRequest(r), "")
	writeResult(w, evidence, err)
}

func (s *Server) handleListAttemptEvidence(w http.ResponseWriter, r *http.Request) {
	evidence, err := s.store.ListAttemptEvidence(r.Context(), r.PathValue("id"))
	writeResult(w, evidence, err)
}

func (s *Server) handleRequestTaskApproval(w http.ResponseWriter, r *http.Request) {
	var input store.ApprovalInput
	if !decodeJSON(w, r, &input) {
		return
	}
	taskID := r.PathValue("id")
	input.TaskID = &taskID
	approval, err := s.store.RequestApproval(r.Context(), input, actorFromRequest(r), input.Reason)
	writeResult(w, approval, err)
}

func (s *Server) handleListTaskApprovals(w http.ResponseWriter, r *http.Request) {
	approvals, err := s.store.ListTaskApprovals(r.Context(), r.PathValue("id"))
	writeResult(w, approvals, err)
}

func (s *Server) handleGetApproval(w http.ResponseWriter, r *http.Request) {
	approval, err := s.store.GetApproval(r.Context(), r.PathValue("id"))
	writeResult(w, approval, err)
}

func (s *Server) handleDecideApproval(w http.ResponseWriter, r *http.Request) {
	var input store.ApprovalDecision
	if !decodeJSON(w, r, &input) {
		return
	}
	approval, err := s.store.DecideApproval(r.Context(), r.PathValue("id"), input, actorFromRequest(r), input.Reason)
	writeResult(w, approval, err)
}

func (s *Server) handleCreateAgentRun(w http.ResponseWriter, r *http.Request) {
	var input store.AgentRunInput
	if !decodeJSON(w, r, &input) {
		return
	}
	run, err := s.store.CreateAgentRun(r.Context(), input, actorFromRequest(r), "")
	writeResult(w, run, err)
}

func (s *Server) handleListAgentRuns(w http.ResponseWriter, r *http.Request) {
	q := r.URL.Query()
	runs, err := s.store.ListAgentRuns(r.Context(), store.AgentRunFilters{
		WorkID:    q.Get("workId"),
		TaskID:    q.Get("taskId"),
		StageID:   q.Get("stageId"),
		Status:    q.Get("status"),
		AgentRole: q.Get("agentRole"),
	})
	writeResult(w, runs, err)
}

func (s *Server) handleGetAgentRun(w http.ResponseWriter, r *http.Request) {
	run, err := s.store.GetAgentRun(r.Context(), r.PathValue("id"))
	writeResult(w, run, err)
}

func (s *Server) handleStartAgentRun(w http.ResponseWriter, r *http.Request) {
	input := decodeCommand(w, r)
	if input == nil {
		return
	}
	run, err := s.store.StartAgentRun(r.Context(), r.PathValue("id"), input.Actor, input.Reason)
	writeResult(w, run, err)
}

func (s *Server) handlePauseAgentRun(w http.ResponseWriter, r *http.Request) {
	input := decodeCommand(w, r)
	if input == nil {
		return
	}
	run, err := s.store.PauseAgentRun(r.Context(), r.PathValue("id"), input.Actor, input.Reason)
	writeResult(w, run, err)
}

func (s *Server) handleResumeAgentRun(w http.ResponseWriter, r *http.Request) {
	input := decodeCommand(w, r)
	if input == nil {
		return
	}
	run, err := s.store.ResumeAgentRun(r.Context(), r.PathValue("id"), input.Actor, input.Reason)
	writeResult(w, run, err)
}

func (s *Server) handleCancelAgentRun(w http.ResponseWriter, r *http.Request) {
	input := decodeCommand(w, r)
	if input == nil {
		return
	}
	run, err := s.store.CancelAgentRun(r.Context(), r.PathValue("id"), input.Actor, input.Reason)
	writeResult(w, run, err)
}

func (s *Server) handleCheckpointAgentRun(w http.ResponseWriter, r *http.Request) {
	var input commandEnvelope[store.AgentRunCheckpointInput]
	if !decodeJSON(w, r, &input) {
		return
	}
	run, err := s.store.CheckpointAgentRun(r.Context(), r.PathValue("id"), input.Changes, input.Actor, input.Reason)
	writeResult(w, run, err)
}

func (s *Server) handleHeartbeatAgentRun(w http.ResponseWriter, r *http.Request) {
	var input commandEnvelope[store.AgentRunCheckpointInput]
	if r.Body != nil && r.ContentLength != 0 {
		if !decodeJSON(w, r, &input) {
			return
		}
	}
	run, err := s.store.HeartbeatAgentRun(r.Context(), r.PathValue("id"), input.Changes, input.Actor, input.Reason)
	writeResult(w, run, err)
}

func decodeCommand(w http.ResponseWriter, r *http.Request) *commandEnvelope[map[string]any] {
	var input commandEnvelope[map[string]any]
	if r.Body == nil || r.ContentLength == 0 {
		return &input
	}
	if !decodeJSON(w, r, &input) {
		return nil
	}
	return &input
}

func decodeJSON(w http.ResponseWriter, r *http.Request, target any) bool {
	defer r.Body.Close()
	decoder := json.NewDecoder(r.Body)
	decoder.DisallowUnknownFields()
	if err := decoder.Decode(target); err != nil {
		writeError(w, http.StatusBadRequest, "invalid_json", err.Error())
		return false
	}
	return true
}

func writeResult(w http.ResponseWriter, body any, err error) {
	if err != nil {
		writeStoreError(w, err)
		return
	}
	writeJSON(w, http.StatusOK, body)
}

func writeStoreError(w http.ResponseWriter, err error) {
	switch {
	case errors.Is(err, store.ErrNotFound):
		writeError(w, http.StatusNotFound, "not_found", err.Error())
	case errors.Is(err, store.ErrInvalidInput):
		writeError(w, http.StatusBadRequest, "invalid_input", err.Error())
	case errors.Is(err, store.ErrApprovalRequired):
		writeError(w, http.StatusConflict, "approval_required", err.Error())
	default:
		writeError(w, http.StatusInternalServerError, "internal_error", err.Error())
	}
}

func writeError(w http.ResponseWriter, status int, code string, message string) {
	writeJSON(w, status, map[string]any{
		"ok": false,
		"error": map[string]string{
			"code":    code,
			"message": message,
		},
	})
}

func actorFromRequest(_ *http.Request) store.Actor {
	return store.Actor{Type: "maestro", ID: "maestro"}
}
