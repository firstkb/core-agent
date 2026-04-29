package config

import (
	"errors"
	"os"
	"path/filepath"
	"strings"
)

const (
	DefaultHTTPAddr      = "127.0.0.1:8787"
	DefaultArtifactRoot  = "../artifacts/current"
	DefaultMigrationsDir = "migrations"
)

type Config struct {
	DatabaseURL   string
	ArtifactRoot  string
	HTTPAddr      string
	MigrationsDir string
	RunMigrations bool
}

func Load() (Config, error) {
	cfg := Config{
		DatabaseURL:   strings.TrimSpace(os.Getenv("MAESTRO_DATABASE_URL")),
		ArtifactRoot:  firstNonEmpty(os.Getenv("MAESTRO_ARTIFACT_ROOT"), DefaultArtifactRoot),
		HTTPAddr:      firstNonEmpty(os.Getenv("MAESTRO_HTTP_ADDR"), DefaultHTTPAddr),
		MigrationsDir: firstNonEmpty(os.Getenv("MAESTRO_MIGRATIONS_DIR"), DefaultMigrationsDir),
		RunMigrations: parseBool(os.Getenv("MAESTRO_RUN_MIGRATIONS")),
	}

	if cfg.DatabaseURL == "" {
		return cfg, errors.New("MAESTRO_DATABASE_URL is required")
	}

	artifactRoot, err := filepath.Abs(cfg.ArtifactRoot)
	if err != nil {
		return cfg, err
	}
	cfg.ArtifactRoot = artifactRoot

	migrationsDir, err := filepath.Abs(cfg.MigrationsDir)
	if err != nil {
		return cfg, err
	}
	cfg.MigrationsDir = migrationsDir

	return cfg, nil
}

func firstNonEmpty(values ...string) string {
	for _, value := range values {
		value = strings.TrimSpace(value)
		if value != "" {
			return value
		}
	}
	return ""
}

func parseBool(raw string) bool {
	switch strings.ToLower(strings.TrimSpace(raw)) {
	case "1", "true", "yes", "y", "on":
		return true
	default:
		return false
	}
}
