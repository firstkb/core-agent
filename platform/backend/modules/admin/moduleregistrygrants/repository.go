package moduleregistrygrants

import (
	"context"
	"database/sql"
	"errors"
	"fmt"
	"strings"
	"time"

	"github.com/google/uuid"

	"dtriton.com/platform/backend/internal/platform/postgres"
)

type SectionRecord struct {
	ID          int64
	GUID        uuid.UUID
	ModuleGUID  uuid.UUID
	SectionKey  string
	Title       string
	Description string
	RoutePath   string
	SortOrder   int
	Status      string
	CreatedAt   time.Time
	UpdatedAt   time.Time
}

type ModuleRecord struct {
	ID          int64
	GUID        uuid.UUID
	ModuleKey   string
	Title       string
	Description string
	Icon        string
	SortOrder   int
	Status      string
	CreatedAt   time.Time
	UpdatedAt   time.Time
	Sections    []SectionRecord
}

type AdminUserRecord struct {
	ID     uuid.UUID
	Email  string
	Name   string
	Level  int
	Status string
}

type SectionGrantRecord struct {
	ID        uuid.UUID
	Section   SectionRecord
	AdminUser AdminUserRecord
	Access    string
	CreatedAt time.Time
	UpdatedAt time.Time
}

type SectionGrantListRecord struct {
	Section SectionRecord
	Grants  []SectionGrantRecord
}

type Repository interface {
	GetModuleByGUID(ctx context.Context, moduleGUID uuid.UUID) (*ModuleRecord, error)
	GetAdminUserByID(ctx context.Context, adminUserID uuid.UUID) (*AdminUserRecord, error)
	ListSectionGrants(ctx context.Context, sectionGUID uuid.UUID) (*SectionGrantListRecord, error)
	UpsertSectionGrant(ctx context.Context, sectionGUID, adminUserID uuid.UUID, access string) (*SectionGrantRecord, error)
	RevokeSectionGrant(ctx context.Context, sectionGUID, adminUserID uuid.UUID) error
}

var (
	ErrModuleNotFound    = errors.New("module registry grants module not found")
	ErrSectionNotFound   = errors.New("module registry grants section not found")
	ErrRegistryConflict  = errors.New("module registry grants conflict")
	ErrAdminUserNotFound = errors.New("module registry grants admin user not found")
	ErrGrantNotFound     = errors.New("module registry grants grant not found")
)

type repository struct {
	client *postgres.Client
}

func NewRepository(client *postgres.Client) Repository {
	return &repository{client: client}
}

func (r *repository) listModules(ctx context.Context) ([]ModuleRecord, error) {
	db, err := r.client.OpenDBMaster(ctx)
	if err != nil {
		return nil, fmt.Errorf("module registry grants: open master db: %w", err)
	}

	const query = `
SELECT
  m.id,
  m.guid,
  m.module_key,
  m.title,
  COALESCE(m.description, ''),
  COALESCE(m.icon, ''),
  m.sort_order,
  m.status,
  m.created_at,
  m.updated_at,
  s.id,
  s.guid,
  COALESCE(s.section_key, ''),
  COALESCE(s.title, ''),
  COALESCE(s.description, ''),
  COALESCE(s.route_path, ''),
  COALESCE(s.sort_order, 0),
  COALESCE(s.status, ''),
  s.created_at,
  s.updated_at
FROM admin_module m
LEFT JOIN admin_module_section s ON s.module_id = m.id
ORDER BY m.sort_order ASC, m.title ASC, s.sort_order ASC, s.title ASC`

	rows, err := db.Query(query)
	if err != nil {
		return nil, fmt.Errorf("module registry grants: query modules: %w", err)
	}
	defer rows.Close()

	modules := make([]ModuleRecord, 0)
	moduleIndex := make(map[int64]int)
	for rows.Next() {
		var (
			record                        ModuleRecord
			sectionID                     sql.NullInt64
			sectionGUID                   uuid.NullUUID
			sectionKey, sectionTitle      string
			sectionDescription, routePath string
			sectionSort                   int
			sectionStatus                 string
			sectionCreatedAt              sql.NullTime
			sectionUpdatedAt              sql.NullTime
		)

		if err := rows.Scan(
			&record.ID,
			&record.GUID,
			&record.ModuleKey,
			&record.Title,
			&record.Description,
			&record.Icon,
			&record.SortOrder,
			&record.Status,
			&record.CreatedAt,
			&record.UpdatedAt,
			&sectionID,
			&sectionGUID,
			&sectionKey,
			&sectionTitle,
			&sectionDescription,
			&routePath,
			&sectionSort,
			&sectionStatus,
			&sectionCreatedAt,
			&sectionUpdatedAt,
		); err != nil {
			return nil, fmt.Errorf("module registry grants: scan module row: %w", err)
		}

		idx, ok := moduleIndex[record.ID]
		if !ok {
			modules = append(modules, record)
			idx = len(modules) - 1
			moduleIndex[record.ID] = idx
		}

		if sectionID.Valid {
			modules[idx].Sections = append(modules[idx].Sections, SectionRecord{
				ID:          sectionID.Int64,
				GUID:        sectionGUID.UUID,
				ModuleGUID:  record.GUID,
				SectionKey:  sectionKey,
				Title:       sectionTitle,
				Description: sectionDescription,
				RoutePath:   routePath,
				SortOrder:   sectionSort,
				Status:      sectionStatus,
				CreatedAt:   sectionCreatedAt.Time,
				UpdatedAt:   sectionUpdatedAt.Time,
			})
		}
	}
	if err := rows.Err(); err != nil {
		return nil, fmt.Errorf("module registry grants: iterate modules: %w", err)
	}

	return modules, nil
}

