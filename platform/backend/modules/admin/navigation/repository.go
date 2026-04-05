package adminnavigationsvc

import (
	"context"
	"database/sql"
	"errors"
	"fmt"

	"github.com/google/uuid"

	"dtriton.com/platform/backend/internal/platform/postgres"
)

var ErrAdminUserNotFound = errors.New("admin navigation user not found")

type AdminUser struct {
	ID     uuid.UUID
	Email  string
	Name   string
	Level  int
	Status string
}

type SectionRecord struct {
	ID          uuid.UUID
	SectionKey  string
	Title       string
	Description string
	RoutePath   string
	Access      string
}

type ModuleRecord struct {
	ID          uuid.UUID
	ModuleKey   string
	Title       string
	Description string
	Icon        string
	Sections    []SectionRecord
}

type Repository interface {
	GetByID(ctx context.Context, userID uuid.UUID) (*AdminUser, error)
	ListFavoriteSurfaceIDs(ctx context.Context, userID uuid.UUID) ([]string, error)
	ListRootNavigation(ctx context.Context) ([]ModuleRecord, error)
	ListUserNavigation(ctx context.Context, userID uuid.UUID) ([]ModuleRecord, error)
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
		return nil, fmt.Errorf("admin navigation: open master db: %w", err)
	}

	const query = `
SELECT id, email, COALESCE(name, ''), level, status
  FROM admin_user
 WHERE id = $1
 LIMIT 1`

	var user AdminUser
	if err := db.QueryRow(query, userID).Scan(
		&user.ID,
		&user.Email,
		&user.Name,
		&user.Level,
		&user.Status,
	); err != nil {
		if errors.Is(err, sql.ErrNoRows) {
			return nil, ErrAdminUserNotFound
		}
		return nil, fmt.Errorf("admin navigation: query user: %w", err)
	}

	return &user, nil
}

func (r *repository) ListRootNavigation(ctx context.Context) ([]ModuleRecord, error) {
	db, err := r.client.OpenDBMaster(ctx)
	if err != nil {
		return nil, fmt.Errorf("admin navigation: open master db: %w", err)
	}

	const query = `
SELECT
  m.guid,
  m.module_key,
  m.title,
  COALESCE(m.description, ''),
  COALESCE(m.icon, ''),
  s.guid,
  s.section_key,
  s.title,
  COALESCE(s.description, ''),
  COALESCE(s.route_path, ''),
  'write' AS access_mode
FROM admin_module m
JOIN admin_module_section s ON s.module_id = m.id
WHERE m.status = 'active'
  AND s.status = 'active'
  AND COALESCE(btrim(s.route_path), '') <> ''
ORDER BY m.sort_order ASC, m.title ASC, s.sort_order ASC, s.title ASC`

	rows, err := db.Query(query)
	if err != nil {
		return nil, fmt.Errorf("admin navigation: query root navigation: %w", err)
	}
	defer rows.Close()

	return scanNavigationRows(rows)
}

func (r *repository) ListFavoriteSurfaceIDs(ctx context.Context, userID uuid.UUID) ([]string, error) {
	db, err := r.client.OpenDBMaster(ctx)
	if err != nil {
		return nil, fmt.Errorf("admin navigation: open master db: %w", err)
	}

	const query = `
SELECT surface_id
FROM admin_collection_favorite
WHERE admin_user_id = $1
ORDER BY created_at DESC, id DESC`

	rows, err := db.Query(query, userID)
	if err != nil {
		return nil, fmt.Errorf("admin navigation: query favorite surfaces: %w", err)
	}
	defer rows.Close()

	surfaces := make([]string, 0)
	for rows.Next() {
		var surfaceID string
		if err := rows.Scan(&surfaceID); err != nil {
			return nil, fmt.Errorf("admin navigation: scan favorite surface: %w", err)
		}
		surfaces = append(surfaces, surfaceID)
	}
	if err := rows.Err(); err != nil {
		return nil, fmt.Errorf("admin navigation: iterate favorite surfaces: %w", err)
	}

	return surfaces, nil
}

func (r *repository) ListUserNavigation(ctx context.Context, userID uuid.UUID) ([]ModuleRecord, error) {
	db, err := r.client.OpenDBMaster(ctx)
	if err != nil {
		return nil, fmt.Errorf("admin navigation: open master db: %w", err)
	}

	const query = `
SELECT
  m.guid,
  m.module_key,
  m.title,
  COALESCE(m.description, ''),
  COALESCE(m.icon, ''),
  s.guid,
  s.section_key,
  s.title,
  COALESCE(s.description, ''),
  COALESCE(s.route_path, ''),
  g.access_mode
FROM admin_section_grant g
JOIN admin_module_section s ON s.id = g.section_id
JOIN admin_module m ON m.id = s.module_id
WHERE g.admin_user_id = $1
  AND m.status = 'active'
  AND s.status = 'active'
  AND COALESCE(btrim(s.route_path), '') <> ''
ORDER BY m.sort_order ASC, m.title ASC, s.sort_order ASC, s.title ASC`

	rows, err := db.Query(query, userID)
	if err != nil {
		return nil, fmt.Errorf("admin navigation: query user navigation: %w", err)
	}
	defer rows.Close()

	return scanNavigationRows(rows)
}

func scanNavigationRows(rows *sql.Rows) ([]ModuleRecord, error) {
	modules := make([]ModuleRecord, 0)
	moduleIndex := make(map[uuid.UUID]int)

	for rows.Next() {
		var (
			module  ModuleRecord
			section SectionRecord
		)

		if err := rows.Scan(
			&module.ID,
			&module.ModuleKey,
			&module.Title,
			&module.Description,
			&module.Icon,
			&section.ID,
			&section.SectionKey,
			&section.Title,
			&section.Description,
			&section.RoutePath,
			&section.Access,
		); err != nil {
			return nil, fmt.Errorf("admin navigation: scan row: %w", err)
		}

		idx, ok := moduleIndex[module.ID]
		if !ok {
			modules = append(modules, module)
			idx = len(modules) - 1
			moduleIndex[module.ID] = idx
		}
		modules[idx].Sections = append(modules[idx].Sections, section)
	}
	if err := rows.Err(); err != nil {
		return nil, fmt.Errorf("admin navigation: iterate rows: %w", err)
	}

	return modules, nil
}
