package server

import (
	"dtriton.com/platform/backend/internal/platform/postgres"
	moduleregistrymanage "dtriton.com/platform/backend/modules/admin/moduleregistrymanage"
)

type moduleRegistryManageModule struct {
	Service *moduleregistrymanage.Service
	Handler *moduleregistrymanage.Handler
}

func buildModuleRegistryManageModule(sqlClient *postgres.Client) *moduleRegistryManageModule {
	repo := moduleregistrymanage.NewRepository(sqlClient)
	service := moduleregistrymanage.NewService(repo)
	return &moduleRegistryManageModule{
		Service: service,
		Handler: moduleregistrymanage.NewHandler(service),
	}
}
