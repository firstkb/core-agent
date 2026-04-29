package store

import (
	"context"
	"database/sql"
	"errors"
	"fmt"
)

func (s *Store) CreateTask(ctx context.Context, input TaskInput, actor Actor, reason string) (Task, error) {
	if input.WorkID == "" {
		return Task{}, fmt.Errorf("%w: work_id is required", ErrInvalidInput)
	}
	if input.Title == "" {
		return Task{}, fmt.Errorf("%w: title is required", ErrInvalidInput)
	}

	input.Status = defaultString(input.Status, "draft")
	input.RiskLevel = defaultString(input.RiskLevel, "low")
	input.Priority = defaultString(input.Priority, "normal")
	input.AssigneeType = defaultString(input.AssigneeType, "agent")

	const q = `
INSERT INTO tasks (
  work_id,
  feature_id,
  title,
  description,
  status,
  lane,
  stack_scope,
  risk_level,
  priority,
  assignee_type,
  agent_role,
  branch,
  pr_url,
  ci_status,
  visual_status,
  artifact_path
) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, $13, $14, $15, $16)
RETURNING id, work_id, feature_id, title, description, status, lane, stack_scope,
  risk_level, priority, assignee_type, agent_role, branch, pr_url, ci_status,
  visual_status, artifact_path, created_at, updated_at;`

	task, err := scanTask(s.db.QueryRowContext(
		ctx,
		q,
		input.WorkID,
		deref(input.FeatureID),
		input.Title,
		input.Description,
		input.Status,
		input.Lane,
		input.StackScope,
		input.RiskLevel,
		input.Priority,
		input.AssigneeType,
		input.AgentRole,
		input.Branch,
		input.PRURL,
		input.CIStatus,
		input.VisualStatus,
		input.ArtifactPath,
	))
	if err != nil {
		return Task{}, err
	}

	actor = defaultActor(actor)
	if err := AppendRunEvent(ctx, s.db, RunEvent{
		WorkID:        &task.WorkID,
		TaskID:        &task.ID,
		ActorType:     actor.Type,
		ActorID:       actor.ID,
		Command:       "task.create",
		PreviousState: nil,
		NextState:     task,
		Reason:        reason,
	}); err != nil {
		return Task{}, err
	}

	return task, nil
}

func (s *Store) ListTasks(ctx context.Context, filters TaskFilters) ([]Task, error) {
	const q = `
SELECT id, work_id, feature_id, title, description, status, lane, stack_scope,
  risk_level, priority, assignee_type, agent_role, branch, pr_url, ci_status,
  visual_status, artifact_path, created_at, updated_at
FROM tasks
WHERE ($1 = '' OR work_id::text = $1)
  AND ($2 = '' OR feature_id::text = $2)
  AND ($3 = '' OR status = $3)
  AND ($4 = '' OR lane = $4)
  AND ($5 = '' OR risk_level = $5)
ORDER BY updated_at DESC, created_at DESC;`

	rows, err := s.db.QueryContext(ctx, q, filters.WorkID, filters.FeatureID, filters.Status, filters.Lane, filters.RiskLevel)
	if err != nil {
		return nil, err
	}
	defer rows.Close()

	var out []Task
	for rows.Next() {
		task, err := scanTask(rows)
		if err != nil {
			return nil, err
		}
		out = append(out, task)
	}
	if err := rows.Err(); err != nil {
		return nil, err
	}
	return out, nil
}

func (s *Store) GetTask(ctx context.Context, id string) (Task, error) {
	const q = `
SELECT id, work_id, feature_id, title, description, status, lane, stack_scope,
  risk_level, priority, assignee_type, agent_role, branch, pr_url, ci_status,
  visual_status, artifact_path, created_at, updated_at
FROM tasks
WHERE id = $1;`

	return scanTask(s.db.QueryRowContext(ctx, q, id))
}

func (s *Store) UpdateTask(ctx context.Context, id string, patch TaskPatch, actor Actor, reason string) (Task, error) {
	previous, err := s.GetTask(ctx, id)
	if err != nil {
		return Task{}, err
	}

	next := previous
	next.Title = valueOr(next.Title, patch.Title)
	next.Description = valueOr(next.Description, patch.Description)
	next.Status = valueOr(next.Status, patch.Status)
	next.Lane = valueOr(next.Lane, patch.Lane)
	next.StackScope = valueOr(next.StackScope, patch.StackScope)
	next.RiskLevel = valueOr(next.RiskLevel, patch.RiskLevel)
	next.Priority = valueOr(next.Priority, patch.Priority)
	next.AssigneeType = valueOr(next.AssigneeType, patch.AssigneeType)
	next.AgentRole = valueOr(next.AgentRole, patch.AgentRole)
	next.Branch = valueOr(next.Branch, patch.Branch)
	next.PRURL = valueOr(next.PRURL, patch.PRURL)
	next.CIStatus = valueOr(next.CIStatus, patch.CIStatus)
	next.VisualStatus = valueOr(next.VisualStatus, patch.VisualStatus)
	next.ArtifactPath = valueOr(next.ArtifactPath, patch.ArtifactPath)

	const q = `
UPDATE tasks
SET title = $2,
  description = $3,
  status = $4,
  lane = $5,
  stack_scope = $6,
  risk_level = $7,
  priority = $8,
  assignee_type = $9,
  agent_role = $10,
  branch = $11,
  pr_url = $12,
  ci_status = $13,
  visual_status = $14,
  artifact_path = $15
WHERE id = $1
RETURNING id, work_id, feature_id, title, description, status, lane, stack_scope,
  risk_level, priority, assignee_type, agent_role, branch, pr_url, ci_status,
  visual_status, artifact_path, created_at, updated_at;`

	updated, err := scanTask(s.db.QueryRowContext(
		ctx,
		q,
		id,
		next.Title,
		next.Description,
		next.Status,
		next.Lane,
		next.StackScope,
		next.RiskLevel,
		next.Priority,
		next.AssigneeType,
		next.AgentRole,
		next.Branch,
		next.PRURL,
		next.CIStatus,
		next.VisualStatus,
		next.ArtifactPath,
	))
	if err != nil {
		return Task{}, err
	}

	actor = defaultActor(actor)
	if err := AppendRunEvent(ctx, s.db, RunEvent{
		WorkID:        &updated.WorkID,
		TaskID:        &updated.ID,
		ActorType:     actor.Type,
		ActorID:       actor.ID,
		Command:       "task.update",
		PreviousState: previous,
		NextState:     updated,
		Reason:        reason,
	}); err != nil {
		return Task{}, err
	}

	return updated, nil
}

type taskScanner interface {
	Scan(dest ...any) error
}

func scanTask(scanner taskScanner) (Task, error) {
	var task Task
	var featureID sql.NullString

	err := scanner.Scan(
		&task.ID,
		&task.WorkID,
		&featureID,
		&task.Title,
		&task.Description,
		&task.Status,
		&task.Lane,
		&task.StackScope,
		&task.RiskLevel,
		&task.Priority,
		&task.AssigneeType,
		&task.AgentRole,
		&task.Branch,
		&task.PRURL,
		&task.CIStatus,
		&task.VisualStatus,
		&task.ArtifactPath,
		&task.CreatedAt,
		&task.UpdatedAt,
	)
	if errors.Is(err, sql.ErrNoRows) {
		return Task{}, ErrNotFound
	}
	if err != nil {
		return Task{}, err
	}
	if featureID.Valid {
		task.FeatureID = &featureID.String
	}
	return task, nil
}
