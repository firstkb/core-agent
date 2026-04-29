package httpapi

import (
	"bytes"
	"context"
	"encoding/json"
	"errors"
	"net/http"
	"net/http/httptest"
	"testing"
	"time"

	"firstkb.dev/maestro/backend/internal/store"
)

func TestCreateWorkEndpoint(t *testing.T) {
	fake := &fakeStore{
		createWork: func(_ context.Context, input store.WorkInput, _ store.Actor, _ string) (store.Work, error) {
			if input.Title != "Build task manager" {
				t.Fatalf("title = %q", input.Title)
			}
			return store.Work{
				ID:            "work-1",
				Title:         input.Title,
				Type:          "task",
				Status:        "draft",
				ArtifactShape: "lightweight",
				RiskLevel:     "low",
				Priority:      "normal",
				Owner:         "owner",
				CreatedAt:     time.Unix(1, 0),
				UpdatedAt:     time.Unix(1, 0),
			}, nil
		},
	}
	srv := New(Options{Store: fake})

	rec := httptest.NewRecorder()
	req := httptest.NewRequest(http.MethodPost, "/api/work", bytes.NewBufferString(`{"title":"Build task manager"}`))
	srv.routes().ServeHTTP(rec, req)

	if rec.Code != http.StatusOK {
		t.Fatalf("status = %d, body = %s", rec.Code, rec.Body.String())
	}

	var body store.Work
	if err := json.Unmarshal(rec.Body.Bytes(), &body); err != nil {
		t.Fatalf("decode response: %v", err)
	}
	if body.ID != "work-1" {
		t.Fatalf("id = %q", body.ID)
	}
}

func TestStartStageApprovalRequired(t *testing.T) {
	fake := &fakeStore{
		startStage: func(context.Context, string, store.Actor, string) (store.Stage, error) {
			return store.Stage{}, store.ErrApprovalRequired
		},
	}
	srv := New(Options{Store: fake})

	rec := httptest.NewRecorder()
	req := httptest.NewRequest(http.MethodPost, "/api/stages/stage-1/start", bytes.NewBufferString(`{"reason":"Start implementation"}`))
	srv.routes().ServeHTTP(rec, req)

	if rec.Code != http.StatusConflict {
		t.Fatalf("status = %d, body = %s", rec.Code, rec.Body.String())
	}
}

func TestAttachTaskEvidenceSetsTaskIDFromPath(t *testing.T) {
	fake := &fakeStore{
		getTask: func(context.Context, string) (store.Task, error) {
			return store.Task{ID: "task-1", WorkID: "work-1"}, nil
		},
		attachEvidence: func(_ context.Context, input store.EvidenceInput, _ store.Actor, _ string) (store.Evidence, error) {
			if input.TaskID == nil || *input.TaskID != "task-1" {
				t.Fatalf("task id = %#v", input.TaskID)
			}
			return store.Evidence{
				ID:     "evidence-1",
				TaskID: input.TaskID,
				Type:   input.Type,
				Title:  input.Title,
				URI:    input.URI,
			}, nil
		},
	}
	srv := New(Options{Store: fake})

	rec := httptest.NewRecorder()
	req := httptest.NewRequest(http.MethodPost, "/api/tasks/task-1/evidence", bytes.NewBufferString(`{"type":"test","title":"go test","uri":"artifact://test"}`))
	srv.routes().ServeHTTP(rec, req)

	if rec.Code != http.StatusOK {
		t.Fatalf("status = %d, body = %s", rec.Code, rec.Body.String())
	}
}

