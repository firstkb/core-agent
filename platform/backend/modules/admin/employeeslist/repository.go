package employeeslist

import (
	"context"
	"database/sql"
	"errors"
	"fmt"
	"strings"
	"time"

	"github.com/google/uuid"
	"github.com/lib/pq"

	"dtriton.com/platform/backend/internal/platform/postgres"
)

type EmployeeRecord struct {
	ID        uuid.UUID
	Email     string
	Phone     string
	Name      string
	Level     int
	Status    string
	CreatedAt time.Time
}

type Repository interface {
	ListEmployees(ctx context.Context) ([]EmployeeRecord, error)
	GetEmployee(ctx context.Context, employeeID uuid.UUID) (*EmployeeRecord, error)
	SetEmployeeStatus(ctx context.Context, employeeIDs []uuid.UUID, status string) error
	UpdateEmployee(ctx context.Context, input UpdateEmployeeRecordInput) (*EmployeeRecord, error)
}

type UpdateEmployeeRecordInput struct {
	ID     uuid.UUID
	Name   string
	Phone  string
	Status string
}

type repository struct {
	client *postgres.Client
}

func NewRepository(client *postgres.Client) Repository {
	return &repository{client: client}
}

func (r *repository) ListEmployees(ctx context.Context) ([]EmployeeRecord, error) {
	db, err := r.client.OpenDBMaster(ctx)
	if err != nil {
		return nil, fmt.Errorf("employees list: open master db: %w", err)
	}

	const query = `
SELECT
  id,
  email,
  COALESCE(phone, ''),
  COALESCE(name, ''),
  level,
  status,
  created_at
FROM admin_user
ORDER BY
  CASE WHEN COALESCE(btrim(name), '') = '' THEN 1 ELSE 0 END,
  lower(COALESCE(name, '')),
  lower(email),
  created_at DESC`

	rows, err := db.Query(query)
	if err != nil {
		return nil, fmt.Errorf("employees list: query employees: %w", err)
	}
	defer rows.Close()

	records := make([]EmployeeRecord, 0)
	for rows.Next() {
		var record EmployeeRecord
		if err := rows.Scan(
			&record.ID,
			&record.Email,
			&record.Phone,
			&record.Name,
			&record.Level,
			&record.Status,
			&record.CreatedAt,
		); err != nil {
			return nil, fmt.Errorf("employees list: scan employee: %w", err)
		}
		records = append(records, record)
	}
	if err := rows.Err(); err != nil {
		return nil, fmt.Errorf("employees list: iterate employees: %w", err)
	}

	return records, nil
}

func (r *repository) GetEmployee(ctx context.Context, employeeID uuid.UUID) (*EmployeeRecord, error) {
	if employeeID == uuid.Nil {
		return nil, ErrEmployeeNotFound
	}

	const query = `
SELECT
  id,
  email,
  COALESCE(phone, ''),
  COALESCE(name, ''),
  level,
  status,
  created_at
FROM admin_user
WHERE id = $1
LIMIT 1`

	return r.queryOne(ctx, query, employeeID)
}

func (r *repository) SetEmployeeStatus(ctx context.Context, employeeIDs []uuid.UUID, status string) error {
	if len(employeeIDs) == 0 {
		return nil
	}

	db, err := r.client.OpenDBMaster(ctx)
	if err != nil {
		return fmt.Errorf("employees list: open master db: %w", err)
	}

	placeholders := make([]string, 0, len(employeeIDs))
	args := make([]any, 0, len(employeeIDs)+1)
	args = append(args, strings.TrimSpace(status))
	for index, employeeID := range employeeIDs {
		placeholders = append(placeholders, fmt.Sprintf("$%d", index+2))
		args = append(args, employeeID)
	}

	query := fmt.Sprintf(`
UPDATE admin_user
SET status = $1
WHERE id IN (%s)`, strings.Join(placeholders, ", "))

	if _, err := db.Exec(query, args...); err != nil {
		return fmt.Errorf("employees list: set employee status: %w", err)
	}

	return nil
}

func (r *repository) UpdateEmployee(ctx context.Context, input UpdateEmployeeRecordInput) (*EmployeeRecord, error) {
	if input.ID == uuid.Nil {
		return nil, ErrEmployeeNotFound
	}

	db, err := r.client.OpenDBMaster(ctx)
	if err != nil {
		return nil, fmt.Errorf("employees list: open master db: %w", err)
	}

	const query = `
UPDATE admin_user
SET
  name = NULLIF($2, ''),
  phone = NULLIF($3, ''),
  status = $4
WHERE id = $1
RETURNING
  id,
  email,
  COALESCE(phone, ''),
  COALESCE(name, ''),
  level,
  status,
  created_at`

	var record EmployeeRecord
	if err := db.QueryRow(query,
		input.ID,
		strings.TrimSpace(input.Name),
		strings.TrimSpace(input.Phone),
		strings.TrimSpace(input.Status),
	).Scan(
		&record.ID,
		&record.Email,
		&record.Phone,
		&record.Name,
		&record.Level,
		&record.Status,
		&record.CreatedAt,
	); err != nil {
		if errors.Is(err, sql.ErrNoRows) {
			return nil, ErrEmployeeNotFound
		}

		var pqErr *pq.Error
		if errors.As(err, &pqErr) && string(pqErr.Code) == "23505" {
			return nil, ErrEmployeeConflict
		}

		return nil, fmt.Errorf("employees list: update employee: %w", err)
	}

	return &record, nil
}

func (r *repository) queryOne(ctx context.Context, query string, args ...any) (*EmployeeRecord, error) {
	db, err := r.client.OpenDBMaster(ctx)
	if err != nil {
		return nil, fmt.Errorf("employees list: open master db: %w", err)
	}

	var record EmployeeRecord
	if err := db.QueryRow(query, args...).Scan(
		&record.ID,
		&record.Email,
		&record.Phone,
		&record.Name,
		&record.Level,
		&record.Status,
		&record.CreatedAt,
	); err != nil {
		if errors.Is(err, sql.ErrNoRows) {
			return nil, ErrEmployeeNotFound
		}
		return nil, fmt.Errorf("employees list: query employee: %w", err)
	}

	return &record, nil
}
