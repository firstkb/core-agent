package server

import (
	"dtriton.com/platform/backend/internal/platform/postgres"
	dictionary "dtriton.com/platform/backend/modules/tenant/dictionary"
)

func buildTenantDictionaryModule(sqlClient *postgres.Client) *dictionary.Handler {
	repo := dictionary.NewRepository(sqlClient)
	service := dictionary.NewService(repo)
	return dictionary.NewHandler(service)
}
