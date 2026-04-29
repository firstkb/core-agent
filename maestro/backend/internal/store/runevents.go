package store

import (
	"context"
	"database/sql"
	"encoding/json"
	"fmt"
)

const defaultRunEventLimit = 100
const maxRunEventLimit = 250

type RunEvent struct {
	WorkID        *string
	TaskID        *string
	StageID       *string
	AttemptID     *string
	ActorType     string
	ActorID       string
	Command       string
	PreviousState any
	NextState     any
	Reason        string
}

func AppendRunEvent(ctx context.Context, db *sql.DB, event RunEvent) error {
	if db == nil {
		return fmt.Errorf("append run event: db is nil")
	}
	if event.ActorType == "" || event.ActorID == "" || event.Command == "" {
		return fmt.Errorf("append run event: actor_type, actor_id, and command are required")
	}

	previousState, err := marshalState(event.PreviousState)
	if err != nil {
		return fmt.Errorf("marshal previous state: %w", err)
	}
	nextState, err := marshalState(event.NextState)
	if err != nil {
		return fmt.Errorf("marshal next state: %w", err)
	}

	const q = `
INSERT INTO run_events (
  work_id,
  task_id,
  stage_id,
  attempt_id,
  actor_type,
  actor_id,
  command,
  previous_state_json,
  next_state_json,
  reason
) VALUES ($1, $2, $3, $4, $5, $6, $7, $8::jsonb, $9::jsonb, $10);`

	if _, err := db.ExecContext(
		ctx,
		q,
		event.WorkID,
		event.TaskID,
		event.StageID,
		event.AttemptID,
		event.ActorType,
		event.ActorID,
		event.Command,
		string(previousState),
		string(nextState),
		event.Reason,
	); err != nil {
		return fmt.Errorf("insert run event: %w", err)
	}

	return nil
}

func (s *Store) ListRunEvents(ctx context.Context, filters RunEventFilters) ([]RunEventEntry, error) {
	limit := filters.Limit
	if limit <= 0 {
		limit = defaultRunEventLimit
	}
	if limit > maxRunEventLimit {
		limit = maxRunEventLimit
	}

	const q = `
SELECT id, work_id, task_id, stage_id, attempt_id, actor_type, actor_id, command,
  previous_state_json, next_state_json, reason, created_at
FROM run_events
WHERE ($1 = '' OR work_id::text = $1)
  AND ($2 = '' OR task_id::text = $2)
  AND ($3 = '' OR stage_id::text = $3)
  AND ($4 = '' OR attempt_id::text = $4)
ORDER BY created_at DESC
LIMIT $5;`

	rows, err := s.db.QueryContext(ctx, q, filters.WorkID, filters.TaskID, filters.StageID, filters.AttemptID, limit)
	if err != nil {
		return nil, err
	}
	defer rows.Close()

	var out []RunEventEntry
	for rows.Next() {
		event, err := scanRunEvent(rows)
		if err != nil {
			return nil, err
		}
		out = append(out, event)
	}
	if err := rows.Err(); err != nil {
		return nil, err
	}
	return out, nil
}

func marshalState(value any) ([]byte, error) {
	if value == nil {
		return []byte(`{}`), nil
	}
	return json.Marshal(value)
}

type runEventScanner interface {
	Scan(dest ...any) error
}

func scanRunEvent(scanner runEventScanner) (RunEventEntry, error) {
	var event RunEventEntry
	var workID sql.NullString
	var taskID sql.NullString
	var stageID sql.NullString
	var attemptID sql.NullString
	var previousState []byte
	var nextState []byte

	if err := scanner.Scan(
		&event.ID,
		&workID,
		&taskID,
		&stageID,
		&attemptID,
		&event.ActorType,
		&event.ActorID,
		&event.Command,
		&previousState,
		&nextState,
		&event.Reason,
		&event.CreatedAt,
	); err != nil {
		return RunEventEntry{}, err
	}
	if workID.Valid {
		event.WorkID = &workID.String
	}
	if taskID.Valid {
		event.TaskID = &taskID.String
	}
	if stageID.Valid {
		event.StageID = &stageID.String
	}
	if attemptID.Valid {
		event.AttemptID = &attemptID.String
	}

	var errJSON error
	event.PreviousState, errJSON = anyFromJSON(previousState, map[string]any{})
	if errJSON != nil {
		return RunEventEntry{}, errJSON
	}
	event.NextState, errJSON = anyFromJSON(nextState, map[string]any{})
	if errJSON != nil {
		return RunEventEntry{}, errJSON
	}

	return event, nil
}
