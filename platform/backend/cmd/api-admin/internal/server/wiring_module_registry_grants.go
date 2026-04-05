package server

import (
	"dtriton.com/platform/backend/internal/platform/postgres"
	moduleregistrygrants "dtriton.com/platform/backend/modules/admin/moduleregistrygrants"
)

func buildModuleRegistryGrantModule(sqlClient *postgres.Client) *moduleregistrygrants.Handler {
	repo := moduleregistrygrants.NewRepository(sqlClient)
	service := moduleregistrygrants.NewService(repo)
	return moduleregistrygrants.NewHandler(service)
}
