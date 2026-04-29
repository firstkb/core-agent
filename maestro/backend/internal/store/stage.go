package store

import (
	"context"
	"database/sql"
	"errors"
	"fmt"
)

func (s *Store) CreateStage(ctx context.Context, input StageInput, actor Actor, reason string) (Stage, error) {
	if input.TaskID == "" {
		return Stage{}, fmt.Errorf("%w: task_id is required", ErrInvalidInput)
	}
	if input.Name == "" {
		return Stage{}, fmt.Errorf("%w: name is required", ErrInvalidInput)
	}
	input.Status = defaultString(input.Status, "pending")

	const q = `
INSERT INTO stages (task_id, name, status, sequence, agent_role, checkpoint_policy)
VALUES ($1, $2, $3, $4, $5, $6)
RETURNING id, task_id, name, status, sequence, agent_role, checkpoint_policy,
  started_at, completed_at, created_at, updated_at;`

	stage, err := scanStage(s.db.QueryRowContext(ctx, q, input.TaskID, input.Name, input.Status, input.Sequence, input.AgentRole, input.CheckpointPolicy))
	if err != nil {
		return Stage{}, err
	}

	task, err := s.GetTask(ctx, stage.TaskID)
	if err != nil {
		return Stage{}, err
	}

	actor = defaultActor(actor)
	if err := AppendRunEvent(ctx, s.db, RunEvent{
		WorkID:        &task.WorkID,
		TaskID:        &stage.TaskID,
		StageID:       &stage.ID,
		ActorType:     actor.Type,
		ActorID:       actor.ID,
		Command:       "stage.create",
		PreviousState: nil,
		NextState:     stage,
		Reason:        reason,
	}); err != nil {
		return Stage{}, err
	}

	return stage, nil
}

func (s *Store) ListStages(ctx context.Context, taskID string) ([]Stage, error) {
	const q = `
SELECT id, task_id, name, status, sequence, agent_role, checkpoint_policy,
  started_at, completed_at, created_at, updated_at
FROM stages
WHERE task_id = $1
ORDER BY sequence ASC, created_at ASC;`

	rows, err := s.db.QueryContext(ctx, q, taskID)
	if err != nil {
		return nil, err
	}
	defer rows.Close()

	var out []Stage
	for rows.Next() {
		stage, err := scanStage(rows)
		if err != nil {
			return nil, err
		}
		out = append(out, stage)
	}
	if err := rows.Err(); err != nil {
		return nil, err
	}
	return out, nil
}

func (s *Store) GetStage(ctx context.Context, id string) (Stage, error) {
	const q = `
SELECT id, task_id, name, status, sequence, agent_role, checkpoint_policy,
  started_at, completed_at, created_at, updated_at
FROM stages
WHERE id = $1;`

	return scanStage(s.db.QueryRowContext(ctx, q, id))
}

func (s *Store) StartStage(ctx context.Context, id string, actor Actor, reason string) (Stage, error) {
	if err := s.ensureStageStartAllowed(ctx, id); err != nil {
		return Stage{}, err
	}
	return s.setStageStatus(ctx, id, "stage.start", "in_progress", true, false, actor, reason)
}

func (s *Store) PauseStage(ctx context.Context, id string, actor Actor, reason string) (Stage, error) {
	return s.setStageStatus(ctx, id, "stage.pause", "paused", false, false, actor, reason)
}

func (s *Store) ResumeStage(ctx context.Context, id string, actor Actor, reason string) (Stage, error) {
	return s.setStageStatus(ctx, id, "stage.resume", "in_progress", false, false, actor, reason)
}

func (s *Store) CancelStage(ctx context.Context, id string, actor Actor, reason string) (Stage, error) {
	return s.setStageStatus(ctx, id, "stage.cancel", "cancelled", false, true, actor, reason)
}

