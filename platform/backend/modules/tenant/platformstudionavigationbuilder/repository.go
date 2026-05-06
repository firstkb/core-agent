package platformstudionavigationbuilder

import (
	"context"
	"database/sql"
	"fmt"
	"strings"

	"dtriton.com/platform/backend/internal/platform/httpx/requestctx"
	"dtriton.com/platform/backend/internal/platform/postgres"
)

type repository struct {
	client *postgres.Client
}

func NewRepository(client *postgres.Client) Repository {
	return &repository{client: client}
}

func (r *repository) GetConfig(ctx context.Context, tenant requestctx.TenantInfo, configKey string) (*ConfigRecord, error) {
	db, err := r.client.OpenDBTenant(ctx, tenant.DBName, tenant.DBInstanceCode)
	if err != nil {
		return nil, fmt.Errorf("navigation builder: open tenant db: %w", err)
	}

	tx, err := db.BeginTx(ctx, &sql.TxOptions{ReadOnly: true})
	if err != nil {
		return nil, fmt.Errorf("navigation builder: begin get config tx: %w", err)
	}
	defer func() { _ = tx.Rollback() }()

	record, err := loadConfigTx(ctx, tx, configKey, false)
	if err != nil {
		return nil, err
	}
	if err := tx.Commit(); err != nil {
		return nil, fmt.Errorf("navigation builder: commit get config tx: %w", err)
	}
	return record, nil
}

func (r *repository) SaveConfig(ctx context.Context, tenant requestctx.TenantInfo, record ConfigRecord, expectedVersion *int64) (*ConfigRecord, error) {
	db, err := r.client.OpenDBTenant(ctx, tenant.DBName, tenant.DBInstanceCode)
	if err != nil {
		return nil, fmt.Errorf("navigation builder: open tenant db: %w", err)
	}

	tx, err := db.BeginTx(ctx, nil)
	if err != nil {
		return nil, fmt.Errorf("navigation builder: begin save config tx: %w", err)
	}
	defer func() { _ = tx.Rollback() }()

	configKey := strings.TrimSpace(record.ConfigKey)
	if configKey == "" {
		configKey = ConfigKeyDefault
	}

	current, err := loadConfigTx(ctx, tx, configKey, true)
	if err != nil {
		return nil, err
	}

	if current == nil {
		if expectedVersion != nil && *expectedVersion != 0 {
			return nil, ErrConflict
		}
		inserted, err := insertConfigTx(ctx, tx, record)
		if err != nil {
			return nil, err
		}
		if err := tx.Commit(); err != nil {
			return nil, fmt.Errorf("navigation builder: commit insert config tx: %w", err)
		}
		return inserted, nil
	}

	if expectedVersion != nil && *expectedVersion != current.Version {
		return nil, ErrConflict
	}

	updated, err := updateConfigTx(ctx, tx, record, current.Version)
	if err != nil {
		return nil, err
	}
	if err := tx.Commit(); err != nil {
		return nil, fmt.Errorf("navigation builder: commit update config tx: %w", err)
	}
	return updated, nil
}

func loadConfigTx(ctx context.Context, tx *sql.Tx, configKey string, forUpdate bool) (*ConfigRecord, error) {
	query := `
SELECT config_key,
       version,
       definition_json,
       COALESCE(updated_by, '') AS updated_by,
       updated_at
  FROM ps_navigation_config
 WHERE config_key = $1`
	if forUpdate {
		query += " FOR UPDATE"
	}

	var record ConfigRecord
	err := tx.QueryRowContext(ctx, query, strings.TrimSpace(configKey)).Scan(
		&record.ConfigKey,
		&record.Version,
		&record.DefinitionJSON,
		&record.UpdatedBy,
		&record.UpdatedAt,
	)
	if err != nil {
		if err == sql.ErrNoRows {
			return nil, nil
		}
		return nil, fmt.Errorf("navigation builder: load config: %w", err)
	}
	return &record, nil
}

func insertConfigTx(ctx context.Context, tx *sql.Tx, record ConfigRecord) (*ConfigRecord, error) {
	const query = `
INSERT INTO ps_navigation_config (config_key, version, definition_json, updated_by)
VALUES ($1, 1, $2::jsonb, NULLIF($3, ''))
RETURNING config_key,
          version,
          definition_json,
          COALESCE(updated_by, '') AS updated_by,
          updated_at`

	var inserted ConfigRecord
	err := tx.QueryRowContext(
		ctx,
		query,
		configKeyOrDefault(record.ConfigKey),
		record.DefinitionJSON,
		strings.TrimSpace(record.UpdatedBy),
	).Scan(
		&inserted.ConfigKey,
		&inserted.Version,
		&inserted.DefinitionJSON,
		&inserted.UpdatedBy,
		&inserted.UpdatedAt,
	)
	if err != nil {
		return nil, fmt.Errorf("navigation builder: insert config: %w", err)
	}
	return &inserted, nil
}

func updateConfigTx(ctx context.Context, tx *sql.Tx, record ConfigRecord, currentVersion int64) (*ConfigRecord, error) {
	const query = `
UPDATE ps_navigation_config
   SET version = version + 1,
       definition_json = $2::jsonb,
       updated_by = NULLIF($3, '')
 WHERE config_key = $1
   AND version = $4
RETURNING config_key,
          version,
          definition_json,
          COALESCE(updated_by, '') AS updated_by,
          updated_at`

	var updated ConfigRecord
	err := tx.QueryRowContext(
		ctx,
		query,
		configKeyOrDefault(record.ConfigKey),
		record.DefinitionJSON,
		strings.TrimSpace(record.UpdatedBy),
		currentVersion,
	).Scan(
		&updated.ConfigKey,
		&updated.Version,
		&updated.DefinitionJSON,
		&updated.UpdatedBy,
		&updated.UpdatedAt,
	)
	if err != nil {
		if err == sql.ErrNoRows {
			return nil, ErrConflict
		}
		return nil, fmt.Errorf("navigation builder: update config: %w", err)
	}
	return &updated, nil
}

func configKeyOrDefault(configKey string) string {
	configKey = strings.TrimSpace(configKey)
	if configKey == "" {
		return ConfigKeyDefault
	}
	return configKey
}
