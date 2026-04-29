package store

import (
	"context"
	"database/sql"
	"errors"
	"fmt"
)

func (s *Store) AttachEvidence(ctx context.Context, input EvidenceInput, actor Actor, reason string) (Evidence, error) {
	if input.Type == "" {
		return Evidence{}, fmt.Errorf("%w: type is required", ErrInvalidInput)
	}
	if input.Title == "" {
		return Evidence{}, fmt.Errorf("%w: title is required", ErrInvalidInput)
	}
	if input.URI == "" {
		return Evidence{}, fmt.Errorf("%w: uri is required", ErrInvalidInput)
	}

	metadata, err := jsonString(input.Metadata, "{}")
	if err != nil {
		return Evidence{}, err
	}

	const q = `
INSERT INTO evidence (work_id, task_id, stage_id, attempt_id, type, title, uri, metadata_json)
VALUES ($1, $2, $3, $4, $5, $6, $7, $8::jsonb)
RETURNING id, work_id, task_id, stage_id, attempt_id, type, title, uri, metadata_json, created_at;`

	evidence, err := scanEvidence(s.db.QueryRowContext(
		ctx,
		q,
		deref(input.WorkID),
		deref(input.TaskID),
		deref(input.StageID),
		deref(input.AttemptID),
		input.Type,
		input.Title,
		input.URI,
		metadata,
	))
	if err != nil {
		return Evidence{}, err
	}

	actor = defaultActor(actor)
	if err := AppendRunEvent(ctx, s.db, RunEvent{
		WorkID:        evidence.WorkID,
		TaskID:        evidence.TaskID,
		StageID:       evidence.StageID,
		AttemptID:     evidence.AttemptID,
		ActorType:     actor.Type,
		ActorID:       actor.ID,
		Command:       "evidence.attach",
		PreviousState: nil,
		NextState:     evidence,
		Reason:        reason,
	}); err != nil {
		return Evidence{}, err
	}

	return evidence, nil
}

func (s *Store) ListTaskEvidence(ctx context.Context, taskID string) ([]Evidence, error) {
	return s.listEvidence(ctx, "task_id", taskID)
}

func (s *Store) ListAttemptEvidence(ctx context.Context, attemptID string) ([]Evidence, error) {
	return s.listEvidence(ctx, "attempt_id", attemptID)
}

func (s *Store) listEvidence(ctx context.Context, column string, id string) ([]Evidence, error) {
	q := fmt.Sprintf(`
SELECT id, work_id, task_id, stage_id, attempt_id, type, title, uri, metadata_json, created_at
FROM evidence
WHERE %s = $1
ORDER BY created_at ASC;`, column)

	rows, err := s.db.QueryContext(ctx, q, id)
	if err != nil {
		return nil, err
	}
	defer rows.Close()

	var out []Evidence
	for rows.Next() {
		evidence, err := scanEvidence(rows)
		if err != nil {
			return nil, err
		}
		out = append(out, evidence)
	}
	if err := rows.Err(); err != nil {
		return nil, err
	}
	return out, nil
}

type evidenceScanner interface {
	Scan(dest ...any) error
}

func scanEvidence(scanner evidenceScanner) (Evidence, error) {
	var evidence Evidence
	var workID sql.NullString
	var taskID sql.NullString
	var stageID sql.NullString
	var attemptID sql.NullString
	var metadata []byte

	err := scanner.Scan(
		&evidence.ID,
		&workID,
		&taskID,
		&stageID,
		&attemptID,
		&evidence.Type,
		&evidence.Title,
		&evidence.URI,
		&metadata,
		&evidence.CreatedAt,
	)
	if errors.Is(err, sql.ErrNoRows) {
		return Evidence{}, ErrNotFound
	}
	if err != nil {
		return Evidence{}, err
	}
	if workID.Valid {
		evidence.WorkID = &workID.String
	}
	if taskID.Valid {
		evidence.TaskID = &taskID.String
	}
	if stageID.Valid {
		evidence.StageID = &stageID.String
	}
	if attemptID.Valid {
		evidence.AttemptID = &attemptID.String
	}
	var metadataFallback = map[string]any{}
	var unmarshalErr error
	evidence.Metadata, unmarshalErr = anyFromJSON(metadata, metadataFallback)
	if unmarshalErr != nil {
		return Evidence{}, unmarshalErr
	}
	return evidence, nil
}
