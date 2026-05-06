package server

import (
	"dtriton.com/platform/backend/internal/platform/postgres"
	navigationbuilder "dtriton.com/platform/backend/modules/tenant/platformstudionavigationbuilder"
)

func buildPlatformStudioNavigationBuilderModule(sqlClient *postgres.Client) *navigationbuilder.Handler {
	repo := navigationbuilder.NewRepository(sqlClient)
	service := navigationbuilder.NewService(repo)
	return navigationbuilder.NewHandler(service)
}
