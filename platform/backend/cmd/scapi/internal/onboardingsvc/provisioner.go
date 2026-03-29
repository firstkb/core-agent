package onboardingsvc

import (
	"context"
	"database/sql"
	"errors"
	"fmt"
	"os"
	"path/filepath"
	"sort"
	"strings"

	"log/slog"

	"github.com/google/uuid"
	"github.com/lib/pq"

	"github.com/firstkb/sc-api/internal/postgres"
)

type ProvisionParams struct {
	TenantID        int64
	TargetDB        string
	TargetInstance  string
	CopyFromSandbox bool
	SourceDB        string
	SourceInstance  string
}

type Provisioner struct {
	client         *postgres.Client
	logger         *slog.Logger
	bundlePath     string
	migrationsDir  string
	seedPublicCode bool
	dataCopyTables []string
}

func NewProvisioner(client *postgres.Client, cfg OnboardingConfig, logger *slog.Logger) *Provisioner {
	if logger == nil {
		logger = slog.Default()
	}
	tables := cfg.DataCopyTables
	if len(tables) == 0 {
		tables = defaultCopyTables
	}
	return &Provisioner{
		client:         client,
		logger:         logger,
		bundlePath:     strings.TrimSpace(cfg.BundlePath),
		migrationsDir:  strings.TrimSpace(cfg.MigrationsDir),
		seedPublicCode: cfg.SeedPublicCode,
		dataCopyTables: tables,
	}
}

func (p *Provisioner) ProvisionProTenant(ctx context.Context, params ProvisionParams) ([]string, error) {
	if params.TargetDB == "" || params.TargetInstance == "" {
		return nil, errors.New("target db and instance required")
	}

	if err := p.ensureDatabase(ctx, params.TargetDB, params.TargetInstance); err != nil {
		return nil, err
	}
	if err := p.applyBundle(ctx, params.TargetDB, params.TargetInstance); err != nil {
		return nil, err
	}

	applied, err := p.applyMigrations(ctx, params.TargetDB, params.TargetInstance)
	if err != nil {
		p.logger.Warn("provisioner: migrations failed", "db", params.TargetDB, "error", err)
	}

	if params.CopyFromSandbox {
		if params.SourceDB == "" || params.SourceInstance == "" {
			return nil, errors.New("source sandbox database not provided")
		}
		if err := p.copyFromSandbox(ctx, params.SourceDB, params.SourceInstance, params.TargetDB, params.TargetInstance, params.TenantID); err != nil {
			p.logger.Warn("provisioner: sandbox copy failed", "db", params.TargetDB, "error", err)
		}
	}

	if p.seedPublicCode {
		if err := p.seedPublicCodeEntry(ctx, params.TargetDB, params.TargetInstance, params.TenantID); err != nil {
			p.logger.Warn("provisioner: seed public code failed", "db", params.TargetDB, "error", err)
		}
	}

	return applied, nil
}

func (p *Provisioner) ensureDatabase(ctx context.Context, dbName, instanceCode string) error {
	exists, err := p.databaseExists(ctx, dbName, instanceCode)
	if err != nil {
		return err
	}
	if exists {
		return nil
	}
	return p.createDatabase(ctx, dbName, instanceCode)
}

func (p *Provisioner) databaseExists(ctx context.Context, dbName, instanceCode string) (bool, error) {
	adminDB, err := p.client.OpenDBTenant(ctx, "postgres", instanceCode)
	if err != nil {
		return false, fmt.Errorf("open instance admin db: %w", err)
	}
	const q = `SELECT 1 FROM pg_database WHERE datname = $1`
	row := adminDB.QueryRow(q, dbName)
	var flag int
	if err := row.Scan(&flag); err != nil {
		if errors.Is(err, sql.ErrNoRows) {
			return false, nil
		}
		return false, fmt.Errorf("check database exists: %w", err)
	}
	return true, nil
}

func (p *Provisioner) createDatabase(ctx context.Context, dbName, instanceCode string) error {
	adminDB, err := p.client.OpenDBTenant(ctx, "postgres", instanceCode)
	if err != nil {
		return fmt.Errorf("open instance admin db: %w", err)
	}
	query := fmt.Sprintf(`CREATE DATABASE %s`, pq.QuoteIdentifier(dbName))
	if _, err := adminDB.Exec(query); err != nil {
		return fmt.Errorf("create database %s: %w", dbName, err)
	}
	p.logger.Info("provisioner: database created", "db", dbName, "instance", instanceCode)
	return nil
}

func (p *Provisioner) applyBundle(ctx context.Context, dbName, instanceCode string) error {
	if p.bundlePath == "" {
		return nil
	}
	content, err := os.ReadFile(p.bundlePath)
	if err != nil {
		return fmt.Errorf("read bundle: %w", err)
	}
	db, err := p.client.OpenDBTenant(ctx, dbName, instanceCode)
	if err != nil {
		return fmt.Errorf("open tenant db: %w", err)
	}
	if _, err := db.Exec(string(content)); err != nil {
		return fmt.Errorf("apply bundle: %w", err)
	}
	p.logger.Info("provisioner: bundle applied", "db", dbName)
	return nil
}

