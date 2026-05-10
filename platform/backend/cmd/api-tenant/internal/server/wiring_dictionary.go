package server

import (
	"dtriton.com/platform/backend/internal/platform/postgres"
	dictionarysvc "dtriton.com/platform/backend/modules/tenant/dictionarysvc"
)

func buildTenantDictionaryModule(sqlClient *postgres.Client) *dictionarysvc.Handler {
	repo := dictionarysvc.NewRepository(sqlClient)
	service := dictionarysvc.NewService(repo)
	return dictionarysvc.NewHandler(service)
}
