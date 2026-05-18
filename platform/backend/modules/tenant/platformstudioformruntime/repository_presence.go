package platformstudioformruntime

import (
	"context"
	"database/sql"
	"encoding/json"
	"fmt"
	"strings"
	"time"

	"dtriton.com/platform/backend/internal/platform/httpx/requestctx"
)

func (r *repository) UpsertEditPresence(
	ctx context.Context,
	tenant requestctx.TenantInfo,
	presence runtimeEditPresenceUpsert,
) error {
	db, err := r.client.OpenDBTenant(ctx, tenant.DBName, tenant.DBInstanceCode)
	if err != nil {
		return fmt.Errorf("form runtime presence: open tenant db: %w", err)
	}

	tx, err := db.BeginTx(ctx, &sql.TxOptions{})
	if err != nil {
		return fmt.Errorf("form runtime presence: begin upsert tx: %w", err)
	}
	defer func() { _ = tx.Rollback() }()

	if err := setTenantContext(ctx, tx, tenant); err != nil {
		return err
	}

	contextJSON, err := json.Marshal(presence.Context)
	if err != nil {
		return fmt.Errorf("form runtime presence: marshal context: %w", err)
	}

	const query = `
INSERT INTO ps_edit_presence (
       user_id,
       client_id,
       target_type,
       target_key,
       parent_target_key,
       target_label,
       context,
       user_display_name,
       user_email,
       opened_at,
       last_seen_at
) VALUES (
       $1, $2, $3, $4, NULLIF($5, ''), NULLIF($6, ''), $7::jsonb, NULLIF($8, ''), NULLIF($9, ''), now(), now()
)
ON CONFLICT (tenant_id, user_id)
DO UPDATE SET
       client_id = EXCLUDED.client_id,
       target_type = EXCLUDED.target_type,
       target_key = EXCLUDED.target_key,
       parent_target_key = EXCLUDED.parent_target_key,
       target_label = EXCLUDED.target_label,
       context = EXCLUDED.context,
       user_display_name = EXCLUDED.user_display_name,
       user_email = EXCLUDED.user_email,
       opened_at = CASE
         WHEN ps_edit_presence.target_key = EXCLUDED.target_key THEN ps_edit_presence.opened_at
         ELSE now()
       END,
       last_seen_at = now(),
       updated_at = now()`
	if _, err := tx.ExecContext(
		ctx,
		query,
		strings.TrimSpace(presence.UserID),
		strings.TrimSpace(presence.ClientID),
		strings.TrimSpace(presence.TargetType),
		strings.TrimSpace(presence.TargetKey),
		strings.TrimSpace(presence.ParentTargetKey),
		strings.TrimSpace(presence.TargetLabel),
		string(contextJSON),
		strings.TrimSpace(presence.UserDisplayName),
		strings.TrimSpace(presence.UserEmail),
	); err != nil {
		return fmt.Errorf("form runtime presence: upsert: %w", err)
	}
	if err := tx.Commit(); err != nil {
		return fmt.Errorf("form runtime presence: commit upsert tx: %w", err)
	}
	return nil
}

func (r *repository) ListEditPresenceConflicts(
	ctx context.Context,
	tenant requestctx.TenantInfo,
	query runtimeEditPresenceConflictQuery,
) ([]runtimeEditPresenceRow, error) {
	db, err := r.client.OpenDBTenant(ctx, tenant.DBName, tenant.DBInstanceCode)
	if err != nil {
		return nil, fmt.Errorf("form runtime presence: open tenant db: %w", err)
	}

	tx, err := db.BeginTx(ctx, &sql.TxOptions{ReadOnly: true})
	if err != nil {
		return nil, fmt.Errorf("form runtime presence: begin list tx: %w", err)
	}
	defer func() { _ = tx.Rollback() }()

	if err := setTenantContext(ctx, tx, tenant); err != nil {
		return nil, err
	}

	const selectQuery = `
SELECT user_id,
       client_id,
       target_type,
       target_key,
       parent_target_key,
       target_label,
       user_display_name,
       user_email,
       last_seen_at
FROM (
  SELECT DISTINCT ON (user_id)
         user_id,
         client_id,
         target_type,
         target_key,
         COALESCE(parent_target_key, '') AS parent_target_key,
         COALESCE(target_label, '') AS target_label,
         COALESCE(user_display_name, '') AS user_display_name,
         COALESCE(user_email, '') AS user_email,
         last_seen_at
    FROM ps_edit_presence
   WHERE tenant_id = current_setting('app.tenant_id', true)::bigint
     AND last_seen_at >= $1
     AND user_id <> $2
     AND (
       target_key = $3
       OR target_key = $4
       OR (NULLIF($4, '') IS NOT NULL AND parent_target_key = $4)
     )
   ORDER BY user_id, last_seen_at DESC
) AS active_presence
ORDER BY last_seen_at DESC, user_display_name ASC
LIMIT 12`
	rows, err := tx.QueryContext(
		ctx,
		selectQuery,
		query.ActiveSince,
		strings.TrimSpace(query.UserID),
		strings.TrimSpace(query.TargetKey),
		strings.TrimSpace(query.ParentTargetKey),
	)
	if err != nil {
		return nil, fmt.Errorf("form runtime presence: list conflicts: %w", err)
	}
	defer rows.Close()

	out := []runtimeEditPresenceRow{}
	for rows.Next() {
		var row runtimeEditPresenceRow
		if err := rows.Scan(
			&row.UserID,
			&row.ClientID,
			&row.TargetType,
			&row.TargetKey,
			&row.ParentTargetKey,
			&row.TargetLabel,
			&row.UserDisplayName,
			&row.UserEmail,
			&row.LastSeenAt,
		); err != nil {
			return nil, fmt.Errorf("form runtime presence: scan conflict: %w", err)
		}
		out = append(out, row)
	}
	if err := rows.Err(); err != nil {
		return nil, fmt.Errorf("form runtime presence: conflict rows: %w", err)
	}
	if err := tx.Commit(); err != nil {
		return nil, fmt.Errorf("form runtime presence: commit list tx: %w", err)
	}
	return out, nil
}

func (r *repository) CleanupEditPresence(
	ctx context.Context,
	tenant requestctx.TenantInfo,
	olderThan time.Time,
) error {
	db, err := r.client.OpenDBTenant(ctx, tenant.DBName, tenant.DBInstanceCode)
	if err != nil {
		return fmt.Errorf("form runtime presence: open tenant db: %w", err)
	}

	tx, err := db.BeginTx(ctx, &sql.TxOptions{})
	if err != nil {
		return fmt.Errorf("form runtime presence: begin cleanup tx: %w", err)
	}
	defer func() { _ = tx.Rollback() }()

	if err := setTenantContext(ctx, tx, tenant); err != nil {
		return err
	}

	var locked bool
	if err := tx.QueryRowContext(ctx, `SELECT pg_try_advisory_xact_lock(hashtext('ps_edit_presence_cleanup'))`).Scan(&locked); err != nil {
		return fmt.Errorf("form runtime presence: cleanup lock: %w", err)
	}
	if !locked {
		return tx.Commit()
	}

	const query = `
DELETE FROM ps_edit_presence
 WHERE tenant_id = current_setting('app.tenant_id', true)::bigint
   AND last_seen_at < $1`
	if _, err := tx.ExecContext(ctx, query, olderThan); err != nil {
		return fmt.Errorf("form runtime presence: cleanup stale rows: %w", err)
	}
	if err := tx.Commit(); err != nil {
		return fmt.Errorf("form runtime presence: commit cleanup tx: %w", err)
	}
	return nil
}