func (p *Provisioner) applyMigrations(ctx context.Context, dbName, instanceCode string) ([]string, error) {
	if p.migrationsDir == "" {
		return nil, nil
	}
	files, err := readSQLFiles(p.migrationsDir)
	if err != nil {
		return nil, err
	}
	if len(files) == 0 {
		return nil, nil
	}

	db, err := p.client.OpenDBTenant(ctx, dbName, instanceCode)
	if err != nil {
		return nil, fmt.Errorf("open tenant db: %w", err)
	}

	if err := ensureSchemaMigrationsTable(ctx, db); err != nil {
		return nil, err
	}
	applied, err := loadAppliedMigrations(ctx, db)
	if err != nil {
		return nil, err
	}

	var appliedVersions []string
	for _, file := range files {
		version := strings.TrimSuffix(filepath.Base(file), ".sql")
		if applied[version] {
			continue
		}
		if err := executeMigrationFile(ctx, db, file, version); err != nil {
			return appliedVersions, err
		}
		appliedVersions = append(appliedVersions, version)
	}
	return appliedVersions, nil
}

func readSQLFiles(dir string) ([]string, error) {
	entries, err := os.ReadDir(dir)
	if err != nil {
		return nil, fmt.Errorf("read migrations dir: %w", err)
	}
	var files []string
	for _, entry := range entries {
		if entry.IsDir() || filepath.Ext(entry.Name()) != ".sql" {
			continue
		}
		files = append(files, filepath.Join(dir, entry.Name()))
	}
	sort.Strings(files)
	return files, nil
}

func ensureSchemaMigrationsTable(ctx context.Context, db *postgres.Database) error {
	const ddl = `
CREATE TABLE IF NOT EXISTS schema_migrations (
  version     TEXT PRIMARY KEY,
  applied_at  TIMESTAMPTZ NOT NULL DEFAULT now()
)`
	if _, err := db.Exec(ddl); err != nil {
		return fmt.Errorf("ensure schema_migrations: %w", err)
	}
	return nil
}

func loadAppliedMigrations(ctx context.Context, db *postgres.Database) (map[string]bool, error) {
	rows, err := db.Query(`SELECT version FROM schema_migrations`)
	if err != nil {
		return nil, fmt.Errorf("load applied migrations: %w", err)
	}
	defer rows.Close()
	result := make(map[string]bool)
	for rows.Next() {
		var version string
		if err := rows.Scan(&version); err != nil {
			return nil, err
		}
		result[strings.TrimSpace(version)] = true
	}
	return result, rows.Err()
}

func executeMigrationFile(ctx context.Context, db *postgres.Database, filePath, version string) error {
	content, err := os.ReadFile(filePath)
	if err != nil {
		return fmt.Errorf("read migration %s: %w", filePath, err)
	}
	tx, err := db.BeginTx(ctx, &sql.TxOptions{})
	if err != nil {
		return fmt.Errorf("begin migration tx: %w", err)
	}
	if _, err := tx.ExecContext(ctx, string(content)); err != nil {
		_ = tx.Rollback()
		return fmt.Errorf("execute migration %s: %w", filePath, err)
	}
	if _, err := tx.ExecContext(ctx,
		`INSERT INTO schema_migrations (version, applied_at) VALUES ($1, now())`,
		version,
	); err != nil {
		_ = tx.Rollback()
		return fmt.Errorf("record migration %s: %w", filePath, err)
	}
	if err := tx.Commit(); err != nil {
		return fmt.Errorf("commit migration %s: %w", filePath, err)
	}
	return nil
}

func (p *Provisioner) seedPublicCodeEntry(ctx context.Context, dbName, instanceCode string, tenantID int64) error {
	code := fmt.Sprintf("WELCOME_%s", strings.ToUpper(sanitizeDBName(dbName)))
	db, err := p.client.OpenDBTenant(ctx, dbName, instanceCode)
	if err != nil {
		return fmt.Errorf("open tenant db: %w", err)
	}
	metadata := `{"type": "welcome_survey"}`
	_, err = db.Exec(
		`INSERT INTO public_code (code, tenant_id, resource_id, expires_at, metadata)
         VALUES ($1, $2, $3, NULL, $4)
         ON CONFLICT (code) DO NOTHING`,
		code, tenantID, uuid.New(), metadata,
	)
	if err != nil {
		return fmt.Errorf("insert public_code: %w", err)
	}
	return nil
}

func (p *Provisioner) copyFromSandbox(ctx context.Context, sourceDB, sourceInstance, targetDB, targetInstance string, tenantID int64) error {
	if sourceDB == "" || sourceInstance == "" {
		return errors.New("source sandbox configuration missing")
	}
	source, err := p.client.OpenDBTenant(ctx, sourceDB, sourceInstance)
	if err != nil {
		return fmt.Errorf("open sandbox db: %w", err)
	}
	target, err := p.client.OpenDBTenant(ctx, targetDB, targetInstance)
	if err != nil {
		return fmt.Errorf("open target db: %w", err)
	}

	for _, table := range p.dataCopyTables {
		if err := p.copyTable(ctx, source, target, table, tenantID); err != nil {
			p.logger.Warn("provisioner: copy table failed", "table", table, "error", err)
		}
	}

	return nil
}

