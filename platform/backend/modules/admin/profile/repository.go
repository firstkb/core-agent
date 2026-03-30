package adminprofilesvc

import (
	"context"
	"database/sql"
	"errors"
	"fmt"

	"github.com/google/uuid"

	"dtriton.com/platform/backend/internal/platform/postgres"
)

var ErrAdminUserNotFound = errors.New("admin profile user not found")

type AdminUser struct {
	ID     uuid.UUID
	Email  string
	Phone  string
	Name   string
	Level  int
	Status string
}

type Repository interface {
	GetByID(ctx context.Context, userID uuid.UUID) (*AdminUser, error)
}

type repository struct {
	client *postgres.Client
}

func NewRepository(client *postgres.Client) Repository {
	return &repository{client: client}
}

func (r *repository) GetByID(ctx context.Context, userID uuid.UUID) (*AdminUser, error) {
	if userID == uuid.Nil {
		return nil, ErrAdminUserNotFound
	}

	db, err := r.client.OpenDBMaster(ctx)
	if err != nil {
		return nil, fmt.Errorf("admin profile: open master db: %w", err)
	}

	const query = `
SELECT id, email, COALESCE(phone, ''), COALESCE(name, ''), level, status
  FROM admin_user
 WHERE id = $1
 LIMIT 1`

	var user AdminUser
	if err := db.QueryRow(query, userID).Scan(
		&user.ID,
		&user.Email,
		&user.Phone,
		&user.Name,
		&user.Level,
		&user.Status,
	); err != nil {
		if errors.Is(err, sql.ErrNoRows) {
			return nil, ErrAdminUserNotFound
		}
		return nil, fmt.Errorf("admin profile: query user: %w", err)
	}

	return &user, nil
}
