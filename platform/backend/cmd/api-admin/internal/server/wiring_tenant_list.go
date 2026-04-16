package server

import (
	"dtriton.com/platform/backend/internal/platform/postgres"
	tenantlist "dtriton.com/platform/backend/modules/admin/tenantlist"
	collectionprefs "dtriton.com/platform/backend/modules/shared/collectionprefs"
)

func buildTenantListModule(sqlClient *postgres.Client) *tenantlist.Handler {
	repo := tenantlist.NewRepository(sqlClient)
	prefsRepo := collectionprefs.NewAdminRepository(sqlClient)
	prefsService := collectionprefs.NewService(prefsRepo)
	service := tenantlist.NewService(repo, prefsService)
	return tenantlist.NewHandler(service)
}
