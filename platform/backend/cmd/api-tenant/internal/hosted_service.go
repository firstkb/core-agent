package internal

import (
	"context"
	"log/slog"
	"time"

	"dtriton.com/platform/backend/cmd/api-tenant/internal/server"
	"dtriton.com/platform/backend/internal/platform/config"
)

const (
	FlagHost = "host"
)

type HostedService struct {
	logger *slog.Logger
	server *server.Server
}

func (svc *HostedService) Run(ctx context.Context, config *config.Config, logger *slog.Logger) error {
	svc.logger = logger

	svr, err := server.NewServer(config, logger)
	if err != nil {
		return err
	}
	svc.server = svr

	go func() { svr.Run(ctx) }()

	<-ctx.Done()
	svc.Stop(logger)

	return nil
}

func (svc *HostedService) Stop(logger *slog.Logger) {
	if svc.server == nil {
		return
	}

	shutdownCtx, cancel := context.WithTimeout(context.Background(), 10*time.Second)
	defer cancel()

	svc.server.Stop(shutdownCtx)
}
