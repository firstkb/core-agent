package main

import (
	"context"
	"errors"
	"log/slog"
	"net/http"
	"os"
	"os/signal"
	"syscall"
	"time"

	"firstkb.dev/maestro/backend/internal/config"
	"firstkb.dev/maestro/backend/internal/db"
	"firstkb.dev/maestro/backend/internal/httpapi"
	"firstkb.dev/maestro/backend/internal/migrations"
)

func main() {
	logger := slog.New(slog.NewTextHandler(os.Stdout, nil))

	cfg, err := config.Load()
	if err != nil {
		logger.Error("load config", "error", err)
		os.Exit(1)
	}

	if err := os.MkdirAll(cfg.ArtifactRoot, 0o755); err != nil {
		logger.Error("create artifact root", "error", err)
		os.Exit(1)
	}

	ctx := context.Background()
	conn, err := db.Open(ctx, cfg.DatabaseURL, db.PoolConfig{})
	if err != nil {
		logger.Error("open database", "error", err)
		os.Exit(1)
	}
	defer conn.Close()

	if cfg.RunMigrations {
		if err := migrations.NewRunner(conn, cfg.MigrationsDir).Run(ctx); err != nil {
			logger.Error("run migrations", "error", err)
			os.Exit(1)
		}
	}

	server := httpapi.New(httpapi.Options{
		Addr:         cfg.HTTPAddr,
		DB:           conn,
		ArtifactRoot: cfg.ArtifactRoot,
		Logger:       logger,
	})

	errCh := make(chan error, 1)
	go func() {
		if err := server.ListenAndServe(); err != nil && !errors.Is(err, http.ErrServerClosed) {
			errCh <- err
			return
		}
		errCh <- nil
	}()

	signalCh := make(chan os.Signal, 1)
	signal.Notify(signalCh, syscall.SIGINT, syscall.SIGTERM)

	select {
	case sig := <-signalCh:
		logger.Info("shutdown requested", "signal", sig.String())
	case err := <-errCh:
		if err != nil {
			logger.Error("server failed", "error", err)
			os.Exit(1)
		}
	}

	shutdownCtx, cancel := context.WithTimeout(context.Background(), 10*time.Second)
	defer cancel()
	if err := server.Shutdown(shutdownCtx); err != nil {
		logger.Error("shutdown server", "error", err)
		os.Exit(1)
	}
}
