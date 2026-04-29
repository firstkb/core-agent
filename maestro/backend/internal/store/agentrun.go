package store

import (
	"context"
	"database/sql"
	"errors"
	"fmt"
)

func (s *Store) CreateAgentRun(ctx context.Context, input AgentRunInput, actor Actor, reason string) (AgentRun, error) {
	if input.AgentRole == "" {
		return AgentRun{}, fmt.Errorf("%w: agent_role is required", ErrInvalidInput)
	}
	input.Status = defaultString(input.Status, "queued")

	metadata, err := jsonString(input.Metadata, "{}")
	if err != nil {
		return AgentRun{}, err
	}

	const q = `
INSERT INTO agent_runs (
  work_id,
  task_id,
  stage_id,
  attempt_id,
  agent_role,
  status,
  current_checkpoint,
  metadata_json
) VALUES ($1, $2, $3, $4, $5, $6, $7, $8::jsonb)
RETURNING id, work_id, task_id, stage_id, attempt_id, agent_role, status,
  current_checkpoint, last_heartbeat_at, pause_requested_at,
  cancel_requested_at, started_at, completed_at, metadata_json;`

	run, err := scanAgentRun(s.db.QueryRowContext(
		ctx,
		q,
		deref(input.WorkID),
		deref(input.TaskID),
		deref(input.StageID),
		deref(input.AttemptID),
		input.AgentRole,
		input.Status,
		input.CurrentCheckpoint,
		metadata,
	))
	if err != nil {
		return AgentRun{}, err
	}

	actor = defaultActor(actor)
	if err := AppendRunEvent(ctx, s.db, RunEvent{
		WorkID:        run.WorkID,
		TaskID:        run.TaskID,
		StageID:       run.StageID,
		AttemptID:     run.AttemptID,
		ActorType:     actor.Type,
		ActorID:       actor.ID,
		Command:       "agent_run.create",
		PreviousState: nil,
		NextState:     run,
		Reason:        reason,
	}); err != nil {
		return AgentRun{}, err
	}

	return run, nil
}

func (s *Store) ListAgentRuns(ctx context.Context, filters AgentRunFilters) ([]AgentRun, error) {
	const q = `
SELECT id, work_id, task_id, stage_id, attempt_id, agent_role, status,
  current_checkpoint, last_heartbeat_at, pause_requested_at,
  cancel_requested_at, started_at, completed_at, metadata_json
FROM agent_runs
WHERE ($1 = '' OR work_id::text = $1)
  AND ($2 = '' OR task_id::text = $2)
  AND ($3 = '' OR stage_id::text = $3)
  AND ($4 = '' OR status = $4)
  AND ($5 = '' OR agent_role = $5)
ORDER BY COALESCE(started_at, last_heartbeat_at, completed_at) DESC NULLS LAST, id DESC;`

	rows, err := s.db.QueryContext(ctx, q, filters.WorkID, filters.TaskID, filters.StageID, filters.Status, filters.AgentRole)
	if err != nil {
		return nil, err
	}
	defer rows.Close()

	var out []AgentRun
	for rows.Next() {
		run, err := scanAgentRun(rows)
		if err != nil {
			return nil, err
		}
		out = append(out, run)
	}
	if err := rows.Err(); err != nil {
		return nil, err
	}
	return out, nil
}

func (s *Store) GetAgentRun(ctx context.Context, id string) (AgentRun, error) {
	const q = `
SELECT id, work_id, task_id, stage_id, attempt_id, agent_role, status,
  current_checkpoint, last_heartbeat_at, pause_requested_at,
  cancel_requested_at, started_at, completed_at, metadata_json
FROM agent_runs
WHERE id = $1;`

	return scanAgentRun(s.db.QueryRowContext(ctx, q, id))
}

func (s *Store) StartAgentRun(ctx context.Context, id string, actor Actor, reason string) (AgentRun, error) {
	return s.setAgentRunStatus(ctx, id, "agent_run.start", "running", "started_at", actor, reason)
}

