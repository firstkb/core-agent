package server

import (
	"dtriton.com/platform/backend/internal/platform/postgres"
	adminprofilesvc "dtriton.com/platform/backend/modules/admin/profile"
)

func buildAdminProfileModule(sqlClient *postgres.Client) *adminprofilesvc.Handler {
	repo := adminprofilesvc.NewRepository(sqlClient)
	service := adminprofilesvc.NewService(repo)
	return adminprofilesvc.NewHandler(service)
}
