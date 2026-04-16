package server

import (
	"dtriton.com/platform/backend/internal/platform/config"
	"dtriton.com/platform/backend/internal/platform/postgres"
	tenantlist "dtriton.com/platform/backend/modules/admin/tenantlist"
	authsvc "dtriton.com/platform/backend/modules/shared/authentication"
	collectionprefs "dtriton.com/platform/backend/modules/shared/collectionprefs"
)

func buildTenantListModule(sqlClient *postgres.Client, cfg *config.Config) (*tenantlist.Handler, error) {
	repo := tenantlist.NewRepository(sqlClient)
	prefsRepo := collectionprefs.NewAdminRepository(sqlClient)
	prefsService := collectionprefs.NewService(prefsRepo)
	launcher, err := authsvc.NewDelegatedTenantRootTokenService(cfg)
	if err != nil {
		return nil, err
	}
	service := tenantlist.NewService(repo, prefsService, launcher)
	return tenantlist.NewHandler(service), nil
}