func (s *Store) PauseAgentRun(ctx context.Context, id string, actor Actor, reason string) (AgentRun, error) {
	return s.setAgentRunStatus(ctx, id, "agent_run.pause", "pause_requested", "pause_requested_at", actor, reason)
}

func (s *Store) ResumeAgentRun(ctx context.Context, id string, actor Actor, reason string) (AgentRun, error) {
	return s.setAgentRunStatus(ctx, id, "agent_run.resume", "running", "", actor, reason)
}

func (s *Store) CancelAgentRun(ctx context.Context, id string, actor Actor, reason string) (AgentRun, error) {
	return s.setAgentRunStatus(ctx, id, "agent_run.cancel", "cancel_requested", "cancel_requested_at", actor, reason)
}

func (s *Store) CheckpointAgentRun(ctx context.Context, id string, input AgentRunCheckpointInput, actor Actor, reason string) (AgentRun, error) {
	if input.Checkpoint == "" {
		return AgentRun{}, fmt.Errorf("%w: checkpoint is required", ErrInvalidInput)
	}
	metadata, err := jsonString(input.Metadata, "{}")
	if err != nil {
		return AgentRun{}, err
	}

	previous, err := s.GetAgentRun(ctx, id)
	if err != nil {
		return AgentRun{}, err
	}

	const q = `
UPDATE agent_runs
SET current_checkpoint = $2,
  metadata_json = CASE WHEN $3::jsonb = '{}'::jsonb THEN metadata_json ELSE $3::jsonb END,
  last_heartbeat_at = now()
WHERE id = $1
RETURNING id, work_id, task_id, stage_id, attempt_id, agent_role, status,
  current_checkpoint, last_heartbeat_at, pause_requested_at,
  cancel_requested_at, started_at, completed_at, metadata_json;`

	updated, err := scanAgentRun(s.db.QueryRowContext(ctx, q, id, input.Checkpoint, metadata))
	if err != nil {
		return AgentRun{}, err
	}

	actor = defaultActor(actor)
	if err := AppendRunEvent(ctx, s.db, RunEvent{
		WorkID:        updated.WorkID,
		TaskID:        updated.TaskID,
		StageID:       updated.StageID,
		AttemptID:     updated.AttemptID,
		ActorType:     actor.Type,
		ActorID:       actor.ID,
		Command:       "agent_run.checkpoint",
		PreviousState: previous,
		NextState:     updated,
		Reason:        reason,
	}); err != nil {
		return AgentRun{}, err
	}

	return updated, nil
}

func (s *Store) HeartbeatAgentRun(ctx context.Context, id string, input AgentRunCheckpointInput, actor Actor, reason string) (AgentRun, error) {
	previous, err := s.GetAgentRun(ctx, id)
	if err != nil {
		return AgentRun{}, err
	}
	checkpoint := input.Checkpoint
	if checkpoint == "" {
		checkpoint = previous.CurrentCheckpoint
	}
	metadata, err := jsonString(input.Metadata, "{}")
	if err != nil {
		return AgentRun{}, err
	}

	const q = `
UPDATE agent_runs
SET current_checkpoint = $2,
  metadata_json = CASE WHEN $3::jsonb = '{}'::jsonb THEN metadata_json ELSE $3::jsonb END,
  last_heartbeat_at = now()
WHERE id = $1
RETURNING id, work_id, task_id, stage_id, attempt_id, agent_role, status,
  current_checkpoint, last_heartbeat_at, pause_requested_at,
  cancel_requested_at, started_at, completed_at, metadata_json;`

	updated, err := scanAgentRun(s.db.QueryRowContext(ctx, q, id, checkpoint, metadata))
	if err != nil {
		return AgentRun{}, err
	}

	actor = defaultActor(actor)
	if err := AppendRunEvent(ctx, s.db, RunEvent{
		WorkID:        updated.WorkID,
		TaskID:        updated.TaskID,
		StageID:       updated.StageID,
		AttemptID:     updated.AttemptID,
		ActorType:     actor.Type,
		ActorID:       actor.ID,
		Command:       "agent_run.heartbeat",
		PreviousState: previous,
		NextState:     updated,
		Reason:        reason,
	}); err != nil {
		return AgentRun{}, err
	}

	return updated, nil
}

