package server

import (
	"dtriton.com/platform/backend/internal/platform/postgres"
	authsvc "dtriton.com/platform/backend/modules/shared/authentication"
	profilesvc "dtriton.com/platform/backend/modules/tenant/profile"
)

func buildTenantProfileModule(sqlClient *postgres.Client) *profilesvc.Handler {
	tenantUserRepo := authsvc.NewTenantUserRepository(sqlClient)
	profileService := profilesvc.NewService(tenantUserRepo)
	return profilesvc.NewHandler(profileService)
}
