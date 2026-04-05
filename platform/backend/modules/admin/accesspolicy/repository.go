package adminaccesspolicy

import (
	"context"
	"database/sql"
	"errors"
	"fmt"
	"strings"

	"github.com/google/uuid"

	"dtriton.com/platform/backend/internal/platform/postgres"
)

type repository struct {
	client *postgres.Client
}

func NewRepository(client *postgres.Client) Repository {
	return &repository{client: client}
}

func (r *repository) GetAdminUserByID(ctx context.Context, userID uuid.UUID) (*AdminUser, error) {
	if userID == uuid.Nil {
		return nil, ErrUserNotFound
	}

	db, err := r.client.OpenDBMaster(ctx)
	if err != nil {
		return nil, fmt.Errorf("admin access policy: open master db: %w", err)
	}

	const query = `
SELECT id, level, status
  FROM admin_user
 WHERE id = $1
 LIMIT 1`

	var user AdminUser
	if err := db.QueryRow(query, userID).Scan(&user.ID, &user.Level, &user.Status); err != nil {
		if errors.Is(err, sql.ErrNoRows) {
			return nil, ErrUserNotFound
		}
		return nil, fmt.Errorf("admin access policy: query user: %w", err)
	}

	return &user, nil
}

func (r *repository) HasSectionAccess(ctx context.Context, userID uuid.UUID, moduleKey, sectionKey, access string) (bool, error) {
	if userID == uuid.Nil || strings.TrimSpace(moduleKey) == "" || strings.TrimSpace(sectionKey) == "" {
		return false, nil
	}

	db, err := r.client.OpenDBMaster(ctx)
	if err != nil {
		return false, fmt.Errorf("admin access policy: open master db: %w", err)
	}

	const query = `
SELECT 1
  FROM admin_section_grant g
  JOIN admin_module_section s ON s.id = g.section_id
  JOIN admin_module m ON m.id = s.module_id
 WHERE g.admin_user_id = $1
   AND m.module_key = $2
   AND s.section_key = $3
   AND (
     ($4 = 'write' AND g.access_mode = 'write')
     OR
     ($4 = 'read' AND g.access_mode IN ('read', 'write'))
   )
 LIMIT 1`

	var hit int
	if err := db.QueryRow(query, userID, moduleKey, sectionKey, strings.ToLower(strings.TrimSpace(access))).Scan(&hit); err != nil {
		if errors.Is(err, sql.ErrNoRows) {
			return false, nil
		}
		return false, fmt.Errorf("admin access policy: query section grant: %w", err)
	}

	return true, nil
}
