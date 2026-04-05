package server

import (
	"log/slog"

	"dtriton.com/platform/backend/internal/platform/postgres"
	moduleregistrylist "dtriton.com/platform/backend/modules/admin/moduleregistrylist"
	collectionprefs "dtriton.com/platform/backend/modules/shared/collectionprefs"
)

func buildModuleRegistryListModule(sqlClient *postgres.Client, manager moduleregistrylist.Manager, logger *slog.Logger) *moduleregistrylist.Handler {
	repo := moduleregistrylist.NewRepository(sqlClient)
	prefsRepo := collectionprefs.NewAdminRepository(sqlClient)
	prefsService := collectionprefs.NewService(prefsRepo)
	service := moduleregistrylist.NewService(repo, prefsService, manager, logger)
	return moduleregistrylist.NewHandler(service)
}
