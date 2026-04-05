package server

import (
	"dtriton.com/platform/backend/internal/platform/postgres"
	adminaccesspolicy "dtriton.com/platform/backend/modules/admin/accesspolicy"
	adminnavigationsvc "dtriton.com/platform/backend/modules/admin/navigation"
)

func buildAdminNavigationModule(sqlClient *postgres.Client) *adminnavigationsvc.Handler {
	repo := adminnavigationsvc.NewRepository(sqlClient)
	service := adminnavigationsvc.NewService(repo, adminaccesspolicy.AllowsSectionNavigation)
	return adminnavigationsvc.NewHandler(service)
}
