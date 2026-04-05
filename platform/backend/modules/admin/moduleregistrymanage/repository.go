package moduleregistrymanage

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

type Repository interface {
	GetModuleByGUID(ctx context.Context, moduleGUID uuid.UUID) (*ModuleRecord, error)
	CreateModule(ctx context.Context, input createModuleParams) (*ModuleRecord, error)
	UpdateModule(ctx context.Context, moduleGUID uuid.UUID, input updateModuleParams) (*ModuleRecord, error)
	UpdateModuleStatusBatch(ctx context.Context, moduleGUIDs []uuid.UUID, status string) error
	ArchiveModule(ctx context.Context, moduleGUID uuid.UUID) error
	CreateSection(ctx context.Context, moduleGUID uuid.UUID, input createSectionParams) (*SectionRecord, error)
	UpdateSection(ctx context.Context, sectionGUID uuid.UUID, input updateSectionParams) (*SectionRecord, error)
	ArchiveSection(ctx context.Context, sectionGUID uuid.UUID) error
}

var (
	ErrModuleNotFound   = errors.New("module registry manage module not found")
	ErrSectionNotFound  = errors.New("module registry manage section not found")
	ErrRegistryConflict = errors.New("module registry manage conflict")
)

type createModuleParams struct {
	ModuleKey   string
	Title       string
	Description string
	Icon        string
	SortOrder   int
	Status      string
}

type updateModuleParams struct {
	Title       string
	Description string
	Icon        string
	SortOrder   int
	Status      string
}

type createSectionParams struct {
	SectionKey  string
	Title       string
	Description string
	RoutePath   string
	SortOrder   int
	Status      string
}

type updateSectionParams struct {
	Title       string
	Description string
	RoutePath   string
	SortOrder   int
	Status      string
}

type repository struct {
	client *postgres.Client
}

func NewRepository(client *postgres.Client) Repository {
	return &repository{client: client}
}