func TestAttachTaskEvidenceFileWritesArtifact(t *testing.T) {
	fake := &fakeStore{
		getTask: func(context.Context, string) (store.Task, error) {
			return store.Task{ID: "task-1", WorkID: "work-1"}, nil
		},
		attachEvidence: func(_ context.Context, input store.EvidenceInput, _ store.Actor, _ string) (store.Evidence, error) {
			if input.URI != "artifact://current/work/work-1/tasks/task-1/evidence/result.txt" {
				t.Fatalf("uri = %q", input.URI)
			}
			return store.Evidence{
				ID:     "evidence-1",
				TaskID: input.TaskID,
				Type:   input.Type,
				Title:  input.Title,
				URI:    input.URI,
			}, nil
		},
	}
	srv := New(Options{Store: fake, ArtifactRoot: t.TempDir()})

	rec := httptest.NewRecorder()
	req := httptest.NewRequest(http.MethodPost, "/api/tasks/task-1/evidence", bytes.NewBufferString(`{"type":"test","title":"result","file":{"name":"result.txt","content":"ok"}}`))
	srv.routes().ServeHTTP(rec, req)

	if rec.Code != http.StatusOK {
		t.Fatalf("status = %d, body = %s", rec.Code, rec.Body.String())
	}
}

func TestAttachEvidenceRejectsTraversal(t *testing.T) {
	fake := &fakeStore{
		getTask: func(context.Context, string) (store.Task, error) {
			return store.Task{ID: "task-1", WorkID: "work-1"}, nil
		},
	}
	srv := New(Options{Store: fake, ArtifactRoot: t.TempDir()})

	rec := httptest.NewRecorder()
	req := httptest.NewRequest(http.MethodPost, "/api/tasks/task-1/evidence", bytes.NewBufferString(`{"type":"test","title":"bad","file":{"name":"../secret.txt","content":"no"}}`))
	srv.routes().ServeHTTP(rec, req)

	if rec.Code != http.StatusBadRequest {
		t.Fatalf("status = %d, body = %s", rec.Code, rec.Body.String())
	}
}

func TestSubmitAttemptWritesHandoffAndReadme(t *testing.T) {
	fake := &fakeStore{
		getAttempt: func(context.Context, string) (store.Attempt, error) {
			return store.Attempt{ID: "attempt-1", TaskID: "task-1", StageID: "stage-1"}, nil
		},
		getTask: func(context.Context, string) (store.Task, error) {
			return store.Task{ID: "task-1", WorkID: "work-1"}, nil
		},
		submitAttempt: func(_ context.Context, id string, input store.AttemptSubmitInput, _ store.Actor, _ string) (store.Attempt, error) {
			if id != "attempt-1" {
				t.Fatalf("id = %q", id)
			}
			if input.HandoffPath != "artifact://current/work/work-1/tasks/task-1/stages/stage-1/attempts/attempt-1/handoff.json" {
				t.Fatalf("handoff path = %q", input.HandoffPath)
			}
			if input.ReadmePath != "artifact://current/work/work-1/tasks/task-1/stages/stage-1/attempts/attempt-1/README.md" {
				t.Fatalf("readme path = %q", input.ReadmePath)
			}
			return store.Attempt{ID: id, TaskID: "task-1", StageID: "stage-1", HandoffPath: input.HandoffPath, ReadmePath: input.ReadmePath}, nil
		},
	}
	srv := New(Options{Store: fake, ArtifactRoot: t.TempDir()})

	body := `{"changes":{"summary":"done","handoff_file":{"content":"{}"},"readme_file":{"content":"done"}}}`
	rec := httptest.NewRecorder()
	req := httptest.NewRequest(http.MethodPost, "/api/attempts/attempt-1/submit", bytes.NewBufferString(body))
	srv.routes().ServeHTTP(rec, req)

	if rec.Code != http.StatusOK {
		t.Fatalf("status = %d, body = %s", rec.Code, rec.Body.String())
	}
}

func TestCreateAgentRunEndpoint(t *testing.T) {
	fake := &fakeStore{
		createAgentRun: func(_ context.Context, input store.AgentRunInput, _ store.Actor, _ string) (store.AgentRun, error) {
			if input.AgentRole != "mason" {
				t.Fatalf("agent role = %q", input.AgentRole)
			}
			return store.AgentRun{
				ID:        "run-1",
				AgentRole: input.AgentRole,
				Status:    "queued",
			}, nil
		},
	}
	srv := New(Options{Store: fake})

	rec := httptest.NewRecorder()
	req := httptest.NewRequest(http.MethodPost, "/api/agent-runs", bytes.NewBufferString(`{"agent_role":"mason"}`))
	srv.routes().ServeHTTP(rec, req)

	if rec.Code != http.StatusOK {
		t.Fatalf("status = %d, body = %s", rec.Code, rec.Body.String())
	}
}

