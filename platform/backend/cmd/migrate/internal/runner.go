package internal

import (
	"context"
	"database/sql"
	"errors"
	"fmt"
	"log/slog"
	"os"
	"path/filepath"
	"strings"
	"time"

	"dtriton.com/platform/backend/internal/platform/config"
	"dtriton.com/platform/backend/internal/platform/postgres"
)

type Runner struct{}

type runtimeConfig struct {
	DB         databaseConfig   `json:"db"`
	Migrations migrationsConfig `json:"migrations"`
}

type databaseConfig struct {
	Host       string     `json:"host"`
	Port       string     `json:"port"`
	Username   string     `json:"username"`
	Password   string     `json:"password"`
	MasterName string     `json:"mastername"`
	Debug      bool       `json:"debug"`
	PoolConfig poolConfig `json:"pool"`
}

type poolConfig struct {
	MaxIdle     int    `json:"maxidle"`
	MaxOpen     int    `json:"maxopen"`
	MaxLife     string `json:"maxlifetime"`
	MaxIdleTime string `json:"maxidletime"`
}

type migrationsConfig struct {
	MasterDir        string `json:"masterdir"`
	TenantDir        string `json:"tenantdir"`
	TenantBundlePath string `json:"tenantbundlepath"`
	TenantDatabases  string `json:"tenantdatabases"`
	DisableMaster    bool   `json:"disablemaster"`
	DisableTenant    bool   `json:"disabletenant"`
}

type tenantDatabaseRef struct {
	Name         string
	InstanceCode string
}

const bundleSchemaVersion = "bundle_tenant_schema_full"

func (r *Runner) Run(ctx context.Context, cfg *config.Config, logger *slog.Logger) error {
	if cfg == nil {
		return errors.New("config must not be nil")
	}

	var rc runtimeConfig
	if err := cfg.Unmarshal("", &rc); err != nil {
		return fmt.Errorf("unmarshal config: %w", err)
	}

	if rc.DB.Host == "" || rc.DB.Port == "" || rc.DB.MasterName == "" || rc.DB.Username == "" || rc.DB.Password == "" {
		return errors.New("database connection vars must be specified")
	}

	conn := fmt.Sprintf(
		"host=%s port=%s dbname=%s user=%s password=%s sslmode=disable",
		rc.DB.Host,
		rc.DB.Port,
		rc.DB.MasterName,
		rc.DB.Username,
		rc.DB.Password,
	)

	opts := []postgres.Option{
		postgres.WithPoolConfig(
			defaultInt(rc.DB.PoolConfig.MaxIdle, 10),
			defaultInt(rc.DB.PoolConfig.MaxOpen, 50),
			parseDuration(rc.DB.PoolConfig.MaxLife, 30*time.Minute),
			parseDuration(rc.DB.PoolConfig.MaxIdleTime, 0),
		),
		postgres.WithDebug(rc.DB.Debug),
	}

	client, err := postgres.NewClient(conn, logger, opts...)
	if err != nil {
		return fmt.Errorf("create postgres client: %w", err)
	}
	defer client.Close()

	migrationVersion := os.Getenv("MIGRATION_VERSION")
	masterDir := firstNonEmpty(strings.TrimSpace(rc.Migrations.MasterDir), discoverDir("migrations/postgres/master"))
	tenantDir := firstNonEmpty(
		strings.TrimSpace(rc.Migrations.TenantDir),
		discoverDir("migrations/postgres/tenant"),
	)
	tenantBundlePath := firstNonEmpty(
		strings.TrimSpace(rc.Migrations.TenantBundlePath),
		discoverFile("bundle/tenant_schema_full.sql"),
	)
	tenantDatabasesRaw := strings.TrimSpace(rc.Migrations.TenantDatabases)
	tenantDatabases := parseTenantDatabaseRefs(tenantDatabasesRaw)

	logger.Info("migration runtime started",
		"version", migrationVersion,
		"master_dir", masterDir,
		"tenant_dir", tenantDir,
		"tenant_bundle", tenantBundlePath,
		"tenant_databases", tenantDatabasesRaw,
	)

	if !rc.Migrations.DisableMaster {
		if err := client.ApplyMasterMigrations(ctx, logger, postgres.WithMigrationsDir(masterDir)); err != nil {
			return fmt.Errorf("apply master migrations: %w", err)
		}
	}

	if !rc.Migrations.DisableTenant {
		if err := bootstrapTenantDatabases(ctx, client, logger, tenantBundlePath, tenantDatabases); err != nil {
			return fmt.Errorf("bootstrap tenant databases: %w", err)
		}

		opts := []postgres.MigratorOption{
			postgres.WithMigrationsDir(tenantDir),
			postgres.WithMigrationVersion(migrationVersion),
		}
		for _, ref := range tenantDatabases {
			opts = append(opts, postgres.WithExtraDatabase(ref.Name, ref.InstanceCode))
		}

		if err := client.ApplyMigrations(ctx, logger, opts...); err != nil {
			return fmt.Errorf("apply tenant migrations: %w", err)
		}
	}

	logger.Info("migration runtime completed")
	return nil
}

