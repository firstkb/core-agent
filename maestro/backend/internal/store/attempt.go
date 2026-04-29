package store

import (
	"context"
	"database/sql"
	"errors"
	"fmt"
)

func (s *Store) CreateAttempt(ctx context.Context, input AttemptInput, actor Actor, reason string) (Attempt, error) {
	if input.TaskID == "" {
		return Attempt{}, fmt.Errorf("%w: task_id is required", ErrInvalidInput)
	}
	if input.StageID == "" {
		return Attempt{}, fmt.Errorf("%w: stage_id is required", ErrInvalidInput)
	}

	const q = `
INSERT INTO attempts (task_id, stage_id, attempt_no, agent_role)
VALUES (
  $1,
  $2,
  COALESCE((SELECT max(attempt_no) + 1 FROM attempts WHERE stage_id = $2), 1),
  $3
)
RETURNING id, task_id, stage_id, attempt_no, agent_role, agent_run_id, status,
  summary, handoff_path, readme_path, files_changed_json, commands_run_json,
  evidence_json, created_at, submitted_at;`

	attempt, err := scanAttempt(s.db.QueryRowContext(ctx, q, input.TaskID, input.StageID, input.AgentRole))
	if err != nil {
		return Attempt{}, err
	}

	task, err := s.GetTask(ctx, attempt.TaskID)
	if err != nil {
		return Attempt{}, err
	}

	actor = defaultActor(actor)
	if err := AppendRunEvent(ctx, s.db, RunEvent{
		WorkID:        &task.WorkID,
		TaskID:        &attempt.TaskID,
		StageID:       &attempt.StageID,
		AttemptID:     &attempt.ID,
		ActorType:     actor.Type,
		ActorID:       actor.ID,
		Command:       "attempt.create",
		PreviousState: nil,
		NextState:     attempt,
		Reason:        reason,
	}); err != nil {
		return Attempt{}, err
	}

	return attempt, nil
}

func (s *Store) ListAttempts(ctx context.Context, taskID string) ([]Attempt, error) {
	const q = `
SELECT id, task_id, stage_id, attempt_no, agent_role, agent_run_id, status,
  summary, handoff_path, readme_path, files_changed_json, commands_run_json,
  evidence_json, created_at, submitted_at
FROM attempts
WHERE task_id = $1
ORDER BY created_at ASC;`

	rows, err := s.db.QueryContext(ctx, q, taskID)
	if err != nil {
		return nil, err
	}
	defer rows.Close()

	var out []Attempt
	for rows.Next() {
		attempt, err := scanAttempt(rows)
		if err != nil {
			return nil, err
		}
		out = append(out, attempt)
	}
	if err := rows.Err(); err != nil {
		return nil, err
	}
	return out, nil
}

func (s *Store) GetAttempt(ctx context.Context, id string) (Attempt, error) {
	const q = `
SELECT id, task_id, stage_id, attempt_no, agent_role, agent_run_id, status,
  summary, handoff_path, readme_path, files_changed_json, commands_run_json,
  evidence_json, created_at, submitted_at
FROM attempts
WHERE id = $1;`

	return scanAttempt(s.db.QueryRowContext(ctx, q, id))
}

func (s *Store) SubmitAttempt(ctx context.Context, id string, input AttemptSubmitInput, actor Actor, reason string) (Attempt, error) {
	previous, err := s.GetAttempt(ctx, id)
	if err != nil {
		return Attempt{}, err
	}

	filesChanged, err := jsonString(input.FilesChanged, "[]")
	if err != nil {
		return Attempt{}, err
	}
	commandsRun, err := jsonString(input.CommandsRun, "[]")
	if err != nil {
		return Attempt{}, err
	}
	evidence, err := jsonString(input.Evidence, "[]")
	if err != nil {
		return Attempt{}, err
	}

	const q = `
UPDATE attempts
SET status = 'submitted',
  summary = $2,
  handoff_path = $3,
  readme_path = $4,
  files_changed_json = $5::jsonb,
  commands_run_json = $6::jsonb,
  evidence_json = $7::jsonb,
  submitted_at = now()
WHERE id = $1
RETURNING id, task_id, stage_id, attempt_no, agent_role, agent_run_id, status,
  summary, handoff_path, readme_path, files_changed_json, commands_run_json,
  evidence_json, created_at, submitted_at;`

	updated, err := scanAttempt(s.db.QueryRowContext(ctx, q, id, input.Summary, input.HandoffPath, input.ReadmePath, filesChanged, commandsRun, evidence))
	if err != nil {
		return Attempt{}, err
	}

	task, err := s.GetTask(ctx, updated.TaskID)
	if err != nil {
		return Attempt{}, err
	}

	actor = defaultActor(actor)
	if err := AppendRunEvent(ctx, s.db, RunEvent{
		WorkID:        &task.WorkID,
		TaskID:        &updated.TaskID,
		StageID:       &updated.StageID,
		AttemptID:     &updated.ID,
		ActorType:     actor.Type,
		ActorID:       actor.ID,
		Command:       "attempt.submit",
		PreviousState: previous,
		NextState:     updated,
		Reason:        reason,
	}); err != nil {
		return Attempt{}, err
	}

	return updated, nil
}

type attemptScanner interface {
	Scan(dest ...any) error
}

func scanAttempt(scanner attemptScanner) (Attempt, error) {
	var attempt Attempt
	var agentRunID sql.NullString
	var submittedAt sql.NullTime
	var filesChanged []byte
	var commandsRun []byte
	var evidence []byte

	err := scanner.Scan(
		&attempt.ID,
		&attempt.TaskID,
		&attempt.StageID,
		&attempt.AttemptNo,
		&attempt.AgentRole,
		&agentRunID,
		&attempt.Status,
		&attempt.Summary,
		&attempt.HandoffPath,
		&attempt.ReadmePath,
		&filesChanged,
		&commandsRun,
		&evidence,
		&attempt.CreatedAt,
		&submittedAt,
	)
	if errors.Is(err, sql.ErrNoRows) {
		return Attempt{}, ErrNotFound
	}
	if err != nil {
		return Attempt{}, err
	}
	if agentRunID.Valid {
		attempt.AgentRunID = &agentRunID.String
	}
	if submittedAt.Valid {
		attempt.SubmittedAt = &submittedAt.Time
	}
	if attempt.FilesChanged, err = anyFromJSON(filesChanged, []any{}); err != nil {
		return Attempt{}, err
	}
	if attempt.CommandsRun, err = anyFromJSON(commandsRun, []any{}); err != nil {
		return Attempt{}, err
	}
	if attempt.Evidence, err = anyFromJSON(evidence, []any{}); err != nil {
		return Attempt{}, err
	}
	return attempt, nil
}
