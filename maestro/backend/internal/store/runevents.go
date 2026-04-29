package store

import (
	"context"
	"database/sql"
	"encoding/json"
	"fmt"
)

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

func marshalState(value any) ([]byte, error) {
	if value == nil {
		return []byte(`{}`), nil
	}
	return json.Marshal(value)
}
