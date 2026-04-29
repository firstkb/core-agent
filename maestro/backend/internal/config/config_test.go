package config

import (
	"path/filepath"
	"testing"
)

func TestLoadRequiresDatabaseURL(t *testing.T) {
	t.Setenv("MAESTRO_DATABASE_URL", "")

	if _, err := Load(); err == nil {
		t.Fatal("expected missing database URL error")
	}
}

func TestLoadDefaults(t *testing.T) {
	t.Setenv("MAESTRO_DATABASE_URL", "postgres://localhost/maestro?sslmode=disable")
	t.Setenv("MAESTRO_ARTIFACT_ROOT", "")
	t.Setenv("MAESTRO_HTTP_ADDR", "")
	t.Setenv("MAESTRO_MIGRATIONS_DIR", "")
	t.Setenv("MAESTRO_RUN_MIGRATIONS", "true")

	cfg, err := Load()
	if err != nil {
		t.Fatalf("load config: %v", err)
	}

	if cfg.HTTPAddr != DefaultHTTPAddr {
		t.Fatalf("HTTPAddr = %q, want %q", cfg.HTTPAddr, DefaultHTTPAddr)
	}
	if cfg.ArtifactRoot != mustAbs(t, DefaultArtifactRoot) {
		t.Fatalf("ArtifactRoot = %q, want abs default", cfg.ArtifactRoot)
	}
	if cfg.MigrationsDir != mustAbs(t, DefaultMigrationsDir) {
		t.Fatalf("MigrationsDir = %q, want abs default", cfg.MigrationsDir)
	}
	if !cfg.RunMigrations {
		t.Fatal("RunMigrations = false, want true")
	}
}

func mustAbs(t *testing.T, path string) string {
	t.Helper()

	abs, err := filepath.Abs(path)
	if err != nil {
		t.Fatalf("abs path: %v", err)
	}
	return abs
}