func (r *repository) GetModuleByGUID(ctx context.Context, moduleGUID uuid.UUID) (*ModuleRecord, error) {
	if moduleGUID == uuid.Nil {
		return nil, ErrModuleNotFound
	}

	modules, err := r.listModules(ctx)
	if err != nil {
		return nil, err
	}
	for _, module := range modules {
		if module.GUID == moduleGUID {
			copyModule := module
			return &copyModule, nil
		}
	}
	return nil, ErrModuleNotFound
}

func (r *repository) GetAdminUserByID(ctx context.Context, adminUserID uuid.UUID) (*AdminUserRecord, error) {
	if adminUserID == uuid.Nil {
		return nil, ErrAdminUserNotFound
	}

	db, err := r.client.OpenDBMaster(ctx)
	if err != nil {
		return nil, fmt.Errorf("module registry grants: open master db: %w", err)
	}

	const query = `
SELECT id, email, COALESCE(name, ''), level, status
FROM admin_user
WHERE id = $1
LIMIT 1`

	var user AdminUserRecord
	if err := db.QueryRow(query, adminUserID).Scan(
		&user.ID,
		&user.Email,
		&user.Name,
		&user.Level,
		&user.Status,
	); err != nil {
		if errors.Is(err, sql.ErrNoRows) {
			return nil, ErrAdminUserNotFound
		}
		return nil, fmt.Errorf("module registry grants: query admin user: %w", err)
	}

	return &user, nil
}

func (r *repository) getSectionByGUID(ctx context.Context, sectionGUID uuid.UUID) (*SectionRecord, error) {
	if sectionGUID == uuid.Nil {
		return nil, ErrSectionNotFound
	}

	db, err := r.client.OpenDBMaster(ctx)
	if err != nil {
		return nil, fmt.Errorf("module registry grants: open master db: %w", err)
	}

	const query = `
SELECT
  s.id,
  s.guid,
  m.guid,
  s.section_key,
  s.title,
  COALESCE(s.description, ''),
  COALESCE(s.route_path, ''),
  s.sort_order,
  s.status,
  s.created_at,
  s.updated_at
FROM admin_module_section s
JOIN admin_module m ON m.id = s.module_id
WHERE s.guid = $1
LIMIT 1`

	var section SectionRecord
	if err := db.QueryRow(query, sectionGUID).Scan(
		&section.ID,
		&section.GUID,
		&section.ModuleGUID,
		&section.SectionKey,
		&section.Title,
		&section.Description,
		&section.RoutePath,
		&section.SortOrder,
		&section.Status,
		&section.CreatedAt,
		&section.UpdatedAt,
	); err != nil {
		if errors.Is(err, sql.ErrNoRows) {
			return nil, ErrSectionNotFound
		}
		return nil, fmt.Errorf("module registry grants: query section: %w", err)
	}

	return &section, nil
}