func TestCheckpointAgentRunEndpoint(t *testing.T) {
	fake := &fakeStore{
		checkpointAgentRun: func(_ context.Context, id string, input store.AgentRunCheckpointInput, _ store.Actor, reason string) (store.AgentRun, error) {
			if id != "run-1" {
				t.Fatalf("id = %q", id)
			}
			if input.Checkpoint != "before-tests" {
				t.Fatalf("checkpoint = %q", input.Checkpoint)
			}
			if reason != "Reached test gate" {
				t.Fatalf("reason = %q", reason)
			}
			return store.AgentRun{
				ID:                id,
				AgentRole:         "scout",
				Status:            "running",
				CurrentCheckpoint: input.Checkpoint,
			}, nil
		},
	}
	srv := New(Options{Store: fake})

	rec := httptest.NewRecorder()
	req := httptest.NewRequest(http.MethodPost, "/api/agent-runs/run-1/checkpoint", bytes.NewBufferString(`{"changes":{"checkpoint":"before-tests"},"reason":"Reached test gate"}`))
	srv.routes().ServeHTTP(rec, req)

	if rec.Code != http.StatusOK {
		t.Fatalf("status = %d, body = %s", rec.Code, rec.Body.String())
	}
}

func TestListRunEventsEndpoint(t *testing.T) {
	createdAt := time.Date(2026, 4, 29, 18, 0, 0, 0, time.UTC)
	fake := &fakeStore{
		listRunEvents: func(_ context.Context, filters store.RunEventFilters) ([]store.RunEventEntry, error) {
			if filters.TaskID != "task-1" {
				t.Fatalf("task id = %q", filters.TaskID)
			}
			if filters.Limit != 25 {
				t.Fatalf("limit = %d", filters.Limit)
			}
			return []store.RunEventEntry{
				{
					ID:            "event-1",
					TaskID:        &filters.TaskID,
					ActorType:     "cockpit",
					ActorID:       "maestro-cockpit",
					Command:       "agent_run.start",
					PreviousState: map[string]any{"status": "queued"},
					NextState:     map[string]any{"status": "running"},
					Reason:        "Started from test",
					CreatedAt:     createdAt,
				},
			}, nil
		},
	}
	srv := New(Options{Store: fake})

	rec := httptest.NewRecorder()
	req := httptest.NewRequest(http.MethodGet, "/api/run-events?taskId=task-1&limit=25", nil)
	srv.routes().ServeHTTP(rec, req)

	if rec.Code != http.StatusOK {
		t.Fatalf("status = %d, body = %s", rec.Code, rec.Body.String())
	}

	var events []store.RunEventEntry
	if err := json.Unmarshal(rec.Body.Bytes(), &events); err != nil {
		t.Fatalf("decode response: %v", err)
	}
	if len(events) != 1 || events[0].Command != "agent_run.start" {
		t.Fatalf("events = %+v", events)
	}
}

type fakeStore struct {
	createWork         func(context.Context, store.WorkInput, store.Actor, string) (store.Work, error)
	getTask            func(context.Context, string) (store.Task, error)
	getAttempt         func(context.Context, string) (store.Attempt, error)
	submitAttempt      func(context.Context, string, store.AttemptSubmitInput, store.Actor, string) (store.Attempt, error)
	startStage         func(context.Context, string, store.Actor, string) (store.Stage, error)
	attachEvidence     func(context.Context, store.EvidenceInput, store.Actor, string) (store.Evidence, error)
	createAgentRun     func(context.Context, store.AgentRunInput, store.Actor, string) (store.AgentRun, error)
	checkpointAgentRun func(context.Context, string, store.AgentRunCheckpointInput, store.Actor, string) (store.AgentRun, error)
	listRunEvents      func(context.Context, store.RunEventFilters) ([]store.RunEventEntry, error)
}