func (p *Provisioner) copyTable(ctx context.Context, source, target *postgres.Database, table string, tenantID int64) error {
	exists, err := tableExists(ctx, source, table)
	if err != nil {
		return err
	}
	if !exists {
		return nil
	}
	exists, err = tableExists(ctx, target, table)
	if err != nil {
		return err
	}
	if !exists {
		return nil
	}

	query := fmt.Sprintf(`SELECT * FROM %s WHERE tenant_id = $1`, pq.QuoteIdentifier(table))
	rows, err := source.Query(query, tenantID)
	if err != nil {
		return fmt.Errorf("query source table %s: %w", table, err)
	}
	defer rows.Close()

	columns, err := rows.Columns()
	if err != nil {
		return fmt.Errorf("columns %s: %w", table, err)
	}
	if len(columns) == 0 {
		return nil
	}

	pkColumns, err := loadPrimaryKeys(ctx, target, table)
	if err != nil {
		return err
	}

	insertSQL := buildInsertSQL(table, columns, pkColumns)
	tx, err := target.BeginTx(ctx, &sql.TxOptions{})
	if err != nil {
		return fmt.Errorf("begin target tx: %w", err)
	}
	stmt, err := tx.PrepareContext(ctx, insertSQL)
	if err != nil {
		_ = tx.Rollback()
		return fmt.Errorf("prepare insert %s: %w", table, err)
	}
	defer stmt.Close()

	values := make([]interface{}, len(columns))
	valuePtrs := make([]interface{}, len(columns))
	for i := range values {
		valuePtrs[i] = &values[i]
	}

	count := 0
	for rows.Next() {
		if err := rows.Scan(valuePtrs...); err != nil {
			_ = tx.Rollback()
			return fmt.Errorf("scan row %s: %w", table, err)
		}
		if _, err := stmt.ExecContext(ctx, values...); err != nil {
			p.logger.Debug("provisioner: insert row skipped", "table", table, "error", err)
			continue
		}
		count++
	}
	if err := rows.Err(); err != nil {
		_ = tx.Rollback()
		return fmt.Errorf("iterate rows %s: %w", table, err)
	}
	if err := tx.Commit(); err != nil {
		return fmt.Errorf("commit target tx %s: %w", table, err)
	}
	p.logger.Info("provisioner: copied rows", "table", table, "rows", count)
	return nil
}

func tableExists(ctx context.Context, db *postgres.Database, table string) (bool, error) {
	const q = `
SELECT EXISTS (
	SELECT 1 FROM information_schema.tables
	WHERE table_schema = 'public' AND table_name = $1
)`
	row := db.QueryRow(q, table)
	var exists bool
	if err := row.Scan(&exists); err != nil {
		return false, fmt.Errorf("check table %s existence: %w", table, err)
	}
	return exists, nil
}

func loadPrimaryKeys(ctx context.Context, db *postgres.Database, table string) ([]string, error) {
	const q = `
SELECT a.attname
  FROM pg_index i
  JOIN pg_attribute a ON a.attrelid = i.indrelid AND a.attnum = ANY(i.indkey)
 WHERE i.indrelid = $1::regclass AND i.indisprimary
 ORDER BY array_position(i.indkey, a.attnum)`
	param := fmt.Sprintf("public.%s", table)
	rows, err := db.Query(q, param)
	if err != nil {
		return nil, fmt.Errorf("load primary keys %s: %w", table, err)
	}
	defer rows.Close()
	var keys []string
	for rows.Next() {
		var col string
		if err := rows.Scan(&col); err != nil {
			return nil, fmt.Errorf("scan pk %s: %w", table, err)
		}
		keys = append(keys, col)
	}
	return keys, rows.Err()
}

func buildInsertSQL(table string, columns []string, pkColumns []string) string {
	colNames := make([]string, len(columns))
	for i, c := range columns {
		colNames[i] = pq.QuoteIdentifier(c)
	}
	placeholders := make([]string, len(columns))
	for i := range columns {
		placeholders[i] = fmt.Sprintf("$%d", i+1)
	}

	base := fmt.Sprintf(`INSERT INTO %s (%s) VALUES (%s)`,
		pq.QuoteIdentifier(table),
		strings.Join(colNames, ", "),
		strings.Join(placeholders, ", "),
	)

	if len(pkColumns) == 0 {
		return base
	}
	pkNames := make([]string, len(pkColumns))
	for i, c := range pkColumns {
		pkNames[i] = pq.QuoteIdentifier(c)
	}
	return fmt.Sprintf(`%s ON CONFLICT (%s) DO NOTHING`, base, strings.Join(pkNames, ", "))
}

func (p *Provisioner) MigrationsDirExists() bool {
	if p.migrationsDir == "" {
		return false
	}
	info, err := os.Stat(p.migrationsDir)
	return err == nil && info.IsDir()
}