func (r *Runner) Stop(_ *slog.Logger) {}

func defaultInt(value, fallback int) int {
	if value > 0 {
		return value
	}
	return fallback
}

func parseDuration(raw string, fallback time.Duration) time.Duration {
	if raw == "" {
		return fallback
	}
	parsed, err := time.ParseDuration(raw)
	if err != nil {
		return fallback
	}
	return parsed
}

func firstNonEmpty(values ...string) string {
	for _, value := range values {
		if strings.TrimSpace(value) != "" {
			return strings.TrimSpace(value)
		}
	}
	return ""
}

func discoverDir(rel string) string {
	cwd, err := os.Getwd()
	if err != nil {
		return rel
	}

	candidates := []string{
		filepath.Join(cwd, rel),
		filepath.Join(cwd, "src", rel),
	}
	for _, candidate := range candidates {
		if info, err := os.Stat(candidate); err == nil && info.IsDir() {
			if abs, err := filepath.Abs(candidate); err == nil {
				return abs
			}
		}
	}

	return rel
}

func discoverFile(rel string) string {
	cwd, err := os.Getwd()
	if err != nil {
		return rel
	}

	candidates := []string{
		filepath.Join(cwd, rel),
		filepath.Join(cwd, "src", rel),
	}
	for _, candidate := range candidates {
		if info, err := os.Stat(candidate); err == nil && !info.IsDir() {
			if abs, err := filepath.Abs(candidate); err == nil {
				return abs
			}
		}
	}

	return rel
}

func parseTenantDatabaseRefs(raw string) []tenantDatabaseRef {
	if strings.TrimSpace(raw) == "" {
		return nil
	}

	parts := strings.Split(raw, ",")
	result := make([]tenantDatabaseRef, 0, len(parts))
	seen := make(map[string]struct{}, len(parts))

	for _, part := range parts {
		part = strings.TrimSpace(part)
		if part == "" {
			continue
		}

		name := part
		instanceCode := ""
		if before, after, ok := strings.Cut(part, "@"); ok {
			name = strings.TrimSpace(before)
			instanceCode = strings.TrimSpace(after)
		}
		if name == "" {
			continue
		}

		key := name + "@" + instanceCode
		if _, ok := seen[key]; ok {
			continue
		}
		seen[key] = struct{}{}
		result = append(result, tenantDatabaseRef{Name: name, InstanceCode: instanceCode})
	}

	return result
}

func bootstrapTenantDatabases(ctx context.Context, client *postgres.Client, logger *slog.Logger, bundlePath string, refs []tenantDatabaseRef) error {
	if strings.TrimSpace(bundlePath) == "" || len(refs) == 0 {
		return nil
	}

	content, err := os.ReadFile(bundlePath)
	if err != nil {
		return fmt.Errorf("read tenant bundle: %w", err)
	}

	for _, ref := range refs {
		db, err := client.OpenDBTenant(ctx, ref.Name, ref.InstanceCode)
		if err != nil {
			return fmt.Errorf("open tenant db %s@%s: %w", ref.Name, ref.InstanceCode, err)
		}

		needsBundle, err := needsBundleBootstrap(db)
		if err != nil {
			return fmt.Errorf("check bundle bootstrap for %s@%s: %w", ref.Name, ref.InstanceCode, err)
		}
		if !needsBundle {
			continue
		}

		if _, err := db.Exec(string(content)); err != nil {
			return fmt.Errorf("apply bundle to %s@%s: %w", ref.Name, ref.InstanceCode, err)
		}
		if err := ensureSchemaMigrationsMarker(ctx, db, bundleSchemaVersion); err != nil {
			return fmt.Errorf("record bundle marker for %s@%s: %w", ref.Name, ref.InstanceCode, err)
		}

		logger.Info("migration runtime bootstrapped tenant database from bundle", "db", ref.Name, "instance", ref.InstanceCode)
	}

	return nil
}

func needsBundleBootstrap(db *postgres.Database) (bool, error) {
	const q = `
SELECT
  to_regclass('public.users') IS NULL
  OR to_regclass('public.notification_template') IS NULL
  OR to_regclass('public.events') IS NULL
  OR to_regclass('public.public_code') IS NULL`

	var needs bool
	if err := db.QueryRow(q).Scan(&needs); err != nil {
		return false, err
	}
	return needs, nil
}

func ensureSchemaMigrationsMarker(ctx context.Context, db *postgres.Database, version string) error {
	if _, err := db.Exec(`
CREATE TABLE IF NOT EXISTS schema_migrations (
  version     TEXT PRIMARY KEY,
  applied_at  TIMESTAMPTZ NOT NULL DEFAULT now()
)`); err != nil {
		return err
	}

	tx, err := db.BeginTx(ctx, &sql.TxOptions{})
	if err != nil {
		return err
	}
	defer func() { _ = tx.Rollback() }()

	if _, err := tx.ExecContext(ctx, `
INSERT INTO schema_migrations (version, applied_at)
VALUES ($1, now())
ON CONFLICT (version) DO NOTHING`, version); err != nil {
		return err
	}

	return tx.Commit()
}