func (f *fakeStore) CreateWork(ctx context.Context, input store.WorkInput, actor store.Actor, reason string) (store.Work, error) {
	if f.createWork != nil {
		return f.createWork(ctx, input, actor, reason)
	}
	return store.Work{}, errors.New("unexpected CreateWork")
}

func (f *fakeStore) ListWork(context.Context, store.WorkFilters) ([]store.Work, error) {
	return nil, errors.New("unexpected ListWork")
}

func (f *fakeStore) GetWork(context.Context, string) (store.Work, error) {
	return store.Work{}, errors.New("unexpected GetWork")
}

func (f *fakeStore) UpdateWork(context.Context, string, store.WorkPatch, store.Actor, string) (store.Work, error) {
	return store.Work{}, errors.New("unexpected UpdateWork")
}

func (f *fakeStore) CreateTask(context.Context, store.TaskInput, store.Actor, string) (store.Task, error) {
	return store.Task{}, errors.New("unexpected CreateTask")
}

func (f *fakeStore) ListTasks(context.Context, store.TaskFilters) ([]store.Task, error) {
	return nil, errors.New("unexpected ListTasks")
}

func (f *fakeStore) GetTask(ctx context.Context, id string) (store.Task, error) {
	if f.getTask != nil {
		return f.getTask(ctx, id)
	}
	return store.Task{}, errors.New("unexpected GetTask")
}

func (f *fakeStore) UpdateTask(context.Context, string, store.TaskPatch, store.Actor, string) (store.Task, error) {
	return store.Task{}, errors.New("unexpected UpdateTask")
}

func (f *fakeStore) CreateStage(context.Context, store.StageInput, store.Actor, string) (store.Stage, error) {
	return store.Stage{}, errors.New("unexpected CreateStage")
}

func (f *fakeStore) ListStages(context.Context, string) ([]store.Stage, error) {
	return nil, errors.New("unexpected ListStages")
}

func (f *fakeStore) GetStage(context.Context, string) (store.Stage, error) {
	return store.Stage{}, errors.New("unexpected GetStage")
}

func (f *fakeStore) StartStage(ctx context.Context, id string, actor store.Actor, reason string) (store.Stage, error) {
	if f.startStage != nil {
		return f.startStage(ctx, id, actor, reason)
	}
	return store.Stage{}, errors.New("unexpected StartStage")
}

func (f *fakeStore) PauseStage(context.Context, string, store.Actor, string) (store.Stage, error) {
	return store.Stage{}, errors.New("unexpected PauseStage")
}

func (f *fakeStore) ResumeStage(context.Context, string, store.Actor, string) (store.Stage, error) {
	return store.Stage{}, errors.New("unexpected ResumeStage")
}

func (f *fakeStore) CancelStage(context.Context, string, store.Actor, string) (store.Stage, error) {
	return store.Stage{}, errors.New("unexpected CancelStage")
}

func (f *fakeStore) ReviewStage(context.Context, string, string, store.Actor, string) (store.Stage, error) {
	return store.Stage{}, errors.New("unexpected ReviewStage")
}

func (f *fakeStore) CreateAttempt(context.Context, store.AttemptInput, store.Actor, string) (store.Attempt, error) {
	return store.Attempt{}, errors.New("unexpected CreateAttempt")
}

func (f *fakeStore) ListAttempts(context.Context, string) ([]store.Attempt, error) {
	return nil, errors.New("unexpected ListAttempts")
}

func (f *fakeStore) GetAttempt(ctx context.Context, id string) (store.Attempt, error) {
	if f.getAttempt != nil {
		return f.getAttempt(ctx, id)
	}
	return store.Attempt{}, errors.New("unexpected GetAttempt")
}

func (f *fakeStore) SubmitAttempt(ctx context.Context, id string, input store.AttemptSubmitInput, actor store.Actor, reason string) (store.Attempt, error) {
	if f.submitAttempt != nil {
		return f.submitAttempt(ctx, id, input, actor, reason)
	}
	return store.Attempt{}, errors.New("unexpected SubmitAttempt")
}