func (r *repository) listModules(ctx context.Context) ([]ModuleRecord, error) {
	db, err := r.client.OpenDBMaster(ctx)
	if err != nil {
		return nil, fmt.Errorf("module registry manage: open master db: %w", err)
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
		return nil, fmt.Errorf("module registry manage: query modules: %w", err)
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
			return nil, fmt.Errorf("module registry manage: scan module row: %w", err)
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
		return nil, fmt.Errorf("module registry manage: iterate modules: %w", err)
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

func (r *repository) CreateModule(ctx context.Context, input createModuleParams) (*ModuleRecord, error) {
	db, err := r.client.OpenDBMaster(ctx)
	if err != nil {
		return nil, fmt.Errorf("module registry manage: open master db: %w", err)
	}

	const query = `
INSERT INTO admin_module (module_key, title, description, icon, sort_order, status)
VALUES ($1, $2, $3, $4, $5, $6)
RETURNING guid`

	var guid uuid.UUID
	if err := db.QueryRow(query, input.ModuleKey, input.Title, input.Description, input.Icon, input.SortOrder, input.Status).Scan(&guid); err != nil {
		if isRegistryConflictError(err) {
			return nil, fmt.Errorf("%w: create module", ErrRegistryConflict)
		}
		return nil, fmt.Errorf("module registry manage: insert module: %w", err)
	}

	return r.GetModuleByGUID(ctx, guid)
}

func (r *repository) UpdateModule(ctx context.Context, moduleGUID uuid.UUID, input updateModuleParams) (*ModuleRecord, error) {
	db, err := r.client.OpenDBMaster(ctx)
	if err != nil {
		return nil, fmt.Errorf("module registry manage: open master db: %w", err)
	}

	tx, err := db.BeginTx(ctx, &sql.TxOptions{})
	if err != nil {
		return nil, fmt.Errorf("module registry manage: begin update module tx: %w", err)
	}
	defer func() { _ = tx.Rollback() }()

	const query = `
UPDATE admin_module
SET title = $2,
    description = $3,
    icon = $4,
    sort_order = $5,
    status = $6,
    updated_at = now()
WHERE guid = $1`

	result, err := tx.ExecContext(ctx, query, moduleGUID, input.Title, input.Description, input.Icon, input.SortOrder, input.Status)
	if err != nil {
		if isRegistryConflictError(err) {
			return nil, fmt.Errorf("%w: update module", ErrRegistryConflict)
		}
		return nil, fmt.Errorf("module registry manage: update module: %w", err)
	}
	rowsAffected, _ := result.RowsAffected()
	if rowsAffected == 0 {
		return nil, ErrModuleNotFound
	}

	if _, err := tx.ExecContext(ctx, `
UPDATE admin_module_section
SET status = $2,
    updated_at = now()
WHERE module_id = (SELECT id FROM admin_module WHERE guid = $1)`, moduleGUID, input.Status); err != nil {
		return nil, fmt.Errorf("module registry manage: update module sections: %w", err)
	}

	if err := tx.Commit(); err != nil {
		return nil, fmt.Errorf("module registry manage: commit update module tx: %w", err)
	}

	return r.GetModuleByGUID(ctx, moduleGUID)
}

func (r *repository) ArchiveModule(ctx context.Context, moduleGUID uuid.UUID) error {
	db, err := r.client.OpenDBMaster(ctx)
	if err != nil {
		return fmt.Errorf("module registry manage: open master db: %w", err)
	}

	tx, err := db.BeginTx(ctx, &sql.TxOptions{})
	if err != nil {
		return fmt.Errorf("module registry manage: begin archive module tx: %w", err)
	}
	defer func() { _ = tx.Rollback() }()

	moduleResult, err := tx.ExecContext(ctx, `
UPDATE admin_module
SET status = 'archived',
    updated_at = now()
WHERE guid = $1`, moduleGUID)
	if err != nil {
		return fmt.Errorf("module registry manage: archive module: %w", err)
	}
	rowsAffected, _ := moduleResult.RowsAffected()
	if rowsAffected == 0 {
		return ErrModuleNotFound
	}

	if _, err := tx.ExecContext(ctx, `
UPDATE admin_module_section
SET status = 'archived',
    updated_at = now()
WHERE module_id = (SELECT id FROM admin_module WHERE guid = $1)`, moduleGUID); err != nil {
		return fmt.Errorf("module registry manage: archive module sections: %w", err)
	}

	if err := tx.Commit(); err != nil {
		return fmt.Errorf("module registry manage: commit archive module tx: %w", err)
	}
	return nil
}

func (r *repository) UpdateModuleStatusBatch(ctx context.Context, moduleGUIDs []uuid.UUID, status string) error {
	if len(moduleGUIDs) == 0 {
		return nil
	}

	db, err := r.client.OpenDBMaster(ctx)
	if err != nil {
		return fmt.Errorf("module registry manage: open master db: %w", err)
	}

	tx, err := db.BeginTx(ctx, &sql.TxOptions{})
	if err != nil {
		return fmt.Errorf("module registry manage: begin module status batch tx: %w", err)
	}
	defer func() { _ = tx.Rollback() }()

	args := make([]any, 0, len(moduleGUIDs)+1)
	args = append(args, status)

	placeholders := make([]string, 0, len(moduleGUIDs))
	for idx, moduleGUID := range moduleGUIDs {
		args = append(args, moduleGUID)
		placeholders = append(placeholders, fmt.Sprintf("$%d", idx+2))
	}

	query := fmt.Sprintf(`
UPDATE admin_module
SET status = $1,
    updated_at = now()
WHERE guid IN (%s)`, strings.Join(placeholders, ", "))

	if _, err := tx.ExecContext(ctx, query, args...); err != nil {
		return fmt.Errorf("module registry manage: update module status batch: %w", err)
	}

	query = fmt.Sprintf(`
UPDATE admin_module_section
SET status = $1,
    updated_at = now()
WHERE module_id IN (
  SELECT id
    FROM admin_module
   WHERE guid IN (%s)
)`, strings.Join(placeholders, ", "))

	if _, err := tx.ExecContext(ctx, query, args...); err != nil {
		return fmt.Errorf("module registry manage: update module section status batch: %w", err)
	}

	if err := tx.Commit(); err != nil {
		return fmt.Errorf("module registry manage: commit module status batch tx: %w", err)
	}

	return nil
}

func (r *repository) CreateSection(ctx context.Context, moduleGUID uuid.UUID, input createSectionParams) (*SectionRecord, error) {
	db, err := r.client.OpenDBMaster(ctx)
	if err != nil {
		return nil, fmt.Errorf("module registry manage: open master db: %w", err)
	}

	const query = `
INSERT INTO admin_module_section (module_id, section_key, title, description, route_path, sort_order, status)
SELECT id, $2, $3, $4, $5, $6, $7
FROM admin_module
WHERE guid = $1
RETURNING guid`

	var sectionGUID uuid.UUID
	if err := db.QueryRow(query, moduleGUID, input.SectionKey, input.Title, input.Description, input.RoutePath, input.SortOrder, input.Status).Scan(&sectionGUID); err != nil {
		if errors.Is(err, sql.ErrNoRows) {
			return nil, ErrModuleNotFound
		}
		if isRegistryConflictError(err) {
			return nil, fmt.Errorf("%w: create section", ErrRegistryConflict)
		}
		return nil, fmt.Errorf("module registry manage: insert section: %w", err)
	}

	return r.getSectionByGUID(ctx, sectionGUID)
}

func (r *repository) UpdateSection(ctx context.Context, sectionGUID uuid.UUID, input updateSectionParams) (*SectionRecord, error) {
	db, err := r.client.OpenDBMaster(ctx)
	if err != nil {
		return nil, fmt.Errorf("module registry manage: open master db: %w", err)
	}

	const query = `
UPDATE admin_module_section
SET title = $2,
    description = $3,
    route_path = $4,
    sort_order = $5,
    status = $6,
    updated_at = now()
WHERE guid = $1`

	result, err := db.Exec(query, sectionGUID, input.Title, input.Description, input.RoutePath, input.SortOrder, input.Status)
	if err != nil {
		if isRegistryConflictError(err) {
			return nil, fmt.Errorf("%w: update section", ErrRegistryConflict)
		}
		return nil, fmt.Errorf("module registry manage: update section: %w", err)
	}
	rowsAffected, _ := result.RowsAffected()
	if rowsAffected == 0 {
		return nil, ErrSectionNotFound
	}

	return r.getSectionByGUID(ctx, sectionGUID)
}

func (r *repository) ArchiveSection(ctx context.Context, sectionGUID uuid.UUID) error {
	db, err := r.client.OpenDBMaster(ctx)
	if err != nil {
		return fmt.Errorf("module registry manage: open master db: %w", err)
	}

	const query = `
UPDATE admin_module_section
SET status = 'archived',
    updated_at = now()
WHERE guid = $1`

	result, err := db.Exec(query, sectionGUID)
	if err != nil {
		return fmt.Errorf("module registry manage: archive section: %w", err)
	}
	rowsAffected, _ := result.RowsAffected()
	if rowsAffected == 0 {
		return ErrSectionNotFound
	}
	return nil
}

func (r *repository) getSectionByGUID(ctx context.Context, sectionGUID uuid.UUID) (*SectionRecord, error) {
	if sectionGUID == uuid.Nil {
		return nil, ErrSectionNotFound
	}

	db, err := r.client.OpenDBMaster(ctx)
	if err != nil {
		return nil, fmt.Errorf("module registry manage: open master db: %w", err)
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
		return nil, fmt.Errorf("module registry manage: query section: %w", err)
	}

	return &section, nil
}

func isRegistryConflictError(err error) bool {
	if err == nil {
		return false
	}
	msg := strings.ToLower(err.Error())
	return strings.Contains(msg, "duplicate key value violates unique constraint") ||
		strings.Contains(msg, "unique constraint") ||
		strings.Contains(msg, "admin_module_module_key_key") ||
		strings.Contains(msg, "admin_module_section_module_key_key")
}
