package main

import (
	"context"
	"log/slog"
	"os"

	"firstkb.dev/maestro/backend/internal/config"
	"firstkb.dev/maestro/backend/internal/db"
	"firstkb.dev/maestro/backend/internal/migrations"
)

func main() {
	logger := slog.New(slog.NewTextHandler(os.Stdout, nil))

	cfg, err := config.Load()
	if err != nil {
		logger.Error("load config", "error", err)
		os.Exit(1)
	}

	ctx := context.Background()
	conn, err := db.Open(ctx, cfg.DatabaseURL, db.PoolConfig{})
	if err != nil {
		logger.Error("open database", "error", err)
		os.Exit(1)
	}
	defer conn.Close()

	if err := migrations.NewRunner(conn, cfg.MigrationsDir).Run(ctx); err != nil {
		logger.Error("run migrations", "error", err)
		os.Exit(1)
	}

	logger.Info("migrations completed", "dir", cfg.MigrationsDir)
}
