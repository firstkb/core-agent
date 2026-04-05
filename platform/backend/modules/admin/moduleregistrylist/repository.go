package moduleregistrylist

import (
	"context"
	"database/sql"
	"fmt"
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

type Repository interface {
	ListModules(ctx context.Context) ([]ModuleRecord, error)
	ListModulesForExport(ctx context.Context, limit int) ([]ModuleRecord, error)
}

type repository struct {
	client *postgres.Client
}

func NewRepository(client *postgres.Client) Repository {
	return &repository{client: client}
}

func (r *repository) ListModules(ctx context.Context) ([]ModuleRecord, error) {
	return r.listModules(ctx, 0)
}

func (r *repository) ListModulesForExport(ctx context.Context, limit int) ([]ModuleRecord, error) {
	return r.listModules(ctx, limit)
}

func (r *repository) listModules(ctx context.Context, limit int) ([]ModuleRecord, error) {
	db, err := r.client.OpenDBMaster(ctx)
	if err != nil {
		return nil, fmt.Errorf("module registry: open master db: %w", err)
	}

	query := `
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

	var rows *sql.Rows
	if limit > 0 {
		query = `
WITH limited_modules AS (
  SELECT
    m.id,
    m.guid,
    m.module_key,
    m.title,
    COALESCE(m.description, '') AS description,
    COALESCE(m.icon, '') AS icon,
    m.sort_order,
    m.status,
    m.created_at,
    m.updated_at
  FROM admin_module m
  ORDER BY m.sort_order ASC, m.title ASC
  LIMIT $1
)
SELECT
  m.id,
  m.guid,
  m.module_key,
  m.title,
  m.description,
  m.icon,
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
FROM limited_modules m
LEFT JOIN admin_module_section s ON s.module_id = m.id
ORDER BY m.sort_order ASC, m.title ASC, s.sort_order ASC, s.title ASC`
		rows, err = db.Query(query, limit)
	} else {
		rows, err = db.Query(query)
	}
	if err != nil {
		return nil, fmt.Errorf("module registry: query modules: %w", err)
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
			return nil, fmt.Errorf("module registry: scan module row: %w", err)
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
		return nil, fmt.Errorf("module registry: iterate modules: %w", err)
	}

	return modules, nil
}