func (r *repository) ListSectionGrants(ctx context.Context, sectionGUID uuid.UUID) (*SectionGrantListRecord, error) {
	section, err := r.getSectionByGUID(ctx, sectionGUID)
	if err != nil {
		return nil, err
	}

	db, err := r.client.OpenDBMaster(ctx)
	if err != nil {
		return nil, fmt.Errorf("module registry grants: open master db: %w", err)
	}

	const query = `
SELECT
  g.guid,
  u.id,
  u.email,
  COALESCE(u.name, ''),
  u.level,
  u.status,
  g.access_mode,
  g.created_at,
  g.updated_at
FROM admin_section_grant g
JOIN admin_module_section s ON s.id = g.section_id
JOIN admin_user u ON u.id = g.admin_user_id
WHERE s.guid = $1
ORDER BY lower(u.email), u.id`

	rows, err := db.Query(query, sectionGUID)
	if err != nil {
		return nil, fmt.Errorf("module registry grants: list section grants: %w", err)
	}
	defer rows.Close()

	grants := make([]SectionGrantRecord, 0)
	for rows.Next() {
		var grant SectionGrantRecord
		grant.Section = *section
		if err := rows.Scan(
			&grant.ID,
			&grant.AdminUser.ID,
			&grant.AdminUser.Email,
			&grant.AdminUser.Name,
			&grant.AdminUser.Level,
			&grant.AdminUser.Status,
			&grant.Access,
			&grant.CreatedAt,
			&grant.UpdatedAt,
		); err != nil {
			return nil, fmt.Errorf("module registry grants: scan section grant: %w", err)
		}
		grants = append(grants, grant)
	}
	if err := rows.Err(); err != nil {
		return nil, fmt.Errorf("module registry grants: iterate section grants: %w", err)
	}

	return &SectionGrantListRecord{
		Section: *section,
		Grants:  grants,
	}, nil
}

func (r *repository) UpsertSectionGrant(ctx context.Context, sectionGUID, adminUserID uuid.UUID, access string) (*SectionGrantRecord, error) {
	db, err := r.client.OpenDBMaster(ctx)
	if err != nil {
		return nil, fmt.Errorf("module registry grants: open master db: %w", err)
	}

	const query = `
INSERT INTO admin_section_grant (section_id, admin_user_id, access_mode)
SELECT id, $2, $3
FROM admin_module_section
WHERE guid = $1
ON CONFLICT (admin_user_id, section_id) DO UPDATE
SET access_mode = EXCLUDED.access_mode,
    updated_at = now()
RETURNING guid`

	var grantID uuid.UUID
	if err := db.QueryRow(query, sectionGUID, adminUserID, access).Scan(&grantID); err != nil {
		if errors.Is(err, sql.ErrNoRows) {
			return nil, ErrSectionNotFound
		}
		if isRegistryConflictError(err) {
			return nil, fmt.Errorf("%w: upsert section grant", ErrRegistryConflict)
		}
		return nil, fmt.Errorf("module registry grants: upsert section grant: %w", err)
	}

	return r.getSectionGrant(ctx, sectionGUID, adminUserID)
}

func (r *repository) RevokeSectionGrant(ctx context.Context, sectionGUID, adminUserID uuid.UUID) error {
	db, err := r.client.OpenDBMaster(ctx)
	if err != nil {
		return fmt.Errorf("module registry grants: open master db: %w", err)
	}

	const query = `
DELETE FROM admin_section_grant
WHERE admin_user_id = $2
  AND section_id = (
    SELECT id
    FROM admin_module_section
    WHERE guid = $1
  )`

	if _, err := db.Exec(query, sectionGUID, adminUserID); err != nil {
		return fmt.Errorf("module registry grants: revoke section grant: %w", err)
	}
	return nil
}

func (r *repository) getSectionGrant(ctx context.Context, sectionGUID, adminUserID uuid.UUID) (*SectionGrantRecord, error) {
	section, err := r.getSectionByGUID(ctx, sectionGUID)
	if err != nil {
		return nil, err
	}

	db, err := r.client.OpenDBMaster(ctx)
	if err != nil {
		return nil, fmt.Errorf("module registry grants: open master db: %w", err)
	}

	const query = `
SELECT
  g.guid,
  u.id,
  u.email,
  COALESCE(u.name, ''),
  u.level,
  u.status,
  g.access_mode,
  g.created_at,
  g.updated_at
FROM admin_section_grant g
JOIN admin_module_section s ON s.id = g.section_id
JOIN admin_user u ON u.id = g.admin_user_id
WHERE s.guid = $1
  AND u.id = $2
LIMIT 1`

	var grant SectionGrantRecord
	grant.Section = *section
	if err := db.QueryRow(query, sectionGUID, adminUserID).Scan(
		&grant.ID,
		&grant.AdminUser.ID,
		&grant.AdminUser.Email,
		&grant.AdminUser.Name,
		&grant.AdminUser.Level,
		&grant.AdminUser.Status,
		&grant.Access,
		&grant.CreatedAt,
		&grant.UpdatedAt,
	); err != nil {
		if errors.Is(err, sql.ErrNoRows) {
			return nil, ErrGrantNotFound
		}
		return nil, fmt.Errorf("module registry grants: query section grant: %w", err)
	}

	return &grant, nil
}

func isRegistryConflictError(err error) bool {
	if err == nil {
		return false
	}
	msg := strings.ToLower(err.Error())
	return strings.Contains(msg, "duplicate key value violates unique constraint") ||
		strings.Contains(msg, "unique constraint") ||
		strings.Contains(msg, "admin_section_grant_user_section_key")
}
