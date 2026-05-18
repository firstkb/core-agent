package server

import (
	"dtriton.com/platform/backend/internal/platform/postgres"
	dictionary "dtriton.com/platform/backend/modules/tenant/dictionary"
	formruntime "dtriton.com/platform/backend/modules/tenant/platformstudioformruntime"
)

func buildPlatformStudioFormRuntimeModule(sqlClient *postgres.Client) *formruntime.Handler {
	repo := formruntime.NewRepository(sqlClient)
	lookupOptions := dictionary.NewService(dictionary.NewRepository(sqlClient))
	service := formruntime.NewService(repo, lookupOptions)
	presenceService := formruntime.NewEditPresenceService(repo)
	return formruntime.NewHandler(service, presenceService)
}
