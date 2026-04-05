package collectionprefs

import (
	"context"
	"database/sql"
	"encoding/json"
	"fmt"
	"strings"

	"github.com/google/uuid"

	"dtriton.com/platform/backend/internal/platform/postgres"
	collectiontable "dtriton.com/platform/backend/modules/shared/collectiontable"
)

type adminRepository struct {
	client *postgres.Client
}

func NewAdminRepository(client *postgres.Client) Repository {
	return &adminRepository{client: client}
}

func (r *adminRepository) GetFavoriteState(ctx context.Context, principalID uuid.UUID, surfaceID string) (bool, error) {
	db, err := r.client.OpenDBMaster(ctx)
	if err != nil {
		return false, fmt.Errorf("collection prefs: open master db: %w", err)
	}

	const query = `
SELECT EXISTS (
  SELECT 1
  FROM admin_collection_favorite
  WHERE admin_user_id = $1
    AND surface_id = $2
)`

	var isFavorite bool
	if err := db.QueryRow(query, principalID, strings.TrimSpace(surfaceID)).Scan(&isFavorite); err != nil {
		return false, fmt.Errorf("collection prefs: get favorite state: %w", err)
	}

	return isFavorite, nil
}

func (r *adminRepository) ToggleFavorite(ctx context.Context, principalID uuid.UUID, surfaceID string) (bool, error) {
	db, err := r.client.OpenDBMaster(ctx)
	if err != nil {
		return false, fmt.Errorf("collection prefs: open master db: %w", err)
	}

	const insertQuery = `
INSERT INTO admin_collection_favorite (admin_user_id, surface_id)
VALUES ($1, $2)
ON CONFLICT (admin_user_id, surface_id) DO NOTHING
RETURNING guid`

	var inserted uuid.UUID
	err = db.QueryRow(insertQuery, principalID, strings.TrimSpace(surfaceID)).Scan(&inserted)
	switch {
	case err == nil:
		return true, nil
	case err == sql.ErrNoRows:
		const deleteQuery = `
DELETE FROM admin_collection_favorite
WHERE admin_user_id = $1
  AND surface_id = $2`
		if _, delErr := db.Exec(deleteQuery, principalID, strings.TrimSpace(surfaceID)); delErr != nil {
			return false, fmt.Errorf("collection prefs: delete favorite: %w", delErr)
		}
		return false, nil
	default:
		return false, fmt.Errorf("collection prefs: toggle favorite: %w", err)
	}
}

func (r *adminRepository) ListSavedFilters(ctx context.Context, principalID uuid.UUID, surfaceID string) ([]collectiontable.SavedFilterSet, error) {
	db, err := r.client.OpenDBMaster(ctx)
	if err != nil {
		return nil, fmt.Errorf("collection prefs: open master db: %w", err)
	}

	const query = `
SELECT guid, label, quick_filters
FROM admin_collection_saved_filter
WHERE admin_user_id = $1
  AND surface_id = $2
ORDER BY created_at DESC, id DESC`

	rows, err := db.Query(query, principalID, strings.TrimSpace(surfaceID))
	if err != nil {
		return nil, fmt.Errorf("collection prefs: list saved filters: %w", err)
	}
	defer rows.Close()

	items := make([]collectiontable.SavedFilterSet, 0)
	for rows.Next() {
		var (
			id           uuid.UUID
			label        string
			rawQuickJSON []byte
			quickFilters []collectiontable.QuickFilter
		)

		if err := rows.Scan(&id, &label, &rawQuickJSON); err != nil {
			return nil, fmt.Errorf("collection prefs: scan saved filter: %w", err)
		}
		if len(rawQuickJSON) > 0 {
			if err := json.Unmarshal(rawQuickJSON, &quickFilters); err != nil {
				return nil, fmt.Errorf("collection prefs: decode quick filters: %w", err)
			}
		}

		items = append(items, collectiontable.SavedFilterSet{
			ID:           id.String(),
			Label:        label,
			QuickFilters: quickFilters,
		})
	}
	if err := rows.Err(); err != nil {
		return nil, fmt.Errorf("collection prefs: iterate saved filters: %w", err)
	}

	return items, nil
}

func (r *adminRepository) CreateSavedFilter(ctx context.Context, principalID uuid.UUID, surfaceID string, label string, quickFilters []collectiontable.QuickFilter) (*collectiontable.SavedFilterSet, error) {
	db, err := r.client.OpenDBMaster(ctx)
	if err != nil {
		return nil, fmt.Errorf("collection prefs: open master db: %w", err)
	}

	encodedQuickFilters, err := json.Marshal(quickFilters)
	if err != nil {
		return nil, fmt.Errorf("collection prefs: encode quick filters: %w", err)
	}

	const query = `
INSERT INTO admin_collection_saved_filter (admin_user_id, surface_id, label, quick_filters)
VALUES ($1, $2, $3, $4)
RETURNING guid`

	var id uuid.UUID
	if err := db.QueryRow(query, principalID, strings.TrimSpace(surfaceID), strings.TrimSpace(label), encodedQuickFilters).Scan(&id); err != nil {
		return nil, fmt.Errorf("collection prefs: insert saved filter: %w", err)
	}

	return &collectiontable.SavedFilterSet{
		ID:           id.String(),
		Label:        strings.TrimSpace(label),
		QuickFilters: quickFilters,
	}, nil
}
