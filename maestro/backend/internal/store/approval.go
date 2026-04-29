package store

import (
	"context"
	"database/sql"
	"errors"
	"fmt"
)

func (s *Store) RequestApproval(ctx context.Context, input ApprovalInput, actor Actor, reason string) (Approval, error) {
	if input.ApprovalType == "" {
		return Approval{}, fmt.Errorf("%w: approval_type is required", ErrInvalidInput)
	}
	if input.RequestedBy == "" {
		input.RequestedBy = "maestro"
	}
	if input.Reason == "" {
		input.Reason = reason
	}

	const q = `
INSERT INTO approvals (work_id, task_id, approval_type, requested_by, reason)
VALUES ($1, $2, $3, $4, $5)
RETURNING id, work_id, task_id, approval_type, status, requested_by, approved_by,
  reason, created_at, decided_at;`

	approval, err := scanApproval(s.db.QueryRowContext(ctx, q, deref(input.WorkID), deref(input.TaskID), input.ApprovalType, input.RequestedBy, input.Reason))
	if err != nil {
		return Approval{}, err
	}

	actor = defaultActor(actor)
	if err := AppendRunEvent(ctx, s.db, RunEvent{
		WorkID:        approval.WorkID,
		TaskID:        approval.TaskID,
		ActorType:     actor.Type,
		ActorID:       actor.ID,
		Command:       "approval.request",
		PreviousState: nil,
		NextState:     approval,
		Reason:        reason,
	}); err != nil {
		return Approval{}, err
	}

	return approval, nil
}

func (s *Store) ListTaskApprovals(ctx context.Context, taskID string) ([]Approval, error) {
	const q = `
SELECT id, work_id, task_id, approval_type, status, requested_by, approved_by,
  reason, created_at, decided_at
FROM approvals
WHERE task_id = $1
ORDER BY created_at ASC;`

	rows, err := s.db.QueryContext(ctx, q, taskID)
	if err != nil {
		return nil, err
	}
	defer rows.Close()

	var out []Approval
	for rows.Next() {
		approval, err := scanApproval(rows)
		if err != nil {
			return nil, err
		}
		out = append(out, approval)
	}
	if err := rows.Err(); err != nil {
		return nil, err
	}
	return out, nil
}

func (s *Store) GetApproval(ctx context.Context, id string) (Approval, error) {
	const q = `
SELECT id, work_id, task_id, approval_type, status, requested_by, approved_by,
  reason, created_at, decided_at
FROM approvals
WHERE id = $1;`

	return scanApproval(s.db.QueryRowContext(ctx, q, id))
}

func (s *Store) DecideApproval(ctx context.Context, id string, input ApprovalDecision, actor Actor, reason string) (Approval, error) {
	previous, err := s.GetApproval(ctx, id)
	if err != nil {
		return Approval{}, err
	}
	if input.Decision != "approved" && input.Decision != "rejected" && input.Decision != "cancelled" {
		return Approval{}, fmt.Errorf("%w: invalid approval decision", ErrInvalidInput)
	}
	if input.DecidedBy == "" {
		input.DecidedBy = "owner"
	}
	if input.Reason == "" {
		input.Reason = reason
	}

	const q = `
UPDATE approvals
SET status = $2,
  approved_by = $3,
  reason = $4,
  decided_at = now()
WHERE id = $1
RETURNING id, work_id, task_id, approval_type, status, requested_by, approved_by,
  reason, created_at, decided_at;`

	updated, err := scanApproval(s.db.QueryRowContext(ctx, q, id, input.Decision, input.DecidedBy, input.Reason))
	if err != nil {
		return Approval{}, err
	}

	actor = defaultActor(actor)
	if err := AppendRunEvent(ctx, s.db, RunEvent{
		WorkID:        updated.WorkID,
		TaskID:        updated.TaskID,
		ActorType:     actor.Type,
		ActorID:       actor.ID,
		Command:       "approval.decide." + input.Decision,
		PreviousState: previous,
		NextState:     updated,
		Reason:        reason,
	}); err != nil {
		return Approval{}, err
	}

	return updated, nil
}

type approvalScanner interface {
	Scan(dest ...any) error
}

func scanApproval(scanner approvalScanner) (Approval, error) {
	var approval Approval
	var workID sql.NullString
	var taskID sql.NullString
	var decidedAt sql.NullTime

	err := scanner.Scan(
		&approval.ID,
		&workID,
		&taskID,
		&approval.ApprovalType,
		&approval.Status,
		&approval.RequestedBy,
		&approval.ApprovedBy,
		&approval.Reason,
		&approval.CreatedAt,
		&decidedAt,
	)
	if errors.Is(err, sql.ErrNoRows) {
		return Approval{}, ErrNotFound
	}
	if err != nil {
		return Approval{}, err
	}
	if workID.Valid {
		approval.WorkID = &workID.String
	}
	if taskID.Valid {
		approval.TaskID = &taskID.String
	}
	if decidedAt.Valid {
		approval.DecidedAt = &decidedAt.Time
	}
	return approval, nil
}
