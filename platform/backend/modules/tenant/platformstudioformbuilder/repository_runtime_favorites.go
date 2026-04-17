package platformstudioformbuilder

import (
	"context"
	"database/sql"
	"fmt"
	"strings"

	"dtriton.com/platform/backend/internal/platform/httpx/requestctx"
)

func (r *repository) GetRuntimeFavoriteState(
	ctx context.Context,
	tenant requestctx.TenantInfo,
	principalID string,
	surfaceID string,
) (bool, error) {
	principalID = strings.TrimSpace(principalID)
	surfaceID = strings.TrimSpace(surfaceID)
	if principalID == "" || surfaceID == "" {
		return false, nil
	}

	db, err := r.client.OpenDBTenant(ctx, tenant.DBName, tenant.DBInstanceCode)
	if err != nil {
		return false, fmt.Errorf("form builder: open tenant db: %w", err)
	}

	const query = `
SELECT EXISTS (
  SELECT 1
  FROM ps_runtime_favorite
  WHERE principal_id = $1
    AND surface_id = $2
)`

	var isFavorite bool
	if err := db.QueryRow(query, principalID, surfaceID).Scan(&isFavorite); err != nil {
		return false, fmt.Errorf("form builder: get runtime favorite state: %w", err)
	}

	return isFavorite, nil
}

func (r *repository) ToggleRuntimeFavorite(
	ctx context.Context,
	tenant requestctx.TenantInfo,
	principalID string,
	surfaceID string,
	modelID string,
	viewID string,
) (bool, error) {
	principalID = strings.TrimSpace(principalID)
	surfaceID = strings.TrimSpace(surfaceID)
	modelID = strings.TrimSpace(modelID)
	viewID = strings.TrimSpace(viewID)
	if principalID == "" || surfaceID == "" || modelID == "" || viewID == "" {
		return false, nil
	}

	db, err := r.client.OpenDBTenant(ctx, tenant.DBName, tenant.DBInstanceCode)
	if err != nil {
		return false, fmt.Errorf("form builder: open tenant db: %w", err)
	}

	const insertQuery = `
INSERT INTO ps_runtime_favorite (principal_id, surface_id, model_id, view_id)
VALUES ($1, $2, $3, $4)
ON CONFLICT (principal_id, surface_id) DO NOTHING
RETURNING guid`

	var inserted string
	err = db.QueryRow(insertQuery, principalID, surfaceID, modelID, viewID).Scan(&inserted)
	switch {
	case err == nil:
		return true, nil
	case err == sql.ErrNoRows:
		const deleteQuery = `
DELETE FROM ps_runtime_favorite
WHERE principal_id = $1
  AND surface_id = $2`
		if _, delErr := db.Exec(deleteQuery, principalID, surfaceID); delErr != nil {
			return false, fmt.Errorf("form builder: delete runtime favorite: %w", delErr)
		}
		return false, nil
	default:
		return false, fmt.Errorf("form builder: toggle runtime favorite: %w", err)
	}
}

func (r *repository) ListRuntimeFavorites(
	ctx context.Context,
	tenant requestctx.TenantInfo,
	principalID string,
) ([]RuntimeFavoriteRecord, error) {
	principalID = strings.TrimSpace(principalID)
	if principalID == "" {
		return []RuntimeFavoriteRecord{}, nil
	}

	db, err := r.client.OpenDBTenant(ctx, tenant.DBName, tenant.DBInstanceCode)
	if err != nil {
		return nil, fmt.Errorf("form builder: open tenant db: %w", err)
	}

	const query = `
SELECT
  favorite.guid,
  favorite.surface_id,
  favorite.model_id,
  favorite.view_id,
  COALESCE(NULLIF(btrim(model.display_name), ''), model.model_id) AS model_title,
  COALESCE(NULLIF(btrim(view.display_name), ''), view.view_id) AS view_title
FROM ps_runtime_favorite AS favorite
JOIN ps_model AS model
  ON model.model_id = favorite.model_id
JOIN ps_view AS view
  ON view.model_id = favorite.model_id
 AND view.view_id = favorite.view_id
WHERE favorite.principal_id = $1
ORDER BY favorite.created_at DESC, favorite.id DESC`

	rows, err := db.Query(query, principalID)
	if err != nil {
		return nil, fmt.Errorf("form builder: list runtime favorites: %w", err)
	}
	defer rows.Close()

	items := make([]RuntimeFavoriteRecord, 0)
	for rows.Next() {
		var item RuntimeFavoriteRecord
		if err := rows.Scan(
			&item.ID,
			&item.SurfaceID,
			&item.ModelID,
			&item.ViewID,
			&item.ModelTitle,
			&item.ViewTitle,
		); err != nil {
			return nil, fmt.Errorf("form builder: scan runtime favorite: %w", err)
		}
		items = append(items, item)
	}
	if err := rows.Err(); err != nil {
		return nil, fmt.Errorf("form builder: iterate runtime favorites: %w", err)
	}

	return items, nil
}
