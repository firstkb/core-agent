package server

import (
	"log/slog"

	"dtriton.com/platform/backend/internal/platform/config"
	"dtriton.com/platform/backend/internal/platform/postgres"
	tenantmanagement "dtriton.com/platform/backend/modules/admin/tenantmanagement"
)

func buildTenantManagementModule(sqlClient *postgres.Client, cfg *config.Config, logger *slog.Logger) (*tenantmanagement.Handler, error) {
	var c tenantmanagement.Config
	if cfg != nil {
		if err := cfg.Unmarshal("", &c); err != nil {
			return nil, err
		}
	}

	repo := tenantmanagement.NewRepository(sqlClient, logger)
	provisioner := tenantmanagement.NewProvisioner(sqlClient, c.Onboarding, logger)
	service := tenantmanagement.NewService(repo, provisioner, logger, c.Onboarding)
	return tenantmanagement.NewHandler(service), nil
}