func (f *fakeStore) AttachEvidence(ctx context.Context, input store.EvidenceInput, actor store.Actor, reason string) (store.Evidence, error) {
	if f.attachEvidence != nil {
		return f.attachEvidence(ctx, input, actor, reason)
	}
	return store.Evidence{}, errors.New("unexpected AttachEvidence")
}

func (f *fakeStore) ListTaskEvidence(context.Context, string) ([]store.Evidence, error) {
	return nil, errors.New("unexpected ListTaskEvidence")
}

func (f *fakeStore) ListWorkEvidence(context.Context, string) ([]store.Evidence, error) {
	return nil, errors.New("unexpected ListWorkEvidence")
}

func (f *fakeStore) ListAttemptEvidence(context.Context, string) ([]store.Evidence, error) {
	return nil, errors.New("unexpected ListAttemptEvidence")
}

func (f *fakeStore) RequestApproval(context.Context, store.ApprovalInput, store.Actor, string) (store.Approval, error) {
	return store.Approval{}, errors.New("unexpected RequestApproval")
}

func (f *fakeStore) ListTaskApprovals(context.Context, string) ([]store.Approval, error) {
	return nil, errors.New("unexpected ListTaskApprovals")
}

func (f *fakeStore) GetApproval(context.Context, string) (store.Approval, error) {
	return store.Approval{}, errors.New("unexpected GetApproval")
}

func (f *fakeStore) DecideApproval(context.Context, string, store.ApprovalDecision, store.Actor, string) (store.Approval, error) {
	return store.Approval{}, errors.New("unexpected DecideApproval")
}

func (f *fakeStore) CreateAgentRun(ctx context.Context, input store.AgentRunInput, actor store.Actor, reason string) (store.AgentRun, error) {
	if f.createAgentRun != nil {
		return f.createAgentRun(ctx, input, actor, reason)
	}
	return store.AgentRun{}, errors.New("unexpected CreateAgentRun")
}

func (f *fakeStore) ListAgentRuns(context.Context, store.AgentRunFilters) ([]store.AgentRun, error) {
	return nil, errors.New("unexpected ListAgentRuns")
}

func (f *fakeStore) GetAgentRun(context.Context, string) (store.AgentRun, error) {
	return store.AgentRun{}, errors.New("unexpected GetAgentRun")
}

func (f *fakeStore) StartAgentRun(context.Context, string, store.Actor, string) (store.AgentRun, error) {
	return store.AgentRun{}, errors.New("unexpected StartAgentRun")
}

func (f *fakeStore) PauseAgentRun(context.Context, string, store.Actor, string) (store.AgentRun, error) {
	return store.AgentRun{}, errors.New("unexpected PauseAgentRun")
}

func (f *fakeStore) ResumeAgentRun(context.Context, string, store.Actor, string) (store.AgentRun, error) {
	return store.AgentRun{}, errors.New("unexpected ResumeAgentRun")
}

func (f *fakeStore) CancelAgentRun(context.Context, string, store.Actor, string) (store.AgentRun, error) {
	return store.AgentRun{}, errors.New("unexpected CancelAgentRun")
}

func (f *fakeStore) CheckpointAgentRun(ctx context.Context, id string, input store.AgentRunCheckpointInput, actor store.Actor, reason string) (store.AgentRun, error) {
	if f.checkpointAgentRun != nil {
		return f.checkpointAgentRun(ctx, id, input, actor, reason)
	}
	return store.AgentRun{}, errors.New("unexpected CheckpointAgentRun")
}

func (f *fakeStore) HeartbeatAgentRun(context.Context, string, store.AgentRunCheckpointInput, store.Actor, string) (store.AgentRun, error) {
	return store.AgentRun{}, errors.New("unexpected HeartbeatAgentRun")
}

func (f *fakeStore) ListRunEvents(ctx context.Context, filters store.RunEventFilters) ([]store.RunEventEntry, error) {
	if f.listRunEvents != nil {
		return f.listRunEvents(ctx, filters)
	}
	return nil, errors.New("unexpected ListRunEvents")
}
