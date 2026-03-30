package authsvc

import (
	"context"
	"database/sql"
	"errors"
	"fmt"
	"strings"

	"github.com/google/uuid"

	"dtriton.com/platform/backend/internal/platform/postgres"
)

var ErrAdminUserNotFound = errors.New("admin user not found")

const platformAuthTenantID int64 = 0

type AdminUser struct {
	ID     uuid.UUID
	Email  string
	Phone  string
	Name   string
	Level  int
	Status string
	Role   string
}

type AdminUserRepository interface {
	FindByEmail(ctx context.Context, email string) (*AdminUser, error)
	FindByPhone(ctx context.Context, phone string) (*AdminUser, error)
	GetByID(ctx context.Context, userID uuid.UUID) (*AdminUser, error)
}

type adminUserRepository struct {
	client *postgres.Client
}

func NewAdminUserRepository(client *postgres.Client) AdminUserRepository {
	return &adminUserRepository{client: client}
}

func (r *adminUserRepository) FindByEmail(ctx context.Context, email string) (*AdminUser, error) {
	email = strings.TrimSpace(email)
	if email == "" {
		return nil, ErrAdminUserNotFound
	}

	const query = `
SELECT id, email, COALESCE(phone, ''), COALESCE(name, ''), level, status
  FROM admin_user
 WHERE email = $1
 LIMIT 1`

	return r.queryOne(ctx, query, email)
}

func (r *adminUserRepository) FindByPhone(ctx context.Context, phone string) (*AdminUser, error) {
	phone = strings.TrimSpace(phone)
	if phone == "" {
		return nil, ErrAdminUserNotFound
	}

	const query = `
SELECT id, email, COALESCE(phone, ''), COALESCE(name, ''), level, status
  FROM admin_user
 WHERE phone = $1
 LIMIT 1`

	return r.queryOne(ctx, query, phone)
}

func (r *adminUserRepository) GetByID(ctx context.Context, userID uuid.UUID) (*AdminUser, error) {
	if userID == uuid.Nil {
		return nil, ErrAdminUserNotFound
	}

	const query = `
SELECT id, email, COALESCE(phone, ''), COALESCE(name, ''), level, status
  FROM admin_user
 WHERE id = $1
 LIMIT 1`

	return r.queryOne(ctx, query, userID)
}

func (r *adminUserRepository) queryOne(ctx context.Context, query string, args ...any) (*AdminUser, error) {
	db, err := r.client.OpenDBMaster(ctx)
	if err != nil {
		return nil, fmt.Errorf("admin user: open master db: %w", err)
	}

	var user AdminUser
	if err := db.QueryRow(query, args...).Scan(
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
		return nil, fmt.Errorf("admin user: query user: %w", err)
	}

	normalizeAdminUser(&user)
	return &user, nil
}