func (s *Store) setAgentRunStatus(ctx context.Context, id string, command string, status string, timestampColumn string, actor Actor, reason string) (AgentRun, error) {
	previous, err := s.GetAgentRun(ctx, id)
	if err != nil {
		return AgentRun{}, err
	}

	q := `
UPDATE agent_runs
SET status = $2`
	switch timestampColumn {
	case "started_at":
		q += `, started_at = COALESCE(started_at, now()), last_heartbeat_at = now()`
	case "pause_requested_at":
		q += `, pause_requested_at = now()`
	case "cancel_requested_at":
		q += `, cancel_requested_at = now()`
	}
	if status == "completed" || status == "cancelled" || status == "failed" {
		q += `, completed_at = now()`
	}
	q += `
WHERE id = $1
RETURNING id, work_id, task_id, stage_id, attempt_id, agent_role, status,
  current_checkpoint, last_heartbeat_at, pause_requested_at,
  cancel_requested_at, started_at, completed_at, metadata_json;`

	updated, err := scanAgentRun(s.db.QueryRowContext(ctx, q, id, status))
	if err != nil {
		return AgentRun{}, err
	}

	actor = defaultActor(actor)
	if err := AppendRunEvent(ctx, s.db, RunEvent{
		WorkID:        updated.WorkID,
		TaskID:        updated.TaskID,
		StageID:       updated.StageID,
		AttemptID:     updated.AttemptID,
		ActorType:     actor.Type,
		ActorID:       actor.ID,
		Command:       command,
		PreviousState: previous,
		NextState:     updated,
		Reason:        reason,
	}); err != nil {
		return AgentRun{}, err
	}

	return updated, nil
}

type agentRunScanner interface {
	Scan(dest ...any) error
}

func scanAgentRun(scanner agentRunScanner) (AgentRun, error) {
	var run AgentRun
	var workID sql.NullString
	var taskID sql.NullString
	var stageID sql.NullString
	var attemptID sql.NullString
	var lastHeartbeatAt sql.NullTime
	var pauseRequestedAt sql.NullTime
	var cancelRequestedAt sql.NullTime
	var startedAt sql.NullTime
	var completedAt sql.NullTime
	var metadata []byte

	err := scanner.Scan(
		&run.ID,
		&workID,
		&taskID,
		&stageID,
		&attemptID,
		&run.AgentRole,
		&run.Status,
		&run.CurrentCheckpoint,
		&lastHeartbeatAt,
		&pauseRequestedAt,
		&cancelRequestedAt,
		&startedAt,
		&completedAt,
		&metadata,
	)
	if errors.Is(err, sql.ErrNoRows) {
		return AgentRun{}, ErrNotFound
	}
	if err != nil {
		return AgentRun{}, err
	}
	if workID.Valid {
		run.WorkID = &workID.String
	}
	if taskID.Valid {
		run.TaskID = &taskID.String
	}
	if stageID.Valid {
		run.StageID = &stageID.String
	}
	if attemptID.Valid {
		run.AttemptID = &attemptID.String
	}
	if lastHeartbeatAt.Valid {
		run.LastHeartbeatAt = &lastHeartbeatAt.Time
	}
	if pauseRequestedAt.Valid {
		run.PauseRequestedAt = &pauseRequestedAt.Time
	}
	if cancelRequestedAt.Valid {
		run.CancelRequestedAt = &cancelRequestedAt.Time
	}
	if startedAt.Valid {
		run.StartedAt = &startedAt.Time
	}
	if completedAt.Valid {
		run.CompletedAt = &completedAt.Time
	}

	var errJSON error
	run.Metadata, errJSON = anyFromJSON(metadata, map[string]any{})
	if errJSON != nil {
		return AgentRun{}, errJSON
	}

	return run, nil
}
