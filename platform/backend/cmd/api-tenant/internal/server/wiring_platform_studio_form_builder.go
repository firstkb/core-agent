package server

import (
	"dtriton.com/platform/backend/internal/platform/postgres"
	formbuilder "dtriton.com/platform/backend/modules/tenant/platformstudioformbuilder"
)

func buildPlatformStudioFormBuilderModule(sqlClient *postgres.Client) *formbuilder.Handler {
	repo := formbuilder.NewRepository(sqlClient)
	service := formbuilder.NewService(repo)
	return formbuilder.NewHandler(service)
}
