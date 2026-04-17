package platformstudioformbuilder

import (
	"context"
	"encoding/json"
	"fmt"
	"strings"

	"dtriton.com/platform/backend/internal/platform/httpx/requestctx"
	collectionprefs "dtriton.com/platform/backend/modules/shared/collectionprefs"
	collectiontable "dtriton.com/platform/backend/modules/shared/collectiontable"
)

func (r *repository) ListRuntimeSavedFilters(
	ctx context.Context,
	tenant requestctx.TenantInfo,
	principalID string,
	surfaceID string,
) ([]collectiontable.SavedFilterSet, error) {
	principalID = strings.TrimSpace(principalID)
	surfaceID = strings.TrimSpace(surfaceID)
	if principalID == "" || surfaceID == "" {
		return []collectiontable.SavedFilterSet{}, nil
	}

	db, err := r.client.OpenDBTenant(ctx, tenant.DBName, tenant.DBInstanceCode)
	if err != nil {
		return nil, fmt.Errorf("form builder: open tenant db: %w", err)
	}

	const query = `
SELECT guid, label, quick_filters
FROM ps_runtime_saved_filter
WHERE principal_id = $1
  AND surface_id = $2
ORDER BY created_at DESC, id DESC`

	rows, err := db.Query(query, principalID, surfaceID)
	if err != nil {
		return nil, fmt.Errorf("form builder: list runtime saved filters: %w", err)
	}
	defer rows.Close()

	items := make([]collectiontable.SavedFilterSet, 0)
	for rows.Next() {
		var (
			id           string
			label        string
			rawQuickJSON []byte
			quickFilters []collectiontable.QuickFilter
		)
		if err := rows.Scan(&id, &label, &rawQuickJSON); err != nil {
			return nil, fmt.Errorf("form builder: scan runtime saved filter: %w", err)
		}
		if len(rawQuickJSON) > 0 {
			if err := json.Unmarshal(rawQuickJSON, &quickFilters); err != nil {
				return nil, fmt.Errorf("form builder: decode runtime saved filter quick filters: %w", err)
			}
		}
		items = append(items, collectiontable.SavedFilterSet{
			ID:           id,
			Label:        label,
			QuickFilters: quickFilters,
		})
	}
	if err := rows.Err(); err != nil {
		return nil, fmt.Errorf("form builder: iterate runtime saved filters: %w", err)
	}

	return items, nil
}

func (r *repository) CreateRuntimeSavedFilter(
	ctx context.Context,
	tenant requestctx.TenantInfo,
	principalID string,
	surfaceID string,
	label string,
	quickFilters []collectiontable.QuickFilter,
) (*collectiontable.SavedFilterSet, error) {
	principalID = strings.TrimSpace(principalID)
	surfaceID = strings.TrimSpace(surfaceID)
	label = strings.TrimSpace(label)
	if principalID == "" || surfaceID == "" || label == "" {
		return nil, nil
	}

	db, err := r.client.OpenDBTenant(ctx, tenant.DBName, tenant.DBInstanceCode)
	if err != nil {
		return nil, fmt.Errorf("form builder: open tenant db: %w", err)
	}

	encodedQuickFilters, err := json.Marshal(quickFilters)
	if err != nil {
		return nil, fmt.Errorf("form builder: encode runtime saved filter quick filters: %w", err)
	}

	const query = `
INSERT INTO ps_runtime_saved_filter (principal_id, surface_id, label, quick_filters)
VALUES ($1, $2, $3, $4::jsonb)
RETURNING guid`

	var id string
	if err := db.QueryRow(query, principalID, surfaceID, label, string(encodedQuickFilters)).Scan(&id); err != nil {
		return nil, fmt.Errorf("form builder: insert runtime saved filter: %w", err)
	}

	return &collectiontable.SavedFilterSet{
		ID:           id,
		Label:        label,
		QuickFilters: quickFilters,
	}, nil
}

func (r *repository) DeleteRuntimeSavedFilter(
	ctx context.Context,
	tenant requestctx.TenantInfo,
	principalID string,
	surfaceID string,
	savedFilterID string,
) error {
	principalID = strings.TrimSpace(principalID)
	surfaceID = strings.TrimSpace(surfaceID)
	savedFilterID = strings.TrimSpace(savedFilterID)
	if principalID == "" || surfaceID == "" || savedFilterID == "" {
		return collectionprefs.ErrSavedFilterNotFound
	}

	db, err := r.client.OpenDBTenant(ctx, tenant.DBName, tenant.DBInstanceCode)
	if err != nil {
		return fmt.Errorf("form builder: open tenant db: %w", err)
	}

	const query = `
DELETE FROM ps_runtime_saved_filter
WHERE principal_id = $1
  AND surface_id = $2
  AND guid = $3`

	result, err := db.Exec(query, principalID, surfaceID, savedFilterID)
	if err != nil {
		return fmt.Errorf("form builder: delete runtime saved filter: %w", err)
	}
	rowsAffected, err := result.RowsAffected()
	if err != nil {
		return fmt.Errorf("form builder: delete runtime saved filter rows affected: %w", err)
	}
	if rowsAffected == 0 {
		return collectionprefs.ErrSavedFilterNotFound
	}

	return nil
}