func (s *Store) ReviewStage(ctx context.Context, id string, decision string, actor Actor, reason string) (Stage, error) {
	status := map[string]string{
		"accept": "accepted",
		"revise": "revise_requested",
		"block":  "failed",
		"cancel": "cancelled",
	}[decision]
	if status == "" {
		return Stage{}, fmt.Errorf("%w: invalid review decision", ErrInvalidInput)
	}
	return s.setStageStatus(ctx, id, "stage.review."+decision, status, false, status == "accepted" || status == "cancelled", actor, reason)
}

func (s *Store) setStageStatus(ctx context.Context, id string, command string, status string, setStarted bool, setCompleted bool, actor Actor, reason string) (Stage, error) {
	previous, err := s.GetStage(ctx, id)
	if err != nil {
		return Stage{}, err
	}

	const q = `
UPDATE stages
SET status = $2,
  started_at = CASE WHEN $3 THEN COALESCE(started_at, now()) ELSE started_at END,
  completed_at = CASE WHEN $4 THEN now() ELSE completed_at END
WHERE id = $1
RETURNING id, task_id, name, status, sequence, agent_role, checkpoint_policy,
  started_at, completed_at, created_at, updated_at;`

	updated, err := scanStage(s.db.QueryRowContext(ctx, q, id, status, setStarted, setCompleted))
	if err != nil {
		return Stage{}, err
	}

	task, err := s.GetTask(ctx, updated.TaskID)
	if err != nil {
		return Stage{}, err
	}

	actor = defaultActor(actor)
	if err := AppendRunEvent(ctx, s.db, RunEvent{
		WorkID:        &task.WorkID,
		TaskID:        &updated.TaskID,
		StageID:       &updated.ID,
		ActorType:     actor.Type,
		ActorID:       actor.ID,
		Command:       command,
		PreviousState: previous,
		NextState:     updated,
		Reason:        reason,
	}); err != nil {
		return Stage{}, err
	}

	return updated, nil
}

func (s *Store) ensureStageStartAllowed(ctx context.Context, stageID string) error {
	const q = `
SELECT s.name, t.id, t.risk_level, w.id, w.type, w.risk_level
FROM stages s
JOIN tasks t ON t.id = s.task_id
JOIN work w ON w.id = t.work_id
WHERE s.id = $1;`

	var stageName, taskID, taskRisk, workID, workType, workRisk string
	if err := s.db.QueryRowContext(ctx, q, stageID).Scan(&stageName, &taskID, &taskRisk, &workID, &workType, &workRisk); err != nil {
		if errors.Is(err, sql.ErrNoRows) {
			return ErrNotFound
		}
		return err
	}

	if stageName != "implementation" && stageName != "release" {
		return nil
	}
	if taskRisk != "high" && workRisk != "high" && workType != "high_risk" {
		return nil
	}

	const approvalQ = `
SELECT EXISTS (
  SELECT 1
  FROM approvals
  WHERE status = 'approved'
    AND approval_type IN ('execution', 'high_risk_implementation', 'security', 'migration', 'release')
    AND (task_id = $1 OR work_id = $2)
);`
	var approved bool
	if err := s.db.QueryRowContext(ctx, approvalQ, taskID, workID).Scan(&approved); err != nil {
		return err
	}
	if !approved {
		return fmt.Errorf("%w: approved high-risk execution gate is required", ErrApprovalRequired)
	}
	return nil
}

type stageScanner interface {
	Scan(dest ...any) error
}

func scanStage(scanner stageScanner) (Stage, error) {
	var stage Stage
	var startedAt sql.NullTime
	var completedAt sql.NullTime

	err := scanner.Scan(
		&stage.ID,
		&stage.TaskID,
		&stage.Name,
		&stage.Status,
		&stage.Sequence,
		&stage.AgentRole,
		&stage.CheckpointPolicy,
		&startedAt,
		&completedAt,
		&stage.CreatedAt,
		&stage.UpdatedAt,
	)
	if errors.Is(err, sql.ErrNoRows) {
		return Stage{}, ErrNotFound
	}
	if err != nil {
		return Stage{}, err
	}
	if startedAt.Valid {
		stage.StartedAt = &startedAt.Time
	}
	if completedAt.Valid {
		stage.CompletedAt = &completedAt.Time
	}
	return stage, nil
}
