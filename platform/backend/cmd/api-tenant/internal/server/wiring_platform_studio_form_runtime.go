package server

import (
	"dtriton.com/platform/backend/internal/platform/postgres"
	formruntime "dtriton.com/platform/backend/modules/tenant/platformstudioformruntime"
)

func buildPlatformStudioFormRuntimeModule(sqlClient *postgres.Client) *formruntime.Handler {
	repo := formruntime.NewRepository(sqlClient)
	service := formruntime.NewService(repo)
	return formruntime.NewHandler(service)
}
