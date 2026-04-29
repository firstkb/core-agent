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

type fakeStore struct {
	createWork     func(context.Context, store.WorkInput, store.Actor, string) (store.Work, error)
	startStage     func(context.Context, string, store.Actor, string) (store.Stage, error)
	attachEvidence func(context.Context, store.EvidenceInput, store.Actor, string) (store.Evidence, error)
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

func (f *fakeStore) GetTask(context.Context, string) (store.Task, error) {
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

func (f *fakeStore) GetAttempt(context.Context, string) (store.Attempt, error) {
	return store.Attempt{}, errors.New("unexpected GetAttempt")
}

func (f *fakeStore) SubmitAttempt(context.Context, string, store.AttemptSubmitInput, store.Actor, string) (store.Attempt, error) {
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
