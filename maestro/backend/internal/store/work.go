package store

import (
	"context"
	"database/sql"
	"errors"
	"fmt"
)

func (s *Store) CreateWork(ctx context.Context, input WorkInput, actor Actor, reason string) (Work, error) {
	if input.Title == "" {
		return Work{}, fmt.Errorf("%w: title is required", ErrInvalidInput)
	}

	input.Type = defaultString(input.Type, "task")
	input.Status = defaultString(input.Status, "draft")
	input.ArtifactShape = defaultString(input.ArtifactShape, "lightweight")
	input.RiskLevel = defaultString(input.RiskLevel, "low")
	input.Priority = defaultString(input.Priority, "normal")
	input.Owner = defaultString(input.Owner, "owner")

	const q = `
INSERT INTO work (
  repository_id,
  title,
  description,
  type,
  status,
  artifact_shape,
  risk_level,
  priority,
  owner,
  branch,
  pr_url,
  artifact_root
) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12)
RETURNING id, repository_id, title, description, type, status, artifact_shape,
  risk_level, priority, owner, branch, pr_url, artifact_root, created_at, updated_at;`

	work, err := scanWork(s.db.QueryRowContext(
		ctx,
		q,
		deref(input.RepositoryID),
		input.Title,
		input.Description,
		input.Type,
		input.Status,
		input.ArtifactShape,
		input.RiskLevel,
		input.Priority,
		input.Owner,
		input.Branch,
		input.PRURL,
		input.ArtifactRoot,
	))
	if err != nil {
		return Work{}, err
	}

	actor = defaultActor(actor)
	if err := AppendRunEvent(ctx, s.db, RunEvent{
		WorkID:        &work.ID,
		ActorType:     actor.Type,
		ActorID:       actor.ID,
		Command:       "work.create",
		PreviousState: nil,
		NextState:     work,
		Reason:        reason,
	}); err != nil {
		return Work{}, err
	}

	return work, nil
}

func (s *Store) ListWork(ctx context.Context, filters WorkFilters) ([]Work, error) {
	const q = `
SELECT id, repository_id, title, description, type, status, artifact_shape,
  risk_level, priority, owner, branch, pr_url, artifact_root, created_at, updated_at
FROM work
WHERE ($1 = '' OR status = $1)
  AND ($2 = '' OR type = $2)
  AND ($3 = '' OR risk_level = $3)
  AND ($4 = '' OR owner = $4)
ORDER BY updated_at DESC, created_at DESC;`

	rows, err := s.db.QueryContext(ctx, q, filters.Status, filters.Type, filters.RiskLevel, filters.Owner)
	if err != nil {
		return nil, err
	}
	defer rows.Close()

	var out []Work
	for rows.Next() {
		work, err := scanWork(rows)
		if err != nil {
			return nil, err
		}
		out = append(out, work)
	}
	if err := rows.Err(); err != nil {
		return nil, err
	}
	return out, nil
}

func (s *Store) GetWork(ctx context.Context, id string) (Work, error) {
	const q = `
SELECT id, repository_id, title, description, type, status, artifact_shape,
  risk_level, priority, owner, branch, pr_url, artifact_root, created_at, updated_at
FROM work
WHERE id = $1;`

	return scanWork(s.db.QueryRowContext(ctx, q, id))
}

func (s *Store) UpdateWork(ctx context.Context, id string, patch WorkPatch, actor Actor, reason string) (Work, error) {
	previous, err := s.GetWork(ctx, id)
	if err != nil {
		return Work{}, err
	}

	next := previous
	next.Title = valueOr(next.Title, patch.Title)
	next.Description = valueOr(next.Description, patch.Description)
	next.Type = valueOr(next.Type, patch.Type)
	next.Status = valueOr(next.Status, patch.Status)
	next.ArtifactShape = valueOr(next.ArtifactShape, patch.ArtifactShape)
	next.RiskLevel = valueOr(next.RiskLevel, patch.RiskLevel)
	next.Priority = valueOr(next.Priority, patch.Priority)
	next.Owner = valueOr(next.Owner, patch.Owner)
	next.Branch = valueOr(next.Branch, patch.Branch)
	next.PRURL = valueOr(next.PRURL, patch.PRURL)
	next.ArtifactRoot = valueOr(next.ArtifactRoot, patch.ArtifactRoot)

	const q = `
UPDATE work
SET title = $2,
  description = $3,
  type = $4,
  status = $5,
  artifact_shape = $6,
  risk_level = $7,
  priority = $8,
  owner = $9,
  branch = $10,
  pr_url = $11,
  artifact_root = $12
WHERE id = $1
RETURNING id, repository_id, title, description, type, status, artifact_shape,
  risk_level, priority, owner, branch, pr_url, artifact_root, created_at, updated_at;`

	updated, err := scanWork(s.db.QueryRowContext(
		ctx,
		q,
		id,
		next.Title,
		next.Description,
		next.Type,
		next.Status,
		next.ArtifactShape,
		next.RiskLevel,
		next.Priority,
		next.Owner,
		next.Branch,
		next.PRURL,
		next.ArtifactRoot,
	))
	if err != nil {
		return Work{}, err
	}

	actor = defaultActor(actor)
	if err := AppendRunEvent(ctx, s.db, RunEvent{
		WorkID:        &updated.ID,
		ActorType:     actor.Type,
		ActorID:       actor.ID,
		Command:       "work.update",
		PreviousState: previous,
		NextState:     updated,
		Reason:        reason,
	}); err != nil {
		return Work{}, err
	}

	return updated, nil
}

type workScanner interface {
	Scan(dest ...any) error
}

func scanWork(scanner workScanner) (Work, error) {
	var work Work
	var repositoryID sql.NullString

	err := scanner.Scan(
		&work.ID,
		&repositoryID,
		&work.Title,
		&work.Description,
		&work.Type,
		&work.Status,
		&work.ArtifactShape,
		&work.RiskLevel,
		&work.Priority,
		&work.Owner,
		&work.Branch,
		&work.PRURL,
		&work.ArtifactRoot,
		&work.CreatedAt,
		&work.UpdatedAt,
	)
	if errors.Is(err, sql.ErrNoRows) {
		return Work{}, ErrNotFound
	}
	if err != nil {
		return Work{}, err
	}
	if repositoryID.Valid {
		work.RepositoryID = &repositoryID.String
	}
	return work, nil
}
